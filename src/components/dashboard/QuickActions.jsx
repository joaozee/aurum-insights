import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, Zap, DollarSign, Eye, ArrowRight } from "lucide-react";

const actions = [
  {
    icon: Plus,
    label: "Adicionar",
    description: "Novo investimento",
    page: "AddInvestment",
    gradient: "from-violet-500 to-purple-600",
    hoverGradient: "hover:from-violet-600 hover:to-purple-700"
  },
  {
    icon: Zap,
    label: "Conectar",
    description: "Vincular banco",
    page: "ConnectBank",
    gradient: "from-emerald-500 to-teal-600",
    hoverGradient: "hover:from-emerald-600 hover:to-teal-700"
  },
  {
    icon: DollarSign,
    label: "Registrar",
    description: "Nova transação",
    page: "RegisterExpense",
    gradient: "from-amber-500 to-orange-600",
    hoverGradient: "hover:from-amber-600 hover:to-orange-700"
  },
  {
    icon: Eye,
    label: "Detalhes",
    description: "Ver portfólio",
    page: "PortfolioDetails",
    gradient: "from-blue-500 to-indigo-600",
    hoverGradient: "hover:from-blue-600 hover:to-indigo-700"
  }
];

export default function QuickActions() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Link key={action.page} to={createPageUrl(action.page)}>
            <div className={`
              relative overflow-hidden rounded-2xl p-4 
              bg-gradient-to-br ${action.gradient} ${action.hoverGradient}
              transition-all duration-300 group cursor-pointer
              hover:shadow-lg hover:shadow-violet-500/10 hover:scale-[1.02]
            `}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <p className="font-semibold text-white">{action.label}</p>
                  <p className="text-white/70 text-xs">{action.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
              
              {/* Decorative circle */}
              <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}