import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader } from "lucide-react";
import { isFII, getFIIData } from "@/components/utils/fiiService";
import CompanyHeader from "@/components/company/CompanyHeader";
import FIIQuoteCard from "@/components/fii/FIIQuoteCard";
import FIIDividendPanel from "@/components/fii/FIIDividendPanel";
import FIIFinancialHistory from "@/components/fii/FIIFinancialHistory";
import FIIMetadataCard from "@/components/fii/FIIMetadataCard";
import QuoteCard from "@/components/company/QuoteCard";
import HistoricalChart from "@/components/company/HistoricalChart";
import About from "@/components/company/About";
import FinancialMetrics from "@/components/company/FinancialMetrics";
import FundamentalsGrid from "@/components/company/FundamentalsGrid";
import MultiStockComparison from "@/components/company/MultiStockComparison";


import DividendHistory from "@/components/company/DividendHistory";
import DividendCalendar, { CompanyInfoButton } from "@/components/company/DividendCalendar";
import News from "@/components/company/News";
import MarketDashboard from "@/components/market/MarketDashboard";
import QuickPriceAlert from "@/components/alerts/QuickPriceAlert";
import InvestmentAnalysis from "@/components/company/InvestmentAnalysis";
import InvestorChecklist from "@/components/company/InvestorChecklist";
import CompanyAboutSection from "@/components/company/about/CompanyAboutSection";
import CompanyDataSection from "@/components/company/about/CompanyDataSection";
import CompanyMetricsSection from "@/components/company/about/CompanyMetricsSection";
import CompanyRevenueRegionsSection from "@/components/company/about/CompanyRevenueRegionsSection";
import CompanyBusinessSegmentsSection from "@/components/company/about/CompanyBusinessSegmentsSection";
import CompanyRevenueChartSection from "@/components/company/about/CompanyRevenueChartSection";
import CompanyPriceVsEarningsSection from "@/components/company/about/CompanyPriceVsEarningsSection";
import CompanyFinancialResultsSection from "@/components/company/about/CompanyFinancialResultsSection";
import CompanyPatrimonialEvolutionSection from "@/components/company/about/CompanyPatrimonialEvolutionSection";
import CompanyBalanceSheetSection from "@/components/company/about/CompanyBalanceSheetSection";
import PayoutChart from "@/components/company/PayoutChart";
import DividendRadar from "@/components/company/DividendRadar";
import SectorComparator from "@/components/company/SectorComparator";
import CompanyInfoPanel from "@/components/company/CompanyInfoPanel";

const mockStockData = {
  "ITUB4": {
    ticker: "ITUB4",
    company_name: "Itaú Unibanco",
    current_price: 31.50,
    daily_change: 0.45,
    daily_change_percent: 1.45,
    price_target: 35.20,
    dividend_yield: 5.8,
    pe_ratio: 8.5,
    pb_ratio: 1.2,
    description: "O Itaú Unibanco S.A. é uma instituição financeira brasileira de grande porte, com operações nos segmentos de banco de varejo, banco de investimentos, seguros e gestão de patrimônio. Fundado em 1945, é um dos maiores bancos do Brasil e da América Latina, com presença em diversos países. O banco oferece produtos e serviços financeiros completos para pessoas físicas, empresas e instituições."
  },
  "PETR4": {
    ticker: "PETR4",
    company_name: "Petrobras",
    current_price: 28.80,
    daily_change: 0.82,
    daily_change_percent: 2.92,
    price_target: 32.50,
    dividend_yield: 7.2,
    pe_ratio: 5.2,
    pb_ratio: 0.95,
    description: "A Petrobras é uma empresa de energia integrada e a maior produtora de petróleo do Brasil. Opera em exploração, produção, refino, comercialização e transporte de petróleo e gás natural. Fundada em 1953, é uma das maiores indústrias do país e uma das principais produtoras de petróleo offshore do mundo, com significativa presença em exploração e produção em águas profundas."
  },
  "VALE3": {
    ticker: "VALE3",
    company_name: "Vale S.A.",
    current_price: 52.15,
    daily_change: -0.95,
    daily_change_percent: -1.79,
    price_target: 58.90,
    dividend_yield: 4.5,
    pe_ratio: 6.8,
    pb_ratio: 1.45,
    description: "A Vale S.A. é uma empresa multinacional brasileira de mineração, sendo um dos maiores produtores de minério de ferro, pellets, níquel e cobre do mundo. Fundada em 1942, é uma das maiores produtoras de commodities minerais, com operações em diversos países. A empresa é fundamental para o setor de energia e infraestrutura global."
  }
};

export default function Company() {
  const [selectedStock, setSelectedStock] = useState(null);
  const [selectedFII, setSelectedFII] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingFundamentals, setLoadingFundamentals] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (e) {
      console.log(e);
    }
  };

  const handleSearch = async (rawTicker) => {
    setLoading(true);
    setError(null);
    setSelectedStock(null);
    setSelectedFII(null);

    const ticker = rawTicker.toUpperCase().trim().replace(/\.SA$/i, '');

    // ── FII: lógica separada ──────────────────────────────
    if (isFII(ticker)) {
      try {
        const fiiData = await getFIIData(ticker, { includeHistory: true });
        setSelectedFII(fiiData);
      } catch (err) {
        setError(err.message || "FII não encontrado.");
      } finally {
        setLoading(false);
      }
      return;
    }

    // ── AÇÃO: lógica original ─────────────────────────────
    try {
      const res = await base44.functions.invoke("getStockQuote", { ticker, type: 'quote' });

      if (!res?.data || res.data.error) {
        setError(res?.data?.error || "Ação não encontrada");
        setLoading(false);
        return;
      }

      const formattedStock = { ...res.data, fundamentals: {} };
      setSelectedStock(formattedStock);
      setLoading(false);
      enrichWithFundamentals(ticker, res.data);
    } catch (err) {
      console.error(err);
      setError("Erro ao buscar dados da ação. Verifique o ticker e tente novamente.");
      setSelectedStock(null);
      setLoading(false);
    }
  };

  const enrichWithFundamentals = async (ticker, quoteData) => {
    setLoadingFundamentals(true);
    try {
      const res = await base44.functions.invoke("getStockFundamentals", { ticker });
      const extra = res?.data || {};
      if (!extra || Object.keys(extra).length === 0) return;

      setSelectedStock(prev => {
        if (!prev) return prev;
        const f = { ...prev.fundamentals };

        // Copiar todos os campos de fundamentals do extra
        Object.keys(extra).forEach(key => {
          const val = extra[key];
          if (val != null && val !== "N/A") {
            f[key] = val;
          }
        });

        const updated = { ...prev, fundamentals: f };
        // Atualizar campos no nível raiz se ainda null
        if (extra.pb_ratio != null && prev.pb_ratio == null) updated.pb_ratio = extra.pb_ratio;
        if (extra.dividend_yield != null && prev.dividend_yield == null) updated.dividend_yield = extra.dividend_yield;
        if (extra.pe_ratio != null && prev.pe_ratio == null) updated.pe_ratio = extra.pe_ratio;
        if (extra.shares_outstanding != null && prev.shares_outstanding == null) updated.shares_outstanding = extra.shares_outstanding;

        return updated;
      });
    } catch (err) {
      console.error("Erro ao enriquecer fundamentais:", err);
      // Não quebrar: o stock base já está carregado
    } finally {
      setLoadingFundamentals(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-4 md:py-8">
        <CompanyHeader onSearch={handleSearch} />

        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-2xl p-8 text-center">
            <p className="text-red-400 text-lg font-semibold mb-2">Ativo não encontrado</p>
            <p className="text-gray-400 text-sm">{error}</p>
            <p className="text-gray-500 text-xs mt-2">Verifique se o ticker está correto. Ex: PETR4, VALE3, ITUB4, MXRF11</p>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center h-64">
            <Loader className="h-8 w-8 text-violet-400 animate-spin" />
          </div>
        )}

        {/* ── FII Dashboard ───────────────────────────── */}
        {selectedFII && !loading && (
          <>
            <FIIQuoteCard data={selectedFII} />
            <FIIDividendPanel data={selectedFII} />
            <FIIFinancialHistory data={selectedFII} />
            <FIIMetadataCard data={selectedFII} />
            <HistoricalChart stock={{ ticker: selectedFII.basic_info?.symbol, ...selectedFII.basic_info }} />
            <DividendCalendar stock={{ ticker: selectedFII.basic_info?.symbol, dividends_data: { cashDividends: selectedFII.dividend_history?.monthly?.map(m => ({ paymentDate: m.month + '-01', rate: m.total, label: 'RENDIMENTO' })) || [] } }} />
            <News stock={{ ticker: selectedFII.basic_info?.symbol }} />
          </>
        )}

        {/* ── Ação Dashboard ──────────────────────────── */}
        {selectedStock && !loading && (
          <>
           {user && (
              <div className="mb-6 flex justify-end">
                <QuickPriceAlert 
                  ticker={selectedStock.ticker}
                  currentPrice={selectedStock.current_price}
                  userEmail={user.email}
                />
              </div>
            )}

            <QuoteCard stock={selectedStock} />
            <HistoricalChart stock={selectedStock} />
            <About stock={selectedStock} />
            <FundamentalsGrid stock={selectedStock} loadingFundamentals={loadingFundamentals} />
            <InvestorChecklist stock={selectedStock} />
            <MultiStockComparison initialTicker={selectedStock.ticker} />
            <DividendHistory stock={selectedStock} />
            <DividendCalendar stock={selectedStock} />
            
            {/* Seções de Lucros e Resultados */}
            <CompanyFinancialResultsSection stock={selectedStock} />
            <CompanyRevenueChartSection stock={selectedStock} />
            <CompanyPriceVsEarningsSection stock={selectedStock} />
            <CompanyPatrimonialEvolutionSection stock={selectedStock} />
            <CompanyBalanceSheetSection stock={selectedStock} />

            {/* Conhecendo a Empresa */}
            <CompanyAboutSection stock={selectedStock} />
            <CompanyDataSection stock={selectedStock} />
            <CompanyMetricsSection stock={selectedStock} />
            <CompanyRevenueRegionsSection stock={selectedStock} />
            <CompanyBusinessSegmentsSection stock={selectedStock} />

            {/* Novas seções exclusivas para ações */}
            <PayoutChart stock={selectedStock} />
            <DividendRadar stock={selectedStock} />
            <SectorComparator stock={selectedStock} />
            <CompanyInfoPanel stock={selectedStock} />

            <News stock={selectedStock} />
          </>
        )}

        {!selectedStock && !loading && (
          <MarketDashboard onSelectStock={handleSearch} />
        )}
      </div>
    </div>
  );
}