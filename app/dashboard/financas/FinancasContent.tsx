"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  Plus, FileText, TrendingUp, TrendingDown, Wallet, X,
  Trash2, Target, Calendar, BarChart2, LayoutDashboard,
  ChevronLeft, ChevronRight, AlertCircle, Check,
  Building2, User,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  FINANCE_CATEGORY_COLORS,
  EVENT_TYPE_COLORS,
} from "@/lib/aurum-colors";

// ─── Types ───────────────────────────────────────────────────────────────────

interface FinanceTransaction {
  id: string;
  account_type: "pessoal" | "empresa";
  type: "entrada" | "saida";
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

// Pessoal
const CATEGORIES_EXPENSE = ["Alimentação","Transporte","Moradia","Saúde","Educação","Lazer","Vestuário","Serviços","Impostos","Outros"];
const CATEGORIES_INCOME  = ["Salário","Freelance","Dividendos","Investimentos","Aluguel","Outros"];

// Empresa
const CATEGORIES_EXPENSE_EMPRESA = ["Fornecedores","Folha de Pagamento","Aluguel Comercial","Marketing","Impostos e Taxas","Serviços / Terceiros","Infraestrutura","Equipamentos","Viagens Corporativas","Logística","Contabilidade / Jurídico","Outros"];
const CATEGORIES_INCOME_EMPRESA  = ["Vendas","Serviços Prestados","Comissões","Contratos","Receitas Financeiras","Investimentos","Outros"];

const GOAL_CATEGORIES    = ["Aposentadoria","Imóvel","Viagem","Educação","Emergência","Veículo","Expansão","Capital de Giro","Outros"];
const EVENT_TYPES        = ["vencimento","meta","receita","despesa","outro"];
const MONTHS_PT          = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

// Category + event-type color mappings live in lib/aurum-colors.ts so the
// dashboard stays on-brand with the warm 8-hue chart palette instead of
// the Tailwind-500 default rainbow.
const CATEGORY_COLORS = FINANCE_CATEGORY_COLORS;

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
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#a09068", padding: 0 }}>
        <X size={18} />
      </button>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: "10px", color: "#a09068", fontFamily: "var(--font-sans)", letterSpacing: "0.12em", textTransform: "uppercase" as const, display: "block", marginBottom: "6px" }}>
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
        <p style={{ fontSize: "11px", color: "#a09068", fontFamily: "var(--font-sans)", marginBottom: "4px" }}>{label}</p>
        <p style={{ fontSize: "20px", fontWeight: 700, color, fontFamily: "var(--font-sans)", lineHeight: 1 }}>{value}</p>
        <p style={{ fontSize: "10px", color: "#857560", fontFamily: "var(--font-sans)", marginTop: "4px" }}>{sub}</p>
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
        <p style={{ fontSize: "11px", color: "#857560", fontFamily: "var(--font-sans)" }}>
          {t.description || "—"} · {new Date(t.transaction_date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
        </p>
      </div>
      <span style={{ fontSize: "13px", fontWeight: 700, fontFamily: "var(--font-sans)", color: t.type === "entrada" ? "#22c55e" : "#f87171", flexShrink: 0 }}>
        {t.type === "entrada" ? "+" : "-"}{fmt(Number(t.amount))}
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

// ─── SVG Chart Helpers ───────────────────────────────────────────────────────

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function pieSlicePath(cx: number, cy: number, r: number, start: number, end: number) {
  if (end - start >= 359.999) {
    return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.001} ${cy - r} Z`;
  }
  const s = polarToCartesian(cx, cy, r, start);
  const e = polarToCartesian(cx, cy, r, end);
  const large = end - start > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y} Z`;
}

function smoothPath(pts: { x: number; y: number }[]) {
  if (pts.length < 2) return "";
  return pts.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    const prev = pts[i - 1];
    const cp1x = (prev.x + p.x) / 2;
    return `${acc} C ${cp1x.toFixed(1)} ${prev.y.toFixed(1)}, ${cp1x.toFixed(1)} ${p.y.toFixed(1)}, ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }, "");
}

// ── Shared tooltip style ──────────────────────────────────────────────────────

function Tooltip({ x, y, children }: { x: number; y: number; children: React.ReactNode }) {
  return (
    <div style={{
      position: "absolute", left: x, top: y, pointerEvents: "none", zIndex: 60,
      background: "#16120a", border: "1px solid rgba(201,168,76,0.35)",
      borderRadius: "8px", padding: "10px 14px",
      boxShadow: "0 8px 28px rgba(0,0,0,0.7)", minWidth: "140px",
    }}>
      {children}
    </div>
  );
}

// ── Bar chart (category expenses) ────────────────────────────────────────────

function BarChartSVG({ data }: { data: [string, number][] }) {
  const [hovered, setHovered] = useState<{ cat: string; val: number } | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const wrapRef = useRef<HTMLDivElement>(null);

  if (data.length === 0) return (
    <div style={{ height: "180px", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ fontSize: "13px", color: "#a09068", fontFamily: "var(--font-sans)" }}>Sem despesas</span>
    </div>
  );

  const W = 360, H = 180, PT = 12, PB = 32, PL = 8, PR = 8;
  const cW = W - PL - PR;
  const cH = H - PT - PB;
  const maxVal = Math.max(...data.map(d => d[1]));
  const bW = Math.min(32, cW / data.length - 6);
  const gap = (cW - bW * data.length) / (data.length + 1);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!wrapRef.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    setPos({ x: Math.min(e.clientX - r.left + 12, r.width - 155), y: e.clientY - r.top - 70 });
  };

  return (
    <div ref={wrapRef} style={{ position: "relative" }} onMouseMove={onMove}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: "visible" }}>
        {[0, 0.25, 0.5, 0.75, 1].map(p => {
          const y = PT + cH - p * cH;
          return <line key={p} x1={PL} y1={y} x2={W - PR} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />;
        })}
        {data.map(([cat, val], i) => {
          const bH = Math.max((val / maxVal) * cH, 2);
          const x = PL + gap + i * (bW + gap);
          const isHov = hovered?.cat === cat;
          const y = PT + cH - bH - (isHov ? 3 : 0);
          const color = CATEGORY_COLORS[cat] ?? "#C9A84C";
          return (
            <g key={cat} style={{ cursor: "pointer" }}
              onMouseEnter={() => setHovered({ cat, val })}
              onMouseLeave={() => setHovered(null)}>
              <defs>
                <linearGradient id={`bg${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={isHov ? 1 : 0.85} />
                  <stop offset="100%" stopColor={color} stopOpacity={isHov ? 0.7 : 0.45} />
                </linearGradient>
              </defs>
              <rect x={x} y={y} width={bW} height={bH + (isHov ? 3 : 0)} fill={`url(#bg${i})`} rx={3} />
              <text x={x + bW / 2} y={H - 4} textAnchor="middle" fontSize={7.5}
                fill={isHov ? "#C9A84C" : "#a09068"} fontFamily="var(--font-sans)">
                {cat.length > 6 ? cat.slice(0, 5) + "." : cat}
              </text>
            </g>
          );
        })}
      </svg>
      {hovered && (
        <Tooltip x={pos.x} y={Math.max(pos.y, 4)}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "6px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: CATEGORY_COLORS[hovered.cat] ?? "#C9A84C" }} />
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-sans)" }}>{hovered.cat}</span>
          </div>
          <p style={{ fontSize: "14px", fontWeight: 700, color: "#f87171", fontFamily: "var(--font-sans)", margin: 0 }}>{fmt(hovered.val)}</p>
          <p style={{ fontSize: "10px", color: "#a09068", fontFamily: "var(--font-sans)", marginTop: "3px" }}>
            {maxVal > 0 ? `${((hovered.val / maxVal) * 100).toFixed(0)}% do maior gasto` : ""}
          </p>
        </Tooltip>
      )}
    </div>
  );
}

// ── Line chart (monthly trend) ────────────────────────────────────────────────

function LineChartSVG({ data }: { data: { month: string; income: number; expense: number }[] }) {
  const [hovered, setHovered] = useState<{ idx: number } | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const wrapRef = useRef<HTMLDivElement>(null);

  const W = 360, H = 180, PT = 16, PB = 28, PL = 38, PR = 12;
  const cW = W - PL - PR;
  const cH = H - PT - PB;
  const maxVal = Math.max(...data.map(d => Math.max(d.income, d.expense)), 1);
  const n = data.length;

  const toPoint = (val: number, i: number) => ({
    x: PL + (n > 1 ? (i / (n - 1)) * cW : cW / 2),
    y: PT + cH - (val / maxVal) * cH,
  });

  const expPts = data.map((d, i) => toPoint(d.expense, i));
  const incPts = data.map((d, i) => toPoint(d.income, i));
  const expPath = smoothPath(expPts);
  const incPath = smoothPath(incPts);
  const expArea = expPts.length > 0 ? `${expPath} L ${expPts[expPts.length - 1].x} ${PT + cH} L ${expPts[0].x} ${PT + cH} Z` : "";
  const incArea = incPts.length > 0 ? `${incPath} L ${incPts[incPts.length - 1].x} ${PT + cH} L ${incPts[0].x} ${PT + cH} Z` : "";

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!wrapRef.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    setPos({ x: Math.min(e.clientX - r.left + 12, r.width - 175), y: e.clientY - r.top - 85 });
  };

  return (
    <div ref={wrapRef} style={{ position: "relative" }} onMouseMove={onMove}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%">
        <defs>
          <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C9A84C" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#C9A84C" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map(p => {
          const y = PT + cH - p * cH;
          const v = p * maxVal;
          return (
            <g key={p}>
              <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
              <text x={PL - 4} y={y + 3} textAnchor="end" fontSize={7} fill="#857560" fontFamily="var(--font-sans)">
                {v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toFixed(0)}
              </text>
            </g>
          );
        })}

        {incArea && <path d={incArea} fill="url(#incGrad)" />}
        {incPath && <path d={incPath} fill="none" stroke="#22c55e" strokeWidth={1.5} strokeOpacity={0.6} />}
        {expArea && <path d={expArea} fill="url(#expGrad)" />}
        {expPath && <path d={expPath} fill="none" stroke="#C9A84C" strokeWidth={2} />}

        {/* Vertical guide on hover */}
        {hovered !== null && (
          <line
            x1={expPts[hovered.idx].x} y1={PT}
            x2={expPts[hovered.idx].x} y2={PT + cH}
            stroke="rgba(201,168,76,0.2)" strokeWidth={1} strokeDasharray="3,3"
          />
        )}

        {/* Dots with hover zones */}
        {expPts.map((p, i) => {
          const isHov = hovered?.idx === i;
          return (
            <g key={`e${i}`} style={{ cursor: "crosshair" }}
              onMouseEnter={() => setHovered({ idx: i })}
              onMouseLeave={() => setHovered(null)}>
              <circle cx={p.x} cy={p.y} r={14} fill="transparent" />
              <circle cx={p.x} cy={p.y} r={isHov ? 5 : 3} fill="#C9A84C" />
              {isHov && <circle cx={p.x} cy={p.y} r={8} fill="rgba(201,168,76,0.15)" />}
            </g>
          );
        })}
        {incPts.map((p, i) => (
          <circle key={`i${i}`} cx={p.x} cy={p.y} r={hovered?.idx === i ? 4 : 2.5} fill="#22c55e" opacity={0.75} />
        ))}

        {data.map((d, i) => (
          <text key={i} x={PL + (n > 1 ? (i / (n - 1)) * cW : cW / 2)} y={H - 4}
            textAnchor="middle" fontSize={7.5}
            fill={hovered?.idx === i ? "#C9A84C" : "#a09068"} fontFamily="var(--font-sans)">
            {d.month}
          </text>
        ))}
      </svg>

      {hovered !== null && (
        <Tooltip x={pos.x} y={Math.max(pos.y, 4)}>
          <p style={{ fontSize: "11px", fontWeight: 700, color: "#C9A84C", fontFamily: "var(--font-sans)", marginBottom: "8px" }}>
            {data[hovered.idx].month}
          </p>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "20px", marginBottom: "5px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e" }} />
              <span style={{ fontSize: "11px", color: "#a09068", fontFamily: "var(--font-sans)" }}>Entradas</span>
            </div>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#22c55e", fontFamily: "var(--font-sans)" }}>
              {fmt(data[hovered.idx].income)}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#C9A84C" }} />
              <span style={{ fontSize: "11px", color: "#a09068", fontFamily: "var(--font-sans)" }}>Saídas</span>
            </div>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#f87171", fontFamily: "var(--font-sans)" }}>
              {fmt(data[hovered.idx].expense)}
            </span>
          </div>
        </Tooltip>
      )}
    </div>
  );
}

// ── Donut / Pie chart ─────────────────────────────────────────────────────────

function DonutChartSVG({ data, total }: { data: [string, number][]; total: number }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const wrapRef = useRef<HTMLDivElement>(null);

  if (data.length === 0 || total === 0) return (
    <div style={{ height: "160px", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ fontSize: "13px", color: "#a09068", fontFamily: "var(--font-sans)" }}>Sem dados</span>
    </div>
  );

  const CX = 80, CY = 80, R = 68, IR = 42;
  let angle = -90;
  const slices = data.map(([cat, val]) => {
    const sweep = (val / total) * 360;
    const s = { cat, val, start: angle, end: angle + sweep };
    angle += sweep;
    return s;
  });

  const hovSlice = slices.find(s => s.cat === hovered);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!wrapRef.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    setPos({ x: Math.min(e.clientX - r.left + 12, r.width - 165), y: e.clientY - r.top - 75 });
  };

  return (
    <div ref={wrapRef} style={{ display: "flex", alignItems: "center", gap: "24px", position: "relative" }} onMouseMove={onMove}>
      <svg viewBox={`0 0 ${CX * 2} ${CY * 2}`} width={CX * 2} height={CY * 2} style={{ flexShrink: 0 }}>
        {slices.map(({ cat, start, end }) => {
          const isHov = hovered === cat;
          return (
            <path key={cat}
              d={pieSlicePath(CX, CY, isHov ? R + 5 : R, start, end)}
              fill={CATEGORY_COLORS[cat] ?? "#C9A84C"}
              opacity={!hovered || isHov ? 0.9 : 0.35}
              style={{ cursor: "pointer", transition: "opacity 0.15s, d 0.15s" }}
              onMouseEnter={() => setHovered(cat)}
              onMouseLeave={() => setHovered(null)}
            />
          );
        })}
        <circle cx={CX} cy={CY} r={IR} fill="#130f09" />
        <text x={CX} y={CY - 6} textAnchor="middle" fontSize={hovSlice ? 13 : 11}
          fontWeight={700} fill="#e8dcc0" fontFamily="var(--font-sans)">
          {hovSlice ? `${((hovSlice.val / total) * 100).toFixed(0)}%` : data.length}
        </text>
        <text x={CX} y={CY + 9} textAnchor="middle" fontSize={7.5} fill="#a09068" fontFamily="var(--font-sans)">
          {hovSlice ? hovSlice.cat.slice(0, 8) : data.length === 1 ? "categoria" : "categorias"}
        </text>
      </svg>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
        {slices.map(({ cat, val }) => (
          <div key={cat}
            style={{ display: "flex", alignItems: "center", gap: "8px", opacity: !hovered || hovered === cat ? 1 : 0.35, transition: "opacity 0.15s", cursor: "default" }}
            onMouseEnter={() => setHovered(cat)}
            onMouseLeave={() => setHovered(null)}
          >
            <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: CATEGORY_COLORS[cat] ?? "#C9A84C", flexShrink: 0 }} />
            <span style={{ fontSize: "12px", color: "#9a8a6a", fontFamily: "var(--font-sans)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cat}</span>
            <span style={{ fontSize: "11px", color: "#a09068", fontFamily: "var(--font-sans)", flexShrink: 0 }}>
              {`${((val / total) * 100).toFixed(1)}%`}
            </span>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-sans)", flexShrink: 0 }}>{fmt(val)}</span>
          </div>
        ))}
      </div>

      {hovSlice && (
        <Tooltip x={pos.x} y={Math.max(pos.y, 4)}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "8px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: CATEGORY_COLORS[hovSlice.cat] ?? "#C9A84C" }} />
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-sans)" }}>{hovSlice.cat}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", marginBottom: "4px" }}>
            <span style={{ fontSize: "11px", color: "#a09068", fontFamily: "var(--font-sans)" }}>Valor</span>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#f87171", fontFamily: "var(--font-sans)" }}>{fmt(hovSlice.val)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
            <span style={{ fontSize: "11px", color: "#a09068", fontFamily: "var(--font-sans)" }}>Participação</span>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#C9A84C", fontFamily: "var(--font-sans)" }}>
              {`${((hovSlice.val / total) * 100).toFixed(1)}%`}
            </span>
          </div>
        </Tooltip>
      )}
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

  // Relatórios filter
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [reportPeriod, setReportPeriod] = useState<"mes" | "6m" | "12m" | "tudo">("12m");
  const [reportTx, setReportTx] = useState<FinanceTransaction[]>([]);
  const [reportTrend, setReportTrend] = useState<{ month: string; income: number; expense: number }[]>([]);

  // Modals
  const [modal, setModal] = useState<null | "transaction" | "budget" | "goal" | "event">(null);
  const [modalTxType, setModalTxType] = useState<"entrada" | "saida">("saida");
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
        if (t.type === "entrada") trendMap[key].income += Number(t.amount);
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

  // ── Relatórios data (period-aware, separate from current-month state) ─────

  const fetchReportData = useCallback(async () => {
    const supabase = createClient();
    const year  = now.getFullYear();
    const month = now.getMonth();
    const lastDay = new Date(year, month + 1, 0).toISOString().split("T")[0];

    let firstDay: string | null;
    let monthsCount: number;
    if (reportPeriod === "mes") {
      firstDay = new Date(year, month, 1).toISOString().split("T")[0];
      monthsCount = 1;
    } else if (reportPeriod === "6m") {
      firstDay = new Date(year, month - 5, 1).toISOString().split("T")[0];
      monthsCount = 6;
    } else if (reportPeriod === "12m") {
      firstDay = new Date(year, month - 11, 1).toISOString().split("T")[0];
      monthsCount = 12;
    } else { // tudo
      firstDay = null;
      monthsCount = 0;
    }

    let q = supabase
      .from("finance_transaction")
      .select("*")
      .eq("user_email", userEmail)
      .eq("account_type", accountType)
      .lte("transaction_date", lastDay)
      .order("transaction_date", { ascending: false });
    if (firstDay) q = q.gte("transaction_date", firstDay);
    const { data: rows } = await q;
    const list = (rows ?? []) as FinanceTransaction[];
    setReportTx(list);

    // Build monthly trend across the period (or full history if "tudo")
    const trendMap: Record<string, { income: number; expense: number }> = {};
    if (reportPeriod === "tudo") {
      for (const t of list) {
        const key = t.transaction_date.slice(0, 7);
        if (!trendMap[key]) trendMap[key] = { income: 0, expense: 0 };
        if (t.type === "entrada") trendMap[key].income += Number(t.amount);
        else trendMap[key].expense += Number(t.amount);
      }
    } else {
      for (let i = monthsCount - 1; i >= 0; i--) {
        const d = new Date(year, month - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        trendMap[key] = { income: 0, expense: 0 };
      }
      for (const t of list) {
        const key = t.transaction_date.slice(0, 7);
        if (trendMap[key]) {
          if (t.type === "entrada") trendMap[key].income += Number(t.amount);
          else trendMap[key].expense += Number(t.amount);
        }
      }
    }
    const trend = Object.entries(trendMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, v]) => {
        const [y, m] = key.split("-");
        const monthIdx = parseInt(m) - 1;
        const yearShort = y.slice(2);
        return {
          month: reportPeriod === "tudo" || monthsCount > 12
            ? `${MONTHS_PT[monthIdx].slice(0, 3)}/${yearShort}`
            : MONTHS_PT[monthIdx].slice(0, 3),
          ...v,
        };
      });
    setReportTrend(trend);
  }, [userEmail, accountType, now, reportPeriod]);

  useEffect(() => { fetchReportData(); }, [fetchReportData]);

  // ── Computed ──────────────────────────────────────────────────────────────

  const income  = useMemo(() => transactions.filter(t => t.type === "entrada").reduce((s, t) => s + Number(t.amount), 0), [transactions]);
  const expense = useMemo(() => transactions.filter(t => t.type === "saida").reduce((s, t) => s + Number(t.amount), 0), [transactions]);
  const balance = income - expense;

  const projection = useMemo(() => {
    const dayOfMonth   = now.getDate();
    const daysInMonth  = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysLeft     = Math.max(0, daysInMonth - dayOfMonth);
    if (expense === 0) {
      return { projectedExpense: 0, projectedBalance: income, daysLeft, daysInMonth };
    }
    const projectedExpense = (expense / dayOfMonth) * daysInMonth;
    const projectedBalance = income - projectedExpense;
    return { projectedExpense, projectedBalance, daysLeft, daysInMonth };
  }, [expense, income]);

  const monthCompare = useMemo(() => {
    if (monthlyTrend.length < 2) return null;
    const prev = monthlyTrend[monthlyTrend.length - 2];
    if (!prev || prev.expense === 0) return null;
    const diff = expense - prev.expense;
    const pct  = (diff / prev.expense) * 100;
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return {
      pct,
      diffAbs: Math.abs(diff),
      prevMonthName: MONTHS_PT[prevDate.getMonth()].toLowerCase(),
      direction: diff > 0 ? "up" : diff < 0 ? "down" : "flat",
    } as const;
  }, [expense, monthlyTrend]);

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.filter(t => t.type === "saida").forEach(t => {
      map[t.category] = (map[t.category] ?? 0) + Number(t.amount);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [transactions]);

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

  const allCategories = useMemo(() => Array.from(new Set(transactions.map(t => t.category))).sort(), [transactions]);
  const filteredForTable = useMemo(
    () => selectedCategory === "all" ? transactions : transactions.filter(t => t.category === selectedCategory),
    [transactions, selectedCategory]
  );

  // ── Relatórios aggregates (period-scoped) ───────────────────────────────────
  const reportIncome  = useMemo(() => reportTx.filter(t => t.type === "entrada").reduce((s, t) => s + Number(t.amount), 0), [reportTx]);
  const reportExpense = useMemo(() => reportTx.filter(t => t.type === "saida").reduce((s, t) => s + Number(t.amount), 0), [reportTx]);
  const reportBalance = reportIncome - reportExpense;

  const reportByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    reportTx.filter(t => t.type === "saida").forEach(t => {
      map[t.category] = (map[t.category] ?? 0) + Number(t.amount);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [reportTx]);

  const reportCategories = useMemo(() => Array.from(new Set(reportTx.map(t => t.category))).sort(), [reportTx]);
  const reportFiltered   = useMemo(
    () => selectedCategory === "all" ? reportTx : reportTx.filter(t => t.category === selectedCategory),
    [reportTx, selectedCategory]
  );

  const reportPeriodLabel = (() => {
    switch (reportPeriod) {
      case "mes":  return "este mês";
      case "6m":   return "últimos 6 meses";
      case "12m":  return "últimos 12 meses";
      case "tudo": return "todo o histórico";
    }
  })();
  const reportMonthsCount = reportTrend.length || 1;

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
    setModal(null); setSaving(false);
    fetchData();
    fetchReportData();
  }

  async function saveBudget() {
    if (!budgetForm.category || !budgetForm.monthly_limit) { setFormError("Preencha todos os campos."); return; }
    const limit = parseFloat(budgetForm.monthly_limit.replace(",", "."));
    if (!(limit > 0)) { setFormError("Limite mensal inválido."); return; }
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("budget").insert({
      user_email: userEmail, account_type: accountType,
      category: budgetForm.category,
      monthly_limit: limit,
      alert_threshold: parseFloat(budgetForm.alert_threshold) || 80,
      month: now.getMonth() + 1, year: now.getFullYear(),
    });
    if (error) { setFormError("Erro ao salvar orçamento."); setSaving(false); return; }
    setModal(null); setSaving(false); fetchData();
  }

  async function saveGoal() {
    if (!goalForm.title || !goalForm.target_amount || !goalForm.target_date) { setFormError("Preencha os campos obrigatórios."); return; }
    const target = parseFloat(goalForm.target_amount.replace(",", "."));
    if (!(target > 0)) { setFormError("Valor da meta inválido."); return; }
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("financial_goal").insert({
      user_email: userEmail, title: goalForm.title,
      category: goalForm.category, description: goalForm.description,
      target_amount: target,
      current_amount: parseFloat(goalForm.current_amount.replace(",", ".")) || 0,
      target_date: goalForm.target_date,
      monthly_contribution: parseFloat(goalForm.monthly_contribution.replace(",", ".")) || 0,
    });
    if (error) { setFormError("Erro ao salvar meta."); setSaving(false); return; }
    setModal(null); setSaving(false); fetchData();
  }

  async function saveEvent() {
    if (!eventForm.title || !eventForm.event_date) { setFormError("Preencha título e data."); return; }
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("financial_event").insert({
      user_email: userEmail, account_type: accountType,
      title: eventForm.title, event_type: eventForm.event_type,
      event_date: eventForm.event_date,
      amount: eventForm.amount ? parseFloat(eventForm.amount.replace(",", ".")) : null,
      description: eventForm.description,
      is_recurring: eventForm.is_recurring, category: eventForm.category,
    });
    if (error) { setFormError("Erro ao salvar evento."); setSaving(false); return; }
    setModal(null); setSaving(false); fetchData();
  }

  async function deleteTx(id: string) {
    const supabase = createClient();
    await supabase.from("finance_transaction").delete().eq("id", id);
    setTransactions(prev => prev.filter(t => t.id !== id));
    setReportTx(prev => prev.filter(t => t.id !== id));
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

  function openTxModal(type: "entrada" | "saida") {
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
            <p style={{ fontSize: "13px", color: "#a09068", fontFamily: "var(--font-sans)" }}>
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
                  color: accountType === type ? "#0d0b07" : "#a09068",
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
            onClick={() => openTxModal("saida")}
            style={{ display: "flex", alignItems: "center", gap: "6px", background: "linear-gradient(135deg,#C9A84C,#A07820)", border: "none", borderRadius: "8px", padding: "9px 18px", color: "#0d0b07", fontSize: "13px", fontWeight: 600, fontFamily: "var(--font-sans)", cursor: "pointer" }}
          >
            <Plus size={14} /> Nova Transação
          </button>
          <button
            disabled
            title="Em breve — leitura automática de extratos PDF"
            style={{ display: "flex", alignItems: "center", gap: "6px", background: "#130f09", border: "1px solid #2a2010", borderRadius: "8px", padding: "9px 18px", color: "#9a8a6a", fontSize: "13px", fontFamily: "var(--font-sans)", cursor: "not-allowed", opacity: 0.6 }}
          >
            <FileText size={14} /> Importar PDF
            <span style={{ fontSize: "9px", padding: "2px 6px", borderRadius: "4px", background: "rgba(201,168,76,0.1)", color: "#C9A84C", fontWeight: 600, marginLeft: "2px" }}>EM BREVE</span>
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
                color: tab === id ? "#C9A84C" : "#a09068",
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
          <div style={{ textAlign: "center", padding: "80px 0", color: "#857560", fontFamily: "var(--font-sans)", fontSize: "13px" }}>
            Carregando...
          </div>
        ) : (
          <>
            {/* ══════════════════ PAINEL ══════════════════ */}
            {tab === "painel" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                  <SummaryCard icon={TrendingUp}   label="Entradas"   value={fmt(income)}  color="#22c55e" bg="rgba(34,197,94,0.06)"   border="rgba(34,197,94,0.15)"   sub={`${transactions.filter(t => t.type === "entrada").length} transações`} />
                  <SummaryCard icon={TrendingDown}  label="Saídas"     value={fmt(expense)} color="#f87171" bg="rgba(248,113,113,0.06)" border="rgba(248,113,113,0.15)" sub={income > 0 ? `${((expense / income) * 100).toFixed(0)}% das entradas` : `${transactions.filter(t => t.type === "saida").length} transações`} />
                  <SummaryCard
                    icon={Wallet}
                    label="Saldo Livre"
                    value={fmt(balance)}
                    color={balance >= 0 ? "#8b5cf6" : "#f87171"}
                    bg={balance >= 0 ? "rgba(139,92,246,0.06)" : "rgba(248,113,113,0.06)"}
                    border={balance >= 0 ? "rgba(139,92,246,0.15)" : "rgba(248,113,113,0.15)"}
                    sub={balance > 0 ? "disponível para investir" : balance < 0 ? "déficit no mês" : "no equilíbrio"}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
                  {/* Projeção do mês */}
                  <div style={{
                    background: "#130f09",
                    border: "1px solid rgba(201,168,76,0.1)",
                    borderRadius: "12px", padding: "18px 22px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                      <div>
                        <p style={{ fontSize: "11px", color: "#a09068", fontFamily: "var(--font-sans)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "2px" }}>
                          Projeção do mês
                        </p>
                        <p style={{ fontSize: "12px", color: "#9a8a6a", fontFamily: "var(--font-sans)" }}>
                          Faltam {projection.daysLeft} {projection.daysLeft === 1 ? "dia" : "dias"} até dia {projection.daysInMonth}
                        </p>
                      </div>
                      <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(201,168,76,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Calendar size={14} style={{ color: "#C9A84C" }} />
                      </div>
                    </div>
                    {expense === 0 ? (
                      <p style={{ fontSize: "13px", color: "#a09068", fontFamily: "var(--font-sans)" }}>
                        Sem despesas este mês — projeção indisponível.
                      </p>
                    ) : (
                      <>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "8px" }}>
                          <span style={{ fontSize: "10px", color: "#a09068", fontFamily: "var(--font-sans)", letterSpacing: "0.04em" }}>Gastos projetados:</span>
                          <span style={{ fontSize: "18px", fontWeight: 700, color: "#f87171", fontFamily: "var(--font-display)" }}>{fmt(projection.projectedExpense)}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                          <span style={{ fontSize: "10px", color: "#a09068", fontFamily: "var(--font-sans)", letterSpacing: "0.04em" }}>
                            {projection.projectedBalance >= 0 ? "Vai sobrar:" : "Vai faltar:"}
                          </span>
                          <span style={{
                            fontSize: "18px", fontWeight: 700,
                            color: projection.projectedBalance >= 0 ? "#22c55e" : "#f87171",
                            fontFamily: "var(--font-display)",
                          }}>
                            {fmt(Math.abs(projection.projectedBalance))}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Comparativo mês anterior */}
                  <div style={{
                    background: "#130f09",
                    border: "1px solid rgba(201,168,76,0.1)",
                    borderRadius: "12px", padding: "18px 22px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                      <div>
                        <p style={{ fontSize: "11px", color: "#a09068", fontFamily: "var(--font-sans)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "2px" }}>
                          Comparativo mensal
                        </p>
                        <p style={{ fontSize: "12px", color: "#9a8a6a", fontFamily: "var(--font-sans)" }}>
                          {monthCompare ? `vs. ${monthCompare.prevMonthName}` : "Aguardando histórico"}
                        </p>
                      </div>
                      <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(201,168,76,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <BarChart2 size={14} style={{ color: "#C9A84C" }} />
                      </div>
                    </div>
                    {!monthCompare ? (
                      <p style={{ fontSize: "13px", color: "#a09068", fontFamily: "var(--font-sans)" }}>
                        Sem dados do mês anterior para comparar.
                      </p>
                    ) : monthCompare.direction === "flat" ? (
                      <p style={{ fontSize: "13px", color: "#9a8a6a", fontFamily: "var(--font-sans)" }}>
                        Gastos iguais a {monthCompare.prevMonthName}.
                      </p>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{
                          width: "38px", height: "38px", borderRadius: "10px",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: monthCompare.direction === "down" ? "rgba(34,197,94,0.1)" : "rgba(248,113,113,0.1)",
                          color: monthCompare.direction === "down" ? "#22c55e" : "#f87171",
                          flexShrink: 0,
                        }}>
                          {monthCompare.direction === "down"
                            ? <TrendingDown size={18} />
                            : <TrendingUp size={18} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: "15px", fontWeight: 700, color: "#e8dcc0", fontFamily: "var(--font-display)", marginBottom: "2px", letterSpacing: "-0.01em" }}>
                            <span style={{ color: monthCompare.direction === "down" ? "#22c55e" : "#f87171" }}>
                              {Math.abs(monthCompare.pct).toFixed(0)}%
                            </span>{" "}
                            {monthCompare.direction === "down" ? "menores" : "maiores"} que {monthCompare.prevMonthName}
                          </p>
                          <p style={{ fontSize: "11px", color: "#a09068", fontFamily: "var(--font-sans)" }}>
                            {monthCompare.direction === "down" ? "−" : "+"}{fmt(monthCompare.diffAbs)} no total
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                  {/* Category chart */}
                  <div style={{ background: "#130f09", border: "1px solid rgba(201,168,76,0.08)", borderRadius: "12px", padding: "22px 24px" }}>
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-display)", marginBottom: "4px" }}>Gastos por Categoria</p>
                    <p style={{ fontSize: "11px", color: "#a09068", fontFamily: "var(--font-sans)", marginBottom: "18px" }}>Distribuição mensal</p>
                    {byCategory.length === 0 ? (
                      <p style={{ fontSize: "13px", color: "#a09068", fontFamily: "var(--font-sans)", textAlign: "center", padding: "24px 0" }}>Sem despesas este mês</p>
                    ) : (
                      <DonutChartSVG data={byCategory} total={expense} />
                    )}
                  </div>

                  {/* Recent transactions */}
                  <div style={{ background: "#130f09", border: "1px solid rgba(201,168,76,0.08)", borderRadius: "12px", padding: "22px 24px" }}>
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-display)", marginBottom: "18px" }}>Movimentações Recentes</p>
                    {transactions.length === 0 ? (
                      <p style={{ fontSize: "13px", color: "#a09068", fontFamily: "var(--font-sans)", textAlign: "center", padding: "24px 0" }}>Nenhuma transação este mês</p>
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
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-display)", marginBottom: "18px" }}>
                      Transações — {MONTHS_PT[now.getMonth()]} {now.getFullYear()}
                    </p>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          {["Data", "Categoria", "Descrição", "Tipo", "Valor", ""].map(h => (
                            <th key={h} style={{ fontSize: "10px", color: "#857560", fontFamily: "var(--font-sans)", fontWeight: 600, textAlign: "left", padding: "0 0 10px", letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map(t => (
                          <tr key={t.id} className="aurum-zebra-row" style={{ borderTop: "1px solid rgba(255,255,255,0.03)", transition: "background 0.12s" }}>
                            <td style={{ padding: "10px 0", fontSize: "12px", color: "#9a8a6a", fontFamily: "var(--font-sans)" }}>
                              {new Date(t.transaction_date + "T12:00:00").toLocaleDateString("pt-BR")}
                            </td>
                            <td style={{ padding: "10px 0", fontSize: "12px", color: "#9a8a6a", fontFamily: "var(--font-sans)" }}>{t.category}</td>
                            <td style={{ padding: "10px 0", fontSize: "12px", color: "#9a8a6a", fontFamily: "var(--font-sans)", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.description || "—"}</td>
                            <td style={{ padding: "10px 0" }}>
                              <span style={{ fontSize: "10px", fontWeight: 600, padding: "3px 8px", borderRadius: "4px", fontFamily: "var(--font-sans)", background: t.type === "entrada" ? "rgba(34,197,94,0.12)" : "rgba(248,113,113,0.12)", color: t.type === "entrada" ? "#22c55e" : "#f87171" }}>
                                {t.type === "entrada" ? "Entrada" : "Saída"}
                              </span>
                            </td>
                            <td style={{ padding: "10px 0", fontSize: "13px", fontWeight: 700, fontFamily: "var(--font-sans)", color: t.type === "entrada" ? "#22c55e" : "#f87171" }}>
                              {t.type === "entrada" ? "+" : "-"}{fmt(Number(t.amount))}
                            </td>
                            <td style={{ padding: "10px 0", textAlign: "right" }}>
                              <button onClick={() => deleteTx(t.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#857560", padding: "2px" }}>
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
                {/* Period selector */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", gap: "12px", flexWrap: "wrap" }}>
                  <div>
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-display)", marginBottom: "2px" }}>
                      Período do relatório
                    </p>
                    <p style={{ fontSize: "11px", color: "#a09068", fontFamily: "var(--font-sans)" }}>
                      Mostrando {reportPeriodLabel} · {reportTx.length} transaç{reportTx.length === 1 ? "ão" : "ões"}
                    </p>
                  </div>
                  <div style={{
                    display: "inline-flex", padding: "3px",
                    background: "#0d0a06", border: "1px solid rgba(255,255,255,0.05)",
                    borderRadius: "8px",
                  }}>
                    {([
                      { key: "mes",  label: "Este mês" },
                      { key: "6m",   label: "6 meses"  },
                      { key: "12m",  label: "12 meses" },
                      { key: "tudo", label: "Tudo"     },
                    ] as const).map(({ key, label }) => {
                      const active = reportPeriod === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setReportPeriod(key)}
                          style={{
                            background: active ? "rgba(201,168,76,0.14)" : "transparent",
                            border: "none", borderRadius: "6px", padding: "6px 14px",
                            color: active ? "#C9A84C" : "#857560",
                            fontSize: "11px", fontWeight: active ? 600 : 500,
                            fontFamily: "var(--font-sans)", cursor: "pointer",
                            transition: "background 0.15s, color 0.15s",
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Top summary cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "20px" }}>
                  {[
                    { label: "Entradas",         value: fmt(reportIncome),  color: "#22c55e", icon: TrendingUp,   sub: `${reportTx.filter(t => t.type === "entrada").length} transações` },
                    { label: "Gastos",           value: fmt(reportExpense), color: "#f87171", icon: TrendingDown, sub: `Média ${fmt(reportExpense / reportMonthsCount)}/mês` },
                    { label: "Saldo",            value: fmt(reportBalance), color: reportBalance >= 0 ? "#8b5cf6" : "#f87171", icon: Wallet, sub: "Entradas − Gastos" },
                    { label: "Taxa de Poupança", value: reportIncome > 0 ? `${((reportBalance / reportIncome) * 100).toFixed(1)}%` : "—", color: "#C9A84C", icon: Target, sub: "% economizado" },
                  ].map(({ label, value, color, icon: Icon, sub }) => (
                    <div key={label} style={{ background: "#130f09", border: `1px solid ${color}22`, borderRadius: "10px", padding: "16px 18px" }}>
                      <div style={{
                        width: "28px", height: "28px", borderRadius: "7px",
                        background: `${color}1f`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        marginBottom: "10px",
                      }}>
                        <Icon size={14} style={{ color }} />
                      </div>
                      <p style={{ fontSize: "10px", color: "#857560", fontFamily: "var(--font-sans)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px" }}>{label}</p>
                      <p style={{ fontSize: "18px", fontWeight: 700, color, fontFamily: "var(--font-sans)", lineHeight: 1, marginBottom: "4px" }}>{value}</p>
                      <p style={{ fontSize: "10px", color: "#a09068", fontFamily: "var(--font-sans)" }}>{sub}</p>
                    </div>
                  ))}
                </div>

                {/* Category filter */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                  <span style={{ fontSize: "12px", color: "#a09068", fontFamily: "var(--font-sans)", flexShrink: 0 }}>Filtrar por categoria:</span>
                  <select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                    style={{ background: "#130f09", border: "1px solid #2a2010", borderRadius: "6px", padding: "6px 10px", color: "#9a8a6a", fontSize: "12px", fontFamily: "var(--font-sans)", outline: "none", cursor: "pointer" }}
                  >
                    <option value="all">Todas as categorias</option>
                    {reportCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Charts row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                  {/* Bar chart */}
                  <div style={{ background: "#130f09", border: "1px solid rgba(201,168,76,0.08)", borderRadius: "12px", padding: "20px 24px" }}>
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-display)", marginBottom: "4px" }}>Gastos por Categoria</p>
                    <p style={{ fontSize: "11px", color: "#a09068", fontFamily: "var(--font-sans)", marginBottom: "16px" }}>{reportPeriodLabel}</p>
                    <BarChartSVG data={reportByCategory} />
                  </div>

                  {/* Line chart */}
                  <div style={{ background: "#130f09", border: "1px solid rgba(201,168,76,0.08)", borderRadius: "12px", padding: "20px 24px" }}>
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-display)", marginBottom: "4px" }}>Evolução de Gastos</p>
                    <p style={{ fontSize: "11px", color: "#a09068", fontFamily: "var(--font-sans)", marginBottom: "16px" }}>{reportPeriodLabel}</p>
                    <LineChartSVG data={reportTrend} />
                    <div style={{ display: "flex", gap: "16px", marginTop: "8px" }}>
                      {[{ color: "#C9A84C", label: "Saídas" }, { color: "#22c55e", label: "Entradas" }].map(({ color, label }) => (
                        <div key={label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          <div style={{ width: "20px", height: "2px", background: color, borderRadius: "2px" }} />
                          <span style={{ fontSize: "10px", color: "#a09068", fontFamily: "var(--font-sans)" }}>{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Donut chart */}
                <div style={{ background: "#130f09", border: "1px solid rgba(201,168,76,0.08)", borderRadius: "12px", padding: "20px 24px", marginBottom: "20px" }}>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-display)", marginBottom: "4px" }}>Distribuição</p>
                  <p style={{ fontSize: "11px", color: "#a09068", fontFamily: "var(--font-sans)", marginBottom: "20px" }}>% de cada categoria nas despesas — {reportPeriodLabel}</p>
                  <DonutChartSVG data={reportByCategory} total={reportExpense} />
                </div>

                {/* All transactions table */}
                <div style={{ background: "#130f09", border: "1px solid rgba(201,168,76,0.08)", borderRadius: "12px", padding: "20px 24px" }}>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-display)", marginBottom: "18px" }}>
                    Todas as transações
                    <span style={{ marginLeft: "8px", fontSize: "11px", color: "#857560", fontWeight: 400 }}>· {reportPeriodLabel}</span>
                    {selectedCategory !== "all" && (
                      <span style={{ marginLeft: "8px", fontSize: "11px", color: "#C9A84C", fontWeight: 400 }}>— {selectedCategory}</span>
                    )}
                  </p>
                  {reportFiltered.length === 0 ? (
                    <p style={{ fontSize: "13px", color: "#a09068", fontFamily: "var(--font-sans)", textAlign: "center", padding: "24px 0" }}>Nenhuma transação no período</p>
                  ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          {["Data", "Categoria", "Descrição", "Valor"].map(h => (
                            <th key={h} style={{ fontSize: "10px", color: "#857560", fontFamily: "var(--font-sans)", fontWeight: 600, textAlign: "left", padding: "0 0 10px", letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {reportFiltered.map(t => (
                          <tr key={t.id} className="aurum-zebra-row" style={{ borderTop: "1px solid rgba(255,255,255,0.03)", transition: "background 0.12s" }}>
                            <td style={{ padding: "10px 0", fontSize: "12px", color: "#9a8a6a", fontFamily: "var(--font-sans)", whiteSpace: "nowrap" }}>
                              {new Date(t.transaction_date + "T12:00:00").toLocaleDateString("pt-BR")}
                            </td>
                            <td style={{ padding: "10px 12px 10px 0", fontSize: "12px", color: "#9a8a6a", fontFamily: "var(--font-sans)" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: CATEGORY_COLORS[t.category] ?? "#C9A84C", flexShrink: 0 }} />
                                {t.category}
                              </div>
                            </td>
                            <td style={{ padding: "10px 0", fontSize: "12px", color: "#9a8a6a", fontFamily: "var(--font-sans)", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {t.description || "—"}
                            </td>
                            <td style={{ padding: "10px 0", fontSize: "13px", fontWeight: 700, fontFamily: "var(--font-sans)", color: t.type === "entrada" ? "#22c55e" : "#f87171", textAlign: "right", whiteSpace: "nowrap" }}>
                              {t.type === "entrada" ? "+" : "-"}{fmt(Number(t.amount))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
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
                      <p style={{ fontSize: "14px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-display)", marginBottom: "2px" }}>Orçamentos do Mês</p>
                      <p style={{ fontSize: "11px", color: "#a09068", fontFamily: "var(--font-sans)" }}>Limites por categoria — {MONTHS_PT[now.getMonth()]}</p>
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
                      <p style={{ fontSize: "13px", color: "#a09068", fontFamily: "var(--font-sans)", marginBottom: "12px" }}>Nenhum orçamento configurado</p>
                      <p style={{ fontSize: "11px", color: "#9a8a6a", fontFamily: "var(--font-sans)" }}>Defina limites por categoria para controlar seus gastos</p>
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
                              <span style={{ fontSize: "14px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-display)" }}>{b.category}</span>
                              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                {over && <AlertCircle size={13} style={{ color: "#f87171" }} />}
                                <button onClick={() => deleteBudget(b.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#a09068", padding: 0 }}>
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                              <span style={{ fontSize: "12px", color: barColor, fontFamily: "var(--font-sans)", fontWeight: 600 }}>{fmt(spent)}</span>
                              <span style={{ fontSize: "12px", color: "#a09068", fontFamily: "var(--font-sans)" }}>de {fmt(b.monthly_limit)}</span>
                            </div>
                            <div style={{ height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "3px", overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: "3px" }} />
                            </div>
                            <p style={{ fontSize: "11px", color: "#a09068", fontFamily: "var(--font-sans)", marginTop: "6px" }}>{pct.toFixed(0)}% utilizado</p>
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
                      <p style={{ fontSize: "14px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-display)", marginBottom: "2px" }}>Metas Financeiras</p>
                      <p style={{ fontSize: "11px", color: "#a09068", fontFamily: "var(--font-sans)" }}>Objetivos de médio e longo prazo</p>
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
                      <p style={{ fontSize: "13px", color: "#a09068", fontFamily: "var(--font-sans)", marginBottom: "12px" }}>Nenhuma meta criada</p>
                      <p style={{ fontSize: "11px", color: "#9a8a6a", fontFamily: "var(--font-sans)" }}>Defina objetivos financeiros e acompanhe seu progresso</p>
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
                                <p style={{ fontSize: "15px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-display)", marginBottom: "3px" }}>{g.title}</p>
                                <p style={{ fontSize: "11px", color: "#a09068", fontFamily: "var(--font-sans)" }}>
                                  {g.category} · {daysLeft > 0 ? `${daysLeft} dias restantes` : "Prazo encerrado"}
                                </p>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                {pct >= 100 && <Check size={14} style={{ color: "#22c55e" }} />}
                                <button onClick={() => deleteGoal(g.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#857560", padding: "2px" }}>
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                              <span style={{ fontSize: "12px", color: "#8b5cf6", fontFamily: "var(--font-sans)", fontWeight: 600 }}>{fmt(Number(g.current_amount))}</span>
                              <span style={{ fontSize: "12px", color: "#a09068", fontFamily: "var(--font-sans)" }}>meta: {fmt(Number(g.target_amount))}</span>
                            </div>
                            <div style={{ height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "3px", overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#8b5cf6,#a78bfa)", borderRadius: "3px" }} />
                            </div>
                            <p style={{ fontSize: "11px", color: "#a09068", fontFamily: "var(--font-sans)", marginTop: "6px" }}>
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
                      <div key={d} style={{ textAlign: "center", fontSize: "10px", color: "#857560", fontFamily: "var(--font-sans)", fontWeight: 600, padding: "4px 0", letterSpacing: "0.06em" }}>{d}</div>
                    ))}
                  </div>

                  {/* Calendar grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
                    {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                      <div key={`e${i}`} style={{ height: "62px" }} />
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
                            height: "62px", borderRadius: "6px", padding: "4px 6px",
                            background: isToday ? "rgba(201,168,76,0.1)" : "rgba(255,255,255,0.01)",
                            border: `1px solid ${isToday ? "rgba(201,168,76,0.3)" : "rgba(255,255,255,0.03)"}`,
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "11px", color: isToday ? "#C9A84C" : "#a09068", fontFamily: "var(--font-sans)", fontWeight: isToday ? 700 : 400 }}>{day}</span>
                            {dayEvts.length > 0 && (
                              <div style={{ display: "flex", gap: "2px" }}>
                                {Array.from(new Set(dayEvts.map(e => e.event_type))).slice(0, 3).map(t => (
                                  <span
                                    key={t}
                                    title={t.charAt(0).toUpperCase() + t.slice(1)}
                                    style={{ width: "5px", height: "5px", borderRadius: "50%", background: EVENT_TYPE_COLORS[t] ?? "#C9A84C" }}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginTop: "3px" }}>
                            {dayEvts.slice(0, 2).map(e => {
                              const c = EVENT_TYPE_COLORS[e.event_type] ?? "#C9A84C";
                              return (
                                <div
                                  key={e.id}
                                  title={`${e.event_type.charAt(0).toUpperCase() + e.event_type.slice(1)} · ${e.title}`}
                                  style={{
                                    display: "flex", alignItems: "center", gap: "4px",
                                    fontSize: "9px",
                                    color: c,
                                    background: `${c}1f`,
                                    borderRadius: "3px",
                                    padding: "1px 5px",
                                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                    fontFamily: "var(--font-sans)",
                                  }}
                                >
                                  <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: c, flexShrink: 0 }} />
                                  {e.title}
                                </div>
                              );
                            })}
                            {dayEvts.length > 2 && <span style={{ fontSize: "9px", color: "#a09068", fontFamily: "var(--font-sans)" }}>+{dayEvts.length - 2}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Upcoming events list */}
                <div style={{ background: "#130f09", border: "1px solid rgba(201,168,76,0.08)", borderRadius: "12px", padding: "24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-display)" }}>Próximos Eventos</p>
                    <button
                      onClick={() => { setEventForm({ title: "", event_type: "vencimento", event_date: now.toISOString().split("T")[0], amount: "", description: "", is_recurring: false, category: "" }); setFormError(""); setModal("event"); }}
                      style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)", borderRadius: "8px", padding: "7px 14px", color: "#06b6d4", fontSize: "12px", fontWeight: 600, fontFamily: "var(--font-sans)", cursor: "pointer" }}
                    >
                      <Plus size={12} /> Novo Evento
                    </button>
                  </div>
                  {events.length === 0 ? (
                    <p style={{ fontSize: "13px", color: "#a09068", fontFamily: "var(--font-sans)", textAlign: "center", padding: "24px 0" }}>Nenhum evento próximo</p>
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
                            <p style={{ fontSize: "11px", color: "#857560", fontFamily: "var(--font-sans)" }}>
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
                <ModalHeader title={`Nova ${modalTxType === "entrada" ? "Receita" : "Despesa"}`} onClose={() => setModal(null)} />
                <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
                  {(["entrada", "saida"] as const).map(type => (
                    <button key={type} onClick={() => setModalTxType(type)} style={{
                      flex: 1, padding: "9px", borderRadius: "8px", border: "1px solid", cursor: "pointer",
                      borderColor: modalTxType === type ? (type === "entrada" ? "rgba(34,197,94,0.4)" : "rgba(248,113,113,0.4)") : "#9a8a6a",
                      background: modalTxType === type ? (type === "entrada" ? "rgba(34,197,94,0.1)" : "rgba(248,113,113,0.1)") : "transparent",
                      color: modalTxType === type ? (type === "entrada" ? "#22c55e" : "#f87171") : "#a09068",
                      fontSize: "13px", fontWeight: 600, fontFamily: "var(--font-sans)",
                    }}>
                      {type === "entrada" ? "Receita" : "Despesa"}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <FormField label="Categoria">
                    <select value={txForm.category} onChange={e => setTxForm(f => ({ ...f, category: e.target.value }))} style={selectStyle}>
                      <option value="">Selecione...</option>
                      {(accountType === "empresa"
                        ? (modalTxType === "entrada" ? CATEGORIES_INCOME_EMPRESA : CATEGORIES_EXPENSE_EMPRESA)
                        : (modalTxType === "entrada" ? CATEGORIES_INCOME : CATEGORIES_EXPENSE)
                      ).map(c => <option key={c} value={c}>{c}</option>)}
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
                  <SaveButton saving={saving} onClick={saveTx} label={`Salvar ${modalTxType === "entrada" ? "Receita" : "Despesa"}`} />
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
                    <label htmlFor="recurring" style={{ fontSize: "13px", color: "#a09068", fontFamily: "var(--font-sans)", cursor: "pointer" }}>Recorrente</label>
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
