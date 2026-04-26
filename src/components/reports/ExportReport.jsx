import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function ExportReport({ reportRef, userName, period }) {
  const [exporting, setExporting] = useState(false);

  const exportToPDF = async () => {
    if (!reportRef.current) return;
    
    setExporting(true);
    toast.info("Gerando PDF...");

    try {
      // Capturar o conteúdo do relatório
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: '#030712',
        logging: false,
        useCORS: true
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      // Adicionar cabeçalho
      pdf.setFontSize(18);
      pdf.setTextColor(139, 92, 246);
      pdf.text('Relatório de Performance - Aurum', pdfWidth / 2, 15, { align: 'center' });
      
      pdf.setFontSize(10);
      pdf.setTextColor(156, 163, 175);
      pdf.text(`${userName || 'Usuário'} • ${new Date().toLocaleDateString('pt-BR')}`, pdfWidth / 2, 22, { align: 'center' });
      
      // Adicionar imagem do relatório
      pdf.addImage(imgData, 'PNG', imgX, 30, imgWidth * ratio, imgHeight * ratio);
      
      // Rodapé
      pdf.setFontSize(8);
      pdf.setTextColor(107, 114, 128);
      pdf.text('Gerado por Aurum App', pdfWidth / 2, pdfHeight - 10, { align: 'center' });

      // Salvar
      const fileName = `relatorio-performance-${period}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      toast.success("PDF gerado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar PDF");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      onClick={exportToPDF}
      disabled={exporting}
      className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
    >
      {exporting ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Gerando PDF...
        </>
      ) : (
        <>
          <FileDown className="h-4 w-4 mr-2" />
          Exportar PDF
        </>
      )}
    </Button>
  );
}