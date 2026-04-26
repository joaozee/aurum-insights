import { useState } from "react";
import { Video, FileText, Clock, TrendingUp, Play, BookText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";

export default function ArticlesSection({ articles }) {
  const [selectedArticle, setSelectedArticle] = useState(null);

  const getCategoryColor = (category) => {
    const colors = {
      basico: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      intermediario: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      avancado: "bg-red-500/10 text-red-400 border-red-500/20"
    };
    return colors[category] || colors.basico;
  };

  const getTopicIcon = (topic) => {
    const icons = {
      risco: TrendingUp,
      diversificacao: TrendingUp,
      ativos: FileText,
      analise: FileText,
      rebalanceamento: TrendingUp,
      relatorios: FileText,
      geral: BookText
    };
    return icons[topic] || FileText;
  };

  if (articles.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
        <Video className="h-16 w-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Nenhum Conteúdo Disponível</h3>
        <p className="text-gray-400">Artigos e vídeos serão adicionados em breve</p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {articles.map(article => {
        const TopicIcon = getTopicIcon(article.topic);
        const isVideo = article.type === "video";

        return (
          <Dialog key={article.id}>
            <DialogTrigger asChild>
              <div 
                onClick={() => setSelectedArticle(article)}
                className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border border-gray-800 rounded-2xl overflow-hidden hover:border-violet-500/30 cursor-pointer transition-all hover:shadow-xl hover:shadow-violet-500/10 group"
              >
                {/* Thumbnail */}
                <div className="relative h-48 bg-gradient-to-br from-violet-600/20 to-purple-600/20 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
                  <div className="relative z-10">
                    {isVideo ? (
                      <div className="h-16 w-16 rounded-full bg-violet-500/20 backdrop-blur-sm flex items-center justify-center border border-violet-500/30 group-hover:scale-110 transition-transform">
                        <Play className="h-8 w-8 text-violet-400" />
                      </div>
                    ) : (
                      <TopicIcon className="h-12 w-12 text-violet-400/60" />
                    )}
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge className={getCategoryColor(article.category)}>
                      {article.category}
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    {isVideo ? (
                      <Video className="h-4 w-4 text-violet-400" />
                    ) : (
                      <FileText className="h-4 w-4 text-violet-400" />
                    )}
                    <span className="text-violet-400 text-xs font-medium uppercase">
                      {article.topic.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="text-white font-semibold text-lg mb-2 line-clamp-2 group-hover:text-violet-400 transition-colors">
                    {article.title}
                  </h3>

                  {article.short_description && (
                    <p className="text-gray-400 text-sm line-clamp-2 mb-3">
                      {article.short_description}
                    </p>
                  )}

                  {article.duration_minutes && (
                    <div className="flex items-center gap-1 text-gray-500 text-xs">
                      <Clock className="h-3 w-3" />
                      {article.duration_minutes} min
                    </div>
                  )}
                </div>
              </div>
            </DialogTrigger>

            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-gray-900 border-gray-700 text-white">
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={getCategoryColor(article.category)}>
                    {article.category}
                  </Badge>
                  <Badge variant="outline" className="border-gray-700 text-gray-400">
                    {article.topic.replace('_', ' ')}
                  </Badge>
                </div>
                <DialogTitle className="text-2xl text-white">{article.title}</DialogTitle>
              </DialogHeader>

              <div className="mt-4">
                {article.video_url && (
                  <div className="mb-6 rounded-xl overflow-hidden bg-black aspect-video">
                    <iframe
                      width="100%"
                      height="100%"
                      src={article.video_url}
                      title={article.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  </div>
                )}

                {article.content && (
                  <ReactMarkdown className="prose prose-invert max-w-none text-gray-300">
                    {article.content}
                  </ReactMarkdown>
                )}
              </div>
            </DialogContent>
          </Dialog>
        );
      })}
    </div>
  );
}