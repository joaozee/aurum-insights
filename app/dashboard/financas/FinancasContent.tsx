"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, FileText, Calendar, Trash2, TrendingUp, TrendingDown, Wallet, X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Transaction } from "./page";

const CATEGORIES_EXPENSE = ["Alimentação","Transporte","Moradia","Saúde","Educação","Lazer","Vestuário","Outros"];
const CATEGORIES_INCOME  = ["Salário","Freelance","Dividendos","Investimentos","Outros"];

const CATEGORY_COLORS: Record<string, string> = {
  Alimentação: "#f59e0b", Transporte: "#3b82f6", Moradia: "#8b5cf6",
  Saúde: "#ec4899", Educação: "#06b6d4", Lazer: "#10b981",
  Vestuário: "#f97316", Salário: "#22c55e", Freelance: "#a3e635",
  Dividendos: "#C9A84C", Investimentos: "#34d399", Outros: "#6b7280",
};

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface Props { transactions: Transaction[]; userId: string; }

export default function FinancasContent({ transactions: initial, userId }: Props) {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>(initial);
  const [tab, setTab] = useState<"atual" | "relatorios">("atual");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"income" | "expense">("income");
  const [form, setForm] = useState({ category: "", description: "", amount: "", date: new Date().toISOString().split("T")[0] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const income   = useMemo(() => transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0), [transactions]);
  const expense  = useMemo(() => transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0), [transactions]);
  const balance  = income - expense;

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.filter(t => t.type === "expense").forEach(t => {
      map[t.category] = (map[t.category] ?? 0) + t.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [transactions]);

  const maxCategory = byCategory[0]?.[1] ?? 1;

  function openModal(type: "income" | "expense") {
    setModalType(type);
    setForm({ category: "", description: "", amount: "", date: new Date().toISOString().split("T")[0] });
    setError("");
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.category || !form.amount) { setError("Preencha categoria e valor."); return; }
    const amount = parseFloat(form.amount.replace(",", "."));
    if (isNaN(amount) || amount <= 0) { setError("Valor inválido."); return; }

    setSaving(true);
    const supabase = createClient();
    const { data, error: err } = await supabase.from("transactions").insert({
      user_id: userId,
      type: modalType,
      category: form.category,
      description: form.description,
      amount,
      date: form.date,
    }).select().single();

    if (err) { setError("Erro ao salvar. Tente novamente."); setSaving(false); return; }
    setTransactions(prev => [data as Transaction, ...prev]);
    setShowModal(false);
    setSaving(false);
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    await supabase.from("transactions").delete().eq("id", id);
    setTransactions(prev => prev.filter(t => t.id !== id));
  }

  const card = (bg: string, border: string) => ({
    background: bg, border: `1px solid ${border}`, borderRadius: "10px", padding: "18px 20px",
    display: "flex", alignItems: "center", gap: "14px",
  } as React.CSSProperties);

  return (
    <div style={{ minHeight: "calc(100vh - 58px)", background: "#0a0806" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px 64px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#f0e8d0", fontFamily: "var(--font-display)", marginBottom: "4px" }}>
              Finanças
            </h1>
            <p style={{ fontSize: "13px", color: "#5a4a2a", fontFamily: "var(--font-sans)" }}>
              Controle suas receitas e despesas
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <ActionBtn color="#22c55e" bg="rgba(34,197,94,0.12)" border="rgba(34,197,94,0.2)" onClick={() => openModal("income")}>
              + Receita
            </ActionBtn>
            <ActionBtn color="#f87171" bg="rgba(248,113,113,0.12)" border="rgba(248,113,113,0.2)" onClick={() => openModal("expense")}>
              + Despesa
            </ActionBtn>
          </div>
        </div>

        {/* Top actions */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
          <button
            onClick={() => openModal("income")}
            style={{ display: "flex", alignItems: "center", gap: "6px", background: "linear-gradient(135deg,#C9A84C,#A07820)", border: "none", borderRadius: "8px", padding: "9px 18px", color: "#0d0b07", fontSize: "13px", fontWeight: 600, fontFamily: "var(--font-sans)", cursor: "pointer" }}
          >
            <Plus size={14} /> Nova Transação
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: "6px", background: "#130f09", border: "1px solid #2a2010", borderRadius: "8px", padding: "9px 18px", color: "#9a8a6a", fontSize: "13px", fontFamily: "var(--font-sans)", cursor: "pointer" }}>
            <FileText size={14} /> Importar PDF
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "24px", borderBottom: "1px solid #1a1408", paddingBottom: "0" }}>
          {(["atual", "relatorios"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: "none", border: "none", cursor: "pointer", padding: "8px 16px",
              fontSize: "13px", fontFamily: "var(--font-sans)", fontWeight: tab === t ? 600 : 400,
              color: tab === t ? "#C9A84C" : "#5a4a2a",
              borderBottom: tab === t ? "2px solid #C9A84C" : "2px solid transparent",
              transition: "all 0.15s",
            }}>
              {t === "atual" ? "Atual" : "Relatórios"}
            </button>
          ))}
        </div>

        {/* Fluxo do Mês */}
        <section style={{ marginBottom: "24px" }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-sans)", marginBottom: "4px" }}>Fluxo do Mês</p>
          <p style={{ fontSize: "11px", color: "#3a2a10", fontFamily: "var(--font-sans)", marginBottom: "14px" }}>Entradas e saídas</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
            {/* Entradas */}
            <div style={card("rgba(34,197,94,0.06)", "rgba(34,197,94,0.15)")}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(34,197,94,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <TrendingUp size={16} style={{ color: "#22c55e" }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "11px", color: "#5a4a2a", fontFamily: "var(--font-sans)", marginBottom: "4px" }}>Entradas</p>
                <p style={{ fontSize: "20px", fontWeight: 700, color: "#22c55e", fontFamily: "var(--font-sans)" }}>{fmt(income)}</p>
              </div>
            </div>
            {/* Saídas */}
            <div style={card("rgba(248,113,113,0.06)", "rgba(248,113,113,0.15)")}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(248,113,113,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <TrendingDown size={16} style={{ color: "#f87171" }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "11px", color: "#5a4a2a", fontFamily: "var(--font-sans)", marginBottom: "4px" }}>Saídas</p>
                <p style={{ fontSize: "20px", fontWeight: 700, color: "#f87171", fontFamily: "var(--font-sans)" }}>{fmt(expense)}</p>
                {income > 0 && <p style={{ fontSize: "10px", color: "#5a4a2a", fontFamily: "var(--font-sans)" }}>{((expense / income) * 100).toFixed(0)}% do orçamento</p>}
              </div>
            </div>
            {/* Saldo */}
            <div style={card("rgba(139,92,246,0.06)", "rgba(139,92,246,0.15)")}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(139,92,246,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Wallet size={16} style={{ color: "#8b5cf6" }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "11px", color: "#5a4a2a", fontFamily: "var(--font-sans)", marginBottom: "4px" }}>Saldo Livre</p>
                <p style={{ fontSize: "20px", fontWeight: 700, color: "#8b5cf6", fontFamily: "var(--font-sans)" }}>{fmt(balance)}</p>
                <p style={{ fontSize: "10px", color: "#5a4a2a", fontFamily: "var(--font-sans)" }}>para investir</p>
              </div>
            </div>
          </div>
        </section>

        {/* Gastos por Categoria */}
        {byCategory.length > 0 && (
          <section style={{ marginBottom: "24px" }}>
            <div style={{ background: "#130f09", border: "1px solid rgba(201,168,76,0.08)", borderRadius: "12px", padding: "22px 24px" }}>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-sans)", marginBottom: "4px" }}>Gastos por Categoria</p>
              <p style={{ fontSize: "11px", color: "#3a2a10", fontFamily: "var(--font-sans)", marginBottom: "20px" }}>Distribuição mensal</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {byCategory.map(([cat, val]) => (
                  <div key={cat}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                      <span style={{ fontSize: "12px", color: "#9a8a6a", fontFamily: "var(--font-sans)" }}>{cat}</span>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-sans)" }}>{fmt(val)}</span>
                    </div>
                    <div style={{ height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(val / maxCategory) * 100}%`, background: CATEGORY_COLORS[cat] ?? "#C9A84C", borderRadius: "3px", transition: "width 0.4s ease" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          {/* Movimentações Recentes */}
          <section>
            <div style={{ background: "#130f09", border: "1px solid rgba(201,168,76,0.08)", borderRadius: "12px", padding: "22px 24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-sans)" }}>Movimentações Recentes</p>
                <button style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: "6px", padding: "5px 8px", cursor: "pointer", color: "#C9A84C" }}>
                  <Calendar size={13} />
                </button>
              </div>
              <p style={{ fontSize: "11px", color: "#3a2a10", fontFamily: "var(--font-sans)", marginBottom: "18px" }}>Suas transações</p>

              {transactions.length === 0 ? (
                <p style={{ fontSize: "13px", color: "#3a2a10", fontFamily: "var(--font-sans)", textAlign: "center", padding: "24px 0" }}>
                  Nenhuma transação este mês
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  {transactions.slice(0, 8).map(t => (
                    <div key={t.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                      onMouseEnter={e => (e.currentTarget.querySelector(".del-btn") as HTMLElement | null)?.style.setProperty("opacity", "1")}
                      onMouseLeave={e => (e.currentTarget.querySelector(".del-btn") as HTMLElement | null)?.style.setProperty("opacity", "0")}
                    >
                      <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: `${CATEGORY_COLORS[t.category] ?? "#C9A84C"}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: CATEGORY_COLORS[t.category] ?? "#C9A84C" }}>
                          {t.category.charAt(0)}
                        </span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: "13px", fontWeight: 500, color: "#e8dcc0", fontFamily: "var(--font-sans)", marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {t.category}
                        </p>
                        <p style={{ fontSize: "11px", color: "#4a3a1a", fontFamily: "var(--font-sans)" }}>
                          {t.description || "—"} · {new Date(t.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                        </p>
                      </div>
                      <span style={{ fontSize: "13px", fontWeight: 700, fontFamily: "var(--font-sans)", color: t.type === "income" ? "#22c55e" : "#f87171", flexShrink: 0 }}>
                        {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                      </span>
                      <button
                        className="del-btn"
                        onClick={() => handleDelete(t.id)}
                        style={{ opacity: 0, background: "none", border: "none", cursor: "pointer", color: "#f87171", padding: "2px", transition: "opacity 0.15s", flexShrink: 0 }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Transações do Mês — Tabela */}
          <section>
            <div style={{ background: "#130f09", border: "1px solid rgba(201,168,76,0.08)", borderRadius: "12px", padding: "22px 24px" }}>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-sans)", marginBottom: "18px" }}>Transações do Mês</p>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Data","Categoria","Descrição","Tipo","Valor"].map(h => (
                      <th key={h} style={{ fontSize: "10px", color: "#4a3a1a", fontFamily: "var(--font-sans)", fontWeight: 600, textAlign: "left", padding: "0 0 10px", letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", padding: "24px 0", fontSize: "13px", color: "#3a2a10", fontFamily: "var(--font-sans)" }}>
                        Sem transações
                      </td>
                    </tr>
                  ) : (
                    transactions.map(t => (
                      <tr key={t.id} style={{ borderTop: "1px solid rgba(255,255,255,0.03)" }}>
                        <td style={{ padding: "10px 0", fontSize: "12px", color: "#6a5a3a", fontFamily: "var(--font-sans)" }}>
                          {new Date(t.date + "T12:00:00").toLocaleDateString("pt-BR")}
                        </td>
                        <td style={{ padding: "10px 0", fontSize: "12px", color: "#9a8a6a", fontFamily: "var(--font-sans)" }}>{t.category}</td>
                        <td style={{ padding: "10px 0", fontSize: "12px", color: "#6a5a3a", fontFamily: "var(--font-sans)", maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.description || "—"}</td>
                        <td style={{ padding: "10px 0" }}>
                          <span style={{ fontSize: "10px", fontWeight: 600, padding: "3px 8px", borderRadius: "4px", fontFamily: "var(--font-sans)", background: t.type === "income" ? "rgba(34,197,94,0.12)" : "rgba(248,113,113,0.12)", color: t.type === "income" ? "#22c55e" : "#f87171" }}>
                            {t.type === "income" ? "Entrada" : "Saída"}
                          </span>
                        </td>
                        <td style={{ padding: "10px 0", fontSize: "13px", fontWeight: 700, fontFamily: "var(--font-sans)", color: t.type === "income" ? "#22c55e" : "#f87171", textAlign: "right" }}>
                          {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      {/* Modal Nova Transação */}
      {showModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div style={{ background: "#130f09", border: "1px solid rgba(201,168,76,0.15)", borderRadius: "14px", padding: "32px", width: "100%", maxWidth: "420px", boxShadow: "0 24px 64px rgba(0,0,0,0.8)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "17px", fontWeight: 600, color: "#f0e8d0", fontFamily: "var(--font-display)" }}>
                Nova {modalType === "income" ? "Receita" : "Despesa"}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#5a4a2a", padding: 0 }}><X size={18} /></button>
            </div>

            {/* Tipo toggle */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
              {(["income","expense"] as const).map(type => (
                <button key={type} onClick={() => setModalType(type)} style={{
                  flex: 1, padding: "9px", borderRadius: "8px", border: "1px solid",
                  borderColor: modalType === type ? (type === "income" ? "rgba(34,197,94,0.4)" : "rgba(248,113,113,0.4)") : "#2a2010",
                  background: modalType === type ? (type === "income" ? "rgba(34,197,94,0.1)" : "rgba(248,113,113,0.1)") : "transparent",
                  color: modalType === type ? (type === "income" ? "#22c55e" : "#f87171") : "#5a4a2a",
                  fontSize: "13px", fontWeight: 600, fontFamily: "var(--font-sans)", cursor: "pointer", transition: "all 0.15s",
                }}>
                  {type === "income" ? "Receita" : "Despesa"}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Categoria */}
              <div>
                <label style={{ fontSize: "10px", color: "#7a6a4a", fontFamily: "var(--font-sans)", letterSpacing: "0.12em", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>Categoria</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  style={{ width: "100%", background: "#1a1508", border: "1px solid #2a2010", borderRadius: "6px", padding: "10px 12px", color: form.category ? "#e8dcc0" : "#5a4a2a", fontSize: "13px", fontFamily: "var(--font-sans)", outline: "none", cursor: "pointer" }}>
                  <option value="">Selecione...</option>
                  {(modalType === "income" ? CATEGORIES_INCOME : CATEGORIES_EXPENSE).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Descrição */}
              <div>
                <label style={{ fontSize: "10px", color: "#7a6a4a", fontFamily: "var(--font-sans)", letterSpacing: "0.12em", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>Descrição</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Ex: Uber, Supermercado..."
                  style={{ width: "100%", background: "#1a1508", border: "1px solid #2a2010", borderRadius: "6px", padding: "10px 12px", color: "#e8dcc0", fontSize: "13px", fontFamily: "var(--font-sans)", outline: "none", boxSizing: "border-box" }} />
              </div>

              {/* Valor */}
              <div>
                <label style={{ fontSize: "10px", color: "#7a6a4a", fontFamily: "var(--font-sans)", letterSpacing: "0.12em", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>Valor (R$)</label>
                <input value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0,00" type="text" inputMode="decimal"
                  style={{ width: "100%", background: "#1a1508", border: "1px solid #2a2010", borderRadius: "6px", padding: "10px 12px", color: "#e8dcc0", fontSize: "13px", fontFamily: "var(--font-sans)", outline: "none", boxSizing: "border-box" }} />
              </div>

              {/* Data */}
              <div>
                <label style={{ fontSize: "10px", color: "#7a6a4a", fontFamily: "var(--font-sans)", letterSpacing: "0.12em", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>Data</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  style={{ width: "100%", background: "#1a1508", border: "1px solid #2a2010", borderRadius: "6px", padding: "10px 12px", color: "#e8dcc0", fontSize: "13px", fontFamily: "var(--font-sans)", outline: "none", boxSizing: "border-box", colorScheme: "dark" }} />
              </div>

              {error && <p style={{ fontSize: "12px", color: "rgba(248,113,113,0.8)", fontFamily: "var(--font-sans)" }}>{error}</p>}

              <button onClick={handleSave} disabled={saving}
                style={{ background: saving ? "rgba(201,168,76,0.5)" : "linear-gradient(135deg,#C9A84C,#A07820)", border: "none", borderRadius: "8px", padding: "13px", color: "#0d0b07", fontSize: "14px", fontWeight: 700, fontFamily: "var(--font-sans)", cursor: saving ? "not-allowed" : "pointer", marginTop: "4px", transition: "all 0.2s" }}>
                {saving ? "Salvando..." : `Salvar ${modalType === "income" ? "Receita" : "Despesa"}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionBtn({ children, color, bg, border, onClick }: { children: React.ReactNode; color: string; bg: string; border: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ background: bg, border: `1px solid ${border}`, borderRadius: "8px", padding: "8px 16px", color, fontSize: "13px", fontWeight: 600, fontFamily: "var(--font-sans)", cursor: "pointer", transition: "all 0.15s" }}>
      {children}
    </button>
  );
}
