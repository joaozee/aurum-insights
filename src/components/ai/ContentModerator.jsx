import { base44 } from "@/api/base44Client";

export const ContentModerator = {
  async moderateContent(content, authorEmail) {
    try {
      const prompt = `
Você é um moderador de conteúdo para uma comunidade de investimentos.

Analise o seguinte post e determine se é apropriado:

**Conteúdo:**
"${content}"

**Critérios de Moderação:**
- Proibido: spam, linguagem ofensiva, discurso de ódio, esquemas fraudulentos, promessas de retornos garantidos
- Permitido: discussões sobre investimentos, dúvidas, compartilhamento de estratégias, análises
- Alerta: recomendações específicas de compra/venda sem justificativa fundamentada

Classifique como:
- "aprovado": Conteúdo apropriado
- "revisao": Conteúdo questionável que precisa revisão
- "rejeitado": Conteúdo inadequado

Se rejeitado ou em revisão, forneça um motivo claro.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            status: { 
              type: "string",
              enum: ["aprovado", "revisao", "rejeitado"]
            },
            motivo: { 
              type: "string",
              description: "Motivo da decisão"
            },
            confianca: {
              type: "number",
              description: "Confiança na decisão (0-100)"
            },
            sugestao_edicao: {
              type: "string",
              description: "Sugestão de como melhorar o conteúdo se aplicável"
            }
          }
        }
      });

      return response;
    } catch (error) {
      console.error("Erro na moderação:", error);
      return { status: "aprovado", motivo: "Erro na moderação, aprovado por padrão" };
    }
  }
};