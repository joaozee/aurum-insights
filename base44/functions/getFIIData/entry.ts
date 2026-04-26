import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// ══════════════════════════════════════════════════════════
// CACHE
// ══════════════════════════════════════════════════════════
const fiiCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

function getCached(key) {
  const entry = fiiCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) { fiiCache.delete(key); return null; }
  return entry.data;
}
function setCache(key, data) {
  if (fiiCache.size > 100) {
    const oldest = [...fiiCache.entries()].sort((a, b) => a[1].ts - b[1].ts)[0];
    if (oldest) fiiCache.delete(oldest[0]);
  }
  fiiCache.set(key, { data, ts: Date.now() });
}

// ══════════════════════════════════════════════════════════
// IDENTIFICAÇÃO DE FII
// ══════════════════════════════════════════════════════════
function isFII(symbol) {
  if (!symbol || typeof symbol !== 'string') return false;
  return symbol.trim().toUpperCase().endsWith('11');
}

// ══════════════════════════════════════════════════════════
// NORMALIZAÇÃO DE VALORES
// ══════════════════════════════════════════════════════════
function normalizeFIIValue(value) {
  if (value == null || !isFinite(value)) return null;
  // Se o valor parece estar em milhões (< 1000 para patrimônio de fundo típico)
  // e o contexto indica que deveria ser maior, multiplicar
  // Regra: se < 100_000 e parece ser patrimônio total → multiplicar por 1_000_000
  return value;
}

function r(val, digits = 2) {
  if (val == null || !isFinite(val)) return null;
  return Math.round(val * Math.pow(10, digits)) / Math.pow(10, digits);
}

// ══════════════════════════════════════════════════════════
// FORMATAÇÃO
// ══════════════════════════════════════════════════════════
function formatFII(value, type) {
  if (value == null) return 'N/A';
  switch (type) {
    case 'currency':
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    case 'percent':
      return `${r(value, 2)}%`;
    case 'number':
      return new Intl.NumberFormat('pt-BR').format(value);
    default:
      return String(value);
  }
}

// ══════════════════════════════════════════════════════════
// FETCH COM RETRY
// ══════════════════════════════════════════════════════════
async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
      if (res.ok) return await res.json();
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, 600 * (i + 1)));
    }
  }
  return null;
}

// ══════════════════════════════════════════════════════════
// LIMPEZA DE DADOS HISTÓRICOS
// ══════════════════════════════════════════════════════════

/**
 * Remove dividendos suspeitos (não ajustados por split ou corrompidos).
 * Um dividendo mensal > 3% do preço atual é considerado inválido.
 */
function cleanDividends(dividends, currentPrice) {
  if (!dividends?.length || !currentPrice) return dividends || [];
  const MAX_MONTHLY_DY = 0.03; // 3% ao mês é o limite razoável
  return dividends.filter(d => {
    const rate = d.rate || d.value || 0;
    if (rate <= 0) return false;
    // Rejeitar dividendos que sozinhos representem > 3% do preço atual
    if (rate / currentPrice > MAX_MONTHLY_DY) return false;
    // Rejeitar datas inválidas
    const dt = new Date(d.paymentDate || d.date);
    if (isNaN(dt)) return false;
    return true;
  });
}

/**
 * Remove anos inválidos do histórico anual.
 * Só mantém anos onde há preço médio confiável E dividendos reais.
 */
function cleanHistoricalData(yearlyData) {
  return yearlyData.filter(y => {
    if (!y.year || y.year < 2000) return false;
    if (!y.dividends || y.dividends <= 0) return false;
    // Só exibir DY se tiver preço médio real
    if (!y.avg_price || y.avg_price <= 0) return false;
    // DY > 50% anual é suspeito (dado não ajustado)
    if (y.dy && y.dy > 50) return false;
    return true;
  });
}

// ══════════════════════════════════════════════════════════
// CÁLCULO DE INDICADORES FII
// ══════════════════════════════════════════════════════════
function calculateFIIIndicators(data) {
  const {
    current_price,
    cotas_emitidas,
    valor_patrimonial,
    valor_patrimonial_cota: vpc_raw,
    dividends = [],
    volume,
    shares_outstanding,
  } = data;

  // Fallback: calcular VPC se não disponível
  const cotas = cotas_emitidas || shares_outstanding;
  let valor_patrimonial_cota = vpc_raw;
  if (!valor_patrimonial_cota && valor_patrimonial && cotas) {
    valor_patrimonial_cota = normalizeFIIValue(valor_patrimonial) / cotas;
  }

  // Dividendos últimos 12 meses
  const now = new Date();
  const twelveMonthsAgo = new Date(now);
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

  const dividends12m = dividends.filter(d => {
    const dt = new Date(d.paymentDate || d.date);
    return !isNaN(dt) && dt >= twelveMonthsAgo;
  });
  const total_dividends_12m = dividends12m.reduce((s, d) => s + (d.rate || d.value || 0), 0);

  // DY = dividendos 12m / preço * 100
  const dividend_yield_12m = current_price && total_dividends_12m
    ? r((total_dividends_12m / current_price) * 100)
    : null;

  // P/VP = preço / VPC
  const pvp = current_price && valor_patrimonial_cota && valor_patrimonial_cota > 0
    ? r(current_price / valor_patrimonial_cota)
    : null;

  // Market cap = preço * cotas
  const market_cap = current_price && cotas
    ? r(current_price * cotas)
    : null;

  // Liquidez diária = volume * preço
  const liquidez_diaria = volume && current_price
    ? r(volume * current_price)
    : null;

  // Último dividendo
  const sorted_divs = [...dividends].sort((a, b) =>
    new Date(b.paymentDate || b.date) - new Date(a.paymentDate || a.date)
  );
  const last_dividend = sorted_divs[0]?.rate || sorted_divs[0]?.value || null;
  const last_dividend_yield = last_dividend && current_price
    ? r((last_dividend / current_price) * 100)
    : null;

  // DY períodos
  const dy_1m = calcDYPeriod(dividends, current_price, 1);
  const dy_3m = calcDYPeriod(dividends, current_price, 3);
  const dy_6m = calcDYPeriod(dividends, current_price, 6);

  return {
    dividend_yield_12m,
    dy_1m,
    dy_3m,
    dy_6m,
    pvp,
    market_cap,
    liquidez_diaria,
    valor_patrimonial_cota: valor_patrimonial_cota ? r(valor_patrimonial_cota) : null,
    total_dividends_12m: r(total_dividends_12m),
    last_dividend,
    last_dividend_yield,
    dividends_count_12m: dividends12m.length,
  };
}

function calcDYPeriod(dividends, price, months) {
  if (!price || !dividends?.length) return null;
  const since = new Date();
  since.setMonth(since.getMonth() - months);
  const total = dividends
    .filter(d => new Date(d.paymentDate || d.date) >= since)
    .reduce((s, d) => s + (d.rate || d.value || 0), 0);
  if (total <= 0) return null;
  // Anualizar: (total_periodo / preco) * (12 / meses) * 100
  return r((total / price) * (12 / months) * 100);
}

// ══════════════════════════════════════════════════════════
// HISTÓRICO DE DIVIDENDOS
// ══════════════════════════════════════════════════════════
function getDividendHistory(dividends, currentPrice) {
  if (!dividends?.length) return { monthly: [], yearly: [], yields: {} };

  const sorted = [...dividends].sort((a, b) =>
    new Date(a.paymentDate || a.date) - new Date(b.paymentDate || b.date)
  );

  // Agrupar por mês
  const byMonth = {};
  for (const d of sorted) {
    const dt = new Date(d.paymentDate || d.date);
    if (isNaN(dt)) continue;
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
    if (!byMonth[key]) byMonth[key] = { month: key, total: 0, count: 0 };
    byMonth[key].total += d.rate || d.value || 0;
    byMonth[key].count++;
  }

  // Agrupar por ano
  const byYear = {};
  for (const d of sorted) {
    const dt = new Date(d.paymentDate || d.date);
    if (isNaN(dt)) continue;
    const year = dt.getFullYear();
    if (!byYear[year]) byYear[year] = { year, total: 0, count: 0 };
    byYear[year].total += d.rate || d.value || 0;
    byYear[year].count++;
  }

  // Só calcular yield para os últimos 24 meses (preço atual ainda é representativo)
  const cutoffYield = new Date();
  cutoffYield.setFullYear(cutoffYield.getFullYear() - 2);

  const monthly = Object.values(byMonth).map(m => {
    const monthDate = new Date(m.month + '-01');
    const yieldVal = currentPrice && monthDate >= cutoffYield
      ? r((m.total / currentPrice) * 100)
      : null;
    return { ...m, total: r(m.total), yield: yieldVal };
  });

  // yearly sem yield (DY anual calculado com preço médio real em getFIIHistory)
  const yearly = Object.values(byYear).map(y => ({
    ...y,
    dividends: r(y.total),
    count: y.count,
  }));

  return { monthly, yearly };
}

// ══════════════════════════════════════════════════════════
// HISTÓRICO ANUAL (DY por ano)
// ══════════════════════════════════════════════════════════
function getFIIHistory(dividends, historicalPrices) {
  if (!dividends?.length) return [];

  const byYear = {};
  for (const d of dividends) {
    const dt = new Date(d.paymentDate || d.date);
    if (isNaN(dt)) continue;
    const year = dt.getFullYear();
    if (!byYear[year]) byYear[year] = { year, dividends: 0, count: 0 };
    byYear[year].dividends += d.rate || d.value || 0;
    byYear[year].count++;
  }

  // Calcular preço médio por ano se disponível
  if (historicalPrices?.length) {
    const pricesByYear = {};
    for (const p of historicalPrices) {
      const dt = new Date(p.date * 1000);
      const year = dt.getFullYear();
      if (!pricesByYear[year]) pricesByYear[year] = [];
      if (p.close) pricesByYear[year].push(p.close);
    }

    for (const year of Object.keys(byYear)) {
      const prices = pricesByYear[year];
      if (prices?.length) {
        byYear[year].avg_price = r(prices.reduce((s, v) => s + v, 0) / prices.length);
        byYear[year].dy = r((byYear[year].dividends / byYear[year].avg_price) * 100);
      }
    }
  }

  return Object.values(byYear)
    .sort((a, b) => a.year - b.year)
    .map(y => ({ ...y, dividends: r(y.dividends) }));
}

// ══════════════════════════════════════════════════════════
// SIMULAÇÃO DE INVESTIMENTO
// ══════════════════════════════════════════════════════════
function simulateInvestment(dividendHistory, historicalPrices, initialValue) {
  if (!dividendHistory?.monthly?.length || !initialValue) return null;

  let cotas = 0;
  let totalInvested = initialValue;
  const evolution = [];

  // Simular reinvestimento mês a mês
  const monthlyData = [...dividendHistory.monthly].sort((a, b) => a.month.localeCompare(b.month));

  // Preço inicial (primeira data disponível)
  const firstPrice = historicalPrices?.[0]?.close || 100;
  cotas = initialValue / firstPrice;

  for (const m of monthlyData) {
    const dividendReceived = cotas * (m.total || 0);
    const currentMonthPrice = firstPrice; // simplificado; idealmente buscar preço do mês
    cotas += dividendReceived / currentMonthPrice;
    evolution.push({
      month: m.month,
      cotas: r(cotas, 4),
      portfolio_value: r(cotas * currentMonthPrice),
      dividends_received: r(dividendReceived),
    });
  }

  return {
    initial_value: initialValue,
    final_value: evolution[evolution.length - 1]?.portfolio_value || initialValue,
    total_cotas: evolution[evolution.length - 1]?.cotas || 0,
    evolution,
  };
}

// ══════════════════════════════════════════════════════════
// MAIN HANDLER
// ══════════════════════════════════════════════════════════
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action = 'full', symbol, symbols, initialValue = 10000 } = body;

    if (!symbol && !symbols) {
      return Response.json({ error: 'symbol or symbols required' }, { status: 400 });
    }

    const apiKey = Deno.env.get('BRAPI_API_KEY');

    // ── ACTION: compare ──────────────────────────────────
    if (action === 'compare' && symbols?.length) {
      const results = await Promise.all(symbols.map(s => getFIIFull(s, apiKey, base44, false)));
      const comparison = results.map(r => ({
        symbol: r.basic_info?.symbol,
        dy_12m: r.indicators?.dividend_yield_12m,
        pvp: r.indicators?.pvp,
        last_dividend: r.indicators?.last_dividend,
        valor_patrimonial_cota: r.indicators?.valor_patrimonial_cota,
        tipo_fundo: r.metadata?.tipo_fundo,
        segmento: r.metadata?.segmento,
        market_cap: r.indicators?.market_cap,
        liquidez_diaria: r.indicators?.liquidez_diaria,
      }));
      return Response.json({ comparison });
    }

    // ── ACTION: full ─────────────────────────────────────
    const result = await getFIIFull(symbol, apiKey, base44, true, initialValue);
    return Response.json(result);

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// ══════════════════════════════════════════════════════════
// FUNÇÃO PRINCIPAL
// ══════════════════════════════════════════════════════════
async function getFIIFull(symbol, apiKey, base44, includeHistory = true, initialValue = 10000) {
  if (!symbol) return { error: 'Symbol required' };

  const sym = symbol.toUpperCase().replace(/\.SA$/i, '').trim();

  if (!isFII(sym)) {
    return { error: `${sym} não é um FII. Use isFII() para verificar.` };
  }

  const cacheKey = `fii:full:${sym}`;
  const cached = getCached(cacheKey);
  if (cached) return { ...cached, _cached: true };

  // Buscar dados da BRAPI em paralelo
  const quoteUrl = `https://brapi.dev/api/quote/${sym}?modules=defaultKeyStatistics&dividends=true&token=${apiKey}`;
  const histUrl = `https://brapi.dev/api/quote/${sym}?range=5y&interval=1mo&token=${apiKey}`;

  const [quoteData, histData] = await Promise.all([
    fetchWithRetry(quoteUrl),
    includeHistory ? fetchWithRetry(histUrl) : Promise.resolve(null),
  ]);

  const raw = quoteData?.results?.[0];
  if (!raw) return { error: `FII ${sym} não encontrado na BRAPI` };

  const historicalPrices = histData?.results?.[0]?.historicalDataPrice || [];

  // Buscar metadata do banco
  let metadata = null;
  try {
    const metaList = await base44.entities.FIIMetadata.filter({ symbol: sym });
    metadata = metaList[0] || null;
  } catch (_) {}

  const ks = raw.defaultKeyStatistics || {};
  const rawDividends = raw.dividendsData?.cashDividends || [];
  // Limpar dividendos suspeitos (não ajustados por split)
  const dividends = cleanDividends(rawDividends, raw.regularMarketPrice);

  // Montar dados base
  const cotas_emitidas = metadata?.cotas_emitidas || ks.sharesOutstanding || null;
  const valor_patrimonial = metadata?.valor_patrimonial || null;
  const valor_patrimonial_cota_db = metadata?.valor_patrimonial_cota || null;

  const baseData = {
    current_price: raw.regularMarketPrice,
    volume: raw.regularMarketVolume,
    shares_outstanding: ks.sharesOutstanding,
    cotas_emitidas,
    valor_patrimonial,
    valor_patrimonial_cota: valor_patrimonial_cota_db || ks.bookValue || null,
    dividends,
  };

  // Calcular indicadores
  const indicators = calculateFIIIndicators(baseData);

  // Histórico de dividendos
  const dividend_history = getDividendHistory(dividends, raw.regularMarketPrice);

  // Histórico anual — apenas anos com dados confiáveis
  const rawHistory = includeHistory ? getFIIHistory(dividends, historicalPrices) : [];
  const financial_history = cleanHistoricalData(rawHistory);

  // Simulação de investimento
  const simulation = includeHistory
    ? simulateInvestment(dividend_history, historicalPrices, initialValue)
    : null;

  const result = {
    basic_info: {
      symbol: sym,
      company_name: raw.longName || raw.shortName || sym,
      logo_url: `https://icons.brapi.dev/icons/${sym}.svg`,
      current_price: raw.regularMarketPrice,
      daily_change: raw.regularMarketChange,
      daily_change_percent: raw.regularMarketChangePercent,
      volume: raw.regularMarketVolume,
      day_open: raw.regularMarketOpen,
      day_high: raw.regularMarketDayHigh,
      day_low: raw.regularMarketDayLow,
      prev_close: raw.regularMarketPreviousClose,
      week_high_52: raw.fiftyTwoWeekHigh,
      week_low_52: raw.fiftyTwoWeekLow,
      currency: raw.currency || 'BRL',
      is_fii: true,
    },
    indicators,
    dividend_history,
    financial_history,
    simulation,
    metadata: {
      razao_social: metadata?.razao_social || null,
      cnpj: metadata?.cnpj || null,
      publico_alvo: metadata?.publico_alvo || null,
      mandato: metadata?.mandato || null,
      segmento: metadata?.segmento || null,
      tipo_fundo: metadata?.tipo_fundo || null,
      prazo_duracao: metadata?.prazo_duracao || null,
      tipo_gestao: metadata?.tipo_gestao || null,
      taxa_administracao: metadata?.taxa_administracao || null,
      taxa_performance: metadata?.taxa_performance || null,
      vacancia: metadata?.vacancia || null,
      numero_cotistas: metadata?.numero_cotistas || null,
      cotas_emitidas,
      valor_patrimonial: metadata?.valor_patrimonial || null,
      valor_patrimonial_cota: indicators.valor_patrimonial_cota,
      gestor: metadata?.gestor || null,
      administrador: metadata?.administrador || null,
      data_inicio: metadata?.data_inicio || null,
      isin: metadata?.isin || null,
    },
    comparisons: {
      note: 'Use action=compare com array symbols[] para comparar múltiplos FIIs',
    },
  };

  setCache(cacheKey, result);
  return result;
}