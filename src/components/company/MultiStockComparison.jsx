import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { Plus, X, TrendingUp, TrendingDown } from "lucide-react";
import { brapiService } from "@/components/utils/brapiService";
import { Skeleton } from "@/components/ui/skeleton";
import TickerAutocomplete from "@/components/shared/TickerAutocomplete";
import { base44 } from "@/api/base44Client";

const COLORS = ["#8B5CF6", "#F59E0B", "#10B981", "#EF4444", "#3B82F6"];

export default function MultiStockComparison({ initialTicker }) {
  const [tickers, setTickers] = useState(initialTicker ? [initialTicker] : []);
  const [newTicker, setNewTicker] = useState("");
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [stocksInfo, setStocksInfo] = useState({});
  const [selectedPeriod, setSelectedPeriod] = useState('1y');

  const addTicker = async () => {
    if (!newTicker || tickers.includes(newTicker.toUpperCase())) return;
    
    const ticker = newTicker.toUpperCase();
    setTickers([...tickers, ticker]);
    setNewTicker("");
    await loadComparison([...tickers, ticker], selectedPeriod);
  };

  const handlePeriodChange = async (period) => {
    setSelectedPeriod(period);
    if (tickers.length > 0) {
      await loadComparison(tickers, period);
    }
  };

  const removeTicker = async (ticker) => {
    const newTickers = tickers.filter(t => t !== ticker);
    setTickers(newTickers);
    if (newTickers.length > 0) {
      await loadComparison(newTickers);
    } else {
      setChartData([]);
      setStocksInfo({});
    }
  };

  const loadComparison = async (tickersToLoad, period = selectedPeriod) => {
    if (tickersToLoad.length === 0) return;
    
    setLoading(true);
    try {
      const stocksData = await brapiService.getQuotes(tickersToLoad, {
        range: period,
        interval: '1d',
        fundamental: true
      });

      // Criar mapa de informações das ações e buscar fundamentals
      const info = {};
      for (const stock of stocksData) {
        const formattedData = brapiService.formatStockData(stock);
        
        // Buscar dados fundamentais adicionais via backend
        try {
          const fundamentalsResponse = await base44.functions.invoke('getStockFundamentals', {
            ticker: stock.symbol
          });
          
          if (fundamentalsResponse?.data) {
            const funds = fundamentalsResponse.data;
            // Sobrescrever com dados do backend se disponíveis
            if (funds.pb_ratio != null && funds.pb_ratio !== "N/A") {
              formattedData.pb_ratio = funds.pb_ratio;
            }
            if (funds.dividend_yield != null && funds.dividend_yield !== "N/A") {
              formattedData.dividend_yield = funds.dividend_yield;
            }
          }
        } catch (err) {
          console.log(`Falha ao buscar fundamentals para ${stock.symbol}:`, err);
        }
        
        info[stock.symbol] = formattedData;
      }
      setStocksInfo(info);

      // Normalizar dados históricos para comparação percentual
      const normalizedData = normalizeHistoricalData(stocksData);
      setChartData(normalizedData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const normalizeHistoricalData = (stocksData) => {
    if (!stocksData || stocksData.length === 0) return [];

    // Pegar todos os dados históricos e normalizar por percentual de crescimento
    const allDates = new Set();
    const dataByTicker = {};

    stocksData.forEach(stock => {
      if (!stock.historicalDataPrice || stock.historicalDataPrice.length === 0) return;
      
      const historicalData = stock.historicalDataPrice;
      const basePrice = historicalData[0].close;
      
      dataByTicker[stock.symbol] = {};
      
      historicalData.forEach(point => {
        const date = new Date(point.date * 1000).toLocaleDateString('pt-BR');
        allDates.add(date);
        const percentChange = ((point.close - basePrice) / basePrice) * 100;
        dataByTicker[stock.symbol][date] = percentChange;
      });
    });

    // Combinar todos os dados por data
    const sortedDates = Array.from(allDates).sort((a, b) => {
      const [dayA, monthA, yearA] = a.split('/');
      const [dayB, monthB, yearB] = b.split('/');
      return new Date(yearA, monthA - 1, dayA) - new Date(yearB, monthB - 1, dayB);
    });

    return sortedDates.map(date => {
      const dataPoint = { date };
      Object.keys(dataByTicker).forEach(ticker => {
        dataPoint[ticker] = dataByTicker[ticker][date] || 0;
      });
      return dataPoint;
    });
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 shadow-xl">
          <p className="text-white font-semibold mb-2">{payload[0].payload.date}</p>
          {payload.map((entry, idx) => (
            <div key={idx} className="flex items-center justify-between gap-4">
              <span style={{ color: entry.color }}>{entry.name}</span>
              <span className="text-white font-medium">
                {entry.value >= 0 ? '+' : ''}{entry.value.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-2xl p-8 mb-8 shadow-xl">
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-white mb-6">Comparação de Ativos</h3>
        
        {/* Input para adicionar ações */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <TickerAutocomplete
            placeholder="Digite o ticker (ex: PETR4)"
            value={newTicker}
            onChange={setNewTicker}
            className="flex-1 h-12"
            onKeyPress={(e) => e.key === 'Enter' && addTicker()}
          />
          <Button
            onClick={addTicker}
            disabled={!newTicker || tickers.length >= 5}
            className="bg-violet-500 hover:bg-violet-600 h-12 px-6"
          >
            <Plus className="h-5 w-5 mr-2" />
            Adicionar
          </Button>
        </div>

        {/* Lista de tickers adicionados */}
        {tickers.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {tickers.map((ticker, idx) => (
              <div
                key={ticker}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm hover:bg-gray-800 transition-all"
                style={{ borderLeftColor: COLORS[idx % COLORS.length], borderLeftWidth: '4px' }}
              >
                <span className="text-white font-semibold">{ticker}</span>
                <button
                  onClick={() => removeTicker(ticker)}
                  className="text-gray-400 hover:text-red-400 transition-colors ml-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Botões de período */}
        {tickers.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-gray-400 text-sm font-medium flex items-center mr-2">Período:</span>
            {[
              { label: '1 Ano', value: '1y' },
              { label: '5 Anos', value: '5y' },
              { label: '10 Anos', value: '10y' }
            ].map(period => (
              <Button
                key={period.value}
                onClick={() => handlePeriodChange(period.value)}
                variant={selectedPeriod === period.value ? "default" : "outline"}
                className={selectedPeriod === period.value 
                  ? "bg-amber-500 hover:bg-amber-600 text-black font-semibold" 
                  : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"}
                size="sm"
              >
                {period.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {loading && (
        <Skeleton className="h-80 w-full bg-gray-800 rounded-xl" />
      )}

      {!loading && chartData.length > 0 && (
        <>
          {/* Gráfico de comparação */}
          <div className="bg-gray-800/30 rounded-xl p-6 mb-6">
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9CA3AF"
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `${value.toFixed(0)}%`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="line"
                  />
                  {tickers.map((ticker, idx) => (
                    <Line
                      key={ticker}
                      type="monotone"
                      dataKey={ticker}
                      stroke={COLORS[idx % COLORS.length]}
                      strokeWidth={3}
                      dot={false}
                      name={ticker}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tabela comparativa */}
          <div className="overflow-x-auto bg-gray-800/20 rounded-xl border border-gray-700">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-700 bg-gray-800/50">
                  <th className="text-left px-6 py-4 text-gray-300 font-semibold text-sm uppercase tracking-wide">Ativo</th>
                  <th className="text-right px-6 py-4 text-gray-300 font-semibold text-sm uppercase tracking-wide">Preço</th>
                  <th className="text-right px-6 py-4 text-gray-300 font-semibold text-sm uppercase tracking-wide">Variação</th>
                  <th className="text-right px-6 py-4 text-gray-300 font-semibold text-sm uppercase tracking-wide">P/L</th>
                  <th className="text-right px-6 py-4 text-gray-300 font-semibold text-sm uppercase tracking-wide">P/VP</th>
                  <th className="text-right px-6 py-4 text-gray-300 font-semibold text-sm uppercase tracking-wide">DY</th>
                </tr>
              </thead>
              <tbody>
                {tickers.map((ticker, idx) => {
                  const stock = stocksInfo[ticker];
                  if (!stock) return null;
                  
                  const variation = chartData.length > 0 
                    ? chartData[chartData.length - 1][ticker] || 0 
                    : 0;

                  return (
                    <tr key={ticker} className="border-b border-gray-800 hover:bg-gray-800/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="h-3 w-3 rounded-full shadow-lg" 
                            style={{ 
                              backgroundColor: COLORS[idx % COLORS.length],
                              boxShadow: `0 0 10px ${COLORS[idx % COLORS.length]}40`
                            }}
                          />
                          <span className="text-white font-bold text-base">{ticker}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-white font-bold text-base">
                        R$ {stock.current_price?.toFixed(2) || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg font-semibold ${
                          variation >= 0 
                            ? 'bg-emerald-500/20 text-emerald-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {variation >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                          {variation >= 0 ? '+' : ''}{variation.toFixed(2)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-300 font-medium">
                        {stock.pe_ratio != null ? stock.pe_ratio.toFixed(2) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-300 font-medium">
                        {stock.pb_ratio != null ? stock.pb_ratio.toFixed(2) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-amber-400 font-bold text-base">
                          {stock.dividend_yield != null ? `${stock.dividend_yield.toFixed(2)}%` : 'N/A'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!loading && tickers.length === 0 && (
        <div className="h-80 flex flex-col items-center justify-center bg-gray-800/20 rounded-xl border-2 border-dashed border-gray-700">
          <div className="h-16 w-16 rounded-full bg-violet-500/20 flex items-center justify-center mb-4">
            <TrendingUp className="h-8 w-8 text-violet-400" />
          </div>
          <p className="text-gray-400 text-lg font-medium mb-2">Adicione ações para comparar</p>
          <p className="text-gray-600 text-sm">Compare até 5 ativos simultaneamente</p>
        </div>
      )}
    </div>
  );
}