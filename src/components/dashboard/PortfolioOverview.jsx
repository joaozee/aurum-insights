import { TrendingUp, TrendingDown, Wallet, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PortfolioOverview({ portfolio }) {
  const gain = portfolio?.current_value - portfolio?.total_invested || 0;
  const gainPercent = portfolio?.total_invested ? (gain / portfolio.total_invested) * 100 : 0;
  const isPositive = gain >= 0;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-violet-950/40 to-gray-900 border border-violet-500/20 shadow-2xl">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-amber-500/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4" />
      
      <div className="relative z-10 p-8">
        {/* Main value */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-4">
            <Wallet className="h-4 w-4 text-violet-400" />
            <span className="text-violet-300 text-sm font-medium">Patrimônio Total</span>
          </div>
          <h2 className="text-5xl sm:text-6xl font-bold text-white tracking-tight">
            R$ {(portfolio?.current_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
          <div className={cn(
            "inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full",
            isPositive ? "bg-emerald-500/10 border border-emerald-500/30" : "bg-red-500/10 border border-red-500/30"
          )}>
            {isPositive ? <TrendingUp className="h-4 w-4 text-emerald-400" /> : <TrendingDown className="h-4 w-4 text-red-400" />}
            <span className={cn("font-semibold", isPositive ? "text-emerald-400" : "text-red-400")}>
              {isPositive ? "+" : ""}{gainPercent.toFixed(2)}% total
            </span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Investido */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:border-violet-500/30 transition-all">
            <p className="text-gray-400 text-sm mb-2">Valor Investido</p>
            <p className="text-xl sm:text-2xl font-bold text-white">
              R$ {(portfolio?.total_invested || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
            </p>
          </div>

          {/* Ganho/Perda */}
          <div className={cn(
            "backdrop-blur-sm rounded-2xl p-5 border transition-all",
            isPositive 
              ? "bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40" 
              : "bg-red-500/5 border-red-500/20 hover:border-red-500/40"
          )}>
            <p className="text-gray-400 text-sm mb-2">Lucro / Prejuízo</p>
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-xl sm:text-2xl font-bold",
                isPositive ? "text-emerald-400" : "text-red-400"
              )}>
                {isPositive ? "+" : "-"} R$ {Math.abs(gain).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          {/* Variação do dia */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:border-violet-500/30 transition-all">
            <p className="text-gray-400 text-sm mb-2">Variação Hoje</p>
            <div className="flex items-center gap-2">
              {(portfolio?.daily_variation || 0) >= 0 ? (
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-400" />
              )}
              <span className={cn(
                "text-xl font-bold",
                (portfolio?.daily_variation || 0) >= 0 ? "text-emerald-400" : "text-red-400"
              )}>
                {(portfolio?.daily_variation_percent || 0) >= 0 ? "+" : ""}{(portfolio?.daily_variation_percent || 0).toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Renda passiva */}
          <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 backdrop-blur-sm rounded-2xl p-5 border border-violet-500/30 hover:border-violet-500/50 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-violet-400" />
              <p className="text-violet-300 text-sm">Renda Passiva</p>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-violet-300">
              R$ {(portfolio?.monthly_passive_income || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
              <span className="text-sm font-normal text-violet-400">/mês</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}