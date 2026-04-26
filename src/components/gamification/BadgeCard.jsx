import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";

const BADGE_ICONS = {
  star: "⭐",
  trophy: "🏆",
  flame: "🔥",
  rocket: "🚀",
  crown: "👑",
  target: "🎯",
  zap: "⚡",
  heart: "❤️",
  brain: "🧠",
  book: "📚",
  users: "👥",
  gem: "💎"
};

const COLOR_CLASSES = {
  gold: "bg-gradient-to-br from-yellow-300 to-yellow-400 text-black",
  silver: "bg-gradient-to-br from-gray-300 to-gray-400 text-gray-900",
  bronze: "bg-gradient-to-br from-orange-300 to-orange-400 text-black",
  purple: "bg-gradient-to-br from-purple-400 to-purple-500 text-white",
  green: "bg-gradient-to-br from-green-400 to-green-500 text-white",
  blue: "bg-gradient-to-br from-blue-400 to-blue-500 text-white",
  red: "bg-gradient-to-br from-red-400 to-red-500 text-white"
};

export default function BadgeCard({ badge, unlocked = false, progress = null }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={cn(
        "relative h-24 w-24 rounded-2xl flex items-center justify-center text-5xl transition-all duration-300",
        unlocked ? COLOR_CLASSES[badge.color] : "bg-gray-200 text-gray-400",
        !unlocked && "opacity-50 grayscale"
      )}>
        {BADGE_ICONS[badge.icon] || "🏅"}
        {!unlocked && (
          <div className="absolute inset-0 rounded-2xl flex items-center justify-center bg-black/20">
            <Lock className="h-6 w-6 text-white" />
          </div>
        )}
        {unlocked && (
          <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">
            ✓
          </div>
        )}
      </div>
      <div className="text-center max-w-xs">
        <h3 className="font-semibold text-gray-900 text-sm">{badge.name}</h3>
        <p className="text-gray-600 text-xs">{badge.description}</p>
        {progress !== null && !unlocked && (
          <p className="text-amber-600 font-medium text-xs mt-1">
            {progress}%
          </p>
        )}
      </div>
    </div>
  );
}