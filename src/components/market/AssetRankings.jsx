import { useState, useEffect, useCallback } from "react";
import { RefreshCw, TrendingUp, TrendingDown, ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import RankingsValidator from "./RankingsValidator";

function fmtPct(v) {
  if (v == null) return "—";
  return `${Number(v) >= 0 ? "+" : ""}${Number(v).toFixed(2)}%`;
}
function fmtDY(v) {
  return v != null ? `${Number(v).toFixed(2)}%` : "—";
}
function fmtMultiple(v) {
  return v != null ? `${Number(v).toFixed(2)}x` : "—";
}
function fmtEPS(v) {
  return v != null ? `R$ ${Number(v).toFixed(2)}` : "—";
}
function fmtMktCap(v) {
  if (v == null) return "—";
  if (v >= 1e12) return `R$ ${(v / 1e12).toFixed(1)}T`;
  if (v >= 1e9)  return `R$ ${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6)  return `R$ ${(v / 1e6).toFixed(1)}M`;
  return `R$ ${Number(v).toFixed(0)}`;
}

function AssetLogo({ ticker, imageUrl }) {
  const [failed, setFailed] = useState(false);
  const src = imageUrl || `https://icons.brapi.dev/icons/${ticker}.svg`;
  if (failed) {
    return (
      <div className="w-9 h-9 rounded-xl bg-gray-700 flex items-center justify-center text-[10px] text-gray-400 font-bold shrink-0">
        {ticker?.slice(0, 2)}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={ticker}
      onError={() => setFailed(true)}
      className="w-9 h-9 rounded-xl object-contain bg-gray-800 shrink-0"
    />
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 animate-pulse border-b border-gray-700/50">
      <div className="w-5 h-3 bg-gray-700 rounded shrink-0" />
      <div className="w-9 h-9 rounded-xl bg-gray-700 shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-14 bg-gray-700 rounded" />
        <div className="h-2 w-20 bg-gray-800 rounded" />
      </div>
      <div className="space-y-1 text-right">
        <div className="h-3.5 w-16 bg-gray-700 rounded" />
        <div className="h-2.5 w-12 bg-gray-800 rounded" />
        <div className="h-2.5 w-10 bg-gray-800 rounded" />
      </div>
    </div>
  );
}

function RankingColumn({ col, items, loading, count }) {
  return (
    <div className="bg-gray-800/40 border border-gray-700 rounded-xl flex-1 min-w-0 overflow-hidden">
      {/* Column header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-base">{col.emoji}</span>
          <h4 className="text-xs font-semibold text-white leading-tight">{col.title}</h4>
        </div>
        <span className="text-[10px] text-gray-500">{items.length}/{count}</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-700/50">
        {loading
          ? [...Array(count)].map((_, i) => <SkeletonRow key={i} />)
          : items.length === 0
            ? <div className="px-4 py-6 text-center text-xs text-gray-500">Sem dados disponíveis</div>
            : items.map((item, idx) => {
              const chg = item.change;
              const isPos = chg != null && chg >= 0;
              return (
                <div key={item.ticker} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-700/20 transition-colors">
                  <span className="text-xs text-gray-500 w-6 text-right shrink-0">#{idx + 1}</span>
                  <AssetLogo ticker={item.ticker} imageUrl={item.logoUrl} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{item.ticker}</p>
                    <p className="text-xs text-gray-500 truncate">{item.name !== item.ticker ? item.name : item.ticker}</p>
                  </div>
                  <div className="text-right shrink-0 space-y-0.5">
                    <p className={`text-sm font-bold ${col.color}`}>
                      {col.fmt(item[col.key])}
                    </p>
                    {item.price != null && (
                      <p className="text-xs text-gray-400">
                        R$ {Number(item.price).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    )}
                    {chg != null && (
                      <p className={`text-xs flex items-center justify-end gap-0.5 font-medium ${isPos ? "text-emerald-400" : "text-red-400"}`}>
                        {isPos ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {fmtPct(chg)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
}

const TABS = [
  { key: "stocks", label: "Ações" },
  { key: "fiis",   label: "FIIs"  },
];

const STOCK_COLUMNS = [
  { title: "Melhores P/L (Ibovespa)",  emoji: "🟣", key: "pl",  fmt: fmtMultiple, color: "text-blue-400"    },
  { title: "Maior Valor de Mercado",   emoji: "🏆", key: "pvp", fmt: fmtMktCap,   color: "text-emerald-400" },
  { title: "Maior Lucro por Ação (EPS)", emoji: "🪙", key: "dy",  fmt: fmtEPS,     color: "text-amber-400"  },
];

const FII_COLUMNS = [
  { title: "Melhores P/L",             emoji: "🟣", key: "pl",  fmt: fmtMultiple, color: "text-blue-400"    },
  { title: "Maior Valor de Mercado",   emoji: "🏆", key: "pvp", fmt: fmtMktCap,   color: "text-emerald-400" },
  { title: "Maior Lucro por Ação (EPS)", emoji: "🪙", key: "dy",  fmt: fmtEPS,     color: "text-amber-400"  },
];

const TOP_COUNT = 5;

export default function AssetRankings() {
  const [activeTab, setActiveTab]     = useState("stocks");
  const [data, setData]               = useState({ dy: [], pvp: [], pl: [] });
  const [meta, setMeta]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [updatedAt, setUpdatedAt]     = useState(null);
  const [showValidator, setShowValidator] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    base44.functions.invoke("getRankingsData", { tab: activeTab })
      .then(res => {
        const d = res.data;
        setData({ dy: d.dy || [], pvp: d.pvp || [], pl: d.pl || [] });
        setMeta(d.meta || null);
        const now = new Date();
        setUpdatedAt(now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
      })
      .finally(() => setLoading(false));
  }, [activeTab]);

  useEffect(() => { load(); }, [load]);

  const columns = activeTab === "stocks" ? STOCK_COLUMNS : FII_COLUMNS;

  return (
    <>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-xl">🏅</span> Rankings de Ativos
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            {updatedAt && (
              <span className="text-[11px] text-gray-500 flex items-center gap-1">
                Atualizado às {updatedAt}
                <button
                  onClick={load}
                  disabled={loading}
                  className="ml-1 text-gray-500 hover:text-amber-400 disabled:opacity-40 transition-colors"
                  title="Atualizar"
                >
                  <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
                </button>
              </span>
            )}
            {/* Validator button */}
            <button
              onClick={() => setShowValidator(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-gray-400 hover:text-amber-400 transition-colors border border-gray-700"
              title="Validar Dados"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Validar
            </button>
            {/* Tab switcher */}
            <div className="flex gap-1 bg-gray-800 rounded-full p-1">
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    activeTab === tab.key
                      ? "bg-[#C9A84C] text-black font-bold"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Columns */}
        <div className="flex flex-col md:flex-row gap-4">
          {columns.map(col => (
            <RankingColumn
              key={col.key}
              col={col}
              items={data[col.key]}
              loading={loading}
              count={TOP_COUNT}
            />
          ))}
        </div>
      </div>

      {/* Validator modal */}
      {showValidator && (
        <RankingsValidator meta={meta} onClose={() => setShowValidator(false)} />
      )}
    </>
  );
}