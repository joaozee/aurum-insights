import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { TrendingUp, TrendingDown, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SECTOR_LABELS = {
  financeiro: "Financeiro",
  energia: "Energia",
  mineracao: "Mineração",
  petroleo: "Petróleo",
  varejo: "Varejo",
  saude: "Saúde",
  tecnologia: "Tecnologia",
  outros: "Outros"
};

const COLORS = ["#8B5CF6", "#F59E0B", "#10B981", "#EC4899", "#3B82F6"];

export default function ComparisonReport({ assets = [] }) {
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [comparisonType, setComparisonType] = useState("assets");

  const stockAssets = assets.filter(a => a.type === "acoes");

  const addAsset = (assetName) => {
    if (selectedAssets.length < 5 && !selectedAssets.includes(assetName)) {
      setSelectedAssets([...selectedAssets, assetName]);
    }
  };

  const removeAsset = (assetName) => {
    setSelectedAssets(selectedAssets.filter(a => a !== assetName));
  };

  const getAssetMetrics = (asset) => {
    const invested = (asset.quantity || 0) * (asset.purchase_price || 0);
    const current = (asset.quantity || 0) * (asset.current_price || 0);
    const profitLoss = current - invested;
    const profitLossPercent = invested > 0 ? ((profitLoss / invested) * 100) : 0;
    
    return {
      name: asset.name,
      invested,
      current,
      profitLoss,
      profitLossPercent,
      quantity: asset.quantity || 0,
      avgPrice: asset.purchase_price || 0,
      currentPrice: asset.current_price || 0
    };
  };

  const comparisonData = selectedAssets.map(name => {
    const asset = stockAssets.find(a => a.name === name);
    return asset ? getAssetMetrics(asset) : null;
  }).filter(Boolean);

  // Dados para gráfico de barras
  const barData = comparisonData.map(a => ({
    name: a.name,
    "Investido": a.invested,
    "Atual": a.current
  }));

  // Dados para gráfico radar (normalizado 0-100)
  const maxReturn = Math.max(...comparisonData.map(a => Math.abs(a.profitLossPercent)), 1);
  const maxValue = Math.max(...comparisonData.map(a => a.current), 1);
  const radarData = [
    { metric: "Retorno %", ...Object.fromEntries(comparisonData.map(a => [a.name, ((a.profitLossPercent + maxReturn) / (2 * maxReturn)) * 100])) },
    { metric: "Valor Atual", ...Object.fromEntries(comparisonData.map(a => [a.name, (a.current / maxValue) * 100])) },
    { metric: "Investido", ...Object.fromEntries(comparisonData.map(a => [a.name, (a.invested / maxValue) * 100])) }
  ];

  // Comparativo por setor
  const sectorData = Object.keys(SECTOR_LABELS).map(sector => {
    const sectorAssets = stockAssets.filter(a => (a.sector || 'outros') === sector);
    const totalInvested = sectorAssets.reduce((sum, a) => sum + ((a.quantity || 0) * (a.purchase_price || 0)), 0);
    const totalCurrent = sectorAssets.reduce((sum, a) => sum + ((a.quantity || 0) * (a.current_price || 0)), 0);
    const returnPercent = totalInvested > 0 ? ((totalCurrent - totalInvested) / totalInvested) * 100 : 0;
    
    return {
      sector: SECTOR_LABELS[sector],
      investido: totalInvested,
      atual: totalCurrent,
      retorno: returnPercent
    };
  }).filter(s => s.investido > 0);

  return (
    <div className="space-y-6">
      {/* Seleção de tipo de comparação */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-violet-950/30 rounded-2xl border border-gray-800 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h3 className="text-lg font-semibold text-white">Comparativo de Investimentos</h3>
          <Select value={comparisonType} onValueChange={setComparisonType}>
            <SelectTrigger className="w-48 bg-gray-800 border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-800">
              <SelectItem value="assets" className="text-white">Por Ativo</SelectItem>
              <SelectItem value="sectors" className="text-white">Por Setor</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {comparisonType === "assets" && (
          <>
            {/* Seletor de ativos */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <Select onValueChange={addAsset}>
                <SelectTrigger className="w-48 bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Adicionar ativo" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-800">
                  {stockAssets.filter(a => !selectedAssets.includes(a.name)).map(asset => (
                    <SelectItem key={asset.name} value={asset.name} className="text-white">
                      {asset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedAssets.map((name, idx) => (
                <div 
                  key={name}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
                  style={{ backgroundColor: `${COLORS[idx]}20`, color: COLORS[idx] }}
                >
                  {name}
                  <button onClick={() => removeAsset(name)}>
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>

            {selectedAssets.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400">Selecione ativos para comparar</p>
              </div>
            ) : (
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Gráfico de barras */}
                <div className="bg-gray-800/30 rounded-xl p-4">
                  <h4 className="text-white font-medium mb-4">Valor Investido vs Atual</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData}>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }} />
                        <Legend />
                        <Bar dataKey="Investido" fill="#6B7280" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Atual" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Tabela comparativa */}
                <div className="bg-gray-800/30 rounded-xl p-4">
                  <h4 className="text-white font-medium mb-4">Métricas</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-gray-400 border-b border-gray-700">
                          <th className="text-left py-2">Ativo</th>
                          <th className="text-right py-2">Preço Médio</th>
                          <th className="text-right py-2">Preço Atual</th>
                          <th className="text-right py-2">Retorno</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparisonData.map((asset, idx) => (
                          <tr key={asset.name} className="border-b border-gray-800">
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                                <span className="text-white">{asset.name}</span>
                              </div>
                            </td>
                            <td className="text-right text-gray-300">R$ {asset.avgPrice.toFixed(2)}</td>
                            <td className="text-right text-gray-300">R$ {asset.currentPrice.toFixed(2)}</td>
                            <td className="text-right">
                              <span className={`font-semibold ${asset.profitLossPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {asset.profitLossPercent >= 0 ? '+' : ''}{asset.profitLossPercent.toFixed(2)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {comparisonType === "sectors" && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-gray-800/30 rounded-xl p-4">
              <h4 className="text-white font-medium mb-4">Retorno por Setor</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sectorData} layout="vertical">
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} tickFormatter={v => `${v.toFixed(0)}%`} />
                    <YAxis type="category" dataKey="sector" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} width={80} />
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }} />
                    <Bar dataKey="retorno" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-gray-800/30 rounded-xl p-4">
              <h4 className="text-white font-medium mb-4">Distribuição por Setor</h4>
              <div className="space-y-3">
                {sectorData.map((sector, idx) => (
                  <div key={sector.sector} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="text-white">{sector.sector}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">R$ {sector.atual.toLocaleString('pt-BR')}</p>
                      <p className={`text-xs ${sector.retorno >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {sector.retorno >= 0 ? '+' : ''}{sector.retorno.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}