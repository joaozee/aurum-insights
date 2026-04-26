import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function PostRecommendationDialog({ open, onClose, post, userEmail }) {
  const [followers, setFollowers] = useState([]);
  const [selectedFollowers, setSelectedFollowers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (open) {
      loadFollowers();
    }
  }, [open]);

  const loadFollowers = async () => {
    try {
      setLoading(true);
      const follows = await base44.entities.UserFollow.filter({
        following_email: userEmail
      });
      
      const followerProfiles = await Promise.all(
        follows.map(async (f) => {
          const profiles = await base44.entities.UserProfile.filter({
            user_email: f.follower_email
          });
          return {
            email: f.follower_email,
            profile: profiles[0]
          };
        })
      );
      
      setFollowers(followerProfiles.filter(f => f.profile));
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar seguidores");
    } finally {
      setLoading(false);
    }
  };

  const handleRecommend = async () => {
    if (selectedFollowers.length === 0) {
      toast.error("Selecione pelo menos um seguidor");
      return;
    }

    try {
      setLoading(true);
      
      // Incrementar shares_count
      await base44.entities.CommunityPost.update(post.id, {
        shares_count: (post.shares_count || 0) + selectedFollowers.length
      });

      // Enviar notificações para seguidores
      await Promise.all(
        selectedFollowers.map(email =>
          base44.entities.Notification.create({
            user_email: email,
            type: "novo_conteudo",
            title: `${post.author_name} recomendou um post para você`,
            message: `${post.content?.substring(0, 100)}...`,
            severity: "info",
            from_user_email: userEmail,
            related_entity_id: post.id,
            is_sent: false
          }).catch(() => {})
        )
      );

      toast.success(`Post recomendado para ${selectedFollowers.length} seguidor(es)`);
      setSelectedFollowers([]);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao recomendar post");
    } finally {
      setLoading(false);
    }
  };

  const filteredFollowers = followers.filter(f =>
    f.profile?.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle>Recomendar para Seguidores</DialogTitle>
          <DialogDescription>
            Selecione os seguidores com quem deseja compartilhar este post
          </DialogDescription>
        </DialogHeader>

        <Input
          placeholder="Pesquisar seguidores..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-gray-800 border-gray-700"
        />

        <ScrollArea className="h-64 border border-gray-700 rounded-lg p-3">
          {filteredFollowers.length > 0 ? (
            <div className="space-y-2">
              {filteredFollowers.map((follower) => (
                <label
                  key={follower.email}
                  className="flex items-center gap-3 p-2 cursor-pointer hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <Checkbox
                    checked={selectedFollowers.includes(follower.email)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedFollowers([...selectedFollowers, follower.email]);
                      } else {
                        setSelectedFollowers(selectedFollowers.filter(e => e !== follower.email));
                      }
                    }}
                  />
                  <Avatar className="h-8 w-8">
                    {follower.profile?.avatar_url ? (
                      <img src={follower.profile.avatar_url} alt={follower.profile.user_name} />
                    ) : (
                      <AvatarFallback className="bg-violet-500/20 text-violet-400 text-xs">
                        {follower.profile?.user_name?.[0]}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <span className="text-sm text-white">{follower.profile?.user_name}</span>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 text-sm py-8">
              {followers.length === 0 ? "Você não tem seguidores" : "Nenhum seguidor encontrado"}
            </p>
          )}
        </ScrollArea>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleRecommend}
            disabled={loading || selectedFollowers.length === 0}
            className="bg-violet-600 hover:bg-violet-700"
          >
            Recomendar ({selectedFollowers.length})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}