import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AIInsights({ assets, transactions, goals }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateInsights = async () => {
    setLoading(true);
    try {
      const assetsList = Object.values(assets);
      const totalInvested = assetsList.reduce((sum, a) => sum + a.quantity * a.purchase_price, 0);
      const totalCurrent = assetsList.reduce((sum, a) => sum + a.quantity * a.current_price, 0);
      const performance = ((totalCurrent - totalInvested) / totalInvested) * 100;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise esta carteira de investimentos e gere insights acionáveis:

**Dados da Carteira:**
- Total de ativos: ${assetsList.length}
- Performance total: ${performance.toFixed(2)}%
- Ativos: ${assetsList.map(a => `${a.ticker} (${((a.quantity * a.current_price / totalCurrent) * 100).toFixed(1)}%)`).join(', ')}

**Análise Necessária:**
1. Principais fatores que impactaram a performance (positivos e negativos)
2. Oportunidades de otimização específicas
3. Riscos identificados na composição atual
4. Recomendações de ações concretas

Seja específico e prático. Foque em insights únicos desta carteira.`,
        response_json_schema: {
          type: "object",
          properties: {
            key_factors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  factor: { type: "string" },
                  impact: { type: "string", enum: ["positivo", "negativo", "neutro"] },
                  description: { type: "string" }
                }
              }
            },
            opportunities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  priority: { type: "string", enum: ["alta", "media", "baixa"] }
                }
              }
            },
            risks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  risk: { type: "string" },
                  severity: { type: "string", enum: ["alta", "media", "baixa"] },
                  mitigation: { type: "string" }
                }
              }
            },
            recommendations: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      setInsights(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (assets && Object.keys(assets).length > 0) {
      generateInsights();
    }
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-800 rounded mb-6" />
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-800 rounded" />)}
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
        <Sparkles className="h-12 w-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400 mb-4">Gere insights inteligentes sobre sua carteira</p>
        <Button onClick={generateInsights} className="bg-violet-600 hover:bg-violet-700">
          <Sparkles className="h-4 w-4 mr-2" />
          Gerar Análise IA
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-violet-950/30 rounded-2xl border border-gray-800 p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-violet-400" />
          <div>
            <h3 className="text-lg font-semibold text-white">Insights IA</h3>
            <p className="text-gray-500 text-sm">Análise inteligente da sua carteira</p>
          </div>
        </div>
        <Button 
          size="sm" 
          variant="outline"
          onClick={generateInsights}
          disabled={loading}
          className="border-gray-700 text-gray-300"
        >
          Atualizar
        </Button>
      </div>

      <div className="space-y-6">
        {/* Key Factors */}
        <div>
          <h4 className="text-white font-medium mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-violet-400" />
            Fatores de Impacto
          </h4>
          <div className="space-y-2">
            {insights.key_factors?.map((factor, i) => (
              <div key={i} className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                <div className="flex items-start gap-3">
                  <div className={`h-2 w-2 rounded-full mt-1.5 ${
                    factor.impact === 'positivo' ? 'bg-emerald-400' : 
                    factor.impact === 'negativo' ? 'bg-red-400' : 'bg-gray-400'
                  }`} />
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{factor.factor}</p>
                    <p className="text-gray-400 text-xs mt-1">{factor.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Opportunities */}
        {insights.opportunities?.length > 0 && (
          <div>
            <h4 className="text-white font-medium mb-3 flex items-center gap-2">
              <Target className="h-4 w-4 text-emerald-400" />
              Oportunidades
            </h4>
            <div className="space-y-2">
              {insights.opportunities.map((opp, i) => (
                <div key={i} className="bg-emerald-500/5 rounded-lg p-3 border border-emerald-500/20">
                  <div className="flex items-start gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      opp.priority === 'alta' ? 'bg-emerald-500/20 text-emerald-400' :
                      opp.priority === 'media' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {opp.priority}
                    </span>
                  </div>
                  <p className="text-white text-sm font-medium mt-2">{opp.title}</p>
                  <p className="text-gray-400 text-xs mt-1">{opp.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Risks */}
        {insights.risks?.length > 0 && (
          <div>
            <h4 className="text-white font-medium mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              Riscos Identificados
            </h4>
            <div className="space-y-2">
              {insights.risks.map((risk, i) => (
                <div key={i} className="bg-amber-500/5 rounded-lg p-3 border border-amber-500/20">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-white text-sm font-medium">{risk.risk}</p>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                      risk.severity === 'alta' ? 'bg-red-500/20 text-red-400' :
                      risk.severity === 'media' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {risk.severity}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs">
                    <span className="text-gray-500">Mitigação:</span> {risk.mitigation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {insights.recommendations?.length > 0 && (
          <div className="bg-violet-500/5 rounded-lg p-4 border border-violet-500/20">
            <h4 className="text-white font-medium mb-3 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-violet-400" />
              Recomendações
            </h4>
            <ul className="space-y-2">
              {insights.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                  <span className="text-violet-400 font-bold">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}