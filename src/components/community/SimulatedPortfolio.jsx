import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { brapiService } from "@/components/utils/brapiService";
import { TrendingUp, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function SimulatedPortfolio({ userEmail }) {
  const [portfolio, setPortfolio] = useState([]);
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSimulatedPortfolio();
  }, [userEmail]);

  const loadSimulatedPortfolio = async () => {
    try {
      if (!userEmail) {
        setLoading(false);
        return;
      }

      // Buscar transações do usuário
      const transactions = await base44.entities.Transaction.filter({ 
        user_email: userEmail 
      });

      // Agrupar por ticker
      const assetMap = {};
      transactions.forEach(t => {
        if (!assetMap[t.ticker]) {
          assetMap[t.ticker] = { ticker: t.ticker, quantity: 0, totalInvested: 0, purchases: [] };
        }
        
        if (t.type === "compra") {
          assetMap[t.ticker].quantity += t.quantity;
          assetMap[t.ticker].totalInvested += t.total_value;
          assetMap[t.ticker].purchases.push(t);
        } else {
          assetMap[t.ticker].quantity -= t.quantity;
          assetMap[t.ticker].totalInvested -= (t.price * t.quantity);
        }
      });

      // Buscar preços atuais
      const tickers = Object.keys(assetMap).filter(t => assetMap[t].quantity > 0);
      
      if (tickers.length > 0) {
        const quotes = await brapiService.getQuotes(tickers);
        
        const portfolio = tickers.map(ticker => {
          const asset = assetMap[ticker];
          const quote = quotes.find(q => q.symbol === ticker);
          const currentPrice = quote?.regularMarketPrice || 0;
          const currentValue = asset.quantity * currentPrice;
          const gain = currentValue - asset.totalInvested;
          const gainPercent = (gain / asset.totalInvested) * 100;

          return {
            ticker,
            quantity: asset.quantity,
            averagePrice: asset.totalInvested / asset.quantity,
            currentPrice,
            currentValue,
            gain,
            gainPercent,
            logo: quote?.logourl,
            name: quote?.longName || ticker
          };
        });

        setPortfolio(portfolio);
        setTotalValue(portfolio.reduce((sum, p) => sum + p.currentValue, 0));
      }
    } catch (err) {
      console.error("Erro ao carregar carteira simulada:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !userEmail) {
    return (
      <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-700 rounded w-1/3"></div>
          <div className="h-10 bg-gray-700 rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 p-6">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="h-5 w-5 text-emerald-400" />
        <h3 className="text-lg font-semibold text-white">Sua Carteira Simulada</h3>
      </div>

      <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <p className="text-xs text-gray-400 mb-1">Valor Total</p>
        <p className="text-2xl font-bold text-white">R$ {totalValue.toFixed(2)}</p>
      </div>

      {portfolio.length > 0 ? (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {portfolio.map((asset) => (
            <div key={asset.ticker} className="bg-gray-700/30 border border-gray-700 rounded-lg p-3 hover:border-emerald-500/30 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {asset.logo ? (
                    <img 
                      src={asset.logo} 
                      alt={asset.ticker}
                      className="h-8 w-8 rounded bg-white p-1"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  ) : null}
                  <div>
                    <p className="font-semibold text-white text-sm">{asset.ticker}</p>
                    <p className="text-xs text-gray-400">{asset.quantity} ações</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-white text-sm">R$ {asset.currentValue.toFixed(2)}</p>
                  <p className={`text-xs font-medium ${asset.gainPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {asset.gainPercent >= 0 ? '+' : ''}{asset.gainPercent.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <TrendingUp className="h-10 w-10 text-gray-600 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">Nenhum ativo na carteira</p>
        </div>
      )}
    </Card>
  );
}