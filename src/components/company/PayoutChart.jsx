import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Info } from "lucide-react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

const RANGES = ["5 ANOS", "10 ANOS", "MÁX"];

function formatBRL(val) {
  if (val == null) return "N/D";
  const abs = Math.abs(val);
  if (abs >= 1) return `R$ ${val.toFixed(2).replace('.', ',')} B`;
  if (abs >= 0.001) return `R$ ${(val * 1000).toFixed(0)} M`;
  return `R$ ${val.toFixed(4).replace('.', ',')} B`;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-3 text-xs shadow-xl">
      <p className="text-gray-300 font-semibold mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-400">{p.name}:</span>
          <span className="text-white font-medium">
            {p.name === "Lucro Líquido" ? formatBRL(p.value) : `${p.value?.toFixed(2)}%`}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function PayoutChart({ stock }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("5 ANOS");
  const [error, setError] = useState(null);

  const ticker = stock?.ticker;

  useEffect(() => {
    if (!ticker) return;
    setLoading(true);
    setError(null);
    base44.functions.invoke("getStockDetailData", { ticker, action: "payout" })
      .then(res => {
        if (res?.data?.error) { setError(res.data.error); return; }
        setData(res?.data || null);
      })
      .catch(() => setError("Erro ao carregar dados de payout"))
      .finally(() => setLoading(false));
  }, [ticker]);

  if (loading) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6">
        <Skeleton className="h-6 w-48 mb-4 bg-gray-800" />
        <Skeleton className="h-56 w-full bg-gray-800" />
      </div>
    );
  }
  if (error || !data?.rows?.length) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6">
        <h3 className="text-white font-semibold text-lg mb-2">PAYOUT DE {ticker}</h3>
        <p className="text-gray-500 text-sm">Dados de payout não disponíveis para este ativo.</p>
      </div>
    );
  }

  const rangeMap = { "5 ANOS": 5, "10 ANOS": 10, "MÁX": 9999 };
  const cutoff = rangeMap[range];
  const currentYear = new Date().getFullYear();
  const rows = data.rows
    .filter(r => (currentYear - r.year) < cutoff)
    .map(r => ({ ...r, yearLabel: String(r.year) }));

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-lg">PAYOUT DE {ticker}</h3>
        <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
          {RANGES.map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                range === r ? "bg-violet-600 text-white" : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={rows} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
          <XAxis dataKey="yearLabel" tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            yAxisId="left"
            tick={{ fill: "#9CA3AF", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => `R$${v.toFixed(0)}B`}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fill: "#9CA3AF", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => `${v}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, color: "#9CA3AF" }}
            iconType="circle"
            iconSize={8}
          />
          <Bar yAxisId="left" dataKey="netIncomeB" name="Lucro Líquido" fill="#1e3a5f" radius={[3, 3, 0, 0]} />
          <Line yAxisId="right" type="monotone" dataKey="payout" name="Payout" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: "#10b981" }} connectNulls />
          <Line yAxisId="right" type="monotone" dataKey="dy" name="Dividend Yield" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: "#f59e0b" }} connectNulls />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="flex items-start gap-2 mt-4 bg-gray-800/50 rounded-xl p-3">
        <Info className="h-4 w-4 text-gray-500 mt-0.5 shrink-0" />
        <p className="text-gray-500 text-xs leading-relaxed">
          O Payout é calculado dividindo o total de dividendos pagos pelo lucro líquido do mesmo exercício.
          Meses destacados em <span className="text-violet-400">violeta</span> indicam maior probabilidade histórica de pagamento.
        </p>
      </div>
    </div>
  );
}