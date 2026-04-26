import { useRef } from "react";
import { Award, Shield, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function CertificateTemplate({ certificate, onClose }) {
  const certificateRef = useRef(null);

  const downloadPDF = async () => {
    const element = certificateRef.current;
    const canvas = await html2canvas(element, { 
      scale: 2,
      backgroundColor: "#ffffff"
    });
    
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4"
    });
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Certificado_${certificate.course_title.replace(/\s+/g, '_')}.pdf`);
  };

  const downloadImage = async () => {
    const element = certificateRef.current;
    const canvas = await html2canvas(element, { 
      scale: 3,
      backgroundColor: "#ffffff"
    });
    
    const link = document.createElement("a");
    link.download = `Certificado_${certificate.course_title.replace(/\s+/g, '_')}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Certificate Preview */}
      <div 
        ref={certificateRef}
        className="bg-white p-12 rounded-xl relative overflow-hidden"
        style={{ width: "1050px", height: "750px" }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-full blur-3xl" />
        </div>

        {/* Border */}
        <div className="absolute inset-4 border-4 border-double border-violet-300 rounded-lg" />
        <div className="absolute inset-8 border border-violet-200 rounded-lg" />

        {/* Content */}
        <div className="relative h-full flex flex-col items-center justify-center text-center px-16">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-xl">
              <Award className="h-9 w-9 text-white" />
            </div>
            <div className="text-left">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                Aurum Academy
              </h3>
              <p className="text-sm text-gray-500">Excelência em Educação Financeira</p>
            </div>
          </div>

          {/* Certificate Title */}
          <h1 className="text-4xl font-serif text-gray-800 mb-8">
            Certificado de Conclusão
          </h1>

          {/* Recipient */}
          <p className="text-lg text-gray-600 mb-3">
            Certificamos que
          </p>
          <h2 className="text-5xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent mb-8">
            {certificate.user_name}
          </h2>

          {/* Course Info */}
          <p className="text-lg text-gray-600 mb-3">
            concluiu com êxito o curso
          </p>
          <h3 className="text-3xl font-semibold text-gray-800 mb-8 max-w-2xl">
            {certificate.course_title}
          </h3>

          {/* Details */}
          <div className="flex items-center justify-center gap-8 mb-10 text-gray-600">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-violet-500" />
              <span>{certificate.course_duration}h de conteúdo</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-violet-500" />
              <span>{format(new Date(certificate.completion_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
            </div>
          </div>

          {/* Certificate Number */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Shield className="h-4 w-4" />
            <span>Certificado N° {certificate.certificate_number}</span>
          </div>

          {/* Signature Area */}
          <div className="mt-12 pt-8 border-t border-gray-200 w-96">
            <div className="text-center">
              <div className="h-px bg-gray-300 mb-2" />
              <p className="text-sm font-semibold text-gray-700">Aurum Academy</p>
              <p className="text-xs text-gray-500">Plataforma de Educação Financeira</p>
            </div>
          </div>
        </div>
      </div>

      {/* Download Buttons */}
      <div className="flex gap-3 justify-center">
        <Button onClick={downloadPDF} className="bg-violet-600 hover:bg-violet-700">
          Baixar PDF
        </Button>
        <Button onClick={downloadImage} variant="outline">
          Baixar Imagem
        </Button>
        {onClose && (
          <Button onClick={onClose} variant="ghost">
            Fechar
          </Button>
        )}
      </div>
    </div>
  );
}