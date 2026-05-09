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
  // brapi inflation já retorna o IPCA acumulado 12m de cada mês — basta pegar o valor mais recente
  const today = new Date();
  const sixMonthsAgo = new Date(today);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const fmtBr = (d: Date) =>
    `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;

  const [
    ibovData, gainersData, losersData, fxData, cryptoData,
    selicData, ipcaData,
  ] = await Promise.all([
    safeJson(`${BASE}/quote/%5EBVSP?range=1d&interval=15m`),
    safeJson(`${BASE}/quote/list?type=stock&sortBy=change&sortOrder=desc&limit=10`),
    safeJson(`${BASE}/quote/list?type=stock&sortBy=change&sortOrder=asc&limit=10`),
    safeJson(`${BASE}/v2/currency?currency=USD-BRL,EUR-BRL,GBP-BRL`),
    safeJson(`${BASE}/v2/crypto?coin=BTC,ETH,SOL&currency=BRL`, 60),
    safeJson(`${BASE}/v2/prime-rate?country=brazil&sortBy=date&sortOrder=desc`, 3600),
    safeJson(
      `${BASE}/v2/inflation?historical=true&start=${fmtBr(sixMonthsAgo)}&end=${fmtBr(today)}&sortBy=date&sortOrder=desc`,
      3600
    ),
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

  // Selic (taxa básica de juros) — último valor da série
  const selicSeries = (selicData as { "prime-rate"?: BrapiSeriesPoint[] })?.["prime-rate"] ?? [];
  const selicLatest = selicSeries[0];
  const selicValue = selicLatest?.value ? parseFloat(selicLatest.value) : null;

  // IPCA acumulado 12 meses — brapi já retorna esse valor pronto para cada mês
  const ipcaSeries = (ipcaData as { inflation?: { value: number | string }[] })?.inflation ?? [];
  const ipcaLatest = ipcaSeries[0]?.value;
  const ipcaAcc: number | null =
    typeof ipcaLatest === "number"
      ? ipcaLatest
      : typeof ipcaLatest === "string" && Number.isFinite(parseFloat(ipcaLatest))
        ? parseFloat(ipcaLatest)
        : null;

  // CDI ≈ Selic - 0,10pp (brapi não tem endpoint dedicado pro CDI;
  // na prática o CDI segue a Meta Selic com spread fixo de 0,10pp)
  const cdiValue = selicValue !== null ? selicValue - 0.1 : null;

  const indices: OverviewIndex[] = [
    { label: "Selic", value: selicValue ?? 0, unit: "% a.a." },
    { label: "CDI", value: cdiValue ?? 0, unit: "% a.a." },
    { label: "IPCA 12m", value: ipcaAcc ?? 0, unit: "% a.a." },
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
