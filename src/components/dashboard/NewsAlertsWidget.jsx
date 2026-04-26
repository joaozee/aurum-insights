import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Newspaper, ExternalLink, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { cn } from "@/lib/utils";

export default function NewsAlertsWidget({ news = [] }) {
  // Filtrar apenas as 3 notícias mais relevantes
  const topNews = news
    .filter(item => item.relevanceScore >= 80)
    .slice(0, 3);

  if (topNews.length === 0) {
    return (
      <Card className="bg-gray-900 border-gray-700 p-4 lg:p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
            <Newspaper className="h-4 w-4 text-violet-400" />
          </div>
          <h3 className="font-semibold text-white text-sm lg:text-base">Notícias Relevantes</h3>
        </div>
        <div className="text-center py-6">
          <Newspaper className="h-10 w-10 text-gray-600 mx-auto mb-2 opacity-50" />
          <p className="text-sm text-gray-400">Configure suas preferências</p>
          <Link to={createPageUrl("News")}>
            <Button variant="outline" size="sm" className="mt-3 border-gray-700">
              Ver Notícias
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900 border-gray-700 p-4 lg:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
            <Newspaper className="h-4 w-4 text-violet-400" />
          </div>
          <h3 className="font-semibold text-white text-sm lg:text-base">Notícias Relevantes</h3>
        </div>
        <Link to={createPageUrl("News")}>
          <Button variant="ghost" size="sm" className="text-violet-400 hover:text-violet-300">
            Ver Todas
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {topNews.map((item, index) => (
          <div
            key={item.id}
            className={cn(
              "p-3 rounded-lg border transition-all hover:bg-gray-800/50",
              index === 0 
                ? "bg-violet-500/10 border-violet-500/30" 
                : "bg-gray-800/30 border-gray-700"
            )}
          >
            <div className="flex gap-3">
              {/* Score Badge */}
              <div className="flex-shrink-0">
                <div className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center font-bold text-sm",
                  item.relevanceScore >= 90 ? "bg-emerald-500/20 text-emerald-400" :
                  item.relevanceScore >= 85 ? "bg-blue-500/20 text-blue-400" :
                  "bg-amber-500/20 text-amber-400"
                )}>
                  {item.relevanceScore}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h4 className="text-white font-medium text-xs lg:text-sm leading-tight line-clamp-2">
                    {item.title}
                  </h4>
                  {index === 0 && (
                    <Sparkles className="h-3.5 w-3.5 text-yellow-400 flex-shrink-0" />
                  )}
                </div>

                <p className="text-gray-400 text-xs mb-2 line-clamp-1 lg:line-clamp-2">
                  {item.summary}
                </p>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex gap-1.5 flex-wrap">
                    {item.topics.slice(0, 2).map(topic => (
                      <Badge key={topic} variant="outline" className="text-[10px] px-1.5 py-0 border-gray-600 text-gray-300">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet-400 hover:text-violet-300 flex items-center gap-1 text-xs flex-shrink-0"
                  >
                    Ler
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}