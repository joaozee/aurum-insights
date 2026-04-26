import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, DollarSign, Target, Shield, BarChart3, Activity, Percent } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, ResponsiveContainer, AreaChart, Area } from "recharts";

export default function CustomDashboard({ portfolio, assets, transactions, goals }) {
  const [kpis, setKpis] = useState(null);

  useEffect(() => {
    calculateKPIs();
  }, [portfolio, assets, transactions, goals]);

  const calculateKPIs = () => {
    if (!assets || assets.length === 0) {
      setKpis(null);
      return;
    }

    const totalInvested = assets.reduce((sum, a) => sum + (a.quantity * a.purchase_price), 0);
    const totalCurrent = assets.reduce((sum, a) => sum + (a.quantity * (a.current_price || a.purchase_price)), 0);
    const profitLoss = totalCurrent - totalInvested;
    const profitability = (profitLoss / totalInvested) * 100;

    // Variação mensal simulada
    const monthlyReturn = (Math.random() * 4 - 1).toFixed(2); // -1% a 3%

    // Diversificação
    const diversificationScore = Math.min((assets.length / 10) * 100, 100);

    // Risco (volatilidade simulada)
    const volatility = assets.reduce((sum, a) => {
      const variation = Math.abs(((a.current_price - a.purchase_price) / a.purchase_price) * 100);
      return sum + variation;
    }, 0) / assets.length || 5;

    // Progresso de metas
    const goalsProgress = goals.length > 0 
      ? (goals.reduce((sum, g) => sum + (g.current_amount / g.target_amount) * 100, 0) / goals.length)
      : 0;

    // Dados do mini gráfico (simulado)
    const miniChartData = Array.from({ length: 12 }, (_, i) => ({
      month: i,
      value: totalInvested * (1 + (Math.random() * 0.15 - 0.05))
    }));

    setKpis({
      totalInvested,
      totalCurrent,
      profitLoss,
      profitability,
      monthlyReturn: parseFloat(monthlyReturn),
      diversificationScore,
      volatility,
      goalsProgress,
      numAssets: assets.length,
      numGoals: goals.length,
      miniChartData
    });
  };

  if (!kpis) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
        <BarChart3 className="h-16 w-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Nenhum Dado Disponível</h3>
        <p className="text-gray-400">Adicione ativos à sua carteira para visualizar o dashboard</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main KPI Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={DollarSign}
          label="Patrimônio Total"
          value={`R$ ${kpis.totalCurrent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          change={kpis.profitability}
          chartData={kpis.miniChartData}
          iconColor="text-violet-400"
          iconBg="bg-violet-500/10"
        />

        <KPICard
          icon={TrendingUp}
          label="Lucro/Prejuízo"
          value={`R$ ${Math.abs(kpis.profitLoss).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          change={kpis.profitability}
          isNegative={kpis.profitLoss < 0}
          iconColor={kpis.profitLoss >= 0 ? "text-emerald-400" : "text-red-400"}
          iconBg={kpis.profitLoss >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"}
        />

        <KPICard
          icon={Activity}
          label="Rentabilidade"
          value={`${kpis.profitability >= 0 ? '+' : ''}${kpis.profitability.toFixed(2)}%`}
          subtitle={`${kpis.monthlyReturn >= 0 ? '+' : ''}${kpis.monthlyReturn}% no mês`}
          iconColor={kpis.profitability >= 0 ? "text-emerald-400" : "text-red-400"}
          iconBg={kpis.profitability >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"}
        />

        <KPICard
          icon={BarChart3}
          label="Ativos na Carteira"
          value={kpis.numAssets}
          subtitle={`Score de diversificação: ${kpis.diversificationScore.toFixed(0)}/100`}
          iconColor="text-amber-400"
          iconBg="bg-amber-500/10"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          icon={Shield}
          title="Nível de Risco"
          value={kpis.volatility > 10 ? "Alto" : kpis.volatility > 5 ? "Moderado" : "Baixo"}
          subtitle={`Volatilidade: ${kpis.volatility.toFixed(2)}%`}
          progress={Math.min((kpis.volatility / 15) * 100, 100)}
          color={kpis.volatility > 10 ? "red" : kpis.volatility > 5 ? "amber" : "emerald"}
        />

        <MetricCard
          icon={Target}
          title="Progresso das Metas"
          value={`${kpis.goalsProgress.toFixed(0)}%`}
          subtitle={`${kpis.numGoals} metas ativas`}
          progress={kpis.goalsProgress}
          color="violet"
        />

        <MetricCard
          icon={Percent}
          title="Investido vs Atual"
          value={`R$ ${(kpis.totalCurrent - kpis.totalInvested).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
          subtitle={`Investido: R$ ${kpis.totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
          progress={(kpis.totalCurrent / kpis.totalInvested) * 100 - 100}
          color={kpis.profitLoss >= 0 ? "emerald" : "red"}
          showProgressBar={false}
        />
      </div>

      {/* Performance Highlights */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-violet-950/30 rounded-2xl border border-gray-800 p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-white mb-4">Destaques de Performance</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <HighlightCard
            label="Melhor Rentabilidade"
            value={getBestPerformer(assets)}
            icon={TrendingUp}
            color="emerald"
          />
          <HighlightCard
            label="Maior Posição"
            value={getLargestPosition(assets)}
            icon={BarChart3}
            color="violet"
          />
          <HighlightCard
            label="Meta Mais Próxima"
            value={getClosestGoal(goals)}
            icon={Target}
            color="amber"
          />
        </div>
      </div>
    </div>
  );
}

function KPICard({ icon: Icon, label, value, change, subtitle, chartData, iconColor, iconBg, isNegative }) {
  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 rounded-2xl border border-gray-800 p-5 shadow-xl hover:shadow-2xl transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`h-10 w-10 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        {chartData && (
          <div className="w-20 h-8">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="miniGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#8B5CF6" 
                  strokeWidth={2}
                  fill="url(#miniGrad)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className="text-white text-2xl font-bold mb-1">{value}</p>
      {change !== undefined && (
        <div className="flex items-center gap-1">
          {change >= 0 ? (
            <TrendingUp className="h-3 w-3 text-emerald-400" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-400" />
          )}
          <span className={`text-xs font-medium ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {change >= 0 ? '+' : ''}{change.toFixed(2)}%
          </span>
        </div>
      )}
      {subtitle && (
        <p className="text-gray-500 text-xs mt-1">{subtitle}</p>
      )}
    </div>
  );
}

function MetricCard({ icon: Icon, title, value, subtitle, progress, color, showProgressBar = true }) {
  const colorClasses = {
    violet: { text: "text-violet-400", bg: "bg-violet-500/10", progress: "bg-violet-500" },
    emerald: { text: "text-emerald-400", bg: "bg-emerald-500/10", progress: "bg-emerald-500" },
    amber: { text: "text-amber-400", bg: "bg-amber-500/10", progress: "bg-amber-500" },
    red: { text: "text-red-400", bg: "bg-red-500/10", progress: "bg-red-500" }
  };

  const colors = colorClasses[color];

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 shadow-lg">
      <div className="flex items-start gap-3 mb-4">
        <div className={`h-10 w-10 rounded-xl ${colors.bg} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`h-5 w-5 ${colors.text}`} />
        </div>
        <div className="flex-1">
          <p className="text-gray-400 text-xs mb-1">{title}</p>
          <p className={`text-2xl font-bold ${colors.text}`}>{value}</p>
        </div>
      </div>
      {showProgressBar && progress !== undefined && (
        <div className="space-y-1">
          <Progress value={Math.min(progress, 100)} className="h-2" />
        </div>
      )}
      <p className="text-gray-500 text-xs mt-2">{subtitle}</p>
    </div>
  );
}

function HighlightCard({ label, value, icon: Icon, color }) {
  const colorClasses = {
    violet: { text: "text-violet-400", bg: "bg-violet-500/10" },
    emerald: { text: "text-emerald-400", bg: "bg-emerald-500/10" },
    amber: { text: "text-amber-400", bg: "bg-amber-500/10" }
  };

  const colors = colorClasses[color];

  return (
    <div className={`${colors.bg} rounded-xl p-4 border border-gray-700`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${colors.text}`} />
        <p className="text-gray-400 text-xs">{label}</p>
      </div>
      <p className={`text-lg font-bold ${colors.text}`}>{value}</p>
    </div>
  );
}

function getBestPerformer(assets) {
  if (!assets || assets.length === 0) return "N/A";
  
  const best = assets.reduce((best, asset) => {
    const perf = ((asset.current_price - asset.purchase_price) / asset.purchase_price) * 100;
    const bestPerf = ((best.current_price - best.purchase_price) / best.purchase_price) * 100;
    return perf > bestPerf ? asset : best;
  }, assets[0]);

  const performance = ((best.current_price - best.purchase_price) / best.purchase_price) * 100;
  return `${best.ticker} (+${performance.toFixed(1)}%)`;
}

function getLargestPosition(assets) {
  if (!assets || assets.length === 0) return "N/A";
  
  const largest = assets.reduce((max, asset) => {
    const value = asset.quantity * asset.current_price;
    const maxValue = max.quantity * max.current_price;
    return value > maxValue ? asset : max;
  }, assets[0]);

  const total = assets.reduce((sum, a) => sum + a.quantity * a.current_price, 0);
  const percentage = (largest.quantity * largest.current_price / total) * 100;
  
  return `${largest.ticker} (${percentage.toFixed(1)}%)`;
}

function getClosestGoal(goals) {
  if (!goals || goals.length === 0) return "Nenhuma meta";
  
  const closest = goals.reduce((closest, goal) => {
    const progress = (goal.current_amount / goal.target_amount) * 100;
    const closestProgress = (closest.current_amount / closest.target_amount) * 100;
    return Math.abs(100 - progress) < Math.abs(100 - closestProgress) ? goal : closest;
  }, goals[0]);

  const progress = (closest.current_amount / closest.target_amount) * 100;
  return `${closest.title} (${progress.toFixed(0)}%)`;
}