import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { brapiService } from "@/components/utils/brapiService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, TrendingDown, TrendingUp, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function PredictiveAlerts({ assets }) {
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState(null);

  const generateAlerts = async () => {
    if (!assets || Object.keys(assets).length === 0) {
      return;
    }

    setLoading(true);
    try {
      // Buscar dados de mercado atuais
      const tickers = Object.keys(assets);
      const quotes = await brapiService.getQuotes(tickers, { fundamental: true });

      const assetsData = quotes.map(quote => {
        const asset = assets[quote.symbol];
        const formatted = brapiService.formatStockData(quote);
        return {
          ticker: quote.symbol,
          name: formatted.company_name,
          current_price: formatted.current_price,
          purchase_price: asset.purchase_price,
          quantity: asset.quantity,
          pe_ratio: formatted.pe_ratio,
          pb_ratio: formatted.pb_ratio,
          dividend_yield: formatted.dividend_yield,
          daily_change_percent: formatted.daily_change_percent,
          profit_loss_percent: ((formatted.current_price - asset.purchase_price) / asset.purchase_price * 100).toFixed(2)
        };
      });

      const prompt = `
Você é um analista financeiro especializado em identificar riscos e oportunidades em carteiras de investimento.

**ANÁLISE DE ATIVOS:**
${assetsData.map(a => `
- ${a.ticker} (${a.name})
  - Preço atual: R$ ${a.current_price}
  - Preço de compra: R$ ${a.purchase_price}
  - Resultado: ${a.profit_loss_percent}%
  - P/L: ${a.pe_ratio || 'N/A'}
  - P/VP: ${a.pb_ratio || 'N/A'}
  - Dividend Yield: ${a.dividend_yield || 'N/A'}%
  - Variação hoje: ${a.daily_change_percent}%
`).join('\n')}

**TAREFA:**
Analise cada ativo e identifique:
1. **ALERTAS DE VENDA:** Ativos que podem estar sobrevalorizados ou com sinais técnicos negativos
2. **OPORTUNIDADES DE COMPRA:** Ativos abaixo do preço ideal, bom momento para aportar mais
3. **RISCOS IDENTIFICADOS:** Concentração, volatilidade excessiva, problemas fundamentalistas

Para cada alerta, forneça:
- Ticker do ativo
- Tipo (venda/compra/risco)
- Título claro
- Explicação detalhada
- Urgência (baixa/média/alta)
- Ação recomendada`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            alerts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  ticker: { type: "string" },
                  type: { type: "string", enum: ["venda", "compra", "risco"] },
                  title: { type: "string" },
                  description: { type: "string" },
                  urgency: { type: "string", enum: ["baixa", "média", "alta"] },
                  action: { type: "string" }
                }
              }
            }
          }
        }
      });

      setAlerts(response);
      toast.success("Alertas atualizados!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar alertas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (assets && Object.keys(assets).length > 0) {
      generateAlerts();
    }
  }, []);

  const getAlertIcon = (type) => {
    switch(type) {
      case "venda": return <TrendingDown className="h-5 w-5 text-red-400" />;
      case "compra": return <TrendingUp className="h-5 w-5 text-emerald-400" />;
      case "risco": return <AlertTriangle className="h-5 w-5 text-amber-400" />;
      default: return <Bell className="h-5 w-5 text-gray-400" />;
    }
  };

  const getAlertColor = (type) => {
    switch(type) {
      case "venda": return "bg-red-500/10 border-red-500/30";
      case "compra": return "bg-emerald-500/10 border-emerald-500/30";
      case "risco": return "bg-amber-500/10 border-amber-500/30";
      default: return "bg-gray-500/10 border-gray-500/30";
    }
  };

  const getUrgencyBadge = (urgency) => {
    const colors = {
      alta: "bg-red-500/20 text-red-400",
      média: "bg-amber-500/20 text-amber-400",
      baixa: "bg-blue-500/20 text-blue-400"
    };
    return colors[urgency] || colors.baixa;
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-gray-900 via-gray-900 to-emerald-950/20 border-gray-800 p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
          <span className="ml-3 text-gray-400">Gerando alertas preditivos...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-gray-900 via-gray-900 to-emerald-950/20 border-gray-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <Bell className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Alertas Preditivos</h3>
            <p className="text-sm text-gray-400">Oportunidades e riscos identificados</p>
          </div>
        </div>
        <Button
          onClick={generateAlerts}
          size="sm"
          variant="outline"
          className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
        >
          <Bell className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {alerts && alerts.alerts && alerts.alerts.length > 0 ? (
        <div className="space-y-3">
          {alerts.alerts.map((alert, idx) => (
            <div
              key={idx}
              className={`border rounded-xl p-4 ${getAlertColor(alert.type)}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">{getAlertIcon(alert.type)}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white">{alert.ticker}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${getUrgencyBadge(alert.urgency)}`}>
                        Urgência {alert.urgency}
                      </span>
                    </div>
                  </div>
                  <h5 className="font-semibold text-white mb-2">{alert.title}</h5>
                  <p className="text-sm text-gray-300 mb-3 leading-relaxed">{alert.description}</p>
                  <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
                    <p className="text-xs text-gray-400 mb-1">Ação recomendada:</p>
                    <p className="text-sm text-white">{alert.action}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Bell className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Nenhum alerta no momento</p>
        </div>
      )}
    </Card>
  );
}