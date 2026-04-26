import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Target, Plus, ArrowRight, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { cn } from "@/lib/utils";

export default function GoalsProgressWidget({ goals = [] }) {
  // Filtrar apenas metas em progresso e ordenar por prioridade
  const activeGoals = goals
    .filter(g => g.status === "em_progresso")
    .sort((a, b) => {
      const progressA = (a.current_amount / a.target_amount) * 100;
      const progressB = (b.current_amount / b.target_amount) * 100;
      return progressB - progressA;
    })
    .slice(0, 3);

  const totalGoals = goals.filter(g => g.status === "em_progresso").length;
  const completedGoals = goals.filter(g => g.status === "concluida").length;

  if (activeGoals.length === 0) {
    return (
      <Card className="bg-gray-900 border-gray-700 p-4 lg:p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <Target className="h-4 w-4 text-emerald-400" />
          </div>
          <h3 className="font-semibold text-white text-sm lg:text-base">Metas Financeiras</h3>
        </div>
        <div className="text-center py-6">
          <Target className="h-10 w-10 text-gray-600 mx-auto mb-2 opacity-50" />
          <p className="text-sm text-gray-400 mb-3">Crie sua primeira meta financeira</p>
          <Link to={createPageUrl("FinancialPlanner")}>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-1" />
              Criar Meta
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900 border-gray-700 p-4 lg:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <Target className="h-4 w-4 text-emerald-400" />
          </div>
          <h3 className="font-semibold text-white text-sm lg:text-base">Metas Financeiras</h3>
        </div>
        <Link to={createPageUrl("FinancialPlanner")}>
          <Button variant="ghost" size="sm" className="text-emerald-400 hover:text-emerald-300">
            Ver Todas
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </Link>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">Em Progresso</p>
          <p className="text-xl lg:text-2xl font-bold text-white">{totalGoals}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">Concluídas</p>
          <p className="text-xl lg:text-2xl font-bold text-emerald-400">{completedGoals}</p>
        </div>
      </div>

      {/* Goals List */}
      <div className="space-y-3">
        {activeGoals.map((goal) => {
          const progress = (goal.current_amount / goal.target_amount) * 100;
          const remaining = goal.target_amount - goal.current_amount;
          const daysRemaining = Math.ceil((new Date(goal.target_date) - new Date()) / (1000 * 60 * 60 * 24));

          return (
            <div key={goal.id} className="p-3 bg-gray-800/30 border border-gray-700 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium text-xs lg:text-sm mb-0.5 truncate">
                    {goal.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {progress.toFixed(1)}%
                    </span>
                    {daysRemaining > 0 && (
                      <>
                        <span>•</span>
                        <span>{daysRemaining} dias</span>
                      </>
                    )}
                  </div>
                </div>
                <div className={cn(
                  "px-2 py-1 rounded text-[10px] font-medium",
                  progress >= 75 ? "bg-emerald-500/20 text-emerald-400" :
                  progress >= 50 ? "bg-blue-500/20 text-blue-400" :
                  progress >= 25 ? "bg-amber-500/20 text-amber-400" :
                  "bg-gray-600/20 text-gray-400"
                )}>
                  {progress >= 75 ? "Quase lá" : progress >= 50 ? "No caminho" : "Iniciando"}
                </div>
              </div>

              <Progress value={progress} className="h-2 mb-2" />

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">
                  R$ {goal.current_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-gray-500">
                  Faltam R$ {remaining.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}