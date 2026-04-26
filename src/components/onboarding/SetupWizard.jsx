import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { 
  Sparkles, 
  Target, 
  TrendingUp, 
  Shield, 
  Calendar,
  DollarSign,
  CheckCircle2,
  ArrowRight,
  ArrowLeft
} from "lucide-react";
import { toast } from "sonner";

export default function SetupWizard({ open, onComplete, userEmail }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    preferred_name: "",
    risk_tolerance: "moderado",
    investment_horizon: "longo_prazo",
    market_knowledge: "iniciante",
    investment_experience_years: 0,
    primary_goal: "aposentadoria",
    target_amount: "",
    target_date: "",
    monthly_contribution: "",
    income_stability: "estavel",
    emergency_fund_months: 0
  });

  const totalSteps = 6;
  const progress = (step / totalSteps) * 100;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    try {
      // Salvar nome preferido no User
      if (formData.preferred_name) {
        await base44.auth.updateMe({ preferred_name: formData.preferred_name });
      }

      // Salvar perfil de risco
      await base44.entities.RiskProfile.create({
        user_email: userEmail,
        risk_tolerance: formData.risk_tolerance,
        investment_horizon: formData.investment_horizon,
        market_knowledge: formData.market_knowledge,
        investment_experience_years: parseInt(formData.investment_experience_years) || 0,
        primary_goal: formData.primary_goal,
        income_stability: formData.income_stability,
        monthly_investment_capacity: parseFloat(formData.monthly_contribution) || 0,
        emergency_fund_months: parseInt(formData.emergency_fund_months) || 0,
        completed_questionnaire: true
      });

      // Criar meta inicial se fornecida
      if (formData.target_amount && formData.target_date) {
        await base44.entities.FinancialGoal.create({
          user_email: userEmail,
          title: formData.primary_goal === "aposentadoria" ? "Aposentadoria" : 
                 formData.primary_goal === "imovel" ? "Casa Própria" : "Minha Meta",
          description: "Meta criada no onboarding",
          target_amount: parseFloat(formData.target_amount),
          target_date: formData.target_date,
          category: formData.primary_goal,
          monthly_contribution: parseFloat(formData.monthly_contribution) || 0,
          current_amount: 0,
          status: "em_progresso"
        });
      }

      // Marcar wizard como completo
      const onboarding = await base44.entities.UserOnboarding.filter({ user_email: userEmail });
      if (onboarding.length > 0) {
        await base44.entities.UserOnboarding.update(onboarding[0].id, {
          completed_wizard: true,
          wizard_data: formData
        });
      } else {
        await base44.entities.UserOnboarding.create({
          user_email: userEmail,
          completed_wizard: true,
          wizard_data: formData,
          onboarding_started_at: new Date().toISOString()
        });
      }

      toast.success("Perfil configurado com sucesso!");
      onComplete();
    } catch (error) {
      toast.error("Erro ao salvar configurações");
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-400" />
            Configuração Inicial
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress */}
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-400">Passo {step} de {totalSteps}</span>
              <span className="text-sm text-gray-400">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step 1: Personal Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Sparkles className="h-12 w-12 text-violet-400 mx-auto mb-3" />
                <h3 className="text-xl font-semibold text-white mb-2">Bem-vindo ao Aurum!</h3>
                <p className="text-gray-400 text-sm">Vamos personalizar sua experiência</p>
              </div>

              <div>
                <Label className="text-gray-300 mb-3 block">Qual é seu nome preferido?</Label>
                <Input
                  type="text"
                  value={formData.preferred_name}
                  onChange={(e) => setFormData({...formData, preferred_name: e.target.value})}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="Digite seu nome preferido"
                />
                <p className="text-xs text-gray-500 mt-1">Usaremos este nome para personalizações na plataforma</p>
              </div>
            </div>
          )}

          {/* Step 2: Risk & Knowledge */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Shield className="h-12 w-12 text-violet-400 mx-auto mb-3" />
                <h3 className="text-xl font-semibold text-white mb-2">Perfil de Risco</h3>
                <p className="text-gray-400 text-sm">Entenda sua tolerância ao risco</p>
              </div>

              <div>
                <Label className="text-gray-300 mb-3 block">Qual é sua tolerância ao risco?</Label>
                <RadioGroup value={formData.risk_tolerance} onValueChange={(v) => setFormData({...formData, risk_tolerance: v})}>
                  <div className="space-y-3">
                    {["conservador", "moderado", "agressivo"].map(risk => (
                      <div key={risk} className="flex items-center space-x-3 bg-gray-800/50 p-3 rounded-lg border border-gray-700 cursor-pointer hover:border-violet-500/50 transition-colors">
                        <RadioGroupItem value={risk} id={risk} />
                        <Label htmlFor={risk} className="capitalize cursor-pointer text-white">{risk}</Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-gray-300 mb-3 block">Qual seu horizonte de investimento?</Label>
                <RadioGroup value={formData.investment_horizon} onValueChange={(v) => setFormData({...formData, investment_horizon: v})}>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 bg-gray-800/50 p-4 rounded-lg border border-gray-700 cursor-pointer hover:border-violet-500/50 transition-colors">
                      <RadioGroupItem value="medio_prazo" id="medio" />
                      <Label htmlFor="medio" className="flex-1 cursor-pointer">
                        <p className="font-medium text-white">Médio Prazo (2-5 anos)</p>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 bg-gray-800/50 p-4 rounded-lg border border-gray-700 cursor-pointer hover:border-violet-500/50 transition-colors">
                      <RadioGroupItem value="longo_prazo" id="longo" />
                      <Label htmlFor="longo" className="flex-1 cursor-pointer">
                        <p className="font-medium text-white">Longo Prazo (5+ anos)</p>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-gray-300 mb-3 block">Qual seu nível de conhecimento do mercado?</Label>
                <RadioGroup value={formData.market_knowledge} onValueChange={(v) => setFormData({...formData, market_knowledge: v})}>
                  <div className="grid grid-cols-2 gap-3">
                    {["iniciante", "intermediario", "avancado", "especialista"].map(level => (
                      <div key={level} className="flex items-center space-x-3 bg-gray-800/50 p-3 rounded-lg border border-gray-700 cursor-pointer hover:border-violet-500/50 transition-colors">
                        <RadioGroupItem value={level} id={level} />
                        <Label htmlFor={level} className="capitalize cursor-pointer text-white">{level}</Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Target className="h-12 w-12 text-amber-400 mx-auto mb-3" />
                <h3 className="text-xl font-semibold text-white mb-2">Seu Objetivo Principal</h3>
                <p className="text-gray-400 text-sm">Defina para onde quer ir</p>
              </div>

              <div>
                <Label className="text-gray-300 mb-3 block">Qual seu principal objetivo financeiro?</Label>
                <RadioGroup value={formData.primary_goal} onValueChange={(v) => setFormData({...formData, primary_goal: v})}>
                  <div className="grid gap-3">
                    {[
                      { value: "aposentadoria", label: "Aposentadoria", icon: Calendar },
                      { value: "imovel", label: "Comprar Imóvel", icon: Target },
                      { value: "renda_passiva", label: "Renda Passiva", icon: DollarSign },
                      { value: "educacao_filhos", label: "Educação dos Filhos", icon: Target },
                      { value: "reserva_emergencia", label: "Reserva de Emergência", icon: Shield },
                      { value: "crescimento_agressivo", label: "Crescimento Agressivo", icon: TrendingUp }
                    ].map(goal => {
                      const Icon = goal.icon;
                      return (
                        <div key={goal.value} className="flex items-center space-x-3 bg-gray-800/50 p-4 rounded-lg border border-gray-700 cursor-pointer hover:border-violet-500/50 transition-colors">
                          <RadioGroupItem value={goal.value} id={goal.value} />
                          <Label htmlFor={goal.value} className="flex items-center gap-3 flex-1 cursor-pointer">
                            <Icon className="h-5 w-5 text-violet-400" />
                            <span className="text-white">{goal.label}</span>
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </RadioGroup>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Valor Alvo (R$)</Label>
                  <Input
                    type="number"
                    value={formData.target_amount}
                    onChange={(e) => setFormData({...formData, target_amount: e.target.value})}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="100000"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Data Alvo</Label>
                  <Input
                    type="date"
                    value={formData.target_date}
                    onChange={(e) => setFormData({...formData, target_date: e.target.value})}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <DollarSign className="h-12 w-12 text-green-400 mx-auto mb-3" />
                <h3 className="text-xl font-semibold text-white mb-2">Capacidade de Investimento</h3>
                <p className="text-gray-400 text-sm">Quanto você pode investir?</p>
              </div>

              <div>
                <Label className="text-gray-300">Contribuição Mensal (R$)</Label>
                <Input
                  type="number"
                  value={formData.monthly_contribution}
                  onChange={(e) => setFormData({...formData, monthly_contribution: e.target.value})}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="1000"
                />
                <p className="text-xs text-gray-500 mt-1">Quanto você pode investir por mês?</p>
              </div>

              <div>
                <Label className="text-gray-300 mb-3 block">Estabilidade da sua renda</Label>
                <RadioGroup value={formData.income_stability} onValueChange={(v) => setFormData({...formData, income_stability: v})}>
                  <div className="space-y-3">
                    {[
                      { value: "muito_estavel", label: "Muito Estável", desc: "Salário fixo, concursado" },
                      { value: "estavel", label: "Estável", desc: "CLT, renda regular" },
                      { value: "moderada", label: "Moderada", desc: "Renda variável, comissões" },
                      { value: "instavel", label: "Instável", desc: "Autônomo, irregular" }
                    ].map(option => (
                      <div key={option.value} className="flex items-center space-x-3 bg-gray-800/50 p-3 rounded-lg border border-gray-700 cursor-pointer hover:border-violet-500/50 transition-colors">
                        <RadioGroupItem value={option.value} id={option.value} />
                        <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                          <p className="text-white font-medium">{option.label}</p>
                          <p className="text-xs text-gray-400">{option.desc}</p>
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-gray-300">Reserva de Emergência (meses)</Label>
                <Input
                  type="number"
                  value={formData.emergency_fund_months}
                  onChange={(e) => setFormData({...formData, emergency_fund_months: e.target.value})}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="6"
                />
                <p className="text-xs text-gray-500 mt-1">Quantos meses de despesas você tem guardado?</p>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <TrendingUp className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
                <h3 className="text-xl font-semibold text-white mb-2">Estratégia de Investimentos</h3>
                <p className="text-gray-400 text-sm">Configure sua estratégia de renda passiva</p>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 space-y-4">
                <div>
                  <Label className="text-gray-300">Objetivo da Estratégia</Label>
                  <p className="text-gray-400 text-sm mt-1">Renda Passiva (Dividendos)</p>
                </div>
                <div>
                  <Label className="text-gray-300">Tolerância ao Risco</Label>
                  <p className="text-gray-400 text-sm mt-1 capitalize">{formData.risk_tolerance} (conforme configurado)</p>
                </div>
                <div>
                  <Label className="text-gray-300">Investimento Mensal</Label>
                  <p className="text-gray-400 text-sm mt-1">R$ {parseFloat(formData.monthly_contribution || 0).toLocaleString('pt-BR')}</p>
                </div>
              </div>

              <div className="bg-emerald-500/10 rounded-lg p-4 border border-emerald-500/30">
                <p className="text-emerald-400 text-sm">
                  💡 Após finalizar, você poderá gerar sua estratégia personalizada na seção "Carteira"
                </p>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-3" />
                <h3 className="text-xl font-semibold text-white mb-2">Tudo Pronto!</h3>
                <p className="text-gray-400 text-sm">Resumo do seu perfil</p>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 space-y-4">
                {formData.preferred_name && (
                  <div>
                    <p className="text-gray-400 text-sm">Como você será chamado</p>
                    <p className="text-white font-semibold">{formData.preferred_name}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Perfil de Risco</p>
                    <p className="text-white font-semibold capitalize">{formData.risk_tolerance}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Horizonte</p>
                    <p className="text-white font-semibold capitalize">{formData.investment_horizon.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Conhecimento</p>
                    <p className="text-white font-semibold capitalize">{formData.market_knowledge}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Objetivo</p>
                    <p className="text-white font-semibold capitalize">{formData.primary_goal.replace('_', ' ')}</p>
                  </div>
                </div>

                {formData.target_amount && (
                  <div className="pt-4 border-t border-gray-700">
                    <p className="text-gray-400 text-sm mb-2">Meta Inicial</p>
                    <p className="text-white font-semibold">R$ {parseFloat(formData.target_amount).toLocaleString('pt-BR')}</p>
                    {formData.monthly_contribution && (
                      <p className="text-gray-400 text-sm mt-1">Contribuição mensal: R$ {parseFloat(formData.monthly_contribution).toLocaleString('pt-BR')}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 rounded-lg p-4 border border-violet-500/30">
                <p className="text-violet-400 text-sm">
                  ✨ Suas configurações ajudarão a IA a fornecer recomendações personalizadas e alertas relevantes!
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4 md:pt-6 border-t border-gray-800 gap-2">
            {step > 1 && (
              <Button variant="outline" onClick={handleBack} className="border-gray-700 text-gray-300 text-xs md:text-sm px-3 md:px-4">
                <ArrowLeft className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                Voltar
              </Button>
            )}
            <div className="flex-1" />
            {step < totalSteps ? (
              <Button onClick={handleNext} className="bg-violet-600 hover:bg-violet-700 text-xs md:text-sm px-3 md:px-4">
                Próximo
                <ArrowRight className="h-3 w-3 md:h-4 md:w-4 ml-1 md:ml-2" />
              </Button>
            ) : (
              <Button onClick={handleComplete} className="bg-green-600 hover:bg-green-700 text-xs md:text-sm px-3 md:px-4">
                <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                Finalizar
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}