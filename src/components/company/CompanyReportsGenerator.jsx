import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Download, BarChart3, TrendingUp, PieChart as PieChartIcon } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import jsPDF from "jspdf";

export default function CompanyReportsGenerator({ transactions }) {
  const [selectedReport, setSelectedReport] = useState("dre");
  const [selectedPeriod, setSelectedPeriod] = useState("monthly");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const getDateRange = () => {
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
    return ranges[selectedPeriod] || ranges.monthly;
  };

  const getFilteredTransactions = () => {
    const range = getDateRange();
    return transactions.filter(t => {
      const tDate = new Date(t.transaction_date);
      return tDate >= range.from && tDate <= range.to;
    });
  };

  const calculateDRE = () => {
    const filtered = getFilteredTransactions();
    const revenues = {
      vendas: 0,
      servicos: 0,
      investimento: 0
    };
    const expenses = {
      salarios: 0,
      aluguel_comercial: 0,
      energia: 0,
      internet: 0,
      marketing: 0,
      estoque: 0,
      transporte: 0,
      impostos: 0,
      manutencao: 0,
      seguros: 0,
      consultoria: 0,
      software: 0,
      outros: 0
    };

    filtered.forEach(t => {
      if (t.type === 'entrada' && revenues.hasOwnProperty(t.category)) {
        revenues[t.category] += t.amount;
      } else if (t.type === 'saida' && expenses.hasOwnProperty(t.category)) {
        expenses[t.category] += t.amount;
      }
    });

    const totalRevenues = Object.values(revenues).reduce((a, b) => a + b, 0);
    const totalExpenses = Object.values(expenses).reduce((a, b) => a + b, 0);
    const grossProfit = totalRevenues - totalExpenses;
    const profitMargin = totalRevenues > 0 ? (grossProfit / totalRevenues) * 100 : 0;

    return { revenues, expenses, totalRevenues, totalExpenses, grossProfit, profitMargin };
  };

  const calculateCashFlow = () => {
    const filtered = getFilteredTransactions();
    const monthlyData = {};

    filtered.forEach(t => {
      const date = new Date(t.transaction_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthKey, receipts: 0, payments: 0 };
      }
      
      if (t.type === 'entrada') {
        monthlyData[monthKey].receipts += t.amount;
      } else {
        monthlyData[monthKey].payments += t.amount;
      }
    });

    return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
  };

  const calculateBalanceSheet = () => {
    const filtered = getFilteredTransactions();
    const assets = {
      cash: 0,
      investments: 0
    };
    const liabilities = {
      loans: 0,
      accounts_payable: 0
    };
    const equity = {
      capital: 0,
      retained_earnings: 0
    };

    let totalIncome = 0;
    let totalExpenses = 0;

    filtered.forEach(t => {
      if (t.type === 'entrada') {
        totalIncome += t.amount;
        if (t.category === 'investimento') {
          assets.investments += t.amount;
        } else {
          assets.cash += t.amount;
        }
      } else {
        totalExpenses += t.amount;
        if (t.category === 'emprestimo') {
          liabilities.loans += t.amount;
        } else {
          liabilities.accounts_payable += t.amount;
        }
      }
    });

    equity.retained_earnings = totalIncome - totalExpenses;

    return { assets, liabilities, equity };
  };

  const calculateProfitability = () => {
    const dre = calculateDRE();
    const filtered = getFilteredTransactions();
    
    const totalAssets = filtered
      .filter(t => t.type === 'entrada')
      .reduce((sum, t) => sum + t.amount, 0);

    const roa = totalAssets > 0 ? (dre.grossProfit / totalAssets) * 100 : 0;
    const roe = dre.grossProfit > 0 ? (dre.grossProfit / Math.max(dre.grossProfit, 1)) * 100 : 0;

    return {
      netIncome: dre.grossProfit,
      profitMargin: dre.profitMargin,
      roa,
      roe,
      totalAssets
    };
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const range = getDateRange();
    
    doc.setFontSize(20);
    doc.text(`Relatório Empresarial - ${selectedReport.toUpperCase()}`, 20, 20);
    
    doc.setFontSize(10);
    doc.text(`Período: ${range.from.toLocaleDateString('pt-BR')} a ${range.to.toLocaleDateString('pt-BR')}`, 20, 30);

    let y = 45;

    if (selectedReport === 'dre') {
      const dre = calculateDRE();
      doc.setFontSize(12);
      doc.text('DEMONSTRAÇÃO DO RESULTADO DO EXERCÍCIO (DRE)', 20, y);
      y += 10;

      doc.setFontSize(10);
      doc.text(`Receitas Brutas: R$ ${dre.totalRevenues.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, y);
      y += 7;
      doc.text(`Despesas Operacionais: R$ ${dre.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, y);
      y += 7;
      doc.text(`Lucro Líquido: R$ ${dre.grossProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, y);
      y += 7;
      doc.text(`Margem de Lucro: ${dre.profitMargin.toFixed(2)}%`, 20, y);
    } else if (selectedReport === 'cashflow') {
      const cashflow = calculateCashFlow();
      doc.setFontSize(12);
      doc.text('FLUXO DE CAIXA', 20, y);
      y += 10;

      doc.setFontSize(9);
      cashflow.forEach(month => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(`${month.month}: Entradas R$ ${month.receipts.toFixed(2)} | Saídas R$ ${month.payments.toFixed(2)}`, 20, y);
        y += 6;
      });
    } else if (selectedReport === 'balancesheet') {
      const bs = calculateBalanceSheet();
      doc.setFontSize(12);
      doc.text('BALANÇO PATRIMONIAL', 20, y);
      y += 10;

      doc.setFontSize(10);
      doc.text('ATIVO:', 20, y);
      y += 6;
      doc.text(`Caixa: R$ ${bs.assets.cash.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 25, y);
      y += 6;
      doc.text(`Investimentos: R$ ${bs.assets.investments.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 25, y);
      y += 10;

      doc.text('PASSIVO:', 20, y);
      y += 6;
      doc.text(`Empréstimos: R$ ${bs.liabilities.loans.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 25, y);
      y += 6;
      doc.text(`Contas a Pagar: R$ ${bs.liabilities.accounts_payable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 25, y);
      y += 10;

      doc.text('PATRIMÔNIO:', 20, y);
      y += 6;
      doc.text(`Lucros Retidos: R$ ${bs.equity.retained_earnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 25, y);
    } else if (selectedReport === 'profitability') {
      const prof = calculateProfitability();
      doc.setFontSize(12);
      doc.text('ANÁLISE DE RENTABILIDADE', 20, y);
      y += 10;

      doc.setFontSize(10);
      doc.text(`Lucro Líquido: R$ ${prof.netIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, y);
      y += 7;
      doc.text(`Margem de Lucro: ${prof.profitMargin.toFixed(2)}%`, 20, y);
      y += 7;
      doc.text(`ROA (Retorno sobre Ativos): ${prof.roa.toFixed(2)}%`, 20, y);
      y += 7;
      doc.text(`ROE (Retorno sobre Patrimônio): ${prof.roe.toFixed(2)}%`, 20, y);
    }

    doc.save(`relatorio-${selectedReport}.pdf`);
  };

  const exportToCSV = () => {
    let csvContent = '';
    
    if (selectedReport === 'dre') {
      const dre = calculateDRE();
      csvContent = 'DRE - DEMONSTRAÇÃO DO RESULTADO DO EXERCÍCIO\nReceita,Valor\n';
      Object.entries(dre.revenues).forEach(([cat, val]) => {
        csvContent += `${cat},${val.toFixed(2)}\n`;
      });
      csvContent += `\nTotal Receitas,${dre.totalRevenues.toFixed(2)}\n\nDespesa,Valor\n`;
      Object.entries(dre.expenses).forEach(([cat, val]) => {
        csvContent += `${cat},${val.toFixed(2)}\n`;
      });
      csvContent += `\nTotal Despesas,${dre.totalExpenses.toFixed(2)}\nLucro Líquido,${dre.grossProfit.toFixed(2)}\n`;
    } else if (selectedReport === 'cashflow') {
      const cashflow = calculateCashFlow();
      csvContent = 'FLUXO DE CAIXA\nMês,Entradas,Saídas,Saldo\n';
      cashflow.forEach(month => {
        csvContent += `${month.month},${month.receipts.toFixed(2)},${month.payments.toFixed(2)},${(month.receipts - month.payments).toFixed(2)}\n`;
      });
    } else if (selectedReport === 'balancesheet') {
      const bs = calculateBalanceSheet();
      csvContent = 'BALANÇO PATRIMONIAL\nAtivo,Valor\n';
      csvContent += `Caixa,${bs.assets.cash.toFixed(2)}\nInvestimentos,${bs.assets.investments.toFixed(2)}\n`;
      csvContent += '\nPassivo,Valor\n';
      csvContent += `Empréstimos,${bs.liabilities.loans.toFixed(2)}\nContas a Pagar,${bs.liabilities.accounts_payable.toFixed(2)}\n`;
      csvContent += '\nPatrimônio,Valor\n';
      csvContent += `Lucros Retidos,${bs.equity.retained_earnings.toFixed(2)}\n`;
    } else if (selectedReport === 'profitability') {
      const prof = calculateProfitability();
      csvContent = 'ANÁLISE DE RENTABILIDADE\nMétrica,Valor\n';
      csvContent += `Lucro Líquido,${prof.netIncome.toFixed(2)}\nMargem de Lucro,${prof.profitMargin.toFixed(2)}%\nROA,${prof.roa.toFixed(2)}%\nROE,${prof.roe.toFixed(2)}%\n`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-${selectedReport}.csv`;
    link.click();
  };

  const dre = calculateDRE();
  const cashflow = calculateCashFlow();
  const bs = calculateBalanceSheet();
  const prof = calculateProfitability();

  const COLORS = ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#EF4444'];

  return (
    <div className="space-y-6">
      <Card className="bg-gray-900 border-gray-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-400" />
            Relatórios Empresariais
          </h3>
          <div className="flex gap-2">
            <Button onClick={exportToPDF} className="bg-blue-600 hover:bg-blue-700">
              <Download className="h-4 w-4 mr-2" /> PDF
            </Button>
            <Button onClick={exportToCSV} variant="outline" className="border-gray-700">
              <Download className="h-4 w-4 mr-2" /> CSV
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <Label className="text-gray-300 text-sm mb-2">Tipo de Relatório</Label>
            <Select value={selectedReport} onValueChange={setSelectedReport}>
              <SelectTrigger className="bg-gray-800 border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="dre">DRE (Demonstração do Resultado)</SelectItem>
                <SelectItem value="cashflow">Fluxo de Caixa</SelectItem>
                <SelectItem value="balancesheet">Balanço Patrimonial</SelectItem>
                <SelectItem value="profitability">Análise de Rentabilidade</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-gray-300 text-sm mb-2">Período</Label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="bg-gray-800 border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="monthly">Mensal</SelectItem>
                <SelectItem value="quarterly">Trimestral</SelectItem>
                <SelectItem value="annual">Anual</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div />
        </div>
      </Card>

      {selectedReport === 'dre' && (
        <>
          <div className="grid lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-emerald-950/50 to-emerald-900/30 border-emerald-800/50 p-6">
              <p className="text-gray-400 text-sm mb-2">Receita Total</p>
              <p className="text-2xl font-bold text-emerald-400">
                R$ {dre.totalRevenues.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </Card>
            <Card className="bg-gradient-to-br from-red-950/50 to-red-900/30 border-red-800/50 p-6">
              <p className="text-gray-400 text-sm mb-2">Despesa Total</p>
              <p className="text-2xl font-bold text-red-400">
                R$ {dre.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </Card>
            <Card className="bg-gradient-to-br from-blue-950/50 to-blue-900/30 border-blue-800/50 p-6">
              <p className="text-gray-400 text-sm mb-2">Lucro Líquido</p>
              <p className={`text-2xl font-bold ${dre.grossProfit >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>
                R$ {dre.grossProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </Card>
            <Card className="bg-gradient-to-br from-violet-950/50 to-violet-900/30 border-violet-800/50 p-6">
              <p className="text-gray-400 text-sm mb-2">Margem de Lucro</p>
              <p className="text-2xl font-bold text-violet-400">{dre.profitMargin.toFixed(2)}%</p>
            </Card>
          </div>

          {/* Gráficos de Pizza */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="bg-gray-900 border-gray-800 p-6">
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-emerald-400" />
                Distribuição de Receitas
              </h4>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={Object.entries(dre.revenues)
                      .filter(([_, value]) => value > 0)
                      .map(([name, value]) => ({
                        name: name.replace(/_/g, ' '),
                        value: value
                      }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {Object.entries(dre.revenues)
                      .filter(([_, value]) => value > 0)
                      .map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                    formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card className="bg-gray-900 border-gray-800 p-6">
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-red-400" />
                Distribuição de Despesas
              </h4>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={Object.entries(dre.expenses)
                      .filter(([_, value]) => value > 0)
                      .map(([name, value]) => ({
                        name: name.replace(/_/g, ' '),
                        value: value
                      }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {Object.entries(dre.expenses)
                      .filter(([_, value]) => value > 0)
                      .map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                    formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <Card className="bg-gray-900 border-gray-800 p-6">
            <h4 className="text-lg font-semibold text-white mb-4">Composição da DRE</h4>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h5 className="text-white font-semibold mb-4">Receitas</h5>
                {Object.entries(dre.revenues).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-gray-300 mb-2 text-sm">
                    <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                    <span>R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
              <div>
                <h5 className="text-white font-semibold mb-4">Despesas</h5>
                {Object.entries(dre.expenses).filter(([_, v]) => v > 0).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-gray-300 mb-2 text-sm">
                    <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                    <span>R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </>
      )}

      {selectedReport === 'cashflow' && (
        <Card className="bg-gray-900 border-gray-800 p-6">
          <h4 className="text-lg font-semibold text-white mb-4">Fluxo de Caixa Mensal</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={cashflow}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
              <Legend />
              <Line type="monotone" dataKey="receipts" stroke="#10B981" name="Entradas" strokeWidth={2} />
              <Line type="monotone" dataKey="payments" stroke="#EF4444" name="Saídas" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {selectedReport === 'balancesheet' && (
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-gray-900 border-gray-800 p-6">
            <h4 className="text-lg font-semibold text-white mb-4">Ativo</h4>
            <div className="space-y-3">
              <div className="flex justify-between text-gray-300">
                <span>Caixa</span>
                <span className="text-emerald-400">R$ {bs.assets.cash.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Investimentos</span>
                <span className="text-emerald-400">R$ {bs.assets.investments.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </Card>

          <Card className="bg-gray-900 border-gray-800 p-6">
            <h4 className="text-lg font-semibold text-white mb-4">Passivo</h4>
            <div className="space-y-3">
              <div className="flex justify-between text-gray-300">
                <span>Empréstimos</span>
                <span className="text-red-400">R$ {bs.liabilities.loans.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Contas a Pagar</span>
                <span className="text-red-400">R$ {bs.liabilities.accounts_payable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </Card>

          <Card className="bg-gray-900 border-gray-800 p-6">
            <h4 className="text-lg font-semibold text-white mb-4">Patrimônio</h4>
            <div className="space-y-3">
              <div className="flex justify-between text-gray-300">
                <span>Lucros Retidos</span>
                <span className={bs.equity.retained_earnings >= 0 ? 'text-blue-400' : 'text-orange-400'}>
                  R$ {bs.equity.retained_earnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {selectedReport === 'profitability' && (
        <div className="grid lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-950/50 to-blue-900/30 border-blue-800/50 p-6">
            <p className="text-gray-400 text-sm mb-2">Lucro Líquido</p>
            <p className="text-2xl font-bold text-blue-400">
              R$ {prof.netIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </Card>
          <Card className="bg-gradient-to-br from-violet-950/50 to-violet-900/30 border-violet-800/50 p-6">
            <p className="text-gray-400 text-sm mb-2">Margem de Lucro</p>
            <p className="text-2xl font-bold text-violet-400">{prof.profitMargin.toFixed(2)}%</p>
          </Card>
          <Card className="bg-gradient-to-br from-cyan-950/50 to-cyan-900/30 border-cyan-800/50 p-6">
            <p className="text-gray-400 text-sm mb-2">ROA (Return on Assets)</p>
            <p className="text-2xl font-bold text-cyan-400">{prof.roa.toFixed(2)}%</p>
          </Card>
          <Card className="bg-gradient-to-br from-orange-950/50 to-orange-900/30 border-orange-800/50 p-6">
            <p className="text-gray-400 text-sm mb-2">ROE (Return on Equity)</p>
            <p className="text-2xl font-bold text-orange-400">{prof.roe.toFixed(2)}%</p>
          </Card>
        </div>
      )}
    </div>
  );
}