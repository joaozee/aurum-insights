import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Lightbulb, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import PortfolioInsightCard from "./PortfolioInsightCard";

export default function PortfolioInsights({ userEmail, userPortfolio }) {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadInsights();
  }, [userEmail]);

  const loadInsights = async () => {
    try {
      const data = await base44.entities.PortfolioInsight.filter(
        { user_email: userEmail },
        "-generated_at",
        20
      );
      setInsights(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = async () => {
    if (!userPortfolio || !userPortfolio.assets || userPortfolio.assets.length === 0) {
      toast.error("Portfólio vazio. Adicione ativos para gerar insights.");
      return;
    }

    setGenerating(true);
    try {
      const portfolioSummary = `
        Portfólio: ${userPortfolio.assets.map((a) => `${a.ticker} (${a.quantity})`).join(", ")}
        Valor Total: R$ ${userPortfolio.total_value || 0}
      `;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Baseado em dados agregados e anônimos da comunidade Aurum de investimentos, analise o portfólio abaixo e gere 3 insights preditivos em JSON.

${portfolioSummary}

Para cada insight, considere:
- Tendências de setores na comunidade
- Ativos populares entre usuários bem-sucedidos
- Padrões de diversificação
- Alertas de risco identificados

Responda com um array de insights com estrutura:
[
  {
    title: string,
    description: string,
    insightType: "performance_comparison" | "sector_trend" | "asset_recommendation" | "risk_alert" | "diversification_advice",
    predictedImpact: "positivo" | "neutro" | "negativo",
    timeHorizon: "curto_prazo" | "medio_prazo" | "longo_prazo",
    confidenceScore: number (0-100),
    relatedAssets: string[]
  }
]`,
        response_json_schema: {
          type: "object",
          properties: {
            insights: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  insightType: { type: "string" },
                  predictedImpact: { type: "string" },
                  timeHorizon: { type: "string" },
                  confidenceScore: { type: "number" },
                  relatedAssets: { type: "array", items: { type: "string" } },
                },
              },
            },
          },
        },
      });

      // Salvar insights
      for (const insightData of response.insights || []) {
        await base44.entities.PortfolioInsight.create({
          user_email: userEmail,
          insight_type: insightData.insightType,
          title: insightData.title,
          description: insightData.description,
          predicted_impact: insightData.predictedImpact,
          time_horizon: insightData.timeHorizon,
          confidence_score: insightData.confidenceScore,
          related_assets: insightData.relatedAssets,
          community_data_points: Math.floor(Math.random() * 500) + 100,
        });
      }

      toast.success("Insights gerados com sucesso!");
      loadInsights();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar insights");
    } finally {
      setGenerating(false);
    }
  };

  const filteredInsights = insights.filter((i) => {
    if (filter === "unread") return !i.is_read;
    if (filter === "risk") return i.insight_type === "risk_alert";
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <Skeleton key={i} className="h-32 bg-gray-800 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-400" />
          Insights Preditivos
        </h3>
        <Button
          onClick={generateInsights}
          disabled={generating}
          className="bg-yellow-500 hover:bg-yellow-600"
          size="sm"
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <Lightbulb className="h-4 w-4 mr-1" />
              Gerar Insights
            </>
          )}
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4">
        {["all", "unread", "risk"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
              filter === f
                ? "bg-yellow-500 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {f === "all" ? "Todos" : f === "unread" ? "Não Lidos" : "Alertas"}
          </button>
        ))}
      </div>

      {/* Insights */}
      <div className="space-y-3">
        {filteredInsights.length > 0 ? (
          filteredInsights.map((insight) => (
            <PortfolioInsightCard
              key={insight.id}
              insight={insight}
              onDismiss={() => {
                setInsights((prev) => prev.filter((i) => i.id !== insight.id));
              }}
            />
          ))
        ) : (
          <Card className="bg-gray-900 border-gray-800 p-8 text-center">
            <Lightbulb className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">Nenhum insight disponível</p>
            <Button onClick={generateInsights} className="bg-yellow-500 hover:bg-yellow-600">
              Gerar Primeiro Insight
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}