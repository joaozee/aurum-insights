import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Skeleton } from "@/components/ui/skeleton";
import { Info } from "lucide-react";

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function MonthCell({ active, count }) {
  if (!active) {
    return (
      <div className="flex flex-col items-center justify-center h-10 w-full">
        <div className="w-2 h-2 rounded-full bg-gray-700" />
      </div>
    );
  }
  const intensity = count >= 4 ? "bg-violet-500" : count >= 2 ? "bg-violet-400/70" : "bg-violet-300/50";
  return (
    <div className={`flex flex-col items-center justify-center h-10 w-full rounded-lg ${intensity}`}>
      <div className="w-2 h-2 rounded-full bg-white" />
    </div>
  );
}

export default function DividendRadar({ stock }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const ticker = stock?.ticker;

  useEffect(() => {
    if (!ticker) return;
    setLoading(true);
    setError(null);
    base44.functions.invoke("getStockDetailData", { ticker, action: "dividend_radar" })
      .then(res => {
        if (res?.data?.error) { setError(res.data.error); return; }
        setData(res?.data || null);
      })
      .catch(() => setError("Erro ao carregar radar de dividendos"))
      .finally(() => setLoading(false));
  }, [ticker]);

  if (loading) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6">
        <Skeleton className="h-6 w-72 mb-4 bg-gray-800" />
        <Skeleton className="h-28 w-full bg-gray-800" />
      </div>
    );
  }

  const noData = error || !data || data.totalDividends === 0;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6">
      <h3 className="text-white font-semibold text-lg mb-1">
        RADAR DE DIVIDENDOS INTELIGENTE PARA {ticker}
      </h3>
      <p className="text-gray-400 text-sm mb-4 leading-relaxed">
        Com base no histórico de proventos da {ticker}, o Radar de Dividendos Inteligente projeta quais os possíveis meses de pagamentos de proventos no futuro.
      </p>

      {noData ? (
        <p className="text-gray-500 text-sm">Histórico de dividendos insuficiente para projeção.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-xs">
              <thead>
                <tr>
                  <td className="text-gray-500 font-medium pr-3 py-1 whitespace-nowrap w-28">Data Com</td>
                  {MONTHS.map((m, i) => (
                    <td key={i} className="text-center text-gray-500 font-medium px-1 py-1">{m}</td>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="text-gray-400 pr-3 py-1 whitespace-nowrap text-xs">Data Com</td>
                  {data.exMonths.map((cell, i) => (
                    <td key={i} className="px-1 py-1">
                      <MonthCell active={cell.active} count={cell.count} />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="text-gray-400 pr-3 py-1 whitespace-nowrap text-xs">Data Pgto</td>
                  {data.payMonths.map((cell, i) => (
                    <td key={i} className="px-1 py-1">
                      <MonthCell active={cell.active} count={cell.count} />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

        </>
      )}
    </div>
  );
}