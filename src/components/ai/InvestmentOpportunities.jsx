import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function InvestmentOpportunities({ assets, riskProfile }) {
  const [loading, setLoading] = useState(false);
  const [opportunities, setOpportunities] = useState(null);

  const findOpportunities = async () => {
    setLoading(true);
    try {
      const portfolioTickers = Object.keys(assets || {});
      
      const prompt = `
Você é um analista de mercado brasileiro especializado em identificar oportunidades de investimento.

**CARTEIRA ATUAL:** ${portfolioTickers.join(', ') || "Nenhum ativo"}

**PERFIL DE RISCO:** ${riskProfile || "Moderado"}

**TAREFA:**
Analise o mercado brasileiro atual e sugira 4-5 oportunidades de investimento que:
1. Complementem a carteira existente (diversificação)
2. Sejam adequadas ao perfil de risco
3. Tenham bom potencial de valorização
4. Estejam em setores promissores

Para cada oportunidade, forneça:
- Ticker da ação/FII
- Nome da empresa
- Setor
- Justificativa detalhada
- Tipo (ação/FII/renda_fixa)
- Horizonte recomendado (curto/médio/longo prazo)

Foque em ativos brasileiros listados na B3.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            opportunities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  ticker: { type: "string" },
                  name: { type: "string" },
                  sector: { type: "string" },
                  rationale: { type: "string" },
                  type: { type: "string", enum: ["ação", "FII", "renda_fixa"] },
                  horizon: { type: "string", enum: ["curto", "médio", "longo"] }
                }
              }
            },
            market_context: { type: "string" }
          }
        }
      });

      setOpportunities(response);
      toast.success("Oportunidades identificadas!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao buscar oportunidades");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    findOpportunities();
  }, []);

  const getTypeColor = (type) => {
    switch(type) {
      case "ação": return "bg-violet-500/20 text-violet-400";
      case "FII": return "bg-amber-500/20 text-amber-400";
      case "renda_fixa": return "bg-emerald-500/20 text-emerald-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  const getHorizonColor = (horizon) => {
    switch(horizon) {
      case "curto": return "bg-red-500/20 text-red-400";
      case "médio": return "bg-amber-500/20 text-amber-400";
      case "longo": return "bg-emerald-500/20 text-emerald-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-gray-900 via-gray-900 to-amber-950/20 border-gray-800 p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
          <span className="ml-3 text-gray-400">Buscando oportunidades no mercado...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-gray-900 via-gray-900 to-amber-950/20 border-gray-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Oportunidades de Investimento</h3>
            <p className="text-sm text-gray-400">Baseado em tendências de mercado</p>
          </div>
        </div>
        <Button
          onClick={findOpportunities}
          size="sm"
          variant="outline"
          className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {opportunities && (
        <div className="space-y-4">
          {opportunities.market_context && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
              <p className="text-sm text-amber-200">{opportunities.market_context}</p>
            </div>
          )}

          <div className="space-y-3">
            {opportunities.opportunities?.map((opp, idx) => (
              <div
                key={idx}
                className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-amber-500/30 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-white text-lg">{opp.ticker}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(opp.type)}`}>
                        {opp.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">{opp.name}</p>
                    <p className="text-xs text-gray-500 mt-1">Setor: {opp.sector}</p>
                  </div>
                  <Link to={createPageUrl("Company") + `?ticker=${opp.ticker}`}>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                
                <p className="text-sm text-gray-300 leading-relaxed mb-3">{opp.rationale}</p>
                
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-gray-500" />
                  <span className={`text-xs px-2 py-1 rounded-full ${getHorizonColor(opp.horizon)}`}>
                    Prazo {opp.horizon}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}