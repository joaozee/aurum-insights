import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { user_email, full_name, verification_code } = await req.json();

    if (!user_email || !verification_code) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const code = String(verification_code).toUpperCase();

    await base44.integrations.Core.SendEmail({
      to: user_email,
      from_name: 'Aurum',
      subject: 'Código de verificação: ' + code,
      body: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .header { text-align: center; margin-bottom: 30px; }
              .logo { font-size: 28px; font-weight: bold; color: #8B5CF6; margin-bottom: 10px; }
              .greeting { font-size: 18px; color: #333; margin: 20px 0; }
              .content { color: #666; line-height: 1.6; margin: 20px 0; font-size: 14px; }
              .code-box { 
                background: linear-gradient(135deg, #8B5CF6, #7C3AED); 
                color: white; 
                padding: 30px; 
                border-radius: 8px; 
                margin: 30px 0; 
                text-align: center;
              }
              .code-label { font-size: 12px; opacity: 0.9; margin-bottom: 10px; letter-spacing: 2px; }
              .code-display { 
                font-size: 36px; 
                font-weight: bold; 
                letter-spacing: 8px; 
                font-family: 'Courier New', monospace;
                word-spacing: 10px;
              }
              .warning { 
                background: #FEF3C7; 
                border-left: 4px solid #F59E0B; 
                padding: 15px; 
                border-radius: 4px; 
                margin: 20px 0;
                font-size: 13px;
                color: #92400E;
              }
              .footer { 
                text-align: center; 
                color: #999; 
                font-size: 12px; 
                margin-top: 30px; 
                border-top: 1px solid #eee; 
                padding-top: 20px; 
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">👑 Aurum</div>
              </div>

              <div class="greeting">Olá ${full_name || 'usuário'}! 👋</div>

              <div class="content">
                <p>Obrigado por se cadastrar no Aurum! Para ativar sua conta, use o código de verificação abaixo:</p>
              </div>

              <div class="code-box">
                <div class="code-label">CÓDIGO DE VERIFICAÇÃO</div>
                <div class="code-display">${code}</div>
              </div>

              <div class="content">
                <p><strong>Como usar o código:</strong></p>
                <ol>
                  <li>Copie o código acima</li>
                  <li>Cole na tela de verificação do Aurum</li>
                  <li>Sua conta será ativada imediatamente</li>
                </ol>
              </div>

              <div class="warning">
                ⚠️ <strong>Aviso importante:</strong> Este código é válido por 24 horas. Nunca compartilhe este código com ninguém. O Aurum nunca pedirá seu código por e-mail ou mensagem.
              </div>

              <div class="content" style="text-align: center; margin-top: 30px;">
                <p style="color: #999; font-size: 12px;">Não solicitou este código? Ignore este e-mail ou entre em contato conosco.</p>
              </div>

              <div class="footer">
                <p>© 2026 Aurum. Todos os direitos reservados.</p>
                <p>Este é um e-mail automático, por favor não responda.</p>
              </div>
            </div>
          </body>
        </html>
      `
    });

    return Response.json({ success: true, message: 'Verification email sent' });
  } catch (error) {
    console.error('Error sending email:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});