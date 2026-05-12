import { NextResponse } from "next/server";

const BASE = "https://brapi.dev/api";

function brapiHeaders(): HeadersInit {
  const token = process.env.BRAPI_TOKEN;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Timeout individual por fetch — evita que um endpoint travado da brapi bloqueie
// o response. 8s é suficiente pra brapi mesmo em horário de pico.
async function safeJson(url: string, revalidate = 120, timeoutMs = 8000): Promise<unknown> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      headers: brapiHeaders(),
      next: { revalidate },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

interface BrapiListItem {
  stock: string;
  name?: string;
  close?: number;
  change?: number;
  logo?: string;
}

interface CryptoQuote {
  coin: string;
  coinName?: string;
  regularMarketPrice?: number;
  regularMarketChangePercent?: number;
  coinImageUrl?: string;
}

export interface OverviewMover {
  symbol: string;
  name: string;
  price: number | null;
  change: number | null;
  logo?: string;
}

export interface MoversBundle {
  gainers: OverviewMover[];
  losers: OverviewMover[];
}

export interface MoversResponse {
  stocks: MoversBundle;
  fiis: MoversBundle;
  cryptos: MoversBundle;
}

// Universo de cryptos pra calcular Top Altas/Baixas (brapi /v2/crypto não tem sort
// nativo por change). Ordenamos localmente.
const CRYPTO_UNIVERSE = [
  "BTC", "ETH", "BNB", "SOL", "XRP", "ADA", "DOGE", "DOT",
  "MATIC", "AVAX", "LINK", "LTC", "ATOM", "NEAR", "UNI",
];

function pickStockMovers(data: unknown, dir: "up" | "down", limit = 5): OverviewMover[] {
  const stocks = (data as { stocks?: BrapiListItem[] })?.stocks ?? [];
  const cleaned = stocks
    .filter((s) => !/F$/.test(s.stock)) // remove fracionários (PETR4F etc.)
    .filter((s) => typeof s.change === "number" && Number.isFinite(s.change));
  // 1) Tentar só com a direção certa (positivos pra up, negativos pra down)
  const strict = dir === "up"
    ? cleaned.filter((s) => (s.change ?? 0) > 0).sort((a, b) => (b.change ?? 0) - (a.change ?? 0))
    : cleaned.filter((s) => (s.change ?? 0) < 0).sort((a, b) => (a.change ?? 0) - (b.change ?? 0));
  const pool = strict.length >= limit
    ? strict
    : cleaned.sort((a, b) => dir === "up" ? (b.change ?? 0) - (a.change ?? 0) : (a.change ?? 0) - (b.change ?? 0));
  return pool.slice(0, limit).map((s) => ({
    symbol: s.stock,
    name: s.name ?? s.stock,
    price: s.close ?? null,
    change: s.change ?? null,
    logo: s.logo ?? `https://icons.brapi.dev/icons/${s.stock}.svg`,
  }));
}

function pickFiiMovers(data: unknown, dir: "up" | "down", limit = 5): OverviewMover[] {
  const items = (data as { stocks?: BrapiListItem[] })?.stocks ?? [];
  const cleaned = items.filter(
    (s) => typeof s.change === "number" && Number.isFinite(s.change)
  );
  const strict = dir === "up"
    ? cleaned.filter((s) => (s.change ?? 0) > 0).sort((a, b) => (b.change ?? 0) - (a.change ?? 0))
    : cleaned.filter((s) => (s.change ?? 0) < 0).sort((a, b) => (a.change ?? 0) - (b.change ?? 0));
  const pool = strict.length >= limit
    ? strict
    : cleaned.sort((a, b) => dir === "up" ? (b.change ?? 0) - (a.change ?? 0) : (a.change ?? 0) - (b.change ?? 0));
  return pool.slice(0, limit).map((s) => ({
    symbol: s.stock,
    name: s.name ?? s.stock,
    price: s.close ?? null,
    change: s.change ?? null,
    logo: s.logo ?? `https://icons.brapi.dev/icons/${s.stock}.svg`,
  }));
}

function pickCryptoMovers(coins: CryptoQuote[], dir: "up" | "down", limit = 5): OverviewMover[] {
  const cleaned = coins.filter((c) => Number.isFinite(c.regularMarketChangePercent ?? NaN));
  const strict = dir === "up"
    ? cleaned.filter((c) => (c.regularMarketChangePercent ?? 0) > 0)
        .sort((a, b) => (b.regularMarketChangePercent ?? 0) - (a.regularMarketChangePercent ?? 0))
    : cleaned.filter((c) => (c.regularMarketChangePercent ?? 0) < 0)
        .sort((a, b) => (a.regularMarketChangePercent ?? 0) - (b.regularMarketChangePercent ?? 0));
  const pool = strict.length >= limit
    ? strict
    : cleaned.sort((a, b) => dir === "up"
        ? (b.regularMarketChangePercent ?? 0) - (a.regularMarketChangePercent ?? 0)
        : (a.regularMarketChangePercent ?? 0) - (b.regularMarketChangePercent ?? 0));
  return pool.slice(0, limit).map((c) => ({
    symbol: c.coin,
    name: c.coinName ?? c.coin,
    price: c.regularMarketPrice ?? null,
    change: c.regularMarketChangePercent ?? null,
    logo: c.coinImageUrl,
  }));
}

export async function GET() {
  // Buscar listas grandes ordenadas por volume (sempre tem valor), depois
  // filtrar/ordenar localmente por change. Mais robusto que sortBy=change que
  // pode retornar nulls primeiro.
  const [stockListData, fiiListData, cryptoUniverseData] = await Promise.all([
    safeJson(`${BASE}/quote/list?type=stock&sortBy=volume&sortOrder=desc&limit=100`),
    safeJson(`${BASE}/quote/list?type=fund&sortBy=volume&sortOrder=desc&limit=100`),
    safeJson(`${BASE}/v2/crypto?coin=${CRYPTO_UNIVERSE.join(",")}&currency=BRL`, 60),
  ]);

  const cryptoCoins = (cryptoUniverseData as { coins?: CryptoQuote[] })?.coins ?? [];

  const response: MoversResponse = {
    stocks: {
      gainers: pickStockMovers(stockListData, "up"),
      losers: pickStockMovers(stockListData, "down"),
    },
    fiis: {
      gainers: pickFiiMovers(fiiListData, "up"),
      losers: pickFiiMovers(fiiListData, "down"),
    },
    cryptos: {
      gainers: pickCryptoMovers(cryptoCoins, "up"),
      losers: pickCryptoMovers(cryptoCoins, "down"),
    },
  };

  return NextResponse.json(response, { status: 200 });
}
