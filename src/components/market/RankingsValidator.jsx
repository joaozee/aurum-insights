import { ShieldCheck, X, CheckCircle, AlertCircle, XCircle } from "lucide-react";

function StatusBadge({ status }) {
  const ok = status === "OK";
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
      ok ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
    }`}>
      {ok ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {status}
    </span>
  );
}

function DiscardedList({ title, discarded, total }) {
  const valid = total - discarded.length;
  return (
    <div className="bg-gray-800/60 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-white">{title}</h4>
        <div className="flex gap-2 text-xs">
          <span className="text-emerald-400">{valid} válidos</span>
          <span className="text-gray-500">·</span>
          <span className="text-red-400">{discarded.length} descartados</span>
        </div>
      </div>
      {discarded.length === 0 ? (
        <p className="text-xs text-gray-500 italic">Nenhum ativo descartado.</p>
      ) : (
        <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
          {discarded.map((d, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <XCircle className="h-3.5 w-3.5 text-red-400 mt-0.5 shrink-0" />
              <span className="text-amber-300 font-mono font-bold shrink-0">{d.ticker}</span>
              <span className="text-gray-400">— {d.reason}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RankingsValidator({ meta, onClose }) {
  if (!meta) return null;

  const { timestamp, sourceStatus, totalFetched, totalRequested, rankings } = meta;
  const updatedAt = timestamp
    ? new Date(timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "—";
  const updatedDate = timestamp
    ? new Date(timestamp).toLocaleDateString("pt-BR")
    : "—";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Validação de Dados</h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Source Status */}
          <div className="bg-gray-800/60 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
            <div>
              <p className="text-xs text-gray-500 mb-1">Fonte de dados</p>
              <p className="text-sm font-semibold text-white">brapi.dev</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Status</p>
              <StatusBadge status={sourceStatus} />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Última atualização</p>
              <p className="text-sm text-white">{updatedDate} às {updatedAt}</p>
            </div>
          </div>

          {/* Counts */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-800/60 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-white">{totalRequested}</p>
              <p className="text-xs text-gray-500 mt-1">Solicitados</p>
            </div>
            <div className="bg-gray-800/60 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-emerald-400">{totalFetched}</p>
              <p className="text-xs text-gray-500 mt-1">Recebidos</p>
            </div>
            <div className="bg-gray-800/60 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-red-400">
                {totalRequested - totalFetched}
              </p>
              <p className="text-xs text-gray-500 mt-1">Falhos</p>
            </div>
          </div>

          {/* Per-ranking validation */}
          {rankings && (
            <>
              <DiscardedList
                title="🟣 Melhores P/L (Ibovespa)"
                discarded={rankings.pl?.discarded || []}
                total={totalFetched}
              />
              <DiscardedList
                title="🏆 Maior Valor de Mercado"
                discarded={rankings.pvp?.discarded || []}
                total={totalFetched}
              />
              <DiscardedList
                title="🪙 Maior Lucro por Ação (EPS)"
                discarded={rankings.dy?.discarded || []}
                total={totalFetched}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}