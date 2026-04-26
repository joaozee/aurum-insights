import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowRight, Eye, Clock } from "lucide-react";
import PremiumBadge from "@/components/ui/PremiumBadge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ContentHighlight({ content }) {
  const typeLabels = {
    analise: "Análise",
    dividendos: "Dividendos",
    video: "Vídeo",
    artigo: "Artigo"
  };

  return (
    <Link to={createPageUrl(`ContentDetail?id=${content.id}`)}>
      <div className="group relative bg-gray-900 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-300 border border-gray-800 hover:border-violet-500/30">
        <div className="relative h-48 overflow-hidden">
          <img 
            src={content.thumbnail_url || "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600"}
            alt={content.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/20 to-transparent" />
          {content.is_premium && (
            <div className="absolute top-3 right-3">
              <PremiumBadge size="xs" />
            </div>
          )}
          <div className="absolute bottom-3 left-3">
            <span className="px-2.5 py-1 bg-violet-500/20 backdrop-blur-sm border border-violet-500/30 rounded-full text-xs font-medium text-violet-300">
              {typeLabels[content.type] || content.type}
            </span>
          </div>
        </div>
        <div className="p-5">
          <h3 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-violet-400 transition-colors">
            {content.title}
          </h3>
          <p className="text-sm text-gray-400 line-clamp-2 mb-4">
            {content.description}
          </p>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                {content.views || 0}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {content.created_date ? format(new Date(content.created_date), "dd MMM", { locale: ptBR }) : "Hoje"}
              </span>
            </div>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform text-violet-400" />
          </div>
        </div>
      </div>
    </Link>
  );
}