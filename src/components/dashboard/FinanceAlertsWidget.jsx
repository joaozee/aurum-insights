import { useState, useEffect } from "react";
import { AlertTriangle, TrendingDown, CreditCard, Zap, RefreshCw, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function FinanceAlertsWidget({ transactions, userEmail }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (transactions && transactions.length > 0 && userEmail) {
      analyzeExpenses();
    }
  }, [transactions, userEmail]);

  const analyzeExpenses = async () => {
    setLoading(true);
    try {
      // Preparar dados para análise
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.transaction_date);
        return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
      });

      const totalIncome = monthTransactions
        .filter(t => t.type === "entrada")
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const totalExpenses = monthTransactions
        .filter(t => t.type === "saida")
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      // Agrupar gastos por categoria
      const expensesByCategory = {};
      monthTransactions
        .filter(t => t.type === "saida")
        .forEach(t => {
          if (!expensesByCategory[t.category]) {
            expensesByCategory[t.category] = 0;
          }
          expensesByCategory[t.category] += t.amount;
        });

      // Preparar contexto para IA
      const analysisContext = {
        total_income: totalIncome,
        total_expenses: totalExpenses,
        free_balance: totalIncome - totalExpenses,
        expense_percentage: totalIncome > 0 ? (totalExpenses / totalIncome * 100).toFixed(1) : 0,
        expenses_by_category: expensesByCategory,
        top_categories: Object.entries(expensesByCategory)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([cat, val]) => ({
            category: cat,
            amount: val,
            percentage: totalExpenses > 0 ? (val / totalExpenses * 100).toFixed(1) : 0
          }))
      };

      // Chamar IA para análise
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um consultor financeiro analisando os gastos de um usuário.

Dados do mês atual:
- Receita total: R$ ${analysisContext.total_income.toFixed(2)}
- Despesas totais: R$ ${analysisContext.total_expenses.toFixed(2)}
- Saldo livre: R$ ${analysisContext.free_balance.toFixed(2)}
- Percentual de gastos: ${analysisContext.expense_percentage}%

Gastos por categoria (top 5):
${analysisContext.top_categories.map(c => `- ${c.category}: R$ ${c.amount.toFixed(2)} (${c.percentage}%)`).join('\n')}

IMPORTANTE: Gere exatamente 3 alertas relevantes em formato JSON. Analise os padrões de gastos e identifique problemas reais.

Tipos de alertas que você pode gerar:
1. Gastos excessivos em categorias específicas (ex: mais de 20% em delivery/alimentação fora, mais de 10% em assinaturas)
2. Percentual de gastos muito alto em relação à receita (acima de 80% é preocupante)
3. Gastos crescentes em categorias não essenciais
4. Falta de poupança/investimento (se saldo livre é muito baixo)
5. Concentração excessiva em uma única categoria

Retorne SEMPRE 3 alertas no formato JSON abaixo, mesmo que precise criar alertas informativos.`,
        response_json_schema: {
          type: "object",
          properties: {
            alerts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  message: { type: "string" },
                  severity: { type: "string", enum: ["info", "warning", "error"] },
                  category: { type: "string" }
                },
                required: ["title", "message", "severity"]
              },
              minItems: 3,
              maxItems: 3
            }
          },
          required: ["alerts"]
        }
      });

      const aiAlerts = response.alerts || [];

      // Criar notificações no banco
      const existingAlerts = await base44.entities.Notification.filter({
        user_email: userEmail,
        type: "analise_ia"
      });

      // Deletar alertas antigos de IA
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const oldAlerts = existingAlerts.filter(a => 
        new Date(a.created_date) < oneWeekAgo
      );

      await Promise.all(oldAlerts.map(a => 
        base44.entities.Notification.delete(a.id)
      ));

      // Criar novos alertas
      const newAlerts = aiAlerts.map(alert => ({
        user_email: userEmail,
        type: "analise_ia",
        title: alert.title,
        message: alert.message,
        severity: alert.severity,
        metadata: { category: alert.category }
      }));

      if (newAlerts.length > 0) {
        await base44.entities.Notification.bulkCreate(newAlerts);
      }

      setAlerts(aiAlerts);
    } catch (err) {
      console.error(err);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-violet-950/30 rounded-2xl border border-gray-800 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Alertas Financeiros</h3>
          <Skeleton className="h-8 w-8 rounded-full bg-gray-800" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20 rounded-xl bg-gray-800" />
          ))}
        </div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-violet-950/30 rounded-2xl border border-gray-800 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Alertas Financeiros</h3>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={analyzeExpenses}
            className="h-8 w-8 text-gray-400 hover:text-white"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-center py-6">
          <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Nenhum alerta no momento</p>
        </div>
      </div>
    );
  }

  const severityConfig = {
    error: { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400" },
    warning: { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400" },
    info: { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400" }
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-violet-950/30 rounded-2xl border border-gray-800 p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Alertas Financeiros</h3>
          <p className="text-gray-500 text-xs">Análise inteligente dos seus gastos</p>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={analyzeExpenses}
          className="h-8 w-8 text-gray-400 hover:text-white"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3">
        {alerts.map((alert, idx) => {
          const config = severityConfig[alert.severity] || severityConfig.info;
          return (
            <div
              key={idx}
              className={cn(
                "p-4 rounded-xl border transition-all",
                config.bg,
                config.border
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0", config.bg)}>
                  {alert.severity === "error" && <AlertTriangle className={cn("h-4 w-4", config.text)} />}
                  {alert.severity === "warning" && <TrendingDown className={cn("h-4 w-4", config.text)} />}
                  {alert.severity === "info" && <Zap className={cn("h-4 w-4", config.text)} />}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={cn("text-sm font-semibold mb-1", config.text)}>
                    {alert.title}
                  </h4>
                  <p className="text-gray-300 text-xs leading-relaxed">
                    {alert.message}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}