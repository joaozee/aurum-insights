"use client";

/**
 * ReportsExtra — Camada de relatórios avançados da aba Finanças → Relatórios.
 *
 * Renderiza, em sequência:
 * 1) Heatmap semanal (gastos por dia da semana)
 * 2) Fixos vs Variáveis (classificação automática por recorrência + CV)
 * 3) Análise & Insights: Tendência, Anomalias, Insights, Comparativo M/M & A/A
 * 4) Exportação: PDF (via print) e CSV
 *
 * Toda a UI consome `reportTx` (transações filtradas pelo período) e
 * `reportTrend` (agregação mensal), já calculadas no FinancasContent.
 */

import { useMemo } from "react";
import {
  CalendarDays, Repeat2, TrendingUp, AlertTriangle, Lightbulb,
  CalendarRange, FileText, FileSpreadsheet, Sparkles, ArrowUp, ArrowDown,
  Activity,
} from "lucide-react";
import { FINANCE_CATEGORY_COLORS } from "@/lib/aurum-colors";

// ─── Types (espelham FinancasContent) ─────────────────────────────────────────

export interface FinanceTransaction {
  id: string;
  account_type: "pessoal" | "empresa";
  type: "entrada" | "saida";
  category: string;
  amount: number;
  description: string;
  transaction_date: string;
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expense: number;
}

interface Props {
  reportTx: FinanceTransaction[];
  reportTrend: MonthlyTrend[];
  reportPeriodLabel: string;
  selectedCategory: string;
}

const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtPct = (v: number) => {
  const sign = v >= 0 ? "+" : "";
  return `${sign}${v.toFixed(1)}%`;
};

const DAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const DAYS_PT_FULL = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

// ─── Component ───────────────────────────────────────────────────────────────

export default function ReportsExtra({
  reportTx, reportTrend, reportPeriodLabel, selectedCategory,
}: Props) {
  // ──────────────────── 1) Heatmap semanal ──────────────────────────────────
  const weekHeatmap = useMemo(() => {
    const totals = [0, 0, 0, 0, 0, 0, 0];   // Dom→Sab
    const counts = [0, 0, 0, 0, 0, 0, 0];
    reportTx
      .filter((t) => t.type === "saida")
      .filter((t) => selectedCategory === "all" || t.category === selectedCategory)
      .forEach((t) => {
        // Sempre construir a partir de YYYY-MM-DD com hora fixa pra evitar TZ shift
        const d = new Date(t.transaction_date + "T12:00:00");
        const dow = d.getDay();
        totals[dow] += Number(t.amount);
        counts[dow] += 1;
      });
    const max = Math.max(...totals, 1);
    return { totals, counts, max };
  }, [reportTx, selectedCategory]);

  // ──────────────────── 2) Fixos vs Variáveis ───────────────────────────────
  const fixedVariable = useMemo(() => {
    const expenseTx = reportTx
      .filter((t) => t.type === "saida")
      .filter((t) => selectedCategory === "all" || t.category === selectedCategory);

    // Pra cada categoria, agrupa por mês (YYYY-MM)
    const byCatMonth: Record<string, Record<string, number>> = {};
    const monthsSet = new Set<string>();
    for (const t of expenseTx) {
      const m = t.transaction_date.slice(0, 7);
      monthsSet.add(m);
      if (!byCatMonth[t.category]) byCatMonth[t.category] = {};
      byCatMonth[t.category][m] = (byCatMonth[t.category][m] ?? 0) + Number(t.amount);
    }
    const totalMonths = Math.max(1, monthsSet.size);

    type Row = { category: string; total: number; avg: number; coverage: number; cv: number };
    const fixed: Row[] = [];
    const variable: Row[] = [];

    for (const [cat, mMap] of Object.entries(byCatMonth)) {
      const values = Object.values(mMap);
      const total = values.reduce((a, b) => a + b, 0);
      const avg = total / Math.max(1, values.length);
      const variance = values.reduce((a, b) => a + (b - avg) ** 2, 0) / Math.max(1, values.length);
      const stdDev = Math.sqrt(variance);
      const cv = avg > 0 ? stdDev / avg : 1;
      const coverage = values.length / totalMonths;
      const row: Row = { category: cat, total, avg, coverage, cv };

      // Heurística: aparece em ≥70% dos meses E coeficiente de variação < 0.4
      // → recorrente (FIXO). Pra períodos curtos (1-2 meses) a heurística é fraca,
      // então só ativa quando totalMonths ≥ 3.
      if (totalMonths >= 3 && coverage >= 0.7 && cv < 0.4) {
        fixed.push(row);
      } else {
        variable.push(row);
      }
    }

    fixed.sort((a, b) => b.total - a.total);
    variable.sort((a, b) => b.total - a.total);
    const fixedTotal = fixed.reduce((s, r) => s + r.total, 0);
    const variableTotal = variable.reduce((s, r) => s + r.total, 0);

    return {
      fixed, variable, fixedTotal, variableTotal,
      totalMonths,
      hasEnoughData: totalMonths >= 3,
    };
  }, [reportTx, selectedCategory]);

  // ──────────────────── 3) Tendência (média móvel 3m) ───────────────────────
  const trendAnalysis = useMemo(() => {
    if (reportTrend.length < 2) return null;
    const expenses = reportTrend.map((t) => t.expense);
    // Média móvel de 3 meses (com janela parcial nos primeiros)
    const window = 3;
    const ma: number[] = expenses.map((_, i) => {
      const start = Math.max(0, i - window + 1);
      const slice = expenses.slice(start, i + 1);
      return slice.reduce((a, b) => a + b, 0) / slice.length;
    });
    // Comparar último ponto vs média móvel anterior pra dizer "subindo/descendo"
    const last = expenses[expenses.length - 1];
    const prevAvg = ma[Math.max(0, ma.length - 2)];
    const trendDirection: "up" | "down" | "flat" =
      prevAvg === 0
        ? "flat"
        : last > prevAvg * 1.05
          ? "up"
          : last < prevAvg * 0.95
            ? "down"
            : "flat";
    const trendPct = prevAvg > 0 ? ((last - prevAvg) / prevAvg) * 100 : 0;
    return { expenses, ma, trendDirection, trendPct, last, prevAvg };
  }, [reportTrend]);

  // ──────────────────── 4) Anomalias e picos ────────────────────────────────
  const anomalies = useMemo(() => {
    if (reportTrend.length < 3) return { items: [], mean: 0, stdDev: 0, threshold: 0 };
    const expenses = reportTrend.map((t) => t.expense);
    const mean = expenses.reduce((a, b) => a + b, 0) / expenses.length;
    const variance = expenses.reduce((a, b) => a + (b - mean) ** 2, 0) / expenses.length;
    const stdDev = Math.sqrt(variance);
    const threshold = mean + 1.5 * stdDev;
    const items = reportTrend
      .map((t) => ({
        month: t.month,
        expense: t.expense,
        deviationPct: mean > 0 ? ((t.expense - mean) / mean) * 100 : 0,
      }))
      .filter((t) => t.expense > threshold && t.expense > 0)
      .sort((a, b) => b.expense - a.expense);
    return { items, mean, stdDev, threshold };
  }, [reportTrend]);

  // ──────────────────── 5) Insights automáticos ─────────────────────────────
  const insights = useMemo(() => {
    type Insight = { kind: "info" | "warn" | "good"; text: string };
    const out: Insight[] = [];

    // Insight 1: Crescimento da categoria mais cara — comparar último mês vs média
    if (reportTrend.length >= 2 && reportTx.length > 0) {
      const last = reportTrend[reportTrend.length - 1];
      const lastMonthKey = (() => {
        // reportTx vem agrupado por month string ("Mai" ou "Mai/26") — vamos
        // identificar o último mês real a partir da transaction_date mais recente.
        const dates = reportTx.map((t) => t.transaction_date).sort();
        return dates.length > 0 ? dates[dates.length - 1].slice(0, 7) : null;
      })();
      if (lastMonthKey) {
        const lastMonthTx = reportTx.filter(
          (t) => t.type === "saida" && t.transaction_date.startsWith(lastMonthKey)
        );
        // Top categoria no último mês
        const catLast: Record<string, number> = {};
        lastMonthTx.forEach((t) => { catLast[t.category] = (catLast[t.category] ?? 0) + Number(t.amount); });
        const topCat = Object.entries(catLast).sort((a, b) => b[1] - a[1])[0];
        if (topCat && last.expense > 0) {
          // Comparar com média dos meses anteriores pra essa categoria
          const otherMonthsTx = reportTx.filter(
            (t) => t.type === "saida" && !t.transaction_date.startsWith(lastMonthKey) && t.category === topCat[0]
          );
          const monthsKeys = Array.from(new Set(otherMonthsTx.map((t) => t.transaction_date.slice(0, 7))));
          if (monthsKeys.length > 0) {
            const avgPrev = otherMonthsTx.reduce((s, t) => s + Number(t.amount), 0) / monthsKeys.length;
            if (avgPrev > 0) {
              const diff = ((topCat[1] - avgPrev) / avgPrev) * 100;
              if (diff > 20) {
                out.push({
                  kind: "warn",
                  text: `Você gastou ${diff.toFixed(0)}% mais em ${topCat[0]} este mês comparado à média do período. Quer criar um orçamento para essa categoria?`,
                });
              } else if (diff < -15) {
                out.push({
                  kind: "good",
                  text: `Boa! Você reduziu ${Math.abs(diff).toFixed(0)}% nos gastos com ${topCat[0]} este mês.`,
                });
              }
            }
          }
        }
      }
    }

    // Insight 2: Taxa de poupança
    const income = reportTx.filter((t) => t.type === "entrada").reduce((s, t) => s + Number(t.amount), 0);
    const expense = reportTx.filter((t) => t.type === "saida").reduce((s, t) => s + Number(t.amount), 0);
    if (income > 0) {
      const savings = ((income - expense) / income) * 100;
      if (savings >= 30) {
        out.push({
          kind: "good",
          text: `Sua taxa de poupança é de ${savings.toFixed(1)}%. Acima de 20% já é considerado excelente — está economizando consistentemente.`,
        });
      } else if (savings < 0) {
        out.push({
          kind: "warn",
          text: `Seus gastos ultrapassaram suas entradas em ${Math.abs(savings).toFixed(1)}%. Avalie cortes em categorias variáveis pra equilibrar o mês.`,
        });
      } else if (savings >= 10) {
        out.push({
          kind: "info",
          text: `Sua taxa de poupança é de ${savings.toFixed(1)}%. Tente chegar a 20%+ destinando parte do salário a aplicações antes de gastar.`,
        });
      }
    }

    // Insight 3: Concentração — alguma categoria > 40% das despesas
    if (expense > 0) {
      const byCat: Record<string, number> = {};
      reportTx.filter((t) => t.type === "saida").forEach((t) => {
        byCat[t.category] = (byCat[t.category] ?? 0) + Number(t.amount);
      });
      const top = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];
      if (top && (top[1] / expense) >= 0.4) {
        const pct = (top[1] / expense) * 100;
        out.push({
          kind: "info",
          text: `${pct.toFixed(0)}% dos seus gastos vão pra ${top[0]}. Concentração alta — vale revisar se algum item dessa categoria pode ser otimizado.`,
        });
      }
    }

    // Insight 4: Fixos pesados
    if (fixedVariable.hasEnoughData && fixedVariable.fixedTotal > 0 && expense > 0) {
      const fixedShare = (fixedVariable.fixedTotal / expense) * 100;
      if (fixedShare >= 60) {
        out.push({
          kind: "warn",
          text: `Gastos fixos representam ${fixedShare.toFixed(0)}% do total. Pouca margem pra cortar — considere renegociar assinaturas ou contratos.`,
        });
      }
    }

    return out.slice(0, 5);
  }, [reportTx, reportTrend, fixedVariable]);

  // ──────────────────── 6) Mês a mês / Ano a ano ────────────────────────────
  const comparison = useMemo(() => {
    if (reportTrend.length < 2) return null;
    const n = reportTrend.length;
    const last = reportTrend[n - 1];
    const prev = reportTrend[n - 2];
    const yearAgo = n >= 13 ? reportTrend[n - 13] : null;

    const computeDelta = (a: number, b: number) => {
      if (b === 0) return { abs: a, pct: a > 0 ? 100 : 0 };
      return { abs: a - b, pct: ((a - b) / b) * 100 };
    };

    return {
      last,
      prev,
      yearAgo,
      mom: {
        expense: computeDelta(last.expense, prev.expense),
        income: computeDelta(last.income, prev.income),
      },
      yoy: yearAgo
        ? {
            expense: computeDelta(last.expense, yearAgo.expense),
            income: computeDelta(last.income, yearAgo.income),
          }
        : null,
    };
  }, [reportTrend]);

  // ──────────────────── Export handlers ─────────────────────────────────────
  const exportCSV = () => {
    const rows: (string | number)[][] = [
      ["Data", "Tipo", "Categoria", "Descrição", "Valor (BRL)"],
      ...reportTx.map((t) => [
        t.transaction_date,
        t.type === "entrada" ? "Entrada" : "Saída",
        t.category,
        (t.description || "").replace(/"/g, '""'),
        Number(t.amount).toFixed(2).replace(".", ","),
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c)}"`).join(";"))
      .join("\r\n");
    // BOM no início ajuda Excel BR a interpretar acentos corretamente
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aurum-transacoes-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    // Estratégia: window.print() + CSS @media print já isola .aurum-print-area
    // O usuário escolhe "Salvar como PDF" no diálogo nativo do navegador.
    document.documentElement.classList.add("aurum-printing");
    // Pequeno delay pra garantir que os estilos foram aplicados antes do dialog
    setTimeout(() => {
      window.print();
      document.documentElement.classList.remove("aurum-printing");
    }, 80);
  };

  // ──────────────────── Render ──────────────────────────────────────────────
  return (
    <div className="aurum-reports-extra" style={{ display: "flex", flexDirection: "column", gap: "20px", marginBottom: "20px" }}>
      {/* Row 1: Heatmap + Fixos vs Variáveis */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <HeatmapCard data={weekHeatmap} />
        <FixedVariableCard data={fixedVariable} />
      </div>

      {/* Section header — Análise e Insights */}
      <SectionHeader
        icon={<Sparkles size={14} />}
        title="Análise e Insights"
        subtitle="Padrões automáticos identificados nas suas transações"
      />

      {/* Row 2: Tendência + Anomalias */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <TrendCard analysis={trendAnalysis} trend={reportTrend} />
        <AnomaliesCard anomalies={anomalies} />
      </div>

      {/* Row 3: Insights + Comparativo */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <InsightsCard insights={insights} />
        <ComparisonCard comparison={comparison} />
      </div>

      {/* Section header — Exportação */}
      <SectionHeader
        icon={<FileText size={14} />}
        title="Exportação e Compartilhamento"
        subtitle="Baixe seus dados em PDF ou planilha"
      />

      {/* Row 4: Exports */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <ExportCard
          icon={<FileText size={16} />}
          badge="PDF"
          badgeColor="#34d399"
          title="Exportar relatório PDF"
          description={`Abre o diálogo de impressão do navegador com os gráficos e a tabela do período (${reportPeriodLabel}) formatados pra salvar como PDF.`}
          onClick={exportPDF}
          actionLabel="Gerar PDF"
        />
        <ExportCard
          icon={<FileSpreadsheet size={16} />}
          badge="CSV/Excel"
          badgeColor="#C9A84C"
          title="Exportar CSV / Excel"
          description={`Baixa ${reportTx.length} transações em CSV (separador ;, encoding UTF-8 com BOM). Abre direto no Excel ou Google Sheets.`}
          onClick={exportCSV}
          actionLabel="Baixar CSV"
        />
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({
  icon, title, subtitle,
}: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px" }}>
      <div style={{
        width: "26px", height: "26px", borderRadius: "7px",
        background: "rgba(201,168,76,0.1)",
        border: "1px solid rgba(201,168,76,0.18)",
        color: "var(--gold)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {icon}
      </div>
      <div>
        <p style={{
          fontSize: "10px", fontWeight: 700, color: "var(--gold)",
          fontFamily: "var(--font-sans)", letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}>
          {title}
        </p>
        <p style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>
          {subtitle}
        </p>
      </div>
    </div>
  );
}

function CardShell({
  badge, badgeColor, icon, title, description, children,
}: {
  badge?: string;
  badgeColor?: string;
  icon: React.ReactNode;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border-soft)",
      borderRadius: "14px",
      padding: "18px 20px",
      display: "flex", flexDirection: "column",
      position: "relative",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
        <div style={{
          width: "30px", height: "30px", borderRadius: "8px",
          background: `${badgeColor ?? "#C9A84C"}1f`,
          color: badgeColor ?? "var(--gold)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {icon}
        </div>
        {badge && (
          <span style={{
            fontSize: "9px", fontWeight: 700,
            color: badgeColor ?? "var(--gold)",
            background: `${badgeColor ?? "#C9A84C"}1f`,
            border: `1px solid ${badgeColor ?? "#C9A84C"}33`,
            padding: "3px 8px", borderRadius: "5px",
            letterSpacing: "0.08em",
            fontFamily: "var(--font-sans)",
          }}>
            {badge}
          </span>
        )}
      </div>
      <p style={{
        fontSize: "15px", fontWeight: 600, color: "var(--text-strong)",
        fontFamily: "var(--font-display)", letterSpacing: "-0.01em",
        marginTop: "10px", marginBottom: description ? "6px" : 0,
        lineHeight: 1.3,
      }}>
        {title}
      </p>
      {description && (
        <p style={{
          fontSize: "12px", color: "var(--text-muted)",
          fontFamily: "var(--font-sans)", lineHeight: 1.5,
          marginBottom: children ? "14px" : 0,
        }}>
          {description}
        </p>
      )}
      {children}
    </div>
  );
}

// ─── 1) Heatmap semanal ──────────────────────────────────────────────────────

function HeatmapCard({ data }: { data: { totals: number[]; counts: number[]; max: number } }) {
  const { totals, counts, max } = data;
  const totalSpent = totals.reduce((a, b) => a + b, 0);
  // Identifica o pior dia (mais gasto) e o melhor dia
  const worstIdx = totals.indexOf(Math.max(...totals));
  const hasData = totalSpent > 0;

  return (
    <CardShell
      icon={<CalendarDays size={16} />}
      badge="Heatmap"
      badgeColor="#5E6B8C"
      title="Mapa de calor semanal"
      description="Intensidade de gastos por dia da semana — identifica seus dias críticos."
    >
      {hasData ? (
        <>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px",
            marginTop: "4px",
          }}>
            {DAYS_PT.map((label, i) => {
              const value = totals[i];
              const intensity = Math.max(0.05, value / max);
              return (
                <div
                  key={label}
                  title={`${DAYS_PT_FULL[i]}: ${fmtBRL(value)} em ${counts[i]} transaç${counts[i] === 1 ? "ão" : "ões"}`}
                  style={{
                    display: "flex", flexDirection: "column",
                    alignItems: "center", gap: "6px",
                  }}
                >
                  <div style={{
                    width: "100%",
                    aspectRatio: "1",
                    minHeight: "44px",
                    borderRadius: "8px",
                    background: `rgba(201,168,76,${intensity * 0.85})`,
                    border: `1px solid rgba(201,168,76,${Math.min(0.6, intensity * 1.2)})`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: i === worstIdx && value > 0
                      ? "inset 0 0 0 1px rgba(248,113,113,0.4)"
                      : "none",
                    transition: "all 200ms var(--ease-out)",
                  }}>
                    <span style={{
                      fontSize: "11px", fontWeight: 700,
                      color: intensity > 0.5 ? "#1a1410" : "var(--text-muted)",
                      fontFamily: "var(--font-sans)",
                      fontVariantNumeric: "tabular-nums",
                    }}>
                      {counts[i] || ""}
                    </span>
                  </div>
                  <span style={{
                    fontSize: "10px", fontWeight: 600,
                    color: i === worstIdx ? "var(--negative)" : "var(--text-faint)",
                    fontFamily: "var(--font-sans)",
                  }}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "14px", paddingTop: "12px", borderTop: "1px solid var(--border-faint)" }}>
            <Stat label="Pior dia" value={DAYS_PT_FULL[worstIdx]} accent="var(--negative)" />
            <Stat label="Gasto no pior" value={fmtBRL(totals[worstIdx])} />
            <Stat label="Total semanal" value={fmtBRL(totalSpent)} accent="var(--gold)" />
          </div>
        </>
      ) : (
        <EmptyInline message="Sem despesas no período" />
      )}
    </CardShell>
  );
}

// ─── 2) Fixos vs Variáveis ───────────────────────────────────────────────────

function FixedVariableCard({
  data,
}: {
  data: {
    fixed: { category: string; total: number; avg: number; coverage: number; cv: number }[];
    variable: { category: string; total: number; avg: number; coverage: number; cv: number }[];
    fixedTotal: number;
    variableTotal: number;
    totalMonths: number;
    hasEnoughData: boolean;
  };
}) {
  const total = data.fixedTotal + data.variableTotal;
  const fixedPct = total > 0 ? (data.fixedTotal / total) * 100 : 0;
  const variablePct = total > 0 ? (data.variableTotal / total) * 100 : 0;

  return (
    <CardShell
      icon={<Repeat2 size={16} />}
      badge="Recorrência"
      badgeColor="#A4485E"
      title="Gastos fixos vs variáveis"
      description="Separação automática entre despesas recorrentes (aluguel, assinaturas) e gastos pontuais."
    >
      {!data.hasEnoughData ? (
        <EmptyInline message="Precisamos de pelo menos 3 meses de dados pra classificar fixos vs variáveis. Selecione um período maior acima." />
      ) : total === 0 ? (
        <EmptyInline message="Sem despesas no período" />
      ) : (
        <>
          {/* Barra dividida */}
          <div style={{ marginTop: "8px" }}>
            <div style={{
              display: "flex", height: "10px", borderRadius: "5px", overflow: "hidden",
              background: "var(--bg-input)",
            }}>
              <div style={{
                width: `${fixedPct}%`,
                background: "linear-gradient(90deg, #A4485E, #8B5470)",
                transition: "width 300ms var(--ease-out)",
              }} />
              <div style={{
                width: `${variablePct}%`,
                background: "linear-gradient(90deg, #C58A3D, #C9A84C)",
                transition: "width 300ms var(--ease-out)",
              }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", fontSize: "11px", fontFamily: "var(--font-sans)" }}>
              <div>
                <span style={{ color: "#A4485E", fontWeight: 700 }}>● Fixos</span>{" "}
                <span style={{ color: "var(--text-default)", fontVariantNumeric: "tabular-nums" }}>{fmtBRL(data.fixedTotal)}</span>{" "}
                <span style={{ color: "var(--text-faint)" }}>({fixedPct.toFixed(0)}%)</span>
              </div>
              <div>
                <span style={{ color: "#C9A84C", fontWeight: 700 }}>● Variáveis</span>{" "}
                <span style={{ color: "var(--text-default)", fontVariantNumeric: "tabular-nums" }}>{fmtBRL(data.variableTotal)}</span>{" "}
                <span style={{ color: "var(--text-faint)" }}>({variablePct.toFixed(0)}%)</span>
              </div>
            </div>
          </div>

          {/* Top 3 fixos */}
          {data.fixed.length > 0 && (
            <div style={{ marginTop: "14px" }}>
              <p style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-faint)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px", fontFamily: "var(--font-sans)" }}>
                Principais fixos
              </p>
              {data.fixed.slice(0, 3).map((r) => (
                <CategoryRow key={r.category} cat={r.category} value={r.avg} suffix=" /mês" accent="#A4485E" />
              ))}
            </div>
          )}

          {/* Top 3 variáveis */}
          {data.variable.length > 0 && (
            <div style={{ marginTop: "10px" }}>
              <p style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-faint)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px", fontFamily: "var(--font-sans)" }}>
                Principais variáveis
              </p>
              {data.variable.slice(0, 3).map((r) => (
                <CategoryRow key={r.category} cat={r.category} value={r.total} accent="#C9A84C" />
              ))}
            </div>
          )}
        </>
      )}
    </CardShell>
  );
}

function CategoryRow({
  cat, value, suffix, accent,
}: { cat: string; value: number; suffix?: string; accent: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{
          width: "6px", height: "6px", borderRadius: "50%",
          background: FINANCE_CATEGORY_COLORS[cat] ?? accent,
        }} />
        <span style={{ fontSize: "12px", color: "var(--text-body)", fontFamily: "var(--font-sans)" }}>
          {cat}
        </span>
      </div>
      <span style={{
        fontSize: "12px", fontWeight: 600, color: "var(--text-default)",
        fontFamily: "var(--font-sans)", fontVariantNumeric: "tabular-nums",
      }}>
        {fmtBRL(value)}{suffix}
      </span>
    </div>
  );
}

// ─── 3) Tendência ────────────────────────────────────────────────────────────

function TrendCard({
  analysis, trend,
}: {
  analysis: { expenses: number[]; ma: number[]; trendDirection: "up" | "down" | "flat"; trendPct: number; last: number; prevAvg: number } | null;
  trend: MonthlyTrend[];
}) {
  const dirColor =
    analysis?.trendDirection === "up" ? "var(--negative)" :
    analysis?.trendDirection === "down" ? "var(--positive)" :
    "var(--text-muted)";
  const dirIcon =
    analysis?.trendDirection === "up" ? <ArrowUp size={11} /> :
    analysis?.trendDirection === "down" ? <ArrowDown size={11} /> :
    <Activity size={11} />;
  const dirLabel =
    analysis?.trendDirection === "up" ? "Subindo" :
    analysis?.trendDirection === "down" ? "Descendo" :
    "Estável";

  return (
    <CardShell
      icon={<TrendingUp size={16} />}
      badge="Análise"
      badgeColor="#4F8A82"
      title="Tendência de gastos"
      description="Linha de tendência com média móvel de 3 meses sobre a evolução dos gastos."
    >
      {!analysis || trend.length < 2 ? (
        <EmptyInline message="Precisamos de pelo menos 2 meses pra calcular tendência." />
      ) : (
        <>
          {/* Mini chart com gastos + média móvel */}
          <TrendSparkline expenses={analysis.expenses} ma={analysis.ma} />
          {/* Stats */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "14px", paddingTop: "12px", borderTop: "1px solid var(--border-faint)", alignItems: "center" }}>
            <Stat label="Último mês" value={fmtBRL(analysis.last)} />
            <Stat label="Média móvel" value={fmtBRL(analysis.prevAvg)} />
            <div style={{ display: "flex", flexDirection: "column", gap: "3px", alignItems: "flex-end" }}>
              <span style={{ fontSize: "9px", fontWeight: 600, color: "var(--text-faint)", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "var(--font-sans)" }}>
                Direção
              </span>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: "3px",
                fontSize: "11px", fontWeight: 700, color: dirColor,
                fontFamily: "var(--font-sans)", fontVariantNumeric: "tabular-nums",
                padding: "3px 8px",
                background: `${dirColor === "var(--negative)" ? "rgba(248,113,113,0.1)" : dirColor === "var(--positive)" ? "rgba(52,211,153,0.1)" : "rgba(154,138,106,0.1)"}`,
                borderRadius: "5px",
              }}>
                {dirIcon} {dirLabel} {fmtPct(analysis.trendPct)}
              </span>
            </div>
          </div>
        </>
      )}
    </CardShell>
  );
}

function TrendSparkline({ expenses, ma }: { expenses: number[]; ma: number[] }) {
  const w = 100, h = 60;
  const max = Math.max(...expenses, ...ma) || 1;
  const step = expenses.length > 1 ? w / (expenses.length - 1) : 0;
  const pts = expenses.map((v, i) => `${(i * step).toFixed(2)},${(h - (v / max) * (h - 4) - 2).toFixed(2)}`).join(" ");
  const maPts = ma.map((v, i) => `${(i * step).toFixed(2)},${(h - (v / max) * (h - 4) - 2).toFixed(2)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: "100%", height: "60px", marginTop: "8px", display: "block" }}>
      <defs>
        <linearGradient id="aurum-trend-area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#C9A84C" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#C9A84C" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${h} ${pts} ${(expenses.length - 1) * step},${h}`}
        fill="url(#aurum-trend-area)"
      />
      <polyline points={pts} fill="none" stroke="#C9A84C" strokeWidth={1.4} vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={maPts} fill="none" stroke="#E8C96A" strokeWidth={1} strokeDasharray="3,3" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
    </svg>
  );
}

// ─── 4) Anomalias ────────────────────────────────────────────────────────────

function AnomaliesCard({
  anomalies,
}: {
  anomalies: { items: { month: string; expense: number; deviationPct: number }[]; mean: number; stdDev: number; threshold: number };
}) {
  return (
    <CardShell
      icon={<AlertTriangle size={16} />}
      badge="Alertas"
      badgeColor="#C58A3D"
      title="Anomalias e picos"
      description="Meses com gastos significativamente acima da média (> 1.5 desvio padrão)."
    >
      {anomalies.items.length === 0 ? (
        <div style={{
          marginTop: "4px", padding: "12px 14px",
          background: "rgba(52,211,153,0.08)",
          border: "1px solid rgba(52,211,153,0.2)",
          borderRadius: "8px",
          display: "flex", alignItems: "center", gap: "10px",
        }}>
          <div style={{
            width: "26px", height: "26px", borderRadius: "50%",
            background: "rgba(52,211,153,0.18)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Activity size={13} style={{ color: "var(--positive)" }} />
          </div>
          <div>
            <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--positive)", fontFamily: "var(--font-sans)" }}>
              Sem picos atípicos detectados
            </p>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>
              {anomalies.mean > 0 ? `Média: ${fmtBRL(anomalies.mean)}/mês` : "Adicione mais transações pra ativar a detecção"}
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
          {anomalies.items.slice(0, 3).map((a) => (
            <div key={a.month} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 12px",
              background: "rgba(248,113,113,0.06)",
              border: "1px solid rgba(248,113,113,0.18)",
              borderRadius: "8px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                  width: "28px", height: "28px", borderRadius: "7px",
                  background: "rgba(248,113,113,0.16)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <AlertTriangle size={13} style={{ color: "var(--negative)" }} />
                </div>
                <div>
                  <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-default)", fontFamily: "var(--font-sans)" }}>
                    {a.month}
                  </p>
                  <p style={{ fontSize: "10px", color: "var(--text-faint)", fontFamily: "var(--font-sans)" }}>
                    {fmtPct(a.deviationPct)} acima da média
                  </p>
                </div>
              </div>
              <span style={{
                fontSize: "12px", fontWeight: 700, color: "var(--negative)",
                fontFamily: "var(--font-sans)", fontVariantNumeric: "tabular-nums",
              }}>
                {fmtBRL(a.expense)}
              </span>
            </div>
          ))}
          <p style={{ fontSize: "10px", color: "var(--text-faint)", fontFamily: "var(--font-sans)", marginTop: "4px" }}>
            Média do período: {fmtBRL(anomalies.mean)} · Threshold: {fmtBRL(anomalies.threshold)}
          </p>
        </div>
      )}
    </CardShell>
  );
}

// ─── 5) Insights ─────────────────────────────────────────────────────────────

function InsightsCard({
  insights,
}: { insights: { kind: "info" | "warn" | "good"; text: string }[] }) {
  const kindMeta = {
    info: { bg: "rgba(94,107,140,0.1)", border: "rgba(94,107,140,0.3)", color: "#7B8BAD" },
    warn: { bg: "rgba(197,138,61,0.1)", border: "rgba(197,138,61,0.3)", color: "#C58A3D" },
    good: { bg: "rgba(52,211,153,0.08)", border: "rgba(52,211,153,0.25)", color: "var(--positive)" },
  };

  return (
    <CardShell
      icon={<Lightbulb size={16} />}
      badge="Heurísticas"
      badgeColor="#8B5470"
      title="Insights automáticos"
      description="Observações geradas a partir do comportamento dos seus gastos."
    >
      {insights.length === 0 ? (
        <EmptyInline message="Cadastre mais transações pra desbloquear insights personalizados." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
          {insights.map((ins, i) => {
            const meta = kindMeta[ins.kind];
            return (
              <div key={i} style={{
                padding: "10px 12px",
                background: meta.bg,
                border: `1px solid ${meta.border}`,
                borderRadius: "8px",
                display: "flex", gap: "10px",
              }}>
                <span style={{
                  width: "5px", borderRadius: "3px",
                  background: meta.color,
                  flexShrink: 0,
                  alignSelf: "stretch",
                }} />
                <p style={{
                  fontSize: "12px", color: "var(--text-body)",
                  fontFamily: "var(--font-sans)", lineHeight: 1.5,
                }}>
                  {ins.text}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </CardShell>
  );
}

// ─── 6) Comparação mes/mes + ano/ano ─────────────────────────────────────────

function ComparisonCard({
  comparison,
}: {
  comparison: {
    last: MonthlyTrend;
    prev: MonthlyTrend;
    yearAgo: MonthlyTrend | null;
    mom: { expense: { abs: number; pct: number }; income: { abs: number; pct: number } };
    yoy: { expense: { abs: number; pct: number }; income: { abs: number; pct: number } } | null;
  } | null;
}) {
  return (
    <CardShell
      icon={<CalendarRange size={16} />}
      badge="Comparação"
      badgeColor="#6E8C4A"
      title="Mês a mês / Ano a ano"
      description="Variação dos gastos e entradas entre períodos equivalentes."
    >
      {!comparison ? (
        <EmptyInline message="Precisamos de pelo menos 2 meses pra comparar." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "4px" }}>
          {/* Mês a mês */}
          <ComparisonRow
            label="Mês a mês"
            sublabel={`${comparison.last.month} vs ${comparison.prev.month}`}
            expense={comparison.mom.expense}
            income={comparison.mom.income}
          />
          {/* Ano a ano */}
          {comparison.yoy && comparison.yearAgo ? (
            <ComparisonRow
              label="Ano a ano"
              sublabel={`${comparison.last.month} vs ${comparison.yearAgo.month}`}
              expense={comparison.yoy.expense}
              income={comparison.yoy.income}
            />
          ) : (
            <div style={{
              padding: "10px 12px",
              background: "rgba(154,138,106,0.05)",
              border: "1px dashed var(--border-faint)",
              borderRadius: "8px",
              fontSize: "11px", color: "var(--text-faint)",
              fontFamily: "var(--font-sans)",
            }}>
              Ano a ano disponível com 13+ meses de histórico (selecione &quot;Tudo&quot; ou aguarde acumular dados).
            </div>
          )}
        </div>
      )}
    </CardShell>
  );
}

function ComparisonRow({
  label, sublabel, expense, income,
}: {
  label: string;
  sublabel: string;
  expense: { abs: number; pct: number };
  income: { abs: number; pct: number };
}) {
  return (
    <div style={{
      padding: "12px 14px",
      background: "var(--bg-input)",
      border: "1px solid var(--border-faint)",
      borderRadius: "10px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "10px" }}>
        <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-default)", fontFamily: "var(--font-sans)" }}>
          {label}
        </p>
        <p style={{ fontSize: "10px", color: "var(--text-faint)", fontFamily: "var(--font-sans)" }}>
          {sublabel}
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <DiffStat label="Gastos" diff={expense} invert />
        <DiffStat label="Entradas" diff={income} />
      </div>
    </div>
  );
}

function DiffStat({
  label, diff, invert,
}: {
  label: string;
  diff: { abs: number; pct: number };
  invert?: boolean;
}) {
  // invert=true → gastar mais é ruim (vermelho), menos é bom (verde).
  // invert=false (entradas) → ganhar mais é bom (verde), menos é ruim (vermelho).
  const positive = invert ? diff.abs < 0 : diff.abs > 0;
  const neutral = diff.abs === 0;
  const color = neutral ? "var(--text-muted)" : positive ? "var(--positive)" : "var(--negative)";
  const Icon = neutral ? Activity : diff.abs > 0 ? ArrowUp : ArrowDown;

  return (
    <div>
      <p style={{ fontSize: "9px", fontWeight: 600, color: "var(--text-faint)", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "var(--font-sans)", marginBottom: "4px" }}>
        {label}
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <Icon size={11} style={{ color }} />
        <span style={{
          fontSize: "13px", fontWeight: 700, color,
          fontFamily: "var(--font-sans)", fontVariantNumeric: "tabular-nums",
        }}>
          {fmtPct(diff.pct)}
        </span>
      </div>
      <p style={{ fontSize: "10px", color: "var(--text-faint)", fontFamily: "var(--font-sans)", fontVariantNumeric: "tabular-nums", marginTop: "2px" }}>
        {diff.abs >= 0 ? "+" : ""}{fmtBRL(diff.abs)}
      </p>
    </div>
  );
}

// ─── 7) Export cards (PDF + CSV) ─────────────────────────────────────────────

function ExportCard({
  icon, badge, badgeColor, title, description, onClick, actionLabel,
}: {
  icon: React.ReactNode;
  badge: string;
  badgeColor: string;
  title: string;
  description: string;
  onClick: () => void;
  actionLabel: string;
}) {
  return (
    <CardShell icon={icon} badge={badge} badgeColor={badgeColor} title={title} description={description}>
      <button
        onClick={onClick}
        className="aurum-export-btn aurum-hover-transition"
        style={{
          marginTop: "auto",
          background: "linear-gradient(135deg, rgba(201,168,76,0.18), rgba(201,168,76,0.06))",
          border: "1px solid var(--border-emphasis)",
          color: "var(--gold-light)",
          fontSize: "12px", fontWeight: 700,
          fontFamily: "var(--font-sans)",
          padding: "10px 16px", borderRadius: "8px",
          cursor: "pointer", letterSpacing: "0.04em",
          alignSelf: "flex-start",
          display: "inline-flex", alignItems: "center", gap: "6px",
        }}
      >
        {actionLabel}
      </button>
    </CardShell>
  );
}

// ─── Small helpers ───────────────────────────────────────────────────────────

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: 0 }}>
      <span style={{
        fontSize: "9px", fontWeight: 600, color: "var(--text-faint)",
        fontFamily: "var(--font-sans)", letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}>
        {label}
      </span>
      <span style={{
        fontSize: "12px", fontWeight: 600,
        color: accent ?? "var(--text-default)",
        fontFamily: "var(--font-sans)",
        fontVariantNumeric: "tabular-nums",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {value}
      </span>
    </div>
  );
}

function EmptyInline({ message }: { message: string }) {
  return (
    <p style={{
      fontSize: "12px", color: "var(--text-faint)",
      fontFamily: "var(--font-sans)",
      fontStyle: "italic",
      marginTop: "8px", padding: "12px 0",
      lineHeight: 1.5,
    }}>
      {message}
    </p>
  );
}

