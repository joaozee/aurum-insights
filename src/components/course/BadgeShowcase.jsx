import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Trophy, Lock, Award } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function BadgeShowcase({ userEmail }) {
  const [badges, setBadges] = useState([]);
  const [userAchievements, setUserAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userEmail) {
      loadBadges();
    }
  }, [userEmail]);

  const loadBadges = async () => {
    try {
      const [allBadges, achievements] = await Promise.all([
        base44.entities.Badge.filter({ type: "course" }),
        base44.entities.UserAchievement.filter({ user_email: userEmail })
      ]);

      setBadges(allBadges);
      setUserAchievements(achievements);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isUnlocked = (badgeId) => {
    return userAchievements.some(a => a.badge_id === badgeId);
  };

  const colorClasses = {
    gold: "from-amber-400 to-yellow-500",
    silver: "from-gray-300 to-gray-400",
    bronze: "from-orange-400 to-amber-600",
    purple: "from-purple-400 to-violet-500",
    green: "from-emerald-400 to-green-500",
    blue: "from-blue-400 to-cyan-500"
  };

  if (loading) {
    return (
      <Card className="bg-gray-900 border-gray-800 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-6 w-6 bg-gray-800" />
          <Skeleton className="h-6 w-32 bg-gray-800" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 bg-gray-800 rounded-xl" />
          ))}
        </div>
      </Card>
    );
  }

  if (badges.length === 0) return null;

  return (
    <Card className="bg-gray-900 border-gray-800 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="h-5 w-5 text-amber-400" />
        <h3 className="text-lg font-semibold text-white">Badges de Cursos</h3>
        <Badge className="bg-violet-500/20 text-violet-400 border-0 ml-auto">
          {userAchievements.length}/{badges.length}
        </Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {badges.map((badge) => {
          const unlocked = isUnlocked(badge.id);
          
          return (
            <div
              key={badge.id}
              className={cn(
                "relative rounded-xl p-4 text-center transition-all duration-300",
                unlocked 
                  ? "bg-gradient-to-br opacity-100 hover:scale-105 cursor-pointer" 
                  : "bg-gray-800/50 opacity-40 grayscale",
                unlocked && colorClasses[badge.color]
              )}
            >
              {!unlocked && (
                <div className="absolute top-2 right-2">
                  <Lock className="h-4 w-4 text-gray-500" />
                </div>
              )}
              
              <div className="mb-2 flex justify-center">
                <div className={cn(
                  "h-12 w-12 rounded-full flex items-center justify-center",
                  unlocked ? "bg-white/20" : "bg-gray-700"
                )}>
                  <Trophy className={cn(
                    "h-6 w-6",
                    unlocked ? "text-white" : "text-gray-500"
                  )} />
                </div>
              </div>
              
              <p className={cn(
                "text-sm font-semibold mb-1 line-clamp-2",
                unlocked ? "text-white" : "text-gray-500"
              )}>
                {badge.name}
              </p>
              
              {unlocked && (
                <p className="text-xs text-white/80 line-clamp-2">
                  {badge.description}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}