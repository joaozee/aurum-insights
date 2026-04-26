import { Users, MessageSquare, Lock, TrendingUp, HelpCircle, Lightbulb, Target, BarChart3 } from "lucide-react";
import { cn } from "@/components/lib/utils";

const iconMap = {
  "TrendingUp": TrendingUp,
  "HelpCircle": HelpCircle,
  "Lightbulb": Lightbulb,
  "Target": Target,
  "BarChart3": BarChart3
};

const colorClasses = {
  blue: "bg-gradient-to-br from-blue-900/50 to-blue-950/30 border-blue-500/20 hover:border-blue-500/40",
  purple: "bg-gradient-to-br from-purple-900/50 to-purple-950/30 border-purple-500/20 hover:border-purple-500/40",
  emerald: "bg-gradient-to-br from-emerald-900/50 to-emerald-950/30 border-emerald-500/20 hover:border-emerald-500/40",
  amber: "bg-gradient-to-br from-amber-900/50 to-amber-950/30 border-amber-500/20 hover:border-amber-500/40",
  red: "bg-gradient-to-br from-red-900/50 to-red-950/30 border-red-500/20 hover:border-red-500/40",
  pink: "bg-gradient-to-br from-pink-900/50 to-pink-950/30 border-pink-500/20 hover:border-pink-500/40"
};

const iconColorClasses = {
  blue: "text-blue-400 bg-blue-500/20",
  purple: "text-purple-400 bg-purple-500/20",
  emerald: "text-emerald-400 bg-emerald-500/20",
  amber: "text-amber-400 bg-amber-500/20",
  red: "text-red-400 bg-red-500/20",
  pink: "text-pink-400 bg-pink-500/20"
};

export default function GroupCard({ group, onClick }) {
  const Icon = iconMap[group.icon] || Users;
  const isLocked = group.is_premium_only;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-2xl border p-5 transition-all cursor-pointer",
        colorClasses[group.color]
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", iconColorClasses[group.color])}>
          <Icon className="h-6 w-6" />
        </div>
        {isLocked && (
          <Lock className={cn("h-4 w-4", iconColorClasses[group.color].split(" ")[0])} />
        )}
      </div>
      
      <h3 className="font-semibold text-white mb-1">{group.name}</h3>
      <p className="text-sm text-gray-400 mb-4 line-clamp-2">{group.description}</p>
      
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4" />
          <span>{group.member_count}</span>
        </div>
        <div className="flex items-center gap-1">
          <MessageSquare className="h-4 w-4" />
          <span>{group.posts_count}</span>
        </div>
      </div>
    </button>
  );
}