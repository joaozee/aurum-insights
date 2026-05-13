import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/news-preview?url=https://...
 *
 * Fetch da página HTML da notícia e extração de metadata OG (Open Graph)
 * pra preencher o resumo do post automaticamente na curadoria.
 *
 * Estratégia: regex sobre o HTML em vez de DOM parser — pra não puxar
 * cheerio/jsdom só pra isso. Procuramos, em ordem:
 *   1) <meta property="og:description" content="...">
 *   2) <meta name="description" content="...">
 *   3) <meta name="twitter:description" content="...">
 *
 * Inclui timeout (6s) e fallback gentil — sites com paywall, bloqueio anti-bot
 * ou JS-rendering retornam vazio. O admin pode escrever manualmente nesse caso.
 */

export interface NewsPreview {
  description: string | null;
  /** Imagem OG (fallback se a thumb do GDELT estiver faltando). */
  image: string | null;
  /** Título OG (caso queiramos sobrescrever — opcional). */
  title: string | null;
  /** Fonte/domain — extraído da URL. */
  source: string | null;
  /** Erro descritivo se o fetch falhou (timeout, 4xx, etc.). */
  error?: string;
}

const TIMEOUT_MS = 6000;

// User-Agent neutro — alguns sites bloqueiam UA vazio ou "node-fetch".
const USER_AGENT =
  "Mozilla/5.0 (compatible; AurumBot/1.0; +https://github.com/joaozee/aurum-insights)";

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
}

// Captura o atributo `content` de uma tag <meta> que tem property/name
// igual ao `key`. Casa em qualquer ordem dos atributos (content antes ou depois).
function extractMeta(html: string, key: string): string | null {
  // <meta property="og:description" content="...">  ou variações
  const patterns = [
    new RegExp(
      `<meta[^>]*(?:property|name)\\s*=\\s*["']${key}["'][^>]*content\\s*=\\s*["']([^"']+)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]*content\\s*=\\s*["']([^"']+)["'][^>]*(?:property|name)\\s*=\\s*["']${key}["']`,
      "i",
    ),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m && m[1]) {
      const v = decodeHtmlEntities(m[1]).trim();
      if (v) return v;
    }
  }
  return null;
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ description: null, image: null, title: null, source: null, error: "missing_url" }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return NextResponse.json({ description: null, image: null, title: null, source: null, error: "invalid_url" }, { status: 400 });
  }
  const source = parsedUrl.hostname.replace(/^www\./, "");

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
      },
      signal: controller.signal,
      // Cache 30min — preview muda raramente após publicação
      next: { revalidate: 1800 },
    });
    clearTimeout(timer);

    if (!res.ok) {
      return NextResponse.json(
        { description: null, image: null, title: null, source, error: `http_${res.status}` },
        { status: 200 },
      );
    }

    // Lê apenas os primeiros ~120KB — o <head> sempre cabe nisso e evita baixar
    // a página inteira (alguns sites têm 1-2MB de HTML).
    const reader = res.body?.getReader();
    if (!reader) {
      return NextResponse.json({ description: null, image: null, title: null, source, error: "no_body" }, { status: 200 });
    }
    const decoder = new TextDecoder("utf-8", { fatal: false });
    let html = "";
    const maxBytes = 120 * 1024;
    let received = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      received += value.length;
      html += decoder.decode(value, { stream: true });
      // Para de ler assim que vê o fechamento do <head> ou ultrapassa o teto
      if (received > maxBytes || /<\/head\s*>/i.test(html)) {
        try { await reader.cancel(); } catch { /* ignore */ }
        break;
      }
    }

    const description =
      extractMeta(html, "og:description") ??
      extractMeta(html, "description") ??
      extractMeta(html, "twitter:description") ??
      null;
    const image =
      extractMeta(html, "og:image") ??
      extractMeta(html, "twitter:image") ??
      null;
    // Title: prefere og:title; fallback pro <title>
    let title: string | null = extractMeta(html, "og:title");
    if (!title) {
      const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (m && m[1]) title = decodeHtmlEntities(m[1]).trim();
    }

    return NextResponse.json({ description, image, title, source }, { status: 200 });
  } catch (err) {
    const msg = (err as Error)?.name === "AbortError" ? "timeout" : "fetch_failed";
    console.warn("[news-preview]", url, msg);
    return NextResponse.json(
      { description: null, image: null, title: null, source, error: msg },
      { status: 200 },
    );
  }
}
