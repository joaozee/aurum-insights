import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import CompanyAboutSection from "@/components/company/about/CompanyAboutSection.jsx";
import CompanyDataSection from "@/components/company/about/CompanyDataSection.jsx";
import CompanyMetricsSection from "@/components/company/about/CompanyMetricsSection.jsx";
import CompanyRevenueRegionsSection from "@/components/company/about/CompanyRevenueRegionsSection.jsx";
import CompanyBusinessSegmentsSection from "@/components/company/about/CompanyBusinessSegmentsSection.jsx";
import CompanyRevenueChartSection from "@/components/company/about/CompanyRevenueChartSection.jsx";
import CompanyPriceVsEarningsSection from "@/components/company/about/CompanyPriceVsEarningsSection.jsx";
import CompanyFinancialResultsSection from "@/components/company/about/CompanyFinancialResultsSection.jsx";
import CompanyPatrimonialEvolutionSection from "@/components/company/about/CompanyPatrimonialEvolutionSection.jsx";
import CompanyBalanceSheetSection from "@/components/company/about/CompanyBalanceSheetSection.jsx";

export default function CompanyAbout() {
  const [stock] = useState({
    ticker: "SCAR3",
    company_name: "São Carlos",
    logo_url: "https://via.placeholder.com/200x200?text=SCAR3",
    description: "A São Carlos Empreendimentos e Participações S.A. é uma empresa brasileira que atua no setor financeiro e subsetor de exploração de imóveis...",
  });

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-4 md:py-8">
        {/* Header com botão voltar */}
        <div className="flex items-center gap-3 mb-8">
          <Link to={createPageUrl("Company")}>
            <Button variant="outline" size="icon" className="border-gray-700 hover:bg-gray-800">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Sobre a Empresa</h1>
        </div>

        {/* Seções em ordem */}
        <div className="space-y-8">
          <CompanyAboutSection stock={stock} />
          <CompanyDataSection stock={stock} />
          <CompanyMetricsSection stock={stock} />
          <CompanyRevenueRegionsSection stock={stock} />
          <CompanyBusinessSegmentsSection stock={stock} />
          <CompanyRevenueChartSection stock={stock} />
          <CompanyPriceVsEarningsSection stock={stock} />
          <CompanyFinancialResultsSection stock={stock} />
          <CompanyPatrimonialEvolutionSection stock={stock} />
          <CompanyBalanceSheetSection stock={stock} />
        </div>
      </div>
    </div>
  );
}