import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const SECTOR_COLORS = {
  financeiro: "#8B5CF6",
  energia: "#F59E0B",
  mineracao: "#10B981",
  petroleo: "#3B82F6",
  varejo: "#EC4899",
  saude: "#14B8A6",
  utilidades: "#6366F1",
  industria: "#F97316",
  telecomunicacoes: "#8B5CF6",
  consumo: "#EF4444",
  tecnologia: "#06B6D4",
  outros: "#6B7280"
};

const SECTOR_LABELS = {
  financeiro: "Financeiro",
  energia: "Energia",
  mineracao: "Mineração",
  petroleo: "Petróleo & Gás",
  varejo: "Varejo",
  saude: "Saúde",
  utilidades: "Utilidades Públicas",
  industria: "Indústria",
  telecomunicacoes: "Telecomunicações",
  consumo: "Consumo",
  tecnologia: "Tecnologia",
  outros: "Outros"
};

// Mock data por setor
const mockSectorData = [
  { name: "Financeiro", value: 28000, key: "financeiro" },
  { name: "Energia", value: 12000, key: "energia" },
  { name: "Mineração", value: 8500, key: "mineracao" },
  { name: "Petróleo & Gás", value: 7000, key: "petroleo" },
  { name: "Utilidades Públicas", value: 5500, key: "utilidades" },
  { name: "Varejo", value: 4000, key: "varejo" }
];

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

export default function SectorDistribution({ assets = [] }) {
  // TODO: Quando houver ativos reais, agrupar por setor
  const displayData = mockSectorData;
  const displayTotal = displayData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-violet-950/30 rounded-2xl border border-gray-800 p-6 shadow-xl">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white">Distribuição por Setor</h3>
        <p className="text-gray-500 text-sm">Alocação setorial B3</p>
      </div>
      
      <div className="flex flex-col lg:flex-row items-center gap-6">
        {/* Chart */}
        <div className="w-52 h-52 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <defs>
                {Object.entries(SECTOR_COLORS).map(([key, color]) => (
                  <filter key={key} id={`shadow-${key}`}>
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={color} floodOpacity="0.4"/>
                  </filter>
                ))}
              </defs>
              <Pie
                data={displayData}
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={88}
                paddingAngle={2}
                dataKey="value"
                stroke="#1F2937"
                strokeWidth={2}
                animationDuration={800}
                animationBegin={0}
              >
                {displayData.map((entry) => (
                  <Cell 
                    key={`cell-${entry.key}`} 
                    fill={SECTOR_COLORS[entry.key]}
                    filter={`url(#shadow-${entry.key})`}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-gray-500 text-xs mb-1">Total</p>
            <p className="text-white font-bold text-xl">
              R$ {(displayTotal / 1000).toFixed(0)}k
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-3 w-full">
          {displayData.map((item) => {
            const percentage = ((item.value / displayTotal) * 100).toFixed(1);
            return (
              <div key={item.key} className="group">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-3">
                    <div 
                      className="h-3 w-3 rounded-full shadow-lg" 
                      style={{ 
                        backgroundColor: SECTOR_COLORS[item.key],
                        boxShadow: `0 0 8px ${SECTOR_COLORS[item.key]}50`
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
                      backgroundColor: SECTOR_COLORS[item.key]
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