import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { user_email, full_name } = await req.json();

    if (!user_email || !full_name) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await base44.integrations.Core.SendEmail({
      to: user_email,
      from_name: 'Aurum',
      subject: 'Bem-vindo ao Aurum! 🎉 Confirme sua conta',
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
              .greeting { font-size: 20px; color: #333; margin: 20px 0; }
              .content { color: #666; line-height: 1.6; margin: 20px 0; }
              .button { display: inline-block; background: linear-gradient(135deg, #8B5CF6, #7C3AED); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">👑 Aurum</div>
                <p style="color: #999;">Sua plataforma de finanças inteligente</p>
              </div>

              <div class="greeting">Olá ${full_name}! 👋</div>

              <div class="content">
                <p>Parabéns! Sua conta no Aurum foi criada com sucesso! 🚀</p>
                
                <p>Você agora tem acesso a:</p>
                <ul>
                  <li>💼 Gestão completa de carteira de investimentos</li>
                  <li>📊 Análise detalhada de ações e fundos</li>
                  <li>💰 Controle de finanças pessoais</li>
                  <li>📚 Cursos e conteúdo educacional</li>
                  <li>👥 Comunidade de investidores</li>
                  <li>🎯 Planejamento financeiro inteligente</li>
                </ul>

                <p><strong>Próximos passos:</strong></p>
                <ol>
                  <li>Acesse sua conta e complete seu perfil</li>
                  <li>Defina seu perfil de risco e objetivos</li>
                  <li>Comece a adicionar seus investimentos</li>
                  <li>Explore nossos recursos educacionais</li>
                </ol>
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

    return Response.json({ success: true, message: 'Welcome email sent' });
  } catch (error) {
    console.error('Error sending email:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});