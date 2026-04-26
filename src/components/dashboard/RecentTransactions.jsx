import { ArrowUpRight, ArrowDownLeft, Receipt } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const CATEGORY_LABELS = {
  salario: "Salário",
  pix_recebido: "Pix Recebido",
  bonus: "Bônus",
  aluguel: "Aluguel",
  alimentacao: "Alimentação",
  lazer: "Lazer",
  cartao_credito: "Cartão",
  assinaturas: "Assinaturas",
  transporte: "Transporte",
  saude: "Saúde",
  outros: "Outros"
};

// Mock data
const mockTransactions = [
  { type: "entrada", category: "salario", amount: 8500, transaction_date: "2026-01-05" },
  { type: "saida", category: "aluguel", amount: 2200, transaction_date: "2026-01-10" },
  { type: "saida", category: "alimentacao", amount: 450, transaction_date: "2026-01-11" },
  { type: "entrada", category: "pix_recebido", amount: 350, transaction_date: "2026-01-08" },
  { type: "saida", category: "assinaturas", amount: 89.90, transaction_date: "2026-01-05" }
];

export default function RecentTransactions({ transactions = [] }) {
  const displayTransactions = transactions.length > 0 ? transactions.slice(0, 6) : mockTransactions;

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-violet-950/30 rounded-2xl border border-gray-800 p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Movimentações Recentes</h3>
          <p className="text-gray-500 text-sm">Últimas transações</p>
        </div>
        <div className="h-10 w-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
          <Receipt className="h-5 w-5 text-violet-400" />
        </div>
      </div>
      
      <div className="space-y-2">
        {displayTransactions.map((transaction, idx) => (
          <div 
            key={idx}
            className="flex items-center justify-between p-4 bg-gray-800/50 hover:bg-gray-800 rounded-xl transition-all group border border-transparent hover:border-gray-700"
          >
            <div className="flex items-center gap-4 flex-1">
              <div className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                transaction.type === "entrada" 
                  ? "bg-emerald-500/20" 
                  : "bg-red-500/20"
              )}>
                {transaction.type === "entrada" ? (
                  <ArrowDownLeft className="h-5 w-5 text-emerald-400" />
                ) : (
                  <ArrowUpRight className="h-5 w-5 text-red-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white text-sm group-hover:text-violet-300 transition-colors">
                  {CATEGORY_LABELS[transaction.category] || transaction.category}
                </p>
                {transaction.description && (
                  <p className="text-xs text-gray-400 truncate">
                    {transaction.description}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  {format(new Date(transaction.transaction_date), "dd 'de' MMMM", { locale: ptBR })}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={cn(
                "font-semibold",
                transaction.type === "entrada" ? "text-emerald-400" : "text-red-400"
              )}>
                {transaction.type === "entrada" ? "+" : "-"} R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}