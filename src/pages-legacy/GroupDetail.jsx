import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Users, Settings, Pin, Trash2, Shield, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import PostCard from "@/components/community/PostCard";
import GroupSettingsDialog from "@/components/community/GroupSettingsDialog";
import { toast } from "sonner";

export default function GroupDetail() {
  const location = useLocation();
  const groupId = new URLSearchParams(location.search).get("id");
  
  const [user, setUser] = useState(null);
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [currentUserMember, setCurrentUserMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [postContent, setPostContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    loadData();
    
    // Subscribe to real-time updates
    const unsubscribe = base44.entities.GroupPost.subscribe((event) => {
      if (event.data?.group_id === groupId) {
        loadPosts();
      }
    });

    return unsubscribe;
  }, [groupId]);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      const groupData = await base44.entities.CommunityGroup.list();
      const foundGroup = groupData.find(g => g.id === groupId);
      setGroup(foundGroup);

      const groupMembers = await base44.entities.GroupMember.filter({ group_id: groupId });
      setMembers(groupMembers);

      const currentMember = groupMembers.find(m => m.user_email === userData.email);
      setCurrentUserMember(currentMember);

      await loadPosts();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      const groupPosts = await base44.entities.GroupPost.filter(
        { group_id: groupId, moderation_status: "aprovado" },
        '-created_date',
        50
      );
      // Sort to show pinned posts first
      const sorted = [...groupPosts].sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        return 0;
      });
      setPosts(sorted);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreatePost = async () => {
    if (!postContent.trim()) return;
    if (!currentUserMember?.permissions?.can_post) {
      toast.error("Você não tem permissão para postar neste grupo");
      return;
    }

    setPosting(true);
    try {
      await base44.entities.GroupPost.create({
        group_id: groupId,
        author_email: user.email,
        author_name: user.full_name || user.email.split('@')[0],
        author_avatar: user.avatar_url,
        content: postContent.trim(),
        images: [],
        likes_count: 0,
        liked_by: [],
        comments: [],
        moderation_status: "aprovado"
      });

      // Update group posts count
      await base44.entities.CommunityGroup.update(groupId, {
        posts_count: (group.posts_count || 0) + 1
      });

      setPostContent("");
      toast.success("Post criado!");
      loadPosts();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao criar post");
    } finally {
      setPosting(false);
    }
  };

  const handlePinPost = async (postId, isPinned) => {
    if (!["admin", "moderator"].includes(currentUserMember?.role)) return;

    try {
      await base44.entities.GroupPost.update(postId, { is_pinned: !isPinned });
      toast.success(isPinned ? "Post desafixado" : "Post fixado");
      loadPosts();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao fixar post");
    }
  };

  const handleDeletePost = async (postId) => {
    if (!["admin", "moderator"].includes(currentUserMember?.role)) return;

    try {
      await base44.entities.GroupPost.delete(postId);
      toast.success("Post removido");
      loadPosts();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao remover post");
    }
  };

  const iconColors = {
    blue: "bg-blue-500/20 text-blue-400",
    purple: "bg-purple-500/20 text-purple-400",
    emerald: "bg-emerald-500/20 text-emerald-400",
    amber: "bg-amber-500/20 text-amber-400",
    red: "bg-red-500/20 text-red-400",
    pink: "bg-pink-500/20 text-pink-400"
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 p-4">
        <Skeleton className="h-screen" />
      </div>
    );
  }

  if (!group || !currentUserMember) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 p-4">
        <div className="max-w-4xl mx-auto text-center py-20">
          <p className="text-gray-600 dark:text-gray-400">Grupo não encontrado ou você não é membro</p>
          <Link to={createPageUrl("Groups")}>
            <Button className="mt-4">Voltar para Grupos</Button>
          </Link>
        </div>
      </div>
    );
  }

  const canModerate = ["admin", "moderator"].includes(currentUserMember?.role);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      <div className="max-w-4xl mx-auto p-4">
        {/* Back Button */}
        <Link to={createPageUrl("Groups")} className="inline-flex items-center gap-2 text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Voltar para grupos
        </Link>

        {/* Group Header */}
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className={`h-16 w-16 rounded-xl ${iconColors[group.color]} flex items-center justify-center flex-shrink-0`}>
              <Users className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {group.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                {group.description}
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>{members.length} membros</span>
                <span>•</span>
                <span>{group.posts_count || 0} posts</span>
              </div>
            </div>
            {currentUserMember?.role === "admin" && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>
        </Card>

        {/* Create Post */}
        {currentUserMember?.permissions?.can_post !== false && (
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 p-4 mb-6">
            <div className="flex gap-3">
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarFallback className="bg-violet-500 text-white">
                  {user?.full_name?.[0] || user?.email[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Compartilhe algo com o grupo..."
                  className="min-h-[80px] mb-2"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleCreatePost}
                    disabled={!postContent.trim() || posting}
                    className="bg-violet-600 hover:bg-violet-700"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {posting ? "Publicando..." : "Publicar"}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Posts Feed */}
        <div className="space-y-4">
          {posts.length > 0 ? (
            posts.map((post) => (
              <Card key={post.id} className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 p-4">
                <div className="flex items-start gap-3 mb-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-violet-500 text-white">
                      {post.author_name?.[0] || post.author_email[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {post.author_name || post.author_email.split('@')[0]}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(post.created_date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      {canModerate && (
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePinPost(post.id, post.is_pinned)}
                            title={post.is_pinned ? "Desafixar" : "Fixar"}
                          >
                            <Pin className={`h-4 w-4 ${post.is_pinned ? "fill-current text-violet-500" : ""}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeletePost(post.id)}
                            title="Remover"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {post.is_pinned && (
                  <Badge className="mb-2 bg-violet-500/20 text-violet-400">
                    <Pin className="h-3 w-3 mr-1" />
                    Fixado
                  </Badge>
                )}

                <p className="text-gray-900 dark:text-white whitespace-pre-wrap mb-3">
                  {post.content}
                </p>

                <PostCard
                  post={{...post, id: post.id}}
                  currentUser={user}
                  onUpdate={loadPosts}
                  hideHeader={true}
                />
              </Card>
            ))
          ) : (
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 p-12 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                Nenhum post ainda. Seja o primeiro a compartilhar!
              </p>
            </Card>
          )}
        </div>
      </div>

      {settingsOpen && (
        <GroupSettingsDialog
          group={group}
          members={members}
          currentUserEmail={user?.email}
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          onUpdate={() => {
            loadData();
            setSettingsOpen(false);
          }}
        />
      )}
    </div>
  );
}