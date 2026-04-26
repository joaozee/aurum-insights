import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Sends batch notifications to multiple users
 * Admin only function for system-wide notifications
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ 
        error: 'Forbidden: Admin access required' 
      }, { status: 403 });
    }

    const { 
      user_emails, 
      title, 
      message, 
      type, 
      severity, 
      send_email 
    } = await req.json();

    if (!user_emails || !Array.isArray(user_emails) || user_emails.length === 0) {
      return Response.json({ 
        error: 'user_emails array is required' 
      }, { status: 400 });
    }

    if (!title || !message) {
      return Response.json({ 
        error: 'title and message are required' 
      }, { status: 400 });
    }

    const results = {
      success: [],
      failed: []
    };

    // Create notifications for all users
    for (const email of user_emails) {
      try {
        // Create in-app notification
        await base44.asServiceRole.entities.Notification.create({
          user_email: email,
          type: type || 'atualizacao_plataforma',
          title,
          message,
          severity: severity || 'info',
          is_read: false
        });

        // Send email if requested
        if (send_email) {
          await base44.integrations.Core.SendEmail({
            to: email,
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
                </div>
              </div>
            `
          });
        }

        results.success.push(email);
      } catch (error) {
        console.error(`Failed for ${email}:`, error);
        results.failed.push({ email, error: error.message });
      }
    }

    return Response.json({ 
      success: true,
      total: user_emails.length,
      successful: results.success.length,
      failed: results.failed.length,
      results
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});