import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, Sparkles, TrendingUp, Target, RefreshCw, Loader2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function AIRecommendations({ goals, assets, riskProfile, portfolio, userEmail }) {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateRecommendations = async () => {
    setLoading(true);
    try {
      const totalInvested = portfolio?.total_invested || 0;
      const currentValue = portfolio?.current_value || 0;
      const totalReturn = currentValue - totalInvested;
      const returnPercent = totalInvested > 0 ? ((totalReturn / totalInvested) * 100).toFixed(2) : 0;

      const assetsByType = assets.reduce((acc, asset) => {
        acc[asset.type] = (acc[asset.type] || 0) + (asset.current_value || 0);
        return acc;
      }, {});

      const prompt = `
Como consultor financeiro especializado, analise o perfil completo do investidor e suas metas.

**PERFIL DE RISCO:**
- Tolerância: ${riskProfile?.risk_tolerance || 'moderado'}
- Horizonte: ${riskProfile?.investment_horizon || 'longo_prazo'}  
- Objetivo Principal: ${riskProfile?.primary_goal || 'crescimento'}
- Retorno Alvo Anual: ${riskProfile?.target_return || 12}%
- Capacidade Mensal: R$ ${riskProfile?.monthly_investment_capacity?.toLocaleString('pt-BR') || 0}
- Experiência: ${riskProfile?.market_knowledge || 'iniciante'}

**SITUAÇÃO ATUAL:**
- Patrimônio: R$ ${currentValue.toLocaleString('pt-BR')}
- Investido: R$ ${totalInvested.toLocaleString('pt-BR')}
- Retorno Total: R$ ${totalReturn.toLocaleString('pt-BR')} (${returnPercent}%)
- Ativos: ${assets.length}
- Distribuição: ${Object.entries(assetsByType).map(([type, val]) => `${type}: R$ ${val.toLocaleString('pt-BR')}`).join(', ')}

**METAS:**
${goals.map(g => {
  const progress = ((g.current_amount / g.target_amount) * 100).toFixed(1);
  const monthsLeft = Math.ceil((new Date(g.target_date) - new Date()) / (1000 * 60 * 60 * 24 * 30));
  return `- ${g.title} (${g.category}): Meta R$ ${g.target_amount.toLocaleString('pt-BR')}, Atual R$ ${g.current_amount.toLocaleString('pt-BR')} (${progress}%), ${monthsLeft} meses restantes, Aporte mensal: R$ ${g.monthly_contribution}`;
}).join('\n')}

Forneça recomendações PRÁTICAS e ACIONÁVEIS:`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            estrategias_por_meta: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  meta_titulo: { type: "string" },
                  estrategia: { type: "string" },
                  aporte_sugerido: { type: "number" },
                  prazo_realista: { type: "string" }
                }
              }
            },
            sugestoes_aportes: {
              type: "object",
              properties: {
                total_mensal_sugerido: { type: "number" },
                distribuicao: { type: "array", items: { type: "string" } }
              }
            },
            rebalanceamento: {
              type: "object",
              properties: {
                necessario: { type: "boolean" },
                acoes: { type: "array", items: { type: "string" } }
              }
            },
            alertas: {
              type: "array",
              items: { type: "string" }
            },
            proximos_passos: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      setRecommendations(response);
      toast.success("Recomendações geradas!");
    } catch (error) {
      toast.error("Erro ao gerar recomendações");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Generate Button */}
      <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-violet-400" />
              <div>
                <h3 className="text-white font-semibold">Análise Personalizada com IA</h3>
                <p className="text-gray-400 text-sm">Receba estratégias customizadas para suas metas</p>
              </div>
            </div>
            <Button 
              onClick={generateRecommendations} 
              disabled={loading || !goals.length}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Lightbulb className="h-4 w-4 mr-2" />}
              {loading ? 'Analisando...' : 'Gerar Análise'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations Display */}
      {recommendations && (
        <div className="space-y-6">
          {/* Estratégias por Meta */}
          {recommendations.estrategias_por_meta?.length > 0 && (
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Target className="h-5 w-5 text-violet-400" />
                  Estratégias por Meta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recommendations.estrategias_por_meta.map((item, idx) => (
                  <div key={idx} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                    <h4 className="text-white font-semibold mb-2">{item.meta_titulo}</h4>
                    <p className="text-gray-300 text-sm mb-3">{item.estrategia}</p>
                    <div className="flex gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Aporte Sugerido: </span>
                        <span className="text-violet-400 font-semibold">R$ {item.aporte_sugerido?.toLocaleString('pt-BR')}/mês</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Prazo: </span>
                        <span className="text-green-400 font-semibold">{item.prazo_realista}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Sugestões de Aportes */}
          {recommendations.sugestoes_aportes && (
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                  Plano de Aportes Otimizado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-lg p-4 border border-violet-500/30">
                  <p className="text-gray-400 text-sm mb-1">Total Mensal Recomendado</p>
                  <p className="text-white text-2xl font-bold">
                    R$ {recommendations.sugestoes_aportes.total_mensal_sugerido?.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-3">Distribuição Sugerida:</p>
                  <ul className="space-y-2">
                    {recommendations.sugestoes_aportes.distribuicao?.map((item, idx) => (
                      <li key={idx} className="text-gray-300 text-sm flex items-start gap-2">
                        <span className="text-violet-400">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rebalanceamento */}
          {recommendations.rebalanceamento && (
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-amber-400" />
                  Rebalanceamento da Carteira
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recommendations.rebalanceamento.necessario ? (
                  <>
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                      Rebalanceamento Recomendado
                    </Badge>
                    <ul className="space-y-2 mt-3">
                      {recommendations.rebalanceamento.acoes?.map((acao, idx) => (
                        <li key={idx} className="text-gray-300 text-sm flex items-start gap-2">
                          <span className="text-amber-400">→</span>
                          {acao}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="text-green-400 text-sm">✓ Sua carteira está bem balanceada</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Alertas */}
          {recommendations.alertas?.length > 0 && (
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  Pontos de Atenção
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {recommendations.alertas.map((alerta, idx) => (
                    <li key={idx} className="text-gray-300 text-sm flex items-start gap-2 bg-red-500/10 rounded-lg p-3 border border-red-500/20">
                      <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                      {alerta}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Próximos Passos */}
          {recommendations.proximos_passos?.length > 0 && (
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-400" />
                  Próximos Passos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {recommendations.proximos_passos.map((passo, idx) => (
                    <li key={idx} className="text-gray-300 text-sm flex items-start gap-3">
                      <span className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold flex-shrink-0">
                        {idx + 1}
                      </span>
                      {passo}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}