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

// ─── Helpers de cache e retry ───────────────────────────────────────────────

// Cache em memória do processo. Só guarda respostas DE SUCESSO (com items).
// Failures (429, timeouts, XML, etc.) nunca são cacheadas — assim o usuário
// clicar em "Tentar de novo" realmente refaz a chamada.
//
// Em serverless (Vercel), cada warm container reutiliza este Map; cold starts
// começam vazio. TTL de 10min é seguro pra news que rotacionam de hora em hora.
type CacheEntry = { items: GdeltNewsItem[]; expiresAt: number };
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 min
const memCache = new Map<string, CacheEntry>();

// Backoff para retry em 429. Honra Retry-After se vier no header.
function pickRetryDelayMs(res: Response, attempt: number): number {
  const retryAfter = res.headers.get("retry-after");
  if (retryAfter) {
    // Pode ser segundos OU data HTTP. GDELT costuma mandar segundos.
    const asSeconds = parseInt(retryAfter, 10);
    if (Number.isFinite(asSeconds) && asSeconds > 0) {
      // Cap em 5s pra não bloquear demais a request inteira
      return Math.min(asSeconds * 1000, 5000);
    }
    const asDate = Date.parse(retryAfter);
    if (Number.isFinite(asDate)) {
      const ms = asDate - Date.now();
      if (ms > 0) return Math.min(ms, 5000);
    }
  }
  // Backoff exponencial: 800ms → 2s → 4s (cap)
  return Math.min(800 * Math.pow(2, attempt), 4000);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Faz fetch no GDELT com retry em 429. Até 2 retries (3 tentativas no total).
 * Retorna { ok, status, body } — nunca lança. `body` é null se não pôde ler.
 */
async function fetchGdeltWithRetry(gdeltUrl: string): Promise<{
  ok: boolean;
  status: number;
  body: string | null;
  retryAfterMs?: number;
}> {
  const MAX_ATTEMPTS = 3;
  let lastStatus = 0;
  let lastRetryAfterMs: number | undefined;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(gdeltUrl, {
        // IMPORTANTE: cache no-store. O cache de sucesso é feito por nós
        // em memCache; falhas não devem ficar grudadas no fetch cache.
        cache: "no-store",
        headers: { "User-Agent": "AurumApp/1.0 (https://github.com/joaozee/aurum-insights)" },
      });
      lastStatus = res.status;
      if (res.ok) {
        const body = await res.text();
        return { ok: true, status: res.status, body };
      }
      // 429 ou 5xx → tenta de novo se ainda tem fôlego
      if ((res.status === 429 || res.status >= 500) && attempt < MAX_ATTEMPTS - 1) {
        const delay = pickRetryDelayMs(res, attempt);
        lastRetryAfterMs = delay;
        await sleep(delay);
        continue;
      }
      // Falha final — captura Retry-After se houver pra propagar
      const finalRetry = res.headers.get("retry-after");
      if (finalRetry) {
        const asSec = parseInt(finalRetry, 10);
        if (Number.isFinite(asSec)) lastRetryAfterMs = asSec * 1000;
      }
      return { ok: false, status: res.status, body: null, retryAfterMs: lastRetryAfterMs };
    } catch (err) {
      // erro de rede → também vale retry
      console.error(`[gdelt-news] tentativa ${attempt + 1} falhou:`, err);
      if (attempt < MAX_ATTEMPTS - 1) {
        await sleep(Math.min(800 * Math.pow(2, attempt), 4000));
        continue;
      }
      return { ok: false, status: lastStatus || 0, body: null };
    }
  }
  return { ok: false, status: lastStatus, body: null, retryAfterMs: lastRetryAfterMs };
}

// Headers padrão pra não deixar resposta de erro grudada em CDN/cache do browser.
const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0, must-revalidate",
} as const;

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

  const cacheKey = url.toString();

  // 1) Tenta servir do cache em memória se ainda fresco
  const cached = memCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(
      { items: cached.items, total: cached.items.length, cached: true },
      { status: 200, headers: { "Cache-Control": "private, max-age=60" } },
    );
  }

  // 2) Vai pro GDELT com retry
  const result = await fetchGdeltWithRetry(cacheKey);

  if (!result.ok) {
    const retrySec = result.retryAfterMs ? Math.ceil(result.retryAfterMs / 1000) : undefined;
    const errorCode =
      result.status === 429
        ? "rate_limit"
        : result.status >= 500
          ? "gdelt_unavailable"
          : result.status > 0
            ? `http_${result.status}`
            : "network_error";
    return NextResponse.json(
      {
        items: [],
        error: errorCode,
        status: result.status || null,
        retryAfterSeconds: retrySec ?? null,
      },
      { status: 200, headers: NO_STORE_HEADERS },
    );
  }

  // 3) Parse — GDELT às vezes retorna texto vazio ou XML em queries inválidas
  const text = result.body ?? "";
  if (!text || !text.trim().startsWith("{")) {
    return NextResponse.json(
      { items: [], error: "empty_response" },
      { status: 200, headers: NO_STORE_HEADERS },
    );
  }

  let data: { articles?: GdeltArticle[] };
  try {
    data = JSON.parse(text) as { articles?: GdeltArticle[] };
  } catch (err) {
    console.error("[gdelt-news] JSON parse:", err);
    return NextResponse.json(
      { items: [], error: "parse_error" },
      { status: 200, headers: NO_STORE_HEADERS },
    );
  }
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

  // 4) Só cacheia se DEU CERTO (items.length > 0 protege contra fluke de
  // resposta vazia que ainda assim chegou como 200)
  if (items.length > 0) {
    memCache.set(cacheKey, { items, expiresAt: Date.now() + CACHE_TTL_MS });
  }

  return NextResponse.json(
    { items, total: items.length },
    { status: 200, headers: { "Cache-Control": "private, max-age=60" } },
  );
}
