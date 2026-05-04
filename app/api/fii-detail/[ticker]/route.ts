import { NextResponse } from "next/server";

const BASE = "https://brapi.dev/api";

function brapiHeaders(): HeadersInit {
  const token = process.env.BRAPI_TOKEN;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Tipos brapi ──────────────────────────────────────────────────────────────

interface BrapiFIIIndicator {
  symbol: string;
  name?: string;
  cnpj?: string;
  segment?: string;        // papel | tijolo | hibrido | fof
  sector?: string;         // setor de atuação
  managementType?: string; // ativa | passiva
  mandate?: string;
  pvp?: number;            // P/VP
  dividendYield1m?: number;
  dividendYield12m?: number;
  equity?: number;
  totalAssets?: number;
  sharesOutstanding?: number;
  totalInvestors?: number;
  navPerShare?: number;
  adminFeeRate?: number;
  administratorName?: string;
  administratorCnpj?: string;
  administratorWebsite?: string;
  administratorEmail?: string;
  administratorPhone1?: string;
}

interface BrapiFIIReport {
  symbol: string;
  name?: string | null;
  cnpj?: string;
  administratorName?: string;
  administratorCnpj?: string;
  administratorAddress?: string;
  administratorAddressNumber?: string;
  administratorAddressComplement?: string;
  administratorDistrict?: string;
  administratorCity?: string;
  administratorState?: string;
  administratorZipCode?: string;
  administratorPhone1?: string;
  administratorPhone2?: string | null;
  administratorPhone3?: string | null;
  administratorWebsite?: string;
  administratorEmail?: string;
  referenceDate: string;
  version?: number;
  totalAssets?: number;
  equity?: number;
  sharesOutstanding?: number;
  navPerShare?: number;
  adminFeeRate?: number;
  monthlyReturn?: number;
  monthlyPatrimonialReturn?: number;
  monthlyDividendYield?: number;
  amortizationRate?: number;
  totalInvestors?: number;
  cash?: number;
  governmentBonds?: number;
  privateBonds?: number;
  fixedIncomeFunds?: number;
  totalInvested?: number;
  realEstateAssets?: number;
  cri?: number;
  lci?: number;
  fiiHoldings?: number;
  receivables?: number;
  rentalReceivables?: number;
  distributionsPayable?: number;
  adminFeesPayable?: number;
  realEstateObligations?: number;
  totalLiabilities?: number;
}

interface BrapiFIIDividend {
  symbol?: string;
  paymentDate?: string;
  approvedOn?: string;
  rate?: number;
  type?: string; // rendimento | amortizacao
  label?: string;
}

interface BrapiQuoteResult {
  symbol: string;
  shortName?: string;
  longName?: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  marketCap?: number;
  logourl?: string;
  historicalDataPrice?: { date: number; close: number; high?: number; low?: number }[];
}

// ─── Response ─────────────────────────────────────────────────────────────────

export interface FIIDetailResponse {
  symbol: string;
  quote: BrapiQuoteResult | null;
  indicator: BrapiFIIIndicator | null;
  reports: BrapiFIIReport[];
  dividends: BrapiFIIDividend[];
  errors: { source: string; status: number | string }[];
}

async function safeJson(url: string, revalidate = 600): Promise<{ data: unknown; status: number | string }> {
  try {
    const res = await fetch(url, { headers: brapiHeaders(), next: { revalidate } });
    if (!res.ok) return { data: null, status: res.status };
    return { data: await res.json(), status: res.status };
  } catch {
    return { data: null, status: "fetch_error" };
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const t = ticker.toUpperCase();

  // 12 meses pra dividendos
  const today = new Date();
  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 5);
  const fmtIso = (d: Date) => d.toISOString().slice(0, 10);

  const [quoteRes, indicatorsRes, reportsRes, dividendsRes] = await Promise.all([
    safeJson(`${BASE}/quote/${encodeURIComponent(t)}?range=1y&interval=1mo`),
    safeJson(`${BASE}/v2/fii/indicators?symbols=${encodeURIComponent(t)}`),
    safeJson(`${BASE}/v2/fii/reports?symbols=${encodeURIComponent(t)}&sortBy=referenceDate&sortOrder=desc&limit=24`),
    safeJson(
      `${BASE}/v2/fii/dividends?symbols=${encodeURIComponent(t)}&startDate=${fmtIso(oneYearAgo)}&endDate=${fmtIso(today)}&sortOrder=desc`
    ),
  ]);

  const errors: FIIDetailResponse["errors"] = [];
  if (quoteRes.status !== 200) errors.push({ source: "quote", status: quoteRes.status });
  if (indicatorsRes.status !== 200) errors.push({ source: "indicators", status: indicatorsRes.status });
  if (reportsRes.status !== 200) errors.push({ source: "reports", status: reportsRes.status });
  if (dividendsRes.status !== 200) errors.push({ source: "dividends", status: dividendsRes.status });

  const quote = (quoteRes.data as { results?: BrapiQuoteResult[] })?.results?.[0] ?? null;

  const indicators = (indicatorsRes.data as { indicators?: BrapiFIIIndicator[]; data?: BrapiFIIIndicator[] }) ?? null;
  const indicator = indicators?.indicators?.[0] ?? indicators?.data?.[0] ?? null;

  const reports = (reportsRes.data as { reports?: BrapiFIIReport[] })?.reports ?? [];

  const dividends = (dividendsRes.data as { dividends?: BrapiFIIDividend[] })?.dividends ?? [];

  const response: FIIDetailResponse = {
    symbol: t,
    quote,
    indicator,
    reports,
    dividends,
    errors,
  };

  return NextResponse.json(response, { status: 200 });
}
