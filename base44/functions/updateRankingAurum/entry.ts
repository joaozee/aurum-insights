import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const BRAPI_TOKEN = Deno.env.get("BRAPI_API_KEY");
const BATCH_SIZE = 50;

function normalize(value, array, higherIsBetter) {
  const valid = array.filter(v => v != null && v > 0);
  if (valid.length === 0) return 0;
  
  const min = Math.min(...valid);
  const max = Math.max(...valid);
  if (min === max) return 50;
  
  let normalized = ((value - min) / (max - min)) * 100;
  if (!higherIsBetter) normalized = 100 - normalized;
  return Math.max(0, Math.min(100, normalized));
}

async function fetchStockData(tickers) {
  const tickerParam = tickers.join(",");
  const url = `https://brapi.dev/api/quote/${tickerParam}?token=${BRAPI_TOKEN}&modules=summaryProfile,defaultKeyStatistics,financialData`;
  
  console.log('Fetching Brapi URL:', url);
  const response = await fetch(url);
  
  if (!response.ok) {
    const text = await response.text();
    console.error('Brapi error response:', text);
    throw new Error(`Brapi error: ${response.status}`);
  }
  
  const data = await response.json();
  console.log('Brapi success, results count:', data.results?.length || 0);
  return data.results || [];
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Tickers de teste (visto que universo pode estar vazio)
    const testTickers = ['PETR4', 'VALE3', 'BBAS3', 'ITUB4', 'WEGE3', 'B3SA3', 'ABEV3', 'CMIG4'];
    
    console.log('Starting updateRankingAurum, fetching:', testTickers.length, 'tickers');
    const allData = await fetchStockData(testTickers);
    
    console.log('Processing', allData.length, 'stocks');
    
    // Extrair e mapear dados
    const stocks = allData.map(stock => ({
      ticker: stock.symbol,
      company_name: stock.longName || stock.symbol,
      current_price: stock.regularMarketPrice,
      pl: stock.defaultKeyStatistics?.trailingPE,
      pvp: stock.defaultKeyStatistics?.priceToBook,
      dy: (stock.summaryProfile?.dividendYield || 0) * 100,
      roe: (stock.financialData?.returnOnEquity || 0) * 100,
      margem_liquida: (stock.financialData?.profitMargins || 0) * 100,
      div_ebitda: (stock.defaultKeyStatistics?.debtToEquity || 0) / 10,
      sector: stock.summaryProfile?.sector
    })).filter(s => s.ticker && s.company_name);

    console.log('Valid stocks:', stocks.length);

    // Coletar arrays para normalização
    const dyValues = stocks.map(s => s.dy).filter(v => v > 0);
    const pvpValues = stocks.map(s => s.pvp).filter(v => v > 0);
    const plValues = stocks.map(s => s.pl).filter(v => v > 0);
    const roeValues = stocks.map(s => s.roe).filter(v => v > 0);
    const margemValues = stocks.map(s => s.margem_liquida).filter(v => v > 0);
    const divEbitdaValues = stocks.map(s => s.div_ebitda).filter(v => v > 0);

    // Normalizar e calcular scores
    const rankedStocks = stocks.map(stock => {
      const score_dy = stock.dy > 0 ? normalize(stock.dy, dyValues, true) : 0;
      const score_pvp = stock.pvp > 0 ? normalize(stock.pvp, pvpValues, false) : 0;
      const score_pl = stock.pl > 0 ? normalize(stock.pl, plValues, false) : 0;
      const score_roe = stock.roe > 0 ? normalize(stock.roe, roeValues, true) : 0;
      const score_margem = stock.margem_liquida > 0 ? normalize(stock.margem_liquida, margemValues, true) : 0;
      const score_div_ebitda = stock.div_ebitda > 0 ? normalize(stock.div_ebitda, divEbitdaValues, false) : 0;

      const score_aurum = 
        score_dy * 0.50 +
        score_pvp * 0.20 +
        score_pl * 0.15 +
        score_roe * 0.05 +
        score_margem * 0.05 +
        score_div_ebitda * 0.05;

      return {
        ...stock,
        score_dy,
        score_pvp,
        score_pl,
        score_roe,
        score_margem,
        score_div_ebitda,
        score_aurum
      };
    }).sort((a, b) => b.score_aurum - a.score_aurum)
      .map((stock, idx) => ({ ...stock, rank_position: idx + 1 }));

    // Upsert em RankingAurum
    const now = new Date().toISOString();
    let updated = 0;

    for (const stock of rankedStocks) {
      const existing = await base44.entities.RankingAurum.filter({ ticker: stock.ticker });
      
      const data = {
        ticker: stock.ticker,
        company_name: stock.company_name,
        current_price: stock.current_price,
        pl: stock.pl,
        pvp: stock.pvp,
        dy: stock.dy,
        roe: stock.roe,
        margem_liquida: stock.margem_liquida,
        div_ebitda: stock.div_ebitda,
        score_aurum: stock.score_aurum,
        score_dy: stock.score_dy,
        score_pvp: stock.score_pvp,
        score_pl: stock.score_pl,
        score_roe: stock.score_roe,
        score_margem: stock.score_margem,
        score_div_ebitda: stock.score_div_ebitda,
        rank_position: stock.rank_position,
        sector: stock.sector,
        last_updated: now
      };

      if (existing.length > 0) {
        await base44.entities.RankingAurum.update(existing[0].id, data);
      } else {
        await base44.entities.RankingAurum.create(data);
      }
      updated++;
    }

    console.log('Updated records:', updated);
    return Response.json({
      success: true,
      total: updated,
      updated_at: now
    });
  } catch (error) {
    console.error('Function error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});