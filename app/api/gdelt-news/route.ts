import { NextRequest, NextResponse } from "next/server";

/**
 * GDELT Doc 2.0 — busca de artigos jornalísticos globais.
 *
 * API pública, sem token. Documentação:
 *   https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/
 *
 * Endpoint:
 *   GET https://api.gdeltproject.org/api/v2/doc/doc
 *
 * Usado pra alimentar a curadoria de notícias da comunidade Aurum. Default:
 * notícias financeiras em PT-BR das últimas 24h. Permite override via query
 * string pra explorar outros temas/idiomas.
 *
 * Query params aceitos:
 *   q          — string de busca (default: query financeira pt-BR)
 *   lang       — "pt"|"en"|"es" (mapeia pra sourcelang da GDELT)
 *   country    — código ISO2 (ex: "BR", "US"). Default: BR
 *   timespan   — janela: "24h", "3d", "7d" (default 24h)
 *   max        — número de artigos, máximo 75 (GDELT teto 250)
 */

const GDELT_BASE = "https://api.gdeltproject.org/api/v2/doc/doc";

// Query default — temas financeiros relevantes para o público Aurum (PF investidora)
const DEFAULT_QUERY =
  "(mercado financeiro OR ações OR bolsa OR economia OR investimentos OR Ibovespa OR \"renda fixa\" OR cripto OR dólar OR Selic)";

interface GdeltArticle {
  url: string;
  url_mobile?: string;
  title?: string;
  seendate?: string;
  socialimage?: string;
  domain?: string;
  language?: string;
  sourcecountry?: string;
}

export interface GdeltNewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  pubDate: string | null;   // ISO 8601
  thumb: string | null;
  language: string;
  country: string;
}

const LANG_MAP: Record<string, string> = {
  pt: "portuguese",
  en: "english",
  es: "spanish",
  fr: "french",
};

// Converte o seendate "YYYYMMDDTHHMMSSZ" em ISO 8601
function parseSeenDate(raw?: string): string | null {
  if (!raw || raw.length < 15) return null;
  const y = raw.slice(0, 4);
  const m = raw.slice(4, 6);
  const d = raw.slice(6, 8);
  const hh = raw.slice(9, 11);
  const mm = raw.slice(11, 13);
  const ss = raw.slice(13, 15);
  const iso = `${y}-${m}-${d}T${hh}:${mm}:${ss}Z`;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const userQuery = sp.get("q")?.trim();
  const lang = (sp.get("lang") ?? "pt").toLowerCase();
  const country = (sp.get("country") ?? "BR").toUpperCase();
  const timespan = sp.get("timespan") ?? "24h";
  const max = Math.min(75, Math.max(5, parseInt(sp.get("max") ?? "40", 10) || 40));

  const queryParts: string[] = [];
  queryParts.push(userQuery && userQuery.length > 0 ? userQuery : DEFAULT_QUERY);
  if (country && country.length === 2) queryParts.push(`sourcecountry:${country}`);
  const sourceLang = LANG_MAP[lang];
  if (sourceLang) queryParts.push(`sourcelang:${sourceLang}`);

  const url = new URL(GDELT_BASE);
  url.searchParams.set("query", queryParts.join(" "));
  url.searchParams.set("mode", "ArtList");
  url.searchParams.set("format", "json");
  url.searchParams.set("maxrecords", String(max));
  url.searchParams.set("sort", "datedesc");
  url.searchParams.set("timespan", timespan);

  try {
    // Cache de 10min — notícias são "frescas o bastante"
    const res = await fetch(url.toString(), {
      next: { revalidate: 600 },
      headers: { "User-Agent": "AurumApp/1.0 (https://github.com/joaozee/aurum-insights)" },
    });
    if (!res.ok) {
      return NextResponse.json({ items: [], error: `HTTP ${res.status}` }, { status: 200 });
    }
    // GDELT às vezes retorna texto vazio ou XML quando a query é inválida
    const text = await res.text();
    if (!text || !text.trim().startsWith("{")) {
      return NextResponse.json({ items: [] }, { status: 200 });
    }
    const data = JSON.parse(text) as { articles?: GdeltArticle[] };
    const articles = data.articles ?? [];

    // Dedupe por URL + filtra artigos sem título
    const seen = new Set<string>();
    const items: GdeltNewsItem[] = [];
    for (const a of articles) {
      if (!a.url || !a.title || seen.has(a.url)) continue;
      seen.add(a.url);
      items.push({
        id: a.url,
        title: a.title.trim(),
        url: a.url,
        source: a.domain ?? "",
        pubDate: parseSeenDate(a.seendate),
        thumb: a.socialimage && a.socialimage !== "" ? a.socialimage : null,
        language: a.language ?? "",
        country: a.sourcecountry ?? "",
      });
    }

    return NextResponse.json({ items, total: items.length }, { status: 200 });
  } catch (err) {
    console.error("[gdelt-news]", err);
    return NextResponse.json({ items: [], error: "fetch_failed" }, { status: 200 });
  }
}
