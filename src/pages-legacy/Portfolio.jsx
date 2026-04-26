import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, RefreshCw, Zap, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import PortfolioSummary from "@/components/portfolio/PortfolioSummary";
import PortfolioAssetCard from "@/components/portfolio/PortfolioAssetCard";
import AddAssetDialog from "@/components/portfolio/AddAssetDialog";
import TransactionsHistory from "@/components/portfolio/TransactionsHistory";
import PortfolioSectorDistribution from "@/components/portfolio/PortfolioSectorDistribution";
import TopPerformers from "@/components/portfolio/TopPerformers";
import PortfolioEvolution from "@/components/portfolio/PortfolioEvolution";
import PortfolioOptimizer from "@/components/portfolio/PortfolioOptimizer";
import PortfolioValueEvolution from "@/components/portfolio/PortfolioValueEvolution";
import PerformanceComparison from "@/components/portfolio/PerformanceComparison";
import CustomizableDashboard from "@/components/portfolio/CustomizableDashboard";
import FinancialKPIs from "@/components/portfolio/FinancialKPIs";
import ReportExporter from "@/components/portfolio/ReportExporter";
import StrategyBuilder from "@/components/strategy/StrategyBuilder";
import StrategyRecommendation from "@/components/strategy/StrategyRecommendation";
import RecommendedAssetAllocation from "@/components/portfolio/RecommendedAssetAllocation";
import BacktestSimulator from "@/components/advisor/BacktestSimulator";
import PersonalizedStockRecommendations from "@/components/advisor/PersonalizedStockRecommendations";
import ImportAssetsDialog from "@/components/portfolio/ImportAssetsDialog";
import WalletDistributionChart from "@/components/portfolio/WalletDistributionChart";

import { toast } from "sonner";

export default function Portfolio() {
  const [user, setUser] = useState(null);
  const [assets, setAssets] = useState({});
  const [quotes, setQuotes] = useState({}); // brapi raw quotes keyed by ticker
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showStrategy, setShowStrategy] = useState(false);
  const [strategy, setStrategy] = useState(null);
  const [projection, setProjection] = useState(null);
  const [strategyLoading, setStrategyLoading] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => refreshPrices(), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);



  const loadData = async () => {
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
    // Agrupar transações por ticker
    const byTicker = {};
    transactionsData.forEach(t => {
      if (!byTicker[t.ticker]) byTicker[t.ticker] = { quantity: 0, totalCost: 0 };
      if (t.type === 'compra') {
        byTicker[t.ticker].quantity += t.quantity;
        byTicker[t.ticker].totalCost += t.quantity * t.price;
      } else if (t.type === 'venda') {
        byTicker[t.ticker].quantity -= t.quantity;
        byTicker[t.ticker].totalCost -= t.quantity * t.price;
      }
    });

    const assetMap = {};
    Object.entries(byTicker).forEach(([ticker, data]) => {
      if (data.quantity <= 0) return;
      const avgPrice = data.totalCost / data.quantity;
      assetMap[ticker] = {
        ticker,
        quantity: data.quantity,
        purchase_price: avgPrice,
        current_price: avgPrice,
        logo_url: null,
        company_name: ticker
      };
    });

    const tickers = Object.keys(assetMap);
    if (tickers.length === 0) { setAssets(assetMap); setQuotes({}); return; }

    try {
      const params = new URLSearchParams({ fundamental: 'true', dividends: 'true', token: 'iNyQwWqh7mVeGFEkWgXumQ' });
      const res = await fetch(`https://brapi.dev/api/quote/${tickers.join(',')}?${params}`);
      const data = await res.json();
      const quotesMap = {};
      (data.results || []).forEach(q => {
        quotesMap[q.symbol] = q;
        if (assetMap[q.symbol]) {
          assetMap[q.symbol].current_price = q.regularMarketPrice || assetMap[q.symbol].current_price;
          assetMap[q.symbol].logo_url = q.logourl || null;
          assetMap[q.symbol].company_name = q.shortName || q.longName || q.symbol;
          assetMap[q.symbol].pe_ratio = q.priceEarnings || q.trailingPE || null;
          assetMap[q.symbol].pb_ratio = q.priceToBook
            || (q.regularMarketPrice && q.bookValue && q.bookValue > 0
                ? q.regularMarketPrice / q.bookValue
                : null);
          // Calcular DY: tenta dividendYield direto, senão calcula pelos últimos 12 meses
          let dy = null;
          if (q.dividendYield && q.dividendYield > 0) {
            dy = q.dividendYield < 1 ? q.dividendYield * 100 : q.dividendYield;
          } else if (q.dividendsData?.cashDividends?.length > 0) {
            const cutoff = new Date();
            cutoff.setFullYear(cutoff.getFullYear() - 1);
            const last12 = q.dividendsData.cashDividends.filter(d => new Date(d.paymentDate || d.approvedOn) >= cutoff);
            const total = last12.reduce((sum, d) => sum + (d.rate || 0), 0);
            const price = q.regularMarketPrice || assetMap[q.symbol].current_price;
            if (price > 0 && total > 0) dy = (total / price) * 100;
          }
          assetMap[q.symbol].dy = dy;
        }
      });
      setQuotes(quotesMap);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Brapi error:', err);
    }

    setAssets(assetMap);
  };

  const refreshPrices = async () => {
    setRefreshing(true);
    try {
      const transactionsData = await base44.entities.Transaction.filter({ user_email: user?.email });
      await calculatePortfolio(transactionsData);
    } catch(e) { console.error(e); }
    setRefreshing(false);
  };

  const handleStrategyGenerate = async (inputs) => {
    setStrategyLoading(true);
    try {
      const response = await base44.functions.invoke('strategyEngine', inputs);
      setStrategy(response.data.strategy);
      setProjection(response.data.projection);
    } catch (err) {
      console.error(err);
    } finally {
      setStrategyLoading(false);
    }
  };

  const calculateSummary = () => {
    let total_invested = 0;
    let current_value = 0;
    Object.values(assets).forEach(asset => {
      total_invested += asset.quantity * asset.purchase_price;
      current_value += asset.quantity * (asset.current_price || asset.purchase_price);
    });
    const profit_loss = current_value - total_invested;
    const profit_loss_percent = total_invested > 0 ? (profit_loss / total_invested) * 100 : 0;
    return { total_invested, current_value, profit_loss, profit_loss_percent };
  };

  const summary = calculateSummary();
  const assetsList = Object.values(assets);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-16 w-full rounded-2xl bg-gray-800 mb-8" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32 rounded-2xl bg-gray-800" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Briefcase className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Minha Carteira</h1>
              <p className="text-gray-400 text-sm">Gerencie seus investimentos</p>
            </div>
          </div>
          
          <div className="flex gap-3 flex-wrap">
            {assetsList.length > 0 && (
              <>
                <ReportExporter 
                  assets={assetsList}
                  summary={summary}
                  transactions={transactions}
                  goals={goals}
                />
                <Button
                  onClick={() => setShowStrategy(!showStrategy)}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold shadow-lg shadow-emerald-500/30"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Simulações
                </Button>

              </>
            )}
            <div className="flex flex-col items-end gap-0.5">
              <Button
                onClick={refreshPrices}
                disabled={refreshing}
                className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-semibold shadow-lg shadow-blue-500/30"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              {lastUpdated && (
                <span className="text-[10px] text-gray-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Atualizado às {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
            <ImportAssetsDialog userEmail={user?.email} onAssetsImported={loadData} />
            <AddAssetDialog userEmail={user?.email} onAssetAdded={loadData} />
          </div>
        </div>

        {/* Strategy Section */}
        {showStrategy && assetsList.length > 0 && (
          <div className="mb-8 p-6 bg-gradient-to-br from-emerald-500/10 to-teal-600/10 border border-emerald-500/30 rounded-2xl">
            <h2 className="text-xl font-semibold text-white mb-6">Simulações</h2>
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="lg:sticky lg:top-20 h-fit">
                <StrategyBuilder 
                  onStrategyGenerate={handleStrategyGenerate}
                  isLoading={strategyLoading}
                />
              </div>
              <div className="space-y-6">
                {strategy ? (
                  <>
                    <RecommendedAssetAllocation strategy={strategy} />
                    <BacktestSimulator stocks={strategy.tickers} />
                  </>
                ) : (
                  <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8 text-center">
                    <Zap className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Preencha seus dados para receber recomendações personalizadas</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <PortfolioSummary summary={summary} transactions={transactions} />

        {assetsList.length > 0 ? (
          <>
            {/* Value Evolution - Main Chart */}
            <div className="mb-6">
              <PortfolioEvolution transactions={transactions} assets={assets} />
            </div>

            {/* KPIs Dashboard */}
            <div className="mb-6">
              <FinancialKPIs assets={assetsList} transactions={transactions} goals={goals} quotes={quotes} />
            </div>

            {/* Wallet Distribution Chart */}
            <div className="mb-6">
              <WalletDistributionChart assets={assetsList} quotes={quotes} />
            </div>

            {/* Charts Row 1 - Sector Distribution */}
            <div className="mb-6">
              <PortfolioSectorDistribution assets={assets} />
            </div>



            {/* Assets Grid */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Meus Ativos</h2>
              <div className="grid lg:grid-cols-2 gap-6">
                {assetsList.map((asset) => (
                  <PortfolioAssetCard
                    key={asset.ticker}
                    asset={{
                      user_email: user?.email,
                      name: asset.ticker,
                      quantity: asset.quantity,
                      purchase_price: asset.purchase_price,
                      current_price: asset.current_price,
                      logo_url: asset.logo_url,
                      pe_ratio: asset.pe_ratio,
                      pb_ratio: asset.pb_ratio,
                      dy: asset.dy
                    }}
                    quote={quotes[asset.ticker] || null}
                    onUpdate={loadData}
                  />
                ))}
              </div>
            </div>

            {/* Transaction History */}
            <TransactionsHistory transactions={transactions} />



            {/* AI Optimizer - Bottom */}
            <div className="mt-6">
              <PortfolioOptimizer 
                assets={assets} 
                transactions={transactions}
                goals={goals}
                userEmail={user?.email} 
              />
            </div>
          </>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center mb-8">
            <Briefcase className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Carteira Vazia</h3>
            <p className="text-gray-400 mb-6">Adicione seus primeiros ativos para começar a acompanhar sua carteira</p>
            <AddAssetDialog userEmail={user?.email} onAssetAdded={loadData} />
          </div>
        )}
      </div>
    </div>
  );
}