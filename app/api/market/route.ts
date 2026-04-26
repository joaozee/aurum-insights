import { NextResponse } from "next/server";

export interface MarketItem {
  label: string;
  value: string;
  raw: number;
  positive: boolean;
}

const BASE = "https://brapi.dev/api";

function brapiHeaders(): HeadersInit {
  const token = process.env.BRAPI_TOKEN;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchQuotes(): Promise<MarketItem[]> {
  const headers = brapiHeaders();

  // Um único request para IBOV, S&P 500 e Dólar — todos em tempo real
  const res = await fetch(`${BASE}/quote/%5EBVSP,%5EGSPC,USDBRL=X`, {
    headers,
    next: { revalidate: 300 },
  });
  const data = await res.json();
  const quotes: Record<string, number> = {};

  for (const r of data?.results ?? []) {
    quotes[r.symbol] = r.regularMarketChangePercent ?? 0;
  }

  const map: { label: string; symbol: string }[] = [
    { label: "IBOV",    symbol: "^BVSP"    },
    { label: "S&P 500", symbol: "^GSPC"    },
    { label: "Dólar",   symbol: "USDBRL=X" },
  ];

  return map.map(({ label, symbol }) => {
    const pct = quotes[symbol] ?? 0;
    return {
      label,
      raw: pct,
      value: `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`,
      positive: pct >= 0,
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
