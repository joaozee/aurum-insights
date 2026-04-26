import { useState } from "react";
import { TrendingUp, TrendingDown, AlertCircle, Zap, X, Eye, EyeOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const INSIGHT_TYPES = {
  performance_comparison: "Comparação de Performance",
  sector_trend: "Tendência de Setor",
  asset_recommendation: "Recomendação de Ativo",
  risk_alert: "Alerta de Risco",
  diversification_advice: "Conselho de Diversificação",
};

export default function PortfolioInsightCard({ insight, onDismiss }) {
  const [isRead, setIsRead] = useState(insight.is_read);

  const handleMarkAsRead = async () => {
    try {
      await base44.entities.PortfolioInsight.update(insight.id, {
        is_read: !isRead,
      });
      setIsRead(!isRead);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao atualizar insight");
    }
  };

  const getImpactColor = (impact) => {
    switch (impact) {
      case "positivo":
        return "text-green-400";
      case "negativo":
        return "text-red-400";
      default:
        return "text-blue-400";
    }
  };

  const getIcon = (impactType) => {
    if (insight.predicted_impact === "positivo") return <TrendingUp className="h-5 w-5 text-green-400" />;
    if (insight.predicted_impact === "negativo") return <TrendingDown className="h-5 w-5 text-red-400" />;
    return <AlertCircle className="h-5 w-5 text-blue-400" />;
  };

  return (
    <Card className={`bg-gradient-to-br from-gray-900 via-gray-900 border-gray-800 p-5 hover:border-violet-500/30 transition-all ${!isRead ? "border-violet-500/50 ring-1 ring-violet-500/20" : ""}`}>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="mt-1">{getIcon(insight.predicted_impact)}</div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-white">{insight.title}</h4>
              <p className="text-xs text-gray-500 mt-1">
                {INSIGHT_TYPES[insight.insight_type]}
              </p>
            </div>
          </div>
          <Button
            onClick={onDismiss}
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-gray-600 hover:text-gray-400"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-400 leading-relaxed">{insight.description}</p>

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-800">
          <div>
            <p className="text-xs text-gray-500 mb-1">Confiança</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-purple-500"
                  style={{ width: `${insight.confidence_score}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-violet-400">{insight.confidence_score}%</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Período</p>
            <p className="text-xs text-gray-400">
              {insight.time_horizon === "curto_prazo"
                ? "Curto Prazo"
                : insight.time_horizon === "medio_prazo"
                ? "Médio Prazo"
                : "Longo Prazo"}
            </p>
          </div>
        </div>

        {/* Tags */}
        {insight.related_assets && insight.related_assets.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-2">Ativos Relacionados:</p>
            <div className="flex flex-wrap gap-2">
              {insight.related_assets.map((asset) => (
                <Badge key={asset} variant="outline" className="text-xs border-gray-700">
                  {asset}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-gray-600">
            {insight.community_data_points} dados da comunidade
          </p>
          <Button
            onClick={handleMarkAsRead}
            variant="ghost"
            size="sm"
            className="h-7 text-gray-500 hover:text-gray-300"
          >
            {isRead ? (
              <EyeOff className="h-4 w-4 mr-1" />
            ) : (
              <Eye className="h-4 w-4 mr-1" />
            )}
            {isRead ? "Lido" : "Não lido"}
          </Button>
        </div>
      </div>
    </Card>
  );
}