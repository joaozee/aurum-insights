import { useState, useEffect, useRef } from "react";
import { X, TrendingUp, TrendingDown, RefreshCw, AlertCircle } from "lucide-react";
import { brapiFetch } from "@/lib/brapiClient";

function fmt(n, decimals = 2) {
  if (n == null || isNaN(n)) return "—";
  return Number(n).toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
function fmtPct(n) {
  if (n == null || isNaN(n)) return "—";
  return `${n >= 0 ? "+" : ""}${Number(n).toFixed(2)}%`;
}
function fmtBig(n) {
  if (n == null) return "—";
  if (n >= 1e12) return `R$ ${(n / 1e12).toFixed(2)} T`;
  if (n >= 1e9) return `R$ ${(n / 1e9).toFixed(2)} B`;
  if (n >= 1e6) return `R$ ${(n / 1e6).toFixed(2)} M`;
  return `R$ ${fmt(n)}`;
}

function Row({ label, value, highlight }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-800 last:border-0">
      <span className="text-xs text-gray-400">{label}</span>
      <span className={`text-sm font-semibold ${highlight || "text-white"}`}>{value}</span>
    </div>
  );
}

export default function StockSearchModal({ ticker, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (!ticker) return;
    setLoading(true);
    setError(null);
    setData(null);
    abortRef.current = new AbortController();

    brapiFetch(
      `/quote/${ticker}?modules=summaryProfile,balanceSheetHistory,defaultKeyStatistics,financialData,incomeStatementHistory`,
      { signal: abortRef.current.signal }
    )
      .then(res => {
        const r = res?.results?.[0];
        if (!r) throw new Error("Ativo não encontrado");
        setData(r);
      })
      .catch(err => {
        if (err.name !== "AbortError") setError(err.message);
      })
      .finally(() => setLoading(false));

    return () => abortRef.current?.abort();
  }, [ticker]);

  const price = data?.regularMarketPrice;
  const chgPct = data?.regularMarketChangePercent;
  const chg = data?.regularMarketChange;
  const positive = (chgPct ?? 0) >= 0;

  // Preço teto pelo método Bazin: DPA / 0.06
  const dpa = data?.dividendsData?.cashDividends?.[0]?.rate
    ?? (price && data?.dividendYield ? price * data.dividendYield / 100 : null);
  const precoTeto = dpa ? dpa / 0.06 : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-5 pt-4 pb-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <img src={`https://icons.brapi.dev/icons/${ticker}.svg`} alt={ticker}
              className="w-9 h-9 rounded-lg bg-gray-800 object-contain"
              onError={e => { e.target.style.display = "none"; }} />
            <div>
              <h2 className="text-lg font-bold text-white">{ticker}</h2>
              {data?.longName && <p className="text-xs text-gray-400 truncate max-w-[200px]">{data.longName}</p>}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5">
          {loading && (
            <div className="space-y-3 animate-pulse">
              <div className="h-10 w-40 bg-gray-800 rounded" />
              <div className="h-4 w-32 bg-gray-800 rounded" />
              {[...Array(8)].map((_, i) => <div key={i} className="h-4 bg-gray-800 rounded" />)}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {data && !loading && (
            <>
              {/* Price */}
              <div className="mb-5">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-4xl font-bold text-white">R$ {fmt(price)}</span>
                  <span className={`flex items-center gap-1 text-sm font-semibold px-2.5 py-1 rounded-full ${positive ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                    {positive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                    {fmtPct(chgPct)} ({positive ? "+" : ""}{fmt(chg)})
                  </span>
                </div>
              </div>

              {/* Metrics */}
              <div className="space-y-0">
                <Row label="Variação do dia" value={fmtPct(chgPct)} highlight={positive ? "text-emerald-400" : "text-red-400"} />
                <Row label="Dividend Yield" value={data.dividendYield != null ? `${fmt(data.dividendYield)}%` : "—"} />
                <Row label="P/L (P/E)" value={data.priceEarnings != null ? fmt(data.priceEarnings) : "—"} />
                <Row label="P/VP" value={data.priceToBook != null ? fmt(data.priceToBook) : "—"} />
                <Row label="Preço Teto (Bazin)" value={precoTeto ? `R$ ${fmt(precoTeto)}` : "—"} highlight={precoTeto && price ? (price <= precoTeto ? "text-emerald-400" : "text-red-400") : undefined} />
                <Row label="Market Cap" value={fmtBig(data.marketCap)} />
                <Row label="Volume" value={fmtBig(data.regularMarketVolume)} />
                <Row label="Máx. 52 semanas" value={data.fiftyTwoWeekHigh ? `R$ ${fmt(data.fiftyTwoWeekHigh)}` : "—"} />
                <Row label="Mín. 52 semanas" value={data.fiftyTwoWeekLow ? `R$ ${fmt(data.fiftyTwoWeekLow)}` : "—"} />
                <Row label="Abertura" value={data.regularMarketOpen ? `R$ ${fmt(data.regularMarketOpen)}` : "—"} />
                <Row label="Fechamento anterior" value={data.regularMarketPreviousClose ? `R$ ${fmt(data.regularMarketPreviousClose)}` : "—"} />
              </div>

              {data.summaryProfile?.longBusinessSummary && (
                <div className="mt-4 p-3 bg-gray-800/60 rounded-xl">
                  <p className="text-xs text-gray-400 leading-relaxed line-clamp-4">
                    {data.summaryProfile.longBusinessSummary}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}