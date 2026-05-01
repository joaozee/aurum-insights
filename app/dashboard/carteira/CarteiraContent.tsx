"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  Plus, Download, RefreshCw, Upload, TrendingUp, TrendingDown,
  Wallet, X, Trash2, MoreVertical, Sparkles, Brain, ChevronLeft,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Asset {
  id: string;
  name: string;
  type: string;
  quantity: number;
  purchase_price: number;
  current_price: number;
  created_at: string;
}

interface Transaction {
  id: string;
  ticker: string;
  type: "compra" | "venda";
  quantity: number;
  price: number;
  total_value: number;
  transaction_date: string;
  notes: string;
}

interface PortfolioInsight {
  id: string;
  insight_type: string;
  title: string;
  description: string;
  confidence_score: number;
  predicted_impact: string;
  time_horizon: string;
  related_assets: string[];
}

interface StockInfo {
  ticker: string;
  company_name: string;
  current_price: number;
  dividend_yield: number;
  pe_ratio: number;
  sector: string;
}

interface BrapiStock {
  stock: string;
  name: string;
  close: number;
  change: number;
  sector?: string;
}

interface BrapiCashDividend {
  paymentDate: string;
  rate: number;
  label: string;
}

interface BrapiQuote {
  symbol: string;
  shortName: string;
  regularMarketPrice: number;
  priceEarnings: number | null;
  earningsPerShare: number | null;
  logourl: string;
  dividendsData?: {
    cashDividends: BrapiCashDividend[];
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS_PT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const ASSET_TYPES = ["acoes","fiis","renda_fixa","cripto","fundos"];
const ASSET_LABELS: Record<string, string> = {
  acoes: "Ações", fiis: "FIIs", renda_fixa: "Renda Fixa", cripto: "Cripto", fundos: "Fundos",
};
const PALETTE = ["#8b5cf6","#3b82f6","#22c55e","#f59e0b","#f97316","#ec4899","#06b6d4","#10b981","#eab308","#ef4444","#a78bfa","#60a5fa"];

function tickerColor(ticker: string): string {
  let h = 0;
  for (const c of ticker) h = (h * 31 + c.charCodeAt(0)) & 0xffffff;
  return PALETTE[Math.abs(h) % PALETTE.length];
}

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtK = (v: number) => v >= 1000000
  ? `R$ ${(v / 1000000).toFixed(1)}M`
  : v >= 1000 ? `R$ ${(v / 1000).toFixed(1)}k` : fmt(v);

// ─── Style helpers ────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%", background: "#1a1508", border: "1px solid #2a2010",
  borderRadius: "6px", padding: "10px 12px", color: "#e8dcc0",
  fontSize: "13px", fontFamily: "var(--font-sans)", outline: "none", boxSizing: "border-box",
};
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer" };

// ─── Shared Components ────────────────────────────────────────────────────────

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
      <label style={{ fontSize: "10px", color: "#7a6a4a", fontFamily: "var(--font-sans)", letterSpacing: "0.12em", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function SaveButton({ saving, onClick, label }: { saving: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} disabled={saving} style={{
      width: "100%", background: saving ? "rgba(201,168,76,0.5)" : "linear-gradient(135deg,#C9A84C,#A07820)",
      border: "none", borderRadius: "8px", padding: "13px", color: "#0d0b07",
      fontSize: "14px", fontWeight: 700, fontFamily: "var(--font-sans)",
      cursor: saving ? "not-allowed" : "pointer", marginTop: "4px",
    }}>
      {saving ? "Salvando..." : label}
    </button>
  );
}

// ─── SVG Charts ───────────────────────────────────────────────────────────────

function Tooltip({ x, y, children }: { x: number; y: number; children: React.ReactNode }) {
  return (
    <div style={{
      position: "absolute", left: x, top: y, pointerEvents: "none", zIndex: 60,
      background: "#16120a", border: "1px solid rgba(201,168,76,0.35)",
      borderRadius: "8px", padding: "10px 14px", boxShadow: "0 8px 28px rgba(0,0,0,0.7)", minWidth: "160px",
    }}>{children}</div>
  );
}

function EvolutionChart({ data }: { data: { month: string; invested: number; value: number }[] }) {
  const [hov, setHov] = useState<number | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);

  const W = 560, H = 200, PT = 16, PB = 28, PL = 52, PR = 12;
  const cW = W - PL - PR, cH = H - PT - PB;
  const maxVal = Math.max(...data.map(d => Math.max(d.invested, d.value)), 1);
  const n = data.length;
  const bW = Math.min(52, cW / n - 8);
  const gap = (cW - bW * n) / (n + 1);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPos({ x: Math.min(e.clientX - r.left + 12, r.width - 180), y: e.clientY - r.top - 80 });
  };

  if (data.length === 0) return (
    <div style={{ height: "200px", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ color: "#6a5a3a", fontSize: "13px", fontFamily: "var(--font-sans)" }}>Sem transações registradas</span>
    </div>
  );

  return (
    <div ref={ref} style={{ position: "relative" }} onMouseMove={onMove}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%">
        {[0, 0.25, 0.5, 0.75, 1].map(p => {
          const y = PT + cH - p * cH;
          return (
            <g key={p}>
              <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
              <text x={PL - 4} y={y + 3} textAnchor="end" fontSize={7.5} fill="#857560" fontFamily="var(--font-sans)">
                {(p * maxVal) >= 1000 ? `${((p * maxVal) / 1000).toFixed(0)}k` : (p * maxVal).toFixed(0)}
              </text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const x = PL + gap + i * (bW + gap);
          const invH = Math.max((d.invested / maxVal) * cH, 2);
          const valH = Math.max((d.value / maxVal) * cH, 2);
          const gainH = Math.max(valH - invH, 0);
          const isHov = hov === i;
          return (
            <g key={i} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} style={{ cursor: "pointer" }}>
              <rect x={x} y={PT + cH - invH} width={bW} height={invH}
                fill="#22c55e" opacity={isHov ? 1 : 0.7} rx={3} />
              {gainH > 0 && (
                <rect x={x} y={PT + cH - valH} width={bW} height={gainH}
                  fill="#4ade80" opacity={isHov ? 1 : 0.5} rx={3} />
              )}
              <text x={x + bW / 2} y={H - 4} textAnchor="middle" fontSize={8}
                fill={isHov ? "#C9A84C" : "#857560"} fontFamily="var(--font-sans)">
                {d.month}
              </text>
            </g>
          );
        })}
      </svg>
      {hov !== null && (
        <Tooltip x={pos.x} y={Math.max(pos.y, 4)}>
          <p style={{ fontSize: "11px", fontWeight: 700, color: "#C9A84C", fontFamily: "var(--font-sans)", marginBottom: "8px" }}>
            {data[hov].month}
          </p>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", marginBottom: "4px" }}>
            <span style={{ fontSize: "11px", color: "#a09068", fontFamily: "var(--font-sans)" }}>Investido</span>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#22c55e", fontFamily: "var(--font-sans)" }}>{fmtK(data[hov].invested)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
            <span style={{ fontSize: "11px", color: "#a09068", fontFamily: "var(--font-sans)" }}>Valor Est.</span>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#4ade80", fontFamily: "var(--font-sans)" }}>{fmtK(data[hov].value)}</span>
          </div>
        </Tooltip>
      )}
    </div>
  );
}

function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function pieSlice(cx: number, cy: number, r: number, start: number, end: number) {
  if (end - start >= 359.999) return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.001} ${cy - r} Z`;
  const s = polarToCartesian(cx, cy, r, start);
  const e = polarToCartesian(cx, cy, r, end);
  return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${end - start > 180 ? 1 : 0} 1 ${e.x} ${e.y} Z`;
}

function DonutChart({ data }: { data: { ticker: string; value: number; pct: number }[] }) {
  const [hov, setHov] = useState<string | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const total = data.reduce((s, d) => s + d.value, 0);

  if (data.length === 0 || total === 0) return (
    <div style={{ height: "160px", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ color: "#6a5a3a", fontSize: "13px", fontFamily: "var(--font-sans)" }}>Sem ativos</span>
    </div>
  );

  const CX = 90, CY = 90, R = 78, IR = 46;
  let angle = -90;
  const slices = data.map(d => {
    const sweep = (d.value / total) * 360;
    const s = { ...d, start: angle, end: angle + sweep };
    angle += sweep;
    return s;
  });

  const hovSlice = slices.find(s => s.ticker === hov);
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPos({ x: Math.min(e.clientX - r.left + 12, r.width - 170), y: e.clientY - r.top - 75 });
  };

  return (
    <div ref={ref} style={{ display: "flex", alignItems: "flex-start", gap: "28px", position: "relative" }} onMouseMove={onMove}>
      <svg viewBox={`0 0 ${CX * 2} ${CY * 2}`} width={CX * 2} height={CY * 2} style={{ flexShrink: 0 }}>
        {slices.map(({ ticker, start, end }) => {
          const isH = hov === ticker;
          return (
            <path key={ticker} d={pieSlice(CX, CY, isH ? R + 5 : R, start, end)}
              fill={tickerColor(ticker)} opacity={!hov || isH ? 0.9 : 0.3}
              style={{ cursor: "pointer", transition: "opacity 0.15s" }}
              onMouseEnter={() => setHov(ticker)} onMouseLeave={() => setHov(null)} />
          );
        })}
        <circle cx={CX} cy={CY} r={IR} fill="#130f09" />
        <text x={CX} y={CY - 6} textAnchor="middle" fontSize={14} fontWeight={700} fill="#e8dcc0" fontFamily="var(--font-sans)">
          {hovSlice ? `${hovSlice.pct.toFixed(1)}%` : data.length}
        </text>
        <text x={CX} y={CY + 9} textAnchor="middle" fontSize={8} fill="#857560" fontFamily="var(--font-sans)">
          {hovSlice ? hovSlice.ticker : "ativos"}
        </text>
      </svg>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px", paddingTop: "4px" }}>
        {slices.map(({ ticker, value, pct }) => (
          <div key={ticker} style={{ display: "flex", alignItems: "center", gap: "8px", opacity: !hov || hov === ticker ? 1 : 0.35, transition: "opacity 0.15s", cursor: "default" }}
            onMouseEnter={() => setHov(ticker)} onMouseLeave={() => setHov(null)}>
            <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: tickerColor(ticker), flexShrink: 0 }} />
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-sans)", width: "56px", flexShrink: 0 }}>{ticker}</span>
            <div style={{ flex: 1, height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: tickerColor(ticker), borderRadius: "2px" }} />
            </div>
            <span style={{ fontSize: "12px", color: "#a09068", fontFamily: "var(--font-sans)", width: "36px", textAlign: "right", flexShrink: 0 }}>{pct.toFixed(1)}%</span>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-sans)", width: "90px", textAlign: "right", flexShrink: 0 }}>{fmtK(value)}</span>
          </div>
        ))}
      </div>

      {hovSlice && (
        <Tooltip x={pos.x} y={Math.max(pos.y, 4)}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "8px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: tickerColor(hovSlice.ticker) }} />
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#e8dcc0", fontFamily: "var(--font-sans)" }}>{hovSlice.ticker}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", marginBottom: "4px" }}>
            <span style={{ fontSize: "11px", color: "#a09068", fontFamily: "var(--font-sans)" }}>Valor</span>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#C9A84C", fontFamily: "var(--font-sans)" }}>{fmt(hovSlice.value)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
            <span style={{ fontSize: "11px", color: "#a09068", fontFamily: "var(--font-sans)" }}>Participação</span>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#e8dcc0", fontFamily: "var(--font-sans)" }}>{hovSlice.pct.toFixed(1)}%</span>
          </div>
        </Tooltip>
      )}
    </div>
  );
}

// ─── Ticker Search with Brapi autocomplete ────────────────────────────────────

function TickerSearch({
  value,
  onChange,
  onSelect,
  placeholder = "Digite o ticker...",
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect: (ticker: string, price: number, name: string) => void;
  placeholder?: string;
}) {
  const [results, setResults] = useState<BrapiStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const search = async (q: string) => {
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`https://brapi.dev/api/quote/list?search=${encodeURIComponent(q)}&limit=8`);
      const json = await res.json();
      const stocks = (json.stocks ?? []) as BrapiStock[];
      setResults(stocks);
      setOpen(stocks.length > 0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.toUpperCase();
    onChange(v);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(v), 300);
  };

  const handleSelect = (s: BrapiStock) => {
    onChange(s.stock);
    setOpen(false);
    setResults([]);
    onSelect(s.stock, s.close ?? 0, s.name ?? "");
  };

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <input
          value={value}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          style={{ ...inputStyle, paddingRight: "36px" }}
          placeholder={placeholder}
          autoComplete="off"
        />
        <div style={{
          position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
          color: loading ? "#C9A84C" : "#5a4a2a", fontSize: "13px", pointerEvents: "none",
        }}>
          {loading ? "⟳" : "⌕"}
        </div>
      </div>

      {open && results.length > 0 && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          background: "#1a1508", border: "1px solid #2a2010", borderRadius: "8px",
          zIndex: 300, boxShadow: "0 12px 32px rgba(0,0,0,0.8)", overflow: "hidden",
          maxHeight: "280px", overflowY: "auto",
        }}>
          {results.map((s) => (
            <button
              key={s.stock}
              onMouseDown={e => { e.preventDefault(); handleSelect(s); }}
              style={{
                width: "100%", background: "none", border: "none", cursor: "pointer",
                padding: "10px 14px", display: "flex", alignItems: "center", gap: "10px",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(201,168,76,0.08)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
            >
              <div style={{
                width: "34px", height: "34px", borderRadius: "8px",
                background: `${tickerColor(s.stock)}20`,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: tickerColor(s.stock), fontFamily: "var(--font-sans)" }}>
                  {s.stock.slice(0, 2)}
                </span>
              </div>
              <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
                <p style={{ fontSize: "13px", fontWeight: 700, color: "#e8dcc0", fontFamily: "var(--font-sans)", marginBottom: "2px" }}>{s.stock}</p>
                <p style={{ fontSize: "11px", color: "#7a6a4a", fontFamily: "var(--font-sans)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</p>
              </div>
              {s.close != null && s.close > 0 && (
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ fontSize: "13px", fontWeight: 700, color: "#C9A84C", fontFamily: "var(--font-sans)" }}>
                    {s.close.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                  {s.change != null && (
                    <p style={{ fontSize: "10px", color: s.change >= 0 ? "#22c55e" : "#f87171", fontFamily: "var(--font-sans)" }}>
                      {s.change >= 0 ? "+" : ""}{Number(s.change).toFixed(2)}%
                    </p>
                  )}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props { userEmail: string; }

export default function CarteiraContent({ userEmail }: Props) {
  const router = useRouter();
  const now = useMemo(() => new Date(), []);

  const [assets, setAssets] = useState<Asset[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [insights, setInsights] = useState<PortfolioInsight[]>([]);
  const [stockMap, setStockMap] = useState<Record<string, StockInfo>>({});
  const [brapiData, setBrapiData] = useState<Record<string, BrapiQuote>>({});
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [chartFilter, setChartFilter] = useState<"6m" | "12m" | "all">("6m");

  // Modals
  const [modal, setModal] = useState<null | "asset" | "tx">(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [assetForm, setAssetForm] = useState({
    name: "", type: "acoes", quantity: "", purchase_price: "", current_price: "",
  });
  const [txForm, setTxForm] = useState({
    ticker: "", type: "compra" as "compra" | "venda", quantity: "", price: "",
    transaction_date: now.toISOString().split("T")[0], notes: "",
  });

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    const [{ data: aData }, { data: tData }, { data: iData }] = await Promise.all([
      supabase.from("asset").select("*").eq("user_email", userEmail).order("created_at", { ascending: false }),
      supabase.from("transaction").select("*").eq("user_email", userEmail).order("transaction_date", { ascending: false }),
      supabase.from("portfolio_insight").select("*").eq("user_email", userEmail).order("generated_at", { ascending: false }).limit(5),
    ]);

    const assetList = (aData ?? []) as Asset[];
    setAssets(assetList);
    setTransactions((tData ?? []) as Transaction[]);
    setInsights((iData ?? []) as PortfolioInsight[]);

    // Fetch stock_data (Supabase) and brapi in parallel
    const tickers = Array.from(new Set(assetList.map(a => a.name)));
    if (tickers.length > 0) {
      const [{ data: sData }] = await Promise.all([
        supabase
          .from("stock_data")
          .select("ticker, company_name, current_price, dividend_yield, pe_ratio, sector")
          .in("ticker", tickers),
      ]);
      const map: Record<string, StockInfo> = {};
      (sData ?? []).forEach((s: StockInfo) => { map[s.ticker] = s; });
      setStockMap(map);

      // Fetch real-time data from brapi via server proxy (logo, P/L, DY)
      try {
        const res = await fetch(
          `/api/brapi-quote?tickers=${encodeURIComponent(tickers.join(","))}&dividends=true`,
          { cache: "no-store" }
        );
        const json = await res.json();
        const bMap: Record<string, BrapiQuote> = {};
        (json.results ?? []).forEach((q: BrapiQuote) => { bMap[q.symbol] = q; });
        setBrapiData(bMap);
      } catch (err) {
        console.error("[carteira] brapi fetch failed:", err);
      }
    }

    setLoading(false);
  }, [userEmail]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Computed ───────────────────────────────────────────────────────────────

  // Merge assets with real-time brapi prices — this is the source of truth
  const effectiveAssets = useMemo(() => assets.map(a => {
    const bq = brapiData[a.name];
    const livePrice = bq?.regularMarketPrice ?? Number(a.current_price);
    // Calculate DY from last 12 months of cashDividends / current price
    const liveDY = (() => {
      const cash = bq?.dividendsData?.cashDividends;
      if (!cash || cash.length === 0 || !bq.regularMarketPrice) return null;
      const cutoff = new Date();
      cutoff.setFullYear(cutoff.getFullYear() - 1);
      const sum = cash
        .filter(d => new Date(d.paymentDate) >= cutoff)
        .reduce((acc, d) => acc + d.rate, 0);
      return sum > 0 ? sum / bq.regularMarketPrice : null;
    })();
    // priceEarnings is the P/E ratio
    const livePE = bq?.priceEarnings != null ? Number(bq.priceEarnings) : null;
    return { ...a, live_price: livePrice, live_dy: liveDY, live_pe: livePE };
  }), [assets, brapiData]);

  const totalInvested = useMemo(() => effectiveAssets.reduce((s, a) => s + Number(a.quantity) * Number(a.purchase_price), 0), [effectiveAssets]);
  const currentValue  = useMemo(() => effectiveAssets.reduce((s, a) => s + Number(a.quantity) * a.live_price, 0), [effectiveAssets]);
  const totalGain     = currentValue - totalInvested;
  const totalGainPct  = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

  const annualDividends = useMemo(() => effectiveAssets.reduce((s, a) => {
    const dy = a.live_dy ?? (stockMap[a.name]?.dividend_yield ? Number(stockMap[a.name].dividend_yield) / 100 : 0);
    return s + Number(a.quantity) * a.live_price * dy;
  }, 0), [effectiveAssets, stockMap]);

  const avgDY = currentValue > 0 ? (annualDividends / currentValue) * 100 : 0;

  const distribution = useMemo(() => {
    const total = currentValue || 1;
    return effectiveAssets.map(a => ({
      ticker: a.name,
      value: Number(a.quantity) * a.live_price,
      pct: (Number(a.quantity) * a.live_price / total) * 100,
    })).sort((a, b) => b.value - a.value);
  }, [effectiveAssets, currentValue]);

  const gainRatio = totalInvested > 0 ? currentValue / totalInvested : 1;

  const evolutionData = useMemo(() => {
    const monthsCount = chartFilter === "6m" ? 6 : chartFilter === "12m" ? 12 : 24;
    const months = Array.from({ length: monthsCount }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (monthsCount - 1 - i), 1);
      return d;
    });
    return months.map(month => {
      const cutoff = new Date(month.getFullYear(), month.getMonth() + 1, 0).toISOString().split("T")[0];
      const invested = transactions
        .filter(t => t.type === "compra" && t.transaction_date <= cutoff)
        .reduce((s, t) => s + Number(t.total_value ?? t.quantity * t.price), 0);
      return {
        month: MONTHS_PT[month.getMonth()],
        invested,
        value: invested * gainRatio,
      };
    });
  }, [transactions, gainRatio, chartFilter, now]);

  const kpis = useMemo(() => [
    { label: "Renda Anual (Dividendos)", value: fmtK(annualDividends), sub: "", color: "#22c55e" },
    { label: "Dividend Yield Médio", value: `${avgDY.toFixed(2)}%`, sub: "", color: "#C9A84C" },
    { label: "Renda Mensal Est.", value: fmtK(annualDividends / 12), sub: "", color: "#22c55e" },
    { label: "Valor Total Investido", value: fmtK(totalInvested), sub: "", color: "#8b5cf6" },
    { label: "Valor da Carteira", value: fmtK(currentValue), sub: "", color: "#3b82f6" },
    { label: "Retorno Total", value: `${totalGainPct >= 0 ? "+" : ""}${totalGainPct.toFixed(2)}%`, sub: fmt(totalGain), color: totalGain >= 0 ? "#22c55e" : "#f87171" },
    { label: "Número de Ativos", value: String(effectiveAssets.length), sub: "", color: "#06b6d4" },
    { label: "Maior Posição", value: distribution[0]?.ticker ?? "—", sub: distribution[0] ? `${distribution[0].pct.toFixed(1)}% da carteira` : "", color: "#f59e0b" },
    { label: "Lucro / Prejuízo", value: fmt(totalGain), sub: "", color: totalGain >= 0 ? "#22c55e" : "#f87171" },
  ], [annualDividends, avgDY, totalInvested, currentValue, totalGainPct, totalGain, effectiveAssets.length, distribution]);

  // ── Save handlers ──────────────────────────────────────────────────────────

  // Fetch real-time price from brapi via server proxy
  async function fetchLivePrice(ticker: string): Promise<number | null> {
    try {
      const res = await fetch(`/api/brapi-quote?tickers=${encodeURIComponent(ticker)}`, { cache: "no-store" });
      const json = await res.json();
      return json.results?.[0]?.regularMarketPrice ?? null;
    } catch {
      return null;
    }
  }

  // Update all assets' current_price in Supabase with live brapi prices
  async function refreshPrices() {
    if (assets.length === 0) { fetchData(); return; }
    setLoading(true);
    try {
      const tickerStr = Array.from(new Set(assets.map(a => a.name))).join(",");
      const res = await fetch(`/api/brapi-quote?tickers=${encodeURIComponent(tickerStr)}`, { cache: "no-store" });
      const json = await res.json();
      const supabase = createClient();
      for (const q of json.results ?? []) {
        if (q.regularMarketPrice) {
          await supabase.from("asset")
            .update({ current_price: q.regularMarketPrice, updated_at: new Date().toISOString() })
            .eq("user_email", userEmail)
            .eq("name", q.symbol);
        }
      }
    } catch { /* silently continue */ }
    fetchData();
  }

  async function saveAsset() {
    if (!assetForm.name || !assetForm.quantity || !assetForm.purchase_price) {
      setFormError("Preencha ticker, quantidade e preço médio."); return;
    }
    setSaving(true);
    const ticker = assetForm.name.toUpperCase().trim();
    const purchasePrice = parseFloat(assetForm.purchase_price.replace(",", "."));

    // Try to get real current price from brapi
    const livePrice = await fetchLivePrice(ticker);
    const currentPrice = livePrice
      ?? (assetForm.current_price ? parseFloat(assetForm.current_price.replace(",", ".")) : purchasePrice);

    const supabase = createClient();
    const { error } = await supabase.from("asset").insert({
      user_email: userEmail,
      name: ticker,
      type: assetForm.type,
      quantity: parseFloat(assetForm.quantity),
      purchase_price: purchasePrice,
      current_price: currentPrice,
    });
    if (error) { setFormError("Erro ao salvar ativo."); setSaving(false); return; }

    // Also log as transaction
    await supabase.from("transaction").insert({
      user_email: userEmail,
      ticker,
      type: "compra",
      quantity: parseFloat(assetForm.quantity),
      price: purchasePrice,
      total_value: parseFloat(assetForm.quantity) * purchasePrice,
      transaction_date: now.toISOString().split("T")[0],
    });

    setModal(null); setSaving(false); fetchData();
  }

  async function saveTx() {
    if (!txForm.ticker || !txForm.quantity || !txForm.price) {
      setFormError("Preencha todos os campos obrigatórios."); return;
    }
    setSaving(true);
    const supabase = createClient();
    const qty = parseFloat(txForm.quantity);
    const price = parseFloat(txForm.price.replace(",", "."));
    await supabase.from("transaction").insert({
      user_email: userEmail,
      ticker: txForm.ticker.toUpperCase().trim(),
      type: txForm.type,
      quantity: qty,
      price,
      total_value: qty * price,
      transaction_date: txForm.transaction_date,
      notes: txForm.notes,
    });
    setModal(null); setSaving(false); fetchData();
  }

  async function deleteAsset(id: string) {
    const supabase = createClient();
    await supabase.from("asset").delete().eq("id", id);
    setAssets(prev => prev.filter(a => a.id !== id));
    setActiveMenu(null);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const card: React.CSSProperties = {
    background: "#130f09", border: "1px solid rgba(201,168,76,0.08)",
    borderRadius: "12px", padding: "20px 22px",
  };

  return (
    <div style={{ minHeight: "calc(100vh - 58px)", background: "#0a0806" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px 80px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#f0e8d0", fontFamily: "var(--font-display)", marginBottom: "4px" }}>
              Minha Carteira
            </h1>
            <p style={{ fontSize: "13px", color: "#a09068", fontFamily: "var(--font-sans)" }}>
              Gerencie seus investimentos
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {[
              { icon: Download, label: "Exportar", onClick: () => {} },
              { icon: RefreshCw, label: "Atualizar", onClick: refreshPrices },
              { icon: Upload, label: "Importar", onClick: () => {} },
            ].map(({ icon: Icon, label, onClick }) => (
              <button key={label} onClick={onClick} style={{
                display: "flex", alignItems: "center", gap: "6px",
                background: "#130f09", border: "1px solid #2a2010",
                borderRadius: "8px", padding: "8px 14px", color: "#9a8a6a",
                fontSize: "12px", fontFamily: "var(--font-sans)", cursor: "pointer",
              }}>
                <Icon size={13} /> {label}
              </button>
            ))}
            <button
              onClick={() => { setAssetForm({ name: "", type: "acoes", quantity: "", purchase_price: "", current_price: "" }); setFormError(""); setModal("asset"); }}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                background: "linear-gradient(135deg,#C9A84C,#A07820)",
                border: "none", borderRadius: "8px", padding: "8px 16px",
                color: "#0d0b07", fontSize: "13px", fontWeight: 600,
                fontFamily: "var(--font-sans)", cursor: "pointer",
              }}
            >
              <Plus size={14} /> Adicionar Ativo
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#7a6a4a", fontFamily: "var(--font-sans)", fontSize: "13px" }}>
            Carregando carteira...
          </div>
        ) : (
          <>
            {/* ── Summary Cards ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
              {[
                { label: "Valor Investido", value: fmt(totalInvested), sub: `${effectiveAssets.length} ativos`, color: "#8b5cf6", icon: Wallet },
                { label: "Valor Atual", value: fmt(currentValue), sub: "preço de mercado", color: "#3b82f6", icon: TrendingUp },
                { label: "Ganho / Perda", value: fmt(totalGain), sub: `${totalGain >= 0 ? "+" : ""}${totalGainPct.toFixed(2)}%`, color: totalGain >= 0 ? "#22c55e" : "#f87171", icon: totalGain >= 0 ? TrendingUp : TrendingDown },
                { label: "Renda Anual (DY)", value: fmtK(annualDividends), sub: `${avgDY.toFixed(2)}% DY médio`, color: "#C9A84C", icon: TrendingUp },
              ].map(({ label, value, sub, color, icon: Icon }) => (
                <div key={label} style={{ background: "#130f09", border: `1px solid ${color}22`, borderRadius: "12px", padding: "18px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                    <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: `${color}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon size={13} style={{ color }} />
                    </div>
                    <span style={{ fontSize: "11px", color: "#a09068", fontFamily: "var(--font-sans)" }}>{label}</span>
                  </div>
                  <p style={{ fontSize: "20px", fontWeight: 700, color, fontFamily: "var(--font-sans)", lineHeight: 1, marginBottom: "4px" }}>{value}</p>
                  <p style={{ fontSize: "10px", color: "#857560", fontFamily: "var(--font-sans)" }}>{sub}</p>
                </div>
              ))}
            </div>

            {/* ── Evolution Chart ── */}
            <div style={{ ...card, marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-sans)", marginBottom: "3px" }}>Evolução do Patrimônio</p>
                  <p style={{ fontSize: "11px", color: "#7a6a4a", fontFamily: "var(--font-sans)" }}>Valor investido vs. valor estimado atual</p>
                </div>
                <div style={{ display: "flex", gap: "4px" }}>
                  {(["6m", "12m", "all"] as const).map(f => (
                    <button key={f} onClick={() => setChartFilter(f)} style={{
                      background: chartFilter === f ? "rgba(201,168,76,0.15)" : "transparent",
                      border: `1px solid ${chartFilter === f ? "rgba(201,168,76,0.3)" : "#2a2010"}`,
                      borderRadius: "6px", padding: "5px 12px",
                      color: chartFilter === f ? "#C9A84C" : "#7a6a4a",
                      fontSize: "11px", fontFamily: "var(--font-sans)", cursor: "pointer",
                    }}>
                      {f === "6m" ? "6 meses" : f === "12m" ? "12 meses" : "Tudo"}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: "16px", marginBottom: "12px" }}>
                {[{ color: "#22c55e", label: "Valor aplicado" }, { color: "#4ade80", label: "Ganho capital" }].map(({ color, label }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: color }} />
                    <span style={{ fontSize: "10px", color: "#857560", fontFamily: "var(--font-sans)" }}>{label}</span>
                  </div>
                ))}
              </div>
              <EvolutionChart data={evolutionData} />
            </div>

            {/* ── KPIs ── */}
            <div style={{ ...card, marginBottom: "20px" }}>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-sans)", marginBottom: "16px" }}>KPIs Financeiros</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                {kpis.map(({ label, value, sub, color }) => (
                  <div key={label} style={{ background: "#0d0a06", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "8px", padding: "14px 16px" }}>
                    <p style={{ fontSize: "10px", color: "#7a6a4a", fontFamily: "var(--font-sans)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>{label}</p>
                    <p style={{ fontSize: "18px", fontWeight: 700, color, fontFamily: "var(--font-sans)", lineHeight: 1, marginBottom: "4px" }}>{value}</p>
                    {sub && <p style={{ fontSize: "10px", color: "#857560", fontFamily: "var(--font-sans)" }}>{sub}</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Distribution ── */}
            <div style={{ ...card, marginBottom: "20px" }}>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-sans)", marginBottom: "4px" }}>Distribuição por Ativo</p>
              <p style={{ fontSize: "11px", color: "#7a6a4a", fontFamily: "var(--font-sans)", marginBottom: "20px" }}>Percentual do valor total da carteira</p>
              <DonutChart data={distribution} />
            </div>

            {/* ── Meus Ativos ── */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <p style={{ fontSize: "16px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-display)" }}>Meus Ativos</p>
                <span style={{ fontSize: "12px", color: "#7a6a4a", fontFamily: "var(--font-sans)" }}>{effectiveAssets.length} posições</span>
              </div>

              {effectiveAssets.length === 0 ? (
                <div style={{ ...card, textAlign: "center", padding: "48px" }}>
                  <p style={{ fontSize: "13px", color: "#7a6a4a", fontFamily: "var(--font-sans)", marginBottom: "12px" }}>Nenhum ativo cadastrado</p>
                  <button onClick={() => { setAssetForm({ name: "", type: "acoes", quantity: "", purchase_price: "", current_price: "" }); setFormError(""); setModal("asset"); }}
                    style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "8px", padding: "9px 18px", color: "#C9A84C", fontSize: "13px", fontFamily: "var(--font-sans)", cursor: "pointer" }}>
                    <Plus size={13} style={{ display: "inline", marginRight: "6px" }} />Adicionar primeiro ativo
                  </button>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  {effectiveAssets.map(a => {
                    const invested = Number(a.quantity) * Number(a.purchase_price);
                    const current  = Number(a.quantity) * a.live_price;
                    const gain     = current - invested;
                    const gainPct  = invested > 0 ? (gain / invested) * 100 : 0;
                    const bq       = brapiData[a.name];
                    const color    = tickerColor(a.name);
                    const isMenu   = activeMenu === a.id;
                    const logo     = bq?.logourl;

                    return (
                      <div key={a.id} style={{ ...card, position: "relative" }}
                        onMouseLeave={() => setActiveMenu(null)}>
                        {/* Card header */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: `${color}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                              {logo ? (
                                <img
                                  src={logo}
                                  alt={a.name}
                                  style={{ width: "42px", height: "42px", objectFit: "cover", borderRadius: "12px" }}
                                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; (e.currentTarget.nextSibling as HTMLElement).style.display = "flex"; }}
                                />
                              ) : null}
                              <span style={{ fontSize: "14px", fontWeight: 700, color, fontFamily: "var(--font-sans)", display: logo ? "none" : "block" }}>
                                {a.name.slice(0, 2)}
                              </span>
                            </div>
                            <div>
                              <p style={{ fontSize: "16px", fontWeight: 700, color: "#f0e8d0", fontFamily: "var(--font-sans)", marginBottom: "2px" }}>{a.name}</p>
                              <p style={{ fontSize: "11px", color: "#7a6a4a", fontFamily: "var(--font-sans)" }}>
                                {Number(a.quantity).toLocaleString("pt-BR")} ações · {ASSET_LABELS[a.type] ?? a.type}
                              </p>
                            </div>
                          </div>
                          <div style={{ position: "relative" }}>
                            <button onClick={() => setActiveMenu(isMenu ? null : a.id)}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "#5a4a2a", padding: "4px" }}>
                              <MoreVertical size={16} />
                            </button>
                            {isMenu && (
                              <div style={{ position: "absolute", top: "28px", right: 0, background: "#1a1508", border: "1px solid #2a2010", borderRadius: "8px", padding: "6px", zIndex: 30, minWidth: "120px", boxShadow: "0 8px 24px rgba(0,0,0,0.7)" }}>
                                <button onClick={() => deleteAsset(a.id)} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", color: "#f87171", fontSize: "12px", fontFamily: "var(--font-sans)", padding: "7px 10px", textAlign: "left", borderRadius: "4px" }}>
                                  Remover ativo
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Prices */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                          {[
                            { label: "Preço Médio", value: fmt(Number(a.purchase_price)) },
                            { label: "Preço Atual", value: fmt(a.live_price), highlight: gain >= 0 },
                          ].map(({ label, value, highlight }) => (
                            <div key={label} style={{ background: "#0d0a06", borderRadius: "8px", padding: "10px 12px" }}>
                              <p style={{ fontSize: "10px", color: "#7a6a4a", fontFamily: "var(--font-sans)", marginBottom: "4px" }}>{label}</p>
                              <p style={{ fontSize: "14px", fontWeight: 700, color: highlight === true ? "#22c55e" : highlight === false ? "#f87171" : "#e8dcc0", fontFamily: "var(--font-sans)" }}>{value}</p>
                            </div>
                          ))}
                        </div>

                        {/* Value + Gain */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                          <div>
                            <p style={{ fontSize: "10px", color: "#7a6a4a", fontFamily: "var(--font-sans)", marginBottom: "3px" }}>Valor Total</p>
                            <p style={{ fontSize: "15px", fontWeight: 700, color: "#e8dcc0", fontFamily: "var(--font-sans)" }}>{fmt(current)}</p>
                          </div>
                          <div>
                            <p style={{ fontSize: "10px", color: "#7a6a4a", fontFamily: "var(--font-sans)", marginBottom: "3px" }}>Ganho / Perda</p>
                            <p style={{ fontSize: "13px", fontWeight: 700, color: gain >= 0 ? "#22c55e" : "#f87171", fontFamily: "var(--font-sans)" }}>
                              {gain >= 0 ? "+" : ""}{fmt(gain)} ({gainPct >= 0 ? "+" : ""}{gainPct.toFixed(2)}%)
                            </p>
                          </div>
                        </div>

                        {/* Bottom metrics bar */}
                        <div style={{ display: "flex", gap: "0", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "12px" }}>
                          {[
                            { label: "Rentabilidade", value: `${gainPct >= 0 ? "+" : ""}${gainPct.toFixed(2)}%`, color: gain >= 0 ? "#22c55e" : "#f87171" },
                            {
                              label: "DY",
                              value: a.live_dy != null
                                ? `${(Number(a.live_dy) * 100).toFixed(1)}%`
                                : "—",
                              color: "#C9A84C",
                            },
                            {
                              label: "P/L",
                              value: a.live_pe != null
                                ? Number(a.live_pe).toFixed(1)
                                : "—",
                              color: "#a09068",
                            },
                          ].map(({ label, value, color: c }, i) => (
                            <div key={label} style={{ flex: 1, textAlign: "center", borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                              <p style={{ fontSize: "10px", color: "#7a6a4a", fontFamily: "var(--font-sans)", marginBottom: "2px" }}>{label}</p>
                              <p style={{ fontSize: "12px", fontWeight: 600, color: c, fontFamily: "var(--font-sans)" }}>{value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Histórico de Compras ── */}
            <div style={{ ...card, marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                <div>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-sans)", marginBottom: "2px" }}>
                    Histórico de Transações
                  </p>
                  <p style={{ fontSize: "11px", color: "#7a6a4a", fontFamily: "var(--font-sans)" }}>
                    Total Investido: <span style={{ color: "#C9A84C", fontWeight: 600 }}>{fmt(totalInvested)}</span>
                  </p>
                </div>
                <button
                  onClick={() => { setTxForm({ ticker: "", type: "compra", quantity: "", price: "", transaction_date: now.toISOString().split("T")[0], notes: "" }); setFormError(""); setModal("tx"); }}
                  style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "8px", padding: "7px 14px", color: "#C9A84C", fontSize: "12px", fontWeight: 600, fontFamily: "var(--font-sans)", cursor: "pointer" }}>
                  <Plus size={12} /> Registrar Transação
                </button>
              </div>

              {transactions.length === 0 ? (
                <p style={{ fontSize: "13px", color: "#7a6a4a", fontFamily: "var(--font-sans)", textAlign: "center", padding: "24px 0" }}>
                  Nenhuma transação registrada
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {transactions.slice(0, 12).map(t => (
                    <div key={t.id} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "12px 16px", background: "rgba(255,255,255,0.02)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.03)" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: `${tickerColor(t.ticker)}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: "10px", fontWeight: 700, color: tickerColor(t.ticker), fontFamily: "var(--font-sans)" }}>{t.ticker.slice(0, 2)}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                          <span style={{ fontSize: "13px", fontWeight: 700, color: "#e8dcc0", fontFamily: "var(--font-sans)" }}>{t.ticker}</span>
                          <span style={{ fontSize: "10px", fontWeight: 600, padding: "2px 7px", borderRadius: "4px", fontFamily: "var(--font-sans)", background: t.type === "compra" ? "rgba(34,197,94,0.12)" : "rgba(248,113,113,0.12)", color: t.type === "compra" ? "#22c55e" : "#f87171" }}>
                            {t.type.charAt(0).toUpperCase() + t.type.slice(1)}
                          </span>
                        </div>
                        <p style={{ fontSize: "11px", color: "#7a6a4a", fontFamily: "var(--font-sans)" }}>
                          {Number(t.quantity).toLocaleString("pt-BR")} ações · Pré: {fmt(Number(t.price))}
                          {t.notes && ` · ${t.notes}`}
                        </p>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <p style={{ fontSize: "14px", fontWeight: 700, color: "#e8dcc0", fontFamily: "var(--font-sans)", marginBottom: "2px" }}>{fmt(Number(t.total_value ?? Number(t.quantity) * Number(t.price)))}</p>
                        <p style={{ fontSize: "11px", color: "#7a6a4a", fontFamily: "var(--font-sans)" }}>
                          {new Date(t.transaction_date + "T12:00:00").toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  ))}
                  {transactions.length > 12 && (
                    <p style={{ textAlign: "center", fontSize: "12px", color: "#7a6a4a", fontFamily: "var(--font-sans)", paddingTop: "8px" }}>
                      +{transactions.length - 12} transações anteriores
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* ── Otimização IA ── */}
            <div style={{ background: "linear-gradient(135deg, #0f0a1e 0%, #0d0a16 50%, #0a0d1a 100%)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: "16px", padding: "28px 32px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(139,92,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Brain size={16} style={{ color: "#8b5cf6" }} />
                  </div>
                  <div>
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-sans)", marginBottom: "2px" }}>Otimização IA</p>
                    <p style={{ fontSize: "11px", color: "#7a6a4a", fontFamily: "var(--font-sans)" }}>Recomendações personalizadas para sua carteira</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)", borderRadius: "8px", padding: "7px 14px", color: "#a78bfa", fontSize: "12px", fontFamily: "var(--font-sans)", cursor: "pointer" }}>
                    Perfil de Risco
                  </button>
                  <button style={{ background: "linear-gradient(135deg, #8b5cf6, #6d28d9)", border: "none", borderRadius: "8px", padding: "7px 16px", color: "#fff", fontSize: "12px", fontWeight: 600, fontFamily: "var(--font-sans)", cursor: "pointer" }}>
                    Analisar
                  </button>
                </div>
              </div>

              {insights.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <Sparkles size={32} style={{ color: "#8b5cf6", opacity: 0.4, display: "block", margin: "0 auto 16px" }} />
                  <p style={{ fontSize: "13px", color: "#7a6a4a", fontFamily: "var(--font-sans)", marginBottom: "6px" }}>
                    Clique em &apos;Analisar&apos; para receber recomendações personalizadas
                  </p>
                  <p style={{ fontSize: "11px", color: "#5a4a2a", fontFamily: "var(--font-sans)" }}>
                    Perfil de risco · <span style={{ color: "#7a6a4a" }}>longo prazo</span>
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {insights.map(insight => (
                    <div key={insight.id} style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.12)", borderRadius: "10px", padding: "16px 20px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                        <p style={{ fontSize: "13px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-sans)" }}>{insight.title}</p>
                        {insight.confidence_score && (
                          <span style={{ fontSize: "10px", color: "#8b5cf6", fontFamily: "var(--font-sans)", background: "rgba(139,92,246,0.1)", padding: "2px 8px", borderRadius: "4px" }}>
                            {(Number(insight.confidence_score) * 100).toFixed(0)}% confiança
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: "12px", color: "#7a6a4a", fontFamily: "var(--font-sans)", lineHeight: 1.65, marginBottom: "8px" }}>{insight.description}</p>
                      {insight.predicted_impact && (
                        <p style={{ fontSize: "11px", color: "#a78bfa", fontFamily: "var(--font-sans)" }}>
                          Impacto estimado: {insight.predicted_impact}
                          {insight.time_horizon && ` · ${insight.time_horizon}`}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Modal: Adicionar Ativo ── */}
      {modal === "asset" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "24px" }}>
          <div style={{ background: "#130f09", border: "1px solid rgba(201,168,76,0.15)", borderRadius: "16px", padding: "32px", width: "100%", maxWidth: "440px" }}>
            <ModalHeader title="Adicionar Ativo" onClose={() => setModal(null)} />
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <FormField label="Ticker (ex: PETR4)">
                <TickerSearch
                  value={assetForm.name}
                  onChange={v => setAssetForm(p => ({ ...p, name: v }))}
                  onSelect={(ticker, price, _name) => {
                    const autoType = ticker.endsWith("11") ? "fiis" : "acoes";
                    setAssetForm(p => ({
                      ...p,
                      name: ticker,
                      current_price: price > 0 ? price.toFixed(2) : p.current_price,
                      type: autoType,
                    }));
                  }}
                  placeholder="Digite PETR, BBAS, ITUB..."
                />
              </FormField>
              <FormField label="Tipo de Ativo">
                <select value={assetForm.type} onChange={e => setAssetForm(p => ({ ...p, type: e.target.value }))} style={selectStyle}>
                  {ASSET_TYPES.map(t => <option key={t} value={t}>{ASSET_LABELS[t]}</option>)}
                </select>
              </FormField>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <FormField label="Quantidade">
                  <input value={assetForm.quantity} onChange={e => setAssetForm(p => ({ ...p, quantity: e.target.value }))} style={inputStyle} placeholder="100" type="number" min="0" />
                </FormField>
                <FormField label="Preço Médio (R$)">
                  <input value={assetForm.purchase_price} onChange={e => setAssetForm(p => ({ ...p, purchase_price: e.target.value }))} style={inputStyle} placeholder="38,00" />
                </FormField>
              </div>
              <FormField label="Preço Atual (R$)">
                <input value={assetForm.current_price} onChange={e => setAssetForm(p => ({ ...p, current_price: e.target.value }))} style={inputStyle} placeholder="Preenchido automaticamente ao selecionar" />
              </FormField>
              {formError && <p style={{ fontSize: "12px", color: "#f87171", fontFamily: "var(--font-sans)" }}>{formError}</p>}
              <SaveButton saving={saving} onClick={saveAsset} label="Adicionar Ativo" />
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Registrar Transação ── */}
      {modal === "tx" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "24px" }}>
          <div style={{ background: "#130f09", border: "1px solid rgba(201,168,76,0.15)", borderRadius: "16px", padding: "32px", width: "100%", maxWidth: "440px" }}>
            <ModalHeader title="Registrar Transação" onClose={() => setModal(null)} />
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <FormField label="Ticker">
                <TickerSearch
                  value={txForm.ticker}
                  onChange={v => setTxForm(p => ({ ...p, ticker: v }))}
                  onSelect={(ticker, price) => {
                    setTxForm(p => ({
                      ...p,
                      ticker,
                      price: price > 0 ? price.toFixed(2) : p.price,
                    }));
                  }}
                  placeholder="Digite PETR, BBAS, ITUB..."
                />
              </FormField>
              <FormField label="Tipo">
                <div style={{ display: "flex", gap: "8px" }}>
                  {(["compra", "venda"] as const).map(type => (
                    <button key={type} onClick={() => setTxForm(p => ({ ...p, type }))} style={{
                      flex: 1, padding: "10px", borderRadius: "8px", border: `1px solid ${txForm.type === type ? (type === "compra" ? "rgba(34,197,94,0.4)" : "rgba(248,113,113,0.4)") : "#2a2010"}`,
                      background: txForm.type === type ? (type === "compra" ? "rgba(34,197,94,0.1)" : "rgba(248,113,113,0.1)") : "transparent",
                      color: txForm.type === type ? (type === "compra" ? "#22c55e" : "#f87171") : "#7a6a4a",
                      fontSize: "13px", fontWeight: 600, fontFamily: "var(--font-sans)", cursor: "pointer",
                    }}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </FormField>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <FormField label="Quantidade">
                  <input value={txForm.quantity} onChange={e => setTxForm(p => ({ ...p, quantity: e.target.value }))} style={inputStyle} placeholder="100" type="number" min="0" />
                </FormField>
                <FormField label="Preço (R$)">
                  <input value={txForm.price} onChange={e => setTxForm(p => ({ ...p, price: e.target.value }))} style={inputStyle} placeholder="38,00" />
                </FormField>
              </div>
              <FormField label="Data">
                <input value={txForm.transaction_date} onChange={e => setTxForm(p => ({ ...p, transaction_date: e.target.value }))} style={inputStyle} type="date" />
              </FormField>
              <FormField label="Notas (opcional)">
                <input value={txForm.notes} onChange={e => setTxForm(p => ({ ...p, notes: e.target.value }))} style={inputStyle} placeholder="Observações..." />
              </FormField>
              {formError && <p style={{ fontSize: "12px", color: "#f87171", fontFamily: "var(--font-sans)" }}>{formError}</p>}
              <SaveButton saving={saving} onClick={saveTx} label="Registrar Transação" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
