import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { AlertTriangle, Loader2, Shield, TrendingDown } from "lucide-react";
import { toast } from "sonner";

export default function DetailedRiskAnalysis({ userPortfolio, userEmail, riskProfile }) {
  const [riskAnalysis, setRiskAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateRiskAnalysis = async () => {
    setLoading(true);
    try {
      // Agregar exposição por setor
      const sectorExposure = {};
      const assetRisks = [];

      userPortfolio?.assets?.forEach(asset => {
        const currentValue = asset.quantity * (asset.current_price || asset.purchase_price);
        const sector = asset.sector || "Não classificado";
        
        sectorExposure[sector] = (sectorExposure[sector] || 0) + currentValue;
        
        // Estimar volatilidade (será melhorado pela IA)
        assetRisks.push({
          ticker: asset.ticker,
          value: currentValue,
          sector
        });
      });

      const totalValue = Object.values(sectorExposure).reduce((a, b) => a + b, 0);
      const sectorAllocation = Object.entries(sectorExposure)
        .map(([sector, value]) => ({
          sector,
          percentage: ((value / totalValue) * 100).toFixed(2)
        }));

      const prompt = `Como especialista em gerenciamento de risco, analise a exposição setorial da carteira baseado em discussões e padrões da comunidade Aurum.

ALOCAÇÃO SETORIAL:
${sectorAllocation.map(s => `- ${s.sector}: ${s.percentage}%`).join('\n')}

ATIVOS:
${assetRisks.slice(0, 10).map(a => `- ${a.ticker} (${a.sector})`).join('\n')}

PERFIL DO INVESTIDOR:
- Risco: ${riskProfile?.risk_tolerance || 'moderado'}
- Horizonte: ${riskProfile?.investment_horizon || 'longo_prazo'}

Análise requerida:
1. Concentração de risco por setor (Herfindahl index)
2. Exposição a setores voláteis vs estáveis
3. Correlação entre setores (baseado em comunidade)
4. Identificar setores em risco (baseado em discussões)
5. Score de diversificação (0-100)
6. Recomendações de rebalanceamento

Retorne análise estruturada em JSON.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            concentration_score: { type: "number" },
            diversification_score: { type: "number" },
            sector_risks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  sector: { type: "string" },
                  exposure_percent: { type: "number" },
                  volatility: { type: "string" },
                  risk_level: { type: "string" },
                  trend: { type: "string" }
                }
              }
            },
            correlation_matrix: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  sector1: { type: "string" },
                  sector2: { type: "string" },
                  correlation: { type: "number" }
                }
              }
            },
            risk_factors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  factor: { type: "string" },
                  impact: { type: "string" },
                  probability: { type: "string" },
                  mitigation: { type: "string" }
                }
              }
            },
            overall_risk_rating: { type: "string" },
            recommendations: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      setRiskAnalysis({
        sectorAllocation,
        ...response
      });

      toast.success("Análise de risco detalhada gerada!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar análise de risco");
    } finally {
      setLoading(false);
    }
  };

  const getSectorColor = (index) => {
    const colors = [
      "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b",
      "#10b981", "#06b6d4", "#f87171", "#84cc16"
    ];
    return colors[index % colors.length];
  };

  const getRiskColor = (level) => {
    const colors = {
      "muito_alto": "#dc2626",
      "alto": "#f97316",
      "moderado": "#eab308",
      "baixo": "#22c55e"
    };
    return colors[level] || "#gray";
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-400" />
            Análise Detalhada de Risco
          </CardTitle>
          <Button
            onClick={generateRiskAnalysis}
            disabled={loading}
            size="sm"
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Analisar Riscos"
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {!riskAnalysis && !loading && (
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              Analise os riscos específicos de sua carteira
            </p>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 text-red-400 animate-spin mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Analisando exposição a riscos...</p>
          </div>
        )}

        {riskAnalysis && (
          <>
            {/* Overall Risk Rating */}
            <div className={`bg-${riskAnalysis.overall_risk_rating === 'baixo' ? 'emerald' : riskAnalysis.overall_risk_rating === 'moderado' ? 'amber' : 'red'}-500/10 border border-${riskAnalysis.overall_risk_rating === 'baixo' ? 'emerald' : riskAnalysis.overall_risk_rating === 'moderado' ? 'amber' : 'red'}-500/30 rounded-lg p-4`}>
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                <div>
                  <p className="text-sm text-gray-400">Classificação de Risco Geral</p>
                  <p className="text-xl font-bold text-white">
                    {riskAnalysis.overall_risk_rating?.toUpperCase()}
                  </p>
                </div>
              </div>
            </div>

            {/* Scores */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <p className="text-sm text-gray-400 mb-2">Score de Diversificação</p>
                <p className="text-3xl font-bold text-blue-400">
                  {riskAnalysis.diversification_score}/100
                </p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <p className="text-sm text-gray-400 mb-2">Score de Concentração</p>
                <p className="text-3xl font-bold text-amber-400">
                  {riskAnalysis.concentration_score?.toFixed(1)}
                </p>
              </div>
            </div>

            {/* Sector Allocation Pie Chart */}
            {riskAnalysis.sectorAllocation?.length > 0 && (
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <h4 className="text-white font-semibold mb-4 text-sm">Exposição Setorial</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={riskAnalysis.sectorAllocation}
                      dataKey="percentage"
                      nameKey="sector"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                    >
                      {riskAnalysis.sectorAllocation.map((_, idx) => (
                        <Cell key={idx} fill={getSectorColor(idx)} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => `${v}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Sector Risk Details */}
            {riskAnalysis.sector_risks?.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-white font-semibold text-sm">Análise por Setor</h4>
                {riskAnalysis.sector_risks.map((sector, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-800/50 rounded-lg p-4 border border-gray-700"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-white font-semibold text-sm">{sector.sector}</p>
                        <p className="text-gray-400 text-xs">Exposição: {sector.exposure_percent}%</p>
                      </div>
                      <span
                        className="px-2 py-1 rounded text-xs font-medium text-white"
                        style={{ backgroundColor: getRiskColor(sector.risk_level) }}
                      >
                        {sector.risk_level?.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-300 text-xs">
                      Volatilidade: <span className="text-gray-400">{sector.volatility}</span> | 
                      Tendência: <span className="text-gray-400">{sector.trend}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Risk Factors */}
            {riskAnalysis.risk_factors?.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-white font-semibold text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  Fatores de Risco Identificados
                </h4>
                {riskAnalysis.risk_factors.map((factor, idx) => (
                  <Alert key={idx} className="bg-red-500/10 border-red-500/30">
                    <AlertDescription>
                      <p className="text-white font-semibold text-sm mb-1">{factor.factor}</p>
                      <p className="text-gray-300 text-xs mb-2">{factor.impact}</p>
                      <div className="flex gap-3 text-xs">
                        <span className="text-gray-400">
                          Probabilidade: <span className="text-red-400">{factor.probability}</span>
                        </span>
                        <span className="text-gray-400">
                          Mitigação: <span className="text-red-400">{factor.mitigation}</span>
                        </span>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            {/* Recommendations */}
            {riskAnalysis.recommendations?.length > 0 && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                <h4 className="text-emerald-400 font-semibold mb-3 text-sm">Recomendações</h4>
                <ul className="space-y-2">
                  {riskAnalysis.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-gray-300 text-sm flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      {rec}
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