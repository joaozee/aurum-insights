import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Skeleton } from "@/components/ui/skeleton";

function fmtMarketCap(val) {
  if (val == null) return "N/D";
  if (val >= 1e12) return `R$ ${(val / 1e12).toFixed(2).replace('.', ',')} T`;
  if (val >= 1e9) return `R$ ${(val / 1e9).toFixed(2).replace('.', ',')} B`;
  if (val >= 1e6) return `R$ ${(val / 1e6).toFixed(2).replace('.', ',')} M`;
  return `R$ ${(val / 1e3).toFixed(0)} K`;
}

function fmt(val, suffix = "") {
  if (val == null) return <span className="text-gray-600">N/D</span>;
  return `${val.toFixed(2)}${suffix}`;
}

function StockRow({ row, isMain }) {
  return (
    <tr className={`border-b border-gray-800/50 transition-colors ${isMain ? "bg-violet-900/20" : "hover:bg-gray-800/30"}`}>
      <td className="py-3 px-3">
        <div className="flex items-center gap-2">
          {row.logo_url ? (
            <img src={row.logo_url} alt={row.ticker} className="w-6 h-6 rounded object-contain bg-gray-800" />
          ) : (
            <div className="w-6 h-6 rounded bg-gray-700 flex items-center justify-center text-gray-400 text-xs font-bold">
              {row.ticker?.[0]}
            </div>
          )}
          <div>
            <span className={`font-semibold text-sm ${isMain ? "text-violet-300" : "text-white"}`}>{row.ticker}</span>
            {isMain && <span className="ml-2 text-xs bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full">atual</span>}
          </div>
        </div>
      </td>
      <td className="py-3 px-3 text-right text-sm text-gray-300">{fmt(row.pe)}</td>
      <td className="py-3 px-3 text-right text-sm text-gray-300">{fmt(row.pb)}</td>
      <td className={`py-3 px-3 text-right text-sm font-medium ${row.roe >= 15 ? "text-emerald-400" : row.roe >= 0 ? "text-gray-300" : "text-red-400"}`}>
        {fmt(row.roe, "%")}
      </td>
      <td className={`py-3 px-3 text-right text-sm font-medium ${row.dy >= 5 ? "text-emerald-400" : row.dy > 0 ? "text-amber-400" : "text-gray-600"}`}>
        {fmt(row.dy, "%")}
      </td>
      <td className="py-3 px-3 text-right text-sm text-gray-300">{fmtMarketCap(row.marketCap)}</td>
      <td className={`py-3 px-3 text-right text-sm ${row.netMargin >= 10 ? "text-emerald-400" : row.netMargin >= 0 ? "text-gray-300" : "text-red-400"}`}>
        {fmt(row.netMargin, "%")}
      </td>
    </tr>
  );
}

export default function SectorComparator({ stock }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const ticker = stock?.ticker;

  useEffect(() => {
    if (!ticker) return;
    setLoading(true);
    setError(null);
    base44.functions.invoke("getStockDetailData", { ticker, action: "sector_compare" })
      .then(res => {
        if (res?.data?.error) { setError(res.data.error); return; }
        setData(res?.data || null);
      })
      .catch(() => setError("Erro ao carregar comparação setorial"))
      .finally(() => setLoading(false));
  }, [ticker]);

  if (loading) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6">
        <Skeleton className="h-6 w-48 mb-4 bg-gray-800" />
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full mb-2 bg-gray-800" />)}
      </div>
    );
  }

  if (error || !data?.main) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6">
        <h3 className="text-white font-semibold text-lg mb-2">COMPARADOR DE AÇÕES</h3>
        <p className="text-gray-500 text-sm">Dados de comparação setorial não disponíveis.</p>
      </div>
    );
  }

  const allRows = [data.main, ...(data.peers || [])];

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-semibold text-lg">COMPARADOR DE AÇÕES</h3>
          {data.sector && (
            <p className="text-gray-500 text-sm mt-0.5">Setor: {data.sector}</p>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-gray-800 text-gray-500 text-xs">
              <th className="text-left py-2 px-3 font-medium">Ativo</th>
              <th className="text-right py-2 px-3 font-medium">P/L</th>
              <th className="text-right py-2 px-3 font-medium">P/VP</th>
              <th className="text-right py-2 px-3 font-medium">ROE</th>
              <th className="text-right py-2 px-3 font-medium">DY</th>
              <th className="text-right py-2 px-3 font-medium">Valor de Mercado</th>
              <th className="text-right py-2 px-3 font-medium">Marg. Líq.</th>
            </tr>
          </thead>
          <tbody>
            {allRows.map((row, i) => (
              <StockRow key={row.ticker} row={row} isMain={i === 0} />
            ))}
          </tbody>
        </table>
      </div>
      {(!data.peers || data.peers.length === 0) && (
        <p className="text-gray-600 text-xs mt-3 text-center">
          Nenhum par do mesmo setor disponível via API.
        </p>
      )}
    </div>
  );
}