import { useState, useEffect } from "react";
import { Trophy, Info, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function AurumRanking({ onSelectStock }) {
  const [rankingType, setRankingType] = useState("aurum");
  const [rankedStocks, setRankedStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadRanking = async () => {
    try {
      setLoading(true);
      const data = await base44.entities.RankingAurum.list('-rank_position', 100);
      setRankedStocks(data);
      if (data.length > 0 && data[0].last_updated) {
        setLastUpdated(new Date(data[0].last_updated));
      }
    } catch (err) {
      console.error('Erro ao carregar ranking:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRanking();
  }, []);

  const handleUpdate = async () => {
    try {
      setLoading(true);
      await base44.functions.invoke('updateRankingAurum', {});
      await loadRanking();
    } catch (err) {
      console.error('Erro ao atualizar ranking:', err);
    }
  };

  const filteredStocks = (() => {
    switch (rankingType) {
      case "pl_menor":  return [...rankedStocks].sort((a, b) => (a.pl || 999) - (b.pl || 999));
      case "pvp_menor": return [...rankedStocks].sort((a, b) => (a.pvp || 999) - (b.pvp || 999));
      case "dy_maior":  return [...rankedStocks].sort((a, b) => (b.dy || 0) - (a.dy || 0));
      default: return rankedStocks;
    }
  })().slice(0, 20);

  const scoreLabel = { aurum: "Score", pl_menor: "P/L", pvp_menor: "P/VP", dy_maior: "DY" }[rankingType];
  const scoreDisplay = (stock) => {
    if (rankingType === "dy_maior") return `${stock.dy?.toFixed(1) || "—"}%`;
    if (rankingType === "aurum") return (stock.score_aurum || 0).toFixed(1);
    return (stock.score_aurum || 0).toFixed(1);
  };

  const tooltipText = {
    aurum: "Score: DY (50%), P/VP (20%), P/L (15%), ROE (5%), Margem (5%), Dív/EBITDA (5%)",
    pl_menor: "Ordenado por menor P/L (Preço/Lucro)",
    pvp_menor: "Ordenado por menor P/VP (Preço/Valor Patrimonial)",
    dy_maior: "Ordenado por maior Dividend Yield",
  }[rankingType];

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-amber-950/20 border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Trophy className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Ranking Aurum</h3>
            <p className="text-xs text-gray-400">Top 20 ações por fundamentos</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={rankingType} onValueChange={setRankingType}>
            <SelectTrigger className="w-44 bg-gray-800 border-gray-700 text-white text-sm h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="aurum" className="text-white">🏆 Ranking Aurum</SelectItem>
              <SelectItem value="pl_menor" className="text-white">📊 Menor P/L</SelectItem>
              <SelectItem value="pvp_menor" className="text-white">📈 Menor P/VP</SelectItem>
              <SelectItem value="dy_maior" className="text-white">💰 Maior Dividend Yield</SelectItem>
            </SelectContent>
          </Select>
          <button 
            onClick={handleUpdate}
            disabled={loading}
            className="h-8 w-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors disabled:opacity-40"
            title="Atualizar ranking"
          >
            <RefreshCw className={`h-4 w-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="h-8 w-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors">
                  <Info className="h-4 w-4 text-gray-400" />
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs bg-gray-800 border-gray-700">
                <p className="text-xs">{tooltipText}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {lastUpdated && (
        <p className="text-xs text-gray-500 mb-3">
          Atualizado em {lastUpdated.toLocaleString('pt-BR')}
        </p>
      )}

      <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Carregando...</div>
        ) : filteredStocks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Nenhum dado disponível</div>
        ) : (
          filteredStocks.map((stock, index) => (
            <div
              key={stock.ticker}
              onClick={() => onSelectStock?.(stock.ticker)}
              className={`relative overflow-hidden rounded-xl transition-all cursor-pointer group ${
                stock.rank_position === 1 ? "bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-2 border-amber-500/40 hover:border-amber-500/60" :
                stock.rank_position === 2 ? "bg-gradient-to-r from-gray-400/10 to-gray-500/10 border-2 border-gray-400/40 hover:border-gray-400/60" :
                stock.rank_position === 3 ? "bg-gradient-to-r from-amber-700/10 to-orange-700/10 border-2 border-amber-700/40 hover:border-amber-700/60" :
                "bg-gray-800/50 border border-gray-700 hover:border-violet-500/40 hover:bg-gray-800"
              }`}
            >
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-sm shadow ${
                    stock.rank_position === 1 ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white" :
                    stock.rank_position === 2 ? "bg-gradient-to-br from-gray-300 to-gray-400 text-gray-900" :
                    stock.rank_position === 3 ? "bg-gradient-to-br from-amber-700 to-orange-800 text-white" :
                    "bg-gray-700 text-gray-300"
                  }`}>
                    {stock.rank_position}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="font-bold text-base text-white group-hover:text-amber-400 transition-colors">
                        {stock.ticker}
                      </span>
                      {stock.rank_position <= 3 && <span className="text-base">{["🥇","🥈","🥉"][stock.rank_position - 1]}</span>}
                    </div>
                    <span className="text-xs text-gray-400">{stock.company_name}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="hidden md:grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
                    <span className="text-gray-400">P/L <span className="text-white font-semibold ml-1">{stock.pl?.toFixed(2) || "—"}</span></span>
                    <span className="text-gray-400">DY <span className="text-emerald-400 font-semibold ml-1">{stock.dy?.toFixed(2) || "—"}%</span></span>
                    <span className="text-gray-400">P/VP <span className="text-white font-semibold ml-1">{stock.pvp?.toFixed(2) || "—"}</span></span>
                    <span className="text-gray-400">ROE <span className="text-blue-400 font-semibold ml-1">{stock.roe?.toFixed(2) || "—"}%</span></span>
                  </div>
                  <div className={`text-right px-3 py-1.5 rounded-lg ${
                    stock.rank_position === 1 ? "bg-amber-500/20 border border-amber-500/30" :
                    stock.rank_position === 2 ? "bg-gray-400/20 border border-gray-400/30" :
                    stock.rank_position === 3 ? "bg-amber-700/20 border border-amber-700/30" :
                    "bg-violet-500/10 border border-violet-500/20"
                  }`}>
                    <div className={`text-lg font-bold ${
                      stock.rank_position === 1 ? "text-amber-400" : stock.rank_position === 2 ? "text-gray-300" :
                      stock.rank_position === 3 ? "text-amber-600" : "text-violet-400"
                    }`}>{scoreDisplay(stock)}</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wide">{scoreLabel}</div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="mt-4 pt-3 border-t border-gray-700/50 text-xs text-gray-500 text-center">
        💡 Clique em uma ação para ver análise detalhada
      </div>
    </div>
  );
}