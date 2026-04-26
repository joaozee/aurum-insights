import { Building2 } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function CompanyFinancialResultsSection({ stock }) {
  if (!stock?.fundamentals) return null;

  const f = stock.fundamentals;
  const formatBR = (val) => val != null && val !== "N/A" ? `${(val / 1e9).toFixed(2)} Bi` : "N/A";
  const formatPct = (val) => val != null && val !== "N/A" ? `${val.toFixed(2)}%` : "N/A";

  const results = [
  { label: "Receita Líquida", value: formatBR(f.total_revenue) },
  { label: "Lucro Bruto", value: formatBR(f.gross_profit) },
  { label: "Lucro Líquido", value: formatBR(f.net_income) },
  { label: "EBITDA", value: formatBR(f.ebitda) },
  { label: "EBIT", value: formatBR(f.ebit) },
  { label: "Free Cash Flow", value: formatBR(f.free_cashflow) },
  { label: "Dívida Bruta", value: formatBR(f.total_debt) },
  { label: "Dívida Líquida", value: formatBR(f.net_debt) },
  { label: "Margem Bruta", value: formatPct(f.gross_margin) },
  { label: "Margem EBITDA", value: formatPct(f.ebitda_margin) },
  { label: "Margem EBIT", value: formatPct(f.ebit_margin) },
  { label: "Margem Líquida", value: formatPct(f.profit_margin) },
  { label: "ROE", value: formatPct(f.roe) },
  { label: "ROA", value: formatPct(f.roa) },
  { label: "ROIC", value: formatPct(f.roic) }].
  filter((r) => r.value !== "N/A");

  return null;
















}