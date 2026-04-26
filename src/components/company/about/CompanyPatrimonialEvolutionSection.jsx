import { useState, useEffect } from "react";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";

export default function CompanyPatrimonialEvolutionSection({ stock }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (stock?.ticker) {
      fetchData();
    }
  }, [stock?.ticker]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await base44.functions.invoke('getStockFundamentals', {
        ticker: stock.ticker
      });

      const balanceSheets = result?.data?.balanceSheetStatements || [];
      const incomeStatements = result?.data?.incomeStatements || [];

      // VPA atual e shares para calcular patrimônio quando não há balanço histórico
      const vpa = result?.data?.book_value_per_share;
      const shares = result?.data?.shares_outstanding;
      const pbRatio = result?.data?.pb_ratio;
      const currentPrice = result?.data?.regularMarketPrice;

      // Mapa do balanço por ano
      const balanceMap = {};
      balanceSheets.forEach((item) => {
        const year = new Date(item.endDate).getFullYear();
        const equity = item.totalStockholderEquity ?? item.totalStockholdersEquity ?? null;
        if (equity != null) balanceMap[year] = equity;
      });

      // Processar incomeStatements por ano
      const chartData = incomeStatements.
      map((item) => {
        const year = new Date(item.endDate).getFullYear();

        // Patrimônio: usar balanço histórico se disponível
        // Senão, calcular via P/VP: Preço da ação / pb_ratio = VPA → VPA × shares = PL
        // Como não temos preço histórico aqui, usamos o equity do balanço ou o atual como aproximação
        let patrimonio = 0;
        if (balanceMap[year]) {
          patrimonio = balanceMap[year] / 1000000;
        } else if (vpa && shares) {
          // Usar VPA atual × shares como estimativa (só para anos sem balanço)
          patrimonio = vpa * shares / 1000000;
        }

        return {
          year: year.toString(),
          patrimonio,
          receita: (item.totalRevenue || 0) / 1000000,
          lucro: (item.netIncome || 0) / 1000000
        };
      }).
      filter((item) => parseInt(item.year) >= 2014).
      sort((a, b) => parseInt(a.year) - parseInt(b.year));

      if (chartData.length > 0) {
        setData(chartData);
      }
    } catch (err) {
      console.error("Erro ao buscar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  return null;






































}