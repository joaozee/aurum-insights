import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";

export default function CompanyPriceVsEarningsSection({ stock }) {
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

      const incomeStatements = result?.data?.incomeStatements;
      const historicalData = result?.data?.historicalDataPrice || [];

      if (incomeStatements && incomeStatements.length > 0) {
        // Agrupar preços históricos por ano
        const pricesByYear = {};
        historicalData.forEach((item) => {
          const year = new Date(item.date).getFullYear();
          if (!pricesByYear[year]) {
            pricesByYear[year] = [];
          }
          pricesByYear[year].push(item.close);
        });

        // Calcular preço médio por ano
        const avgPricesByYear = {};
        Object.keys(pricesByYear).forEach((year) => {
          const prices = pricesByYear[year];
          avgPricesByYear[year] = prices.reduce((sum, p) => sum + p, 0) / prices.length;
        });

        // Processar dados desde 2009
        const chartData = incomeStatements.
        filter((item) => {
          const year = new Date(item.endDate).getFullYear();
          return year >= 2009;
        }).
        map((item) => {
          const year = new Date(item.endDate).getFullYear();
          const lucro_bilhoes = (item.netIncome || 0) / 1000000000;
          const cotacao = avgPricesByYear[year] || null;

          return {
            year: year.toString(),
            lucro: lucro_bilhoes,
            cotacao: cotacao
          };
        }).
        filter((item) => item.cotacao !== null).
        sort((a, b) => parseInt(a.year) - parseInt(b.year));

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