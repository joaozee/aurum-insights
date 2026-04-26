import { TrendingUp, TrendingDown, Award } from "lucide-react";

export default function TopPerformers({ assets }) {
  if (!assets || Object.keys(assets).length === 0) {
    return null;
  }

  // Calcular rentabilidade de cada ativo
  const assetsWithReturn = Object.values(assets)
    .filter(asset => asset.current_price && asset.purchase_price)
    .map(asset => {
      const invested = asset.quantity * asset.purchase_price;
      const current = asset.quantity * asset.current_price;
      const profit = current - invested;
      const profitPercent = (profit / invested) * 100;

      return {
        ...asset,
        profit,
        profitPercent
      };
    })
    .sort((a, b) => b.profitPercent - a.profitPercent);

  const topGainers = assetsWithReturn.slice(0, 3);
  const topLosers = assetsWithReturn.slice(-3).reverse();

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-violet-950/30 rounded-2xl border border-gray-800 p-6 shadow-xl">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white">Performance dos Ativos</h3>
        <p className="text-gray-500 text-sm">Melhores e piores desempenhos</p>
      </div>

      <div className="space-y-6">
        {/* Top Gainers */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <h4 className="text-sm font-medium text-emerald-400">Maiores Altas</h4>
          </div>
          <div className="space-y-2">
            {topGainers.map((asset, idx) => (
              <div 
                key={asset.ticker} 
                className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {idx === 0 && <Award className="h-4 w-4 text-amber-400" />}
                  {asset.logo_url && (
                    <img 
                      src={asset.logo_url} 
                      alt={asset.ticker}
                      className="h-8 w-8 rounded-full bg-white p-0.5"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  )}
                  <div>
                    <p className="text-white font-medium text-sm">{asset.ticker}</p>
                    <p className="text-gray-500 text-xs">{asset.company_name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-emerald-400 font-semibold text-sm">
                    +{asset.profitPercent.toFixed(2)}%
                  </p>
                  <p className="text-gray-500 text-xs">
                    +R$ {asset.profit.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Losers */}
        {topLosers.some(a => a.profitPercent < 0) && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="h-4 w-4 text-red-400" />
              <h4 className="text-sm font-medium text-red-400">Maiores Baixas</h4>
            </div>
            <div className="space-y-2">
              {topLosers.filter(a => a.profitPercent < 0).map((asset) => (
                <div 
                  key={asset.ticker} 
                  className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {asset.logo_url && (
                      <img 
                        src={asset.logo_url} 
                        alt={asset.ticker}
                        className="h-8 w-8 rounded-full bg-white p-0.5"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    )}
                    <div>
                      <p className="text-white font-medium text-sm">{asset.ticker}</p>
                      <p className="text-gray-500 text-xs">{asset.company_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-red-400 font-semibold text-sm">
                      {asset.profitPercent.toFixed(2)}%
                    </p>
                    <p className="text-gray-500 text-xs">
                      R$ {asset.profit.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}