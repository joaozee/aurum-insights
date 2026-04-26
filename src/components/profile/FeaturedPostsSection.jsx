import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Star, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import PostCard from "@/components/community/PostCard";

export default function FeaturedPostsSection({ userEmail }) {
  const [featuredPosts, setFeaturedPosts] = useState([]);
  const [allPosts, setAllPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    if (userEmail) loadData();
  }, [userEmail]);

  const loadData = async () => {
    try {
      const [featured, posts] = await Promise.all([
        base44.entities.FeaturedPost.filter({
          user_email: userEmail
        }, "order"),
        base44.entities.CommunityPost.filter({
          author_email: userEmail
        }, "-created_date")
      ]);
      setFeaturedPosts(featured);
      setAllPosts(posts);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFeaturePost = async (post) => {
    try {
      const maxOrder = featuredPosts.length > 0 
        ? Math.max(...featuredPosts.map(p => p.order || 0)) 
        : 0;

      await base44.entities.FeaturedPost.create({
        user_email: userEmail,
        post_id: post.id,
        post_type: "community",
        order: maxOrder + 1,
        featured_at: new Date().toISOString()
      });
      
      toast.success("Post destacado!");
      await loadData();
      setDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao destacar post");
    }
  };

  const handleRemoveFeatured = async (id) => {
    setDeleting(id);
    try {
      await base44.entities.FeaturedPost.delete(id);
      toast.success("Post removido dos destaques!");
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao remover destaque");
    } finally {
      setDeleting(null);
    }
  };

  const unfeaturablePost = allPosts.find(
    p => !featuredPosts.some(f => f.post_id === p.id)
  );

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-400 fill-current" />
            Posts Destacados
          </h3>
          <p className="text-sm text-gray-400 mt-1">Seus melhores posts no topo do perfil</p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          disabled={unfeaturablePost === undefined}
          className="bg-violet-600 hover:bg-violet-700"
        >
          <Star className="h-4 w-4 mr-2" />
          Destacar Post
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-400">Carregando...</div>
      ) : featuredPosts.length === 0 ? (
        <p className="text-center text-gray-400 py-8">Nenhum post destacado ainda</p>
      ) : (
        <div className="space-y-4">
          {featuredPosts.map((featured) => {
            const post = allPosts.find(p => p.id === featured.post_id);
            return post ? (
              <div key={featured.id} className="relative">
                <div className="absolute -left-4 top-0 bottom-0 w-1 bg-amber-400 rounded-full" />
                <div className="pl-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm text-amber-400">
                      <Star className="h-4 w-4 fill-current" />
                      Destaque #{featured.order + 1}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-red-400"
                      onClick={() => handleRemoveFeatured(featured.id)}
                      disabled={deleting === featured.id}
                    >
                      {deleting === featured.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <PostCard 
                    post={post}
                    currentUserEmail={userEmail}
                    hideHeader={false}
                    onLike={() => {}}
                    onComment={() => {}}
                    onDelete={() => {}}
                    onShare={() => {}}
                  />
                </div>
              </div>
            ) : null;
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Destacar um Post</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {allPosts
              .filter(p => !featuredPosts.some(f => f.post_id === p.id))
              .map((post) => (
                <div key={post.id} className="border border-gray-700 rounded-lg p-4">
                  <PostCard 
                    post={post}
                    currentUserEmail={userEmail}
                    hideHeader={false}
                    onLike={() => {}}
                    onComment={() => {}}
                    onDelete={() => {}}
                    onShare={() => {}}
                  />
                  <Button
                    onClick={() => handleFeaturePost(post)}
                    className="w-full mt-3 bg-amber-600 hover:bg-amber-700"
                  >
                    <Star className="h-4 w-4 mr-2 fill-current" />
                    Destacar Este Post
                  </Button>
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}