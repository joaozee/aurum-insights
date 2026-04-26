import { TrendingUp, TrendingDown } from "lucide-react";

export default function AssetsPerformance({ assets = [], portfolio }) {
  // Calcular desempenho por ativo
  const assetsPerformance = assets.filter(a => a.type === "acoes").map(asset => {
    const invested = (asset.quantity || 0) * (asset.purchase_price || 0);
    const current = (asset.quantity || 0) * (asset.current_price || 0);
    const profitLoss = current - invested;
    const profitLossPercent = invested > 0 ? ((profitLoss / invested) * 100) : 0;
    
    return {
      name: asset.name,
      invested,
      current,
      profitLoss,
      profitLossPercent
    };
  }).sort((a, b) => b.profitLossPercent - a.profitLossPercent);

  const totalInvested = portfolio?.total_invested || assetsPerformance.reduce((sum, a) => sum + a.invested, 0);
  const currentValue = portfolio?.current_value || assetsPerformance.reduce((sum, a) => sum + a.current, 0);
  const totalReturn = currentValue - totalInvested;
  const totalReturnPercent = totalInvested > 0 ? ((totalReturn / totalInvested) * 100) : 0;

  if (assetsPerformance.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-violet-950/30 rounded-2xl border border-gray-800 p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Desempenho</h3>
          <p className="text-gray-500 text-sm">Retorno por ativo</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 rounded-xl">
          {totalReturn >= 0 ? (
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-400" />
          )}
          <span className={`font-semibold ${totalReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {totalReturn >= 0 ? '+' : ''}{totalReturnPercent.toFixed(2)}%
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {assetsPerformance.slice(0, 5).map((asset) => (
          <div key={asset.name} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl hover:bg-gray-800/70 transition-colors">
            <div>
              <p className="font-semibold text-white">{asset.name}</p>
              <p className="text-xs text-gray-400">
                R$ {asset.invested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-white">
                R$ {asset.current.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <div className="flex items-center gap-1 justify-end">
                {asset.profitLoss >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-emerald-400" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-400" />
                )}
                <span className={`text-xs font-semibold ${asset.profitLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {asset.profitLoss >= 0 ? '+' : ''}{asset.profitLossPercent.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}