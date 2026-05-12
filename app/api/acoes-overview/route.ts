import { NextResponse } from "next/server";

const BASE = "https://brapi.dev/api";

function brapiHeaders(): HeadersInit {
  const token = process.env.BRAPI_TOKEN;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Timeout individual por fetch — evita travar caso um endpoint da brapi engasgue.
async function safeJson(url: string, revalidate = 300, timeoutMs = 8000): Promise<unknown> {
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

export interface OverviewResponse {
  ibov: OverviewIbov;
  ifix: OverviewIbov;
  currencies: OverviewCurrency[];
  cryptos: OverviewCrypto[];
  indices: OverviewIndex[];
}

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

export async function GET() {
  const today = new Date();
  const sixMonthsAgo = new Date(today);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const fmtBr = (d: Date) =>
    `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;

  // 6 fetches em paralelo, todos com timeout de 8s. Sem listas pesadas de quote/list
  // aqui — movers foram extraídos pra /api/acoes-movers.
  const [
    ibovData, ifixData,
    fxData, cryptoTopData,
    selicData, ipcaData,
  ] = await Promise.all([
    safeJson(`${BASE}/quote/%5EBVSP?range=1d&interval=15m`),
    safeJson(`${BASE}/quote/%5EIFIX?range=1d&interval=15m`),
    safeJson(`${BASE}/v2/currency?currency=USD-BRL,EUR-BRL,GBP-BRL`),
    safeJson(`${BASE}/v2/crypto?coin=BTC,ETH,SOL&currency=BRL`, 60),
    safeJson(`${BASE}/v2/prime-rate?country=brazil&sortBy=date&sortOrder=desc`, 3600),
    safeJson(
      `${BASE}/v2/inflation?historical=true&start=${fmtBr(sixMonthsAgo)}&end=${fmtBr(today)}&sortBy=date&sortOrder=desc`,
      3600
    ),
  ]);

  const ibov = parseIndexHero(ibovData);
  const ifix = parseIndexHero(ifixData);

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

  const selicSeries = (selicData as { "prime-rate"?: BrapiSeriesPoint[] })?.["prime-rate"] ?? [];
  const selicLatest = selicSeries[0];
  const selicValue = selicLatest?.value ? parseFloat(selicLatest.value) : null;

  const ipcaSeries = (ipcaData as { inflation?: { value: number | string }[] })?.inflation ?? [];
  const ipcaLatest = ipcaSeries[0]?.value;
  const ipcaAcc: number | null =
    typeof ipcaLatest === "number"
      ? ipcaLatest
      : typeof ipcaLatest === "string" && Number.isFinite(parseFloat(ipcaLatest))
        ? parseFloat(ipcaLatest)
        : null;

  const cdiValue = selicValue !== null ? selicValue - 0.1 : null;

  const indices: OverviewIndex[] = [
    { label: "Selic", value: selicValue ?? 0, unit: "% a.a." },
    { label: "CDI", value: cdiValue ?? 0, unit: "% a.a." },
    { label: "IPCA 12m", value: ipcaAcc ?? 0, unit: "% a.a." },
  ];

  const response: OverviewResponse = {
    ibov,
    ifix,
    currencies,
    cryptos,
    indices,
  };

  return NextResponse.json(response, { status: 200 });
}
