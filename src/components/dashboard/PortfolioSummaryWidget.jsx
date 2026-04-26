import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Activity } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";

export default function PortfolioSummaryWidget({ portfolio, assets }) {
  const variation = portfolio?.daily_variation || 0;
  const variationPercent = portfolio?.daily_variation_percent || 0;
  const currentValue = portfolio?.current_value || 0;
  const passiveIncome = portfolio?.monthly_passive_income || 0;

  // Gerar dados simulados de evolução dos últimos 7 dias
  const chartData = [
    { day: 'Dom', value: currentValue * 0.97 },
    { day: 'Seg', value: currentValue * 0.98 },
    { day: 'Ter', value: currentValue * 0.99 },
    { day: 'Qua', value: currentValue * 0.985 },
    { day: 'Qui', value: currentValue * 0.995 },
    { day: 'Sex', value: currentValue * 1.005 },
    { day: 'Sáb', value: currentValue }
  ];

  const isPositive = variation >= 0;

  return (
    <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 p-4 lg:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
            <Activity className="h-4 w-4 text-violet-400" />
          </div>
          <h3 className="font-semibold text-white text-sm lg:text-base">Performance da Carteira</h3>
        </div>
        {isPositive ? (
          <TrendingUp className="h-5 w-5 text-emerald-400" />
        ) : (
          <TrendingDown className="h-5 w-5 text-red-400" />
        )}
      </div>

      <div className="space-y-4">
        {/* Valor Total */}
        <div>
          <p className="text-xs lg:text-sm text-gray-400 mb-1">Patrimônio Total</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl lg:text-3xl font-bold text-white">
              R$ {currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Variação do Dia */}
        <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Variação do Dia</p>
            <p className={cn(
              "text-base lg:text-lg font-semibold",
              isPositive ? "text-emerald-400" : "text-red-400"
            )}>
              {isPositive ? "+" : ""}{variationPercent.toFixed(2)}%
            </p>
          </div>
          <p className={cn(
            "text-sm lg:text-base font-medium",
            isPositive ? "text-emerald-400" : "text-red-400"
          )}>
            {isPositive ? "+" : ""}R$ {Math.abs(variation).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* Gráfico de Evolução */}
        <div className="h-24 lg:h-28">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Valor']}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={isPositive ? "#34D399" : "#F87171"}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Renda Passiva */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-700">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-amber-400" />
            <p className="text-xs lg:text-sm text-gray-400">Renda Passiva/Mês</p>
          </div>
          <p className="text-sm lg:text-base font-semibold text-amber-400">
            R$ {passiveIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    </Card>
  );
}