import { NextResponse } from "next/server";

const BASE = "https://brapi.dev/api";

function brapiHeaders(): HeadersInit {
  const token = process.env.BRAPI_TOKEN;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface BrapiQuoteResult {
  symbol: string;
  shortName?: string;
  longName?: string;
  regularMarketPrice?: number;
  regularMarketChangePercent?: number;
  regularMarketChange?: number;
  logourl?: string;
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

export interface OverviewIbov {
  price: number | null;
  changePct: number | null;
  spark: number[];
}

export interface OverviewCurrency {
  symbol: string;
  label: string;
  price: number | null;
  changePct: number | null;
}

export interface OverviewCrypto {
  symbol: string;
  name: string;
  price: number | null;
  changePct: number | null;
  logo?: string;
}

export interface OverviewIndex {
  label: string;
  value: number;
  unit: string;
}

export interface OverviewResponse {
  ibov: OverviewIbov;
  topGainers: OverviewMover[];
  topLosers: OverviewMover[];
  currencies: OverviewCurrency[];
  cryptos: OverviewCrypto[];
  indices: OverviewIndex[];
}

async function safeJson(url: string, revalidate = 300): Promise<unknown> {
  try {
    const res = await fetch(url, { headers: brapiHeaders(), next: { revalidate } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function GET() {
  const [ibovData, gainersData, losersData, fxData, cryptoData] = await Promise.all([
    safeJson(`${BASE}/quote/%5EBVSP?range=1d&interval=15m`),
    safeJson(`${BASE}/quote/list?type=stock&sortBy=change&sortOrder=desc&limit=10`),
    safeJson(`${BASE}/quote/list?type=stock&sortBy=change&sortOrder=asc&limit=10`),
    safeJson(`${BASE}/quote/USDBRL=X,EURBRL=X,GBPBRL=X`),
    safeJson(`${BASE}/v2/crypto?coin=BTC,ETH,SOL&currency=BRL`, 60),
  ]);

  const ibov: OverviewIbov = (() => {
    const result = (ibovData as { results?: (BrapiQuoteResult & {
      historicalDataPrice?: { close: number }[];
    })[] })?.results?.[0];
    const hist = result?.historicalDataPrice ?? [];
    return {
      price: result?.regularMarketPrice ?? null,
      changePct: result?.regularMarketChangePercent ?? null,
      spark: hist.map((h) => h.close).filter((v): v is number => typeof v === "number"),
    };
  })();

  const mapMovers = (data: unknown): OverviewMover[] => {
    const stocks = (data as { stocks?: BrapiListItem[] })?.stocks ?? [];
    return stocks
      .filter((s) => !/F$/.test(s.stock))
      .slice(0, 5)
      .map((s) => ({
        symbol: s.stock,
        name: s.name ?? s.stock,
        price: s.close ?? null,
        change: s.change ?? null,
        logo: s.logo ?? `https://icons.brapi.dev/icons/${s.stock}.svg`,
      }));
  };

  const topGainers = mapMovers(gainersData);
  const topLosers = mapMovers(losersData);

  const fxResults = (fxData as { results?: BrapiQuoteResult[] })?.results ?? [];
  const fxLabels: Record<string, string> = {
    "USDBRL=X": "Dólar Americano",
    "EURBRL=X": "Euro",
    "GBPBRL=X": "Libra",
  };
  const currencies: OverviewCurrency[] = ["USDBRL=X", "EURBRL=X", "GBPBRL=X"].map((sym) => {
    const r = fxResults.find((x) => x.symbol === sym);
    return {
      symbol: sym,
      label: fxLabels[sym],
      price: r?.regularMarketPrice ?? null,
      changePct: r?.regularMarketChangePercent ?? null,
    };
  });

  const cryptoResults = (cryptoData as { coins?: CryptoQuote[] })?.coins ?? [];
  const cryptoOrder = ["BTC", "ETH", "SOL"];
  const cryptos: OverviewCrypto[] = cryptoOrder.map((sym) => {
    const c = cryptoResults.find((x) => x.coin === sym);
    return {
      symbol: sym,
      name: c?.coinName ?? sym,
      price: c?.regularMarketPrice ?? null,
      changePct: c?.regularMarketChangePercent ?? null,
      logo: c?.coinImageUrl,
    };
  });

  // Índices fixos (Selic, CDI, IPCA) — brapi não retorna direto, valores típicos atuais.
  // Em produção, plugar em endpoint do BCB.
  const indices: OverviewIndex[] = [
    { label: "Selic", value: 14.75, unit: "% a.a." },
    { label: "CDI", value: 14.65, unit: "% a.a." },
    { label: "IPCA", value: 4.95, unit: "% a.a." },
  ];

  const response: OverviewResponse = {
    ibov,
    topGainers,
    topLosers,
    currencies,
    cryptos,
    indices,
  };

  return NextResponse.json(response, { status: 200 });
}
