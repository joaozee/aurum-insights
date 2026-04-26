import { ArrowUp, ArrowDown, TrendingUp, Building2, Users, BarChart3 } from "lucide-react";
import { formatFII } from "@/components/utils/fiiService";

export default function FIIQuoteCard({ data }) {
  if (!data) return null;
  const { basic_info: bi, indicators: ind, metadata: meta } = data;

  const isPositive = (bi.daily_change_percent || 0) >= 0;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <img
            src={bi.logo_url}
            alt={bi.symbol}
            className="h-12 w-12 rounded-xl bg-gray-800 object-contain p-1"
            onError={e => { e.target.style.display = 'none'; }}
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-white text-xl font-bold">{bi.symbol}</h2>
              <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-medium">FII</span>
              {meta?.tipo_fundo && (
                <span className="bg-violet-500/20 text-violet-400 text-xs px-2 py-0.5 rounded-full">
                  {meta.tipo_fundo === 'tijolo' ? 'Tijolo' : meta.tipo_fundo === 'papel' ? 'Papel' : meta.tipo_fundo === 'fundo_de_fundos' ? 'FoF' : 'Híbrido'}
                </span>
              )}
            </div>
            <p className="text-gray-400 text-sm mt-0.5 max-w-xs truncate">{bi.company_name}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-white text-2xl font-bold">{formatFII(bi.current_price, 'currency')}</p>
          <div className={`flex items-center justify-end gap-1 text-sm font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {isPositive ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
            {formatFII(Math.abs(bi.daily_change || 0), 'currency')} ({formatFII(Math.abs(bi.daily_change_percent || 0), 'percent')})
          </div>
        </div>
      </div>

      {/* Indicadores principais */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <MetricCard label="DY 12m" value={ind?.dividend_yield_12m != null ? `${ind.dividend_yield_12m}%` : 'N/A'} color="emerald" />
        <MetricCard label="P/VP" value={ind?.pvp != null ? ind.pvp : 'N/A'} color={ind?.pvp < 1 ? 'emerald' : ind?.pvp > 1.2 ? 'red' : 'amber'} />
        <MetricCard label="Últ. Dividendo" value={ind?.last_dividend != null ? formatFII(ind.last_dividend, 'currency') : 'N/A'} color="violet" />
        <MetricCard label="VPC" value={ind?.valor_patrimonial_cota != null ? formatFII(ind.valor_patrimonial_cota, 'currency') : 'N/A'} color="blue" />
      </div>

      {/* Linha 2 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard label="Market Cap" value={ind?.market_cap != null ? formatFII(ind.market_cap, 'large') : 'N/A'} color="gray" />
        <MetricCard label="Liquidez Diária" value={ind?.liquidez_diaria != null ? formatFII(ind.liquidez_diaria, 'large') : 'N/A'} color="gray" />
        <MetricCard label="DY 3m" value={ind?.dy_3m != null ? `${ind.dy_3m}%` : 'N/A'} color="gray" />
        <MetricCard label="DY 6m" value={ind?.dy_6m != null ? `${ind.dy_6m}%` : 'N/A'} color="gray" />
      </div>

      {/* Metadados se disponíveis */}
      {(meta?.segmento || meta?.gestor || meta?.vacancia != null || meta?.numero_cotistas) && (
        <div className="mt-4 pt-4 border-t border-gray-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          {meta.segmento && <InfoItem icon={Building2} label="Segmento" value={meta.segmento.replace(/_/g, ' ')} />}
          {meta.gestor && <InfoItem icon={TrendingUp} label="Gestor" value={meta.gestor} />}
          {meta.vacancia != null && <InfoItem icon={BarChart3} label="Vacância" value={`${meta.vacancia}%`} />}
          {meta.numero_cotistas && <InfoItem icon={Users} label="Cotistas" value={formatFII(meta.numero_cotistas, 'number')} />}
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, color = 'gray' }) {
  const colors = {
    emerald: 'text-emerald-400',
    red: 'text-red-400',
    amber: 'text-amber-400',
    violet: 'text-violet-400',
    blue: 'text-blue-400',
    gray: 'text-white',
  };
  return (
    <div className="bg-gray-800/60 rounded-xl p-3">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className={`font-bold text-sm ${colors[color]}`}>{value}</p>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2 text-gray-300">
      <Icon className="h-3.5 w-3.5 text-gray-500 shrink-0" />
      <span className="text-gray-500">{label}:</span>
      <span className="capitalize truncate">{value}</span>
    </div>
  );
}