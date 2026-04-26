import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, message, type, severity, send_email } = await req.json();

    // Create in-app notification
    const notification = await base44.entities.Notification.create({
      user_email: user.email,
      type: type || 'atualizacao_plataforma',
      title,
      message,
      severity: severity || 'info',
      is_read: false
    });

    // Send email for critical notifications if enabled
    if (send_email) {
      const alertSettings = await base44.entities.AlertSettings.filter({ 
        user_email: user.email 
      });
      
      const shouldSendEmail = alertSettings.length === 0 || 
        (severity === 'error' || severity === 'warning');

      if (shouldSendEmail) {
        await base44.integrations.Core.SendEmail({
          to: user.email,
          subject: `🔔 ${title} - Aurum`,
          body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0f0f23; color: #ffffff;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #a78bfa; margin: 0;">Aurum</h1>
                <p style="color: #9ca3af; font-size: 14px; margin-top: 5px;">Plataforma de Educação Financeira</p>
              </div>

              <div style="background: linear-gradient(to bottom right, #1e1b4b, #312e81); padding: 30px; border-radius: 12px; border: 1px solid #4c1d95;">
                <h2 style="color: #ffffff; margin-top: 0; font-size: 24px;">${title}</h2>
                <p style="color: #d1d5db; line-height: 1.6; font-size: 16px;">${message}</p>
                
                ${severity === 'error' ? `
                  <div style="background-color: #7f1d1d; padding: 15px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #ef4444;">
                    <p style="margin: 0; color: #fca5a5; font-weight: bold;">⚠️ Ação Necessária</p>
                  </div>
                ` : ''}
                
                ${severity === 'warning' ? `
                  <div style="background-color: #78350f; padding: 15px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #f59e0b;">
                    <p style="margin: 0; color: #fcd34d; font-weight: bold;">⚡ Atenção</p>
                  </div>
                ` : ''}
              </div>

              <div style="text-align: center; margin-top: 30px;">
                <a href="${Deno.env.get('APP_URL') || 'https://app.base44.com'}" 
                   style="display: inline-block; background: linear-gradient(to right, #8b5cf6, #7c3aed); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                  Acessar Plataforma
                </a>
              </div>

              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #374151;">
                <p style="color: #6b7280; font-size: 12px; margin: 0;">
                  © ${new Date().getFullYear()} Aurum. Todos os direitos reservados.
                </p>
                <p style="color: #6b7280; font-size: 12px; margin-top: 10px;">
                  Você está recebendo este e-mail porque esta notificação é crítica para sua conta.
                </p>
              </div>
            </div>
          `
        });
      }
    }

    return Response.json({ 
      success: true, 
      notification,
      email_sent: send_email 
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});