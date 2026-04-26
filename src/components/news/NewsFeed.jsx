import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Newspaper, 
  TrendingUp, 
  Search, 
  Settings2,
  ExternalLink,
  Clock,
  Sparkles,
  Filter,
  Star,
  StarOff
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import NewsPreferencesDialog from "./NewsPreferencesDialog";

const TOPIC_COLORS = {
  acoes: "bg-blue-500/20 text-blue-400",
  fiis: "bg-purple-500/20 text-purple-400",
  commodities: "bg-amber-500/20 text-amber-400",
  tecnologia: "bg-cyan-500/20 text-cyan-400",
  macroeconomia: "bg-emerald-500/20 text-emerald-400",
  criptomoedas: "bg-orange-500/20 text-orange-400",
  renda_fixa: "bg-green-500/20 text-green-400",
  internacional: "bg-indigo-500/20 text-indigo-400",
  dividendos: "bg-pink-500/20 text-pink-400",
  ipos: "bg-violet-500/20 text-violet-400"
};

export default function NewsFeed({ userEmail, compact = false }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState(null);
  const [assets, setAssets] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [showOnlyRelevant, setShowOnlyRelevant] = useState(true);

  useEffect(() => {
    if (userEmail) {
      loadData();
    }
  }, [userEmail]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar preferências
      const prefsData = await base44.entities.NewsPreferences.filter({ user_email: userEmail });
      let userPrefs = prefsData.length > 0 ? prefsData[0] : null;
      
      // Carregar ativos do portfólio
      const assetsData = await base44.entities.Asset.filter({ user_email: userEmail });
      setAssets(assetsData || []);
      
      // Se preferências habilitam auto-follow, adicionar tickers do portfólio
      if (userPrefs?.auto_follow_portfolio && assetsData.length > 0) {
        const portfolioTickers = [...new Set(assetsData.map(a => a.name))];
        const updatedFollowed = [...new Set([...(userPrefs.followed_tickers || []), ...portfolioTickers])];
        
        if (JSON.stringify(updatedFollowed) !== JSON.stringify(userPrefs.followed_tickers)) {
          await base44.entities.NewsPreferences.update(userPrefs.id, {
            followed_tickers: updatedFollowed
          });
          userPrefs = { ...userPrefs, followed_tickers: updatedFollowed };
        }
      }
      
      setPreferences(userPrefs);
      
      // Buscar notícias (simuladas - em produção viria da API)
      await loadNews(userPrefs);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar notícias");
    } finally {
      setLoading(false);
    }
  };

  const loadNews = async (prefs) => {
    // Simulação de notícias - em produção, fazer chamada à API de notícias
    const mockNews = [
      {
        id: "1",
        title: "Petrobras anuncia dividendos extraordinários de R$ 2,5 por ação",
        summary: "A estatal divulgou o pagamento de dividendos extraordinários após lucro recorde no trimestre. Ação subiu 4% após anúncio.",
        source: "InfoMoney",
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        url: "https://www.infomoney.com.br",
        tickers: ["PETR4", "PETR3"],
        topics: ["acoes", "dividendos"],
        relevanceScore: 95
      },
      {
        id: "2",
        title: "Banco Central mantém Selic em 10,5% ao ano",
        summary: "Copom decide manter taxa básica de juros inalterada, mas sinaliza possível alta em próximas reuniões devido à inflação.",
        source: "Valor Econômico",
        publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
        url: "https://www.valor.com.br",
        tickers: [],
        topics: ["macroeconomia", "renda_fixa"],
        relevanceScore: 88
      },
      {
        id: "3",
        title: "Vale registra produção recorde de minério de ferro",
        summary: "Mineradora reporta produção de 320 milhões de toneladas no trimestre, superando expectativas do mercado.",
        source: "Bloomberg",
        publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
        url: "https://www.bloomberg.com",
        tickers: ["VALE3"],
        topics: ["acoes", "commodities"],
        relevanceScore: 82
      },
      {
        id: "4",
        title: "Magazine Luiza lança plataforma de marketplace B2B",
        summary: "Varejista investe em tecnologia para conectar fornecedores a lojistas em nova frente de crescimento digital.",
        source: "InfoMoney",
        publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
        url: "https://www.infomoney.com.br",
        tickers: ["MGLU3"],
        topics: ["acoes", "tecnologia"],
        relevanceScore: 75
      },
      {
        id: "5",
        title: "Dólar fecha em alta com tensões geopolíticas",
        summary: "Moeda americana sobe 1,2% pressionada por incertezas no cenário internacional e fluxo de capital.",
        source: "Reuters",
        publishedAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
        url: "https://www.reuters.com",
        tickers: [],
        topics: ["macroeconomia", "internacional"],
        relevanceScore: 70
      },
      {
        id: "6",
        title: "Itaú Unibanco supera projeções com lucro de R$ 9,1 bi",
        summary: "Maior banco privado do país apresenta resultados acima do esperado, impulsionado por crédito e serviços.",
        source: "Valor Econômico",
        publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        url: "https://www.valor.com.br",
        tickers: ["ITUB4"],
        topics: ["acoes"],
        relevanceScore: 85
      }
    ];

    // Calcular relevância baseada nas preferências
    const scoredNews = mockNews.map(item => {
      let score = item.relevanceScore;
      
      // Boost se ticker está sendo seguido
      if (prefs?.followed_tickers?.some(t => item.tickers.includes(t))) {
        score += 20;
      }
      
      // Boost se tópico é de interesse
      if (prefs?.topics_of_interest?.some(t => item.topics.includes(t))) {
        score += 15;
      }
      
      // Boost se fonte é confiável
      if (prefs?.trusted_sources?.includes(item.source)) {
        score += 10;
      }
      
      return { ...item, relevanceScore: Math.min(score, 100) };
    });

    // Ordenar por relevância
    scoredNews.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    setNews(scoredNews);
  };

  const toggleFollowTicker = async (ticker) => {
    if (!preferences) return;
    
    const followed = preferences.followed_tickers || [];
    const newFollowed = followed.includes(ticker)
      ? followed.filter(t => t !== ticker)
      : [...followed, ticker];
    
    try {
      await base44.entities.NewsPreferences.update(preferences.id, {
        followed_tickers: newFollowed
      });
      setPreferences({ ...preferences, followed_tickers: newFollowed });
      loadNews({ ...preferences, followed_tickers: newFollowed });
      toast.success(followed.includes(ticker) ? "Ticker removido" : "Ticker adicionado");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao atualizar preferências");
    }
  };

  const filteredNews = news.filter(item => {
    // Filtro de busca
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase()) 
        && !item.summary.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Filtro de tópico
    if (selectedTopic !== "all" && !item.topics.includes(selectedTopic)) {
      return false;
    }
    
    // Mostrar apenas relevantes (score > 70)
    if (showOnlyRelevant && item.relevanceScore < 70) {
      return false;
    }
    
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(compact ? 3 : 5)].map((_, i) => (
          <Skeleton key={i} className="h-32 bg-gray-800" />
        ))}
      </div>
    );
  }

  const displayNews = compact ? filteredNews.slice(0, 5) : filteredNews;

  return (
    <div className="space-y-4">
      {/* Header */}
      {!compact && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <Newspaper className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Notícias Financeiras</h3>
              <p className="text-sm text-gray-400">Personalizadas para você</p>
            </div>
          </div>
          <NewsPreferencesDialog 
            userEmail={userEmail}
            preferences={preferences}
            onUpdate={loadData}
          />
        </div>
      )}

      {/* Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar notícias..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-800 border-gray-700 text-white"
          />
        </div>

        <div className="flex gap-2 items-center overflow-x-auto pb-2">
          <Button
            variant={showOnlyRelevant ? "default" : "outline"}
            size="sm"
            onClick={() => setShowOnlyRelevant(!showOnlyRelevant)}
            className={cn(
              "whitespace-nowrap",
              showOnlyRelevant && "bg-violet-600 hover:bg-violet-700"
            )}
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Relevantes
          </Button>

          <div className="h-6 w-px bg-gray-700" />

          <button
            onClick={() => setSelectedTopic("all")}
            className={cn(
              "px-3 py-1 rounded-lg text-sm font-medium whitespace-nowrap",
              selectedTopic === "all" 
                ? "bg-violet-500 text-white" 
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            )}
          >
            Todas
          </button>

          {Object.keys(TOPIC_COLORS).map(topic => (
            <button
              key={topic}
              onClick={() => setSelectedTopic(topic)}
              className={cn(
                "px-3 py-1 rounded-lg text-sm font-medium whitespace-nowrap capitalize",
                selectedTopic === topic 
                  ? "bg-violet-500 text-white" 
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              )}
            >
              {topic.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* News List */}
      {displayNews.length > 0 ? (
        <div className="space-y-3">
          {displayNews.map((item) => (
            <Card key={item.id} className="bg-gray-800/50 border-gray-700 p-4 hover:bg-gray-800 transition-all">
              <div className="flex gap-4">
                {/* Relevance Score */}
                <div className="flex-shrink-0">
                  <div className={cn(
                    "h-12 w-12 rounded-lg flex items-center justify-center font-bold text-lg",
                    item.relevanceScore >= 90 ? "bg-emerald-500/20 text-emerald-400" :
                    item.relevanceScore >= 80 ? "bg-blue-500/20 text-blue-400" :
                    item.relevanceScore >= 70 ? "bg-amber-500/20 text-amber-400" :
                    "bg-gray-500/20 text-gray-400"
                  )}>
                    {item.relevanceScore}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-white font-semibold text-sm leading-tight">
                      {item.title}
                    </h4>
                    {item.relevanceScore >= 85 && (
                      <Sparkles className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                    )}
                  </div>

                  {/* Summary */}
                  <p className="text-gray-400 text-xs mb-3 line-clamp-2">
                    {item.summary}
                  </p>

                  {/* Tickers */}
                  {item.tickers.length > 0 && (
                    <div className="flex gap-1.5 mb-2 flex-wrap">
                      {item.tickers.map(ticker => (
                        <button
                          key={ticker}
                          onClick={() => toggleFollowTicker(ticker)}
                          className={cn(
                            "px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 transition-all",
                            preferences?.followed_tickers?.includes(ticker)
                              ? "bg-violet-500/20 text-violet-400 ring-1 ring-violet-500/50"
                              : "bg-gray-700/50 text-gray-300 hover:bg-gray-700"
                          )}
                        >
                          {preferences?.followed_tickers?.includes(ticker) ? (
                            <Star className="h-3 w-3 fill-current" />
                          ) : (
                            <StarOff className="h-3 w-3" />
                          )}
                          {ticker}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Topics & Meta */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex gap-1.5 flex-wrap">
                      {item.topics.slice(0, 2).map(topic => (
                        <Badge key={topic} className={cn("text-xs", TOPIC_COLORS[topic])}>
                          {topic}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{item.source}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(item.publishedAt, { addSuffix: true, locale: ptBR })}
                      </span>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-violet-400 hover:text-violet-300 flex items-center gap-1"
                      >
                        Ler
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Newspaper className="h-12 w-12 text-gray-600 mx-auto mb-3 opacity-50" />
          <p className="text-gray-400 text-sm">
            {searchQuery ? "Nenhuma notícia encontrada" : "Configure suas preferências para ver notícias relevantes"}
          </p>
        </div>
      )}
    </div>
  );
}