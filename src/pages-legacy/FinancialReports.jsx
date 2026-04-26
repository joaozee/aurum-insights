import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, ArrowLeft, Download, Filter, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import jsPDF from "jspdf";

export default function FinancialReports() {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("monthly");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      const transactionsData = await base44.entities.FinanceTransaction.filter({
        user_email: userData.email
      });

      setTransactions(transactionsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (cat) => {
    const labels = {
      salario: 'Salário',
      pix_recebido: 'PIX',
      bonus: 'Bônus',
      aluguel: 'Aluguel',
      alimentacao: 'Alimentação',
      lazer: 'Lazer',
      cartao_credito: 'Cartão de Crédito',
      assinaturas: 'Assinaturas',
      transporte: 'Transporte',
      saude: 'Saúde'
    };
    return labels[cat] || cat;
  };

  const getDateRange = (periodType) => {
    const now = new Date();
    const ranges = {
      monthly: {
        from: new Date(now.getFullYear(), now.getMonth(), 1),
        to: now
      },
      quarterly: {
        from: new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1),
        to: now
      },
      annual: {
        from: new Date(now.getFullYear(), 0, 1),
        to: now
      },
      custom: {
        from: customFrom ? new Date(customFrom) : new Date(now.getFullYear(), now.getMonth(), 1),
        to: customTo ? new Date(customTo) : now
      }
    };
    return ranges[periodType] || ranges.monthly;
  };

  const getFilteredTransactions = () => {
    const range = getDateRange(period);
    let filtered = transactions.filter(t => {
      const tDate = new Date(t.transaction_date);
      return tDate >= range.from && tDate <= range.to;
    });

    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    if (selectedType && selectedType !== 'all') {
      filtered = filtered.filter(t => t.type === selectedType);
    }

    return filtered;
  };

  const getMonthlyTrends = () => {
    const filtered = getFilteredTransactions();
    const monthlyData = {};

    filtered.forEach(t => {
      const date = new Date(t.transaction_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthKey, entrada: 0, saida: 0 };
      }
      
      if (t.type === 'entrada') {
        monthlyData[monthKey].entrada += t.amount;
      } else {
        monthlyData[monthKey].saida += t.amount;
      }
    });

    return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
  };

  const getCategoryDistribution = () => {
    const filtered = getFilteredTransactions().filter(t => t.type === 'saida');
    const categoryData = {};

    filtered.forEach(t => {
      const label = getCategoryLabel(t.category);
      if (!categoryData[label]) {
        categoryData[label] = 0;
      }
      categoryData[label] += t.amount;
    });

    return Object.entries(categoryData).map(([name, value]) => ({ name, value }));
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const filtered = getFilteredTransactions();

    doc.setFontSize(20);
    doc.text('Relatório Financeiro', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Período: ${period}`, 20, 35);
    doc.text(`Total de Entradas: R$ ${income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, 45);
    doc.text(`Total de Saídas: R$ ${expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, 55);
    doc.text(`Saldo: R$ ${balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, 65);

    doc.setFontSize(14);
    doc.text('Transações', 20, 80);

    let y = 90;
    doc.setFontSize(10);
    filtered.slice(0, 30).forEach((t, idx) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      const line = `${new Date(t.transaction_date).toLocaleDateString('pt-BR')} - ${getCategoryLabel(t.category)} - ${t.type === 'entrada' ? '+' : '-'}R$ ${t.amount.toFixed(2)}`;
      doc.text(line, 20, y);
      y += 7;
    });

    doc.save('relatorio-financeiro.pdf');
  };

  const exportToCSV = () => {
    const filtered = getFilteredTransactions();
    const headers = ['Data', 'Categoria', 'Descrição', 'Tipo', 'Valor'];
    const rows = filtered.map(t => [
      new Date(t.transaction_date).toLocaleDateString('pt-BR'),
      getCategoryLabel(t.category),
      t.description || '',
      t.type === 'entrada' ? 'Entrada' : 'Saída',
      t.amount.toFixed(2)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'relatorio-financeiro.csv';
    link.click();
  };

  const filtered = getFilteredTransactions();
  const income = filtered.filter(t => t.type === 'entrada').reduce((sum, t) => sum + t.amount, 0);
  const expenses = filtered.filter(t => t.type === 'saida').reduce((sum, t) => sum + t.amount, 0);
  const balance = income - expenses;
  const monthlyTrends = getMonthlyTrends();
  const categoryDistribution = getCategoryDistribution();

  const COLORS = ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#EF4444', '#14B8A6', '#F97316'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-16 w-full rounded-2xl bg-gray-800 mb-8" />
          <Skeleton className="h-24 w-full rounded-2xl bg-gray-800 mb-8" />
          <div className="grid lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-48 rounded-2xl bg-gray-800" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to={createPageUrl("Dashboard")} className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 group">
          <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          <span>Voltar para Finanças</span>
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Relatórios Financeiros</h1>
            <p className="text-gray-400 text-sm">Análise detalhada de receitas e despesas</p>
          </div>
        </div>

        {/* Filters and Export */}
        <Card className="bg-gray-900 border-gray-800 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-violet-400" />
              <h3 className="text-lg font-semibold text-white">Filtros</h3>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={exportToPDF}
                className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
              >
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button
                variant="outline"
                onClick={exportToCSV}
                className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
              >
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-gray-300 text-sm mb-2">Período</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="monthly" className="text-white">Mensal</SelectItem>
                  <SelectItem value="quarterly" className="text-white">Trimestral</SelectItem>
                  <SelectItem value="annual" className="text-white">Anual</SelectItem>
                  <SelectItem value="custom" className="text-white">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-300 text-sm mb-2">Categoria</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all" className="text-white">Todas</SelectItem>
                  <SelectItem value="salario" className="text-white">Salário</SelectItem>
                  <SelectItem value="pix_recebido" className="text-white">PIX</SelectItem>
                  <SelectItem value="bonus" className="text-white">Bônus</SelectItem>
                  <SelectItem value="aluguel" className="text-white">Aluguel</SelectItem>
                  <SelectItem value="alimentacao" className="text-white">Alimentação</SelectItem>
                  <SelectItem value="lazer" className="text-white">Lazer</SelectItem>
                  <SelectItem value="cartao_credito" className="text-white">Cartão de Crédito</SelectItem>
                  <SelectItem value="assinaturas" className="text-white">Assinaturas</SelectItem>
                  <SelectItem value="transporte" className="text-white">Transporte</SelectItem>
                  <SelectItem value="saude" className="text-white">Saúde</SelectItem>
                  <SelectItem value="outros" className="text-white">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-300 text-sm mb-2">Tipo</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all" className="text-white">Todos</SelectItem>
                  <SelectItem value="entrada" className="text-white">Entradas</SelectItem>
                  <SelectItem value="saida" className="text-white">Saídas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {period === 'custom' && (
              <div className="md:col-span-4 grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300 text-sm mb-2">Data Inicial</Label>
                  <Input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300 text-sm mb-2">Data Final</Label>
                  <Input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Summary Cards */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <Card className="bg-gradient-to-br from-emerald-950/50 to-emerald-900/30 border-emerald-800/50 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-sm">Total Entradas</p>
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            </div>
            <p className="text-3xl font-bold text-emerald-400">
              R$ {income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </Card>

          <Card className="bg-gradient-to-br from-red-950/50 to-red-900/30 border-red-800/50 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-sm">Total Saídas</p>
              <TrendingDown className="h-5 w-5 text-red-400" />
            </div>
            <p className="text-3xl font-bold text-red-400">
              R$ {expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </Card>

          <Card className={`bg-gradient-to-br ${balance >= 0 ? 'from-blue-950/50 to-blue-900/30 border-blue-800/50' : 'from-orange-950/50 to-orange-900/30 border-orange-800/50'} p-6`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-sm">Saldo</p>
              <Calendar className="h-5 w-5" />
            </div>
            <p className={`text-3xl font-bold ${balance >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>
              R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </Card>
        </div>

        {/* Interactive Charts */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Card className="bg-gray-900 border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Tendência Mensal</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Legend />
                <Line type="monotone" dataKey="entrada" stroke="#10B981" strokeWidth={2} name="Entradas" />
                <Line type="monotone" dataKey="saida" stroke="#EF4444" strokeWidth={2} name="Saídas" />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="bg-gray-900 border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Distribuição por Categoria</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', color: '#FFFFFF' }}
                  itemStyle={{ color: '#FFFFFF' }}
                  labelStyle={{ color: '#FFFFFF' }}
                  formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card className="bg-gray-900 border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Transações Detalhadas</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Data</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Categoria</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Descrição</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Tipo</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Valor</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? (
                  filtered.map((t, idx) => (
                    <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                      <td className="py-3 px-4 text-gray-300">
                        {new Date(t.transaction_date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 px-4 text-gray-300">{getCategoryLabel(t.category)}</td>
                      <td className="py-3 px-4 text-gray-300">{t.description || '-'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          t.type === 'entrada' 
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {t.type === 'entrada' ? 'Entrada' : 'Saída'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold">
                        <span className={t.type === 'entrada' ? 'text-emerald-400' : 'text-red-400'}>
                          {t.type === 'entrada' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-8 px-4 text-center text-gray-400">
                      Nenhuma transação encontrada para este período
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>


      </div>
    </div>
  );
}