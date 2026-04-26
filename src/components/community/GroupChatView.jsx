import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Pin, Trash2, Users, Settings, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import GroupSettingsDialog from "@/components/community/GroupSettingsDialog";
import AudioRecorder from "@/components/messages/AudioRecorder";
import MessageBubble from "@/components/messages/MessageBubble";
import { toast } from "sonner";

export default function GroupChatView({ group, currentUser, currentUserMember }) {
  const [posts, setPosts] = useState([]);
  const [members, setMembers] = useState([]);
  const [postContent, setPostContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadData();

    // Subscribe to real-time updates
    const unsubscribe = base44.entities.GroupPost.subscribe((event) => {
      if (event.data?.group_id === group.id) {
        loadPosts();
      }
    });

    return unsubscribe;
  }, [group.id]);

  const loadData = async () => {
    try {
      await Promise.all([loadPosts(), loadMembers()]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      const groupPosts = await base44.entities.GroupPost.filter(
        { group_id: group.id, moderation_status: "aprovado" },
        '-created_date',
        100
      );
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

  const loadMembers = async () => {
    try {
      const groupMembers = await base44.entities.GroupMember.filter({ group_id: group.id });
      setMembers(groupMembers);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSendPost = async (messageType = "text", attachmentUrl = null) => {
    if (!postContent.trim() && !attachmentUrl) return;
    if (!currentUserMember?.permissions?.can_post) {
      toast.error("Você não tem permissão para postar");
      return;
    }

    setPosting(true);
    try {
      await base44.entities.GroupPost.create({
        group_id: group.id,
        author_email: currentUser.email,
        author_name: currentUser.full_name || currentUser.email.split('@')[0],
        author_avatar: currentUser.avatar_url,
        content: postContent.trim(),
        message_type: messageType,
        attachment_url: attachmentUrl,
        images: [],
        likes_count: 0,
        liked_by: [],
        comments: [],
        moderation_status: "aprovado"
      });

      await base44.entities.CommunityGroup.update(group.id, {
        posts_count: (group.posts_count || 0) + 1
      });

      setPostContent("");
      loadPosts();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao enviar mensagem");
    } finally {
      setPosting(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Por favor, selecione uma imagem");
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await handleSendPost("image", file_url);
      toast.success("Imagem enviada!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao enviar imagem");
    } finally {
      setUploading(false);
    }
  };

  const handleAudioRecorded = async (audioBlob) => {
    setUploading(true);
    try {
      const file = new File([audioBlob], "audio.webm", { type: "audio/webm" });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await handleSendPost("audio", file_url);
      toast.success("Áudio enviado!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao enviar áudio");
    } finally {
      setUploading(false);
    }
  };

  const handlePinPost = async (postId, isPinned) => {
    if (!["admin", "moderator"].includes(currentUserMember?.role)) return;

    try {
      await base44.entities.GroupPost.update(postId, { is_pinned: !isPinned });
      loadPosts();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!["admin", "moderator"].includes(currentUserMember?.role)) return;

    try {
      await base44.entities.GroupPost.delete(postId);
      loadPosts();
    } catch (error) {
      console.error(error);
    }
  };

  const canModerate = ["admin", "moderator"].includes(currentUserMember?.role);
  const iconColors = {
    blue: "bg-blue-500",
    purple: "bg-purple-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
    pink: "bg-pink-500"
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className={`h-10 w-10 rounded-full ${iconColors[group.color]} flex items-center justify-center cursor-pointer`}>
              <Users className="h-5 w-5 text-white" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 dark:text-white">{group.name}</h3>
              <p className="text-xs text-gray-500">{members.length} membros</p>
            </div>
          </button>
          {currentUserMember?.role === "admin" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages/Posts */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {loading ? (
            <p className="text-center text-gray-500">Carregando...</p>
          ) : posts.length > 0 ? (
            posts.map((post) => (
              <div key={post.id} className="group relative">
                {post.is_pinned && (
                  <Badge className="mb-2 bg-violet-500/20 text-violet-400 text-xs">
                    <Pin className="h-3 w-3 mr-1" />
                    Fixado
                  </Badge>
                )}
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-violet-500 text-white text-xs">
                      {post.author_name?.[0] || post.author_email[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm text-gray-900 dark:text-white">
                        {post.author_name || post.author_email.split('@')[0]}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(post.created_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {post.message_type === 'image' ? (
                      <img 
                        src={post.attachment_url} 
                        alt="Imagem" 
                        className="w-full max-w-sm rounded-lg cursor-pointer"
                        onClick={() => window.open(post.attachment_url, '_blank')}
                      />
                    ) : post.message_type === 'audio' ? (
                      <audio controls className="w-full max-w-sm">
                        <source src={post.attachment_url} type="audio/webm" />
                      </audio>
                    ) : null}
                    {post.content && (
                      <p className="text-sm text-gray-900 dark:text-gray-200 whitespace-pre-wrap break-words">
                        {post.content}
                      </p>
                    )}
                  </div>
                  {canModerate && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handlePinPost(post.id, post.is_pinned)}
                      >
                        <Pin className={`h-3 w-3 ${post.is_pinned ? "fill-current" : ""}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleDeletePost(post.id)}
                      >
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Nenhuma mensagem ainda</p>
              <p className="text-sm text-gray-400">Seja o primeiro a enviar uma mensagem</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      {currentUserMember?.permissions?.can_post !== false && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex gap-2 items-end">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              title="Enviar imagem"
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
            <AudioRecorder onAudioRecorded={handleAudioRecorded} />
            <Textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="Digite uma mensagem..."
              className="min-h-[60px] resize-none flex-1"
              disabled={uploading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendPost();
                }
              }}
            />
            <Button
              onClick={() => handleSendPost()}
              disabled={(!postContent.trim() || posting) && !uploading}
              className="bg-violet-600 hover:bg-violet-700 self-end"
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <GroupSettingsDialog
        group={group}
        members={members}
        currentUserEmail={currentUser?.email}
        currentUserRole={currentUserMember?.role}
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onUpdate={() => {
          loadData();
        }}
      />
    </div>
  );
}