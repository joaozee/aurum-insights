import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function PerformanceComparison({ assets, transactions }) {
  const [comparisonData, setComparisonData] = useState(null);
  const [period, setPeriod] = useState('12m'); // 'all', '12m', 'last-year', '5y'

  useEffect(() => {
    calculateComparison();
  }, [assets, transactions, period]);

  const calculateComparison = () => {
    if (!transactions || transactions.length === 0) {
      setComparisonData(null);
      return;
    }

    // Calcular valor total investido (base para comparação)
    const totalInvested = transactions
      .filter(t => t.type === 'compra')
      .reduce((sum, t) => sum + t.total_value, 0);

    if (totalInvested === 0) {
      setComparisonData(null);
      return;
    }

    // Calcular valor atual da carteira
    const currentValue = Object.values(assets).reduce(
      (sum, a) => sum + a.quantity * (a.current_price || a.purchase_price),
      0
    );

    // Determinar número de meses baseado no período selecionado
    let months = 12;
    const now = new Date();
    
    if (period === 'all') {
      // Desde a primeira transação
      const firstTransaction = transactions
        .filter(t => t.type === 'compra')
        .sort((a, b) => new Date(a.transaction_date) - new Date(b.transaction_date))[0];
      
      if (firstTransaction) {
        const firstDate = new Date(firstTransaction.transaction_date);
        months = Math.max(1, Math.ceil((now - firstDate) / (1000 * 60 * 60 * 24 * 30)));
      }
    } else if (period === '12m') {
      months = 12;
    } else if (period === 'last-year') {
      months = 12;
    } else if (period === '5y') {
      months = 60;
    }

    const chartData = [];
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    // Taxas mensais dos benchmarks (aproximadas)
    const ibovespaMonthly = 0.007; // ~8.4% a.a.
    const cdiMonthly = 0.0095; // ~12% a.a.
    const inflacaoMonthly = 0.0038; // ~4.6% a.a. (IPCA)

    // Calcular retorno real da carteira por mês (linear)
    const carteiraTotalReturn = (currentValue - totalInvested) / totalInvested;
    const carteiraMonthlyReturn = carteiraTotalReturn / months;

    for (let i = 0; i < months; i++) {
      // Calcular mês e ano real
      const date = new Date(now);
      date.setMonth(date.getMonth() - (months - i - 1));
      const monthLabel = monthNames[date.getMonth()];
      const yearLabel = date.getFullYear().toString().slice(-2);
      
      // Carteira: crescimento linear baseado no retorno real
      const carteiraValue = totalInvested * (1 + carteiraMonthlyReturn * (i + 1));
      
      // Benchmarks: crescimento exponencial sobre o valor investido
      const ibovespaValue = totalInvested * Math.pow(1 + ibovespaMonthly, i + 1);
      const cdiValue = totalInvested * Math.pow(1 + cdiMonthly, i + 1);
      const inflacaoValue = totalInvested * Math.pow(1 + inflacaoMonthly, i + 1);

      chartData.push({
        month: months > 24 ? `${monthLabel}/${yearLabel}` : monthLabel,
        carteira: Math.round(carteiraValue),
        ibovespa: Math.round(ibovespaValue),
        cdi: Math.round(cdiValue),
        inflacao: Math.round(inflacaoValue)
      });
    }

    setComparisonData(chartData);
  };

  const calculateMetrics = () => {
    if (!comparisonData || comparisonData.length === 0) return {};

    const lastData = comparisonData[comparisonData.length - 1];
    const firstData = comparisonData[0];

    return {
      carteira: {
        return: (((lastData.carteira - firstData.carteira) / firstData.carteira) * 100).toFixed(2),
        value: lastData.carteira
      },
      ibovespa: {
        return: (((lastData.ibovespa - firstData.ibovespa) / firstData.ibovespa) * 100).toFixed(2),
        value: lastData.ibovespa
      },
      cdi: {
        return: (((lastData.cdi - firstData.cdi) / firstData.cdi) * 100).toFixed(2),
        value: lastData.cdi
      },
      inflacao: {
        return: (((lastData.inflacao - firstData.inflacao) / firstData.inflacao) * 100).toFixed(2),
        value: lastData.inflacao
      }
    };
  };

  const metrics = calculateMetrics();

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid md:grid-cols-4 gap-4">
        {[
          { label: "Sua Carteira", key: "carteira", color: "violet", icon: "📊" },
          { label: "Ibovespa", key: "ibovespa", color: "amber", icon: "📈" },
          { label: "CDI", key: "cdi", color: "emerald", icon: "💰" },
          { label: "Inflação (IPCA)", key: "inflacao", color: "red", icon: "📉" }
        ].map(metric => (
          <Card key={metric.key} className={cn(
            "bg-gray-900 border-gray-800",
            metric.key === "carteira" && "border-violet-500/30"
          )}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-2">
                <p className="text-gray-400 text-sm">{metric.label}</p>
                <span className="text-2xl">{metric.icon}</span>
              </div>
              <p className="text-white text-2xl font-bold mb-1">
                {metrics[metric.key]?.return || "0"}%
              </p>
              <div className={cn(
                "flex items-center gap-1",
                parseFloat(metrics[metric.key]?.return) >= 0 ? "text-emerald-400" : "text-red-400"
              )}>
                {parseFloat(metrics[metric.key]?.return) >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span className="text-xs">Retorno 12 meses</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Comparison Chart */}
      {comparisonData && (
        <Card className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border border-gray-800">
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <CardTitle className="text-white text-xl font-bold">Performance vs Benchmarks</CardTitle>
                <p className="text-gray-400 text-sm">Comparação da sua carteira com índices de mercado</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant={period === 'all' ? 'default' : 'outline'}
                  onClick={() => setPeriod('all')}
                  className={period === 'all' ? 'bg-violet-600 hover:bg-violet-700' : 'border-gray-700 text-gray-300'}
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  Tudo
                </Button>
                <Button
                  size="sm"
                  variant={period === '12m' ? 'default' : 'outline'}
                  onClick={() => setPeriod('12m')}
                  className={period === '12m' ? 'bg-violet-600 hover:bg-violet-700' : 'border-gray-700 text-gray-300'}
                >
                  12 meses
                </Button>
                <Button
                  size="sm"
                  variant={period === 'last-year' ? 'default' : 'outline'}
                  onClick={() => setPeriod('last-year')}
                  className={period === 'last-year' ? 'bg-violet-600 hover:bg-violet-700' : 'border-gray-700 text-gray-300'}
                >
                  Ano passado
                </Button>
                <Button
                  size="sm"
                  variant={period === '5y' ? 'default' : 'outline'}
                  onClick={() => setPeriod('5y')}
                  className={period === '5y' ? 'bg-violet-600 hover:bg-violet-700' : 'border-gray-700 text-gray-300'}
                >
                  5 anos
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={comparisonData}>
                <defs>
                  <linearGradient id="carteiraGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="month" 
                  stroke="#9ca3af" 
                  style={{ fontSize: '12px' }}
                  tick={{ fill: '#9ca3af' }}
                />
                <YAxis 
                  stroke="#9ca3af" 
                  style={{ fontSize: '12px' }}
                  tick={{ fill: '#9ca3af' }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
                  }}
                  labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                  itemStyle={{ color: '#d1d5db' }}
                  formatter={(value) => [`R$ ${value.toLocaleString('pt-BR')}`, '']}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="line"
                  content={({ payload }) => (
                    <div className="flex flex-wrap gap-4 justify-center pt-4">
                      {payload.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div 
                            className="w-8 h-0.5" 
                            style={{ 
                              backgroundColor: entry.color,
                              borderStyle: entry.dataKey === 'carteira' ? 'solid' : 'dashed'
                            }}
                          />
                          <span className="text-gray-300 text-sm">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                />
                <Line 
                  type="monotone" 
                  dataKey="carteira" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
                  name="Sua Carteira"
                />
                <Line 
                  type="monotone" 
                  dataKey="ibovespa" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Ibovespa"
                />
                <Line 
                  type="monotone" 
                  dataKey="cdi" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="CDI"
                />
                <Line 
                  type="monotone" 
                  dataKey="inflacao" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Inflação (IPCA)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}