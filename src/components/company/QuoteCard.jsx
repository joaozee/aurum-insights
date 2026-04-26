import { TrendingUp, TrendingDown, Target, Users, BarChart3, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const fmt = (v, prefix = "R$ ", decimals = 2) =>
v != null ? `${prefix}${v.toFixed(decimals)}` : "N/A";

const fmtBig = (v) => {
  if (!v) return "N/A";
  if (v >= 1e12) return `R$ ${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `R$ ${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `R$ ${(v / 1e6).toFixed(2)}M`;
  return `R$ ${v.toFixed(2)}`;
};

const RECOMMENDATION_LABELS = {
  strongBuy: { label: "Compra Forte", color: "text-emerald-400" },
  buy: { label: "Compra", color: "text-green-400" },
  hold: { label: "Manter", color: "text-amber-400" },
  sell: { label: "Venda", color: "text-orange-400" },
  strongSell: { label: "Venda Forte", color: "text-red-400" }
};

export default function QuoteCard({ stock }) {
  if (!stock) return null;

  const change = stock.daily_change || 0;
  const changePercent = stock.daily_change_percent || 0;
  const isPositive = change >= 0;

  const upside = stock.price_target && stock.current_price ?
  ((stock.price_target - stock.current_price) / stock.current_price * 100).toFixed(1) :
  null;

  const rec = RECOMMENDATION_LABELS[stock.analyst_recommendation];

  const stats = [
  { label: "Abertura", value: fmt(stock.day_open) },
  { label: "Máx. Dia", value: fmt(stock.day_high) },
  { label: "Mín. Dia", value: fmt(stock.day_low) },
  { label: "Fech. Ant.", value: fmt(stock.prev_close) },
  { label: "Mín. 52s", value: fmt(stock.week_low_52) },
  { label: "Máx. 52s", value: fmt(stock.week_high_52) },
  { label: "Volume", value: stock.volume ? `${(stock.volume / 1e6).toFixed(2)}M` : "N/A" },
  { label: "Market Cap", value: fmtBig(stock.market_cap) }];


  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl md:rounded-2xl p-4 md:p-6 mb-4 md:mb-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-4 flex-1">
          <div className="h-14 w-14 md:h-20 md:w-20 rounded-xl bg-white flex-shrink-0 flex items-center justify-center shadow-lg overflow-hidden">
            {stock.logo_url ? (
              <img
                src={stock.logo_url}
                alt={stock.company_name}
                className="h-full w-full object-contain p-1"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <span
              className="text-gray-800 font-bold text-xl"
              style={{ display: stock.logo_url ? 'none' : 'flex' }}
            >
              {(stock.ticker || '').slice(0, 2)}
            </span>
          </div>
          <div>
            <p className="text-white text-lg md:text-2xl font-bold leading-tight">{stock.company_name}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-gray-800 border border-gray-700 text-amber-400 text-xs font-bold px-2 py-0.5 rounded">{stock.ticker}</span>
              {stock.exchange && <span className="text-gray-500 text-xs">{stock.exchange}</span>}
              {stock.sector && <span className="text-gray-500 text-xs">· {stock.sector}</span>}
            </div>
          </div>
        </div>

        {/* Preço */}
        <div className="text-left md:text-right">
          <p className="text-4xl md:text-5xl font-bold text-white">
            R$ {stock.current_price?.toFixed(2) || "0.00"}
          </p>
          <div className={cn("flex items-center gap-2 mt-1 md:justify-end", isPositive ? "text-emerald-400" : "text-red-400")}>
            {isPositive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
            <span className="text-lg font-semibold">
              {isPositive ? "+" : ""}R$ {Math.abs(change).toFixed(2)} ({changePercent.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {stats.map((s) => null




        )}
      </div>

      {/* Fundamentais rápidos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
          <p className="text-gray-400 text-xs mb-1">Preço Teto</p>
          <p className="text-amber-400 font-bold text-xl">
            {stock.dividend_yield && stock.current_price 
              ? fmt((stock.dividend_yield / 100 * stock.current_price) / 0.06)
              : "N/A"}
          </p>
          {stock.dividend_yield && stock.current_price &&
          <p className="text-xs text-gray-400 mt-0.5">
              {(() => {
                const precoTeto = (stock.dividend_yield / 100 * stock.current_price) / 0.06;
                const upside = ((precoTeto - stock.current_price) / stock.current_price) * 100;
                return (
                  <span className={upside >= 0 ? "text-emerald-400" : "text-red-400"}>
                    {upside.toFixed(1)}% upside
                  </span>
                );
              })()}
            </p>
          }
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
          <p className="text-gray-400 text-xs mb-1">Dividend Yield</p>
          <p className="text-emerald-400 font-bold text-xl">
            {typeof stock.dividend_yield === 'number' ? `${stock.dividend_yield.toFixed(2)}%` : "N/A"}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Renda passiva anual</p>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
          <p className="text-gray-400 text-xs mb-1">P/L</p>
          <p className="text-blue-400 font-bold text-xl">
            {typeof stock.pe_ratio === 'number' ? stock.pe_ratio.toFixed(2) : "N/A"}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Valuation</p>
        </div>

        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3">
          <p className="text-gray-400 text-xs mb-1">P/VP</p>
          <p className="text-purple-400 font-bold text-xl">
            {typeof stock.pb_ratio === 'number' ? stock.pb_ratio.toFixed(2) : "N/A"}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Preço / Patrimônio</p>
        </div>
      </div>

      {/* Recomendação analistas */}
      {(rec || stock.analyst_count || stock.target_low || stock.target_high) &&
      <div className="mt-4 flex flex-wrap items-center gap-4 px-1">
          {rec &&
        <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-gray-500" />
              <span className="text-gray-400 text-xs">Consenso:</span>
              <span className={cn("text-sm font-bold", rec.color)}>{rec.label}</span>
            </div>
        }
          {stock.analyst_count &&
        <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-gray-400 text-xs">{stock.analyst_count} analistas</span>
            </div>
        }
          {stock.target_low && stock.target_high &&
        <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-gray-500" />
              <span className="text-gray-400 text-xs">
                Alvo: <span className="text-white font-medium">R${stock.target_low?.toFixed(2)} – R${stock.target_high?.toFixed(2)}</span>
              </span>
            </div>
        }
        </div>
      }
    </div>);

}