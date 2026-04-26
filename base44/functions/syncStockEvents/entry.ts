import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const brapiKey = Deno.env.get("BRAPI_API_KEY");

    // Buscar ativos do usuário
    const assets = await base44.entities.Asset.filter({
      user_email: user.email,
      type: "acoes"
    });

    if (assets.length === 0) {
      return Response.json({ 
        success: true, 
        message: "Nenhuma ação na carteira",
        eventsCreated: 0 
      });
    }

    const tickers = [...new Set(assets.map(a => a.name))];
    let eventsCreated = 0;

    for (const ticker of tickers) {
      try {
        // Buscar dividendos
        const dividendsResponse = await fetch(
          `https://brapi.dev/api/quote/${ticker}?modules=dividendsData&token=${brapiKey}`
        );
        const dividendsData = await dividendsResponse.json();

        if (dividendsData.results?.[0]?.dividendsData?.cashDividends) {
          const dividends = dividendsData.results[0].dividendsData.cashDividends;
          
          // Pegar apenas dividendos futuros ou recentes (últimos 6 meses)
          const sixMonthsAgo = new Date();
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

          for (const dividend of dividends.slice(0, 10)) {
            if (dividend.paymentDate) {
              const paymentDate = new Date(dividend.paymentDate);
              
              if (paymentDate >= sixMonthsAgo) {
                // Verificar se o evento já existe
                const existingEvents = await base44.entities.FinancialEvent.filter({
                  user_email: user.email,
                  account_type: "pessoal",
                  event_type: "transacao",
                  title: `Dividendo ${ticker}`,
                  event_date: dividend.paymentDate
                });

                if (existingEvents.length === 0) {
                  await base44.asServiceRole.entities.FinancialEvent.create({
                    user_email: user.email,
                    account_type: "pessoal",
                    title: `Dividendo ${ticker}`,
                    description: `Pagamento de dividendo: R$ ${dividend.rate?.toFixed(2) || 'N/A'} por ação`,
                    event_type: "transacao",
                    event_date: dividend.paymentDate,
                    amount: dividend.rate || 0,
                    category: "Dividendos",
                    status: paymentDate < new Date() ? "pago" : "pendente"
                  });
                  eventsCreated++;
                }
              }
            }

            // Data COM (último dia para ter direito ao dividendo)
            if (dividend.approvedOn) {
              const comDate = new Date(dividend.approvedOn);
              
              if (comDate >= sixMonthsAgo) {
                const existingEvents = await base44.entities.FinancialEvent.filter({
                  user_email: user.email,
                  account_type: "pessoal",
                  event_type: "outro",
                  title: `Data COM - ${ticker}`,
                  event_date: dividend.approvedOn
                });

                if (existingEvents.length === 0) {
                  await base44.asServiceRole.entities.FinancialEvent.create({
                    user_email: user.email,
                    account_type: "pessoal",
                    title: `Data COM - ${ticker}`,
                    description: `Último dia para ter direito ao dividendo de R$ ${dividend.rate?.toFixed(2) || 'N/A'}`,
                    event_type: "outro",
                    event_date: dividend.approvedOn,
                    category: "Dividendos",
                    reminder_enabled: true,
                    reminder_days_before: 3
                  });
                  eventsCreated++;
                }
              }
            }
          }
        }

        // Buscar informações gerais para resultados trimestrais
        const quoteResponse = await fetch(
          `https://brapi.dev/api/quote/${ticker}?fundamental=true&token=${brapiKey}`
        );
        const quoteData = await quoteResponse.json();

        // Criar eventos para resultados trimestrais (estimativa)
        // Geralmente empresas divulgam resultados 45 dias após o fim do trimestre
        const now = new Date();
        const quarters = [
          { month: 4, day: 15, name: "1T" }, // Meados de maio (resultados do 1T)
          { month: 7, day: 15, name: "2T" }, // Meados de agosto (resultados do 2T)
          { month: 10, day: 15, name: "3T" }, // Meados de novembro (resultados do 3T)
          { month: 1, day: 15, name: "4T" }  // Meados de fevereiro (resultados do 4T)
        ];

        for (const quarter of quarters) {
          let quarterDate = new Date(now.getFullYear(), quarter.month, quarter.day);
          
          // Se a data já passou este ano, usar o próximo ano
          if (quarterDate < now) {
            quarterDate = new Date(now.getFullYear() + 1, quarter.month, quarter.day);
          }

          const existingEvents = await base44.entities.FinancialEvent.filter({
            user_email: user.email,
            account_type: "pessoal",
            event_type: "outro",
            title: `Resultados ${quarter.name} - ${ticker}`,
            event_date: quarterDate.toISOString().split('T')[0]
          });

          if (existingEvents.length === 0) {
            await base44.asServiceRole.entities.FinancialEvent.create({
              user_email: user.email,
              account_type: "pessoal",
              title: `Resultados ${quarter.name} - ${ticker}`,
              description: `Divulgação de resultados trimestrais da ${quoteData.results?.[0]?.longName || ticker}`,
              event_type: "outro",
              event_date: quarterDate.toISOString().split('T')[0],
              category: "Resultados",
              reminder_enabled: true,
              reminder_days_before: 1
            });
            eventsCreated++;
          }
        }

        // Pequeno delay para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (err) {
        console.error(`Erro ao processar ${ticker}:`, err);
      }
    }

    return Response.json({
      success: true,
      message: `${eventsCreated} eventos criados`,
      eventsCreated,
      tickersProcessed: tickers.length
    });

  } catch (error) {
    console.error(error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});