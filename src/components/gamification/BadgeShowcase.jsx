import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { 
  Trophy, Award, Target, Flame, Star, Crown, 
  Users, BookOpen, MessageCircle, TrendingUp, CheckCircle2, Lock
} from "lucide-react";
import { cn } from "@/components/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const BADGE_ICONS = {
  Trophy, Award, Target, Flame, Star, Crown, 
  Users, BookOpen, MessageCircle, TrendingUp, CheckCircle2
};

export default function BadgeShowcase({ userEmail, userPoints }) {
  const [badges, setBadges] = useState([]);
  const [userAchievements, setUserAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBadges();
  }, [userEmail]);

  const loadBadges = async () => {
    try {
      const [allBadges, achievements] = await Promise.all([
        base44.entities.Badge.list(),
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

  const getProgress = (badge) => {
    if (!userPoints) return 0;
    
    const currentValue = {
      courses_completed: userPoints.courses_completed || 0,
      points: userPoints.total_points || 0,
      posts: userPoints.posts_created || 0,
      community_engagement: userPoints.community_engagement_score || 0
    }[badge.requirement_type] || 0;

    return Math.min((currentValue / badge.requirement_value) * 100, 100);
  };

  const colorClasses = {
    gold: "from-yellow-400 to-amber-500",
    silver: "from-gray-300 to-gray-400", 
    bronze: "from-orange-400 to-orange-500",
    purple: "from-purple-400 to-purple-500",
    green: "from-green-400 to-green-500",
    blue: "from-blue-400 to-blue-500",
    red: "from-red-400 to-red-500"
  };

  if (loading) {
    return <div className="text-gray-400">Carregando badges...</div>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {badges.map(badge => {
        const unlocked = isUnlocked(badge.id);
        const progress = getProgress(badge);
        const Icon = BADGE_ICONS[badge.icon] || Trophy;

        return (
          <div 
            key={badge.id}
            className={cn(
              "bg-gray-900 border rounded-2xl p-4 transition-all",
              unlocked 
                ? "border-gray-700 hover:border-violet-500/50 hover:shadow-xl hover:shadow-violet-500/10" 
                : "border-gray-800 opacity-60"
            )}
          >
            <div className="flex flex-col items-center text-center">
              <div className={cn(
                "h-16 w-16 rounded-2xl flex items-center justify-center mb-3 transition-all",
                unlocked 
                  ? `bg-gradient-to-br ${colorClasses[badge.color]} shadow-lg`
                  : "bg-gray-800"
              )}>
                {unlocked ? (
                  <Icon className="h-8 w-8 text-white" />
                ) : (
                  <Lock className="h-8 w-8 text-gray-600" />
                )}
              </div>

              <h4 className={cn(
                "font-semibold text-sm mb-1",
                unlocked ? "text-white" : "text-gray-500"
              )}>
                {badge.name}
              </h4>

              <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                {badge.description}
              </p>

              {!unlocked && (
                <div className="w-full space-y-1">
                  <Progress 
                    value={progress} 
                    className="h-1.5 bg-gray-800"
                  />
                  <p className="text-xs text-gray-600">
                    {Math.round(progress)}%
                  </p>
                </div>
              )}

              {unlocked && (
                <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 text-xs">
                  Desbloqueada
                </Badge>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}