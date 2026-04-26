import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { user_email, asset_name, quantity, purchase_price } = await req.json();

    if (!user_email || !asset_name) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const totalValue = (quantity * purchase_price).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    await base44.integrations.Core.SendEmail({
      to: user_email,
      from_name: 'Aurum',
      subject: `Novo investimento adicionado: ${asset_name} 📈`,
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
              .alert { background: #10B981; color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; font-size: 18px; font-weight: bold; }
              .detail-box { background: #f0f0f0; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #ddd; }
              .detail-label { color: #666; font-weight: bold; }
              .detail-value { color: #333; font-size: 18px; font-weight: bold; }
              .button { display: inline-block; background: linear-gradient(135deg, #8B5CF6, #7C3AED); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">👑 Aurum</div>
              </div>

              <div class="alert">✓ Investimento adicionado com sucesso!</div>

              <div class="detail-box">
                <div class="detail-row">
                  <span class="detail-label">Ativo:</span>
                  <span class="detail-value">${asset_name}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Quantidade:</span>
                  <span class="detail-value">${quantity}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Preço:</span>
                  <span class="detail-value">R$ ${purchase_price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Total Investido:</span>
                  <span class="detail-value" style="color: #10B981;">R$ ${totalValue}</span>
                </div>
              </div>

              <p style="text-align: center; color: #666;">
                Acesse sua carteira para acompanhar o desempenho deste investimento em tempo real.
              </p>

              <div style="text-align: center;">
                <a href="[APP_URL]/portfolio" class="button">Ver minha carteira</a>
              </div>

              <div class="footer">
                <p>Este é um e-mail automático, por favor não responda.</p>
                <p>© 2026 Aurum. Todos os direitos reservados.</p>
              </div>
            </div>
          </body>
        </html>
      `
    });

    return Response.json({ success: true, message: 'Investment email sent' });
  } catch (error) {
    console.error('Error sending email:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});