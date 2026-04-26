import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

export default function FIIFinancialHistory({ data }) {
  const history = (data?.financial_history || []).filter(
    h => h.year && h.dividends > 0 && h.avg_price > 0 && h.dy > 0 && h.dy <= 50
  );

  if (!history.length) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6">
        <h3 className="text-white font-semibold text-lg mb-2">DY Anual Histórico</h3>
        <p className="text-gray-500 text-sm">Dados históricos insuficientes para este ativo.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6">
      <h3 className="text-white font-semibold text-lg mb-5">DY Anual Histórico</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={history} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
          <XAxis dataKey="year" tick={{ fill: '#9ca3af', fontSize: 12 }} tickLine={false} />
          <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} tickLine={false} axisLine={false} unit="%" />
          <Tooltip
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
            formatter={(v, n) => [n === 'dy' ? `${v}%` : `R$ ${v}`, n === 'dy' ? 'DY Anual' : 'Dividendos']}
            labelStyle={{ color: '#e5e7eb' }}
          />
          <Bar dataKey="dy" radius={[4, 4, 0, 0]} name="dy">
            {history.map((entry, i) => (
              <Cell key={i} fill={entry.dy >= 10 ? '#10b981' : entry.dy >= 7 ? '#8b5cf6' : '#f59e0b'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Tabela */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 border-b border-gray-800">
              <th className="text-left pb-2 font-medium">Ano</th>
              <th className="text-right pb-2 font-medium">Dividendos</th>
              <th className="text-right pb-2 font-medium">Preço Médio</th>
              <th className="text-right pb-2 font-medium">DY Anual</th>
              <th className="text-right pb-2 font-medium">Distribuições</th>
            </tr>
          </thead>
          <tbody>
            {[...history].reverse().map((h) => (
              <tr key={h.year} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="py-2 text-gray-300 font-medium">{h.year}</td>
                <td className="py-2 text-right text-white">R$ {h.dividends}</td>
                <td className="py-2 text-right text-gray-400">R$ {h.avg_price}</td>
                <td className="py-2 text-right">
                  <span className={`font-semibold ${h.dy >= 10 ? 'text-emerald-400' : h.dy >= 7 ? 'text-violet-400' : 'text-amber-400'}`}>
                    {h.dy}%
                  </span>
                </td>
                <td className="py-2 text-right text-gray-400">{h.count}x</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}