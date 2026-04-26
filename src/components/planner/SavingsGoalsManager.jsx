import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Target, Plus, TrendingUp, Calendar, DollarSign, Trash2, Edit2, CheckCircle2, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const GOAL_CATEGORIES = [
  { value: 'emergencia', label: 'Reserva de Emergência', icon: '🛡️' },
  { value: 'aposentadoria', label: 'Aposentadoria', icon: '👴' },
  { value: 'imovel', label: 'Imóvel', icon: '🏠' },
  { value: 'viagem', label: 'Viagem', icon: '✈️' },
  { value: 'educacao', label: 'Educação', icon: '📚' },
  { value: 'outro', label: 'Outro', icon: '🎯' }
];

export default function SavingsGoalsManager({ userEmail, transactions }) {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_amount: '',
    target_date: '',
    category: 'outro',
    monthly_contribution: ''
  });

  useEffect(() => {
    if (userEmail) {
      loadGoals();
    }
  }, [userEmail]);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const goalsData = await base44.entities.FinancialGoal.filter({ 
        user_email: userEmail,
        status: 'em_progresso'
      });
      setGoals(goalsData.sort((a, b) => new Date(a.target_date) - new Date(b.target_date)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (goal) => {
    return Math.min((goal.current_amount / goal.target_amount) * 100, 100);
  };

  const calculateMonthsRemaining = (targetDate) => {
    const now = new Date();
    const target = new Date(targetDate);
    const months = Math.max(0, Math.ceil((target - now) / (1000 * 60 * 60 * 24 * 30)));
    return months;
  };

  const calculateRequiredMonthly = (goal) => {
    const remaining = goal.target_amount - goal.current_amount;
    const months = calculateMonthsRemaining(goal.target_date);
    return months > 0 ? remaining / months : 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const goalData = {
        user_email: userEmail,
        title: formData.title,
        description: formData.description,
        target_amount: parseFloat(formData.target_amount),
        target_date: formData.target_date,
        category: formData.category,
        monthly_contribution: parseFloat(formData.monthly_contribution) || 0,
        current_amount: editingGoal?.current_amount || 0,
        status: 'em_progresso'
      };

      if (editingGoal) {
        await base44.entities.FinancialGoal.update(editingGoal.id, goalData);
      } else {
        await base44.entities.FinancialGoal.create(goalData);
      }

      loadGoals();
      setDialogOpen(false);
      resetForm();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (goalId) => {
    if (confirm('Tem certeza que deseja excluir esta meta?')) {
      try {
        await base44.entities.FinancialGoal.delete(goalId);
        loadGoals();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description || '',
      target_amount: goal.target_amount.toString(),
      target_date: goal.target_date,
      category: goal.category,
      monthly_contribution: goal.monthly_contribution?.toString() || ''
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      target_amount: '',
      target_date: '',
      category: 'outro',
      monthly_contribution: ''
    });
    setEditingGoal(null);
  };

  if (loading) {
    return (
      <Card className="bg-gray-900 border-gray-800 p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48 bg-gray-800" />
          <Skeleton className="h-32 w-full bg-gray-800" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900 border-gray-800 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <Target className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Metas de Economia</h3>
            <p className="text-sm text-gray-400">Planeje e acompanhe seus objetivos financeiros</p>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Nova Meta
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md">
            <DialogHeader>
              <DialogTitle>{editingGoal ? 'Editar Meta' : 'Nova Meta de Economia'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Título da Meta</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Reserva de emergência"
                  required
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div>
                <Label htmlFor="category">Categoria</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {GOAL_CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="target_amount">Valor Alvo (R$)</Label>
                <Input
                  id="target_amount"
                  type="number"
                  step="0.01"
                  value={formData.target_amount}
                  onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                  placeholder="10000.00"
                  required
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div>
                <Label htmlFor="target_date">Data Alvo</Label>
                <Input
                  id="target_date"
                  type="date"
                  value={formData.target_date}
                  onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                  required
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div>
                <Label htmlFor="monthly_contribution">Contribuição Mensal Planejada (R$)</Label>
                <Input
                  id="monthly_contribution"
                  type="number"
                  step="0.01"
                  value={formData.monthly_contribution}
                  onChange={(e) => setFormData({ ...formData, monthly_contribution: e.target.value })}
                  placeholder="500.00"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detalhes sobre sua meta..."
                  className="bg-gray-800 border-gray-700 text-white"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="flex-1 border-gray-700">
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                  {editingGoal ? 'Atualizar' : 'Criar Meta'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Goals List */}
      {goals.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-800 rounded-xl">
          <Target className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 mb-2">Nenhuma meta de economia criada ainda</p>
          <p className="text-sm text-gray-500">Crie sua primeira meta para começar a planejar seu futuro financeiro</p>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => {
            const progress = calculateProgress(goal);
            const monthsRemaining = calculateMonthsRemaining(goal.target_date);
            const requiredMonthly = calculateRequiredMonthly(goal);
            const categoryIcon = GOAL_CATEGORIES.find(c => c.value === goal.category)?.icon || '🎯';
            const isOnTrack = goal.monthly_contribution >= requiredMonthly;

            return (
              <div key={goal.id} className="bg-gray-800/50 rounded-xl p-5 hover:bg-gray-800/70 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="text-2xl">{categoryIcon}</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-1">{goal.title}</h4>
                      {goal.description && (
                        <p className="text-sm text-gray-400 mb-2">{goal.description}</p>
                      )}
                      
                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-400">
                            R$ {goal.current_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de R$ {goal.target_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-xs font-medium text-emerald-400">{progress.toFixed(1)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-300">
                            {monthsRemaining} {monthsRemaining === 1 ? 'mês' : 'meses'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-300">
                            R$ {requiredMonthly.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
                          </span>
                        </div>
                      </div>

                      {/* Alert */}
                      {goal.monthly_contribution > 0 && (
                        <div className={`mt-3 flex items-start gap-2 text-xs p-2 rounded-lg ${
                          isOnTrack 
                            ? 'bg-emerald-500/10 text-emerald-400' 
                            : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {isOnTrack ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
                              <span>Sua contribuição de R$ {goal.monthly_contribution.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês está adequada para atingir a meta</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                              <span>Aumente sua contribuição para R$ {requiredMonthly.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês para atingir a meta no prazo</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(goal)}
                      className="text-gray-400 hover:text-white hover:bg-gray-700"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(goal.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}