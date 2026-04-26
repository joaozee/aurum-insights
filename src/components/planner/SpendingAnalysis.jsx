import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingDown, Loader2, AlertTriangle, Target } from "lucide-react";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { toast } from "sonner";

const COLORS = ["#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#3B82F6", "#EF4444", "#6366F1", "#14B8A6"];

const CATEGORY_LABELS = {
  salario: "Salário",
  pix_recebido: "PIX Recebido",
  bonus: "Bônus",
  aluguel: "Aluguel",
  alimentacao: "Alimentação",
  lazer: "Lazer",
  cartao_credito: "Cartão Crédito",
  assinaturas: "Assinaturas",
  transporte: "Transporte",
  saude: "Saúde",
  outros: "Outros"
};

export default function SpendingAnalysis({ userEmail, goals }) {
  const [transactions, setTransactions] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    loadTransactions();
  }, [userEmail]);

  const loadTransactions = async () => {
    try {
      if (userEmail) {
        const data = await base44.entities.FinanceTransaction.filter({
          user_email: userEmail
        });
        setTransactions(data);
      }
    } catch (error) {
      console.error("Erro ao carregar transações:", error);
    }
  };

  const analyzeSpending = async () => {
    setLoading(true);
    try {
      // Calcular gastos por categoria
      const expenses = transactions.filter(t => t.type === "saida");
      const income = transactions.filter(t => t.type === "entrada");

      const expensesByCategory = expenses.reduce((acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
        return acc;
      }, {});

      const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const totalIncome = income.reduce((sum, inc) => sum + inc.amount, 0);

      // Preparar dados para gráfico
      const chartDataFormatted = Object.entries(expensesByCategory).map(([category, amount]) => ({
        name: CATEGORY_LABELS[category] || category,
        value: parseFloat(amount.toFixed(2)),
        percentage: ((amount / totalExpenses) * 100).toFixed(1)
      })).sort((a, b) => b.value - a.value);

      setChartData(chartDataFormatted);

      // Gerar análise com IA
      const prompt = `Analise detalhadamente o perfil de gastos financeiros desta pessoa como um consultor de finanças pessoais.

**RESUMO FINANCEIRO:**
- Renda Total: R$ ${totalIncome.toLocaleString('pt-BR')}
- Gastos Totais: R$ ${totalExpenses.toLocaleString('pt-BR')}
- Saldo: R$ ${(totalIncome - totalExpenses).toLocaleString('pt-BR')}
- Taxa de Poupança: ${((totalIncome - totalExpenses) / totalIncome * 100).toFixed(1)}%

**DISTRIBUIÇÃO DE GASTOS:**
${chartDataFormatted.map(cat => `- ${cat.name}: R$ ${cat.value.toLocaleString('pt-BR')} (${cat.percentage}%)`).join('\n')}

**METAS FINANCEIRAS:**
${goals?.map(g => `- ${g.title}: R$ ${g.target_amount.toLocaleString('pt-BR')} (prazo: ${g.target_date})`).join('\n')}

Forneça uma análise prática focada em:
1. Identificar os maiores gastos e sua relevância
2. Comparar com benchmarks de finanças pessoais
3. Sugerir ajustes realistas para melhorar a taxa de poupança
4. Recomendações específicas para atingir as metas`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            resumo_executivo: { type: "string" },
            principais_gastos: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  categoria: { type: "string" },
                  montante: { type: "number" },
                  observacao: { type: "string" }
                }
              }
            },
            oportunidades_economia: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  area: { type: "string" },
                  economia_potencial: { type: "number" },
                  acao: { type: "string" }
                }
              }
            },
            recomendacoes: {
              type: "array",
              items: { type: "string" }
            },
            projecao_metas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  meta: { type: "string" },
                  tempo_estimado: { type: "string" },
                  aporte_necessario: { type: "number" }
                }
              }
            }
          }
        }
      });

      setAnalysis({
        ...response,
        totalExpenses,
        totalIncome,
        balance: totalIncome - totalExpenses
      });
      toast.success("Análise de gastos gerada!");
    } catch (error) {
      toast.error("Erro ao gerar análise");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Generate Button */}
      <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-emerald-400" />
              <div>
                <h3 className="text-white font-semibold">Análise de Gastos com IA</h3>
                <p className="text-gray-400 text-sm">Entenda seus padrões de gastos e otimize seu orçamento</p>
              </div>
            </div>
            <Button 
              onClick={analyzeSpending} 
              disabled={loading || transactions.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <TrendingDown className="h-4 w-4 mr-2" />}
              {loading ? 'Analisando...' : 'Analisar Gastos'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Spending Breakdown Chart */}
      {chartData.length > 0 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-emerald-400" />
              Distribuição de Gastos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} ${percentage}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`}
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Category Breakdown Table */}
            <div className="mt-6 space-y-2">
              {chartData.map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between bg-gray-800/50 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="h-3 w-3 rounded-full" 
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <span className="text-gray-300">{cat.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">R$ {cat.value.toLocaleString('pt-BR')}</p>
                    <p className="text-gray-400 text-xs">{cat.percentage}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Resumo Executivo */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-400" />
                Resumo da Análise
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 leading-relaxed">{analysis.resumo_executivo}</p>
              
              {/* Financial Summary Cards */}
              <div className="grid md:grid-cols-3 gap-4 mt-6">
                <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-lg p-4 border border-emerald-500/30">
                  <p className="text-gray-400 text-xs mb-1">Renda Total</p>
                  <p className="text-emerald-400 text-xl font-bold">
                    R$ {analysis.totalIncome.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-red-500/10 to-pink-500/10 rounded-lg p-4 border border-red-500/30">
                  <p className="text-gray-400 text-xs mb-1">Gastos Totais</p>
                  <p className="text-red-400 text-xl font-bold">
                    R$ {analysis.totalExpenses.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className={`rounded-lg p-4 border ${analysis.balance >= 0 ? 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30' : 'bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border-orange-500/30'}`}>
                  <p className="text-gray-400 text-xs mb-1">Saldo</p>
                  <p className={`text-xl font-bold ${analysis.balance >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>
                    R$ {analysis.balance.toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Oportunidades de Economia */}
          {analysis.oportunidades_economia?.length > 0 && (
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-amber-400" />
                  Oportunidades de Economia
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.oportunidades_economia.map((opp, idx) => (
                  <div key={idx} className="bg-amber-500/10 rounded-lg p-4 border border-amber-500/20">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-white font-semibold">{opp.area}</h4>
                      <span className="text-amber-400 font-bold text-sm">R$ {opp.economia_potencial?.toLocaleString('pt-BR')}</span>
                    </div>
                    <p className="text-gray-300 text-sm">{opp.acao}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Recomendações */}
          {analysis.recomendacoes?.length > 0 && (
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Recomendações Práticas</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {analysis.recomendacoes.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-gray-300 text-sm">
                      <span className="flex items-center justify-center h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold flex-shrink-0 mt-0.5">
                        ✓
                      </span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Projeção de Metas */}
          {analysis.projecao_metas?.length > 0 && (
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-400" />
                  Projeção para Suas Metas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.projecao_metas.map((proj, idx) => (
                  <div key={idx} className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="text-white font-semibold text-sm">{proj.meta}</h4>
                      <span className="text-blue-400 text-xs font-semibold">{proj.tempo_estimado}</span>
                    </div>
                    <p className="text-gray-400 text-xs">Aporte necessário: <span className="text-blue-400 font-semibold">R$ {proj.aporte_necessario?.toLocaleString('pt-BR')}/mês</span></p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {transactions.length === 0 && !analysis && (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-12 text-center">
            <AlertTriangle className="h-8 w-8 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400">Nenhuma transação registrada ainda.</p>
            <p className="text-gray-500 text-sm">Comece a adicionar suas transações para receber uma análise detalhada.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}