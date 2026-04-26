import { Shield, Trophy, Flame } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const ACHIEVEMENT_ICONS = {
  milestone: Trophy,
  activity: Flame,
  course: Shield,
  community: Trophy
};

export default function AchievementCard({ achievement }) {
  const Icon = ACHIEVEMENT_ICONS[achievement.type] || Trophy;

  const colorClasses = {
    gold: "from-yellow-400 to-amber-500",
    silver: "from-gray-300 to-gray-400",
    bronze: "from-orange-400 to-orange-500",
    purple: "from-purple-400 to-purple-500",
    green: "from-green-400 to-green-500",
    blue: "from-blue-400 to-blue-500",
    red: "from-red-400 to-red-500"
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
      <div className={`bg-gradient-to-br ${colorClasses[achievement.color]} rounded-xl p-3 flex items-center justify-center`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900">{achievement.badge_name}</h3>
        <p className="text-sm text-gray-500">
          Desbloqueado em {format(new Date(achievement.unlocked_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>
      <div className="text-xs font-medium text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
        {achievement.type === 'milestone' && '🏆'}
        {achievement.type === 'activity' && '🔥'}
        {achievement.type === 'course' && '📚'}
        {achievement.type === 'community' && '👥'}
      </div>
    </div>
  );
}