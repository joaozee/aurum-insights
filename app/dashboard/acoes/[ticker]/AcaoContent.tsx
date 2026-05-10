"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, TrendingUp, TrendingDown, Info, X, ChevronDown,
  CheckCircle2, XCircle, Building2, Calendar as CalendarIcon,
  Newspaper, ExternalLink, Plus,
  Calculator, ShieldCheck, Coins, Rocket, Landmark,
} from "lucide-react";
import AssetDiscussion from "@/components/AssetDiscussion";
import { IndicatorHelp } from "@/components/IndicatorHelp";

// ─── Tipos brapi ──────────────────────────────────────────────────────────────

interface BrapiCashDividend {
  paymentDate: string;
  approvedOn?: string;
  lastDatePrior?: string;  // Data com (último dia para ter direito ao provento)
  rate: number;
  label?: string;
  type?: string;
}

interface BrapiHistoricalPrice {
  date: number;
  close: number;
  high?: number;
  low?: number;
  volume?: number;
}

interface BrapiBalanceSheet {
  endDate: string;
  totalAssets?: number;
  totalLiab?: number;
  totalStockholderEquity?: number;
}

interface BrapiIncomeStatement {
  endDate: string;
  totalRevenue?: number;
  netIncome?: number;
  ebit?: number;
}

interface BrapiQuoteFull {
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
  sharesOutstanding?: number;
  priceEarnings?: number | null;
  earningsPerShare?: number | null;
  regularMarketVolume?: number;
  logourl?: string;
  historicalDataPrice?: BrapiHistoricalPrice[];
  dividendsData?: { cashDividends?: BrapiCashDividend[] };
  summaryProfile?: {
    longBusinessSummary?: string;
    sector?: string;
    industry?: string;
    website?: string;
    fullTimeEmployees?: number;
  };
  defaultKeyStatistics?: {
    bookValue?: number;
    priceToBook?: number;
    forwardPE?: number | null;
    trailingPE?: number | null;
    enterpriseValue?: number;
    enterpriseToEbitda?: number;
    enterpriseToRevenue?: number;
    beta?: number;
    totalAssets?: number;
    netIncomeToCommon?: number;
    dividendYield?: number;
    sharesOutstanding?: number;
    revenuePerShare?: number;
    earningsPerShare?: number;
    trailingEps?: number;
  };
  financialData?: {
    currentRatio?: number;
    quickRatio?: number;
    debtToEquity?: number;
    grossMargins?: number;
    operatingMargins?: number;
    profitMargins?: number;
    ebitdaMargins?: number;
    returnOnAssets?: number;
    returnOnEquity?: number;
    totalRevenue?: number;
    revenuePerShare?: number;
    grossProfits?: number;
    ebitda?: number;
    freeCashflow?: number;
    operatingCashflow?: number;
    revenueGrowth?: number;
    earningsGrowth?: number;
    totalCash?: number;
    totalDebt?: number;
  };
  balanceSheetHistory?: { balanceSheetStatements?: BrapiBalanceSheet[] };
  incomeStatementHistory?: { incomeStatementHistory?: BrapiIncomeStatement[] };
}

type Period = "1m" | "3m" | "6m" | "1y" | "5y" | "10y" | "max";

const PERIOD_LABELS: Record<Period, string> = {
  "1m": "1M", "3m": "3M", "6m": "6M",
  "1y": "1A", "5y": "5A", "10y": "10A", "max": "MAX",
};

// ─── Component ────────────────────────────────────────────────────────────────

interface Technicals {
  rsi14: number | null;
  rsi200: number | null;
  avgVolume90d: number | null;
  avgPrice52w: number | null;
}

interface AcaoContentProps {
  ticker: string;
  userEmail: string;
  userName: string;
  userAvatar: string | null;
}

export default function AcaoContent({ ticker, userEmail, userName, userAvatar }: AcaoContentProps) {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>("1y");
  const [quote, setQuote] = useState<BrapiQuoteFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [comparados, setComparados] = useState<string[]>([ticker]);
  const [novoTicker, setNovoTicker] = useState("");
  const [divChartType, setDivChartType] = useState<"yield" | "value">("yield");
  const [calendarPage, setCalendarPage] = useState(0);
  const [technicals, setTechnicals] = useState<Technicals>({ rsi14: null, rsi200: null, avgVolume90d: null, avgPrice52w: null });
  const peersAutoPopulated = useRef(false);

  const loadQuote = useCallback(async (p: Period) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        tickers: ticker,
        dividends: "true",
        modules: "summaryProfile,defaultKeyStatistics,financialData,balanceSheetHistory,incomeStatementHistory",
      });
      const rangeMap: Record<Period, string> = {
        "1m": "1mo", "3m": "3mo", "6m": "6mo",
        "1y": "1y", "5y": "5y", "10y": "10y", "max": "max",
      };
      const url = `/api/brapi-quote?${params.toString()}&range=${rangeMap[p]}&interval=${p === "1m" ? "1d" : p === "3m" ? "1d" : p === "6m" ? "1wk" : "1mo"}`;
      const res = await fetch(url);
      if (!res.ok) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const data = await res.json();
      const result = data?.results?.[0] as BrapiQuoteFull | undefined;
      if (!result || !result.regularMarketPrice) {
        setNotFound(true);
      } else {
        setQuote(result);
        setNotFound(false);
      }
    } catch (err) {
      console.error("[loadQuote]", err);
      setNotFound(true);
    }
    setLoading(false);
  }, [ticker]);

  useEffect(() => { loadQuote(period); }, [loadQuote, period]);

  // Technicals: fetch dedicado de 1 ano em base diária para RSI 14/200 e Vol. Médio 90d
  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch(
          `/api/brapi-quote?tickers=${encodeURIComponent(ticker)}&range=1y&interval=1d`,
          { signal: ctrl.signal }
        );
        if (!res.ok) return;
        const data = await res.json();
        const result = data?.results?.[0] as BrapiQuoteFull | undefined;
        const history = result?.historicalDataPrice ?? [];
        const closes = history.map((h) => h.close).filter((v): v is number => typeof v === "number");
        const volumes = history
          .map((h) => h.volume)
          .filter((v): v is number => typeof v === "number" && v > 0);
        setTechnicals({
          rsi14: computeRSI(closes, 14),
          rsi200: computeRSI(closes, 200),
          avgVolume90d: avgLastN(volumes, 90),
          avgPrice52w: avgLastN(closes, 252), // ~252 pregões = 52 semanas
        });
      } catch {
        // Silent — technicals são opcionais
      }
    })();
    return () => ctrl.abort();
  }, [ticker]);

  // Concorrentes do mesmo setor: auto-popula uma vez quando quote carrega.
  // Não re-trigga em re-fetches do quote nem após edição manual do usuário.
  useEffect(() => {
    if (!quote || peersAutoPopulated.current) return;
    peersAutoPopulated.current = true;

    const industry = quote.summaryProfile?.industry ?? "";
    const sector = quote.summaryProfile?.sector ?? "";
    const ctrl = new AbortController();

    (async () => {
      try {
        const params = new URLSearchParams({
          industry,
          sector,
          exclude: ticker,
          limit: "7",
        });
        const res = await fetch(`/api/peers?${params}`, { signal: ctrl.signal });
        if (!res.ok) return;
        const data = (await res.json()) as { peers?: string[] };
        const peers = (data.peers ?? []).filter((p) => p && p !== ticker);
        if (peers.length === 0) return;

        // Só auto-popula se o usuário ainda não mexeu (lista = só o ticker primário)
        setComparados((prev) => (prev.length === 1 && prev[0] === ticker
          ? [ticker, ...peers]
          : prev));
      } catch {
        // Ignora — só desabilita auto-população
      }
    })();

    return () => ctrl.abort();
  }, [quote, ticker]);

  // Reseta o flag se o usuário navegou pra outro ticker
  useEffect(() => {
    peersAutoPopulated.current = false;
    setComparados([ticker]);
  }, [ticker]);

  // Métricas calculadas
  const metrics = useMemo(() => calculateMetrics(quote), [quote]);
  const isFinance = useMemo(() => isFinanceSector(quote), [quote]);
  const dividends = useMemo(() => buildDividends(quote), [quote]);
  const incomeData = useMemo(() => buildIncomeData(quote), [quote]);
  const bazin = useMemo(() => bazinCeiling(quote?.dividendsData?.cashDividends), [quote]);
  const checklist = useMemo(() => {
    if (!quote) return { groups: [], passedTotal: 0, total: 0, scorePct: 0 };
    return buildChecklist({ metrics, quote, dividends, technicals }, isFinance);
  }, [metrics, quote, dividends, technicals, isFinance]);

  if (loading) {
    return (
      <div style={{ minHeight: "calc(100vh - 58px)", background: "#0a0806", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#a09068", fontSize: "13px", fontFamily: "var(--font-sans)" }}>Carregando análise de {ticker}...</p>
      </div>
    );
  }

  if (notFound || !quote) {
    return (
      <div style={{ minHeight: "calc(100vh - 58px)", background: "#0a0806" }}>
        <div style={{ maxWidth: "880px", margin: "0 auto", padding: "32px 24px" }}>
          <BackButton onClick={() => router.push("/dashboard/acoes")} />
          <div style={{
            background: "#130f09",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: "14px", padding: "32px 24px",
            textAlign: "center",
          }}>
            <p style={{ fontSize: "15px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-sans)", marginBottom: "6px" }}>
              Ativo não encontrado
            </p>
            <p style={{ fontSize: "12px", color: "#a09068", fontFamily: "var(--font-sans)" }}>
              Não conseguimos buscar dados para <strong>{ticker}</strong>. Verifique o ticker e tente novamente.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const positive = (quote.regularMarketChangePercent ?? 0) >= 0;
  const priceColor = positive ? "#34d399" : "#f87171";

  return (
    <div style={{ minHeight: "calc(100vh - 58px)", background: "#0a0806" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 24px 64px" }}>
        <BackButton onClick={() => router.push("/dashboard/acoes")} />

        {/* PREÇO + LOGO */}
        <div style={{
          background: "linear-gradient(180deg, #130f09 0%, #0f0c07 100%)",
          border: "1px solid rgba(201,168,76,0.12)",
          borderRadius: "16px",
          padding: "24px",
          marginBottom: "16px",
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "20px",
            marginBottom: "20px",
          }}>
            <div style={{ display: "flex", gap: "18px", alignItems: "center", minWidth: 0 }}>
              {quote.logourl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={quote.logourl}
                  alt=""
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "14px",
                    objectFit: "contain",
                    flexShrink: 0,
                    filter: "drop-shadow(0 4px 14px rgba(0,0,0,0.4))",
                  }}
                />
              )}
              <div style={{ minWidth: 0 }}>
                <p style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#e8dcc0",
                  fontFamily: "var(--font-display)",
                  marginBottom: "8px",
                  letterSpacing: "-0.01em",
                  lineHeight: 1.15,
                }}>
                  {quote.longName ?? quote.shortName ?? ticker}
                </p>
                <span style={{
                  display: "inline-block",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#C9A84C",
                  background: "rgba(201,168,76,0.1)",
                  border: "1px solid rgba(201,168,76,0.25)",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontFamily: "var(--font-sans)",
                  letterSpacing: "0.08em",
                }}>
                  {ticker}
                </span>
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <p style={{
                fontSize: "30px",
                fontWeight: 700,
                color: "#e8dcc0",
                fontFamily: "var(--font-display)",
                letterSpacing: "-0.02em",
                lineHeight: 1,
                marginBottom: "6px",
                fontVariantNumeric: "tabular-nums",
              }}>
                R$ {quote.regularMarketPrice?.toFixed(2).replace(".", ",")}
              </p>
              <p style={{
                fontSize: "12px",
                fontWeight: 600,
                color: priceColor,
                fontFamily: "var(--font-sans)",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "4px",
                fontVariantNumeric: "tabular-nums",
              }}>
                {positive ? <TrendingUp size={12} aria-hidden="true" /> : <TrendingDown size={12} aria-hidden="true" />}
                R$ {Math.abs(quote.regularMarketChange ?? 0).toFixed(2).replace(".", ",")} ({positive ? "+" : ""}{quote.regularMarketChangePercent?.toFixed(2)}%)
              </p>
            </div>
          </div>

          {/* 4 chips */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
            <BazinChip bazin={bazin} currentPrice={quote.regularMarketPrice ?? 0} />
            <MetricChip color="#4F8A82" label="Dividend Yield" value={metrics.dy !== null ? `${metrics.dy.toFixed(2)}%` : "—"} sub="Renda passiva anual" />
            <MetricChip color="#5E6B8C" label="P/L" value={metrics.pl !== null ? metrics.pl.toFixed(2) : "—"} sub="Múltiplo" />
            <MetricChip color="#C9A84C" label="P/VP" value={metrics.pvp !== null ? metrics.pvp.toFixed(2) : "—"} sub="Preço/Patrimônio" />
          </div>
        </div>

        {/* HISTÓRICO DE PREÇOS */}
        <Section>
          <SectionHeader title="Histórico de Preços">
            <div style={{ display: "flex", gap: "4px" }}>
              {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
                <PillBtn key={p} active={p === period} onClick={() => setPeriod(p)}>
                  {PERIOD_LABELS[p]}
                </PillBtn>
              ))}
            </div>
          </SectionHeader>
          <PriceChart
            history={quote.historicalDataPrice ?? []}
            positive={positive}
            low52w={quote.fiftyTwoWeekLow ?? null}
            high52w={quote.fiftyTwoWeekHigh ?? null}
            avg52w={technicals.avgPrice52w}
          />
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px",
            marginTop: "16px", paddingTop: "14px",
            borderTop: "1px solid rgba(201,168,76,0.06)",
          }}>
            <MiniStat label="Mínima 1A" value={quote.fiftyTwoWeekLow !== undefined ? `R$ ${quote.fiftyTwoWeekLow.toFixed(2).replace(".", ",")}` : "—"} color="#f87171" />
            <MiniStat label="Máxima 1A" value={quote.fiftyTwoWeekHigh !== undefined ? `R$ ${quote.fiftyTwoWeekHigh.toFixed(2).replace(".", ",")}` : "—"} color="#34d399" />
            <MiniStat
              label="RSI 14 dias"
              value={technicals.rsi14 !== null ? technicals.rsi14.toFixed(1) : "—"}
              color={rsiColor(technicals.rsi14)}
            />
            <MiniStat
              label="RSI 200 dias"
              value={technicals.rsi200 !== null ? technicals.rsi200.toFixed(1) : "—"}
              color={rsiColor(technicals.rsi200)}
            />
          </div>
        </Section>

        {/* INDICADORES FUNDAMENTALISTAS */}
        <Section>
          <SectionHeader title="Indicadores Fundamentalistas">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {isFinance && <SectorBadge label="Setor Financeiro" />}
              <select disabled style={{
                background: "#0d0b07",
                border: "1px solid rgba(201,168,76,0.1)",
                borderRadius: "6px", padding: "5px 10px",
                color: "#9a8a6a", fontSize: "11px",
                fontFamily: "var(--font-sans)", outline: "none",
              }}>
                <option>Sem comparação</option>
              </select>
            </div>
          </SectionHeader>
          {isFinance ? (
            <FinanceIndicators metrics={metrics} quote={quote} />
          ) : (
            <DefaultIndicators metrics={metrics} quote={quote} />
          )}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px",
            marginTop: "16px", paddingTop: "14px",
            borderTop: "1px solid rgba(201,168,76,0.06)",
          }}>
            <MiniStat label="Market Cap" value={fmtMoney(quote.marketCap)} color="#9a8a6a" />
            {isFinance ? (
              <MiniStat label="Ativos Totais" value={fmtMoney(metrics.totalAssets)} color="#9a8a6a" />
            ) : (
              <MiniStat label="Qtd. de Ações" value={metrics.sharesOutstanding ? fmtBig(metrics.sharesOutstanding) : "—"} color="#9a8a6a" />
            )}
            <MiniStat label="Beta" value={fmtNum(quote.defaultKeyStatistics?.beta, 2)} color="#9a8a6a" />
            <MiniStat label="Vol. Médio (90d)" value={technicals.avgVolume90d !== null ? fmtBig(technicals.avgVolume90d) : "—"} color="#9a8a6a" />
          </div>
          {isFinance && (
            <div style={{
              marginTop: "14px",
              background: "rgba(79,138,130,0.06)",
              border: "1px solid rgba(79,138,130,0.18)",
              borderRadius: "10px",
              padding: "10px 14px",
              display: "flex", gap: "10px", alignItems: "flex-start",
            }}>
              <Info size={13} style={{ color: "#4F8A82", marginTop: "2px", flexShrink: 0 }} />
              <p style={{ fontSize: "11px", color: "#a5b8b3", fontFamily: "var(--font-sans)", lineHeight: 1.55, margin: 0 }}>
                Bancos não usam EBITDA, dívida líquida ou liquidez corrente como métricas centrais.
                Os indicadores acima foram adaptados para o setor: <strong style={{ color: "#c8b89a" }}>alavancagem</strong> (ativos/PL),
                <strong style={{ color: "#c8b89a" }}> capital ratio</strong> (PL/ativos, proxy de Basileia) e
                <strong style={{ color: "#c8b89a" }}> ROE/ROA</strong> são os termômetros corretos.
              </p>
            </div>
          )}
        </Section>

        {/* CHECKLIST DO INVESTIDOR */}
        <Section>
          <div style={{
            background: "linear-gradient(135deg, rgba(201,168,76,0.05), rgba(139,92,246,0.05))",
            border: "1px solid rgba(201,168,76,0.15)",
            borderRadius: "12px", padding: "20px",
            marginBottom: "12px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              <div>
                <p style={{ fontSize: "14px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-display)", marginBottom: "4px" }}>
                  Checklist do Investidor
                </p>
                <p style={{ fontSize: "11px", color: "#a09068", fontFamily: "var(--font-sans)" }}>
                  {checklist.passedTotal} de {checklist.total} critérios atendidos
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{
                  fontSize: "26px", fontWeight: 700,
                  color: scoreColor(checklist.scorePct),
                  fontFamily: "var(--font-display)", lineHeight: 1,
                }}>
                  {checklist.scorePct}%
                </p>
                <p style={{ fontSize: "10px", color: scoreColor(checklist.scorePct), fontFamily: "var(--font-sans)", marginTop: "2px" }}>
                  {scoreLabel(checklist.scorePct)}
                </p>
              </div>
            </div>
            <div style={{
              height: "5px", background: "rgba(201,168,76,0.08)",
              borderRadius: "3px", overflow: "hidden",
            }}>
              <div style={{
                width: `${checklist.scorePct}%`, height: "100%",
                background: `linear-gradient(90deg, ${scoreColor(checklist.scorePct)}, ${scoreColor(Math.min(100, checklist.scorePct + 20))})`,
                borderRadius: "3px",
              }} />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {checklist.groups.map((g) => (
              <ChecklistGroup key={g.title} group={g} />
            ))}
          </div>

          <div style={{
            background: "rgba(201,168,76,0.05)",
            border: "1px solid var(--border-soft)",
            borderRadius: "10px", padding: "12px 16px",
            marginTop: "12px",
            display: "flex", gap: "10px", alignItems: "flex-start",
          }}>
            <Info size={14} style={{ color: "var(--gold)", marginTop: "2px", flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: "12px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-sans)", marginBottom: "2px" }}>
                Dica do Investidor
              </p>
              <p style={{ fontSize: "11px", color: "#9a8a9a", fontFamily: "var(--font-sans)", lineHeight: 1.55 }}>
                Use este checklist como guia, não como única referência. Combine com sua análise técnica, sentimento de mercado e objetivos pessoais antes de tomar uma decisão de investimento.
              </p>
            </div>
          </div>
        </Section>

        {/* COMPARAÇÃO DE ATIVOS */}
        <Section>
          <SectionHeader title="Comparação de Ativos">
            {quote.summaryProfile?.industry && comparados.length > 1 && (
              <span style={{
                fontSize: "10px",
                fontWeight: 600,
                color: "#a09068",
                background: "rgba(201,168,76,0.06)",
                border: "1px solid rgba(201,168,76,0.12)",
                padding: "4px 10px",
                borderRadius: "12px",
                fontFamily: "var(--font-sans)",
              }}>
                Setor: <strong style={{ color: "#C9A84C" }}>{quote.summaryProfile.industry}</strong>
              </span>
            )}
          </SectionHeader>
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            <input
              value={novoTicker}
              onChange={(e) => setNovoTicker(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter" && novoTicker.trim() && !comparados.includes(novoTicker.trim())) {
                  setComparados([...comparados, novoTicker.trim()]);
                  setNovoTicker("");
                }
              }}
              placeholder="Digite o ticker (ex: PETR4)"
              style={{
                flex: 1, height: "36px",
                background: "#0d0b07",
                border: "1px solid rgba(201,168,76,0.12)",
                borderRadius: "8px", padding: "0 12px",
                color: "#e8dcc0", fontSize: "12px",
                fontFamily: "var(--font-sans)", outline: "none",
              }}
            />
            <button
              onClick={() => {
                if (novoTicker.trim() && !comparados.includes(novoTicker.trim())) {
                  setComparados([...comparados, novoTicker.trim()]);
                  setNovoTicker("");
                }
              }}
              style={{
                background: "linear-gradient(135deg, #C9A84C 0%, #A07820 100%)",
                border: "none",
                borderRadius: "8px",
                padding: "0 16px",
                minHeight: "36px",
                color: "#0d0b07",
                fontSize: "11px",
                fontWeight: 700,
                fontFamily: "var(--font-sans)",
                letterSpacing: "0.04em",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <Plus size={12} aria-hidden="true" /> Adicionar
            </button>
          </div>
          <div role="list" aria-label="Tickers em comparação"
            style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
            {comparados.map((t) => {
              const isPrimary = t === ticker;
              return (
                <div
                  key={t}
                  role="listitem"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    minHeight: "28px",
                    background: isPrimary ? "rgba(201,168,76,0.14)" : "rgba(201,168,76,0.04)",
                    border: `1px solid ${isPrimary ? "rgba(201,168,76,0.4)" : "rgba(201,168,76,0.12)"}`,
                    borderRadius: "6px",
                    padding: "4px 4px 4px 10px",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: isPrimary ? "#C9A84C" : "#c8b89a",
                    fontFamily: "var(--font-sans)",
                    letterSpacing: "0.04em",
                  }}
                >
                  <span>{t}</span>
                  {!isPrimary && (
                    <button
                      onClick={() => setComparados(comparados.filter((x) => x !== t))}
                      aria-label={`Remover ${t} da comparação`}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "inherit",
                        cursor: "pointer",
                        padding: "4px",
                        marginLeft: "2px",
                        display: "flex",
                        alignItems: "center",
                        borderRadius: "4px",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(201,168,76,0.1)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <X size={11} aria-hidden="true" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <ComparadorTable
            tickers={comparados}
            primaryTicker={ticker}
            primaryQuote={quote}
          />
        </Section>

        {/* RADAR DE DIVIDENDOS */}
        <Section>
          <SectionHeader title={`Radar de Dividendos — ${ticker}`}>
            <CalendarIcon size={14} style={{ color: "#C9A84C" }} />
          </SectionHeader>
          <p style={{
            fontSize: "12px",
            color: "#a09068",
            fontFamily: "var(--font-sans)",
            lineHeight: 1.55,
            marginBottom: "14px",
          }}>
            Com base no histórico de proventos de <strong style={{ color: "#e8dcc0" }}>{ticker}</strong>,
            o Radar de Dividendos projeta quais os possíveis meses de pagamento no futuro.
          </p>
          <RadarDividendos cashDividends={quote.dividendsData?.cashDividends ?? []} />
        </Section>

        {/* PAYOUT — bar (lucro) + linhas (payout, DY) */}
        <PayoutSection quote={quote} ticker={ticker} />

        {/* HISTÓRICO DE DIVIDENDOS */}
        <Section>
          <SectionHeader title={`Histórico de Dividendos — ${ticker}`}>
            <div style={{ display: "flex", gap: "4px" }}>
              <PillBtn active={divChartType === "yield"} onClick={() => setDivChartType("yield")}>
                Dividend Yield
              </PillBtn>
              <PillBtn active={divChartType === "value"} onClick={() => setDivChartType("value")}>
                Valor (R$)
              </PillBtn>
            </div>
          </SectionHeader>
          <div style={{ display: "flex", gap: "20px", marginBottom: "12px" }}>
            <DivStat label="DY atual" value={metrics.dy !== null ? `${metrics.dy.toFixed(2)}%` : "—"} accent="#C9A84C" />
            <DivStat label="DY médio em 5 anos" value={dividends.avg5y !== null ? `${dividends.avg5y.toFixed(2)}%` : "—"} accent="#C9A84C" />
            <DivStat label="DY médio em 10 anos" value={dividends.avg10y !== null ? `${dividends.avg10y.toFixed(2)}%` : "—"} accent="#C9A84C" />
          </div>
          <DividendBars data={dividends.byYear} type={divChartType} price={quote.regularMarketPrice ?? 0} />
        </Section>

        {/* CALENDÁRIO DE DIVIDENDOS */}
        <Section>
          <SectionHeader title={`Calendário de Dividendos — ${ticker}`}>
            <CalendarIcon size={14} style={{ color: "#C9A84C" }} />
          </SectionHeader>
          {dividends.list.length === 0 ? (
            <Empty text="Nenhum provento registrado para este ativo." />
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {dividends.list.slice(calendarPage * 8, (calendarPage + 1) * 8).map((d, i) => (
                  <DivRow key={i} dividend={d} />
                ))}
              </div>
              {dividends.list.length > 8 && (
                <Pagination
                  page={calendarPage}
                  total={Math.ceil(dividends.list.length / 8)}
                  onChange={setCalendarPage}
                />
              )}
            </>
          )}
        </Section>

        {/* RECEITAS E LUCROS */}
        {incomeData.length > 0 && (
          <Section>
            <SectionHeader title="Receitas e Lucros" />
            <RevenueChart data={incomeData} />
            <div style={{ display: "flex", gap: "16px", justifyContent: "center", marginTop: "12px" }}>
              <LegendItem color="#34d399" label="Receita Líquida" />
              <LegendItem color="#C58A3D" label="Lucro Líquido" />
            </div>
          </Section>
        )}

        {/* SOBRE A EMPRESA */}
        {quote.summaryProfile?.longBusinessSummary && (
          <Section>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <Building2 size={14} style={{ color: "#C9A84C" }} />
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-display)" }}>
                Sobre a Empresa
              </h3>
            </div>
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "12px" }}>
              {quote.logourl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={quote.logourl} alt="" style={{ width: "44px", height: "44px", borderRadius: "10px", background: "#fff", padding: "4px", objectFit: "contain" }} />
              )}
              <div>
                <p style={{ fontSize: "14px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-sans)", marginBottom: "2px" }}>
                  {quote.longName ?? quote.shortName}
                </p>
                <p style={{ fontSize: "11px", color: "#a09068", fontFamily: "var(--font-sans)" }}>
                  {quote.summaryProfile.sector ?? "—"} {quote.summaryProfile.industry && `· ${quote.summaryProfile.industry}`}
                </p>
              </div>
            </div>
            <p style={{
              fontSize: "13px", color: "#c8b89a",
              fontFamily: "var(--font-sans)", lineHeight: 1.7,
              marginBottom: "12px",
            }}>
              {quote.summaryProfile.longBusinessSummary}
            </p>
            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", paddingTop: "12px", borderTop: "1px solid rgba(201,168,76,0.06)" }}>
              {quote.summaryProfile.website && (
                <a href={quote.summaryProfile.website} target="_blank" rel="noopener noreferrer" style={{
                  fontSize: "11px", color: "#C9A84C", fontFamily: "var(--font-sans)",
                  textDecoration: "none", display: "flex", alignItems: "center", gap: "4px",
                }}>
                  Website <ExternalLink size={10} />
                </a>
              )}
              {quote.summaryProfile.fullTimeEmployees && (
                <span style={{ fontSize: "11px", color: "#a09068", fontFamily: "var(--font-sans)" }}>
                  {quote.summaryProfile.fullTimeEmployees.toLocaleString("pt-BR")} funcionários
                </span>
              )}
            </div>
          </Section>
        )}

        {/* DADOS / INFORMAÇÕES */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
          <Section noMargin>
            <h4 style={{ fontSize: "12px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-sans)", marginBottom: "12px" }}>
              Dados sobre a Empresa
            </h4>
            <DataRow label="Nome" value={quote.longName ?? quote.shortName ?? "—"} />
            <DataRow label="Setor" value={quote.summaryProfile?.sector ?? "—"} />
            <DataRow label="Segmento" value={quote.summaryProfile?.industry ?? "—"} />
            <DataRow label="Funcionários" value={quote.summaryProfile?.fullTimeEmployees?.toLocaleString("pt-BR") ?? "—"} />
            {quote.summaryProfile?.website && (
              <DataRow label="Website" value={
                <a href={quote.summaryProfile.website} target="_blank" rel="noopener noreferrer" style={{ color: "#C9A84C", textDecoration: "none" }}>
                  {quote.summaryProfile.website.replace(/^https?:\/\//, "")}
                </a>
              } />
            )}
          </Section>
          <Section noMargin>
            <h4 style={{ fontSize: "12px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-sans)", marginBottom: "12px" }}>
              Informações da Empresa
            </h4>
            <DataRow label="Valor de Mercado" value={fmtMoney(quote.marketCap)} />
            <DataRow label="Patrimônio Líquido" value={fmtMoney(metrics.equity)} />
            <DataRow label="Nº Total de Papéis" value={metrics.sharesOutstanding ? fmtBig(metrics.sharesOutstanding) : "—"} />
            <DataRow label="Dívida Bruta" value={fmtMoney(quote.financialData?.totalDebt)} />
            <DataRow label="Dívida Líquida" value={fmtMoney(metrics.netDebt)} />
            <DataRow label="Disponibilidade" value={fmtMoney(quote.financialData?.totalCash)} />
          </Section>
        </div>

        {/* NOTÍCIAS */}
        <Section>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <Newspaper size={14} style={{ color: "#C9A84C" }} />
            <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-display)" }}>
              Notícias
            </h3>
          </div>
          <NewsList ticker={ticker} />
        </Section>

        {/* DISCUSSÃO */}
        <AssetDiscussion
          ticker={ticker}
          userEmail={userEmail}
          userName={userName}
          userAvatar={userAvatar}
        />
      </div>
    </div>
  );
}

// ─── Bazin (preço teto) ──────────────────────────────────────────────────────

interface BazinResult {
  ceiling: number;        // R$ — preço teto
  avgDividends: number;   // R$ — média anual de dividendos por ação
  yearsUsed: number;      // 1..5 — quantos anos completos entraram na média
  yieldRate: number;      // 0.06 (6%)
}

/**
 * Fórmula clássica de Décio Bazin:
 *   Preço Teto = Média anual de dividendos por ação (5 anos) / DY desejado (6%)
 *
 * Implementação:
 *   - Agrupa cashDividends por ano calendário
 *   - Usa os últimos 5 anos COMPLETOS (exclui o ano corrente, que é parcial)
 *   - Média só dos anos com pagamento; retorna null se não há base suficiente
 */
function bazinCeiling(divs: BrapiCashDividend[] | null | undefined): BazinResult | null {
  if (!divs || divs.length === 0) return null;
  const byYear = new Map<number, number>();
  for (const d of divs) {
    const date = d.paymentDate || d.approvedOn;
    if (!date) continue;
    const y = new Date(date).getFullYear();
    if (isNaN(y)) continue;
    byYear.set(y, (byYear.get(y) ?? 0) + (d.rate ?? 0));
  }
  const currentYear = new Date().getFullYear();
  const values: number[] = [];
  for (let y = currentYear - 5; y < currentYear; y++) {
    const v = byYear.get(y);
    if (v !== undefined && v > 0) values.push(v);
  }
  if (values.length === 0) return null;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const yieldRate = 0.06;
  return {
    ceiling: avg / yieldRate,
    avgDividends: avg,
    yearsUsed: values.length,
    yieldRate,
  };
}

// ─── Calculations ─────────────────────────────────────────────────────────────

interface Metrics {
  pl: number | null;
  pvp: number | null;
  dy: number | null;
  payout: number | null;
  evEbit: number | null;
  netDebt: number | null;
  netDebtToEquity: number | null;
  netDebtToEbitda: number | null;
  liabilitiesToAssets: number | null;
  netIncome: number | null;
  equity: number | null;
  sharesOutstanding: number | null;
  // Específicos pra setor financeiro
  totalAssets: number | null;
  leverage: number | null;       // Ativos / PL
  capitalRatio: number | null;   // PL / Ativos (proxy de Basileia)
  revenuePerShare: number | null;
  totalRevenue: number | null;
}

function isFinanceSector(q: BrapiQuoteFull | null): boolean {
  if (!q?.summaryProfile) return false;
  const s = (q.summaryProfile.sector ?? "").toLowerCase();
  const i = (q.summaryProfile.industry ?? "").toLowerCase();
  return s.includes("financ") || s.includes("seguros") ||
    i.includes("banco") || i.includes("bank") || i.includes("seguradora");
}

function calculateMetrics(q: BrapiQuoteFull | null): Metrics {
  if (!q) return {
    pl: null, pvp: null, dy: null, payout: null, evEbit: null,
    netDebt: null, netDebtToEquity: null, netDebtToEbitda: null,
    liabilitiesToAssets: null, netIncome: null, equity: null,
    sharesOutstanding: null,
    totalAssets: null, leverage: null, capitalRatio: null,
    revenuePerShare: null, totalRevenue: null,
  };

  const price = q.regularMarketPrice ?? 0;
  const pl = q.priceEarnings ?? q.defaultKeyStatistics?.trailingPE ?? null;
  const pvp = q.defaultKeyStatistics?.priceToBook ?? null;

  // DY: somar dividends dos últimos 12 meses / preço atual
  const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
  const last12m = (q.dividendsData?.cashDividends ?? []).filter((d) => {
    const date = new Date(d.paymentDate || d.approvedOn || 0).getTime();
    return date > oneYearAgo;
  });
  const sumLast12 = last12m.reduce((acc, d) => acc + (d.rate ?? 0), 0);
  const dy = price > 0 && sumLast12 > 0 ? (sumLast12 / price) * 100 : null;

  // Payout = dividendos / lucro
  const lpa = q.earningsPerShare ?? null;
  const payout = lpa !== null && lpa > 0 && sumLast12 > 0 ? (sumLast12 / lpa) * 100 : null;

  // EV/EBIT — fallback: revenue × operatingMargin quando IS vem vazio (comum em
  // tickers que a brapi não popula incomeStatementHistory).
  const ev = q.defaultKeyStatistics?.enterpriseValue ?? null;
  const ebitFromIS = (q.incomeStatementHistory?.incomeStatementHistory ?? [])[0]?.ebit ?? null;
  const ebitFromMargin = q.financialData?.totalRevenue != null && q.financialData?.operatingMargins != null
    ? q.financialData.totalRevenue * q.financialData.operatingMargins
    : null;
  const ebit = ebitFromIS ?? ebitFromMargin;
  const evEbit = ev !== null && ebit !== null && ebit > 0 ? ev / ebit : null;

  // Net Debt = totalDebt - totalCash
  const totalDebt = q.financialData?.totalDebt ?? null;
  const totalCash = q.financialData?.totalCash ?? null;
  const netDebt = totalDebt !== null && totalCash !== null ? totalDebt - totalCash : null;

  // Equity / Ativos / Passivos: brapi frequentemente retorna balanceSheet vazio.
  // Fallback: equity ≈ bookValue × shares; totalAssets de defaultKeyStatistics;
  // totalLiab derivado da identidade contábil (ativos − PL).
  const bs = q.balanceSheetHistory?.balanceSheetStatements?.[0];
  const equity = bs?.totalStockholderEquity ?? null;
  const totalAssets = bs?.totalAssets ?? null;
  const totalLiab = bs?.totalLiab ?? null;
  const ebitda = q.financialData?.ebitda ?? null;
  const netDebtToEbitda = netDebt !== null && ebitda !== null && ebitda > 0 ? netDebt / ebitda : null;

  // Lucro: prioriza incomeStatementHistory; fallback para defaultKeyStatistics.netIncomeToCommon
  // (bancos costumam vir com IS vazio na brapi)
  const netIncome = (q.incomeStatementHistory?.incomeStatementHistory ?? [])[0]?.netIncome
    ?? q.defaultKeyStatistics?.netIncomeToCommon
    ?? null;

  // Qtd. de ações: sharesOutstanding direto > defaultKeyStatistics > fallback marketCap/preço
  const sharesOutstanding = q.sharesOutstanding
    ?? q.defaultKeyStatistics?.sharesOutstanding
    ?? (q.marketCap && price > 0 ? q.marketCap / price : null);

  // Equity: prioriza balanceSheet; fallback = bookValue × shares
  const equityFromBV = q.defaultKeyStatistics?.bookValue && sharesOutstanding
    ? q.defaultKeyStatistics.bookValue * sharesOutstanding
    : null;
  const finalEquity = equity ?? equityFromBV;

  // Total Assets: defaultKeyStatistics > balanceSheet
  const finalTotalAssets = q.defaultKeyStatistics?.totalAssets ?? totalAssets;

  // Alavancagem patrimonial = Ativos / PL (típico de banco: 8–14×)
  const leverage = finalTotalAssets !== null && finalEquity !== null && finalEquity > 0
    ? finalTotalAssets / finalEquity
    : null;

  // Capital Ratio = PL / Ativos (proxy do índice de Basileia; banco saudável: ≥ 8%)
  const capitalRatio = finalTotalAssets !== null && finalEquity !== null && finalTotalAssets > 0
    ? finalEquity / finalTotalAssets
    : null;

  // Dív.Líq./PL agora usa finalEquity (com fallback bookValue × shares)
  const netDebtToEquity = netDebt !== null && finalEquity !== null && finalEquity > 0
    ? netDebt / finalEquity
    : null;

  // Passivos/Ativos: BS direto > derivado da identidade contábil (totalAssets − equity)
  const totalLiabFromBS = totalLiab;
  const totalLiabDerived = finalTotalAssets !== null && finalEquity !== null
    ? finalTotalAssets - finalEquity
    : null;
  const finalTotalLiab = totalLiabFromBS ?? totalLiabDerived;
  const liabilitiesToAssets = finalTotalLiab !== null && finalTotalAssets !== null && finalTotalAssets > 0
    ? finalTotalLiab / finalTotalAssets
    : null;

  const totalRevenue = q.financialData?.totalRevenue ?? null;
  const revenuePerShare = q.financialData?.revenuePerShare
    ?? q.defaultKeyStatistics?.revenuePerShare
    ?? (totalRevenue && sharesOutstanding ? totalRevenue / sharesOutstanding : null);

  return {
    pl, pvp, dy, payout, evEbit,
    netDebt, netDebtToEquity, netDebtToEbitda,
    liabilitiesToAssets, netIncome, equity: finalEquity,
    sharesOutstanding,
    totalAssets: finalTotalAssets,
    leverage,
    capitalRatio,
    revenuePerShare,
    totalRevenue,
  };
}

// ─── Indicadores técnicos ─────────────────────────────────────────────────────

/**
 * RSI (Wilder): usa SMA simples nos primeiros `period` candles e depois
 * smoothing exponencial de Wilder. Retorna null se o histórico é insuficiente.
 */
function computeRSI(closes: number[], period: number): number | null {
  if (closes.length < period + 1) return null;
  let gainSum = 0;
  let lossSum = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gainSum += diff;
    else lossSum += -diff;
  }
  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(diff, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-diff, 0)) / period;
  }
  if (avgLoss === 0) return avgGain === 0 ? 50 : 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function avgLastN(arr: number[], n: number): number | null {
  if (arr.length === 0) return null;
  const slice = arr.slice(-n);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

function rsiColor(rsi: number | null): string {
  if (rsi === null) return "#9a8a6a";
  if (rsi >= 70) return "#f87171"; // sobrecomprado
  if (rsi <= 30) return "#34d399"; // sobrevendido
  return "#C9A84C";                // neutro
}

// ─── Checklist ────────────────────────────────────────────────────────────────

interface ChecklistItem {
  label: string;
  description: string;
  passed: boolean;
  /** Valor real medido, formatado pra exibição (ex: "26,49%", "5,34", "R$ 12,3 Bi"). Opcional. */
  current?: string;
}

interface ChecklistGroupT {
  title: string;
  /** Chave da família lucide do ícone do grupo. */
  iconKey: "calculator" | "shield" | "coins" | "trending" | "rocket" | "bank";
  items: ChecklistItem[];
  passed: number;
  total: number;
}

interface BuildChecklistArgs {
  metrics: Metrics;
  quote: BrapiQuoteFull;
  dividends: DivList;
  technicals: Technicals;
}

// ─── Helpers de formatação dos valores atuais ───────────────────────────────
function fmtPctFromDec(v: number | null | undefined): string | undefined {
  if (v === null || v === undefined || isNaN(v)) return undefined;
  return `${(v * 100).toFixed(2).replace(".", ",")}%`;
}
function fmtPctFromAlready(v: number | null | undefined): string | undefined {
  if (v === null || v === undefined || isNaN(v)) return undefined;
  return `${v.toFixed(2).replace(".", ",")}%`;
}
function fmtNumStr(v: number | null | undefined, dec = 2): string | undefined {
  if (v === null || v === undefined || isNaN(v)) return undefined;
  return v.toFixed(dec).replace(".", ",");
}
function fmtMoneyShort(v: number | null | undefined): string | undefined {
  if (v === null || v === undefined || isNaN(v)) return undefined;
  if (Math.abs(v) >= 1e9) return `R$ ${(v / 1e9).toFixed(2).replace(".", ",")} Bi`;
  if (Math.abs(v) >= 1e6) return `R$ ${(v / 1e6).toFixed(2).replace(".", ",")} Mi`;
  if (Math.abs(v) >= 1e3) return `R$ ${(v / 1e3).toFixed(2).replace(".", ",")} mil`;
  return `R$ ${v.toFixed(2).replace(".", ",")}`;
}
/** Histórico de dividendos consistente: anos completos (excl. corrente) com pagamento. */
function dividendYearsPaid(dividends: DivList): { paid: number; window: number } {
  const currentYear = new Date().getFullYear();
  const window = 5;
  const set = new Set<number>();
  for (const d of dividends.byYear ?? []) {
    if (d.year >= currentYear - window && d.year < currentYear && d.total > 0) {
      set.add(d.year);
    }
  }
  return { paid: set.size, window };
}

function buildDefaultChecklist(args: BuildChecklistArgs): ChecklistGroupT[] {
  const { metrics: m, quote: q, dividends, technicals } = args;
  const fd = q.financialData;
  const roe = fd?.returnOnEquity ?? null;
  const profitMargins = fd?.profitMargins ?? null;
  const currentRatio = fd?.currentRatio ?? null;
  const fcf = fd?.freeCashflow ?? null;
  const revGrowth = fd?.revenueGrowth ?? null;
  const mcap = q.marketCap ?? null;
  const price = q.regularMarketPrice ?? 0;
  const avgVol90d = technicals.avgVolume90d;
  const liquidityRS = avgVol90d !== null && price > 0 ? avgVol90d * price : null;

  const histPaid = dividendYearsPaid(dividends);

  return [
    {
      title: "Análise Fundamentalista",
      iconKey: "calculator",
      items: [
        {
          label: "P/L Atrativo",
          description: "P/L menor que 15",
          passed: m.pl !== null && m.pl > 0 && m.pl < 15,
          current: fmtNumStr(m.pl),
        },
        {
          label: "P/VP Atrativo",
          description: "Preço/Valor Patrimonial menor que 1,5",
          passed: m.pvp !== null && m.pvp > 0 && m.pvp < 1.5,
          current: fmtNumStr(m.pvp),
        },
        {
          label: "ROE Elevado",
          description: "Retorno sobre o Patrimônio acima de 15%",
          passed: roe !== null && roe >= 0.15,
          current: fmtPctFromDec(roe),
        },
        {
          label: "Margem Líquida Forte",
          description: "Margem líquida acima de 10%",
          passed: profitMargins !== null && profitMargins >= 0.1,
          current: fmtPctFromDec(profitMargins),
        },
      ],
      passed: 0, total: 4,
    },
    {
      title: "Saúde Financeira",
      iconKey: "shield",
      items: [
        {
          label: "Dívida Controlada",
          description: "Dív. Líq./EBITDA menor que 3",
          passed: m.netDebtToEbitda !== null && m.netDebtToEbitda < 3,
          current: fmtNumStr(m.netDebtToEbitda),
        },
        {
          label: "Liquidez Corrente OK",
          description: "Liquidez corrente acima de 1",
          passed: currentRatio !== null && currentRatio > 1,
          current: fmtNumStr(currentRatio),
        },
        {
          label: "Passivos sob Controle",
          description: "Passivos/Ativos abaixo de 60%",
          passed: m.liabilitiesToAssets !== null && m.liabilitiesToAssets < 0.6,
          current: fmtPctFromDec(m.liabilitiesToAssets),
        },
        {
          label: "Free Cash Flow Positivo",
          description: "Geração de caixa livre positiva",
          passed: fcf !== null && fcf > 0,
          current: fmtMoneyShort(fcf),
        },
      ],
      passed: 0, total: 4,
    },
    {
      title: "Retorno ao Acionista",
      iconKey: "coins",
      items: [
        {
          label: "Dividend Yield Forte",
          description: "DY igual ou acima de 6%",
          passed: m.dy !== null && m.dy >= 6,
          current: fmtPctFromAlready(m.dy),
        },
        {
          label: "Payout Saudável",
          description: "Payout entre 30% e 70%",
          passed: m.payout !== null && m.payout >= 30 && m.payout <= 70,
          current: fmtPctFromAlready(m.payout),
        },
        {
          label: "Histórico Consistente",
          description: "Pagou em pelo menos 4 dos últimos 5 anos",
          passed: histPaid.paid >= 4,
          current: `${histPaid.paid}/${histPaid.window} anos`,
        },
      ],
      passed: 0, total: 3,
    },
    {
      title: "Posicionamento de Mercado",
      iconKey: "trending",
      items: [
        {
          label: "Mid/Large Cap",
          description: "Valor de mercado acima de R$ 5 Bi",
          passed: mcap !== null && mcap >= 5e9,
          current: fmtMoneyShort(mcap),
        },
        {
          label: "Liquidez Adequada",
          description: "Volume médio diário acima de R$ 10 Mi",
          passed: liquidityRS !== null && liquidityRS >= 1e7,
          current: fmtMoneyShort(liquidityRS),
        },
        {
          label: "Receita em Crescimento",
          description: "Crescimento de receita positivo",
          passed: revGrowth !== null && revGrowth > 0,
          current: fmtPctFromDec(revGrowth),
        },
      ],
      passed: 0, total: 3,
    },
  ];
}

function buildFinanceChecklist(args: BuildChecklistArgs): ChecklistGroupT[] {
  const { metrics: m, quote: q } = args;
  const fd = q.financialData;
  const roe = fd?.returnOnEquity ?? null;
  const roa = fd?.returnOnAssets ?? null;
  const profitMargins = fd?.profitMargins ?? null;
  const revGrowth = fd?.revenueGrowth ?? null;
  const earnGrowth = fd?.earningsGrowth ?? null;
  const mcap = q.marketCap ?? null;

  return [
    {
      title: "Valuation Bancário",
      iconKey: "calculator",
      items: [
        {
          label: "P/L Atrativo",
          description: "P/L abaixo de 12 (típico de banco)",
          passed: m.pl !== null && m.pl > 0 && m.pl < 12,
          current: fmtNumStr(m.pl),
        },
        {
          label: "P/VP com Desconto",
          description: "P/VP menor que 1,2",
          passed: m.pvp !== null && m.pvp > 0 && m.pvp < 1.2,
          current: fmtNumStr(m.pvp),
        },
        {
          label: "Dividend Yield Forte",
          description: "DY igual ou acima de 6%",
          passed: m.dy !== null && m.dy >= 6,
          current: fmtPctFromAlready(m.dy),
        },
        {
          label: "Payout Saudável",
          description: "Payout entre 30% e 70%",
          passed: m.payout !== null && m.payout >= 30 && m.payout <= 70,
          current: fmtPctFromAlready(m.payout),
        },
      ],
      passed: 0, total: 4,
    },
    {
      title: "Saúde Bancária",
      iconKey: "bank",
      items: [
        {
          label: "Capital Ratio Adequado",
          description: "PL/Ativos acima de 8% (proxy do índice de Basileia)",
          passed: m.capitalRatio !== null && m.capitalRatio >= 0.08,
          current: fmtPctFromDec(m.capitalRatio),
        },
        {
          label: "Alavancagem Prudente",
          description: "Ativos/PL abaixo de 14× — bancos saudáveis: 8× a 14×",
          passed: m.leverage !== null && m.leverage > 0 && m.leverage < 14,
          current: m.leverage !== null ? `${m.leverage.toFixed(2).replace(".", ",")}×` : undefined,
        },
        {
          label: "Lucro Positivo",
          description: "Lucro líquido positivo no último período",
          passed: m.netIncome !== null && m.netIncome > 0,
          current: fmtMoneyShort(m.netIncome),
        },
        {
          label: "Patrimônio Sólido",
          description: "Patrimônio líquido positivo",
          passed: m.equity !== null && m.equity > 0,
          current: fmtMoneyShort(m.equity),
        },
      ],
      passed: 0, total: 4,
    },
    {
      title: "Rentabilidade",
      iconKey: "coins",
      items: [
        {
          label: "ROE Elevado",
          description: "ROE acima de 15% — retorno forte sobre o capital",
          passed: roe !== null && roe >= 0.15,
          current: fmtPctFromDec(roe),
        },
        {
          label: "ROA Sólido",
          description: "ROA acima de 1% — eficiência sobre os ativos",
          passed: roa !== null && roa >= 0.01,
          current: fmtPctFromDec(roa),
        },
        {
          label: "Margem Líquida Forte",
          description: "Margem líquida acima de 20% (típico de banco)",
          passed: profitMargins !== null && profitMargins >= 0.2,
          current: fmtPctFromDec(profitMargins),
        },
      ],
      passed: 0, total: 3,
    },
    {
      title: "Crescimento e Mercado",
      iconKey: "rocket",
      items: [
        {
          label: "Receita em Crescimento",
          description: "Crescimento de receita positivo",
          passed: revGrowth !== null && revGrowth > 0,
          current: fmtPctFromDec(revGrowth),
        },
        {
          label: "Lucro em Crescimento",
          description: "Crescimento de lucro positivo",
          passed: earnGrowth !== null && earnGrowth > 0,
          current: fmtPctFromDec(earnGrowth),
        },
        {
          label: "Banco de Grande Porte",
          description: "Valor de mercado acima de R$ 10 Bi",
          passed: mcap !== null && mcap >= 1e10,
          current: fmtMoneyShort(mcap),
        },
      ],
      passed: 0, total: 3,
    },
  ];
}

function buildChecklist(args: BuildChecklistArgs, isFinance: boolean): {
  groups: ChecklistGroupT[]; passedTotal: number; total: number; scorePct: number;
} {
  const groups: ChecklistGroupT[] = isFinance
    ? buildFinanceChecklist(args)
    : buildDefaultChecklist(args);

  let passedTotal = 0, total = 0;
  for (const g of groups) {
    g.passed = g.items.filter((i) => i.passed).length;
    passedTotal += g.passed;
    total += g.total;
  }
  const scorePct = total > 0 ? Math.round((passedTotal / total) * 100) : 0;
  return { groups, passedTotal, total, scorePct };
}

function scoreColor(pct: number): string {
  if (pct >= 85) return "#C9A84C";  // gold premium
  if (pct >= 65) return "#34d399";  // green
  if (pct >= 40) return "#C58A3D";  // amber
  return "#c46a6a";                 // muted red (era #f87171, agressivo demais)
}

function scoreLabel(pct: number): string {
  if (pct >= 85) return "Candidato excelente";
  if (pct >= 65) return "Candidato forte";
  if (pct >= 40) return "Candidato moderado";
  return "Candidato fraco";
}

// ─── Dividends ────────────────────────────────────────────────────────────────

interface DivList { list: BrapiCashDividend[]; byYear: { year: number; total: number }[]; avg5y: number | null; avg10y: number | null }

function buildDividends(q: BrapiQuoteFull | null): DivList {
  if (!q || !q.dividendsData?.cashDividends) {
    return { list: [], byYear: [], avg5y: null, avg10y: null };
  }
  const list = [...q.dividendsData.cashDividends].sort((a, b) => {
    const da = new Date(a.paymentDate || a.approvedOn || 0).getTime();
    const db = new Date(b.paymentDate || b.approvedOn || 0).getTime();
    return db - da;
  });

  const byYearMap = new Map<number, number>();
  for (const d of list) {
    const year = new Date(d.paymentDate || d.approvedOn || 0).getFullYear();
    if (!year || isNaN(year)) continue;
    byYearMap.set(year, (byYearMap.get(year) ?? 0) + (d.rate ?? 0));
  }
  const currentYear = new Date().getFullYear();
  const byYear = Array.from(byYearMap.entries())
    .filter(([y]) => y >= currentYear - 11 && y <= currentYear)
    .sort((a, b) => a[0] - b[0])
    .map(([year, total]) => ({ year, total }));

  const price = q.regularMarketPrice ?? 0;
  const calcAvg = (years: number) => {
    if (price <= 0) return null;
    const cutoff = currentYear - years;
    const totals = byYear.filter((y) => y.year > cutoff && y.year < currentYear).map((y) => y.total);
    if (totals.length === 0) return null;
    const avg = totals.reduce((a, b) => a + b, 0) / totals.length;
    return (avg / price) * 100;
  };

  return { list, byYear, avg5y: calcAvg(5), avg10y: calcAvg(10) };
}

// ─── Income (revenue & profit) ────────────────────────────────────────────────

interface IncomeYear { year: number; revenue: number; profit: number }

function buildIncomeData(q: BrapiQuoteFull | null): IncomeYear[] {
  if (!q?.incomeStatementHistory?.incomeStatementHistory) return [];
  return q.incomeStatementHistory.incomeStatementHistory
    .map((s) => ({
      year: new Date(s.endDate).getFullYear(),
      revenue: (s.totalRevenue ?? 0) / 1e9,
      profit: (s.netIncome ?? 0) / 1e9,
    }))
    .filter((s) => s.year && !isNaN(s.year))
    .sort((a, b) => a.year - b.year);
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: "6px",
        background: "none", border: "none", cursor: "pointer",
        color: "#a09068", fontSize: "13px",
        fontFamily: "var(--font-sans)", padding: 0, marginBottom: "16px",
        transition: "color 0.15s",
      }}
      className="aurum-hover-gold aurum-hover-transition"
    >
      <ChevronLeft size={15} /> Voltar para análise
    </button>
  );
}

// ─── RADAR DE DIVIDENDOS ──────────────────────────────────────────────────────

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function RadarDividendos({ cashDividends }: { cashDividends: BrapiCashDividend[] }) {
  const [mode, setMode] = useState<"com" | "pgto">("pgto");

  const monthsHit = useMemo(() => {
    const set = new Set<number>();
    for (const d of cashDividends) {
      const raw = mode === "com"
        ? d.lastDatePrior || d.approvedOn || d.paymentDate
        : d.paymentDate || d.approvedOn || d.lastDatePrior;
      if (!raw) continue;
      const t = new Date(raw).getTime();
      if (isNaN(t)) continue;
      const m = new Date(raw).getMonth();
      set.add(m);
    }
    return set;
  }, [cashDividends, mode]);

  const monthCount = useMemo(() => {
    const counts = new Array(12).fill(0);
    for (const d of cashDividends) {
      const raw = mode === "com"
        ? d.lastDatePrior || d.approvedOn || d.paymentDate
        : d.paymentDate || d.approvedOn || d.lastDatePrior;
      if (!raw) continue;
      const m = new Date(raw).getMonth();
      if (!isNaN(m)) counts[m] += 1;
    }
    return counts;
  }, [cashDividends, mode]);

  if (cashDividends.length === 0) {
    return <Empty text="Sem histórico de proventos para projetar." />;
  }

  return (
    <div>
      <div style={{ display: "flex", gap: "6px", marginBottom: "16px" }}>
        <PillBtn active={mode === "com"} onClick={() => setMode("com")}>Data Com</PillBtn>
        <PillBtn active={mode === "pgto"} onClick={() => setMode("pgto")}>Data Pagamento</PillBtn>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(6, 1fr)",
        gap: "10px",
      }}>
        {MONTH_LABELS.map((label, i) => {
          const has = monthsHit.has(i);
          const count = monthCount[i];
          return (
            <div
              key={label}
              style={{
                position: "relative",
                padding: "14px 8px 12px",
                background: has ? "rgba(201,168,76,0.08)" : "#0d0b07",
                border: `1px solid ${has ? "rgba(201,168,76,0.35)" : "rgba(201,168,76,0.05)"}`,
                borderRadius: "10px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.18s ease",
              }}
            >
              {has ? (
                <CheckCircle2 size={14} style={{ color: "#C9A84C" }} aria-hidden="true" />
              ) : (
                <span style={{ width: "14px", height: "14px", display: "inline-block" }} aria-hidden="true" />
              )}
              <span style={{
                fontSize: "11px",
                fontWeight: has ? 700 : 500,
                color: has ? "#C9A84C" : "#5e503d",
                fontFamily: "var(--font-sans)",
                letterSpacing: "0.04em",
                fontVariantNumeric: "tabular-nums",
              }}>
                {label}
              </span>
              {has && count > 1 && (
                <span style={{
                  fontSize: "9px",
                  fontWeight: 600,
                  color: "#a09068",
                  fontFamily: "var(--font-sans)",
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {count}×
                </span>
              )}
            </div>
          );
        })}
      </div>

      <p style={{
        fontSize: "10px",
        color: "#7a6d57",
        fontFamily: "var(--font-sans)",
        marginTop: "12px",
        lineHeight: 1.5,
      }}>
        Meses destacados são aqueles com pagamento histórico registrado. O número (ex: <strong style={{ color: "#a09068" }}>3×</strong>)
        indica quantas vezes a empresa pagou nesse mês ao longo do histórico disponível.
      </p>
    </div>
  );
}

// ─── PAYOUT (bar lucro + linhas payout/DY) ────────────────────────────────────

interface PayoutYear {
  year: number;
  netIncome: number;        // em bilhões
  divPerShare: number;
  totalDividends: number;   // em bilhões
  payout: number | null;    // %
  dy: number | null;        // %
}

function buildPayoutData(q: BrapiQuoteFull | null): PayoutYear[] {
  if (!q) return [];
  const ish = q.incomeStatementHistory?.incomeStatementHistory ?? [];
  const cd = q.dividendsData?.cashDividends ?? [];
  const price = q.regularMarketPrice ?? 0;
  const shares = q.sharesOutstanding ?? q.defaultKeyStatistics?.sharesOutstanding ?? null;

  if (ish.length === 0) return [];

  const divByYear = new Map<number, number>();
  for (const d of cd) {
    const raw = d.paymentDate || d.approvedOn;
    if (!raw) continue;
    const y = new Date(raw).getFullYear();
    if (isNaN(y)) continue;
    divByYear.set(y, (divByYear.get(y) ?? 0) + (d.rate ?? 0));
  }

  const out: PayoutYear[] = [];
  for (const s of ish) {
    const y = new Date(s.endDate).getFullYear();
    if (isNaN(y)) continue;
    const ni = s.netIncome ?? 0;
    const divPerShare = divByYear.get(y) ?? 0;
    const totalDivs = shares ? divPerShare * shares : 0;
    const payout = ni > 0 && totalDivs > 0 ? (totalDivs / ni) * 100 : null;
    const dy = price > 0 && divPerShare > 0 ? (divPerShare / price) * 100 : null;
    out.push({
      year: y,
      netIncome: ni / 1e9,
      divPerShare,
      totalDividends: totalDivs / 1e9,
      payout,
      dy,
    });
  }
  return out.sort((a, b) => a.year - b.year);
}

function PayoutSection({ quote, ticker }: { quote: BrapiQuoteFull; ticker: string }) {
  const allData = useMemo(() => buildPayoutData(quote), [quote]);
  const [period, setPeriod] = useState<"5y" | "10y" | "max">("5y");

  const data = useMemo(() => {
    if (period === "max") return allData;
    const n = period === "5y" ? 5 : 10;
    return allData.slice(-n);
  }, [allData, period]);

  if (allData.length === 0) {
    return (
      <Section>
        <SectionHeader title={`Payout de ${quote.shortName ?? ticker}`} />
        <Empty text="Brapi não retornou demonstrativos anuais para este ativo. Comum em bancos." />
      </Section>
    );
  }

  return (
    <Section>
      <SectionHeader title={`Payout de ${quote.shortName ?? ticker}`}>
        <div style={{ display: "flex", gap: "4px" }}>
          <PillBtn active={period === "5y"} onClick={() => setPeriod("5y")}>5 ANOS</PillBtn>
          <PillBtn active={period === "10y"} onClick={() => setPeriod("10y")}>10 ANOS</PillBtn>
          <PillBtn active={period === "max"} onClick={() => setPeriod("max")}>MÁX</PillBtn>
        </div>
      </SectionHeader>
      <PayoutChart data={data} />
      <div style={{ display: "flex", gap: "16px", justifyContent: "center", marginTop: "12px", flexWrap: "wrap" }}>
        <LegendItem color="#5E6B8C" label="Lucro Líquido (R$ Bi)" />
        <LegendLine color="#C9A84C" label="Payout %" />
        <LegendLine color="#34d399" label="Dividend Yield %" />
      </div>
    </Section>
  );
}

function LegendLine({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <span style={{ width: "16px", height: "2px", background: color, borderRadius: "1px", display: "block" }} />
      <span style={{ width: "6px", height: "6px", background: color, borderRadius: "50%", display: "block", marginLeft: "-11px" }} />
      <span style={{ fontSize: "11px", color: "#9a8a6a", fontFamily: "var(--font-sans)" }}>{label}</span>
    </div>
  );
}

function PayoutChart({ data }: { data: PayoutYear[] }) {
  if (data.length === 0) return <Empty text="Sem dados no período." />;

  const w = 1100, h = 280, padX = 40, padTop = 24, padBot = 40;

  // Eixo esquerdo: lucro (Bi)
  const niMin = Math.min(0, ...data.map((d) => d.netIncome));
  const niMax = Math.max(0.01, ...data.map((d) => d.netIncome));
  const niRange = niMax - niMin || 1;
  const yLeft = (v: number) => padTop + (1 - (v - niMin) / niRange) * (h - padTop - padBot);
  const zeroY = yLeft(0);

  // Eixo direito: percentual (0–maxPct)
  const pcts = data.flatMap((d) => [d.payout, d.dy].filter((v): v is number => v !== null));
  const pctMax = Math.max(...pcts, 10);
  const yRight = (v: number) => padTop + (1 - v / pctMax) * (h - padTop - padBot);

  const groupW = (w - padX * 2) / data.length;
  const barW = Math.min(48, groupW * 0.55);

  const cx = (i: number) => padX + i * groupW + groupW / 2;

  const linePath = (key: "payout" | "dy") =>
    data
      .map((d, i) => {
        const v = d[key];
        if (v === null) return null;
        return `${cx(i).toFixed(1)},${yRight(v).toFixed(1)}`;
      })
      .filter((p): p is string => p !== null)
      .map((p, i) => (i === 0 ? `M${p}` : `L${p}`))
      .join(" ");

  // Y-axis labels (esquerda — bilhões)
  const yLeftTicks = 4;
  const niStep = niRange / yLeftTicks;

  return (
    <div style={{ overflow: "hidden", borderRadius: "10px", background: "#0d0b07", padding: "8px" }}>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "auto", display: "block" }}>
        {/* Grid */}
        {Array.from({ length: yLeftTicks + 1 }).map((_, i) => {
          const v = niMin + niStep * i;
          const y = yLeft(v);
          return (
            <g key={i}>
              <line x1={padX} x2={w - padX} y1={y} y2={y} stroke="rgba(201,168,76,0.06)" strokeWidth={1} />
              <text x={padX - 6} y={y + 3} textAnchor="end" fontSize={9}
                fill="#7a6d57" fontFamily="var(--font-sans)" style={{ fontVariantNumeric: "tabular-nums" }}>
                R$ {v.toFixed(1)} Bi
              </text>
            </g>
          );
        })}

        {/* Eixo zero */}
        {niMin < 0 && (
          <line x1={padX} x2={w - padX} y1={zeroY} y2={zeroY} stroke="rgba(201,168,76,0.18)" strokeWidth={1} />
        )}

        {/* Bars (lucro) */}
        {data.map((d, i) => {
          const yTop = d.netIncome >= 0 ? yLeft(d.netIncome) : zeroY;
          const barH = Math.abs(yLeft(d.netIncome) - zeroY);
          return (
            <g key={d.year}>
              <rect
                x={cx(i) - barW / 2}
                y={yTop}
                width={barW}
                height={barH}
                fill="#5E6B8C"
                rx={4}
              />
              <text x={cx(i)} y={h - 22} textAnchor="middle" fontSize={10}
                fill="#a09068" fontFamily="var(--font-sans)"
                style={{ fontVariantNumeric: "tabular-nums" }}>
                {d.year}
              </text>
            </g>
          );
        })}

        {/* Linha Payout */}
        <path d={linePath("payout")} fill="none" stroke="#C9A84C" strokeWidth={2}
          strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => d.payout !== null && (
          <circle key={`p-${i}`} cx={cx(i)} cy={yRight(d.payout)} r={3.5} fill="#C9A84C" />
        ))}

        {/* Linha DY */}
        <path d={linePath("dy")} fill="none" stroke="#34d399" strokeWidth={2}
          strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => d.dy !== null && (
          <circle key={`y-${i}`} cx={cx(i)} cy={yRight(d.dy)} r={3.5} fill="#34d399" />
        ))}

        {/* Eixo direito (%) */}
        {[0, 0.25, 0.5, 0.75, 1].map((p) => {
          const v = pctMax * p;
          const y = yRight(v);
          return (
            <text key={p} x={w - padX + 6} y={y + 3} textAnchor="start" fontSize={9}
              fill="#7a6d57" fontFamily="var(--font-sans)"
              style={{ fontVariantNumeric: "tabular-nums" }}>
              {v.toFixed(0)}%
            </text>
          );
        })}
      </svg>
    </div>
  );
}

// ─── COMPARADOR DE AÇÕES ──────────────────────────────────────────────────────

interface ComparadorRow {
  symbol: string;
  logo: string | null;
  pl: number | null;
  pvp: number | null;
  roe: number | null;
  dy: number | null;
  marketCap: number | null;
  profitMargins: number | null;
}

function rowFromQuote(q: BrapiQuoteFull): ComparadorRow {
  // DY: prefere defaultKeyStatistics.dividendYield (decimal); fallback = soma 12m / preço
  const price = q.regularMarketPrice ?? 0;
  let dy = q.defaultKeyStatistics?.dividendYield ?? null;
  if (dy !== null && dy <= 1.5) dy = dy * 100;
  if (dy === null) {
    const oneYearAgo = Date.now() - 365 * 86400000;
    const sum = (q.dividendsData?.cashDividends ?? [])
      .filter((d) => new Date(d.paymentDate || d.approvedOn || 0).getTime() > oneYearAgo)
      .reduce((a, b) => a + (b.rate ?? 0), 0);
    dy = price > 0 && sum > 0 ? (sum / price) * 100 : null;
  }

  return {
    symbol: q.symbol,
    logo: q.logourl ?? null,
    pl: q.priceEarnings ?? q.defaultKeyStatistics?.trailingPE ?? null,
    pvp: q.defaultKeyStatistics?.priceToBook ?? null,
    roe: q.financialData?.returnOnEquity ?? null,  // decimal
    dy,
    marketCap: q.marketCap ?? null,
    profitMargins: q.financialData?.profitMargins ?? null,  // decimal
  };
}

function ComparadorTable({
  tickers, primaryTicker, primaryQuote,
}: { tickers: string[]; primaryTicker: string; primaryQuote: BrapiQuoteFull }) {
  const [data, setData] = useState<Record<string, BrapiQuoteFull>>({ [primaryTicker]: primaryQuote });
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef<Set<string>>(new Set([primaryTicker]));

  useEffect(() => {
    setData((prev) => prev[primaryTicker] === primaryQuote ? prev : { ...prev, [primaryTicker]: primaryQuote });
  }, [primaryQuote, primaryTicker]);

  useEffect(() => {
    const missing = tickers.filter((t) => !fetchedRef.current.has(t));
    if (missing.length === 0) return;
    missing.forEach((t) => fetchedRef.current.add(t));

    const ctrl = new AbortController();
    setLoading(true);
    (async () => {
      try {
        const params = new URLSearchParams({
          tickers: missing.join(","),
          modules: "defaultKeyStatistics,financialData,summaryProfile",
          dividends: "true",
        });
        const res = await fetch(`/api/brapi-quote?${params}`, { signal: ctrl.signal });
        if (!res.ok) return;
        const d = await res.json();
        if (!d?.results) return;
        setData((prev) => {
          const next = { ...prev };
          for (const q of d.results as BrapiQuoteFull[]) {
            if (q.symbol) next[q.symbol] = q;
          }
          return next;
        });
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();

    return () => ctrl.abort();
  }, [tickers]);

  const rows: ComparadorRow[] = useMemo(
    () => tickers.map((t) => data[t]).filter(Boolean).map(rowFromQuote),
    [tickers, data],
  );

  // Extremos por coluna pra destacar com ★
  const best = useMemo(() => {
    const positives = (xs: (number | null)[]) => xs.filter((v): v is number => v !== null && v > 0);
    return {
      pl: rows.length ? Math.min(...positives(rows.map((r) => r.pl))) : null,           // menor positivo
      pvp: rows.length ? Math.min(...positives(rows.map((r) => r.pvp))) : null,         // menor positivo
      roe: rows.length ? Math.max(...rows.map((r) => r.roe ?? -Infinity)) : null,
      dy: rows.length ? Math.max(...rows.map((r) => r.dy ?? -Infinity)) : null,
      marketCap: rows.length ? Math.max(...rows.map((r) => r.marketCap ?? -Infinity)) : null,
      profitMargins: rows.length ? Math.max(...rows.map((r) => r.profitMargins ?? -Infinity)) : null,
    };
  }, [rows]);

  if (rows.length === 0) {
    return <Empty text={loading ? "Carregando comparativos..." : "Adicione tickers para comparar."} />;
  }

  return (
    <div style={{
      background: "#0d0b07",
      border: "1px solid rgba(201,168,76,0.06)",
      borderRadius: "10px",
      overflow: "hidden",
    }}>
      <div role="table" aria-label="Comparador de ativos" style={{ width: "100%", display: "block" }}>
        {/* Header */}
        <div role="row" style={{
          display: "grid",
          gridTemplateColumns: "minmax(140px, 1.6fr) repeat(6, 1fr)",
          gap: "8px",
          padding: "12px 16px",
          borderBottom: "1px solid rgba(201,168,76,0.08)",
          background: "rgba(201,168,76,0.02)",
        }}>
          <div role="columnheader" style={cmpHeadStyle}>Ativo</div>
          <div role="columnheader" style={cmpHeadStyleR}>P/L</div>
          <div role="columnheader" style={cmpHeadStyleR}>P/VP</div>
          <div role="columnheader" style={cmpHeadStyleR}>ROE</div>
          <div role="columnheader" style={cmpHeadStyleR}>DY</div>
          <div role="columnheader" style={cmpHeadStyleR}>Mkt Cap</div>
          <div role="columnheader" style={cmpHeadStyleR}>Margem Líq.</div>
        </div>

        {/* Rows */}
        {rows.map((r) => (
          <div
            key={r.symbol}
            role="row"
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(140px, 1.6fr) repeat(6, 1fr)",
              gap: "8px",
              padding: "12px 16px",
              borderBottom: "1px solid rgba(201,168,76,0.04)",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
              {r.logo ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={r.logo} alt="" style={{
                  width: "24px", height: "24px",
                  borderRadius: "6px", background: "#fff",
                  padding: "2px", objectFit: "contain", flexShrink: 0,
                }} />
              ) : (
                <span style={{ width: "24px", height: "24px", display: "block", flexShrink: 0 }} />
              )}
              <span style={{
                fontSize: "12px",
                fontWeight: 700,
                color: r.symbol === primaryTicker ? "#C9A84C" : "#e8dcc0",
                fontFamily: "var(--font-sans)",
                letterSpacing: "0.04em",
              }}>
                {r.symbol}
              </span>
            </div>
            <CmpCell value={fmtNum(r.pl, 2)} starred={r.pl !== null && r.pl === best.pl} />
            <CmpCell value={fmtNum(r.pvp, 2)} starred={r.pvp !== null && r.pvp === best.pvp} />
            <CmpCell value={fmtPctDecimal(r.roe)} starred={r.roe !== null && r.roe === best.roe} good={r.roe !== null && r.roe >= 0.15} />
            <CmpCell value={r.dy !== null ? `${r.dy.toFixed(2).replace(".", ",")}%` : "—"} starred={r.dy !== null && r.dy === best.dy} good={r.dy !== null && r.dy >= 6} />
            <CmpCell value={fmtMoney(r.marketCap)} starred={r.marketCap !== null && r.marketCap === best.marketCap} />
            <CmpCell value={fmtPctDecimal(r.profitMargins)} starred={r.profitMargins !== null && r.profitMargins === best.profitMargins} good={r.profitMargins !== null && r.profitMargins >= 0.15} />
          </div>
        ))}
      </div>
      {loading && (
        <p style={{ padding: "10px 16px", fontSize: "10px", color: "#7a6d57", fontFamily: "var(--font-sans)" }}>
          Carregando dados...
        </p>
      )}
    </div>
  );
}

const cmpHeadStyle: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 600,
  color: "#a09068",
  fontFamily: "var(--font-sans)",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
};

const cmpHeadStyleR: React.CSSProperties = { ...cmpHeadStyle, textAlign: "right" };

function CmpCell({ value, starred, good }: { value: string; starred?: boolean; good?: boolean }) {
  return (
    <div style={{
      fontSize: "12px",
      fontWeight: starred ? 700 : 600,
      color: good ? "#34d399" : starred ? "#C9A84C" : "#e8dcc0",
      fontFamily: "var(--font-sans)",
      textAlign: "right",
      fontVariantNumeric: "tabular-nums",
      display: "flex",
      justifyContent: "flex-end",
      alignItems: "center",
      gap: "4px",
    }}>
      <span>{value}</span>
      {starred && (
        <span aria-label="Melhor da categoria" style={{ color: "#C9A84C", fontSize: "10px" }}>★</span>
      )}
    </div>
  );
}

function SectorBadge({ label }: { label: string }) {
  return (
    <span style={{
      fontSize: "9px",
      fontWeight: 700,
      color: "#4F8A82",
      background: "rgba(79,138,130,0.12)",
      border: "1px solid rgba(79,138,130,0.3)",
      padding: "3px 8px",
      borderRadius: "4px",
      fontFamily: "var(--font-sans)",
      letterSpacing: "0.06em",
      textTransform: "uppercase",
    }}>
      {label}
    </span>
  );
}

function DefaultIndicators({ metrics, quote }: { metrics: Metrics; quote: BrapiQuoteFull }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
      <Indicator helpKey="pl" label="P/L" value={fmtNum(metrics.pl, 2)} />
      <Indicator helpKey="pvp" label="P/VP" value={fmtNum(metrics.pvp, 2)} />
      <Indicator helpKey="dy" label="Dividend Yield" value={metrics.dy !== null ? `${metrics.dy.toFixed(2)}%` : "—"} />
      <Indicator helpKey="payout" label="Payout" value={metrics.payout !== null ? `${metrics.payout.toFixed(2)}%` : "—"} />
      <Indicator helpKey="evEbitda" label="EV/EBITDA" value={fmtNum(quote.defaultKeyStatistics?.enterpriseToEbitda, 2)} />
      <Indicator helpKey="evEbit" label="EV/EBIT" value={fmtNum(metrics.evEbit, 2)} />
      <Indicator helpKey="lpa" label="LPA" value={quote.earningsPerShare !== null && quote.earningsPerShare !== undefined ? `R$ ${quote.earningsPerShare.toFixed(2).replace(".", ",")}` : "—"} />
      <Indicator helpKey="vpa" label="VPA" value={quote.defaultKeyStatistics?.bookValue !== undefined ? `R$ ${quote.defaultKeyStatistics.bookValue.toFixed(2).replace(".", ",")}` : "—"} />
      <Indicator helpKey="netDebt" label="Dívida Líquida" value={fmtMoney(metrics.netDebt)} />
      <Indicator helpKey="netDebtToEquity" label="Dív. Líq./PL" value={fmtNum(metrics.netDebtToEquity, 2)} />
      <Indicator helpKey="netDebtToEbitda" label="Dív. Líq./EBITDA" value={fmtNum(metrics.netDebtToEbitda, 2)} />
      <Indicator helpKey="liabToAssets" label="Passivos/Ativos" value={fmtPct(metrics.liabilitiesToAssets)} />
      <Indicator helpKey="currentRatio" label="Liquidez Corrente" value={fmtNum(quote.financialData?.currentRatio, 2)} />
      <Indicator helpKey="grossMargin" label="Margem Bruta" value={fmtPct(quote.financialData?.grossMargins)} />
      <Indicator helpKey="netMargin" label="Margem Líquida" value={fmtPct(quote.financialData?.profitMargins)} />
      <Indicator helpKey="ebitdaMargin" label="Margem EBITDA" value={fmtPct(quote.financialData?.ebitdaMargins)} />
      <Indicator helpKey="operatingMargin" label="Margem Operacional" value={fmtPct(quote.financialData?.operatingMargins)} />
      <Indicator helpKey="roe" label="ROE" value={fmtPct(quote.financialData?.returnOnEquity)} />
      <Indicator helpKey="roa" label="ROA" value={fmtPct(quote.financialData?.returnOnAssets)} />
      <Indicator helpKey="cagrRevenue" label="CAGR Receita 5A" value={fmtPct(quote.financialData?.revenueGrowth)} />
      <Indicator helpKey="cagrEarnings" label="CAGR Lucro 5A" value={fmtPct(quote.financialData?.earningsGrowth)} />
      <Indicator helpKey="revenue" label="Receita Líquida" value={fmtMoney(quote.financialData?.totalRevenue)} />
      <Indicator helpKey="ebitda" label="EBITDA" value={fmtMoney(quote.financialData?.ebitda)} />
      <Indicator helpKey="netIncome" label="Lucro Líquido" value={fmtMoney(metrics.netIncome)} />
      <Indicator helpKey="fcf" label="Free Cash Flow" value={fmtMoney(quote.financialData?.freeCashflow)} />
      <Indicator helpKey="beta" label="Beta" value={fmtNum(quote.defaultKeyStatistics?.beta, 2)} />
    </div>
  );
}

function FinanceIndicators({ metrics, quote }: { metrics: Metrics; quote: BrapiQuoteFull }) {
  // Valuation primeiro, depois rentabilidade, depois estrutura/saúde, depois tamanho
  const lpa = quote.earningsPerShare ?? quote.defaultKeyStatistics?.trailingEps ?? null;
  const vpa = quote.defaultKeyStatistics?.bookValue ?? null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
      {/* Valuation */}
      <Indicator helpKey="pl" label="P/L" value={fmtNum(metrics.pl, 2)} />
      <Indicator helpKey="pvp" label="P/VP" value={fmtNum(metrics.pvp, 2)} />
      <Indicator helpKey="dy" label="Dividend Yield" value={metrics.dy !== null ? `${metrics.dy.toFixed(2)}%` : "—"} />
      <Indicator helpKey="payout" label="Payout" value={metrics.payout !== null ? `${metrics.payout.toFixed(2)}%` : "—"} />

      {/* Por ação */}
      <Indicator helpKey="lpa" label="LPA" value={lpa !== null && lpa !== undefined ? `R$ ${lpa.toFixed(2).replace(".", ",")}` : "—"} />
      <Indicator helpKey="vpa" label="VPA" value={vpa !== null && vpa !== undefined ? `R$ ${vpa.toFixed(2).replace(".", ",")}` : "—"} />
      <Indicator
        helpKey="revPerShare"
        label="Receita / Ação"
        value={metrics.revenuePerShare !== null ? `R$ ${metrics.revenuePerShare.toFixed(2).replace(".", ",")}` : "—"}
      />
      <Indicator helpKey="beta" label="Beta" value={fmtNum(quote.defaultKeyStatistics?.beta, 2)} />

      {/* Rentabilidade */}
      <Indicator helpKey="roe" label="ROE" value={fmtPct(quote.financialData?.returnOnEquity)} />
      <Indicator helpKey="roa" label="ROA" value={fmtPct(quote.financialData?.returnOnAssets)} />
      <Indicator helpKey="netMargin" label="Margem Líquida" value={fmtPct(quote.financialData?.profitMargins)} />
      <Indicator helpKey="grossMargin" label="Margem Bruta" value={fmtPct(quote.financialData?.grossMargins)} />

      {/* Estrutura bancária — substitui dívida/EBITDA/liquidez */}
      <Indicator helpKey="leverage" label="Alavancagem (Ativos/PL)" value={metrics.leverage !== null ? `${metrics.leverage.toFixed(2)}×` : "—"} />
      <Indicator helpKey="capitalRatio" label="Capital Ratio (PL/Ativos)" value={fmtPctDecimal(metrics.capitalRatio)} />
      <Indicator helpKey="revPerAssets" label="Receita / Ativos" value={metrics.totalRevenue && metrics.totalAssets ? fmtPctDecimal(metrics.totalRevenue / metrics.totalAssets) : "—"} />
      <Indicator helpKey="profitPerAssets" label="Lucro / Ativos" value={metrics.netIncome && metrics.totalAssets ? fmtPctDecimal(metrics.netIncome / metrics.totalAssets) : "—"} />

      {/* Crescimento */}
      <Indicator helpKey="revGrowth" label="Crescimento Receita" value={fmtPct(quote.financialData?.revenueGrowth)} />
      <Indicator helpKey="earnGrowth" label="Crescimento Lucro" value={fmtPct(quote.financialData?.earningsGrowth)} />

      {/* Tamanho */}
      <Indicator helpKey="revenue" label="Receita Líquida" value={fmtMoney(metrics.totalRevenue)} />
      <Indicator helpKey="netIncome" label="Lucro Líquido" value={fmtMoney(metrics.netIncome)} />
      <Indicator helpKey="equity" label="Patrimônio Líquido" value={fmtMoney(metrics.equity)} />
      <Indicator helpKey="totalAssets" label="Ativos Totais" value={fmtMoney(metrics.totalAssets)} />
      <Indicator helpKey="cash" label="Caixa" value={fmtMoney(quote.financialData?.totalCash)} />
    </div>
  );
}

function Section({ children, noMargin }: { children: React.ReactNode; noMargin?: boolean }) {
  return (
    <div style={{
      background: "#130f09",
      border: "1px solid rgba(201,168,76,0.1)",
      borderRadius: "14px", padding: "20px 24px",
      marginBottom: noMargin ? 0 : "16px",
    }}>
      {children}
    </div>
  );
}

function SectionHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
      <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-display)" }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function PillBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "5px 11px", borderRadius: "6px",
        border: "1px solid",
        borderColor: active ? "transparent" : "rgba(201,168,76,0.12)",
        background: active ? "linear-gradient(135deg, #C9A84C 0%, #A07820 100%)" : "transparent",
        color: active ? "#0d0b07" : "#9a8a6a",
        fontSize: "10px", fontWeight: active ? 600 : 500,
        fontFamily: "var(--font-sans)", cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      {children}
    </button>
  );
}

function MetricChip({
  color, label, value, sub,
}: { color: string; label: string; value: string; sub: string }) {
  return (
    <div style={{
      background: "#0d0b07",
      border: `1px solid ${color}33`,
      borderRadius: "10px", padding: "12px 14px",
    }}>
      <p style={{
        fontSize: "9px", fontWeight: 700, color,
        fontFamily: "var(--font-sans)", letterSpacing: "0.06em",
        marginBottom: "6px", textTransform: "uppercase",
      }}>
        {label}
      </p>
      <p style={{
        fontSize: "16px", fontWeight: 700, color: "#e8dcc0",
        fontFamily: "var(--font-display)", lineHeight: 1,
        marginBottom: "4px",
        fontVariantNumeric: "tabular-nums",
      }}>
        {value}
      </p>
      <p style={{ fontSize: "10px", color: "#9a8a6a", fontFamily: "var(--font-sans)" }}>
        {sub}
      </p>
    </div>
  );
}

function BazinChip({ bazin, currentPrice }: { bazin: BazinResult | null; currentPrice: number }) {
  // Sem dados suficientes: mostra estado neutro mas explicativo
  if (!bazin) {
    return (
      <div
        style={{
          background: "#0d0b07",
          border: "1px solid rgba(154,138,106,0.2)",
          borderRadius: "10px",
          padding: "12px 14px",
        }}
        title="Bazin: requer pelo menos 1 ano completo de dividendos pagos"
      >
        <p style={{
          fontSize: "9px", fontWeight: 700, color: "#9a8a6a",
          fontFamily: "var(--font-sans)", letterSpacing: "0.06em",
          marginBottom: "6px", textTransform: "uppercase",
        }}>
          Preço Teto
        </p>
        <p style={{
          fontSize: "16px", fontWeight: 700, color: "#9a8a6a",
          fontFamily: "var(--font-display)", lineHeight: 1,
          marginBottom: "4px",
        }}>
          —
        </p>
        <p style={{ fontSize: "10px", color: "#7a6d57", fontFamily: "var(--font-sans)" }}>
          Sem histórico de dividendos
        </p>
      </div>
    );
  }

  // Cálculo do deságio/ágio
  const ratio = currentPrice > 0 ? (currentPrice - bazin.ceiling) / bazin.ceiling : 0;
  // Tolerância de ±2% considera "preço justo" (cotando perto do teto)
  const isUndervalued = ratio <= -0.02;
  const isOvervalued = ratio >= 0.02;
  const tone = isUndervalued ? "#34d399" : isOvervalued ? "#f87171" : "#C9A84C";

  const subLabel = isUndervalued
    ? `Deságio de ${Math.abs(ratio * 100).toFixed(1)}%`
    : isOvervalued
    ? `Ágio de ${(ratio * 100).toFixed(1)}%`
    : "Próximo ao teto";

  const tooltipText =
    `Bazin: média de R$ ${bazin.avgDividends.toFixed(2).replace(".", ",")} ` +
    `em dividendos por ano (${bazin.yearsUsed}A) ÷ ${(bazin.yieldRate * 100).toFixed(0)}% de DY desejado.`;

  return (
    <div
      style={{
        background: "#0d0b07",
        border: `1px solid ${tone}33`,
        borderRadius: "10px",
        padding: "12px 14px",
        position: "relative",
        overflow: "hidden",
      }}
      title={tooltipText}
      aria-label={`Preço Teto Bazin: R$ ${bazin.ceiling.toFixed(2)}. ${subLabel}.`}
    >
      {/* Glow lateral sutil indicando o tom */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 0, top: 0, bottom: 0,
          width: "3px",
          background: tone,
          opacity: 0.85,
        }}
      />
      <p style={{
        fontSize: "9px", fontWeight: 700, color: tone,
        fontFamily: "var(--font-sans)", letterSpacing: "0.06em",
        marginBottom: "6px", textTransform: "uppercase",
      }}>
        Preço Teto
      </p>
      <p style={{
        fontSize: "16px", fontWeight: 700, color: "#e8dcc0",
        fontFamily: "var(--font-display)", lineHeight: 1,
        marginBottom: "4px",
        fontVariantNumeric: "tabular-nums",
      }}>
        R$ {bazin.ceiling.toFixed(2).replace(".", ",")}
      </p>
      <p
        style={{
          fontSize: "10px",
          color: tone,
          fontFamily: "var(--font-sans)",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: "4px",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {isUndervalued && <TrendingDown size={10} aria-hidden="true" />}
        {isOvervalued && <TrendingUp size={10} aria-hidden="true" />}
        {subLabel} <span style={{ color: "#7a6d57", fontWeight: 500 }}>· Bazin</span>
      </p>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <p style={{ fontSize: "10px", color: "#9a8a6a", fontFamily: "var(--font-sans)", marginBottom: "3px", letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {label}
      </p>
      <p style={{ fontSize: "14px", fontWeight: 600, color, fontFamily: "var(--font-display)" }}>
        {value}
      </p>
    </div>
  );
}

function Indicator({ label, value, helpKey }: { label: string; value: string; helpKey?: string }) {
  return (
    <div style={{
      background: "#0d0b07",
      border: "1px solid rgba(201,168,76,0.06)",
      borderRadius: "8px",
      padding: "10px 12px",
      position: "relative",
    }}>
      <div style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "6px",
        marginBottom: "6px",
      }}>
        <p style={{
          fontSize: "9px",
          fontWeight: 600,
          color: "#a09068",
          fontFamily: "var(--font-sans)",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          margin: 0,
          flex: 1,
          lineHeight: 1.2,
        }}>
          {label}
        </p>
        {helpKey && <IndicatorHelp helpKey={helpKey} />}
      </div>
      <p style={{
        fontSize: "14px",
        fontWeight: 700,
        color: "#e8dcc0",
        fontFamily: "var(--font-display)",
        margin: 0,
        fontVariantNumeric: "tabular-nums",
      }}>
        {value}
      </p>
    </div>
  );
}

function DivStat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div>
      <p style={{ fontSize: "10px", color: "#a09068", fontFamily: "var(--font-sans)", marginBottom: "2px" }}>
        {label}
      </p>
      <p style={{ fontSize: "16px", fontWeight: 700, color: accent, fontFamily: "var(--font-display)" }}>
        {value}
      </p>
    </div>
  );
}

function GroupIcon({ iconKey, color }: { iconKey: ChecklistGroupT["iconKey"]; color: string }) {
  const props = { size: 14, style: { color, flexShrink: 0 }, "aria-hidden": true } as const;
  switch (iconKey) {
    case "calculator": return <Calculator {...props} />;
    case "shield":     return <ShieldCheck {...props} />;
    case "coins":      return <Coins {...props} />;
    case "trending":   return <TrendingUp {...props} />;
    case "rocket":     return <Rocket {...props} />;
    case "bank":       return <Landmark {...props} />;
  }
}

function ChecklistGroup({ group }: { group: ChecklistGroupT }) {
  const [open, setOpen] = useState(group.passed > 0 && group.passed < group.total);
  const ratio = group.total > 0 ? (group.passed / group.total) * 100 : 0;
  const tone = scoreColor(ratio);
  return (
    <div style={{
      background: "#0d0b07",
      border: "1px solid rgba(201,168,76,0.08)",
      borderRadius: "10px",
      overflow: "hidden",
    }}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 16px",
          minHeight: "48px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(201,168,76,0.03)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "24px",
            height: "24px",
            background: `${tone}14`,
            border: `1px solid ${tone}33`,
            borderRadius: "6px",
            flexShrink: 0,
          }}>
            <GroupIcon iconKey={group.iconKey} color={tone} />
          </span>
          <span style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "#e8dcc0",
            fontFamily: "var(--font-sans)",
          }}>
            {group.title}
          </span>
          <span style={{
            fontSize: "11px",
            fontWeight: 700,
            color: tone,
            background: `${tone}1a`,
            border: `1px solid ${tone}33`,
            padding: "2px 8px",
            borderRadius: "4px",
            fontFamily: "var(--font-sans)",
            fontVariantNumeric: "tabular-nums",
          }}>
            {group.passed}/{group.total}
          </span>
        </div>
        <ChevronDown
          size={14}
          aria-hidden="true"
          style={{
            color: "#a09068",
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.2s",
            flexShrink: 0,
          }}
        />
      </button>
      {open && (
        <div style={{
          padding: "4px 16px 14px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          borderTop: "1px solid rgba(201,168,76,0.05)",
        }}>
          {group.items.map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "flex-start",
                paddingTop: i === 0 ? "10px" : 0,
              }}
            >
              {item.passed ? (
                <CheckCircle2 size={14} style={{ color: "#34d399", flexShrink: 0, marginTop: "1px" }} aria-hidden="true" />
              ) : (
                <XCircle size={14} style={{ color: "#a86161", flexShrink: 0, marginTop: "1px" }} aria-hidden="true" />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  gap: "8px",
                  marginBottom: "2px",
                }}>
                  <p style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#e8dcc0",
                    fontFamily: "var(--font-sans)",
                    margin: 0,
                  }}>
                    {item.label}
                  </p>
                  {item.current && (
                    <span style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: item.passed ? "#34d399" : "#a09068",
                      fontFamily: "var(--font-display)",
                      fontVariantNumeric: "tabular-nums",
                      whiteSpace: "nowrap",
                    }}>
                      {item.current}
                    </span>
                  )}
                </div>
                <p style={{
                  fontSize: "11px",
                  color: "#a09068",
                  fontFamily: "var(--font-sans)",
                  lineHeight: 1.45,
                  margin: 0,
                }}>
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface PriceChartProps {
  history: BrapiHistoricalPrice[];
  positive: boolean;
  low52w: number | null;
  high52w: number | null;
  avg52w: number | null;
}

function PriceChart({ history, positive, low52w, high52w, avg52w }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (history.length < 2) {
    return (
      <div style={{
        height: "240px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#9a8a6a",
        fontSize: "12px",
        fontFamily: "var(--font-sans)",
        background: "#0d0b07",
        borderRadius: "10px",
      }}>
        Sem dados históricos suficientes.
      </div>
    );
  }

  // Geometria do gráfico
  const w = 1100, h = 280;
  const padL = 56, padR = 16, padTop = 20, padBot = 32;
  const closes = history.map((p) => p.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || 1;
  const xStep = history.length > 1 ? (w - padL - padR) / (history.length - 1) : 0;
  const x = (i: number) => padL + i * xStep;
  const y = (v: number) => padTop + (1 - (v - min) / range) * (h - padTop - padBot);

  const points = history.map((p, i) => [x(i), y(p.close)] as const);
  const lineColor = positive ? "#34d399" : "#f87171";
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${path} L${points[points.length - 1][0].toFixed(1)},${(h - padBot).toFixed(1)} L${points[0][0].toFixed(1)},${(h - padBot).toFixed(1)} Z`;

  // Y ticks (4 níveis: max, q2, q1, min)
  const yTicks = [
    { v: max, label: max.toFixed(2) },
    { v: min + range * 0.66, label: (min + range * 0.66).toFixed(2) },
    { v: min + range * 0.33, label: (min + range * 0.33).toFixed(2) },
    { v: min, label: min.toFixed(2) },
  ];

  // X labels (5 datas evenly spaced)
  const xLabelCount = Math.min(5, history.length);
  const xLabels: { idx: number; label: string }[] = [];
  for (let i = 0; i < xLabelCount; i++) {
    const idx = Math.floor((i / (xLabelCount - 1)) * (history.length - 1));
    const date = new Date(history[idx]!.date * 1000);
    xLabels.push({
      idx,
      label: date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(/\.$/, ""),
    });
  }

  // Pointer handlers — atualiza hoverIdx pela posição do dedo/mouse
  function updateHover(clientX: number) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const xRel = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const pct = xRel / rect.width;
    // Mapeia o pct para o intervalo de dados visível (excluindo padL/padR)
    const padLPct = padL / w;
    const dataPct = Math.max(0, Math.min(1, (pct - padLPct) / (1 - padLPct - padR / w)));
    const idx = Math.round(dataPct * (history.length - 1));
    setHoverIdx(Math.max(0, Math.min(history.length - 1, idx)));
  }

  const hoveredPoint = hoverIdx !== null ? history[hoverIdx] : null;
  const hoveredDate = hoveredPoint ? new Date(hoveredPoint.date * 1000) : null;

  // Posição do tooltip em % do container — clampa pra não estourar as bordas
  const tooltipLeftPct = hoverIdx !== null ? (x(hoverIdx) / w) * 100 : 50;

  return (
    <div
      ref={containerRef}
      onPointerMove={(e) => updateHover(e.clientX)}
      onPointerLeave={() => setHoverIdx(null)}
      onPointerDown={(e) => {
        containerRef.current?.setPointerCapture(e.pointerId);
        updateHover(e.clientX);
      }}
      onPointerUp={(e) => {
        if (e.pointerType === "touch") setHoverIdx(null);
      }}
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "10px",
        background: "#0d0b07",
        padding: "8px",
        cursor: "crosshair",
        touchAction: "pan-y",
        userSelect: "none",
      }}
      role="img"
      aria-label={`Histórico de preços. Mínima ${low52w?.toFixed(2) ?? "—"}, máxima ${high52w?.toFixed(2) ?? "—"}, média 52 semanas ${avg52w?.toFixed(2) ?? "—"}.`}
    >
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <defs>
          <linearGradient id="priceArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity={0.32} />
            <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Y grid + labels */}
        {yTicks.map((t, i) => (
          <g key={`y-${i}`}>
            <line
              x1={padL} x2={w - padR}
              y1={y(t.v)} y2={y(t.v)}
              stroke="rgba(201,168,76,0.05)"
              strokeWidth={1}
            />
            <text
              x={padL - 8} y={y(t.v) + 3}
              textAnchor="end" fontSize={9}
              fill="#7a6d57" fontFamily="var(--font-sans)"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              R$ {t.label}
            </text>
          </g>
        ))}

        {/* Linha de referência: média 52 semanas */}
        {avg52w !== null && avg52w >= min && avg52w <= max && (
          <g>
            <line
              x1={padL} x2={w - padR}
              y1={y(avg52w)} y2={y(avg52w)}
              stroke="rgba(201,168,76,0.35)"
              strokeWidth={1}
              strokeDasharray="3 4"
            />
            <text
              x={w - padR - 4} y={y(avg52w) - 4}
              textAnchor="end" fontSize={9}
              fill="#C9A84C" fontFamily="var(--font-sans)" fontWeight={600}
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              média 52sem
            </text>
          </g>
        )}

        {/* X labels */}
        {xLabels.map((l, i) => (
          <text
            key={`x-${i}`}
            x={x(l.idx)} y={h - 10}
            textAnchor={i === 0 ? "start" : i === xLabels.length - 1 ? "end" : "middle"}
            fontSize={9}
            fill="#7a6d57" fontFamily="var(--font-sans)"
            style={{ fontVariantNumeric: "tabular-nums", textTransform: "lowercase" }}
          >
            {l.label}
          </text>
        ))}

        {/* Área + linha */}
        <path d={area} fill="url(#priceArea)" />
        <path d={path} fill="none" stroke={lineColor} strokeWidth={2}
          strokeLinecap="round" strokeLinejoin="round" />

        {/* Hover guide + dot */}
        {hoverIdx !== null && (
          <g pointerEvents="none">
            <line
              x1={x(hoverIdx)} x2={x(hoverIdx)}
              y1={padTop} y2={h - padBot}
              stroke="rgba(201,168,76,0.45)"
              strokeWidth={1}
              strokeDasharray="4 3"
            />
            <circle
              cx={x(hoverIdx)} cy={y(history[hoverIdx]!.close)}
              r={5} fill={lineColor}
              stroke="#0d0b07" strokeWidth={2.5}
            />
          </g>
        )}
      </svg>

      {/* Tooltip estilo carteira */}
      {hoveredPoint && hoveredDate && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "12px",
            left: `clamp(8px, calc(${tooltipLeftPct}% - 120px), calc(100% - 248px))`,
            background: "rgba(15, 12, 7, 0.97)",
            border: "1px solid rgba(201,168,76,0.25)",
            borderRadius: "10px",
            padding: "12px 14px",
            minWidth: "240px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,0,0,0.4)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            pointerEvents: "none",
            zIndex: 5,
          }}
        >
          <p style={{
            fontSize: "10px",
            fontWeight: 700,
            color: "#C9A84C",
            fontFamily: "var(--font-sans)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            margin: 0,
            marginBottom: "10px",
            paddingBottom: "8px",
            borderBottom: "1px solid rgba(201,168,76,0.12)",
            fontVariantNumeric: "tabular-nums",
          }}>
            {hoveredDate.toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }).replace(/\.$/, "")}
          </p>

          <TooltipRow
            label="Preço atual"
            value={`R$ ${hoveredPoint.close.toFixed(2).replace(".", ",")}`}
            highlight
          />
          {avg52w !== null && (
            <TooltipRow
              label="Preço médio 52sem"
              value={`R$ ${avg52w.toFixed(2).replace(".", ",")}`}
              delta={(() => {
                const d = ((hoveredPoint.close - avg52w) / avg52w) * 100;
                return {
                  text: `${d >= 0 ? "+" : ""}${d.toFixed(1)}%`,
                  color: d >= 0 ? "#34d399" : "#f87171",
                };
              })()}
            />
          )}
          {low52w !== null && (
            <TooltipRow
              label="Mínima 52sem"
              value={`R$ ${low52w.toFixed(2).replace(".", ",")}`}
              valueColor="#f87171"
            />
          )}
          {high52w !== null && (
            <TooltipRow
              label="Máxima 52sem"
              value={`R$ ${high52w.toFixed(2).replace(".", ",")}`}
              valueColor="#34d399"
            />
          )}
        </div>
      )}
    </div>
  );
}

function TooltipRow({
  label, value, highlight, valueColor, delta,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  valueColor?: string;
  delta?: { text: string; color: string };
}) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "16px",
      padding: "5px 0",
    }}>
      <span style={{
        fontSize: "11px",
        color: "#a09068",
        fontFamily: "var(--font-sans)",
        whiteSpace: "nowrap",
      }}>
        {label}
      </span>
      <span style={{
        display: "flex",
        alignItems: "baseline",
        gap: "8px",
        fontVariantNumeric: "tabular-nums",
      }}>
        <span style={{
          fontSize: highlight ? "14px" : "12px",
          fontWeight: highlight ? 700 : 600,
          color: valueColor ?? (highlight ? "#e8dcc0" : "#c8b89a"),
          fontFamily: "var(--font-display)",
        }}>
          {value}
        </span>
        {delta && (
          <span style={{
            fontSize: "10px",
            fontWeight: 600,
            color: delta.color,
            fontFamily: "var(--font-sans)",
          }}>
            {delta.text}
          </span>
        )}
      </span>
    </div>
  );
}

function DividendBars({ data, type, price }: {
  data: { year: number; total: number }[];
  type: "yield" | "value";
  price: number;
}) {
  if (data.length === 0) {
    return <Empty text="Sem histórico de dividendos." />;
  }
  const w = 1100, h = 220, pad = 30;
  const values = data.map((d) => type === "value" ? d.total : (price > 0 ? (d.total / price) * 100 : 0));
  const max = Math.max(...values, 0.01);
  const barW = (w - pad * 2) / data.length * 0.7;
  const gap = (w - pad * 2) / data.length * 0.3;
  return (
    <div style={{ overflow: "hidden", borderRadius: "10px", background: "#0d0b07", padding: "8px" }}>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "auto", display: "block" }}>
        {data.map((d, i) => {
          const v = values[i];
          const barH = (v / max) * (h - pad * 2);
          const x = pad + i * (barW + gap);
          const y = h - pad - barH;
          return (
            <g key={d.year}>
              <rect x={x} y={y} width={barW} height={barH} fill="#C9A84C" rx={3} />
              <text x={x + barW / 2} y={h - 8} textAnchor="middle"
                fontSize={10} fill="#a09068" fontFamily="var(--font-sans)">
                {d.year}
              </text>
              <text x={x + barW / 2} y={y - 4} textAnchor="middle"
                fontSize={9} fill="#C9A84C" fontFamily="var(--font-sans)" fontWeight={600}>
                {type === "value" ? `R$ ${v.toFixed(2)}` : `${v.toFixed(1)}%`}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function RevenueChart({ data }: { data: IncomeYear[] }) {
  if (data.length === 0) return <Empty text="Sem dados financeiros." />;
  const w = 1100, h = 240, pad = 30;
  const maxRev = Math.max(...data.map((d) => d.revenue), 0.01);
  const minProfit = Math.min(...data.map((d) => d.profit), 0);
  const top = Math.max(maxRev, Math.max(...data.map((d) => d.profit), 0));
  const bottom = Math.min(0, minProfit);
  const range = top - bottom || 1;
  const groupW = (w - pad * 2) / data.length;
  const barW = (groupW * 0.4);

  const yFor = (v: number) => pad + (1 - (v - bottom) / range) * (h - pad * 2);
  const zeroY = yFor(0);

  return (
    <div style={{ overflow: "hidden", borderRadius: "10px", background: "#0d0b07", padding: "8px" }}>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "auto", display: "block" }}>
        {[0, 0.25, 0.5, 0.75, 1].map((p) => (
          <line key={p} x1={pad} x2={w - pad} y1={pad + p * (h - pad * 2)} y2={pad + p * (h - pad * 2)}
            stroke="rgba(201,168,76,0.06)" strokeWidth={1} />
        ))}
        <line x1={pad} x2={w - pad} y1={zeroY} y2={zeroY} stroke="rgba(201,168,76,0.15)" strokeWidth={1} />
        {data.map((d, i) => {
          const cx = pad + i * groupW + groupW / 2;
          const yRev = yFor(Math.max(d.revenue, 0));
          const yProf = yFor(Math.max(d.profit, 0));
          const hRev = Math.abs(yRev - zeroY);
          const hProf = Math.abs(yProf - zeroY);
          const profY = d.profit >= 0 ? yProf : zeroY;
          const profH = d.profit < 0 ? Math.abs(yFor(d.profit) - zeroY) : hProf;
          return (
            <g key={d.year}>
              <rect x={cx - barW - 1} y={d.revenue >= 0 ? yRev : zeroY} width={barW} height={hRev} fill="#34d399" rx={2} />
              <rect x={cx + 1} y={profY} width={barW} height={profH} fill="#C58A3D" rx={2} />
              <text x={cx} y={h - 8} textAnchor="middle" fontSize={10} fill="#a09068" fontFamily="var(--font-sans)">
                {d.year}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function DivRow({ dividend }: { dividend: BrapiCashDividend }) {
  const tipo = dividend.label?.toLowerCase().includes("jcp") || dividend.type?.toLowerCase().includes("jcp")
    ? "JCP" : "Dividendos";
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      background: "#0d0b07",
      border: "1px solid rgba(201,168,76,0.08)",
      borderRadius: "8px", padding: "10px 14px",
    }}>
      <div>
        <p style={{ fontSize: "12px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-sans)", marginBottom: "2px" }}>
          {tipo}
        </p>
        <p style={{ fontSize: "10px", color: "#a09068", fontFamily: "var(--font-sans)" }}>
          {dividend.approvedOn && `aviso: ${formatDate(dividend.approvedOn)}`}
          {dividend.approvedOn && dividend.paymentDate && " · "}
          {dividend.paymentDate && `pgto: ${formatDate(dividend.paymentDate)}`}
        </p>
      </div>
      <p style={{ fontSize: "14px", fontWeight: 700, color: "#34d399", fontFamily: "var(--font-display)" }}>
        R$ {dividend.rate?.toFixed(2).replace(".", ",")}
      </p>
    </div>
  );
}

function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  return (
    <div style={{
      display: "flex", justifyContent: "center", alignItems: "center", gap: "6px",
      marginTop: "14px",
    }}>
      <button onClick={() => onChange(Math.max(0, page - 1))} disabled={page === 0}
        style={{
          background: "transparent",
          border: "1px solid rgba(201,168,76,0.12)",
          borderRadius: "6px", padding: "5px 10px",
          color: "#9a8a6a", fontSize: "11px",
          fontFamily: "var(--font-sans)",
          cursor: page === 0 ? "not-allowed" : "pointer",
          opacity: page === 0 ? 0.4 : 1,
        }}>
        Anterior
      </button>
      {Array.from({ length: Math.min(total, 5) }, (_, i) => (
        <button key={i} onClick={() => onChange(i)}
          style={{
            background: page === i ? "linear-gradient(135deg, #C9A84C, #A07820)" : "transparent",
            border: page === i ? "none" : "1px solid rgba(201,168,76,0.12)",
            borderRadius: "6px", padding: "5px 10px", minWidth: "32px",
            color: page === i ? "#0d0b07" : "#9a8a6a",
            fontSize: "11px", fontWeight: page === i ? 600 : 500,
            fontFamily: "var(--font-sans)", cursor: "pointer",
          }}>
          {i + 1}
        </button>
      ))}
      <button onClick={() => onChange(Math.min(total - 1, page + 1))} disabled={page >= total - 1}
        style={{
          background: "transparent",
          border: "1px solid rgba(201,168,76,0.12)",
          borderRadius: "6px", padding: "5px 10px",
          color: "#9a8a6a", fontSize: "11px",
          fontFamily: "var(--font-sans)",
          cursor: page >= total - 1 ? "not-allowed" : "pointer",
          opacity: page >= total - 1 ? 0.4 : 1,
        }}>
        Próximas →
      </button>
    </div>
  );
}

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0",
      borderBottom: "1px solid rgba(201,168,76,0.05)" }}>
      <span style={{ fontSize: "11px", color: "#a09068", fontFamily: "var(--font-sans)" }}>{label}</span>
      <span style={{ fontSize: "12px", color: "#e8dcc0", fontFamily: "var(--font-sans)", fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
      <span style={{ width: "10px", height: "10px", background: color, borderRadius: "2px" }} />
      <span style={{ fontSize: "11px", color: "#9a8a6a", fontFamily: "var(--font-sans)" }}>{label}</span>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div style={{
      padding: "24px", textAlign: "center",
      color: "#a09068", fontSize: "12px",
      fontFamily: "var(--font-sans)",
    }}>
      {text}
    </div>
  );
}

interface NewsItem {
  id: string;
  title: string;
  link: string;
  pubDate: string | null;
  category: string | null;
}

function NewsList({ ticker }: { ticker: string }) {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch(`/api/market-news?ticker=${encodeURIComponent(ticker)}`, { signal: ctrl.signal });
        if (!res.ok) { setLoading(false); return; }
        const data = await res.json();
        setItems((data?.items ?? []) as NewsItem[]);
      } catch {
        // ignore
      }
      setLoading(false);
    })();
    return () => ctrl.abort();
  }, [ticker]);

  if (loading) {
    return <Empty text="Carregando notícias..." />;
  }
  if (items.length === 0) {
    return <Empty text="Nenhuma notícia recente disponível." />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {items.map((n) => (
        <a
          key={n.id}
          href={n.link}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: "#0d0b07",
            border: "1px solid rgba(201,168,76,0.06)",
            borderRadius: "8px",
            padding: "10px 14px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            textDecoration: "none",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: "12px", color: "#c8b89a", fontFamily: "var(--font-sans)", lineHeight: 1.45, marginBottom: "3px" }}>
              {n.title}
            </p>
            <p style={{ fontSize: "10px", color: "#9a8a6a", fontFamily: "var(--font-sans)" }}>
              {n.category ?? "InfoMoney"}{n.pubDate ? ` · ${formatRelativeDate(n.pubDate)}` : ""}
            </p>
          </div>
          <ExternalLink size={11} style={{ color: "#a09068", flexShrink: 0 }} />
        </a>
      ))}
    </div>
  );
}

function formatRelativeDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const diffMs = Date.now() - d.getTime();
  const diffH = diffMs / 3.6e6;
  if (diffH < 1) return `${Math.max(1, Math.round(diffMs / 60000))} min`;
  if (diffH < 24) return `${Math.round(diffH)}h`;
  const diffD = diffH / 24;
  if (diffD < 7) return `${Math.round(diffD)}d`;
  return d.toLocaleDateString("pt-BR");
}

// ─── Format helpers ───────────────────────────────────────────────────────────

function fmtNum(v: number | null | undefined, dec: number): string {
  return v !== null && v !== undefined && !isNaN(v) ? v.toFixed(dec) : "—";
}

function fmtPct(v: number | null | undefined): string {
  if (v === null || v === undefined || isNaN(v)) return "—";
  // brapi retorna ratios como 0.15 = 15%
  const pct = Math.abs(v) <= 1.5 ? v * 100 : v;
  return `${pct.toFixed(2)}%`;
}

// Sempre interpreta entrada como decimal (0.085 → "8,50%"), sem heurística.
function fmtPctDecimal(v: number | null | undefined): string {
  if (v === null || v === undefined || isNaN(v)) return "—";
  return `${(v * 100).toFixed(2).replace(".", ",")}%`;
}

function fmtMoney(v: number | null | undefined): string {
  if (v === null || v === undefined || isNaN(v)) return "—";
  if (Math.abs(v) >= 1e9) return `R$ ${(v / 1e9).toFixed(2).replace(".", ",")} Bi`;
  if (Math.abs(v) >= 1e6) return `R$ ${(v / 1e6).toFixed(2).replace(".", ",")} Mi`;
  if (Math.abs(v) >= 1e3) return `R$ ${(v / 1e3).toFixed(2).replace(".", ",")} Mil`;
  return `R$ ${v.toFixed(2).replace(".", ",")}`;
}

function fmtBig(v: number): string {
  if (v >= 1e9) return `${(v / 1e9).toFixed(2).replace(".", ",")} Bi`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(2).replace(".", ",")} Mi`;
  return v.toLocaleString("pt-BR");
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR");
  } catch {
    return iso;
  }
}
