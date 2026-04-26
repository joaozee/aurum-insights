import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart } from "recharts";
import { TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";

export default function CompanyRevenueChartSection({ stock }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (stock?.ticker) {
      fetchFinancialData();
    }
  }, [stock?.ticker]);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      // Buscar dados reais da API
      const result = await base44.functions.invoke('getStockFundamentals', { 
        ticker: stock.ticker 
      });
      
      const incomeStatements = result?.data?.incomeStatements;
      
      if (incomeStatements && incomeStatements.length > 0) {
        // Usar dados REAIS da API desde 2016
        const chartData = incomeStatements
          .filter(item => {
            const year = new Date(item.endDate).getFullYear();
            return year >= 2016;
          })
          .map(item => ({
            year: new Date(item.endDate).getFullYear().toString(),
            receita: (item.totalRevenue || 0) / 1000000000,
            lucro: (item.netIncome || 0) / 1000000000
          }))
          .sort((a, b) => parseInt(a.year) - parseInt(b.year));
        
        setData(chartData);
      }
    } catch (err) {
      console.error("Erro ao buscar dados financeiros:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-gray-900 border-gray-800 p-6">
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="h-5 w-5 text-green-400" />
        <h3 className="text-lg font-semibold text-white">RECEITAS E LUCROS</h3>
      </div>
      
      <div className="w-full h-80 flex items-center justify-center">
        {loading ? (
          <div className="text-gray-400">Carregando dados...</div>
        ) : data.length === 0 ? (
          <div className="text-gray-400">Dados financeiros não disponíveis para este ativo</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="year" stroke="#9CA3AF" />
              <YAxis 
                stroke="#9CA3AF"
                tickFormatter={(value) => `${value.toFixed(1)}B`}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151" }}
                labelStyle={{ color: "#FFFFFF" }}
                formatter={(value) => `R$ ${value.toFixed(2)}B`}
              />
              <Legend />
              <Bar dataKey="receita" fill="#10B981" name="Receita Líquida" />
              <Bar dataKey="lucro" fill="#F97316" name="Lucro Líquido" radius={[4, 4, 0, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}