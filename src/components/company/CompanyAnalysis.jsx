import { AlertCircle, TrendingUp, DollarSign, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const analysisTopics = [
  {
    icon: DollarSign,
    title: "Como a Empresa Lucra",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    content: "O Itaú Unibanco lucra principalmente através de spread bancário (diferença entre taxa de juros cobrada e paga), serviços financeiros, tarifas de administração e investimentos em renda variável. A margem líquida de 11,26% reflete eficiência operacional."
  },
  {
    icon: TrendingUp,
    title: "Comportamento em Crises",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    content: "Bancos systemicamente importantes como o Itaú tendem a se beneficiar em crises pelo fluxo de clientes em busca de segurança. Porém, enfrentam maior inadimplência. Historicamente, a empresa mantém solvência robusta com capital adequado acima dos requisitos regulatórios."
  },
  {
    icon: Zap,
    title: "Impacto da Selic Alta",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    content: "Selic elevada beneficia bancos através do aumento do spread e maior rentabilidade em operações de empréstimo. O Itaú captura essa oportunidade em seu portfólio de pessoa física e jurídica, melhorando lucratividade trimestral."
  },
  {
    icon: AlertCircle,
    title: "Impacto da Inflação",
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    content: "Inflação elevada pressiona custos operacionais do banco, mas é parcialmente compensada pelo repasse às taxas de juros. O índice de eficiência (custo/receita) é importante monitorar. A empresa tem mostrado resiliência em períodos inflacionários."
  }
];

export default function CompanyAnalysis({ stock }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
      <h3 className="text-xl font-semibold text-white mb-6">Análise Microeconômica - {stock?.company_name}</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {analysisTopics.map((topic, idx) => {
          const Icon = topic.icon;
          return (
            <div
              key={idx}
              className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 hover:border-gray-600 transition-all"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className={`h-10 w-10 rounded-lg ${topic.bgColor} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`h-5 w-5 ${topic.color}`} />
                </div>
                <h4 className="font-semibold text-white pt-0.5">{topic.title}</h4>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">{topic.content}</p>
            </div>
          );
        })}
      </div>

      {/* Resumo Executivo */}
      <div className="mt-6 p-5 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30 rounded-xl">
        <h4 className="font-semibold text-amber-300 mb-3 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Resumo da Posição Microeconômica
        </h4>
        <p className="text-gray-300 text-sm leading-relaxed">
          O Itaú Unibanco é estruturalmente beneficiado por um ambiente de Selic elevada, que amplia seus spreads e lucratividade. Em cenários de inflação, a empresa consegue transferir custos através da reprificação de operações. Em crises, sua posição como banco sistemicamente importante garante fluxo de clientes e suporte regulatório. A margem líquida de 11,26% e ROE de 20,37% indicam eficiência operacional superior à média do setor.
        </p>
      </div>
    </div>
  );
}