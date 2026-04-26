import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, UserPlus, Crown, X, ExternalLink } from "lucide-react";
import AddMemberDialog from "@/components/community/AddMemberDialog";
import { toast } from "sonner";

export default function GroupDetailDialog({ group, currentUserEmail, open, onClose, onUpdate }) {
  const [members, setMembers] = useState([]);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addMemberOpen, setAddMemberOpen] = useState(false);

  useEffect(() => {
    if (open && group) {
      loadMembers();
    }
  }, [open, group]);

  const loadMembers = async () => {
    try {
      const groupMembers = await base44.entities.GroupMember.filter({
        group_id: group.id
      });
      setMembers(groupMembers);

      const currentMember = groupMembers.find(m => m.user_email === currentUserEmail);
      setCurrentUserRole(currentMember?.role);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId, memberEmail) => {
    if (currentUserRole !== "admin") return;

    try {
      await base44.entities.GroupMember.delete(memberId);
      
      // Update group member count
      await base44.entities.CommunityGroup.update(group.id, {
        member_count: Math.max((group.member_count || 1) - 1, 0)
      });

      toast.success("Membro removido");
      loadMembers();
      onUpdate();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao remover membro");
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

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="bg-white dark:bg-gray-900 max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <div className={`h-16 w-16 rounded-xl ${iconColors[group.color]} flex items-center justify-center flex-shrink-0`}>
                <Users className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-gray-900 dark:text-white text-xl">
                  {group.name}
                </DialogTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {group.description}
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {group.member_count || 0}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Membros</p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {group.posts_count || 0}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Posts</p>
              </div>
            </div>

            {/* Members Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">Membros</h3>
                <div className="flex gap-2">
                  <Link to={createPageUrl("GroupDetail") + `?id=${group.id}`}>
                    <Button size="sm" variant="outline">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Ver Grupo
                    </Button>
                  </Link>
                  {currentUserRole === "admin" && (
                    <Button
                      size="sm"
                      onClick={() => setAddMemberOpen(true)}
                      className="bg-violet-600 hover:bg-violet-700"
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Adicionar
                    </Button>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-violet-500 text-white">
                            {member.user_name?.[0] || member.user_email[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {member.user_name || member.user_email.split('@')[0]}
                            </p>
                            {member.role === "admin" && (
                              <Crown className="h-4 w-4 text-amber-500" />
                            )}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {member.user_email}
                          </p>
                        </div>
                      </div>

                      {currentUserRole === "admin" && member.role !== "admin" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveMember(member.id, member.user_email)}
                        >
                          <X className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AddMemberDialog
        open={addMemberOpen}
        onClose={() => setAddMemberOpen(false)}
        group={group}
        currentUserEmail={currentUserEmail}
        existingMembers={members}
        onSuccess={() => {
          setAddMemberOpen(false);
          loadMembers();
          onUpdate();
        }}
      />
    </>
  );
}