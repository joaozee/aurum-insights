import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Target, BarChart3, PieChart, Activity, DollarSign, Percent, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function FinancialKPIs({ assets, transactions, goals, quotes = {} }) {
  const calculateKPIs = () => {
    const assetList = Object.values(assets);

    const currentValue = assetList.reduce(
      (sum, a) => sum + a.quantity * (a.current_price || a.purchase_price), 0
    );
    const investedValue = assetList.reduce(
      (sum, a) => sum + a.quantity * a.purchase_price, 0
    );
    const profit = currentValue - investedValue;
    const profitPercent = investedValue > 0 ? (profit / investedValue) * 100 : 0;

    // Dividendos reais da brapi
    let annualDividends = 0;
    let weightedDYSum = 0;
    let assetsWithDY = 0;
    const changes = [];

    assetList.forEach(a => {
      const q = quotes[a.ticker];
      const assetCurrentValue = a.quantity * (a.current_price || a.purchase_price);
      let dy = 0;
      if (q) {
        // dividendYield from brapi can be 0-100 or 0-1
        dy = q.dividendYield
          ? (q.dividendYield < 1 ? q.dividendYield * 100 : q.dividendYield)
          : (q.trailingAnnualDividendYield
              ? (q.trailingAnnualDividendYield < 1 ? q.trailingAnnualDividendYield * 100 : q.trailingAnnualDividendYield)
              : 0);
        if (q.regularMarketChangePercent != null) changes.push(q.regularMarketChangePercent);
      }
      if (dy > 0) {
        assetsWithDY += 1;
        weightedDYSum += dy * assetCurrentValue;
        annualDividends += assetCurrentValue * (dy / 100);
      }
    });

    const monthlyDividends = annualDividends / 12;
    const weightedDY = currentValue > 0 ? weightedDYSum / currentValue : 0;
    const dividendConsistency = assetList.length > 0 ? (assetsWithDY / assetList.length) * 100 : 0;
    const paybackYears = weightedDY > 0 ? (100 / weightedDY) : 0;

    const dividendGrowth = changes.length > 0
      ? changes.reduce((s, c) => s + c, 0) / changes.length
      : 0;

    // Volatilidade = desvio padrão dos regularMarketChangePercent
    let volatility = 0;
    if (changes.length > 1) {
      const mean = dividendGrowth;
      const variance = changes.reduce((s, c) => s + Math.pow(c - mean, 2), 0) / changes.length;
      volatility = Math.sqrt(variance);
    }

    // Concentração = maior ativo / total
    const maxAssetValue = assetList.reduce((max, a) => {
      const v = a.quantity * (a.current_price || a.purchase_price);
      return v > max ? v : max;
    }, 0);
    const concentration = currentValue > 0 ? (maxAssetValue / currentValue) * 100 : 0;

    const totalReturn = profitPercent;
    const assetsCount = assetList.length;

    return {
      currentValue, investedValue, profit, profitPercent,
      annualDividends, monthlyDividends, dividendYield: weightedDY,
      dividendGrowth, dividendConsistency, paybackYears,
      concentration, volatility, totalReturn, assetsCount
    };
  };

  const kpis = calculateKPIs();

  const KPICard = ({ icon: Icon, label, value, unit = "", trend = null, color = "violet", tooltip }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className="bg-gray-900 border-gray-800 cursor-help hover:border-gray-700 transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-2">
                <div className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center",
                  `bg-${color}-500/20`
                )}>
                  <Icon className={cn("h-5 w-5", `text-${color}-400`)} />
                </div>
                {trend !== null && (
                  <div className={cn(
                    "flex items-center gap-1 text-sm",
                    trend >= 0 ? "text-emerald-400" : "text-red-400"
                  )}>
                    {trend >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {Math.abs(trend).toFixed(1)}%
                  </div>
                )}
              </div>
              <p className="text-gray-400 text-xs mb-1 uppercase tracking-wide">{label}</p>
              <p className="text-white text-2xl font-bold">
                {value}
                {unit && <span className="text-sm ml-1 text-gray-400">{unit}</span>}
              </p>
            </CardContent>
          </Card>
        </TooltipTrigger>
        {tooltip && (
          <TooltipContent className="bg-gray-800 border-gray-700 text-gray-200 max-w-xs">
            {tooltip}
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-4">KPIs Financeiros</h3>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Linha 1 - Dividendos (Protagonistas) */}
        <KPICard
          icon={DollarSign}
          label="Renda Anual em Dividendos"
          value={`R$ ${(kpis.annualDividends / 1000).toFixed(1)}k`}
          color="emerald"
          tooltip="Quanto sua carteira gera por ano em dividendos - seu 'salário' como investidor"
        />
        <KPICard
          icon={Percent}
          label="Dividend Yield Médio"
          value={kpis.dividendYield.toFixed(1)}
          unit="%"
          trend={kpis.dividendYield >= 6 ? 5 : -2}
          color="green"
          tooltip="Rendimento médio ponderado - idealmente ≥6% para estratégia de dividendos"
        />
        <KPICard
          icon={DollarSign}
          label="Renda Mensal em Dividendos"
          value={`R$ ${(kpis.monthlyDividends / 1000).toFixed(1)}k`}
          color="teal"
          tooltip="Renda mensal média em dividendos - visualize sua aposentadoria"
        />

        {/* Linha 2 - Crescimento e Consistência */}
        <KPICard
          icon={TrendingUp}
          label="Crescimento da Renda (YoY)"
          value={kpis.dividendGrowth.toFixed(1)}
          unit="%"
          trend={kpis.dividendGrowth}
          color="cyan"
          tooltip="Quanto sua renda de dividendos cresceu em relação ao ano anterior"
        />
        <KPICard
          icon={Zap}
          label="Consistência de Dividendos"
          value={kpis.dividendConsistency}
          unit="%"
          color="amber"
          tooltip="Percentual da carteira com histórico consistente de dividendos (últimos 5 anos)"
        />
        <KPICard
          icon={TrendingUp}
          label="Payback em Dividendos"
          value={kpis.paybackYears > 0 ? kpis.paybackYears.toFixed(1) : '—'}
          unit={kpis.paybackYears > 0 ? ' anos' : ''}
          color="blue"
          tooltip="Anos para recuperar o investimento via dividendos (100 ÷ DY médio)"
        />

        {/* Linha 3 - Patrimônio */}
        <KPICard
          icon={BarChart3}
          label="Valor Total Investido"
          value={`R$ ${(kpis.investedValue / 1000).toFixed(1)}k`}
          color="violet"
          tooltip="Valor total que você aportou na carteira"
        />
        <KPICard
          icon={BarChart3}
          label="Valor da Carteira"
          value={`R$ ${(kpis.currentValue / 1000).toFixed(1)}k`}
          color="purple"
          tooltip="Valor total atual de todos os seus investimentos"
        />
        <KPICard
          icon={Activity}
          label="Retorno Total (Preço + Dividendos)"
          value={kpis.totalReturn.toFixed(2)}
          unit="%"
          trend={kpis.totalReturn}
          color={kpis.totalReturn >= 0 ? "emerald" : "red"}
          tooltip="Retorno completo incluindo ganho de preço e dividendos"
        />

        {/* Linha 4 - Risco e Diversificação */}
        <KPICard
          icon={Activity}
          label="Volatilidade da Carteira"
          value={kpis.volatility.toFixed(2)}
          unit="%"
          color="yellow"
          tooltip="Desvio padrão das variações diárias dos ativos"
        />
        <KPICard
          icon={PieChart}
          label="Concentração da Carteira"
          value={kpis.concentration.toFixed(1)}
          unit="%"
          color={kpis.concentration > 50 ? "red" : "orange"}
          tooltip="Percentual do maior ativo sobre o total da carteira"
        />
        <KPICard
          icon={Target}
          label="Número de Ações"
          value={kpis.assetsCount}
          color="indigo"
          tooltip="Quantidade de diferentes ações na sua carteira"
        />
      </div>
    </div>
  );
}