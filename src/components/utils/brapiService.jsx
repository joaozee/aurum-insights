const BRAPI_BASE_URL = "https://brapi.dev/api";
const BRAPI_API_KEY = "iNyQwWqh7mVeGFEkWgXumQ";

const getHeaders = () => ({
  'Authorization': `Bearer ${BRAPI_API_KEY}`
});

// Função para limpar o nome da empresa removendo S.A., Ltda, etc.
const cleanCompanyName = (name) => {
  if (!name) return name;
  
  let cleaned = name;
  
  // Remove tudo após "Units Cons", "Pfd Sh", "Com Sh", etc (descrições técnicas)
  cleaned = cleaned.replace(/\s+(Units?\s+Cons.*|Pfd\s+Sh.*|Com\s+Sh.*|Preferred.*|Common.*|Ordinary.*)$/i, '');
  
  // Remove informações entre parênteses
  cleaned = cleaned.replace(/\s*\([^)]*\)/g, '');
  
  // Remove sufixos comuns (ordem importa - mais longos primeiro)
  const suffixesToRemove = [
    'S\\.A\\.',
    'S/A',
    'S\\.A',
    '\\bSA\\b',
    'Ltda\\.',
    'Ltda',
    'LTDA',
    'Limited',
    'Ltd\\.',
    'Ltd',
    'Inc\\.',
    'Inc',
    'Pfd',
    'PFD',
    'Holding',
    'Holdings',
    '\\bON\\b',
    '\\bPN\\b',
    'UNT',
    'UNIT'
  ];
  
  // Remove cada sufixo (case-insensitive, word boundary)
  suffixesToRemove.forEach(suffix => {
    const regex = new RegExp('\\s+' + suffix + '\\s*$', 'i');
    cleaned = cleaned.replace(regex, '');
  });
  
  // Mapeamento de nomes conhecidos
  const nameReplacements = {
    'Petroleo Brasileiro': 'Petrobras',
    'Petróleo Brasileiro': 'Petrobras',
    'Banco Itau Unibanco': 'Itaú Unibanco',
    'Banco Bradesco': 'Bradesco',
    'Banco do Brasil': 'Banco do Brasil',
    'Banco Santander': 'Santander Brasil'
  };
  
  const trimmed = cleaned.trim();
  return nameReplacements[trimmed] || trimmed;
};

export const brapiService = {
  async getQuote(ticker, options = {}) {
    const params = new URLSearchParams();
    params.append('fundamental', options.fundamental !== false ? 'true' : 'false');
    params.append('dividends', options.dividends !== false ? 'true' : 'false');
    params.append('range', options.range || '5y');
    params.append('interval', options.interval || '1mo');
    params.append('token', BRAPI_API_KEY);
    
    const url = `${BRAPI_BASE_URL}/quote/${ticker}?${params.toString()}`;
    const response = await fetch(url, { headers: getHeaders() });
    if (!response.ok) throw new Error(`Failed: ${response.statusText}`);
    const data = await response.json();
    return data.results?.[0] || null;
  },

  async getQuotes(tickers, options = {}) {
    const tickerString = Array.isArray(tickers) ? tickers.join(',') : tickers;
    const params = new URLSearchParams();
    if (options.range) params.append('range', options.range);
    if (options.interval) params.append('interval', options.interval);
    params.append('token', BRAPI_API_KEY);
    
    const url = `${BRAPI_BASE_URL}/quote/${tickerString}?${params.toString()}`;
    const response = await fetch(url, { headers: getHeaders() });
    if (!response.ok) throw new Error(`Failed: ${response.statusText}`);
    const data = await response.json();
    return data.results || [];
  },

  async getHistorical(ticker, range, interval) {
    const params = new URLSearchParams();
    params.append('range', range);
    params.append('interval', interval);
    params.append('token', BRAPI_API_KEY);
    
    const url = `${BRAPI_BASE_URL}/quote/${ticker}?${params.toString()}`;
    const response = await fetch(url, { headers: getHeaders() });
    if (!response.ok) throw new Error(`Failed: ${response.statusText}`);
    const data = await response.json();
    return data.results?.[0]?.historicalDataPrice || [];
  },

  async listAvailableStocks() {
    const url = `${BRAPI_BASE_URL}/available?token=${BRAPI_API_KEY}`;
    const response = await fetch(url, { headers: getHeaders() });
    if (!response.ok) throw new Error(`Failed: ${response.statusText}`);
    const data = await response.json();
    return data.stocks || [];
  },

  async getPriceAtDate(ticker, date) {
    try {
      const today = new Date().toISOString().split('T')[0];
      if (date === today) {
        const quote = await this.getQuote(ticker);
        return quote?.regularMarketPrice || null;
      }
      const historical = await this.getHistorical(ticker, '5y', '1d');
      if (historical.length > 0) {
        const targetDate = new Date(date).getTime();
        let closestPrice = null, closestDiff = Infinity;
        historical.forEach(item => {
          const diff = Math.abs(new Date(item.date * 1000).getTime() - targetDate);
          if (diff < closestDiff) { closestDiff = diff; closestPrice = item.close; }
        });
        return closestPrice;
      }
      return null;
    } catch (err) {
      console.error("Erro ao buscar preço:", err);
      return null;
    }
  },

  formatStockData(apiData) {
    if (!apiData) return null;

    // Calcular EV/EBITDA se disponível
    const evEbitda = apiData.enterpriseValue && apiData.ebitda && apiData.ebitda > 0
      ? apiData.enterpriseValue / apiData.ebitda
      : null;

    // Calcular dívida líquida
    const netDebt = apiData.totalDebt && apiData.totalCash
      ? apiData.totalDebt - apiData.totalCash
      : null;

    // Dívida líquida / PL
    const netDebtToEquity = netDebt && apiData.bookValue && apiData.sharesOutstanding
      ? netDebt / (apiData.bookValue * apiData.sharesOutstanding)
      : null;

    // Dívida líquida / EBITDA
    const netDebtToEbitda = netDebt && apiData.ebitda && apiData.ebitda > 0
      ? netDebt / apiData.ebitda
      : null;

    // P/EBIT: Price / (EBIT per share) — approximation
    const ebit = apiData.ebitda && apiData.depreciationAndAmortization
      ? apiData.ebitda - apiData.depreciationAndAmortization
      : null;
    const priceToEbit = ebit && apiData.sharesOutstanding && ebit > 0
      ? (apiData.regularMarketPrice * apiData.sharesOutstanding) / ebit
      : null;

    // EV/EBIT
    const evToEbit = apiData.enterpriseValue && ebit && ebit > 0
      ? apiData.enterpriseValue / ebit
      : null;

    // Margem EBIT = EBIT / Receita
    const ebitMargin = ebit && apiData.totalRevenue && apiData.totalRevenue > 0
      ? (ebit / apiData.totalRevenue) * 100
      : null;

    // Margem bruta
    const grossMargin = apiData.grossMargins ? apiData.grossMargins * 100 : null;

    // Margem EBITDA
    const ebitdaMargin = apiData.ebitdaMargins ? apiData.ebitdaMargins * 100
      : (apiData.ebitda && apiData.totalRevenue && apiData.totalRevenue > 0
          ? (apiData.ebitda / apiData.totalRevenue) * 100
          : null);

    // Giro de Ativos
    const assetTurnover = apiData.totalRevenue && apiData.totalAssets && apiData.totalAssets > 0
      ? apiData.totalRevenue / apiData.totalAssets
      : null;

    // Patrimônio / Ativos
    const equityToAssets = apiData.bookValue && apiData.sharesOutstanding && apiData.totalAssets && apiData.totalAssets > 0
      ? (apiData.bookValue * apiData.sharesOutstanding) / apiData.totalAssets
      : null;

    // P/CAP GIRO: Preço / Capital de Giro por ação
    const workingCapital = apiData.totalCurrentAssets && apiData.totalCurrentLiabilities
      ? apiData.totalCurrentAssets - apiData.totalCurrentLiabilities
      : null;
    const priceToWorkingCapital = workingCapital && apiData.sharesOutstanding && workingCapital > 0
      ? (apiData.regularMarketPrice * apiData.sharesOutstanding) / workingCapital
      : null;

    // P/ATIVO
    const priceToAssets = apiData.regularMarketPrice && apiData.bookValue && apiData.bookValue > 0
      ? apiData.regularMarketPrice / (apiData.totalAssets / (apiData.sharesOutstanding || 1))
      : null;

    // ROIC (approximation)
    const roic = apiData.returnOnEquity && apiData.returnOnAssets
      ? ((apiData.returnOnEquity + apiData.returnOnAssets) / 2) * 100
      : null;

    return {
      ticker: apiData.symbol,
      company_name: cleanCompanyName(apiData.longName || apiData.shortName || apiData.symbol),
      current_price: apiData.regularMarketPrice || 0,
      daily_change: apiData.regularMarketChange || 0,
      daily_change_percent: apiData.regularMarketChangePercent || 0,
      volume: apiData.regularMarketVolume || 0,
      market_cap: apiData.marketCap || 0,
      
      // Preços do dia
      day_high: apiData.regularMarketDayHigh || null,
      day_low: apiData.regularMarketDayLow || null,
      day_open: apiData.regularMarketOpen || null,
      prev_close: apiData.regularMarketPreviousClose || null,
      
      // 52 semanas
      week_high_52: apiData.fiftyTwoWeekHigh || null,
      week_low_52: apiData.fiftyTwoWeekLow || null,
      
      // Médias móveis
      avg_50d: apiData.fiftyDayAverage || null,
      avg_200d: apiData.twoHundredDayAverage || null,
      
      // Fundamentais simples - usar bookValue e trailingAnnualDividendRate quando disponíveis
      pe_ratio: apiData.priceEarnings || null,
      pb_ratio: apiData.priceToBook || (apiData.regularMarketPrice && apiData.bookValue && apiData.bookValue > 0 
        ? apiData.regularMarketPrice / apiData.bookValue 
        : null),
      dividend_yield: apiData.dividendYield
        ? (apiData.dividendYield < 1 ? apiData.dividendYield * 100 : apiData.dividendYield)
        : (apiData.trailingAnnualDividendRate && apiData.regularMarketPrice && apiData.regularMarketPrice > 0
          ? (apiData.trailingAnnualDividendRate / apiData.regularMarketPrice) * 100
          : (apiData.trailingAnnualDividendYield
            ? (apiData.trailingAnnualDividendYield < 1 ? apiData.trailingAnnualDividendYield * 100 : apiData.trailingAnnualDividendYield)
            : null)),
      
      // Meta de analistas
      price_target: apiData.targetMeanPrice || null,
      target_high: apiData.targetHighPrice || null,
      target_low: apiData.targetLowPrice || null,
      analyst_count: apiData.numberOfAnalystOpinions || null,
      analyst_recommendation: apiData.recommendationKey || null,
      
      // Informações da empresa
      currency: apiData.currency || "BRL",
      exchange: apiData.exchangeShortName || apiData.exchange,
      sector: apiData.sector,
      industry: apiData.industry,
      logo_url: apiData.logourl || apiData.logoUrl || apiData.logo_url || null,
      description: apiData.longBusinessSummary,
      
      // Histórico e dividendos
      historical_data: apiData.historicalDataPrice || [],
      dividends_data: apiData.dividendsData || apiData.dividends || {
        cashDividends: apiData.dividendsData?.cashDividends || apiData.cash_dividends || []
      },
      shares_outstanding: apiData.sharesOutstanding || null,

      fundamentals: {
        // Rentabilidade
        roe: apiData.returnOnEquity ? apiData.returnOnEquity * 100 : null,
        roa: apiData.returnOnAssets ? apiData.returnOnAssets * 100 : null,
        roic: roic,
        
        // Margens
        profit_margin: apiData.profitMargins ? apiData.profitMargins * 100 : null,
        operating_margin: apiData.operatingMargins ? apiData.operatingMargins * 100 : null,
        gross_margin: grossMargin,
        ebitda_margin: ebitdaMargin,
        ebit_margin: ebitMargin,
        
        // Dívida
        debt_to_equity: apiData.debtToEquity || null,
        current_ratio: apiData.currentRatio || null,
        quick_ratio: apiData.quickRatio || null,
        net_debt: netDebt,
        net_debt_to_equity: netDebtToEquity,
        net_debt_to_ebitda: netDebtToEbitda,
        total_debt: apiData.totalDebt || null,
        total_cash: apiData.totalCash || null,
        
        // Por ação
        earnings_per_share: apiData.earningsPerShare || null,
        book_value_per_share: apiData.bookValue || null,
        payout_ratio: apiData.payoutRatio ? apiData.payoutRatio * 100 : null,
        trailing_dividend_rate: apiData.trailingAnnualDividendRate || null,
        trailing_dividend_yield: apiData.trailingAnnualDividendYield ? apiData.trailingAnnualDividendYield * 100 : null,
        
        // Múltiplos avançados
        ev_ebitda: evEbitda,
        ev_ebit: evToEbit,
        price_to_ebit: priceToEbit,
        price_to_sales: apiData.priceToSalesTrailing12Months || null,
        forward_pe: apiData.forwardPE || null,
        peg_ratio: apiData.pegRatio || null,
        enterprise_value: apiData.enterpriseValue || null,
        price_to_working_capital: priceToWorkingCapital,
        price_to_assets: priceToAssets,
        equity_to_assets: equityToAssets,
        asset_turnover: assetTurnover,
        
        // Balanço
        total_revenue: apiData.totalRevenue || null,
        ebitda: apiData.ebitda || null,
        gross_profits: apiData.grossProfits || null,
        operating_cashflow: apiData.operatingCashflow || null,
        free_cashflow: apiData.freeCashflow || null,
        total_assets: apiData.totalAssets || null,
        
        // Risco
        beta: apiData.beta || null,
        avg_volume: apiData.averageDailyVolume10Day || null,
        
        // CAGR (não disponível diretamente, será calculado dos históricos)
        cagr_revenue_5y: null,
        cagr_profit_5y: null,
      }
    };
  }
};