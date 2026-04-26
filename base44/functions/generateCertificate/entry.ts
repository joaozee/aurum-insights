import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.2';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userName, courseTitle, completionDate, template = 'aurum', course_description = '' } = await req.json();

    if (!userName || !courseTitle || !completionDate) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate personalized instructor message using AI
    let instructorMessage = '';
    if (course_description) {
      try {
        const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Com base neste curso: "${courseTitle}" - ${course_description}. Gere uma mensagem curta e inspiradora (máximo 15 palavras) de um instrutor parabenizando o aluno pela conclusão. Seja motivador e específico ao curso.`,
          response_json_schema: {
            type: "object",
            properties: {
              message: { type: "string" }
            }
          }
        });
        instructorMessage = aiResponse.message || '';
      } catch (e) {
        instructorMessage = 'Parabéns pela dedicação e conquista!';
      }
    }

    // Generate PDF
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Template configurations
    const templates = {
      aurum: {
        primary: [124, 58, 237], // violet
        secondary: [245, 158, 11], // gold
        background: [0, 0, 0], // black
        text: [255, 255, 255] // white
      },
      elegant: {
        primary: [55, 65, 81], // gray-700
        secondary: [167, 139, 250], // violet-400
        background: [255, 255, 255], // white
        text: [31, 41, 55] // gray-800
      },
      modern: {
        primary: [59, 130, 246], // blue-500
        secondary: [16, 185, 129], // green-500
        background: [17, 24, 39], // gray-900
        text: [255, 255, 255] // white
      }
    };

    const currentTemplate = templates[template] || templates.aurum;
    const primaryColor = currentTemplate.primary;
    const secondaryColor = currentTemplate.secondary;
    const bgColor = currentTemplate.background;
    const textColor = currentTemplate.text;

    // Set background
    pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    // Add decorative border
    pdf.setDrawColor(textColor[0], textColor[1], textColor[2]);
    pdf.setLineWidth(3);
    pdf.rect(15, 15, pageWidth - 30, pageHeight - 30);

    // Lighter inner border
    pdf.setLineWidth(1);
    pdf.rect(20, 20, pageWidth - 40, pageHeight - 40);

    // Add decorative circles
    pdf.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    pdf.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    pdf.circle(pageWidth - 30, 30, 15, 'F');
    pdf.circle(30, pageHeight - 30, 15, 'F');

    // Aurum Academy Logo/Header
    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Aurum Academy', pageWidth / 2, 50, { align: 'center' });

    // Certificate title
    pdf.setFontSize(14);
    pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
    pdf.setFont('helvetica', 'normal');
    pdf.text('CERTIFICADO DE CONCLUSÃO', pageWidth / 2, 68, { align: 'center' });

    // Decorative line
    pdf.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    pdf.setLineWidth(2);
    pdf.line(pageWidth / 2 - 40, 72, pageWidth / 2 + 40, 72);

    // Main text
    pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Este certificado é concedido a', pageWidth / 2, 90, { align: 'center' });

    // User name
    pdf.setFontSize(28);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.text(userName, pageWidth / 2, 110, { align: 'center' });

    // Underline for name
    pdf.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    pdf.setLineWidth(1.5);
    pdf.line(pageWidth / 2 - 60, 115, pageWidth / 2 + 60, 115);

    // Course completion text
    pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('por ter completado com sucesso o curso', pageWidth / 2, 130, { align: 'center' });

    // Course title
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    const courseLines = pdf.splitTextToSize(courseTitle, pageWidth - 60);
    pdf.text(courseLines, pageWidth / 2, 145, { align: 'center' });

    // Instructor personalized message (if available)
    if (instructorMessage) {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      const messageLines = pdf.splitTextToSize(`"${instructorMessage}"`, pageWidth - 80);
      pdf.text(messageLines, pageWidth / 2, 158, { align: 'center' });
    }

    // Bottom info - date and verification code
    const yBottomInfo = instructorMessage ? 172 : 165;
    pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('DATA DE CONCLUSÃO', pageWidth / 2 - 50, yBottomInfo, { align: 'center' });
    pdf.text('CÓDIGO DE VERIFICAÇÃO', pageWidth / 2 + 50, yBottomInfo, { align: 'center' });

    // Date and verification code
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.text(completionDate, pageWidth / 2 - 50, yBottomInfo + 10, { align: 'center' });

    // Generate verification code from user email hash
    const verificationCode = user.email.substring(0, 3).toUpperCase() + 
      Math.random().toString(36).substring(2, 8).toUpperCase() + 
      new Date(completionDate).getFullYear().toString().slice(-2);
    pdf.text(verificationCode, pageWidth / 2 + 50, yBottomInfo + 10, { align: 'center' });

    // Footer
    pdf.setFontSize(9);
    pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
    pdf.setFont('helvetica', 'italic');
    pdf.text('Aurum Academy © 2026 • Certificado Oficial', pageWidth / 2, pageHeight - 15, { align: 'center' });

    // Get PDF as array buffer
    const pdfArrayBuffer = pdf.output('arraybuffer');
    const pdfBytes = new Uint8Array(pdfArrayBuffer);

    // Generate filename
    const fileName = `certificado-${userName.replace(/\s+/g, '-').toLowerCase()}.pdf`;

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': pdfBytes.length.toString()
      }
    });
  } catch (error) {
    console.error('Certificate generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});