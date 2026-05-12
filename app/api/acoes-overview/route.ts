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
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketOpen?: number;
  regularMarketVolume?: number;
  regularMarketPreviousClose?: number;
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

interface BrapiCurrency {
  fromCurrency: string;
  toCurrency: string;
  name?: string;
  bidPrice?: string;
  askPrice?: string;
  percentageChange?: string;
  high?: string;
  low?: string;
  bidVariation?: string;
  updatedAtDate?: string;
}

interface BrapiSeriesPoint {
  date: string;
  value: string;
  epochDate?: number;
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
  open: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  volume: number | null;
  prevClose: number | null;
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

export interface OverviewMoversBundle {
  gainers: OverviewMover[];
  losers: OverviewMover[];
}

export interface OverviewResponse {
  ibov: OverviewIbov;
  ifix: OverviewIbov;
  // Legacy alias (consumido por /dashboard/comunidade): replica movers.stocks
  topGainers: OverviewMover[];
  topLosers: OverviewMover[];
  movers: {
    stocks: OverviewMoversBundle;
    fiis: OverviewMoversBundle;
    cryptos: OverviewMoversBundle;
  };
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

// Lista fixa de cryptos populares pra calcular Top Altas/Baixas (brapi não tem sort
// nativo em /v2/crypto, ordenamos localmente).
const CRYPTO_UNIVERSE = [
  "BTC", "ETH", "BNB", "SOL", "XRP", "ADA", "DOGE", "DOT",
  "MATIC", "AVAX", "LINK", "LTC", "ATOM", "NEAR", "UNI",
];

function parseIndexHero(data: unknown): OverviewIbov {
  const result = (data as { results?: (BrapiQuoteResult & {
    historicalDataPrice?: { close: number }[];
  })[] })?.results?.[0];
  const hist = result?.historicalDataPrice ?? [];
  return {
    price: result?.regularMarketPrice ?? null,
    changePct: result?.regularMarketChangePercent ?? null,
    spark: hist.map((h) => h.close).filter((v): v is number => typeof v === "number"),
    open: result?.regularMarketOpen ?? null,
    dayHigh: result?.regularMarketDayHigh ?? null,
    dayLow: result?.regularMarketDayLow ?? null,
    volume: result?.regularMarketVolume ?? null,
    prevClose: result?.regularMarketPreviousClose ?? null,
  };
}

function mapStockMovers(data: unknown, limit = 5): OverviewMover[] {
  const stocks = (data as { stocks?: BrapiListItem[] })?.stocks ?? [];
  return stocks
    .filter((s) => !/F$/.test(s.stock)) // remove fracionários (PETR4F etc.)
    .slice(0, limit)
    .map((s) => ({
      symbol: s.stock,
      name: s.name ?? s.stock,
      price: s.close ?? null,
      change: s.change ?? null,
      logo: s.logo ?? `https://icons.brapi.dev/icons/${s.stock}.svg`,
    }));
}

function mapFiiMovers(data: unknown, limit = 5): OverviewMover[] {
  // Mesma estrutura de /quote/list pra type=fund — campos stock/name/close/change
  const items = (data as { stocks?: BrapiListItem[] })?.stocks ?? [];
  return items
    .slice(0, limit)
    .map((s) => ({
      symbol: s.stock,
      name: s.name ?? s.stock,
      price: s.close ?? null,
      change: s.change ?? null,
      logo: s.logo ?? `https://icons.brapi.dev/icons/${s.stock}.svg`,
    }));
}

function pickCryptoMovers(coins: CryptoQuote[], dir: "up" | "down", limit = 5): OverviewMover[] {
  const sorted = [...coins]
    .filter((c) => Number.isFinite(c.regularMarketChangePercent ?? NaN))
    .sort((a, b) => {
      const av = a.regularMarketChangePercent ?? 0;
      const bv = b.regularMarketChangePercent ?? 0;
      return dir === "up" ? bv - av : av - bv;
    });
  return sorted.slice(0, limit).map((c) => ({
    symbol: c.coin,
    name: c.coinName ?? c.coin,
    price: c.regularMarketPrice ?? null,
    change: c.regularMarketChangePercent ?? null,
    logo: c.coinImageUrl,
  }));
}

export async function GET() {
  const today = new Date();
  const sixMonthsAgo = new Date(today);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const fmtBr = (d: Date) =>
    `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;

  const [
    ibovData, ifixData,
    stockGainersData, stockLosersData,
    fiiGainersData, fiiLosersData,
    fxData, cryptoUniverseData, cryptoTopData,
    selicData, ipcaData,
  ] = await Promise.all([
    // Hero indices
    safeJson(`${BASE}/quote/%5EBVSP?range=1d&interval=15m`),
    safeJson(`${BASE}/quote/%5EIFIX?range=1d&interval=15m`),
    // Stocks movers
    safeJson(`${BASE}/quote/list?type=stock&sortBy=change&sortOrder=desc&limit=10`),
    safeJson(`${BASE}/quote/list?type=stock&sortBy=change&sortOrder=asc&limit=10`),
    // FII movers (use mesmo endpoint /quote/list com type=fund)
    safeJson(`${BASE}/quote/list?type=fund&sortBy=change&sortOrder=desc&limit=10`),
    safeJson(`${BASE}/quote/list?type=fund&sortBy=change&sortOrder=asc&limit=10`),
    // FX
    safeJson(`${BASE}/v2/currency?currency=USD-BRL,EUR-BRL,GBP-BRL`),
    // Cripto universo (pra Top altas/baixas)
    safeJson(`${BASE}/v2/crypto?coin=${CRYPTO_UNIVERSE.join(",")}&currency=BRL`, 60),
    // Cripto top 3 (section Criptomoedas)
    safeJson(`${BASE}/v2/crypto?coin=BTC,ETH,SOL&currency=BRL`, 60),
    // Macro
    safeJson(`${BASE}/v2/prime-rate?country=brazil&sortBy=date&sortOrder=desc`, 3600),
    safeJson(
      `${BASE}/v2/inflation?historical=true&start=${fmtBr(sixMonthsAgo)}&end=${fmtBr(today)}&sortBy=date&sortOrder=desc`,
      3600
    ),
  ]);

  // Heroes
  const ibov = parseIndexHero(ibovData);
  const ifix = parseIndexHero(ifixData);

  // Stock + FII movers
  const stockGainers = mapStockMovers(stockGainersData);
  const stockLosers = mapStockMovers(stockLosersData);
  const fiiGainers = mapFiiMovers(fiiGainersData);
  const fiiLosers = mapFiiMovers(fiiLosersData);

  // Crypto movers (sort local sobre o universo)
  const cryptoUniverse = (cryptoUniverseData as { coins?: CryptoQuote[] })?.coins ?? [];
  const cryptoGainers = pickCryptoMovers(cryptoUniverse, "up");
  const cryptoLosers = pickCryptoMovers(cryptoUniverse, "down");

  // FX
  const fxResults = (fxData as { currency?: BrapiCurrency[] })?.currency ?? [];
  const fxLabels: Record<string, string> = {
    "USD-BRL": "Dólar Americano",
    "EUR-BRL": "Euro",
    "GBP-BRL": "Libra",
  };
  const currencies: OverviewCurrency[] = ["USD-BRL", "EUR-BRL", "GBP-BRL"].map((sym) => {
    const [from, to] = sym.split("-");
    const r = fxResults.find((x) => x.fromCurrency === from && x.toCurrency === to);
    const price = r?.bidPrice ? parseFloat(r.bidPrice) : null;
    const changePct = r?.percentageChange ? parseFloat(r.percentageChange) : null;
    return {
      symbol: sym,
      label: fxLabels[sym],
      price: Number.isFinite(price) ? price : null,
      changePct: Number.isFinite(changePct) ? changePct : null,
    };
  });

  // Cryptos (section embaixo)
  const cryptoTopResults = (cryptoTopData as { coins?: CryptoQuote[] })?.coins ?? [];
  const cryptoOrder = ["BTC", "ETH", "SOL"];
  const cryptos: OverviewCrypto[] = cryptoOrder.map((sym) => {
    const c = cryptoTopResults.find((x) => x.coin === sym);
    return {
      symbol: sym,
      name: c?.coinName ?? sym,
      price: c?.regularMarketPrice ?? null,
      changePct: c?.regularMarketChangePercent ?? null,
      logo: c?.coinImageUrl,
    };
  });

  // Selic
  const selicSeries = (selicData as { "prime-rate"?: BrapiSeriesPoint[] })?.["prime-rate"] ?? [];
  const selicLatest = selicSeries[0];
  const selicValue = selicLatest?.value ? parseFloat(selicLatest.value) : null;

  // IPCA 12m
  const ipcaSeries = (ipcaData as { inflation?: { value: number | string }[] })?.inflation ?? [];
  const ipcaLatest = ipcaSeries[0]?.value;
  const ipcaAcc: number | null =
    typeof ipcaLatest === "number"
      ? ipcaLatest
      : typeof ipcaLatest === "string" && Number.isFinite(parseFloat(ipcaLatest))
        ? parseFloat(ipcaLatest)
        : null;

  // CDI ≈ Selic - 0,10pp
  const cdiValue = selicValue !== null ? selicValue - 0.1 : null;

  const indices: OverviewIndex[] = [
    { label: "Selic", value: selicValue ?? 0, unit: "% a.a." },
    { label: "CDI", value: cdiValue ?? 0, unit: "% a.a." },
    { label: "IPCA 12m", value: ipcaAcc ?? 0, unit: "% a.a." },
  ];

  const response: OverviewResponse = {
    ibov,
    ifix,
    topGainers: stockGainers,
    topLosers: stockLosers,
    movers: {
      stocks: { gainers: stockGainers, losers: stockLosers },
      fiis: { gainers: fiiGainers, losers: fiiLosers },
      cryptos: { gainers: cryptoGainers, losers: cryptoLosers },
    },
    currencies,
    cryptos,
    indices,
  };

  return NextResponse.json(response, { status: 200 });
}
