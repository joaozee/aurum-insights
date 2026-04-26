import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Bookmark, ArrowLeft, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PostCard from "@/components/community/PostCard";
import { toast } from "sonner";

export default function SavedItems() {
  const [user, setUser] = useState(null);
  const [savedItems, setSavedItems] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      const savedData = await base44.entities.SavedPost.filter({
        user_email: userData.email
      }, "-saved_at");

      setSavedItems(savedData);

      // Carregar os posts salvos
      const postIds = savedData.filter(s => s.post_type === "community").map(s => s.post_id);
      if (postIds.length > 0) {
        const postsData = await Promise.all(
          postIds.map(id => 
            base44.entities.CommunityPost.filter({ id }).then(r => r[0]).catch(() => null)
          )
        );
        setPosts(postsData.filter(p => p !== null));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (savedItemId) => {
    try {
      await base44.entities.SavedPost.delete(savedItemId);
      toast.success("Item removido dos salvos");
      loadData();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao remover item");
    }
  };

  const handleLike = async (post) => {
    if (!user) return;

    try {
      const isLiked = post.liked_by?.includes(user.email);
      
      if (isLiked) {
        await base44.entities.CommunityPost.update(post.id, {
          liked_by: post.liked_by.filter(email => email !== user.email),
          likes_count: (post.likes_count || 1) - 1
        });
      } else {
        await base44.entities.CommunityPost.update(post.id, {
          liked_by: [...(post.liked_by || []), user.email],
          likes_count: (post.likes_count || 0) + 1
        });
      }
      
      loadData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (postId) => {
    try {
      await base44.entities.CommunityPost.delete(postId);
      toast.success("Post deletado");
      loadData();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao deletar post");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 p-4">
        <Skeleton className="h-32 bg-gray-200 dark:bg-gray-800" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      <div className="max-w-4xl mx-auto p-4">
        <Link to={createPageUrl("Community")} className="inline-flex items-center gap-2 text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-violet-500/20 flex items-center justify-center">
              <Bookmark className="h-6 w-6 text-violet-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Itens salvos</h1>
              <p className="text-gray-600 dark:text-gray-400">
                {savedItems.length} {savedItems.length === 1 ? 'item salvo' : 'itens salvos'}
              </p>
            </div>
          </div>
        </div>

        {posts.length === 0 ? (
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 p-12 text-center">
            <Bookmark className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">Nenhum item salvo ainda</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Salve posts interessantes para acessá-los depois
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => {
              const savedItem = savedItems.find(s => s.post_id === post.id);
              return (
                <div key={post.id} className="relative">
                  <PostCard
                    post={post}
                    currentUserEmail={user?.email}
                    onLike={handleLike}
                    onComment={() => {}}
                    onDelete={handleDelete}
                    onShare={() => {}}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-4 right-4 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                    onClick={() => handleUnsave(savedItem.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}