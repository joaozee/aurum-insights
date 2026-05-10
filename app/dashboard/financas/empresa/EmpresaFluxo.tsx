"use client";

import { useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, AlertTriangle } from "lucide-react";
import {
  type FinanceTxRow,
  type ApAr,
  buildRealizedCashFlow,
  buildProjectedCashFlow,
  inferCashCategory,
  fmtBRL,
  fmtBRLShort,
} from "@/lib/empresa-finance";
import { ECard, ESection, EKpi, EPill, E } from "./EmpresaShared";

interface Props {
  transactions: FinanceTxRow[];
  apar: ApAr[];
  cashBalance: number;
}

type View = "realizado" | "projetado" | "categorias";

export default function EmpresaFluxo({ transactions, apar, cashBalance }: Props) {
  const [view, setView] = useState<View>("realizado");
  const [horizon, setHorizon] = useState<30 | 60 | 90>(30);

  const realized = useMemo(
    () => buildRealizedCashFlow(transactions, cashBalance),
    [transactions, cashBalance],
  );
  const projected = useMemo(
    () => buildProjectedCashFlow(apar, cashBalance, horizon),
    [apar, cashBalance, horizon],
  );

  const categoriesBreakdown = useMemo(() => {
    const buckets: Record<"operacional" | "financeiro" | "investimento", { in: number; out: number }> = {
      operacional: { in: 0, out: 0 },
      financeiro: { in: 0, out: 0 },
      investimento: { in: 0, out: 0 },
    };
    for (const t of transactions) {
      const cat = inferCashCategory(t.type, t.category);
      if (t.type === "entrada") buckets[cat].in += Number(t.amount);
      else buckets[cat].out += Number(t.amount);
    }
    return buckets;
  }, [transactions]);

  const negativeAlertDay = projected.find((d) => d.balance < 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Saldo / inflow / outflow */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "12px",
        }}
      >
        <EKpi label="Saldo de caixa" value={fmtBRL(cashBalance)} sub="hoje" tone="gold" />
        <EKpi
          label="Entradas no mês"
          value={fmtBRL(transactions.filter((t) => t.type === "entrada").reduce((s, t) => s + Number(t.amount), 0))}
          tone="positive"
          icon={<ArrowDownLeft size={14} />}
        />
        <EKpi
          label="Saídas no mês"
          value={fmtBRL(transactions.filter((t) => t.type === "saida").reduce((s, t) => s + Number(t.amount), 0))}
          tone="negative"
          icon={<ArrowUpRight size={14} />}
        />
        <EKpi
          label="Saldo final realizado"
          value={fmtBRL(realized[realized.length - 1]?.balance ?? cashBalance)}
          sub={`${realized.length} ${realized.length === 1 ? "movimento" : "movimentos"}`}
          tone={(realized[realized.length - 1]?.balance ?? cashBalance) >= 0 ? "positive" : "negative"}
        />
      </div>

      {/* Alerta de saldo negativo */}
      {negativeAlertDay && view === "projetado" && (
        <div
          style={{
            background: E.redSoft,
            border: "1px solid rgba(248,113,113,0.25)",
            borderRadius: "10px",
            padding: "12px 16px",
            display: "flex",
            gap: "12px",
            alignItems: "flex-start",
          }}
        >
          <AlertTriangle size={16} style={{ color: E.red, marginTop: "1px" }} />
          <div>
            <p style={{ fontSize: "13px", fontWeight: 600, color: E.text, fontFamily: "var(--font-sans)", marginBottom: "2px" }}>
              Caixa fica negativo em {new Date(negativeAlertDay.date + "T00:00:00").toLocaleDateString("pt-BR")}
            </p>
            <p style={{ fontSize: "12px", color: E.textMuted, fontFamily: "var(--font-sans)" }}>
              Saldo previsto: {fmtBRL(negativeAlertDay.balance)}. Antecipe recebimentos ou negocie pagamentos.
            </p>
          </div>
        </div>
      )}

      {/* View switcher */}
      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
        {([
          { id: "realizado", label: "Realizado" },
          { id: "projetado", label: "Projetado" },
          { id: "categorias", label: "Por categoria" },
        ] as const).map((o) => (
          <button
            key={o.id}
            onClick={() => setView(o.id)}
            style={{
              background: view === o.id ? "linear-gradient(135deg,#C9A84C,#A07820)" : "transparent",
              color: view === o.id ? "#0d0b07" : E.textMuted,
              border: view === o.id ? "none" : `1px solid ${E.border}`,
              borderRadius: "6px",
              padding: "6px 14px",
              fontSize: "12px",
              fontWeight: 600,
              fontFamily: "var(--font-sans)",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {o.label}
          </button>
        ))}
        {view === "projetado" && (
          <div style={{ marginLeft: "auto", display: "flex", gap: "4px", background: E.card, border: `1px solid ${E.border}`, borderRadius: "6px", padding: "3px" }}>
            {([30, 60, 90] as const).map((h) => (
              <button
                key={h}
                onClick={() => setHorizon(h)}
                style={{
                  background: horizon === h ? "rgba(201,168,76,0.15)" : "transparent",
                  color: horizon === h ? E.gold : E.textMuted,
                  border: "none",
                  borderRadius: "4px",
                  padding: "5px 12px",
                  fontSize: "11px",
                  fontWeight: 600,
                  fontFamily: "var(--font-sans)",
                  cursor: "pointer",
                }}
              >
                {h} dias
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Realizado */}
      {view === "realizado" && (
        <ECard>
          <ESection title="Movimentações realizadas" subtitle={`${realized.length} dias com movimento`}>
            {realized.length === 0 ? (
              <p style={{ fontSize: "13px", color: E.textMuted, fontFamily: "var(--font-sans)", padding: "20px 0", textAlign: "center" }}>
                Sem transações no período.
              </p>
            ) : (
              <CashTable rows={realized} />
            )}
          </ESection>
        </ECard>
      )}

      {/* Projetado */}
      {view === "projetado" && (
        <ECard>
          <ESection
            title={`Projeção ${horizon} dias`}
            subtitle="Combina contas a pagar e receber em aberto"
          >
            {projected.length === 0 ? (
              <p style={{ fontSize: "13px", color: E.textMuted, fontFamily: "var(--font-sans)", padding: "20px 0", textAlign: "center" }}>
                Sem contas em aberto no horizonte selecionado.
              </p>
            ) : (
              <CashTable rows={projected} />
            )}
          </ESection>
        </ECard>
      )}

      {/* Categorias */}
      {view === "categorias" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "12px",
          }}
        >
          {(["operacional", "financeiro", "investimento"] as const).map((k) => {
            const b = categoriesBreakdown[k];
            const net = b.in - b.out;
            return (
              <ECard key={k}>
                <p
                  style={{
                    fontSize: "10px",
                    fontWeight: 600,
                    color: E.textMuted,
                    fontFamily: "var(--font-sans)",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    marginBottom: "12px",
                  }}
                >
                  {k}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <Row label="Entradas" value={fmtBRL(b.in)} tone="positive" />
                  <Row label="Saídas" value={fmtBRL(b.out)} tone="negative" />
                  <div style={{ height: 1, background: E.border, margin: "6px 0" }} />
                  <Row label="Líquido" value={fmtBRL(net)} tone={net >= 0 ? "gold" : "negative"} bold />
                </div>
              </ECard>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, tone, bold }: { label: string; value: string; tone: "positive" | "negative" | "gold"; bold?: boolean }) {
  const color = tone === "positive" ? E.green : tone === "negative" ? E.red : E.gold;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
      <span style={{ fontSize: "12px", color: E.textMuted, fontFamily: "var(--font-sans)" }}>{label}</span>
      <span
        style={{
          fontSize: bold ? "16px" : "13px",
          fontWeight: bold ? 700 : 500,
          color,
          fontFamily: "var(--font-sans)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function CashTable({
  rows,
}: {
  rows: { date: string; in: number; out: number; net: number; balance: number }[];
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 120px 120px 120px 140px",
          gap: "12px",
          padding: "8px 14px",
          borderBottom: `1px solid ${E.border}`,
          fontSize: "10px",
          fontWeight: 600,
          color: E.textMuted,
          fontFamily: "var(--font-sans)",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        <span>Data</span>
        <span style={{ textAlign: "right" }}>Entradas</span>
        <span style={{ textAlign: "right" }}>Saídas</span>
        <span style={{ textAlign: "right" }}>Líquido</span>
        <span style={{ textAlign: "right" }}>Saldo</span>
      </div>
      {rows.map((r, i) => (
        <div
          key={r.date + i}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 120px 120px 120px 140px",
            gap: "12px",
            padding: "10px 14px",
            borderBottom: i < rows.length - 1 ? `1px solid rgba(201,168,76,0.05)` : "none",
            fontSize: "12px",
            fontFamily: "var(--font-sans)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          <span style={{ color: E.text }}>
            {new Date(r.date + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
          </span>
          <span style={{ textAlign: "right", color: r.in > 0 ? E.green : E.textFaint }}>
            {r.in > 0 ? fmtBRLShort(r.in) : "—"}
          </span>
          <span style={{ textAlign: "right", color: r.out > 0 ? E.red : E.textFaint }}>
            {r.out > 0 ? fmtBRLShort(r.out) : "—"}
          </span>
          <span style={{ textAlign: "right", color: r.net >= 0 ? E.green : E.red, fontWeight: 600 }}>
            {fmtBRLShort(r.net)}
          </span>
          <span
            style={{
              textAlign: "right",
              color: r.balance >= 0 ? E.text : E.red,
              fontWeight: 700,
            }}
          >
            <EPill tone={r.balance >= 0 ? "gold" : "negative"}>{fmtBRLShort(r.balance)}</EPill>
          </span>
        </div>
      ))}
    </div>
  );
}
