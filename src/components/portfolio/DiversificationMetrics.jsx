import { Shield, Target, PieChart as PieChartIcon, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function DiversificationMetrics({ assets }) {
  if (!assets || Object.keys(assets).length === 0) {
    return null;
  }

  const assetsList = Object.values(assets);
  const totalAssets = assetsList.length;
  
  // Calcular valor total
  const totalValue = assetsList.reduce((sum, asset) => {
    return sum + (asset.quantity * (asset.current_price || asset.purchase_price));
  }, 0);

  // Calcular concentração (maior posição)
  const largestPosition = Math.max(...assetsList.map(asset => {
    const value = asset.quantity * (asset.current_price || asset.purchase_price);
    return (value / totalValue) * 100;
  }));

  // Score de diversificação (0-100)
  const diversificationScore = Math.min(100, (totalAssets * 10) - (largestPosition * 0.5));

  // Indicadores de risco
  const getRiskLevel = () => {
    if (totalAssets >= 15 && largestPosition < 15) return { level: "Baixo", color: "emerald", icon: Shield };
    if (totalAssets >= 10 && largestPosition < 25) return { level: "Moderado", color: "amber", icon: Target };
    return { level: "Alto", color: "red", icon: AlertTriangle };
  };

  const risk = getRiskLevel();
  const RiskIcon = risk.icon;

  const metrics = [
    {
      label: "Número de Ativos",
      value: totalAssets,
      subtitle: "ativos diferentes",
      icon: PieChartIcon,
      color: "violet"
    },
    {
      label: "Maior Posição",
      value: `${largestPosition.toFixed(1)}%`,
      subtitle: "da carteira",
      icon: Target,
      color: largestPosition > 30 ? "amber" : "emerald"
    },
    {
      label: "Nível de Risco",
      value: risk.level,
      subtitle: "baseado na diversificação",
      icon: RiskIcon,
      color: risk.color
    }
  ];

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-violet-950/30 rounded-2xl border border-gray-800 p-6 shadow-xl">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white">Diversificação</h3>
        <p className="text-gray-500 text-sm">Análise de risco da carteira</p>
      </div>

      {/* Diversification Score */}
      <div className="mb-6 p-4 bg-gray-800/50 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Score de Diversificação</span>
          <span className="text-lg font-bold text-violet-400">{diversificationScore.toFixed(0)}/100</span>
        </div>
        <Progress value={diversificationScore} className="h-2" />
        <p className="text-xs text-gray-500 mt-2">
          {diversificationScore >= 70 ? "Ótima diversificação!" : 
           diversificationScore >= 50 ? "Diversificação moderada" : 
           "Considere diversificar mais"}
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-3">
        {metrics.map((metric, idx) => {
          const Icon = metric.icon;
          const colorClasses = {
            violet: { text: "text-violet-400", bg: "bg-violet-500/10" },
            emerald: { text: "text-emerald-400", bg: "bg-emerald-500/10" },
            amber: { text: "text-amber-400", bg: "bg-amber-500/10" },
            red: { text: "text-red-400", bg: "bg-red-500/10" }
          };
          const colors = colorClasses[metric.color];

          return (
            <div key={idx} className="flex items-center gap-4 p-3 bg-gray-800/30 rounded-xl">
              <div className={`h-10 w-10 rounded-lg ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`h-5 w-5 ${colors.text}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-400 text-xs">{metric.label}</p>
                <p className={`text-lg font-bold ${colors.text}`}>{metric.value}</p>
                <p className="text-gray-500 text-xs">{metric.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}