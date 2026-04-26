import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import PostCard from "./PostCard";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function PersonalizedFeed({ userEmail, preferences }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (userEmail) {
      loadPersonalizedFeed();
    }
  }, [userEmail, preferences]);

  // Subscribe to new posts in real-time
  useEffect(() => {
    const unsubscribe = base44.entities.CommunityPost.subscribe((event) => {
      if (event.type === 'create') {
        // Add new post to the top of feed
        setPosts(prev => [event.data, ...prev]);
      } else if (event.type === 'update') {
        // Update existing post
        setPosts(prev => prev.map(p => p.id === event.id ? event.data : p));
      } else if (event.type === 'delete') {
        // Remove deleted post
        setPosts(prev => prev.filter(p => p.id !== event.id));
      }
    });

    return unsubscribe;
  }, []);

  const loadPersonalizedFeed = async () => {
    try {
      setLoading(true);
      
      // Load all community posts
      const allPosts = await base44.entities.CommunityPost.list('-created_date', 100);
      
      if (!preferences || preferences.feed_algorithm === 'chronological') {
        // Simple chronological feed
        setPosts(allPosts);
      } else if (preferences.feed_algorithm === 'engagement') {
        // Sort by engagement
        const sortedByEngagement = [...allPosts].sort((a, b) => {
          const engagementA = (a.likes_count || 0) + (a.comments?.length || 0) + (a.shares_count || 0);
          const engagementB = (b.likes_count || 0) + (b.comments?.length || 0) + (b.shares_count || 0);
          return engagementB - engagementA;
        });
        setPosts(sortedByEngagement);
      } else if (preferences.feed_algorithm === 'relevance') {
        // AI-powered relevance
        await rankPostsByRelevance(allPosts);
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar feed");
    } finally {
      setLoading(false);
    }
  };

  const rankPostsByRelevance = async (allPosts) => {
    try {
      // Prioritize posts from followed users
      const followedPosts = allPosts.filter(p => 
        preferences.followed_users?.includes(p.author_email)
      );

      // Filter by topics if tags exist
      const topicPosts = allPosts.filter(p => 
        p.tags?.some(tag => preferences.interest_topics?.includes(tag))
      );

      // Use AI to rank remaining posts
      const remainingPosts = allPosts.filter(p => 
        !followedPosts.includes(p) && !topicPosts.includes(p)
      );

      if (remainingPosts.length > 0) {
        const prompt = `Você é um algoritmo de recomendação de conteúdo. O usuário tem interesse em: ${preferences.interest_topics?.join(", ")}.

Analise os seguintes posts e retorne os IDs ordenados por relevância (mais relevante primeiro):

${remainingPosts.slice(0, 20).map((p, i) => `${i}. ID: ${p.id} - Conteúdo: ${p.content?.substring(0, 100)} - Tags: ${p.tags?.join(", ")}`).join("\n")}

Retorne apenas um array de IDs ordenados.`;

        const result = await base44.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: {
            type: "object",
            properties: {
              ranked_ids: {
                type: "array",
                items: { type: "string" }
              }
            }
          }
        });

        const rankedRemaining = result.ranked_ids
          ?.map(id => remainingPosts.find(p => p.id === id))
          .filter(p => p);

        // Combine: followed users first, then topic posts, then AI-ranked
        setPosts([
          ...followedPosts,
          ...topicPosts.filter(p => !followedPosts.includes(p)),
          ...(rankedRemaining || remainingPosts)
        ]);
      } else {
        setPosts([...followedPosts, ...topicPosts]);
      }
    } catch (error) {
      console.error(error);
      // Fallback to simple sorting
      setPosts(allPosts);
    }
  };

  const handleLike = async (post) => {
    try {
      const isLiked = post.liked_by?.includes(userEmail);
      const updatedLikedBy = isLiked
        ? post.liked_by.filter(e => e !== userEmail)
        : [...(post.liked_by || []), userEmail];
      
      await base44.entities.CommunityPost.update(post.id, {
        liked_by: updatedLikedBy,
        likes_count: updatedLikedBy.length
      });
      
      setPosts(prev => prev.map(p => 
        p.id === post.id 
          ? { ...p, liked_by: updatedLikedBy, likes_count: updatedLikedBy.length }
          : p
      ));
      
      toast.success(isLiked ? "Post desacurtido" : "Post curtido!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao curtir post");
    }
  };

  const handleShare = async (post) => {
    try {
      await base44.entities.CommunityPost.update(post.id, {
        shares_count: (post.shares_count || 0) + 1
      });
      
      setPosts(prev => prev.map(p => 
        p.id === post.id 
          ? { ...p, shares_count: (p.shares_count || 0) + 1 }
          : p
      ));
      
      toast.success("Post compartilhado!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao compartilhar");
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPersonalizedFeed();
    setRefreshing(false);
    toast.success("Feed atualizado");
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, idx) => (
          <Skeleton key={idx} className="h-48 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Feed Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-violet-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {preferences?.feed_algorithm === 'relevance' && "Feed Personalizado"}
            {preferences?.feed_algorithm === 'engagement' && "Posts em Alta"}
            {(!preferences || preferences?.feed_algorithm === 'chronological') && "Feed Cronológico"}
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Posts */}
      {posts.length > 0 ? (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            currentUserEmail={userEmail}
            currentUser={{ email: userEmail }}
            onDelete={() => loadPersonalizedFeed()}
            onLike={handleLike}
            onComment={() => loadPersonalizedFeed()}
            onShare={handleShare}
            onRefresh={loadPersonalizedFeed}
          />
        ))
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">Nenhum post encontrado</p>
          <p className="text-sm text-gray-500">
            Ajuste suas preferências para ver mais conteúdo relevante
          </p>
        </div>
      )}
    </div>
  );
}