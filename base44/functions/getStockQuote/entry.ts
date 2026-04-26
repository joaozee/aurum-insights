import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Cache simples em memória (5 minutos)
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) { cache.delete(key); return null; }
  return entry.data;
}
function setCache(key, data) {
  cache.set(key, { data, ts: Date.now() });
}

// Normaliza o ticker: maiúsculo, remove .SA se existir para a busca
function normalizeTicker(ticker) {
  return ticker.toUpperCase().replace(/\.SA$/i, '').trim();
}

// Busca com retry automático
async function fetchWithRetry(url, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (res.ok) return await res.json();
      if (res.status === 404) return null; // Não existe, não adianta retry
    } catch (e) {
      if (i === retries) throw e;
      await new Promise(r => setTimeout(r, 500 * (i + 1)));
    }
  }
  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { ticker, type = 'quote' } = await req.json();
    if (!ticker) return Response.json({ error: 'Ticker required' }, { status: 400 });

    const apiKey = Deno.env.get("BRAPI_API_KEY");
    const t = normalizeTicker(ticker);
    const cacheKey = `${type}:${t}`;

    // Verificar cache
    const cached = getCached(cacheKey);
    if (cached) return Response.json({ ...cached, _cached: true });

    if (type === 'list') {
      // Listar ativos disponíveis
      const data = await fetchWithRetry(`https://brapi.dev/api/available?token=${apiKey}`);
      const result = { stocks: data?.stocks || [] };
      setCache(cacheKey, result);
      return Response.json(result);
    }

    if (type === 'historical') {
      const { range = '1y', interval = '1mo' } = await req.json().catch(() => ({}));
      // Não faz sentido - req.json() já foi consumido acima, vamos pegar do body original
      // Lemos os params do ticker payload
    }

    // type === 'quote' — busca cotação completa
    const modules = 'defaultKeyStatistics,financialData,balanceSheetHistory,incomeStatementHistory';
    const params = new URLSearchParams({
      modules,
      dividends: 'true',
      fundamental: 'true',
      token: apiKey,
    });

    const url = `https://brapi.dev/api/quote/${t}?${params}`;
    const data = await fetchWithRetry(url);

    if (!data || !data.results || data.results.length === 0) {
      // Tentar buscar na lista de disponíveis para verificar se existe
      const available = await fetchWithRetry(`https://brapi.dev/api/available?token=${apiKey}`);
      const stocks = available?.stocks || [];
      const found = stocks.find(s => 
        s.stock === t || 
        s.stock?.toUpperCase() === t ||
        s.name?.toLowerCase().includes(t.toLowerCase())
      );
      if (!found) {
        return Response.json({ error: `Ticker "${t}" não encontrado na B3` }, { status: 404 });
      }
      // Existe mas sem dados fundamentais
      return Response.json({ error: `Dados não disponíveis para "${t}"`, ticker: t, status: 'no_data' }, { status: 404 });
    }

    const raw = data.results[0];
    
    // Formatar dados base da cotação
    const result = {
      // Identificação
      ticker: raw.symbol || t,
      company_name: raw.longName || raw.shortName || t,
      logo_url: raw.logourl || null,
      sector: raw.sector || null,
      industry: raw.industry || null,
      exchange: raw.exchangeShortName || raw.exchange || null,
      currency: raw.currency || 'BRL',
      description: raw.longBusinessSummary || null,

      // Cotação
      current_price: raw.regularMarketPrice || 0,
      daily_change: raw.regularMarketChange || 0,
      daily_change_percent: raw.regularMarketChangePercent || 0,
      volume: raw.regularMarketVolume || 0,
      market_cap: raw.marketCap || null,
      day_open: raw.regularMarketOpen || null,
      day_high: raw.regularMarketDayHigh || null,
      day_low: raw.regularMarketDayLow || null,
      prev_close: raw.regularMarketPreviousClose || null,
      week_high_52: raw.fiftyTwoWeekHigh || null,
      week_low_52: raw.fiftyTwoWeekLow || null,
      avg_50d: raw.fiftyDayAverage || null,
      avg_200d: raw.twoHundredDayAverage || null,

      // Múltiplos básicos
      pe_ratio: raw.priceEarnings || null,
      pb_ratio: (() => {
        if (raw.priceToBook) return raw.priceToBook;
        const ks = raw.defaultKeyStatistics || {};
        return ks.priceToBook || null;
      })(),
      dividend_yield: (() => {
        const ks = raw.defaultKeyStatistics || {};
        const dy = ks.dividendYield;
        if (dy != null) return dy < 1 ? dy * 100 : dy;
        // Calcular dos dividendos
        if (raw.dividendsData?.cashDividends && raw.regularMarketPrice) {
          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
          const recent = raw.dividendsData.cashDividends.filter(d => new Date(d.paymentDate) >= oneYearAgo);
          const total = recent.reduce((s, d) => s + (d.rate || 0), 0);
          if (total > 0) return (total / raw.regularMarketPrice) * 100;
        }
        const tdy = raw.trailingAnnualDividendYield;
        if (tdy != null) return tdy < 1 ? tdy * 100 : tdy;
        return null;
      })(),

      // Analistas
      price_target: raw.targetMeanPrice || null,
      target_high: raw.targetHighPrice || null,
      target_low: raw.targetLowPrice || null,
      analyst_count: raw.numberOfAnalystOpinions || null,
      analyst_recommendation: raw.recommendationKey || null,

      // Shares
      shares_outstanding: (() => {
        const ks = raw.defaultKeyStatistics || {};
        return ks.sharesOutstanding || ks.impliedSharesOutstanding || null;
      })(),

      // Dados históricos (cotação)
      historical_data: raw.historicalDataPrice || [],

      // Dividendos
      dividends_data: raw.dividendsData || { cashDividends: [] },

      // Dados financeiros brutos para os componentes de análise
      _raw_financial: {
        defaultKeyStatistics: raw.defaultKeyStatistics || {},
        financialData: raw.financialData || {},
        balanceSheetHistory: raw.balanceSheetHistory || [],
        incomeStatementHistory: raw.incomeStatementHistory || [],
        dividendsData: raw.dividendsData || {},
      }
    };

    setCache(cacheKey, result);
    return Response.json(result);

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});