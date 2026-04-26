import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, TrendingUp, Shield, Target, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function InvestmentRecommender({ riskProfile, portfolio, goals, assets }) {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateRecommendations = async () => {
    setLoading(true);
    try {
      const assetsByType = assets?.reduce((acc, asset) => {
        acc[asset.type] = (acc[asset.type] || 0) + (asset.current_value || 0);
        return acc;
      }, {}) || {};

      const totalValue = portfolio?.current_value || 0;
      const distribution = Object.entries(assetsByType).map(([type, value]) => ({
        type,
        value,
        percentage: totalValue > 0 ? (value / totalValue * 100).toFixed(1) : 0
      }));

      const prompt = `
Como consultor de investimentos, analise o perfil e forneça recomendações personalizadas de investimentos.

**PERFIL DO INVESTIDOR:**
- Tolerância ao Risco: ${riskProfile?.risk_tolerance || 'moderado'}
- Horizonte de Investimento: ${riskProfile?.investment_horizon || 'longo_prazo'}
- Objetivo Principal: ${riskProfile?.primary_goal || 'crescimento'}
- Retorno Alvo: ${riskProfile?.target_return || 12}% ao ano
- Conhecimento de Mercado: ${riskProfile?.market_knowledge || 'iniciante'}
- Capacidade Mensal: R$ ${riskProfile?.monthly_investment_capacity?.toLocaleString('pt-BR') || 0}
- Reserva de Emergência: ${riskProfile?.emergency_fund_months || 0} meses
- Perda Máxima Aceitável: ${riskProfile?.max_acceptable_loss || 10}%

**CARTEIRA ATUAL:**
- Valor Total: R$ ${totalValue.toLocaleString('pt-BR')}
- Distribuição Atual: ${distribution.map(d => `${d.type}: ${d.percentage}%`).join(', ')}
- Número de Ativos: ${assets?.length || 0}

**CONTEXTO DE MERCADO:**
Considere as tendências atuais do mercado brasileiro, taxas de juros (Selic), inflação e cenário macroeconômico de 2026.

**METAS FINANCEIRAS:**
${goals?.map(g => `- ${g.title} (${g.category}): R$ ${g.target_amount?.toLocaleString('pt-BR')} até ${new Date(g.target_date).toLocaleDateString('pt-BR')}`).join('\n') || 'Nenhuma meta definida'}

Forneça recomendações ESPECÍFICAS e ACIONÁVEIS de investimentos adequados ao perfil, incluindo:
1. Ativos/setores específicos para investir
2. Percentual sugerido de alocação
3. Estratégias de entrada
4. Pontos de atenção e riscos`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            recomendacoes_por_classe: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  classe_ativo: { type: "string" },
                  alocacao_sugerida_percentual: { type: "number" },
                  ativos_especificos: { type: "array", items: { type: "string" } },
                  justificativa: { type: "string" },
                  nivel_risco: { type: "string" }
                }
              }
            },
            estrategia_entrada: {
              type: "object",
              properties: {
                abordagem: { type: "string" },
                passos: { type: "array", items: { type: "string" } }
              }
            },
            diversificacao: {
              type: "object",
              properties: {
                status_atual: { type: "string" },
                melhorias_sugeridas: { type: "array", items: { type: "string" } }
              }
            },
            alertas_importantes: {
              type: "array",
              items: { type: "string" }
            },
            oportunidades_mercado: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  setor: { type: "string" },
                  razao: { type: "string" },
                  timing: { type: "string" }
                }
              }
            }
          }
        }
      });

      setRecommendations(response);
      toast.success("Recomendações geradas com dados do mercado!");
    } catch (error) {
      toast.error("Erro ao gerar recomendações");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (nivel) => {
    const colors = {
      baixo: "green",
      medio: "yellow",
      moderado: "yellow",
      alto: "red"
    };
    return colors[nivel?.toLowerCase()] || "gray";
  };

  return (
    <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-400" />
            Recomendações IA de Investimentos
          </CardTitle>
          <Button 
            onClick={generateRecommendations} 
            disabled={loading}
            size="sm"
            className="bg-violet-600 hover:bg-violet-700"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <TrendingUp className="h-4 w-4 mr-2" />
                Gerar
              </>
            )}
          </Button>
        </div>
        <p className="text-gray-400 text-sm mt-1">
          Análise com dados de mercado em tempo real
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {!recommendations && !loading && (
          <div className="text-center py-8">
            <Sparkles className="h-12 w-12 text-violet-400 mx-auto mb-3" />
            <p className="text-gray-300 font-medium mb-1">
              Recomendações Personalizadas com IA
            </p>
            <p className="text-gray-400 text-sm">
              Baseadas no seu perfil, metas e tendências de mercado
            </p>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 text-violet-400 animate-spin mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Consultando dados de mercado...</p>
          </div>
        )}

        {recommendations && (
          <>
            {/* Asset Class Recommendations */}
            {recommendations.recomendacoes_por_classe?.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-white font-semibold flex items-center gap-2">
                  <Target className="h-5 w-5 text-violet-400" />
                  Alocação Recomendada por Classe
                </h4>
                {recommendations.recomendacoes_por_classe.map((rec, idx) => (
                  <div key={idx} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h5 className="text-white font-semibold">{rec.classe_ativo}</h5>
                        <p className="text-violet-400 text-sm mt-1">
                          {rec.alocacao_sugerida_percentual}% da carteira
                        </p>
                      </div>
                      <Badge 
                        className={`bg-${getRiskColor(rec.nivel_risco)}-500/20 text-${getRiskColor(rec.nivel_risco)}-400 border-${getRiskColor(rec.nivel_risco)}-500/30`}
                      >
                        Risco {rec.nivel_risco}
                      </Badge>
                    </div>
                    <p className="text-gray-300 text-sm mb-3">{rec.justificativa}</p>
                    {rec.ativos_especificos?.length > 0 && (
                      <div>
                        <p className="text-gray-400 text-xs mb-2">Ativos sugeridos:</p>
                        <div className="flex flex-wrap gap-2">
                          {rec.ativos_especificos.map((ativo, i) => (
                            <Badge key={i} variant="outline" className="text-gray-300 border-gray-600">
                              {ativo}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Entry Strategy */}
            {recommendations.estrategia_entrada && (
              <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/30">
                <h4 className="text-blue-400 font-semibold mb-2 text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Estratégia de Entrada
                </h4>
                <p className="text-gray-300 text-sm mb-3">{recommendations.estrategia_entrada.abordagem}</p>
                <ul className="space-y-1.5">
                  {recommendations.estrategia_entrada.passos?.map((passo, idx) => (
                    <li key={idx} className="text-gray-300 text-sm flex items-start gap-2">
                      <span className="text-blue-400 font-bold">{idx + 1}.</span>
                      {passo}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Diversification */}
            {recommendations.diversificacao && (
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <h4 className="text-white font-semibold mb-2 text-sm flex items-center gap-2">
                  <Shield className="h-4 w-4 text-violet-400" />
                  Status de Diversificação
                </h4>
                <p className="text-gray-300 text-sm mb-3">{recommendations.diversificacao.status_atual}</p>
                {recommendations.diversificacao.melhorias_sugeridas?.length > 0 && (
                  <ul className="space-y-1.5">
                    {recommendations.diversificacao.melhorias_sugeridas.map((melhoria, idx) => (
                      <li key={idx} className="text-gray-300 text-sm flex items-start gap-2">
                        <span className="text-violet-400">→</span>
                        {melhoria}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Market Opportunities */}
            {recommendations.oportunidades_mercado?.length > 0 && (
              <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/30">
                <h4 className="text-green-400 font-semibold mb-3 text-sm">🎯 Oportunidades de Mercado</h4>
                <div className="space-y-3">
                  {recommendations.oportunidades_mercado.map((oport, idx) => (
                    <div key={idx} className="bg-gray-800/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-white font-medium text-sm">{oport.setor}</h5>
                        <Badge variant="outline" className="text-green-400 border-green-500/30 text-xs">
                          {oport.timing}
                        </Badge>
                      </div>
                      <p className="text-gray-300 text-sm">{oport.razao}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Important Alerts */}
            {recommendations.alertas_importantes?.length > 0 && (
              <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/30">
                <h4 className="text-red-400 font-semibold mb-3 text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Alertas Importantes
                </h4>
                <ul className="space-y-2">
                  {recommendations.alertas_importantes.map((alerta, idx) => (
                    <li key={idx} className="text-gray-300 text-sm flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                      {alerta}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}