import { Progress } from "@/components/ui/progress";
import { Trophy, Zap } from "lucide-react";

export function calculateLevel(points) {
  // Níveis exponenciais: 0-100 (nível 1), 100-300 (nível 2), 300-600 (nível 3), etc
  let level = 1;
  let pointsRequired = 100;
  let totalRequired = 0;
  
  while (points >= totalRequired + pointsRequired) {
    totalRequired += pointsRequired;
    level++;
    pointsRequired = level * 100; // Aumenta 100 pontos por nível
  }
  
  const pointsInCurrentLevel = points - totalRequired;
  const pointsForNextLevel = level * 100;
  const progress = (pointsInCurrentLevel / pointsForNextLevel) * 100;
  
  return { level, progress, pointsInCurrentLevel, pointsForNextLevel };
}

export function getLevelTitle(level) {
  if (level >= 50) return "Lenda dos Investimentos";
  if (level >= 40) return "Mestre Investidor";
  if (level >= 30) return "Expert em Finanças";
  if (level >= 20) return "Investidor Avançado";
  if (level >= 15) return "Investidor Experiente";
  if (level >= 10) return "Investidor Intermediário";
  if (level >= 5) return "Investidor Iniciante";
  return "Aprendiz";
}

export default function LevelDisplay({ points, compact = false }) {
  const { level, progress, pointsInCurrentLevel, pointsForNextLevel } = calculateLevel(points);
  const title = getLevelTitle(level);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
          <span className="text-white text-sm font-bold">{level}</span>
        </div>
        <div className="text-xs">
          <p className="text-gray-300 font-semibold">Nível {level}</p>
          <p className="text-gray-500">{title}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-violet-900/30 rounded-2xl border border-gray-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <span className="text-white text-2xl font-bold">{level}</span>
          </div>
          <div>
            <p className="text-gray-400 text-xs">Seu Nível</p>
            <h3 className="text-white font-bold text-xl">{title}</h3>
          </div>
        </div>
        <div className="text-right">
          <p className="text-gray-400 text-xs">XP Total</p>
          <p className="text-violet-400 font-bold text-xl">{points.toLocaleString('pt-BR')}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Progresso para Nível {level + 1}</span>
          <span className="text-violet-400 font-semibold">
            {pointsInCurrentLevel} / {pointsForNextLevel} XP
          </span>
        </div>
        <Progress 
          value={progress} 
          className="h-3 bg-gray-800"
        />
        <p className="text-gray-500 text-xs">
          Faltam {pointsForNextLevel - pointsInCurrentLevel} XP para o próximo nível
        </p>
      </div>
    </div>
  );
}