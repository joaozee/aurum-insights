import { NextResponse } from "next/server";

export interface MarketItem {
  label: string;
  value: string;
  price: string;
  raw: number;
  positive: boolean;
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

async function fetchQuotes(): Promise<MarketItem[]> {
  const headers = brapiHeaders();

  // Um único request para IBOV, S&P 500 e Dólar — todos em tempo real
  const res = await fetch(`${BASE}/quote/%5EBVSP,%5EGSPC,USDBRL=X`, {
    headers,
    next: { revalidate: 300 },
  });
  const data = await res.json();
  const pcts: Record<string, number> = {};
  const prices: Record<string, number> = {};

  for (const r of data?.results ?? []) {
    pcts[r.symbol] = r.regularMarketChangePercent ?? 0;
    prices[r.symbol] = r.regularMarketPrice ?? 0;
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
