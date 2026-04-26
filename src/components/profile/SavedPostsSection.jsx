import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bookmark, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import PostCard from "@/components/community/PostCard";

export default function SavedPostsSection({ userEmail }) {
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userEmail) {
      loadSavedPosts();
    }
  }, [userEmail]);

  const loadSavedPosts = async () => {
    try {
      const saved = await base44.entities.SavedPost.filter({
        user_email: userEmail
      }, '-saved_at', 20);

      // Load actual posts
      const postPromises = saved.map(async (s) => {
        if (s.post_type === 'community') {
          const posts = await base44.entities.CommunityPost.filter({ id: s.post_id });
          return posts[0];
        } else if (s.post_type === 'group') {
          const posts = await base44.entities.GroupPost.filter({ id: s.post_id });
          return posts[0];
        }
        return null;
      });

      const posts = (await Promise.all(postPromises)).filter(p => p != null);
      setSavedPosts(posts);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, idx) => (
              <Skeleton key={idx} className="h-32" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bookmark className="h-5 w-5 text-violet-500" />
          Posts Salvos ({savedPosts.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {savedPosts.length > 0 ? (
          <div className="space-y-4">
            {savedPosts.map((post) => (
              <PostCard 
                key={post.id} 
                post={post}
                onDelete={() => loadSavedPosts()}
                onLike={() => loadSavedPosts()}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Bookmark className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">
              Nenhum post salvo ainda
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}