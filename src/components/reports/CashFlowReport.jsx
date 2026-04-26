import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from "recharts";
import { ArrowUpCircle, ArrowDownCircle, TrendingUp } from "lucide-react";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 shadow-xl">
        <p className="text-white font-semibold mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: R$ {entry.value.toLocaleString('pt-BR')}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function CashFlowReport({ transactions = [] }) {
  // Agrupar transações por mês
  const monthlyData = transactions.reduce((acc, transaction) => {
    const date = new Date(transaction.transaction_date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    
    if (!acc[monthKey]) {
      acc[monthKey] = { month: monthLabel, entradas: 0, saidas: 0, saldo: 0 };
    }
    
    if (transaction.type === "entrada") {
      acc[monthKey].entradas += transaction.amount || 0;
    } else {
      acc[monthKey].saidas += transaction.amount || 0;
    }
    
    acc[monthKey].saldo = acc[monthKey].entradas - acc[monthKey].saidas;
    
    return acc;
  }, {});

  const chartData = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month)).slice(-12);

  // Calcular totais do ano
  const currentYear = new Date().getFullYear();
  const yearTransactions = transactions.filter(t => 
    new Date(t.transaction_date).getFullYear() === currentYear
  );

  const yearEntradas = yearTransactions
    .filter(t => t.type === "entrada")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const yearSaidas = yearTransactions
    .filter(t => t.type === "saida")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const yearSaldo = yearEntradas - yearSaidas;

  // Calcular média mensal
  const monthsCount = chartData.length || 1;
  const avgEntradas = yearEntradas / monthsCount;
  const avgSaidas = yearSaidas / monthsCount;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-emerald-900/50 to-emerald-950/30 rounded-2xl border border-emerald-500/20 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <ArrowUpCircle className="h-5 w-5 text-emerald-400" />
            </div>
            <p className="text-gray-400 text-sm">Total Entradas (Ano)</p>
          </div>
          <p className="text-3xl font-bold text-emerald-400">
            R$ {yearEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-emerald-300 mt-2">
            Média mensal: R$ {avgEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-gradient-to-br from-red-900/50 to-red-950/30 rounded-2xl border border-red-500/20 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-red-500/20 flex items-center justify-center">
              <ArrowDownCircle className="h-5 w-5 text-red-400" />
            </div>
            <p className="text-gray-400 text-sm">Total Saídas (Ano)</p>
          </div>
          <p className="text-3xl font-bold text-red-400">
            R$ {yearSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-red-300 mt-2">
            Média mensal: R$ {avgSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-gradient-to-br from-violet-900/50 to-violet-950/30 rounded-2xl border border-violet-500/20 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-violet-400" />
            </div>
            <p className="text-gray-400 text-sm">Saldo (Ano)</p>
          </div>
          <p className={`text-3xl font-bold ${yearSaldo >= 0 ? 'text-violet-400' : 'text-orange-400'}`}>
            {yearSaldo >= 0 ? '+' : ''}R$ {yearSaldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className={`text-sm mt-2 ${yearSaldo >= 0 ? 'text-violet-300' : 'text-orange-300'}`}>
            {yearSaldo >= 0 ? 'Superávit' : 'Déficit'} anual
          </p>
        </div>
      </div>

      {/* Fluxo Mensal */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-violet-950/30 rounded-2xl border border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Fluxo de Caixa Mensal</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ left: -10, right: 10 }}>
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 12 }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
              <Bar 
                dataKey="entradas" 
                name="Entradas"
                fill="#10B981" 
                radius={[8, 8, 0, 0]}
              />
              <Bar 
                dataKey="saidas" 
                name="Saídas"
                fill="#EF4444" 
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Evolução do Saldo */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-violet-950/30 rounded-2xl border border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Evolução do Saldo</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ left: -10, right: 10 }}>
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 12 }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="saldo"
                name="Saldo"
                stroke="#8B5CF6"
                strokeWidth={3}
                dot={{ fill: '#8B5CF6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}