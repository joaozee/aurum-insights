import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, TrendingUp, PieChart as PieChartIcon } from "lucide-react";

export default function DiversificationAnalysis({ assets }) {
  if (!assets || Object.keys(assets).length === 0) return null;

  // Calcular score de diversificação
  const assetsCount = Object.keys(assets).length;
  const currentValue = Object.values(assets).reduce(
    (sum, a) => sum + a.quantity * (a.current_price || a.purchase_price),
    0
  );

  // Maior posição
  const weights = Object.values(assets).map(a => (a.quantity * (a.current_price || a.purchase_price)) / currentValue);
  const maxWeight = Math.max(...weights);
  const concentration = weights.reduce((sum, w) => sum + w * w, 0) * 100;

  // Score simplificado (0-100)
  const diversificationScore = Math.min(100, assetsCount * 10 + (1 - concentration / 100) * 30);

  // Nível de risco
  const getRiskLevel = () => {
    if (maxWeight > 0.35) return { label: "Alto", color: "text-red-400", bg: "bg-red-500/10 border-red-500/30" };
    if (maxWeight > 0.25) return { label: "Moderado", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30" };
    return { label: "Baixo", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" };
  };

  const risk = getRiskLevel();

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <PieChartIcon className="h-5 w-5 text-violet-400" />
          Diversificação
        </CardTitle>
        <p className="text-gray-400 text-sm mt-1">Análise de risco da carteira</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Diversification Score */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Score de Diversificação</span>
            <span className="text-violet-400 font-bold text-lg">{diversificationScore.toFixed(0)}/100</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-purple-600"
              style={{ width: `${diversificationScore}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {diversificationScore > 70 ? "Diversificação excelente" : diversificationScore > 50 ? "Diversificação moderada" : "Diversificação baixa"}
          </p>
        </div>

        {/* Assets Count */}
        <div className="bg-gray-800 rounded-lg p-3 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <PieChartIcon className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <p className="text-gray-400 text-xs">Número de Ativos</p>
            <p className="text-white font-semibold">{assetsCount} ativos diferentes</p>
          </div>
        </div>

        {/* Maior Posição */}
        <div className="bg-gray-800 rounded-lg p-3 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <p className="text-gray-400 text-xs">Maior Posição</p>
            <p className="text-white font-semibold">{(maxWeight * 100).toFixed(1)}% da carteira</p>
          </div>
        </div>

        {/* Nível de Risco */}
        <div className={`rounded-lg p-4 border ${risk.bg}`}>
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className={`h-4 w-4 ${risk.color}`} />
            <span className={`font-semibold ${risk.color}`}>Nível de Risco: {risk.label}</span>
          </div>
          <p className="text-sm text-gray-300">
            {risk.label === "Alto" && "Sua carteira está muito concentrada em poucos ativos."}
            {risk.label === "Moderado" && "Sua carteira tem concentração moderada."}
            {risk.label === "Baixo" && "Sua carteira está bem diversificada."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}