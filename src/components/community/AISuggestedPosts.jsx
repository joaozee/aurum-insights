import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, TrendingUp, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

export default function AISuggestedPosts({ userEmail, onPostClick }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (userEmail && !dismissed) {
      loadSuggestions();
    }
  }, [userEmail, dismissed]);

  const loadSuggestions = async () => {
    try {
      setLoading(true);

      // Get user's saved news to understand interests
      const savedNews = await base44.entities.SavedNews.filter({
        user_email: userEmail
      });

      const newsPrefs = await base44.entities.NewsPreferences.filter({
        user_email: userEmail
      });

      const interests = newsPrefs.length > 0 
        ? newsPrefs[0].topics_of_interest 
        : ["acoes", "macroeconomia"];

      // Get all posts
      const allPosts = await base44.entities.CommunityPost.list("-created_date", 100);

      // Filter posts the user hasn't liked yet
      const unreadPosts = allPosts.filter(
        post => !post.liked_by?.includes(userEmail)
      );

      // Filter by user interests (tags match)
      const relevantPosts = unreadPosts.filter(post => 
        post.tags?.some(tag => interests.includes(tag))
      );

      // Take top 3
      setSuggestions(relevantPosts.slice(0, 3));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (dismissed || (!loading && suggestions.length === 0)) {
    return null;
  }

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border-violet-200 dark:border-violet-800 p-4">
        <Skeleton className="h-4 w-32 mb-3" />
        <Skeleton className="h-20 w-full" />
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border-violet-200 dark:border-violet-800 p-4 relative">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 p-1 hover:bg-white/50 dark:hover:bg-gray-900/50 rounded"
      >
        <X className="h-3 w-3 text-gray-500" />
      </button>

      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-violet-600" />
        <h4 className="text-sm font-semibold text-violet-900 dark:text-violet-100">
          Sugerido para você
        </h4>
      </div>

      <div className="space-y-3">
        {suggestions.map((post) => (
          <div
            key={post.id}
            onClick={() => onPostClick?.(post)}
            className="cursor-pointer p-3 bg-white/70 dark:bg-gray-900/70 rounded-lg hover:bg-white dark:hover:bg-gray-900 transition-colors"
          >
            <div className="flex items-start gap-2 mb-2">
              <Avatar className="h-6 w-6">
                {post.author_avatar ? (
                  <img src={post.author_avatar} alt={post.author_name} />
                ) : (
                  <AvatarFallback className="bg-violet-500 text-white text-xs">
                    {post.author_name?.[0] || "U"}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 dark:text-white">
                  {post.author_name}
                </p>
              </div>
            </div>
            
            <p className="text-xs text-gray-700 dark:text-gray-300 mb-2 line-clamp-2">
              {post.content}
            </p>

            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {post.tags.slice(0, 3).map((tag, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 h-4 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}