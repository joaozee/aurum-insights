import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { 
  Settings, 
  Shield, 
  Target, 
  Clock, 
  GraduationCap, 
  Briefcase,
  DollarSign,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  CheckCircle
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function RiskProfileDialog({ userEmail, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [showSummary, setShowSummary] = useState(false);
  const totalSteps = 5;

  const [profile, setProfile] = useState({
    risk_tolerance: "moderado",
    investment_horizon: "longo_prazo",
    target_return: 12,
    market_knowledge: "iniciante",
    investment_experience_years: 0,
    primary_goal: "aposentadoria",
    income_source: "salario_fixo",
    income_stability: "estavel",
    monthly_investment_capacity: 0,
    emergency_fund_months: 0,
    max_acceptable_loss: 10,
    preferred_sectors: [],
    excluded_sectors: []
  });

  useEffect(() => {
    if (open && userEmail) {
      loadProfile();
    }
  }, [open, userEmail]);

  const loadProfile = async () => {
    try {
      const profiles = await base44.entities.RiskProfile.filter({ user_email: userEmail });
      if (profiles.length > 0) {
        setProfile(profiles[0]);
        if (profiles[0].completed_questionnaire) {
          setShowSummary(true);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const existing = await base44.entities.RiskProfile.filter({ user_email: userEmail });
      
      const profileData = {
        ...profile,
        completed_questionnaire: true,
        user_email: userEmail
      };

      if (existing.length > 0) {
        await base44.entities.RiskProfile.update(existing[0].id, profileData);
      } else {
        await base44.entities.RiskProfile.create(profileData);
      }
      
      toast.success("Perfil de risco salvo com sucesso!");
      setShowSummary(true);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const handlePrevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const getRiskScore = () => {
    let score = 0;
    
    // Tolerância ao risco (0-40 pontos)
    if (profile.risk_tolerance === "conservador") score += 10;
    else if (profile.risk_tolerance === "moderado") score += 25;
    else score += 40;

    // Conhecimento (0-20 pontos)
    if (profile.market_knowledge === "iniciante") score += 5;
    else if (profile.market_knowledge === "intermediario") score += 10;
    else if (profile.market_knowledge === "avancado") score += 15;
    else score += 20;

    // Experiência (0-15 pontos)
    if (profile.investment_experience_years >= 10) score += 15;
    else if (profile.investment_experience_years >= 5) score += 10;
    else if (profile.investment_experience_years >= 2) score += 5;

    // Horizonte (0-15 pontos)
    if (profile.investment_horizon === "longo_prazo") score += 15;
    else if (profile.investment_horizon === "medio_prazo") score += 10;
    else score += 5;

    // Estabilidade de renda (0-10 pontos)
    if (profile.income_stability === "muito_estavel") score += 10;
    else if (profile.income_stability === "estavel") score += 7;
    else if (profile.income_stability === "moderada") score += 4;
    else score += 1;

    return Math.min(score, 100);
  };

  const getRiskCategory = (score) => {
    if (score >= 70) return { label: "Agressivo", color: "text-red-400", bg: "bg-red-500/20" };
    if (score >= 40) return { label: "Moderado", color: "text-amber-400", bg: "bg-amber-500/20" };
    return { label: "Conservador", color: "text-green-400", bg: "bg-green-500/20" };
  };

  if (showSummary) {
    const riskScore = getRiskScore();
    const riskCategory = getRiskCategory(riskScore);

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
            <Settings className="h-4 w-4 mr-2" />
            Perfil de Risco
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl text-white">Seu Perfil de Investidor</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 md:space-y-6 mt-4">
            {/* Risk Score */}
            <div className="text-center py-6 bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-xl border border-violet-500/20">
              <div className={cn("text-5xl font-bold mb-2", riskCategory.color)}>
                {riskScore}
              </div>
              <div className={cn("inline-block px-4 py-1 rounded-full text-sm font-medium", riskCategory.bg, riskCategory.color)}>
                Perfil {riskCategory.label}
              </div>
            </div>

            {/* Profile Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-violet-400" />
                  <span className="text-xs text-gray-400">Horizonte</span>
                </div>
                <p className="font-medium text-white capitalize">
                  {profile.investment_horizon?.replace('_', ' ')}
                </p>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-violet-400" />
                  <span className="text-xs text-gray-400">Meta Anual</span>
                </div>
                <p className="font-medium text-white">
                  {profile.target_return}% ao ano
                </p>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <GraduationCap className="h-4 w-4 text-violet-400" />
                  <span className="text-xs text-gray-400">Conhecimento</span>
                </div>
                <p className="font-medium text-white capitalize">
                  {profile.market_knowledge}
                </p>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="h-4 w-4 text-violet-400" />
                  <span className="text-xs text-gray-400">Experiência</span>
                </div>
                <p className="font-medium text-white">
                  {profile.investment_experience_years} anos
                </p>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-violet-400" />
                  <span className="text-xs text-gray-400">Fonte de Renda</span>
                </div>
                <p className="font-medium text-white capitalize text-sm">
                  {profile.income_source?.replace('_', ' ')}
                </p>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-violet-400" />
                  <span className="text-xs text-gray-400">Perda Máxima</span>
                </div>
                <p className="font-medium text-white">
                  {profile.max_acceptable_loss}%
                </p>
              </div>
            </div>

            {/* Objective */}
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-violet-400" />
                <span className="text-xs text-gray-400">Objetivo Principal</span>
              </div>
              <p className="font-medium text-white capitalize">
                {profile.primary_goal?.replace('_', ' ')}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={() => setShowSummary(false)}
                variant="outline"
                className="flex-1 border-gray-700"
              >
                Editar Perfil
              </Button>
              <Button
                onClick={() => setOpen(false)}
                className="flex-1 bg-violet-600 hover:bg-violet-700"
              >
                Concluir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
          <Settings className="h-4 w-4 mr-2" />
          Perfil de Risco
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl text-white">
            Configurar Perfil de Investidor
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Progress */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Passo {step} de {totalSteps}</span>
              <span className="text-violet-400">{Math.round((step / totalSteps) * 100)}%</span>
            </div>
            <Progress value={(step / totalSteps) * 100} className="h-2" />
          </div>

          {/* Step 1: Conhecimento e Experiência */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-sm text-gray-300">
                  Qual seu nível de conhecimento sobre o mercado financeiro?
                </Label>
                <Select
                  value={profile.market_knowledge}
                  onValueChange={(value) => setProfile({ ...profile, market_knowledge: value })}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="iniciante">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Iniciante</span>
                        <span className="text-xs text-gray-400">Pouco ou nenhum conhecimento</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="intermediario">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Intermediário</span>
                        <span className="text-xs text-gray-400">Conheço conceitos básicos</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="avancado">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Avançado</span>
                        <span className="text-xs text-gray-400">Boa compreensão do mercado</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="especialista">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Especialista</span>
                        <span className="text-xs text-gray-400">Profundo conhecimento técnico</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-sm text-gray-300">
                  Há quantos anos você investe?
                </Label>
                <Input
                  type="number"
                  value={profile.investment_experience_years}
                  onChange={(e) => setProfile({ ...profile, investment_experience_years: parseInt(e.target.value) || 0 })}
                  className="bg-gray-800 border-gray-700"
                  min="0"
                  max="50"
                />
                <p className="text-xs text-gray-400">
                  Anos de experiência ativa com investimentos
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Objetivos Financeiros */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-5 w-5 text-violet-400" />
                <h3 className="font-semibold text-white">Objetivos Financeiros</h3>
              </div>

              <div className="space-y-3">
                <Label className="text-sm text-gray-300">
                  Qual seu objetivo financeiro principal?
                </Label>
                <Select
                  value={profile.primary_goal}
                  onValueChange={(value) => setProfile({ ...profile, primary_goal: value })}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="aposentadoria">Aposentadoria Confortável</SelectItem>
                    <SelectItem value="renda_passiva">Gerar Renda Passiva</SelectItem>
                    <SelectItem value="preservacao_capital">Preservar Capital</SelectItem>
                    <SelectItem value="crescimento_agressivo">Crescimento Agressivo</SelectItem>
                    <SelectItem value="educacao_filhos">Educação dos Filhos</SelectItem>
                    <SelectItem value="compra_imovel">Comprar Imóvel</SelectItem>
                    <SelectItem value="reserva_emergencia">Reserva de Emergência</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-sm text-gray-300">
                  Qual retorno anual você almeja? (%)
                </Label>
                <Input
                  type="number"
                  value={profile.target_return}
                  onChange={(e) => setProfile({ ...profile, target_return: parseFloat(e.target.value) || 0 })}
                  className="bg-gray-800 border-gray-700"
                  min="0"
                  max="100"
                  step="0.5"
                />
                <p className="text-xs text-gray-400">
                  Retornos mais altos geralmente implicam em maior risco
                </p>
              </div>

              <div className="space-y-3">
                <Label className="text-sm text-gray-300">
                  Horizonte de investimento
                </Label>
                <Select
                  value={profile.investment_horizon}
                  onValueChange={(value) => setProfile({ ...profile, investment_horizon: value })}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="curto_prazo">Curto Prazo (até 2 anos)</SelectItem>
                    <SelectItem value="medio_prazo">Médio Prazo (2 a 5 anos)</SelectItem>
                    <SelectItem value="longo_prazo">Longo Prazo (5+ anos)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 3: Fonte de Renda */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="h-5 w-5 text-violet-400" />
                <h3 className="font-semibold text-white">Renda e Capacidade de Investimento</h3>
              </div>

              <div className="space-y-3">
                <Label className="text-sm text-gray-300">
                  Qual sua principal fonte de renda?
                </Label>
                <Select
                  value={profile.income_source}
                  onValueChange={(value) => setProfile({ ...profile, income_source: value })}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="salario_fixo">Salário Fixo (CLT)</SelectItem>
                    <SelectItem value="renda_variavel">Renda Variável (Comissões/Vendas)</SelectItem>
                    <SelectItem value="autonomo">Autônomo/Freelancer</SelectItem>
                    <SelectItem value="empresario">Empresário</SelectItem>
                    <SelectItem value="aposentado">Aposentado</SelectItem>
                    <SelectItem value="investimentos">Renda de Investimentos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-sm text-gray-300">
                  Como você avalia a estabilidade da sua renda?
                </Label>
                <Select
                  value={profile.income_stability}
                  onValueChange={(value) => setProfile({ ...profile, income_stability: value })}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="muito_estavel">Muito Estável</SelectItem>
                    <SelectItem value="estavel">Estável</SelectItem>
                    <SelectItem value="moderada">Moderadamente Estável</SelectItem>
                    <SelectItem value="instavel">Instável</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-sm text-gray-300">
                  Capacidade mensal de investimento (R$)
                </Label>
                <Input
                  type="number"
                  value={profile.monthly_investment_capacity}
                  onChange={(e) => setProfile({ ...profile, monthly_investment_capacity: parseFloat(e.target.value) || 0 })}
                  className="bg-gray-800 border-gray-700"
                  min="0"
                  step="100"
                />
                <p className="text-xs text-gray-400">
                  Valor médio que você pode investir mensalmente
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Tolerância ao Risco */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-violet-400" />
                <h3 className="font-semibold text-white">Tolerância ao Risco</h3>
              </div>

              <div className="space-y-3">
                <Label className="text-sm text-gray-300">
                  Qual perda máxima você aceitaria no curto prazo?
                </Label>
                <Select
                  value={profile.max_acceptable_loss?.toString()}
                  onValueChange={(value) => setProfile({ ...profile, max_acceptable_loss: parseFloat(value) })}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="5">5% - Muito conservador</SelectItem>
                    <SelectItem value="10">10% - Conservador</SelectItem>
                    <SelectItem value="15">15% - Moderado</SelectItem>
                    <SelectItem value="20">20% - Moderado-Agressivo</SelectItem>
                    <SelectItem value="30">30% - Agressivo</SelectItem>
                    <SelectItem value="40">40%+ - Muito Agressivo</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-400">
                  Percentual do patrimônio que você toleraria perder
                </p>
              </div>

              <div className="space-y-3">
                <Label className="text-sm text-gray-300">
                  Quantos meses de reserva de emergência você possui?
                </Label>
                <Input
                  type="number"
                  value={profile.emergency_fund_months}
                  onChange={(e) => setProfile({ ...profile, emergency_fund_months: parseInt(e.target.value) || 0 })}
                  className="bg-gray-800 border-gray-700"
                  min="0"
                  max="24"
                />
                <p className="text-xs text-gray-400">
                  Ideal: 6 a 12 meses de despesas essenciais
                </p>
              </div>

              <div className="space-y-3">
                <Label className="text-sm text-gray-300">
                  Perfil de tolerância ao risco
                </Label>
                <Select
                  value={profile.risk_tolerance}
                  onValueChange={(value) => setProfile({ ...profile, risk_tolerance: value })}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="conservador">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Conservador</span>
                        <span className="text-xs text-gray-400">Segurança em primeiro lugar</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="moderado">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Moderado</span>
                        <span className="text-xs text-gray-400">Equilíbrio risco-retorno</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="agressivo">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Agressivo</span>
                        <span className="text-xs text-gray-400">Máximo crescimento</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 5: Preferências Finais */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="h-5 w-5 text-violet-400" />
                <h3 className="font-semibold text-white">Últimos Detalhes</h3>
              </div>

              <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-4">
                <p className="text-sm text-violet-300">
                  ✨ Com base nas suas respostas, criaremos um perfil personalizado para otimizar suas recomendações de investimento.
                </p>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <h4 className="text-sm font-medium text-white mb-3">Resumo das Respostas</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Conhecimento:</span>
                    <span className="text-white capitalize">{profile.market_knowledge}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Experiência:</span>
                    <span className="text-white">{profile.investment_experience_years} anos</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Objetivo:</span>
                    <span className="text-white capitalize">{profile.primary_goal?.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Fonte de Renda:</span>
                    <span className="text-white capitalize">{profile.income_source?.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Perda Máxima:</span>
                    <span className="text-white">{profile.max_acceptable_loss}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Perfil:</span>
                    <span className="text-white capitalize">{profile.risk_tolerance}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-700">
            <Button
              variant="outline"
              onClick={handlePrevStep}
              disabled={step === 1}
              className="flex-1 border-gray-700"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
            {step < totalSteps ? (
              <Button
                onClick={handleNextStep}
                className="flex-1 bg-violet-600 hover:bg-violet-700"
              >
                Próximo
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 bg-violet-600 hover:bg-violet-700"
              >
                {loading ? "Salvando..." : "Concluir"}
                <CheckCircle className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}