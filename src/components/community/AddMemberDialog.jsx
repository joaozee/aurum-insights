import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, UserPlus } from "lucide-react";
import { toast } from "sonner";

export default function AddMemberDialog({ open, onClose, group, currentUserEmail, existingMembers, onSuccess }) {
  const [mutualConnections, setMutualConnections] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (open) {
      loadMutualConnections();
    }
  }, [open]);

  const loadMutualConnections = async () => {
    try {
      // Get users that current user follows
      const following = await base44.entities.UserFollow.filter({
        follower_email: currentUserEmail
      });

      // Get users that follow current user
      const followers = await base44.entities.UserFollow.filter({
        followed_email: currentUserEmail
      });

      // Find mutual connections (users who follow each other)
      const followingEmails = following.map(f => f.followed_email);
      const followersEmails = followers.map(f => f.follower_email);
      const mutualEmails = followingEmails.filter(email => followersEmails.includes(email));

      // Get user details
      const allUsers = await base44.entities.User.list();
      const mutualUsers = allUsers.filter(u => mutualEmails.includes(u.email));

      // Filter out users already in the group
      const existingMemberEmails = existingMembers.map(m => m.user_email);
      const availableUsers = mutualUsers.filter(u => !existingMemberEmails.includes(u.email));

      setMutualConnections(availableUsers);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (userEmail, userName) => {
    setAdding(true);
    try {
      await base44.entities.GroupMember.create({
        group_id: group.id,
        user_email: userEmail,
        user_name: userName || userEmail.split('@')[0],
        role: "member",
        joined_at: new Date().toISOString()
      });

      // Update group member count
      await base44.entities.CommunityGroup.update(group.id, {
        member_count: (group.member_count || 0) + 1
      });

      toast.success("Membro adicionado!");
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao adicionar membro");
    } finally {
      setAdding(false);
    }
  };

  const filteredConnections = mutualConnections.filter(u =>
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">
            Adicionar Membros ao Grupo
          </DialogTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Apenas suas conexões mútuas podem ser adicionadas
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar conexões..."
              className="pl-9"
            />
          </div>

          {/* Connections List */}
          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}
              </div>
            ) : filteredConnections.length > 0 ? (
              filteredConnections.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-violet-500 text-white">
                        {user.full_name?.[0] || user.email[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {user.full_name || user.email.split('@')[0]}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleAddMember(user.email, user.full_name)}
                    disabled={adding}
                    className="bg-violet-600 hover:bg-violet-700"
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400">
                  {searchTerm
                    ? "Nenhuma conexão encontrada"
                    : "Você não tem conexões mútuas disponíveis"}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  Conexões mútuas são pessoas que você segue e que te seguem de volta
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}