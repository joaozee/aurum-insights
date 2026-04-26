import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Target, Calendar, TrendingUp, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

const CATEGORY_ICONS = {
  aposentadoria: "🏖️",
  imovel: "🏠",
  viagem: "✈️",
  educacao: "🎓",
  emergencia: "🚨",
  outro: "🎯"
};

const CATEGORY_LABELS = {
  aposentadoria: "Aposentadoria",
  imovel: "Imóvel",
  viagem: "Viagem",
  educacao: "Educação",
  emergencia: "Emergência",
  outro: "Outro"
};

export default function GoalsSection({ goals = [], userEmail, portfolio, onUpdate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    target_amount: "",
    target_date: "",
    category: "outro",
    monthly_contribution: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const goalData = {
        user_email: userEmail,
        title: formData.title,
        description: formData.description,
        target_amount: parseFloat(formData.target_amount) || 0,
        current_amount: editingGoal?.current_amount || 0,
        target_date: formData.target_date,
        category: formData.category,
        monthly_contribution: parseFloat(formData.monthly_contribution) || 0,
        status: editingGoal?.status || "em_progresso"
      };

      if (editingGoal) {
        await base44.entities.FinancialGoal.update(editingGoal.id, goalData);
      } else {
        await base44.entities.FinancialGoal.create(goalData);
      }

      setIsOpen(false);
      setEditingGoal(null);
      setFormData({ title: "", description: "", target_amount: "", target_date: "", category: "outro", monthly_contribution: "" });
      onUpdate?.();
    } catch (e) {
      console.log(e);
    }
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description || "",
      target_amount: goal.target_amount?.toString() || "",
      target_date: goal.target_date || "",
      category: goal.category || "outro",
      monthly_contribution: goal.monthly_contribution?.toString() || ""
    });
    setIsOpen(true);
  };

  const handleDelete = async (goalId) => {
    try {
      await base44.entities.FinancialGoal.delete(goalId);
      onUpdate?.();
    } catch (e) {
      console.log(e);
    }
  };

  const handleUpdateProgress = async (goal, newAmount) => {
    try {
      await base44.entities.FinancialGoal.update(goal.id, {
        current_amount: newAmount
      });
      onUpdate?.();
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Metas Financeiras</h2>
          <p className="text-gray-400">Defina e acompanhe seus objetivos</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            setEditingGoal(null);
            setFormData({ title: "", description: "", target_amount: "", target_date: "", category: "outro", monthly_contribution: "" });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg shadow-violet-500/30">
              <Plus className="h-4 w-4 mr-2" />
              Nova Meta
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingGoal ? "Editar Meta" : "Nova Meta Financeira"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="title" className="text-gray-300">Título da Meta</Label>
                  <Input
                    id="title"
                    placeholder="Ex: Aposentadoria tranquila"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="description" className="text-gray-300">Descrição</Label>
                  <Textarea
                    id="description"
                    placeholder="Descreva sua meta..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="category" className="text-gray-300">Categoria</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-800">
                      {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key} className="text-white">
                          {CATEGORY_ICONS[key]} {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="target_date" className="text-gray-300">Data Alvo</Label>
                  <Input
                    id="target_date"
                    type="date"
                    value={formData.target_date}
                    onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="target_amount" className="text-gray-300">Valor Alvo</Label>
                  <Input
                    id="target_amount"
                    type="number"
                    step="0.01"
                    placeholder="Ex: 500000"
                    value={formData.target_amount}
                    onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="monthly_contribution" className="text-gray-300">Aporte Mensal Planejado</Label>
                  <Input
                    id="monthly_contribution"
                    type="number"
                    step="0.01"
                    placeholder="Ex: 2000"
                    value={formData.monthly_contribution}
                    onChange={(e) => setFormData({ ...formData, monthly_contribution: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                >
                  {editingGoal ? "Atualizar" : "Criar Meta"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Goals List */}
      {goals.length === 0 ? (
        <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-violet-950/30 rounded-2xl border border-gray-800 p-12 text-center">
          <div className="h-16 w-16 rounded-2xl bg-violet-500/20 flex items-center justify-center mx-auto mb-4">
            <Target className="h-8 w-8 text-violet-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Nenhuma meta definida</h3>
          <p className="text-gray-400 mb-4">Comece definindo suas metas financeiras</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {goals.map((goal) => {
            const progress = goal.target_amount > 0 ? ((goal.current_amount || 0) / goal.target_amount) * 100 : 0;
            const remaining = goal.target_amount - (goal.current_amount || 0);
            const targetDate = new Date(goal.target_date);
            const monthsRemaining = Math.max(0, 
              (targetDate.getFullYear() - new Date().getFullYear()) * 12 +
              (targetDate.getMonth() - new Date().getMonth())
            );

            return (
              <div key={goal.id} className="bg-gradient-to-br from-gray-900 via-gray-900 to-violet-950/30 rounded-2xl border border-gray-800 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{CATEGORY_ICONS[goal.category]}</div>
                    <div>
                      <h3 className="font-semibold text-white">{goal.title}</h3>
                      <p className="text-sm text-gray-400">{CATEGORY_LABELS[goal.category]}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(goal)}
                      className="h-8 w-8 text-gray-400 hover:text-violet-400 hover:bg-violet-500/10"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(goal.id)}
                      className="h-8 w-8 text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {goal.description && (
                  <p className="text-sm text-gray-400 mb-4">{goal.description}</p>
                )}

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Progresso</span>
                      <span className="text-sm font-semibold text-white">{progress.toFixed(1)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-800/50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-1">Atual</p>
                      <p className="text-lg font-bold text-white">
                        R$ {(goal.current_amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                      </p>
                    </div>
                    <div className="bg-gray-800/50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-1">Meta</p>
                      <p className="text-lg font-bold text-violet-400">
                        R$ {goal.target_amount.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Calendar className="h-4 w-4" />
                      <span>{monthsRemaining} meses restantes</span>
                    </div>
                    <div className="flex items-center gap-2 text-amber-400">
                      <TrendingUp className="h-4 w-4" />
                      <span>R$ {remaining.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
                    </div>
                  </div>

                  {goal.monthly_contribution > 0 && (
                    <div className="pt-3 border-t border-gray-800">
                      <p className="text-xs text-gray-400 mb-1">Aporte mensal planejado</p>
                      <p className="text-sm font-semibold text-emerald-400">
                        R$ {goal.monthly_contribution.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}