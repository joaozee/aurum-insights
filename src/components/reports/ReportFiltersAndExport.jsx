import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Download, Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import jsPDF from 'jspdf';

export default function ReportFiltersAndExport({ 
  transactions, 
  onPeriodChange, 
  onCategoryChange,
  onCustomFromChange,
  onCustomToChange,
  period,
  selectedCategory,
  customFrom = '',
  customTo = ''
}) {

  const categories = [
    'salario', 'pix_recebido', 'bonus', 'aluguel', 'alimentacao',
    'lazer', 'cartao_credito', 'assinaturas', 'transporte', 'saude'
  ];

  const getCategoryLabel = (cat) => {
    const labels = {
      salario: 'Salário',
      pix_recebido: 'PIX Recebido',
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

    return filtered;
  };

  const exportToPDF = () => {
    const filtered = getFilteredTransactions();
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;

    // Header
    doc.setFontSize(16);
    doc.text('Relatório Financeiro', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(11);
    const range = getDateRange(period);
    doc.text(`Período: ${range.from.toLocaleDateString('pt-BR')} a ${range.to.toLocaleDateString('pt-BR')}`, 20, yPosition);
    yPosition += 8;

    if (selectedCategory && selectedCategory !== 'all') {
      doc.text(`Categoria: ${getCategoryLabel(selectedCategory)}`, 20, yPosition);
      yPosition += 8;
    }

    yPosition += 5;

    // Summary
    const income = filtered.filter(t => t.type === 'entrada').reduce((sum, t) => sum + t.amount, 0);
    const expenses = filtered.filter(t => t.type === 'saida').reduce((sum, t) => sum + t.amount, 0);

    doc.setFontSize(10);
    doc.text(`Total Entradas: R$ ${income.toFixed(2)}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Total Saídas: R$ ${expenses.toFixed(2)}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Saldo: R$ ${(income - expenses).toFixed(2)}`, 20, yPosition);
    yPosition += 10;

    // Table
    const tableData = filtered.map(t => [
      new Date(t.transaction_date).toLocaleDateString('pt-BR'),
      getCategoryLabel(t.category),
      t.description || '-',
      t.type === 'entrada' ? `R$ ${t.amount.toFixed(2)}` : '-',
      t.type === 'saida' ? `R$ ${t.amount.toFixed(2)}` : '-'
    ]);

    doc.autoTable({
      startY: yPosition,
      head: [['Data', 'Categoria', 'Descrição', 'Entrada', 'Saída']],
      body: tableData,
      theme: 'striped',
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 30 },
        2: { cellWidth: 55 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 }
      }
    });

    doc.save(`relatorio_financeiro_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToCSV = () => {
    const filtered = getFilteredTransactions();
    const range = getDateRange(period);

    let csv = 'Data,Categoria,Descrição,Tipo,Valor\n';
    
    filtered.forEach(t => {
      const row = [
        new Date(t.transaction_date).toLocaleDateString('pt-BR'),
        getCategoryLabel(t.category),
        `"${t.description || '-'}"`,
        t.type === 'entrada' ? 'Entrada' : 'Saída',
        t.amount.toFixed(2)
      ];
      csv += row.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_financeiro_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card className="bg-gray-900 border-gray-800 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Period Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Período
          </label>
          <Select value={period} onValueChange={onPeriodChange}>
            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Mensal</SelectItem>
              <SelectItem value="quarterly">Trimestral</SelectItem>
              <SelectItem value="annual">Anual</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Category Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Categoria
          </label>
          <Select value={selectedCategory || 'all'} onValueChange={onCategoryChange}>
            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>
                  {getCategoryLabel(cat)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Custom Date From */}
        {period === 'custom' && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">De</label>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => onCustomFromChange(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white text-sm"
            />
          </div>
        )}

        {/* Custom Date To */}
        {period === 'custom' && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Até</label>
            <input
              type="date"
              value={customTo}
              onChange={(e) => onCustomToChange(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white text-sm"
            />
          </div>
        )}

        {/* Export Buttons */}
        <div className="flex items-end gap-2">
          <Button
            onClick={exportToPDF}
            className="flex-1 bg-violet-600 hover:bg-violet-700 text-white text-sm"
          >
            <Download className="h-4 w-4 mr-1" />
            PDF
          </Button>
          <Button
            onClick={exportToCSV}
            variant="outline"
            className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800 text-sm"
          >
            <Download className="h-4 w-4 mr-1" />
            CSV
          </Button>
        </div>
      </div>
    </Card>
  );
}