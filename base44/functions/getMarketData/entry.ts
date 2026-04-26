import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const BRAPI_TOKEN = Deno.env.get("BRAPI_API_KEY") || "";
const BASE = "https://brapi.dev/api";

// Server-side cache: 5 min for quotes, 60 min for macro
const cache = {};
function getCached(key) {
  const entry = cache[key];
  if (entry && Date.now() - entry.ts < entry.ttl) return entry.data;
  return null;
}
function setCached(key, data, ttlMs) {
  cache[key] = { data, ts: Date.now(), ttl: ttlMs };
}

async function brapiFetch(path, ttlMs = 5 * 60 * 1000) {
  const cached = getCached(path);
  if (cached) return cached;
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`${BASE}${path}${sep}token=${BRAPI_TOKEN}`, {
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`brapi ${res.status}: ${path}`);
  const data = await res.json();
  setCached(path, data, ttlMs);
  return data;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const type = url.searchParams.get("type") || "overview";

    // ── Ibovespa history ─────────────────────────────────────────────────────
    if (type === "ibovespa") {
      const range = url.searchParams.get("range") || "1d";
      const interval = url.searchParams.get("interval") || "30m";
      const data = await brapiFetch(`/quote/%5EBVSP?range=${range}&interval=${interval}`);
      return Response.json(data);
    }

    // ── Rankings ─────────────────────────────────────────────────────────────
    if (type === "rankings") {
      const assetType = url.searchParams.get("assetType") || "stock";
      if (assetType === "crypto") {
        const data = await brapiFetch(`/v2/crypto?currency=BRL`, 5 * 60 * 1000);
        return Response.json(data);
      }
      const [dy, mktcap] = await Promise.allSettled([
        brapiFetch(`/quote/list?sortBy=dividendYield&sortOrder=desc&limit=5&type=${assetType}`),
        brapiFetch(`/quote/list?sortBy=market_cap&sortOrder=desc&limit=5&type=${assetType}`),
      ]);
      return Response.json({
        dy: dy.status === "fulfilled" ? dy.value.stocks || [] : [],
        mktcap: mktcap.status === "fulfilled" ? mktcap.value.stocks || [] : [],
      });
    }

    // ── Overview: movers + currencies + macro + crypto ────────────────────────
    const [altas, baixas, currencies, primeRate, inflation, crypto] = await Promise.allSettled([
      brapiFetch(`/quote/list?sortBy=change&sortOrder=desc&limit=6&type=stock`),
      brapiFetch(`/quote/list?sortBy=change&sortOrder=asc&limit=6&type=stock`),
      brapiFetch(`/v2/currency?currency=USD-BRL,CNY-BRL,EUR-BRL`, 60 * 60 * 1000),
      brapiFetch(`/v2/prime-rate?country=brazil`, 60 * 60 * 1000),
      brapiFetch(`/v2/inflation?country=brazil&sortBy=date&sortOrder=desc`, 60 * 60 * 1000),
      brapiFetch(`/v2/crypto?coin=BTC,ETH,SOL&currency=BRL`),
    ]);

    return Response.json({
      altas:     altas.status     === "fulfilled" ? altas.value.stocks || []         : [],
      baixas:    baixas.status    === "fulfilled" ? baixas.value.stocks || []        : [],
      currencies:currencies.status=== "fulfilled" ? currencies.value.currency || []  : [],
      primeRate: primeRate.status === "fulfilled" ? primeRate.value.prime_rate || [] : [],
      inflation: inflation.status === "fulfilled" ? inflation.value.inflation || []  : [],
      crypto:    crypto.status    === "fulfilled" ? crypto.value.coins || []         : [],
    });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});