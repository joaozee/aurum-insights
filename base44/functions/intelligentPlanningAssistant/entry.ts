import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userMessage, transactions } = await req.json();

    // Fetch OpenAI response
    const openaiResponse = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é um assistente financeiro inteligente. Analise a mensagem do usuário e os seus gastos atuais.

GASTOS DO USUÁRIO (últimos 30 dias):
${transactions.map(t => `- ${t.category}: R$ ${t.amount.toFixed(2)} em ${t.transaction_date}`).join('\n')}

MENSAGEM DO USUÁRIO: "${userMessage}"

Responda em JSON com a seguinte estrutura:
{
  "userResponse": "Resposta conversacional para o usuário (em português)",
  "goalsToCreate": [
    {
      "title": "Nome da meta",
      "category": "categoria de gasto (ex: transporte, alimentacao, etc)",
      "targetAmount": número,
      "currentAmount": número,
      "description": "Descrição da meta"
    }
  ],
  "alertsToCreate": [
    {
      "category": "categoria",
      "threshold": número (limite em reais),
      "type": "expense_limit"
    }
  ],
  "notificationMessage": "Mensagem de notificação para o usuário"
}`,
      response_json_schema: {
        type: "object",
        properties: {
          userResponse: { type: "string" },
          goalsToCreate: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                category: { type: "string" },
                targetAmount: { type: "number" },
                currentAmount: { type: "number" },
                description: { type: "string" }
              }
            }
          },
          alertsToCreate: {
            type: "array",
            items: {
              type: "object",
              properties: {
                category: { type: "string" },
                threshold: { type: "number" },
                type: { type: "string" }
              }
            }
          },
          notificationMessage: { type: "string" }
        }
      }
    });

    const aiAnalysis = openaiResponse;

    // Criar metas financeiras
    if (aiAnalysis.goalsToCreate && aiAnalysis.goalsToCreate.length > 0) {
      for (const goal of aiAnalysis.goalsToCreate) {
        await base44.entities.FinancialGoal.create({
          user_email: user.email,
          title: goal.title,
          description: goal.description,
          category: goal.category || "outro",
          target_amount: goal.targetAmount,
          current_amount: goal.currentAmount || 0,
          target_date: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          monthly_contribution: (goal.targetAmount - (goal.currentAmount || 0)) / 1,
          status: "em_progresso"
        });
      }
    }

    // Criar notificação
    if (aiAnalysis.notificationMessage) {
      await base44.entities.Notification.create({
        user_email: user.email,
        type: "analise_ia",
        title: "Análise Financeira",
        message: aiAnalysis.notificationMessage,
        severity: "info"
      });
    }

    return Response.json({
      response: aiAnalysis.userResponse,
      goalsCreated: aiAnalysis.goalsToCreate?.length || 0,
      notificationSent: !!aiAnalysis.notificationMessage
    });
  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});