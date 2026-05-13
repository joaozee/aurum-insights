"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  Plus, FileText, TrendingUp, TrendingDown, Wallet,
  Trash2, Target, Calendar, BarChart2, LayoutDashboard,
  Building2, User, ArrowDownLeft, ArrowUpRight, PieChart,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  CHART_PALETTE,
  FINANCE_CATEGORY_COLORS,
  EVENT_TYPE_COLORS,
} from "@/lib/aurum-colors";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import EmpresaFinancas from "./empresa/EmpresaFinancas";
import ReportsExtra from "./reports-extra/ReportsExtra";
import PlanejarPessoal from "./planejar/PlanejarPessoal";
import CalendarioPessoal from "./calendario/CalendarioPessoal";

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
// inputStyle / selectStyle remain because the file uses native <select> elements
// that don't have a stable shadcn equivalent yet; both now reference CSS vars.

const inputStyle: React.CSSProperties = {
  width: "100%", background: "var(--bg-input)", border: "1px solid var(--border-soft)",
  borderRadius: "6px", padding: "10px 12px", color: "var(--text-default)",
  fontSize: "13px", fontFamily: "var(--font-sans)", outline: "none",
  boxSizing: "border-box",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle, cursor: "pointer",
};

// ─── Small helper components ──────────────────────────────────────────────────

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label
        className="block mb-1.5 text-[10px] uppercase tracking-[0.12em]"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </Label>
      {children}
    </div>
  );
}

function SaveButton({ saving, onClick, label }: { saving: boolean; onClick: () => void; label: string }) {
  return (
    <Button
      onClick={onClick}
      disabled={saving}
      variant="gold"
      size="lg"
      className="w-full mt-1 text-sm font-bold tracking-[0.04em]"
    >
      {saving ? "Salvando..." : label}
    </Button>
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
  const isIncome = t.type === "entrada";
  const accentColor = isIncome ? "#34d399" : "#f87171";
  const accentBg = isIncome ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)";
  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        width: "32px", height: "32px", borderRadius: "8px",
        background: accentBg,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        {isIncome
          ? <ArrowDownLeft size={14} style={{ color: accentColor }} />
          : <ArrowUpRight size={14} style={{ color: accentColor }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-default)", fontFamily: "var(--font-sans)", marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {t.category}
        </p>
        <p style={{ fontSize: "11px", color: "var(--text-faint)", fontFamily: "var(--font-sans)" }}>
          {t.description || "—"} · {new Date(t.transaction_date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
        </p>
      </div>
      <span style={{ fontSize: "13px", fontWeight: 700, fontFamily: "var(--font-sans)", fontVariantNumeric: "tabular-nums", color: accentColor, flexShrink: 0 }}>
        {isIncome ? "+" : "-"}{fmt(Number(t.amount))}
      </span>
      <button
        onClick={() => onDelete(t.id)}
        aria-label="Apagar transação"
        style={{ opacity: hovered ? 1 : 0, background: "none", border: "none", cursor: "pointer", color: "var(--negative)", padding: "2px", transition: "opacity 0.15s", flexShrink: 0 }}
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
            <stop offset="0%" stopColor="#34d399" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
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
        {incPath && <path d={incPath} fill="none" stroke="#34d399" strokeWidth={1.5} strokeOpacity={0.6} />}
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
          <circle key={`i${i}`} cx={p.x} cy={p.y} r={hovered?.idx === i ? 4 : 2.5} fill="#34d399" opacity={0.75} />
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
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#34d399" }} />
              <span style={{ fontSize: "11px", color: "#a09068", fontFamily: "var(--font-sans)" }}>Entradas</span>
            </div>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#34d399", fontFamily: "var(--font-sans)" }}>
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

// ─── Mini Sparkline (entrada/saída cards) ───────────────────────────────────

function Sparkline({
  data, color, height = 28, width = 88,
}: { data: number[]; color: string; height?: number; width?: number }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = Math.max(max - min, 1);
  const stepX = width / (data.length - 1);
  const points = data.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      style={{ overflow: "visible" }}
      aria-hidden
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={0.85}
      />
      <circle
        cx={(data.length - 1) * stepX}
        cy={height - ((data[data.length - 1] - min) / range) * height}
        r={2.5}
        fill={color}
      />
    </svg>
  );
}

// ─── Cash Flow Timeline (saldo cumulativo dia-a-dia do mês) ─────────────────

function CashFlowChart({
  points, daysInMonth, dayOfMonth,
}: {
  points: { day: number; balance: number | null }[];
  daysInMonth: number;
  dayOfMonth: number;
}) {
  const [hov, setHov] = useState<number | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const wrapRef = useRef<HTMLDivElement>(null);

  const W = 720, H = 180, PT = 16, PB = 28, PL = 48, PR = 12;
  const cW = W - PL - PR;
  const cH = H - PT - PB;

  const filled = points.filter(p => p.balance !== null) as { day: number; balance: number }[];

  if (filled.length === 0) {
    return (
      <div style={{ height: "180px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: "13px", color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>
          Sem movimentações no mês ainda
        </span>
      </div>
    );
  }

  const maxBal = Math.max(...filled.map(p => p.balance), 1);
  const minBal = Math.min(...filled.map(p => p.balance), 0);
  const range = Math.max(maxBal - minBal, 1);

  const xFor = (day: number) => PL + ((day - 1) / (daysInMonth - 1)) * cW;
  const yFor = (bal: number) => PT + cH - ((bal - minBal) / range) * cH;
  const yZero = yFor(0);

  // Linha principal (cumulativo até hoje)
  const path = filled.map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(p.day).toFixed(1)} ${yFor(p.balance).toFixed(1)}`).join(" ");
  const lastX = xFor(filled[filled.length - 1].day);
  const lastY = yFor(filled[filled.length - 1].balance);
  // Área abaixo da linha
  const area = `${path} L ${lastX.toFixed(1)} ${yZero.toFixed(1)} L ${xFor(filled[0].day).toFixed(1)} ${yZero.toFixed(1)} Z`;

  // Linha vertical "hoje"
  const todayX = xFor(dayOfMonth);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!wrapRef.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    const relX = e.clientX - r.left;
    // Encontra o ponto preenchido mais próximo do cursor
    let bestIdx = -1;
    let bestDist = Infinity;
    filled.forEach((p, i) => {
      const px = (xFor(p.day) / W) * r.width;
      const d = Math.abs(px - relX);
      if (d < bestDist) { bestDist = d; bestIdx = i; }
    });
    if (bestIdx >= 0) {
      setHov(bestIdx);
      setPos({ x: Math.min(relX + 12, r.width - 180), y: e.clientY - r.top - 70 });
    }
  };

  const lineColor = filled[filled.length - 1].balance >= 0 ? "#34d399" : "#f87171";
  const areaColor = filled[filled.length - 1].balance >= 0 ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)";

  return (
    <div ref={wrapRef} style={{ position: "relative" }} onMouseMove={onMove} onMouseLeave={() => setHov(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%">
        {/* Gridlines + labels Y (3 níveis: max, 0, min se negativo) */}
        {[maxBal, 0, minBal].filter((v, i, arr) => arr.indexOf(v) === i).map((v) => {
          const y = yFor(v);
          return (
            <g key={v}>
              <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth={1} strokeDasharray={v === 0 ? "0" : "2,3"} />
              <text x={PL - 6} y={y + 3} textAnchor="end" fontSize={9} fill="var(--text-faint)" fontFamily="var(--font-sans)">
                {v >= 1000 ? `${(v / 1000).toFixed(1)}k` : Math.round(v).toString()}
              </text>
            </g>
          );
        })}

        {/* Área abaixo da linha + linha */}
        <path d={area} fill={areaColor} />
        <path d={path} fill="none" stroke={lineColor} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {/* Linha "hoje" pontilhada */}
        {dayOfMonth < daysInMonth && (
          <line x1={todayX} y1={PT} x2={todayX} y2={PT + cH} stroke="var(--gold)" strokeWidth={1} strokeDasharray="3,3" opacity={0.5} />
        )}

        {/* Ponto do hover */}
        {hov !== null && (
          <circle cx={xFor(filled[hov].day)} cy={yFor(filled[hov].balance)} r={4} fill={lineColor} stroke="var(--bg-card)" strokeWidth={2} />
        )}

        {/* Eixo X: ticks a cada 5 dias */}
        {Array.from({ length: Math.floor(daysInMonth / 5) + 1 }).map((_, i) => {
          const day = Math.min(i * 5 + 1, daysInMonth);
          return (
            <text key={day} x={xFor(day)} y={H - 8} textAnchor="middle" fontSize={9} fill="var(--text-faint)" fontFamily="var(--font-sans)">
              {String(day).padStart(2, "0")}
            </text>
          );
        })}
      </svg>

      {hov !== null && (
        <div style={{
          position: "absolute", left: pos.x, top: Math.max(pos.y, 4),
          pointerEvents: "none", zIndex: 60,
          background: "#16120a", border: "1px solid rgba(201,168,76,0.35)",
          borderRadius: "8px", padding: "8px 12px",
          boxShadow: "0 8px 28px rgba(0,0,0,0.7)", minWidth: "150px",
        }}>
          <p style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-sans)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "4px" }}>
            Dia {String(filled[hov].day).padStart(2, "0")}
          </p>
          <p style={{
            fontSize: "14px", fontWeight: 700,
            color: filled[hov].balance >= 0 ? "#34d399" : "#f87171",
            fontFamily: "var(--font-sans)", fontVariantNumeric: "tabular-nums",
          }}>
            {filled[hov].balance >= 0 ? "+" : ""}{filled[hov].balance.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
          <p style={{ fontSize: "10px", color: "var(--text-faint)", fontFamily: "var(--font-sans)", marginTop: "2px" }}>
            saldo acumulado
          </p>
        </div>
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

  // Delete confirmation — discriminated union by entity kind
  type PendingDelete =
    | { kind: "tx"; tx: FinanceTransaction }
    | { kind: "budget"; budget: Budget }
    | { kind: "goal"; goal: FinancialGoal };
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);

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

  // ── Insights novos ────────────────────────────────────────────────────────

  // Top 3 categorias do mês com share %.
  const topCategories = useMemo(() => {
    if (expense === 0) return [];
    return byCategory.slice(0, 3).map(([cat, val]) => ({
      cat,
      val,
      pct: (val / expense) * 100,
    }));
  }, [byCategory, expense]);

  // Runway: quantos dias o saldo livre cobre se o ritmo atual de gastos
  // se mantiver. Cap em 999 pra UI legível, null se sem gasto ainda.
  // Tom Princípio 3: descritivo, não alarmista.
  const runway = useMemo(() => {
    const dayOfMonth = now.getDate();
    if (expense === 0 || balance <= 0 || dayOfMonth === 0) return null;
    const dailyAvg = expense / dayOfMonth;
    if (dailyAvg <= 0) return null;
    const days = balance / dailyAvg;
    return {
      days: Math.min(days, 999),
      dailyAvg,
    };
  }, [balance, expense, now]);

  // Cash flow do mês corrente: saldo cumulativo dia-a-dia.
  // Adiciona linha do mesmo período do mês anterior pra comparação.
  const cashFlowDaily = useMemo(() => {
    const year = now.getFullYear();
    const month = now.getMonth();
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Mapa dia → delta (entrada - saida) do mês corrente
    const curDelta: Record<number, number> = {};
    for (const t of transactions) {
      const d = new Date(t.transaction_date + "T12:00:00");
      if (d.getFullYear() !== year || d.getMonth() !== month) continue;
      const day = d.getDate();
      const sign = t.type === "entrada" ? 1 : -1;
      curDelta[day] = (curDelta[day] ?? 0) + sign * Number(t.amount);
    }

    // Saldo cumulativo dia-a-dia até o dia atual (futuro fica em null)
    const points: { day: number; balance: number | null }[] = [];
    let running = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      if (day <= dayOfMonth) {
        running += curDelta[day] ?? 0;
        points.push({ day, balance: running });
      } else {
        points.push({ day, balance: null });
      }
    }
    return { points, daysInMonth, dayOfMonth };
  }, [transactions, now]);

  // Sparkline de 6 meses pra mini cards Entradas/Saidas
  const incomeSpark = useMemo(
    () => monthlyTrend.map(m => m.income),
    [monthlyTrend]
  );
  const expenseSpark = useMemo(
    () => monthlyTrend.map(m => m.expense),
    [monthlyTrend]
  );

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

  async function confirmDelete() {
    if (!pendingDelete) return;
    const supabase = createClient();
    if (pendingDelete.kind === "tx") {
      const id = pendingDelete.tx.id;
      const { error } = await supabase.from("finance_transaction").delete().eq("id", id);
      if (error) toast.error("Não consegui apagar a transação.", { description: "Tenta de novo em um instante." });
      else {
        toast.success("Transação apagada.");
        setTransactions(prev => prev.filter(t => t.id !== id));
        setReportTx(prev => prev.filter(t => t.id !== id));
      }
    } else if (pendingDelete.kind === "budget") {
      const id = pendingDelete.budget.id;
      const { error } = await supabase.from("budget").delete().eq("id", id);
      if (error) toast.error("Não consegui remover o orçamento.", { description: "Tenta de novo em um instante." });
      else {
        toast.success("Orçamento removido.");
        setBudgets(prev => prev.filter(b => b.id !== id));
      }
    } else {
      const id = pendingDelete.goal.id;
      const { error } = await supabase.from("financial_goal").delete().eq("id", id);
      if (error) toast.error("Não consegui apagar a meta.", { description: "Tenta de novo em um instante." });
      else {
        toast.success("Meta apagada.");
        setGoals(prev => prev.filter(g => g.id !== id));
      }
    }
    setPendingDelete(null);
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
            <p style={{ fontSize: "10px", fontWeight: 600, color: "var(--gold)", fontFamily: "var(--font-sans)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: "8px" }}>
              {accountType === "pessoal" ? "Pessoal" : "Empresa"}
            </p>
            <h1 style={{ fontSize: "26px", fontWeight: 700, color: "var(--text-strong)", fontFamily: "var(--font-display)", letterSpacing: "-0.01em", marginBottom: "6px", lineHeight: 1.15 }}>
              Finanças
            </h1>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>
              {MONTHS_PT[now.getMonth()]} de {now.getFullYear()}
              {!loading && transactions.length > 0 && (
                <> · <span style={{ fontVariantNumeric: "tabular-nums" }}>{transactions.length}</span> {transactions.length === 1 ? "transação" : "transações"}</>
              )}
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

        {/* Empresa: modulo dedicado (DRE, Balanco, Fluxo, Contas, Centros, Executivo) */}
        {accountType === "empresa" && (
          <EmpresaFinancas
            userEmail={userEmail}
            onOpenTxModal={() => openTxModal("saida")}
          />
        )}

        {/* Action buttons (apenas PF) */}
        {accountType === "pessoal" && (
        <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
          <Button
            variant="gold"
            size="default"
            onClick={() => openTxModal("saida")}
            className="gap-1.5 px-4 text-[13px] font-semibold"
          >
            <Plus size={14} /> Nova Transação
          </Button>
          <Button
            disabled
            variant="outline"
            size="default"
            title="Em breve — leitura automática de extratos PDF"
            className="gap-1.5 px-4 text-[13px] cursor-not-allowed opacity-60"
          >
            <FileText size={14} /> Importar PDF
            <span className="ml-1 text-[9px] uppercase tracking-[0.12em] text-[var(--text-faint)] font-medium">em breve</span>
          </Button>
        </div>
        )}

        {/* Tabs + content (apenas PF) */}
        {accountType === "pessoal" && (
        <>
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
                {/* ── ROW 1 — Hero KPIs assimétricos ─────────────────────
                    Saldo Livre é o número-âncora (2fr, gold). Entradas/Saídas
                    flanqueiam (1fr cada) com sparkline 6m embedded. */}
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                  {/* Saldo Livre — anchor */}
                  <div style={{
                    background: balance >= 0 ? "rgba(201,168,76,0.06)" : "rgba(248,113,113,0.06)",
                    border: `1px solid ${balance >= 0 ? "rgba(201,168,76,0.22)" : "rgba(248,113,113,0.18)"}`,
                    borderRadius: "12px", padding: "22px 26px",
                    display: "flex", flexDirection: "column", justifyContent: "space-between",
                    minHeight: "144px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", fontFamily: "var(--font-sans)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        Saldo Livre
                      </p>
                      <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: balance >= 0 ? "rgba(201,168,76,0.15)" : "rgba(248,113,113,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Wallet size={15} style={{ color: balance >= 0 ? "#C9A84C" : "#f87171" }} />
                      </div>
                    </div>
                    <div>
                      <p style={{
                        fontSize: "32px", fontWeight: 700,
                        color: balance >= 0 ? "#C9A84C" : "#f87171",
                        fontFamily: "var(--font-sans)",
                        fontVariantNumeric: "tabular-nums",
                        lineHeight: 1, marginBottom: "8px",
                      }}>
                        {fmt(balance)}
                      </p>
                      <p style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>
                        {balance > 0
                          ? `disponível para investir · ${income > 0 ? `${((balance / income) * 100).toFixed(0)}% das entradas guardadas` : "este mês"}`
                          : balance < 0 ? "déficit no mês"
                          : "no equilíbrio"}
                      </p>
                    </div>
                  </div>

                  {/* Entradas com sparkline */}
                  <div style={{
                    background: "rgba(52,211,153,0.06)",
                    border: "1px solid rgba(52,211,153,0.15)",
                    borderRadius: "12px", padding: "18px 20px",
                    display: "flex", flexDirection: "column", justifyContent: "space-between",
                    minHeight: "144px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", fontFamily: "var(--font-sans)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        Entradas
                      </p>
                      <ArrowDownLeft size={14} style={{ color: "#34d399" }} />
                    </div>
                    <div>
                      <p style={{ fontSize: "20px", fontWeight: 700, color: "#34d399", fontFamily: "var(--font-sans)", fontVariantNumeric: "tabular-nums", lineHeight: 1, marginBottom: "8px" }}>
                        {fmt(income)}
                      </p>
                      {incomeSpark.length >= 2 && (
                        <div style={{ marginBottom: "4px" }}>
                          <Sparkline data={incomeSpark} color="#34d399" />
                        </div>
                      )}
                      <p style={{ fontSize: "10px", color: "var(--text-faint)", fontFamily: "var(--font-sans)" }}>
                        últimos {incomeSpark.length} meses
                      </p>
                    </div>
                  </div>

                  {/* Saídas com sparkline */}
                  <div style={{
                    background: "rgba(248,113,113,0.06)",
                    border: "1px solid rgba(248,113,113,0.15)",
                    borderRadius: "12px", padding: "18px 20px",
                    display: "flex", flexDirection: "column", justifyContent: "space-between",
                    minHeight: "144px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", fontFamily: "var(--font-sans)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        Saídas
                      </p>
                      <ArrowUpRight size={14} style={{ color: "#f87171" }} />
                    </div>
                    <div>
                      <p style={{ fontSize: "20px", fontWeight: 700, color: "#f87171", fontFamily: "var(--font-sans)", fontVariantNumeric: "tabular-nums", lineHeight: 1, marginBottom: "8px" }}>
                        {fmt(expense)}
                      </p>
                      {expenseSpark.length >= 2 && (
                        <div style={{ marginBottom: "4px" }}>
                          <Sparkline data={expenseSpark} color="#f87171" />
                        </div>
                      )}
                      <p style={{ fontSize: "10px", color: "var(--text-faint)", fontFamily: "var(--font-sans)" }}>
                        últimos {expenseSpark.length} meses
                      </p>
                    </div>
                  </div>
                </div>

                {/* ── ROW 2 — Cash Flow Timeline (full width) ─────────────
                    Linha do saldo correndo dia-a-dia. Visualiza o pulso
                    do mês e quando entradas/saídas batem. */}
                <div style={{
                  background: "#130f09",
                  border: "1px solid rgba(201,168,76,0.1)",
                  borderRadius: "12px", padding: "20px 24px",
                  marginBottom: "16px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                    <div>
                      <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-default)", fontFamily: "var(--font-display)", marginBottom: "2px" }}>
                        Fluxo de Caixa
                      </p>
                      <p style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>
                        Saldo acumulado dia-a-dia · {MONTHS_PT[now.getMonth()]} de {now.getFullYear()}
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "10px", color: "var(--text-faint)", fontFamily: "var(--font-sans)" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ width: "10px", height: "2px", background: balance >= 0 ? "#34d399" : "#f87171" }} /> saldo
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ width: "10px", height: "2px", background: "var(--gold)", opacity: 0.5, borderTop: "1px dashed currentColor" }} /> hoje
                      </span>
                    </div>
                  </div>
                  <CashFlowChart
                    points={cashFlowDaily.points}
                    daysInMonth={cashFlowDaily.daysInMonth}
                    dayOfMonth={cashFlowDaily.dayOfMonth}
                  />
                </div>

                {/* ── ROW 3 — Insights compactos ─────────────────────────
                    3 cards: Top Categorias / Runway / Comparativo Mensal.
                    Cada um responde a uma pergunta concreta do usuário. */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                  {/* Top 3 Categorias */}
                  <div style={{
                    background: "#130f09",
                    border: "1px solid rgba(201,168,76,0.1)",
                    borderRadius: "12px", padding: "18px 22px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                      <p style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", fontFamily: "var(--font-sans)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        Onde foi o dinheiro
                      </p>
                      <PieChart size={13} style={{ color: "var(--gold)" }} />
                    </div>
                    {topCategories.length === 0 ? (
                      <p style={{ fontSize: "12px", color: "var(--text-faint)", fontFamily: "var(--font-sans)" }}>
                        Sem despesas este mês.
                      </p>
                    ) : (
                      <ul style={{ display: "flex", flexDirection: "column", gap: "10px", padding: 0, margin: 0, listStyle: "none" }}>
                        {topCategories.map(({ cat, val, pct }) => (
                          <li key={cat}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: CATEGORY_COLORS[cat] ?? "#C9A84C", flexShrink: 0 }} />
                                <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-default)", fontFamily: "var(--font-sans)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {cat}
                                </span>
                              </div>
                              <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-default)", fontFamily: "var(--font-sans)", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
                                {fmt(val)}
                              </span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <div style={{ flex: 1, height: "4px", background: "rgba(255,255,255,0.04)", borderRadius: "2px", overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: CATEGORY_COLORS[cat] ?? "#C9A84C", borderRadius: "2px" }} />
                              </div>
                              <span style={{ fontSize: "10px", color: "var(--text-faint)", fontFamily: "var(--font-sans)", fontVariantNumeric: "tabular-nums", minWidth: "32px", textAlign: "right" }}>
                                {pct.toFixed(0)}%
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Runway de Patrimônio */}
                  <div style={{
                    background: "#130f09",
                    border: "1px solid rgba(201,168,76,0.1)",
                    borderRadius: "12px", padding: "18px 22px",
                    display: "flex", flexDirection: "column", justifyContent: "space-between",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                      <p style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", fontFamily: "var(--font-sans)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        Runway do saldo
                      </p>
                      <Calendar size={13} style={{ color: "var(--gold)" }} />
                    </div>
                    {runway === null ? (
                      <div>
                        <p style={{ fontSize: "13px", color: "var(--text-muted)", fontFamily: "var(--font-sans)", lineHeight: 1.5, marginBottom: "4px" }}>
                          {balance <= 0 ? "Sem saldo livre pra projetar." : "Sem despesas registradas ainda."}
                        </p>
                        <p style={{ fontSize: "11px", color: "var(--text-faint)", fontFamily: "var(--font-sans)" }}>
                          {balance <= 0 ? "Reduza saídas ou registre entradas." : "Lance ao menos 1 saída pra calcular."}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "8px" }}>
                          <span style={{ fontSize: "28px", fontWeight: 700, color: "var(--gold)", fontFamily: "var(--font-sans)", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                            {runway.days >= 999 ? "999+" : Math.round(runway.days)}
                          </span>
                          <span style={{ fontSize: "13px", color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>
                            {runway.days >= 999 || Math.round(runway.days) === 1 ? "dia" : "dias"}
                          </span>
                        </div>
                        <p style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-sans)", lineHeight: 1.5 }}>
                          Seu saldo cobre esse período no ritmo atual de{" "}
                          <span style={{ color: "var(--text-default)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                            {fmt(runway.dailyAvg)}
                          </span>
                          /dia.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Comparativo mensal (consolidado, mais compacto) */}
                  <div style={{
                    background: "#130f09",
                    border: "1px solid rgba(201,168,76,0.1)",
                    borderRadius: "12px", padding: "18px 22px",
                    display: "flex", flexDirection: "column", justifyContent: "space-between",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                      <p style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", fontFamily: "var(--font-sans)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        Vs. mês anterior
                      </p>
                      <BarChart2 size={13} style={{ color: "var(--gold)" }} />
                    </div>
                    {!monthCompare ? (
                      <div>
                        <p style={{ fontSize: "13px", color: "var(--text-muted)", fontFamily: "var(--font-sans)", lineHeight: 1.5, marginBottom: "4px" }}>
                          Aguardando histórico.
                        </p>
                        <p style={{ fontSize: "11px", color: "var(--text-faint)", fontFamily: "var(--font-sans)" }}>
                          Disponível a partir do 2º mês de uso.
                        </p>
                      </div>
                    ) : monthCompare.direction === "flat" ? (
                      <p style={{ fontSize: "13px", color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>
                        Gastos iguais a {monthCompare.prevMonthName}.
                      </p>
                    ) : (
                      <div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "8px" }}>
                          <span style={{
                            fontSize: "28px", fontWeight: 700,
                            color: monthCompare.direction === "down" ? "#34d399" : "#f87171",
                            fontFamily: "var(--font-sans)", fontVariantNumeric: "tabular-nums", lineHeight: 1,
                          }}>
                            {monthCompare.direction === "down" ? "−" : "+"}{Math.abs(monthCompare.pct).toFixed(0)}%
                          </span>
                        </div>
                        <p style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-sans)", lineHeight: 1.5 }}>
                          {monthCompare.direction === "down" ? "Menos" : "Mais"} que {monthCompare.prevMonthName} ·{" "}
                          <span style={{ color: "var(--text-default)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                            {monthCompare.direction === "down" ? "−" : "+"}{fmt(monthCompare.diffAbs)}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── ROW 3.5 — Projeção compacta (full width banner) ────
                    Strip horizontal com a projeção. Antes era card próprio.
                    Agora vira insight inline no fluxo. */}
                {expense > 0 && (
                  <div style={{
                    background: "rgba(201,168,76,0.04)",
                    border: "1px solid var(--border-soft)",
                    borderRadius: "10px",
                    padding: "12px 18px",
                    marginBottom: "20px",
                    display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <Calendar size={14} style={{ color: "var(--gold)" }} />
                      <span style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>
                        No ritmo atual, vai gastar{" "}
                        <span style={{ color: "#f87171", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                          {fmt(projection.projectedExpense)}
                        </span>
                        {" "}até dia {projection.daysInMonth}.
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-faint)", fontFamily: "var(--font-sans)" }}>
                        {projection.projectedBalance >= 0 ? "Vai sobrar" : "Vai faltar"}
                      </span>
                      <span style={{
                        fontSize: "13px", fontWeight: 700,
                        color: projection.projectedBalance >= 0 ? "#34d399" : "#f87171",
                        fontFamily: "var(--font-sans)", fontVariantNumeric: "tabular-nums",
                      }}>
                        {fmt(Math.abs(projection.projectedBalance))}
                      </span>
                    </div>
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                  {/* Category chart */}
                  <div style={{ background: "#130f09", border: "1px solid rgba(201,168,76,0.08)", borderRadius: "12px", padding: "22px 24px" }}>
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-display)", marginBottom: "4px" }}>Gastos por Categoria</p>
                    <p style={{ fontSize: "11px", color: "#a09068", fontFamily: "var(--font-sans)", marginBottom: "18px" }}>Distribuição mensal</p>
                    {byCategory.length === 0 ? (
                      <p style={{ fontSize: "13px", color: "var(--text-muted)", fontFamily: "var(--font-sans)", textAlign: "center", padding: "24px 0" }}>Sem despesas este mês</p>
                    ) : byCategory.length === 1 ? (
                      // Donut com 1 fatia = 100% comunica nada. Mostra a categoria
                      // como linha simples + hint pra adicionar mais.
                      <div style={{ display: "flex", flexDirection: "column", gap: "14px", paddingTop: "4px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: CATEGORY_COLORS[byCategory[0][0]] ?? "#C9A84C" }} />
                            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-default)", fontFamily: "var(--font-sans)" }}>
                              {byCategory[0][0]}
                            </span>
                          </div>
                          <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-strong)", fontFamily: "var(--font-sans)", fontVariantNumeric: "tabular-nums" }}>
                            {fmt(byCategory[0][1])}
                          </span>
                        </div>
                        <div style={{ height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "3px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: "100%", background: CATEGORY_COLORS[byCategory[0][0]] ?? "#C9A84C", borderRadius: "3px" }} />
                        </div>
                        <p style={{ fontSize: "11px", color: "var(--text-faint)", fontFamily: "var(--font-sans)", lineHeight: 1.5, marginTop: "2px" }}>
                          Adicione transações de outras categorias para ver a distribuição em donut.
                        </p>
                      </div>
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
                          <TxRow key={t.id} t={t} onDelete={(id) => {
                            const tx = transactions.find(x => x.id === id);
                            if (tx) setPendingDelete({ kind: "tx", tx });
                          }} />
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
                              <span style={{ fontSize: "10px", fontWeight: 600, padding: "3px 8px", borderRadius: "4px", fontFamily: "var(--font-sans)", background: t.type === "entrada" ? "rgba(34,197,94,0.12)" : "rgba(248,113,113,0.12)", color: t.type === "entrada" ? "#34d399" : "#f87171" }}>
                                {t.type === "entrada" ? "Entrada" : "Saída"}
                              </span>
                            </td>
                            <td style={{ padding: "10px 0", fontSize: "13px", fontWeight: 700, fontFamily: "var(--font-sans)", color: t.type === "entrada" ? "#34d399" : "#f87171" }}>
                              {t.type === "entrada" ? "+" : "-"}{fmt(Number(t.amount))}
                            </td>
                            <td style={{ padding: "10px 0", textAlign: "right" }}>
                              <button
                                onClick={() => setPendingDelete({ kind: "tx", tx: t })}
                                aria-label="Apagar transação"
                                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-faint)", padding: "2px" }}
                                className="aurum-hover-gold aurum-hover-transition"
                              >
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
                    { label: "Entradas",         value: fmt(reportIncome),  color: "#34d399", icon: TrendingUp,   sub: `${reportTx.filter(t => t.type === "entrada").length} transações` },
                    { label: "Gastos",           value: fmt(reportExpense), color: "#f87171", icon: TrendingDown, sub: `Média ${fmt(reportExpense / reportMonthsCount)}/mês` },
                    { label: "Saldo",            value: fmt(reportBalance), color: reportBalance >= 0 ? CHART_PALETTE[5] : "#f87171", icon: Wallet, sub: "Entradas − Gastos" },
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
                      {[{ color: "#C9A84C", label: "Saídas" }, { color: "#34d399", label: "Entradas" }].map(({ color, label }) => (
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

                {/* Heatmap + Fixos/Variáveis + Análise & Insights + Exportação */}
                <ReportsExtra
                  reportTx={reportTx}
                  reportTrend={reportTrend}
                  reportPeriodLabel={reportPeriodLabel}
                  selectedCategory={selectedCategory}
                />

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
                            <td style={{ padding: "10px 0", fontSize: "13px", fontWeight: 700, fontFamily: "var(--font-sans)", color: t.type === "entrada" ? "#34d399" : "#f87171", textAlign: "right", whiteSpace: "nowrap" }}>
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
              <PlanejarPessoal
                transactions={transactions}
                monthlyTrend={monthlyTrend}
                budgets={budgets}
                goals={goals}
                byCategory={byCategory}
                onNewBudget={() => { setBudgetForm({ category: "", monthly_limit: "", alert_threshold: "80" }); setFormError(""); setModal("budget"); }}
                onNewGoal={() => { setGoalForm({ title: "", category: "", target_amount: "", current_amount: "0", target_date: "", monthly_contribution: "", description: "" }); setFormError(""); setModal("goal"); }}
                onDeleteBudget={(b) => setPendingDelete({ kind: "budget", budget: b })}
                onDeleteGoal={(g) => setPendingDelete({ kind: "goal", goal: g })}
              />
            )}


            {/* ══════════════════ CALENDÁRIO ══════════════════ */}
            {tab === "calendario" && (
              <CalendarioPessoal
                now={now}
                calendarDate={calendarDate}
                setCalendarDate={setCalendarDate}
                events={events}
                transactions={transactions}
                income={income}
                expense={expense}
                projectedExpense={projection.projectedExpense}
                projectedBalance={projection.projectedBalance}
                onNewEvent={() => {
                  setEventForm({ title: "", event_type: "vencimento", event_date: now.toISOString().split("T")[0], amount: "", description: "", is_recurring: false, category: "" });
                  setFormError("");
                  setModal("event");
                }}
              />
            )}

          </>
        )}
        </>
        )}
      </div>

      {/* ═══════════════════ MODALS ═══════════════════ */}
      <Dialog open={!!modal} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent className="sm:max-w-[440px] bg-card border-[rgba(201,168,76,0.15)]">
          <DialogHeader>
            <DialogTitle className="font-display text-[17px] text-[var(--text-strong)]">
              {modal === "transaction" ? `Nova ${modalTxType === "entrada" ? "Receita" : "Despesa"}` :
               modal === "budget" ? "Novo Orçamento" :
               modal === "goal" ? "Nova Meta" :
               modal === "event" ? "Novo Evento" : ""}
            </DialogTitle>
          </DialogHeader>
          <div>
            {/* ── Transaction ── */}
            {modal === "transaction" && (
              <>
                <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
                  {(["entrada", "saida"] as const).map(type => (
                    <button key={type} onClick={() => setModalTxType(type)} style={{
                      flex: 1, padding: "9px", borderRadius: "8px", border: "1px solid", cursor: "pointer",
                      borderColor: modalTxType === type ? (type === "entrada" ? "rgba(34,197,94,0.4)" : "rgba(248,113,113,0.4)") : "#9a8a6a",
                      background: modalTxType === type ? (type === "entrada" ? "rgba(34,197,94,0.1)" : "rgba(248,113,113,0.1)") : "transparent",
                      color: modalTxType === type ? (type === "entrada" ? "#34d399" : "#f87171") : "#a09068",
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
                {formError && <p style={{ fontSize: "12px", color: "var(--negative)", fontFamily: "var(--font-sans)", marginTop: "12px" }}>{formError}</p>}
                <div style={{ marginTop: "20px" }}>
                  <SaveButton saving={saving} onClick={saveEvent} label="Salvar Evento" />
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation (tx, budget, goal) ── */}
      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent className="sm:max-w-[440px] bg-card border-[rgba(201,168,76,0.15)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-[17px] text-[var(--text-strong)]">
              {pendingDelete?.kind === "tx" ? "Apagar transação?"
                : pendingDelete?.kind === "budget" ? "Remover este orçamento?"
                : "Apagar esta meta?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] leading-relaxed text-[var(--text-body)]">
              {pendingDelete?.kind === "tx" && (
                <>
                  {pendingDelete.tx.type === "entrada" ? "Entrada" : "Saída"} de{" "}
                  <span className="font-semibold text-[var(--text-default)]">{fmt(Number(pendingDelete.tx.amount))}</span>
                  {" em "}
                  <span className="font-semibold text-[var(--text-default)]">{pendingDelete.tx.category}</span>
                  {" sai do mês. O saldo livre recalcula na hora."}
                </>
              )}
              {pendingDelete?.kind === "budget" && (
                <>
                  O limite de{" "}
                  <span className="font-semibold text-[var(--text-default)]">{fmt(pendingDelete.budget.monthly_limit)}</span>
                  {" para "}
                  <span className="font-semibold text-[var(--text-default)]">{pendingDelete.budget.category}</span>
                  {" sai do mês. As transações já lançadas continuam."}
                </>
              )}
              {pendingDelete?.kind === "goal" && (
                <>
                  &ldquo;<span className="font-semibold text-[var(--text-default)]">{pendingDelete.goal.title}</span>&rdquo; e o
                  progresso registrado serão removidos. Não dá pra recuperar depois.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-[13px]">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="text-[13px] bg-[var(--negative)] text-[var(--text-strong)] hover:bg-[var(--negative)]/90"
            >
              {pendingDelete?.kind === "tx" ? "Apagar transação"
                : pendingDelete?.kind === "budget" ? "Remover orçamento"
                : "Apagar meta"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
