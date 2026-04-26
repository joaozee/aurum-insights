import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  ArrowLeft, 
  Eye, 
  Clock, 
  Heart, 
  Share2, 
  Crown,
  Lock,
  FileText,
  PlayCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { trackContentView } from "@/components/recommendations/trackContentView";
import { Card } from "@/components/ui/card";

export default function ContentDetail() {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [liked, setLiked] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const contentId = urlParams.get("id");

  useEffect(() => {
    if (contentId) {
      loadData();
    }
  }, [contentId]);

  const loadData = async () => {
    try {
      const [contentData, userData] = await Promise.all([
        base44.entities.Content.filter({ id: contentId }),
        base44.auth.me()
      ]);
      if (contentData.length > 0) {
        setContent(contentData[0]);
        // Increment views
        await base44.entities.Content.update(contentId, { 
          views: (contentData[0].views || 0) + 1 
        });
        // Track view
        if (userData) {
          trackContentView(
            userData.email,
            "content",
            contentData[0].id,
            contentData[0].title,
            contentData[0].category
          );
        }
      }
      setUser(userData);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!content) return;
    setLiked(!liked);
    await base44.entities.Content.update(content.id, { 
      likes: (content.likes || 0) + (liked ? -1 : 1) 
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: content?.title,
        url: window.location.href
      });
    }
  };

  const isLocked = content?.is_premium && !user?.is_premium;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-8 w-32 mb-8 bg-gray-800" />
          <Skeleton className="h-80 w-full rounded-2xl mb-8 bg-gray-800" />
          <Skeleton className="h-10 w-3/4 mb-4 bg-gray-800" />
          <Skeleton className="h-6 w-full mb-2 bg-gray-800" />
          <Skeleton className="h-6 w-2/3 bg-gray-800" />
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Conteúdo não encontrado</h2>
          <Link to={createPageUrl("Courses")}>
            <Button className="bg-violet-600 hover:bg-violet-700 text-white mt-4">Voltar para Cursos</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <Link to={createPageUrl("Courses")} className="inline-flex items-center gap-2 text-gray-400 hover:text-violet-400 mb-8 group transition-colors">
          <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          <span>Voltar aos Cursos</span>
        </Link>

        {/* Hero Image */}
        <div className="relative rounded-2xl overflow-hidden mb-8">
          <img 
            src={content.thumbnail_url || "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200"}
            alt={content.title}
            className="w-full h-64 sm:h-80 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        </div>

        {/* Content Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">{content.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-gray-400 text-sm">
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-violet-400" />
              {content.created_date ? format(new Date(content.created_date), "dd 'de' MMMM", { locale: ptBR }) : "Hoje"}
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="h-4 w-4 text-violet-400" />
              {content.views || 0} visualizações
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="mb-8">
          <Button 
            onClick={handleLike}
            className={`${liked ? "bg-violet-600 hover:bg-violet-700" : "bg-gray-800 hover:bg-gray-700"} text-white transition-colors`}
          >
            <Heart className={`h-4 w-4 mr-2 ${liked ? "fill-white" : ""}`} />
            {liked ? "Curtido" : "Curtir"}
          </Button>
        </div>

        {/* Content Body */}
        {isLocked ? (
          <Card className="bg-gray-900 border-gray-800 p-12 text-center">
            <div className="h-20 w-20 rounded-full bg-violet-500/20 flex items-center justify-center mx-auto mb-6 border border-violet-500/30">
              <Lock className="h-10 w-10 text-violet-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Conteúdo Exclusivo Premium</h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Este conteúdo faz parte do acervo exclusivo para assinantes Premium. 
              Desbloqueie acesso ilimitado a análises, cursos e muito mais.
            </p>
            <Link to={createPageUrl("Premium")}>
              <Button className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold px-8 py-6 rounded-xl">
                <Crown className="h-5 w-5 mr-2" />
                Assinar Premium
              </Button>
            </Link>
          </Card>
        ) : (
          <Card className="bg-gray-900 border-gray-800 p-6 sm:p-10">
            {content.video_url && (
              <div className="mb-8 rounded-xl overflow-hidden bg-black">
                <video 
                  src={content.video_url} 
                  controls 
                  className="w-full"
                  poster={content.thumbnail_url}
                />
              </div>
            )}
            <div className="prose prose-invert max-w-none 
              prose-headings:text-white prose-headings:font-bold
              prose-p:text-gray-300 prose-a:text-violet-400 
              prose-a:no-underline hover:prose-a:underline
              prose-strong:text-white prose-code:text-violet-300">
              <ReactMarkdown>{content.body || content.description}</ReactMarkdown>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}