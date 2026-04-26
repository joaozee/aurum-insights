import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink } from "lucide-react";

function fmtVal(val, type = "currency") {
  if (val == null) return <span className="text-gray-600">N/D</span>;
  if (type === "currency") {
    const abs = Math.abs(val);
    if (abs >= 1e12) return `R$ ${(val / 1e12).toFixed(2).replace('.', ',')} T`;
    if (abs >= 1e9) return `R$ ${(val / 1e9).toFixed(2).replace('.', ',')} B`;
    if (abs >= 1e6) return `R$ ${(val / 1e6).toFixed(2).replace('.', ',')} M`;
    return `R$ ${(val / 1e3).toFixed(0)} K`;
  }
  if (type === "number") return val.toLocaleString("pt-BR");
  if (type === "pct") return `${val.toFixed(2)}%`;
  return String(val);
}

function MetricRow({ label, value, type = "currency" }) {
  return (
    <tr className="border-b border-gray-800/50">
      <td className="py-2 pr-4 text-gray-400 text-sm whitespace-nowrap">{label}</td>
      <td className="py-2 text-right text-white text-sm font-medium">{fmtVal(value, type)}</td>
    </tr>
  );
}

export default function CompanyInfoPanel({ stock }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState("simple"); // "simple" | "detailed"

  const ticker = stock?.ticker;

  useEffect(() => {
    if (!ticker) return;
    setLoading(true);
    setError(null);
    base44.functions.invoke("getStockDetailData", { ticker, action: "company_info" })
      .then(res => {
        if (res?.data?.error) { setError(res.data.error); return; }
        setData(res?.data || null);
      })
      .catch(() => setError("Erro ao carregar informações da empresa"))
      .finally(() => setLoading(false));
  }, [ticker]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <Skeleton className="h-6 w-48 mb-4 bg-gray-800" />
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-6 w-full mb-2 bg-gray-800" />)}
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <Skeleton className="h-6 w-48 mb-4 bg-gray-800" />
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-6 w-full mb-2 bg-gray-800" />)}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6">
        <h3 className="text-white font-semibold text-lg mb-2">Dados da Empresa</h3>
        <p className="text-gray-500 text-sm">Informações da empresa não disponíveis.</p>
      </div>
    );
  }

  const simpleMetrics = [
    { label: "Valor de Mercado", value: data.marketCap },
    { label: "Patrimônio Líquido", value: data.shareholderEquity },
    { label: "Nº Total de Papéis", value: data.sharesOutstanding, type: "number" },
    { label: "Dívida Bruta", value: data.totalDebt },
    { label: "Dívida Líquida", value: data.netDebt },
    { label: "Disponibilidade", value: data.cash },
  ];

  const detailedMetrics = [
    ...simpleMetrics,
    { label: "Valor de Firma (EV)", value: data.enterpriseValue },
    { label: "Ativos Totais", value: data.totalAssets },
    { label: "Ativo Circulante", value: data.totalCurrentAssets },
    { label: "Free Float", value: data.freeFloat, type: "pct" },
    { label: "Liquidez Média Diária", value: data.avgDailyVolume, type: "number" },
    { label: "Setor", value: data.sector, type: "text" },
    { label: "Segmento", value: data.industry, type: "text" },
    { label: "Tag Along", value: data.tagAlong, type: "text" },
  ];

  const metrics = view === "simple" ? simpleMetrics : detailedMetrics;

  // Gerar papéis derivados (ON, PN, UNIT, fracionários)
  const baseTicker = ticker.replace(/[0-9]+$/, "");
  const commonSuffixes = ["3", "4", "11"];
  const fracSuffixes = ["3F", "4F", "11F"];
  const relatedPapers = commonSuffixes.map(s => baseTicker + s).filter(t => t !== ticker);
  const fracPapers = fracSuffixes.map(s => baseTicker + s).filter(t => t !== ticker + "F");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      {/* Card Esquerdo — Dados da Empresa */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h3 className="text-white font-semibold text-lg mb-4">Dados sobre a Empresa</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-gray-500 text-sm">Nome</span>
            <span className="text-white text-sm font-medium text-right max-w-[60%]">{data.company_name}</span>
          </div>
          {data.sector && (
            <div className="flex justify-between items-start">
              <span className="text-gray-500 text-sm">Setor</span>
              <span className="text-white text-sm text-right">{data.sector}</span>
            </div>
          )}
          {data.industry && (
            <div className="flex justify-between items-start">
              <span className="text-gray-500 text-sm">Segmento</span>
              <span className="text-white text-sm text-right">{data.industry}</span>
            </div>
          )}
          {data.employees && (
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Funcionários</span>
              <span className="text-white text-sm">{data.employees.toLocaleString("pt-BR")}</span>
            </div>
          )}
          {data.website && (
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">Website</span>
              <a
                href={data.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-400 text-sm flex items-center gap-1 hover:text-violet-300"
              >
                {data.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
          {data.exchange && (
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Bolsa</span>
              <span className="text-white text-sm">{data.exchange}</span>
            </div>
          )}
        </div>

        <div className="mt-5 space-y-3">
          {relatedPapers.length > 0 && (
            <div>
              <p className="text-gray-500 text-xs mb-2">Papéis da empresa</p>
              <div className="flex flex-wrap gap-2">
                {[ticker, ...relatedPapers].map(p => (
                  <span key={p} className={`px-2 py-1 rounded-lg text-xs font-medium ${p === ticker ? "bg-violet-500/20 text-violet-300 border border-violet-500/30" : "bg-gray-800 text-gray-300"}`}>
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}
          {fracPapers.length > 0 && (
            <div>
              <p className="text-gray-500 text-xs mb-2">Papéis fracionados</p>
              <div className="flex flex-wrap gap-2">
                {fracPapers.map(p => (
                  <span key={p} className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-800/50 text-gray-500">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card Direito — Informações/Métricas */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-lg">Informações da Empresa</h3>
          <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setView("simple")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${view === "simple" ? "bg-violet-600 text-white" : "text-gray-400 hover:text-gray-200"}`}
            >
              Simples
            </button>
            <button
              onClick={() => setView("detailed")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${view === "detailed" ? "bg-violet-600 text-white" : "text-gray-400 hover:text-gray-200"}`}
            >
              Detalhado
            </button>
          </div>
        </div>
        <table className="w-full">
          <tbody>
            {metrics.map((m, i) => (
              <MetricRow key={i} label={m.label} value={m.value} type={m.type} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}