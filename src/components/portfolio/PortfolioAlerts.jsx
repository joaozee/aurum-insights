import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Target, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { brapiService } from "@/components/utils/brapiService";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function PortfolioAlerts({ assets, userEmail }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (assets && Object.keys(assets).length > 0 && userEmail) {
      checkPriceVariations();
    } else {
      setLoading(false);
    }
  }, [assets, userEmail]);

  const checkPriceVariations = async () => {
    setLoading(true);
    try {
      const tickers = Object.keys(assets);
      const quotes = await brapiService.getQuotes(tickers);
      
      const newAlerts = [];

      quotes.forEach(quote => {
        const asset = assets[quote.symbol];
        if (!asset) return;

        const formatted = brapiService.formatStockData(quote);
        const changePercent = formatted.daily_change_percent || 0;
        
        // Alerta de variação significativa (>5% ou <-5%)
        if (Math.abs(changePercent) >= 5) {
          const isPositive = changePercent > 0;
          newAlerts.push({
            type: "variacao_preco",
            severity: isPositive ? "success" : "warning",
            title: `${quote.symbol} ${isPositive ? 'subiu' : 'caiu'} ${Math.abs(changePercent).toFixed(2)}%`,
            message: `${formatted.company_name} teve uma ${isPositive ? 'alta' : 'queda'} significativa hoje. Preço atual: R$ ${formatted.current_price.toFixed(2)}`,
            ticker: quote.symbol,
            variation: changePercent
          });
        }

        // Alerta de lucro/prejuízo relevante
        const invested = asset.quantity * asset.purchase_price;
        const current = asset.quantity * (asset.current_price || asset.purchase_price);
        const profitPercent = ((current - invested) / invested) * 100;

        if (profitPercent >= 20) {
          newAlerts.push({
            type: "meta_atingida",
            severity: "success",
            title: `${quote.symbol} com +${profitPercent.toFixed(1)}% de lucro`,
            message: `Sua posição em ${formatted.company_name} está com ótima rentabilidade. Considere realizar parcial.`,
            ticker: quote.symbol,
            variation: profitPercent
          });
        } else if (profitPercent <= -15) {
          newAlerts.push({
            type: "variacao_preco",
            severity: "error",
            title: `${quote.symbol} com ${profitPercent.toFixed(1)}% de prejuízo`,
            message: `${formatted.company_name} está com prejuízo significativo. Avalie sua tese de investimento.`,
            ticker: quote.symbol,
            variation: profitPercent
          });
        }
      });

      // Criar notificações novas no banco (evitar duplicatas)
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      for (const alert of newAlerts.slice(0, 5)) {
        // Verificar se já existe alerta similar hoje
        const existing = await base44.entities.Notification.filter({
          user_email: userEmail,
          type: alert.type,
          title: alert.title
        });

        const hasRecentAlert = existing.some(e => 
          new Date(e.created_date) >= todayStart
        );

        if (!hasRecentAlert) {
          await base44.entities.Notification.create({
            user_email: userEmail,
            type: alert.type,
            title: alert.title,
            message: alert.message,
            severity: alert.severity,
            metadata: { ticker: alert.ticker, variation: alert.variation }
          });
        }
      }

      setAlerts(newAlerts.slice(0, 5));
    } catch (err) {
      console.error(err);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-violet-950/30 rounded-2xl border border-gray-800 p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-white mb-4">Alertas da Carteira</h3>
        <div className="space-y-3">
          {[1, 2].map(i => (
            <Skeleton key={i} className="h-16 rounded-xl bg-gray-800" />
          ))}
        </div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return null;
  }

  const severityConfig = {
    success: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400", icon: TrendingUp },
    warning: { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400", icon: TrendingDown },
    error: { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400", icon: AlertTriangle },
    info: { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400", icon: Target }
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-violet-950/30 rounded-2xl border border-gray-800 p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Alertas da Carteira</h3>
          <p className="text-gray-500 text-xs">Movimentos importantes hoje</p>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={checkPriceVariations}
          className="h-8 w-8 text-gray-400 hover:text-white"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3">
        {alerts.map((alert, idx) => {
          const config = severityConfig[alert.severity];
          const Icon = config.icon;

          return (
            <div
              key={idx}
              className={cn(
                "p-3 rounded-xl border",
                config.bg,
                config.border
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0", config.bg)}>
                  <Icon className={cn("h-4 w-4", config.text)} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={cn("text-sm font-semibold mb-1", config.text)}>
                    {alert.title}
                  </h4>
                  <p className="text-gray-300 text-xs">
                    {alert.message}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}