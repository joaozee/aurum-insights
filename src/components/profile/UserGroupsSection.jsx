import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Crown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function UserGroupsSection({ userEmail }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userEmail) {
      loadGroups();
    }
  }, [userEmail]);

  const loadGroups = async () => {
    try {
      const memberships = await base44.entities.GroupMember.filter({
        user_email: userEmail
      });

      const allGroups = await base44.entities.CommunityGroup.list();
      const userGroups = allGroups.filter(g => 
        memberships.some(m => m.group_id === g.id)
      );

      // Add role to each group
      const groupsWithRole = userGroups.map(g => {
        const membership = memberships.find(m => m.group_id === g.id);
        return { ...g, userRole: membership?.role };
      });

      setGroups(groupsWithRole);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, idx) => (
              <Skeleton key={idx} className="h-16" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const iconColors = {
    blue: "bg-blue-500",
    purple: "bg-purple-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
    pink: "bg-pink-500"
  };

  return (
    <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-violet-500" />
          Grupos ({groups.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {groups.length > 0 ? (
          <div className="space-y-3">
            {groups.map((group) => (
              <Link
                key={group.id}
                to={createPageUrl("Messages") + `?group=${group.id}`}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
              >
                <div className={`h-12 w-12 rounded-full ${iconColors[group.color]} flex items-center justify-center flex-shrink-0`}>
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                      {group.name}
                    </h4>
                    {group.userRole === 'admin' && (
                      <Crown className="h-3 w-3 text-amber-500" />
                    )}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {group.member_count} membros • {group.userRole === 'admin' ? 'Admin' : 'Membro'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">
              Não participa de nenhum grupo ainda
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}