import { Award } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LevelIndicator({ points }) {
  const calculateLevel = (pts) => {
    if (pts < 100) return 1;
    if (pts < 300) return 2;
    if (pts < 600) return 3;
    if (pts < 1000) return 4;
    if (pts < 1500) return 5;
    return 6;
  };

  const getNextLevelPoints = (pts) => {
    const thresholds = [100, 300, 600, 1000, 1500, Infinity];
    for (let threshold of thresholds) {
      if (pts < threshold) return threshold;
    }
    return Infinity;
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
  const nextLevelPoints = getNextLevelPoints(points);
  const progressToNextLevel = nextLevelPoints === Infinity 
    ? 100 
    : Math.round((points / nextLevelPoints) * 100);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "h-16 w-16 rounded-2xl bg-gradient-to-br flex items-center justify-center",
            `from-${getLevelColor(level)}`
          )}>
            <Award className="h-8 w-8 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Nível Atual</p>
            <p className="text-2xl font-bold text-gray-900">{getLevelName(level)}</p>
            <p className="text-xs text-gray-500">Nível {level}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Progresso</span>
          <span className="font-medium text-gray-900">{progressToNextLevel}%</span>
        </div>
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full bg-gradient-to-r transition-all duration-300",
              `from-${getLevelColor(level)}`
            )}
            style={{ width: `${progressToNextLevel}%` }}
          />
        </div>
        {nextLevelPoints !== Infinity && (
          <p className="text-xs text-gray-500 text-center mt-2">
            {nextLevelPoints - points} pontos para o próximo nível
          </p>
        )}
      </div>
    </div>
  );
}