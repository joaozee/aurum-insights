import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const BASE = "https://brapi.dev/api";
const TOKEN = Deno.env.get("BRAPI_API_KEY") || "";

// Simple in-memory cache
const cache = new Map();
const TTL = 5 * 60 * 1000; // 5 minutes

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > TTL) { cache.delete(key); return null; }
  return entry.data;
}
function setCached(key, data) {
  cache.set(key, { data, ts: Date.now() });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { path } = await req.json();
    if (!path || typeof path !== "string") {
      return Response.json({ error: "Missing 'path' parameter" }, { status: 400 });
    }

    const cached = getCached(path);
    if (cached) return Response.json(cached);

    const sep = path.includes("?") ? "&" : "?";
    const url = `${BASE}${path}${sep}token=${TOKEN}`;

    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      return Response.json({ error: data?.message || res.statusText }, { status: res.status });
    }

    setCached(path, data);
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});