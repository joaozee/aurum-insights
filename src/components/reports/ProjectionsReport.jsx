import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, Calendar, DollarSign } from "lucide-react";

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

export default function ProjectionsReport({ portfolio, transactions = [], goals = [] }) {
  const currentValue = portfolio?.current_value || 0;
  
  // Calcular média de aportes mensais (últimos 6 meses)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const recentDeposits = transactions
    .filter(t => t.type === "entrada" && new Date(t.transaction_date) >= sixMonthsAgo)
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  
  const avgMonthlyDeposit = recentDeposits / 6;

  // Projeções com diferentes taxas de retorno
  const projectionYears = 10;
  const rates = [
    { name: "Conservador (6%)", rate: 0.06, color: "#10B981" },
    { name: "Moderado (10%)", rate: 0.10, color: "#8B5CF6" },
    { name: "Agressivo (14%)", rate: 0.14, color: "#F59E0B" }
  ];

  const projectionData = [];
  for (let year = 0; year <= projectionYears; year++) {
    const dataPoint = { year: `Ano ${year}` };
    
    rates.forEach(({ name, rate }) => {
      let value = currentValue;
      for (let m = 0; m < year * 12; m++) {
        value = value * (1 + rate / 12) + avgMonthlyDeposit;
      }
      dataPoint[name] = Math.round(value);
    });
    
    projectionData.push(dataPoint);
  }

  // Valor projetado em 10 anos (cenário moderado)
  const projected10Years = projectionData[projectionYears]["Moderado (10%)"];
  const projectedGrowth = projected10Years - currentValue;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-violet-950/30 rounded-2xl border border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-violet-400" />
            </div>
            <p className="text-gray-400 text-sm">Patrimônio Atual</p>
          </div>
          <p className="text-3xl font-bold text-white">
            R$ {currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-violet-950/30 rounded-2xl border border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            </div>
            <p className="text-gray-400 text-sm">Aporte Mensal Médio</p>
          </div>
          <p className="text-3xl font-bold text-emerald-400">
            R$ {avgMonthlyDeposit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-gray-400 mt-2">Últimos 6 meses</p>
        </div>

        <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-violet-950/30 rounded-2xl border border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-amber-400" />
            </div>
            <p className="text-gray-400 text-sm">Projeção 10 Anos</p>
          </div>
          <p className="text-3xl font-bold text-amber-400">
            R$ {projected10Years.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
          </p>
          <p className="text-sm text-amber-300 mt-2">
            +R$ {projectedGrowth.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      {/* Projeção de Crescimento */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-violet-950/30 rounded-2xl border border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-2">Projeção de Patrimônio</h3>
        <p className="text-gray-400 text-sm mb-6">
          Simulação baseada em aporte mensal médio de R$ {avgMonthlyDeposit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={projectionData} margin={{ left: -10, right: 10 }}>
              <XAxis 
                dataKey="year" 
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
              {rates.map(({ name, color }) => (
                <Line
                  key={name}
                  type="monotone"
                  dataKey={name}
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Metas e Projeções */}
      {goals.length > 0 && (
        <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-violet-950/30 rounded-2xl border border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Projeção para Metas</h3>
          <div className="space-y-4">
            {goals.filter(g => g.status === "em_progresso").map((goal) => {
              const targetDate = new Date(goal.target_date);
              const monthsUntilTarget = Math.max(0, 
                (targetDate.getFullYear() - new Date().getFullYear()) * 12 +
                (targetDate.getMonth() - new Date().getMonth())
              );
              
              const remaining = goal.target_amount - (goal.current_amount || 0);
              const monthlyNeeded = monthsUntilTarget > 0 ? remaining / monthsUntilTarget : remaining;
              
              return (
                <div key={goal.id} className="p-4 bg-gray-800/50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-white">{goal.title}</h4>
                    <span className="text-sm text-gray-400">
                      {monthsUntilTarget} meses
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Aporte mensal necessário</p>
                      <p className="text-xl font-bold text-violet-400">
                        R$ {monthlyNeeded.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Faltam</p>
                      <p className="text-lg font-semibold text-white">
                        R$ {remaining.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}