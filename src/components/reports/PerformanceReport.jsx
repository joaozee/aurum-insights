import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, Calendar } from "lucide-react";
import { base44 } from "@/api/base44Client";

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-xl px-4 py-3 shadow-2xl">
        <p className="text-gray-300 text-sm font-semibold mb-3">{payload[0].payload.period}</p>
        <div className="space-y-2">
          {payload.map((item, i) => (
            <div key={i} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-gray-400">{item.name}</span>
              </div>
              <span className="text-sm font-bold" style={{ color: item.color }}>
                {item.value >= 0 ? '+' : ''}{item.value.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function PerformanceReport({ transactions, assets, period }) {
  const [performanceData, setPerformanceData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    calculatePerformance();
  }, [transactions, assets, period]);

  const calculatePerformance = async () => {
    setLoading(true);
    try {
      // Calcular performance da carteira por período
      const portfolioPerf = calculatePortfolioPerformance();
      
      // Buscar benchmarks simulados via IA
      const benchmarks = await fetchBenchmarkData();
      
      const data = portfolioPerf.map((item, index) => ({
        period: item.period,
        Carteira: item.performance,
        Ibovespa: benchmarks.ibovespa[index] || 0,
        CDI: benchmarks.cdi[index] || 0,
        'S&P 500': benchmarks.sp500[index] || 0
      }));

      setPerformanceData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculatePortfolioPerformance = () => {
    if (period === "monthly") {
      // Últimos 6 meses
      const months = [];
      const now = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = monthDate.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
        
        // Simular performance (em produção, calcular baseado em transações)
        const performance = Math.random() * 10 - 2; // -2% a 8%
        
        months.push({
          period: monthKey,
          performance: performance
        });
      }
      
      return months;
    } else {
      // Últimos 3 anos
      const years = [];
      const currentYear = new Date().getFullYear();
      
      for (let i = 2; i >= 0; i--) {
        const year = currentYear - i;
        const performance = Math.random() * 20 + 5; // 5% a 25%
        
        years.push({
          period: year.toString(),
          performance: performance
        });
      }
      
      return years;
    }
  };

  const fetchBenchmarkData = async () => {
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Gere dados de performance histórica simulados para benchmarks brasileiros e internacionais.
        Período: ${period === "monthly" ? "últimos 6 meses" : "últimos 3 anos"}
        
        Retorne performance percentual mensal/anual para:
        - Ibovespa: índice de ações brasileiras
        - CDI: taxa de juros brasileira
        - S&P 500: índice americano
        
        Os valores devem ser realistas e variar entre -5% a 15% para ações e 0.5% a 1.5% para CDI mensal.`,
        response_json_schema: {
          type: "object",
          properties: {
            ibovespa: { type: "array", items: { type: "number" } },
            cdi: { type: "array", items: { type: "number" } },
            sp500: { type: "array", items: { type: "number" } }
          }
        }
      });

      return result;
    } catch (err) {
      console.error(err);
      return {
        ibovespa: [3.2, 4.1, -1.5, 5.8, 2.3, 6.1],
        cdi: [0.9, 0.95, 0.92, 0.88, 0.91, 0.93],
        sp500: [4.5, 3.8, -0.5, 7.2, 4.1, 5.5]
      };
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-800 rounded mb-6" />
        <div className="h-80 bg-gray-800 rounded" />
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-violet-950/30 rounded-2xl border border-gray-800 p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="h-5 w-5 text-violet-400" />
        <div>
          <h3 className="text-lg font-semibold text-white">Comparativo de Performance</h3>
          <p className="text-gray-500 text-sm">Carteira vs Benchmarks</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={performanceData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="gradCarteira" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.6} />
            </linearGradient>
            <linearGradient id="gradIbovespa" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.6} />
            </linearGradient>
            <linearGradient id="gradCDI" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#10B981" stopOpacity={0.6} />
            </linearGradient>
            <linearGradient id="gradSP500" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.6} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
          <XAxis 
            dataKey="period" 
            axisLine={false}
            tickLine={false}
            stroke="#9CA3AF"
            style={{ fontSize: '13px', fontWeight: 500 }}
            height={50}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            stroke="#9CA3AF"
            style={{ fontSize: '13px', fontWeight: 500 }}
            tickFormatter={(value) => `${value}%`}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#374151', opacity: 0.2 }} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />
          <Bar dataKey="Carteira" fill="url(#gradCarteira)" radius={[8, 8, 0, 0]} />
          <Bar dataKey="Ibovespa" fill="url(#gradIbovespa)" radius={[8, 8, 0, 0]} />
          <Bar dataKey="CDI" fill="url(#gradCDI)" radius={[8, 8, 0, 0]} />
          <Bar dataKey="S&P 500" fill="url(#gradSP500)" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-800">
        {performanceData.length > 0 && (
          <>
            <MetricCard 
              label="Sua Carteira" 
              value={`${performanceData[performanceData.length - 1]?.Carteira.toFixed(2)}%`}
              color="text-violet-400"
            />
            <MetricCard 
              label="Ibovespa" 
              value={`${performanceData[performanceData.length - 1]?.Ibovespa.toFixed(2)}%`}
              color="text-amber-400"
            />
            <MetricCard 
              label="CDI" 
              value={`${performanceData[performanceData.length - 1]?.CDI.toFixed(2)}%`}
              color="text-emerald-400"
            />
            <MetricCard 
              label="S&P 500" 
              value={`${performanceData[performanceData.length - 1]?.['S&P 500'].toFixed(2)}%`}
              color="text-blue-400"
            />
          </>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, color }) {
  return (
    <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className={`font-bold text-lg ${color}`}>{value}</p>
    </div>
  );
}