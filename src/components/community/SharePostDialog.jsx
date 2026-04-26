import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Repeat2, Send, Users, User, Search } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

export default function SharePostDialog({ open, onClose, post, userEmail, userName }) {
  const [loading, setLoading] = useState(false);
  const [repostComment, setRepostComment] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [searchUsers, setSearchUsers] = useState("");
  const [searchGroups, setSearchGroups] = useState("");
  const [following, setFollowing] = useState([]);
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    if (open && userEmail) {
      loadFollowing();
      loadGroups();
    }
  }, [open, userEmail]);

  const loadFollowing = async () => {
    try {
      const followList = await base44.entities.UserFollow.filter({
        follower_email: userEmail
      });
      
      // Limit to first 10 follows to avoid rate limits
      const limitedFollows = followList.slice(0, 10);
      
      // Load profiles one by one with delay
      const userProfiles = [];
      
      for (const follow of limitedFollows) {
        try {
          const profiles = await base44.entities.UserProfile.filter({ 
            user_email: follow.following_email 
          });
          userProfiles.push(profiles[0] || { 
            user_email: follow.following_email, 
            name: follow.following_email 
          });
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (err) {
          console.error('Error loading profile:', err);
          userProfiles.push({ 
            user_email: follow.following_email, 
            name: follow.following_email 
          });
        }
      }
      
      setFollowing(userProfiles);
    } catch (error) {
      console.error(error);
      if (error?.status === 429) {
        toast.error("Muitas requisições. Aguarde um momento.");
      }
    }
  };

  const loadGroups = async () => {
    try {
      const memberships = await base44.entities.GroupMember.filter({
        user_email: userEmail
      });
      
      // Limit to first 10 groups
      const limitedMemberships = memberships.slice(0, 10);
      
      // Load groups one by one with delay
      const allGroups = [];
      
      for (const membership of limitedMemberships) {
        try {
          const groupData = await base44.entities.CommunityGroup.filter({ 
            id: membership.group_id 
          });
          if (groupData.length > 0) {
            allGroups.push(groupData[0]);
          }
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (err) {
          console.error('Error loading group:', err);
        }
      }
      
      setGroups(allGroups);
    } catch (error) {
      console.error(error);
      if (error?.status === 429) {
        toast.error("Muitas requisições. Aguarde um momento.");
      }
    }
  };

  const handleRepost = async () => {
    setLoading(true);
    try {
      const repostData = {
        comment: repostComment.trim(),
        author_name: post.author_name,
        author_email: post.author_email,
        author_avatar: post.author_avatar || '',
        content: post.content,
        tags: post.tags || [],
        images: post.images || [],
        created_date: post.created_date,
      };
      await base44.entities.CommunityPost.create({
        content: `[REPOST]${JSON.stringify(repostData)}`,
        author_name: userName,
        author_email: userEmail,
        post_type: "text",
        tags: post.tags || []
      });

      await base44.entities.CommunityPost.update(post.id, {
        shares_count: (post.shares_count || 0) + 1
      });

      toast.success("Post repostado!");
      setRepostComment("");
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao repostar");
    } finally {
      setLoading(false);
    }
  };

  const handleSendToUsers = async () => {
    if (selectedUsers.length === 0 && selectedGroups.length === 0) {
      toast.error("Selecione pelo menos um destinatário");
      return;
    }

    setLoading(true);
    try {
      const messageContent = `${userName} compartilhou um post com você:\n\n${post.content}`;
      
      // Send to selected users with delay between each
      for (const user of selectedUsers) {
        try {
          await base44.entities.DirectMessage.create({
            sender_email: userEmail,
            sender_name: userName,
            receiver_email: user.user_email,
            content: messageContent,
            created_at: new Date().toISOString()
          });
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (err) {
          console.error(`Erro ao enviar para ${user.user_email}:`, err);
        }
      }

      // Send to selected groups with delay between each
      for (const group of selectedGroups) {
        try {
          await base44.entities.GroupPost.create({
            group_id: group.id,
            author_email: userEmail,
            author_name: userName,
            content: `${userName} compartilhou:\n\n${post.content}`,
            created_at: new Date().toISOString()
          });
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (err) {
          console.error(`Erro ao enviar para grupo ${group.name}:`, err);
        }
      }

      await base44.entities.CommunityPost.update(post.id, {
        shares_count: (post.shares_count || 0) + 1
      });

      toast.success(`Post compartilhado com ${selectedUsers.length + selectedGroups.length} ${selectedUsers.length + selectedGroups.length === 1 ? 'destinatário' : 'destinatários'}`);
      setSelectedUsers([]);
      setSelectedGroups([]);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao compartilhar");
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (user) => {
    setSelectedUsers(prev => 
      prev.find(u => u.user_email === user.user_email)
        ? prev.filter(u => u.user_email !== user.user_email)
        : [...prev, user]
    );
  };

  const toggleGroup = (group) => {
    setSelectedGroups(prev => 
      prev.find(g => g.id === group.id)
        ? prev.filter(g => g.id !== group.id)
        : [...prev, group]
    );
  };

  const filteredUsers = following.filter(u => 
    u.name?.toLowerCase().includes(searchUsers.toLowerCase()) ||
    u.user_email?.toLowerCase().includes(searchUsers.toLowerCase())
  );

  const filteredGroups = groups.filter(g => 
    g.name?.toLowerCase().includes(searchGroups.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Compartilhar Post</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="repost" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800">
            <TabsTrigger value="repost" className="data-[state=active]:bg-violet-600">
              <Repeat2 className="h-4 w-4 mr-2" />
              Repostar
            </TabsTrigger>
            <TabsTrigger value="send" className="data-[state=active]:bg-violet-600">
              <Send className="h-4 w-4 mr-2" />
              Enviar para
            </TabsTrigger>
          </TabsList>

          <TabsContent value="repost" className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-violet-500/20 text-violet-400">
                    {post.author_name?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-white text-sm">{post.author_name}</p>
                </div>
              </div>
              <p className="text-gray-300 text-sm line-clamp-3">{post.content}</p>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-2 block">
                Adicione um comentário (opcional)
              </label>
              <Textarea
                value={repostComment}
                onChange={(e) => setRepostComment(e.target.value)}
                placeholder="O que você pensa sobre isso?"
                className="bg-gray-800 border-gray-700 text-white"
                rows={3}
              />
            </div>

            <Button
              onClick={handleRepost}
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-700"
            >
              <Repeat2 className="h-4 w-4 mr-2" />
              {loading ? "Repostando..." : "Repostar no meu perfil"}
            </Button>
          </TabsContent>

          <TabsContent value="send" className="space-y-4">
            <div className="space-y-4">
              {/* Search Users */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <label className="text-sm text-gray-400">Enviar para amigos</label>
                </div>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={searchUsers}
                    onChange={(e) => setSearchUsers(e.target.value)}
                    placeholder="Buscar amigos..."
                    className="pl-10 bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div className="max-h-40 overflow-y-auto space-y-2 bg-gray-800 rounded-lg p-2">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map(user => (
                      <div
                        key={user.user_email}
                        className="flex items-center gap-3 p-2 hover:bg-gray-700 rounded cursor-pointer"
                        onClick={() => toggleUser(user)}
                      >
                        <Checkbox
                          checked={selectedUsers.find(u => u.user_email === user.user_email)}
                          className="border-gray-600"
                        />
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-violet-500/20 text-violet-400">
                            {user.name?.[0] || user.user_email?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-white">{user.name || user.user_email}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 text-sm py-2">Nenhum amigo encontrado</p>
                  )}
                </div>
              </div>

              {/* Search Groups */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <label className="text-sm text-gray-400">Enviar para grupos</label>
                </div>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={searchGroups}
                    onChange={(e) => setSearchGroups(e.target.value)}
                    placeholder="Buscar grupos..."
                    className="pl-10 bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div className="max-h-40 overflow-y-auto space-y-2 bg-gray-800 rounded-lg p-2">
                  {filteredGroups.length > 0 ? (
                    filteredGroups.map(group => (
                      <div
                        key={group.id}
                        className="flex items-center gap-3 p-2 hover:bg-gray-700 rounded cursor-pointer"
                        onClick={() => toggleGroup(group)}
                      >
                        <Checkbox
                          checked={selectedGroups.find(g => g.id === group.id)}
                          className="border-gray-600"
                        />
                        <div className={`h-8 w-8 rounded-lg bg-${group.color}-500/20 flex items-center justify-center`}>
                          <Users className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm text-white">{group.name}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 text-sm py-2">Nenhum grupo encontrado</p>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-xs text-gray-500 mb-3">
                {selectedUsers.length + selectedGroups.length} {selectedUsers.length + selectedGroups.length === 1 ? 'destinatário selecionado' : 'destinatários selecionados'}
              </p>
              <Button
                onClick={handleSendToUsers}
                disabled={loading || (selectedUsers.length === 0 && selectedGroups.length === 0)}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                <Send className="h-4 w-4 mr-2" />
                {loading ? "Enviando..." : "Enviar Post"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}