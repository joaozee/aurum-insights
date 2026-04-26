import { Check, AlertCircle, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useState } from "react";

const CHECKLIST_ITEMS = [
  {
    category: "Análise Fundamentalista",
    items: [
      {
        id: "pe_valuation",
        title: "P/L Atrativo",
        description: "P/L menor que 7x",
        evaluate: (stock) => stock.pe_ratio && stock.pe_ratio <= 7,
        detail: (stock) => stock.pe_ratio ? `P/L: ${stock.pe_ratio.toFixed(2)}x` : "N/A"
      },
      {
        id: "pb_valuation",
        title: "P/VP Atrativo",
        description: "Preço/Valor Patrimonial menor que 1.25x",
        evaluate: (stock) => stock.pb_ratio && stock.pb_ratio <= 1.25,
        detail: (stock) => stock.pb_ratio ? `P/VP: ${stock.pb_ratio.toFixed(2)}x` : "N/A"
      },
      {
        id: "roe",
        title: "ROE Elevado",
        description: "Return on Equity acima de 15%",
        evaluate: (stock) => stock.fundamentals?.roe >= 15,
        detail: (stock) => stock.fundamentals?.roe ? `ROE: ${stock.fundamentals.roe.toFixed(2)}%` : "N/A"
      },
      {
        id: "profit_margin",
        title: "Margem Saudável",
        description: "Margem de lucro acima de 10%",
        evaluate: (stock) => stock.fundamentals?.profit_margin >= 10,
        detail: (stock) => stock.fundamentals?.profit_margin ? `Margem: ${stock.fundamentals.profit_margin.toFixed(2)}%` : "N/A"
      }
    ]
  },
  {
    category: "Saúde Financeira",
    items: [
      {
        id: "debt",
        title: "Dívida Controlada",
        description: "Dívida/Patrimônio menor que 1.0",
        evaluate: (stock) => {
          const debtToEquity = stock.fundamentals?.debt_to_equity || stock.fundamentals?.net_debt_to_equity;
          return debtToEquity != null && debtToEquity < 1.0;
        },
        detail: (stock) => {
          const debtToEquity = stock.fundamentals?.debt_to_equity || stock.fundamentals?.net_debt_to_equity;
          return debtToEquity != null ? `Dívida/Patrimônio: ${debtToEquity.toFixed(2)}` : "N/A";
        }
      },
      {
        id: "roa",
        title: "ROA Saudável",
        description: "Return on Assets acima de 7%",
        evaluate: (stock) => stock.fundamentals?.roa && stock.fundamentals.roa >= 7,
        detail: (stock) => stock.fundamentals?.roa ? `ROA: ${stock.fundamentals.roa.toFixed(2)}%` : "N/A"
      },
      {
        id: "revenue_growth",
        title: "Receita Crescente",
        description: "Empresa com receita estável/crescente",
        evaluate: (stock) => {
          const revenue = stock.fundamentals?.total_revenue;
          return revenue != null && revenue > 0;
        },
        detail: (stock) => {
          const revenue = stock.fundamentals?.total_revenue;
          if (revenue) {
            return revenue >= 1e9 
              ? `Receita: R$ ${(revenue/1e9).toFixed(2)}B` 
              : `Receita: R$ ${(revenue/1e6).toFixed(2)}M`;
          }
          return "N/A";
        }
      }
    ]
  },
  {
    category: "Retorno ao Acionista",
    items: [
      {
        id: "dividend",
        title: "Dividendos Atrativos",
        description: "Dividend Yield acima de 6%",
        evaluate: (stock) => stock.dividend_yield >= 6,
        detail: (stock) => stock.dividend_yield ? `Yield: ${stock.dividend_yield.toFixed(2)}%` : "N/A"
      },
      {
        id: "payout",
        title: "Distribuição Equilibrada",
        description: "Payout Ratio entre 40-60%",
        evaluate: (stock) => {
          const payout = stock.fundamentals?.payout_ratio;
          return payout && payout >= 40 && payout <= 60;
        },
        detail: (stock) => stock.fundamentals?.payout_ratio ? `Payout: ${stock.fundamentals.payout_ratio.toFixed(2)}%` : "N/A"
      }
    ]
  },
  {
    category: "Posicionamento de Mercado",
    items: [
      {
        id: "beta",
        title: "Preço Teto Projetivo",
        description: "Preço teto calculado com base nos fundamentos",
        evaluate: (stock) => {
          if (!stock.fundamentals?.earnings_per_share || !stock.current_price) return false;
          const projectedTarget = stock.fundamentals.earnings_per_share * 7;
          return projectedTarget > stock.current_price;
        },
        detail: (stock) => {
          if (stock.fundamentals?.earnings_per_share) {
            const projected = stock.fundamentals.earnings_per_share * 7;
            return `Preço teto projetivo: R$ ${projected.toFixed(2)}`;
          }
          if (stock.price_target) return `Preço teto: R$ ${stock.price_target.toFixed(2)}`;
          return "N/A";
        }
      }
    ]
  }
];

export default function InvestorChecklist({ stock }) {
  const [expandedCategory, setExpandedCategory] = useState(0);

  if (!stock) return null;

  const evaluateChecklist = () => {
    let totalItems = 0;
    let passedItems = 0;

    CHECKLIST_ITEMS.forEach(category => {
      category.items.forEach(item => {
        totalItems++;
        if (item.evaluate(stock)) {
          passedItems++;
        }
      });
    });

    return { passed: passedItems, total: totalItems };
  };

  const { passed, total } = evaluateChecklist();
  const scorePercentage = Math.round((passed / total) * 100);

  const getRecommendation = (percentage) => {
    if (percentage >= 80) return { text: "Excelente candidato", color: "text-emerald-400" };
    if (percentage >= 60) return { text: "Bom candidato", color: "text-blue-400" };
    if (percentage >= 40) return { text: "Candidato moderado", color: "text-amber-400" };
    return { text: "Candidato fraco", color: "text-red-400" };
  };

  const recommendation = getRecommendation(scorePercentage);

  return (
    <div className="space-y-4">
      {/* Score Overview */}
      <Card className="bg-gradient-to-br from-gray-900 to-violet-950/20 border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-semibold text-lg mb-1">Checklist do Investidor</h3>
            <p className="text-gray-400 text-sm">Critérios de investimento alinhados com sua estratégia</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-violet-400 mb-1">
              {scorePercentage}%
            </div>
            <p className={`text-sm font-medium ${recommendation.color}`}>
              {recommendation.text}
            </p>
          </div>
        </div>

        {/* Score Bar */}
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all ${
              scorePercentage >= 80 ? 'bg-emerald-500' :
              scorePercentage >= 60 ? 'bg-blue-500' :
              scorePercentage >= 40 ? 'bg-amber-500' :
              'bg-red-500'
            }`}
            style={{ width: `${scorePercentage}%` }}
          />
        </div>

        <div className="mt-3 text-xs text-gray-400">
          {passed} de {total} critérios atendidos
        </div>
      </Card>

      {/* Checklist por Categoria */}
      <div className="space-y-3">
        {CHECKLIST_ITEMS.map((category, categoryIdx) => {
          const categoryPassed = category.items.filter(item => item.evaluate(stock)).length;
          const isExpanded = expandedCategory === categoryIdx;

          return (
            <Card key={categoryIdx} className="bg-gray-900 border-gray-800 overflow-hidden">
              {/* Header */}
              <button
                onClick={() => setExpandedCategory(isExpanded ? -1 : categoryIdx)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="text-sm font-semibold text-white">{category.category}</div>
                  <div className="text-xs text-gray-400">
                    {categoryPassed}/{category.items.length}
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {isExpanded ? '−' : '+'}
                </div>
              </button>

              {/* Items */}
              {isExpanded && (
                <div className="border-t border-gray-800 divide-y divide-gray-800">
                  {category.items.map((item) => {
                    const passed = item.evaluate(stock);
                    
                    return (
                      <div key={item.id} className={`p-4 ${passed ? 'bg-emerald-950/20' : 'bg-gray-800/30'}`}>
                        <div className="flex items-start gap-3">
                          <div className={`h-5 w-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            passed ? 'bg-emerald-500/20' : 'bg-red-500/20'
                          }`}>
                            {passed ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <AlertCircle className="h-3 w-3 text-red-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className={`font-medium text-sm ${passed ? 'text-emerald-400' : 'text-gray-400'}`}>
                                {item.title}
                              </h4>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">{item.description}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              {item.detail(stock)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Dicas Finais */}
      <Card className="bg-blue-950/20 border-blue-500/30 p-4">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-400 font-medium mb-1">Dica de Investidor</p>
            <p className="text-xs text-blue-300">
              Use este checklist como guia, não como regra absoluta. Combine com sua análise técnica, 
              sentimento de mercado e objetivos pessoais antes de tomar uma decisão de investimento.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}