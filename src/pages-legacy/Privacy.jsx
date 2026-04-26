import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to={createPageUrl("Profile")} className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 group">
          <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          <span>Voltar</span>
        </Link>

        <PageHeader title="Política de Privacidade" />

        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-500 text-sm mb-8">Última atualização: Janeiro de 2025</p>

            <h2>1. Informações que Coletamos</h2>
            <p>
              Coletamos informações que você nos fornece diretamente, como nome, e-mail e dados de pagamento. 
              Também coletamos dados de uso automaticamente.
            </p>

            <h2>2. Como Usamos suas Informações</h2>
            <p>Utilizamos suas informações para:</p>
            <ul>
              <li>Fornecer e manter nossos serviços</li>
              <li>Processar pagamentos e transações</li>
              <li>Enviar comunicações sobre o serviço</li>
              <li>Melhorar a experiência do usuário</li>
              <li>Cumprir obrigações legais</li>
            </ul>

            <h2>3. Compartilhamento de Dados</h2>
            <p>
              Não vendemos suas informações pessoais. Podemos compartilhar dados com:
            </p>
            <ul>
              <li>Processadores de pagamento</li>
              <li>Prestadores de serviço que nos auxiliam</li>
              <li>Autoridades quando exigido por lei</li>
            </ul>

            <h2>4. Segurança</h2>
            <p>
              Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações. 
              No entanto, nenhum sistema é 100% seguro.
            </p>

            <h2>5. Seus Direitos</h2>
            <p>Você tem direito a:</p>
            <ul>
              <li>Acessar seus dados pessoais</li>
              <li>Corrigir dados incorretos</li>
              <li>Solicitar exclusão de dados</li>
              <li>Revogar consentimento</li>
            </ul>

            <h2>6. Cookies</h2>
            <p>
              Utilizamos cookies para melhorar a experiência de navegação e coletar dados de uso. 
              Você pode configurar seu navegador para recusar cookies.
            </p>

            <h2>7. Contato</h2>
            <p>
              Para questões sobre privacidade, entre em contato através do privacidade@aurum.com.br
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}