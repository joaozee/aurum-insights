import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useEffect, useState } from "react";
import { Calendar } from "lucide-react";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const invested = payload.find(p => p.dataKey === 'invested')?.value || 0;
    const gain = payload.find(p => p.dataKey === 'gain')?.value || 0;
    const total = invested + gain;
    return (
      <div className="bg-white text-gray-900 rounded-xl px-5 py-4 shadow-2xl border border-gray-100 min-w-[200px]">
        <p className="font-bold text-sm mb-3">{label}</p>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-indigo-600" />
            <div>
              <p className="text-xs text-gray-500">Patrimônio</p>
              <p className="text-sm font-semibold">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-emerald-500" />
            <div>
              <p className="text-xs text-gray-500">Valor aplicado</p>
              <p className="text-sm font-semibold">R$ {invested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-emerald-300" />
            <div>
              <p className="text-xs text-gray-500">Ganho capital</p>
              <p className="text-sm font-semibold">R$ {gain.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function PortfolioEvolution({ transactions, assets }) {
  const [evolutionData, setEvolutionData] = useState([]);
  const [period, setPeriod] = useState('12m');

  useEffect(() => {
    calculateEvolution();
  }, [transactions, assets, period]);

  const calculateEvolution = () => {
    if (!transactions || transactions.length === 0) return;

    const totalInvested = transactions
      .filter(t => t.type === 'compra')
      .reduce((sum, t) => sum + t.total_value, 0);

    if (totalInvested === 0) { setEvolutionData([]); return; }

    const currentValue = Object.values(assets).reduce(
      (sum, a) => sum + a.quantity * (a.current_price || a.purchase_price), 0
    );

    const totalReturn = (currentValue - totalInvested) / totalInvested;

    const sortedTransactions = [...transactions].sort((a, b) =>
      new Date(a.transaction_date) - new Date(b.transaction_date)
    );

    const now = new Date();
    let startDate;
    if (period === 'all') {
      startDate = new Date(sortedTransactions[0].transaction_date);
    } else if (period === '12m') {
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 12);
    } else if (period === 'last-year') {
      startDate = new Date(now.getFullYear() - 1, 0, 1);
    } else if (period === '5y') {
      startDate = new Date(now);
      startDate.setFullYear(startDate.getFullYear() - 5);
    }

    const months = Math.max(1, Math.ceil((now - startDate) / (1000 * 60 * 60 * 24 * 30)));
    const monthlyReturn = totalReturn / months;

    // Build a map of cumulative invested per month
    const monthlyInvested = {};
    sortedTransactions.forEach(t => {
      const date = new Date(t.transaction_date);
      if (date < startDate) return;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyInvested[key]) monthlyInvested[key] = 0;
      monthlyInvested[key] += t.type === 'compra' ? t.total_value : -t.total_value;
    });

    // Fill in all months in range (even empty ones)
    const allMonths = [];
    const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    while (cursor <= now) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
      allMonths.push(key);
      cursor.setMonth(cursor.getMonth() + 1);
    }

    let cumulativeInvested = 0;
    const chartData = allMonths.map((key, index) => {
      cumulativeInvested += (monthlyInvested[key] || 0);
      const [year, month] = key.split('-');
      const label = `${String(month).padStart(2, '0')}/${year.slice(-2)}`;
      const portfolioValue = cumulativeInvested * (1 + monthlyReturn * (index + 1));
      const gain = Math.max(0, portfolioValue - cumulativeInvested);
      return {
        date: label,
        invested: Math.round(cumulativeInvested),
        gain: Math.round(gain),
      };
    }).filter(d => d.invested > 0 || d.gain > 0);

    setEvolutionData(chartData);
  };

  if (evolutionData.length === 0) return null;

  const formatYAxis = (value) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toLocaleString('pt-BR');
  };

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h3 className="text-lg font-semibold text-white">Evolução do Patrimônio</h3>
        <div className="flex gap-2 flex-wrap">
          {[
            { value: '12m', label: '12 Meses' },
            { value: 'all', label: 'Tudo' },
            { value: 'last-year', label: 'Ano passado' },
            { value: '5y', label: '5 anos' },
          ].map(btn => (
            <button
              key={btn.value}
              onClick={() => setPeriod(btn.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                period === btn.value
                  ? 'bg-gray-700 text-white border border-gray-600'
                  : 'bg-gray-800 text-gray-400 border border-gray-700 hover:text-white'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-emerald-500" />
          <span className="text-gray-400 text-xs">Valor aplicado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-emerald-300" />
          <span className="text-gray-400 text-xs">Ganho capital</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={360}>
        <BarChart data={evolutionData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }} barCategoryGap="25%">
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6b7280', fontSize: 11 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6b7280', fontSize: 11 }}
            tickFormatter={formatYAxis}
            width={65}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          <Bar dataKey="invested" name="Valor aplicado" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
          <Bar dataKey="gain" name="Ganho capital" stackId="a" fill="#6ee7b7" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}