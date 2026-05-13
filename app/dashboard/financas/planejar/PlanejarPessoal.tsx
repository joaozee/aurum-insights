"use client";

/**
 * PlanejarPessoal — aba Planejar focada em pessoa física.
 *
 * Substitui o bloco antigo (Orçamentos + Metas planas) por uma camada
 * com 5 seções orientadas a planejamento real de PF:
 *
 *  1) Hero "Saúde financeira" — score 0-100 derivado de 4 sinais
 *     (taxa de poupança, peso dos fixos, reserva emergência, disciplina orçamentária)
 *  2) Reserva de emergência — calculadora baseada na média de gastos
 *  3) Regra 50/30/20 — mapeamento automático de categorias
 *  4) Orçamentos do mês — redesenhados com ring + status
 *  5) Metas financeiras (sonhos) — cards ricos com projeção de conclusão
 *
 * Tudo client-side, consumindo `transactions` + `monthlyTrend` + `budgets` + `goals`
 * que o pai (FinancasContent) já busca. Zero fetch novo.
 */

import { useMemo } from "react";
import {
  Plus, Target, Trash2, AlertCircle, Check, Shield, PieChart,
  Activity, Sparkles, TrendingUp, Calendar,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { CHART_PALETTE } from "@/lib/aurum-colors";

// ─── Types (espelham FinancasContent) ─────────────────────────────────────────

export interface FinanceTransaction {
  id: string;
  type: "entrada" | "saida";
  category: string;
  amount: number;
  description: string;
  transaction_date: string;
}

export interface Budget {
  id: string;
  category: string;
  monthly_limit: number;
  alert_threshold: number;
  month: number;
  year: number;
}

export interface FinancialGoal {
  id: string;
  title: string;
  description: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  category: string;
  monthly_contribution: number;
  status: string;
}

interface Props {
  transactions: FinanceTransaction[];               // mês corrente
  monthlyTrend: { month: string; income: number; expense: number }[]; // últimos 6 meses
  budgets: Budget[];
  goals: FinancialGoal[];
  byCategory: [string, number][];                   // gastos do mês por cat (sorted desc)
  onNewBudget: () => void;
  onNewGoal: () => void;
  onDeleteBudget: (b: Budget) => void;
  onDeleteGoal: (g: FinancialGoal) => void;
}

// ─── Constantes — mapping 50/30/20 ────────────────────────────────────────────

const NEEDS_CATEGORIES = ["Alimentação", "Moradia", "Saúde", "Transporte", "Impostos", "Serviços"];
const WANTS_CATEGORIES = ["Lazer", "Vestuário", "Outros"];
const SAVINGS_CATEGORIES = ["Educação", "Investimentos"];

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtShort = (v: number) => {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)} M`;
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(1)} k`;
  return fmt(v);
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function PlanejarPessoal({
  transactions, monthlyTrend, budgets, goals, byCategory,
  onNewBudget, onNewGoal, onDeleteBudget, onDeleteGoal,
}: Props) {
  // ── Métricas base ─────────────────────────────────────────────────────────
  const incomeMonth  = useMemo(() => transactions.filter((t) => t.type === "entrada").reduce((s, t) => s + Number(t.amount), 0), [transactions]);
  const expenseMonth = useMemo(() => transactions.filter((t) => t.type === "saida").reduce((s, t) => s + Number(t.amount), 0), [transactions]);

  // Média de gastos dos últimos 6 meses (ignora meses zerados)
  const avgExpense = useMemo(() => {
    const nonZero = monthlyTrend.filter((m) => m.expense > 0);
    if (nonZero.length === 0) return expenseMonth;
    return nonZero.reduce((s, m) => s + m.expense, 0) / nonZero.length;
  }, [monthlyTrend, expenseMonth]);

  // Reserva: procura meta com categoria "Emergência" pra puxar progresso real
  const emergencyGoal = useMemo(
    () => goals.find((g) => g.category === "Emergência"),
    [goals]
  );
  const emergencyTarget = avgExpense * 6;        // 6 meses de despesa = teto saudável
  const emergencyMin    = avgExpense * 3;        // 3 meses = piso
  const emergencyCurrent = emergencyGoal ? Number(emergencyGoal.current_amount) : 0;
  const emergencyPct = emergencyTarget > 0 ? Math.min(100, (emergencyCurrent / emergencyTarget) * 100) : 0;

  // 50/30/20 — classifica os gastos do mês
  const split503020 = useMemo(() => {
    let needs = 0, wants = 0, savings = 0, other = 0;
    transactions.filter((t) => t.type === "saida").forEach((t) => {
      const v = Number(t.amount);
      if (NEEDS_CATEGORIES.includes(t.category)) needs += v;
      else if (WANTS_CATEGORIES.includes(t.category)) wants += v;
      else if (SAVINGS_CATEGORIES.includes(t.category)) savings += v;
      else other += v;
    });
    const total = needs + wants + savings + other || 1;
    return {
      needs, wants, savings, other, total,
      needsPct:   (needs   / total) * 100,
      wantsPct:   (wants   / total) * 100,
      savingsPct: (savings / total) * 100,
      otherPct:   (other   / total) * 100,
    };
  }, [transactions]);

  // Taxa de poupança do mês
  const savingsRate = incomeMonth > 0 ? ((incomeMonth - expenseMonth) / incomeMonth) * 100 : 0;

  // Disciplina orçamentária — % de orçamentos não estourados
  const budgetDiscipline = useMemo(() => {
    if (budgets.length === 0) return null;
    const ok = budgets.filter((b) => {
      const spent = byCategory.find(([c]) => c === b.category)?.[1] ?? 0;
      return spent <= b.monthly_limit;
    }).length;
    return (ok / budgets.length) * 100;
  }, [budgets, byCategory]);

  // ── Score de saúde financeira (0-100, 4 sinais ponderados) ────────────────
  const healthScore = useMemo(() => {
    let score = 0;
    let weights = 0;
    // Sinal 1: taxa de poupança (0-30 pts; meta 20%+ = 30)
    const sav = Math.max(0, Math.min(savingsRate, 30));
    score += (sav / 30) * 30;
    weights += 30;
    // Sinal 2: reserva emergência (0-30 pts; 6m gastos = 30)
    score += emergencyPct >= 100 ? 30 : (emergencyPct / 100) * 30;
    weights += 30;
    // Sinal 3: disciplina orçamentária (0-20 pts) — só conta se há orçamentos
    if (budgetDiscipline !== null) {
      score += (budgetDiscipline / 100) * 20;
      weights += 20;
    }
    // Sinal 4: razão fixos vs renda (0-20 pts; <50% = 20)
    if (incomeMonth > 0) {
      const needsRatio = (split503020.needs / incomeMonth) * 100;
      const sig = needsRatio <= 50 ? 20 : Math.max(0, 20 - (needsRatio - 50) * 0.6);
      score += sig;
      weights += 20;
    }
    return weights > 0 ? Math.round((score / weights) * 100) : 0;
  }, [savingsRate, emergencyPct, budgetDiscipline, split503020.needs, incomeMonth]);

  const healthBand =
    healthScore >= 75 ? { label: "Excelente",  color: "#34d399", desc: "Você está em um patamar de planejamento sólido. Continue assim." } :
    healthScore >= 50 ? { label: "Bom",        color: "#C9A84C", desc: "Boa base. Pequenos ajustes podem subir o score significativamente." } :
    healthScore >= 25 ? { label: "Atenção",    color: "#C58A3D", desc: "Há oportunidades concretas. Comece pela reserva de emergência." } :
                        { label: "Crítico",    color: "#f87171", desc: "Construa uma base: reduza gastos variáveis e crie uma reserva mínima." };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* ════ 1) HERO — Saúde Financeira ════ */}
      <HealthHero score={healthScore} band={healthBand} savingsRate={savingsRate} emergencyPct={emergencyPct} budgetDiscipline={budgetDiscipline} />

      {/* ════ 2) RESERVA + 50/30/20 (lado a lado) ════ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <EmergencyCard
          current={emergencyCurrent}
          target={emergencyTarget}
          min={emergencyMin}
          avgExpense={avgExpense}
          pct={emergencyPct}
          hasGoal={!!emergencyGoal}
          onCreate={onNewGoal}
        />
        <Rule503020Card split={split503020} income={incomeMonth} />
      </div>

      {/* ════ 3) ORÇAMENTOS ════ */}
      <section>
        <SectionHeader
          icon={<Target size={14} />}
          title="Orçamentos do mês"
          subtitle="Limite por categoria — alerta antes de estourar"
          action={<HeaderAction onClick={onNewBudget} label="Novo orçamento" />}
        />
        {budgets.length === 0 ? (
          <EmptyState
            icon={Target}
            title="Nenhum orçamento por categoria ainda"
            description="Defina um limite mensal por categoria (ex: R$ 800 em Alimentação). Conforme você lança despesas, mostramos o quanto já foi usado e alertamos antes de estourar."
            action={{ label: "Criar primeiro orçamento", onClick: onNewBudget }}
          />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "12px" }}>
            {budgets.map((b) => {
              const spent = byCategory.find(([c]) => c === b.category)?.[1] ?? 0;
              return (
                <BudgetCard
                  key={b.id}
                  budget={b}
                  spent={spent}
                  onDelete={() => onDeleteBudget(b)}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* ════ 4) METAS ════ */}
      <section>
        <SectionHeader
          icon={<Sparkles size={14} />}
          title="Metas financeiras"
          subtitle="Sonhos com data e valor — patrimônio se constrói com paciência"
          action={<HeaderAction onClick={onNewGoal} label="Nova meta" />}
        />
        {goals.length === 0 ? (
          <EmptyState
            icon={Target}
            title="Sem metas ainda"
            description="Aposentadoria, fundo de emergência, viagem, imóvel — defina o valor alvo e a data, e contribua mensalmente. Patrimônio se constrói com paciência."
            action={{ label: "Criar primeira meta", onClick: onNewGoal }}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {goals.map((g) => (
              <GoalCard key={g.id} goal={g} onDelete={() => onDeleteGoal(g)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionHeader({
  icon, title, subtitle, action,
}: { icon: React.ReactNode; title: string; subtitle: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{
          width: "26px", height: "26px", borderRadius: "7px",
          background: "rgba(201,168,76,0.1)", color: "var(--gold)",
          border: "1px solid rgba(201,168,76,0.18)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {icon}
        </div>
        <div>
          <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-strong)", fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}>
            {title}
          </p>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>
            {subtitle}
          </p>
        </div>
      </div>
      {action}
    </div>
  );
}

function HeaderAction({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: "6px",
        background: "linear-gradient(135deg, rgba(201,168,76,0.18), rgba(201,168,76,0.06))",
        border: "1px solid var(--border-emphasis)",
        borderRadius: "8px", padding: "7px 14px",
        color: "var(--gold-light)", fontSize: "12px", fontWeight: 700,
        fontFamily: "var(--font-sans)", cursor: "pointer", letterSpacing: "0.02em",
        transition: "all 150ms var(--ease-out)",
      }}
      className="aurum-hover-bg"
    >
      <Plus size={12} /> {label}
    </button>
  );
}

// ─── 1) Health Hero — score ring + 3 mini gauges ────────────────────────────

function HealthHero({
  score, band, savingsRate, emergencyPct, budgetDiscipline,
}: {
  score: number;
  band: { label: string; color: string; desc: string };
  savingsRate: number;
  emergencyPct: number;
  budgetDiscipline: number | null;
}) {
  return (
    <div style={{
      position: "relative",
      background: `
        radial-gradient(circle at 100% 0%, ${band.color}1f, transparent 55%),
        radial-gradient(circle at 0% 100%, rgba(201,168,76,0.06), transparent 55%),
        var(--bg-card)
      `,
      border: "1px solid var(--border-soft)",
      borderRadius: "16px",
      padding: "26px 28px",
      overflow: "hidden",
    }}>
      {/* gold accent line */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "1px",
        background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.35), transparent)",
      }} />

      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "32px", alignItems: "center" }}>
        {/* Score ring */}
        <ScoreRing score={score} color={band.color} />

        {/* Right side: label + desc + 3 mini gauges */}
        <div>
          <p style={{
            fontSize: "10px", fontWeight: 700, color: "var(--gold)",
            fontFamily: "var(--font-sans)", letterSpacing: "0.16em",
            textTransform: "uppercase", marginBottom: "6px",
          }}>
            Saúde Financeira
          </p>
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px", flexWrap: "wrap" }}>
            <h3 style={{
              fontSize: "26px", fontWeight: 700, color: "var(--text-strong)",
              fontFamily: "var(--font-display)", letterSpacing: "-0.01em",
              lineHeight: 1,
            }}>
              {band.label}
            </h3>
            <span style={{
              fontSize: "13px", fontWeight: 700, color: band.color,
              fontFamily: "var(--font-sans)",
              padding: "3px 10px", borderRadius: "999px",
              background: `${band.color}1f`,
              border: `1px solid ${band.color}40`,
              fontVariantNumeric: "tabular-nums",
            }}>
              {score} / 100
            </span>
          </div>
          <p style={{ fontSize: "12px", color: "var(--text-body)", fontFamily: "var(--font-sans)", marginTop: "8px", lineHeight: 1.5, maxWidth: "520px" }}>
            {band.desc}
          </p>

          {/* Mini gauges */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginTop: "18px" }}>
            <MiniGauge
              icon={<TrendingUp size={11} />}
              label="Taxa de poupança"
              value={`${Math.max(0, savingsRate).toFixed(0)}%`}
              pct={Math.max(0, Math.min(100, savingsRate * (100 / 30)))}
              hint="Meta: 20%+"
            />
            <MiniGauge
              icon={<Shield size={11} />}
              label="Reserva de emergência"
              value={`${emergencyPct.toFixed(0)}%`}
              pct={emergencyPct}
              hint="Meta: 6 meses"
            />
            <MiniGauge
              icon={<Target size={11} />}
              label="Disciplina orçamentária"
              value={budgetDiscipline !== null ? `${budgetDiscipline.toFixed(0)}%` : "—"}
              pct={budgetDiscipline ?? 0}
              hint={budgetDiscipline !== null ? "Orçamentos no limite" : "Crie orçamentos"}
              disabled={budgetDiscipline === null}
            />
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
          style={{ transition: "stroke-dasharray 500ms var(--ease-out)" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: "2px",
      }}>
        <span style={{
          fontSize: "32px", fontWeight: 700, color: "var(--text-strong)",
          fontFamily: "var(--font-display)", lineHeight: 1, letterSpacing: "-0.02em",
          fontVariantNumeric: "tabular-nums",
        }}>
          {score}
        </span>
        <span style={{
          fontSize: "9px", fontWeight: 600, color: "var(--text-faint)",
          fontFamily: "var(--font-sans)", letterSpacing: "0.12em", textTransform: "uppercase",
        }}>
          de 100
        </span>
      </div>
    </div>
  );
}

function MiniGauge({
  icon, label, value, pct, hint, disabled,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  pct: number;
  hint: string;
  disabled?: boolean;
}) {
  const clamp = Math.max(0, Math.min(100, pct));
  return (
    <div style={{ opacity: disabled ? 0.5 : 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "6px", color: "var(--text-faint)" }}>
        {icon}
        <span style={{ fontSize: "9px", fontWeight: 600, fontFamily: "var(--font-sans)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {label}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "5px" }}>
        <span style={{
          fontSize: "16px", fontWeight: 700, color: "var(--text-default)",
          fontFamily: "var(--font-sans)", fontVariantNumeric: "tabular-nums",
          lineHeight: 1,
        }}>
          {value}
        </span>
        <span style={{ fontSize: "10px", color: "var(--text-faint)", fontFamily: "var(--font-sans)" }}>
          {hint}
        </span>
      </div>
      <div style={{ height: "3px", background: "rgba(201,168,76,0.06)", borderRadius: "2px", overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${clamp}%`,
          background: "linear-gradient(90deg, var(--gold-dim), var(--gold-light))",
          borderRadius: "2px",
          transition: "width 400ms var(--ease-out)",
        }} />
      </div>
    </div>
  );
}

// ─── 2) Reserva de emergência ────────────────────────────────────────────────

function EmergencyCard({
  current, target, min, avgExpense, pct, hasGoal, onCreate,
}: {
  current: number;
  target: number;
  min: number;
  avgExpense: number;
  pct: number;
  hasGoal: boolean;
  onCreate: () => void;
}) {
  const monthsCovered = avgExpense > 0 ? current / avgExpense : 0;
  const status =
    monthsCovered >= 6 ? { label: "Reserva sólida", color: "#34d399" } :
    monthsCovered >= 3 ? { label: "Reserva mínima ok", color: "#C9A84C" } :
    monthsCovered >= 1 ? { label: "Reserva inicial", color: "#C58A3D" } :
                         { label: "Sem reserva", color: "#f87171" };

  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border-soft)",
      borderRadius: "14px", padding: "20px 22px",
      display: "flex", flexDirection: "column", gap: "14px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "8px",
            background: "rgba(94,107,140,0.18)", color: "#7B8BAD",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Shield size={16} />
          </div>
          <div>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-strong)", fontFamily: "var(--font-display)" }}>
              Reserva de emergência
            </p>
            <p style={{ fontSize: "10px", color: "var(--text-faint)", fontFamily: "var(--font-sans)" }}>
              Meta: 6× gastos médios mensais
            </p>
          </div>
        </div>
        <span style={{
          fontSize: "9px", fontWeight: 700, color: status.color,
          background: `${status.color}1f`, border: `1px solid ${status.color}33`,
          padding: "3px 8px", borderRadius: "5px",
          fontFamily: "var(--font-sans)", letterSpacing: "0.06em", textTransform: "uppercase",
        }}>
          {status.label}
        </span>
      </div>

      {/* Progress bar com marcos (mínimo 3m e ideal 6m) */}
      <div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "8px" }}>
          <span style={{
            fontSize: "22px", fontWeight: 700, color: "var(--text-strong)",
            fontFamily: "var(--font-display)", fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.01em",
          }}>
            {fmt(current)}
          </span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>
            de {fmt(target)}
          </span>
        </div>
        <div style={{ position: "relative", height: "10px", background: "var(--bg-input)", borderRadius: "5px", overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${Math.min(100, pct)}%`,
            background: `linear-gradient(90deg, ${status.color}, ${status.color}aa)`,
            borderRadius: "5px",
            transition: "width 400ms var(--ease-out)",
          }} />
          {/* Marca dos 3 meses (50%) */}
          <div style={{
            position: "absolute", left: "50%", top: 0, bottom: 0,
            width: "1px", background: "rgba(201,168,76,0.4)",
          }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "5px", fontSize: "9px", color: "var(--text-faint)", fontFamily: "var(--font-sans)", letterSpacing: "0.04em" }}>
          <span>R$ 0</span>
          <span>3 meses · {fmtShort(min)}</span>
          <span>6 meses · {fmtShort(target)}</span>
        </div>
      </div>

      {/* Footer: meses cobertos + cta */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "8px", borderTop: "1px solid var(--border-faint)" }}>
        <div>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>
            Cobre <span style={{ color: "var(--text-strong)", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{monthsCovered.toFixed(1)}</span> {monthsCovered === 1 ? "mês" : "meses"} dos seus gastos
          </p>
          <p style={{ fontSize: "10px", color: "var(--text-faint)", fontFamily: "var(--font-sans)" }}>
            Gasto médio: {fmtShort(avgExpense)}/mês
          </p>
        </div>
        {!hasGoal && (
          <button
            onClick={onCreate}
            style={{
              fontSize: "11px", fontWeight: 600,
              color: "var(--gold)",
              background: "rgba(201,168,76,0.1)",
              border: "1px solid var(--border-emphasis)",
              borderRadius: "6px", padding: "5px 10px",
              cursor: "pointer", fontFamily: "var(--font-sans)",
              display: "inline-flex", alignItems: "center", gap: "4px",
            }}
            className="aurum-hover-bg aurum-hover-transition"
          >
            <Plus size={11} /> Criar meta
          </button>
        )}
      </div>
    </div>
  );
}

// ─── 3) Regra 50/30/20 ───────────────────────────────────────────────────────

function Rule503020Card({
  split, income,
}: {
  split: { needs: number; wants: number; savings: number; other: number; total: number; needsPct: number; wantsPct: number; savingsPct: number; otherPct: number };
  income: number;
}) {
  const targets = { needs: 50, wants: 30, savings: 20 };
  const realized = {
    needs: income > 0 ? (split.needs / income) * 100 : split.needsPct,
    wants: income > 0 ? (split.wants / income) * 100 : split.wantsPct,
    savings: income > 0 ? Math.max(0, ((income - split.total) / income) * 100) : split.savingsPct,
  };

  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border-soft)",
      borderRadius: "14px", padding: "20px 22px",
      display: "flex", flexDirection: "column", gap: "14px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "8px",
            background: "rgba(110,140,74,0.18)", color: "#8FAA62",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <PieChart size={16} />
          </div>
          <div>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-strong)", fontFamily: "var(--font-display)" }}>
              Regra 50/30/20
            </p>
            <p style={{ fontSize: "10px", color: "var(--text-faint)", fontFamily: "var(--font-sans)" }}>
              Necessidades · Desejos · Poupança
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <SplitBar label="Necessidades" hint="Alimentação, moradia, saúde, transporte" target={targets.needs} real={realized.needs} color="#4F8A82" amount={split.needs} />
        <SplitBar label="Desejos"      hint="Lazer, vestuário, supérfluos"           target={targets.wants}  real={realized.wants}  color="#A4485E" amount={split.wants} />
        <SplitBar label="Poupança"     hint="Investimentos, educação, reserva"        target={targets.savings} real={realized.savings} color="#6E8C4A" amount={income > 0 ? Math.max(0, income - split.total) : split.savings} isSavings />
      </div>

      {income === 0 && (
        <p style={{ fontSize: "10px", color: "var(--text-faint)", fontFamily: "var(--font-sans)", fontStyle: "italic", paddingTop: "6px", borderTop: "1px solid var(--border-faint)" }}>
          Adicione entradas (salário, freelance) pra calcular % sobre a renda. Por enquanto, % é sobre o total gasto.
        </p>
      )}
    </div>
  );
}

function SplitBar({
  label, hint, target, real, color, amount, isSavings,
}: {
  label: string; hint: string; target: number; real: number; color: string; amount: number; isSavings?: boolean;
}) {
  // Se isSavings: real menor que target = ruim. Senão: real maior que target = ruim.
  const ok = isSavings ? real >= target * 0.9 : real <= target * 1.1;
  const statusColor = ok ? "var(--positive)" : "var(--negative)";
  const diff = real - target;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "5px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-default)", fontFamily: "var(--font-sans)" }}>
            {label}
          </span>
          <span style={{ fontSize: "10px", color: "var(--text-faint)", fontFamily: "var(--font-sans)" }}>
            {hint}
          </span>
        </div>
        <span style={{ fontSize: "11px", fontWeight: 700, color: statusColor, fontFamily: "var(--font-sans)", fontVariantNumeric: "tabular-nums" }}>
          {real.toFixed(0)}% / {target}%
        </span>
      </div>
      <div style={{ position: "relative", height: "8px", background: "var(--bg-input)", borderRadius: "4px", overflow: "hidden" }}>
        {/* Target marker */}
        <div style={{
          position: "absolute", top: 0, bottom: 0,
          left: `${Math.min(100, target)}%`, width: "1px",
          background: "rgba(201,168,76,0.45)",
          boxShadow: "0 0 4px rgba(201,168,76,0.3)",
        }} />
        {/* Real bar */}
        <div style={{
          height: "100%", width: `${Math.min(100, real)}%`,
          background: color, borderRadius: "4px",
          transition: "width 400ms var(--ease-out)",
        }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
        <span style={{ fontSize: "10px", color: "var(--text-faint)", fontFamily: "var(--font-sans)", fontVariantNumeric: "tabular-nums" }}>
          {fmt(amount)}
        </span>
        <span style={{ fontSize: "10px", color: statusColor, fontFamily: "var(--font-sans)", fontVariantNumeric: "tabular-nums" }}>
          {diff >= 0 ? "+" : ""}{diff.toFixed(0)}pp vs meta
        </span>
      </div>
    </div>
  );
}

// ─── 4) Budget card ──────────────────────────────────────────────────────────

function BudgetCard({ budget, spent, onDelete }: { budget: Budget; spent: number; onDelete: () => void }) {
  const pct = Math.min((spent / budget.monthly_limit) * 100, 100);
  const realPct = (spent / budget.monthly_limit) * 100;
  const over = spent > budget.monthly_limit;
  const alert = pct >= budget.alert_threshold && !over;
  const status = over ? "#f87171" : alert ? "#C58A3D" : "#34d399";
  const statusLabel = over ? "Estourado" : alert ? "No limite" : "No verde";

  return (
    <div style={{
      position: "relative",
      background: "var(--bg-card)",
      border: `1px solid ${over ? "rgba(248,113,113,0.3)" : "var(--border-soft)"}`,
      borderRadius: "12px", padding: "16px 18px",
      display: "flex", flexDirection: "column", gap: "10px",
      transition: "border-color 150ms var(--ease-out)",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
            <span style={{
              width: "6px", height: "6px", borderRadius: "50%",
              background: status, boxShadow: `0 0 6px ${status}80`,
            }} />
            <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-strong)", fontFamily: "var(--font-display)", letterSpacing: "-0.005em" }}>
              {budget.category}
            </p>
          </div>
          <p style={{ fontSize: "10px", fontWeight: 600, color: status, fontFamily: "var(--font-sans)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
            {statusLabel}
          </p>
        </div>
        <button
          onClick={onDelete}
          aria-label="Remover orçamento"
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "var(--text-faint)", padding: "4px",
            transition: "color 150ms var(--ease-out)",
          }}
          className="aurum-hover-gold"
        >
          {over ? <AlertCircle size={13} style={{ color: "#f87171" }} /> : <Trash2 size={12} />}
        </button>
      </div>

      <div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "6px" }}>
          <span style={{
            fontSize: "16px", fontWeight: 700, color: status,
            fontFamily: "var(--font-sans)", fontVariantNumeric: "tabular-nums", lineHeight: 1,
          }}>
            {fmt(spent)}
          </span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-sans)", fontVariantNumeric: "tabular-nums" }}>
            de {fmt(budget.monthly_limit)}
          </span>
        </div>
        <div style={{ height: "6px", background: "var(--bg-input)", borderRadius: "3px", overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${pct}%`,
            background: status, borderRadius: "3px",
            transition: "width 400ms var(--ease-out)",
          }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "5px" }}>
          <span style={{ fontSize: "10px", color: "var(--text-faint)", fontFamily: "var(--font-sans)", fontVariantNumeric: "tabular-nums" }}>
            {realPct.toFixed(0)}% utilizado
          </span>
          {!over && (
            <span style={{ fontSize: "10px", color: "var(--text-faint)", fontFamily: "var(--font-sans)", fontVariantNumeric: "tabular-nums" }}>
              {fmt(Math.max(0, budget.monthly_limit - spent))} restantes
            </span>
          )}
          {over && (
            <span style={{ fontSize: "10px", color: "var(--negative)", fontFamily: "var(--font-sans)", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
              +{fmt(spent - budget.monthly_limit)} estourado
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 5) Goal card (sonho) ────────────────────────────────────────────────────

function GoalCard({ goal, onDelete }: { goal: FinancialGoal; onDelete: () => void }) {
  const current = Number(goal.current_amount);
  const target = Number(goal.target_amount);
  const contribution = Number(goal.monthly_contribution);
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const remaining = Math.max(0, target - current);

  const targetDate = new Date(goal.target_date);
  const daysLeft = Math.ceil((targetDate.getTime() - Date.now()) / 86400000);

  // Estimativa de conclusão baseada na contribuição mensal
  const monthsToFinish = contribution > 0 ? Math.ceil(remaining / contribution) : null;
  const finishDateEst = monthsToFinish !== null
    ? new Date(Date.now() + monthsToFinish * 30 * 86400000)
    : null;

  // Status
  const done = pct >= 100;
  const onTrack = monthsToFinish !== null && finishDateEst && finishDateEst <= targetDate;

  // Cor do sonho: cicla pela paleta usando hash simples do título
  const palIdx = (goal.title.charCodeAt(0) || 0) % CHART_PALETTE.length;
  const accent = CHART_PALETTE[palIdx];

  return (
    <div style={{
      position: "relative",
      background: `linear-gradient(135deg, ${accent}0d, transparent 60%), var(--bg-card)`,
      border: `1px solid ${accent}33`,
      borderRadius: "14px", padding: "18px 22px",
      display: "grid", gridTemplateColumns: "1fr auto", gap: "16px",
      alignItems: "center",
      overflow: "hidden",
    }}>
      {/* Left: title + meta + progress */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <div style={{
            width: "24px", height: "24px", borderRadius: "6px",
            background: `${accent}22`, color: accent,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Sparkles size={12} />
          </div>
          <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-strong)", fontFamily: "var(--font-display)", letterSpacing: "-0.005em" }}>
            {goal.title}
          </p>
          {done && (
            <span style={{
              fontSize: "9px", fontWeight: 700, color: "#34d399",
              background: "rgba(52,211,153,0.12)",
              border: "1px solid rgba(52,211,153,0.3)",
              padding: "2px 7px", borderRadius: "999px",
              display: "inline-flex", alignItems: "center", gap: "3px",
              fontFamily: "var(--font-sans)", letterSpacing: "0.06em", textTransform: "uppercase",
            }}>
              <Check size={9} /> Concluído
            </span>
          )}
        </div>
        <p style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-sans)", marginBottom: "10px" }}>
          {goal.category}
          {daysLeft > 0 && (
            <>
              {" · "}
              <Calendar size={10} style={{ display: "inline", verticalAlign: "-1px", marginRight: "2px" }} />
              {daysLeft} dias restantes
            </>
          )}
          {daysLeft <= 0 && !done && (
            <span style={{ color: "#f87171", fontWeight: 600 }}> · Prazo encerrado</span>
          )}
        </p>

        {/* Progress */}
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "6px" }}>
          <span style={{
            fontSize: "16px", fontWeight: 700, color: accent,
            fontFamily: "var(--font-sans)", fontVariantNumeric: "tabular-nums", lineHeight: 1,
          }}>
            {fmt(current)}
          </span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>
            meta: {fmt(target)}
          </span>
        </div>
        <div style={{ height: "6px", background: "var(--bg-input)", borderRadius: "3px", overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${pct}%`,
            background: `linear-gradient(90deg, ${accent}, ${accent}aa)`,
            borderRadius: "3px",
            transition: "width 400ms var(--ease-out)",
          }} />
        </div>

        {/* Footer info */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", gap: "12px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "10px", color: "var(--text-faint)", fontFamily: "var(--font-sans)", fontVariantNumeric: "tabular-nums" }}>
            {pct.toFixed(1)}% concluído
          </span>
          {contribution > 0 && (
            <span style={{ fontSize: "10px", color: "var(--text-faint)", fontFamily: "var(--font-sans)", fontVariantNumeric: "tabular-nums" }}>
              Aporte: {fmtShort(contribution)}/mês
            </span>
          )}
          {monthsToFinish !== null && finishDateEst && !done && (
            <span style={{
              fontSize: "10px",
              color: onTrack ? "var(--positive)" : "#C58A3D",
              fontFamily: "var(--font-sans)",
            }}>
              <Activity size={9} style={{ display: "inline", verticalAlign: "-1px", marginRight: "3px" }} />
              {onTrack
                ? `No ritmo · pronto em ~${monthsToFinish} ${monthsToFinish === 1 ? "mês" : "meses"}`
                : `Atraso · precisa mais que ${fmtShort(contribution)}/mês`}
            </span>
          )}
        </div>
      </div>

      {/* Right: big % ring */}
      <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
        <svg width={72} height={72} viewBox="0 0 72 72">
          <circle cx={36} cy={36} r={28} fill="none" stroke="rgba(201,168,76,0.08)" strokeWidth={5} />
          <circle
            cx={36} cy={36} r={28} fill="none"
            stroke={accent} strokeWidth={5} strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * 2 * Math.PI * 28} ${2 * Math.PI * 28}`}
            transform="rotate(-90 36 36)"
            style={{ transition: "stroke-dasharray 500ms var(--ease-out)" }}
          />
        </svg>
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "14px", fontWeight: 700, color: accent,
          fontFamily: "var(--font-display)", fontVariantNumeric: "tabular-nums",
        }}>
          {pct.toFixed(0)}%
        </div>
        <button
          onClick={onDelete}
          aria-label="Apagar meta"
          style={{
            position: "absolute", top: "-4px", right: "-4px",
            width: "20px", height: "20px",
            background: "var(--bg-card)",
            border: "1px solid var(--border-faint)",
            borderRadius: "50%",
            color: "var(--text-faint)",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            opacity: 0.6, transition: "opacity 150ms var(--ease-out)",
          }}
          className="aurum-goal-del"
        >
          <Trash2 size={10} />
        </button>
      </div>

      <style jsx>{`
        :global(.aurum-goal-del:hover) {
          opacity: 1 !important;
          color: var(--negative) !important;
          border-color: rgba(248,113,113,0.4) !important;
        }
      `}</style>
    </div>
  );
}

