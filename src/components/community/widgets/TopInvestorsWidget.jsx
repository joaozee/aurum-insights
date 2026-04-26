import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Award } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

export default function TopInvestorsWidget() {
  const [topUsers, setTopUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTopInvestors();
  }, []);

  const loadTopInvestors = async () => {
    try {
      const points = await base44.entities.UserPoints.list("-total_points", 5);
      setTopUsers(points);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 p-4">
        <Skeleton className="h-4 w-32 mb-4" />
        <div className="space-y-3">
          {[...Array(3)].map((_, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-3 w-24 mb-1" />
                <Skeleton className="h-2 w-16" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Top investidores</h4>
        <Award className="h-4 w-4 text-gray-400" />
      </div>
      <div className="space-y-3">
        {topUsers.slice(0, 3).map((user, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-violet-500/20 text-violet-400 text-xs">
                {idx + 1}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                Investidor {idx + 1}
              </p>
              <p className="text-xs text-gray-500">{user.total_points || 0} pontos</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}