import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MessageCircle, Heart, Share2, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function CommunityPostHighlight({ post }) {
  const getPostImage = () => {
    if (post.images && post.images.length > 0) {
      return post.images[0];
    }
    if (post.news_thumbnail) {
      return post.news_thumbnail;
    }
    return null;
  };

  const image = getPostImage();

  return (
    <Link to={createPageUrl("Community")}>
      <div className="group relative bg-gray-900 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-300 border border-gray-800 hover:border-violet-500/30">
        {image && (
          <div className="relative h-48 overflow-hidden">
            <img 
              src={image}
              alt="Post"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/20 to-transparent" />
          </div>
        )}
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
              {post.author_name?.[0] || "U"}
            </div>
            <div>
              <p className="text-sm font-medium text-white">{post.author_name || "Usuário"}</p>
              <p className="text-xs text-gray-500">
                {post.created_date ? format(new Date(post.created_date), "dd MMM", { locale: ptBR }) : "Hoje"}
              </p>
            </div>
          </div>
          
          <p className="text-sm text-gray-300 line-clamp-3 mb-4">
            {post.content}
          </p>
          
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" />
              {post.likes_count || 0}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" />
              {post.comments?.length || 0}
            </span>
            <span className="flex items-center gap-1">
              <Share2 className="h-3.5 w-3.5" />
              {post.shares_count || 0}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}