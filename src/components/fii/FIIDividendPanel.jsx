import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";

export default function FIIDividendPanel({ data }) {
  const [view, setView] = useState("monthly"); // monthly | yearly
  const [metric, setMetric] = useState("total"); // total | yield

  if (!data?.dividend_history) return null;
  const { monthly = [], yearly = [] } = data.dividend_history;
  const chartData = view === "monthly" ? monthly.slice(-24) : yearly;

  if (!chartData.length) return null;

  const label = view === "monthly" ? "month" : "year";
  // yearly usa campo "dividends", monthly usa "total"
  const valueKey = view === "yearly" ? "dividends" : (metric === "total" ? "total" : "yield");
  const valueLabel = metric === "total" ? "Dividendo (R$)" : "DY (%)";
  const color = metric === "total" ? "#8b5cf6" : "#10b981";

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h3 className="text-white font-semibold text-lg">Histórico de Dividendos</h3>
        <div className="flex gap-2">
          <ToggleGroup
            options={[{ value: "monthly", label: "Mensal" }, { value: "yearly", label: "Anual" }]}
            value={view}
            onChange={setView}
          />
          <ToggleGroup
            options={[{ value: "total", label: "R$" }, { value: "yield", label: "DY%" }]}
            value={metric}
            onChange={setMetric}
          />
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
          <XAxis dataKey={label} tick={{ fill: '#9ca3af', fontSize: 11 }} tickLine={false} />
          <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
            labelStyle={{ color: '#e5e7eb' }}
            formatter={(v) => [metric === 'total' ? `R$ ${v}` : `${v}%`, valueLabel]}
          />
          <Bar dataKey={valueKey} fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* Tabela resumo (últimos 12 meses) */}
      {view === "monthly" && monthly.length > 0 && (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800">
                <th className="text-left pb-2 font-medium">Mês</th>
                <th className="text-right pb-2 font-medium">Dividendo</th>
                <th className="text-right pb-2 font-medium">DY Mês</th>
              </tr>
            </thead>
            <tbody>
              {[...monthly].reverse().slice(0, 12).map((m) => (
                <tr key={m.month} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="py-2 text-gray-300">{m.month}</td>
                  <td className="py-2 text-right text-white font-medium">R$ {m.total}</td>
                  <td className="py-2 text-right text-emerald-400">{m.yield != null ? `${m.yield}%` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ToggleGroup({ options, value, onChange }) {
  return (
    <div className="flex bg-gray-800 rounded-lg p-0.5">
      {options.map(o => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${value === o.value ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}