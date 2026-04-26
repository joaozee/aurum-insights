import { Trophy, Star, Award, Target, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export default function GamificationPanel({ userPoints, recentAchievements, nextBadge }) {
  const level = Math.floor((userPoints?.total_points || 0) / 100) + 1;
  const pointsInLevel = (userPoints?.total_points || 0) % 100;
  const pointsToNextLevel = 100 - pointsInLevel;

  return (
    <Card className="bg-gradient-to-br from-violet-950/50 to-purple-950/50 border-violet-800/30 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center">
          <Trophy className="h-6 w-6 text-gray-900" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Seu Progresso</h3>
          <p className="text-sm text-violet-300">Continue aprendendo e conquiste badges</p>
        </div>
      </div>

      {/* Level and Points */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-violet-300">Nível</p>
            <p className="text-2xl font-bold text-white flex items-center gap-2">
              {level}
              <Badge className="bg-amber-500/20 text-amber-400 border-0">
                <Star className="h-3 w-3 mr-1" />
                {userPoints?.total_points || 0} pts
              </Badge>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-violet-300">Próximo nível</p>
            <p className="text-lg font-semibold text-white">{pointsToNextLevel} pts</p>
          </div>
        </div>
        <Progress value={pointsInLevel} className="h-2 bg-violet-950" />
      </div>

      {/* Points Breakdown */}
      <div className="bg-gray-900/50 rounded-xl p-4 mb-6 border border-violet-800/20">
        <p className="text-xs font-semibold text-violet-300 uppercase mb-3">Pontos por Categoria</p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-300 flex items-center gap-2">
              <Award className="h-4 w-4 text-violet-400" />
              Aulas completadas
            </span>
            <span className="font-semibold text-white">{userPoints?.points_from_lessons || 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-400" />
              Cursos finalizados
            </span>
            <span className="font-semibold text-white">{userPoints?.points_from_courses || 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300 flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-400" />
              Comunidade
            </span>
            <span className="font-semibold text-white">{userPoints?.points_from_community || 0}</span>
          </div>
        </div>
      </div>

      {/* Recent Achievements */}
      {recentAchievements && recentAchievements.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-violet-300 uppercase mb-3">Conquistas Recentes</p>
          <div className="space-y-2">
            {recentAchievements.slice(0, 3).map((achievement) => (
              <div 
                key={achievement.id}
                className="flex items-center gap-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20"
              >
                <Trophy className="h-5 w-5 text-amber-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{achievement.badge_name}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(achievement.unlocked_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Badge */}
      {nextBadge && (
        <div className="bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-amber-400" />
            <p className="text-xs font-semibold text-amber-300 uppercase">Próxima Conquista</p>
          </div>
          <p className="text-sm font-medium text-white mb-2">{nextBadge.name}</p>
          <p className="text-xs text-gray-300">{nextBadge.description}</p>
        </div>
      )}
    </Card>
  );
}