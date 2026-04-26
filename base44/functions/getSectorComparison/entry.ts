import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import Brapi from 'npm:brapi@1.0.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { sector, subsector } = await req.json();
    if (!sector) return Response.json({ error: 'Sector required' }, { status: 400 });

    const brapiClient = new Brapi({
      apiKey: Deno.env.get("BRAPI_API_KEY"),
    });

    // Buscar lista de todas as ações disponíveis
    const allStocks = await brapiClient.quote.list();

    if (!allStocks.stocks || allStocks.stocks.length === 0) {
      return Response.json({ error: 'No stocks found' }, { status: 404 });
    }

    console.log(`Total stocks available: ${allStocks.stocks.length}`);
    console.log(`Looking for sector: ${sector}, subsector: ${subsector}`);

    // Filtrar ações do setor especificado
    const sectorStocks = allStocks.stocks.filter(s => {
      if (subsector) {
        return s.subsector === subsector;
      }
      return s.sector === sector;
    });

    console.log(`Found ${sectorStocks.length} stocks for sector/subsector`);
    if (sectorStocks.length > 0) {
      console.log(`Sample stock:`, JSON.stringify(sectorStocks[0]));
    }

    if (sectorStocks.length === 0) {
      return Response.json({ 
        error: 'No stocks found for sector',
        debug: {
          sector,
          subsector,
          availableSectors: [...new Set(allStocks.stocks.map(s => s.sector))].slice(0, 10)
        }
      }, { status: 404 });
    }

    // Buscar dados fundamentalistas em lotes de 20 (limite do plano)
    const BATCH_SIZE = 20;
    const maxStocks = Math.min(sectorStocks.length, 60); // Limitar a 60 empresas (3 lotes)
    const batches = [];
    
    for (let i = 0; i < maxStocks; i += BATCH_SIZE) {
      const batch = sectorStocks.slice(i, i + BATCH_SIZE);
      batches.push(batch.map(s => s.stock).join(','));
    }

    console.log(`Fetching ${batches.length} batches of data`);
    
    // Buscar todos os lotes em paralelo
    const batchResults = await Promise.all(
      batches.map(tickers => 
        brapiClient.quote.retrieve(tickers, {
          modules: 'defaultKeyStatistics,financialData,balanceSheetHistory,incomeStatementHistory'
        })
      )
    );

    // Combinar resultados de todos os lotes
    const allResults = batchResults.flatMap(batch => batch.results || []);
    
    // Calcular médias do setor
    const validStocks = allResults.filter(r => r.financialData && r.defaultKeyStatistics) || [];
    
    if (validStocks.length === 0) {
      return Response.json({ error: 'No valid data for sector' }, { status: 404 });
    }

    const calcAverage = (values) => {
      const filtered = values.filter(v => v != null && !isNaN(v) && isFinite(v));
      if (filtered.length === 0) return null;
      return filtered.reduce((sum, v) => sum + v, 0) / filtered.length;
    };

    const sectorAverages = {
      pe_ratio: calcAverage(validStocks.map(s => s.priceEarnings)),
      pb_ratio: calcAverage(validStocks.map(s => s.defaultKeyStatistics?.priceToBook)),
      dividend_yield: calcAverage(validStocks.map(s => s.defaultKeyStatistics?.dividendYield)),
      roe: calcAverage(validStocks.map(s => s.financialData?.returnOnEquity).map(v => v ? v * 100 : null)),
      profit_margin: calcAverage(validStocks.map(s => s.financialData?.profitMargins).map(v => v ? v * 100 : null)),
      gross_margin: calcAverage(validStocks.map(s => s.financialData?.grossMargins).map(v => v ? v * 100 : null)),
      ebitda_margin: calcAverage(validStocks.map(s => s.financialData?.ebitdaMargins).map(v => v ? v * 100 : null)),
      operating_margin: calcAverage(validStocks.map(s => s.financialData?.operatingMargins).map(v => v ? v * 100 : null)),
      debt_to_equity: calcAverage(validStocks.map(s => s.financialData?.debtToEquity)),
      current_ratio: calcAverage(validStocks.map(s => s.financialData?.currentRatio)),
      quick_ratio: calcAverage(validStocks.map(s => s.financialData?.quickRatio)),
      ev_ebitda: calcAverage(validStocks.map(s => s.defaultKeyStatistics?.enterpriseToEbitda)),
      market_cap: calcAverage(validStocks.map(s => s.marketCap)),
      total_count: validStocks.length,
      sector,
      subsector
    };

    // Calcular médias derivadas se temos dados suficientes
    const stocksWithRevenue = validStocks.filter(s => {
      const fd = s.financialData;
      const is = s.incomeStatementHistory?.[0];
      return (fd?.totalRevenue || is?.totalRevenue) && s.marketCap;
    });

    if (stocksWithRevenue.length > 0) {
      const psrValues = stocksWithRevenue.map(s => {
        const revenue = s.financialData?.totalRevenue || s.incomeStatementHistory?.[0]?.totalRevenue;
        return revenue ? s.marketCap / revenue : null;
      });
      sectorAverages.price_to_sales = calcAverage(psrValues);
    }

    return Response.json(sectorAverages);

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});