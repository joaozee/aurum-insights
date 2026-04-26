import { useState, useEffect } from "react";
import { Info, Building2, TrendingUp, Layers, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";

export default function CompanyDataSection({ stock }) {
  const [companyInfo, setCompanyInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [logoUrl, setLogoUrl] = useState(null);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    if (stock?.ticker && stock?.company_name) {
      fetchCompanyInfo();
      setLogoError(false);
      // Usa logo_url da API primeiro, fallback para brapi favicon
      setLogoUrl(stock.logo_url || `https://brapi.dev/favicon/ticker/${stock.ticker}.png`);
    }
  }, [stock?.ticker, stock?.logo_url]);

  const fetchCompanyInfo = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('getCompanyInfo', {
        ticker: stock.ticker,
        company_name: stock.company_name
      });
      setCompanyInfo(response.data);
    } catch (err) {
      console.error("Erro ao buscar info da empresa:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!stock) return null;

  return (
    <Card className="bg-gray-900 border-gray-800 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Info className="h-5 w-5 text-blue-400" />
        <h3 className="text-lg font-semibold text-white">SOBRE A EMPRESA</h3>
        {companyInfo && (
          <Badge className="ml-auto bg-violet-500/20 text-violet-300 border-violet-500/30 text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            IA
          </Badge>
        )}
      </div>

      {/* Header: Logo, Nome, Ticker, Setor */}
      <div className="flex items-start gap-4 mb-6">
        {/* Logo */}
        <div className="flex-shrink-0">
          {logoUrl && !logoError ? (
            <img
              src={logoUrl}
              alt={stock.company_name}
              onError={() => setLogoError(true)}
              className="w-16 h-16 rounded-xl object-contain bg-white p-1 border border-gray-700"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center">
              <span className="text-xl font-bold text-gray-400">{stock.ticker?.slice(0, 2)}</span>
            </div>
          )}
        </div>

        {/* Nome e badges */}
        <div className="flex-1 min-w-0">
          <p className="text-2xl font-bold text-white leading-tight">{stock.company_name}</p>
          <p className="text-gray-400 text-sm mt-0.5">{companyInfo?.setor_descricao || stock.sector || ""}</p>
          <div className="flex gap-2 mt-2 flex-wrap">
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">{stock.ticker}</Badge>
            {stock.sector && <Badge variant="outline" className="border-gray-600 text-gray-400">{stock.sector}</Badge>}
            {stock.industry && <Badge variant="outline" className="border-gray-600 text-gray-400">{stock.industry}</Badge>}
          </div>
        </div>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="h-4 bg-gray-800 rounded animate-pulse" style={{ width: `${70 + i * 10}%` }} />
          ))}
        </div>
      )}

      {companyInfo && (
        <div className="space-y-6">
          {/* História */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-4 w-4 text-amber-400" />
              <h4 className="text-sm font-semibold text-amber-400 uppercase tracking-wide">História</h4>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">{companyInfo.historia}</p>
          </div>

          {/* Como Lucra */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <h4 className="text-sm font-semibold text-green-400 uppercase tracking-wide">Como Gera Receita</h4>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">{companyInfo.como_lucra}</p>
          </div>

          {/* Segmentos */}
          {companyInfo.segmentos?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Layers className="h-4 w-4 text-blue-400" />
                <h4 className="text-sm font-semibold text-blue-400 uppercase tracking-wide">Segmentos de Negócio</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {companyInfo.segmentos.map((seg, idx) => (
                  <div key={idx} className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
                    <p className="text-white font-semibold text-sm mb-1">{seg.nome}</p>
                    <p className="text-gray-400 text-xs leading-relaxed">{seg.descricao}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expandir para mais detalhes */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {expanded ? "Ver menos" : "Ver diferenciais e riscos"}
          </button>

          {expanded && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Diferenciais */}
              {companyInfo.diferenciais?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-emerald-400 uppercase tracking-wide mb-3">✓ Vantagens Competitivas</h4>
                  <ul className="space-y-2">
                    {companyInfo.diferenciais.map((d, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                        <span className="text-emerald-400 mt-0.5">•</span>
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Riscos */}
              {companyInfo.riscos?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-red-400 uppercase tracking-wide mb-3">⚠ Principais Riscos</h4>
                  <ul className="space-y-2">
                    {companyInfo.riscos.map((r, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                        <span className="text-red-400 mt-0.5">•</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}