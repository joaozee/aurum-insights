import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowDownCircle, ArrowUpCircle, FileText } from "lucide-react";

export default function TransactionsHistory({ transactions }) {
  const sortedTransactions = [...transactions].
  filter((t) => t.type === "compra").
  sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));

  const totalInvested = sortedTransactions.reduce((sum, t) => sum + (t.total_value || 0), 0);

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-emerald-950/20 border border-gray-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <ArrowDownCircle className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Histórico de Compras</h3>
            <p className="text-xs text-gray-400"></p>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-xs text-gray-400">Total Investido</p>
          <p className="text-lg font-bold text-emerald-400">
            R$ {totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {sortedTransactions.length > 0 ?
        sortedTransactions.map((transaction) =>
        <div
          key={transaction.id}
          className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-emerald-500/30 hover:bg-gray-800 transition-all group">

              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {transaction.logo_url ?
              <img
                src={transaction.logo_url}
                alt={transaction.ticker}
                className="h-10 w-10 rounded-lg bg-white p-1"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }} /> :

              null}
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors" style={{ display: transaction.logo_url ? 'none' : 'flex' }}>
                    <ArrowDownCircle className="h-5 w-5 text-emerald-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-white font-bold text-lg group-hover:text-emerald-400 transition-colors">
                        {transaction.ticker}
                      </h4>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Compra
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      <span className="font-medium">{transaction.quantity} ações</span>
                      <span className="text-gray-600">•</span>
                      <span>PM: R$ {transaction.price.toFixed(2)}</span>
                    </div>
                    {transaction.notes &&
                <p className="text-gray-500 text-xs mt-2 bg-gray-900/50 rounded-lg px-2 py-1">
                        {transaction.notes}
                      </p>
                }
                  </div>
                </div>

                <div className="text-right ml-4">
                  <p className="font-bold text-lg text-white group-hover:text-emerald-400 transition-colors">
                    R$ {transaction.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    {format(new Date(transaction.transaction_date), "dd MMM yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>
            </div>
        ) :

        <div className="text-center py-12">
            <ArrowDownCircle className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">Nenhuma compra registrada</p>
            <p className="text-gray-500 text-sm mt-1">Comece sua jornada buy & hold</p>
          </div>
        }
      </div>
    </div>);

}