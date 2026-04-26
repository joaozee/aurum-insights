import { NextResponse } from "next/server";

export interface MarketItem {
  label: string;
  value: string;
  raw: number;
  positive: boolean;
}

const BRAPI_TOKEN = process.env.BRAPI_TOKEN;
const BASE = "https://brapi.dev/api";

async function fetchQuotes(): Promise<Pick<MarketItem, "label" | "value" | "raw" | "positive">[]> {
  const token = BRAPI_TOKEN ? `?token=${BRAPI_TOKEN}` : "";

  // Fetch IBOV (^BVSP) and S&P 500 (^GSPC) in one request, USD/BRL separately
  const [quotesRes, currencyRes] = await Promise.all([
    fetch(`${BASE}/quote/%5EBVSP,%5EGSPC${token}`, {
      next: { revalidate: 300 }, // cache 5 min
    }),
    fetch(`${BASE}/v2/currency?currency=USD-BRL${token}`, {
      next: { revalidate: 300 },
    }),
  ]);

  const quotesData = await quotesRes.json();
  const currencyData = await currencyRes.json();

  const results: MarketItem[] = [];

  // IBOV
  const ibov = quotesData?.results?.find(
    (r: { symbol: string }) => r.symbol === "^BVSP"
  );
  if (ibov) {
    const pct: number = ibov.regularMarketChangePercent ?? 0;
    results.push({
      label: "IBOV",
      raw: pct,
      value: `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`,
      positive: pct >= 0,
    });
  }

  // S&P 500
  const sp = quotesData?.results?.find(
    (r: { symbol: string }) => r.symbol === "^GSPC"
  );
  if (sp) {
    const pct: number = sp.regularMarketChangePercent ?? 0;
    results.push({
      label: "S&P 500",
      raw: pct,
      value: `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`,
      positive: pct >= 0,
    });
  }

  // Dólar
  const usd = currencyData?.currency?.[0];
  if (usd) {
    const pct: number = usd.pctChange ?? 0;
    results.push({
      label: "Dólar",
      raw: pct,
      value: `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`,
      positive: pct >= 0,
    });
  }

  return results;
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
