import { useState, useEffect } from "react";
import { FileText, Newspaper, Loader, ChevronRight, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { base44 } from "@/api/base44Client";

export default function News({ stock }) {
  const [newsItems, setNewsItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (stock?.ticker) {
      fetchNews();
    }
  }, [stock?.ticker]);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('getStockNews', {
        ticker: stock.ticker,
        company_name: stock.company_name || stock.ticker
      });

      setNewsItems(response.data?.news || []);
    } catch (err) {
      console.error(err);
      setNewsItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewsClick = (item) => {
    if (item.link) {
      window.open(item.link, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl md:rounded-2xl p-4 md:p-6 mb-4 md:mb-8">
      <div className="flex items-center gap-2 mb-4 md:mb-6">
        <Newspaper className="h-4 w-4 md:h-5 md:w-5 text-amber-400" />
        <h3 className="text-base md:text-xl font-semibold text-white">Notícias</h3>
        <span className="ml-auto text-xs text-gray-500">Google News</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="h-8 w-8 text-violet-400 animate-spin" />
        </div>
      ) : (
        <div className="space-y-2 md:space-y-3">
          {newsItems.length > 0 ? newsItems.map((item, idx) => (
            <div
              key={idx}
              onClick={() => handleNewsClick(item)}
              className="bg-gray-800/50 border border-gray-700 rounded-lg md:rounded-xl p-3 md:p-4 hover:bg-gray-800/70 hover:border-amber-500/30 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                  <FileText className="h-4 w-4 md:h-5 md:w-5 text-blue-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white text-sm md:text-base font-medium line-clamp-2 group-hover:text-amber-400 transition-colors">
                      {item.title}
                    </h4>
                    {item.source && (
                      <p className="text-xs text-gray-500 mt-0.5">{item.source}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-gray-500">
                    {format(new Date(item.date), "dd/MM", { locale: ptBR })}
                  </span>
                  <ExternalLink className="h-4 w-4 text-gray-600 group-hover:text-amber-400 transition-colors" />
                </div>
              </div>
            </div>
          )) : (
            <div className="text-center py-6 md:py-8">
              <Newspaper className="h-6 w-6 md:h-8 md:w-8 text-gray-600 mx-auto mb-2 md:mb-3" />
              <p className="text-gray-400 text-sm md:text-base">Nenhuma notícia disponível</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}