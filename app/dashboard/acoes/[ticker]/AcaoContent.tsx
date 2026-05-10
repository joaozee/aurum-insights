"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, TrendingUp, TrendingDown, Info, X, ChevronDown,
  CheckCircle2, XCircle, Building2, Calendar as CalendarIcon,
  Newspaper, ExternalLink, Plus,
} from "lucide-react";

// ─── Tipos brapi ──────────────────────────────────────────────────────────────

interface BrapiCashDividend {
  paymentDate: string;
  approvedOn?: string;
  rate: number;
  label?: string;
  type?: string;
}

interface BrapiHistoricalPrice {
  date: number;
  close: number;
  high?: number;
  low?: number;
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
  };
  financialData?: {
    currentRatio?: number;
    debtToEquity?: number;
    grossMargins?: number;
    operatingMargins?: number;
    profitMargins?: number;
    ebitdaMargins?: number;
    returnOnAssets?: number;
    returnOnEquity?: number;
    totalRevenue?: number;
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

export default function AcaoContent({ ticker }: { ticker: string }) {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>("1y");
  const [quote, setQuote] = useState<BrapiQuoteFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [comparados, setComparados] = useState<string[]>([ticker]);
  const [novoTicker, setNovoTicker] = useState("");
  const [comparePeriod, setComparePeriod] = useState<"1y" | "5y" | "10y">("1y");
  const [divChartType, setDivChartType] = useState<"yield" | "value">("yield");
  const [calendarPage, setCalendarPage] = useState(0);

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

  // Métricas calculadas
  const metrics = useMemo(() => calculateMetrics(quote), [quote]);
  const checklist = useMemo(() => buildChecklist(metrics), [metrics]);
  const dividends = useMemo(() => buildDividends(quote), [quote]);
  const incomeData = useMemo(() => buildIncomeData(quote), [quote]);

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
          background: "#130f09",
          border: "1px solid rgba(201,168,76,0.1)",
          borderRadius: "14px", padding: "20px 24px",
          marginBottom: "16px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px", marginBottom: "16px" }}>
            <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
              {quote.logourl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={quote.logourl} alt="" style={{
                  width: "44px", height: "44px", borderRadius: "10px",
                  background: "#fff", objectFit: "contain", padding: "4px",
                }} />
              )}
              <div>
                <p style={{
                  fontSize: "16px", fontWeight: 700, color: "#e8dcc0",
                  fontFamily: "var(--font-display)", marginBottom: "4px",
                }}>
                  {quote.longName ?? quote.shortName ?? ticker}
                </p>
                <span style={{
                  fontSize: "10px", fontWeight: 700, color: "#C9A84C",
                  background: "rgba(201,168,76,0.1)",
                  padding: "3px 8px", borderRadius: "4px",
                  fontFamily: "var(--font-sans)", letterSpacing: "0.06em",
                }}>
                  {ticker}
                </span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{
                fontSize: "26px", fontWeight: 700, color: "#e8dcc0",
                fontFamily: "var(--font-display)", letterSpacing: "-0.01em",
              }}>
                R$ {quote.regularMarketPrice?.toFixed(2).replace(".", ",")}
              </p>
              <p style={{
                fontSize: "12px", fontWeight: 600, color: priceColor,
                fontFamily: "var(--font-sans)",
                display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px",
              }}>
                {positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                R$ {Math.abs(quote.regularMarketChange ?? 0).toFixed(2).replace(".", ",")} ({positive ? "+" : ""}{quote.regularMarketChangePercent?.toFixed(2)}%)
              </p>
            </div>
          </div>

          {/* 4 chips */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
            <MetricChip color="#34d399" label="Preço Atual" value={`R$ ${quote.regularMarketPrice?.toFixed(2).replace(".", ",")}`} sub="Cotação atual" />
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
          <PriceChart history={quote.historicalDataPrice ?? []} positive={positive} />
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px",
            marginTop: "16px", paddingTop: "14px",
            borderTop: "1px solid rgba(201,168,76,0.06)",
          }}>
            <MiniStat label="Mínima 1A" value={quote.fiftyTwoWeekLow !== undefined ? `R$ ${quote.fiftyTwoWeekLow.toFixed(2).replace(".", ",")}` : "—"} color="#f87171" />
            <MiniStat label="Máxima 1A" value={quote.fiftyTwoWeekHigh !== undefined ? `R$ ${quote.fiftyTwoWeekHigh.toFixed(2).replace(".", ",")}` : "—"} color="#34d399" />
            <MiniStat label="RSI 14 dias" value="N/A" color="#9a8a6a" />
            <MiniStat label="RSI 200 dias" value="N/A" color="#9a8a6a" />
          </div>
        </Section>

        {/* INDICADORES FUNDAMENTALISTAS */}
        <Section>
          <SectionHeader title="Indicadores Fundamentalistas">
            <select disabled style={{
              background: "#0d0b07",
              border: "1px solid rgba(201,168,76,0.1)",
              borderRadius: "6px", padding: "5px 10px",
              color: "#9a8a6a", fontSize: "11px",
              fontFamily: "var(--font-sans)", outline: "none",
            }}>
              <option>Sem comparação</option>
            </select>
          </SectionHeader>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px",
          }}>
            <Indicator label="P/L" value={fmtNum(metrics.pl, 2)} />
            <Indicator label="P/VP" value={fmtNum(metrics.pvp, 2)} />
            <Indicator label="Dividend Yield" value={metrics.dy !== null ? `${metrics.dy.toFixed(2)}%` : "—"} />
            <Indicator label="Payout" value={metrics.payout !== null ? `${metrics.payout.toFixed(2)}%` : "—"} />
            <Indicator label="EV/EBITDA" value={fmtNum(quote.defaultKeyStatistics?.enterpriseToEbitda, 2)} />
            <Indicator label="EV/EBIT" value={fmtNum(metrics.evEbit, 2)} />
            <Indicator label="LPA" value={quote.earningsPerShare !== null && quote.earningsPerShare !== undefined ? `R$ ${quote.earningsPerShare.toFixed(2).replace(".", ",")}` : "—"} />
            <Indicator label="VPA" value={quote.defaultKeyStatistics?.bookValue !== undefined ? `R$ ${quote.defaultKeyStatistics.bookValue.toFixed(2).replace(".", ",")}` : "—"} />
            <Indicator label="Dívida Líquida" value={fmtMoney(metrics.netDebt)} />
            <Indicator label="Dív. Líq./PL" value={fmtNum(metrics.netDebtToEquity, 2)} />
            <Indicator label="Dív. Líq./EBITDA" value={fmtNum(metrics.netDebtToEbitda, 2)} />
            <Indicator label="Passivos/Ativos" value={fmtPct(metrics.liabilitiesToAssets)} />
            <Indicator label="Liquidez Corrente" value={fmtNum(quote.financialData?.currentRatio, 2)} />
            <Indicator label="Margem Bruta" value={fmtPct(quote.financialData?.grossMargins)} />
            <Indicator label="Margem Líquida" value={fmtPct(quote.financialData?.profitMargins)} />
            <Indicator label="Margem EBITDA" value={fmtPct(quote.financialData?.ebitdaMargins)} />
            <Indicator label="Margem Operacional" value={fmtPct(quote.financialData?.operatingMargins)} />
            <Indicator label="ROE" value={fmtPct(quote.financialData?.returnOnEquity)} />
            <Indicator label="ROA" value={fmtPct(quote.financialData?.returnOnAssets)} />
            <Indicator label="CAGR Receita 5A" value={fmtPct(quote.financialData?.revenueGrowth)} />
            <Indicator label="CAGR Lucro 5A" value={fmtPct(quote.financialData?.earningsGrowth)} />
            <Indicator label="Receita Líquida" value={fmtMoney(quote.financialData?.totalRevenue)} />
            <Indicator label="EBITDA" value={fmtMoney(quote.financialData?.ebitda)} />
            <Indicator label="Lucro Líquido" value={fmtMoney(metrics.netIncome)} />
            <Indicator label="Free Cash Flow" value={fmtMoney(quote.financialData?.freeCashflow)} />
            <Indicator label="Beta" value={fmtNum(quote.defaultKeyStatistics?.beta, 2)} />
          </div>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px",
            marginTop: "16px", paddingTop: "14px",
            borderTop: "1px solid rgba(201,168,76,0.06)",
          }}>
            <MiniStat label="Market Cap" value={fmtMoney(quote.marketCap)} color="#9a8a6a" />
            <MiniStat label="Qtd. de Ações" value={quote.sharesOutstanding ? fmtBig(quote.sharesOutstanding) : "—"} color="#9a8a6a" />
            <MiniStat label="Beta" value={fmtNum(quote.defaultKeyStatistics?.beta, 2)} color="#9a8a6a" />
            <MiniStat label="Vol. Médio (90d)" value="—" color="#9a8a6a" />
          </div>
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
          <SectionHeader title="Comparação de Ativos" />
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
                background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
                border: "none", borderRadius: "8px",
                padding: "0 16px", color: "#fff",
                fontSize: "12px", fontWeight: 600,
                fontFamily: "var(--font-sans)", cursor: "pointer",
                display: "flex", alignItems: "center", gap: "5px",
              }}
            >
              <Plus size={12} /> Adicionar
            </button>
          </div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
            {comparados.map((t) => (
              <div key={t} style={{
                display: "flex", alignItems: "center", gap: "6px",
                background: t === ticker ? "rgba(201,168,76,0.12)" : "rgba(139,92,246,0.12)",
                border: `1px solid ${t === ticker ? "rgba(201,168,76,0.3)" : "rgba(139,92,246,0.3)"}`,
                borderRadius: "6px", padding: "4px 10px",
                fontSize: "11px", fontWeight: 600,
                color: t === ticker ? "#C9A84C" : "#a89aba",
                fontFamily: "var(--font-sans)",
              }}>
                {t}
                {t !== ticker && (
                  <button
                    onClick={() => setComparados(comparados.filter((x) => x !== t))}
                    style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer", padding: 0, display: "flex" }}
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            <span style={{ fontSize: "11px", color: "#a09068", fontFamily: "var(--font-sans)", padding: "5px 0" }}>Período:</span>
            {(["1y", "5y", "10y"] as const).map((p) => (
              <PillBtn key={p} active={p === comparePeriod} onClick={() => setComparePeriod(p)}>
                {p === "1y" ? "1 Ano" : p === "5y" ? "5 Anos" : "10 Anos"}
              </PillBtn>
            ))}
          </div>
        </Section>

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
            <DataRow label="Nº Total de Papéis" value={quote.sharesOutstanding ? fmtBig(quote.sharesOutstanding) : "—"} />
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
      </div>
    </div>
  );
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
}

function calculateMetrics(q: BrapiQuoteFull | null): Metrics {
  if (!q) return {
    pl: null, pvp: null, dy: null, payout: null, evEbit: null,
    netDebt: null, netDebtToEquity: null, netDebtToEbitda: null,
    liabilitiesToAssets: null, netIncome: null, equity: null,
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

  // EV/EBIT
  const ev = q.defaultKeyStatistics?.enterpriseValue ?? null;
  const ebit = (q.incomeStatementHistory?.incomeStatementHistory ?? [])[0]?.ebit ?? null;
  const evEbit = ev !== null && ebit !== null && ebit > 0 ? ev / ebit : null;

  // Net Debt = totalDebt - totalCash
  const totalDebt = q.financialData?.totalDebt ?? null;
  const totalCash = q.financialData?.totalCash ?? null;
  const netDebt = totalDebt !== null && totalCash !== null ? totalDebt - totalCash : null;

  // Equity
  const bs = q.balanceSheetHistory?.balanceSheetStatements?.[0];
  const equity = bs?.totalStockholderEquity ?? null;
  const totalAssets = bs?.totalAssets ?? null;
  const totalLiab = bs?.totalLiab ?? null;

  const netDebtToEquity = netDebt !== null && equity !== null && equity > 0 ? netDebt / equity : null;
  const ebitda = q.financialData?.ebitda ?? null;
  const netDebtToEbitda = netDebt !== null && ebitda !== null && ebitda > 0 ? netDebt / ebitda : null;
  const liabilitiesToAssets = totalLiab !== null && totalAssets !== null && totalAssets > 0
    ? totalLiab / totalAssets
    : null;

  const netIncome = (q.incomeStatementHistory?.incomeStatementHistory ?? [])[0]?.netIncome ?? null;

  return {
    pl, pvp, dy, payout, evEbit,
    netDebt, netDebtToEquity, netDebtToEbitda,
    liabilitiesToAssets, netIncome, equity,
  };
}

// ─── Checklist ────────────────────────────────────────────────────────────────

interface ChecklistItem { label: string; description: string; passed: boolean }
interface ChecklistGroupT { title: string; items: ChecklistItem[]; passed: number; total: number }

function buildChecklist(m: Metrics): {
  groups: ChecklistGroupT[]; passedTotal: number; total: number; scorePct: number;
} {
  const groups: ChecklistGroupT[] = [
    {
      title: "Análise Fundamentalista",
      items: [
        { label: "P/L Atrativo", description: "P/L menor que 15", passed: m.pl !== null && m.pl > 0 && m.pl < 15 },
        { label: "P/VP Atrativo", description: "Preço/Valor Patrimonial menor que 1,5", passed: m.pvp !== null && m.pvp > 0 && m.pvp < 1.5 },
        { label: "ROE Elevado", description: "Retorno do Equity acima de 15%", passed: false }, // ROE precisa de mais cálculo
        { label: "Margens Saudáveis", description: "Margem líquida acima de 10%", passed: false },
      ],
      passed: 0, total: 4,
    },
    {
      title: "Saúde Financeira",
      items: [
        { label: "Dívida Controlada", description: "Dív. Líq./EBITDA menor que 3", passed: m.netDebtToEbitda !== null && m.netDebtToEbitda < 3 },
        { label: "Liquidez Corrente OK", description: "Liquidez corrente acima de 1", passed: false },
        { label: "Passivos sob controle", description: "Passivos/Ativos abaixo de 60%", passed: m.liabilitiesToAssets !== null && m.liabilitiesToAssets < 0.6 },
        { label: "Free Cash Flow positivo", description: "Geração de caixa positiva", passed: false },
      ],
      passed: 0, total: 4,
    },
    {
      title: "Retorno ao Acionista",
      items: [
        { label: "Dividend Yield Bom", description: "DY acima de 5%", passed: m.dy !== null && m.dy >= 5 },
        { label: "Payout Sustentável", description: "Payout entre 30% e 80%", passed: m.payout !== null && m.payout >= 30 && m.payout <= 80 },
        { label: "Histórico de Dividendos", description: "Distribuição consistente", passed: false },
      ],
      passed: 0, total: 3,
    },
    {
      title: "Posicionamento de Mercado",
      items: [
        { label: "Valor de Mercado Sólido", description: "Market Cap relevante", passed: false },
        { label: "Volume de Negociação", description: "Liquidez adequada", passed: false },
        { label: "Crescimento de Receita", description: "Receita crescente", passed: false },
      ],
      passed: 0, total: 3,
    },
  ];

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
  if (pct >= 70) return "#34d399";
  if (pct >= 40) return "#C58A3D";
  return "#f87171";
}

function scoreLabel(pct: number): string {
  if (pct >= 70) return "Candidato forte";
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
      }}>
        {value}
      </p>
      <p style={{ fontSize: "10px", color: "#9a8a6a", fontFamily: "var(--font-sans)" }}>
        {sub}
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

function Indicator({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      background: "#0d0b07",
      border: "1px solid rgba(201,168,76,0.06)",
      borderRadius: "8px", padding: "10px 12px",
    }}>
      <p style={{
        fontSize: "9px", fontWeight: 600, color: "#a09068",
        fontFamily: "var(--font-sans)", letterSpacing: "0.05em",
        marginBottom: "6px", textTransform: "uppercase",
      }}>
        {label}
      </p>
      <p style={{ fontSize: "14px", fontWeight: 700, color: "#e8dcc0", fontFamily: "var(--font-display)" }}>
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

function ChecklistGroup({ group }: { group: ChecklistGroupT }) {
  const [open, setOpen] = useState(group.passed > 0 && group.passed < group.total);
  return (
    <div style={{
      background: "#0d0b07",
      border: "1px solid rgba(201,168,76,0.08)",
      borderRadius: "10px", overflow: "hidden",
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", display: "flex",
          justifyContent: "space-between", alignItems: "center",
          padding: "12px 16px", background: "transparent",
          border: "none", cursor: "pointer", textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-sans)" }}>
            {group.title}
          </span>
          <span style={{
            fontSize: "11px", fontWeight: 600,
            color: scoreColor((group.passed / group.total) * 100),
            background: `${scoreColor((group.passed / group.total) * 100)}1a`,
            padding: "2px 8px", borderRadius: "4px",
            fontFamily: "var(--font-sans)",
          }}>
            {group.passed}/{group.total}
          </span>
        </div>
        <ChevronDown size={14} style={{ color: "#a09068", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
      </button>
      {open && (
        <div style={{ padding: "0 16px 12px", display: "flex", flexDirection: "column", gap: "6px" }}>
          {group.items.map((item, i) => (
            <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
              {item.passed ? (
                <CheckCircle2 size={13} style={{ color: "#34d399", flexShrink: 0, marginTop: "2px" }} />
              ) : (
                <XCircle size={13} style={{ color: "#f87171", flexShrink: 0, marginTop: "2px" }} />
              )}
              <div>
                <p style={{ fontSize: "12px", fontWeight: 500, color: "#e8dcc0", fontFamily: "var(--font-sans)", marginBottom: "2px" }}>
                  {item.label}
                </p>
                <p style={{ fontSize: "11px", color: "#a09068", fontFamily: "var(--font-sans)", lineHeight: 1.4 }}>
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

function PriceChart({ history, positive }: { history: BrapiHistoricalPrice[]; positive: boolean }) {
  if (history.length < 2) {
    return (
      <div style={{ height: "220px", display: "flex", alignItems: "center", justifyContent: "center", color: "#9a8a6a", fontSize: "12px", fontFamily: "var(--font-sans)" }}>
        Sem dados históricos suficientes.
      </div>
    );
  }
  const w = 1100, h = 220, pad = 28;
  const closes = history.map((h) => h.close);
  const min = Math.min(...closes), max = Math.max(...closes);
  const range = max - min || 1;
  const step = (w - pad * 2) / (history.length - 1);
  const points = history.map((p, i) => {
    const x = pad + i * step;
    const y = pad + (1 - (p.close - min) / range) * (h - pad * 2);
    return [x, y] as const;
  });
  const lineColor = positive ? "#34d399" : "#f87171";
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${path} L${points[points.length - 1][0].toFixed(1)},${h - pad} L${points[0][0].toFixed(1)},${h - pad} Z`;
  return (
    <div style={{ overflow: "hidden", borderRadius: "10px", background: "#0d0b07", padding: "8px" }}>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <defs>
          <linearGradient id="priceArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity={0.3} />
            <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((p) => (
          <line key={p} x1={pad} x2={w - pad} y1={pad + p * (h - pad * 2)} y2={pad + p * (h - pad * 2)}
            stroke="rgba(201,168,76,0.06)" strokeWidth={1} />
        ))}
        <path d={area} fill="url(#priceArea)" />
        <path d={path} fill="none" stroke={lineColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
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

function NewsList({ ticker }: { ticker: string }) {
  // brapi não retorna notícias por ticker no plano free; mostramos mock.
  const news = [
    { titulo: `Ações de ${ticker} ganham com fim das "saídas vencerosas"; volta o pregão`, data: "14:21", fonte: "Suno Notícias" },
    { titulo: `Vale a compra? Duas visões do mercado sobre o que fazer com as ações da mineradora`, data: "12:30", fonte: "InfoMoney" },
    { titulo: `${ticker}: BB recua preço-alvo e estimativas para ${ticker} (3T25)`, data: "08:43", fonte: "Bloomberg" },
    { titulo: `${ticker} ainda está barato? Banco fica aposta "seguro" e vê yield de até 16%`, data: "Ontem", fonte: "Suno" },
    { titulo: `Os dividendos de ${ticker} estão ainda mais perto do esticável? O que levou a Itaú a recomendar compra`, data: "Ontem", fonte: "Seu Dinheiro" },
    { titulo: `${ticker} atinge recorde histórico. Ainda vale a pena entrar?`, data: "10/11", fonte: "Money Times" },
    { titulo: `Ações de ${ticker} podem destravar mais valor graças a uma 'joia da casa' pouco conhecida`, data: "10/11", fonte: "InfoMoney" },
    { titulo: `${ticker} perde força após topo. O que esperar do papel agora?`, data: "09/11", fonte: "Bloomberg" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {news.map((n, i) => (
        <div key={i} style={{
          background: "#0d0b07",
          border: "1px solid rgba(201,168,76,0.06)",
          borderRadius: "8px", padding: "10px 14px",
          display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px",
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: "12px", color: "#c8b89a", fontFamily: "var(--font-sans)", lineHeight: 1.45, marginBottom: "3px" }}>
              {n.titulo}
            </p>
            <p style={{ fontSize: "10px", color: "#9a8a6a", fontFamily: "var(--font-sans)" }}>
              {n.fonte} · {n.data}
            </p>
          </div>
          <ExternalLink size={11} style={{ color: "#a09068", flexShrink: 0 }} />
        </div>
      ))}
    </div>
  );
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
