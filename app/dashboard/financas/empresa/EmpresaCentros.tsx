"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, Briefcase, FolderKanban } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  type CostCenter,
  type FinanceTxRow,
  type ApAr,
  fmtBRL,
} from "@/lib/empresa-finance";
import { ECard, ESection, EButton, EPill, E, EEmpty } from "./EmpresaShared";

interface Props {
  companyId: string;
  costCenters: CostCenter[];
  transactions: FinanceTxRow[];
  apar: ApAr[];
  onReload: () => void;
}

export default function EmpresaCentros({
  companyId,
  costCenters,
  transactions,
  apar,
  onReload,
}: Props) {
  const [adding, setAdding] = useState<"area" | "projeto" | null>(null);
  const [filter, setFilter] = useState<"all" | "area" | "projeto">("all");

  const stats = useMemo(() => {
    const map = new Map<string, { gasto: number; receita: number; aberto: number }>();
    for (const c of costCenters) map.set(c.id, { gasto: 0, receita: 0, aberto: 0 });
    for (const t of transactions) {
      if (!t.cost_center_id) continue;
      const cur = map.get(t.cost_center_id);
      if (!cur) continue;
      if (t.type === "saida") cur.gasto += Number(t.amount);
      else cur.receita += Number(t.amount);
    }
    for (const r of apar) {
      if (!r.cost_center_id || r.status === "pago" || r.status === "cancelado") continue;
      const cur = map.get(r.cost_center_id);
      if (!cur) continue;
      cur.aberto += Number(r.amount);
    }
    return map;
  }, [costCenters, transactions, apar]);

  const filtered = costCenters.filter((c) => filter === "all" || c.type === filter);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "4px", background: E.card, border: `1px solid ${E.border}`, borderRadius: "8px", padding: "4px" }}>
          {([
            { id: "all", label: "Todos" },
            { id: "area", label: "Áreas" },
            { id: "projeto", label: "Projetos" },
          ] as const).map((o) => (
            <button
              key={o.id}
              onClick={() => setFilter(o.id)}
              style={{
                background: filter === o.id ? "linear-gradient(135deg,#C9A84C,#A07820)" : "transparent",
                color: filter === o.id ? "#0d0b07" : E.textMuted,
                border: "none",
                padding: "7px 14px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 600,
                fontFamily: "var(--font-sans)",
                cursor: "pointer",
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: "6px" }}>
          <EButton variant="outline" onClick={() => setAdding("area")}>
            <Briefcase size={13} /> Nova área
          </EButton>
          <EButton variant="gold" onClick={() => setAdding("projeto")}>
            <FolderKanban size={13} /> Novo projeto
          </EButton>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EEmpty
          title="Sem centros de custo"
          hint="Crie áreas (departamentos) e projetos para alocar despesas e medir rentabilidade por unidade."
          action={
            <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
              <EButton variant="outline" onClick={() => setAdding("area")}>
                <Briefcase size={13} /> Nova área
              </EButton>
              <EButton variant="gold" onClick={() => setAdding("projeto")}>
                <FolderKanban size={13} /> Novo projeto
              </EButton>
            </div>
          }
        />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          {filtered.map((c) => {
            const s = stats.get(c.id) ?? { gasto: 0, receita: 0, aberto: 0 };
            const margem = s.receita - s.gasto;
            const totalCommitted = s.gasto + s.aberto;
            const budgetUsedPct = c.budget && c.budget > 0 ? (totalCommitted / Number(c.budget)) * 100 : null;
            return (
              <ECard key={c.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <div
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: c.color ?? E.gold,
                        }}
                      />
                      <h4 style={{ fontSize: "15px", fontWeight: 600, color: E.text, fontFamily: "var(--font-display)" }}>
                        {c.name}
                      </h4>
                      <EPill tone={c.type === "projeto" ? "gold" : "neutral"}>
                        {c.type === "projeto" ? "Projeto" : "Área"}
                      </EPill>
                    </div>
                    {c.budget && (
                      <p style={{ fontSize: "11px", color: E.textMuted, fontFamily: "var(--font-sans)" }}>
                        Orçamento: {fmtBRL(Number(c.budget))}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={async () => {
                      const supabase = createClient();
                      const { error } = await supabase.from("cost_center").delete().eq("id", c.id);
                      if (error) toast.error("Não consegui apagar.");
                      else {
                        toast.success("Removido.");
                        onReload();
                      }
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: E.textFaint,
                      cursor: "pointer",
                      padding: "4px",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = E.red; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = E.textFaint; }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                  <Stat label="Gasto" value={fmtBRL(s.gasto)} tone="negative" />
                  <Stat label="Receita" value={fmtBRL(s.receita)} tone="positive" />
                  <Stat label="Margem" value={fmtBRL(margem)} tone={margem >= 0 ? "gold" : "negative"} />
                </div>

                {budgetUsedPct != null && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                      <span style={{ fontSize: "10px", color: E.textMuted, fontFamily: "var(--font-sans)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        Uso do orçamento
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          color: budgetUsedPct > 100 ? E.red : budgetUsedPct > 80 ? E.amber : E.green,
                          fontFamily: "var(--font-sans)",
                          fontVariantNumeric: "tabular-nums",
                          fontWeight: 600,
                        }}
                      >
                        {budgetUsedPct.toFixed(0)}%
                      </span>
                    </div>
                    <div style={{ background: E.cardSoft, borderRadius: "4px", height: "6px", overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${Math.min(100, budgetUsedPct)}%`,
                          height: "100%",
                          background:
                            budgetUsedPct > 100
                              ? E.red
                              : budgetUsedPct > 80
                              ? "linear-gradient(90deg, #C9A84C, #f59e0b)"
                              : "linear-gradient(90deg, #34d399, #C9A84C)",
                          transition: "width 0.3s",
                        }}
                      />
                    </div>
                    {s.aberto > 0 && (
                      <p style={{ fontSize: "10px", color: E.textMuted, fontFamily: "var(--font-sans)", marginTop: "4px" }}>
                        {fmtBRL(s.aberto)} ainda em contas em aberto
                      </p>
                    )}
                  </div>
                )}
              </ECard>
            );
          })}
        </div>
      )}

      {adding && (
        <CostCenterDialog
          type={adding}
          companyId={companyId}
          onClose={() => setAdding(null)}
          onSaved={() => {
            setAdding(null);
            onReload();
          }}
        />
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: "positive" | "negative" | "gold" }) {
  const color = tone === "positive" ? E.green : tone === "negative" ? E.red : E.gold;
  return (
    <div>
      <p
        style={{
          fontSize: "9px",
          color: E.textMuted,
          fontFamily: "var(--font-sans)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: "3px",
        }}
      >
        {label}
      </p>
      <p style={{ fontSize: "13px", fontWeight: 700, color, fontFamily: "var(--font-sans)", fontVariantNumeric: "tabular-nums" }}>
        {value}
      </p>
    </div>
  );
}

function CostCenterDialog({
  type,
  companyId,
  onClose,
  onSaved,
}: {
  type: "area" | "projeto";
  companyId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const [color, setColor] = useState(E.gold);
  const [saving, setSaving] = useState(false);

  const COLORS = [E.gold, E.green, E.terracotta, E.blue, E.teal, E.olive, E.mauve, E.rose];

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("cost_center").insert({
      company_id: companyId,
      type,
      name: name.trim(),
      budget: budget ? Number(budget.replace(",", ".")) : null,
      color,
    });
    setSaving(false);
    if (error) {
      toast.error("Não consegui salvar.");
      return;
    }
    toast.success("Centro de custo criado.");
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
        <h3 style={{ fontSize: "16px", fontWeight: 600, color: E.textStrong, fontFamily: "var(--font-display)", marginBottom: "16px" }}>
          {type === "area" ? "Nova área" : "Novo projeto"}
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
          <div>
            <label style={labelStyle}>Nome</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === "area" ? "Ex.: Comercial" : "Ex.: Cliente Acme - Site"}
              autoFocus
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Orçamento (opcional)</label>
            <input
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="0,00"
              inputMode="decimal"
              style={{ ...inputStyle, fontVariantNumeric: "tabular-nums" }}
            />
          </div>
          <div>
            <label style={labelStyle}>Cor</label>
            <div style={{ display: "flex", gap: "8px" }}>
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    background: c,
                    border: color === c ? `2px solid ${E.text}` : "2px solid transparent",
                    cursor: "pointer",
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
          <EButton variant="ghost" onClick={onClose}>Cancelar</EButton>
          <EButton variant="gold" onClick={handleSave} disabled={!name.trim() || saving}>
            {saving ? "Salvando…" : "Salvar"}
          </EButton>
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "10px",
  color: E.textMuted,
  fontFamily: "var(--font-sans)",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  marginBottom: "5px",
};

const inputStyle: React.CSSProperties = {
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
};
