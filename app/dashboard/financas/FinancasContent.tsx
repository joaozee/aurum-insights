"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Plus, FileText, TrendingUp, TrendingDown, Wallet, X,
  Trash2, Target, Calendar, BarChart2, LayoutDashboard,
  ChevronLeft, ChevronRight, AlertCircle, Check,
  Building2, User,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// ─── Types ───────────────────────────────────────────────────────────────────

interface FinanceTransaction {
  id: string;
  account_type: "pessoal" | "empresa";
  type: "income" | "expense";
  category: string;
  amount: number;
  description: string;
  transaction_date: string;
}

interface Budget {
  id: string;
  category: string;
  monthly_limit: number;
  alert_threshold: number;
  month: number;
  year: number;
}

interface FinancialGoal {
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

interface FinancialEvent {
  id: string;
  title: string;
  description: string;
  event_type: string;
  event_date: string;
  amount: number | null;
  is_recurring: boolean;
  status: string;
  category: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES_EXPENSE = ["Alimentação","Transporte","Moradia","Saúde","Educação","Lazer","Vestuário","Serviços","Impostos","Outros"];
const CATEGORIES_INCOME  = ["Salário","Freelance","Dividendos","Investimentos","Aluguel","Outros"];
const GOAL_CATEGORIES    = ["Aposentadoria","Imóvel","Viagem","Educação","Emergência","Veículo","Outros"];
const EVENT_TYPES        = ["vencimento","meta","receita","despesa","outro"];
const MONTHS_PT          = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

const CATEGORY_COLORS: Record<string, string> = {
  Alimentação: "#f59e0b", Transporte: "#3b82f6", Moradia: "#8b5cf6",
  Saúde: "#ec4899", Educação: "#06b6d4", Lazer: "#10b981",
  Vestuário: "#f97316", Serviços: "#a78bfa", Impostos: "#ef4444",
  Salário: "#22c55e", Freelance: "#a3e635", Dividendos: "#C9A84C",
  Investimentos: "#34d399", Aluguel: "#60a5fa", Outros: "#6b7280",
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  vencimento: "#f87171", meta: "#8b5cf6", receita: "#22c55e",
  despesa: "#f59e0b", outro: "#06b6d4",
};

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// ─── Shared style helpers ─────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%", background: "#1a1508", border: "1px solid #2a2010",
  borderRadius: "6px", padding: "10px 12px", color: "#e8dcc0",
  fontSize: "13px", fontFamily: "var(--font-sans)", outline: "none",
  boxSizing: "border-box",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle, cursor: "pointer",
};

// ─── Small helper components ──────────────────────────────────────────────────

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
      <h2 style={{ fontSize: "17px", fontWeight: 600, color: "#f0e8d0", fontFamily: "var(--font-display)" }}>{title}</h2>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#5a4a2a", padding: 0 }}>
        <X size={18} />
      </button>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: "10px", color: "#7a6a4a", fontFamily: "var(--font-sans)", letterSpacing: "0.12em", textTransform: "uppercase" as const, display: "block", marginBottom: "6px" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function SaveButton({ saving, onClick, label }: { saving: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      style={{
        width: "100%",
        background: saving ? "rgba(201,168,76,0.5)" : "linear-gradient(135deg,#C9A84C,#A07820)",
        border: "none", borderRadius: "8px", padding: "13px", color: "#0d0b07",
        fontSize: "14px", fontWeight: 700, fontFamily: "var(--font-sans)",
        cursor: saving ? "not-allowed" : "pointer", marginTop: "4px",
      }}
    >
      {saving ? "Salvando..." : label}
    </button>
  );
}

function SummaryCard({ icon: Icon, label, value, color, bg, border, sub }: {
  icon: React.ElementType; label: string; value: string; color: string;
  bg: string; border: string; sub: string;
}) {
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: "10px", padding: "18px 20px", display: "flex", alignItems: "center", gap: "14px" }}>
      <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: `${color}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={16} style={{ color }} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: "11px", color: "#5a4a2a", fontFamily: "var(--font-sans)", marginBottom: "4px" }}>{label}</p>
        <p style={{ fontSize: "20px", fontWeight: 700, color, fontFamily: "var(--font-sans)", lineHeight: 1 }}>{value}</p>
        <p style={{ fontSize: "10px", color: "#4a3a1a", fontFamily: "var(--font-sans)", marginTop: "4px" }}>{sub}</p>
      </div>
    </div>
  );
}

function TxRow({ t, onDelete }: { t: FinanceTransaction; onDelete: (id: string) => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
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
          {t.description || "—"} · {new Date(t.transaction_date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
        </p>
      </div>
      <span style={{ fontSize: "13px", fontWeight: 700, fontFamily: "var(--font-sans)", color: t.type === "income" ? "#22c55e" : "#f87171", flexShrink: 0 }}>
        {t.type === "income" ? "+" : "-"}{fmt(Number(t.amount))}
      </span>
      <button
        onClick={() => onDelete(t.id)}
        style={{ opacity: hovered ? 1 : 0, background: "none", border: "none", cursor: "pointer", color: "#f87171", padding: "2px", transition: "opacity 0.15s", flexShrink: 0 }}
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type AccountType = "pessoal" | "empresa";
type Tab = "painel" | "relatorios" | "planejar" | "calendario";

interface Props { userEmail: string; }

export default function FinancasContent({ userEmail }: Props) {
  const now = useMemo(() => new Date(), []);

  // State
  const [accountType, setAccountType] = useState<AccountType>("pessoal");
  const [tab, setTab] = useState<Tab>("painel");
  const [loading, setLoading] = useState(true);

  // Data
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<{ month: string; income: number; expense: number }[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [events, setEvents] = useState<FinancialEvent[]>([]);

  // Calendar
  const [calendarDate, setCalendarDate] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));

  // Modals
  const [modal, setModal] = useState<null | "transaction" | "budget" | "goal" | "event">(null);
  const [modalTxType, setModalTxType] = useState<"income" | "expense">("expense");
  const [txForm, setTxForm]       = useState({ category: "", description: "", amount: "", date: now.toISOString().split("T")[0] });
  const [budgetForm, setBudgetForm] = useState({ category: "", monthly_limit: "", alert_threshold: "80" });
  const [goalForm, setGoalForm]   = useState({ title: "", category: "", target_amount: "", current_amount: "0", target_date: "", monthly_contribution: "", description: "" });
  const [eventForm, setEventForm] = useState({ title: "", event_type: "vencimento", event_date: now.toISOString().split("T")[0], amount: "", description: "", is_recurring: false, category: "" });
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState("");

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const year  = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1).toISOString().split("T")[0];
    const lastDay  = new Date(year, month + 1, 0).toISOString().split("T")[0];

    // Current month transactions
    const { data: txData } = await supabase
      .from("finance_transaction")
      .select("*")
      .eq("user_email", userEmail)
      .eq("account_type", accountType)
      .gte("transaction_date", firstDay)
      .lte("transaction_date", lastDay)
      .order("transaction_date", { ascending: false });
    setTransactions((txData ?? []) as FinanceTransaction[]);

    // Last 6 months trend
    const sixMonthsAgo = new Date(year, month - 5, 1).toISOString().split("T")[0];
    const { data: trendData } = await supabase
      .from("finance_transaction")
      .select("type, amount, transaction_date")
      .eq("user_email", userEmail)
      .eq("account_type", accountType)
      .gte("transaction_date", sixMonthsAgo)
      .lte("transaction_date", lastDay);

    const trendMap: Record<string, { income: number; expense: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, month - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      trendMap[key] = { income: 0, expense: 0 };
    }
    (trendData ?? []).forEach((t: { type: string; amount: number; transaction_date: string }) => {
      const key = t.transaction_date.slice(0, 7);
      if (trendMap[key]) {
        if (t.type === "income") trendMap[key].income += Number(t.amount);
        else trendMap[key].expense += Number(t.amount);
      }
    });
    setMonthlyTrend(
      Object.entries(trendMap).map(([key, val]) => ({
        month: MONTHS_PT[parseInt(key.split("-")[1]) - 1].slice(0, 3),
        ...val,
      }))
    );

    // Budgets
    const { data: budgetData } = await supabase
      .from("budget")
      .select("*")
      .eq("user_email", userEmail)
      .eq("account_type", accountType)
      .eq("month", month + 1)
      .eq("year", year)
      .eq("is_active", true);
    setBudgets((budgetData ?? []) as Budget[]);

    // Goals (shared, no account_type)
    const { data: goalData } = await supabase
      .from("financial_goal")
      .select("*")
      .eq("user_email", userEmail)
      .order("created_at", { ascending: false });
    setGoals((goalData ?? []) as FinancialGoal[]);

    // Events (2 months)
    const eventsTo = new Date(year, month + 2, 0).toISOString().split("T")[0];
    const { data: eventData } = await supabase
      .from("financial_event")
      .select("*")
      .eq("user_email", userEmail)
      .eq("account_type", accountType)
      .gte("event_date", firstDay)
      .lte("event_date", eventsTo)
      .order("event_date", { ascending: true });
    setEvents((eventData ?? []) as FinancialEvent[]);

    setLoading(false);
  }, [userEmail, accountType, now]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Computed ──────────────────────────────────────────────────────────────

  const income  = useMemo(() => transactions.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0), [transactions]);
  const expense = useMemo(() => transactions.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0), [transactions]);
  const balance = income - expense;

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.filter(t => t.type === "expense").forEach(t => {
      map[t.category] = (map[t.category] ?? 0) + Number(t.amount);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [transactions]);

  const maxCategory = byCategory[0]?.[1] ?? 1;

  const calEvents = useMemo(() => {
    const map: Record<string, FinancialEvent[]> = {};
    events.forEach(e => {
      const key = e.event_date.slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(e);
    });
    return map;
  }, [events]);

  const calYear  = calendarDate.getFullYear();
  const calMonth = calendarDate.getMonth();
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth    = new Date(calYear, calMonth + 1, 0).getDate();

  const trendMax = Math.max(...monthlyTrend.map(m => Math.max(m.income, m.expense)), 1);

  // ── Save handlers ─────────────────────────────────────────────────────────

  async function saveTx() {
    if (!txForm.category || !txForm.amount) { setFormError("Preencha categoria e valor."); return; }
    const amount = parseFloat(txForm.amount.replace(",", "."));
    if (isNaN(amount) || amount <= 0) { setFormError("Valor inválido."); return; }
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("finance_transaction").insert({
      user_email: userEmail, account_type: accountType,
      type: modalTxType, category: txForm.category,
      description: txForm.description, amount, transaction_date: txForm.date,
    });
    if (error) { setFormError("Erro ao salvar."); setSaving(false); return; }
    setModal(null); setSaving(false); fetchData();
  }

  async function saveBudget() {
    if (!budgetForm.category || !budgetForm.monthly_limit) { setFormError("Preencha todos os campos."); return; }
    setSaving(true);
    const supabase = createClient();
    await supabase.from("budget").insert({
      user_email: userEmail, account_type: accountType,
      category: budgetForm.category,
      monthly_limit: parseFloat(budgetForm.monthly_limit),
      alert_threshold: parseFloat(budgetForm.alert_threshold),
      month: now.getMonth() + 1, year: now.getFullYear(),
    });
    setModal(null); setSaving(false); fetchData();
  }

  async function saveGoal() {
    if (!goalForm.title || !goalForm.target_amount || !goalForm.target_date) { setFormError("Preencha os campos obrigatórios."); return; }
    setSaving(true);
    const supabase = createClient();
    await supabase.from("financial_goal").insert({
      user_email: userEmail, title: goalForm.title,
      category: goalForm.category, description: goalForm.description,
      target_amount: parseFloat(goalForm.target_amount),
      current_amount: parseFloat(goalForm.current_amount) || 0,
      target_date: goalForm.target_date,
      monthly_contribution: parseFloat(goalForm.monthly_contribution) || 0,
    });
    setModal(null); setSaving(false); fetchData();
  }

  async function saveEvent() {
    if (!eventForm.title || !eventForm.event_date) { setFormError("Preencha título e data."); return; }
    setSaving(true);
    const supabase = createClient();
    await supabase.from("financial_event").insert({
      user_email: userEmail, account_type: accountType,
      title: eventForm.title, event_type: eventForm.event_type,
      event_date: eventForm.event_date,
      amount: eventForm.amount ? parseFloat(eventForm.amount) : null,
      description: eventForm.description,
      is_recurring: eventForm.is_recurring, category: eventForm.category,
    });
    setModal(null); setSaving(false); fetchData();
  }

  async function deleteTx(id: string) {
    const supabase = createClient();
    await supabase.from("finance_transaction").delete().eq("id", id);
    setTransactions(prev => prev.filter(t => t.id !== id));
  }

  async function deleteGoal(id: string) {
    const supabase = createClient();
    await supabase.from("financial_goal").delete().eq("id", id);
    setGoals(prev => prev.filter(g => g.id !== id));
  }

  async function deleteBudget(id: string) {
    const supabase = createClient();
    await supabase.from("budget").delete().eq("id", id);
    setBudgets(prev => prev.filter(b => b.id !== id));
  }

  function openTxModal(type: "income" | "expense") {
    setModalTxType(type);
    setTxForm({ category: "", description: "", amount: "", date: now.toISOString().split("T")[0] });
    setFormError(""); setModal("transaction");
  }

  // ── Render ────────────────────────────────────────────────────────────────

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
              Gerencie suas receitas e despesas
            </p>
          </div>

          {/* Pessoal / Empresa toggle */}
          <div style={{ display: "flex", gap: "4px", background: "#130f09", border: "1px solid #2a2010", borderRadius: "8px", padding: "4px" }}>
            {(["pessoal", "empresa"] as const).map(type => (
              <button
                key={type}
                onClick={() => setAccountType(type)}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "7px 18px", borderRadius: "6px", border: "none", cursor: "pointer",
                  background: accountType === type ? "linear-gradient(135deg,#C9A84C,#A07820)" : "transparent",
                  color: accountType === type ? "#0d0b07" : "#5a4a2a",
                  fontSize: "13px", fontWeight: 600, fontFamily: "var(--font-sans)", transition: "all 0.2s",
                }}
              >
                {type === "pessoal" ? <User size={13} /> : <Building2 size={13} />}
                {type === "pessoal" ? "Pessoal" : "Empresa"}
              </button>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
          <button
            onClick={() => openTxModal("expense")}
            style={{ display: "flex", alignItems: "center", gap: "6px", background: "linear-gradient(135deg,#C9A84C,#A07820)", border: "none", borderRadius: "8px", padding: "9px 18px", color: "#0d0b07", fontSize: "13px", fontWeight: 600, fontFamily: "var(--font-sans)", cursor: "pointer" }}
          >
            <Plus size={14} /> Nova Transação
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: "6px", background: "#130f09", border: "1px solid #2a2010", borderRadius: "8px", padding: "9px 18px", color: "#9a8a6a", fontSize: "13px", fontFamily: "var(--font-sans)", cursor: "pointer" }}>
            <FileText size={14} /> Importar PDF
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "28px", borderBottom: "1px solid #1a1408" }}>
          {([
            { id: "painel",    label: "Painel",     Icon: LayoutDashboard },
            { id: "relatorios",label: "Relatórios", Icon: BarChart2 },
            { id: "planejar",  label: "Planejar",   Icon: Target },
            { id: "calendario",label: "Calendário", Icon: Calendar },
          ] as const).map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                background: "none", border: "none", cursor: "pointer",
                padding: "8px 16px", marginBottom: "-1px",
                fontSize: "13px", fontFamily: "var(--font-sans)",
                fontWeight: tab === id ? 600 : 400,
                color: tab === id ? "#C9A84C" : "#5a4a2a",
                borderBottom: tab === id ? "2px solid #C9A84C" : "2px solid transparent",
                transition: "all 0.15s",
              }}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#4a3a1a", fontFamily: "var(--font-sans)", fontSize: "13px" }}>
            Carregando...
          </div>
        ) : (
          <>
            {/* ══════════════════ PAINEL ══════════════════ */}
            {tab === "painel" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "24px" }}>
                  <SummaryCard icon={TrendingUp}   label="Entradas"   value={fmt(income)}  color="#22c55e" bg="rgba(34,197,94,0.06)"   border="rgba(34,197,94,0.15)"   sub={`${transactions.filter(t => t.type === "income").length} transações`} />
                  <SummaryCard icon={TrendingDown}  label="Saídas"     value={fmt(expense)} color="#f87171" bg="rgba(248,113,113,0.06)" border="rgba(248,113,113,0.15)" sub={income > 0 ? `${((expense / income) * 100).toFixed(0)}% do orçamento` : "0 transações"} />
                  <SummaryCard icon={Wallet}        label="Saldo Livre" value={fmt(balance)} color="#8b5cf6" bg="rgba(139,92,246,0.06)"  border="rgba(139,92,246,0.15)"  sub="disponível para investir" />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                  {/* Category chart */}
                  <div style={{ background: "#130f09", border: "1px solid rgba(201,168,76,0.08)", borderRadius: "12px", padding: "22px 24px" }}>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-sans)", marginBottom: "4px" }}>Gastos por Categoria</p>
                    <p style={{ fontSize: "11px", color: "#3a2a10", fontFamily: "var(--font-sans)", marginBottom: "18px" }}>Distribuição mensal</p>
                    {byCategory.length === 0 ? (
                      <p style={{ fontSize: "13px", color: "#3a2a10", fontFamily: "var(--font-sans)", textAlign: "center", padding: "24px 0" }}>Sem despesas este mês</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {byCategory.map(([cat, val]) => (
                          <div key={cat}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                              <span style={{ fontSize: "12px", color: "#9a8a6a", fontFamily: "var(--font-sans)" }}>{cat}</span>
                              <span style={{ fontSize: "12px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-sans)" }}>{fmt(val)}</span>
                            </div>
                            <div style={{ height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "3px", overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${(val / maxCategory) * 100}%`, background: CATEGORY_COLORS[cat] ?? "#C9A84C", borderRadius: "3px" }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recent transactions */}
                  <div style={{ background: "#130f09", border: "1px solid rgba(201,168,76,0.08)", borderRadius: "12px", padding: "22px 24px" }}>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-sans)", marginBottom: "18px" }}>Movimentações Recentes</p>
                    {transactions.length === 0 ? (
                      <p style={{ fontSize: "13px", color: "#3a2a10", fontFamily: "var(--font-sans)", textAlign: "center", padding: "24px 0" }}>Nenhuma transação este mês</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        {transactions.slice(0, 8).map(t => (
                          <TxRow key={t.id} t={t} onDelete={deleteTx} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Full table */}
                {transactions.length > 0 && (
                  <div style={{ background: "#130f09", border: "1px solid rgba(201,168,76,0.08)", borderRadius: "12px", padding: "22px 24px" }}>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-sans)", marginBottom: "18px" }}>
                      Transações — {MONTHS_PT[now.getMonth()]} {now.getFullYear()}
                    </p>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          {["Data", "Categoria", "Descrição", "Tipo", "Valor", ""].map(h => (
                            <th key={h} style={{ fontSize: "10px", color: "#4a3a1a", fontFamily: "var(--font-sans)", fontWeight: 600, textAlign: "left", padding: "0 0 10px", letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map(t => (
                          <tr key={t.id} style={{ borderTop: "1px solid rgba(255,255,255,0.03)" }}>
                            <td style={{ padding: "10px 0", fontSize: "12px", color: "#6a5a3a", fontFamily: "var(--font-sans)" }}>
                              {new Date(t.transaction_date + "T12:00:00").toLocaleDateString("pt-BR")}
                            </td>
                            <td style={{ padding: "10px 0", fontSize: "12px", color: "#9a8a6a", fontFamily: "var(--font-sans)" }}>{t.category}</td>
                            <td style={{ padding: "10px 0", fontSize: "12px", color: "#6a5a3a", fontFamily: "var(--font-sans)", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.description || "—"}</td>
                            <td style={{ padding: "10px 0" }}>
                              <span style={{ fontSize: "10px", fontWeight: 600, padding: "3px 8px", borderRadius: "4px", fontFamily: "var(--font-sans)", background: t.type === "income" ? "rgba(34,197,94,0.12)" : "rgba(248,113,113,0.12)", color: t.type === "income" ? "#22c55e" : "#f87171" }}>
                                {t.type === "income" ? "Entrada" : "Saída"}
                              </span>
                            </td>
                            <td style={{ padding: "10px 0", fontSize: "13px", fontWeight: 700, fontFamily: "var(--font-sans)", color: t.type === "income" ? "#22c55e" : "#f87171" }}>
                              {t.type === "income" ? "+" : "-"}{fmt(Number(t.amount))}
                            </td>
                            <td style={{ padding: "10px 0", textAlign: "right" }}>
                              <button onClick={() => deleteTx(t.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#4a3a1a", padding: "2px" }}>
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* ══════════════════ RELATÓRIOS ══════════════════ */}
            {tab === "relatorios" && (
              <>
                {/* Monthly trend bars */}
                <div style={{ background: "#130f09", border: "1px solid rgba(201,168,76,0.08)", borderRadius: "12px", padding: "24px", marginBottom: "20px" }}>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-sans)", marginBottom: "4px" }}>Tendência — Últimos 6 Meses</p>
                  <p style={{ fontSize: "11px", color: "#3a2a10", fontFamily: "var(--font-sans)", marginBottom: "24px" }}>Entradas vs Saídas</p>
                  <div style={{ display: "flex", gap: "10px", alignItems: "flex-end", height: "130px" }}>
                    {monthlyTrend.map(({ month, income: inc, expense: exp }) => (
                      <div key={month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", height: "100%", justifyContent: "flex-end" }}>
                        <div style={{ display: "flex", gap: "3px", alignItems: "flex-end", width: "100%", height: "100px" }}>
                          <div
                            style={{ flex: 1, background: "rgba(34,197,94,0.5)", borderRadius: "3px 3px 0 0", height: `${(inc / trendMax) * 100}%`, minHeight: inc > 0 ? "4px" : "0", transition: "height 0.4s ease" }}
                            title={fmt(inc)}
                          />
                          <div
                            style={{ flex: 1, background: "rgba(248,113,113,0.5)", borderRadius: "3px 3px 0 0", height: `${(exp / trendMax) * 100}%`, minHeight: exp > 0 ? "4px" : "0", transition: "height 0.4s ease" }}
                            title={fmt(exp)}
                          />
                        </div>
                        <span style={{ fontSize: "10px", color: "#5a4a2a", fontFamily: "var(--font-sans)" }}>{month}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: "16px", marginTop: "16px" }}>
                    {[{ color: "rgba(34,197,94,0.5)", label: "Entradas" }, { color: "rgba(248,113,113,0.5)", label: "Saídas" }].map(({ color, label }) => (
                      <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: color }} />
                        <span style={{ fontSize: "11px", color: "#5a4a2a", fontFamily: "var(--font-sans)" }}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  {/* Month summary */}
                  <div style={{ background: "#130f09", border: "1px solid rgba(201,168,76,0.08)", borderRadius: "12px", padding: "24px" }}>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-sans)", marginBottom: "20px" }}>Resumo do Mês</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      {[
                        { label: "Total de entradas",  value: fmt(income),  color: "#22c55e" },
                        { label: "Total de saídas",    value: fmt(expense), color: "#f87171" },
                        { label: "Saldo líquido",      value: fmt(balance), color: "#8b5cf6" },
                        { label: "Taxa de poupança",   value: income > 0 ? `${((balance / income) * 100).toFixed(1)}%` : "—", color: "#C9A84C" },
                        { label: "Nº de transações",   value: `${transactions.length}`, color: "#e8dcc0" },
                      ].map(({ label, value, color }) => (
                        <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "13px", color: "#5a4a2a", fontFamily: "var(--font-sans)" }}>{label}</span>
                          <span style={{ fontSize: "14px", fontWeight: 700, color, fontFamily: "var(--font-sans)" }}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Category % breakdown */}
                  <div style={{ background: "#130f09", border: "1px solid rgba(201,168,76,0.08)", borderRadius: "12px", padding: "24px" }}>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-sans)", marginBottom: "4px" }}>Despesas por Categoria</p>
                    <p style={{ fontSize: "11px", color: "#3a2a10", fontFamily: "var(--font-sans)", marginBottom: "18px" }}>% do total gasto</p>
                    {byCategory.length === 0 ? (
                      <p style={{ fontSize: "13px", color: "#3a2a10", fontFamily: "var(--font-sans)", textAlign: "center", padding: "24px 0" }}>Sem despesas</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {byCategory.map(([cat, val]) => (
                          <div key={cat} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: CATEGORY_COLORS[cat] ?? "#C9A84C", flexShrink: 0 }} />
                            <span style={{ fontSize: "12px", color: "#9a8a6a", fontFamily: "var(--font-sans)", flex: 1 }}>{cat}</span>
                            <span style={{ fontSize: "11px", color: "#5a4a2a", fontFamily: "var(--font-sans)" }}>
                              {expense > 0 ? `${((val / expense) * 100).toFixed(1)}%` : "—"}
                            </span>
                            <span style={{ fontSize: "12px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-sans)" }}>{fmt(val)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ══════════════════ PLANEJAR ══════════════════ */}
            {tab === "planejar" && (
              <>
                {/* Budgets section */}
                <section style={{ marginBottom: "32px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <div>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-sans)", marginBottom: "2px" }}>Orçamentos do Mês</p>
                      <p style={{ fontSize: "11px", color: "#3a2a10", fontFamily: "var(--font-sans)" }}>Limites por categoria — {MONTHS_PT[now.getMonth()]}</p>
                    </div>
                    <button
                      onClick={() => { setBudgetForm({ category: "", monthly_limit: "", alert_threshold: "80" }); setFormError(""); setModal("budget"); }}
                      style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "8px", padding: "7px 14px", color: "#C9A84C", fontSize: "12px", fontWeight: 600, fontFamily: "var(--font-sans)", cursor: "pointer" }}
                    >
                      <Plus size={12} /> Novo Orçamento
                    </button>
                  </div>

                  {budgets.length === 0 ? (
                    <div style={{ background: "#130f09", border: "1px solid rgba(201,168,76,0.08)", borderRadius: "12px", padding: "40px", textAlign: "center" }}>
                      <p style={{ fontSize: "13px", color: "#3a2a10", fontFamily: "var(--font-sans)", marginBottom: "12px" }}>Nenhum orçamento configurado</p>
                      <p style={{ fontSize: "11px", color: "#2a2010", fontFamily: "var(--font-sans)" }}>Defina limites por categoria para controlar seus gastos</p>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      {budgets.map(b => {
                        const spent = byCategory.find(([cat]) => cat === b.category)?.[1] ?? 0;
                        const pct = Math.min((spent / b.monthly_limit) * 100, 100);
                        const over  = spent > b.monthly_limit;
                        const alert = pct >= b.alert_threshold && !over;
                        const barColor = over ? "#f87171" : alert ? "#f59e0b" : "#22c55e";
                        return (
                          <div key={b.id} style={{ background: "#130f09", border: `1px solid ${over ? "rgba(248,113,113,0.2)" : "rgba(201,168,76,0.08)"}`, borderRadius: "10px", padding: "18px 20px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                              <span style={{ fontSize: "13px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-sans)" }}>{b.category}</span>
                              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                {over && <AlertCircle size={13} style={{ color: "#f87171" }} />}
                                <button onClick={() => deleteBudget(b.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#3a2a10", padding: 0 }}>
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                              <span style={{ fontSize: "12px", color: barColor, fontFamily: "var(--font-sans)", fontWeight: 600 }}>{fmt(spent)}</span>
                              <span style={{ fontSize: "12px", color: "#5a4a2a", fontFamily: "var(--font-sans)" }}>de {fmt(b.monthly_limit)}</span>
                            </div>
                            <div style={{ height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "3px", overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: "3px" }} />
                            </div>
                            <p style={{ fontSize: "11px", color: "#3a2a10", fontFamily: "var(--font-sans)", marginTop: "6px" }}>{pct.toFixed(0)}% utilizado</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* Goals section */}
                <section>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <div>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-sans)", marginBottom: "2px" }}>Metas Financeiras</p>
                      <p style={{ fontSize: "11px", color: "#3a2a10", fontFamily: "var(--font-sans)" }}>Objetivos de médio e longo prazo</p>
                    </div>
                    <button
                      onClick={() => { setGoalForm({ title: "", category: "", target_amount: "", current_amount: "0", target_date: "", monthly_contribution: "", description: "" }); setFormError(""); setModal("goal"); }}
                      style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: "8px", padding: "7px 14px", color: "#8b5cf6", fontSize: "12px", fontWeight: 600, fontFamily: "var(--font-sans)", cursor: "pointer" }}
                    >
                      <Plus size={12} /> Nova Meta
                    </button>
                  </div>

                  {goals.length === 0 ? (
                    <div style={{ background: "#130f09", border: "1px solid rgba(201,168,76,0.08)", borderRadius: "12px", padding: "40px", textAlign: "center" }}>
                      <p style={{ fontSize: "13px", color: "#3a2a10", fontFamily: "var(--font-sans)", marginBottom: "12px" }}>Nenhuma meta criada</p>
                      <p style={{ fontSize: "11px", color: "#2a2010", fontFamily: "var(--font-sans)" }}>Defina objetivos financeiros e acompanhe seu progresso</p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {goals.map(g => {
                        const pct = g.target_amount > 0 ? Math.min((Number(g.current_amount) / Number(g.target_amount)) * 100, 100) : 0;
                        const daysLeft = Math.ceil((new Date(g.target_date).getTime() - Date.now()) / 86400000);
                        return (
                          <div key={g.id} style={{ background: "#130f09", border: "1px solid rgba(139,92,246,0.12)", borderRadius: "12px", padding: "20px 24px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                              <div>
                                <p style={{ fontSize: "14px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-sans)", marginBottom: "3px" }}>{g.title}</p>
                                <p style={{ fontSize: "11px", color: "#5a4a2a", fontFamily: "var(--font-sans)" }}>
                                  {g.category} · {daysLeft > 0 ? `${daysLeft} dias restantes` : "Prazo encerrado"}
                                </p>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                {pct >= 100 && <Check size={14} style={{ color: "#22c55e" }} />}
                                <button onClick={() => deleteGoal(g.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#4a3a1a", padding: "2px" }}>
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                              <span style={{ fontSize: "12px", color: "#8b5cf6", fontFamily: "var(--font-sans)", fontWeight: 600 }}>{fmt(Number(g.current_amount))}</span>
                              <span style={{ fontSize: "12px", color: "#5a4a2a", fontFamily: "var(--font-sans)" }}>meta: {fmt(Number(g.target_amount))}</span>
                            </div>
                            <div style={{ height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "3px", overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#8b5cf6,#a78bfa)", borderRadius: "3px" }} />
                            </div>
                            <p style={{ fontSize: "11px", color: "#3a2a10", fontFamily: "var(--font-sans)", marginTop: "6px" }}>
                              {pct.toFixed(1)}% concluído{Number(g.monthly_contribution) > 0 && ` · ${fmt(Number(g.monthly_contribution))}/mês`}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </>
            )}

            {/* ══════════════════ CALENDÁRIO ══════════════════ */}
            {tab === "calendario" && (
              <>
                <div style={{ background: "#130f09", border: "1px solid rgba(201,168,76,0.08)", borderRadius: "12px", padding: "24px", marginBottom: "20px" }}>
                  {/* Calendar nav */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <p style={{ fontSize: "16px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-display)" }}>
                      {MONTHS_PT[calMonth]} {calYear}
                    </p>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button onClick={() => setCalendarDate(new Date(calYear, calMonth - 1, 1))} style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: "6px", padding: "6px 10px", cursor: "pointer", color: "#C9A84C" }}>
                        <ChevronLeft size={14} />
                      </button>
                      <button onClick={() => setCalendarDate(new Date(calYear, calMonth + 1, 1))} style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: "6px", padding: "6px 10px", cursor: "pointer", color: "#C9A84C" }}>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Day headers */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", marginBottom: "4px" }}>
                    {["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"].map(d => (
                      <div key={d} style={{ textAlign: "center", fontSize: "10px", color: "#4a3a1a", fontFamily: "var(--font-sans)", fontWeight: 600, padding: "4px 0", letterSpacing: "0.06em" }}>{d}</div>
                    ))}
                  </div>

                  {/* Calendar grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
                    {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                      <div key={`e${i}`} style={{ height: "56px" }} />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const dateKey = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                      const dayEvts = calEvents[dateKey] ?? [];
                      const isToday = now.getFullYear() === calYear && now.getMonth() === calMonth && now.getDate() === day;
                      return (
                        <div
                          key={day}
                          style={{
                            height: "56px", borderRadius: "6px", padding: "4px 6px",
                            background: isToday ? "rgba(201,168,76,0.1)" : "rgba(255,255,255,0.01)",
                            border: `1px solid ${isToday ? "rgba(201,168,76,0.3)" : "rgba(255,255,255,0.03)"}`,
                          }}
                        >
                          <span style={{ fontSize: "11px", color: isToday ? "#C9A84C" : "#5a4a2a", fontFamily: "var(--font-sans)", fontWeight: isToday ? 700 : 400 }}>{day}</span>
                          <div style={{ display: "flex", flexDirection: "column", gap: "1px", marginTop: "2px" }}>
                            {dayEvts.slice(0, 2).map(e => (
                              <div key={e.id} style={{ fontSize: "9px", color: "#0d0b07", background: EVENT_TYPE_COLORS[e.event_type] ?? "#C9A84C", borderRadius: "3px", padding: "1px 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "var(--font-sans)" }}>
                                {e.title}
                              </div>
                            ))}
                            {dayEvts.length > 2 && <span style={{ fontSize: "9px", color: "#5a4a2a" }}>+{dayEvts.length - 2}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Upcoming events list */}
                <div style={{ background: "#130f09", border: "1px solid rgba(201,168,76,0.08)", borderRadius: "12px", padding: "24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-sans)" }}>Próximos Eventos</p>
                    <button
                      onClick={() => { setEventForm({ title: "", event_type: "vencimento", event_date: now.toISOString().split("T")[0], amount: "", description: "", is_recurring: false, category: "" }); setFormError(""); setModal("event"); }}
                      style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)", borderRadius: "8px", padding: "7px 14px", color: "#06b6d4", fontSize: "12px", fontWeight: 600, fontFamily: "var(--font-sans)", cursor: "pointer" }}
                    >
                      <Plus size={12} /> Novo Evento
                    </button>
                  </div>
                  {events.length === 0 ? (
                    <p style={{ fontSize: "13px", color: "#3a2a10", fontFamily: "var(--font-sans)", textAlign: "center", padding: "24px 0" }}>Nenhum evento próximo</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {events.map(e => (
                        <div key={e.id} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "12px 16px", background: "rgba(255,255,255,0.02)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.03)" }}>
                          <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: `${EVENT_TYPE_COLORS[e.event_type] ?? "#C9A84C"}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <span style={{ fontSize: "12px", fontWeight: 700, color: EVENT_TYPE_COLORS[e.event_type] ?? "#C9A84C", fontFamily: "var(--font-sans)" }}>
                              {new Date(e.event_date + "T12:00:00").getDate()}
                            </span>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: "13px", fontWeight: 500, color: "#e8dcc0", fontFamily: "var(--font-sans)", marginBottom: "2px" }}>{e.title}</p>
                            <p style={{ fontSize: "11px", color: "#4a3a1a", fontFamily: "var(--font-sans)" }}>
                              {new Date(e.event_date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} · {e.event_type}
                              {e.is_recurring && " · recorrente"}
                            </p>
                          </div>
                          {e.amount != null && (
                            <span style={{ fontSize: "13px", fontWeight: 700, color: "#C9A84C", fontFamily: "var(--font-sans)", flexShrink: 0 }}>{fmt(Number(e.amount))}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* ═══════════════════ MODALS ═══════════════════ */}
      {modal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) setModal(null); }}
        >
          <div style={{ background: "#130f09", border: "1px solid rgba(201,168,76,0.15)", borderRadius: "14px", padding: "32px", width: "100%", maxWidth: "440px", boxShadow: "0 24px 64px rgba(0,0,0,0.8)" }}>

            {/* ── Transaction ── */}
            {modal === "transaction" && (
              <>
                <ModalHeader title={`Nova ${modalTxType === "income" ? "Receita" : "Despesa"}`} onClose={() => setModal(null)} />
                <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
                  {(["income", "expense"] as const).map(type => (
                    <button key={type} onClick={() => setModalTxType(type)} style={{
                      flex: 1, padding: "9px", borderRadius: "8px", border: "1px solid", cursor: "pointer",
                      borderColor: modalTxType === type ? (type === "income" ? "rgba(34,197,94,0.4)" : "rgba(248,113,113,0.4)") : "#2a2010",
                      background: modalTxType === type ? (type === "income" ? "rgba(34,197,94,0.1)" : "rgba(248,113,113,0.1)") : "transparent",
                      color: modalTxType === type ? (type === "income" ? "#22c55e" : "#f87171") : "#5a4a2a",
                      fontSize: "13px", fontWeight: 600, fontFamily: "var(--font-sans)",
                    }}>
                      {type === "income" ? "Receita" : "Despesa"}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <FormField label="Categoria">
                    <select value={txForm.category} onChange={e => setTxForm(f => ({ ...f, category: e.target.value }))} style={selectStyle}>
                      <option value="">Selecione...</option>
                      {(modalTxType === "income" ? CATEGORIES_INCOME : CATEGORIES_EXPENSE).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Descrição">
                    <input value={txForm.description} onChange={e => setTxForm(f => ({ ...f, description: e.target.value }))} placeholder="Ex: Uber, Supermercado..." style={inputStyle} />
                  </FormField>
                  <FormField label="Valor (R$)">
                    <input value={txForm.amount} onChange={e => setTxForm(f => ({ ...f, amount: e.target.value }))} placeholder="0,00" type="text" inputMode="decimal" style={inputStyle} />
                  </FormField>
                  <FormField label="Data">
                    <input type="date" value={txForm.date} onChange={e => setTxForm(f => ({ ...f, date: e.target.value }))} style={{ ...inputStyle, colorScheme: "dark" }} />
                  </FormField>
                </div>
                {formError && <p style={{ fontSize: "12px", color: "#f87171", fontFamily: "var(--font-sans)", marginTop: "12px" }}>{formError}</p>}
                <div style={{ marginTop: "20px" }}>
                  <SaveButton saving={saving} onClick={saveTx} label={`Salvar ${modalTxType === "income" ? "Receita" : "Despesa"}`} />
                </div>
              </>
            )}

            {/* ── Budget ── */}
            {modal === "budget" && (
              <>
                <ModalHeader title="Novo Orçamento" onClose={() => setModal(null)} />
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <FormField label="Categoria">
                    <select value={budgetForm.category} onChange={e => setBudgetForm(f => ({ ...f, category: e.target.value }))} style={selectStyle}>
                      <option value="">Selecione...</option>
                      {CATEGORIES_EXPENSE.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Limite Mensal (R$)">
                    <input value={budgetForm.monthly_limit} onChange={e => setBudgetForm(f => ({ ...f, monthly_limit: e.target.value }))} placeholder="0,00" type="text" inputMode="decimal" style={inputStyle} />
                  </FormField>
                  <FormField label="Alerta em (%)">
                    <input value={budgetForm.alert_threshold} onChange={e => setBudgetForm(f => ({ ...f, alert_threshold: e.target.value }))} placeholder="80" type="number" min="1" max="100" style={inputStyle} />
                  </FormField>
                </div>
                {formError && <p style={{ fontSize: "12px", color: "#f87171", fontFamily: "var(--font-sans)", marginTop: "12px" }}>{formError}</p>}
                <div style={{ marginTop: "20px" }}>
                  <SaveButton saving={saving} onClick={saveBudget} label="Salvar Orçamento" />
                </div>
              </>
            )}

            {/* ── Goal ── */}
            {modal === "goal" && (
              <>
                <ModalHeader title="Nova Meta" onClose={() => setModal(null)} />
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <FormField label="Título *">
                    <input value={goalForm.title} onChange={e => setGoalForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Fundo de emergência" style={inputStyle} />
                  </FormField>
                  <FormField label="Categoria">
                    <select value={goalForm.category} onChange={e => setGoalForm(f => ({ ...f, category: e.target.value }))} style={selectStyle}>
                      <option value="">Selecione...</option>
                      {GOAL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Valor Alvo (R$) *">
                    <input value={goalForm.target_amount} onChange={e => setGoalForm(f => ({ ...f, target_amount: e.target.value }))} placeholder="0,00" type="text" inputMode="decimal" style={inputStyle} />
                  </FormField>
                  <FormField label="Valor Atual (R$)">
                    <input value={goalForm.current_amount} onChange={e => setGoalForm(f => ({ ...f, current_amount: e.target.value }))} placeholder="0,00" type="text" inputMode="decimal" style={inputStyle} />
                  </FormField>
                  <FormField label="Contribuição Mensal (R$)">
                    <input value={goalForm.monthly_contribution} onChange={e => setGoalForm(f => ({ ...f, monthly_contribution: e.target.value }))} placeholder="0,00" type="text" inputMode="decimal" style={inputStyle} />
                  </FormField>
                  <FormField label="Prazo *">
                    <input type="date" value={goalForm.target_date} onChange={e => setGoalForm(f => ({ ...f, target_date: e.target.value }))} style={{ ...inputStyle, colorScheme: "dark" }} />
                  </FormField>
                </div>
                {formError && <p style={{ fontSize: "12px", color: "#f87171", fontFamily: "var(--font-sans)", marginTop: "12px" }}>{formError}</p>}
                <div style={{ marginTop: "20px" }}>
                  <SaveButton saving={saving} onClick={saveGoal} label="Salvar Meta" />
                </div>
              </>
            )}

            {/* ── Event ── */}
            {modal === "event" && (
              <>
                <ModalHeader title="Novo Evento" onClose={() => setModal(null)} />
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <FormField label="Título *">
                    <input value={eventForm.title} onChange={e => setEventForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Boleto Internet" style={inputStyle} />
                  </FormField>
                  <FormField label="Tipo">
                    <select value={eventForm.event_type} onChange={e => setEventForm(f => ({ ...f, event_type: e.target.value }))} style={selectStyle}>
                      {EVENT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Data *">
                    <input type="date" value={eventForm.event_date} onChange={e => setEventForm(f => ({ ...f, event_date: e.target.value }))} style={{ ...inputStyle, colorScheme: "dark" }} />
                  </FormField>
                  <FormField label="Valor (R$) — opcional">
                    <input value={eventForm.amount} onChange={e => setEventForm(f => ({ ...f, amount: e.target.value }))} placeholder="0,00" type="text" inputMode="decimal" style={inputStyle} />
                  </FormField>
                  <FormField label="Descrição">
                    <input value={eventForm.description} onChange={e => setEventForm(f => ({ ...f, description: e.target.value }))} placeholder="Detalhes..." style={inputStyle} />
                  </FormField>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <input
                      type="checkbox"
                      id="recurring"
                      checked={eventForm.is_recurring}
                      onChange={e => setEventForm(f => ({ ...f, is_recurring: e.target.checked }))}
                      style={{ accentColor: "#C9A84C", width: "14px", height: "14px", cursor: "pointer" }}
                    />
                    <label htmlFor="recurring" style={{ fontSize: "13px", color: "#7a6a4a", fontFamily: "var(--font-sans)", cursor: "pointer" }}>Recorrente</label>
                  </div>
                </div>
                {formError && <p style={{ fontSize: "12px", color: "#f87171", fontFamily: "var(--font-sans)", marginTop: "12px" }}>{formError}</p>}
                <div style={{ marginTop: "20px" }}>
                  <SaveButton saving={saving} onClick={saveEvent} label="Salvar Evento" />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
