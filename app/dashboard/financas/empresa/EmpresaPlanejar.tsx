"use client";

/**
 * EmpresaPlanejar — aba "Planejar" dedicada para gestão empresarial.
 *
 * Diferente do Planejar pessoal (orçamentos por categoria + sonhos), aqui o
 * foco é operação de negócio:
 *
 *  1) Diagnóstico Empresarial (hero score)
 *  2) Meta de Receita Mensal — target + projeção de fim de mês
 *  3) Capital de Giro — cobertura em meses
 *  4) Ponto de Equilíbrio — calculadora interativa
 *  5) Budget por Centro de Custo — reusa cost_center.budget
 *  6) KPIs Estratégicos — CAC, LTV, Ticket Médio, Margem (persistência local)
 *
 * Persistência:
 * - Budget por cost_center já existe no DB (campo `budget` em cost_center).
 * - Meta de receita + KPIs persistem em localStorage por enquanto, chave
 *   `aurum:empresa:planejar:{companyId}:*`. Migrar pra DB no próximo passo.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Target, Wallet, Calculator, Layers,
  Pencil, Save, X, Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { CostCenter, FinanceTxRow } from "@/lib/empresa-finance";
import { ECard, E } from "./EmpresaShared";

interface Props {
  companyId: string | null;
  transactionsCurrent: FinanceTxRow[];
  transactionsPrev: FinanceTxRow[];
  transactionsLast12m: FinanceTxRow[];
  costCenters: CostCenter[];
  cashBalance: number;
  /** Origem do saldo de caixa — balance_entry manual, somatório de transações,
   *  ou sem dados. Usado pra exibir o hint correto nos cards. */
  cashSource?: "balance" | "transactions" | "empty";
  onReload: () => void;
}

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtShort = (v: number) => {
  if (Math.abs(v) >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `R$ ${(v / 1_000).toFixed(1)}k`;
  return fmt(v);
};

const fmtPct = (v: number) => {
  const sign = v >= 0 ? "+" : "";
  return `${sign}${v.toFixed(1)}%`;
};

const lsKey = (companyId: string | null, suffix: string) =>
  companyId ? `aurum:empresa:planejar:${companyId}:${suffix}` : null;

// ─── Component ───────────────────────────────────────────────────────────────

export default function EmpresaPlanejar({
  companyId, transactionsCurrent, transactionsPrev, transactionsLast12m,
  costCenters, cashBalance, cashSource = "empty", onReload,
}: Props) {
  // ── Agregados do mês corrente ─────────────────────────────────────────────
  const revenueCurrent = useMemo(
    () => transactionsCurrent.filter((t) => t.type === "entrada").reduce((s, t) => s + Number(t.amount), 0),
    [transactionsCurrent]
  );
  const expenseCurrent = useMemo(
    () => transactionsCurrent.filter((t) => t.type === "saida").reduce((s, t) => s + Number(t.amount), 0),
    [transactionsCurrent]
  );
  const revenuePrev = useMemo(
    () => transactionsPrev.filter((t) => t.type === "entrada").reduce((s, t) => s + Number(t.amount), 0),
    [transactionsPrev]
  );
  const expensePrev = useMemo(
    () => transactionsPrev.filter((t) => t.type === "saida").reduce((s, t) => s + Number(t.amount), 0),
    [transactionsPrev]
  );
  const profit = revenueCurrent - expenseCurrent;
  const margin = revenueCurrent > 0 ? (profit / revenueCurrent) * 100 : 0;
  const growthMoM = revenuePrev > 0 ? ((revenueCurrent - revenuePrev) / revenuePrev) * 100 : 0;

  // OpEx mensal médio (últimos 12 meses) pra calcular capital de giro
  const avgOpExMonthly = useMemo(() => {
    const monthsSet = new Set<string>();
    let total = 0;
    transactionsLast12m
      .filter((t) => t.type === "saida")
      .forEach((t) => {
        monthsSet.add(t.transaction_date.slice(0, 7));
        total += Number(t.amount);
      });
    return monthsSet.size > 0 ? total / monthsSet.size : expenseCurrent;
  }, [transactionsLast12m, expenseCurrent]);

  // Projeção: ritmo atual × dias restantes
  const today = new Date();
  const dayOfMonth = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const dailyPace = dayOfMonth > 0 ? revenueCurrent / dayOfMonth : 0;
  const projectedRevenue = dailyPace * daysInMonth;

  // ── State persistido (localStorage) ──────────────────────────────────────
  const [revenueTarget, setRevenueTarget] = useState<number>(0);
  const [breakeven, setBreakeven] = useState<{ fixedCost: number; contributionMargin: number }>({
    fixedCost: 0, contributionMargin: 40,
  });
  const [kpis, setKpis] = useState<{ cac: number; ltv: number; ticket: number; margin: number; nps: number }>({
    cac: 0, ltv: 0, ticket: 0, margin: 0, nps: 0,
  });

  // Carregar do localStorage quando companyId mudar
  useEffect(() => {
    if (!companyId) return;
    try {
      const rt = localStorage.getItem(lsKey(companyId, "revenue-target") ?? "");
      if (rt) setRevenueTarget(JSON.parse(rt));
      const be = localStorage.getItem(lsKey(companyId, "breakeven") ?? "");
      if (be) setBreakeven(JSON.parse(be));
      const k = localStorage.getItem(lsKey(companyId, "kpis") ?? "");
      if (k) setKpis(JSON.parse(k));
    } catch { /* localStorage não acessível ou parse falhou — ignora */ }
  }, [companyId]);

  const persistRevenueTarget = (v: number) => {
    setRevenueTarget(v);
    const k = lsKey(companyId, "revenue-target");
    if (k) localStorage.setItem(k, JSON.stringify(v));
  };
  const persistBreakeven = (v: typeof breakeven) => {
    setBreakeven(v);
    const k = lsKey(companyId, "breakeven");
    if (k) localStorage.setItem(k, JSON.stringify(v));
  };
  const persistKpis = (v: typeof kpis) => {
    setKpis(v);
    const k = lsKey(companyId, "kpis");
    if (k) localStorage.setItem(k, JSON.stringify(v));
  };

  // ── Score empresarial (0-100) ─────────────────────────────────────────────
  const healthScore = useMemo(() => {
    let score = 0; let weights = 0;
    // Margem líquida (30pts; 20%+ = 30)
    const m = Math.max(-50, Math.min(margin, 30));
    score += ((m + 50) / 80) * 30;  // [-50..30] → [0..30]
    weights += 30;
    // Capital de giro: cobertura ≥ 3 meses = 30
    if (avgOpExMonthly > 0) {
      const cover = cashBalance / avgOpExMonthly;
      score += Math.min(cover / 3, 1) * 30;
      weights += 30;
    }
    // Crescimento MoM (20pts; +10% = 20)
    if (revenuePrev > 0) {
      const g = Math.max(-50, Math.min(growthMoM, 10));
      score += ((g + 50) / 60) * 20;
      weights += 20;
    }
    // Meta de receita (20pts; bate a meta = 20)
    if (revenueTarget > 0) {
      score += Math.min(projectedRevenue / revenueTarget, 1) * 20;
      weights += 20;
    }
    return weights > 0 ? Math.round((score / weights) * 100) : 0;
  }, [margin, cashBalance, avgOpExMonthly, growthMoM, revenuePrev, projectedRevenue, revenueTarget]);

  const band =
    healthScore >= 75 ? { label: "Saudável",   color: E.green,  desc: "Operação sólida: margem confortável, caixa robusto e crescimento alinhado." } :
    healthScore >= 50 ? { label: "Estável",    color: E.gold,   desc: "Resultado consistente. Foque em consolidar margem ou crescer top-line." } :
    healthScore >= 25 ? { label: "Atenção",    color: E.amber,  desc: "Sinais que merecem ação: reforce caixa, revise custos ou reaqueça receita." } :
                        { label: "Crítico",    color: E.red,    desc: "Risco operacional: priorize redução de OpEx e reforço de capital de giro." };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* 1) Diagnóstico Empresarial (hero) */}
      <BusinessHero
        score={healthScore}
        band={band}
        revenueCurrent={revenueCurrent}
        profit={profit}
        margin={margin}
        growthMoM={growthMoM}
        cashBalance={cashBalance}
        cashSource={cashSource}
        avgOpExMonthly={avgOpExMonthly}
      />

      {/* 2) Meta de receita + 3) Capital de giro */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <RevenueTargetCard
          target={revenueTarget}
          current={revenueCurrent}
          projected={projectedRevenue}
          dayOfMonth={dayOfMonth}
          daysInMonth={daysInMonth}
          prev={revenuePrev}
          onChange={persistRevenueTarget}
        />
        <WorkingCapitalCard
          cash={cashBalance}
          cashSource={cashSource}
          avgOpEx={avgOpExMonthly}
        />
      </div>

      {/* 4) Ponto de Equilíbrio */}
      <BreakevenCard
        breakeven={breakeven}
        revenueCurrent={revenueCurrent}
        avgOpEx={avgOpExMonthly}
        onChange={persistBreakeven}
      />

      {/* 5) Budget por Centro de Custo */}
      <CostCenterBudgetSection
        costCenters={costCenters}
        transactionsCurrent={transactionsCurrent}
        companyId={companyId}
        onReload={onReload}
      />

      {/* 6) KPIs Estratégicos */}
      <KpisCard kpis={kpis} onChange={persistKpis} />
    </div>
  );
}

// ─── 1) Business Hero ─────────────────────────────────────────────────────────

function BusinessHero({
  score, band, revenueCurrent, profit, margin, growthMoM, cashBalance, cashSource, avgOpExMonthly,
}: {
  score: number;
  band: { label: string; color: string; desc: string };
  revenueCurrent: number;
  profit: number;
  margin: number;
  growthMoM: number;
  cashBalance: number;
  cashSource: "balance" | "transactions" | "empty";
  avgOpExMonthly: number;
}) {
  const monthsCash = avgOpExMonthly > 0 ? cashBalance / avgOpExMonthly : 0;
  const cashHint =
    cashSource === "balance"
      ? "Balanço cadastrado"
      : cashSource === "transactions"
        ? "Calculado das transações"
        : "Sem dados ainda";
  return (
    <div style={{
      position: "relative",
      background: `
        radial-gradient(circle at 100% 0%, ${band.color}1f, transparent 55%),
        radial-gradient(circle at 0% 100%, rgba(201,168,76,0.06), transparent 55%),
        ${E.card}
      `,
      border: `1px solid ${E.border}`,
      borderRadius: "16px",
      padding: "26px 28px",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "1px",
        background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.35), transparent)",
      }} />

      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "32px", alignItems: "center" }}>
        <ScoreRing score={score} color={band.color} />

        <div>
          <p style={{
            fontSize: "10px", fontWeight: 700, color: E.gold,
            fontFamily: "var(--font-sans)", letterSpacing: "0.16em",
            textTransform: "uppercase", marginBottom: "6px",
          }}>
            Diagnóstico Empresarial
          </p>
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px", flexWrap: "wrap" }}>
            <h3 style={{
              fontSize: "26px", fontWeight: 700, color: E.textStrong,
              fontFamily: "var(--font-display)", letterSpacing: "-0.01em",
              lineHeight: 1,
            }}>
              {band.label}
            </h3>
            <span style={{
              fontSize: "13px", fontWeight: 700, color: band.color,
              fontFamily: "var(--font-sans)",
              padding: "3px 10px", borderRadius: "999px",
              background: `${band.color}1f`, border: `1px solid ${band.color}40`,
              fontVariantNumeric: "tabular-nums",
            }}>
              {score} / 100
            </span>
          </div>
          <p style={{ fontSize: "12px", color: E.text, fontFamily: "var(--font-sans)", marginTop: "8px", lineHeight: 1.5, maxWidth: "560px" }}>
            {band.desc}
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginTop: "18px" }}>
            <MetricBlock label="Receita do mês" value={fmtShort(revenueCurrent)} hint={`${fmtPct(growthMoM)} vs mês anterior`} hintColor={growthMoM >= 0 ? E.green : E.red} />
            <MetricBlock label="Margem líquida" value={`${margin.toFixed(1)}%`} hint={`Lucro: ${fmtShort(profit)}`} hintColor={profit >= 0 ? E.green : E.red} />
            <MetricBlock label="Caixa atual" value={fmtShort(cashBalance)} hint={cashHint} />
            <MetricBlock label="Runway" value={`${monthsCash.toFixed(1)} ${monthsCash === 1 ? "mês" : "meses"}`} hint="Sustenta OpEx médio" hintColor={monthsCash >= 3 ? E.green : monthsCash >= 1 ? E.amber : E.red} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreRing({ score, color }: { score: number; color: string }) {
  const radius = 56;
  const stroke = 8;
  const circ = 2 * Math.PI * radius;
  const dash = (score / 100) * circ;
  return (
    <div style={{ position: "relative", width: 140, height: 140 }}>
      <svg width={140} height={140} viewBox="0 0 140 140">
        <circle cx={70} cy={70} r={radius} fill="none" stroke="rgba(201,168,76,0.1)" strokeWidth={stroke} />
        <circle
          cx={70} cy={70} r={radius} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          transform="rotate(-90 70 70)"
          style={{ transition: "stroke-dasharray 500ms cubic-bezier(0.16,1,0.3,1)" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: "2px",
      }}>
        <span style={{
          fontSize: "32px", fontWeight: 700, color: E.textStrong,
          fontFamily: "var(--font-display)", lineHeight: 1, letterSpacing: "-0.02em",
          fontVariantNumeric: "tabular-nums",
        }}>
          {score}
        </span>
        <span style={{
          fontSize: "9px", fontWeight: 600, color: E.textFaint,
          fontFamily: "var(--font-sans)", letterSpacing: "0.12em", textTransform: "uppercase",
        }}>
          de 100
        </span>
      </div>
    </div>
  );
}

function MetricBlock({
  label, value, hint, hintColor,
}: { label: string; value: string; hint: string; hintColor?: string }) {
  return (
    <div>
      <p style={{ fontSize: "9px", fontWeight: 600, color: E.textFaint, fontFamily: "var(--font-sans)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "4px" }}>
        {label}
      </p>
      <p style={{ fontSize: "16px", fontWeight: 700, color: E.textStrong, fontFamily: "var(--font-sans)", fontVariantNumeric: "tabular-nums", lineHeight: 1, marginBottom: "3px" }}>
        {value}
      </p>
      <p style={{ fontSize: "10px", color: hintColor ?? E.textFaint, fontFamily: "var(--font-sans)", fontVariantNumeric: "tabular-nums" }}>
        {hint}
      </p>
    </div>
  );
}

// ─── 2) Meta de Receita ───────────────────────────────────────────────────────

function RevenueTargetCard({
  target, current, projected, dayOfMonth, daysInMonth, prev, onChange,
}: {
  target: number;
  current: number;
  projected: number;
  dayOfMonth: number;
  daysInMonth: number;
  prev: number;
  onChange: (v: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(target));

  useEffect(() => { setDraft(String(target)); }, [target]);

  const pctRealized = target > 0 ? (current / target) * 100 : 0;
  const pctProjected = target > 0 ? (projected / target) * 100 : 0;
  const willHit = projected >= target;

  return (
    <ECard padding="20px 22px">
      <CardHeader
        icon={<Target size={16} />}
        iconColor={E.green}
        title="Meta de receita mensal"
        subtitle={target > 0 ? "Realizado vs Meta · Projeção no ritmo atual" : "Defina a meta pra acompanhar a projeção"}
        rightSlot={
          editing ? (
            <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="0,00"
                style={{
                  width: "120px",
                  background: E.cardSoft, border: `1px solid ${E.borderStrong}`,
                  borderRadius: "6px", padding: "5px 8px",
                  color: E.text, fontSize: "12px",
                  fontFamily: "var(--font-sans)", outline: "none",
                  fontVariantNumeric: "tabular-nums",
                }}
              />
              <IconBtn icon={<Save size={11} />} label="Salvar" onClick={() => {
                const v = parseFloat(draft.replace(/\./g, "").replace(",", ".")) || 0;
                onChange(v);
                setEditing(false);
                toast.success("Meta salva (no seu navegador).");
              }} accent />
              <IconBtn icon={<X size={11} />} label="Cancelar" onClick={() => { setDraft(String(target)); setEditing(false); }} />
            </div>
          ) : (
            <IconBtn icon={<Pencil size={11} />} label="Editar" onClick={() => setEditing(true)} accent />
          )
        }
      />

      {target === 0 ? (
        <p style={{ fontSize: "12px", color: E.textMuted, fontFamily: "var(--font-sans)", padding: "12px 0", fontStyle: "italic" }}>
          Clique em Editar pra definir o faturamento alvo deste mês. A barra abaixo vai mostrar o quanto já realizou e a projeção pelo ritmo atual.
        </p>
      ) : (
        <>
          {/* Big numbers */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginTop: "14px" }}>
            <MetricBlock label="Meta" value={fmtShort(target)} hint={`${daysInMonth} dias úteis`} />
            <MetricBlock label="Realizado" value={fmtShort(current)} hint={`${pctRealized.toFixed(0)}% da meta`} hintColor={pctRealized >= 50 ? E.green : E.amber} />
            <MetricBlock label="Projeção" value={fmtShort(projected)} hint={willHit ? "Vai bater a meta" : "Abaixo da meta"} hintColor={willHit ? E.green : E.red} />
          </div>

          {/* Stacked bar: realizado + faltando (projeção) */}
          <div style={{ marginTop: "16px" }}>
            <div style={{ position: "relative", height: "12px", background: E.cardSoft, border: `1px solid ${E.border}`, borderRadius: "6px", overflow: "hidden" }}>
              {/* Realizado */}
              <div style={{
                position: "absolute", left: 0, top: 0, bottom: 0,
                width: `${Math.min(100, pctRealized)}%`,
                background: `linear-gradient(90deg, ${E.green}, ${E.green}aa)`,
                transition: "width 400ms cubic-bezier(0.16,1,0.3,1)",
              }} />
              {/* Projeção (faixa esmaecida) */}
              {pctProjected > pctRealized && (
                <div style={{
                  position: "absolute",
                  left: `${Math.min(100, pctRealized)}%`,
                  top: 0, bottom: 0,
                  width: `${Math.min(100, pctProjected) - Math.min(100, pctRealized)}%`,
                  background: `linear-gradient(90deg, ${willHit ? E.green : E.amber}33, ${willHit ? E.green : E.amber}11)`,
                  borderLeft: `1px dashed ${willHit ? E.green : E.amber}80`,
                }} />
              )}
              {/* 100% marker */}
              <div style={{
                position: "absolute", right: 0, top: -3, bottom: -3,
                width: "2px", background: E.goldSoft,
              }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px", fontSize: "10px", color: E.textFaint, fontFamily: "var(--font-sans)", fontVariantNumeric: "tabular-nums" }}>
              <span>Dia {dayOfMonth}/{daysInMonth}</span>
              <span>vs mês anterior: {fmtShort(prev)}</span>
            </div>
          </div>
        </>
      )}
    </ECard>
  );
}

// ─── 3) Capital de Giro ───────────────────────────────────────────────────────

function WorkingCapitalCard({
  cash, avgOpEx, cashSource,
}: {
  cash: number;
  avgOpEx: number;
  cashSource: "balance" | "transactions" | "empty";
}) {
  const coverage = avgOpEx > 0 ? cash / avgOpEx : 0;
  const recommended = avgOpEx * 3;
  const gap = recommended - cash;

  const status =
    coverage >= 6 ? { label: "Confortável",     color: E.green,  desc: "Reserva permite manobra estratégica." } :
    coverage >= 3 ? { label: "Adequado",        color: E.gold,   desc: "Atende ao mínimo recomendado." } :
    coverage >= 1 ? { label: "Apertado",        color: E.amber,  desc: "Pouca margem pra imprevistos." } :
                    { label: "Crítico",         color: E.red,    desc: "Risco imediato de descapitalização." };

  return (
    <ECard padding="20px 22px">
      <CardHeader
        icon={<Wallet size={16} />}
        iconColor={E.gold}
        title="Capital de giro"
        subtitle="Quantos meses o caixa atual sustenta o OpEx médio"
        rightSlot={
          <span style={{
            fontSize: "9px", fontWeight: 700, color: status.color,
            background: `${status.color}1f`, border: `1px solid ${status.color}40`,
            padding: "3px 8px", borderRadius: "5px",
            fontFamily: "var(--font-sans)", letterSpacing: "0.06em", textTransform: "uppercase",
          }}>
            {status.label}
          </span>
        }
      />

      <div style={{ marginTop: "14px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "6px" }}>
          <span style={{
            fontSize: "24px", fontWeight: 700, color: E.textStrong,
            fontFamily: "var(--font-display)", fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.01em",
          }}>
            {coverage.toFixed(1)}<span style={{ fontSize: "13px", fontWeight: 600, color: E.textMuted, marginLeft: "4px" }}>{coverage === 1 ? "mês" : "meses"}</span>
          </span>
          <span style={{ fontSize: "11px", color: E.textMuted, fontFamily: "var(--font-sans)" }}>
            Caixa: {fmtShort(cash)}
            {cashSource === "transactions" && (
              <span style={{ fontSize: "9px", color: E.textFaint, marginLeft: "6px" }}>
                · via transações
              </span>
            )}
          </span>
        </div>

        {/* Régua 1m / 3m / 6m */}
        <div style={{ position: "relative", height: "10px", background: E.cardSoft, borderRadius: "5px", overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${Math.min(100, (coverage / 6) * 100)}%`,
            background: `linear-gradient(90deg, ${status.color}, ${status.color}aa)`,
            borderRadius: "5px",
            transition: "width 400ms cubic-bezier(0.16,1,0.3,1)",
          }} />
          {[1, 3, 6].map((m) => (
            <div key={m} style={{
              position: "absolute", top: 0, bottom: 0,
              left: `${(m / 6) * 100}%`, width: "1px",
              background: "rgba(201,168,76,0.45)",
            }} />
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "5px", fontSize: "9px", color: E.textFaint, fontFamily: "var(--font-sans)" }}>
          <span>0</span>
          <span>1 mês</span>
          <span>3 meses (recomendado)</span>
          <span>6 meses</span>
        </div>
      </div>

      <p style={{ fontSize: "11px", color: E.textMuted, fontFamily: "var(--font-sans)", marginTop: "12px", paddingTop: "10px", borderTop: `1px solid ${E.border}`, lineHeight: 1.5 }}>
        {status.desc}{" "}
        {gap > 0 && (
          <>
            <strong style={{ color: E.text }}>Faltam {fmtShort(gap)}</strong> pra atingir o mínimo de 3 meses ({fmtShort(recommended)}).
          </>
        )}
        {gap <= 0 && (
          <>
            <strong style={{ color: E.green }}>Acima do mínimo</strong> em {fmtShort(-gap)}.
          </>
        )}
      </p>
    </ECard>
  );
}

// ─── 4) Ponto de Equilíbrio ──────────────────────────────────────────────────

function BreakevenCard({
  breakeven, revenueCurrent, avgOpEx, onChange,
}: {
  breakeven: { fixedCost: number; contributionMargin: number };
  revenueCurrent: number;
  avgOpEx: number;
  onChange: (v: { fixedCost: number; contributionMargin: number }) => void;
}) {
  // Auto-sugerir OpEx médio como custo fixo se ainda zero
  const fixedCost = breakeven.fixedCost > 0 ? breakeven.fixedCost : avgOpEx;
  const cm = breakeven.contributionMargin / 100;
  const breakevenRevenue = cm > 0 ? fixedCost / cm : 0;
  const coverageOfBreakeven = breakevenRevenue > 0 ? (revenueCurrent / breakevenRevenue) * 100 : 0;
  const ok = revenueCurrent >= breakevenRevenue;

  return (
    <ECard padding="20px 22px">
      <CardHeader
        icon={<Calculator size={16} />}
        iconColor={E.teal}
        title="Ponto de equilíbrio"
        subtitle="Faturamento mínimo pra cobrir custos fixos · ajuste e veja o impacto"
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginTop: "14px" }}>
        {/* Inputs */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <NumberField
            label="Custo fixo mensal"
            value={breakeven.fixedCost}
            placeholder={fmtShort(avgOpEx)}
            onChange={(v) => onChange({ ...breakeven, fixedCost: v })}
            currency
            hint={breakeven.fixedCost === 0 ? `Padrão: ${fmtShort(avgOpEx)} (OpEx médio)` : undefined}
          />
          <SliderField
            label="Margem de contribuição (%)"
            value={breakeven.contributionMargin}
            min={5} max={90} step={1}
            onChange={(v) => onChange({ ...breakeven, contributionMargin: v })}
            hint="% que sobra de cada venda depois dos custos variáveis"
          />
        </div>

        {/* Output */}
        <div style={{
          padding: "16px 18px",
          background: ok ? `${E.green}11` : `${E.amber}11`,
          border: `1px solid ${ok ? E.green + "33" : E.amber + "33"}`,
          borderRadius: "10px",
          display: "flex", flexDirection: "column", justifyContent: "center", gap: "10px",
        }}>
          <p style={{ fontSize: "9px", fontWeight: 700, color: ok ? E.green : E.amber, fontFamily: "var(--font-sans)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Faturamento mínimo
          </p>
          <p style={{ fontSize: "28px", fontWeight: 700, color: E.textStrong, fontFamily: "var(--font-display)", lineHeight: 1, letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums" }}>
            {fmt(breakevenRevenue)}
          </p>
          <p style={{ fontSize: "11px", color: E.text, fontFamily: "var(--font-sans)", lineHeight: 1.5 }}>
            {ok ? (
              <>Mês corrente <strong style={{ color: E.green }}>cobre o break-even em {coverageOfBreakeven.toFixed(0)}%</strong>. Tudo acima disso é lucro operacional.</>
            ) : (
              <>Faltam <strong style={{ color: E.amber }}>{fmt(breakevenRevenue - revenueCurrent)}</strong> de receita pra equilibrar contas neste mês.</>
            )}
          </p>
        </div>
      </div>
    </ECard>
  );
}

// ─── 5) Budget por Centro de Custo ────────────────────────────────────────────

function CostCenterBudgetSection({
  costCenters, transactionsCurrent, companyId, onReload,
}: {
  costCenters: CostCenter[];
  transactionsCurrent: FinanceTxRow[];
  companyId: string | null;
  onReload: () => void;
}) {
  // Gasto por centro de custo no mês corrente
  const spentByCC = useMemo(() => {
    const map: Record<string, number> = {};
    transactionsCurrent
      .filter((t) => t.type === "saida" && t.cost_center_id)
      .forEach((t) => {
        const id = t.cost_center_id as string;
        map[id] = (map[id] ?? 0) + Number(t.amount);
      });
    return map;
  }, [transactionsCurrent]);

  return (
    <section>
      <SectionHeader
        icon={<Layers size={14} />}
        title="Budget por centro de custo"
        subtitle="Orçamento mensal por área ou projeto · gasto real do mês"
      />

      {costCenters.length === 0 ? (
        <ECard padding="32px 24px">
          <div style={{ textAlign: "center", maxWidth: "440px", margin: "0 auto" }}>
            <div style={{
              width: "44px", height: "44px", borderRadius: "11px",
              background: E.goldSoft, border: `1px solid ${E.borderStrong}`,
              color: E.gold,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 14px",
            }}>
              <Layers size={20} />
            </div>
            <p style={{ fontSize: "14px", fontWeight: 600, color: E.textStrong, fontFamily: "var(--font-display)", marginBottom: "6px" }}>
              Nenhum centro de custo cadastrado
            </p>
            <p style={{ fontSize: "12px", color: E.textMuted, fontFamily: "var(--font-sans)", lineHeight: 1.5 }}>
              Cadastre áreas (Marketing, Tecnologia, Comercial) ou projetos no menu <strong style={{ color: E.text }}>Centros</strong> e defina o budget mensal. Aqui você acompanha o gasto real vs limite.
            </p>
          </div>
        </ECard>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
          {costCenters
            .filter((c) => c.status === "ativo")
            .map((cc) => (
              <CostCenterBudgetCard
                key={cc.id}
                cc={cc}
                spent={spentByCC[cc.id] ?? 0}
                companyId={companyId}
                onReload={onReload}
              />
            ))}
        </div>
      )}
    </section>
  );
}

function CostCenterBudgetCard({
  cc, spent, companyId, onReload,
}: {
  cc: CostCenter;
  spent: number;
  companyId: string | null;
  onReload: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(cc.budget !== null ? String(cc.budget) : "");
  const [saving, setSaving] = useState(false);

  const budget = cc.budget ?? 0;
  const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const realPct = budget > 0 ? (spent / budget) * 100 : 0;
  const over = budget > 0 && spent > budget;
  const status = budget === 0 ? E.textFaint : over ? E.red : pct >= 80 ? E.amber : E.green;

  const accent = cc.color ?? E.gold;

  const saveBudget = useCallback(async () => {
    const v = parseFloat(draft.replace(/\./g, "").replace(",", ".")) || 0;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("cost_center")
      .update({ budget: v > 0 ? v : null })
      .eq("id", cc.id);
    setSaving(false);
    if (error) {
      toast.error("Não consegui salvar.", { description: error.message });
      return;
    }
    toast.success("Budget atualizado.");
    setEditing(false);
    onReload();
  }, [draft, cc.id, onReload]);

  return (
    <div style={{
      position: "relative",
      background: `linear-gradient(135deg, ${accent}0a, transparent 60%), ${E.card}`,
      border: `1px solid ${over ? E.red + "44" : E.border}`,
      borderRadius: "12px",
      padding: "16px 18px",
      display: "flex", flexDirection: "column", gap: "10px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
          <span style={{
            width: "8px", height: "8px", borderRadius: "50%",
            background: accent, flexShrink: 0,
            boxShadow: `0 0 6px ${accent}80`,
          }} />
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: "13px", fontWeight: 700, color: E.textStrong, fontFamily: "var(--font-display)", letterSpacing: "-0.005em" }}>
              {cc.name}
            </p>
            <p style={{ fontSize: "10px", fontWeight: 600, color: E.textFaint, fontFamily: "var(--font-sans)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {cc.type === "area" ? "Área" : "Projeto"}
            </p>
          </div>
        </div>
        {!editing && (
          <IconBtn
            icon={<Pencil size={11} />}
            label={budget > 0 ? "Editar budget" : "Definir budget"}
            onClick={() => setEditing(true)}
            accent={budget === 0}
          />
        )}
      </div>

      {editing ? (
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="0,00"
            disabled={saving}
            autoFocus
            style={{
              flex: 1,
              background: E.cardSoft, border: `1px solid ${E.borderStrong}`,
              borderRadius: "6px", padding: "6px 10px",
              color: E.text, fontSize: "13px",
              fontFamily: "var(--font-sans)", outline: "none",
              fontVariantNumeric: "tabular-nums",
            }}
          />
          <IconBtn icon={<Save size={11} />} label="Salvar" onClick={saveBudget} accent />
          <IconBtn icon={<X size={11} />} label="Cancelar" onClick={() => { setDraft(cc.budget !== null ? String(cc.budget) : ""); setEditing(false); }} />
        </div>
      ) : budget === 0 ? (
        <p style={{ fontSize: "11px", color: E.textFaint, fontFamily: "var(--font-sans)", fontStyle: "italic" }}>
          Sem budget definido. Gasto do mês: <strong style={{ color: E.text }}>{fmt(spent)}</strong>
        </p>
      ) : (
        <div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "6px" }}>
            <span style={{
              fontSize: "16px", fontWeight: 700, color: status,
              fontFamily: "var(--font-sans)", fontVariantNumeric: "tabular-nums", lineHeight: 1,
            }}>
              {fmt(spent)}
            </span>
            <span style={{ fontSize: "11px", color: E.textMuted, fontFamily: "var(--font-sans)" }}>
              de {fmt(budget)}
            </span>
          </div>
          <div style={{ height: "6px", background: E.cardSoft, borderRadius: "3px", overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${pct}%`,
              background: status, borderRadius: "3px",
              transition: "width 400ms cubic-bezier(0.16,1,0.3,1)",
            }} />
          </div>
          <p style={{ fontSize: "10px", color: over ? E.red : E.textFaint, fontFamily: "var(--font-sans)", fontVariantNumeric: "tabular-nums", marginTop: "5px" }}>
            {realPct.toFixed(0)}% utilizado{over && ` · estourou em ${fmt(spent - budget)}`}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── 6) KPIs Estratégicos ─────────────────────────────────────────────────────

function KpisCard({
  kpis, onChange,
}: {
  kpis: { cac: number; ltv: number; ticket: number; margin: number; nps: number };
  onChange: (v: typeof kpis) => void;
}) {
  const ltvCac = kpis.cac > 0 ? kpis.ltv / kpis.cac : 0;

  return (
    <section>
      <SectionHeader
        icon={<Sparkles size={14} />}
        title="KPIs estratégicos"
        subtitle="Métricas chave acompanhadas manualmente · salvos no seu navegador"
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "12px" }}>
        <KpiCard
          label="CAC"
          hint="Custo de aquisição"
          value={kpis.cac}
          currency
          onChange={(v) => onChange({ ...kpis, cac: v })}
        />
        <KpiCard
          label="LTV"
          hint="Lifetime value"
          value={kpis.ltv}
          currency
          onChange={(v) => onChange({ ...kpis, ltv: v })}
        />
        <KpiCard
          label="LTV / CAC"
          hint="Saudável ≥ 3"
          computed
          value={ltvCac}
          color={ltvCac >= 3 ? E.green : ltvCac >= 1 ? E.amber : E.red}
          format={(v) => v > 0 ? `${v.toFixed(1)}×` : "—"}
        />
        <KpiCard
          label="Ticket médio"
          hint="Por cliente / venda"
          value={kpis.ticket}
          currency
          onChange={(v) => onChange({ ...kpis, ticket: v })}
        />
        <KpiCard
          label="Margem bruta"
          hint="% de cada venda"
          value={kpis.margin}
          suffix="%"
          onChange={(v) => onChange({ ...kpis, margin: v })}
        />
        <KpiCard
          label="NPS"
          hint="Net Promoter Score"
          value={kpis.nps}
          onChange={(v) => onChange({ ...kpis, nps: v })}
          color={kpis.nps >= 50 ? E.green : kpis.nps >= 0 ? E.amber : E.red}
        />
      </div>
    </section>
  );
}

function KpiCard({
  label, hint, value, currency, suffix, format, computed, color, onChange,
}: {
  label: string;
  hint: string;
  value: number;
  currency?: boolean;
  suffix?: string;
  format?: (v: number) => string;
  computed?: boolean;
  color?: string;
  onChange?: (v: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  useEffect(() => { setDraft(String(value)); }, [value]);

  const display = format
    ? format(value)
    : value === 0
      ? "—"
      : currency
        ? fmtShort(value)
        : `${value.toLocaleString("pt-BR")}${suffix ?? ""}`;

  return (
    <div style={{
      background: E.card,
      border: `1px solid ${E.border}`,
      borderRadius: "12px",
      padding: "14px 16px",
      display: "flex", flexDirection: "column", gap: "8px",
      transition: "border-color 150ms cubic-bezier(0.16,1,0.3,1)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: "10px", fontWeight: 700, color: E.gold, fontFamily: "var(--font-sans)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {label}
          </p>
          <p style={{ fontSize: "10px", color: E.textFaint, fontFamily: "var(--font-sans)" }}>
            {hint}
          </p>
        </div>
        {!computed && !editing && onChange && (
          <IconBtn icon={<Pencil size={10} />} label="Editar" onClick={() => setEditing(true)} small />
        )}
      </div>

      {editing && onChange ? (
        <div style={{ display: "flex", gap: "4px" }}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
            style={{
              flex: 1,
              background: E.cardSoft, border: `1px solid ${E.borderStrong}`,
              borderRadius: "5px", padding: "5px 8px",
              color: E.text, fontSize: "12px",
              fontFamily: "var(--font-sans)", outline: "none",
              fontVariantNumeric: "tabular-nums",
            }}
          />
          <IconBtn icon={<Save size={10} />} label="Salvar" small accent onClick={() => {
            const v = parseFloat(draft.replace(/\./g, "").replace(",", ".")) || 0;
            onChange(v);
            setEditing(false);
          }} />
          <IconBtn icon={<X size={10} />} label="Cancelar" small onClick={() => { setDraft(String(value)); setEditing(false); }} />
        </div>
      ) : (
        <p style={{
          fontSize: "20px", fontWeight: 700,
          color: color ?? E.textStrong,
          fontFamily: "var(--font-display)", letterSpacing: "-0.01em",
          fontVariantNumeric: "tabular-nums", lineHeight: 1,
        }}>
          {display}
        </p>
      )}
    </div>
  );
}

// ─── Shared helpers ──────────────────────────────────────────────────────────

function CardHeader({
  icon, iconColor, title, subtitle, rightSlot,
}: {
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  subtitle: string;
  rightSlot?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
        <div style={{
          width: "32px", height: "32px", borderRadius: "8px",
          background: `${iconColor}1f`, color: iconColor,
          border: `1px solid ${iconColor}33`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          {icon}
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: "14px", fontWeight: 700, color: E.textStrong, fontFamily: "var(--font-display)" }}>
            {title}
          </p>
          <p style={{ fontSize: "10px", color: E.textFaint, fontFamily: "var(--font-sans)" }}>
            {subtitle}
          </p>
        </div>
      </div>
      {rightSlot}
    </div>
  );
}

function SectionHeader({
  icon, title, subtitle, right,
}: { icon: React.ReactNode; title: string; subtitle: string; right?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{
          width: "26px", height: "26px", borderRadius: "7px",
          background: E.goldSoft, color: E.gold,
          border: `1px solid ${E.borderStrong}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {icon}
        </div>
        <div>
          <p style={{ fontSize: "14px", fontWeight: 700, color: E.textStrong, fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}>
            {title}
          </p>
          <p style={{ fontSize: "11px", color: E.textMuted, fontFamily: "var(--font-sans)" }}>
            {subtitle}
          </p>
        </div>
      </div>
      {right}
    </div>
  );
}

function IconBtn({
  icon, label, onClick, accent, small,
}: { icon: React.ReactNode; label: string; onClick: () => void; accent?: boolean; small?: boolean }) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        background: accent ? E.goldSoft : "transparent",
        border: `1px solid ${accent ? E.borderStrong : E.border}`,
        borderRadius: "6px",
        padding: small ? "3px 6px" : "5px 8px",
        color: accent ? E.gold : E.textMuted,
        cursor: "pointer",
        transition: "all 150ms cubic-bezier(0.16,1,0.3,1)",
        fontFamily: "var(--font-sans)",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(201,168,76,0.12)"; e.currentTarget.style.color = E.gold; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = accent ? E.goldSoft : "transparent"; e.currentTarget.style.color = accent ? E.gold : E.textMuted; }}
    >
      {icon}
    </button>
  );
}

function NumberField({
  label, value, placeholder, onChange, currency, hint,
}: { label: string; value: number; placeholder?: string; onChange: (v: number) => void; currency?: boolean; hint?: string }) {
  const [draft, setDraft] = useState(value > 0 ? String(value) : "");
  useEffect(() => { setDraft(value > 0 ? String(value) : ""); }, [value]);
  return (
    <div>
      <label style={{ fontSize: "9px", fontWeight: 600, color: E.textFaint, fontFamily: "var(--font-sans)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "5px", display: "block" }}>
        {label}{currency && " (R$)"}
      </label>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          const v = parseFloat(draft.replace(/\./g, "").replace(",", ".")) || 0;
          onChange(v);
        }}
        placeholder={placeholder ?? "0,00"}
        style={{
          width: "100%",
          background: E.cardSoft, border: `1px solid ${E.border}`,
          borderRadius: "6px", padding: "8px 12px",
          color: E.text, fontSize: "13px",
          fontFamily: "var(--font-sans)", outline: "none",
          fontVariantNumeric: "tabular-nums",
          boxSizing: "border-box",
        }}
      />
      {hint && (
        <p style={{ fontSize: "10px", color: E.textFaint, fontFamily: "var(--font-sans)", marginTop: "4px" }}>
          {hint}
        </p>
      )}
    </div>
  );
}

function SliderField({
  label, value, min, max, step, onChange, hint,
}: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; hint?: string }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "5px" }}>
        <label style={{ fontSize: "9px", fontWeight: 600, color: E.textFaint, fontFamily: "var(--font-sans)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {label}
        </label>
        <span style={{ fontSize: "13px", fontWeight: 700, color: E.gold, fontFamily: "var(--font-sans)", fontVariantNumeric: "tabular-nums" }}>
          {value}%
        </span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        style={{
          width: "100%", accentColor: E.gold,
        }}
      />
      {hint && (
        <p style={{ fontSize: "10px", color: E.textFaint, fontFamily: "var(--font-sans)", marginTop: "4px" }}>
          {hint}
        </p>
      )}
    </div>
  );
}

