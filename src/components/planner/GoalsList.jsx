import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Target, Calendar, DollarSign, TrendingUp, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export default function GoalsList({ goals, userEmail, onGoalsChange }) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    target_amount: "",
    current_amount: "0",
    target_date: "",
    category: "outro",
    monthly_contribution: "0"
  });

  const handleOpenDialog = (goal = null) => {
    if (goal) {
      setEditingGoal(goal);
      setFormData({
        title: goal.title,
        description: goal.description || "",
        target_amount: goal.target_amount,
        current_amount: goal.current_amount || 0,
        target_date: goal.target_date,
        category: goal.category,
        monthly_contribution: goal.monthly_contribution || 0
      });
    } else {
      setEditingGoal(null);
      setFormData({
        title: "",
        description: "",
        target_amount: "",
        current_amount: "0",
        target_date: "",
        category: "outro",
        monthly_contribution: "0"
      });
    }
    setShowDialog(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const goalData = {
      ...formData,
      user_email: userEmail,
      target_amount: parseFloat(formData.target_amount),
      current_amount: parseFloat(formData.current_amount),
      monthly_contribution: parseFloat(formData.monthly_contribution)
    };

    try {
      if (editingGoal) {
        await base44.entities.FinancialGoal.update(editingGoal.id, goalData);
        toast.success("Meta atualizada com sucesso!");
      } else {
        await base44.entities.FinancialGoal.create(goalData);
        toast.success("Meta criada com sucesso!");
      }
      setShowDialog(false);
      onGoalsChange();
    } catch (error) {
      toast.error("Erro ao salvar meta");
    }
  };

  const handleDelete = async (goalId) => {
    if (confirm("Tem certeza que deseja excluir esta meta?")) {
      try {
        await base44.entities.FinancialGoal.delete(goalId);
        toast.success("Meta excluída");
        onGoalsChange();
      } catch (error) {
        toast.error("Erro ao excluir meta");
      }
    }
  };

  const calculateProgress = (goal) => {
    return Math.min((goal.current_amount / goal.target_amount) * 100, 100);
  };

  const categoryIcons = {
    aposentadoria: "🏖️",
    imovel: "🏠",
    viagem: "✈️",
    educacao: "🎓",
    emergencia: "🚨",
    outro: "🎯"
  };

  return (
    <div>
      {/* Add Goal Button */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-400 text-sm">
          {goals.length} {goals.length === 1 ? 'meta cadastrada' : 'metas cadastradas'}
        </p>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="bg-violet-600 hover:bg-violet-700">
              <Plus className="h-4 w-4 mr-2" />
              Nova Meta
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md">
            <DialogHeader>
              <DialogTitle>{editingGoal ? 'Editar Meta' : 'Nova Meta Financeira'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Título da Meta</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Ex: Aposentadoria aos 60"
                  required
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Detalhes sobre sua meta..."
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div>
                <Label>Categoria</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="aposentadoria">Aposentadoria</SelectItem>
                    <SelectItem value="imovel">Imóvel</SelectItem>
                    <SelectItem value="viagem">Viagem</SelectItem>
                    <SelectItem value="educacao">Educação</SelectItem>
                    <SelectItem value="emergencia">Emergência</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Valor Alvo (R$)</Label>
                  <Input
                    type="number"
                    value={formData.target_amount}
                    onChange={(e) => setFormData({...formData, target_amount: e.target.value})}
                    placeholder="100000"
                    required
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
                <div>
                  <Label>Valor Atual (R$)</Label>
                  <Input
                    type="number"
                    value={formData.current_amount}
                    onChange={(e) => setFormData({...formData, current_amount: e.target.value})}
                    placeholder="0"
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data Alvo</Label>
                  <Input
                    type="date"
                    value={formData.target_date}
                    onChange={(e) => setFormData({...formData, target_date: e.target.value})}
                    required
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
                <div>
                  <Label>Aporte Mensal (R$)</Label>
                  <Input
                    type="number"
                    value={formData.monthly_contribution}
                    onChange={(e) => setFormData({...formData, monthly_contribution: e.target.value})}
                    placeholder="500"
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700">
                {editingGoal ? 'Atualizar Meta' : 'Criar Meta'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Nenhuma meta cadastrada ainda</p>
            <p className="text-gray-500 text-sm mt-2">Crie sua primeira meta financeira para começar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {goals.map((goal) => {
            const progress = calculateProgress(goal);
            const daysRemaining = Math.ceil((new Date(goal.target_date) - new Date()) / (1000 * 60 * 60 * 24));
            const monthsRemaining = Math.ceil(daysRemaining / 30);
            const remainingAmount = goal.target_amount - goal.current_amount;

            return (
              <Card key={goal.id} className="bg-gray-900 border-gray-800 hover:border-violet-500/50 transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{categoryIcons[goal.category]}</span>
                      <div>
                        <CardTitle className="text-white">{goal.title}</CardTitle>
                        <p className="text-gray-400 text-sm mt-1">{goal.description}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => handleOpenDialog(goal)}>
                        <Edit className="h-4 w-4 text-gray-400" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(goal.id)}>
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Progresso</span>
                      <span className="text-violet-400 font-semibold">{progress.toFixed(1)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                        <DollarSign className="h-3 w-3" />
                        <span>Valor Atual</span>
                      </div>
                      <p className="text-white font-semibold">
                        R$ {goal.current_amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                        <Target className="h-3 w-3" />
                        <span>Valor Alvo</span>
                      </div>
                      <p className="text-white font-semibold">
                        R$ {goal.target_amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                        <Calendar className="h-3 w-3" />
                        <span>Prazo</span>
                      </div>
                      <p className="text-white font-semibold">
                        {monthsRemaining > 0 ? `${monthsRemaining} meses` : 'Expirado'}
                      </p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                        <TrendingUp className="h-3 w-3" />
                        <span>Aporte Mensal</span>
                      </div>
                      <p className="text-white font-semibold">
                        R$ {goal.monthly_contribution?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  {/* Remaining Amount */}
                  {remainingAmount > 0 && (
                    <div className="bg-violet-500/10 border border-violet-500/30 rounded-lg p-3 mt-3">
                      <p className="text-violet-400 text-xs font-medium mb-1">Falta atingir</p>
                      <p className="text-white font-bold text-lg">
                        R$ {remainingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}