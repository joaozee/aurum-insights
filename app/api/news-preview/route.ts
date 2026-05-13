import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/news-preview?url=https://...
 *
 * Fetch da página HTML da notícia e construção de um resumo elaborado
 * combinando 3 fontes (em ordem de prioridade):
 *
 *   1. JSON-LD schema.org (NewsArticle / Article) — campo `description` e
 *      primeiros parágrafos de `articleBody`. Sites BR de jornalismo
 *      (G1, Globo, UOL, Folha, Valor, InfoMoney, Reuters) usam JSON-LD
 *      bem estruturado, então geralmente é a melhor fonte.
 *   2. Meta og:description (resumo curto, 1-2 frases).
 *   3. Primeiros <p> dentro de <article> ou <main> com >80 chars (filtra
 *      menus e UI chrome).
 *
 * Concatena as fontes sem duplicação e trunca em ~800 chars pra deixar
 * espaço pra edição manual do admin (limite UI é 1000).
 *
 * Inclui timeout (8s), cache (30min), User-Agent neutro pra evitar bloqueios.
 */

export interface NewsPreview {
  description: string | null;
  image: string | null;
  title: string | null;
  source: string | null;
  error?: string;
}

const TIMEOUT_MS = 8000;
const MAX_BYTES = 300 * 1024; // 300KB cobre <head> + começo do <article>
const MAX_SUMMARY_CHARS = 800;

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
    .replace(/&hellip;/g, "…")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
}

function stripHtml(s: string): string {
  return decodeHtmlEntities(
    s.replace(/<[^>]+>/g, " ")
     .replace(/\s+/g, " ")
     .trim(),
  );
}

function extractMeta(html: string, key: string): string | null {
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

// Extrai JSON-LD do tipo NewsArticle/Article. Sites de news bem estruturados
// expõem description longo + articleBody completo. Retorna o primeiro objeto
// com description ou articleBody que conseguir parsear.
interface JsonLdNode {
  "@type"?: string | string[];
  description?: string;
  articleBody?: string;
  headline?: string;
  "@graph"?: JsonLdNode[];
}

function isArticleType(type: unknown): boolean {
  const list = Array.isArray(type) ? type : [type];
  return list.some((t) =>
    typeof t === "string" &&
    /(NewsArticle|Article|Report|BlogPosting)/i.test(t),
  );
}

function findArticleNode(node: JsonLdNode | JsonLdNode[]): JsonLdNode | null {
  const nodes = Array.isArray(node) ? node : [node];
  for (const n of nodes) {
    if (!n || typeof n !== "object") continue;
    if (isArticleType(n["@type"]) && (n.description || n.articleBody)) {
      return n;
    }
    // Algumas páginas usam @graph (Google's recommended pattern)
    if (Array.isArray(n["@graph"])) {
      const inner = findArticleNode(n["@graph"]);
      if (inner) return inner;
    }
  }
  return null;
}

function extractJsonLd(html: string): { description: string | null; body: string | null } {
  const re = /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const raw = match[1].trim();
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw) as JsonLdNode | JsonLdNode[];
      const article = findArticleNode(parsed);
      if (article) {
        return {
          description: article.description ? decodeHtmlEntities(article.description).trim() : null,
          body: article.articleBody ? decodeHtmlEntities(article.articleBody).trim() : null,
        };
      }
    } catch {
      // JSON inválido — comum em scripts gerados por CMS. Pula.
    }
  }
  return { description: null, body: null };
}

// Extrai os primeiros parágrafos relevantes do <article>/<main>. Filtra <p>
// com <80 chars (geralmente navegação, créditos, etc.).
function extractFirstParagraphs(html: string, maxChars: number): string {
  // Tenta achar <article> primeiro; se não, <main>
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  const mainMatch = articleMatch ? null : html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  const scope = articleMatch?.[1] ?? mainMatch?.[1] ?? html;

  const pRe = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  const paragraphs: string[] = [];
  let total = 0;
  let m: RegExpExecArray | null;
  while ((m = pRe.exec(scope)) !== null) {
    const text = stripHtml(m[1]);
    if (text.length < 80) continue;
    paragraphs.push(text);
    total += text.length;
    if (total > maxChars || paragraphs.length >= 4) break;
  }
  return paragraphs.join(" ").slice(0, maxChars);
}

// Junta fontes sem duplicar conteúdo (uma frase que já apareceu em
// description não é repetida do articleBody).
function combineSummary(parts: (string | null)[], maxChars: number): string | null {
  const seen = new Set<string>();
  const out: string[] = [];
  let total = 0;
  for (const p of parts) {
    if (!p) continue;
    // Divide em frases (heurística por ponto seguido de espaço/maiúscula)
    const sentences = p.split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚ])/);
    for (const s of sentences) {
      const trimmed = s.trim();
      if (trimmed.length < 30) continue;
      // Dedupe: chave normalizada (primeiras 50 chars lowercase)
      const key = trimmed.slice(0, 50).toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(trimmed);
      total += trimmed.length + 1;
      if (total > maxChars) break;
    }
    if (total > maxChars) break;
  }
  if (out.length === 0) return null;
  return out.join(" ").slice(0, maxChars).trim();
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
      next: { revalidate: 1800 },
    });
    clearTimeout(timer);

    if (!res.ok) {
      return NextResponse.json(
        { description: null, image: null, title: null, source, error: `http_${res.status}` },
        { status: 200 },
      );
    }

    const reader = res.body?.getReader();
    if (!reader) {
      return NextResponse.json({ description: null, image: null, title: null, source, error: "no_body" }, { status: 200 });
    }
    const decoder = new TextDecoder("utf-8", { fatal: false });
    let html = "";
    let received = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      received += value.length;
      html += decoder.decode(value, { stream: true });
      if (received > MAX_BYTES) {
        try { await reader.cancel(); } catch { /* ignore */ }
        break;
      }
    }

    // ── Coleta de fontes em paralelo lógica (ordem de prioridade) ─────────
    const jsonLd = extractJsonLd(html);
    const ogDesc = extractMeta(html, "og:description");
    const metaDesc = extractMeta(html, "description") ?? extractMeta(html, "twitter:description");
    const articleParagraphs = extractFirstParagraphs(html, 500);

    // Combina: JSON-LD description > og:description > meta description > <article> <p>s > articleBody
    const description = combineSummary(
      [
        jsonLd.description,
        ogDesc,
        metaDesc,
        articleParagraphs,
        jsonLd.body,
      ],
      MAX_SUMMARY_CHARS,
    );

    const image =
      extractMeta(html, "og:image") ??
      extractMeta(html, "twitter:image") ??
      null;
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
