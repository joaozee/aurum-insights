import { useState, useMemo } from "react";
import { Calendar, DollarSign, ArrowRight, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";

export default function DividendCalendar({ stock }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Usar dados reais da Brapi se disponíveis
  const dividends = stock?.dividends_data?.cashDividends || [];
  
  // Debug: ver estrutura dos dados
  if (dividends.length > 0) {
    console.log('Exemplo de dividendo BRAPI:', dividends[0]);
  }

  // Filtrar dividendos dos últimos 10 anos
  const currentYear = new Date().getFullYear();
  const minYear = currentYear - 10;

  const filteredDividends = useMemo(() => {
    return dividends.filter(div => {
      const dateStr = div.exDate || div.paymentDate;
      if (!dateStr) return false;
      const year = new Date(dateStr).getFullYear();
      return year >= minYear && year <= currentYear;
    });
  }, [dividends, minYear, currentYear]);

  // Ordenar por data ex-dividendo decrescente (mais recentes primeiro)
  const sorted = useMemo(() => {
    return [...filteredDividends].sort((a, b) => {
      const dateA = new Date(a.exDate || a.paymentDate || 0);
      const dateB = new Date(b.exDate || b.paymentDate || 0);
      return dateB - dateA;
    });
  }, [filteredDividends]);

  // Calcular paginação
  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayed = sorted.slice(startIndex, startIndex + itemsPerPage);

  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    try { return new Date(dateStr); } catch { return null; }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="h-5 w-5 text-emerald-400" />
        <h3 className="text-xl font-semibold text-white">
          Calendário de Dividendos{stock?.ticker ? ` - ${stock.ticker}` : ""}
        </h3>
      </div>

      {sorted.length === 0 ? (
        <p className="text-gray-500 text-center py-8">Nenhum dado de dividendos disponível nos últimos 10 anos</p>
      ) : (
        <>
          <div className="space-y-3">
            {displayed.map((div, idx) => {
              // Tentar múltiplos campos para data com (ex-dividend date)
              const exDate = parseDate(div.exDate || div.date || div.exDividendDate || div.approvedOn);
              const payDate = parseDate(div.paymentDate);
              
              // Normalizar o tipo de dividendo
              let type = div.type || div.label || "Dividendo";
              const typeMap = {
                "DIVIDENDO": "Dividendos",
                "DIVIDEND": "Dividendos",
                "JCP": "JCP",
                "JSCP": "JCP",
                "RENDIMENTO": "Rend. Trib.",
                "REND. TRIB.": "Rend. Trib.",
                "INTEREST ON EQUITY": "JCP"
              };
              type = typeMap[type.toUpperCase()] || type;
              
              const rate = div.rate ?? div.value ?? 0;

              return (
                <div key={idx} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{type}</p>
                    <div className="flex flex-col gap-1 text-sm text-gray-400 mt-1">
                      {exDate && (
                        <span>dcom: {format(exDate, "dd/MM/yyyy")}</span>
                      )}
                      {payDate && (
                        <span>pgto: {format(payDate, "dd/MM/yyyy")}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-emerald-400 font-bold text-xl">
                      R$ {rate.toFixed(2)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className={currentPage === pageNum 
                        ? "bg-amber-500 text-black hover:bg-amber-600" 
                        : "border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700"
                      }
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <span className="text-gray-500 px-1">...</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      className="border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700"
                    >
                      {totalPages}
                    </Button>
                  </>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próximo
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function CompanyInfoButton({ stock }) {
  return (
    <Link
      to={createPageUrl("CompanyAbout")}
      className="group block bg-gradient-to-br from-amber-900/20 to-gray-900/40 border border-amber-700/30 hover:border-amber-500/50 rounded-xl p-5 md:p-6 transition-all mt-8"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {stock?.logo_url ? (
            <img
              src={stock.logo_url}
              alt={stock.company_name}
              className="h-8 w-8 md:h-10 md:w-10 rounded-lg object-contain bg-gray-800 p-1"
            />
          ) : (
            <Info className="h-6 w-6 md:h-7 md:w-7 text-amber-400 flex-shrink-0" />
          )}
          <div>
            <h3 className="text-base md:text-lg font-semibold text-white">Conhecendo a Empresa</h3>
            <p className="text-gray-400 text-xs md:text-sm mt-0.5">
              Descubra análises detalhadas, indicadores e como funciona a empresa.
            </p>
          </div>
        </div>
        <ArrowRight className="h-5 w-5 md:h-6 md:w-6 text-amber-400 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
}