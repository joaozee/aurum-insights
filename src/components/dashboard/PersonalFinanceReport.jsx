import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from "recharts";
import { TrendingDown } from "lucide-react";

const CATEGORY_LABELS = {
  moradia: "Moradia",
  alimentacao: "Alimentação",
  lazer: "Lazer",
  cartao_credito: "Cartão",
  assinaturas: "Assinaturas",
  transporte: "Transporte",
  saude: "Saúde",
  outros: "Outros"
};

const CATEGORY_COLORS = {
  moradia: "#8B5CF6",
  alimentacao: "#F59E0B",
  lazer: "#EC4899",
  cartao_credito: "#06B6D4",
  assinaturas: "#10B981",
  transporte: "#3B82F6",
  saude: "#14B8A6",
  outros: "#6B7280"
};

export default function PersonalFinanceReport({ transactions = [] }) {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const expenseData = useMemo(() => {
    return transactions.filter(t => t.type === "saida");
  }, [transactions]);

  const incomeData = useMemo(() => {
    return transactions.filter(t => t.type === "entrada");
  }, [transactions]);

  const filteredData = useMemo(() => {
    if (selectedCategory === "all") return expenseData;
    return expenseData.filter(t => t.category === selectedCategory);
  }, [expenseData, selectedCategory]);

  const categorySpending = useMemo(() => {
    const grouped = Object.keys(CATEGORY_LABELS).map(cat => ({
      category: CATEGORY_LABELS[cat],
      key: cat,
      value: expenseData
        .filter(t => t.category === cat)
        .reduce((sum, t) => sum + (t.amount || 0), 0)
    })).filter(d => d.value > 0);
    
    return grouped.sort((a, b) => b.value - a.value);
  }, [expenseData]);

  const totalSpent = categorySpending.reduce((sum, cat) => sum + cat.value, 0);
  const totalIncome = incomeData.reduce((sum, t) => sum + (t.amount || 0), 0);
  const balance = totalIncome - totalSpent;
  const avgPerCategory = categorySpending.length > 0 ? totalSpent / categorySpending.length : 0;

  const monthlyData = useMemo(() => {
    const months = {};
    
    expenseData.forEach(t => {
      const date = new Date(t.transaction_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('pt-BR', { year: 'numeric', month: 'short' });
      
      if (!months[monthKey]) {
        months[monthKey] = { month: monthLabel, total: 0, monthKey };
        if (selectedCategory !== "all") {
          months[monthKey][selectedCategory] = 0;
        }
      }
      
      months[monthKey].total += t.amount || 0;
      if (selectedCategory !== "all" && t.category === selectedCategory) {
        months[monthKey][selectedCategory] = (months[monthKey][selectedCategory] || 0) + (t.amount || 0);
      }
    });
    
    return Object.values(months)
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
      .slice(-12);
  }, [expenseData, selectedCategory]);

  const monthlyComparisonData = useMemo(() => {
    if (selectedCategory === "all") return [];
    
    const months = {};
    expenseData
      .filter(t => t.category === selectedCategory)
      .forEach(t => {
        const date = new Date(t.transaction_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = date.toLocaleDateString('pt-BR', { year: 'numeric', month: 'short' });
        
        if (!months[monthKey]) {
          months[monthKey] = { month: monthLabel, value: 0 };
        }
        months[monthKey].value += t.amount || 0;
      });
    
    return Object.values(months)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12);
  }, [expenseData, selectedCategory]);

  const selectedCategoryTotal = useMemo(() => {
    if (selectedCategory === "all") return 0;
    return filteredData.reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [filteredData, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-gray-900 via-gray-900 to-emerald-950/30 border border-gray-800 p-6">
          <p className="text-gray-400 text-sm mb-2">Entradas</p>
          <p className="text-3xl font-bold text-emerald-400 mb-2">
            R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-gray-500 text-xs">Total recebido</p>
        </Card>

        <Card className="bg-gradient-to-br from-gray-900 via-gray-900 to-red-950/30 border border-gray-800 p-6">
          <p className="text-gray-400 text-sm mb-2">Gastos</p>
          <p className="text-3xl font-bold text-red-400 mb-2">
            R$ {totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-gray-500 text-xs">Total gasto</p>
        </Card>

        <Card className={`bg-gradient-to-br ${balance >= 0 ? 'from-gray-900 via-gray-900 to-emerald-950/30' : 'from-gray-900 via-gray-900 to-red-950/30'} border border-gray-800 p-6`}>
          <p className="text-gray-400 text-sm mb-2">Saldo</p>
          <p className={`text-3xl font-bold mb-2 ${balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-gray-500 text-xs">Receitas - Gastos</p>
        </Card>

        <Card className="bg-gradient-to-br from-gray-900 via-gray-900 to-violet-950/30 border border-gray-800 p-6">
          <p className="text-gray-400 text-sm mb-2">Taxa de Poupança</p>
          <p className="text-3xl font-bold text-violet-400 mb-2">
            {totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : 0}%
          </p>
          <p className="text-gray-500 text-xs">Percentual poupado</p>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4 px-4">
        <label className="text-gray-300 text-sm font-medium">Filtrar por categoria:</label>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-64 bg-gray-800 border-gray-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            <SelectItem value="all">Todas as categorias</SelectItem>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <Card className="bg-gray-900 border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Gastos por Categoria</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categorySpending}>
                <XAxis 
                  dataKey="category" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280', fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#111827',
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                  formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Monthly Evolution Chart */}
        <Card className="bg-gray-900 border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-6">
            {selectedCategory === "all" ? "Evolução de Gastos" : `Evolução - ${CATEGORY_LABELS[selectedCategory]}`}
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280', fontSize: 11 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#111827',
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                  formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                />
                {selectedCategory === "all" ? (
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#F59E0B" 
                    strokeWidth={2}
                    dot={{ fill: '#F59E0B' }}
                    activeDot={{ r: 6 }}
                  />
                ) : (
                  <Line 
                    type="monotone" 
                    dataKey={selectedCategory} 
                    stroke="#8B5CF6" 
                    strokeWidth={2}
                    dot={{ fill: '#8B5CF6' }}
                    activeDot={{ r: 6 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Category Detail or All Categories Pie */}
      {selectedCategory !== "all" && monthlyComparisonData.length > 0 ? (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Category Summary Card */}
          <Card className="bg-gradient-to-br from-gray-900 via-gray-900 to-blue-950/30 border border-gray-800 p-6">
            <p className="text-gray-400 text-sm mb-2">Total Gasto em {CATEGORY_LABELS[selectedCategory]}</p>
            <p className="text-4xl font-bold text-blue-400 mb-4">
              R$ {selectedCategoryTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-gray-500 text-xs">
              {filteredData.length} transações no período
            </p>
          </Card>

          {/* Monthly Comparison Pie Chart */}
          <Card className="bg-gray-900 border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Comparação Mês a Mês</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={monthlyComparisonData}
                    dataKey="value"
                    nameKey="month"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label={({ month, percent }) => `${month} ${(percent * 100).toFixed(0)}%`}
                  >
                    {monthlyComparisonData.map((entry, index) => {
                      const colors = ['#8B5CF6', '#F59E0B', '#10B981', '#EC4899', '#3B82F6', '#14B8A6', '#06B6D4', '#6366F1', '#F87171', '#FBBF24', '#34D399', '#A78BFA'];
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                    })}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    labelFormatter={(label) => `${label}`}
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '2px solid #8B5CF6',
                      borderRadius: '8px',
                      padding: '12px',
                      boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
                    }}
                    labelStyle={{ color: '#E5E7EB', fontWeight: 'bold', marginBottom: '4px' }}
                    wrapperStyle={{ outline: 'none' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      ) : (
        <Card className="bg-gray-900 border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Distribuição</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categorySpending}
                  dataKey="value"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                >
                  {categorySpending.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.key]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  labelFormatter={(label) => `${label}`}
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '2px solid #F59E0B',
                    borderRadius: '8px',
                    padding: '12px',
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                  }}
                  labelStyle={{ color: '#E5E7EB', fontWeight: 'bold', marginBottom: '4px' }}
                  wrapperStyle={{ outline: 'none' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Detailed Table */}
      <Card className="bg-gray-900 border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-6">
          {selectedCategory === "all" ? "Todas as transações" : `Transações - ${CATEGORY_LABELS[selectedCategory]}`}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Data</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Categoria</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Descrição</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Valor</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date)).map((t, idx) => (
                  <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                    <td className="py-3 px-4 text-gray-300">
                      {new Date(t.transaction_date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 text-gray-300">{CATEGORY_LABELS[t.category] || t.category}</td>
                    <td className="py-3 px-4 text-gray-300">{t.description || '-'}</td>
                    <td className="py-3 px-4 text-right font-semibold text-red-400">
                      - R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="py-8 px-4 text-center text-gray-400">
                    Nenhuma transação encontrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}