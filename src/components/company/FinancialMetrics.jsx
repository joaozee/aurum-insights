import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const metricsInfo = {
  "P/L": "Price to Earnings - Quantas vezes o preço da ação representa o lucro anual",
  "PRECEITA (PSR)": "Price to Sales Ratio - Relação entre preço da ação e receita",
  "P/VP": "Preço sobre Valor Patrimonial - Compara preço com patrimônio líquido",
  "DIVIDEND YIELD": "Porcentagem de retorno anual através de dividendos",
  "PAYOUT": "Percentual do lucro distribuído como dividendos",
  "MARGEM LÍQUIDA": "Porcentagem de lucro em relação à receita total",
  "MARGEM BRUTA": "Lucro antes de despesas operacionais",
  "MARGEM EBIT": "Lucro operacional antes de juros e impostos",
  "EV/EBIT": "Enterprise Value dividido pelo EBIT",
  "P/EBIT": "Preço da ação dividido pelo EBIT",
  "P/ATIVO": "Preço em relação ao ativo total",
  "P/CAP.GIRO": "Preço em relação ao capital de giro",
  "P/ATIVO CIRC LIQ": "Preço comparado ao ativo circulante líquido",
  "VPA": "Valor Patrimonial por Ação",
  "LPA": "Lucro Por Ação",
  "GIRO ATIVOS": "Eficiência na utilização de ativos",
  "ROE": "Retorno sobre Patrimônio Líquido",
  "ROIC": "Retorno sobre Capital Investido",
  "ROA": "Retorno sobre Ativos Totais",
  "PATRIMÔNIO / ATIVOS": "Índice de alavancagem financeira",
  "PASSIVOS / ATIVOS": "Proporção de dívidas em relação aos ativos",
  "LIQUIDEZ CORRENTE": "Capacidade de pagar dívidas de curto prazo",
  "CAGR RECEITAS 5 ANOS": "Taxa anual de crescimento de receita",
  "CAGR LUCROS 5 ANOS": "Taxa anual de crescimento de lucro"
};

const mockMetrics = {
  "P/L": "10,03",
  "PRECEITA (PSR)": "1,13",
  "P/VP": "2,04",
  "DIVIDEND YIELD": "11,87%",
  "PAYOUT": "116,03%",
  "MARGEM LÍQUIDA": "11,26%",
  "MARGEM BRUTA": "34,81%",
  "MARGEM EBIT": "12,69%",
  "EV/EBIT": "8,59",
  "P/EBIT": "8,90",
  "P/ATIVO": "0,15",
  "P/CAP.GIRO": "0,80",
  "P/ATIVO CIRC LIQ": "-2,39",
  "VPA": "19,49",
  "LPA": "3,97",
  "GIRO ATIVOS": "0,13",
  "ROE": "20,37%",
  "ROIC": "20,86%",
  "ROA": "1,51%",
  "PATRIMÔNIO / ATIVOS": "0,07",
  "PASSIVOS / ATIVOS": "0,92",
  "LIQUIDEZ CORRENTE": "1,25",
  "CAGR RECEITAS 5 ANOS": "14,72%",
  "CAGR LUCROS 5 ANOS": "9,57%"
};

export default function FinancialMetrics({ stock }) {
  if (!stock) return null;

  const fundamentals = stock.fundamentals || {};
  
  const metrics = {
    "P/L": stock.pe_ratio?.toFixed(2) || "N/A",
    "P/VP": stock.pb_ratio?.toFixed(2) || "N/A",
    "DIVIDEND YIELD": stock.dividend_yield ? `${stock.dividend_yield.toFixed(2)}%` : "N/A",
    "PAYOUT": fundamentals.payout_ratio ? `${fundamentals.payout_ratio.toFixed(2)}%` : "N/A",
    "MARGEM LÍQUIDA": fundamentals.profit_margin ? `${fundamentals.profit_margin.toFixed(2)}%` : "N/A",
    "MARGEM OPERACIONAL": fundamentals.operating_margin ? `${fundamentals.operating_margin.toFixed(2)}%` : "N/A",
    "ROE": fundamentals.roe ? `${fundamentals.roe.toFixed(2)}%` : "N/A",
    "ROA": fundamentals.roa ? `${fundamentals.roa.toFixed(2)}%` : "N/A",
    "VPA": fundamentals.book_value_per_share?.toFixed(2) || "N/A",
    "LPA": fundamentals.earnings_per_share?.toFixed(2) || "N/A",
    "LIQUIDEZ CORRENTE": fundamentals.current_ratio?.toFixed(2) || "N/A",
    "DÍVIDA/PATRIMÔNIO": fundamentals.debt_to_equity?.toFixed(2) || "N/A",
    "BETA": fundamentals.beta?.toFixed(2) || "N/A",
    "MÁX 52 SEM": fundamentals.week_high_52 ? `R$ ${fundamentals.week_high_52.toFixed(2)}` : "N/A",
    "MÍN 52 SEM": fundamentals.week_low_52 ? `R$ ${fundamentals.week_low_52.toFixed(2)}` : "N/A",
    "VOLUME MÉDIO": fundamentals.avg_volume ? `${(fundamentals.avg_volume / 1000000).toFixed(1)}M` : "N/A"
  };

  const metricsArray = Object.entries(metrics);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
      <h3 className="text-xl font-semibold text-white mb-6">Análise Fundamentalista</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metricsArray.map(([key, value]) => (
          <div key={key} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <p className="text-gray-400 text-xs font-medium">{key}</p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-gray-600 cursor-help hover:text-gray-400 transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-gray-800 border border-gray-700 text-gray-300 text-xs max-w-xs">
                    {metricsInfo[key]}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-white font-bold text-lg">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}