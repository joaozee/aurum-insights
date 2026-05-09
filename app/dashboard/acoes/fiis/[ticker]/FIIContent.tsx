"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, TrendingUp, TrendingDown, Building2, Layers,
  Calendar as CalendarIcon, Briefcase, Users, Wallet,
  ExternalLink, Info,
} from "lucide-react";

// ─── Tipos do response /api/fii-detail/[ticker] ───────────────────────────────

interface FIIIndicator {
  symbol: string;
  name?: string;
  cnpj?: string;
  segment?: string;
  sector?: string;
  managementType?: string;
  mandate?: string;
  pvp?: number;
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

interface FIIReport {
  symbol: string;
  name?: string | null;
  cnpj?: string;
  administratorName?: string;
  administratorCnpj?: string;
  administratorAddress?: string;
  administratorAddressNumber?: string;
  administratorDistrict?: string;
  administratorCity?: string;
  administratorState?: string;
  administratorPhone1?: string;
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

interface FIIDividend {
  symbol?: string;
  paymentDate?: string;
  approvedOn?: string;
  rate?: number;
  type?: string;
  label?: string;
}

interface QuoteResult {
  symbol: string;
  shortName?: string;
  longName?: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  marketCap?: number;
  logourl?: string;
  historicalDataPrice?: { date: number; close: number }[];
}

interface FIIDetailResponse {
  symbol: string;
  quote: QuoteResult | null;
  indicator: FIIIndicator | null;
  reports: FIIReport[];
  dividends: FIIDividend[];
  errors: { source: string; status: number | string }[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FIIContent({ ticker }: { ticker: string }) {
  const router = useRouter();
  const [data, setData] = useState<FIIDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [calendarPage, setCalendarPage] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/fii-detail/${encodeURIComponent(ticker)}`);
        if (res.ok && active) {
          setData(await res.json());
        }
      } catch (err) {
        console.error("[fii-detail]", err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [ticker]);

  const composition = useMemo(() => buildComposition(data?.reports[0] ?? null), [data]);
  const monthlyReturns = useMemo(() => buildMonthlyReturns(data?.reports ?? []), [data]);
  const monthlyYields = useMemo(() => buildMonthlyYields(data?.reports ?? []), [data]);

  if (loading) {
    return (
      <div style={{ minHeight: "calc(100vh - 58px)", background: "#0a0806", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#a09068", fontSize: "13px", fontFamily: "var(--font-sans)" }}>
          Carregando análise de {ticker}...
        </p>
      </div>
    );
  }

  if (!data || !data.quote) {
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
              FII não encontrado
            </p>
            <p style={{ fontSize: "12px", color: "#a09068", fontFamily: "var(--font-sans)" }}>
              Não foi possível carregar dados para <strong>{ticker}</strong>. Verifique o ticker.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const quote = data.quote;
  const ind = data.indicator;
  const lastReport = data.reports[0] ?? null;
  const positive = (quote.regularMarketChangePercent ?? 0) >= 0;
  const priceColor = positive ? "#10b981" : "#ef4444";

  // Indicators com fallback do report
  const pvp = ind?.pvp ?? (lastReport && quote.regularMarketPrice && lastReport.navPerShare
    ? quote.regularMarketPrice / lastReport.navPerShare
    : null);
  const dy12m = ind?.dividendYield12m ?? null;
  const dy1m = ind?.dividendYield1m ?? lastReport?.monthlyDividendYield ?? null;
  const navPerShare = ind?.navPerShare ?? lastReport?.navPerShare ?? null;
  const equity = ind?.equity ?? lastReport?.equity ?? null;
  const totalAssets = ind?.totalAssets ?? lastReport?.totalAssets ?? null;
  const investors = ind?.totalInvestors ?? lastReport?.totalInvestors ?? null;
  const sharesOutstanding = ind?.sharesOutstanding ?? lastReport?.sharesOutstanding ?? null;
  const adminFeeRate = ind?.adminFeeRate ?? lastReport?.adminFeeRate ?? null;

  return (
    <div style={{ minHeight: "calc(100vh - 58px)", background: "#0a0806" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 24px 64px" }}>
        <BackButton onClick={() => router.push("/dashboard/acoes")} />

        {/* HEADER + PREÇO */}
        <Section>
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
                <p style={{ fontSize: "16px", fontWeight: 700, color: "#e8dcc0", fontFamily: "var(--font-display)", marginBottom: "4px" }}>
                  {ind?.name ?? quote.longName ?? quote.shortName ?? ticker}
                </p>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  <Badge color="#06b6d4">FII · {ticker}</Badge>
                  {ind?.segment && <Badge color="#8b5cf6">{labelSegment(ind.segment)}</Badge>}
                  {ind?.managementType && <Badge color="#f59e0b">Gestão {labelMgmt(ind.managementType)}</Badge>}
                </div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "26px", fontWeight: 700, color: "#e8dcc0", fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}>
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

          {/* Chips principais */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
            <MetricChip color="#10b981" label="Dividend Yield 12m" value={fmtPct(dy12m)} sub="Renda passiva" />
            <MetricChip color="#06b6d4" label="P/VP" value={fmtNum(pvp, 2)} sub="Preço / Patrimônio" />
            <MetricChip color="#C9A84C" label="VP/cota" value={navPerShare !== null ? `R$ ${navPerShare.toFixed(2).replace(".", ",")}` : "—"} sub="Valor patrimonial" />
            <MetricChip color="#8b5cf6" label="DY 1m" value={fmtPct(dy1m)} sub="Último mês" />
          </div>
        </Section>

        {/* HISTÓRICO DE PREÇOS */}
        {quote.historicalDataPrice && quote.historicalDataPrice.length > 1 && (
          <Section>
            <SectionHeader title="Histórico de Preços (12 meses)" />
            <PriceChart history={quote.historicalDataPrice} positive={positive} />
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px",
              marginTop: "16px", paddingTop: "14px",
              borderTop: "1px solid rgba(201,168,76,0.06)",
            }}>
              <MiniStat label="Mínima 1A" value={quote.fiftyTwoWeekLow ? `R$ ${quote.fiftyTwoWeekLow.toFixed(2).replace(".", ",")}` : "—"} color="#ef4444" />
              <MiniStat label="Máxima 1A" value={quote.fiftyTwoWeekHigh ? `R$ ${quote.fiftyTwoWeekHigh.toFixed(2).replace(".", ",")}` : "—"} color="#10b981" />
              <MiniStat label="Valor de Mercado" value={fmtMoney(quote.marketCap)} color="#9a8a6a" />
            </div>
          </Section>
        )}

        {/* INDICADORES */}
        <Section>
          <SectionHeader title="Indicadores Fundamentalistas" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
            <Indicator label="P/VP" value={fmtNum(pvp, 2)} />
            <Indicator label="DY 1m" value={fmtPct(dy1m)} />
            <Indicator label="DY 12m" value={fmtPct(dy12m)} />
            <Indicator label="VP/cota" value={navPerShare !== null ? `R$ ${navPerShare.toFixed(2).replace(".", ",")}` : "—"} />
            <Indicator label="Patrimônio Líquido" value={fmtMoney(equity)} />
            <Indicator label="Total de Ativos" value={fmtMoney(totalAssets)} />
            <Indicator label="Cotas Emitidas" value={sharesOutstanding ? fmtBig(sharesOutstanding) : "—"} />
            <Indicator label="Cotistas" value={investors ? investors.toLocaleString("pt-BR") : "—"} />
            <Indicator label="Taxa de Adm. (a.m.)" value={fmtPct(adminFeeRate)} />
            <Indicator label="Passivo Total" value={fmtMoney(lastReport?.totalLiabilities)} />
            <Indicator label="A Distribuir" value={fmtMoney(lastReport?.distributionsPayable)} />
            <Indicator label="Amortização" value={fmtPct(lastReport?.amortizationRate)} />
          </div>
        </Section>

        {/* COMPOSIÇÃO PATRIMONIAL */}
        {composition.total > 0 && (
          <Section>
            <SectionHeader title="Composição Patrimonial">
              <span style={{ fontSize: "10px", color: "#9a8a6a", fontFamily: "var(--font-sans)" }}>
                Ref: {formatRefDate(lastReport?.referenceDate)}
              </span>
            </SectionHeader>
            <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: "20px", alignItems: "center" }}>
              <CompositionPie data={composition.slices} />
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {composition.slices.map((s) => (
                  <CompositionRow key={s.label} slice={s} total={composition.total} />
                ))}
              </div>
            </div>
          </Section>
        )}

        {/* RENTABILIDADE MENSAL */}
        {monthlyReturns.length > 1 && (
          <Section>
            <SectionHeader title="Rentabilidade Mensal" />
            <MonthlyReturnsChart data={monthlyReturns} />
            <div style={{ display: "flex", gap: "16px", justifyContent: "center", marginTop: "12px" }}>
              <LegendItem color="#10b981" label="Rentabilidade da cota" />
              <LegendItem color="#06b6d4" label="Rentabilidade patrimonial" />
            </div>
          </Section>
        )}

        {/* DIVIDEND YIELD MENSAL */}
        {monthlyYields.length > 1 && (
          <Section>
            <SectionHeader title="Dividend Yield Mensal" />
            <YieldChart data={monthlyYields} />
          </Section>
        )}

        {/* CALENDÁRIO DE PROVENTOS */}
        <Section>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <CalendarIcon size={14} style={{ color: "#C9A84C" }} />
            <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-display)" }}>
              Calendário de Proventos — {ticker}
            </h3>
          </div>
          {data.dividends.length === 0 ? (
            <Empty text="Sem proventos no período. (Dados podem exigir plano Pro fora de MXRF11/HGLG11.)" />
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {data.dividends.slice(calendarPage * 8, (calendarPage + 1) * 8).map((d, i) => (
                  <DivRow key={i} dividend={d} />
                ))}
              </div>
              {data.dividends.length > 8 && (
                <Pagination
                  page={calendarPage}
                  total={Math.ceil(data.dividends.length / 8)}
                  onChange={setCalendarPage}
                />
              )}
            </>
          )}
        </Section>

        {/* SOBRE O ADMINISTRADOR */}
        {(ind?.administratorName || lastReport?.administratorName) && (
          <Section>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <Briefcase size={14} style={{ color: "#C9A84C" }} />
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-display)" }}>
                Administrador
              </h3>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <DataRow label="Nome" value={ind?.administratorName ?? lastReport?.administratorName ?? "—"} />
              <DataRow label="CNPJ" value={ind?.administratorCnpj ?? lastReport?.administratorCnpj ?? "—"} />
              <DataRow label="Telefone" value={ind?.administratorPhone1 ?? lastReport?.administratorPhone1 ?? "—"} />
              <DataRow label="E-mail" value={ind?.administratorEmail ?? lastReport?.administratorEmail ?? "—"} />
              {(ind?.administratorWebsite ?? lastReport?.administratorWebsite) && (
                <DataRow label="Website" value={
                  <a href={withProtocol(ind?.administratorWebsite ?? lastReport?.administratorWebsite!)} target="_blank" rel="noopener noreferrer"
                    style={{ color: "#C9A84C", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    {(ind?.administratorWebsite ?? lastReport?.administratorWebsite)?.replace(/^https?:\/\//, "")}
                    <ExternalLink size={10} />
                  </a>
                } />
              )}
              {lastReport?.administratorCity && (
                <DataRow label="Localização" value={`${lastReport.administratorCity}/${lastReport.administratorState ?? ""}`} />
              )}
            </div>
          </Section>
        )}

        {/* DADOS DO FUNDO */}
        <Section>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <Building2 size={14} style={{ color: "#C9A84C" }} />
            <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-display)" }}>
              Dados do Fundo
            </h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <DataRow label="Ticker" value={ticker} />
            <DataRow label="Nome" value={ind?.name ?? quote.longName ?? "—"} />
            <DataRow label="CNPJ" value={ind?.cnpj ?? lastReport?.cnpj ?? "—"} />
            <DataRow label="Segmento" value={ind?.segment ? labelSegment(ind.segment) : "—"} />
            <DataRow label="Setor" value={ind?.sector ?? "—"} />
            <DataRow label="Tipo de Gestão" value={ind?.managementType ? labelMgmt(ind.managementType) : "—"} />
            <DataRow label="Mandato" value={ind?.mandate ?? "—"} />
            <DataRow label="Última atualização" value={lastReport?.referenceDate ? formatRefDate(lastReport.referenceDate) : "—"} />
          </div>
        </Section>

        {/* AVISOS */}
        {data.errors.length > 0 && (
          <div style={{
            background: "rgba(245,158,11,0.05)",
            border: "1px solid rgba(245,158,11,0.15)",
            borderRadius: "10px", padding: "12px 16px",
            display: "flex", gap: "10px", alignItems: "flex-start",
          }}>
            <Info size={14} style={{ color: "#f59e0b", marginTop: "2px", flexShrink: 0 }} />
            <p style={{ fontSize: "11px", color: "#bca08a", fontFamily: "var(--font-sans)", lineHeight: 1.5 }}>
              Algumas seções podem estar incompletas — endpoints exigem plano Pro do brapi para tickers fora de <code>MXRF11</code> e <code>HGLG11</code>.
              Fontes não disponíveis: <strong>{data.errors.map((e) => e.source).join(", ")}</strong>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Helpers de cálculo ───────────────────────────────────────────────────────

interface CompoSlice { label: string; value: number; color: string }
interface CompoData { total: number; slices: CompoSlice[] }

function buildComposition(r: FIIReport | null): CompoData {
  if (!r) return { total: 0, slices: [] };
  const raw: { label: string; value: number; color: string }[] = [
    { label: "CRI",                    value: r.cri ?? 0,             color: "#10b981" },
    { label: "LCI",                    value: r.lci ?? 0,             color: "#06b6d4" },
    { label: "Cotas de FIIs",          value: r.fiiHoldings ?? 0,     color: "#8b5cf6" },
    { label: "Imóveis",                value: r.realEstateAssets ?? 0, color: "#C9A84C" },
    { label: "Tít. Públicos",          value: r.governmentBonds ?? 0, color: "#f59e0b" },
    { label: "Tít. Privados",          value: r.privateBonds ?? 0,    color: "#ef4444" },
    { label: "Renda Fixa",             value: r.fixedIncomeFunds ?? 0, color: "#ec4899" },
    { label: "Caixa",                  value: r.cash ?? 0,            color: "#6b7280" },
  ];
  const slices = raw.filter((s) => s.value > 0).sort((a, b) => b.value - a.value);
  const total = slices.reduce((acc, s) => acc + s.value, 0);
  return { total, slices };
}

interface MonthlyReturn { date: string; cota: number; patrim: number }

function buildMonthlyReturns(reports: FIIReport[]): MonthlyReturn[] {
  return [...reports]
    .filter((r) => r.monthlyReturn !== undefined || r.monthlyPatrimonialReturn !== undefined)
    .sort((a, b) => new Date(a.referenceDate).getTime() - new Date(b.referenceDate).getTime())
    .map((r) => ({
      date: r.referenceDate,
      cota: (r.monthlyReturn ?? 0) * 100,
      patrim: (r.monthlyPatrimonialReturn ?? 0) * 100,
    }));
}

interface MonthlyYield { date: string; yield: number }

function buildMonthlyYields(reports: FIIReport[]): MonthlyYield[] {
  return [...reports]
    .filter((r) => r.monthlyDividendYield !== undefined)
    .sort((a, b) => new Date(a.referenceDate).getTime() - new Date(b.referenceDate).getTime())
    .map((r) => ({
      date: r.referenceDate,
      yield: (r.monthlyDividendYield ?? 0) * 100,
    }));
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

function Section({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: "#130f09",
      border: "1px solid rgba(201,168,76,0.1)",
      borderRadius: "14px", padding: "20px 24px",
      marginBottom: "16px",
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

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span style={{
      fontSize: "9px", fontWeight: 700, color,
      background: `${color}1a`,
      padding: "3px 8px", borderRadius: "4px",
      fontFamily: "var(--font-sans)", letterSpacing: "0.06em",
    }}>
      {children}
    </span>
  );
}

function MetricChip({ color, label, value, sub }: { color: string; label: string; value: string; sub: string }) {
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
        fontFamily: "var(--font-display)", lineHeight: 1, marginBottom: "4px",
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

function CompositionPie({ data }: { data: CompoSlice[] }) {
  const total = data.reduce((acc, s) => acc + s.value, 0);
  if (total === 0) return null;
  const size = 220, cx = size / 2, cy = size / 2, r = 90, rInner = 56;
  let acc = 0;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: "100%", maxWidth: size, height: "auto" }}>
      {data.map((s) => {
        const startAngle = (acc / total) * 2 * Math.PI - Math.PI / 2;
        acc += s.value;
        const endAngle = (acc / total) * 2 * Math.PI - Math.PI / 2;
        const x1 = cx + r * Math.cos(startAngle);
        const y1 = cy + r * Math.sin(startAngle);
        const x2 = cx + r * Math.cos(endAngle);
        const y2 = cy + r * Math.sin(endAngle);
        const x3 = cx + rInner * Math.cos(endAngle);
        const y3 = cy + rInner * Math.sin(endAngle);
        const x4 = cx + rInner * Math.cos(startAngle);
        const y4 = cy + rInner * Math.sin(startAngle);
        const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
        const path = `M${x1},${y1} A${r},${r} 0 ${largeArc} 1 ${x2},${y2} L${x3},${y3} A${rInner},${rInner} 0 ${largeArc} 0 ${x4},${y4} Z`;
        return <path key={s.label} d={path} fill={s.color} stroke="#0d0b07" strokeWidth={1.5} />;
      })}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize={10} fill="#a09068" fontFamily="var(--font-sans)">
        Total
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize={14} fontWeight={700} fill="#e8dcc0" fontFamily="var(--font-display)">
        {fmtMoney(total)}
      </text>
    </svg>
  );
}

function CompositionRow({ slice, total }: { slice: CompoSlice; total: number }) {
  const pct = total > 0 ? (slice.value / total) * 100 : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <span style={{ width: "10px", height: "10px", background: slice.color, borderRadius: "2px", flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: "12px", color: "#c8b89a", fontFamily: "var(--font-sans)" }}>
        {slice.label}
      </span>
      <span style={{ fontSize: "11px", color: "#a09068", fontFamily: "var(--font-sans)" }}>
        {pct.toFixed(1)}%
      </span>
      <span style={{ fontSize: "12px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-sans)", minWidth: "100px", textAlign: "right" }}>
        {fmtMoney(slice.value)}
      </span>
    </div>
  );
}

function PriceChart({ history, positive }: { history: { date: number; close: number }[]; positive: boolean }) {
  const w = 1100, h = 220, pad = 28;
  const closes = history.map((p) => p.close);
  const min = Math.min(...closes), max = Math.max(...closes);
  const range = max - min || 1;
  const step = (w - pad * 2) / (history.length - 1);
  const points = history.map((p, i) => {
    const x = pad + i * step;
    const y = pad + (1 - (p.close - min) / range) * (h - pad * 2);
    return [x, y] as const;
  });
  const lineColor = positive ? "#10b981" : "#ef4444";
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${path} L${points[points.length - 1][0].toFixed(1)},${h - pad} L${points[0][0].toFixed(1)},${h - pad} Z`;
  return (
    <div style={{ overflow: "hidden", borderRadius: "10px", background: "#0d0b07", padding: "8px" }}>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <defs>
          <linearGradient id="fiiPriceArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity={0.3} />
            <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((p) => (
          <line key={p} x1={pad} x2={w - pad} y1={pad + p * (h - pad * 2)} y2={pad + p * (h - pad * 2)}
            stroke="rgba(201,168,76,0.06)" strokeWidth={1} />
        ))}
        <path d={area} fill="url(#fiiPriceArea)" />
        <path d={path} fill="none" stroke={lineColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function MonthlyReturnsChart({ data }: { data: MonthlyReturn[] }) {
  const w = 1100, h = 220, pad = 30;
  const all = data.flatMap((d) => [d.cota, d.patrim]);
  const max = Math.max(...all, 0.01);
  const min = Math.min(...all, 0);
  const range = max - min || 1;
  const groupW = (w - pad * 2) / data.length;
  const barW = groupW * 0.4;
  const yFor = (v: number) => pad + (1 - (v - min) / range) * (h - pad * 2);
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
          const showLabel = i % Math.max(1, Math.floor(data.length / 8)) === 0;
          const yCota = yFor(Math.max(d.cota, 0));
          const yCotaNeg = d.cota < 0 ? yFor(d.cota) : zeroY;
          const yPatr = yFor(Math.max(d.patrim, 0));
          const yPatrNeg = d.patrim < 0 ? yFor(d.patrim) : zeroY;
          return (
            <g key={d.date}>
              <rect x={cx - barW - 1} y={d.cota >= 0 ? yCota : zeroY}
                width={barW} height={Math.abs((d.cota >= 0 ? yCota : yCotaNeg) - zeroY)}
                fill="#10b981" rx={2} opacity={d.cota >= 0 ? 1 : 0.7} />
              <rect x={cx + 1} y={d.patrim >= 0 ? yPatr : zeroY}
                width={barW} height={Math.abs((d.patrim >= 0 ? yPatr : yPatrNeg) - zeroY)}
                fill="#06b6d4" rx={2} opacity={d.patrim >= 0 ? 1 : 0.7} />
              {showLabel && (
                <text x={cx} y={h - 8} textAnchor="middle" fontSize={9} fill="#a09068" fontFamily="var(--font-sans)">
                  {formatShortDate(d.date)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function YieldChart({ data }: { data: MonthlyYield[] }) {
  const w = 1100, h = 200, pad = 30;
  const max = Math.max(...data.map((d) => d.yield), 0.01);
  const barW = (w - pad * 2) / data.length * 0.7;
  const gap = (w - pad * 2) / data.length * 0.3;
  return (
    <div style={{ overflow: "hidden", borderRadius: "10px", background: "#0d0b07", padding: "8px" }}>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "auto", display: "block" }}>
        {data.map((d, i) => {
          const showLabel = i % Math.max(1, Math.floor(data.length / 8)) === 0;
          const barH = (d.yield / max) * (h - pad * 2);
          const x = pad + i * (barW + gap);
          const y = h - pad - barH;
          return (
            <g key={d.date}>
              <rect x={x} y={y} width={barW} height={barH} fill="#C9A84C" rx={3} />
              {showLabel && (
                <>
                  <text x={x + barW / 2} y={h - 8} textAnchor="middle"
                    fontSize={9} fill="#a09068" fontFamily="var(--font-sans)">
                    {formatShortDate(d.date)}
                  </text>
                  <text x={x + barW / 2} y={y - 4} textAnchor="middle"
                    fontSize={9} fill="#C9A84C" fontFamily="var(--font-sans)" fontWeight={600}>
                    {d.yield.toFixed(2)}%
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function DivRow({ dividend }: { dividend: FIIDividend }) {
  const isAmort = dividend.type?.toLowerCase().includes("amort");
  const tipo = isAmort ? "Amortização" : "Rendimento";
  const color = isAmort ? "#f59e0b" : "#10b981";
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      background: "#0d0b07",
      border: "1px solid rgba(201,168,76,0.08)",
      borderRadius: "8px", padding: "10px 14px",
    }}>
      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <span style={{
          fontSize: "9px", fontWeight: 700, color,
          background: `${color}1a`,
          padding: "3px 8px", borderRadius: "4px",
          fontFamily: "var(--font-sans)", letterSpacing: "0.04em",
        }}>
          {tipo}
        </span>
        <p style={{ fontSize: "11px", color: "#a09068", fontFamily: "var(--font-sans)" }}>
          {dividend.approvedOn && `aviso: ${formatDate(dividend.approvedOn)}`}
          {dividend.approvedOn && dividend.paymentDate && " · "}
          {dividend.paymentDate && `pgto: ${formatDate(dividend.paymentDate)}`}
        </p>
      </div>
      <p style={{ fontSize: "14px", fontWeight: 700, color, fontFamily: "var(--font-display)" }}>
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
      <span style={{ fontSize: "12px", color: "#e8dcc0", fontFamily: "var(--font-sans)", fontWeight: 500, textAlign: "right" }}>{value}</span>
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

// ─── Format helpers ───────────────────────────────────────────────────────────

function fmtNum(v: number | null | undefined, dec: number): string {
  return v !== null && v !== undefined && !isNaN(v) ? v.toFixed(dec) : "—";
}

function fmtPct(v: number | null | undefined): string {
  if (v === null || v === undefined || isNaN(v)) return "—";
  // brapi devolve fração (0.06 = 6%) — converte se for ratio
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
  try { return new Date(iso).toLocaleDateString("pt-BR"); } catch { return iso; }
}

function formatRefDate(iso: string | undefined): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
  } catch { return iso; }
}

function formatShortDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
  } catch { return iso; }
}

function labelSegment(s: string): string {
  const map: Record<string, string> = {
    papel: "Papel", tijolo: "Tijolo", hibrido: "Híbrido",
    "híbrido": "Híbrido", fof: "FoF (Fundo de Fundos)",
  };
  return map[s.toLowerCase()] ?? s;
}

function labelMgmt(s: string): string {
  const map: Record<string, string> = {
    ativa: "Ativa", passiva: "Passiva",
  };
  return map[s.toLowerCase()] ?? s;
}

function withProtocol(url: string): string {
  return /^https?:\/\//.test(url) ? url : `https://${url}`;
}
