import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, LabelList
} from "recharts";
import { BarChart2, TrendingUp, Loader2 } from "lucide-react";
import { useIndicatorHistory, INDICATOR_META } from "../hooks/useIndicatorHistory";
import { formatValue, calculateAverage } from "../lib/indicatorUtils";

const CustomTooltip = ({ active, payload, label, format }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm shadow-xl">
      <p className="text-gray-400 mb-1">{label}</p>
      <p className="text-white font-bold">{format ? format(payload[0].value) : payload[0].value}</p>
    </div>
  );
};



export default function IndicatorHistoryModal({ open, onClose, metric, stock, allMetrics = [] }) {
  const [chartType, setChartType] = useState("line");
  const [currentMetric, setCurrentMetric] = useState(metric);
  
  const { loading, error, getIndicatorData } = useIndicatorHistory(open && stock?.ticker ? stock.ticker : "");

  React.useEffect(() => {
    if (metric) {
      setCurrentMetric(metric);
    }
  }, [metric]);

  const handleMetricChange = (val) => {
    const found = allMetrics.find(m => m.key === val);
    if (found) {
      setCurrentMetric(found);
    } else {
      // fallback para chaves sem entrada em allMetrics (novos indicadores)
      const meta = INDICATOR_META[val];
      if (meta) setCurrentMetric({ key: val, label: meta.label, value: null });
    }
  };

  // Agrupa allMetrics por categoria usando INDICATOR_META
  const groupedMetrics = allMetrics.reduce((acc, m) => {
    const cat = INDICATOR_META[m.key]?.category || 'outros';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(m);
    return acc;
  }, {});

  const categoryLabels = {
    valuation: 'Valuation',
    debt: 'Endividamento',
    efficiency: 'Eficiência',
    profitability: 'Rentabilidade',
    growth: 'Crescimento',
    raw: 'Dados Financeiros',
    outros: 'Outros',
  };

  if (!currentMetric || !open) return null;

  const indicatorData = getIndicatorData(currentMetric.key);
  const data = indicatorData?.data || [];
  const isRealData = data.length > 0;

  const numericValues = data.map(d => d.value).filter(v => typeof v === 'number' && !isNaN(v));
  const avg = calculateAverage(numericValues);
  
  const formattedAvg = avg !== null ? formatDisplayValue(avg) : "N/D";
  const formattedCurrent = currentMetric.format ? currentMetric.format(currentMetric.value) : "N/D";

  const color = "#C9A96E";

  // Formata valores em milhões (backend envia em M)
  const formatMillions = (val) => {
    if (val === null || val === undefined || isNaN(val)) return 'N/D';
    const abs = Math.abs(val);
    const sign = val < 0 ? '-' : '';
    if (abs >= 1e6) return `${sign}R$ ${(abs / 1e6).toFixed(1)} T`;
    if (abs >= 1e3) return `${sign}R$ ${(abs / 1e3).toFixed(1)} Bi`;
    return `${sign}R$ ${abs.toFixed(1)} M`;
  };

  const formatDisplayValue = (val) => {
    if (!indicatorData) return String(val);
    if (indicatorData.isMillions) return formatMillions(val);
    return formatValue(val, indicatorData.isPercentage, indicatorData.isCurrency);
  };

  const tickFormatter = (val) => {
    if (!indicatorData) return val;
    if (indicatorData.isMillions) {
      const absVal = Math.abs(val);
      if (absVal >= 1e6) return `${(val / 1e6).toFixed(1)}T`;
      if (absVal >= 1e3) return `${(val / 1e3).toFixed(1)}Bi`;
      if (absVal >= 1) return `${val.toFixed(1)}M`;
      return `${val.toFixed(0)}M`;
    }
    if (indicatorData.isCurrency) {
      const absVal = Math.abs(val);
      if (absVal >= 1e9) return `${(val / 1e9).toFixed(1)}Bi`;
      if (absVal >= 1e6) return `${(val / 1e6).toFixed(1)}M`;
      if (absVal >= 1e3) return `${(val / 1e3).toFixed(1)}K`;
      return val.toFixed(1);
    }
    const formatted = formatValue(val, indicatorData.isPercentage, indicatorData.isCurrency);
    return formatted.replace('R$', '').replace(/\s/g, '');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white text-lg">
            <BarChart2 className="h-5 w-5 text-amber-400" />
            Histórico de Indicadores — {stock?.ticker}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-2">
          {/* Selector + toggle */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-gray-400 text-xs uppercase tracking-wider mb-1 block">Indicador</span>
              {allMetrics.length > 0 ? (
                <Select value={currentMetric.key} onValueChange={handleMetricChange}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white font-semibold w-64 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 max-h-80">
                    {Object.entries(groupedMetrics).map(([cat, metrics]) => (
                      <React.Fragment key={cat}>
                        <div className="px-2 py-1 text-xs text-gray-500 uppercase tracking-wider font-semibold">
                          {categoryLabels[cat] || cat}
                        </div>
                        {metrics.map(m => (
                          <SelectItem key={m.key} value={m.key} className="text-white hover:bg-gray-700 pl-4">
                            {m.label}
                          </SelectItem>
                        ))}
                      </React.Fragment>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-white font-semibold text-base">{currentMetric.label}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {loading && <Loader2 className="h-4 w-4 text-amber-400 animate-spin" />}
              {!loading && (
                <span className={`text-xs px-2 py-0.5 rounded-full border ${isRealData ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-gray-500 border-gray-700 bg-gray-800'}`}>
                  {isRealData ? '● Dados reais' : '○ Estimado'}
                </span>
              )}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => setChartType("line")}
                  className={chartType === "line" ? "bg-gray-700 text-white border-gray-600" : "border-gray-700 text-gray-400 hover:bg-gray-800"}
                  variant={chartType === "line" ? "default" : "outline"}
                >
                  <TrendingUp className="h-4 w-4 mr-1" /> Linhas
                </Button>
                <Button
                  size="sm"
                  onClick={() => setChartType("bar")}
                  className={chartType === "bar" ? "bg-gray-700 text-white border-gray-600" : "border-gray-700 text-gray-400 hover:bg-gray-800"}
                  variant={chartType === "bar" ? "default" : "outline"}
                >
                  <BarChart2 className="h-4 w-4 mr-1" /> Barra
                </Button>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-gray-800/60 rounded-lg p-3 text-center">
              <p className="text-gray-400 text-xs mb-1">Valor atual</p>
              <p className="text-white font-bold text-lg">{formattedCurrent || "N/D"}</p>
            </div>
            <div className="bg-gray-800/60 rounded-lg p-3 text-center">
              <p className="text-gray-400 text-xs mb-1">Média histórica</p>
              <p className="text-white font-bold text-lg">{formattedAvg}</p>
            </div>
            <div className="bg-gray-800/60 rounded-lg p-3 text-center">
              <p className="text-gray-400 text-xs mb-1">Média do setor</p>
              <p className="text-white font-bold text-lg">
                {currentMetric.sectorAvg ? formatValue(currentMetric.sectorAvg, indicatorData?.isPercentage || false, indicatorData?.isCurrency || false) : "N/D"}
              </p>
            </div>
          </div>

          {/* Chart */}
          <div className="h-64">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 text-amber-400 animate-spin" />
              </div>
            ) : data.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p>Sem dados históricos disponíveis para este indicador</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "line" ? (
                  <LineChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="year" tick={{ fill: "#9CA3AF", fontSize: 11 }} />
                    <YAxis tickFormatter={tickFormatter} tick={{ fill: "#9CA3AF", fontSize: 11 }} width={50} />
                    <Tooltip content={<CustomTooltip format={formatDisplayValue} />} />
                    {avg !== null && <ReferenceLine y={avg} stroke="#6B7280" strokeDasharray="4 4" />}
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={color}
                      strokeWidth={2}
                      dot={{ fill: color, r: 4 }}
                      activeDot={{ r: 6 }}
                    >
                      <LabelList
                        dataKey="value"
                        position="top"
                        formatter={(v) => tickFormatter(v)}
                        style={{ fontSize: 9, fill: "#D1D5DB" }}
                      />
                    </Line>
                  </LineChart>
                ) : (
                  <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="year" tick={{ fill: "#9CA3AF", fontSize: 11 }} />
                    <YAxis tickFormatter={tickFormatter} tick={{ fill: "#9CA3AF", fontSize: 11 }} width={50} />
                    <Tooltip content={<CustomTooltip format={formatDisplayValue} />} />
                    {avg !== null && <ReferenceLine y={avg} stroke="#6B7280" strokeDasharray="4 4" />}
                    <Bar dataKey="value" fill={color} radius={[3, 3, 0, 0]}>
                      <LabelList
                        dataKey="value"
                        position="top"
                        formatter={(v) => tickFormatter(v)}
                        style={{ fontSize: 9, fill: "#D1D5DB" }}
                      />
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}