import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 shadow-xl">
        <p className="text-white font-semibold">{payload[0].payload.ticker}</p>
        <p className="text-gray-400 text-sm">{payload[0].payload.company}</p>
        <p className="text-violet-400 font-semibold mt-1">
          R$ {payload[0].value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
        <p className="text-gray-500 text-xs">
          {payload[0].payload.percentage}% da carteira
        </p>
      </div>
    );
  }
  return null;
};

export default function AssetAllocation({ assets }) {
  if (!assets || Object.keys(assets).length === 0) {
    return null;
  }

  const assetsList = Object.values(assets);
  const totalValue = assetsList.reduce((sum, asset) => {
    return sum + (asset.quantity * (asset.current_price || asset.purchase_price));
  }, 0);

  const chartData = assetsList
    .map(asset => {
      const value = asset.quantity * (asset.current_price || asset.purchase_price);
      const percentage = ((value / totalValue) * 100).toFixed(1);
      
      return {
        ticker: asset.ticker,
        company: asset.company_name || asset.ticker,
        value,
        percentage
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 10); // Top 10 ativos

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-violet-950/30 rounded-2xl border border-gray-800 p-8 shadow-xl">
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-white">Alocação por Ativo</h3>
        <p className="text-gray-400 text-sm mt-1">Distribuição de capital investido</p>
      </div>

      <ResponsiveContainer width="100%" height={420}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 80, right: 20, top: 10, bottom: 10 }}>
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity={1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
          <XAxis 
            type="number"
            axisLine={false}
            tickLine={false}
            stroke="#6B7280"
            style={{ fontSize: '13px' }}
            tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
          />
          <YAxis 
            type="category" 
            dataKey="ticker"
            axisLine={false}
            tickLine={false}
            stroke="#9CA3AF"
            style={{ fontSize: '13px', fontWeight: 600 }}
            width={75}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#374151', opacity: 0.2 }} />
          <Bar 
            dataKey="value" 
            fill="url(#barGradient)"
            radius={[0, 10, 10, 0]}
            animationDuration={800}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Concentration Warning */}
      {chartData[0] && parseFloat(chartData[0].percentage) > 30 && (
        <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
          <div className="h-5 w-5 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-amber-400 text-xs font-bold">!</span>
          </div>
          <div>
            <p className="text-amber-400 text-sm font-medium">Alta Concentração</p>
            <p className="text-gray-400 text-xs mt-1">
              {chartData[0].ticker} representa {chartData[0].percentage}% da sua carteira. 
              Considere diversificar para reduzir o risco.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}