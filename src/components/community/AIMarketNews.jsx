import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { TrendingUp, Bookmark, BookmarkCheck, ExternalLink, Sparkles, Loader2, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function AIMarketNews({ userEmail }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [savedNewsIds, setSavedNewsIds] = useState(new Set());
  const [preferences, setPreferences] = useState(null);

  useEffect(() => {
    if (userEmail && expanded && news.length === 0) {
      loadData();
    }
  }, [userEmail, expanded]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load user preferences
      const prefs = await base44.entities.NewsPreferences.filter({
        user_email: userEmail
      });
      
      const userPrefs = prefs.length > 0 ? prefs[0] : null;
      setPreferences(userPrefs);

      // Load saved news
      const saved = await base44.entities.SavedNews.filter({
        user_email: userEmail
      });
      setSavedNewsIds(new Set(saved.map(s => s.url)));

      // Fetch personalized news with AI
      await fetchPersonalizedNews(userPrefs);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar notícias");
    } finally {
      setLoading(false);
    }
  };

  const fetchPersonalizedNews = async (userPrefs) => {
    try {
      const topics = userPrefs?.topics_of_interest?.join(", ") || "ações, macroeconomia";
      const tickers = userPrefs?.followed_tickers?.slice(0, 5)?.join(", ") || "IBOV, PETR4, VALE3";

      const prompt = `Você é um analista financeiro. Busque as 5 notícias mais relevantes do mercado brasileiro de hoje relacionadas a: ${topics}.
      
Foco especial em: ${tickers}

Para cada notícia, retorne:
- title: título claro e direto
- summary: resumo em 2-3 linhas destacando o impacto para investidores
- source: fonte da notícia
- category: categoria (acoes, fiis, macroeconomia, commodities, etc)
- url: link da notícia original (se disponível)
- time: há quanto tempo foi publicada (ex: "há 2h", "há 1 dia")

Priorize notícias que impactam investimentos e decisões financeiras.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            news: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  summary: { type: "string" },
                  source: { type: "string" },
                  category: { type: "string" },
                  url: { type: "string" },
                  time: { type: "string" }
                }
              }
            }
          }
        }
      });

      setNews(result.news || []);
    } catch (error) {
      console.error(error);
      // Fallback to generic news
      setNews([
        {
          title: "Erro ao buscar notícias personalizadas",
          summary: "Tente atualizar suas preferências de notícias",
          source: "Sistema",
          time: "agora",
          category: "sistema"
        }
      ]);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPersonalizedNews(preferences);
    setRefreshing(false);
    toast.success("Notícias atualizadas");
  };

  const handleSaveNews = async (newsItem) => {
    try {
      const isSaved = savedNewsIds.has(newsItem.url);

      if (isSaved) {
        // Remove from saved
        const saved = await base44.entities.SavedNews.filter({
          user_email: userEmail,
          url: newsItem.url
        });
        if (saved.length > 0) {
          await base44.entities.SavedNews.delete(saved[0].id);
        }
        setSavedNewsIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(newsItem.url);
          return newSet;
        });
        toast.success("Notícia removida dos salvos");
      } else {
        // Save news
        await base44.entities.SavedNews.create({
          user_email: userEmail,
          title: newsItem.title,
          summary: newsItem.summary,
          url: newsItem.url || "",
          source: newsItem.source,
          category: newsItem.category,
          saved_at: new Date().toISOString()
        });
        setSavedNewsIds(prev => new Set([...prev, newsItem.url]));
        toast.success("Notícia salva");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar notícia");
    }
  };

  return (
    <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 p-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between mb-4 w-full"
      >
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Notícias do mercado</h4>
          <Sparkles className="h-3 w-3 text-violet-500" />
        </div>
        <TrendingUp className={`h-4 w-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <>
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, idx) => (
                <div key={idx}>
                  <Skeleton className="h-3 w-full mb-1" />
                  <Skeleton className="h-2 w-16" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-end mb-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="h-6 w-6"
                >
                  <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>

      {preferences && (
        <div className="mb-3 p-2 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
          <p className="text-xs text-violet-600 dark:text-violet-400">
            ✨ Personalizado para: {preferences.topics_of_interest?.slice(0, 2).join(", ")}
          </p>
        </div>
      )}

      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {news.length > 0 ? (
          news.map((item, idx) => {
            const isSaved = savedNewsIds.has(item.url);
            return (
              <div key={idx} className="group pb-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h5 className="text-xs font-medium text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 line-clamp-2 flex-1">
                    {item.title}
                  </h5>
                  <button
                    onClick={() => handleSaveNews(item)}
                    className="flex-shrink-0 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                  >
                    {isSaved ? (
                      <BookmarkCheck className="h-3 w-3 text-violet-600" />
                    ) : (
                      <Bookmark className="h-3 w-3 text-gray-400" />
                    )}
                  </button>
                </div>
                
                {item.summary && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                    {item.summary}
                  </p>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{item.source}</span>
                    <span>•</span>
                    <span>{item.time}</span>
                  </div>
                  {item.url && item.url !== "" && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 hover:underline"
                    >
                      Ler
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-xs text-gray-500 text-center py-4">
            Nenhuma notícia encontrada
          </p>
        )}
      </div>

              {!preferences && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
                  <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                    Configure suas preferências para notícias personalizadas
                  </p>
                </div>
              )}
            </>
          )}
        </>
      )}
    </Card>
  );
}