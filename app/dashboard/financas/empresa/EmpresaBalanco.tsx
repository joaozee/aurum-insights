"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  type BalanceEntry,
  computeBalance,
  fmtBRL,
} from "@/lib/empresa-finance";
import { ECard, ESection, EKpi, E, EButton, EEmpty, EPill } from "./EmpresaShared";

interface Props {
  companyId: string;
  entries: BalanceEntry[];
  onReload: () => void;
}

const GROUP_LABELS: Record<BalanceEntry["group_type"], string> = {
  ativo_circulante: "Ativo Circulante",
  ativo_nao_circulante: "Ativo Não Circulante",
  passivo_circulante: "Passivo Circulante",
  passivo_nao_circulante: "Passivo Não Circulante",
  patrimonio_liquido: "Patrimônio Líquido",
};

export default function EmpresaBalanco({ companyId, entries, onReload }: Props) {
  const balance = useMemo(() => computeBalance(entries), [entries]);
  const [adding, setAdding] = useState<BalanceEntry["group_type"] | null>(null);

  const totalAtivoColor = balance.totalAtivo === balance.totalPassivo + balance.totalPL ? E.green : E.amber;
  const balanced = Math.abs(balance.totalAtivo - (balance.totalPassivo + balance.totalPL)) < 0.01;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Totais */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "12px",
        }}
      >
        <EKpi label="Ativo Total" value={fmtBRL(balance.totalAtivo)} tone="gold" />
        <EKpi label="Passivo Total" value={fmtBRL(balance.totalPassivo)} tone="negative" />
        <EKpi
          label="Patrimônio Líquido"
          value={fmtBRL(balance.totalPL)}
          sub={balance.totalPL < 0 ? "tecnicamente insolvente" : "saudável"}
          tone={balance.totalPL >= 0 ? "positive" : "negative"}
        />
        <EKpi
          label="Equilíbrio"
          value={balanced ? "Balanceado" : fmtBRL(balance.totalAtivo - balance.totalPassivo - balance.totalPL)}
          sub={balanced ? "Ativo = Passivo + PL" : "diferença entre ativo e passivo + PL"}
          tone={balanced ? "positive" : "warning"}
        />
      </div>

      {/* Indicadores de liquidez */}
      <ECard>
        <ESection title="Indicadores de liquidez" subtitle="Capacidade de pagar obrigações">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
            <LiquidityCell
              label="Liquidez Corrente"
              value={balance.liquidezCorrente}
              hint="AC ÷ PC — quanto a empresa tem em curto prazo para cada R$ de dívida de curto prazo"
              good={1.5}
            />
            <LiquidityCell
              label="Liquidez Seca"
              value={balance.liquidezSeca}
              hint="(AC − Estoque) ÷ PC — versão mais conservadora"
              good={1.0}
            />
            <LiquidityCell
              label="Liquidez Geral"
              value={balance.liquidezGeral}
              hint="(AC + ARLP) ÷ (PC + PNC) — capacidade total de pagar tudo"
              good={1.0}
            />
          </div>
        </ESection>
      </ECard>

      {/* Balanço lado a lado */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <ECard>
          <ESection
            title="Ativo"
            subtitle={fmtBRL(balance.totalAtivo)}
          >
            <BalanceGroup
              title="Circulante"
              entries={balance.ativo_circulante}
              total={balance.ativo_circulante.reduce((s, e) => s + e.amount, 0)}
              onAdd={() => setAdding("ativo_circulante")}
              entriesRaw={entries.filter((e) => e.group_type === "ativo_circulante")}
              onReload={onReload}
            />
            <BalanceGroup
              title="Não Circulante"
              entries={balance.ativo_nao_circulante}
              total={balance.ativo_nao_circulante.reduce((s, e) => s + e.amount, 0)}
              onAdd={() => setAdding("ativo_nao_circulante")}
              entriesRaw={entries.filter((e) => e.group_type === "ativo_nao_circulante")}
              onReload={onReload}
            />
            {entries.length === 0 && (
              <EEmpty title="Sem lançamentos" hint="Adicione caixa, contas a receber, estoque, imobilizado…" />
            )}
          </ESection>
        </ECard>

        <ECard>
          <ESection
            title="Passivo + Patrimônio Líquido"
            subtitle={fmtBRL(balance.totalPassivo + balance.totalPL)}
          >
            <BalanceGroup
              title="Passivo Circulante"
              entries={balance.passivo_circulante}
              total={balance.passivo_circulante.reduce((s, e) => s + e.amount, 0)}
              onAdd={() => setAdding("passivo_circulante")}
              entriesRaw={entries.filter((e) => e.group_type === "passivo_circulante")}
              onReload={onReload}
            />
            <BalanceGroup
              title="Passivo Não Circulante"
              entries={balance.passivo_nao_circulante}
              total={balance.passivo_nao_circulante.reduce((s, e) => s + e.amount, 0)}
              onAdd={() => setAdding("passivo_nao_circulante")}
              entriesRaw={entries.filter((e) => e.group_type === "passivo_nao_circulante")}
              onReload={onReload}
            />
            <BalanceGroup
              title="Patrimônio Líquido"
              entries={balance.patrimonio_liquido}
              total={balance.totalPL}
              onAdd={() => setAdding("patrimonio_liquido")}
              entriesRaw={entries.filter((e) => e.group_type === "patrimonio_liquido")}
              onReload={onReload}
            />
          </ESection>
        </ECard>
      </div>

      {adding && (
        <BalanceFormDialog
          group={adding}
          companyId={companyId}
          onClose={() => setAdding(null)}
          onSaved={() => {
            setAdding(null);
            onReload();
          }}
        />
      )}

      <span style={{ fontSize: 0, color: totalAtivoColor }} />
    </div>
  );
}

function BalanceGroup({
  title,
  entries,
  total,
  onAdd,
  entriesRaw,
  onReload,
}: {
  title: string;
  entries: { label: string; amount: number }[];
  total: number;
  onAdd: () => void;
  entriesRaw: BalanceEntry[];
  onReload: () => void;
}) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", paddingBottom: "6px", borderBottom: `1px solid ${E.border}` }}>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 600,
            color: E.textMuted,
            fontFamily: "var(--font-sans)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          {title}
        </span>
        <span style={{ fontSize: "12px", color: E.text, fontFamily: "var(--font-sans)", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
          {fmtBRL(total)}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {entriesRaw.map((e) => (
          <BalanceLine key={e.id} entry={e} onReload={onReload} />
        ))}
        {entriesRaw.length === 0 && (
          <p style={{ fontSize: "11px", color: E.textFaint, fontFamily: "var(--font-sans)", padding: "6px 0" }}>
            Vazio.
          </p>
        )}
        <button
          onClick={onAdd}
          style={{
            background: "transparent",
            border: `1px dashed ${E.border}`,
            borderRadius: "6px",
            padding: "6px 10px",
            color: E.textMuted,
            fontSize: "11px",
            fontFamily: "var(--font-sans)",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            marginTop: "4px",
            alignSelf: "flex-start",
            transition: "color 0.15s, border-color 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = E.gold;
            e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = E.textMuted;
            e.currentTarget.style.borderColor = E.border;
          }}
        >
          <Plus size={11} /> Adicionar linha
        </button>
      </div>
    </div>
  );
}

function BalanceLine({ entry, onReload }: { entry: BalanceEntry; onReload: () => void }) {
  async function handleDelete() {
    const supabase = createClient();
    const { error } = await supabase.from("balance_entry").delete().eq("id", entry.id);
    if (error) toast.error("Não consegui apagar.");
    else {
      toast.success("Linha removida.");
      onReload();
    }
  }
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "6px 0",
        fontSize: "12px",
        fontFamily: "var(--font-sans)",
      }}
    >
      <span style={{ color: E.text }}>{entry.label}</span>
      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <span style={{ color: E.text, fontVariantNumeric: "tabular-nums" }}>{fmtBRL(Number(entry.amount))}</span>
        <button
          onClick={handleDelete}
          aria-label="Remover"
          style={{
            background: "transparent",
            border: "none",
            color: E.textFaint,
            cursor: "pointer",
            padding: "2px",
            display: "flex",
            alignItems: "center",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = E.red; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = E.textFaint; }}
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

function LiquidityCell({
  label,
  value,
  hint,
  good,
}: {
  label: string;
  value: number | null;
  hint: string;
  good: number;
}) {
  const tone =
    value == null ? "neutral" : value >= good ? "positive" : value >= good * 0.7 ? "warning" : "negative";
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
        <p style={{ fontSize: "11px", fontWeight: 600, color: E.textMuted, fontFamily: "var(--font-sans)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {label}
        </p>
        {value != null && (
          <EPill tone={tone === "neutral" ? "neutral" : tone}>
            {tone === "positive" ? "saudável" : tone === "warning" ? "atenção" : tone === "negative" ? "crítico" : "—"}
          </EPill>
        )}
      </div>
      <p style={{ fontSize: "26px", fontWeight: 700, color: E.text, fontFamily: "var(--font-sans)", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em", marginBottom: "4px" }}>
        {value == null ? "—" : value.toFixed(2)}
      </p>
      <p style={{ fontSize: "11px", color: E.textFaint, fontFamily: "var(--font-sans)", lineHeight: 1.4 }}>
        {hint}
      </p>
    </div>
  );
}

function BalanceFormDialog({
  group,
  companyId,
  onClose,
  onSaved,
}: {
  group: BalanceEntry["group_type"];
  companyId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!label.trim() || !amount) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("balance_entry").insert({
      company_id: companyId,
      group_type: group,
      label: label.trim(),
      amount: Number(amount.replace(",", ".")),
    });
    setSaving(false);
    if (error) {
      toast.error("Não consegui salvar.");
      return;
    }
    toast.success("Linha adicionada.");
    onSaved();
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(4px)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: E.card,
          border: `1px solid ${E.border}`,
          borderRadius: "12px",
          width: "100%",
          maxWidth: "440px",
          padding: "24px",
        }}
      >
        <h3 style={{ fontSize: "16px", fontWeight: 600, color: E.textStrong, fontFamily: "var(--font-display)", marginBottom: "4px" }}>
          Nova linha — {GROUP_LABELS[group]}
        </h3>
        <p style={{ fontSize: "11px", color: E.textMuted, fontFamily: "var(--font-sans)", marginBottom: "16px" }}>
          Ex.: Caixa, Bancos, Contas a Receber, Estoque, Imobilizado…
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
          <div>
            <label style={{ display: "block", fontSize: "10px", color: E.textMuted, fontFamily: "var(--font-sans)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "5px" }}>
              Descrição
            </label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Caixa"
              autoFocus
              style={{
                width: "100%",
                background: E.cardSoft,
                border: `1px solid ${E.border}`,
                borderRadius: "6px",
                padding: "8px 12px",
                color: E.text,
                fontSize: "13px",
                fontFamily: "var(--font-sans)",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "10px", color: E.textMuted, fontFamily: "var(--font-sans)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "5px" }}>
              Valor (R$)
            </label>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              type="text"
              inputMode="decimal"
              style={{
                width: "100%",
                background: E.cardSoft,
                border: `1px solid ${E.border}`,
                borderRadius: "6px",
                padding: "8px 12px",
                color: E.text,
                fontSize: "13px",
                fontFamily: "var(--font-sans)",
                outline: "none",
                fontVariantNumeric: "tabular-nums",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
          <EButton variant="ghost" onClick={onClose}>Cancelar</EButton>
          <EButton variant="gold" onClick={handleSave} disabled={!label.trim() || !amount || saving}>
            {saving ? "Salvando…" : "Salvar"}
          </EButton>
        </div>
      </div>
    </div>
  );
}
