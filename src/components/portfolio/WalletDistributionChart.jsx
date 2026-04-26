import { useMemo } from "react";

const COLORS = ["#8b5cf6", "#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#06b6d4", "#ec4899", "#84cc16", "#f97316", "#a855f7"];

export default function WalletDistributionChart({ assets, quotes }) {
  const items = useMemo(() => {
    const totalValue = assets.reduce((sum, a) => {
      const price = quotes[a.ticker]?.regularMarketPrice || a.current_price || a.purchase_price;
      return sum + a.quantity * price;
    }, 0);

    if (totalValue === 0) return [];

    return assets
      .map(a => {
        const price = quotes[a.ticker]?.regularMarketPrice || a.current_price || a.purchase_price;
        const value = a.quantity * price;
        return {
          ticker: a.ticker,
          value,
          percent: (value / totalValue) * 100,
        };
      })
      .sort((a, b) => b.percent - a.percent);
  }, [assets, quotes]);

  if (items.length === 0) return null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6">
      <h3 className="text-white font-semibold text-base mb-4">Distribuição por Ação</h3>
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={item.ticker} className="flex items-center gap-3">
            <span className="text-gray-300 text-sm font-medium w-16 shrink-0">{item.ticker}</span>
            <div className="flex-1 bg-gray-800 rounded-full h-5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${item.percent}%`,
                  backgroundColor: COLORS[idx % COLORS.length],
                }}
              />
            </div>
            <span className="text-gray-300 text-sm font-semibold w-12 text-right shrink-0">
              {item.percent.toFixed(1)}%
            </span>
            <span className="text-gray-500 text-xs w-24 text-right shrink-0">
              R$ {item.value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}