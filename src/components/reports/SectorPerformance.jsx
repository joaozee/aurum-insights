import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { brapiService } from "@/components/utils/brapiService";
import { BarChart3, TrendingUp, TrendingDown } from "lucide-react";

const SECTOR_COLORS = {
  "Financeiro": "#8B5CF6",
  "Energia": "#F59E0B",
  "Mineração": "#10B981",
  "Petróleo e Gás": "#3B82F6",
  "Varejo": "#EC4899",
  "Saúde": "#14B8A6",
  "Utilidades Públicas": "#6366F1",
  "Indústria": "#F97316",
  "Telecomunicações": "#A855F7",
  "Consumo": "#EF4444",
  "Tecnologia": "#06B6D4",
  "Outros": "#6B7280"
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 shadow-xl">
        <p className="text-white font-semibold mb-1">{payload[0].name}</p>
        <p className="text-violet-400 font-bold">
          {payload[0].payload.performance >= 0 ? '+' : ''}{payload[0].payload.performance.toFixed(2)}%
        </p>
        <p className="text-gray-400 text-xs mt-1">
          R$ {payload[0].payload.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
      </div>
    );
  }
  return null;
};

export default function SectorPerformance({ assets }) {
  const [sectorData, setSectorData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSectorPerformance();
  }, [assets]);

  const fetchSectorPerformance = async () => {
    if (!assets || Object.keys(assets).length === 0) {
      setLoading(false);
      return;
    }

    try {
      const tickers = Object.keys(assets);
      const quotes = await brapiService.getQuotes(tickers, { fundamental: true });
      
      const sectorTotals = {};
      const sectorPerformance = {};

      quotes.forEach(quote => {
        const asset = assets[quote.symbol];
        if (!asset) return;

        const sector = quote.sector || "Outros";
        const invested = asset.quantity * asset.purchase_price;
        const current = asset.quantity * (asset.current_price || asset.purchase_price);
        const profit = current - invested;

        if (!sectorTotals[sector]) {
          sectorTotals[sector] = { invested: 0, current: 0 };
        }
        
        sectorTotals[sector].invested += invested;
        sectorTotals[sector].current += current;
      });

      const chartData = Object.entries(sectorTotals)
        .map(([name, data]) => {
          const performance = ((data.current - data.invested) / data.invested) * 100;
          return {
            name,
            value: data.current,
            performance: performance,
            invested: data.invested
          };
        })
        .sort((a, b) => b.performance - a.performance);

      setSectorData(chartData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-800 rounded mb-6" />
        <div className="h-64 bg-gray-800 rounded" />
      </div>
    );
  }

  if (sectorData.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-violet-950/30 rounded-2xl border border-gray-800 p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="h-5 w-5 text-violet-400" />
        <div>
          <h3 className="text-lg font-semibold text-white">Performance por Setor</h3>
          <p className="text-gray-500 text-sm">Rentabilidade setorial</p>
        </div>
      </div>

      <div className="space-y-4">
        {sectorData.map((sector) => (
          <div key={sector.name} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div 
                  className="h-3 w-3 rounded-full"
                  style={{ 
                    backgroundColor: SECTOR_COLORS[sector.name] || SECTOR_COLORS["Outros"],
                    boxShadow: `0 0 8px ${SECTOR_COLORS[sector.name] || SECTOR_COLORS["Outros"]}50`
                  }}
                />
                <span className="text-white font-medium text-sm">{sector.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {sector.performance >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-400" />
                )}
                <span className={`font-bold ${sector.performance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {sector.performance >= 0 ? '+' : ''}{sector.performance.toFixed(2)}%
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-gray-500 mb-1">Investido</p>
                <p className="text-gray-300 font-semibold">
                  R$ {sector.invested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Valor Atual</p>
                <p className="text-gray-300 font-semibold">
                  R$ {sector.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}