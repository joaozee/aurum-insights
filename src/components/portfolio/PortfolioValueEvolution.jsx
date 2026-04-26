import { useState, useEffect, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Calendar, TrendingUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";

export default function PortfolioValueEvolution({ transactions, assets }) {
  const [period, setPeriod] = useState("6m");
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingBenchmarks, setLoadingBenchmarks] = useState(false);
  const [showBenchmarks, setShowBenchmarks] = useState(false);

  // Cache persistente em localStorage
  const getBenchmarkCache = () => {
    try {
      return JSON.parse(localStorage.getItem('benchmarkCache') || '{}');
    } catch {
      return {};
    }
  };

  const setBenchmarkCacheLocal = (key, data) => {
    try {
      const cache = getBenchmarkCache();
      cache[key] = { data, timestamp: Date.now() };
      localStorage.setItem('benchmarkCache', JSON.stringify(cache));
    } catch {
      // localStorage cheio ou indisponível
    }
  };

  useEffect(() => {
    if (transactions && transactions.length > 0) {
      generateChartData();
    } else {
      setLoading(false);
    }
  }, [transactions, assets, period]);

  const generateChartData = async () => {
    setLoading(true);
    try {
      // Determinar período de dados
      const today = new Date();
      let startDate = new Date();
      let interval = 'day';

      switch (period) {
        case "1m":
          startDate.setMonth(today.getMonth() - 1);
          interval = 'day';
          break;
        case "3m":
          startDate.setMonth(today.getMonth() - 3);
          interval = 'week';
          break;
        case "6m":
          startDate.setMonth(today.getMonth() - 6);
          interval = 'week';
          break;
        case "1y":
          startDate.setFullYear(today.getFullYear() - 1);
          interval = 'month';
          break;
        case "all":
          const oldestTransaction = [...transactions].sort((a, b) => 
            new Date(a.transaction_date) - new Date(b.transaction_date)
          )[0];
          if (oldestTransaction) {
            startDate = new Date(oldestTransaction.transaction_date);
          }
          interval = 'month';
          break;
      }

      // Gerar pontos de dados - otimizado
      const dataPoints = [];
      const currentDate = new Date(startDate);
      const investedAtDate = (date) => {
        const relevant = transactions.filter(t => 
          t.type === "compra" && new Date(t.transaction_date) <= date
        );
        return relevant.reduce((sum, t) => sum + t.total_value, 0);
      };
      
      while (currentDate <= today) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const portfolioValue = calculatePortfolioValueAtDate(currentDate);
        const investedAmount = investedAtDate(currentDate);

        dataPoints.push({
          date: dateStr,
          displayDate: formatDateForDisplay(currentDate, interval),
          carteira: portfolioValue,
          invested: investedAmount,
          ibovespa: null,
          cdi: null,
          ipca: null
        });

        // Avançar para o próximo ponto
        switch (interval) {
          case 'day':
            currentDate.setDate(currentDate.getDate() + 1);
            break;
          case 'week':
            currentDate.setDate(currentDate.getDate() + 7);
            break;
          case 'month':
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
        }
      }

      // Não carregar benchmarks no carregamento inicial - apenas mostrar carteira
      setChartData(dataPoints);
      
      // Carregar benchmarks em background após gráfico estar pronto
      if (showBenchmarks) {
        fetchBenchmarksBackground(startDate, today, dataPoints);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculatePortfolioValueAtDate = (date) => {
    // Filtrar transações até esta data
    const relevantTransactions = transactions.filter(t => 
      new Date(t.transaction_date) <= date
    );

    if (relevantTransactions.length === 0) return 0;

    // Agrupar por ticker
    const holdings = {};
    relevantTransactions.forEach(t => {
      if (!holdings[t.ticker]) {
        holdings[t.ticker] = { quantity: 0, totalCost: 0 };
      }

      if (t.type === "compra") {
        holdings[t.ticker].quantity += t.quantity;
        holdings[t.ticker].totalCost += t.total_value;
      } else {
        holdings[t.ticker].quantity -= t.quantity;
        holdings[t.ticker].totalCost -= t.total_value;
      }
    });

    // Calcular valor total (usando preço atual como proxy)
    let totalValue = 0;
    Object.keys(holdings).forEach(ticker => {
      const holding = holdings[ticker];
      if (holding.quantity > 0) {
        const asset = assets[ticker];
        const currentPrice = asset?.current_price || (holding.totalCost / holding.quantity);
        totalValue += holding.quantity * currentPrice;
      }
    });

    return totalValue;
  };

  const formatDateForDisplay = (date, interval) => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    if (interval === 'month' || interval === 'week') {
      return `${months[date.getMonth()]}/${date.getFullYear().toString().slice(2)}`;
    }
    return `${date.getDate()}/${months[date.getMonth()]}`;
  };

  const fetchBenchmarksBackground = async (startDate, endDate, baseData) => {
    const cacheKey = `${startDate.toISOString()}_${endDate.toISOString()}`;
    const cache = getBenchmarkCache();
    const cached = cache[cacheKey];

    // Usar cache se houver e não tiver expirado (24h)
    if (cached && (Date.now() - cached.timestamp) < 86400000) {
      const enrichedData = baseData.map((point, idx) => ({
        ...point,
        ibovespa: cached.data.ibovespa?.[idx],
        cdi: cached.data.cdi?.[idx],
        ipca: cached.data.ipca?.[idx]
      }));
      setChartData(enrichedData);
      return;
    }

    setLoadingBenchmarks(true);
    try {
      const daysCount = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Retorne dados históricos reais de crescimento para o mercado brasileiro entre ${startDate.toISOString().split('T')[0]} e ${endDate.toISOString().split('T')[0]} (${daysCount} dias).

   Você DEVE retornar um array com ${Math.ceil(daysCount / 7)} valores (periódicos), um para cada semana/período. Cada valor representa o valor acumulado (indexado a 100) em reais.

   Para os 3 índices:
   - Ibovespa: índice de ações
   - CDI: taxa de juros
   - IPCA: inflação acumulada

   Retorne arrays com o mesmo tamanho.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            ibovespa: { type: "array", items: { type: "number" } },
            cdi: { type: "array", items: { type: "number" } },
            ipca: { type: "array", items: { type: "number" } }
          }
        }
      });

      const benchmarkData = {
        ibovespa: response?.ibovespa || [],
        cdi: response?.cdi || [],
        ipca: response?.ipca || []
      };

      setBenchmarkCacheLocal(cacheKey, benchmarkData);

      const enrichedData = baseData.map((point, idx) => ({
        ...point,
        ibovespa: benchmarkData.ibovespa?.[idx],
        cdi: benchmarkData.cdi?.[idx],
        ipca: benchmarkData.ipca?.[idx]
      }));
      setChartData(enrichedData);
    } catch (err) {
      console.error("Erro ao buscar benchmarks:", err);
    } finally {
      setLoadingBenchmarks(false);
    }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;

    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl">
        <p className="text-xs text-gray-400 mb-2">{payload[0].payload.displayDate}</p>
        {payload.map((entry, idx) => (
          <div key={idx} className="flex items-center justify-between gap-4 mb-1">
            <span className="text-xs font-medium" style={{ color: entry.color }}>
              {entry.name}:
            </span>
            <span className="text-xs font-bold text-white">
              R$ {entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
        <Skeleton className="h-8 w-48 bg-gray-800 mb-4" />
        <Skeleton className="h-80 bg-gray-800 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-violet-400" />
            Evolução da Carteira
          </h3>
          <p className="text-gray-500 text-xs mt-1">Compare com benchmarks do mercado</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-32 bg-gray-800 border-gray-700">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            <SelectItem value="1m">1 Mês</SelectItem>
            <SelectItem value="3m">3 Meses</SelectItem>
            <SelectItem value="6m">6 Meses</SelectItem>
            <SelectItem value="1y">1 Ano</SelectItem>
            <SelectItem value="all">Tudo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="displayDate" 
              stroke="#6B7280"
              style={{ fontSize: '11px' }}
            />
            <YAxis 
              stroke="#6B7280"
              style={{ fontSize: '11px' }}
              tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px' }} iconType="line" />
            <Line
              type="monotone"
              dataKey="carteira"
              name="Minha Carteira"
              stroke="#8B5CF6"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6 }}
            />
            {showBenchmarks && (
              <>
                <Line type="monotone" dataKey="ibovespa" name="Ibovespa" stroke="#3B82F6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="cdi" name="CDI" stroke="#10B981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="ipca" name="IPCA" stroke="#F59E0B" strokeWidth={2} dot={false} />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-80 flex items-center justify-center">
          <p className="text-gray-500 text-sm">Dados insuficientes para gerar gráfico</p>
        </div>
      )}

      {/* Benchmark Comparison */}
      {chartData.length > 1 && (
        <div className="mt-6 pt-6 border-t border-gray-800">
          <button
            onClick={() => setShowBenchmarks(!showBenchmarks)}
            className="mb-4 px-3 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors"
          >
            {showBenchmarks ? 'Ocultar' : 'Ver'} Benchmarks {loadingBenchmarks && '(carregando...)'}
          </button>
          
          {showBenchmarks && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Minha Carteira", key: "carteira", color: "text-violet-400" },
                { label: "Ibovespa", key: "ibovespa", color: "text-blue-400" },
                { label: "CDI", key: "cdi", color: "text-emerald-400" },
                { label: "Inflação (IPCA)", key: "ipca", color: "text-amber-400" }
              ].map((item, idx) => {
                const change = calculateChange(chartData, item.key);
                return (
                  <div key={idx} className="text-center">
                    <p className="text-xs text-gray-400 mb-2">{item.label}</p>
                    <p className={cn("text-xl font-bold", item.color)}>
                      {change > 0 ? '+' : ''}{change.toFixed(2)}%
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function calculateChange(data, key) {
  if (data.length < 2) return 0;
  const first = data[0][key] || 0;
  const last = data[data.length - 1][key] || 0;
  if (first === 0) return 0;
  return ((last - first) / first) * 100;
}