import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, AlertCircle, CheckCircle2, Target } from 'lucide-react';

export default function PersonalizedStockRecommendations({ strategy }) {
  if (!strategy || !strategy.tickers) return null;

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'conservador':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
      case 'moderado':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'agressivo':
        return 'bg-red-500/20 text-red-400 border-red-500/40';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/40';
    }
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <TrendingUp className="h-5 w-5 text-emerald-400" />
          Recomendações Personalizadas (DY ≥ 6%)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`rounded-lg p-4 border ${getRiskColor(strategy.riskProfile)}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold capitalize">{strategy.riskProfile}</p>
              <p className="text-sm opacity-80">{strategy.description}</p>
            </div>
            <Target className="h-5 w-5 flex-shrink-0" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-900 rounded-lg p-3">
            <p className="text-xs text-gray-400">Dividend Yield Alvo</p>
            <p className="text-lg font-bold text-emerald-400">{strategy.dividend_yield_target}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-3">
            <p className="text-xs text-gray-400">Retorno Esperado</p>
            <p className="text-lg font-bold text-violet-400">{strategy.expectedReturn}</p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="font-semibold text-white text-sm">Ações Recomendadas:</p>
          {strategy.tickers.map((stock, idx) => (
            <div
              key={idx}
              className="bg-gray-900 rounded-lg p-4 border border-gray-700 hover:border-emerald-500/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  {stock.logo_url && (
                    <img 
                      src={stock.logo_url} 
                      alt={stock.ticker}
                      className="h-10 w-10 rounded-full bg-white p-1"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  )}
                  <div>
                    <p className="font-bold text-white">{stock.ticker}</p>
                    <p className="text-sm text-gray-400">{stock.name}</p>
                  </div>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40">
                  DY {stock.dy}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="text-xs">
                  <p className="text-gray-500">P/L</p>
                  <p className="text-white font-medium">{stock.peRatio?.toFixed(2)}</p>
                </div>
                <div className="text-xs">
                  <p className="text-gray-500">P/VP</p>
                  <p className="text-white font-medium">{stock.pbRatio?.toFixed(2)}</p>
                </div>
              </div>

              <p className="text-xs text-gray-400 flex items-start gap-2">
                <CheckCircle2 className="h-3 w-3 mt-0.5 flex-shrink-0 text-emerald-400" />
                {stock.reason}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-violet-500/10 border border-violet-500/30 rounded-lg p-4">
          <p className="text-violet-400 text-sm flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            Estas recomendações são baseadas em consistência de dividendos e fundamentos. Consulte análises detalhadas antes de investir.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}