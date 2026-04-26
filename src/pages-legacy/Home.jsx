import { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  BarChart3, 
  GraduationCap, 
  Users, 
  Crown,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Wallet,
  BookOpen,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import QuickAccessCard from "@/components/home/QuickAccessCard";
import CommunityPostHighlight from "@/components/home/CommunityPostHighlight";

export default function Home() {
  const [user, setUser] = useState(null);
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartY = useRef(0);

  const handleTouchStart = useCallback((e) => {
    if (window.scrollY === 0) touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!touchStartY.current) return;
    const dist = e.touches[0].clientY - touchStartY.current;
    if (dist > 0 && dist < 90) setPullDistance(dist);
  }, []);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance > 65 && !refreshing) {
      setRefreshing(true);
      await loadData();
      setRefreshing(false);
    }
    setPullDistance(0);
    touchStartY.current = 0;
  }, [pullDistance, refreshing]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      
      // Buscar posts e filtrar por tag #noticias
      const allPosts = await base44.entities.CommunityPost.list("-created_date", 30);
      const newsPosts = allPosts.filter(post => 
        post.tags && post.tags.includes("noticias")
      );
      
      setContents(newsPosts.slice(0, 6));
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const firstName = user?.full_name?.split(" ")[0] || "Investidor";

  return (
    <div
      className="min-h-screen bg-gray-950"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      {(pullDistance > 10 || refreshing) && (
        <div
          className="flex items-center justify-center overflow-hidden transition-all duration-200 bg-gray-950"
          style={{ height: refreshing ? 48 : pullDistance * 0.6 }}
        >
          <div className={`h-5 w-5 rounded-full border-2 border-violet-400 border-t-transparent ${refreshing ? 'animate-spin' : ''}`} />
        </div>
      )}
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-gray-900 via-violet-950/30 to-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-violet-400">
                <Sparkles className="h-5 w-5" />
                <span className="text-sm font-medium">Aurum Investimentos</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                {getGreeting()}, {firstName}
              </h1>
              <p className="text-lg text-gray-300 max-w-xl">
                Transforme conhecimento em patrimônio. Análises exclusivas, cursos completos e uma comunidade de investidores.
              </p>
              {!user?.is_premium && (
                <Link to={createPageUrl("Premium")}>
                  <Button className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-semibold px-6 py-5 rounded-xl shadow-lg shadow-violet-500/30 group">
                    <Crown className="h-5 w-5 mr-2" />
                    Seja Premium
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              )}
            </div>
            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-purple-500/20 blur-3xl rounded-full" />
                <div className="relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-violet-500/20">
                  <div className="flex items-center gap-3 mb-4">
                    <TrendingUp className="h-6 w-6 text-emerald-400" />
                    <span className="text-lg font-semibold">Mercado Hoje</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">IBOV</span>
                      <span className="text-green-400 font-medium">+1.24%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">S&P 500</span>
                      <span className="text-green-400 font-medium">+0.87%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Dólar</span>
                      <span className="text-red-400 font-medium">-0.32%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Quick Access */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Acesso Rápido</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickAccessCard 
              icon={Wallet}
              title="Minhas Finanças"
              description="Controle completo"
              page="Dashboard"
              gradient="bg-gradient-to-br from-blue-600 to-blue-700"
            />
            <QuickAccessCard 
              icon={TrendingUp}
              title="Minha Carteira"
              description="Acompanhe ativos"
              page="Portfolio"
              gradient="bg-gradient-to-br from-violet-600 to-violet-700"
            />
            <QuickAccessCard 
              icon={BookOpen}
              title="Aprender"
              description="Cursos e conteúdos"
              page="Courses"
              gradient="bg-gradient-to-br from-purple-600 to-purple-700"
            />
            <QuickAccessCard 
              icon={Users}
              title="Comunidade"
              description="Conecte-se"
              page="Community"
              gradient="bg-gradient-to-br from-emerald-600 to-emerald-700"
            />
          </div>
        </section>

        {/* Sobre a Aurum */}
        <section className="mb-12">
          <Link to={createPageUrl("About")} className="block group">
            <div className="bg-gradient-to-r from-amber-500/10 via-gray-900 to-violet-500/10 border border-gray-800 hover:border-amber-500/50 rounded-2xl p-8 transition-all">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="shrink-0">
                  <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6962dc8bf4f8f8a96c5dc36b/e3135d805_WhatsAppImage2026-01-30at190245.jpg" 
                    alt="Aurum Logo" 
                    className="h-20 w-20 object-contain group-hover:scale-110 transition-transform"
                    style={{ mixBlendMode: 'lighten' }}
                  />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl font-bold text-white mb-2">Conheça a Aurum</h3>
                  <p className="text-gray-400">
                    Descubra nossa história, missão e valores. Saiba por que somos a melhor escolha para sua jornada de investimentos.
                  </p>
                </div>
                <ArrowRight className="h-6 w-6 text-amber-400 group-hover:translate-x-2 transition-transform shrink-0" />
              </div>
            </div>
          </Link>
        </section>

        {/* Latest Content */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Notícias</h2>
            <Link to={createPageUrl("Community")} className="text-violet-400 hover:text-violet-300 text-sm font-medium flex items-center gap-1 group">
              Ver todos
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800">
                  <Skeleton className="h-48 w-full bg-gray-800" />
                  <div className="p-5 space-y-3">
                    <Skeleton className="h-5 w-3/4 bg-gray-800" />
                    <Skeleton className="h-4 w-full bg-gray-800" />
                    <Skeleton className="h-4 w-1/2 bg-gray-800" />
                  </div>
                </div>
              ))}
            </div>
          ) : contents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {contents.slice(0, 6).map((post) => (
                <CommunityPostHighlight key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-12 text-center">
              <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Nenhuma notícia ainda</h3>
              <p className="text-gray-400">As notícias da comunidade aparecerão aqui em breve.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}