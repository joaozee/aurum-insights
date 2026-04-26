import { useState, useEffect, useCallback, useRef } from "react";
import { Clock, TrendingUp, TrendingDown, RefreshCw, AlertCircle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { brapiFetch, formatUpdatedAt } from "@/lib/brapiClient";

const PERIODS = [
  { label: "1D",  range: "1d",  interval: "30m" },
  { label: "7D",  range: "5d",  interval: "1d"  },
  { label: "30D", range: "1mo", interval: "1d"  },
  { label: "6M",  range: "6mo", interval: "1wk" },
  { label: "1A",  range: "1y",  interval: "1mo" },
  { label: "5A",  range: "5y",  interval: "3mo" },
];

function fmtNum(n) {
  if (n == null) return "—";
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtPct(n) {
  if (n == null) return "—";
  return `${n >= 0 ? "+" : ""}${Number(n).toFixed(2)}%`;
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-2 py-1.5 animate-pulse">
      <div className="w-6 h-6 rounded bg-gray-700" />
      <div className="w-14 h-3 bg-gray-700 rounded" />
      <div className="w-12 h-3 bg-gray-700 rounded flex-1" />
      <div className="w-14 h-3 bg-gray-700 rounded" />
    </div>
  );
}

function UpdatedAt({ time, onRefresh, loading }) {
  if (!time) return null;
  return (
    <div className="flex items-center gap-2 mt-2 text-[11px] text-gray-500">
      <Clock className="h-3 w-3" />
      <span>Atualizado às {time}</span>
      <button onClick={onRefresh} disabled={loading} className="ml-auto text-gray-500 hover:text-amber-400 disabled:opacity-40 transition-colors">
        <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
      </button>
    </div>
  );
}

function AssetLogo({ ticker, size = "w-6 h-6" }) {
  const [failed, setFailed] = useState(false);
  if (failed) return (
    <div className={`${size} rounded bg-gray-700 flex items-center justify-center text-[9px] text-gray-400 font-bold shrink-0`}>
      {ticker?.slice(0, 2)}
    </div>
  );
  return (
    <img src={`https://icons.brapi.dev/icons/${ticker}.svg`} alt={ticker}
      onError={() => setFailed(true)}
      className={`${size} rounded object-contain bg-gray-800 shrink-0`} />
  );
}

// ── Ibovespa ──────────────────────────────────────────────────────────────────
function IbovespaBlock() {
  const [period, setPeriod] = useState(PERIODS[0]);
  const [quote, setQuote] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const abortRef = useRef(null);

  const load = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError(null);

    brapiFetch(`/quote/%5EBVSP?range=${period.range}&interval=${period.interval}`, { signal: abortRef.current.signal })
      .then(res => {
        const r = res?.results?.[0];
        if (!r) throw new Error("Sem dados do IBOVESPA");
        const h = (r.historicalDataPrice || []).map(p => ({
          time: p.date ? new Date(p.date * 1000).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "",
          value: p.close ?? p.open ?? 0,
        }));
        setQuote(r);
        setHistory(h);
        setUpdatedAt(formatUpdatedAt());
      })
      .catch(err => { if (err.name !== "AbortError") setError(err.message); })
      .finally(() => setLoading(false));
  }, [period]);

  useEffect(() => { load(); return () => abortRef.current?.abort(); }, [load]);

  const positive = (quote?.regularMarketChangePercent ?? 0) >= 0;
  const color = positive ? "#34d399" : "#f87171";

  return (
    <div className="min-w-0">
      <h2 className="text-sm font-bold text-white mb-1">Ibovespa</h2>
      {loading && !quote ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-8 w-44 bg-gray-700 rounded" />
          <div className="h-3 w-60 bg-gray-800 rounded" />
          <div className="h-32 bg-gray-800 rounded mt-4" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-red-400 text-xs mt-2">
          <AlertCircle className="h-3.5 w-3.5" /> {error}
        </div>
      ) : (
        <>
          <div className="flex items-baseline gap-3 mb-0.5 flex-wrap">
            <span className="text-2xl font-bold text-white">
              {fmtNum(quote?.regularMarketPrice)}
              <span className="text-sm text-gray-400 font-normal ml-1">pontos</span>
            </span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${positive ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
              {fmtPct(quote?.regularMarketChangePercent)} {positive ? "▲" : "▼"}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mb-3">
            Variação: {fmtNum(quote?.regularMarketChange)} pts • Abertura: {fmtNum(quote?.regularMarketOpen)} • Fechamento ant.: {fmtNum(quote?.regularMarketPreviousClose)}
          </p>
          <div className="flex gap-1 mb-3 flex-wrap">
            {PERIODS.map(p => (
              <button key={p.label} onClick={() => setPeriod(p)}
                className={`px-2.5 py-1 text-[11px] rounded-full font-medium transition-all ${period.label === p.label ? "bg-gray-700 text-white border border-gray-500" : "text-gray-400 hover:text-white"}`}>
                {p.label}
              </button>
            ))}
          </div>
          {history.length > 0 && (
            <ResponsiveContainer width="100%" height={110}>
              <AreaChart data={history} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="ibovGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" hide />
                <YAxis hide domain={["auto", "auto"]} />
                <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8, fontSize: 11 }}
                  labelStyle={{ color: "#9ca3af" }} formatter={v => [fmtNum(v), "Pontos"]} />
                <Area type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} fill="url(#ibovGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
          <UpdatedAt time={updatedAt} onRefresh={load} loading={loading} />
        </>
      )}
    </div>
  );
}

// ── Movers block (altas/baixas) ────────────────────────────────────────────────
function MoversBlock({ title, sortOrder, icon }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const abortRef = useRef(null);
  const positive = sortOrder === "desc";

  const load = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true); setError(null);

    brapiFetch(`/quote/list?sortBy=change&sortOrder=${sortOrder}&limit=50&type=stock&interval=1d&range=1d`, { signal: abortRef.current.signal })
      .then(res => {
        const stocks = (res?.stocks || []).filter(s => /^[A-Z]{4}[0-9]{1,2}$/.test(s.stock) && !s.stock.endsWith('11') && !s.stock.endsWith('F'));
        setItems(stocks.slice(0, 5));
        setUpdatedAt(formatUpdatedAt());
      })
      .catch(err => { if (err.name !== "AbortError") setError(err.message); })
      .finally(() => setLoading(false));
  }, [sortOrder]);

  useEffect(() => { load(); return () => abortRef.current?.abort(); }, [load]);

  return (
    <div className="min-w-0 flex flex-col h-full">
      <div className="flex items-center gap-1.5 mb-3">
        <h3 className="text-sm font-bold text-white">{title}</h3>
        {icon}
      </div>
      <div className="flex-1 flex flex-col justify-around">
        {loading ? [...Array(5)].map((_, i) => <SkeletonRow key={i} />) : error ? (
          <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{error}</p>
        ) : (
          items.map(item => (
            <div key={item.stock} className="flex items-center gap-2">
              <AssetLogo ticker={item.stock} />
              <span className="text-xs font-semibold text-white w-14 truncate">{item.stock}</span>
              <span className={`text-xs font-semibold flex-1 ${positive ? "text-emerald-400" : "text-red-400"}`}>{fmtPct(item.change)}</span>
              <span className="text-xs text-gray-400">{item.close ? `R$ ${item.close.toFixed(2)}` : "—"}</span>
            </div>
          ))
        )}
      </div>
      <UpdatedAt time={updatedAt} onRefresh={load} loading={loading} />
    </div>
  );
}

// ── Currencies ────────────────────────────────────────────────────────────────
const currencyLabels = { "USD/BRL": "Dólar Americano", "CNY/BRL": "Yuan Chinês", "EUR/BRL": "Euro" };

function CurrenciesBlock() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const abortRef = useRef(null);

  const load = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true); setError(null);

    brapiFetch(`/v2/currency?currency=USD-BRL,EUR-BRL,CNY-BRL`, { signal: abortRef.current.signal })
      .then(res => { setItems(res?.currency || []); setUpdatedAt(formatUpdatedAt()); })
      .catch(err => { if (err.name !== "AbortError") setError(err.message); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); return () => abortRef.current?.abort(); }, [load]);

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
      <h3 className="text-sm font-bold text-white mb-3">Moedas</h3>
      <div className="text-[11px] text-gray-500 flex justify-between mb-2 border-b border-gray-700 pb-1.5">
        <span>Moeda</span><span>Cotação / Var.</span>
      </div>
      {loading ? [...Array(3)].map((_, i) => <SkeletonRow key={i} />) : error ? (
        <p className="text-xs text-red-400">{error}</p>
      ) : (
        <div className="space-y-2">
          {items.map(c => {
            const chg = c.regularMarketChangePercent ?? 0;
            return (
              <div key={c.fromCurrency || c.name} className="flex justify-between items-center gap-2">
                <span className="text-[11px] text-gray-300 truncate">{currencyLabels[c.name] || c.name}</span>
                <div className="text-right shrink-0">
                  <div className="text-[11px] text-white font-medium">R$ {Number(c.bidPrice || c.bid || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  <div className={`text-[10px] ${chg >= 0 ? "text-emerald-400" : "text-red-400"}`}>{fmtPct(chg)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <UpdatedAt time={updatedAt} onRefresh={load} loading={loading} />
    </div>
  );
}

// ── Indices ────────────────────────────────────────────────────────────────────
function IndicesBlock() {
  const [primeRate, setPrimeRate] = useState([]);
  const [inflation, setInflation] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const abortRef = useRef(null);

  const load = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true); setError(null);

    Promise.allSettled([
      brapiFetch(`/v2/prime-rate?country=brazil`, { signal: abortRef.current.signal }),
      brapiFetch(`/v2/inflation?country=brazil&sortBy=date&sortOrder=desc`, { signal: abortRef.current.signal }),
    ]).then(([pr, inf]) => {
      if (pr.status === "fulfilled") setPrimeRate(pr.value?.["prime-rate"] || []);
      if (inf.status === "fulfilled") setInflation(inf.value?.inflation || []);
      setUpdatedAt(formatUpdatedAt());
    }).catch(err => { if (err.name !== "AbortError") setError(err.message); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); return () => abortRef.current?.abort(); }, [load]);

  const selicRaw = primeRate[0]?.annualRate ?? primeRate[0]?.value ?? null;
  const selic = selicRaw != null ? parseFloat(String(selicRaw).replace(",", ".")) : null;
  const ipcaRaw = inflation[0]?.monthly ?? inflation[0]?.value ?? null;
  const ipca = ipcaRaw != null ? parseFloat(String(ipcaRaw).replace(",", ".")) : null;

  const rows = [
    { label: "Selic", value: selic },
    { label: "CDI",   value: selic != null ? selic - 0.1 : null },
    { label: "IPCA",  value: ipca },
  ];

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 flex flex-col h-full">
      <h3 className="text-sm font-bold text-white mb-3">Índices</h3>
      <div className="text-xs text-gray-500 flex justify-between mb-2 border-b border-gray-700 pb-1.5">
        <span>Índice</span><span>% a.a.</span>
      </div>
      <div className="flex-1 flex flex-col justify-around">
        {loading ? [...Array(3)].map((_, i) => <SkeletonRow key={i} />) : error ? (
          <p className="text-xs text-red-400">{error}</p>
        ) : (
          rows.map(r => (
            <div key={r.label} className="flex justify-between items-center gap-2">
              <span className="text-sm text-gray-300 truncate">{r.label}</span>
              <span className="text-sm text-white font-semibold shrink-0">{r.value != null ? `${Number(r.value).toFixed(2)}% a.a.` : "N/D"}</span>
            </div>
          ))
        )}
      </div>
      <UpdatedAt time={updatedAt} onRefresh={load} loading={loading} />
    </div>
  );
}

// ── Crypto ────────────────────────────────────────────────────────────────────
function CryptoBlock() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const abortRef = useRef(null);

  const load = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true); setError(null);
    brapiFetch(`/v2/crypto?coin=BTC,ETH,SOL&currency=BRL`, { signal: abortRef.current.signal })
      .then(res => { setItems(res?.coins || []); setUpdatedAt(formatUpdatedAt()); })
      .catch(err => { if (err.name !== "AbortError") setError(err.message); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); return () => abortRef.current?.abort(); }, [load]);

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
      <h3 className="text-sm font-bold text-white mb-3">Criptomoedas</h3>
      <div className="text-[11px] text-gray-500 flex justify-between mb-2 border-b border-gray-700 pb-1.5">
        <span>Moeda</span><span>Variação / Preço</span>
      </div>
      {loading ? [...Array(3)].map((_, i) => <SkeletonRow key={i} />) : error ? (
        <p className="text-xs text-red-400">{error}</p>
      ) : (
        <div className="space-y-2">
          {items.map(c => {
            const chg = c.regularMarketChangePercent ?? 0;
            const price = c.regularMarketPrice ?? 0;
            return (
              <div key={c.coin} className="flex items-center gap-2">
                <img src={c.coinImageUrl} alt={c.coin} onError={e => { e.target.style.display = "none"; }} className="w-5 h-5 rounded-full shrink-0" />
                <span className="text-[11px] text-gray-300 flex-1 truncate">{c.coinName || c.coin}</span>
                <div className="text-right shrink-0">
                  <div className={`text-[10px] ${chg >= 0 ? "text-emerald-400" : "text-red-400"}`}>{fmtPct(chg)}</div>
                  <div className="text-[11px] text-white font-medium">{price >= 1000 ? `R$ ${(price / 1000).toFixed(2)} K` : `R$ ${price.toFixed(2)}`}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <UpdatedAt time={updatedAt} onRefresh={load} loading={loading} />
    </div>
  );
}

export default function MarketOverview() {
  const [showSecondaryData, setShowSecondaryData] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowSecondaryData(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-4">
      {/* Ibovespa + Altas + Baixas */}
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 divide-y lg:divide-y-0 lg:divide-x divide-gray-700/60 items-stretch">
          <IbovespaBlock />
          <div className="lg:pl-6 pt-4 lg:pt-0 flex flex-col">
            <MoversBlock title="Maiores Altas" sortOrder="desc" icon={<TrendingUp className="h-4 w-4 text-emerald-400" />} />
          </div>
          <div className="lg:pl-6 pt-4 lg:pt-0 flex flex-col">
            <MoversBlock title="Maiores Baixas" sortOrder="asc" icon={<TrendingDown className="h-4 w-4 text-red-400" />} />
          </div>
        </div>
      </div>

      {/* Moedas | Índices | Criptos - com lazy load */}
      {showSecondaryData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          <CurrenciesBlock />
          <IndicesBlock />
          <CryptoBlock />
        </div>
      )}
    </div>
  );
}