import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Zap, TrendingUp, TrendingDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ScenarioSimulator({ userPortfolio, userEmail }) {
  const [scenarios, setScenarios] = useState(null);
  const [loading, setLoading] = useState(false);
  const [monthlyContribution, setMonthlyContribution] = useState("500");
  const [months, setMonths] = useState("24");

  const runSimulation = async () => {
    setLoading(true);
    try {
      const portfolioSummary = userPortfolio?.assets?.map(a => ({
        ticker: a.ticker,
        quantity: a.quantity,
        currentPrice: a.current_price || a.purchase_price
      })) || [];

      const prompt = `Como analista quantitativo, simule o desempenho futuro de uma carteira baseado em dados históricos da comunidade Aurum.

PORTFÓLIO ATUAL:
${portfolioSummary.map(a => `- ${a.ticker}: ${a.quantity} ações a R$ ${a.currentPrice}`).join('\n')}

PARÂMETROS:
- Aporte mensal: R$ ${monthlyContribution}
- Período: ${months} meses
- Histórico: dados da comunidade (últimos 2 anos)

Gere 3 cenários baseados em:
1. Volatilidade histórica (desvio padrão)
2. Correlação entre ativos
3. Padrões de mercado da comunidade
4. Ciclos econômicos

Para cada cenário, forneça:
- Projeção mês a mês
- Retorno esperado
- Drawdown máximo
- Probabilidade de ocorrência

Formato JSON com arrays de projeção mensal.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            optimistic: {
              type: "object",
              properties: {
                probability: { type: "number" },
                final_value: { type: "number" },
                total_return: { type: "number" },
                max_drawdown: { type: "number" },
                monthly_values: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      month: { type: "number" },
                      value: { type: "number" }
                    }
                  }
                }
              }
            },
            realistic: {
              type: "object",
              properties: {
                probability: { type: "number" },
                final_value: { type: "number" },
                total_return: { type: "number" },
                max_drawdown: { type: "number" },
                monthly_values: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      month: { type: "number" },
                      value: { type: "number" }
                    }
                  }
                }
              }
            },
            pessimistic: {
              type: "object",
              properties: {
                probability: { type: "number" },
                final_value: { type: "number" },
                total_return: { type: "number" },
                max_drawdown: { type: "number" },
                monthly_values: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      month: { type: "number" },
                      value: { type: "number" }
                    }
                  }
                }
              }
            }
          }
        }
      });

      setScenarios(response);
      toast.success("Simulação concluída!");
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

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-400" />
          Simulador de Cenários
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Inputs */}
        <div className="grid md:grid-cols-2 gap-4">
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
        </div>

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
              Executar Simulação
            </>
          )}
        </Button>

        {!scenarios && !loading && (
          <div className="text-center py-8 text-gray-400 text-sm">
            Configure os parâmetros e execute a simulação
          </div>
        )}

        {scenarios && (
          <>
            {/* Scenario Comparison */}
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { name: "Otimista", data: scenarios.optimistic, color: "emerald" },
                { name: "Realista", data: scenarios.realistic, color: "blue" },
                { name: "Pessimista", data: scenarios.pessimistic, color: "red" }
              ].map((scenario) => (
                <div
                  key={scenario.name}
                  className={`bg-${scenario.color}-500/10 border border-${scenario.color}-500/30 rounded-lg p-4`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className={`text-${scenario.color}-400 font-semibold text-sm`}>
                      {scenario.name}
                    </p>
                    <span className="text-xs text-gray-400">
                      {scenario.data.probability}%
                    </span>
                  </div>
                  <p className="text-white text-2xl font-bold mb-2">
                    R$ {scenario.data.final_value?.toLocaleString('pt-BR')}
                  </p>
                  <p className={`text-${scenario.color}-400 text-sm mb-1`}>
                    +{scenario.data.total_return?.toFixed(2)}%
                  </p>
                  <p className="text-gray-400 text-xs">
                    Drawdown: {scenario.data.max_drawdown?.toFixed(2)}%
                  </p>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="space-y-4">
              {scenarios.realistic?.monthly_values && (
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <h4 className="text-white font-semibold mb-4 text-sm">Projeção Realista</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart
                      data={scenarios.realistic.monthly_values}
                      margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#3b82f6"
                        isAnimationActive={false}
                        name="Valor da Carteira"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}