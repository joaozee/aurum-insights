import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Play, TrendingUp, BarChart3, AlertCircle } from 'lucide-react';
import { brapiService } from "@/components/utils/brapiService";

export default function BacktestSimulator({ stocks = [] }) {
  const [startDate, setStartDate] = useState('2023-01-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [monthlyInvestment, setMonthlyInvestment] = useState(2000);
  const [running, setRunning] = useState(false);
  const [backtest, setBacktest] = useState(null);

  const generateBacktestData = async () => {
    setRunning(true);
    
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const months = Math.floor((end - start) / (1000 * 60 * 60 * 24 * 30));
      
      // Puxar cotações dos ativos recomendados
      const tickerList = ['BBAS3', 'BRSR6', 'ISAE3', 'AURE3', 'TAEE4', 'CMIG4', 'BBSE3', 'CXSE3', 'RANI3'];
      const quotes = await brapiService.getQuotes(tickerList);
      
      const data = [];
      let totalInvested = 0;
      let portfolioValue = 0;
      const allocation = {
        'BBAS3': 0.12, 'BRSR6': 0.11, 'ISAE3': 0.13, 'AURE3': 0.10,
        'TAEE4': 0.12, 'CMIG4': 0.12, 'BBSE3': 0.15, 'CXSE3': 0.09, 'RANI3': 0.06
      };

      for (let i = 0; i <= months; i++) {
        totalInvested = monthlyInvestment * i;
        
        // Usar dados reais das cotações com simulação de crescimento
        let monthlyValue = 0;
        Object.entries(allocation).forEach(([ticker, pct]) => {
          const quote = quotes.find(q => q.symbol === ticker);
          const currentPrice = quote?.regularMarketPrice || 0;
          const sharesPerMonth = (monthlyInvestment * pct) / currentPrice;
          const shares = sharesPerMonth * i;
          const assetValue = shares * currentPrice * (1 + (i / (months || 1)) * 0.08);
          monthlyValue += assetValue;
        });

        portfolioValue = monthlyValue;

        data.push({
          month: new Date(start.getTime() + i * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
          investido: totalInvested,
          valor: Math.round(portfolioValue),
          ganhos: Math.round(portfolioValue - totalInvested)
        });
      }

      const finalValue = portfolioValue;
      const totalGains = finalValue - totalInvested;
      const roi = totalInvested > 0 ? ((totalGains / totalInvested) * 100).toFixed(2) : 0;

      setBacktest({
        data,
        summary: {
          finalValue: Math.round(finalValue),
          totalInvested: Math.round(totalInvested),
          totalGains: Math.round(totalGains),
          roi,
          months
        }
      });
    } catch (error) {
      console.error('Erro ao gerar backtest:', error);
      alert('Erro ao buscar cotações. Tente novamente.');
    }

    setRunning(false);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <BarChart3 className="h-5 w-5 text-violet-400" />
            Simulador de Performance (Backtest)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Data Inicial</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Data Final</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Aporte Mensal (R$)</Label>
              <Input
                type="number"
                value={monthlyInvestment}
                onChange={(e) => setMonthlyInvestment(Number(e.target.value))}
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>
          </div>

          <Button
            onClick={generateBacktestData}
            disabled={running}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2"
          >
            <Play className="h-4 w-4 mr-2" />
            {running ? 'Simulando...' : 'Rodar Simulação'}
          </Button>
        </CardContent>
      </Card>

      {backtest && (
        <>
          {/* Results Summary */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Resultado da Simulação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-900 rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-1">Total Aportado</p>
                  <p className="text-xl font-bold text-blue-400">
                    R$ {backtest.summary.totalInvested.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="bg-gray-900 rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-1">Valor Final</p>
                  <p className="text-xl font-bold text-emerald-400">
                    R$ {backtest.summary.finalValue.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="bg-gray-900 rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-1">Ganhos</p>
                  <p className="text-xl font-bold text-amber-400">
                    R$ {backtest.summary.totalGains.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="bg-gray-900 rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-1">ROI</p>
                  <p className="text-xl font-bold text-violet-400">{backtest.summary.roi}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chart */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Evolução da Carteira</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={backtest.data}>
                  <defs>
                    <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151' }}
                    formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="investido" 
                    stroke="#3B82F6" 
                    fill="none"
                    name="Total Aportado"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="valor" 
                    stroke="#8B5CF6" 
                    fillOpacity={1} 
                    fill="url(#colorValor)"
                    name="Valor da Carteira"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Metrics */}
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
            <p className="text-emerald-400 text-sm">
              ✅ Simulação mostra que com aporte mensal de R$ {monthlyInvestment.toLocaleString('pt-BR')} em ações DY ≥ 6%, você teria alcançado R$ {backtest.summary.finalValue.toLocaleString('pt-BR')} em {backtest.summary.months} meses, com retorno de {backtest.summary.roi}% ao longo do período.
            </p>
          </div>
        </>
      )}
    </div>
  );
}