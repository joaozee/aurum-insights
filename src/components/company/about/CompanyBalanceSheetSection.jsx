import { PieChart } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function CompanyBalanceSheetSection() {
  const balanceSheet = [
  {
    category: "ATIVO TOTAL - (R$)",
    subcategories: [
    { label: "Ativo Circulante - (R$)", data: ["801.41", "1.05", "596.50", "296.00", "586.07"] },
    { label: "Ativo Não Circulante - (R$)", data: ["2.07", "2.52", "2.92", "3.16", "2.49"] }],

    main: ["2.87", "3.56", "3.52", "3.46", "3.08"]
  },
  {
    category: "PASSIVO TOTAL - (R$)",
    subcategories: [
    { label: "Passivo Circulante - (R$)", data: ["265.15", "376.76", "233.24", "539.00", "214.61"] },
    { label: "Passivo Não Circulante - (R$)", data: ["1.05", "1.46", "1.80", "1.34", "1.30"] },
    { label: "Patrimônio Líquido Consolidado - (R$)", data: ["1.55", "1.73", "1.49", "1.58", "1.56"] }],

    main: ["2.87", "3.56", "3.52", "3.46", "3.08"]
  }];


  const years = ["2024", "2023", "2022", "2021", "2020"];

  return null;








































}