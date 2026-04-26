import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";
import { Lightbulb, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function GoalRecommendations({ goals, portfolioData, userEmail }) {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (goals.length > 0 && portfolioData) {
      generateRecommendations();
    }
  }, [goals, portfolioData]);

  const generateRecommendations = async () => {
    try {
      setLoading(true);

      const goalsContext = goals
        .map(
          (g) =>
            `- ${g.title} (${g.category}): R$ ${g.current_amount.toLocaleString("pt-BR")} de R$ ${g.target_amount.toLocaleString("pt-BR")} até ${new Date(g.target_date).toLocaleDateString("pt-BR")}`
        )
        .join("\n");

      const portfolioSummary = {
        current_value: portfolioData.current_value,
        monthly_passive_income: portfolioData.monthly_passive_income,
        daily_variation_percent: portfolioData.daily_variation_percent,
        assets_count: Object.keys(portfolioData.assets || {}).length,
      };

      const prompt = `Você é um assessor financeiro especialista. Analise as metas do usuário e forneça recomendações práticas para atingi-las mais rapidamente.

**Metas do Usuário:**
${goalsContext}

**Situação Atual da Carteira:**
- Valor Total: R$ ${portfolioSummary.current_value.toLocaleString("pt-BR")}
- Renda Passiva Mensal: R$ ${portfolioSummary.monthly_passive_income.toLocaleString("pt-BR")}
- Performance Diária: ${portfolioSummary.daily_variation_percent.toFixed(2)}%
- Ativos: ${portfolioSummary.assets_count}

**Instruções:**
1. Analise a viabilidade de cada meta considerando o horizonte de tempo
2. Sugira estratégias específicas (aumentar contribuições, realocar assets, aproveitar renda passiva)
3. Identifique qual meta tem mais chance de ser atingida
4. Aponte possíveis ajustes na estratégia de investimento
5. Seja conciso e prático

Retorne como um JSON com recomendações estruturadas.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            overall_assessment: {
              type: "string",
              description: "Avaliação geral da situação",
            },
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  goal_title: { type: "string" },
                  priority: {
                    type: "string",
                    enum: ["alta", "média", "baixa"],
                  },
                  viability: {
                    type: "string",
                    enum: ["altamente_viável", "viável", "desafiador"],
                  },
                  actions: {
                    type: "array",
                    items: { type: "string" },
                    description: "Ações específicas para atingir a meta",
                  },
                  estimated_timeline: {
                    type: "string",
                    description: "Estimativa de tempo se as recomendações forem seguidas",
                  },
                },
              },
            },
            optimization_tips: {
              type: "array",
              items: { type: "string" },
              description: "Dicas gerais de otimização",
            },
          },
        },
      });

      setRecommendations(response);
    } catch (err) {
      console.error("Erro ao gerar recomendações:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="pt-6 flex items-center justify-center gap-2 text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Gerando recomendações de IA...
        </CardContent>
      </Card>
    );
  }

  if (!recommendations) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-violet-950/20 via-gray-900 to-gray-800 border-violet-500/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-400" />
          Recomendações de IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Assessment */}
        <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-4">
          <p className="text-sm text-violet-200">
            {recommendations.overall_assessment}
          </p>
        </div>

        {/* Goal-Specific Recommendations */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-white">
            Recomendações por Meta
          </h3>
          {recommendations.recommendations?.map((rec, idx) => (
            <div
              key={idx}
              className="border border-gray-700 rounded-lg p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <h4 className="font-medium text-white">{rec.goal_title}</h4>
                <div className="flex gap-2">
                  <span
                    className={cn(
                      "text-xs px-2 py-1 rounded-full font-medium",
                      rec.priority === "alta"
                        ? "bg-red-500/20 text-red-300"
                        : rec.priority === "média"
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-gray-700 text-gray-300"
                    )}
                  >
                    {rec.priority}
                  </span>
                  <span
                    className={cn(
                      "text-xs px-2 py-1 rounded-full font-medium",
                      rec.viability === "altamente_viável"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : rec.viability === "viável"
                          ? "bg-blue-500/20 text-blue-300"
                          : "bg-orange-500/20 text-orange-300"
                    )}
                  >
                    {rec.viability.replace(/_/g, " ")}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-gray-400 font-medium">Ações:</p>
                <ul className="space-y-1">
                  {rec.actions?.map((action, i) => (
                    <li key={i} className="text-sm text-gray-300 flex gap-2">
                      <span className="text-violet-400 flex-shrink-0">•</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {rec.estimated_timeline && (
                <p className="text-xs text-amber-300 bg-amber-500/10 px-3 py-2 rounded">
                  ⏱️ {rec.estimated_timeline}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Optimization Tips */}
        {recommendations.optimization_tips?.length > 0 && (
          <div className="space-y-2 bg-gray-800/50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-white">Dicas Gerais</h3>
            <ul className="space-y-2">
              {recommendations.optimization_tips.map((tip, idx) => (
                <li key={idx} className="text-sm text-gray-300 flex gap-2">
                  <span className="text-blue-400 flex-shrink-0">✓</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}