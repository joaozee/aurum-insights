import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, PieChart, DollarSign, Lightbulb, Loader2 } from "lucide-react";
import GoalsList from "@/components/planner/GoalsList";
import FinancialChat from "@/components/planner/FinancialChat";
import ContributionPlanner from "@/components/planner/ContributionPlanner";
import GoalSimulator from "@/components/planner/GoalSimulator";

export default function FinancialPlanner() {
  const [user, setUser] = useState(null);
  const [goals, setGoals] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      const [goalsData, transactionsData] = await Promise.all([
        base44.entities.FinancialGoal.filter({ user_email: userData.email }),
        base44.entities.FinanceTransaction.filter({ user_email: userData.email })
      ]);

      setGoals(goalsData);
      setTransactions(transactionsData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <DollarSign className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Finanças Pessoais</h1>
            <p className="text-gray-400 text-sm">Organize seu orçamento e alcance seus objetivos financeiros</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="goals" className="space-y-6">
          <TabsList className="bg-gray-900 border border-gray-800">
            <TabsTrigger value="goals" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
              <Target className="h-4 w-4 mr-2" />
              Metas
            </TabsTrigger>
            <TabsTrigger value="budget" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
              <PieChart className="h-4 w-4 mr-2" />
              Orçamento
            </TabsTrigger>
            <TabsTrigger value="planning" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
              <DollarSign className="h-4 w-4 mr-2" />
              Planejamento
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
              <Lightbulb className="h-4 w-4 mr-2" />
              Dicas IA
            </TabsTrigger>
          </TabsList>

          <TabsContent value="goals">
            <GoalsList 
              goals={goals} 
              userEmail={user?.email}
              onGoalsChange={loadData}
            />
          </TabsContent>

          <TabsContent value="budget">
            <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-emerald-950/30 rounded-2xl border border-gray-800 p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Seu Orçamento</h3>
              <p className="text-gray-400 text-sm">Visualize e organize suas receitas e despesas para melhor controle financeiro.</p>
            </div>
          </TabsContent>

          <TabsContent value="planning">
            <ContributionPlanner 
              goals={goals}
            />
          </TabsContent>

          <TabsContent value="recommendations" className="h-screen">
            <FinancialChat 
              goals={goals}
              userEmail={user?.email}
            />
          </TabsContent>
        </Tabs>

        {/* Goal Simulator - sempre visível abaixo */}
        <div className="mt-8">
          <GoalSimulator />
        </div>
      </div>
    </div>
  );
}