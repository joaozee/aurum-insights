import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Search, 
  Filter, 
  BarChart3, 
  TrendingUp, 
  Play, 
  FileText,
  Crown,
  Eye,
  Clock,
  ArrowRight
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/shared/PageHeader";
import PremiumBadge from "@/components/ui/PremiumBadge";
import EmptyState from "@/components/shared/EmptyState";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Contents() {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [contentData, userData] = await Promise.all([
        base44.entities.Content.list("-created_date"),
        base44.auth.me()
      ]);
      setContents(contentData);
      setUser(userData);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const typeIcons = {
    analise: BarChart3,
    dividendos: TrendingUp,
    video: Play,
    artigo: FileText
  };

  const typeLabels = {
    analise: "Análise",
    dividendos: "Dividendos",
    video: "Vídeo",
    artigo: "Artigo"
  };

  const categoryLabels = {
    acoes: "Ações",
    fiis: "FIIs",
    dividendos: "Dividendos",
    macroeconomia: "Macroeconomia",
    educacional: "Educacional"
  };

  const filteredContents = contents.filter(content => {
    const matchesSearch = content.title?.toLowerCase().includes(search.toLowerCase()) ||
                         content.description?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || 
                         (filter === "premium" && content.is_premium) ||
                         (filter === "free" && !content.is_premium);
    const matchesType = typeFilter === "all" || content.type === typeFilter;
    return matchesSearch && matchesFilter && matchesType;
  });

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader 
          title="Conteúdos"
          subtitle="Análises, insights e conhecimento para seus investimentos"
        />

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input 
                placeholder="Buscar conteúdos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 border-gray-200 focus:border-amber-500 focus:ring-amber-500"
              />
            </div>
            <div className="flex gap-3 flex-wrap">
              <Tabs value={filter} onValueChange={setFilter}>
                <TabsList className="bg-gray-100">
                  <TabsTrigger value="all">Todos</TabsTrigger>
                  <TabsTrigger value="free">Gratuitos</TabsTrigger>
                  <TabsTrigger value="premium" className="flex items-center gap-1">
                    <Crown className="h-3.5 w-3.5" />
                    Premium
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <Tabs value={typeFilter} onValueChange={setTypeFilter}>
                <TabsList className="bg-gray-100">
                  <TabsTrigger value="all">Tipo</TabsTrigger>
                  <TabsTrigger value="analise">Análises</TabsTrigger>
                  <TabsTrigger value="dividendos">Dividendos</TabsTrigger>
                  <TabsTrigger value="video">Vídeos</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
                <Skeleton className="h-48 w-full" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredContents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContents.map((content) => {
              const TypeIcon = typeIcons[content.type] || FileText;
              const isLocked = content.is_premium && !user?.is_premium;
              
              return (
                <Link 
                  key={content.id} 
                  to={createPageUrl(`ContentDetail?id=${content.id}`)}
                >
                  <div className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 h-full">
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={content.thumbnail_url || "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600"}
                        alt={content.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      {content.is_premium && (
                        <div className="absolute top-3 right-3">
                          <PremiumBadge size="xs" />
                        </div>
                      )}
                      <div className="absolute bottom-3 left-3 flex items-center gap-2">
                        <span className="px-2 py-1 bg-white/90 rounded-full text-xs font-medium text-gray-800 flex items-center gap-1">
                          <TypeIcon className="h-3 w-3" />
                          {typeLabels[content.type] || content.type}
                        </span>
                        {content.category && (
                          <span className="px-2 py-1 bg-black/50 text-white rounded-full text-xs">
                            {categoryLabels[content.category] || content.category}
                          </span>
                        )}
                      </div>
                      {isLocked && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="text-center text-white">
                            <Crown className="h-8 w-8 mx-auto mb-2 text-amber-400" />
                            <span className="text-sm font-medium">Conteúdo Premium</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-amber-600 transition-colors">
                        {content.title}
                      </h3>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                        {content.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-400">
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
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform text-amber-500" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <EmptyState 
            icon={BarChart3}
            title="Nenhum conteúdo encontrado"
            description="Tente ajustar os filtros ou buscar por outros termos"
          />
        )}
      </div>
    </div>
  );
}