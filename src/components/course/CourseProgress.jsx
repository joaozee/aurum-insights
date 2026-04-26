import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, BookOpen } from "lucide-react";

export default function CourseProgress({ course, enrollment }) {
  const totalLessons = course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0;
  const completedLessons = enrollment.completed_lessons?.length || 0;
  const progress = enrollment.progress || 0;

  return (
    <Card className="bg-gray-900 border-gray-800 p-6">
      <div className="text-center mb-6">
        <div className="h-16 w-16 rounded-full bg-violet-500/20 flex items-center justify-center mx-auto mb-3 border border-violet-500/30">
          <span className="text-2xl font-bold text-violet-400">{progress}%</span>
        </div>
        <h3 className="font-semibold text-white mb-1">Seu Progresso</h3>
        <p className="text-sm text-gray-400">
          {completedLessons} de {totalLessons} aulas concluídas
        </p>
      </div>

      <Progress value={progress} className="mb-6 h-2 bg-gray-800" />

      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50">
          <BookOpen className="h-5 w-5 text-violet-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-white">Aulas</p>
            <p className="text-xs text-gray-400">
              {totalLessons} aulas disponíveis
            </p>
          </div>
        </div>

        {progress === 100 && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-emerald-400">Curso Completo!</p>
              <p className="text-xs text-emerald-300">Parabéns!</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}