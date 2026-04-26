import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Sparkles, Bell } from "lucide-react";
import PortfolioOptimizationSuggestions from "./PortfolioOptimizationSuggestions";
import InvestmentOpportunities from "./InvestmentOpportunities";
import PredictiveAlerts from "./PredictiveAlerts";

export default function IntelligentRecommendations({ assets, goals, riskProfile, userEmail }) {
  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-purple-950/20 border border-gray-800 rounded-2xl p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Recomendações Inteligentes</h2>
            <p className="text-gray-400 text-sm">Análise avançada com IA da sua carteira</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="optimization" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-800/50 border border-gray-700">
          <TabsTrigger value="optimization" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400">
            <Brain className="h-4 w-4 mr-2" />
            Otimização
          </TabsTrigger>
          <TabsTrigger value="opportunities" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
            <Sparkles className="h-4 w-4 mr-2" />
            Oportunidades
          </TabsTrigger>
          <TabsTrigger value="alerts" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
            <Bell className="h-4 w-4 mr-2" />
            Alertas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="optimization" className="mt-6">
          <PortfolioOptimizationSuggestions 
            assets={assets}
            goals={goals}
            riskProfile={riskProfile}
            userEmail={userEmail}
          />
        </TabsContent>

        <TabsContent value="opportunities" className="mt-6">
          <InvestmentOpportunities 
            assets={assets}
            riskProfile={riskProfile}
          />
        </TabsContent>

        <TabsContent value="alerts" className="mt-6">
          <PredictiveAlerts assets={assets} />
        </TabsContent>
      </Tabs>
    </div>
  );
}