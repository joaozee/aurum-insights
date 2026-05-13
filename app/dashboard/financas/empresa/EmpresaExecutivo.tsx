"use client";

import { useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Activity,
} from "lucide-react";
import {
  type FinanceTxRow,
  type ApAr,
  computeDre,
  fmtBRL,
  fmtBRLShort,
} from "@/lib/empresa-finance";
import { ECard, ESection, EKpi, EPill, ETrendBars, E } from "./EmpresaShared";

interface Props {
  transactionsThisMonth: FinanceTxRow[];
  transactionsLastMonth: FinanceTxRow[];
  transactionsLast12m: FinanceTxRow[];
  apar: ApAr[];
  cashBalance: number;
  /** Origem do saldo de caixa exibido — afeta o hint no card pra deixar claro
   *  se o valor veio do Balanço cadastrado manualmente ou do acumulado de
   *  transações lançadas. */
  cashSource?: "balance" | "transactions" | "empty";
}

export default function EmpresaExecutivo({
  transactionsThisMonth,
  transactionsLastMonth,
  transactionsLast12m,
  apar,
  cashBalance,
  cashSource = "empty",
}: Props) {
  const dreNow = useMemo(() => computeDre(transactionsThisMonth), [transactionsThisMonth]);
  const drePrev = useMemo(() => computeDre(transactionsLastMonth), [transactionsLastMonth]);

  // Tendência mensal: receita / despesa / lucro
  const trend12m = useMemo(() => {
    const map = new Map<string, FinanceTxRow[]>();
    for (const t of transactionsLast12m) {
      const key = t.transaction_date.slice(0, 7);
      const arr = map.get(key) ?? [];
      arr.push(t);
      map.set(key, arr);
    }
    const today = new Date();
    const months: { label: string; receita: number; despesa: number; lucro: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const txs = map.get(key) ?? [];
      const dre = computeDre(txs);
      months.push({
        label: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
        receita: dre.receita_bruta.total,
        despesa: dre.cmv.total + dre.despesa_operacional.total + dre.deducao.total,
        lucro: dre.lucro_liquido,
      });
    }
    return months;
  }, [transactionsLast12m]);

  // Contas vencidas
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueReceivables = apar.filter(
    (r) => r.kind === "receber" && r.status !== "pago" && r.status !== "cancelado" && new Date(r.due_date) < today,
  );
  const overduePayables = apar.filter(
    (r) => r.kind === "pagar" && r.status !== "pago" && r.status !== "cancelado" && new Date(r.due_date) < today,
  );
  const overdueReceivablesTotal = overdueReceivables.reduce((s, r) => s + Number(r.amount), 0);
  const overduePayablesTotal = overduePayables.reduce((s, r) => s + Number(r.amount), 0);

  // Projecao de caixa em 30 dias
  const in30 = new Date(today);
  in30.setDate(in30.getDate() + 30);
  const next30Inflow = apar
    .filter(
      (r) =>
        r.kind === "receber" &&
        r.status !== "pago" &&
        r.status !== "cancelado" &&
        new Date(r.due_date) >= today &&
        new Date(r.due_date) <= in30,
    )
    .reduce((s, r) => s + Number(r.amount), 0);
  const next30Outflow = apar
    .filter(
      (r) =>
        r.kind === "pagar" &&
        r.status !== "pago" &&
        r.status !== "cancelado" &&
        new Date(r.due_date) >= today &&
        new Date(r.due_date) <= in30,
    )
    .reduce((s, r) => s + Number(r.amount), 0);
  const projected30 = cashBalance + next30Inflow - next30Outflow;

  const receitaDelta =
    drePrev.receita_bruta.total > 0
      ? ((dreNow.receita_bruta.total - drePrev.receita_bruta.total) / drePrev.receita_bruta.total) * 100
      : null;

  // Semaforo de alertas
  const alerts: { tone: "negative" | "warning" | "positive"; label: string; hint?: string }[] = [];
  if (projected30 < 0) {
    alerts.push({
      tone: "negative",
      label: "Caixa projetado negativo em 30 dias",
      hint: `Faltam ${fmtBRL(Math.abs(projected30))} se as contas previstas se confirmarem.`,
    });
  }
  if (overduePayablesTotal > 0) {
    alerts.push({
      tone: "negative",
      label: `${overduePayables.length} ${overduePayables.length === 1 ? "conta vencida" : "contas vencidas"} a pagar`,
      hint: fmtBRL(overduePayablesTotal),
    });
  }
  if (overdueReceivablesTotal > 0) {
    alerts.push({
      tone: "warning",
      label: `${overdueReceivables.length} ${overdueReceivables.length === 1 ? "recebimento atrasado" : "recebimentos atrasados"}`,
      hint: fmtBRL(overdueReceivablesTotal),
    });
  }
  if (dreNow.ebitda < 0) {
    alerts.push({
      tone: "warning",
      label: "EBITDA negativo no mês",
      hint: "Despesas operacionais maiores que a margem bruta.",
    });
  }
  if (alerts.length === 0) {
    alerts.push({
      tone: "positive",
      label: "Operação saudável",
      hint: "Sem alertas críticos no período.",
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* KPIs principais */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "12px",
        }}
      >
        <EKpi
          label="Receita do mês"
          value={fmtBRL(dreNow.receita_bruta.total)}
          sub={
            receitaDelta == null
              ? "sem comparativo"
              : `${receitaDelta >= 0 ? "+" : ""}${receitaDelta.toFixed(1)}% vs. mês anterior`
          }
          tone={receitaDelta == null ? "neutral" : receitaDelta >= 0 ? "positive" : "negative"}
          icon={<TrendingUp size={14} />}
        />
        <EKpi
          label="Margem Bruta"
          value={`${dreNow.margem_bruta_pct.toFixed(1)}%`}
          sub={fmtBRL(dreNow.margem_bruta)}
          tone={dreNow.margem_bruta >= 0 ? "gold" : "negative"}
          icon={<Activity size={14} />}
        />
        <EKpi
          label="EBITDA"
          value={fmtBRL(dreNow.ebitda)}
          sub={`${dreNow.ebitda_pct.toFixed(1)}% da receita líquida`}
          tone={dreNow.ebitda >= 0 ? "positive" : "negative"}
          icon={<DollarSign size={14} />}
        />
        <EKpi
          label="Lucro Líquido"
          value={fmtBRL(dreNow.lucro_liquido)}
          sub={`${dreNow.lucro_liquido_pct.toFixed(1)}% da receita líquida`}
          tone={dreNow.lucro_liquido >= 0 ? "positive" : "negative"}
          icon={dreNow.lucro_liquido >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        />
      </div>

      {/* Caixa */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "12px",
        }}
      >
        <EKpi
          label="Saldo de caixa"
          value={fmtBRL(cashBalance)}
          sub={
            cashSource === "balance"
              ? "Balanço · hoje"
              : cashSource === "transactions"
                ? "Calculado das transações"
                : "Sem dados — lance transações"
          }
          tone="gold"
          icon={<Wallet size={14} />}
        />
        <EKpi
          label="Projeção 30 dias"
          value={fmtBRL(projected30)}
          sub={`+${fmtBRLShort(next30Inflow)} / −${fmtBRLShort(next30Outflow)}`}
          tone={projected30 >= 0 ? "positive" : "negative"}
        />
        <EKpi
          label="Contas a pagar vencidas"
          value={fmtBRL(overduePayablesTotal)}
          sub={`${overduePayables.length} ${overduePayables.length === 1 ? "conta" : "contas"}`}
          tone={overduePayablesTotal > 0 ? "negative" : "neutral"}
          icon={<AlertCircle size={14} />}
        />
        <EKpi
          label="Recebimentos atrasados"
          value={fmtBRL(overdueReceivablesTotal)}
          sub={`${overdueReceivables.length} ${overdueReceivables.length === 1 ? "cliente" : "clientes"}`}
          tone={overdueReceivablesTotal > 0 ? "warning" : "neutral"}
        />
      </div>

      {/* Tendência 12m + Alertas */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gap: "16px",
        }}
      >
        <ECard>
          <ESection title="Tendência 12 meses" subtitle="Receita, despesa e lucro líquido">
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: "4px",
                  }}
                >
                  <span style={{ fontSize: "10px", color: E.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "var(--font-sans)" }}>
                    Receita
                  </span>
                  <span style={{ fontSize: "12px", color: E.text, fontVariantNumeric: "tabular-nums", fontFamily: "var(--font-sans)" }}>
                    {fmtBRLShort(trend12m.reduce((s, m) => s + m.receita, 0))}
                  </span>
                </div>
                <ETrendBars
                  data={trend12m.map((m) => ({ label: m.label, value: m.receita }))}
                  height={70}
                  format={fmtBRL}
                />
              </div>
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: "4px",
                  }}
                >
                  <span style={{ fontSize: "10px", color: E.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "var(--font-sans)" }}>
                    Despesa
                  </span>
                  <span style={{ fontSize: "12px", color: E.text, fontVariantNumeric: "tabular-nums", fontFamily: "var(--font-sans)" }}>
                    {fmtBRLShort(trend12m.reduce((s, m) => s + m.despesa, 0))}
                  </span>
                </div>
                <ETrendBars
                  data={trend12m.map((m) => ({ label: m.label, value: m.despesa }))}
                  height={70}
                  format={fmtBRL}
                />
              </div>
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: "4px",
                  }}
                >
                  <span style={{ fontSize: "10px", color: E.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "var(--font-sans)" }}>
                    Lucro líquido
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      color: trend12m[trend12m.length - 1]?.lucro >= 0 ? E.green : E.red,
                      fontVariantNumeric: "tabular-nums",
                      fontFamily: "var(--font-sans)",
                    }}
                  >
                    {fmtBRLShort(trend12m.reduce((s, m) => s + m.lucro, 0))}
                  </span>
                </div>
                <ETrendBars
                  data={trend12m.map((m) => ({ label: m.label, value: m.lucro }))}
                  height={70}
                  format={fmtBRL}
                />
              </div>
            </div>
          </ESection>
        </ECard>

        <ECard>
          <ESection title="Semáforo" subtitle="Status operacional">
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {alerts.map((a, i) => {
                const icon =
                  a.tone === "negative" ? (
                    <AlertCircle size={14} />
                  ) : a.tone === "warning" ? (
                    <AlertTriangle size={14} />
                  ) : (
                    <CheckCircle2 size={14} />
                  );
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignItems: "flex-start",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      background:
                        a.tone === "negative"
                          ? E.redSoft
                          : a.tone === "warning"
                          ? E.amberSoft
                          : E.greenSoft,
                      border: `1px solid ${
                        a.tone === "negative"
                          ? "rgba(248,113,113,0.2)"
                          : a.tone === "warning"
                          ? "rgba(245,158,11,0.2)"
                          : "rgba(52,211,153,0.2)"
                      }`,
                    }}
                  >
                    <div
                      style={{
                        color:
                          a.tone === "negative"
                            ? E.red
                            : a.tone === "warning"
                            ? E.amber
                            : E.green,
                        marginTop: "1px",
                      }}
                    >
                      {icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: E.text,
                          fontFamily: "var(--font-sans)",
                          marginBottom: a.hint ? "2px" : 0,
                        }}
                      >
                        {a.label}
                      </p>
                      {a.hint && (
                        <p
                          style={{
                            fontSize: "11px",
                            color: E.textMuted,
                            fontFamily: "var(--font-sans)",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {a.hint}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ESection>
        </ECard>
      </div>

      {/* Resumo do mes vs anterior */}
      <ECard>
        <ESection
          title="Resumo do mês"
          subtitle="Comparação com o mês anterior"
          right={<EPill tone={dreNow.lucro_liquido >= 0 ? "positive" : "negative"}>
            {dreNow.lucro_liquido >= 0 ? "Lucro" : "Prejuízo"}
          </EPill>}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "16px",
            }}
          >
            {[
              {
                label: "Receita Líquida",
                now: dreNow.receita_liquida,
                prev: drePrev.receita_liquida,
              },
              { label: "Margem Bruta", now: dreNow.margem_bruta, prev: drePrev.margem_bruta },
              { label: "EBITDA", now: dreNow.ebitda, prev: drePrev.ebitda },
            ].map((r) => {
              const delta = r.prev !== 0 ? ((r.now - r.prev) / Math.abs(r.prev)) * 100 : null;
              return (
                <div key={r.label}>
                  <p
                    style={{
                      fontSize: "11px",
                      color: E.textMuted,
                      fontFamily: "var(--font-sans)",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      marginBottom: "6px",
                    }}
                  >
                    {r.label}
                  </p>
                  <p
                    style={{
                      fontSize: "20px",
                      fontWeight: 700,
                      color: E.text,
                      fontFamily: "var(--font-sans)",
                      fontVariantNumeric: "tabular-nums",
                      marginBottom: "4px",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {fmtBRL(r.now)}
                  </p>
                  <p
                    style={{
                      fontSize: "11px",
                      color: delta == null ? E.textFaint : delta >= 0 ? E.green : E.red,
                      fontFamily: "var(--font-sans)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {delta == null
                      ? "sem dados"
                      : `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}% vs. anterior`}
                  </p>
                </div>
              );
            })}
          </div>
        </ESection>
      </ECard>
    </div>
  );
}
