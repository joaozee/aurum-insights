import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Users, Plus, ArrowLeft, Settings, UserPlus, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import CreateGroupDialog from "@/components/community/CreateGroupDialog";
import GroupDetailDialog from "@/components/community/GroupDetailDialog";
import { toast } from "sonner";

export default function Groups() {
  const [user, setUser] = useState(null);
  const [myGroups, setMyGroups] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      // Load all groups
      const groups = await base44.entities.CommunityGroup.list('-created_date', 50);
      
      // Load user's group memberships
      const memberships = await base44.entities.GroupMember.filter({
        user_email: userData.email
      });

      const myGroupIds = memberships.map(m => m.group_id);
      const userGroups = groups.filter(g => myGroupIds.includes(g.id));
      const otherGroups = groups.filter(g => !myGroupIds.includes(g.id));

      setMyGroups(userGroups);
      setAllGroups(otherGroups);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      await base44.entities.GroupMember.create({
        group_id: groupId,
        user_email: user.email,
        user_name: user.full_name || user.email.split('@')[0],
        role: "member",
        joined_at: new Date().toISOString()
      });

      // Update group member count
      const group = allGroups.find(g => g.id === groupId);
      if (group) {
        await base44.entities.CommunityGroup.update(groupId, {
          member_count: (group.member_count || 0) + 1
        });
      }

      toast.success("Entrou no grupo!");
      loadData();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao entrar no grupo");
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

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      <div className="max-w-6xl mx-auto p-4">
        {/* Back Button */}
        <Link to={createPageUrl("Community")} className="inline-flex items-center gap-2 text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Voltar para comunidade
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Grupos</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Participe de comunidades com interesses em comum
            </p>
          </div>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="bg-violet-600 hover:bg-violet-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Criar Grupo
          </Button>
        </div>

        {/* My Groups */}
        {myGroups.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Meus Grupos</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {myGroups.map((group) => (
                <Card 
                  key={group.id} 
                  className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 p-4 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedGroup(group)}
                >
                  <div className="flex items-start gap-4">
                    <div className={`h-14 w-14 rounded-xl ${iconColors[group.color]} flex items-center justify-center flex-shrink-0`}>
                      <Users className="h-7 w-7" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {group.name}
                        </h3>
                        {group.is_premium_only && (
                          <Crown className="h-4 w-4 text-amber-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                        {group.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {group.member_count || 0} membros
                        </span>
                        <span>{group.posts_count || 0} posts</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Discover Groups */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Descobrir Grupos</h2>
          {allGroups.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {allGroups.map((group) => (
                <Card key={group.id} className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 p-4">
                  <div className="flex items-start gap-4">
                    <div className={`h-14 w-14 rounded-xl ${iconColors[group.color]} flex items-center justify-center flex-shrink-0`}>
                      <Users className="h-7 w-7" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {group.name}
                        </h3>
                        {group.is_premium_only && (
                          <Crown className="h-4 w-4 text-amber-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                        {group.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {group.member_count || 0} membros
                          </span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleJoinGroup(group.id)}
                          className="bg-violet-600 hover:bg-violet-700"
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Entrar
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 p-12 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">Nenhum grupo disponível</p>
            </Card>
          )}
        </div>
      </div>

      <CreateGroupDialog 
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={() => {
          setCreateDialogOpen(false);
          loadData();
        }}
        userEmail={user?.email}
      />

      {selectedGroup && (
        <GroupDetailDialog
          group={selectedGroup}
          currentUserEmail={user?.email}
          open={!!selectedGroup}
          onClose={() => setSelectedGroup(null)}
          onUpdate={loadData}
        />
      )}
    </div>
  );
}