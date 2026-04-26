import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  ArrowLeft, 
  MessageSquare,
  Mail,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/shared/PageHeader";

export default function Support() {
  const whatsappNumber = "5511999999999"; // Replace with actual number
  const whatsappMessage = encodeURIComponent("Olá! Preciso de ajuda com o Aurum.");

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to={createPageUrl("Profile")} className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 group">
          <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          <span>Voltar</span>
        </Link>

        <PageHeader 
          title="Contato e Suporte"
          subtitle="Estamos aqui para ajudar"
        />

        <div className="space-y-6">
          {/* WhatsApp */}
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <div className="h-16 w-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">WhatsApp</h2>
            <p className="text-gray-500 mb-6">
              Fale conosco pelo WhatsApp para suporte rápido e personalizado
            </p>
            <a 
              href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="bg-green-600 hover:bg-green-700 px-8 py-6 text-base">
                <MessageSquare className="h-5 w-5 mr-2" />
                Abrir WhatsApp
              </Button>
            </a>
          </div>

          {/* Email */}
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <div className="h-16 w-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-6">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">E-mail</h2>
            <p className="text-gray-500 mb-6">
              Envie sua dúvida ou sugestão por e-mail
            </p>
            <a href="mailto:suporte@aurum.com.br">
              <Button variant="outline" className="px-8 py-6 text-base border-gray-200">
                <Mail className="h-5 w-5 mr-2" />
                suporte@aurum.com.br
              </Button>
            </a>
          </div>

          {/* Response Time */}
          <div className="bg-amber-50 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <Clock className="h-6 w-6 text-amber-600 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-amber-900 mb-1">Tempo de resposta</h3>
                <p className="text-amber-700 text-sm">
                  WhatsApp: até 2 horas em horário comercial • E-mail: até 24 horas
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}