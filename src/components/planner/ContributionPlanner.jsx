import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Calculator, Calendar, Target } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

export default function ContributionPlanner({ goals }) {
  const [projectionData, setProjectionData] = useState([]);

  useEffect(() => {
    calculateProjections();
  }, [goals]);

  const calculateProjections = () => {
    if (!goals || goals.length === 0) return;

    // Simular projeção de aportes mensais
    const monthlyRate = 0.08 / 12; // 8% ao ano
    const totalMonthlyContribution = goals.reduce((sum, g) => sum + (g.monthly_contribution || 0), 0);

    const projections = [];
    let accumulated = 0;

    for (let month = 0; month <= 60; month++) {
      accumulated = accumulated * (1 + monthlyRate) + totalMonthlyContribution;
      
      if (month % 6 === 0) {
        projections.push({
          month: month,
          monthLabel: `${month}m`,
          value: accumulated,
            invested: totalMonthlyContribution * month
        });
      }
    }

    setProjectionData(projections);
  };

  const totalMonthlyContribution = goals.reduce((sum, g) => sum + (g.monthly_contribution || 0), 0);
  const annualContribution = totalMonthlyContribution * 12;
  const projectedIn5Years = projectionData[projectionData.length - 1]?.value || 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <p className="text-gray-400 text-xs">Aporte Mensal Total</p>
                <p className="text-white text-xl font-bold">
                  R$ {totalMonthlyContribution.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-gray-400 text-xs">Aporte Anual</p>
                <p className="text-white text-xl font-bold">
                  R$ {annualContribution.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Target className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-gray-400 text-xs">Projeção em 5 Anos</p>
                <p className="text-white text-xl font-bold">
                  R$ {projectedIn5Years.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projection Chart */}
      {projectionData.length > 0 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calculator className="h-5 w-5 text-violet-400" />
              Projeção de Crescimento com Aportes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projectionData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6B7280" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6B7280" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
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
                    formatter={(value) => [`R$ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, '']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="invested" 
                    stroke="#6B7280" 
                    fillOpacity={1} 
                    fill="url(#colorInvested)"
                    name="Investido"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#8B5CF6" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorValue)"
                    name="Valor Projetado"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-violet-500"></div>
                <span className="text-gray-400 text-xs">Valor Projetado (com rendimento)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-gray-500"></div>
                <span className="text-gray-400 text-xs">Total Investido</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Breakdown */}
      {goals.length > 0 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Distribuição Mensal por Meta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {goals.map((goal) => {
                const percentage = totalMonthlyContribution > 0 
                  ? ((goal.monthly_contribution / totalMonthlyContribution) * 100).toFixed(1)
                  : 0;
                
                return (
                  <div key={goal.id} className="flex items-center justify-between bg-gray-800/50 rounded-lg p-4">
                    <div className="flex-1">
                      <p className="text-white font-medium">{goal.title}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-violet-500 to-purple-600 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-gray-400 text-xs w-12 text-right">{percentage}%</span>
                      </div>
                    </div>
                    <div className="ml-6 text-right">
                      <p className="text-white font-semibold">
                        R$ {(goal.monthly_contribution || 0).toLocaleString('pt-BR')}
                      </p>
                      <p className="text-gray-400 text-xs">por mês</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}