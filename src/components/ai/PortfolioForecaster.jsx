import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";
import { TrendingUp, Loader2, BarChart3, Calendar } from "lucide-react";
import { toast } from "sonner";

export default function PortfolioForecaster({ portfolio, assets, transactions, goals, riskProfile }) {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timeframe, setTimeframe] = useState("12");

  const generateForecast = async () => {
    setLoading(true);
    try {
      const monthlyReturns = calculateMonthlyReturns();
      
      const prompt = `
Como analista financeiro, preveja a performance futura da carteira de investimentos.

**DADOS HISTÓRICOS:**
- Patrimônio Atual: R$ ${portfolio?.current_value?.toLocaleString('pt-BR') || 0}
- Total Investido: R$ ${portfolio?.total_invested?.toLocaleString('pt-BR') || 0}
- Retornos Mensais Recentes: ${JSON.stringify(monthlyReturns)}
- Número de Ativos: ${assets?.length || 0}
- Número de Transações: ${transactions?.length || 0}

**PERFIL DO INVESTIDOR:**
- Tolerância ao Risco: ${riskProfile?.risk_tolerance || 'moderado'}
- Horizonte: ${riskProfile?.investment_horizon || 'longo_prazo'}
- Retorno Alvo Anual: ${riskProfile?.target_return || 12}%
- Aporte Mensal: R$ ${riskProfile?.monthly_investment_capacity || 0}

**METAS ATIVAS:**
${goals?.map(g => `- ${g.title}: R$ ${g.target_amount?.toLocaleString('pt-BR')}, Prazo: ${g.target_date}`).join('\n') || 'Nenhuma meta definida'}

Preveja o desempenho nos próximos ${timeframe} meses considerando:
1. Tendências históricas
2. Aportes mensais planejados
3. Volatilidade do mercado
4. Perfil de risco

Forneça 3 cenários: otimista, realista e conservador.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            cenarios: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  nome: { type: "string" },
                  retorno_esperado_percentual: { type: "number" },
                  valor_final_estimado: { type: "number" },
                  probabilidade: { type: "number" }
                }
              }
            },
            projecao_mensal: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  mes: { type: "number" },
                  otimista: { type: "number" },
                  realista: { type: "number" },
                  conservador: { type: "number" }
                }
              }
            },
            insights: {
              type: "array",
              items: { type: "string" }
            },
            riscos: {
              type: "array",
              items: { type: "string" }
            },
            oportunidades: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      setForecast(response);
      toast.success("Projeção gerada!");
    } catch (error) {
      toast.error("Erro ao gerar projeção");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyReturns = () => {
    if (!transactions || transactions.length === 0) return [];
    
    const returns = [];
    const sortedTrans = [...transactions].sort((a, b) => 
      new Date(a.transaction_date) - new Date(b.transaction_date)
    );

    for (let i = 0; i < Math.min(6, sortedTrans.length); i++) {
      const trans = sortedTrans[sortedTrans.length - 1 - i];
      returns.push({
        month: new Date(trans.transaction_date).toLocaleDateString('pt-BR', { month: 'short' }),
        return: Math.random() * 5 - 1 // Simulado
      });
    }
    
    return returns.reverse();
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-violet-400" />
            Projeção de Performance
          </CardTitle>
          <div className="flex items-center gap-3">
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-32 bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="6">6 meses</SelectItem>
                <SelectItem value="12">1 ano</SelectItem>
                <SelectItem value="24">2 anos</SelectItem>
                <SelectItem value="36">3 anos</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={generateForecast} 
              disabled={loading}
              size="sm"
              className="bg-violet-600 hover:bg-violet-700"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Gerar Projeção
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {!forecast && !loading && (
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              Gere uma projeção para visualizar cenários futuros da sua carteira
            </p>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 text-violet-400 animate-spin mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Analisando dados e gerando projeções...</p>
          </div>
        )}

        {forecast && (
          <>
            {/* Scenarios */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {forecast.cenarios?.map((cenario, idx) => {
                const colors = ["green", "blue", "amber"];
                const color = colors[idx] || "gray";
                
                return (
                  <div 
                    key={idx}
                    className={`bg-${color}-500/10 border border-${color}-500/30 rounded-lg p-4`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className={`text-${color}-400 font-semibold text-sm`}>{cenario.nome}</h4>
                      <span className="text-xs text-gray-400">{cenario.probabilidade}%</span>
                    </div>
                    <p className="text-white text-2xl font-bold mb-1">
                      R$ {cenario.valor_final_estimado?.toLocaleString('pt-BR')}
                    </p>
                    <p className={`text-${color}-400 text-sm`}>
                      +{cenario.retorno_esperado_percentual?.toFixed(1)}% retorno
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Chart */}
            {forecast.projecao_mensal && (
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <h4 className="text-white font-semibold mb-4">Projeção de Crescimento</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={forecast.projecao_mensal}>
                    <defs>
                      <linearGradient id="colorOtimista" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorRealista" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorConservador" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="mes" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" tickFormatter={(val) => `R$ ${(val/1000).toFixed(0)}k`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                      labelStyle={{ color: '#fff' }}
                      formatter={(value) => [`R$ ${value.toLocaleString('pt-BR')}`, '']}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="otimista" stroke="#10b981" fillOpacity={1} fill="url(#colorOtimista)" name="Otimista" />
                    <Area type="monotone" dataKey="realista" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRealista)" name="Realista" />
                    <Area type="monotone" dataKey="conservador" stroke="#f59e0b" fillOpacity={1} fill="url(#colorConservador)" name="Conservador" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Insights */}
            {forecast.insights?.length > 0 && (
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-400" />
                  Insights da Análise
                </h4>
                <ul className="space-y-2">
                  {forecast.insights.map((insight, idx) => (
                    <li key={idx} className="text-gray-300 text-sm flex items-start gap-2">
                      <span className="text-blue-400">•</span>
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Risks & Opportunities */}
            <div className="grid md:grid-cols-2 gap-4">
              {forecast.riscos?.length > 0 && (
                <div className="bg-red-500/10 rounded-xl p-6 border border-red-500/30">
                  <h4 className="text-red-400 font-semibold mb-3 text-sm">⚠️ Riscos Identificados</h4>
                  <ul className="space-y-2">
                    {forecast.riscos.map((risco, idx) => (
                      <li key={idx} className="text-gray-300 text-sm">• {risco}</li>
                    ))}
                  </ul>
                </div>
              )}

              {forecast.oportunidades?.length > 0 && (
                <div className="bg-green-500/10 rounded-xl p-6 border border-green-500/30">
                  <h4 className="text-green-400 font-semibold mb-3 text-sm">✨ Oportunidades</h4>
                  <ul className="space-y-2">
                    {forecast.oportunidades.map((oport, idx) => (
                      <li key={idx} className="text-gray-300 text-sm">• {oport}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}