import { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import PushNotificationService from "./PushNotificationService";

export default function PortfolioNotificationManager({ userEmail, portfolio, goals }) {
  useEffect(() => {
    if (!userEmail) return;

    // Inicializar serviço de notificações
    initPushNotifications();
    checkPortfolioAlerts();
  }, [userEmail, portfolio, goals]);

  const initPushNotifications = async () => {
    const initialized = await PushNotificationService.init();
    if (initialized && !PushNotificationService.isEnabled()) {
      await PushNotificationService.requestPermission();
    }
  };

  const checkPortfolioAlerts = async () => {
    try {
      // Verificar se há metas próximas de serem alcançadas
      if (goals && goals.length > 0) {
        goals.forEach((goal) => {
          const progress = (goal.current_amount / goal.target_amount) * 100;
          
          // Notificar se passou 75%, 90% ou 100%
          if (progress >= 75 && progress < 76) {
            PushNotificationService.notify(
              "Meta de Investimento em Progresso! 📈",
              {
                tag: `goal-${goal.id}`,
                body: `${goal.title} está 75% completa. Mantendo o ritmo!`,
                requireInteraction: false
              }
            );
          } else if (progress >= 90 && progress < 91) {
            PushNotificationService.notify(
              "Quase Lá! Você está Perto da Meta! 🎯",
              {
                tag: `goal-${goal.id}`,
                body: `${goal.title} está 90% completa. Pouco falta!`,
                requireInteraction: false
              }
            );
          } else if (progress >= 100) {
            PushNotificationService.notify(
              "Parabéns! Meta Alcançada! 🎉",
              {
                tag: `goal-${goal.id}`,
                body: `Você alcançou a meta: ${goal.title}`,
                requireInteraction: true
              }
            );
          }
        });
      }

      // Verificar variação significativa da carteira
      if (portfolio) {
        const dailyVariation = portfolio.daily_variation_percent || 0;
        
        if (dailyVariation >= 5) {
          PushNotificationService.notify(
            "Carteira em Alta! 📈",
            {
              tag: "portfolio-high",
              body: `Sua carteira subiu ${dailyVariation.toFixed(2)}% hoje`,
              requireInteraction: false
            }
          );
        } else if (dailyVariation <= -5) {
          PushNotificationService.notify(
            "Atenção: Carteira em Queda 📉",
            {
              tag: "portfolio-low",
              body: `Sua carteira caiu ${Math.abs(dailyVariation).toFixed(2)}% hoje`,
              requireInteraction: false
            }
          );
        }
      }
    } catch (err) {
      console.error("Erro ao verificar alertas:", err);
    }
  };

  return null;
}