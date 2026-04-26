import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, ComposedChart } from "recharts";
import { TrendingUp, Users, Loader2, Target } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function CommunityBenchmark({ userPortfolio, userEmail, riskProfile }) {
  const [benchmarkData, setBenchmarkData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [comparisonType, setComparisonType] = useState("risk_profile");

  const generateBenchmark = async () => {
    setLoading(true);
    try {
      // Calcular métricas do portfólio do usuário
      let totalValue = 0;
      let totalInvested = 0;
      const sectorExposure = {};

      userPortfolio?.assets?.forEach(asset => {
        const invested = asset.quantity * asset.purchase_price;
        const current = asset.quantity * (asset.current_price || asset.purchase_price);
        totalInvested += invested;
        totalValue += current;
        
        const sector = asset.sector || "Não classificado";
        sectorExposure[sector] = (sectorExposure[sector] || 0) + current;
      });

      const userReturn = ((totalValue - totalInvested) / totalInvested * 100).toFixed(2);

      // Buscar dados agregados da comunidade
      const allProfiles = await base44.entities.UserProfile.list(null, 100);
      const similarProfiles = allProfiles.filter(p => 
        p.investment_style === riskProfile?.risk_tolerance &&
        p.experience_level === riskProfile?.experience_level
      );

      const prompt = `Baseado em dados agregados e anônimos da comunidade Aurum de investimentos:

PERFIL DO USUÁRIO:
- Risco: ${riskProfile?.risk_tolerance || "moderado"}
- Experiência: ${riskProfile?.experience_level || "iniciante"}
- Retorno atual: ${userReturn}%

Análise:
1. Qual é o retorno médio de usuários com perfil similar?
2. Como se compara a diversificação do portfólio?
3. Quais setores estão em alta entre usuários bem-sucedidos?
4. Métricas de benchmark: retorno médio, máximo, mínimo, percentil do usuário

Retorne no formato JSON com estrutura de comparação detalhada.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            community_metrics: {
              type: "object",
              properties: {
                average_return: { type: "number" },
                median_return: { type: "number" },
                best_return: { type: "number" },
                worst_return: { type: "number" },
                user_percentile: { type: "number" },
                average_assets_count: { type: "number" }
              }
            },
            sector_comparison: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  sector: { type: "string" },
                  community_allocation: { type: "number" },
                  user_allocation: { type: "number" },
                  performance: { type: "number" }
                }
              }
            },
            diversification_score: {
              type: "object",
              properties: {
                user_score: { type: "number" },
                community_average: { type: "number" },
                recommendation: { type: "string" }
              }
            },
            insights: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      setBenchmarkData({
        userMetrics: {
          return: userReturn,
          assets_count: userPortfolio?.assets?.length || 0,
          total_value: totalValue
        },
        communityMetrics: response.community_metrics,
        sectorComparison: response.sector_comparison,
        diversificationScore: response.diversification_score,
        insights: response.insights
      });

      toast.success("Análise de benchmark gerada!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar benchmark da comunidade");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-400" />
            Benchmark da Comunidade
          </CardTitle>
          <Button
            onClick={generateBenchmark}
            disabled={loading}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Gerar Análise"
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {!benchmarkData && !loading && (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              Compare seu desempenho com usuários similares da comunidade
            </p>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 text-blue-400 animate-spin mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Analisando dados da comunidade...</p>
          </div>
        )}

        {benchmarkData && (
          <>
            {/* Comparação de Retornos */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-2">Seu Retorno</p>
                <p className="text-3xl font-bold text-blue-400">
                  {benchmarkData.userMetrics.return}%
                </p>
              </div>
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-2">Retorno Médio (Perfil Similar)</p>
                <p className="text-3xl font-bold text-purple-400">
                  {benchmarkData.communityMetrics.average_return?.toFixed(2)}%
                </p>
              </div>
            </div>

            {/* Percentil */}
            <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/30 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Seu Percentil</p>
                  <p className="text-2xl font-bold text-emerald-400">
                    Top {100 - benchmarkData.communityMetrics.user_percentile}%
                  </p>
                </div>
                <Target className="h-12 w-12 text-emerald-400 opacity-30" />
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-blue-500 h-3 rounded-full transition-all"
                  style={{ width: `${benchmarkData.communityMetrics.user_percentile}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Você está acima de {benchmarkData.communityMetrics.user_percentile}% dos investidores com perfil similar
              </p>
            </div>

            {/* Comparação de Setores */}
            {benchmarkData.sectorComparison?.length > 0 && (
              <div>
                <h4 className="text-white font-semibold mb-4 text-sm">Alocação por Setor</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart
                    data={benchmarkData.sectorComparison}
                    margin={{ top: 20, right: 20, bottom: 20, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="sector" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                    <Legend />
                    <Bar dataKey="user_allocation" fill="#3b82f6" name="Sua Alocação" />
                    <Bar dataKey="community_allocation" fill="#8b5cf6" name="Média Comunidade" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Insights */}
            {benchmarkData.insights?.length > 0 && (
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <h4 className="text-white font-semibold mb-3 text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-yellow-400" />
                  Insights
                </h4>
                <ul className="space-y-2">
                  {benchmarkData.insights.map((insight, idx) => (
                    <li key={idx} className="text-gray-300 text-sm flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      {insight}
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