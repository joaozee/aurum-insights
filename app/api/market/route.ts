import { NextResponse } from "next/server";

export interface MarketItem {
  label: string;
  value: string;       // formatted change percent (eg "+0,42%")
  price: string;       // formatted price (eg "5,42" or "120.345 pts" or BRL formatted)
  raw: number;         // raw change percent for sorting/comparing
  positive: boolean;
  spark: number[];     // intraday close samples for sparkline rendering (~24 points, 1h interval over 1d)
}

const BASE = "https://brapi.dev/api";

function brapiHeaders(): HeadersInit {
  const token = process.env.BRAPI_TOKEN;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatPrice(symbol: string, price: number): string {
  if (price === 0 || !Number.isFinite(price)) return "--";
  if (symbol === "USDBRL=X") {
    return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
  if (symbol === "^BVSP") {
    return price.toLocaleString("pt-BR", { maximumFractionDigits: 0 }) + " pts";
  }
  return price.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface BrapiHistoricalPoint {
  date: number;
  close: number;
}

async function fetchQuotes(): Promise<MarketItem[]> {
  const headers = brapiHeaders();

  // Um único request para IBOV, S&P 500 e Dólar com spark intraday (1d / 1h),
  // pra renderizar mini sparklines na Home sem segundo round-trip.
  const res = await fetch(
    `${BASE}/quote/%5EBVSP,%5EGSPC,USDBRL=X?range=1d&interval=1h`,
    { headers, next: { revalidate: 300 } },
  );
  const data = await res.json();
  const pcts: Record<string, number> = {};
  const prices: Record<string, number> = {};
  const sparks: Record<string, number[]> = {};

  for (const r of data?.results ?? []) {
    pcts[r.symbol] = r.regularMarketChangePercent ?? 0;
    prices[r.symbol] = r.regularMarketPrice ?? 0;
    const hist: BrapiHistoricalPoint[] = r.historicalDataPrice ?? [];
    sparks[r.symbol] = hist
      .map((h) => h.close)
      .filter((v) => Number.isFinite(v));
  }

  const map: { label: string; symbol: string }[] = [
    { label: "IBOV",    symbol: "^BVSP"    },
    { label: "S&P 500", symbol: "^GSPC"    },
    { label: "Dólar",   symbol: "USDBRL=X" },
  ];

  return map.map(({ label, symbol }) => {
    const pct = pcts[symbol] ?? 0;
    const price = prices[symbol] ?? 0;
    return {
      label,
      raw: pct,
      value: `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`,
      price: formatPrice(symbol, price),
      positive: pct >= 0,
      spark: sparks[symbol] ?? [],
    };
  });
}

export async function GET() {
  try {
    const data = await fetchQuotes();
    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    console.error("[market/route] fetch failed:", err);
    return NextResponse.json({ error: "Failed to fetch market data" }, { status: 500 });
  }
}
