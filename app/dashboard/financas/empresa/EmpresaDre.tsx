"use client";

import { useMemo, useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import {
  type FinanceTxRow,
  type Period,
  type DreLineSummary,
  computeDre,
  fmtBRL,
  periodRange,
} from "@/lib/empresa-finance";
import { ECard, ESection, E, EPill } from "./EmpresaShared";

interface Props {
  transactionsCurrent: FinanceTxRow[];
  transactionsPrev: FinanceTxRow[];
  period: Period;
  onPeriodChange: (p: Period) => void;
}

const PERIOD_OPTIONS: { id: Period; label: string }[] = [
  { id: "mes", label: "Mês" },
  { id: "trimestre", label: "Trimestre" },
  { id: "ano", label: "Ano" },
  { id: "12m", label: "12 meses" },
];

export default function EmpresaDre({
  transactionsCurrent,
  transactionsPrev,
  period,
  onPeriodChange,
}: Props) {
  const dre = useMemo(() => computeDre(transactionsCurrent), [transactionsCurrent]);
  const drePrev = useMemo(() => computeDre(transactionsPrev), [transactionsPrev]);
  const range = periodRange(period);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <ECard>
        <ESection
          title="Demonstrativo de Resultado do Exercício"
          subtitle={range.label}
          right={
            <div
              style={{
                display: "flex",
                gap: "2px",
                background: E.cardSoft,
                border: `1px solid ${E.border}`,
                borderRadius: "6px",
                padding: "3px",
              }}
            >
              {PERIOD_OPTIONS.map((o) => (
                <button
                  key={o.id}
                  onClick={() => onPeriodChange(o.id)}
                  style={{
                    background: period === o.id ? "rgba(201,168,76,0.15)" : "transparent",
                    border: "none",
                    color: period === o.id ? E.gold : E.textMuted,
                    padding: "5px 12px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontWeight: 600,
                    fontFamily: "var(--font-sans)",
                    cursor: "pointer",
                    transition: "color 0.15s, background 0.15s",
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
            <DreRow
              label="(+) Receita Bruta"
              value={dre.receita_bruta.total}
              prev={drePrev.receita_bruta.total}
              level={0}
              detail={dre.receita_bruta}
            />
            <DreRow
              label="(−) Deduções e Impostos sobre Venda"
              value={-dre.deducao.total}
              prev={-drePrev.deducao.total}
              level={1}
              detail={dre.deducao}
            />
            <DreRow
              label="(=) Receita Líquida"
              value={dre.receita_liquida}
              prev={drePrev.receita_liquida}
              level={0}
              emphasis="subtotal"
            />
            <DreRow
              label="(−) CMV / CPV"
              value={-dre.cmv.total}
              prev={-drePrev.cmv.total}
              level={1}
              detail={dre.cmv}
            />
            <DreRow
              label="(=) Margem Bruta"
              value={dre.margem_bruta}
              prev={drePrev.margem_bruta}
              level={0}
              emphasis="subtotal"
              pctOf={dre.receita_liquida}
            />
            <DreRow
              label="(−) Despesas Operacionais"
              value={-dre.despesa_operacional.total}
              prev={-drePrev.despesa_operacional.total}
              level={1}
              detail={dre.despesa_operacional}
            />
            <DreRow
              label="(=) EBITDA"
              value={dre.ebitda}
              prev={drePrev.ebitda}
              level={0}
              emphasis="subtotal"
              pctOf={dre.receita_liquida}
            />
            <DreRow
              label="(−) Depreciação e Amortização"
              value={-dre.depreciacao.total}
              prev={-drePrev.depreciacao.total}
              level={1}
              detail={dre.depreciacao}
            />
            <DreRow
              label={`(${dre.resultado_financeiro.total >= 0 ? "+" : "−"}) Resultado Financeiro`}
              value={dre.resultado_financeiro.total}
              prev={drePrev.resultado_financeiro.total}
              level={1}
              detail={dre.resultado_financeiro}
            />
            <DreRow
              label="(−) IR / CSLL"
              value={-dre.imposto_renda.total}
              prev={-drePrev.imposto_renda.total}
              level={1}
              detail={dre.imposto_renda}
            />
            <DreRow
              label="(=) Lucro Líquido"
              value={dre.lucro_liquido}
              prev={drePrev.lucro_liquido}
              level={0}
              emphasis="total"
              pctOf={dre.receita_liquida}
            />
          </div>
        </ESection>
      </ECard>

      <ECard>
        <ESection
          title="Margens consolidadas"
          subtitle="Indicadores de rentabilidade do período"
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "16px",
            }}
          >
            <MarginCell label="Margem Bruta" pct={dre.margem_bruta_pct} />
            <MarginCell label="Margem EBITDA" pct={dre.ebitda_pct} />
            <MarginCell label="Margem Líquida" pct={dre.lucro_liquido_pct} />
          </div>
        </ESection>
      </ECard>
    </div>
  );
}

function DreRow({
  label,
  value,
  prev,
  level,
  emphasis,
  detail,
  pctOf,
}: {
  label: string;
  value: number;
  prev: number;
  level: 0 | 1;
  emphasis?: "subtotal" | "total";
  detail?: DreLineSummary;
  pctOf?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasDetail = detail && detail.byCategory.length > 0;
  const positive = value >= 0;
  const delta = prev !== 0 ? ((value - prev) / Math.abs(prev)) * 100 : null;
  const pct = pctOf && pctOf > 0 ? (value / pctOf) * 100 : null;

  return (
    <>
      <div
        onClick={() => hasDetail && setExpanded((v) => !v)}
        role={hasDetail ? "button" : undefined}
        tabIndex={hasDetail ? 0 : -1}
        onKeyDown={(e) => {
          if (hasDetail && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            setExpanded((v) => !v);
          }
        }}
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 140px 100px 80px",
          gap: "12px",
          alignItems: "center",
          padding: "12px 14px",
          paddingLeft: level === 1 ? "32px" : "14px",
          background:
            emphasis === "total"
              ? "rgba(201,168,76,0.08)"
              : emphasis === "subtotal"
              ? "rgba(201,168,76,0.04)"
              : "transparent",
          borderTop: level === 0 && !emphasis ? `1px solid ${E.border}` : "none",
          borderRadius:
            emphasis === "total" ? "8px" : emphasis === "subtotal" ? "6px" : 0,
          cursor: hasDetail ? "pointer" : "default",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => {
          if (hasDetail && !emphasis)
            (e.currentTarget as HTMLDivElement).style.background = "rgba(201,168,76,0.04)";
        }}
        onMouseLeave={(e) => {
          if (hasDetail && !emphasis) (e.currentTarget as HTMLDivElement).style.background = "transparent";
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
          {hasDetail ? (
            expanded ? (
              <ChevronDown size={12} style={{ color: E.textMuted }} />
            ) : (
              <ChevronRight size={12} style={{ color: E.textMuted }} />
            )
          ) : (
            <span style={{ width: 12 }} />
          )}
          <span
            style={{
              fontSize: emphasis ? "13px" : "12px",
              fontWeight: emphasis ? 700 : 500,
              color: emphasis === "total" ? E.gold : E.text,
              fontFamily: "var(--font-sans)",
            }}
          >
            {label}
          </span>
        </div>
        <span
          style={{
            fontSize: emphasis ? "14px" : "13px",
            fontWeight: emphasis ? 700 : 500,
            color: emphasis === "total" ? E.gold : value === 0 ? E.textFaint : positive ? E.text : E.red,
            fontFamily: "var(--font-sans)",
            fontVariantNumeric: "tabular-nums",
            textAlign: "right",
            letterSpacing: "-0.005em",
          }}
        >
          {fmtBRL(value)}
        </span>
        <span
          style={{
            fontSize: "11px",
            color: pct == null ? "transparent" : E.textMuted,
            fontFamily: "var(--font-sans)",
            fontVariantNumeric: "tabular-nums",
            textAlign: "right",
          }}
        >
          {pct != null ? `${pct.toFixed(1)}%` : "—"}
        </span>
        <span
          style={{
            fontSize: "11px",
            color: delta == null ? E.textFaint : delta >= 0 ? E.green : E.red,
            fontFamily: "var(--font-sans)",
            fontVariantNumeric: "tabular-nums",
            textAlign: "right",
          }}
        >
          {delta == null ? "—" : `${delta >= 0 ? "+" : ""}${delta.toFixed(0)}%`}
        </span>
      </div>
      {hasDetail && expanded && detail && (
        <div
          style={{
            background: E.cardSoft,
            borderRadius: "6px",
            padding: "8px 14px",
            marginLeft: "32px",
            marginRight: "0",
            marginBottom: "4px",
          }}
        >
          {detail.byCategory.map((c) => (
            <div
              key={c.category}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 140px 80px",
                gap: "12px",
                padding: "5px 4px",
                fontSize: "11px",
                fontFamily: "var(--font-sans)",
                color: E.textMuted,
              }}
            >
              <span>{c.category}</span>
              <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                {fmtBRL(c.total)}
              </span>
              <span style={{ textAlign: "right", color: E.textFaint }}>
                {c.count} {c.count === 1 ? "lanc." : "lanc."}
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function MarginCell({ label, pct }: { label: string; pct: number }) {
  const tone = pct >= 20 ? "positive" : pct >= 5 ? "gold" : pct >= 0 ? "warning" : "negative";
  return (
    <div>
      <p
        style={{
          fontSize: "10px",
          fontWeight: 600,
          color: E.textMuted,
          fontFamily: "var(--font-sans)",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          marginBottom: "8px",
        }}
      >
        {label}
      </p>
      <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
        <span
          style={{
            fontSize: "24px",
            fontWeight: 700,
            color: E.text,
            fontFamily: "var(--font-sans)",
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.01em",
          }}
        >
          {pct.toFixed(1)}%
        </span>
        <EPill tone={tone}>{tone === "positive" ? "saudável" : tone === "gold" ? "ok" : tone === "warning" ? "atenção" : "crítico"}</EPill>
      </div>
    </div>
  );
}
