import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowRight, Building2 } from "lucide-react";

export default function About({ stock }) {
  if (!stock?.description) return null;

  return (
    <div className="space-y-4 md:space-y-6 mb-4 md:mb-8">
      <Link 
        to={createPageUrl("Company")}
        className="group block bg-gradient-to-br from-gray-800/50 to-gray-900 border border-gray-700 hover:border-amber-500/30 rounded-xl md:rounded-2xl p-4 md:p-6 transition-all hover:bg-gradient-to-br hover:from-gray-800/70 hover:to-gray-900"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 md:gap-4 flex-1">
            <Building2 className="h-6 w-6 md:h-8 md:w-8 text-amber-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-base md:text-lg font-semibold text-white">Sobre a Empresa</h3>
              <p className="text-gray-400 text-xs md:text-sm mt-1">
                Descubra mais sobre a empresa, seu histórico e indicadores principais. Saiba por que é uma potencial escolha para sua carteira de investimentos.
              </p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 md:h-6 md:w-6 text-amber-400 flex-shrink-0 group-hover:translate-x-1 transition-transform mt-1" />
        </div>
      </Link>

      <div className="bg-gray-900 border border-gray-800 rounded-xl md:rounded-2xl p-4 md:p-6">
        <h3 className="text-base md:text-xl font-semibold text-white mb-3 md:mb-4">Descrição</h3>
        <p className="text-gray-300 text-sm md:text-base leading-relaxed">
          {stock.description}
        </p>
      </div>
    </div>
  );
}