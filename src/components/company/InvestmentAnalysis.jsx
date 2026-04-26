import { AlertCircle, TrendingUp, Target, Zap, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";

const STRATEGY_METRICS = {
  dividends: {
    icon: TrendingUp,
    label: "Estratégia: Renda Passiva",
    metrics: ["dividend_yield", "payout_ratio", "consistency"]
  },
  growth: {
    icon: Target,
    label: "Estratégia: Crescimento",
    metrics: ["pe_ratio", "pb_ratio", "roe", "roa"]
  },
  value: {
    icon: Shield,
    label: "Estratégia: Valor",
    metrics: ["pb_ratio", "pe_ratio", "debt_to_equity", "dividend_yield"]
  },
  quality: {
    icon: Zap,
    label: "Estratégia: Qualidade",
    metrics: ["roe", "roa", "debt_to_equity", "profit_margin"]
  }
};

const METRIC_ANALYSIS = {
  dividend_yield: {
    name: "Dividend Yield",
    excellent: (v) => v >= 7,
    good: (v) => v >= 5,
    neutral: (v) => v >= 3,
    analysis: (v) => {
      if (v >= 7) return "Excelente gerador de renda passiva";
      if (v >= 5) return "Bom retorno por dividendos";
      if (v >= 3) return "Retorno moderado de dividendos";
      return "Baixo rendimento de dividendos";
    }
  },
  pe_ratio: {
    name: "P/L (Price/Earnings)",
    excellent: (v) => v <= 8,
    good: (v) => v <= 12,
    neutral: (v) => v <= 18,
    analysis: (v) => {
      if (v <= 8) return "Ação bastante desvalorizada";
      if (v <= 12) return "Ação com bom valor";
      if (v <= 18) return "Valor intermediário";
      return "Ação cara em relação aos lucros";
    }
  },
  pb_ratio: {
    name: "P/VP (Price/Book)",
    excellent: (v) => v <= 0.8,
    good: (v) => v <= 1.2,
    neutral: (v) => v <= 1.8,
    analysis: (v) => {
      if (v <= 0.8) return "Negociando abaixo do valor patrimonial";
      if (v <= 1.2) return "Próximo do valor patrimonial";
      if (v <= 1.8) return "Acima do valor patrimonial";
      return "Bastante acima do valor patrimonial";
    }
  },
  roe: {
    name: "ROE (Return on Equity)",
    excellent: (v) => v >= 20,
    good: (v) => v >= 15,
    neutral: (v) => v >= 10,
    analysis: (v) => {
      if (v >= 20) return "Empresa muito lucrativa";
      if (v >= 15) return "Boa geração de lucro";
      if (v >= 10) return "Lucro satisfatório";
      return "Baixa geração de lucro";
    }
  },
  roa: {
    name: "ROA (Return on Assets)",
    excellent: (v) => v >= 10,
    good: (v) => v >= 7,
    neutral: (v) => v >= 5,
    analysis: (v) => {
      if (v >= 10) return "Usa ativos muito eficientemente";
      if (v >= 7) return "Bom uso dos ativos";
      if (v >= 5) return "Uso moderado dos ativos";
      return "Uso ineficiente dos ativos";
    }
  },
  debt_to_equity: {
    name: "Dívida/Patrimônio",
    excellent: (v) => v <= 0.4,
    good: (v) => v <= 0.8,
    neutral: (v) => v <= 1.2,
    analysis: (v) => {
      if (v <= 0.4) return "Endividamento muito baixo";
      if (v <= 0.8) return "Endividamento saudável";
      if (v <= 1.2) return "Endividamento moderado";
      return "Endividamento elevado";
    }
  },
  profit_margin: {
    name: "Margem de Lucro",
    excellent: (v) => v >= 15,
    good: (v) => v >= 10,
    neutral: (v) => v >= 5,
    analysis: (v) => {
      if (v >= 15) return "Empresa muito eficiente";
      if (v >= 10) return "Boa margem de lucro";
      if (v >= 5) return "Margem moderada";
      return "Margem de lucro baixa";
    }
  },
  payout_ratio: {
    name: "Payout Ratio",
    excellent: (v) => v >= 40 && v <= 60,
    good: (v) => v >= 30 && v <= 70,
    neutral: (v) => v >= 20 && v <= 80,
    analysis: (v) => {
      if (v >= 40 && v <= 60) return "Distribuição equilibrada de lucros";
      if (v >= 30 && v <= 70) return "Distribuição razoável de dividendos";
      if (v < 30) return "Empresa retém a maioria dos lucros";
      return "Empresa distribui quase todo o lucro";
    }
  }
};

const getRating = (metric, value) => {
  if (!value) return null;
  const analysis = METRIC_ANALYSIS[metric];
  if (!analysis) return null;
  
  if (analysis.excellent(value)) return "excellent";
  if (analysis.good(value)) return "good";
  if (analysis.neutral(value)) return "neutral";
  return "poor";
};

const getRatingColor = (rating) => {
  const colors = {
    excellent: "bg-emerald-500/20 border-emerald-500/50 text-emerald-400",
    good: "bg-blue-500/20 border-blue-500/50 text-blue-400",
    neutral: "bg-amber-500/20 border-amber-500/50 text-amber-400",
    poor: "bg-red-500/20 border-red-500/50 text-red-400"
  };
  return colors[rating] || colors.neutral;
};

export default function InvestmentAnalysis({ stock }) {
  if (!stock) return null;

  const strategies = {
    dividends: STRATEGY_METRICS.dividends.metrics.map(m => ({
      key: m,
      value: stock[m] || stock.fundamentals?.[m],
      rating: getRating(m, stock[m] || stock.fundamentals?.[m])
    })),
    growth: STRATEGY_METRICS.growth.metrics.map(m => ({
      key: m,
      value: stock[m] || stock.fundamentals?.[m],
      rating: getRating(m, stock[m] || stock.fundamentals?.[m])
    })),
    value: STRATEGY_METRICS.value.metrics.map(m => ({
      key: m,
      value: stock[m] || stock.fundamentals?.[m],
      rating: getRating(m, stock[m] || stock.fundamentals?.[m])
    })),
    quality: STRATEGY_METRICS.quality.metrics.map(m => ({
      key: m,
      value: stock[m] || stock.fundamentals?.[m],
      rating: getRating(m, stock[m] || stock.fundamentals?.[m])
    }))
  };

  const calculateStrategyScore = (metrics) => {
    const validMetrics = metrics.filter(m => m.value !== null && m.value !== undefined);
    if (validMetrics.length === 0) return 0;
    
    const scores = {
      excellent: 3,
      good: 2,
      neutral: 1,
      poor: 0
    };
    
    const totalScore = validMetrics.reduce((sum, m) => sum + (scores[m.rating] || 0), 0);
    return Math.round((totalScore / (validMetrics.length * 3)) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Análise por Estratégia */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(strategies).map(([strategy, metrics]) => {
          const Icon = STRATEGY_METRICS[strategy].icon;
          const score = calculateStrategyScore(metrics);
          
          return (
            <Card key={strategy} className="bg-gray-900 border-gray-800 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                  <h4 className="text-white font-semibold text-sm">
                    {STRATEGY_METRICS[strategy].label}
                  </h4>
                  <p className="text-gray-400 text-xs">Relevância: {score}%</p>
                </div>
              </div>

              {/* Score Bar */}
              <div className="mb-4">
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${
                      score >= 75 ? 'bg-emerald-500' :
                      score >= 50 ? 'bg-amber-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>

              {/* Métricas */}
              <div className="space-y-2">
                {metrics.map(({ key, value, rating }) => {
                  const metricInfo = METRIC_ANALYSIS[key];
                  if (!metricInfo || value === null) return null;
                  
                  return (
                    <div key={key} className={`p-3 rounded-lg border ${getRatingColor(rating)}`}>
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-medium">{metricInfo.name}</span>
                        <span className="text-xs font-semibold">
                          {typeof value === 'number' ? (
                            key.includes('yield') || key.includes('margin') || key.includes('ratio') && !key.includes('debt')
                              ? `${value.toFixed(2)}%`
                              : value.toFixed(2)
                          ) : value}
                        </span>
                      </div>
                      <p className="text-xs opacity-90">{metricInfo.analysis(value)}</p>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Insights */}
      <Card className="bg-gray-900 border-gray-800 p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="h-5 w-5 text-blue-400" />
          <h4 className="text-white font-semibold">Insights para Investidor</h4>
        </div>

        <div className="space-y-3 text-sm text-gray-300">
          {stock.dividend_yield >= 5 && (
            <p>✓ <span className="text-emerald-400">Excelente gerador de renda:</span> Alto dividend yield para carteiras de renda passiva</p>
          )}
          {stock.pe_ratio && stock.pe_ratio <= 10 && (
            <p>✓ <span className="text-emerald-400">Oportunidade de valor:</span> P/L baixo indica possível desvalorização</p>
          )}
          {stock.fundamentals?.roe >= 15 && (
            <p>✓ <span className="text-emerald-400">Empresa eficiente:</span> Alto ROE indica boa geração de lucros</p>
          )}
          {stock.fundamentals?.debt_to_equity <= 0.8 && (
            <p>✓ <span className="text-emerald-400">Endividamento saudável:</span> Baixo risco financeiro</p>
          )}
          {stock.pb_ratio <= 1.2 && stock.pe_ratio <= 15 && (
            <p>✓ <span className="text-blue-400">Oportunidade dupla:</span> Valor e preço atrativos</p>
          )}
        </div>
      </Card>
    </div>
  );
}