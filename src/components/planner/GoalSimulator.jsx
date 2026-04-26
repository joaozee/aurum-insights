import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/components/lib/utils";

export default function GoalSimulator() {
  const [simulation, setSimulation] = useState({
    targetAmount: "",
    monthlyContribution: "",
    years: "5",
    expectedReturn: 8
  });
  const [result, setResult] = useState(null);

  const runSimulation = () => {
    const targetAmount = parseFloat(simulation.targetAmount);
    const monthlyContribution = parseFloat(simulation.monthlyContribution);
    const years = parseInt(simulation.years);
    const annualReturn = parseFloat(simulation.expectedReturn) / 100;
    const monthlyRate = annualReturn / 12;
    const months = years * 12;

    // Calcular valor futuro com aportes mensais
    let accumulated = 0;
    const projectionData = [];

    for (let month = 0; month <= months; month++) {
      if (month > 0) {
        accumulated = accumulated * (1 + monthlyRate) + monthlyContribution;
      }
      
      if (month % 6 === 0) {
        projectionData.push({
          month: month,
          monthLabel: month === 0 ? 'Hoje' : `${month}m`,
          value: accumulated
        });
      }
    }

    const totalInvested = monthlyContribution * months;
    const totalEarnings = accumulated - totalInvested;
    const willReachGoal = accumulated >= targetAmount;
    const monthsToGoal = willReachGoal ? months : null;

    // Se não atingir, calcular aporte necessário
    let requiredMonthlyContribution = monthlyContribution;
    if (!willReachGoal && targetAmount > 0) {
      // FV = PMT * [((1+r)^n - 1) / r]
      // Resolver para PMT
      const fv = targetAmount;
      const remainingNeeded = fv;
      requiredMonthlyContribution = remainingNeeded / (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) || 1);
    }

    setResult({
      finalValue: accumulated,
      totalInvested,
      totalEarnings,
      projectionData,
      willReachGoal,
      monthsToGoal,
      requiredMonthlyContribution: requiredMonthlyContribution > 0 ? requiredMonthlyContribution : 0
    });
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Calculator className="h-5 w-5 text-blue-400" />
          Simulador de Metas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Form */}
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <Label className="text-gray-400 text-xs">Meta (R$)</Label>
            <Input
              type="number"
              value={simulation.targetAmount}
              onChange={(e) => setSimulation({...simulation, targetAmount: e.target.value})}
              placeholder="500000"
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
          <div>
            <Label className="text-gray-400 text-xs">Aporte Mensal (R$)</Label>
            <Input
              type="number"
              value={simulation.monthlyContribution}
              onChange={(e) => setSimulation({...simulation, monthlyContribution: e.target.value})}
              placeholder="1000"
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
          <div>
            <Label className="text-gray-400 text-xs">Prazo (anos)</Label>
            <Select value={simulation.years} onValueChange={(value) => setSimulation({...simulation, years: value})}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="1">1 ano</SelectItem>
                <SelectItem value="3">3 anos</SelectItem>
                <SelectItem value="5">5 anos</SelectItem>
                <SelectItem value="10">10 anos</SelectItem>
                <SelectItem value="20">20 anos</SelectItem>
                <SelectItem value="30">30 anos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-gray-400 text-xs">Retorno Anual (%)</Label>
            <Input
              type="number"
              value={simulation.expectedReturn}
              onChange={(e) => setSimulation({...simulation, expectedReturn: e.target.value})}
              placeholder="12"
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
        </div>

        <Button onClick={runSimulation} className="bg-blue-600 hover:bg-blue-700 w-full">
          <Calculator className="h-4 w-4 mr-2" />
          Simular
        </Button>

        {/* Results */}
        {result && (
          <div className="space-y-6 pt-4 border-t border-gray-800">
            {/* Summary Cards */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-lg p-4 border border-violet-500/30">
                <p className="text-gray-400 text-xs mb-1">Valor Final Projetado</p>
                <p className="text-white text-2xl font-bold">
                  R$ {result.finalValue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg p-4 border border-green-500/30">
                <p className="text-gray-400 text-xs mb-1">Ganhos Totais</p>
                <p className="text-green-400 text-2xl font-bold">
                  R$ {result.totalEarnings.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg p-4 border border-blue-500/30">
                <p className="text-gray-400 text-xs mb-1">Total Investido</p>
                <p className="text-blue-400 text-2xl font-bold">
                  R$ {result.totalInvested.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>

            {/* Goal Achievement Status */}
            {simulation.targetAmount && (
              <Card className={`border-2 ${result.willReachGoal ? 'bg-green-500/5 border-green-500/30' : 'bg-amber-500/5 border-amber-500/30'}`}>
                <CardContent className="p-4">
                  {result.willReachGoal ? (
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-green-400" />
                      </div>
                      <div>
                        <p className="text-green-400 font-semibold">Meta Atingível! 🎉</p>
                        <p className="text-gray-300 text-sm">
                          Você alcançará R$ {parseFloat(simulation.targetAmount).toLocaleString('pt-BR')} em {simulation.years} anos
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                          <TrendingUp className="h-5 w-5 text-amber-400" />
                        </div>
                        <div>
                          <p className="text-amber-400 font-semibold">Ajuste Necessário</p>
                          <p className="text-gray-300 text-sm">
                            Para atingir sua meta, aumente o aporte mensal
                          </p>
                        </div>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-4 mt-3">
                        <p className="text-gray-400 text-sm mb-1">Aporte Mensal Necessário:</p>
                        <p className="text-white text-xl font-bold">
                          R$ {result.requiredMonthlyContribution.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Projection Chart */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Projeção de Crescimento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={result.projectionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="monthLabel" 
                        stroke="#9CA3AF"
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis 
                        stroke="#9CA3AF"
                        style={{ fontSize: '12px' }}
                        tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                        formatter={(value) => [`R$ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, 'Valor']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#8B5CF6" 
                        strokeWidth={3}
                        dot={{ fill: '#8B5CF6', r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}