import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Target, DollarSign, BarChart3 } from 'lucide-react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';

export default function StrategyRecommendation({ strategy, projection }) {
  if (!strategy) return null;

  const allocationData = Object.entries(strategy.allocation).map(([key, value]) => ({
    name: key.replace(/_/g, ' ').toUpperCase(),
    value
  }));

  return (
    <div className="space-y-6">
      {/* Strategy Overview */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-xl flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-violet-400" />
            {strategy.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-300">{strategy.description}</p>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-900 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-1">Aporte Mensal</p>
              <p className="text-2xl font-bold text-violet-400">
                R$ {strategy.monthlyInvestment.toLocaleString('pt-BR')}
              </p>
            </div>
            <div className="bg-gray-900 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-1">Dividend Yield Alvo</p>
              <p className="text-2xl font-bold text-emerald-400">
                {strategy.dividend_yield_target}%
              </p>
            </div>
            <div className="bg-gray-900 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-1">Retorno Esperado</p>
              <p className="text-2xl font-bold text-amber-400">
                {strategy.expectedReturn}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>



      {/* Recommended Stocks */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-violet-400" />
            Ações Recomendadas (Dividend Yield ≥ 6%)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {strategy.tickers.map((stock) => (
            <div key={stock.ticker} className="bg-gray-900 rounded-lg p-4 border border-gray-700">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-bold text-white">{stock.ticker}</p>
                  <p className="text-sm text-gray-400">{stock.name}</p>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40">
                  DY {stock.dy}
                </Badge>
              </div>
              <p className="text-sm text-gray-300">{stock.reason}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Projection */}
      {projection && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="h-5 w-5 text-violet-400" />
              Projeção Financeira
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-900 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-1">Meta</p>
                <p className="text-xl font-bold text-white">
                  R$ {projection.targetAmount.toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-1">Valor Projetado</p>
                <p className={`text-xl font-bold ${projection.onTrack ? 'text-emerald-400' : 'text-red-400'}`}>
                  R$ {projection.projectedValue.toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-1">Total Aportado</p>
                <p className="text-xl font-bold text-blue-400">
                  R$ {projection.totalContributed.toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-1">Ganhos Projetados</p>
                <p className="text-xl font-bold text-amber-400">
                  R$ {projection.projectedGains.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
            
            <div className={`rounded-lg p-4 border ${projection.onTrack ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-red-500/10 border-red-500/40'}`}>
              <p className={`text-sm font-semibold ${projection.onTrack ? 'text-emerald-400' : 'text-red-400'}`}>
                {projection.onTrack 
                  ? `✅ No caminho! Superará a meta em R$ ${Math.abs(projection.surplusOrGap).toLocaleString('pt-BR')}`
                  : `⚠️ Falta atingir em R$ ${Math.abs(projection.surplusOrGap).toLocaleString('pt-BR')}`
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}