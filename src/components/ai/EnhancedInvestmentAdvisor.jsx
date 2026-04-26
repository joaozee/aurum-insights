import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  Loader2,
  TrendingUp,
  Target,
  AlertTriangle,
  BarChart3,
  DollarSign,
  Zap,
  CheckCircle,
  ArrowRight
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function EnhancedInvestmentAdvisor({ 
  riskProfile, 
  portfolio, 
  goals, 
  assets, 
  transactions,
  userEmail 
}) {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("budget");

  const generateEnhancedRecommendations = async () => {
    setLoading(true);
    try {
      // Calcular histórico de gastos/receitas
      const expensesData = transactions?.filter(t => t.type === "saida") || [];
      const incomeData = transactions?.filter(t => t.type === "entrada") || [];
      
      const expensesByCategory = expensesData.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + (t.amount || 0);
        return acc;
      }, {});

      const totalExpenses = expensesData.reduce((sum, t) => sum + (t.amount || 0), 0);
      const totalIncome = incomeData.reduce((sum, t) => sum + (t.amount || 0), 0);
      const avgMonthlyExpenses = totalExpenses / (Math.max(expensesData.length, 1) / 12);
      const avgMonthlyIncome = totalIncome / (Math.max(incomeData.length, 1) / 12);
      const surplus = avgMonthlyIncome - avgMonthlyExpenses;

      const expenseCategoriesStr = Object.entries(expensesByCategory)
        .map(([cat, val]) => `${cat}: R$ ${val.toLocaleString('pt-BR')}`)
        .join(', ');

      const goalsStr = goals?.map(g => `- ${g.title}: R$ ${g.target_amount?.toLocaleString('pt-BR')} até ${new Date(g.target_date).toLocaleDateString('pt-BR')} (Atual: R$ ${g.current_amount?.toLocaleString('pt-BR')})`).join('\n') || 'Nenhuma meta definida';
      
      const prompt = `Você é um consultor de finanças pessoais especializado em planejamento financeiro e otimização de orçamento. Analise a situação financeira do cliente e forneça recomendações práticas para melhorar sua saúde financeira.

**SITUAÇÃO FINANCEIRA ATUAL:**
- Renda Média Mensal: R$ ${avgMonthlyIncome.toLocaleString('pt-BR')}
- Despesas Médias: R$ ${avgMonthlyExpenses.toLocaleString('pt-BR')}
- Superávit Mensal: R$ ${surplus.toLocaleString('pt-BR')}
- Distribuição de Despesas: ${expenseCategoriesStr}

**METAS FINANCEIRAS:**
${goalsStr}

**TAREFA:**
Forneça uma análise completa de finanças pessoais com:
1. Análise detalhada dos gastos por categoria
2. Oportunidades de economia e redução de custos
3. Estratégia de alocação do superávit para metas
4. Plano de ação mensal com passos específicos
5. Dicas práticas para melhorar a saúde financeira
6. Riscos financeiros identificados e como mitigar
7. Projeção de progresso das metas com as recomendações

Foque em finanças pessoais, orçamento, economia de custos e planejamento financeiro. Forneça números específicos e realistas.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            analise_gastos: {
              type: "object",
              properties: {
                gastos_essenciais: { type: "number" },
                gastos_variaveis: { type: "number" },
                gastos_discricionarios: { type: "number" },
                percentual_economia_potencial: { type: "number" }
              }
            },
            oportunidades_economia: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  categoria: { type: "string" },
                  gasto_atual: { type: "number" },
                  potencial_reducao: { type: "string" },
                  acao: { type: "string" }
                }
              }
            },
            plano_alocacao_superavit: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  meta: { type: "string" },
                  alocacao_mensal: { type: "number" },
                  percentual: { type: "number" },
                  prazo_atingimento: { type: "string" }
                }
              }
            },
            plano_acao: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  periodo: { type: "string" },
                  acoes: { type: "array", items: { type: "string" } }
                }
              }
            },
            riscos_financeiros: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  risco: { type: "string" },
                  probabilidade: { type: "string" },
                  impacto: { type: "string" },
                  mitigacao: { type: "string" }
                }
              }
            },
            resumo_executivo: {
              type: "string"
            }
          }
        }
      });

      setRecommendations(response);
      toast.success("Análise de finanças pessoais gerada!");
    } catch (error) {
      toast.error("Erro ao gerar recomendações");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (severidade) => {
    const colors = {
      baixa: "green",
      media: "yellow",
      alta: "red"
    };
    return colors[severidade?.toLowerCase()] || "gray";
  };

  const generateProjectionChart = () => {
    if (!recommendations?.impacto_metas) return null;

    return recommendations.impacto_metas.map(meta => ({
      meta: meta.meta.substring(0, 10),
      atual: meta.tempo_atual_meses,
      comEstrategia: meta.tempo_com_estrategia_meses,
      economia: meta.tempo_atual_meses - meta.tempo_com_estrategia_meses
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-white">Consultor de Finanças Pessoais</CardTitle>
                <p className="text-gray-400 text-sm mt-1">Análise de orçamento e planejamento financeiro personalizado</p>
              </div>
            </div>
            <Button
              onClick={generateEnhancedRecommendations}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Gerar Análise
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {loading && (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 text-violet-400 animate-spin" />
              <p className="text-gray-400">Consultando dados de mercado e processando análise...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {!recommendations && !loading && (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <Sparkles className="h-12 w-12 text-violet-400/50" />
              <p className="text-gray-300 font-medium">Clique em "Gerar Análise" para receber recomendações personalizadas</p>
              <p className="text-gray-500 text-sm">Análise completa: alocação, ativos específicos, impacto nas metas e estratégia de entrada</p>
            </div>
          </CardContent>
        </Card>
      )}

      {recommendations && (
        <>
          {/* Tabs */}
          <div className="flex gap-2">
            {[
              { id: "budget", label: "Orçamento", icon: BarChart3 },
              { id: "opportunities", label: "Oportunidades", icon: TrendingUp },
              { id: "plan", label: "Plano de Ação", icon: Target },
              { id: "risks", label: "Riscos", icon: AlertTriangle }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
                    activeTab === tab.id
                      ? "bg-emerald-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Budget Tab */}
          {activeTab === "budget" && (
            <div className="space-y-6">
              {/* Análise de Gastos */}
              {recommendations.analise_gastos && (
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-emerald-400" />
                      Análise de Gastos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: "Essenciais", value: recommendations.analise_gastos.gastos_essenciais, color: "blue" },
                        { label: "Variáveis", value: recommendations.analise_gastos.gastos_variaveis, color: "amber" },
                        { label: "Discricionários", value: recommendations.analise_gastos.gastos_discricionarios, color: "purple" },
                        { label: "Economia Potencial", value: recommendations.analise_gastos.percentual_economia_potencial + "%", color: "emerald" }
                      ].map((item, idx) => (
                        <div key={idx} className="bg-gray-800 rounded-lg p-4 text-center">
                          <p className="text-gray-400 text-sm mb-2">{item.label}</p>
                          <p className={`text-2xl font-bold text-${item.color}-400`}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Oportunidades de Economia */}
              {recommendations.oportunidades_economia && (
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Zap className="h-5 w-5 text-amber-400" />
                      Oportunidades de Economia
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recommendations.oportunidades_economia.map((opp, idx) => (
                      <div key={idx} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="text-white font-semibold capitalize">{opp.categoria}</h4>
                            <p className="text-gray-400 text-sm">Gasto atual: R$ {opp.gasto_atual.toLocaleString('pt-BR')}</p>
                          </div>
                          <Badge className="bg-amber-500/20 text-amber-400">{opp.potencial_reducao}</Badge>
                        </div>
                        <p className="text-gray-300 text-sm">{opp.acao}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Resumo Executivo */}
              {recommendations.resumo_executivo && (
                <Card className="bg-emerald-500/10 border-emerald-500/30">
                  <CardHeader>
                    <CardTitle className="text-emerald-400">Resumo da Análise</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 text-sm leading-relaxed">{recommendations.resumo_executivo}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Opportunities Tab */}
          {activeTab === "opportunities" && (
            <div className="space-y-4">
              {recommendations.oportunidades_economia && recommendations.oportunidades_economia.map((opp, idx) => (
                <Card key={idx} className="bg-gray-900 border-gray-800">
                  <CardContent className="pt-6">
                    <h4 className="text-white font-semibold capitalize mb-2">{opp.categoria}</h4>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div className="bg-gray-800/50 rounded p-3">
                        <p className="text-gray-400 text-xs mb-1">Gasto Atual</p>
                        <p className="text-white font-bold">R$ {opp.gasto_atual.toLocaleString('pt-BR')}</p>
                      </div>
                      <div className="bg-emerald-500/10 rounded p-3 border border-emerald-500/30">
                        <p className="text-emerald-400 text-xs mb-1">Potencial Redução</p>
                        <p className="text-emerald-400 font-bold">{opp.potencial_reducao}</p>
                      </div>
                    </div>
                    <p className="text-gray-300 text-sm">{opp.acao}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Plan Tab */}
          {activeTab === "plan" && (
            <div className="space-y-4">
              {recommendations.plano_alocacao_superavit && (
                <>
                  <Card className="bg-blue-500/10 border-blue-500/30">
                    <CardHeader>
                      <CardTitle className="text-blue-400 flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Alocação do Superávit Mensal
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {recommendations.plano_alocacao_superavit.map((item, idx) => (
                        <div key={idx} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-white font-semibold">{item.meta}</h4>
                            <Badge className="bg-blue-500/20 text-blue-400">{item.percentual}%</Badge>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${item.percentual}%` }} />
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">R$ {item.alocacao_mensal.toLocaleString('pt-BR')} mensais</span>
                            <span className="text-blue-400 font-medium">{item.prazo_atingimento}</span>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </>
              )}

              {recommendations.plano_acao && (
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Target className="h-5 w-5 text-emerald-400" />
                      Plano de Ação
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recommendations.plano_acao.map((phase, idx) => (
                      <div key={idx} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                        <h4 className="text-white font-semibold mb-3 text-emerald-400">{phase.periodo}</h4>
                        <ul className="space-y-2">
                          {phase.acoes.map((acao, i) => (
                            <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                              <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                              {acao}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Risks Tab */}
          {activeTab === "risks" && recommendations.riscos_financeiros && (
            <div className="space-y-4">
              {recommendations.riscos_financeiros.map((item, idx) => (
                <Card
                  key={idx}
                  className={cn(
                    "bg-gray-900 border",
                    item.impacto?.toLowerCase().includes("alto") ? "border-red-500/30" :
                    item.impacto?.toLowerCase().includes("médio") ? "border-yellow-500/30" :
                    "border-green-500/30"
                  )}
                >
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex items-start justify-between">
                      <h4 className="text-white font-semibold">{item.risco}</h4>
                      <div className="flex gap-2">
                        <Badge className={cn(
                          "capitalize",
                          item.probabilidade?.toLowerCase().includes("alta") ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"
                        )}>
                          {item.probabilidade}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-gray-800/50 rounded p-2">
                        <p className="text-gray-400 text-xs mb-1">Probabilidade</p>
                        <p className="text-white text-sm font-semibold">{item.probabilidade}</p>
                      </div>
                      <div className="bg-gray-800/50 rounded p-2">
                        <p className="text-gray-400 text-xs mb-1">Impacto</p>
                        <p className="text-white text-sm font-semibold">{item.impacto}</p>
                      </div>
                    </div>
                    <div className="bg-gray-800/50 rounded p-3 border border-gray-700">
                      <p className="text-gray-400 text-sm font-semibold mb-1">Estratégia de Mitigação:</p>
                      <p className="text-gray-300 text-sm">{item.mitigacao}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}