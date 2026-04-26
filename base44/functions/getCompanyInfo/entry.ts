import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { ticker, company_name } = await req.json();
    if (!ticker) return Response.json({ error: 'ticker required' }, { status: 400 });

    // Verifica cache
    const cached = await base44.asServiceRole.entities.CompanyInfoCache.filter({ ticker });
    if (cached.length > 0) {
      return Response.json({ ...cached[0], from_cache: true });
    }

    // Busca no LLM
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é um analista financeiro especialista em ações brasileiras.
      
Escreva uma análise completa sobre a empresa "${company_name}" (ticker: ${ticker}) listada na B3.

Retorne um JSON com os seguintes campos:
- historia: String com 2-3 parágrafos contando a história da empresa, quando foi fundada, principais marcos
- como_lucra: String com 1-2 parágrafos explicando como a empresa gera receita e lucro
- modelo_negocio: String com 1-2 parágrafos descrevendo o modelo de negócios
- segmentos: Array de objetos com { nome: string, descricao: string } com os 3-5 principais segmentos/linhas de negócio da empresa
- diferenciais: Array de strings com 3-4 vantagens competitivas da empresa
- riscos: Array de strings com 3-4 principais riscos do negócio
- setor_descricao: String curta descrevendo o setor em que atua`,
      response_json_schema: {
        type: "object",
        properties: {
          historia: { type: "string" },
          como_lucra: { type: "string" },
          modelo_negocio: { type: "string" },
          segmentos: {
            type: "array",
            items: {
              type: "object",
              properties: {
                nome: { type: "string" },
                descricao: { type: "string" }
              }
            }
          },
          diferenciais: { type: "array", items: { type: "string" } },
          riscos: { type: "array", items: { type: "string" } },
          setor_descricao: { type: "string" }
        }
      }
    });

    // Salva no cache
    await base44.asServiceRole.entities.CompanyInfoCache.create({ ticker, ...result });

    return Response.json({ ...result, from_cache: false });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});