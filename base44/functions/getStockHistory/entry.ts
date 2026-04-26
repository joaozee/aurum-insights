import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 min para histórico

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) { cache.delete(key); return null; }
  return entry.data;
}
function setCache(key, data) {
  cache.set(key, { data, ts: Date.now() });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { ticker, range = '1y', interval = '1mo' } = await req.json();
    if (!ticker) return Response.json({ error: 'Ticker required' }, { status: 400 });

    const t = ticker.toUpperCase().replace(/\.SA$/i, '').trim();
    const cacheKey = `hist:${t}:${range}:${interval}`;

    const cached = getCached(cacheKey);
    if (cached) return Response.json({ data: cached, _cached: true });

    const apiKey = Deno.env.get("BRAPI_API_KEY");
    const url = `https://brapi.dev/api/quote/${t}?range=${range}&interval=${interval}&token=${apiKey}`;

    let data = null;
    for (let i = 0; i < 3; i++) {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (res.ok) { data = await res.json(); break; }
      } catch (e) {
        if (i === 2) throw e;
        await new Promise(r => setTimeout(r, 500 * (i + 1)));
      }
    }

    const historical = data?.results?.[0]?.historicalDataPrice || [];
    setCache(cacheKey, historical);

    return Response.json({ data: historical });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});