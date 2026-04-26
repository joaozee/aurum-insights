import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, AlertCircle, RefreshCw, Target, ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { brapiService } from "@/components/utils/brapiService";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import RiskProfileDialog from "./RiskProfileDialog";

export default function PortfolioOptimizer({ assets, transactions, goals, userEmail }) {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [riskProfile, setRiskProfile] = useState(null);

  useEffect(() => {
    if (userEmail) {
      loadRiskProfile();
    }
  }, [userEmail]);

  const loadRiskProfile = async () => {
    try {
      const profiles = await base44.entities.RiskProfile.filter({ user_email: userEmail });
      if (profiles.length > 0) {
        setRiskProfile(profiles[0]);
      } else {
        const defaultProfile = await base44.entities.RiskProfile.create({
          user_email: userEmail,
          risk_tolerance: "moderado",
          investment_horizon: "longo_prazo",
          target_return: 12
        });
        setRiskProfile(defaultProfile);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const analyzePortfolio = async () => {
    if (!riskProfile || Object.keys(assets).length === 0) return;

    setLoading(true);
    try {
      const assetsList = Object.values(assets);
      let totalInvested = 0;
      let totalCurrent = 0;

      assetsList.forEach(asset => {
        const invested = asset.quantity * asset.purchase_price;
        const current = asset.quantity * (asset.current_price || asset.purchase_price);
        totalInvested += invested;
        totalCurrent += current;
      });

      const allocation = assetsList.map(asset => {
        const current = asset.quantity * (asset.current_price || asset.purchase_price);
        const percentage = (current / totalCurrent) * 100;
        return {
          ticker: asset.ticker,
          name: asset.company_name || asset.ticker,
          current_value: current,
          percentage: percentage.toFixed(2),
          quantity: asset.quantity
        };
      }).sort((a, b) => b.current_value - a.current_value);

      const tickers = assetsList.map(a => a.ticker);
      const quotes = await brapiService.getQuotes(tickers);

      const marketData = quotes.map(q => {
        const formatted = brapiService.formatStockData(q);
        return {
          ticker: q.symbol,
          name: formatted.company_name,
          sector: formatted.sector || 'Não classificado',
          price: formatted.current_price,
          change_percent: formatted.daily_change_percent,
          dividend_yield: formatted.dividend_yield,
          pe_ratio: formatted.pe_ratio
        };
      });

      const context = {
        risk_profile: {
          tolerance: riskProfile.risk_tolerance,
          horizon: riskProfile.investment_horizon,
          target_return: riskProfile.target_return
        },
        portfolio: {
          total_invested: totalInvested,
          total_current: totalCurrent,
          profit_percent: ((totalCurrent - totalInvested) / totalInvested * 100).toFixed(2),
          allocation: allocation,
          asset_count: assetsList.length
        },
        market_data: marketData,
        goals: goals?.slice(0, 3).map(g => ({
          title: g.title,
          target_amount: g.target_amount,
          current_amount: g.current_amount,
          target_date: g.target_date
        }))
      };

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um assessor de investimentos especializado em otimização de carteiras focado na estratégia de Renda Passiva com Dividend Yield ≥ 6%.

ESTRATÉGIA PRINCIPAL: Foco em ações com DY ≥ 6%, horizonte de longo prazo (5+ anos), reinvestimento de dividendos e aportes mensais consistentes.

PERFIL DO INVESTIDOR:
- Tolerância ao risco: ${context.risk_profile.tolerance}
- Horizonte: ${context.risk_profile.horizon}
- Retorno alvo: ${context.risk_profile.target_return}% ao ano

CARTEIRA ATUAL (Total: R$ ${totalCurrent.toFixed(2)}):
${allocation.map(a => `- ${a.name} (${a.ticker}): R$ ${a.current_value.toFixed(2)} (${a.percentage}%) com ${a.quantity} ações`).join('\n')}

DADOS DE MERCADO:
${marketData.map(m => `- ${m.name} (${m.ticker}): Setor ${m.sector}, P/L ${m.pe_ratio || 'N/A'}, DY ${m.dividend_yield ? m.dividend_yield.toFixed(2) + '%' : 'N/A'}, Variação: ${m.change_percent || '0'}%`).join('\n')}

METAS FINANCEIRAS:
${context.goals?.map(g => `- ${g.title}: R$ ${g.target_amount} até ${g.target_date}`).join('\n') || 'Nenhuma meta definida'}

ANÁLISE DETALHADA NECESSÁRIA (Seguindo estratégia de DY ≥ 6%):
1. **Saúde da Carteira**: Score 0-100 considerando alinhamento com DY ≥ 6%, diversificação, concentração, risco
2. **Cenário de Mercado**: Análise atual do mercado brasileiro (SELIC, inflação, perspectivas para dividendos)
3. **Rebalanceamento**: 3 ações específicas - avaliar se devem aumentar/reduzir para atingir DY ≥ 6%
4. **Novas Oportunidades**: 3 novos investimentos com DY ≥ 6%, tickers brasileiros, setor, justificativa
5. **Análise de Concentração**: Garantir diversificação setorial mantendo foco em DY
6. **Projeção de Renda Passiva**: Quanto de dividendos mensais será gerado em 1, 3 e 5 anos com aporte mensal

Priorize ações consolidadas com histórico consistente de dividendos.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            health_score: {
              type: "number",
              description: "Score de saúde da carteira 0-100"
            },
            health_summary: {
              type: "string",
              description: "Resumo da saúde da carteira vs estratégia DY ≥ 6%"
            },
            rebalancing_actions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  action: { type: "string" },
                  ticker: { type: "string" },
                  current_allocation: { type: "string" },
                  suggested_allocation: { type: "string" },
                  reason: { type: "string" }
                }
              },
              minItems: 3,
              maxItems: 3
            },
            new_opportunities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  ticker: { type: "string" },
                  name: { type: "string" },
                  sector: { type: "string" },
                  reason: { type: "string" },
                  suggested_allocation: { type: "string" }
                }
              },
              minItems: 3,
              maxItems: 3
            },
            market_outlook: {
              type: "string",
              description: "Visão geral do mercado atual e impacto em dividendos"
            }
          },
          required: ["health_score", "health_summary", "rebalancing_actions", "new_opportunities", "market_outlook"]
        }
      });

      setRecommendations(response);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!riskProfile) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-violet-950/40 via-gray-900 to-gray-900 rounded-2xl border border-violet-500/20 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Otimização IA</h3>
            </div>
            <p className="text-gray-400 text-sm">Recomendações personalizadas para sua carteira</p>
          </div>
          <div className="flex gap-2">
            <RiskProfileDialog userEmail={userEmail} onUpdate={loadRiskProfile} />
            <Button
              onClick={analyzePortfolio}
              disabled={loading}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Analisar
                </>
              )}
            </Button>
          </div>
        </div>

        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-20 rounded-xl bg-gray-800" />
            <Skeleton className="h-32 rounded-xl bg-gray-800" />
            <Skeleton className="h-32 rounded-xl bg-gray-800" />
          </div>
        )}

        {!loading && !recommendations && (
          <div className="text-center py-12">
            <Sparkles className="h-16 w-16 text-violet-400 mx-auto mb-4 opacity-50" />
            <p className="text-gray-400 text-sm mb-4">
              Clique em "Analisar" para receber recomendações personalizadas
            </p>
            <p className="text-gray-500 text-xs">
              Perfil atual: <span className="text-violet-400 font-medium">
                {riskProfile.risk_tolerance} • {riskProfile.investment_horizon.replace('_', ' ')}
              </span>
            </p>
          </div>
        )}

        {!loading && recommendations && (
          <div className="space-y-6">
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Score de Saúde da Carteira</span>
                <span className={cn(
                  "text-2xl font-bold",
                  recommendations.health_score >= 80 ? "text-emerald-400" :
                  recommendations.health_score >= 60 ? "text-amber-400" :
                  "text-red-400"
                )}>
                  {recommendations.health_score}/100
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
                <div
                  className={cn(
                    "h-2 rounded-full transition-all",
                    recommendations.health_score >= 80 ? "bg-gradient-to-r from-emerald-500 to-emerald-400" :
                    recommendations.health_score >= 60 ? "bg-gradient-to-r from-amber-500 to-amber-400" :
                    "bg-gradient-to-r from-red-500 to-red-400"
                  )}
                  style={{ width: `${recommendations.health_score}%` }}
                />
              </div>
              <p className="text-gray-300 text-sm">{recommendations.health_summary}</p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Target className="h-4 w-4 text-violet-400" />
                Rebalanceamento Sugerido
              </h4>
              <div className="space-y-3">
                {recommendations.rebalancing_actions.map((action, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 hover:border-violet-500/30 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                        <ArrowRight className="h-4 w-4 text-violet-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-white">{action.ticker}</span>
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs text-violet-400 font-medium">{action.action}</span>
                        </div>
                        <div className="flex items-center gap-3 mb-2 text-xs">
                          <span className="text-gray-400">
                            Atual: <span className="text-white font-medium">{action.current_allocation}</span>
                          </span>
                          <ArrowRight className="h-3 w-3 text-gray-600" />
                          <span className="text-gray-400">
                            Sugerido: <span className="text-violet-400 font-medium">{action.suggested_allocation}</span>
                          </span>
                        </div>
                        <p className="text-gray-300 text-xs leading-relaxed">{action.reason}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-400" />
                Novas Oportunidades
              </h4>
              <div className="space-y-3">
                {recommendations.new_opportunities.map((opp, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 hover:border-emerald-500/30 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-white">{opp.ticker}</span>
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs text-gray-400">{opp.name}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {opp.sector}
                          </span>
                          <span className="text-xs text-emerald-400 font-medium">
                            Alocar {opp.suggested_allocation}
                          </span>
                        </div>
                        <p className="text-gray-300 text-xs leading-relaxed">{opp.reason}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-300 leading-relaxed">
                  <span className="font-semibold text-amber-400">Aviso:</span> As recomendações são geradas por IA com base em dados atuais e não constituem recomendação de investimento. Consulte um profissional certificado antes de tomar decisões financeiras.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}