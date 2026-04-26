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

export default function GoalsWidget({ goals = [], userEmail, onUpdate }) {
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
    await base44.entities.FinancialGoal.delete(goalId);
    onUpdate?.();
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-violet-950/20 border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <Target className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Metas Financeiras</h2>
            <p className="text-sm text-gray-400">Acompanhe seus objetivos</p>
          </div>
        </div>
        
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            setEditingGoal(null);
            setFormData({ title: "", description: "", target_amount: "", target_date: "", category: "outro", monthly_contribution: "" });
          }
        }}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-violet-500 hover:bg-violet-600">
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
                  <Label className="text-gray-300">Título da Meta</Label>
                  <Input
                    placeholder="Ex: Aposentadoria tranquila"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-gray-300">Descrição</Label>
                  <Textarea
                    placeholder="Descreva sua meta..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Categoria</Label>
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
                  <Label className="text-gray-300">Data Alvo</Label>
                  <Input
                    type="date"
                    value={formData.target_date}
                    onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                    required
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Valor Alvo</Label>
                  <Input
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
                  <Label className="text-gray-300">Aporte Mensal Planejado</Label>
                  <Input
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
                  className="flex-1 bg-violet-500 hover:bg-violet-600"
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
        <div className="text-center py-8">
          <Target className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Nenhuma meta definida ainda</p>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.slice(0, 3).map((goal) => {
            const progress = goal.target_amount > 0 ? ((goal.current_amount || 0) / goal.target_amount) * 100 : 0;
            const remaining = goal.target_amount - (goal.current_amount || 0);
            const targetDate = new Date(goal.target_date);
            const monthsRemaining = Math.max(0, 
              (targetDate.getFullYear() - new Date().getFullYear()) * 12 +
              (targetDate.getMonth() - new Date().getMonth())
            );

            return (
              <div key={goal.id} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 hover:border-violet-500/30 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{CATEGORY_ICONS[goal.category]}</span>
                    <div>
                      <h3 className="font-semibold text-white text-sm">{goal.title}</h3>
                      <p className="text-xs text-gray-400">{CATEGORY_LABELS[goal.category]}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(goal)}
                      className="h-7 w-7 text-gray-400 hover:text-violet-400"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(goal.id)}
                      className="h-7 w-7 text-gray-400 hover:text-red-400"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-400">Progresso</span>
                      <span className="text-xs font-semibold text-violet-400">{progress.toFixed(1)}%</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-gray-400">R$ </span>
                      <span className="text-white font-semibold">
                        {(goal.current_amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                      </span>
                      <span className="text-gray-500"> / </span>
                      <span className="text-violet-400 font-semibold">
                        {goal.target_amount.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-400">
                      <Calendar className="h-3 w-3" />
                      <span>{monthsRemaining} meses</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}