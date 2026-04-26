import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Zap, TrendingUp, TrendingDown, AlertTriangle, BarChart3 } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function EnhancedScenarioSimulator({ userPortfolio, userEmail }) {
  const [scenarios, setScenarios] = useState(null);
  const [stressTest, setStressTest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("cenarios");
  const [monthlyContribution, setMonthlyContribution] = useState("500");
  const [months, setMonths] = useState("24");
  const [selectedStressScenario, setSelectedStressScenario] = useState("recession");
  const [rebalanceFrequency, setRebalanceFrequency] = useState("never");
  const [benchmarkData, setBenchmarkData] = useState(null);

  const stressScenarios = {
    recession: { label: "Recessão Econômica", icon: "📉", description: "Queda de 30% no mercado" },
    inflation: { label: "Inflação Alta", icon: "📈", description: "Inflação de 10% a.a." },
    crisis: { label: "Crise de Mercado", icon: "⚠️", description: "Crash de 50% + volatilidade" },
    rates: { label: "Alta de Juros", icon: "💰", description: "SELIC sobe para 15%" }
  };

  const runSimulation = async () => {
    setLoading(true);
    try {
      const portfolioSummary = userPortfolio?.assets?.map(a => ({
        ticker: a.name,
        type: a.type,
        quantity: a.quantity,
        currentPrice: a.current_price || a.purchase_price
      })) || [];

      const prompt = `Como analista quantitativo, simule múltiplos cenários de desempenho de carteira.

PORTFÓLIO ATUAL:
${portfolioSummary.map(a => `- ${a.ticker} (${a.type}): ${a.quantity} unidades a R$ ${a.currentPrice}`).join('\n')}

PARÂMETROS DE SIMULAÇÃO:
- Aporte mensal: R$ ${monthlyContribution}
- Período: ${months} meses
- Rebalanceamento: ${rebalanceFrequency === 'never' ? 'Não' : rebalanceFrequency === 'monthly' ? 'Mensal' : 'Trimestral'}
- Incluir benchmarks: Ibovespa, CDI, S&P500

Gere:
1. Cenários Base (Otimista, Realista, Pessimista) com projeções mensais
2. Stress Tests por tipo de cenário macroeconômico
3. Comparativo com benchmarks
4. Impacto do rebalanceamento

Para cada cenário, forneça:
- Projeção mês a mês
- Retorno esperado (%)
- Drawdown máximo (%)
- Volatilidade (%)
- Sharpe Ratio

Formato JSON estruturado.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            cenarios_base: {
              type: "object",
              properties: {
                otimista: {
                  type: "object",
                  properties: {
                    probability: { type: "number" },
                    final_value: { type: "number" },
                    total_return: { type: "number" },
                    max_drawdown: { type: "number" },
                    volatility: { type: "number" },
                    sharpe_ratio: { type: "number" },
                    monthly_values: { type: "array", items: { type: "object" } }
                  }
                },
                realista: {
                  type: "object",
                  properties: {
                    probability: { type: "number" },
                    final_value: { type: "number" },
                    total_return: { type: "number" },
                    max_drawdown: { type: "number" },
                    volatility: { type: "number" },
                    sharpe_ratio: { type: "number" },
                    monthly_values: { type: "array", items: { type: "object" } }
                  }
                },
                pessimista: {
                  type: "object",
                  properties: {
                    probability: { type: "number" },
                    final_value: { type: "number" },
                    total_return: { type: "number" },
                    max_drawdown: { type: "number" },
                    volatility: { type: "number" },
                    sharpe_ratio: { type: "number" },
                    monthly_values: { type: "array", items: { type: "object" } }
                  }
                }
              }
            },
            stress_tests: {
              type: "object",
              properties: {
                recession: { type: "object" },
                inflation: { type: "object" },
                crisis: { type: "object" },
                rates: { type: "object" }
              }
            },
            benchmarks: {
              type: "object",
              properties: {
                ibovespa: { type: "array", items: { type: "object" } },
                cdi: { type: "array", items: { type: "object" } },
                sp500: { type: "array", items: { type: "object" } }
              }
            },
            rebalance_impact: {
              type: "object",
              properties: {
                com_rebalance: { type: "number" },
                sem_rebalance: { type: "number" },
                ganho_adicional: { type: "number" }
              }
            }
          }
        }
      });

      setScenarios(response.cenarios_base);
      setStressTest(response.stress_tests);
      setBenchmarkData(response.benchmarks);
      toast.success("Simulação completa com stress tests!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao executar simulação");
    } finally {
      setLoading(false);
    }
  };

  const currentPortfolioValue = userPortfolio?.assets?.reduce(
    (sum, a) => sum + a.quantity * (a.current_price || a.purchase_price),
    0
  ) || 0;

  const ScenarioCard = ({ name, data, color }) => (
    <div className={`bg-${color}-500/10 border border-${color}-500/30 rounded-lg p-4`}>
      <p className={`text-${color}-400 font-semibold text-sm mb-2`}>{name}</p>
      <div className="space-y-2">
        <div>
          <p className="text-gray-400 text-xs">Valor Final</p>
          <p className="text-white text-xl font-bold">
            R$ {data?.final_value?.toLocaleString('pt-BR')}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-gray-400 text-xs">Retorno</p>
            <p className={`text-${color}-400 font-semibold`}>+{data?.total_return?.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">Volatilidade</p>
            <p className="text-gray-300 font-semibold">{data?.volatility?.toFixed(1)}%</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-gray-400 text-xs">Max Drawdown</p>
            <p className="text-red-400 font-semibold">{data?.max_drawdown?.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">Sharpe Ratio</p>
            <p className="text-blue-400 font-semibold">{data?.sharpe_ratio?.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-400" />
          Simulador Avançado de Cenários
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Inputs */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Aporte Mensal (R$)</label>
            <Input
              type="number"
              value={monthlyContribution}
              onChange={(e) => setMonthlyContribution(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Período (meses)</label>
            <Input
              type="number"
              value={months}
              onChange={(e) => setMonths(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white"
              disabled={loading}
              max="36"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Rebalanceamento</label>
            <select
              value={rebalanceFrequency}
              onChange={(e) => setRebalanceFrequency(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white text-sm"
              disabled={loading}
            >
              <option value="never">Nunca</option>
              <option value="monthly">Mensal</option>
              <option value="quarterly">Trimestral</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button
              onClick={runSimulation}
              disabled={loading}
              className="w-full bg-amber-600 hover:bg-amber-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Simulando...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Executar
                </>
              )}
            </Button>
          </div>
        </div>

        {!scenarios && !loading && (
          <div className="text-center py-12 text-gray-400 text-sm">
            Configure os parâmetros e execute a simulação para ver cenários
          </div>
        )}

        {scenarios && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-gray-800">
              <TabsTrigger value="cenarios">Cenários</TabsTrigger>
              <TabsTrigger value="stress">Stress Tests</TabsTrigger>
              <TabsTrigger value="benchmark">Benchmarks</TabsTrigger>
            </TabsList>

            {/* Cenários Base */}
            <TabsContent value="cenarios" className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                <ScenarioCard name="Otimista" data={scenarios.otimista} color="emerald" />
                <ScenarioCard name="Realista" data={scenarios.realista} color="blue" />
                <ScenarioCard name="Pessimista" data={scenarios.pessimista} color="red" />
              </div>

              {scenarios.realista?.monthly_values && (
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <h4 className="text-white font-semibold mb-4">Projeção de Valor (Cenário Realista)</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={scenarios.realista.monthly_values}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#3b82f6"
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </TabsContent>

            {/* Stress Tests */}
            <TabsContent value="stress" className="space-y-6">
              <div className="space-y-4">
                {Object.entries(stressScenarios).map(([key, scenario]) => {
                  const test = stressTest?.[key];
                  return (
                    <div
                      key={key}
                      className="bg-gray-800/50 rounded-lg p-4 border border-gray-700"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl">{scenario.icon}</span>
                            <h4 className="text-white font-semibold">{scenario.label}</h4>
                          </div>
                          <p className="text-gray-400 text-sm">{scenario.description}</p>
                        </div>
                      </div>

                      {test && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-gray-900/50 rounded p-3">
                            <p className="text-gray-400 text-xs mb-1">Retorno</p>
                            <p className={test.total_return >= 0 ? "text-emerald-400" : "text-red-400"}>
                              {test.total_return?.toFixed(1)}%
                            </p>
                          </div>
                          <div className="bg-gray-900/50 rounded p-3">
                            <p className="text-gray-400 text-xs mb-1">Valor Final</p>
                            <p className="text-white font-semibold">R$ {test.final_value?.toLocaleString('pt-BR')}</p>
                          </div>
                          <div className="bg-gray-900/50 rounded p-3">
                            <p className="text-gray-400 text-xs mb-1">Max Drawdown</p>
                            <p className="text-red-400">{test.max_drawdown?.toFixed(1)}%</p>
                          </div>
                          <div className="bg-gray-900/50 rounded p-3">
                            <p className="text-gray-400 text-xs mb-1">Volatilidade</p>
                            <p className="text-yellow-400">{test.volatility?.toFixed(1)}%</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            {/* Benchmarks */}
            <TabsContent value="benchmark" className="space-y-6">
              {benchmarkData?.ibovespa && (
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <h4 className="text-white font-semibold mb-4">Comparativo: Carteira vs Benchmarks</h4>
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={benchmarkData.ibovespa}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                      <Legend />
                      <Line type="monotone" dataKey="carteira" stroke="#8b5cf6" name="Sua Carteira" />
                      <Line type="monotone" dataKey="ibovespa" stroke="#f59e0b" name="Ibovespa" />
                      <Line type="monotone" dataKey="cdi" stroke="#10b981" name="CDI" />
                      {benchmarkData.sp500 && (
                        <Line type="monotone" dataKey="sp500" stroke="#3b82f6" name="S&P 500" />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-violet-500/10 border border-violet-500/30 rounded-lg p-4">
                  <p className="text-violet-400 font-semibold mb-3">Ganho com Rebalanceamento</p>
                  <p className="text-white text-2xl font-bold">
                    {Math.abs((stressTest?.rebalance_impact?.ganho_adicional || 0)).toFixed(2)}%
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    Rebalanceamento {rebalanceFrequency === 'never' ? 'não configurado' : 'pode otimizar retornos'}
                  </p>
                </div>

                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                  <p className="text-emerald-400 font-semibold mb-3">Outperformance vs Ibovespa</p>
                  <p className="text-white text-2xl font-bold">
                    {((scenarios.realista?.total_return || 0) - 8).toFixed(2)}%
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    Considerando rendimento histórico do Ibovespa ~8% a.a.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}