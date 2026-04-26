import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { PieChart, Plus, AlertTriangle, TrendingUp, Edit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const PERSONAL_CATEGORIES = {
  alimentacao: { label: "Alimentação", icon: "🍽️", color: "emerald" },
  lazer: { label: "Lazer", icon: "🎮", color: "purple" },
  transporte: { label: "Transporte", icon: "🚗", color: "blue" },
  saude: { label: "Saúde", icon: "⚕️", color: "red" },
  educacao: { label: "Educação", icon: "📚", color: "amber" },
  moradia: { label: "Moradia", icon: "🏠", color: "indigo" },
  vestuario: { label: "Vestuário", icon: "👔", color: "pink" },
  outros: { label: "Outros", icon: "📦", color: "gray" }
};

const COMPANY_CATEGORIES = {
  salarios: { label: "Salários", icon: "💼", color: "blue" },
  aluguel_comercial: { label: "Aluguel", icon: "🏢", color: "indigo" },
  energia: { label: "Energia", icon: "⚡", color: "amber" },
  internet: { label: "Internet", icon: "🌐", color: "cyan" },
  marketing: { label: "Marketing", icon: "📢", color: "pink" },
  estoque: { label: "Estoque", icon: "📦", color: "emerald" },
  transporte: { label: "Transporte", icon: "🚚", color: "blue" },
  impostos: { label: "Impostos", icon: "💰", color: "red" },
  manutencao: { label: "Manutenção", icon: "🔧", color: "orange" },
  seguros: { label: "Seguros", icon: "🛡️", color: "purple" },
  consultoria: { label: "Consultoria", icon: "👔", color: "violet" },
  software: { label: "Software", icon: "💻", color: "blue" },
  outros: { label: "Outros", icon: "📋", color: "gray" }
};

export default function BudgetManager({ userEmail, transactions = [], accountType = "pessoal" }) {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [formData, setFormData] = useState({
    category: "",
    monthly_limit: "",
    alert_threshold: "80"
  });

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (userEmail) {
      loadBudgets();
    }
  }, [userEmail, accountType]);

  const loadBudgets = async () => {
    try {
      const data = await base44.entities.Budget.filter({
        user_email: userEmail,
        account_type: accountType,
        month: currentMonth,
        year: currentYear,
        is_active: true
      });
      setBudgets(data);
    } catch (error) {
      console.error("Erro ao carregar orçamentos:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSpent = (category) => {
    const personalCategoryMap = {
      alimentacao: "alimentacao",
      lazer: "lazer",
      transporte: "transporte",
      saude: "saude",
      educacao: "outros",
      moradia: "aluguel",
      vestuario: "outros",
      outros: "outros"
    };

    const companyCategoryMap = {
      salarios: "salarios",
      aluguel_comercial: "aluguel_comercial",
      energia: "energia",
      internet: "internet",
      marketing: "marketing",
      estoque: "estoque",
      transporte: "transporte",
      impostos: "impostos",
      manutencao: "manutencao",
      seguros: "seguros",
      consultoria: "consultoria",
      software: "software",
      outros: "outros"
    };

    const categoryMap = accountType === "pessoal" ? personalCategoryMap : companyCategoryMap;

    return transactions
      .filter(t => {
        const tDate = new Date(t.transaction_date);
        return (
          t.type === "saida" &&
          t.category === categoryMap[category] &&
          tDate.getMonth() + 1 === currentMonth &&
          tDate.getFullYear() === currentYear
        );
      })
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const budgetData = {
        user_email: userEmail,
        account_type: accountType,
        category: formData.category,
        monthly_limit: parseFloat(formData.monthly_limit),
        alert_threshold: parseFloat(formData.alert_threshold),
        month: currentMonth,
        year: currentYear,
        is_active: true
      };

      if (editingBudget) {
        await base44.entities.Budget.update(editingBudget.id, budgetData);
      } else {
        await base44.entities.Budget.create(budgetData);
      }

      await loadBudgets();
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Erro ao salvar orçamento:", error);
    }
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setFormData({
      category: budget.category,
      monthly_limit: budget.monthly_limit.toString(),
      alert_threshold: budget.alert_threshold.toString()
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.Budget.delete(id);
      await loadBudgets();
    } catch (error) {
      console.error("Erro ao deletar orçamento:", error);
    }
  };

  const resetForm = () => {
    setFormData({ category: "", monthly_limit: "", alert_threshold: "80" });
    setEditingBudget(null);
  };

  const getBudgetStatus = (spent, limit, threshold) => {
    const percent = (spent / limit) * 100;
    if (percent >= 100) return { status: "exceeded", color: "red" };
    if (percent >= threshold) return { status: "warning", color: "amber" };
    return { status: "good", color: "emerald" };
  };

  const totalBudget = budgets.reduce((sum, b) => sum + b.monthly_limit, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + calculateSpent(b.category), 0);

  if (loading) {
    return (
      <Card className="bg-gray-900 border-gray-700 p-6">
        <div className="text-center text-gray-400">Carregando orçamentos...</div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com resumo */}
      <Card className="bg-gradient-to-br from-violet-600/20 to-purple-600/20 border-violet-500/30 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <PieChart className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">Orçamento Mensal</h3>
              <p className="text-sm text-gray-400">
                {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-violet-600 hover:bg-violet-700">
                <Plus className="h-4 w-4 mr-2" />
                Novo Orçamento
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {editingBudget ? "Editar Orçamento" : "Criar Orçamento"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label className="text-gray-300">Categoria</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {Object.entries(accountType === "pessoal" ? PERSONAL_CATEGORIES : COMPANY_CATEGORIES).map(([key, cat]) => (
                        <SelectItem key={key} value={key} className="text-white">
                          {cat.icon} {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-300">Limite Mensal (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.monthly_limit}
                    onChange={(e) => setFormData({ ...formData, monthly_limit: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="1000.00"
                    required
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Alerta em (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.alert_threshold}
                    onChange={(e) => setFormData({ ...formData, alert_threshold: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="80"
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700">
                  {editingBudget ? "Atualizar" : "Criar"} Orçamento
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {budgets.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-900/50 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Orçamento Total</p>
              <p className="text-2xl font-bold text-white">
                R$ {totalBudget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Total Gasto</p>
              <p className={cn(
                "text-2xl font-bold",
                totalSpent > totalBudget ? "text-red-400" : "text-emerald-400"
              )}>
                R$ {totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Lista de orçamentos */}
      {budgets.length === 0 ? (
        <Card className="bg-gray-900 border-gray-700 p-8">
          <div className="text-center">
            <PieChart className="h-12 w-12 text-gray-600 mx-auto mb-3 opacity-50" />
            <p className="text-gray-400 mb-4">Nenhum orçamento definido para este mês</p>
            <p className="text-sm text-gray-500">
              Crie orçamentos por categoria para acompanhar seus gastos
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {budgets.map((budget) => {
            const spent = calculateSpent(budget.category);
            const percent = (spent / budget.monthly_limit) * 100;
            const remaining = budget.monthly_limit - spent;
            const { status, color } = getBudgetStatus(spent, budget.monthly_limit, budget.alert_threshold);
            const CATEGORIES = accountType === "pessoal" ? PERSONAL_CATEGORIES : COMPANY_CATEGORIES;
            const category = CATEGORIES[budget.category] || { label: budget.category, icon: "📊", color: "gray" };

            return (
              <Card key={budget.id} className="bg-gray-900 border-gray-700 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center text-xl",
                      `bg-${color}-500/20`
                    )}>
                      {category.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{category.label}</h4>
                      <p className="text-xs text-gray-400">
                        Alerta em {budget.alert_threshold}%
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(budget)}
                      className="h-8 w-8 text-gray-400 hover:text-white"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(budget.id)}
                      className="h-8 w-8 text-gray-400 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">
                      R$ {spent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de{' '}
                      R$ {budget.monthly_limit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className={cn(
                      "font-semibold",
                      status === "exceeded" ? "text-red-400" :
                      status === "warning" ? "text-amber-400" :
                      "text-emerald-400"
                    )}>
                      {percent.toFixed(1)}%
                    </span>
                  </div>

                  <Progress
                    value={Math.min(percent, 100)}
                    className={cn(
                      "h-2",
                      status === "exceeded" && "[&>div]:bg-red-500",
                      status === "warning" && "[&>div]:bg-amber-500",
                      status === "good" && "[&>div]:bg-emerald-500"
                    )}
                  />

                  {status === "exceeded" ? (
                    <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 rounded p-2">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>
                        Orçamento excedido em R$ {Math.abs(remaining).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ) : status === "warning" ? (
                    <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 rounded p-2">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>
                        Atenção! Restam R$ {remaining.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 rounded p-2">
                      <TrendingUp className="h-3.5 w-3.5" />
                      <span>
                        Restam R$ {remaining.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}