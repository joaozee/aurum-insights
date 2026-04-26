import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { 
  Crown, 
  Check, 
  Star,
  Zap,
  TrendingUp,
  BookOpen,
  Users,
  MessageSquare,
  Shield,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function Premium() {
  const [user, setUser] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState("annual");

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (e) {
      console.log(e);
    }
  };

  const plans = [
    {
      id: "monthly",
      name: "Mensal",
      price: 49.90,
      period: "/mês",
      description: "Ideal para começar",
      features: []
    },
    {
      id: "annual",
      name: "Anual",
      price: 39.90,
      originalPrice: 49.90,
      period: "/mês",
      description: "Economia de 20%",
      badge: "Mais Popular",
      features: []
    }
  ];

  const benefits = [
    {
      icon: TrendingUp,
      title: "Análises Exclusivas",
      description: "Acesso completo a todas as análises de ações, FIIs e dividendos"
    },
    {
      icon: BookOpen,
      title: "Conteúdo Premium",
      description: "Vídeos, artigos e materiais exclusivos para assinantes"
    },
    {
      icon: Users,
      title: "Comunidade VIP",
      description: "Participe de discussões exclusivas com outros investidores"
    },
    {
      icon: MessageSquare,
      title: "Suporte Prioritário",
      description: "Tire suas dúvidas diretamente com nossa equipe"
    },
    {
      icon: Zap,
      title: "Alertas Personalizados",
      description: "Receba notificações sobre oportunidades de investimento"
    },
    {
      icon: Shield,
      title: "Garantia de 7 dias",
      description: "Não gostou? Devolvemos seu dinheiro sem perguntas"
    }
  ];

  const handleSubscribe = async () => {
    // In a real app, this would go to a payment flow
    // For MVP, we'll just update the user
    try {
      await base44.auth.updateMe({
        is_premium: true,
        subscription_plan: selectedPlan,
        subscription_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
      });
      window.location.reload();
    } catch (e) {
      console.log(e);
    }
  };

  if (user?.is_premium) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-amber-500/30">
              <Crown className="h-12 w-12 text-black" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Você é Premium!
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Aproveite todos os benefícios exclusivos da sua assinatura
            </p>
            <Badge className="bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-lg px-6 py-2">
              Plano {user.subscription_plan === "annual" ? "Anual" : "Mensal"}
            </Badge>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-400 rounded-full px-4 py-2 mb-6">
            <Crown className="h-5 w-5" />
            <span className="font-medium">Aurum Premium</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Desbloqueie todo o potencial dos seus investimentos
          </h1>
          <p className="text-xl text-gray-300">
            Acesso ilimitado a análises, conteúdos exclusivos e uma comunidade de investidores de sucesso
          </p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-20">
          {plans.map((plan) => (
            <div 
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={cn(
                "relative rounded-2xl p-6 cursor-pointer transition-all duration-300",
                selectedPlan === plan.id 
                  ? "bg-white shadow-2xl scale-105" 
                  : "bg-white/5 border border-white/10 hover:bg-white/10"
              )}
            >
              {plan.badge && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-yellow-400 text-black">
                  {plan.badge}
                </Badge>
              )}
              <div className={cn(
                "mb-4",
                selectedPlan === plan.id ? "text-gray-900" : "text-white"
              )}>
                <h3 className="text-xl font-semibold mb-1">{plan.name}</h3>
                <p className={cn(
                  "text-sm",
                  selectedPlan === plan.id ? "text-gray-500" : "text-gray-400"
                )}>{plan.description}</p>
              </div>
              <div className="flex items-baseline gap-1 mb-4">
                {plan.originalPrice && (
                  <span className={cn(
                    "text-lg line-through",
                    selectedPlan === plan.id ? "text-gray-400" : "text-gray-500"
                  )}>
                    R$ {plan.originalPrice.toFixed(2)}
                  </span>
                )}
                <span className={cn(
                  "text-4xl font-bold",
                  selectedPlan === plan.id ? "text-gray-900" : "text-white"
                )}>
                  R$ {plan.price.toFixed(2)}
                </span>
                <span className={cn(
                  "text-lg",
                  selectedPlan === plan.id ? "text-gray-500" : "text-gray-400"
                )}>{plan.period}</span>
              </div>
              <div className={cn(
                "h-6 w-6 rounded-full border-2 flex items-center justify-center ml-auto",
                selectedPlan === plan.id 
                  ? "border-amber-500 bg-amber-500" 
                  : "border-gray-500"
              )}>
                {selectedPlan === plan.id && <Check className="h-4 w-4 text-white" />}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mb-20">
          <Button 
            onClick={handleSubscribe}
            size="lg"
            className="bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-black font-semibold px-12 py-7 text-lg rounded-2xl shadow-2xl shadow-amber-500/30 group"
          >
            <Crown className="h-6 w-6 mr-2" />
            Assinar Agora
            <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
          <p className="text-gray-400 mt-4 flex items-center justify-center gap-2">
            <Shield className="h-4 w-4" />
            Garantia de 7 dias ou seu dinheiro de volta
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-10">
            O que você ganha sendo Premium
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, i) => (
              <div 
                key={i}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all"
              >
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center mb-4">
                  <benefit.icon className="h-6 w-6 text-amber-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">{benefit.title}</h3>
                <p className="text-gray-400 text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}