import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Info, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Tooltip as UiTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { brapiService } from "@/components/utils/brapiService";
import { getSplitAdjustmentFactor } from "@/components/utils/stockSplitsDatabase";

export default function DividendHistory({ stock }) {
  const [viewMode, setViewMode] = useState("yield");
  const [dividendData, setDividendData] = useState([]);
  const [dyLTM, setDyLTM] = useState(null);
  const [tableOpen, setTableOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (stock?.ticker) {
      loadDividendData();
    }
  }, [stock?.ticker]);

  const loadDividendData = async () => {
    setLoading(true);
    try {
      // Buscar quote com dividends=true e histórico de preços diário para detectar splits
      const [quoteData, historicalDaily] = await Promise.all([
        brapiService.getQuote(stock.ticker, {
          range: '10y',
          interval: '1mo',
          dividends: true,
          fundamental: false
        }),
        brapiService.getHistorical(stock.ticker, '10y', '1d')
      ]);
      
      const dividends = quoteData?.dividendsData?.cashDividends || [];

      if (dividends.length > 0) {
        formatDividendData(dividends, historicalDaily);
      }
    } catch (err) {
      console.error("Erro ao carregar dividendos:", err);
      setDividendData([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDividendData = (dividends, historicalData) => {
    const thisYear = new Date().getFullYear();
    const minYear = thisYear - 10;
    const now = new Date();
    const ltmStart = new Date(now);
    ltmStart.setFullYear(ltmStart.getFullYear() - 1);

    // Mapa: ano -> preço de fechamento do último candle do ano (ajustado por splits pela BRAPI)
    const lastPriceByYear = {};
    const sortedHistory = (historicalData || [])
      .filter(item => item.close > 0)
      .sort((a, b) => a.date - b.date);
    sortedHistory.forEach(item => {
      const year = new Date(item.date * 1000).getFullYear();
      lastPriceByYear[year] = item.close;
    });

    const tickerUpper = (stock.ticker || '').toUpperCase();

    // Determina se o ticker é FII
    const isFII = /\d{2}$/.test(stock.ticker) && stock.ticker.endsWith('11');
    const validTypes = isFII
      ? ['RENDIMENTO']
      : ['DIVIDEND', 'JCP', 'INTEREST_ON_EQUITY'];

    const normalizeType = (label) => {
      if (!label) return null;
      const l = label.toUpperCase().trim();
      if (l === 'DIVIDENDO' || l === 'DIVIDEND') return 'DIVIDEND';
      if (l === 'JCP') return 'JCP';
      if (l === 'INTEREST_ON_EQUITY') return 'INTEREST_ON_EQUITY';
      if (l === 'RENDIMENTO') return 'RENDIMENTO';
      return null;
    };

    // Deduplicar por exDate + rate + tipo
    const seen = new Set();
    const clean = [];
    dividends.forEach(div => {
      const type = normalizeType(div.label || div.type);
      if (!validTypes.includes(type)) return;

      const exDate = div.lastDatePrior;
      if (!exDate) return;

      const rawRate = parseFloat(div.rate || div.amount || 0);
      if (rawRate <= 0) return;

      const exDateShort = exDate.substring(0, 10);
      const key = `${exDateShort}_${rawRate.toFixed(6)}_${type}`;
      if (seen.has(key)) return;
      seen.add(key);

      // Ajustar pelo fator de split acumulado após essa data (usando base centralizada)
      const splitFactor = getSplitAdjustmentFactor(tickerUpper, exDate);
      const adjustedRate = rawRate / splitFactor;

      const year = new Date(exDate).getFullYear();
      clean.push({ exDate, year, netRate: adjustedRate, rawRate, type, splitFactor });
    });

    const clean2022 = clean.filter(d => d.year === 2022);
    console.log('[DividendHistory] clean 2022 count:', clean2022.length, 'sum2022:', clean2022.reduce((s,d)=>s+d.netRate,0).toFixed(4));

    // Filtrar janela de 10 anos
    const filtered = clean.filter(d => d.year >= minYear && d.year <= thisYear + 1);

    // Agrupar por ano
    const byYear = {};
    filtered.forEach(d => {
      if (!byYear[d.year]) byYear[d.year] = { year: d.year, totalAmount: 0, count: 0 };
      byYear[d.year].totalAmount += d.netRate;
      byYear[d.year].count += 1;
    });

    // LTM
    const dividendosLTM = filtered
      .filter(d => new Date(d.exDate) >= ltmStart)
      .reduce((sum, d) => sum + d.netRate, 0);

    const currentPrice = stock.current_price || 1;
    const dyLTMValue = (dividendosLTM / currentPrice) * 100;

    const formatted = Object.values(byYear)
      .sort((a, b) => a.year - b.year)
      .map(item => {
        let yieldPercent = 0;
        if (item.year === thisYear) {
          yieldPercent = (item.totalAmount / currentPrice) * 100;
        } else {
          const avgPrice = lastPriceByYear[item.year] || currentPrice;
          yieldPercent = (item.totalAmount / avgPrice) * 100;
        }
        return {
          year: item.year,
          yield: parseFloat(yieldPercent.toFixed(2)),
          amount: parseFloat(item.totalAmount.toFixed(4)),
          count: item.count
        };
      });

    console.log('[DividendHistory] byYear:', JSON.stringify(Object.values(byYear).map(y => ({year: y.year, total: y.totalAmount.toFixed(4), count: y.count}))));
    setDividendData(formatted);
    setDyLTM(parseFloat(dyLTMValue.toFixed(2)));
  };

  // Exclui o ano atual dos cálculos de média (ano incompleto)
  const currentYear = new Date().getFullYear();
  const completedYears = dividendData.filter(d => d.year < currentYear);

  const getAvg = (n) => {
    const slice = completedYears.slice(-n);
    if (slice.length === 0) return "N/A";
    const avg = slice.reduce((s, d) => s + d.yield, 0) / slice.length;
    return avg.toFixed(2);
  };

  // DY atual: usar LTM calculado (últimos 12 meses com regras corretas)
  const currentYield = dyLTM !== null
    ? dyLTM.toFixed(2)
    : typeof stock?.dividend_yield === 'number'
      ? stock.dividend_yield.toFixed(2)
      : "N/A";

  const avgYield5y = getAvg(5);
  const avgYield10y = getAvg(10);

  const dataToDisplay = dividendData.map(d => ({
    ...d,
    value: viewMode === "yield" ? d.yield : d.amount
  }));

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">Histórico de Dividendos - {stock?.ticker}</h3>
          <div className="flex gap-6 flex-wrap">
            <div>
              <p className="text-gray-400 text-sm">DY atual</p>
              <p className={`font-bold text-lg ${currentYield === "N/A" ? "text-gray-500" : "text-amber-400"}`}>
                {currentYield === "N/A" ? "N/A" : `${currentYield}%`}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">DY médio em 5 anos</p>
              <p className={`font-bold text-lg ${avgYield5y === "N/A" ? "text-gray-500" : "text-blue-400"}`}>
                {avgYield5y === "N/A" ? "N/A" : `${avgYield5y}%`}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">DY médio em 10 anos</p>
              <p className={`font-bold text-lg ${avgYield10y === "N/A" ? "text-gray-500" : "text-emerald-400"}`}>
                {avgYield10y === "N/A" ? "N/A" : `${avgYield10y}%`}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button
            size="sm"
            onClick={() => setViewMode("yield")}
            className={viewMode === "yield" ? "bg-amber-500 text-black hover:bg-amber-600" : "border-gray-700 bg-transparent text-gray-300 hover:bg-gray-800 border"}
          >
            Dividend Yield
          </Button>
          <Button
            size="sm"
            onClick={() => setViewMode("amount")}
            className={viewMode === "amount" ? "bg-amber-500 text-black hover:bg-amber-600" : "border-gray-700 bg-transparent text-gray-300 hover:bg-gray-800 border"}
          >
            Valor (R$)
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
        </div>
      ) : dataToDisplay.length === 0 ? (
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">Nenhum dado de dividendos disponível para este ativo</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dataToDisplay}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
            <XAxis dataKey="year" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={v => viewMode === "yield" ? `${v.toFixed(0)}%` : `${v.toFixed(2)}`} />
            <Tooltip
              formatter={(value) => viewMode === "yield" ? [`${value.toFixed(2)}%`, "DY"] : [`R$ ${value.toFixed(4)}`, "Dividendo/ação"]}
              contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff" }}
              cursor={{ fill: 'rgba(251,191,36,0.05)' }}
            />
            <Bar dataKey="value" fill="#FBBF24" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* Tabela de Dividendos */}
      <div className="mt-6">
        <button
          onClick={() => setTableOpen(!tableOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <h4 className="text-base font-semibold text-white">Detalhamento por Ano</h4>
          {tableOpen ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
        </button>
        {tableOpen && dividendData.length > 0 && (
          <div className="overflow-x-auto mt-2">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left px-4 py-3 text-gray-400 font-medium text-sm">ANO</th>
                  <th className="text-right px-4 py-3 text-gray-400 font-medium text-sm">DIVIDEND YIELD</th>
                  <th className="text-right px-4 py-3 text-gray-400 font-medium text-sm">VALOR (R$/ação)</th>
                  <th className="text-right px-4 py-3 text-gray-400 font-medium text-sm">Nº PAGAMENTOS</th>
                </tr>
              </thead>
              <tbody>
                {[...dividendData].reverse().map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 text-white font-medium">{item.year}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-amber-400 font-semibold">{item.yield.toFixed(2)}%</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-emerald-400 font-semibold">R$ {item.amount.toFixed(4)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-gray-400">{item.count}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}