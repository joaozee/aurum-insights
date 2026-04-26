import { Wallet, DollarSign, Percent, Coins } from "lucide-react";

export default function PortfolioSummary({ summary, transactions = [] }) {
  const formatCurrency = (value) => {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Calcular proventos recebidos nos últimos 12 meses (vendas como proxy de proventos)
  // Proventos = transações do tipo "venda" nos últimos 12 meses (consideramos dividendos registrados como vendas parciais)
  // Para uma aproximação melhor: soma das vendas nos últimos 12 meses
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

  const proventos12m = transactions
    .filter(t => t.type === "venda" && new Date(t.transaction_date) >= twelveMonthsAgo)
    .reduce((sum, t) => sum + (t.total_value || 0), 0);

  const totalProventos = transactions
    .filter(t => t.type === "venda")
    .reduce((sum, t) => sum + (t.total_value || 0), 0);

  const metrics = [
    {
      label: "Valor Investido",
      value: `R$ ${formatCurrency(summary.total_invested)}`,
      icon: Wallet,
      color: "text-blue-400",
      bg: "bg-blue-500/10"
    },
    {
      label: "Valor Atual",
      value: `R$ ${formatCurrency(summary.current_value)}`,
      icon: DollarSign,
      color: "text-violet-400",
      bg: "bg-violet-500/10"
    },
    {
      label: "Proventos Recebidos (12M)",
      value: `R$ ${formatCurrency(proventos12m)}`,
      subLabel: "Total",
      subValue: `R$ ${formatCurrency(totalProventos)}`,
      icon: Coins,
      color: "text-amber-400",
      bg: "bg-amber-500/10"
    },
    {
      label: "Rentabilidade",
      value: `${summary.profit_loss_percent >= 0 ? '+' : ''}${summary.profit_loss_percent.toFixed(2)}%`,
      icon: Percent,
      color: summary.profit_loss_percent >= 0 ? "text-emerald-400" : "text-red-400",
      bg: summary.profit_loss_percent >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"
    }
  ];

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {metrics.map((metric, idx) => {
        const Icon = metric.icon;
        return (
          <div
            key={idx}
            className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border border-gray-800 rounded-2xl p-6"
          >
            <div className={`h-12 w-12 rounded-xl ${metric.bg} flex items-center justify-center mb-4`}>
              <Icon className={`h-6 w-6 ${metric.color}`} />
            </div>
            <p className="text-gray-400 text-sm mb-1">{metric.label}</p>
            <p className={`text-2xl font-bold ${metric.color}`}>{metric.value}</p>
            {metric.subLabel && (
              <div className="mt-2">
                <p className="text-gray-500 text-xs">{metric.subLabel}</p>
                <p className="text-blue-400 text-sm font-medium">{metric.subValue}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}