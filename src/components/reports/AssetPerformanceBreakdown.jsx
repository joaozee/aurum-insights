import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-xl px-5 py-4 shadow-2xl min-w-[200px]">
        <div className="flex items-center justify-between mb-2">
          <p className="text-white font-bold text-base">{data.ticker}</p>
          <div className={`px-2 py-0.5 rounded text-xs font-medium ${
            data.performance >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {data.performance >= 0 ? '+' : ''}{data.performance.toFixed(2)}%
          </div>
        </div>
        <p className="text-gray-400 text-xs mb-3">{data.company}</p>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">Lucro/Prejuízo:</span>
            <span className={`font-semibold ${data.profit_loss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              R$ {data.profit_loss.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Investido:</span>
            <span className="text-white font-semibold">R$ {data.invested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Atual:</span>
            <span className="text-white font-semibold">R$ {data.current.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function AssetPerformanceBreakdown({ assets }) {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    processAssets();
  }, [assets]);

  const processAssets = () => {
    const assetsList = Object.values(assets);
    
    const data = assetsList.map(asset => {
      const invested = asset.quantity * asset.purchase_price;
      const current = asset.quantity * (asset.current_price || asset.purchase_price);
      const profit_loss = current - invested;
      const performance = (profit_loss / invested) * 100;

      return {
        ticker: asset.ticker,
        company: asset.company_name || asset.ticker,
        performance: performance,
        profit_loss: profit_loss,
        invested: invested,
        current: current
      };
    }).sort((a, b) => b.performance - a.performance);

    setChartData(data);
  };

  if (chartData.length === 0) {
    return null;
  }

  const totalProfit = chartData.reduce((sum, a) => sum + a.profit_loss, 0);
  const avgPerformance = chartData.reduce((sum, a) => sum + a.performance, 0) / chartData.length;

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-violet-950/30 rounded-2xl border border-gray-800 p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Rentabilidade por Ativo</h3>
          <p className="text-gray-500 text-sm">Performance individual de cada posição</p>
        </div>
        <div className="text-right">
          <p className="text-gray-400 text-xs">Lucro Total</p>
          <p className={`text-xl font-bold ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {totalProfit >= 0 ? '+' : ''}R$ {totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={Math.max(chartData.length * 45, 300)}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 20, top: 5, bottom: 5 }}>
          <defs>
            <linearGradient id="positiveGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#10B981" stopOpacity={0.7} />
              <stop offset="100%" stopColor="#10B981" stopOpacity={1} />
            </linearGradient>
            <linearGradient id="negativeGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#EF4444" stopOpacity={0.7} />
              <stop offset="100%" stopColor="#EF4444" stopOpacity={1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
          <XAxis 
            type="number"
            axisLine={false}
            tickLine={false}
            stroke="#9CA3AF"
            style={{ fontSize: '13px', fontWeight: 500 }}
            tickFormatter={(value) => `${value}%`}
            domain={['dataMin - 5', 'dataMax + 5']}
          />
          <YAxis 
            type="category"
            dataKey="ticker"
            axisLine={false}
            tickLine={false}
            stroke="#E5E7EB"
            style={{ fontSize: '13px', fontWeight: 700 }}
            width={80}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#374151', opacity: 0.2 }} />
          <Bar 
            dataKey="performance" 
            radius={[0, 8, 8, 0]}
            animationDuration={800}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.performance >= 0 ? 'url(#positiveGrad)' : 'url(#negativeGrad)'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-800">
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <p className="text-gray-400 text-xs">Performance Média</p>
          </div>
          <p className={`text-2xl font-bold ${avgPerformance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {avgPerformance >= 0 ? '+' : ''}{avgPerformance.toFixed(2)}%
          </p>
        </div>
        
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-violet-400" />
            <p className="text-gray-400 text-xs">Ativos em Análise</p>
          </div>
          <p className="text-2xl font-bold text-violet-400">{chartData.length}</p>
        </div>
      </div>
    </div>
  );
}