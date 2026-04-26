import { base44 } from "@/api/base44Client";

export const TransactionCategorizer = {
  async categorizeTransaction(description, amount, userEmail = null) {
    try {
      // Verificar aprendizados anteriores do usuário
      let userLearnings = "";
      if (userEmail) {
        const feedbacks = await base44.entities.TransactionFeedback.filter({ user_email: userEmail });
        if (feedbacks.length > 0) {
          const recentFeedbacks = feedbacks.slice(-20); // Últimos 20 feedbacks
          userLearnings = "\n\n**Aprendizados do Usuário (use para melhorar a precisão):**\n";
          recentFeedbacks.forEach(f => {
            userLearnings += `- "${f.description}" (R$ ${f.amount}) → ${f.user_corrected_type}, ${f.user_corrected_category}\n`;
          });
        }
      }

      // Detectar se é transação recorrente
      const isRecurring = await this.detectRecurring(description, userEmail);
      let recurringHint = "";
      if (isRecurring) {
        recurringHint = `\n\n**IMPORTANTE:** Esta transação parece ser RECORRENTE. Use as categorizações anteriores do usuário para esta descrição similar.`;
      }

      const prompt = `
Você é um assistente especializado em categorização de transações financeiras brasileiras.

**Tarefa:** Analise a transação e retorne o tipo e categoria corretos.

**Transação:**
- Descrição: "${description}"
- Valor: R$ ${amount}
${recurringHint}

**Regras de Categorização:**

ENTRADAS (type: "entrada"):
- "salario": Pagamento de salário, remuneração mensal, adiantamento salarial, pró-labore, honorários
- "pix_recebido": PIX recebido, transferências recebidas, TED/DOC recebido
- "bonus": Bônus, comissão, 13º salário, premiação, gratificação, PLR
- "outros": Reembolsos, venda de produtos, freelance, renda extra, dividendos, outros recebimentos

SAÍDAS (type: "saida"):
- "aluguel": Aluguel, condomínio, IPTU, taxa de condomínio, seguro residencial
- "alimentacao": Supermercado, mercado, padaria, açougue, restaurante, lanchonete, delivery, iFood, Rappi, 99Food, fast food (McDonald's, Burger King, Bob's, Subway, KFC), cafeteria (Starbucks, Santo Grão), feira, hortifrutti
- "lazer": Cinema, teatro, viagem, passeio, parque, show, festa, entretenimento, hobby, streaming de jogos, eventos esportivos, club, balada
- "cartao_credito": Fatura cartão de crédito, pagamento de fatura, anuidade de cartão
- "assinaturas": Netflix, Spotify, Amazon Prime, YouTube Premium, Disney+, HBO Max, Apple One, Microsoft 365, iCloud, Google One, Dropbox, academia, box, Crossfit, pilates, yoga, clube de assinatura, jornais, revistas
- "transporte": Gasolina, combustível, etanol, diesel, Uber, 99, Cabify, táxi, metrô, ônibus, trem, aplicativos de transporte, estacionamento, pedágio, lavagem de carro, manutenção veículo, oficina, troca de óleo, pneus, IPVA, licenciamento, seguro auto
- "saude": Médico, dentista, consulta, farmácia, remédio, medicamento, plano de saúde, Unimed, Amil, Bradesco Saúde, exame, laboratório, hospital, terapia, psicólogo, fisioterapia, academia terapêutica, ótica, lentes
- "outros": Compras diversas, roupas, calçados, eletrônicos, celular, computador, presentes, cosméticos, perfumaria, pet shop, veterinário, educação, cursos, livros, presentes, doações, taxas bancárias, empréstimos, outros gastos

**Exemplos Complexos para Treinar:**

ALIMENTAÇÃO:
- "Almoço no Outback" (R$ 150) → saida, alimentacao
- "iFood - Sushi da Casa" (R$ 85) → saida, alimentacao
- "Padaria Santa Terezinha" (R$ 12.50) → saida, alimentacao
- "McDonald's Drive Thru" (R$ 35) → saida, alimentacao
- "Mercado Extra compras do mês" (R$ 680) → saida, alimentacao
- "Feira livre verduras" (R$ 45) → saida, alimentacao
- "Starbucks café" (R$ 18) → saida, alimentacao

TRANSPORTE:
- "Uber Aeroporto GRU" (R$ 85) → saida, transporte
- "Shell Select gasolina" (R$ 250) → saida, transporte
- "99Pop Casa-Trabalho" (R$ 12) → saida, transporte
- "Estacionamento Shopping" (R$ 20) → saida, transporte
- "Lavagem carro completa" (R$ 60) → saida, transporte
- "Troca de óleo oficina" (R$ 180) → saida, transporte
- "Pedágio Via Dutra" (R$ 15.30) → saida, transporte

ASSINATURAS:
- "Netflix Plano Premium" (R$ 55.90) → saida, assinaturas
- "Spotify Family" (R$ 34.90) → saida, assinaturas
- "Amazon Prime Video" (R$ 14.90) → saida, assinaturas
- "Academia SmartFit mensalidade" (R$ 89.90) → saida, assinaturas
- "Crossfit Box mensalidade" (R$ 350) → saida, assinaturas
- "iCloud 200GB" (R$ 14.90) → saida, assinaturas

SAÚDE:
- "Farmácia Drogasil remédios" (R$ 95) → saida, saude
- "Consulta Dr. Silva" (R$ 400) → saida, saude
- "Unimed mensalidade" (R$ 580) → saida, saude
- "Laboratório exames" (R$ 220) → saida, saude
- "Dentista limpeza" (R$ 180) → saida, saude
- "Ótica óculos novos" (R$ 850) → saida, saude

LAZER:
- "Cinemark ingresso" (R$ 45) → saida, lazer
- "Show Coldplay ingresso" (R$ 650) → saida, lazer
- "Viagem Airbnb Gramado" (R$ 1200) → saida, lazer
- "Parque aquático" (R$ 120) → saida, lazer

ENTRADAS:
- "Salário Janeiro empresa" (R$ 8500) → entrada, salario
- "PIX João Silva" (R$ 200) → entrada, pix_recebido
- "Comissão vendas" (R$ 1500) → entrada, bonus
- "13º salário" (R$ 8500) → entrada, bonus
- "Freelance projeto" (R$ 3000) → entrada, outros

CASOS RAROS/COMPLEXOS:
- "Pagamento cartão Nubank fatura" (R$ 2500) → saida, cartao_credito
- "IPTU 1ª parcela" (R$ 280) → saida, aluguel
- "Condomínio março" (R$ 450) → saida, aluguel
- "Curso Udemy desenvolvimento" (R$ 27.90) → saida, outros
- "Pet shop ração cachorro" (R$ 180) → saida, outros
- "Presente aniversário mãe" (R$ 250) → saida, outros
- "Doação ONG animais" (R$ 50) → saida, outros
- "Taxa bancária manutenção" (R$ 25) → saida, outros
${userLearnings}

**Instruções de Confiança:**
- Alta confiança (90-100%): Termos muito claros e inequívocos (ex: "Netflix", "Uber", "Salário")
- Média confiança (70-89%): Contexto claro mas pode ter ambiguidade (ex: "Almoço restaurante")
- Baixa confiança (50-69%): Descrição vaga ou ambígua (ex: "Compra", "Pagamento")

Analise o contexto completo: estabelecimento, palavras-chave, valor, e padrões recorrentes.
Para transações recorrentes, use alta confiança baseada em histórico.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            type: { 
              type: "string",
              enum: ["entrada", "saida"]
            },
            category: { 
              type: "string"
            },
            confidence: {
              type: "number",
              description: "Confiança na categorização (0-100)"
            },
            is_recurring: {
              type: "boolean",
              description: "Se detectou que é transação recorrente"
            }
          }
        }
      });

      return response;
    } catch (error) {
      console.error("Erro ao categorizar transação:", error);
      return null;
    }
  },

  async detectRecurring(description, userEmail) {
    if (!userEmail) return false;
    
    try {
      // Buscar transações similares do usuário
      const allTransactions = await base44.entities.FinanceTransaction.filter({ 
        user_email: userEmail 
      });
      
      // Normalizar descrição para comparação
      const normalizedDesc = description.toLowerCase().trim();
      
      // Contar transações similares
      const similarCount = allTransactions.filter(t => {
        const tDesc = t.description.toLowerCase().trim();
        return tDesc.includes(normalizedDesc) || normalizedDesc.includes(tDesc);
      }).length;
      
      // Se encontrou 2 ou mais transações similares, considera recorrente
      return similarCount >= 2;
    } catch (error) {
      console.error("Erro ao detectar recorrência:", error);
      return false;
    }
  },

  async saveFeedback(userEmail, description, amount, aiSuggested, userCorrected) {
    try {
      await base44.entities.TransactionFeedback.create({
        user_email: userEmail,
        description,
        amount,
        ai_suggested_type: aiSuggested.type,
        ai_suggested_category: aiSuggested.category,
        user_corrected_type: userCorrected.type,
        user_corrected_category: userCorrected.category,
        is_recurring: await this.detectRecurring(description, userEmail)
      });
    } catch (error) {
      console.error("Erro ao salvar feedback:", error);
    }
  },

  async bulkCategorize(transactions, userEmail = null) {
    const categorized = [];
    
    for (const transaction of transactions) {
      const result = await this.categorizeTransaction(
        transaction.description, 
        transaction.amount,
        userEmail
      );
      
      if (result) {
        categorized.push({
          ...transaction,
          suggested_type: result.type,
          suggested_category: result.category,
          confidence: result.confidence,
          is_recurring: result.is_recurring
        });
      }
    }
    
    return categorized;
  }
};