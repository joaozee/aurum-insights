import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Target, 
  Briefcase, 
  Bell, 
  BarChart3,
  CheckCircle2,
  ArrowRight,
  X
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const tutorialSteps = [
  {
    title: "Bem-vindo ao Aurum! 🎉",
    description: "Vamos fazer um tour rápido pelas principais funcionalidades da plataforma.",
    icon: CheckCircle2,
    color: "violet"
  },
  {
    title: "Configure sua Primeira Meta",
    description: "Defina objetivos financeiros e acompanhe seu progresso automaticamente.",
    icon: Target,
    color: "amber",
    action: "Ir para Planejar",
    page: "Dashboard"
  },
  {
    title: "Adicione Ativos à Carteira",
    description: "Registre suas compras e vendas para acompanhar sua performance em tempo real.",
    icon: Briefcase,
    color: "violet",
    action: "Ver Carteira",
    page: "Portfolio"
  },
  {
    title: "Configure Alertas de Mercado",
    description: "Receba notificações sobre variações de preço, notícias e indicadores macro.",
    icon: Bell,
    color: "blue",
    action: "Configurar Alertas",
    page: "Portfolio"
  },
  {
    title: "Acompanhe seu Desempenho",
    description: "Veja relatórios detalhados, análises por IA e insights sobre sua carteira.",
    icon: BarChart3,
    color: "green",
    action: "Ver Relatórios",
    page: "Reports"
  }
];

export default function InteractiveTutorial({ open, onComplete, userEmail }) {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const currentStep = tutorialSteps[step];
  const progress = ((step + 1) / tutorialSteps.length) * 100;
  const Icon = currentStep.icon;

  const handleNext = () => {
    if (step < tutorialSteps.length - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = async () => {
    await markTutorialComplete();
    onComplete();
  };

  const handleComplete = async () => {
    await markTutorialComplete();
    toast.success("Tutorial concluído! 🎉");
    onComplete();
  };

  const markTutorialComplete = async () => {
    try {
      const onboarding = await base44.entities.UserOnboarding.filter({ user_email: userEmail });
      if (onboarding.length > 0) {
        await base44.entities.UserOnboarding.update(onboarding[0].id, {
          completed_tutorial: true,
          onboarding_completed_at: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleAction = () => {
    if (currentStep.page) {
      navigate(createPageUrl(currentStep.page));
      handleNext();
    }
  };

  const colorClasses = {
    violet: "from-violet-500/20 to-purple-500/20 border-violet-500/30",
    amber: "from-amber-500/20 to-orange-500/20 border-amber-500/30",
    blue: "from-blue-500/20 to-cyan-500/20 border-blue-500/30",
    green: "from-green-500/20 to-emerald-500/20 border-green-500/30"
  };

  const iconColorClasses = {
    violet: "text-violet-400",
    amber: "text-amber-400",
    blue: "text-blue-400",
    green: "text-green-400"
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-xl" hideClose>
        <button
          onClick={handleSkip}
          className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="py-6">
          <Progress value={progress} className="h-2 mb-6" />

          <div className={`bg-gradient-to-br ${colorClasses[currentStep.color]} rounded-2xl p-8 border text-center mb-6`}>
            <Icon className={`h-16 w-16 ${iconColorClasses[currentStep.color]} mx-auto mb-4`} />
            <h3 className="text-2xl font-bold text-white mb-3">{currentStep.title}</h3>
            <p className="text-gray-300">{currentStep.description}</p>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              {step + 1} de {tutorialSteps.length}
            </p>
            <div className="flex gap-2">
              {step < tutorialSteps.length - 1 && (
                <Button variant="ghost" onClick={handleSkip} className="text-gray-400">
                  Pular Tutorial
                </Button>
              )}
              {currentStep.action ? (
                <Button onClick={handleAction} className="bg-violet-600 hover:bg-violet-700">
                  {currentStep.action}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleNext} className="bg-violet-600 hover:bg-violet-700">
                  {step === tutorialSteps.length - 1 ? "Concluir" : "Próximo"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}