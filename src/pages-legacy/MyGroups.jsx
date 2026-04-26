import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Users, ArrowLeft, MessageCircle, Crown, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function MyGroups() {
  const [user, setUser] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      const membershipsData = await base44.entities.GroupMember.filter({
        user_email: userData.email
      });
      setMemberships(membershipsData);

      // Carregar informações dos grupos
      const groupIds = membershipsData.map(m => m.group_id);
      if (groupIds.length > 0) {
        const groupsData = await Promise.all(
          groupIds.map(id => 
            base44.entities.CommunityGroup.filter({ id }).then(r => r[0]).catch(() => null)
          )
        );
        setGroups(groupsData.filter(g => g !== null));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGroupClick = (groupId) => {
    navigate(createPageUrl("Messages") + `?group=${groupId}`);
  };

  const getRoleIcon = (role) => {
    if (role === "admin") return <Crown className="h-3 w-3" />;
    if (role === "moderator") return <Shield className="h-3 w-3" />;
    return null;
  };

  const getRoleColor = (role) => {
    if (role === "admin") return "bg-yellow-500/20 text-yellow-600";
    if (role === "moderator") return "bg-blue-500/20 text-blue-600";
    return "bg-gray-500/20 text-gray-600";
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
              <Users className="h-6 w-6 text-violet-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Meus Grupos</h1>
              <p className="text-gray-600 dark:text-gray-400">
                {groups.length} {groups.length === 1 ? 'grupo' : 'grupos'}
              </p>
            </div>
          </div>
        </div>

        {groups.length === 0 ? (
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 p-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">Você ainda não está em nenhum grupo</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Participe de grupos para discutir investimentos
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => {
              const membership = memberships.find(m => m.group_id === group.id);
              return (
                <Card 
                  key={group.id} 
                  className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 p-4 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => handleGroupClick(group.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div 
                        className="h-12 w-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: group.color || '#8B5CF6' }}
                      >
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {group.name}
                          </h3>
                          {membership && (
                            <Badge className={getRoleColor(membership.role)}>
                              <span className="flex items-center gap-1">
                                {getRoleIcon(membership.role)}
                                {membership.role === "admin" ? "Admin" : membership.role === "moderator" ? "Moderador" : "Membro"}
                              </span>
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                          {group.description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {group.members_count || 0} membros
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-violet-600 hover:text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-950"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGroupClick(group.id);
                      }}
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}