import { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Heart,
  MessageSquare,
  MoreHorizontal,
  Trash2,
  Lock,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PremiumBadge from "@/components/ui/PremiumBadge";
import HighlightedText from "./HighlightedText";
import ReactionPicker from "./ReactionPicker";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function PostSearchResult({
  post,
  currentUserEmail,
  searchQuery,
  isOwner,
  onDelete,
  onReact,
  onComment,
}) {
  const isLocked = post.is_premium_only && currentUserEmail !== post.created_by;
  const isLiked = post.liked_by?.includes(currentUserEmail);
  const [isCommentingOn, setIsCommentingOn] = useState(false);

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-violet-950/30 rounded-2xl border border-gray-800 p-6 transition-all hover:border-violet-500/30">
      {isLocked ? (
        <div className="text-center py-8">
          <div className="h-12 w-12 rounded-full bg-violet-500/20 flex items-center justify-center mx-auto mb-4">
            <Lock className="h-6 w-6 text-violet-400" />
          </div>
          <h3 className="font-semibold text-white mb-2">Conteúdo Premium</h3>
          <p className="text-gray-400 text-sm">
            Este post é exclusivo para assinantes
          </p>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <Link to={`${createPageUrl("PublicProfile")}?email=${post.created_by}`}>
                <Avatar className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-violet-500 transition-all">
                  <AvatarFallback className="bg-gradient-to-br from-violet-500/20 to-purple-500/20 text-violet-400">
                    {post.author_name?.[0] || "A"}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <Link to={`${createPageUrl("PublicProfile")}?email=${post.created_by}`}>
                    <span className="font-medium text-white hover:text-violet-400 transition-colors cursor-pointer">
                      {post.author_name || "Anônimo"}
                    </span>
                  </Link>
                  {post.is_premium_only && <PremiumBadge size="xs" />}
                </div>
                <span className="text-sm text-gray-400">
                  {post.created_date &&
                    formatDistanceToNow(new Date(post.created_date), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                </span>
              </div>
            </div>
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-white"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800">
                  <DropdownMenuItem
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    onClick={() => onDelete(post.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Content with Highlighted Search Terms */}
          <p className="text-gray-300 whitespace-pre-wrap mb-4">
            <HighlightedText text={post.content} query={searchQuery} />
          </p>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-violet-500/20 text-violet-300 px-2 py-1 rounded text-xs"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 pt-4 border-t border-gray-800">
            <div className="flex items-center gap-2">
              {post.liked_by?.length > 0 && (
                <span className="text-sm text-gray-400">
                  ❤️ {post.liked_by.length}
                </span>
              )}
            </div>

            <ReactionPicker onReact={(type) => onReact(post, type)} />

            <button
              onClick={() => setIsCommentingOn(!isCommentingOn)}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-violet-400 transition-colors"
            >
              <MessageSquare className="h-5 w-5" />
              <span>{post.comments?.length || 0}</span>
            </button>

            <Link to={`${createPageUrl("PublicProfile")}?email=${post.created_by}`}>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-violet-400"
              >
                <User className="h-4 w-4 mr-1" />
                Ver Perfil
              </Button>
            </Link>
          </div>

          {/* Comments */}
          {post.comments && post.comments.length > 0 && (
            <div className="mt-4 space-y-3 border-t border-gray-800 pt-4">
              {post.comments.slice(0, 2).map((comment, idx) => (
                <div key={idx} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-violet-500/10 text-violet-400 text-xs">
                      {comment.author_name?.[0] || "A"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 bg-gray-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-200">
                        {comment.author_name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(comment.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300">
                      <HighlightedText text={comment.content} query={searchQuery} />
                    </p>
                  </div>
                </div>
              ))}
              {post.comments.length > 2 && (
                <p className="text-xs text-gray-500 px-2">
                  +{post.comments.length - 2} comentário(s)
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}