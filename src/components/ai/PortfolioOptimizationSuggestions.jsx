import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, TrendingUp, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function PortfolioOptimizationSuggestions({ assets, goals, riskProfile, userEmail }) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);

  const generateSuggestions = async () => {
    if (!assets || Object.keys(assets).length === 0) {
      toast.error("Adicione ativos à carteira primeiro");
      return;
    }

    setLoading(true);
    try {
      const portfolioData = Object.entries(assets).map(([ticker, asset]) => ({
        ticker,
        quantity: asset.quantity,
        purchase_price: asset.purchase_price,
        current_price: asset.current_price,
        value: asset.quantity * (asset.current_price || asset.purchase_price),
        percentage: 0
      }));

      const totalValue = portfolioData.reduce((sum, a) => sum + a.value, 0);
      portfolioData.forEach(a => a.percentage = ((a.value / totalValue) * 100).toFixed(1));

      const goalsInfo = goals.map(g => ({
        title: g.title,
        target_amount: g.target_amount,
        current_amount: g.current_amount,
        target_date: g.target_date,
        category: g.category
      }));

      const prompt = `
Você é um consultor financeiro especializado em otimização de carteiras de investimentos brasileiras.

**CARTEIRA ATUAL:**
${portfolioData.map(a => `- ${a.ticker}: ${a.percentage}% (R$ ${a.value.toFixed(2)})`).join('\n')}

**VALOR TOTAL:** R$ ${totalValue.toFixed(2)}

**PERFIL DE RISCO:** ${riskProfile || "Moderado"}

**METAS FINANCEIRAS:**
${goalsInfo.length > 0 ? goalsInfo.map(g => `- ${g.title}: R$ ${g.target_amount} até ${new Date(g.target_date).toLocaleDateString('pt-BR')}`).join('\n') : "Nenhuma meta definida"}

**TAREFA:**
Analise a carteira e forneça recomendações de otimização considerando:
1. Diversificação setorial e de ativos
2. Perfil de risco do investidor
3. Metas financeiras e horizonte de tempo
4. Concentração excessiva em ativos
5. Balanceamento entre renda variável, FIIs e renda fixa

Forneça 3-4 sugestões práticas e acionáveis, cada uma com:
- Título claro
- Explicação detalhada
- Impacto esperado (baixo/médio/alto)
- Nível de prioridade (baixa/média/alta)`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  impact: { type: "string", enum: ["baixo", "médio", "alto"] },
                  priority: { type: "string", enum: ["baixa", "média", "alta"] }
                }
              }
            },
            overall_assessment: { type: "string" }
          }
        }
      });

      setSuggestions(response);
      toast.success("Análise concluída!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar sugestões");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (assets && Object.keys(assets).length > 0) {
      generateSuggestions();
    }
  }, []);

  const getImpactColor = (impact) => {
    switch(impact) {
      case "alto": return "text-emerald-400 bg-emerald-500/20";
      case "médio": return "text-amber-400 bg-amber-500/20";
      case "baixo": return "text-blue-400 bg-blue-500/20";
      default: return "text-gray-400 bg-gray-500/20";
    }
  };

  const getPriorityIcon = (priority) => {
    switch(priority) {
      case "alta": return <AlertTriangle className="h-4 w-4 text-red-400" />;
      case "média": return <TrendingUp className="h-4 w-4 text-amber-400" />;
      case "baixa": return <CheckCircle2 className="h-4 w-4 text-blue-400" />;
      default: return <CheckCircle2 className="h-4 w-4 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-gray-900 via-gray-900 to-violet-950/20 border-gray-800 p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
          <span className="ml-3 text-gray-400">Analisando sua carteira...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-gray-900 via-gray-900 to-violet-950/20 border-gray-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <Brain className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Otimização de Portfólio</h3>
            <p className="text-sm text-gray-400">Sugestões baseadas em IA</p>
          </div>
        </div>
        <Button
          onClick={generateSuggestions}
          size="sm"
          variant="outline"
          className="border-violet-500/30 text-violet-400 hover:bg-violet-500/10"
        >
          <Brain className="h-4 w-4 mr-2" />
          Reanalisar
        </Button>
      </div>

      {suggestions && (
        <div className="space-y-4">
          {suggestions.overall_assessment && (
            <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-4">
              <p className="text-sm text-violet-200">{suggestions.overall_assessment}</p>
            </div>
          )}

          <div className="space-y-3">
            {suggestions.suggestions?.map((suggestion, idx) => (
              <div
                key={idx}
                className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-violet-500/30 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getPriorityIcon(suggestion.priority)}
                    <h4 className="font-semibold text-white">{suggestion.title}</h4>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getImpactColor(suggestion.impact)}`}>
                    Impacto {suggestion.impact}
                  </span>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">{suggestion.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}