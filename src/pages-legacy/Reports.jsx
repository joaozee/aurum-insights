import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { brapiService } from "@/components/utils/brapiService";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PerformanceReport from "@/components/reports/PerformanceReport";
import RiskAnalysis from "@/components/reports/RiskAnalysis";
import AssetPerformanceBreakdown from "@/components/reports/AssetPerformanceBreakdown";
import SectorPerformance from "@/components/reports/SectorPerformance";
import AIInsights from "@/components/reports/AIInsights";

export default function Reports() {
  const [user, setUser] = useState(null);
  const [assets, setAssets] = useState({});
  const [assetsArray, setAssetsArray] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("monthly");
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setMonth(new Date().getMonth() - 6)),
    to: new Date()
  });
  const [activeTab, setActiveTab] = useState("benchmarks");
  const reportRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      const [transactionsData, goalsData] = await Promise.all([
        base44.entities.Transaction.filter({ user_email: userData.email }),
        base44.entities.FinancialGoal.filter({ user_email: userData.email })
      ]);

      setTransactions(transactionsData);
      setGoals(goalsData);
      await calculatePortfolio(transactionsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculatePortfolio = async (transactionsData) => {
    const assetsByTicker = {};
    
    transactionsData.forEach(t => {
      if (!assetsByTicker[t.ticker]) {
        assetsByTicker[t.ticker] = {
          ticker: t.ticker,
          purchases: [],
          sales: []
        };
      }
      
      if (t.type === "compra") {
        assetsByTicker[t.ticker].purchases.push(t);
      } else {
        assetsByTicker[t.ticker].sales.push(t);
      }
    });

    const calculatedAssets = {};
    const assetsToFetch = [];

    Object.keys(assetsByTicker).forEach(ticker => {
      const asset = assetsByTicker[ticker];
      
      const totalBought = asset.purchases.reduce((sum, p) => sum + p.quantity, 0);
      const totalSold = asset.sales.reduce((sum, s) => sum + s.quantity, 0);
      const currentQuantity = totalBought - totalSold;

      if (currentQuantity > 0) {
        const totalInvestedValue = asset.purchases.reduce((sum, p) => sum + p.total_value, 0);
        const totalSoldValue = asset.sales.reduce((sum, s) => sum + s.total_value, 0);
        const netInvested = totalInvestedValue - totalSoldValue;
        const avgPrice = netInvested / currentQuantity;

        calculatedAssets[ticker] = {
          ticker,
          quantity: currentQuantity,
          purchase_price: avgPrice,
          current_price: null
        };

        assetsToFetch.push(ticker);
      }
    });

    if (assetsToFetch.length > 0) {
      try {
        const quotes = await brapiService.getQuotes(assetsToFetch);
        
        quotes.forEach(quote => {
          const formatted = brapiService.formatStockData(quote);
          if (calculatedAssets[quote.symbol]) {
            calculatedAssets[quote.symbol].current_price = formatted.current_price;
            calculatedAssets[quote.symbol].company_name = formatted.company_name;
          }
        });
      } catch (err) {
        console.error("Erro ao buscar cotações:", err);
      }
    }

    setAssets(calculatedAssets);
    setAssetsArray(Object.values(calculatedAssets));
  };

  const handleDateRangeChange = (range) => {
    setDateRange(range);
    // Aqui você pode filtrar transações por data se necessário
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-16 w-full rounded-2xl bg-gray-800 mb-8" />
          <div className="grid lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-96 rounded-2xl bg-gray-800" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const hasAssets = Object.keys(assets).length > 0;

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to={createPageUrl("Portfolio")} className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 group">
          <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          <span>Voltar para Carteira</span>
        </Link>

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Análises e Relatórios</h1>
              <p className="text-gray-400 text-sm">Visão aprofundada da sua carteira</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-gray-900 border border-gray-800 p-1 rounded-xl w-full grid grid-cols-3 lg:flex lg:w-auto">
              <TabsTrigger 
                value="benchmarks" 
                className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-gray-400"
              >
                Performance
              </TabsTrigger>
              <TabsTrigger 
                value="risk" 
                className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-gray-400"
              >
                Risco
              </TabsTrigger>
              <TabsTrigger 
                value="insights" 
                className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-gray-400"
              >
                Insights IA
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {!hasAssets ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
            <FileText className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Nenhum Dado Disponível</h3>
            <p className="text-gray-400">Adicione ativos à sua carteira para gerar relatórios</p>
          </div>
        ) : (
          <div ref={reportRef} className="space-y-6">
            {/* Benchmarks Tab */}
            {activeTab === "benchmarks" && (
              <>
                <PerformanceReport 
                  transactions={transactions}
                  assets={assets}
                  period={period}
                />
                <div className="grid lg:grid-cols-2 gap-6 mt-6">
                  <AssetPerformanceBreakdown assets={assets} />
                  <SectorPerformance assets={assets} />
                </div>
              </>
            )}

            {/* Risk Tab */}
            {activeTab === "risk" && (
              <RiskAnalysis 
                assets={assets}
                transactions={transactions}
              />
            )}

            {/* Insights Tab */}
            {activeTab === "insights" && (
              <AIInsights 
                assets={assets}
                transactions={transactions}
                goals={goals}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}