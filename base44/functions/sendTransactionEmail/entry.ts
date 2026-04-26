import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const categoryLabels = {
  salario: '💼 Salário',
  pix_recebido: '📱 PIX Recebido',
  bonus: '🎁 Bônus',
  aluguel: '🏠 Aluguel',
  alimentacao: '🍔 Alimentação',
  lazer: '🎬 Lazer',
  cartao_credito: '💳 Cartão de Crédito',
  assinaturas: '🔔 Assinaturas',
  transporte: '🚗 Transporte',
  saude: '🏥 Saúde',
  outros: '📦 Outros'
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { user_email, type, category, amount, description, transaction_date } = await req.json();

    if (!user_email || !type || !amount) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const categoryLabel = categoryLabels[category] || category;
    const isIncome = type === 'entrada';
    const icon = isIncome ? '📈' : '📉';
    const color = isIncome ? '#10B981' : '#EF4444';
    const typeLabel = isIncome ? 'Entrada' : 'Saída';
    const formattedAmount = amount.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    const dateObj = new Date(transaction_date);
    const formattedDate = dateObj.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    await base44.integrations.Core.SendEmail({
      to: user_email,
      from_name: 'Aurum',
      subject: `${icon} ${typeLabel}: R$ ${formattedAmount} registrada`,
      body: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
              .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .header { text-align: center; margin-bottom: 30px; }
              .logo { font-size: 28px; font-weight: bold; color: #8B5CF6; margin-bottom: 10px; }
              .amount-box { background: linear-gradient(135deg, ${color}22, ${color}11); border-left: 4px solid ${color}; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .amount-display { font-size: 32px; font-weight: bold; color: ${color}; }
              .type-label { color: #666; font-size: 14px; margin-top: 5px; }
              .detail-box { background: #f0f0f0; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #ddd; }
              .detail-label { color: #666; font-weight: bold; }
              .detail-value { color: #333; font-size: 16px; }
              .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">👑 Aurum</div>
              </div>

              <div class="amount-box">
                <div class="type-label">${typeLabel}</div>
                <div class="amount-display">R$ ${formattedAmount}</div>
              </div>

              <div class="detail-box">
                <div class="detail-row">
                  <span class="detail-label">Categoria:</span>
                  <span class="detail-value">${categoryLabel}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Data:</span>
                  <span class="detail-value">${formattedDate}</span>
                </div>
                ${description ? `
                <div class="detail-row">
                  <span class="detail-label">Descrição:</span>
                  <span class="detail-value">${description}</span>
                </div>
                ` : ''}
              </div>

              <p style="text-align: center; color: #666; margin-top: 20px;">
                Você pode gerenciar todas as suas transações no painel de controle.
              </p>

              <div class="footer">
                <p>Este é um e-mail automático, por favor não responda.</p>
                <p>© 2026 Aurum. Todos os direitos reservados.</p>
              </div>
            </div>
          </body>
        </html>
      `
    });

    return Response.json({ success: true, message: 'Transaction email sent' });
  } catch (error) {
    console.error('Error sending email:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});