import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2, PieChart, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function RebalancingStrategy({ assets, riskProfile, portfolio }) {
  const [strategy, setStrategy] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateStrategy = async () => {
    setLoading(true);
    try {
      const assetBreakdown = assets.reduce((acc, asset) => {
        const type = asset.type || 'outros';
        const value = (asset.quantity || 0) * (asset.current_price || asset.purchase_price || 0);
        acc[type] = (acc[type] || 0) + value;
        return acc;
      }, {});

      const totalValue = Object.values(assetBreakdown).reduce((sum, val) => sum + val, 0);
      const assetDistribution = Object.entries(assetBreakdown).map(([type, value]) => ({
        type,
        value,
        percentage: totalValue > 0 ? ((value / totalValue) * 100).toFixed(1) : 0
      }));

      // Distribuição ideal por perfil
      const idealDistributions = {
        conservador: { renda_fixa: 70, acoes: 15, fiis: 10, outros: 5 },
        moderado: { renda_fixa: 40, acoes: 35, fiis: 20, outros: 5 },
        agressivo: { renda_fixa: 15, acoes: 60, fiis: 20, outros: 5 }
      };

      const idealDist = idealDistributions[riskProfile?.risk_tolerance || 'moderado'];

      const prompt = `
Como consultor financeiro, analise a carteira e forneça rebalanceamento ESPECÍFICO.

**PERFIL:**
- Risco: ${riskProfile?.risk_tolerance || 'moderado'}
- Horizonte: ${riskProfile?.investment_horizon || 'longo_prazo'}
- Objetivo: ${riskProfile?.primary_goal || 'crescimento'}

**DISTRIBUIÇÃO ATUAL:**
${assetDistribution.map(a => `- ${a.type}: R$ ${a.value.toLocaleString('pt-BR')} (${a.percentage}%)`).join('\n')}
Total: R$ ${totalValue.toLocaleString('pt-BR')}

**DISTRIBUIÇÃO IDEAL PARA ${riskProfile?.risk_tolerance?.toUpperCase() || 'MODERADO'}:**
${Object.entries(idealDist).map(([type, pct]) => `- ${type}: ${pct}%`).join('\n')}

**ATIVOS:**
${assets.map(a => `- ${a.name}: ${a.quantity} un. @ R$ ${(a.current_price || a.purchase_price || 0).toFixed(2)}`).join('\n')}

Forneça estratégia PRÁTICA de rebalanceamento:`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            distribuicao_ideal: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  tipo_ativo: { type: "string" },
                  percentual_ideal: { type: "number" },
                  percentual_atual: { type: "number" }
                }
              }
            },
            acoes_recomendadas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  acao: { type: "string" },
                  ativo: { type: "string" },
                  valor_sugerido: { type: "number" },
                  justificativa: { type: "string" }
                }
              }
            },
            timeline: { type: "string" },
            observacoes: { type: "array", items: { type: "string" } }
          }
        }
      });

      setStrategy(response);
      toast.success("Estratégia gerada!");
    } catch (error) {
      toast.error("Erro ao gerar estratégia");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Generate Button */}
      <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-8 w-8 text-amber-400" />
              <div>
                <h3 className="text-white font-semibold">Estratégia de Rebalanceamento</h3>
                <p className="text-gray-400 text-sm">Otimize sua carteira com base no seu perfil</p>
              </div>
            </div>
            <Button 
              onClick={generateStrategy} 
              disabled={loading || !assets.length}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              {loading ? 'Analisando...' : 'Gerar Estratégia'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Strategy Display */}
      {strategy && (
        <div className="space-y-6">
          {/* Ideal Distribution */}
          {strategy.distribuicao_ideal?.length > 0 && (
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-violet-400" />
                  Distribuição Ideal vs Atual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {strategy.distribuicao_ideal.map((item, idx) => (
                    <div key={idx} className="bg-gray-800/50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-white font-medium capitalize">{item.tipo_ativo}</span>
                        <div className="flex gap-4 text-sm">
                          <span className="text-gray-400">
                            Atual: <span className="text-red-400 font-semibold">{item.percentual_atual}%</span>
                          </span>
                          <ArrowRight className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-400">
                            Ideal: <span className="text-green-400 font-semibold">{item.percentual_ideal}%</span>
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1 bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-red-500 h-2 rounded-full"
                            style={{ width: `${item.percentual_atual}%` }}
                          />
                        </div>
                        <div className="flex-1 bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${item.percentual_ideal}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommended Actions */}
          {strategy.acoes_recomendadas?.length > 0 && (
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Ações Recomendadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {strategy.acoes_recomendadas.map((acao, idx) => (
                    <div key={idx} className="bg-gray-800/50 rounded-lg p-4 border-l-4 border-violet-500">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                            acao.acao.toLowerCase().includes('comprar') 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {acao.acao}
                          </span>
                          <p className="text-white font-medium mt-2">{acao.ativo}</p>
                        </div>
                        <p className="text-violet-400 font-bold text-lg">
                          R$ {acao.valor_sugerido?.toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <p className="text-gray-400 text-sm mt-2">{acao.justificativa}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          {strategy.timeline && (
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Timeline de Implementação</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">{strategy.timeline}</p>
              </CardContent>
            </Card>
          )}

          {/* Observações */}
          {strategy.observacoes?.length > 0 && (
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Observações Importantes</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {strategy.observacoes.map((obs, idx) => (
                    <li key={idx} className="text-gray-300 text-sm flex items-start gap-2">
                      <span className="text-violet-400">•</span>
                      {obs}
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