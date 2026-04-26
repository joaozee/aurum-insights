import { Award } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LevelBadge({ points }) {
  const calculateLevel = (pts) => {
    if (pts < 100) return 1;
    if (pts < 300) return 2;
    if (pts < 600) return 3;
    if (pts < 1000) return 4;
    if (pts < 1500) return 5;
    return 6;
  };

  const getLevelName = (level) => {
    const names = ["Bronze", "Prata", "Ouro", "Platina", "Diamante", "Lendário"];
    return names[level - 1];
  };

  const getLevelColor = (level) => {
    const colors = {
      1: "from-amber-600 to-amber-700",
      2: "from-gray-400 to-gray-500",
      3: "from-yellow-400 to-yellow-500",
      4: "from-blue-400 to-blue-500",
      5: "from-purple-400 to-purple-500",
      6: "from-red-400 to-red-500"
    };
    return colors[level];
  };

  const level = calculateLevel(points);

  return (
    <div className={cn(
      "h-12 w-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg",
      `from-${getLevelColor(level)}`
    )}>
      <Award className="h-6 w-6 text-white" />
    </div>
  );
}