import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, Target, Lightbulb, Zap, FileText, Download, Building2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FinancialCalendar from "@/components/calendar/FinancialCalendar";
import { Button } from "@/components/ui/button";
import FinanceFlow from "@/components/dashboard/FinanceFlow";
import IntelligentPlanningChat from "@/components/planner/IntelligentPlanningChat";
import FinancialPlannerChat from "@/components/planner/FinancialPlannerChat";
import BudgetManager from "@/components/budget/BudgetManager";
import EnhancedInvestmentAdvisor from "@/components/ai/EnhancedInvestmentAdvisor";
import ExpensesChart from "@/components/dashboard/ExpensesChart";
import SavingsGoalsManager from "@/components/planner/SavingsGoalsManager";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import GoalsWidget from "@/components/dashboard/GoalsWidget";
import AddPersonalTransactionDialog from "@/components/dashboard/AddPersonalTransactionDialog";
import AddCompanyTransactionDialog from "@/components/dashboard/AddCompanyTransactionDialog";
import ImportTransactionsDialog from "@/components/dashboard/ImportTransactionsDialog";
import FinanceAlertsWidget from "@/components/dashboard/FinanceAlertsWidget";
import CompanyReportsGenerator from "@/components/company/CompanyReportsGenerator";
import PersonalFinanceReport from "@/components/dashboard/PersonalFinanceReport";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [assets, setAssets] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [riskProfile, setRiskProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [strategy, setStrategy] = useState(null);
  const [projection, setProjection] = useState(null);
  const [strategyLoading, setStrategyLoading] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [mode, setMode] = useState("pessoal");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      const [transactionsData, goalsData, assetsData, riskData, portfolioData] = await Promise.all([
        base44.entities.FinanceTransaction.filter({ user_email: userData.email }),
        base44.entities.FinancialGoal.filter({ user_email: userData.email }),
        base44.entities.Asset.filter({ user_email: userData.email }),
        base44.entities.RiskProfile.filter({ user_email: userData.email }),
        base44.entities.Portfolio.filter({ user_email: userData.email })
      ]);

      setTransactions(transactionsData);
      setGoals(goalsData);
      setAssets(assetsData);
      setRiskProfile(riskData[0] || null);
      setPortfolio(portfolioData[0] || null);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredTransactions = (accountType) => {
    return transactions.filter(t => (t.account_type || "pessoal") === accountType);
  };

  const calculateFinance = (accountType = "pessoal") => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const filtered = getFilteredTransactions(accountType);
    const monthTransactions = filtered.filter(t => {
      const tDate = new Date(t.transaction_date);
      return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
    });

    const totalIncome = monthTransactions
      .filter(t => t.type === "entrada")
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalExpenses = monthTransactions
      .filter(t => t.type === "saida")
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    return { total_income: totalIncome, total_expenses: totalExpenses };
  };

  const financePersonal = calculateFinance("pessoal");
  const financeCompany = calculateFinance("empresa");
  const finance = mode === "pessoal" ? financePersonal : financeCompany;

  const getCategoryLabel = (cat, isCompany = false) => {
    if (isCompany) {
      const companyLabels = {
        vendas: 'Vendas',
        servicos: 'Receita de Serviços',
        investimento: 'Investimento/Capital',
        emprestimo: 'Empréstimo',
        aluguel_comercial: 'Aluguel Comercial',
        salarios: 'Salários e Encargos',
        energia: 'Energia/Água',
        internet: 'Internet/Telecomunicações',
        marketing: 'Marketing e Publicidade',
        estoque: 'Estoque/Matéria Prima',
        transporte: 'Transporte/Logística',
        impostos: 'Impostos e Taxas',
        manutencao: 'Manutenção e Reparos',
        seguros: 'Seguros',
        consultoria: 'Consultoria/Profissionais',
        software: 'Software e Assinaturas',
        outros: 'Outros'
      };
      return companyLabels[cat] || cat;
    }
    
    const labels = {
      salario: 'Salário',
      pix_recebido: 'PIX',
      bonus: 'Bônus',
      aluguel: 'Aluguel',
      alimentacao: 'Alimentação',
      lazer: 'Lazer',
      cartao_credito: 'Cartão de Crédito',
      assinaturas: 'Assinaturas',
      transporte: 'Transporte',
      saude: 'Saúde'
    };
    return labels[cat] || cat;
  };

  const handleStrategyGenerate = async (inputs) => {
    setStrategyLoading(true);
    try {
      const response = await base44.functions.invoke('strategyEngine', inputs);
      setStrategy(response.data.strategy);
      setProjection(response.data.projection);
    } catch (err) {
      console.error(err);
    } finally {
      setStrategyLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <Skeleton className="h-16 w-full rounded-2xl bg-gray-800" />
            <Skeleton className="h-64 w-full rounded-3xl bg-gray-800" />
            <div className="grid lg:grid-cols-2 gap-6">
              <Skeleton className="h-80 rounded-2xl bg-gray-800" />
              <Skeleton className="h-80 rounded-2xl bg-gray-800" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Finanças</h1>
              <p className="text-gray-400 text-sm">
                {mode === "pessoal" ? "Gerencie suas receitas e despesas" : "Gerencie as finanças da empresa"}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={() => setMode("pessoal")}
              className={`${mode === "pessoal" 
                ? "bg-violet-500 hover:bg-violet-600 text-white" 
                : "bg-gray-800 hover:bg-gray-700 text-gray-300"}`}
            >
              <Wallet className="h-4 w-4 mr-2" />
              Pessoal
            </Button>
            <Button
              onClick={() => setMode("empresa")}
              className={`${mode === "empresa" 
                ? "bg-violet-500 hover:bg-violet-600 text-white" 
                : "bg-gray-800 hover:bg-gray-700 text-gray-300"}`}
            >
              <Building2 className="h-4 w-4 mr-2" />
              Empresa
            </Button>
          </div>
        </div>
        
        <div className="flex gap-3">
          {mode === "pessoal" ? (
            <AddPersonalTransactionDialog userEmail={user?.email} onAdded={loadData} />
          ) : (
            <AddCompanyTransactionDialog userEmail={user?.email} onAdded={loadData} />
          )}
          <Button
            onClick={() => setImportDialogOpen(true)}
            variant="outline"
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            <FileText className="h-4 w-4 mr-2" />
            Importar PDF
          </Button>
        </div>
        <ImportTransactionsDialog
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          userEmail={user?.email}
          onSuccess={loadData}
        />

        {/* Tabs */}
        {mode === "pessoal" ? (
          <Tabs defaultValue="painel" className="space-y-6">
          <TabsList className="bg-gray-900 border border-gray-800 w-full justify-start">
            <TabsTrigger value="painel" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400">
              <Wallet className="h-4 w-4 mr-2" />
              Painel
            </TabsTrigger>
            <TabsTrigger value="relatorios" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400">
              <FileText className="h-4 w-4 mr-2" />
              Relatórios
            </TabsTrigger>
            <TabsTrigger value="planejar" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400">
              <Target className="h-4 w-4 mr-2" />
              Planejar
            </TabsTrigger>
            <TabsTrigger value="calendario" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400">
              <Target className="h-4 w-4 mr-2" />
              Calendário
            </TabsTrigger>
          </TabsList>

          {/* Painel Tab */}
          <TabsContent value="painel" className="space-y-6">
            {/* Finance Flow */}
            <FinanceFlow finance={finance} />

            {/* Expenses Chart */}
            <ExpensesChart transactions={getFilteredTransactions("pessoal")} isCompany={false} />

            {/* Recent Transactions */}
            <RecentTransactions transactions={getFilteredTransactions("pessoal").sort((a, b) => 
              new Date(b.transaction_date) - new Date(a.transaction_date)
            )} />

            {/* Detailed Transactions Table */}
            <Card className="bg-gray-900 border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-6">Transações do Mês</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Data</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Categoria</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Descrição</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Tipo</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredTransactions(mode).filter(t => {
                      const tDate = new Date(t.transaction_date);
                      const now = new Date();
                      return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
                    }).length > 0 ? (
                      getFilteredTransactions(mode)
                        .filter(t => {
                          const tDate = new Date(t.transaction_date);
                          const now = new Date();
                          return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
                        })
                        .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))
                        .map((t, idx) => (
                          <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                            <td className="py-3 px-4 text-gray-300">
                              {new Date(t.transaction_date).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="py-3 px-4 text-gray-300">{getCategoryLabel(t.category)}</td>
                            <td className="py-3 px-4 text-gray-300">{t.description || '-'}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                t.type === 'entrada' 
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-red-500/20 text-red-400'
                              }`}>
                                {t.type === 'entrada' ? 'Entrada' : 'Saída'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-semibold">
                              <span className={t.type === 'entrada' ? 'text-emerald-400' : 'text-red-400'}>
                                {t.type === 'entrada' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="py-8 px-4 text-center text-gray-400">
                          Nenhuma transação encontrada neste mês
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>


          </TabsContent>

          {/* Relatórios Tab */}
          <TabsContent value="relatorios" className="space-y-6">
            <PersonalFinanceReport transactions={getFilteredTransactions(mode)} />
          </TabsContent>

          {/* Planejar Tab - Pessoal */}
          <TabsContent value="planejar" className="space-y-6">
            <Card className="bg-gradient-to-br from-violet-950/50 to-purple-900/30 border-violet-800/50 p-6">
              <h3 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
                <Target className="h-6 w-6 text-violet-400" />
                Planejamento Pessoal
              </h3>
              <p className="text-gray-400 text-sm">Gerencie seu orçamento e metas financeiras pessoais</p>
            </Card>
            
            <BudgetManager userEmail={user?.email} transactions={getFilteredTransactions("pessoal")} accountType="pessoal" />
            <SavingsGoalsManager userEmail={user?.email} transactions={getFilteredTransactions("pessoal")} />
            <FinancialPlannerChat userEmail={user?.email} context="pessoal" />
          </TabsContent>

          {/* Calendário Tab - Pessoal */}
          <TabsContent value="calendario" className="space-y-6">
            <FinancialCalendar userEmail={user?.email} accountType="pessoal" />
          </TabsContent>
          </Tabs>
        ) : (
          <Tabs defaultValue="painel" className="space-y-6">
            <TabsList className="bg-gray-900 border border-gray-800 w-full justify-start">
              <TabsTrigger value="painel" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400">
                <Wallet className="h-4 w-4 mr-2" />
                Painel
              </TabsTrigger>
              <TabsTrigger value="relatorios" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400">
                <FileText className="h-4 w-4 mr-2" />
                Relatórios
              </TabsTrigger>
              <TabsTrigger value="planejar" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400">
                <Target className="h-4 w-4 mr-2" />
                Planejamento
              </TabsTrigger>
              <TabsTrigger value="calendario" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400">
                <Target className="h-4 w-4 mr-2" />
                Calendário
              </TabsTrigger>
            </TabsList>

            <TabsContent value="painel" className="space-y-6">
              <FinanceFlow finance={finance} />
              <ExpensesChart transactions={getFilteredTransactions(mode)} isCompany={true} />
              <RecentTransactions transactions={getFilteredTransactions(mode).sort((a, b) => 
                new Date(b.transaction_date) - new Date(a.transaction_date)
              )} />

                <Card className="bg-gray-900 border-gray-800 p-6">
                  <h3 className="text-lg font-semibold text-white mb-6">{mode === "empresa" ? "Transações Empresariais" : "Transações Pessoais"} do Mês</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Data</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Categoria</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Descrição</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Tipo</th>
                        <th className="text-right py-3 px-4 text-gray-400 font-medium">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredTransactions(mode).filter(t => {
                        const tDate = new Date(t.transaction_date);
                        const now = new Date();
                        return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
                      }).length > 0 ? (
                        getFilteredTransactions(mode)
                          .filter(t => {
                            const tDate = new Date(t.transaction_date);
                            const now = new Date();
                            return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
                          })
                          .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))
                          .map((t, idx) => (
                            <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                              <td className="py-3 px-4 text-gray-300">
                                {new Date(t.transaction_date).toLocaleDateString('pt-BR')}
                              </td>
                              <td className="py-3 px-4 text-gray-300">{getCategoryLabel(t.category, true)}</td>
                              <td className="py-3 px-4 text-gray-300">{t.description || '-'}</td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  t.type === 'entrada' 
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-red-500/20 text-red-400'
                                }`}>
                                  {t.type === 'entrada' ? 'Receita' : 'Despesa'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right font-semibold">
                                <span className={t.type === 'entrada' ? 'text-emerald-400' : 'text-red-400'}>
                                  {t.type === 'entrada' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              </td>
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="py-8 px-4 text-center text-gray-400">
                            Nenhuma transação encontrada neste mês
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="relatorios" className="space-y-6">
              <CompanyReportsGenerator transactions={getFilteredTransactions(mode)} />
            </TabsContent>

            <TabsContent value="planejar" className="space-y-6">
              <Card className="bg-gradient-to-br from-blue-950/50 to-cyan-900/30 border-blue-800/50 p-6">
                <h3 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
                  <Building2 className="h-6 w-6 text-blue-400" />
                  Planejamento Empresarial
                </h3>
                <p className="text-gray-400 text-sm">Gerencie orçamento, fluxo de caixa e projeções da empresa</p>
              </Card>
              
              <BudgetManager userEmail={user?.email} transactions={getFilteredTransactions("empresa")} accountType="empresa" />
              <FinancialPlannerChat userEmail={user?.email} context="empresa" />
            </TabsContent>

            {/* Calendário Tab - Empresa */}
            <TabsContent value="calendario" className="space-y-6">
              <FinancialCalendar userEmail={user?.email} accountType="empresa" />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}