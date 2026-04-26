import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, Zap } from 'lucide-react';

export default function StrategyBuilder({ onStrategyGenerate, isLoading }) {
  const [primaryGoal, setPrimaryGoal] = useState('renda_passiva');
  const [riskTolerance, setRiskTolerance] = useState('moderado');
  const [investmentHorizon, setInvestmentHorizon] = useState('longo_prazo');
  const [monthlyCapacity, setMonthlyCapacity] = useState('2000');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');

  const handleGenerate = async () => {
    if (!primaryGoal || !riskTolerance || !investmentHorizon) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    onStrategyGenerate({
      primaryGoal,
      riskTolerance,
      investmentHorizon,
      monthlyCapacity: parseInt(monthlyCapacity) || 2000,
      targetAmount: targetAmount ? parseInt(targetAmount) : null,
      targetDate: targetDate || null
    });
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Zap className="h-5 w-5 text-violet-400" />
          Construir Estratégia Personalizada
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Primary Goal */}
        <div className="space-y-2">
          <Label className="text-gray-300">Objetivo Principal *</Label>
          <Select value={primaryGoal} onValueChange={setPrimaryGoal}>
            <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="renda_passiva">Renda Passiva (Dividendos)</SelectItem>
              <SelectItem value="aposentadoria">Aposentadoria</SelectItem>
              <SelectItem value="imovel">Compra de Imóvel</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Risk Tolerance */}
        <div className="space-y-2">
          <Label className="text-gray-300">Tolerância a Risco *</Label>
          <Select value={riskTolerance} onValueChange={setRiskTolerance}>
            <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="conservador">Conservador (Estabilidade)</SelectItem>
              <SelectItem value="moderado">Moderado (Equilíbrio)</SelectItem>
              <SelectItem value="agressivo">Agressivo (Crescimento)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Investment Horizon */}
        <div className="space-y-2">
          <Label className="text-gray-300">Horizonte de Investimento *</Label>
          <Select value={investmentHorizon} onValueChange={setInvestmentHorizon}>
            <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="curto_prazo">Curto Prazo (&lt;2 anos)</SelectItem>
              <SelectItem value="medio_prazo">Médio Prazo (2-5 anos)</SelectItem>
              <SelectItem value="longo_prazo">Longo Prazo (&gt;5 anos)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Monthly Capacity */}
        <div className="space-y-2">
          <Label className="text-gray-300">Capacidade Mensal de Aporte (R$) *</Label>
          <Input
            type="number"
            value={monthlyCapacity}
            onChange={(e) => setMonthlyCapacity(e.target.value)}
            placeholder="2000"
            className="bg-gray-900 border-gray-700 text-white"
          />
        </div>

        {/* Target Amount (Optional) */}
        <div className="space-y-2">
          <Label className="text-gray-300">Meta Financeira (Opcional)</Label>
          <Input
            type="number"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            placeholder="Ex: 100000"
            className="bg-gray-900 border-gray-700 text-white"
          />
        </div>

        {/* Target Date (Optional) */}
        <div className="space-y-2">
          <Label className="text-gray-300">Data Alvo (Opcional)</Label>
          <Input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="bg-gray-900 border-gray-700 text-white"
          />
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full bg-violet-500 hover:bg-violet-600 text-white font-semibold py-3 flex items-center justify-center gap-2"
        >
          {isLoading ? 'Gerando Estratégia...' : 'Gerar Estratégia'}
          {!isLoading && <ArrowRight className="h-4 w-4" />}
        </Button>
      </CardContent>
    </Card>
  );
}