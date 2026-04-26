import { CheckCircle2, Circle, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const checklistItems = [
  {
    label: "Empresa com mais de 5 anos de Bolsa",
    checked: true,
    info: "Histórico mínimo de operações em mercado público"
  },
  {
    label: "Empresa com lucro nos últimos 20 trimestres (5 anos)",
    checked: true,
    info: "Consistência de lucratividade"
  },
  {
    label: "Empresa possui ROE acima de 10%",
    checked: true,
    info: "Rentabilidade do patrimônio líquido"
  },
  {
    label: "Empresa apresentou crescimento de receita nos últimos 5 anos",
    checked: true,
    info: "Expansão do negócio"
  },
  {
    label: "Empresa possui liquidez diária acima de US$ 2M",
    checked: true,
    info: "Facilidade de compra e venda de ações"
  },
  {
    label: "Empresa nunca deu prejuízo [ano fiscal]",
    checked: false,
    info: "Operações consistentemente lucrativas"
  },
  {
    label: "Empresa pagou >5% de dividendos/ano nos últimos 5 anos",
    checked: true,
    info: "Retorno consistente ao acionista"
  },
  {
    label: "Empresa possui dívida menor que patrimônio",
    checked: true,
    info: "Endividamento controlado"
  },
  {
    label: "Empresa é bem avaliada pelos usuários do Investidor10",
    checked: false,
    info: "Reputação e confiança da comunidade"
  },
  {
    label: "Empresa apresentou crescimento de lucros nos últimos 5 anos",
    checked: false,
    info: "Aumento de rentabilidade"
  }
];

export default function BuyChecklist({ stock }) {
  const totalChecks = checklistItems.filter(item => item.checked).length;
  const percentage = Math.round((totalChecks / checklistItems.length) * 100);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-white mb-2">
          Checklist do Investidor - Buy and Hold sobre {stock?.ticker}
        </h3>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center">
            <span className="text-lg font-bold text-amber-400">{percentage}%</span>
          </div>
          <div>
            <p className="text-gray-300 font-medium">{totalChecks} de {checklistItems.length} critérios atendidos</p>
            <p className="text-sm text-gray-500">Compra recomendada se acima de 70%</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {checklistItems.map((item, idx) => (
          <div
            key={idx}
            className={cn(
              "flex items-start gap-3 p-4 rounded-xl border transition-colors",
              item.checked
                ? "bg-emerald-500/10 border-emerald-500/30"
                : "bg-gray-800/50 border-gray-700"
            )}
          >
            {item.checked ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <Circle className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <p className={cn(
                "text-sm font-medium",
                item.checked ? "text-emerald-300" : "text-gray-400"
              )}>
                {item.label}
              </p>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-gray-600 cursor-help hover:text-gray-400 transition-colors flex-shrink-0" />
                </TooltipTrigger>
                <TooltipContent className="bg-gray-800 border border-gray-700 text-gray-300 text-xs">
                  {item.info}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ))}
      </div>
    </div>
  );
}