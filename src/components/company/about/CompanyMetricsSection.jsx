import { Info } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function CompanyMetricsSection({ stock }) {
  if (!stock?.fundamentals) return null;

  const f = stock.fundamentals;
  const formatBR = (val) => val != null && val !== "N/A" ? `R$ ${(val / 1e9).toFixed(2)} Bi` : "N/A";
  const formatM = (val) => val != null && val !== "N/A" ? `${(val / 1e6).toFixed(0)}M` : "N/A";

  const metrics = [
  { label: "Valor de mercado", value: stock.market_cap ? formatBR(stock.market_cap) : "N/A" },
  { label: "Enterprise Value", value: f.ev ? formatBR(f.ev) : "N/A" },
  { label: "Patrimônio Líquido", value: f.shareholder_equity ? formatBR(f.shareholder_equity) : "N/A" },
  { label: "Nº de ações", value: f.shares_outstanding ? formatM(f.shares_outstanding) : "N/A" },
  { label: "Ativos Totais", value: f.total_assets ? formatBR(f.total_assets) : "N/A" },
  { label: "Dívida Bruta", value: f.total_debt ? formatBR(f.total_debt) : "N/A" },
  { label: "Dívida Líquida", value: f.net_debt ? formatBR(f.net_debt) : "N/A" },
  { label: "Caixa Total", value: f.total_cash ? formatBR(f.total_cash) : "N/A" },
  { label: "Volume Médio", value: f.avg_volume ? formatM(f.avg_volume) : "N/A" },
  { label: "Beta", value: f.beta || "N/A" },
  { label: "Setor", value: stock.sector || "N/A" },
  { label: "Indústria", value: stock.industry || "N/A" }].
  filter((m) => m.value !== "N/A");

  return null;
















}