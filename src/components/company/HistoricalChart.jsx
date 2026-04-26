import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { base44 } from "@/api/base44Client";

// Mapear período do botão para parâmetros da BRAPI
const periodConfig = {
  "1m":  { range: "1mo",  interval: "1d",  maxPoints: 30 },
  "6m":  { range: "6mo",  interval: "1wk", maxPoints: 26 },
  "1y":  { range: "1y",   interval: "1wk", maxPoints: 52 },
  "5y":  { range: "5y",   interval: "1mo", maxPoints: 60 },
  "10y": { range: "10y",  interval: "3mo", maxPoints: 40 },
  "max": { range: "max",  interval: "3mo", maxPoints: 80 },
};

export default function HistoricalChart({ stock }) {
  const [period, setPeriod] = useState("1y");
  const [chartType, setChartType] = useState("line");
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (stock?.ticker) {
      fetchHistoricalData(stock.ticker, period);
    }
  }, [stock?.ticker, period]);

  const fetchHistoricalData = async (ticker, selectedPeriod) => {
    setLoading(true);
    try {
      const { range, interval, maxPoints } = periodConfig[selectedPeriod];
      const cleanTicker = ticker.replace(/\.SA$/i, '').toUpperCase();
      
      const res = await base44.functions.invoke("getStockHistory", { ticker: cleanTicker, range, interval });
      const historical = res?.data?.data || [];

      if (historical.length > 0) {
        const step = Math.ceil(historical.length / maxPoints);
        const filtered = historical.filter((_, i) => i % step === 0 || i === historical.length - 1);
        const formatted = filtered
          .filter(item => item.close && item.date)
          .map(item => ({
            date: format(new Date(item.date * 1000), 
              selectedPeriod === "1m" || selectedPeriod === "6m" ? "dd/MMM" : "MMM/yy",
              { locale: ptBR }),
            price: item.close,
            open: item.open,
            high: item.high,
            low: item.low,
            volume: item.volume,
          }));
        setChartData(formatted);
      } else {
        setChartData([]);
      }
    } catch (e) {
      console.error("Erro ao buscar histórico:", e);
      setChartData([]);
    } finally {
      setLoading(false);
    }
  };

  const displayData = chartData.length > 0 ? chartData : [];

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl md:rounded-2xl p-4 md:p-6 mb-4 md:mb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 md:mb-6">
        <h3 className="text-base md:text-xl font-semibold text-white">Histórico de Preços</h3>
        <div className="flex flex-wrap gap-1">
          {[
            { key: "1m", label: "1M" },
            { key: "6m", label: "6M" },
            { key: "1y", label: "1A" },
            { key: "5y", label: "5A" },
            { key: "10y", label: "10A" },
            { key: "max", label: "MAX" },
          ].map(({ key, label }) => (
            <Button
              key={key}
              size="sm"
              variant={period === key ? "default" : "outline"}
              onClick={() => setPeriod(key)}
              className={`text-xs px-2 md:px-3 ${period === key ? "bg-amber-500 text-black hover:bg-amber-600" : "border-gray-700 text-gray-300 hover:bg-gray-800"}`}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-60 text-gray-500 text-sm">Carregando dados históricos...</div>
      ) : displayData.length === 0 ? (
        <div className="flex items-center justify-center h-60 text-gray-500 text-sm">Sem dados disponíveis</div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={displayData} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
              <defs>
                <linearGradient id="priceGradientFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FBBF24" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#FBBF24" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis 
                dataKey="date"
                stroke="#6B7280"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 11 }}
                angle={-30}
                textAnchor="end"
                height={50}
                interval="preserveStartEnd"
              />
              <YAxis 
                stroke="#6B7280"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 11 }}
                tickFormatter={(v) => `R$${v.toFixed(0)}`}
                width={65}
                domain={['auto', 'auto']}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-gray-900 border border-gray-700 rounded-xl p-3 text-xs shadow-xl">
                        <p className="text-gray-400 mb-1">{label}</p>
                        <p className="text-white font-bold text-base">R$ {payload[0].value?.toFixed(2)}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke="#FBBF24"
                strokeWidth={2.5}
                fill="url(#priceGradientFill)"
                dot={false}
                activeDot={{ r: 6, fill: "#FBBF24", stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* Stats bar */}
          {stock && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 pt-4 border-t border-gray-800">
              <div className="text-center">
                <p className="text-gray-500 text-xs mb-0.5">Mínimo 52s</p>
                <p className="text-red-400 font-semibold text-sm">
                  {stock.week_low_52 ? `R$ ${stock.week_low_52.toFixed(2)}` : "N/A"}
                </p>
              </div>
              <div className="text-center">
                <p className="text-gray-500 text-xs mb-0.5">Máximo 52s</p>
                <p className="text-emerald-400 font-semibold text-sm">
                  {stock.week_high_52 ? `R$ ${stock.week_high_52.toFixed(2)}` : "N/A"}
                </p>
              </div>
              <div className="text-center">
                <p className="text-gray-500 text-xs mb-0.5">MM 50 dias</p>
                <p className="text-blue-400 font-semibold text-sm">
                  {stock.avg_50d ? `R$ ${stock.avg_50d.toFixed(2)}` : "N/A"}
                </p>
              </div>
              <div className="text-center">
                <p className="text-gray-500 text-xs mb-0.5">MM 200 dias</p>
                <p className="text-purple-400 font-semibold text-sm">
                  {stock.avg_200d ? `R$ ${stock.avg_200d.toFixed(2)}` : "N/A"}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}