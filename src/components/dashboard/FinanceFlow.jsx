import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

export default function FinanceFlow({ finance }) {
  const balance = (finance?.total_income || 0) - (finance?.total_expenses || 0);
  const expensePercent = finance?.total_income ? ((finance.total_expenses / finance.total_income) * 100).toFixed(0) : 0;
  const savingsPercent = finance?.total_income ? ((balance / finance.total_income) * 100).toFixed(0) : 0;

  const items = [
    {
      label: "Entradas",
      value: finance?.total_income || 0,
      icon: TrendingUp,
      color: "emerald",
      bgGradient: "from-emerald-500/10 to-teal-500/5",
      borderColor: "border-emerald-500/20",
      iconBg: "bg-emerald-500/20",
      textColor: "text-emerald-400"
    },
    {
      label: "Saídas",
      value: finance?.total_expenses || 0,
      icon: TrendingDown,
      color: "red",
      bgGradient: "from-red-500/10 to-orange-500/5",
      borderColor: "border-red-500/20",
      iconBg: "bg-red-500/20",
      textColor: "text-red-400",
      subtitle: `${expensePercent}% das entradas`
    },
    {
      label: "Saldo Livre",
      value: Math.abs(balance),
      icon: Wallet,
      color: balance >= 0 ? "violet" : "orange",
      bgGradient: balance >= 0 ? "from-violet-500/10 to-purple-500/5" : "from-orange-500/10 to-red-500/5",
      borderColor: balance >= 0 ? "border-violet-500/20" : "border-orange-500/20",
      iconBg: balance >= 0 ? "bg-violet-500/20" : "bg-orange-500/20",
      textColor: balance >= 0 ? "text-violet-400" : "text-orange-400",
      subtitle: `${savingsPercent}% para investir`,
      isNegative: balance < 0
    }
  ];

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-violet-950/30 rounded-2xl border border-gray-800 p-6 shadow-xl h-full">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white">Fluxo do Mês</h3>
        <p className="text-gray-500 text-sm">Entradas e saídas</p>
      </div>

      <div className="space-y-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div 
              key={item.label}
              className={cn(
                "rounded-xl p-4 bg-gradient-to-r border transition-all hover:scale-[1.02]",
                item.bgGradient,
                item.borderColor
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", item.iconBg)}>
                    <Icon className={cn("h-5 w-5", item.textColor)} />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">{item.label}</p>
                    {item.subtitle && (
                      <p className={cn("text-xs", item.textColor)}>{item.subtitle}</p>
                    )}
                  </div>
                </div>
                <p className={cn("text-xl font-bold", item.textColor)}>
                  {item.isNegative ? "-" : ""}R$ {item.value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}