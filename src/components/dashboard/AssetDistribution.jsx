import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const ASSET_COLORS = {
  acoes: "#8B5CF6",
  fiis: "#10B981",
  renda_fixa: "#F59E0B",
  cripto: "#EC4899",
  fundos: "#06B6D4"
};

const ASSET_LABELS = {
  acoes: "Ações",
  fiis: "FIIs",
  renda_fixa: "Renda Fixa",
  cripto: "Cripto",
  fundos: "Fundos"
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 shadow-xl">
        <p className="text-white font-semibold">{payload[0].name}</p>
        <p className="text-gray-400 text-sm">
          R$ {payload[0].value.toLocaleString('pt-BR')}
        </p>
      </div>
    );
  }
  return null;
};

export default function AssetDistribution({ assets = [] }) {
  const distribution = Object.entries(ASSET_LABELS).map(([key]) => {
    const total = assets
      .filter(a => a.type === key)
      .reduce((sum, a) => sum + (a.current_value || 0), 0);
    return {
      name: ASSET_LABELS[key],
      value: total,
      type: key
    };
  }).filter(d => d.value > 0);

  const totalValue = distribution.reduce((sum, d) => sum + d.value, 0);

  // Dados mock se não houver ativos
  const displayData = distribution.length > 0 ? distribution : [
    { name: "Ações", value: 25000, type: "acoes" },
    { name: "FIIs", value: 15000, type: "fiis" },
    { name: "Renda Fixa", value: 12000, type: "renda_fixa" },
    { name: "Cripto", value: 5000, type: "cripto" },
    { name: "Fundos", value: 8000, type: "fundos" }
  ];

  const displayTotal = displayData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-violet-950/30 rounded-2xl border border-gray-800 p-6 shadow-xl">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white">Distribuição de Ativos</h3>
        <p className="text-gray-500 text-sm">Alocação por categoria</p>
      </div>
      
      <div className="flex flex-col lg:flex-row items-center gap-6">
        {/* Chart */}
        <div className="w-48 h-48 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={displayData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {displayData.map((entry) => (
                  <Cell 
                    key={`cell-${entry.type}`} 
                    fill={ASSET_COLORS[entry.type]}
                    style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-gray-500 text-xs">Total</p>
            <p className="text-white font-bold text-lg">
              {displayTotal >= 1000000
                ? `R$ ${(displayTotal / 1000000).toFixed(1)}m`
                : `R$ ${(displayTotal / 1000).toFixed(1)}k`}
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-3 w-full">
          {displayData.map((item) => {
            const percentage = ((item.value / displayTotal) * 100).toFixed(1);
            return (
              <div key={item.type} className="group">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-3">
                    <div 
                      className="h-3 w-3 rounded-full shadow-lg" 
                      style={{ 
                        backgroundColor: ASSET_COLORS[item.type],
                        boxShadow: `0 0 8px ${ASSET_COLORS[item.type]}50`
                      }}
                    />
                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-white">{percentage}%</span>
                </div>
                <div className="ml-6 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${percentage}%`,
                      backgroundColor: ASSET_COLORS[item.type]
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}