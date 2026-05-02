import { NextResponse } from "next/server";

const BASE = "https://brapi.dev/api";

function brapiHeaders(): HeadersInit {
  const token = process.env.BRAPI_TOKEN;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface SearchResult {
  symbol: string;
  name: string;
  price: number | null;
  change: number | null;
  kind: "stock" | "fund" | "crypto";
  logo?: string;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q    = (searchParams.get("q") ?? "").trim();
  const kind = (searchParams.get("kind") ?? "stock").trim() as SearchResult["kind"];

  if (q.length < 2) {
    return NextResponse.json({ results: [] }, { status: 200 });
  }

  try {
    if (kind === "crypto") {
      // brapi /v2/crypto/available accepts ?search=&limit=
      const availUrl = `${BASE}/v2/crypto/available?search=${encodeURIComponent(q)}&limit=10`;
      const availRes = await fetch(availUrl, { headers: brapiHeaders(), next: { revalidate: 300 } });
      const availData = await availRes.json();
      const coins: string[] = (availData?.coins ?? []).slice(0, 8);
      if (coins.length === 0) return NextResponse.json({ results: [] }, { status: 200 });

      const quoteUrl = `${BASE}/v2/crypto?coin=${encodeURIComponent(coins.join(","))}&currency=BRL`;
      const quoteRes = await fetch(quoteUrl, { headers: brapiHeaders(), next: { revalidate: 60 } });
      const quoteData = await quoteRes.json();
      type CryptoQuote = {
        coin: string;
        coinName?: string;
        regularMarketPrice?: number;
        regularMarketChangePercent?: number;
        coinImageUrl?: string;
      };
      const results: SearchResult[] = ((quoteData?.coins ?? []) as CryptoQuote[]).map(c => ({
        symbol: c.coin,
        name:   c.coinName ?? c.coin,
        price:  c.regularMarketPrice ?? null,
        change: c.regularMarketChangePercent ?? null,
        kind:   "crypto" as const,
        logo:   c.coinImageUrl,
      }));
      return NextResponse.json({ results }, { status: 200 });
    }

    // stock or fund
    const type = kind === "fund" ? "fund" : "stock";
    const listUrl = `${BASE}/quote/list?search=${encodeURIComponent(q)}&type=${type}&limit=24`;
    const res = await fetch(listUrl, { headers: brapiHeaders(), next: { revalidate: 300 } });
    const data = await res.json();
    type ListItem = {
      stock: string;
      name?: string;
      close?: number;
      change?: number;
      type?: string;
      logo?: string;
    };
    const results: SearchResult[] = ((data?.stocks ?? []) as ListItem[])
      .filter(s => !/F$/.test(s.stock))                       // drop B3 fractional tickers
      .filter(s => !type || s.type === type || !s.type)        // safety net
      .slice(0, 8)
      .map(s => ({
        symbol: s.stock,
        name:   s.name ?? s.stock,
        price:  s.close ?? null,
        change: s.change ?? null,
        kind:   type as "stock" | "fund",
        logo:   s.logo ?? `https://icons.brapi.dev/icons/${s.stock}.svg`,
      }));
    return NextResponse.json({ results }, { status: 200 });
  } catch (err) {
    console.error("[brapi-search] failed:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
