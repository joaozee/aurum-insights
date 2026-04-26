import { useState } from "react";
import { Trophy, TrendingUp, TrendingDown, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const stocksData = [
  {
    ticker: "ITUB4",
    name: "Itaú Unibanco",
    pl: 8.5,
    pvp: 1.8,
    roe: 20.4,
    margemLiquida: 11.3,
    dividaEbitda: 1.2,
    dy5y: 5.8
  },
  {
    ticker: "BBAS3",
    name: "Banco do Brasil",
    pl: 5.2,
    pvp: 0.9,
    roe: 18.5,
    margemLiquida: 14.2,
    dividaEbitda: 0.8,
    dy5y: 8.2
  },
  {
    ticker: "WEGE3",
    name: "WEG",
    pl: 35.2,
    pvp: 9.5,
    roe: 28.1,
    margemLiquida: 16.8,
    dividaEbitda: 0.3,
    dy5y: 1.4
  },
  {
    ticker: "TAEE11",
    name: "Taesa",
    pl: 7.8,
    pvp: 1.5,
    roe: 22.3,
    margemLiquida: 45.2,
    dividaEbitda: 2.8,
    dy5y: 9.5
  },
  {
    ticker: "BBSE3",
    name: "BB Seguridade",
    pl: 9.1,
    pvp: 4.2,
    roe: 58.2,
    margemLiquida: 32.1,
    dividaEbitda: 0.0,
    dy5y: 7.8
  },
  {
    ticker: "EGIE3",
    name: "Engie Brasil",
    pl: 10.5,
    pvp: 2.1,
    roe: 19.8,
    margemLiquida: 22.5,
    dividaEbitda: 2.2,
    dy5y: 6.2
  },
  {
    ticker: "PETR4",
    name: "Petrobras",
    pl: 4.2,
    pvp: 1.1,
    roe: 28.5,
    margemLiquida: 18.3,
    dividaEbitda: 1.5,
    dy5y: 12.5
  },
  {
    ticker: "VALE3",
    name: "Vale",
    pl: 6.8,
    pvp: 1.4,
    roe: 22.1,
    margemLiquida: 25.8,
    dividaEbitda: 0.9,
    dy5y: 10.2
  },
  {
    ticker: "RENT3",
    name: "Localiza",
    pl: 12.4,
    pvp: 2.8,
    roe: 24.3,
    margemLiquida: 19.5,
    dividaEbitda: 3.2,
    dy5y: 2.1
  },
  {
    ticker: "ABEV3",
    name: "Ambev",
    pl: 14.2,
    pvp: 3.1,
    roe: 21.8,
    margemLiquida: 28.4,
    dividaEbitda: 0.5,
    dy5y: 4.5
  },
  {
    ticker: "B3SA3",
    name: "B3",
    pl: 11.8,
    pvp: 2.9,
    roe: 25.6,
    margemLiquida: 52.3,
    dividaEbitda: 0.2,
    dy5y: 5.9
  },
  {
    ticker: "EQTL3",
    name: "Equatorial",
    pl: 9.3,
    pvp: 2.3,
    roe: 24.8,
    margemLiquida: 15.7,
    dividaEbitda: 2.5,
    dy5y: 4.8
  },
  {
    ticker: "CPLE6",
    name: "Copel",
    pl: 8.6,
    pvp: 1.6,
    roe: 18.9,
    margemLiquida: 20.1,
    dividaEbitda: 1.8,
    dy5y: 7.2
  },
  {
    ticker: "SANB11",
    name: "Santander",
    pl: 6.9,
    pvp: 1.2,
    roe: 17.4,
    margemLiquida: 12.8,
    dividaEbitda: 1.1,
    dy5y: 6.8
  },
  {
    ticker: "CMIG4",
    name: "Cemig",
    pl: 7.2,
    pvp: 1.3,
    roe: 16.5,
    margemLiquida: 18.9,
    dividaEbitda: 2.1,
    dy5y: 8.5
  },
  {
    ticker: "CSAN3",
    name: "Cosan",
    pl: 13.5,
    pvp: 1.8,
    roe: 14.2,
    margemLiquida: 8.3,
    dividaEbitda: 2.8,
    dy5y: 3.2
  },
  {
    ticker: "RADL3",
    name: "Raia Drogasil",
    pl: 18.2,
    pvp: 4.5,
    roe: 26.3,
    margemLiquida: 7.8,
    dividaEbitda: 0.8,
    dy5y: 2.8
  },
  {
    ticker: "SUZB3",
    name: "Suzano",
    pl: 11.2,
    pvp: 1.9,
    roe: 17.8,
    margemLiquida: 22.6,
    dividaEbitda: 3.1,
    dy5y: 3.5
  },
  {
    ticker: "KLBN11",
    name: "Klabin",
    pl: 10.8,
    pvp: 2.1,
    roe: 19.4,
    margemLiquida: 21.3,
    dividaEbitda: 2.4,
    dy5y: 4.2
  },
  {
    ticker: "PRIO3",
    name: "PetroRio",
    pl: 5.4,
    pvp: 1.6,
    roe: 31.2,
    margemLiquida: 42.5,
    dividaEbitda: 0.7,
    dy5y: 11.8
  }
];

// Pesos conforme especificado
const weights = {
  pl: 0.15,
  pvp: 0.20,
  roe: 0.05,
  margemLiquida: 0.05,
  dividaEbitda: 0.05,
  dy5y: 0.50
};

function calculateScore(stock) {
  // Normalizar e calcular score (quanto menor P/L e P/VP melhor, quanto maior os outros melhor)
  const plScore = (1 / stock.pl) * 100 * weights.pl;
  const pvpScore = (1 / stock.pvp) * 100 * weights.pvp;
  const roeScore = stock.roe * weights.roe;
  const margemScore = stock.margemLiquida * weights.margemLiquida;
  const dividaScore = (stock.dividaEbitda === 0 ? 10 : (1 / stock.dividaEbitda) * 10) * weights.dividaEbitda;
  const dyScore = stock.dy5y * weights.dy5y;
  
  return plScore + pvpScore + roeScore + margemScore + dividaScore + dyScore;
}

export default function StockRanking({ onSelectStock }) {
  const [rankingType, setRankingType] = useState("aurum");

  const getRankedStocks = () => {
    let ranked = [];
    
    switch (rankingType) {
      case "aurum":
        ranked = stocksData
          .map(stock => ({
            ...stock,
            score: calculateScore(stock)
          }))
          .sort((a, b) => b.score - a.score);
        break;
      
      case "pl_menor":
        ranked = stocksData
          .map(stock => ({ ...stock, score: stock.pl }))
          .sort((a, b) => a.pl - b.pl);
        break;
      
      case "pvp_menor":
        ranked = stocksData
          .map(stock => ({ ...stock, score: stock.pvp }))
          .sort((a, b) => a.pvp - b.pvp);
        break;
      
      case "dy_maior":
        ranked = stocksData
          .map(stock => ({ ...stock, score: stock.dy5y }))
          .sort((a, b) => b.dy5y - a.dy5y);
        break;
      
      default:
        ranked = stocksData
          .map(stock => ({
            ...stock,
            score: calculateScore(stock)
          }))
          .sort((a, b) => b.score - a.score);
    }
    
    return ranked.slice(0, 20);
  };

  const rankedStocks = getRankedStocks();

  const getRankingLabel = () => {
    switch (rankingType) {
      case "aurum": return "Ranking Aurum";
      case "pl_menor": return "Menor P/L";
      case "pvp_menor": return "Menor P/VP";
      case "dy_maior": return "Maior Dividend Yield";
      default: return "Ranking Aurum";
    }
  };

  const getScoreDisplay = (stock) => {
    switch (rankingType) {
      case "pl_menor": return stock.pl.toFixed(1);
      case "pvp_menor": return stock.pvp.toFixed(1);
      case "dy_maior": return stock.dy5y.toFixed(1) + "%";
      default: return stock.score.toFixed(1);
    }
  };

  const getScoreLabel = () => {
    switch (rankingType) {
      case "pl_menor": return "P/L";
      case "pvp_menor": return "P/VP";
      case "dy_maior": return "DY";
      default: return "Score";
    }
  };
  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-amber-950/20 border border-gray-800 rounded-2xl p-6 mb-8 shadow-xl">
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Ranking de Ações</h3>
              <p className="text-xs text-gray-400">Top 20 ações por fundamentos</p>
            </div>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="h-8 w-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors">
                  <Info className="h-4 w-4 text-gray-400" />
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs bg-gray-800 border-gray-700">
                <p className="text-xs">
                  {rankingType === "aurum" 
                    ? "Score baseado em: DY 5 anos (50%), P/VP (20%), P/L (15%), ROE (5%), Margem (5%), Dív/EBITDA (5%)"
                    : rankingType === "pl_menor"
                    ? "Ordenado por menor P/L (Preço/Lucro)"
                    : rankingType === "pvp_menor"
                    ? "Ordenado por menor P/VP (Preço/Valor Patrimonial)"
                    : "Ordenado por maior Dividend Yield médio 5 anos"
                  }
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <Select value={rankingType} onValueChange={setRankingType}>
          <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            <SelectItem value="aurum" className="text-white">
              🏆 Ranking Aurum
            </SelectItem>
            <SelectItem value="pl_menor" className="text-white">
              📊 Menor P/L
            </SelectItem>
            <SelectItem value="pvp_menor" className="text-white">
              📈 Menor P/VP
            </SelectItem>
            <SelectItem value="dy_maior" className="text-white">
              💰 Maior Dividend Yield
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2 max-h-[800px] overflow-y-auto pr-2">
        {rankedStocks.map((stock, index) => (
          <div
            key={stock.ticker}
            onClick={() => onSelectStock?.(stock.ticker)}
            className={`relative overflow-hidden rounded-xl transition-all cursor-pointer group ${
              index === 0 ? "bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-2 border-amber-500/40 hover:border-amber-500/60" :
              index === 1 ? "bg-gradient-to-r from-gray-400/10 to-gray-500/10 border-2 border-gray-400/40 hover:border-gray-400/60" :
              index === 2 ? "bg-gradient-to-r from-amber-700/10 to-orange-700/10 border-2 border-amber-700/40 hover:border-amber-700/60" :
              "bg-gray-800/50 border border-gray-700 hover:border-violet-500/40 hover:bg-gray-800"
            }`}
          >
            {/* Subtle gradient overlay */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity ${
              index < 3 ? "bg-gradient-to-r from-transparent via-white/5 to-transparent" :
              "bg-gradient-to-r from-transparent via-violet-500/5 to-transparent"
            }`} />
            
            <div className="relative p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Posição */}
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-base shadow-lg ${
                  index === 0 ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-amber-500/50" :
                  index === 1 ? "bg-gradient-to-br from-gray-300 to-gray-400 text-gray-900 shadow-gray-400/50" :
                  index === 2 ? "bg-gradient-to-br from-amber-700 to-orange-800 text-white shadow-amber-700/50" :
                  "bg-gray-700 text-gray-300"
                }`}>
                  {index + 1}
                </div>
                
                {/* Informações do ativo */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-lg text-white group-hover:text-amber-400 transition-colors">
                      {stock.ticker}
                    </span>
                    {index < 3 && (
                      <span className="text-xl">
                        {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-400">{stock.name}</span>
                </div>
              </div>

              {/* Métricas e Score */}
              <div className="flex items-center gap-6">
                <div className="hidden md:grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div className="text-gray-400">
                    P/L <span className="text-white font-semibold ml-1">{stock.pl}</span>
                  </div>
                  <div className="text-gray-400">
                    DY <span className="text-emerald-400 font-semibold ml-1">{stock.dy5y}%</span>
                  </div>
                  <div className="text-gray-400">
                    P/VP <span className="text-white font-semibold ml-1">{stock.pvp}</span>
                  </div>
                  <div className="text-gray-400">
                    ROE <span className="text-blue-400 font-semibold ml-1">{stock.roe}%</span>
                  </div>
                </div>
                
                {/* Score */}
                <div className={`text-right px-4 py-2 rounded-lg ${
                  index === 0 ? "bg-amber-500/20 border border-amber-500/30" :
                  index === 1 ? "bg-gray-400/20 border border-gray-400/30" :
                  index === 2 ? "bg-amber-700/20 border border-amber-700/30" :
                  "bg-violet-500/10 border border-violet-500/20"
                }`}>
                  <div className={`text-xl font-bold ${
                    index === 0 ? "text-amber-400" :
                    index === 1 ? "text-gray-300" :
                    index === 2 ? "text-amber-600" :
                    "text-violet-400"
                  }`}>
                    {getScoreDisplay(stock)}
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wide">{getScoreLabel()}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-700/50">
        <p className="text-xs text-gray-500 text-center">
          💡 Clique em uma ação para ver análise detalhada
        </p>
      </div>
    </div>
  );
}