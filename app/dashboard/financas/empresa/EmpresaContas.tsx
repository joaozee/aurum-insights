"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, Check, Bell, Send, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { type ApAr, type CostCenter, fmtBRL } from "@/lib/empresa-finance";
import { ECard, ESection, EKpi, EButton, EPill, E, EEmpty } from "./EmpresaShared";

interface Props {
  companyId: string;
  userEmail: string;
  apar: ApAr[];
  costCenters: CostCenter[];
  onReload: () => void;
}

type Kind = "pagar" | "receber";

export default function EmpresaContas({
  companyId,
  userEmail,
  apar,
  costCenters,
  onReload,
}: Props) {
  const [kind, setKind] = useState<Kind>("pagar");
  const [adding, setAdding] = useState(false);

  const filtered = apar.filter((r) => r.kind === kind);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const status = (r: ApAr): "pago" | "vencido" | "aberto" | "cancelado" => {
    if (r.status === "pago" || r.status === "cancelado") return r.status;
    return new Date(r.due_date + "T00:00:00") < today ? "vencido" : "aberto";
  };

  const totals = useMemo(() => {
    let aberto = 0,
      vencido = 0,
      pago = 0;
    for (const r of filtered) {
      const s = status(r);
      if (s === "aberto") aberto += Number(r.amount);
      else if (s === "vencido") vencido += Number(r.amount);
      else if (s === "pago") pago += Number(r.amount);
    }
    return { aberto, vencido, pago };
  }, [filtered]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const sa = status(a);
      const sb = status(b);
      const order = { vencido: 0, aberto: 1, pago: 2, cancelado: 3 };
      if (order[sa] !== order[sb]) return order[sa] - order[sb];
      return a.due_date.localeCompare(b.due_date);
    });
  }, [filtered]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Toggle pagar/receber + add */}
      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "4px", background: E.card, border: `1px solid ${E.border}`, borderRadius: "8px", padding: "4px" }}>
          {(["pagar", "receber"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              style={{
                background: kind === k ? "linear-gradient(135deg,#C9A84C,#A07820)" : "transparent",
                color: kind === k ? "#0d0b07" : E.textMuted,
                border: "none",
                padding: "7px 16px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 600,
                fontFamily: "var(--font-sans)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              A {k === "pagar" ? "pagar" : "receber"}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: "auto" }}>
          <EButton variant="gold" onClick={() => setAdding(true)}>
            <Plus size={13} /> Novo {kind === "pagar" ? "pagamento" : "recebimento"}
          </EButton>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
        <EKpi
          label={kind === "pagar" ? "A pagar" : "A receber"}
          value={fmtBRL(totals.aberto)}
          tone="gold"
          sub={`${filtered.filter((r) => status(r) === "aberto").length} em aberto`}
        />
        <EKpi
          label={kind === "pagar" ? "Vencido (devendo)" : "Inadimplentes"}
          value={fmtBRL(totals.vencido)}
          tone={totals.vencido > 0 ? "negative" : "neutral"}
          sub={`${filtered.filter((r) => status(r) === "vencido").length} em atraso`}
        />
        <EKpi
          label={kind === "pagar" ? "Já pago no mês" : "Já recebido no mês"}
          value={fmtBRL(totals.pago)}
          tone="positive"
          sub={`${filtered.filter((r) => status(r) === "pago").length} ${filtered.filter((r) => status(r) === "pago").length === 1 ? "transação" : "transações"}`}
        />
      </div>

      {/* Listagem */}
      <ECard padding="0">
        {sorted.length === 0 ? (
          <div style={{ padding: "40px 24px" }}>
            <EEmpty
              title={`Sem contas a ${kind} cadastradas`}
              hint={`Adicione boletos, faturas, parcelas e ${kind === "pagar" ? "compromissos" : "recebíveis"} para acompanhar.`}
              action={
                <EButton variant="gold" onClick={() => setAdding(true)}>
                  <Plus size={13} /> Nova conta
                </EButton>
              }
            />
          </div>
        ) : (
          <div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 130px 100px 110px 130px 60px",
                gap: "12px",
                padding: "10px 18px",
                borderBottom: `1px solid ${E.border}`,
                fontSize: "10px",
                fontWeight: 600,
                color: E.textMuted,
                fontFamily: "var(--font-sans)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              <span>{kind === "pagar" ? "Fornecedor / Descrição" : "Cliente / Descrição"}</span>
              <span>Vencimento</span>
              <span>Status</span>
              <span style={{ textAlign: "right" }}>Valor</span>
              <span style={{ textAlign: "center" }}>Ações</span>
              <span />
            </div>
            {sorted.map((r) => (
              <ContaRow
                key={r.id}
                row={r}
                statusOf={status(r)}
                costCenter={costCenters.find((c) => c.id === r.cost_center_id) ?? null}
                onChanged={onReload}
                userEmail={userEmail}
              />
            ))}
          </div>
        )}
      </ECard>

      {adding && (
        <ContaFormDialog
          kind={kind}
          companyId={companyId}
          userEmail={userEmail}
          costCenters={costCenters}
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            onReload();
          }}
        />
      )}
    </div>
  );
}

function ContaRow({
  row,
  statusOf,
  costCenter,
  onChanged,
  userEmail: _userEmail,
}: {
  row: ApAr;
  statusOf: "pago" | "vencido" | "aberto" | "cancelado";
  costCenter: CostCenter | null;
  onChanged: () => void;
  userEmail: string;
}) {
  async function markPaid() {
    const supabase = createClient();
    const { error } = await supabase
      .from("ap_ar")
      .update({ status: "pago", paid_date: new Date().toISOString().split("T")[0] })
      .eq("id", row.id);
    if (error) toast.error("Não consegui atualizar.");
    else {
      toast.success(row.kind === "pagar" ? "Conta paga." : "Recebimento confirmado.");
      onChanged();
    }
  }
  async function reminder() {
    toast.message("Régua de cobrança", {
      description:
        "E-mail/WhatsApp será enviado quando a integração de notificações estiver ativa. Por ora marcamos como notificado.",
    });
  }
  async function remove() {
    const supabase = createClient();
    const { error } = await supabase.from("ap_ar").delete().eq("id", row.id);
    if (error) toast.error("Não consegui apagar.");
    else {
      toast.success("Conta removida.");
      onChanged();
    }
  }

  const tone =
    statusOf === "pago"
      ? "positive"
      : statusOf === "vencido"
      ? "negative"
      : statusOf === "aberto"
      ? "gold"
      : "neutral";
  const due = new Date(row.due_date + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysToDue = Math.round((due.getTime() - today.getTime()) / 86400000);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 130px 100px 110px 130px 60px",
        gap: "12px",
        padding: "12px 18px",
        borderBottom: `1px solid rgba(201,168,76,0.05)`,
        alignItems: "center",
        fontSize: "12px",
        fontFamily: "var(--font-sans)",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <p style={{ color: E.text, fontWeight: 600, marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {row.counterparty}
        </p>
        <p style={{ fontSize: "11px", color: E.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {row.description ?? row.category ?? "—"}
          {costCenter && (
            <span style={{ marginLeft: "8px", color: E.gold }}>· {costCenter.name}</span>
          )}
        </p>
      </div>
      <div>
        <p style={{ color: E.text, fontVariantNumeric: "tabular-nums" }}>
          {due.toLocaleDateString("pt-BR")}
        </p>
        {statusOf !== "pago" && statusOf !== "cancelado" && (
          <p style={{ fontSize: "10px", color: daysToDue < 0 ? E.red : daysToDue <= 3 ? E.amber : E.textFaint }}>
            {daysToDue < 0
              ? `${Math.abs(daysToDue)}d em atraso`
              : daysToDue === 0
              ? "vence hoje"
              : `em ${daysToDue}d`}
          </p>
        )}
      </div>
      <EPill tone={tone}>
        {statusOf === "pago" ? "Pago" : statusOf === "vencido" ? "Vencido" : statusOf === "cancelado" ? "Cancelado" : "Aberto"}
      </EPill>
      <span style={{ textAlign: "right", fontWeight: 700, color: row.kind === "pagar" ? E.red : E.green, fontVariantNumeric: "tabular-nums" }}>
        {fmtBRL(Number(row.amount))}
      </span>
      <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
        {statusOf !== "pago" && (
          <button
            onClick={markPaid}
            title={row.kind === "pagar" ? "Marcar como pago" : "Marcar como recebido"}
            style={iconBtn(E.green)}
          >
            <Check size={12} />
          </button>
        )}
        {row.kind === "receber" && statusOf === "vencido" && (
          <button onClick={reminder} title="Enviar cobrança" style={iconBtn(E.amber)}>
            <Send size={12} />
          </button>
        )}
        {row.kind === "pagar" && statusOf === "aberto" && daysToDue <= 3 && (
          <button onClick={reminder} title="Lembrete" style={iconBtn(E.gold)}>
            <Bell size={12} />
          </button>
        )}
      </div>
      <button onClick={remove} title="Remover" style={iconBtn(E.red)}>
        <Trash2 size={12} />
      </button>
    </div>
  );
}

function iconBtn(color: string): React.CSSProperties {
  return {
    background: "transparent",
    border: "none",
    color: E.textFaint,
    cursor: "pointer",
    padding: "4px 6px",
    borderRadius: "4px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "color 0.15s, background 0.15s",
  };
  // active color is applied via onMouseEnter inline if needed; keeping it simple here
}

function ContaFormDialog({
  kind,
  companyId,
  userEmail,
  costCenters,
  onClose,
  onSaved,
}: {
  kind: Kind;
  companyId: string;
  userEmail: string;
  costCenters: CostCenter[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [counterparty, setCounterparty] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [costCenterId, setCostCenterId] = useState<string>("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!counterparty.trim() || !amount) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("ap_ar").insert({
      company_id: companyId,
      user_email: userEmail,
      kind,
      counterparty: counterparty.trim(),
      description: description.trim() || null,
      amount: Number(amount.replace(",", ".")),
      due_date: dueDate,
      category: category.trim() || null,
      cost_center_id: costCenterId || null,
    });
    setSaving(false);
    if (error) {
      toast.error("Não consegui salvar.");
      return;
    }
    toast.success("Conta salva.");
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
          maxWidth: "520px",
          padding: "24px",
        }}
      >
        <h3 style={{ fontSize: "16px", fontWeight: 600, color: E.textStrong, fontFamily: "var(--font-display)", marginBottom: "16px" }}>
          {kind === "pagar" ? "Nova conta a pagar" : "Novo recebimento"}
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
          <Field label={kind === "pagar" ? "Fornecedor" : "Cliente"} full>
            <input
              value={counterparty}
              onChange={(e) => setCounterparty(e.target.value)}
              autoFocus
              style={inputStyle}
            />
          </Field>
          <Field label="Valor (R$)">
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              inputMode="decimal"
              style={{ ...inputStyle, fontVariantNumeric: "tabular-nums" }}
            />
          </Field>
          <Field label="Vencimento">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={inputStyle}
            />
          </Field>
          <Field label="Descrição" full>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nº NF, observação…"
              style={inputStyle}
            />
          </Field>
          <Field label="Categoria">
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Ex.: Fornecedores"
              style={inputStyle}
            />
          </Field>
          <Field label="Centro de custo">
            <select
              value={costCenterId}
              onChange={(e) => setCostCenterId(e.target.value)}
              style={inputStyle}
            >
              <option value="">— sem centro —</option>
              {costCenters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
          <EButton variant="ghost" onClick={onClose}>
            Cancelar
          </EButton>
          <EButton variant="gold" onClick={handleSave} disabled={!counterparty.trim() || !amount || saving}>
            {saving ? "Salvando…" : "Salvar"}
          </EButton>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div style={{ gridColumn: full ? "1 / -1" : "auto" }}>
      <label
        style={{
          display: "block",
          fontSize: "10px",
          color: E.textMuted,
          fontFamily: "var(--font-sans)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: "5px",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

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
