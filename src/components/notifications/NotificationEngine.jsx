import { base44 } from "@/api/base44Client";
import { brapiService } from "@/components/utils/brapiService";

export const NotificationEngine = {
  // Verificar metas atingidas
  async checkGoalsMilestones(userEmail) {
    try {
      const settings = await this.getSettings(userEmail);
      if (!settings?.goal_progress_alerts) return;

      const goals = await base44.entities.FinancialGoal.filter({ user_email: userEmail });
      
      for (const goal of goals) {
        const progress = (goal.current_amount / goal.target_amount) * 100;
        
        // Alertar em marcos importantes: 25%, 50%, 75%, 90%, 100%
        const milestones = [25, 50, 75, 90, 100];
        const milestone = milestones.find(m => 
          progress >= m && progress < m + 5 // Tolerância de 5% para não duplicar
        );

        if (milestone) {
          const existing = await base44.entities.Notification.filter({
            user_email: userEmail,
            type: "meta_atingida",
            related_entity_id: goal.id
          });

          // Verificar se já foi notificado neste marco
          const alreadyNotified = existing.some(n => 
            n.metadata?.milestone === milestone
          );

          if (!alreadyNotified) {
            await base44.entities.Notification.create({
              user_email: userEmail,
              type: "meta_atingida",
              title: `🎯 Meta ${milestone}% Completa!`,
              message: `Você atingiu ${milestone}% da meta "${goal.title}". Continue assim!`,
              severity: "success",
              related_entity_id: goal.id,
              metadata: { milestone, progress }
            });
          }
        }
      }
    } catch (err) {
      console.error("Erro ao verificar metas:", err);
    }
  },

  // Verificar performance da carteira
  async checkPortfolioPerformance(userEmail, assets) {
    try {
      const settings = await this.getSettings(userEmail);
      if (!settings?.portfolio_performance_alerts) return;

      const threshold = settings.price_variation_threshold || 5;
      
      for (const [ticker, asset] of Object.entries(assets)) {
        const variation = ((asset.current_price - asset.purchase_price) / asset.purchase_price) * 100;
        
        if (Math.abs(variation) >= threshold) {
          const today = new Date().toISOString().split('T')[0];
          
          // Verificar se já alertou hoje
          const existing = await base44.entities.Notification.filter({
            user_email: userEmail,
            type: "variacao_preco",
            related_entity_id: ticker
          });

          const alreadyAlertedToday = existing.some(n => 
            n.created_date?.startsWith(today)
          );

          if (!alreadyAlertedToday) {
            await base44.entities.Notification.create({
              user_email: userEmail,
              type: "variacao_preco",
              title: variation > 0 ? `📈 ${ticker} em Alta!` : `📉 ${ticker} em Queda`,
              message: `${ticker} teve variação de ${variation.toFixed(2)}% em relação ao preço de compra.`,
              severity: variation > 0 ? "success" : "warning",
              related_entity_id: ticker,
              metadata: { variation, current_price: asset.current_price }
            });
          }
        }
      }
    } catch (err) {
      console.error("Erro ao verificar performance:", err);
    }
  },

  // Verificar alertas de preço personalizados
  async checkPriceAlerts(userEmail) {
    try {
      const settings = await this.getSettings(userEmail);
      if (!settings?.price_alerts_enabled) return;

      const alerts = await base44.entities.PriceAlert.filter({ 
        user_email: userEmail,
        is_active: true
      });

      for (const alert of alerts) {
        try {
          const stockData = await brapiService.getQuote(alert.ticker);
          if (!stockData) continue;

          const currentPrice = stockData.regularMarketPrice;
          let triggered = false;

          if (alert.alert_type === "preco_acima" && currentPrice >= alert.target_price) {
            triggered = true;
          } else if (alert.alert_type === "preco_abaixo" && currentPrice <= alert.target_price) {
            triggered = true;
          }

          if (triggered) {
            await base44.entities.Notification.create({
              user_email: userEmail,
              type: "variacao_preco",
              title: `🔔 Alerta: ${alert.ticker}`,
              message: `${alert.ticker} atingiu R$ ${currentPrice.toFixed(2)}. Seu alerta de ${alert.alert_type === "preco_acima" ? "preço acima" : "preço abaixo"} de R$ ${alert.target_price} foi acionado.`,
              severity: "info",
              related_entity_id: alert.ticker,
              metadata: { current_price: currentPrice, alert_id: alert.id }
            });

            // Desativar o alerta
            await base44.entities.PriceAlert.update(alert.id, {
              is_active: false,
              triggered_at: new Date().toISOString()
            });
          }
        } catch (err) {
          console.error(`Erro ao verificar alerta ${alert.ticker}:`, err);
        }
      }
    } catch (err) {
      console.error("Erro ao verificar alertas de preço:", err);
    }
  },

  // Verificar comparação com benchmarks
  async checkBenchmarkComparison(userEmail, portfolioPerformance) {
    try {
      const settings = await this.getSettings(userEmail);
      if (!settings?.benchmark_comparison_alerts) return;

      // Simular dados de benchmark (em produção, buscar dados reais)
      const ibovespaPerformance = 8.5; // % mensal aproximado
      const cdiPerformance = 1.0; // % mensal aproximado

      if (portfolioPerformance > ibovespaPerformance * 1.2) {
        // Carteira 20% superior ao Ibovespa
        await base44.entities.Notification.create({
          user_email: userEmail,
          type: "analise_ia",
          title: "🚀 Carteira Superando o Mercado!",
          message: `Sua carteira está ${((portfolioPerformance - ibovespaPerformance) / ibovespaPerformance * 100).toFixed(1)}% acima do Ibovespa este mês. Excelente trabalho!`,
          severity: "success",
          metadata: { 
            portfolio: portfolioPerformance, 
            ibovespa: ibovespaPerformance 
          }
        });
      } else if (portfolioPerformance < ibovespaPerformance * 0.8) {
        // Carteira 20% inferior ao Ibovespa
        await base44.entities.Notification.create({
          user_email: userEmail,
          type: "analise_ia",
          title: "📊 Atenção: Performance Abaixo do Mercado",
          message: `Sua carteira está ${((ibovespaPerformance - portfolioPerformance) / ibovespaPerformance * 100).toFixed(1)}% abaixo do Ibovespa. Considere revisar sua estratégia.`,
          severity: "warning",
          metadata: { 
            portfolio: portfolioPerformance, 
            ibovespa: ibovespaPerformance 
          }
        });
      }
    } catch (err) {
      console.error("Erro ao verificar benchmarks:", err);
    }
  },

  // Verificar lembretes de aulas não assistidas
  async checkUnwatchedLessons(userEmail) {
    try {
      const settings = await this.getSettings(userEmail);
      if (!settings?.course_reminder_alerts) return;

      const enrollments = await base44.entities.UserEnrollment.filter({ 
        user_email: userEmail 
      });

      for (const enrollment of enrollments) {
        // Verificar se o usuário não progrediu nos últimos 7 dias
        const daysSinceUpdate = enrollment.updated_date 
          ? Math.floor((Date.now() - new Date(enrollment.updated_date).getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        if (daysSinceUpdate >= 7 && enrollment.progress < 100) {
          // Verificar se já notificou recentemente (últimos 7 dias)
          const existing = await base44.entities.Notification.filter({
            user_email: userEmail,
            type: "lembrete_curso",
            related_entity_id: enrollment.course_id
          });

          const recentlyNotified = existing.some(n => {
            const daysSince = Math.floor((Date.now() - new Date(n.created_date).getTime()) / (1000 * 60 * 60 * 24));
            return daysSince < 7;
          });

          if (!recentlyNotified) {
            const course = await base44.entities.Course.filter({ id: enrollment.course_id });
            const courseTitle = course[0]?.title || "Seu curso";

            await base44.entities.Notification.create({
              user_email: userEmail,
              type: "lembrete_curso",
              title: "📚 Continue seus estudos!",
              message: `Você não acessa "${courseTitle}" há ${daysSinceUpdate} dias. Que tal continuar de onde parou?`,
              severity: "info",
              related_entity_id: enrollment.course_id,
              metadata: { 
                progress: enrollment.progress,
                days_inactive: daysSinceUpdate 
              }
            });
          }
        }
      }
    } catch (err) {
      console.error("Erro ao verificar lembretes de curso:", err);
    }
  },

  // Notificar sobre novos conteúdos relacionados aos interesses
  async checkNewRelatedContent(userEmail) {
    try {
      const settings = await this.getSettings(userEmail);
      if (!settings?.new_content_alerts) return;

      // Buscar histórico de visualizações do usuário
      const views = await base44.entities.ContentView.filter({ user_email: userEmail });
      
      if (views.length === 0) return;

      // Identificar categorias de interesse (mais visualizadas)
      const categoryCount = {};
      views.forEach(view => {
        if (view.content_category) {
          categoryCount[view.content_category] = (categoryCount[view.content_category] || 0) + 1;
        }
      });

      const topCategories = Object.entries(categoryCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([cat]) => cat);

      if (topCategories.length === 0) return;

      // Buscar conteúdos novos (últimos 7 dias) nas categorias de interesse
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const newCourses = await base44.entities.Course.list('-created_date', 100);
      const recentCourses = newCourses.filter(c => 
        new Date(c.created_date) > sevenDaysAgo && 
        topCategories.includes(c.category)
      );

      const newContent = await base44.entities.Content.list('-created_date', 100);
      const recentContent = newContent.filter(c => 
        new Date(c.created_date) > sevenDaysAgo && 
        topCategories.includes(c.category)
      );

      // Criar notificação se houver novos conteúdos
      if (recentCourses.length > 0 || recentContent.length > 0) {
        const existing = await base44.entities.Notification.filter({
          user_email: userEmail,
          type: "novo_conteudo"
        });

        const notifiedToday = existing.some(n => {
          const daysSince = Math.floor((Date.now() - new Date(n.created_date).getTime()) / (1000 * 60 * 60 * 24));
          return daysSince < 1;
        });

        if (!notifiedToday) {
          const totalNew = recentCourses.length + recentContent.length;
          await base44.entities.Notification.create({
            user_email: userEmail,
            type: "novo_conteudo",
            title: "🎯 Novos conteúdos para você!",
            message: `${totalNew} novo(s) conteúdo(s) sobre ${topCategories.join(', ')} foram adicionados. Confira agora!`,
            severity: "info",
            metadata: { 
              courses: recentCourses.length,
              content: recentContent.length,
              categories: topCategories
            }
          });
        }
      }
    } catch (err) {
      console.error("Erro ao verificar novos conteúdos:", err);
    }
  },

  // Notificar sobre novas mensagens diretas
  async notifyDirectMessage(recipientEmail, senderName, message) {
    try {
      await base44.entities.Notification.create({
        user_email: recipientEmail,
        type: "mensagem_direta",
        title: `💬 Mensagem de ${senderName}`,
        message: message.substring(0, 100) + (message.length > 100 ? "..." : ""),
        severity: "info",
        metadata: { sender_name: senderName }
      });
    } catch (err) {
      console.error("Erro ao notificar mensagem direta:", err);
    }
  },

  // Notificar sobre resposta a comentário
  async notifyCommentReply(originalCommentAuthorEmail, replierName, postTitle) {
    try {
      await base44.entities.Notification.create({
        user_email: originalCommentAuthorEmail,
        type: "resposta_comentario",
        title: `💬 Resposta de ${replierName}`,
        message: `${replierName} respondeu seu comentário em "${postTitle}"`,
        severity: "info",
        metadata: { replier_name: replierName }
      });
    } catch (err) {
      console.error("Erro ao notificar resposta:", err);
    }
  },

  // Notificar sobre menção
  async notifyMention(mentionedUserEmail, mentionerName, postTitle) {
    try {
      await base44.entities.Notification.create({
        user_email: mentionedUserEmail,
        type: "mencao",
        title: `🏷️ Você foi mencionado por ${mentionerName}`,
        message: `Você foi mencionado em "${postTitle}"`,
        severity: "info",
        metadata: { mentioner_name: mentionerName }
      });
    } catch (err) {
      console.error("Erro ao notificar menção:", err);
    }
  },

  // Notificar sobre conquista de gamificação
  async notifyAchievementUnlocked(userEmail, badgeName, badgeIcon, description) {
    try {
      await base44.entities.Notification.create({
        user_email: userEmail,
        type: "conquista",
        title: `🏆 ${badgeName} Desbloqueada!`,
        message: `Parabéns! Você desbloqueou a badge "${badgeName}": ${description}`,
        severity: "success",
        metadata: { badge_name: badgeName, badge_icon: badgeIcon }
      });
    } catch (err) {
      console.error("Erro ao notificar conquista:", err);
    }
  },

  // Notificar sobre mudanças importantes da plataforma
  async notifyPlatformUpdate(userEmail, updateTitle, updateDescription) {
    try {
      await base44.entities.Notification.create({
        user_email: userEmail,
        type: "atualizacao_plataforma",
        title: `📢 ${updateTitle}`,
        message: updateDescription,
        severity: "info",
        metadata: { update_type: "platform" }
      });
    } catch (err) {
      console.error("Erro ao notificar atualização:", err);
    }
  },

  // Executar todas as verificações
  async runAllChecks(userEmail, portfolioAssets = {}, portfolioPerformance = 0) {
    await Promise.all([
      this.checkGoalsMilestones(userEmail),
      this.checkPortfolioPerformance(userEmail, portfolioAssets),
      this.checkPriceAlerts(userEmail),
      this.checkBenchmarkComparison(userEmail, portfolioPerformance),
      this.checkUnwatchedLessons(userEmail),
      this.checkNewRelatedContent(userEmail)
    ]);
  },

  // Obter configurações
  async getSettings(userEmail) {
    try {
      const data = await base44.entities.AlertSettings.filter({ user_email: userEmail });
      return data[0] || {
        goal_progress_alerts: true,
        portfolio_performance_alerts: true,
        price_alerts_enabled: true,
        benchmark_comparison_alerts: true,
        price_variation_threshold: 5,
        course_reminder_alerts: true,
        new_content_alerts: true
      };
    } catch (err) {
      return null;
    }
  }
};