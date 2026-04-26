import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";

export default function Terms() {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to={createPageUrl("Profile")} className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 group">
          <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          <span>Voltar</span>
        </Link>

        <PageHeader title="Termos de Uso" />

        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-500 text-sm mb-8">Última atualização: Janeiro de 2025</p>

            <h2>1. Aceitação dos Termos</h2>
            <p>
              Ao acessar e usar o Aurum, você concorda com estes Termos de Uso. 
              Se você não concordar com qualquer parte destes termos, não poderá acessar o serviço.
            </p>

            <h2>2. Uso do Serviço</h2>
            <p>
              O Aurum é uma plataforma de conteúdo educacional sobre investimentos. 
              O conteúdo disponibilizado tem caráter meramente informativo e educacional, 
              não constituindo recomendação de investimento.
            </p>

            <h2>3. Contas de Usuário</h2>
            <p>
              Você é responsável por manter a confidencialidade de sua conta e senha. 
              Todas as atividades realizadas em sua conta são de sua responsabilidade.
            </p>

            <h2>4. Assinatura Premium</h2>
            <p>
              A assinatura Premium é renovada automaticamente. Você pode cancelar a qualquer momento, 
              mantendo o acesso até o final do período pago.
            </p>

            <h2>5. Propriedade Intelectual</h2>
            <p>
              Todo o conteúdo do Aurum é protegido por direitos autorais. 
              É proibida a reprodução, distribuição ou comercialização sem autorização.
            </p>

            <h2>6. Limitação de Responsabilidade</h2>
            <p>
              O Aurum não se responsabiliza por decisões de investimento tomadas com base no conteúdo da plataforma. 
              Investimentos envolvem riscos e você deve consultar um profissional antes de investir.
            </p>

            <h2>7. Alterações nos Termos</h2>
            <p>
              Reservamo-nos o direito de modificar estes termos a qualquer momento. 
              Alterações significativas serão comunicadas por e-mail.
            </p>

            <h2>8. Contato</h2>
            <p>
              Para dúvidas sobre estes termos, entre em contato através do suporte@aurum.com.br
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}