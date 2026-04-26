import { CheckCircle2, Circle, Lock, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function VisualProgressTracker({ course, enrollment }) {
  const completedLessons = enrollment?.completed_lessons || [];
  const completedModules = enrollment?.completed_modules || [];

  const getModuleProgress = (moduleIndex, module) => {
    const totalLessons = module.lessons?.length || 0;
    const completedCount = module.lessons?.filter((_, lessonIndex) => 
      completedLessons.includes(`${moduleIndex}-${lessonIndex}`)
    ).length || 0;
    return totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  };

  return (
    <Card className="bg-gray-900 border-gray-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Progresso do Curso</h3>
        <div className="text-2xl font-bold text-violet-400">
          {enrollment?.progress || 0}%
        </div>
      </div>

      <Progress value={enrollment?.progress || 0} className="h-2 mb-8" />

      <div className="space-y-4">
        {course.modules?.map((module, moduleIndex) => {
          const moduleProgress = getModuleProgress(moduleIndex, module);
          const isCompleted = completedModules.includes(moduleIndex);
          const isUnlocked = moduleIndex === 0 || completedModules.includes(moduleIndex - 1);

          return (
            <div key={moduleIndex} className="relative">
              {moduleIndex > 0 && (
                <div className="absolute left-3 -top-4 h-4 w-0.5 bg-gray-800" />
              )}
              
              <div className={`flex items-start gap-3 p-4 rounded-lg border transition-all ${
                isCompleted 
                  ? "bg-violet-500/10 border-violet-500/30" 
                  : isUnlocked
                  ? "bg-gray-800/50 border-gray-700"
                  : "bg-gray-800/30 border-gray-800"
              }`}>
                <div className="flex-shrink-0 mt-1">
                  {isCompleted ? (
                    <div className="h-6 w-6 rounded-full bg-violet-500 flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    </div>
                  ) : isUnlocked ? (
                    <div className="h-6 w-6 rounded-full border-2 border-gray-600 flex items-center justify-center">
                      <Circle className="h-3 w-3 text-gray-600" />
                    </div>
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-gray-800 flex items-center justify-center">
                      <Lock className="h-3 w-3 text-gray-600" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className={`font-medium ${isUnlocked ? "text-white" : "text-gray-500"}`}>
                      {module.title}
                    </h4>
                    {isCompleted && (
                      <Trophy className="h-4 w-4 text-amber-400" />
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>
                      {module.lessons?.filter((_, i) => completedLessons.includes(`${moduleIndex}-${i}`)).length || 0} / {module.lessons?.length || 0} aulas
                    </span>
                    <div className="flex-1">
                      <Progress value={moduleProgress} className="h-1" />
                    </div>
                    <span className="font-medium text-violet-400">
                      {moduleProgress}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}