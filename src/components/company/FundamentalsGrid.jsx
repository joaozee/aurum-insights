import { useState, useEffect } from "react";
import { Info, TrendingUp, TrendingDown, Minus, BarChart2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import IndicatorHistoryModal from "./IndicatorHistoryModal";
import { base44 } from "@/api/base44Client";

// Médias setoriais
const SECTOR_AVERAGES = {
  "Bancos": {
    pe_ratio: 8.5,
    pb_ratio: 1.3,
    dividend_yield: 5.2,
    roe: 18.5,
    profit_margin: 25.3,
    debt_to_equity: 2.8,
    payout_ratio: 40.5,
    ev_ebitda: 6.2,
    margin_ebitda: 35.2,
    margin_liquida: 22.1,
    margin_bruta: 42.8,
    price_to_ebit: 5.8,
    price_to_assets: 0.45,
    price_to_cap_giro: 4.2
  },
  "Petróleo e Gás": {
    pe_ratio: 6.8,
    pb_ratio: 1.1,
    dividend_yield: 8.5,
    roe: 22.3,
    profit_margin: 18.5,
    debt_to_equity: 0.95,
    payout_ratio: 55.2,
    ev_ebitda: 4.5,
    margin_ebitda: 42.5,
    margin_liquida: 16.8,
    margin_bruta: 48.2,
    price_to_ebit: 4.2,
    price_to_assets: 0.38,
    price_to_cap_giro: 3.5
  },
  "Mineração": {
    pe_ratio: 7.2,
    pb_ratio: 1.5,
    dividend_yield: 6.8,
    roe: 15.8,
    profit_margin: 28.3,
    debt_to_equity: 0.65,
    payout_ratio: 48.5,
    ev_ebitda: 5.1,
    margin_ebitda: 48.5,
    margin_liquida: 25.2,
    margin_bruta: 52.8,
    price_to_ebit: 6.1,
    price_to_assets: 0.52,
    price_to_cap_giro: 5.1
  },
  "Varejo": {
    pe_ratio: 15.2,
    pb_ratio: 2.8,
    dividend_yield: 3.2,
    roe: 12.5,
    profit_margin: 4.8,
    debt_to_equity: 1.2,
    payout_ratio: 35.2,
    ev_ebitda: 8.5,
    margin_ebitda: 8.2,
    margin_liquida: 3.5,
    margin_bruta: 28.5,
    price_to_ebit: 12.5,
    price_to_assets: 0.95,
    price_to_cap_giro: 6.8
  },
  "Energia Elétrica": {
    pe_ratio: 12.5,
    pb_ratio: 1.8,
    dividend_yield: 6.5,
    roe: 14.2,
    profit_margin: 15.8,
    debt_to_equity: 1.8,
    payout_ratio: 65.8,
    ev_ebitda: 7.2,
    margin_ebitda: 32.5,
    margin_liquida: 12.8,
    margin_bruta: 38.2,
    price_to_ebit: 8.5,
    price_to_assets: 0.68,
    price_to_cap_giro: 4.8
  }
};

// Média de todas as empresas da B3
const ALL_COMPANIES_AVERAGE = {
  pe_ratio: 11.3,
  pb_ratio: 1.8,
  dividend_yield: 5.8,
  roe: 16.2,
  profit_margin: 14.5,
  debt_to_equity: 1.4,
  payout_ratio: 45.0,
  ev_ebitda: 6.5,
  margin_ebitda: 28.5,
  margin_liquida: 13.8,
  margin_bruta: 35.2,
  price_to_ebit: 7.2,
  price_to_assets: 0.58,
  price_to_cap_giro: 5.5
};

const METRIC_DEFINITIONS = {
  pe_ratio: "P/L (Price/Earnings): Indica quantos anos seriam necessários para recuperar o investimento com os lucros atuais. Ideal: < 15",
  pb_ratio: "P/VP (Price/Book): Compara o preço de mercado com o valor patrimonial. < 1 pode indicar desvalorização.",
  dividend_yield: "Dividend Yield: Percentual de retorno anual via dividendos. Acima de 5% é considerado bom.",
  roe: "ROE (Return on Equity): Rentabilidade sobre o patrimônio líquido. Acima de 15% é excelente.",
  roa: "ROA (Return on Assets): Rentabilidade sobre ativos totais. Quanto maior, melhor.",
  profit_margin: "Margem de Lucro: Percentual do lucro sobre a receita. Acima de 10% é bom.",
  debt_to_equity: "Dívida/Patrimônio: Endividamento em relação ao patrimônio. Abaixo de 1 é saudável.",
  payout_ratio: "Payout Ratio: Percentual do lucro distribuído como dividendos. 40-60% é equilibrado."
};

const BENCHMARK_RANGES = {
  pe_ratio: { excellent: [0, 10], good: [10, 15], neutral: [15, 20], poor: [20, Infinity] },
  pb_ratio: { excellent: [0, 1], good: [1, 1.5], neutral: [1.5, 2.5], poor: [2.5, Infinity] },
  dividend_yield: { excellent: [7, Infinity], good: [5, 7], neutral: [3, 5], poor: [0, 3] },
  roe: { excellent: [20, Infinity], good: [15, 20], neutral: [10, 15], poor: [0, 10] },
  roa: { excellent: [10, Infinity], good: [7, 10], neutral: [5, 7], poor: [0, 5] },
  profit_margin: { excellent: [15, Infinity], good: [10, 15], neutral: [5, 10], poor: [0, 5] },
  debt_to_equity: { excellent: [0, 0.5], good: [0.5, 1], neutral: [1, 1.5], poor: [1.5, Infinity] },
  payout_ratio: { excellent: [40, 60], good: [30, 70], neutral: [20, 80], poor: [0, 100] }
};

const getRating = (metric, value) => {
  if (!value || !BENCHMARK_RANGES[metric]) return 'neutral';
  
  const ranges = BENCHMARK_RANGES[metric];
  for (const [rating, [min, max]] of Object.entries(ranges)) {
    if (value >= min && value < max) return rating;
  }
  return 'neutral';
};

const getRatingColor = (rating) => {
  const colors = {
    excellent: "from-emerald-500 to-green-600",
    good: "from-blue-500 to-cyan-600",
    neutral: "from-amber-500 to-orange-600",
    poor: "from-red-500 to-pink-600"
  };
  return colors[rating] || colors.neutral;
};

const getRatingIcon = (rating) => {
  const icons = {
    excellent: TrendingUp,
    good: TrendingUp,
    neutral: Minus,
    poor: TrendingDown
  };
  return icons[rating] || Minus;
};

// Formata valores em reais absolutos → exibe Mi, Bi, Tri
const formatMillions = (v) => {
  if (typeof v !== 'number') return 'N/A';
  const abs = Math.abs(v);
  const sign = v < 0 ? '-' : '';
  if (abs >= 1e12) return `${sign}R$ ${(abs/1e12).toFixed(1)} Tri`;
  if (abs >= 1e9)  return `${sign}R$ ${(abs/1e9).toFixed(1)} Bi`;
  if (abs >= 1e6)  return `${sign}R$ ${(abs/1e6).toFixed(1)} Mi`;
  return `${sign}R$ ${abs.toFixed(2)}`;
};

// Formata valores que estão em REAIS ABSOLUTOS (Market Cap, shares, etc.)
const formatAbsolute = (v) => {
  if (typeof v !== 'number') return 'N/A';
  const abs = Math.abs(v);
  const sign = v < 0 ? '-' : '';
  if (abs >= 1e12) return `${sign}R$ ${(abs/1e12).toFixed(1)} Tri`;
  if (abs >= 1e9)  return `${sign}R$ ${(abs/1e9).toFixed(1)} Bi`;
  if (abs >= 1e6)  return `${sign}R$ ${(abs/1e6).toFixed(1)} Mi`;
  return `${sign}R$ ${abs.toFixed(2)}`;
};

export default function FundamentalsGrid({ stock, loadingFundamentals }) {
  const [comparisonType, setComparisonType] = useState("sem");
  const [historyMetric, setHistoryMetric] = useState(null);

  if (!stock) return null;


  
  const getComparisonData = () => {
    if (comparisonType === "sem") return null;
    if (comparisonType === "todas") return ALL_COMPANIES_AVERAGE;
    return null;
  };
  
  const sectorData = getComparisonData();

  const f = stock.fundamentals || {};
  // ATENÇÃO: as chaves aqui devem corresponder exatamente às chaves do INDICATOR_META no hook useIndicatorHistory
  // para que o botão de histórico abra o indicador correto no modal.
  const allMetricsList = [
    // --- VALUATION ---
    { key: "pe_ratio",       label: "P/L",                value: stock.pe_ratio,          sectorAvg: sectorData?.pe_ratio,    format: (v) => (typeof v === 'number') ? v.toFixed(2) : "N/A" },
    { key: "pb_ratio",       label: "P/VP",               value: stock.pb_ratio,          sectorAvg: sectorData?.pb_ratio,    format: (v) => (typeof v === 'number') ? v.toFixed(2) : "N/A" },
    { key: "dividend_yield", label: "DIVIDEND YIELD",     value: stock.dividend_yield,    sectorAvg: sectorData?.dividend_yield, format: (v) => (typeof v === 'number') ? `${v.toFixed(2)}%` : "N/A" },
    { key: "payout",         label: "PAYOUT",             value: f.payout_ratio,          sectorAvg: null,                    format: (v) => (typeof v === 'number') ? `${v.toFixed(2)}%` : "N/A" },
    { key: "ev_ebitda",      label: "EV/EBITDA",          value: f.ev_ebitda,             sectorAvg: sectorData?.ev_ebitda,   format: (v) => (typeof v === 'number') ? v.toFixed(2) : "N/A" },
    { key: "ev_ebit",        label: "EV/EBIT",            value: f.ev_ebit,               sectorAvg: null,                    format: (v) => (typeof v === 'number') ? v.toFixed(2) : "N/A" },
    { key: "p_ebitda",       label: "P/EBITDA",           value: f.pebitda ?? f.price_to_ebitda, sectorAvg: null,             format: (v) => (typeof v === 'number') ? v.toFixed(2) : "N/A" },
    { key: "p_ebit",         label: "P/EBIT",             value: f.price_to_ebit,         sectorAvg: null,                    format: (v) => (typeof v === 'number') ? v.toFixed(2) : "N/A" },
    { key: "p_sr",           label: "P/SR (PSR)",         value: f.price_to_sales,        sectorAvg: null,                    format: (v) => (typeof v === 'number') ? v.toFixed(2) : "N/A" },
    { key: "lpa",            label: "LPA",                value: f.lpa ?? f.earnings_per_share,    sectorAvg: null, format: (v) => (typeof v === 'number') ? `R$${v.toFixed(2)}` : "N/A" },
    { key: "vpa",            label: "VPA",                value: f.vpa ?? f.book_value_per_share,  sectorAvg: null, format: (v) => (typeof v === 'number') ? `R$${v.toFixed(2)}` : "N/A" },
    { key: "peg_ratio",      label: "PEG RATIO",          value: f.peg_ratio,             sectorAvg: null,                    format: (v) => (typeof v === 'number') ? v.toFixed(2) : "N/A" },
    // --- ENDIVIDAMENTO ---
    { key: "net_debt",           label: "DÍVIDA LÍQUIDA",      value: f.net_debt,              sectorAvg: null, format: formatMillions },
    { key: "net_debt_to_equity", label: "DÍV. LÍQ. / PL",     value: f.net_debt_to_equity,    sectorAvg: null, format: (v) => (typeof v === 'number') ? v.toFixed(2) : "N/A" },
    { key: "net_debt_to_ebitda", label: "DÍV. LÍQ. / EBITDA", value: f.net_debt_to_ebitda,    sectorAvg: null, format: (v) => (typeof v === 'number') ? v.toFixed(2) : "N/A" },
    { key: "net_debt_to_ebit",   label: "DÍV. LÍQ. / EBIT",   value: f.net_debt_ebit ?? null, sectorAvg: null, format: (v) => (typeof v === 'number') ? v.toFixed(2) : "N/A" },
    { key: "liabilities_to_assets", label: "PASSIVO / ATIVO", value: f.debt_to_assets,        sectorAvg: null, format: (v) => (typeof v === 'number') ? v.toFixed(2) : "N/A" },
    { key: "current_ratio",      label: "LIQUIDEZ CORRENTE",   value: f.current_ratio,         sectorAvg: null, format: (v) => (typeof v === 'number') ? v.toFixed(2) : "N/A" },
    // --- EFICIÊNCIA ---
    { key: "gross_margin",    label: "MARGEM BRUTA",       value: f.gross_margin,    sectorAvg: null, format: (v) => (typeof v === 'number') ? `${v.toFixed(2)}%` : "N/A" },
    { key: "ebitda_margin",   label: "MARGEM EBITDA",      value: f.ebitda_margin,   sectorAvg: null, format: (v) => (typeof v === 'number') ? `${v.toFixed(2)}%` : "N/A" },
    { key: "ebit_margin",     label: "MARGEM EBIT",        value: f.ebit_margin,     sectorAvg: null, format: (v) => (typeof v === 'number') ? `${v.toFixed(2)}%` : "N/A" },
    { key: "operating_margin",label: "MARGEM OPERACIONAL", value: f.operating_margin,sectorAvg: null, format: (v) => (typeof v === 'number') ? `${v.toFixed(2)}%` : "N/A" },
    { key: "net_margin",      label: "MARGEM LÍQUIDA",     value: f.profit_margin,   sectorAvg: null, format: (v) => (typeof v === 'number') ? `${v.toFixed(2)}%` : "N/A" },
    // --- RENTABILIDADE ---
    { key: "roe",  label: "ROE",  value: f.roe,  sectorAvg: sectorData?.roe, format: (v) => (typeof v === 'number') ? `${v.toFixed(2)}%` : "N/A" },
    { key: "roa",  label: "ROA",  value: f.roa,  sectorAvg: null,            format: (v) => (typeof v === 'number') ? `${v.toFixed(2)}%` : "N/A" },
    { key: "roic", label: "ROIC", value: f.roic, sectorAvg: null,            format: (v) => (typeof v === 'number') ? `${v.toFixed(2)}%` : "N/A" },
    // --- CRESCIMENTO ---
    { key: "cagr_revenue",   label: "CAGR RECEITA 5A", value: f.cagr_receita, sectorAvg: null, format: (v) => (typeof v === 'number') ? `${v.toFixed(2)}%` : "N/A" },
    { key: "cagr_net_income",label: "CAGR LUCRO 5A",   value: f.cagr_lucro,   sectorAvg: null, format: (v) => (typeof v === 'number') ? `${v.toFixed(2)}%` : "N/A" },
    // --- DADOS FINANCEIROS ---
    { key: "revenue",      label: "RECEITA LÍQUIDA", value: f.total_revenue, sectorAvg: null, format: formatMillions },
    { key: "ebitda",       label: "EBITDA",          value: f.ebitda,        sectorAvg: null, format: formatMillions },
    { key: "net_income",   label: "LUCRO LÍQUIDO",   value: f.net_income,    sectorAvg: null, format: formatMillions },
    { key: "free_cashflow",label: "FREE CASH FLOW",  value: f.free_cashflow, sectorAvg: null, format: formatMillions },
    { key: "eps",          label: "EPS",             value: f.earnings_per_share, sectorAvg: null, format: (v) => (typeof v === 'number') ? `R$${v.toFixed(2)}` : "N/A" },
  ];

  // Compatibilidade com código que usava mainMetrics/additionalMetrics separados
  const mainMetrics = allMetricsList;
  const additionalMetrics = [];

  const metrics = allMetricsList
    .filter(m => m.value != null && m.value !== "N/A" && !isNaN(m.value));

  const isHigherBetter = (key) => {
    return ['dividend_yield', 'roe', 'roa', 'roic', 'net_margin', 'gross_margin', 'ebitda_margin', 'ebit_margin', 'operating_margin', 'payout', 'revenue', 'ebitda', 'net_income', 'free_cashflow', 'cagr_revenue', 'cagr_net_income'].includes(key);
  };

  const isBetterThanSector = (value, sectorAvg, key) => {
    if (!value || !sectorAvg || comparisonType === "sem") return null;
    if (isHigherBetter(key)) {
      return value > sectorAvg;
    } else {
      return value < sectorAvg;
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl md:rounded-2xl p-4 md:p-6 mb-4 md:mb-8">
      <div className="mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base md:text-xl font-semibold text-white">Indicadores Fundamentalistas</h3>
            {loadingFundamentals && (
              <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-2 py-0.5 animate-pulse">
                Buscando dados...
              </span>
            )}
          </div>
          
          <Select value={comparisonType} onValueChange={setComparisonType}>
            <SelectTrigger className="w-full md:w-64 bg-gray-800/50 border-gray-700 text-sm h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-800">
              <SelectItem value="sem">Sem Comparativos</SelectItem>
              <SelectItem value="todas">Média de Todas as Empresas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {comparisonType !== "sem" && (
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                <span>Acima da média</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500"></div>
                <span>Abaixo da média</span>
              </div>
              <span className="ml-auto">
                Comparando com: <span className="text-white font-medium">
                  Todas as Empresas
                </span>
              </span>
            </div>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        {metrics.map((metric) => {
          const rating = getRating(metric.key, metric.value);
          const RatingIcon = getRatingIcon(rating);
          const isBetter = isBetterThanSector(metric.value, metric.sectorAvg, metric.key);
          
          return (
            <div
              key={metric.key}
              className="bg-white/5 backdrop-blur-sm rounded-lg p-3 md:p-4 border border-gray-800/50 hover:border-gray-700/50 hover:bg-white/[0.07] transition-all"
            >
              <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-[10px] md:text-xs font-semibold uppercase tracking-wide">{metric.label}</span>
              <div className="flex items-center gap-1.5">
                {comparisonType !== "sem" && isBetter !== null && (
                  <div className={cn(
                    "h-5 w-5 rounded-md flex items-center justify-center",
                    isBetter ? "bg-emerald-500/10 border border-emerald-500/30" : "bg-red-500/10 border border-red-500/30"
                  )}>
                    {isBetter ? (
                      <TrendingUp className="h-2.5 w-2.5 text-emerald-400" />
                    ) : (
                      <TrendingDown className="h-2.5 w-2.5 text-red-400" />
                    )}
                  </div>
                )}
                <button
                  onClick={() => setHistoryMetric(metric)}
                  className="h-5 w-5 rounded-md flex items-center justify-center bg-gray-800 border border-gray-700 hover:border-amber-500/50 hover:bg-amber-500/10 transition-all"
                  title="Ver histórico"
                >
                  <BarChart2 className="h-3 w-3 text-gray-400 hover:text-amber-400" />
                </button>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-gray-600 hover:text-gray-400 cursor-help transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-gray-800 border border-gray-700 text-gray-300 text-xs max-w-xs">
                      {METRIC_DEFINITIONS[metric.key]}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              </div>
              
              <div className="mb-2">
                <span className="text-xl md:text-2xl font-bold text-white">
                  {metric.format(metric.value)}
                </span>
              </div>

              {comparisonType !== "sem" && metric.sectorAvg && (
                <div className="flex items-center gap-1.5 text-[10px] md:text-xs">
                  <span className="text-gray-500">Setor:</span>
                  <span className="text-gray-400 font-medium">{metric.format(metric.sectorAvg)}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <IndicatorHistoryModal
        open={!!historyMetric}
        onClose={() => setHistoryMetric(null)}
        metric={historyMetric}
        stock={stock}
        allMetrics={allMetricsList}
      />

      {/* Informações de Mercado */}
      {stock.fundamentals && (stock.market_cap || stock.shares_outstanding || f.beta || f.avg_volume) && (
        <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-gray-800 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
          <div>
            <p className="text-gray-400 text-[10px] md:text-sm mb-1">Market Cap</p>
            <p className="text-white text-xs md:text-base font-semibold">
              {formatAbsolute(stock.market_cap)}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-[10px] md:text-sm mb-1">Qtd. de Ações</p>
            <p className="text-white text-xs md:text-base font-semibold">
              {stock.shares_outstanding
                ? stock.shares_outstanding >= 1e9 ? `${(stock.shares_outstanding/1e9).toFixed(1)} Bi`
                  : `${(stock.shares_outstanding/1e6).toFixed(1)} M`
                : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-[10px] md:text-sm mb-1">Beta</p>
            <p className="text-white text-xs md:text-base font-semibold">{typeof f.beta === 'number' ? f.beta.toFixed(2) : 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-400 text-[10px] md:text-sm mb-1">Vol. Médio (10d)</p>
            <p className="text-white text-xs md:text-base font-semibold">
              {f.avg_volume ? (f.avg_volume >= 1e6 ? `${(f.avg_volume/1e6).toFixed(1)} M` : `${(f.avg_volume/1e3).toFixed(0)} K`) : 'N/A'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}