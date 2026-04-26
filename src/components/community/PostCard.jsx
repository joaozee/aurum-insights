import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  MoreHorizontal,
  Trash2,
  Crown,
  ExternalLink,
  Bookmark,
  Send,
  Repeat2
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import PremiumBadge from "@/components/ui/PremiumBadge";
import CommentDialog from "@/components/community/CommentDialog";
import PostRecommendationDialog from "@/components/community/PostRecommendationDialog";
import SharePostDialog from "@/components/community/SharePostDialog";

export default function PostCard({ 
  post, 
  currentUserEmail, 
  onLike, 
  onComment, 
  onDelete,
  onShare,
  hideHeader = false,
  currentUser = null,
  onRefresh = null
}) {
  const [showComments, setShowComments] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [showRecommendDialog, setShowRecommendDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const isLiked = post.liked_by?.includes(currentUserEmail);
  const isOwner = post.author_email === currentUserEmail || post.created_by === currentUserEmail;

  // Parse repost data (recursivo para reposts de reposts)
  const isRepost = post.content?.startsWith("[REPOST]");
  let repostData = null;
  let repostComment = "";
  let displayContent = post.content;
  if (isRepost) {
    try {
      repostData = JSON.parse(post.content.slice(8));
      repostComment = repostData.comment || "";
      displayContent = repostComment;

      // Se o conteúdo do post original também é um repost, extrair o conteúdo real
      if (repostData.content?.startsWith("[REPOST]")) {
        try {
          const innerRepost = JSON.parse(repostData.content.slice(8));
          repostData = {
            ...innerRepost,
            author_name: repostData.author_name,
            author_email: repostData.author_email,
            author_avatar: repostData.author_avatar,
            created_date: repostData.created_date,
          };
        } catch(e) { /* mantém repostData original */ }
      }
    } catch(e) { repostData = null; }
  }

  const contentLineCount = displayContent?.split('\n').length || 0;
  const contentLength = displayContent?.length || 0;
  const isLongContent = contentLength > 280 || contentLineCount > 5;

  useEffect(() => {
    checkIfSaved();
    checkIfFollowing();
  }, [currentUserEmail, post.id, post.author_email]);

  const checkIfSaved = async () => {
    if (!currentUserEmail) return;
    try {
      const saved = await base44.entities.SavedPost.filter({
        user_email: currentUserEmail,
        post_id: post.id
      });
      setIsSaved(saved.length > 0);
    } catch (error) {
      console.error(error);
    }
  };

  const checkIfFollowing = async () => {
    if (!currentUserEmail || !post.author_email) return;
    try {
      const follow = await base44.entities.UserFollow.filter({
        follower_email: currentUserEmail,
        following_email: post.author_email
      });
      setIsFollowing(follow.length > 0);
    } catch (error) {
      console.error(error);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUserEmail || !post.author_email || isOwner) return;
    
    try {
      if (isFollowing) {
        const follow = await base44.entities.UserFollow.filter({
          follower_email: currentUserEmail,
          following_email: post.author_email
        });
        if (follow.length > 0) {
          await base44.entities.UserFollow.delete(follow[0].id);
          setIsFollowing(false);
          toast.success("Deixou de seguir");
        }
      } else {
        await base44.entities.UserFollow.create({
          follower_email: currentUserEmail,
          following_email: post.author_email
        });
        setIsFollowing(true);
        toast.success("Agora você está seguindo");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao seguir usuário");
    }
  };

  const handleSaveToggle = async () => {
    if (!currentUserEmail) return;
    
    try {
      if (isSaved) {
        const saved = await base44.entities.SavedPost.filter({
          user_email: currentUserEmail,
          post_id: post.id
        });
        if (saved.length > 0) {
          await base44.entities.SavedPost.delete(saved[0].id);
          setIsSaved(false);
          toast.success("Post removido dos salvos");
        }
      } else {
        await base44.entities.SavedPost.create({
          user_email: currentUserEmail,
          post_id: post.id,
          post_type: "community",
          saved_at: new Date().toISOString()
        });
        setIsSaved(true);
        toast.success("Post salvo!");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar post");
    }
  };

  return (
    <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Repost label */}
      {isRepost && (
        <div className="flex items-center gap-2 px-4 pt-3 pb-1">
          <Repeat2 className="h-3.5 w-3.5 text-gray-500" />
          <span className="text-xs text-gray-500 font-medium">{post.author_name || repostData?.author_name || "Alguém"} repostou</span>
        </div>
      )}
      {/* Header */}
      {!hideHeader && (
      <div className="p-4 flex items-center justify-between">
        <Link 
          to={createPageUrl(`PublicProfile?email=${post.author_email || post.created_by}`)}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <Avatar className="h-10 w-10">
            {post.author_avatar ? (
              <img src={post.author_avatar} alt={post.author_name} className="object-cover" />
            ) : (
              <AvatarFallback className="bg-violet-500/20 text-violet-400">
                {(post.author_name || repostData?.author_name)?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-white text-sm">{post.author_name || repostData?.author_name}</p>
              {post.is_premium_only && <PremiumBadge size="sm" />}
            </div>
            <p className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(post.created_date), { 
                addSuffix: true, 
                locale: ptBR 
              })}
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {!isOwner && (
            <Button
              onClick={handleFollowToggle}
              variant={isFollowing ? "outline" : "default"}
              size="sm"
              className={isFollowing ? "text-violet-400 border-violet-400" : "bg-violet-600 hover:bg-violet-700"}
            >
              {isFollowing ? "Deixar de seguir" : "Seguir"}
            </Button>
          )}
          {isOwner && (
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-gray-400">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-800 border-gray-700">
              <DropdownMenuItem 
                onClick={() => onDelete(post.id)}
                className="text-red-400"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          )}
        </div>
      </div>
      )}

      {/* Content */}
      <div className="px-4 pb-3">
        {displayContent && (
          <div>
            <p className={cn(
              "text-gray-900 dark:text-gray-200 whitespace-pre-wrap",
              !isExpanded && isLongContent && "line-clamp-5"
            )}>
              {displayContent}
            </p>
            {isLongContent && !isExpanded && (
              <button
                onClick={() => setIsExpanded(true)}
                className="text-violet-400 hover:text-violet-300 text-sm font-medium mt-2 transition-colors"
              >
                Ver mais
              </button>
            )}
            {isExpanded && isLongContent && (
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-gray-300 text-sm font-medium mt-2 transition-colors"
              >
                Ver menos
              </button>
            )}
          </div>
        )}
        
        {/* Quoted Repost Card */}
        {isRepost && repostData && (
          <div className="mt-3 border border-gray-700 rounded-xl overflow-hidden hover:border-gray-600 transition-colors">
            <div className="p-3 bg-gray-800/60">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-6 w-6 rounded-full bg-violet-500/30 flex items-center justify-center text-xs font-bold text-violet-300 flex-shrink-0">
                  {repostData.author_name?.[0]?.toUpperCase() || "U"}
                </div>
                <span className="font-semibold text-white text-sm">{repostData.author_name}</span>
                {repostData.created_date && (
                  <span className="text-gray-500 text-xs">
                    · {formatDistanceToNow(new Date(repostData.created_date), { addSuffix: false, locale: ptBR })}
                  </span>
                )}
              </div>
              <p className="text-gray-300 text-sm whitespace-pre-wrap line-clamp-4">{repostData.content}</p>
              {repostData.images && repostData.images.length > 0 && (
                <div className="mt-2 rounded-lg overflow-hidden">
                  <img src={repostData.images[0]} alt="repost" className="w-full max-h-48 object-cover" />
                </div>
              )}
              {repostData.tags && repostData.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {repostData.tags.map((tag, i) => (
                    <span key={i} className="text-xs text-violet-400">#{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI-Generated Tags */}
        {!isRepost && post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {post.tags.map((tag, idx) => (
              <Badge
                key={idx}
                variant="secondary"
                className="text-xs px-2 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
              >
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Images */}
      {!isRepost && post.images && post.images.length > 0 && (
        <div className={cn(
          "grid gap-1",
          post.images.length === 1 && "grid-cols-1",
          post.images.length === 2 && "grid-cols-2",
          post.images.length >= 3 && "grid-cols-2"
        )}>
          {post.images.slice(0, 4).map((url, index) => (
            <div 
              key={index}
              className={cn(
                "relative overflow-hidden bg-gray-800",
                post.images.length === 1 && "aspect-video",
                post.images.length >= 2 && "aspect-square"
              )}
            >
              <img 
                src={url} 
                alt={`Post image ${index + 1}`}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
              />
              {index === 3 && post.images.length > 4 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">
                    +{post.images.length - 4}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* News Link Preview */}
      {post.post_type === "news" && post.news_url && (
        <a 
          href={post.news_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block mx-4 mb-3 bg-gray-800 border border-gray-700 rounded-lg overflow-hidden hover:border-violet-500 transition-colors"
        >
          {post.news_thumbnail && (
            <img 
              src={post.news_thumbnail} 
              alt="News thumbnail"
              className="w-full h-48 object-cover"
            />
          )}
          <div className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <ExternalLink className="h-3 w-3 text-gray-500" />
              <span className="text-xs text-gray-500">Link externo</span>
            </div>
            {post.news_title && (
              <p className="text-sm font-medium text-white">{post.news_title}</p>
            )}
          </div>
        </a>
      )}

      {/* Actions */}
      <div className="px-4 py-3 border-t border-gray-800">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onLike(post)}
              className={cn(
                "flex items-center gap-2 transition-colors",
                isLiked ? "text-red-500" : "text-gray-400 hover:text-red-400"
              )}
            >
              <Heart className={cn("h-5 w-5", isLiked && "fill-current")} />
              <span>{post.likes_count || 0}</span>
            </button>

            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-2 text-gray-400 hover:text-violet-400 transition-colors"
            >
              <MessageSquare className="h-5 w-5" />
              <span>{post.comments?.length || 0}</span>
            </button>

            <button
              onClick={() => setShowShareDialog(true)}
              className="flex items-center gap-2 text-gray-400 hover:text-emerald-400 transition-colors"
            >
              <Share2 className="h-5 w-5" />
              <span>{post.shares_count || 0}</span>
            </button>

            <button
              onClick={handleSaveToggle}
              className={cn(
                "flex items-center gap-2 transition-colors",
                isSaved ? "text-violet-500" : "text-gray-400 hover:text-violet-400"
              )}
            >
              <Bookmark className={cn("h-5 w-5", isSaved && "fill-current")} />
            </button>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="px-4 pb-4 border-t border-gray-800 pt-3 space-y-3">
          {post.comments && post.comments.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {post.comments.map((comment, index) => (
                <div key={index} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    {comment.author_avatar ? (
                      <img src={comment.author_avatar} alt={comment.author_name} />
                    ) : (
                      <AvatarFallback className="bg-violet-500/20 text-violet-400 text-xs">
                        {comment.author_name?.[0] || "U"}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1">
                    <div className="bg-gray-800 rounded-lg p-3">
                      <p className="font-semibold text-white text-xs mb-1">
                        {comment.author_name}
                      </p>
                      <p className="text-sm text-gray-300">{comment.content}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {comment.created_at && formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 text-sm py-4">
              Seja o primeiro a comentar
            </p>
          )}
          
          <button
            onClick={() => setShowCommentDialog(true)}
            className="w-full text-left px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 text-sm hover:border-violet-500 transition-colors flex items-center gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            Escrever um comentário...
          </button>
        </div>
      )}

      {/* Comment Dialog */}
      {currentUser && (
        <CommentDialog
          open={showCommentDialog}
          onClose={() => setShowCommentDialog(false)}
          post={post}
          user={currentUser}
          onCommentAdded={onRefresh}
        />
      )}

      {/* Recommendation Dialog */}
      <PostRecommendationDialog
        open={showRecommendDialog}
        onClose={() => setShowRecommendDialog(false)}
        post={post}
        userEmail={currentUserEmail}
      />

      {/* Share Dialog */}
      {currentUser && (
        <SharePostDialog
          open={showShareDialog}
          onClose={() => setShowShareDialog(false)}
          post={post}
          userEmail={currentUserEmail}
          userName={currentUser.full_name}
        />
      )}
    </Card>
  );
}