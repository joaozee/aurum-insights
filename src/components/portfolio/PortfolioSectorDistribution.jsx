import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { brapiService } from "@/components/utils/brapiService";
import { useEffect, useState } from "react";

const STOCK_COLORS = [
  "#8B5CF6", // Violeta
  "#F59E0B", // Âmbar
  "#10B981", // Esmeralda
  "#3B82F6", // Azul
  "#EC4899", // Rosa
  "#14B8A6", // Teal
  "#6366F1", // Índigo
  "#F97316", // Laranja
  "#A855F7", // Roxo
  "#EF4444", // Vermelho
  "#06B6D4", // Ciano
  "#84CC16", // Lima
  "#F43F5E", // Rosa intenso
  "#22D3EE", // Ciano claro
  "#A78BFA", // Violeta claro
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 shadow-xl">
        <p className="text-white font-semibold">{payload[0].name}</p>
        <p className="text-gray-400 text-sm">
          R$ {payload[0].value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
        <p className="text-violet-400 text-xs mt-1">
          {payload[0].payload.percentage}%
        </p>
      </div>
    );
  }
  return null;
};

export default function PortfolioSectorDistribution({ assets }) {
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStockData();
  }, [assets]);

  const fetchStockData = async () => {
    if (!assets || Object.keys(assets).length === 0) {
      setLoading(false);
      return;
    }

    try {
      let grandTotal = 0;
      const stockValues = [];

      Object.entries(assets).forEach(([ticker, asset]) => {
        const value = asset.quantity * (asset.current_price || asset.purchase_price);
        grandTotal += value;
        stockValues.push({
          name: ticker,
          value,
          quantity: asset.quantity
        });
      });

      const chartData = stockValues
        .map((stock, index) => ({
          ...stock,
          percentage: ((stock.value / grandTotal) * 100).toFixed(1),
          color: STOCK_COLORS[index % STOCK_COLORS.length]
        }))
        .sort((a, b) => b.value - a.value);

      setStockData(chartData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-violet-950/30 rounded-2xl border border-gray-800 p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-white mb-6">Distribuição por Ação</h3>
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-48 w-48 rounded-full bg-gray-800 mb-4" />
          <div className="w-full space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-4 bg-gray-800 rounded" />)}
          </div>
        </div>
      </div>
    );
  }

  if (stockData.length === 0) {
    return null;
  }

  const total = stockData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-violet-950/30 rounded-2xl border border-gray-800 p-8 shadow-xl">
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-white">Distribuição por Ação</h3>
        <p className="text-gray-400 text-sm mt-1">Percentual de cada ativo na carteira</p>
      </div>
      
      <div className="grid lg:grid-cols-2 gap-8 items-center">
        {/* Chart */}
        <div className="w-64 h-64 relative flex-shrink-0 mx-auto lg:mx-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <defs>
                {stockData.map((stock, index) => (
                  <filter key={stock.name} id={`shadow-${stock.name}`}>
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={stock.color} floodOpacity="0.4"/>
                  </filter>
                ))}
              </defs>
              <Pie
                data={stockData}
                cx="50%"
                cy="50%"
                innerRadius={66}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                stroke="#1F2937"
                strokeWidth={2}
                animationDuration={800}
                animationBegin={0}
              >
                {stockData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    filter={`url(#shadow-${entry.name})`}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-gray-500 text-xs mb-1">Total</p>
            <p className="text-white font-bold text-2xl">
              {total >= 1000000
                ? `R$ ${(total / 1000000).toFixed(1)}m`
                : `R$ ${(total / 1000).toFixed(1)}k`}
            </p>
          </div>
        </div>

        {/* Legend com grid */}
        <div className="space-y-3">
          {stockData.map((item) => (
            <div key={item.name} className="group">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-3">
                  <div 
                    className="h-3 w-3 rounded-full shadow-lg flex-shrink-0" 
                    style={{ 
                      backgroundColor: item.color,
                      boxShadow: `0 0 8px ${item.color}50`
                    }}
                  />
                  <span className="text-sm font-semibold text-white group-hover:text-violet-400 transition-colors">{item.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-violet-400">{item.percentage}%</span>
                  <p className="text-xs text-gray-500">R$ {(item.value / 1000).toFixed(1)}k</p>
                </div>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${item.percentage}%`,
                    backgroundColor: item.color
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}