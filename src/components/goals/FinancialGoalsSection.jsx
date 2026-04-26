import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { base44 } from "@/api/base44Client";
import { Plus, Target, TrendingUp, Calendar, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import AddGoalDialog from "./AddGoalDialog";
import GoalRecommendations from "./GoalRecommendations";

export default function FinancialGoalsSection({ userEmail, portfolioData }) {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);

  useEffect(() => {
    if (userEmail) {
      loadGoals();
    }
  }, [userEmail]);

  const loadGoals = async () => {
    try {
      const data = await base44.entities.FinancialGoal.filter({
        user_email: userEmail,
        status: { $in: ["em_progresso", "concluida"] }
      });
      setGoals(data || []);
    } catch (err) {
      console.error("Erro ao carregar metas:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGoal = async (goalData) => {
    try {
      if (selectedGoal?.id) {
        await base44.entities.FinancialGoal.update(selectedGoal.id, goalData);
      } else {
        await base44.entities.FinancialGoal.create({
          ...goalData,
          user_email: userEmail
        });
      }
      setDialogOpen(false);
      setSelectedGoal(null);
      await loadGoals();
    } catch (err) {
      console.error("Erro ao salvar meta:", err);
    }
  };

  const calculateDaysRemaining = (targetDate) => {
    const today = new Date();
    const target = new Date(targetDate);
    const days = Math.floor((target - today) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  const getProgressPercentage = (current, target) => {
    return Math.min(100, Math.max(0, (current / target) * 100));
  };

  const getStatusColor = (percentage) => {
    if (percentage >= 100) return "bg-emerald-500";
    if (percentage >= 75) return "bg-blue-500";
    if (percentage >= 50) return "bg-amber-500";
    return "bg-red-500";
  };

  if (loading) {
    return <div className="animate-pulse h-32 bg-gray-900 rounded-lg" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Target className="h-6 w-6 text-violet-400" />
            Metas Financeiras
          </h2>
          <p className="text-gray-400 text-sm mt-1">Acompanhe seu progresso em direção aos seus objetivos</p>
        </div>
        <Button
          onClick={() => {
            setSelectedGoal(null);
            setDialogOpen(true);
          }}
          className="bg-violet-600 hover:bg-violet-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Meta
        </Button>
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <Card className="bg-gray-900 border-gray-800 border-dashed">
          <CardContent className="pt-8 pb-8 text-center">
            <Target className="h-12 w-12 text-gray-700 mx-auto mb-4 opacity-50" />
            <p className="text-gray-400 mb-4">Nenhuma meta criada ainda</p>
            <Button
              onClick={() => setDialogOpen(true)}
              variant="outline"
              className="border-gray-700"
            >
              Criar Primeira Meta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {goals.map((goal) => {
            const progress = getProgressPercentage(goal.current_amount, goal.target_amount);
            const daysLeft = calculateDaysRemaining(goal.target_date);
            const monthlyNeeded = daysLeft > 0 ? (goal.target_amount - goal.current_amount) / (daysLeft / 30) : 0;

            return (
              <Card key={goal.id} className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-800 hover:border-gray-700 transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-white">{goal.title}</CardTitle>
                      <p className="text-xs text-gray-500 mt-1">{goal.category}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedGoal(goal);
                        setDialogOpen(true);
                      }}
                      className="text-gray-400 hover:text-gray-300"
                    >
                      ✎
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Progresso</span>
                      <span className="font-bold text-white">{progress.toFixed(0)}%</span>
                    </div>
                    <Progress
                      value={progress}
                      className="h-2 bg-gray-800"
                    />
                  </div>

                  {/* Amount Info - Different display for quantity goals */}
                  <div className="grid grid-cols-2 gap-4 py-3 border-y border-gray-700">
                    <div>
                      <p className="text-xs text-gray-500">
                        {goal.metadata?.target_quantity ? "Quantidade Atual" : "Acumulado"}
                      </p>
                      <p className="text-lg font-bold text-emerald-400">
                        {goal.metadata?.target_quantity 
                          ? `${goal.metadata?.current_quantity || 0} ações`
                          : `R$ ${goal.current_amount.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`
                        }
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Meta</p>
                      <p className="text-lg font-bold text-white">
                        {goal.metadata?.target_quantity 
                          ? `${goal.metadata?.target_quantity} ações`
                          : `R$ ${goal.target_amount.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`
                        }
                      </p>
                    </div>
                  </div>

                  {/* Timeline & Contribution */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Calendar className="h-4 w-4" />
                      <span>{daysLeft} dias restantes</span>
                    </div>
                    {!goal.metadata?.target_quantity && monthlyNeeded > 0 && (
                      <div className="flex items-center gap-2 text-sm text-violet-400 bg-violet-500/10 px-3 py-2 rounded-lg">
                        <TrendingUp className="h-4 w-4" />
                        <span>R$ {monthlyNeeded.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} / mês necessários</span>
                      </div>
                    )}
                    {goal.metadata?.target_quantity && (
                      <div className="flex items-center gap-2 text-sm text-violet-400 bg-violet-500/10 px-3 py-2 rounded-lg">
                        <TrendingUp className="h-4 w-4" />
                        <span>Meta de {goal.metadata?.asset_ticker}</span>
                      </div>
                    )}
                  </div>

                  {/* Status Indicator */}
                  {progress >= 100 && (
                    <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-lg">
                      ✓ Meta atingida!
                    </div>
                  )}
                  {daysLeft <= 0 && progress < 100 && (
                    <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">
                      <AlertCircle className="h-4 w-4" />
                      Prazo expirado
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* AI Recommendations */}
      {goals.length > 0 && portfolioData && (
        <GoalRecommendations
          goals={goals}
          portfolioData={portfolioData}
          userEmail={userEmail}
        />
      )}

      {/* Dialog */}
      <AddGoalDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        goal={selectedGoal}
        onSave={handleSaveGoal}
      />
    </div>
  );
}