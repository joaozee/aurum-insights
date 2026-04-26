import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Palette } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export default function CertificateDownload({ userName, courseTitle, completionDate, courseDescription = '' }) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('aurum');

  const handleDownload = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('generateCertificate', {
        userName,
        courseTitle,
        completionDate,
        template: selectedTemplate,
        course_description: courseDescription
      });

      if (response && response.data) {
        let blobData = response.data;
        if (typeof response.data === 'string') {
          blobData = new TextEncoder().encode(response.data);
        }
        
        const blob = new Blob([blobData], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `certificado-${userName.replace(/\s+/g, '-').toLowerCase()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        setOpen(false);
      }
    } catch (error) {
      console.error("Erro ao gerar certificado:", error);
      alert("Erro ao gerar certificado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const templates = [
    { 
      id: 'aurum', 
      name: 'Aurum Premium', 
      description: 'Preto com roxo e dourado', 
      preview: 'bg-black border-violet-500'
    },
    { 
      id: 'elegant', 
      name: 'Elegante', 
      description: 'Branco minimalista', 
      preview: 'bg-white border-gray-700'
    },
    { 
      id: 'modern', 
      name: 'Moderno', 
      description: 'Escuro com azul e verde', 
      preview: 'bg-gray-900 border-blue-500'
    }
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold gap-2">
          <Download className="h-4 w-4" />
          Baixar Certificado
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-800 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-violet-400" />
            Escolha o Design
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Selecione o template do seu certificado
          </DialogDescription>
        </DialogHeader>
        
        <RadioGroup value={selectedTemplate} onValueChange={setSelectedTemplate} className="space-y-3">
          {templates.map((template) => (
            <div key={template.id} className="flex items-center space-x-3">
              <RadioGroupItem value={template.id} id={template.id} className="border-gray-600" />
              <Label htmlFor={template.id} className="flex items-center gap-3 cursor-pointer flex-1">
                <div className={`h-10 w-10 rounded-lg border-2 ${template.preview}`} />
                <div>
                  <div className="font-medium text-white">{template.name}</div>
                  <div className="text-xs text-gray-400">{template.description}</div>
                </div>
              </Label>
            </div>
          ))}
        </RadioGroup>

        <div className="mt-4 p-3 bg-violet-500/10 border border-violet-500/30 rounded-lg">
          <p className="text-xs text-violet-300">
            ✨ Seu certificado incluirá uma mensagem personalizada gerada por IA
          </p>
        </div>

        <Button 
          onClick={handleDownload}
          disabled={loading}
          className="w-full bg-violet-600 hover:bg-violet-700"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Gerando certificado...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Gerar e Baixar
            </>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}