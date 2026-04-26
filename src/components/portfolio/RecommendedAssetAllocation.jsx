import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";
import { BarChart3 } from "lucide-react";

const COLORS = ['#8B5CF6', '#F59E0B', '#06B6D4', '#EF4444', '#10B981', '#EC4899', '#3B82F6', '#F97316', '#14B8A6'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 shadow-xl">
        <p className="text-white font-semibold">{payload[0].payload.ticker || payload[0].name}</p>
        <p className="text-violet-400 font-semibold">{payload[0].value}%</p>
      </div>
    );
  }
  return null;
};

export default function RecommendedAssetAllocation({ strategy }) {
  // Ativos recomendados com alocação fixa
  const recommendedAssets = [
    { ticker: 'BBAS3', allocation: 12 },
    { ticker: 'BRSR6', allocation: 11 },
    { ticker: 'ISAE3', allocation: 13 },
    { ticker: 'AURE3', allocation: 10 },
    { ticker: 'TAEE4', allocation: 12 },
    { ticker: 'CMIG4', allocation: 12 },
    { ticker: 'BBSE3', allocation: 15 },
    { ticker: 'CXSE3', allocation: 9 },
    { ticker: 'RANI3', allocation: 6 },
  ];

  // Calcular distribuição percentual das ações recomendadas
  const chartData = recommendedAssets.map((stock) => ({
    ticker: stock.ticker,
    name: stock.ticker,
    value: stock.allocation,
  })).sort((a, b) => b.value - a.value);

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-violet-950/30 rounded-2xl border border-gray-800 p-8 shadow-xl">
      <div className="mb-8 flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
          <BarChart3 className="h-5 w-5 text-violet-400" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white">Alocação de Ativos</h3>
          <p className="text-gray-400 text-sm mt-1">Carteira Recomendada</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={true}
            label={({ ticker, value }) => `${ticker} ${value}%`}
            outerRadius={110}
            fill="#8B5CF6"
            dataKey="value"
            animationDuration={800}
            labelStyle={{ fill: '#E5E7EB', fontSize: '12px', fontWeight: '600' }}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Asset Allocation Grid */}
      <div className="mt-8 grid grid-cols-3 gap-3">
        {chartData.map((asset, index) => (
          <div 
            key={asset.ticker} 
            className="rounded-lg p-3 border border-gray-700 flex flex-col items-center justify-center"
            style={{ backgroundColor: `${COLORS[index % COLORS.length]}20` }}
          >
            <div 
              className="h-2.5 w-2.5 rounded-full mb-2" 
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <p className="font-semibold text-white text-sm">{asset.ticker}</p>
            <p className="text-lg font-bold" style={{ color: COLORS[index % COLORS.length] }}>
              {asset.value}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}