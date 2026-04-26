import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { jsPDF } from "jspdf";

export default function ReportExporter({ assets, summary, transactions, goals }) {
  const [loading, setLoading] = useState(false);

  const exportToCSV = () => {
    try {
      // Preparar dados
      const csvData = [
        ["CARTEIRA - RELATÓRIO DE EXPORTAÇÃO"],
        [`Data: ${new Date().toLocaleDateString('pt-BR')}`],
        [],
        ["RESUMO DA CARTEIRA"],
        ["Métrica", "Valor"],
        ["Valor Total", `R$ ${summary.current_value.toLocaleString('pt-BR')}`],
        ["Montante Investido", `R$ ${summary.total_invested.toLocaleString('pt-BR')}`],
        ["Lucro/Prejuízo", `R$ ${summary.profit_loss.toLocaleString('pt-BR')}`],
        ["Retorno (%)", `${summary.profit_loss_percent.toFixed(2)}%`],
        [],
        ["ATIVOS"],
        ["Ticker", "Quantidade", "Preço de Compra", "Preço Atual", "Valor Total", "Variação (%)"],
        ...Object.values(assets).map(a => [
          a.ticker,
          a.quantity,
          `R$ ${a.purchase_price.toFixed(2)}`,
          `R$ ${(a.current_price || a.purchase_price).toFixed(2)}`,
          `R$ ${(a.quantity * (a.current_price || a.purchase_price)).toLocaleString('pt-BR')}`,
          `${(((a.current_price || a.purchase_price) - a.purchase_price) / a.purchase_price * 100).toFixed(2)}%`
        ]),
        [],
        ["METAS FINANCEIRAS"],
        ["Meta", "Valor Alvo", "Valor Atual", "Data Alvo", "Status"],
        ...goals.map(g => [
          g.title,
          `R$ ${g.target_amount.toLocaleString('pt-BR')}`,
          `R$ ${g.current_amount.toLocaleString('pt-BR')}`,
          new Date(g.target_date).toLocaleDateString('pt-BR'),
          g.status
        ])
      ];

      const csvContent = csvData.map(row => row.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `carteira_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      
      toast.success("Relatório CSV exportado com sucesso!");
    } catch (error) {
      toast.error("Erro ao exportar CSV");
      console.error(error);
    }
  };

  const exportToPDF = async () => {
    setLoading(true);
    try {
      const doc = new jsPDF();
      const now = new Date();
      
      // Header
      doc.setFillColor(139, 92, 246);
      doc.rect(0, 0, 210, 40, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.text("RELATÓRIO DE CARTEIRA", 15, 25);
      
      // Data
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(10);
      doc.text(`Gerado em: ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR')}`, 15, 45);
      
      let yPosition = 55;
      
      // Resumo
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont(undefined, "bold");
      doc.text("RESUMO DA CARTEIRA", 15, yPosition);
      yPosition += 10;
      
      doc.setFontSize(11);
      doc.setFont(undefined, "normal");
      const summaryData = [
        ["Valor Total", `R$ ${summary.current_value.toLocaleString('pt-BR')}`],
        ["Montante Investido", `R$ ${summary.total_invested.toLocaleString('pt-BR')}`],
        ["Lucro/Prejuízo", `R$ ${summary.profit_loss.toLocaleString('pt-BR')}`],
        ["Retorno (%)", `${summary.profit_loss_percent.toFixed(2)}%`]
      ];
      
      summaryData.forEach(([label, value]) => {
        doc.text(`${label}:`, 15, yPosition);
        doc.text(value, 100, yPosition);
        yPosition += 8;
      });
      
      yPosition += 5;
      
      // Ativos
      if (Object.keys(assets).length > 0) {
        doc.setFontSize(14);
        doc.setFont(undefined, "bold");
        doc.text("ATIVOS DA CARTEIRA", 15, yPosition);
        yPosition += 10;
        
        doc.setFontSize(9);
        doc.setFont(undefined, "bold");
        doc.text("Ticker", 15, yPosition);
        doc.text("Qtd", 50, yPosition);
        doc.text("P. Compra", 80, yPosition);
        doc.text("P. Atual", 120, yPosition);
        doc.text("Variação", 160, yPosition);
        yPosition += 8;
        
        doc.setFont(undefined, "normal");
        Object.values(assets).forEach((asset, idx) => {
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 15;
          }
          
          const variation = (((asset.current_price || asset.purchase_price) - asset.purchase_price) / asset.purchase_price * 100).toFixed(2);
          const [r, g, b] = variation >= 0 ? [16, 185, 129] : [239, 68, 68];
          
          doc.text(asset.ticker, 15, yPosition);
          doc.text(asset.quantity.toString(), 50, yPosition);
          doc.text(`R$ ${asset.purchase_price.toFixed(2)}`, 80, yPosition);
          doc.text(`R$ ${(asset.current_price || asset.purchase_price).toFixed(2)}`, 120, yPosition);
          doc.setTextColor(r, g, b);
          doc.text(`${variation}%`, 160, yPosition);
          doc.setTextColor(0, 0, 0);
          
          yPosition += 8;
        });
      }
      
      // Metas
      if (goals.length > 0) {
        yPosition += 10;
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 15;
        }
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.setFont(undefined, "bold");
        doc.text("METAS FINANCEIRAS", 15, yPosition);
        yPosition += 10;
        
        goals.forEach(goal => {
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 15;
          }
          
          doc.setFontSize(10);
          doc.setFont(undefined, "bold");
          doc.text(goal.title, 15, yPosition);
          yPosition += 6;
          
          doc.setFontSize(9);
          doc.setFont(undefined, "normal");
          doc.text(`Alvo: R$ ${goal.target_amount.toLocaleString('pt-BR')}`, 20, yPosition);
          yPosition += 4;
          doc.text(`Atual: R$ ${goal.current_amount.toLocaleString('pt-BR')}`, 20, yPosition);
          yPosition += 4;
          const progress = (goal.current_amount / goal.target_amount * 100).toFixed(1);
          doc.text(`Progresso: ${progress}%`, 20, yPosition);
          yPosition += 6;
        });
      }
      
      doc.save(`carteira_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("Relatório PDF exportado com sucesso!");
    } catch (error) {
      toast.error("Erro ao exportar PDF");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50"
        >
          <FileText className="h-4 w-4 mr-2" />
          Exportar Relatório
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-white">Exportar Relatório</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Button
            onClick={exportToPDF}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Gerando PDF...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Exportar como PDF
              </>
            )}
          </Button>
          <Button
            onClick={exportToCSV}
            disabled={loading}
            variant="outline"
            className="w-full border-gray-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar como CSV
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}