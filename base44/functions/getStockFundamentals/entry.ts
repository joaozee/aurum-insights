import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const NA = "N/A";

function r(val, digits = 2) {
  if (val == null || !isFinite(val)) return NA;
  return Math.round(val * Math.pow(10, digits)) / Math.pow(10, digits);
}

function calcFundamentals(raw) {
  const fd = raw.financialData || {};
  const ks = raw.defaultKeyStatistics || {};
  const bs = raw.balanceSheetHistory?.[0] || {};
  const is = raw.incomeStatementHistory?.[0] || {};

  // ══════════════════════════════════════════════════════════════
  // EXTRAÇÃO DE DADOS BRUTOS DO BRAPI
  // ══════════════════════════════════════════════════════════════
  
  // Cotação e mercado
  const price = raw.regularMarketPrice;
  const marketCap = raw.marketCap;
  const sharesOutstanding = ks.sharesOutstanding || ks.impliedSharesOutstanding;
  const beta = ks.beta;
  
  // Demonstração de Resultado (DRE)
  const totalRevenue = fd.totalRevenue || is.totalRevenue;
  const grossProfit = fd.grossProfits || is.grossProfit;
  let ebitda = fd.ebitda;
  const netIncome = ks.netIncomeToCommon || is.netIncome || is.netIncomeApplicableToCommonShares;
  const interestExpense = is.interestExpense;
  const incomeTaxExpense = is.incomeTaxExpense;
  
  // EBIT: Se o valor vindo da API for negativo ou inconsistente, derivar do EBITDA
  let operatingIncome = is.operatingIncome || is.ebit;
  
  // Balanço Patrimonial (precisa vir antes da verificação isFinancial)
  const totalAssets = ks.totalAssets || bs.totalAssets;
  const totalCurrentAssets = bs.totalCurrentAssets;
  const cash = fd.totalCash || bs.cash;
  const shortTermInvestments = bs.shortTermInvestments || bs.shortTermMarketableSecurities || 0;
  const inventory = bs.inventory;
  const netReceivables = bs.netReceivables;
  
  const totalDebt = fd.totalDebt || ((bs.shortLongTermDebt || 0) + (bs.longTermDebt || 0));
  const shortTermDebt = bs.shortLongTermDebt;
  const longTermDebt = bs.longTermDebt;
  const totalCurrentLiabilities = bs.totalCurrentLiabilities;
  const accountsPayable = bs.accountsPayable;
  
  const shareholderEquity = bs.totalStockholderEquity || 
    (ks.bookValue && sharesOutstanding ? ks.bookValue * sharesOutstanding : null);
  const bookValue = ks.bookValue;
  const retainedEarnings = bs.retainedEarnings;
  
  // Ajustes de EBIT/EBITDA baseados nos dados disponíveis
  const isFinancial = totalDebt === 0 || totalDebt === null;
  
  if (!isFinancial && operatingIncome && operatingIncome < 0 && ebitda && ebitda > 0 && netIncome && netIncome > 0) {
    // EBIT inconsistente, usar EBITDA - D&A estimada (15% do EBITDA)
    const estimatedDA = ebitda * 0.15;
    operatingIncome = ebitda - estimatedDA;
  } else if (!isFinancial && !ebitda && operatingIncome && operatingIncome > 0) {
    // Se não temos EBITDA mas temos EBIT, estimar EBITDA
    ebitda = operatingIncome * 1.15;
  }
  
  // Fluxo de Caixa
  const operatingCashflow = fd.operatingCashflow;
  const freeCashflow = fd.freeCashflow;
  
  // Múltiplos e Indicadores já calculados pela API
  const priceEarnings = raw.priceEarnings;
  const priceToBook = ks.priceToBook;
  const enterpriseValue = ks.enterpriseValue;
  const enterpriseToEbitda = ks.enterpriseToEbitda;
  
  // Dividendos
  let dividendYield = ks.dividendYield;
  let totalDividendsPaid = 0;
  
  if (raw.dividendsData?.cashDividends) {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const recentDividends = raw.dividendsData.cashDividends.filter(d => {
      const payDate = new Date(d.paymentDate);
      return payDate >= oneYearAgo;
    });
    
    totalDividendsPaid = recentDividends.reduce((sum, d) => sum + (d.rate || 0), 0);
    
    if (!dividendYield && totalDividendsPaid > 0 && price) {
      dividendYield = totalDividendsPaid / price;
    }
  }

  // ══════════════════════════════════════════════════════════════
  // CÁLCULO DE INDICADORES FUNDAMENTALISTAS
  // ══════════════════════════════════════════════════════════════
  
  // ─────────────────────────────────────────────────────────────
  // RENTABILIDADE
  // ─────────────────────────────────────────────────────────────
  
  // ROE = Lucro Líquido / Patrimônio Líquido
  const roe = netIncome && shareholderEquity && shareholderEquity > 0
    ? r((netIncome / shareholderEquity) * 100)
    : (fd.returnOnEquity != null ? r(fd.returnOnEquity * 100) : NA);
  
  // ROA = Lucro Líquido / Ativo Total
  const roa = netIncome && totalAssets && totalAssets > 0
    ? r((netIncome / totalAssets) * 100)
    : (fd.returnOnAssets != null ? r(fd.returnOnAssets * 100) : NA);
  
  // ROIC = NOPAT / Capital Investido
  // NOPAT = EBIT × (1 - Taxa de Imposto)
  // Capital Investido = Dívida Total + Patrimônio Líquido - Caixa
  let roic = NA;
  if (operatingIncome && totalDebt != null && shareholderEquity && cash != null) {
    const taxRate = incomeTaxExpense && operatingIncome > 0 
      ? Math.abs(incomeTaxExpense) / operatingIncome 
      : 0.34;
    const nopat = operatingIncome * (1 - taxRate);
    const investedCapital = totalDebt + shareholderEquity - cash;
    if (investedCapital > 0) roic = r((nopat / investedCapital) * 100);
  }
  
  // ─────────────────────────────────────────────────────────────
  // MARGENS
  // ─────────────────────────────────────────────────────────────
  
  // Margem Bruta = Lucro Bruto / Receita
  const grossMargin = grossProfit && totalRevenue && totalRevenue > 0
    ? r((grossProfit / totalRevenue) * 100)
    : (fd.grossMargins != null ? r(fd.grossMargins * 100) : NA);
  
  // Margem EBITDA = EBITDA / Receita
  const ebitdaMargin = ebitda && totalRevenue && totalRevenue > 0
    ? r((ebitda / totalRevenue) * 100)
    : (fd.ebitdaMargins != null ? r(fd.ebitdaMargins * 100) : NA);
  
  // Margem EBIT = EBIT / Receita
  const ebitMargin = operatingIncome && totalRevenue && totalRevenue > 0
    ? r((operatingIncome / totalRevenue) * 100)
    : NA;
  
  // Margem Operacional = Lucro Operacional / Receita
  const operatingMargin = operatingIncome && totalRevenue && totalRevenue > 0
    ? r((operatingIncome / totalRevenue) * 100)
    : (fd.operatingMargins != null ? r(fd.operatingMargins * 100) : NA);
  
  // Margem Líquida = Lucro Líquido / Receita
  const netMargin = netIncome && totalRevenue && totalRevenue > 0
    ? r((netIncome / totalRevenue) * 100)
    : (fd.profitMargins != null ? r(fd.profitMargins * 100) : NA);
  
  // ─────────────────────────────────────────────────────────────
  // ENDIVIDAMENTO
  // ─────────────────────────────────────────────────────────────
  
  // Dívida Líquida = Dívida Total - Caixa
  const netDebtVal = totalDebt != null && cash != null ? totalDebt - cash : null;
  const netDebt = netDebtVal != null ? r(netDebtVal) : NA;
  
  // Dívida Líquida / EBITDA
  const netDebtEbitda = netDebtVal != null && ebitda && ebitda > 0
    ? r(netDebtVal / ebitda)
    : NA;
  
  // Dívida Líquida / Patrimônio Líquido
  const netDebtEquity = netDebtVal != null && shareholderEquity && shareholderEquity > 0
    ? r(netDebtVal / shareholderEquity)
    : NA;
  
  // Dívida Bruta / Patrimônio Líquido
  const debtToEquity = totalDebt != null && shareholderEquity && shareholderEquity > 0
    ? r(totalDebt / shareholderEquity)
    : (fd.debtToEquity != null ? r(fd.debtToEquity) : NA);
  
  // Dívida Bruta / Ativo Total
  const debtToAssets = totalDebt != null && totalAssets && totalAssets > 0
    ? r(totalDebt / totalAssets)
    : NA;
  
  // ─────────────────────────────────────────────────────────────
  // LIQUIDEZ
  // ─────────────────────────────────────────────────────────────
  
  // Liquidez Corrente = Ativo Circulante / Passivo Circulante
  const currentRatio = totalCurrentAssets && totalCurrentLiabilities && totalCurrentLiabilities > 0
    ? r(totalCurrentAssets / totalCurrentLiabilities)
    : (fd.currentRatio != null ? r(fd.currentRatio) : NA);
  
  // Liquidez Seca = (Ativo Circulante - Estoques) / Passivo Circulante
  const quickRatio = totalCurrentAssets && inventory != null && totalCurrentLiabilities && totalCurrentLiabilities > 0
    ? r((totalCurrentAssets - inventory) / totalCurrentLiabilities)
    : (fd.quickRatio != null ? r(fd.quickRatio) : NA);
  
  // Liquidez Imediata = (Caixa + Aplicações) / Passivo Circulante
  const cashRatio = cash != null && totalCurrentLiabilities && totalCurrentLiabilities > 0
    ? r((cash + shortTermInvestments) / totalCurrentLiabilities)
    : NA;
  
  // ─────────────────────────────────────────────────────────────
  // ENTERPRISE VALUE E MÚLTIPLOS
  // ─────────────────────────────────────────────────────────────
  
  // Enterprise Value = Market Cap + Dívida Total - Caixa
  const ev = enterpriseValue || 
    (marketCap && totalDebt != null && cash != null ? marketCap + totalDebt - cash : null);
  
  // EV / EBITDA
  const evEbitda = ev && ebitda && ebitda > 0
    ? r(ev / ebitda)
    : (enterpriseToEbitda != null ? r(enterpriseToEbitda) : null);
  
  // EV / EBIT
  const evEbit = ev && operatingIncome && operatingIncome > 0
    ? r(ev / operatingIncome)
    : null;
  
  // EV / Receita
  const evRevenue = ev && totalRevenue && totalRevenue > 0
    ? r(ev / totalRevenue)
    : null;

  // ─────────────────────────────────────────────────────────────
  // MÚLTIPLOS DE PREÇO
  // ─────────────────────────────────────────────────────────────
  
  // LPA = Lucro Líquido / Ações em Circulação
  const eps = netIncome && sharesOutstanding && sharesOutstanding > 0 
    ? netIncome / sharesOutstanding 
    : null;
  const lpa = eps != null ? r(eps) : null;
  
  // VPA = Patrimônio Líquido / Ações em Circulação
  const vpa = shareholderEquity && sharesOutstanding && sharesOutstanding > 0 
    ? r(shareholderEquity / sharesOutstanding) 
    : null;
  
  // P/L = Preço / LPA
  const peRatio = priceEarnings != null ? r(priceEarnings) :
    (price && eps && eps > 0 ? r(price / eps) : null);
  
  // P/L Futuro = Preço / Trailing EPS
  const trailingEps = ks.trailingEps || eps;
  const plFuturo = price && trailingEps && trailingEps > 0
    ? r(price / trailingEps)
    : null;
  
  // P/VP = Preço / VPA
  const pbRatio = priceToBook != null ? r(priceToBook) :
    (price && vpa && vpa > 0 ? r(price / vpa) : null);
  
  // P/EBITDA = Market Cap / EBITDA
  const pebitda = marketCap && ebitda && ebitda > 0
    ? r(marketCap / ebitda)
    : null;
  
  // P/EBIT = Market Cap / EBIT
  const pEbit = marketCap && operatingIncome && operatingIncome > 0
    ? r(marketCap / operatingIncome)
    : null;
  
  // P/Ativo = Market Cap / Ativo Total
  const pAtivo = marketCap && totalAssets && totalAssets > 0
    ? r(marketCap / totalAssets)
    : null;
  
  // P/Receita (PSR) = Market Cap / Receita
  const psr = marketCap && totalRevenue && totalRevenue > 0
    ? r(marketCap / totalRevenue)
    : null;
  
  // Capital de Giro = Ativo Circulante - Passivo Circulante
  const capitalGiro = totalCurrentAssets && totalCurrentLiabilities
    ? r(totalCurrentAssets - totalCurrentLiabilities)
    : null;
  
  // P/Capital de Giro
  const pCapitalGiro = marketCap && capitalGiro && capitalGiro > 0
    ? r(marketCap / capitalGiro)
    : null;
  
  // P/FCF = Market Cap / Free Cash Flow
  const priceToFCF = marketCap && freeCashflow && freeCashflow > 0
    ? r(marketCap / freeCashflow)
    : null;
  
  // ─────────────────────────────────────────────────────────────
  // DIVIDENDOS
  // ─────────────────────────────────────────────────────────────
  
  // Dividend Yield = Dividendos Anuais / Preço
  const dy = dividendYield != null ? r(dividendYield * 100) : null;
  
  // Payout Ratio = (Dividendos por Ação / Lucro por Ação) × 100
  const payoutRatio = eps && eps > 0 && dividendYield && price
    ? r((dividendYield * price / eps) * 100)
    : (ks.payoutRatio != null ? r(ks.payoutRatio * 100) : null);
  
  // ─────────────────────────────────────────────────────────────
  // EFICIÊNCIA E GIRO
  // ─────────────────────────────────────────────────────────────
  
  // Giro de Ativos = Receita / Ativo Total
  const giroAtivos = totalRevenue && totalAssets && totalAssets > 0
    ? r(totalRevenue / totalAssets)
    : null;
  
  const assetTurnover = giroAtivos;
  
  // Prazo Médio de Recebimento (dias) = (Contas a Receber / Receita) × 365
  const daysReceivable = netReceivables && totalRevenue && totalRevenue > 0
    ? r((netReceivables / totalRevenue) * 365)
    : null;
  
  // Prazo Médio de Pagamento (dias) = (Contas a Pagar / CPV) × 365
  const costOfRevenue = totalRevenue && grossProfit ? totalRevenue - grossProfit : null;
  const daysPayable = accountsPayable && costOfRevenue && costOfRevenue > 0
    ? r((accountsPayable / costOfRevenue) * 365)
    : (accountsPayable && totalRevenue && totalRevenue > 0
      ? r((accountsPayable / totalRevenue) * 365)
      : null);
  
  // Giro de Estoque = CPV / Estoque Médio
  const inventoryTurnover = costOfRevenue && inventory && inventory > 0
    ? r(costOfRevenue / inventory)
    : null;
  
  // ─────────────────────────────────────────────────────────────
  // CRESCIMENTO (CAGR)
  // ─────────────────────────────────────────────────────────────
  
  let cagrReceita = null;
  let cagrLucro = null;
  
  if (raw.incomeStatementHistory && raw.incomeStatementHistory.length >= 2) {
    const sorted = [...raw.incomeStatementHistory].sort((a, b) => 
      new Date(a.endDate) - new Date(b.endDate)
    );
    const oldest = sorted[0];
    const newest = sorted[sorted.length - 1];
    const years = sorted.length - 1;
    
    // CAGR Receita
    if (oldest.totalRevenue && newest.totalRevenue && oldest.totalRevenue > 0 && years > 0) {
      cagrReceita = r((Math.pow(newest.totalRevenue / oldest.totalRevenue, 1 / years) - 1) * 100);
    }
    
    // CAGR Lucro
    if (oldest.netIncome && newest.netIncome && oldest.netIncome > 0 && years > 0) {
      cagrLucro = r((Math.pow(newest.netIncome / oldest.netIncome, 1 / years) - 1) * 100);
    }
  }
  
  // ─────────────────────────────────────────────────────────────
  // COBERTURA
  // ─────────────────────────────────────────────────────────────
  
  // Cobertura de Juros = EBIT / Despesas Financeiras
  const interestCoverage = operatingIncome && operatingIncome > 0 && interestExpense && Math.abs(interestExpense) > 0
    ? r(operatingIncome / Math.abs(interestExpense))
    : (ebitda && ebitda > 0 && interestExpense && Math.abs(interestExpense) > 0
      ? r(ebitda / Math.abs(interestExpense))
      : null);
  
  // Cobertura de Dívida por EBITDA = EBITDA / Serviço da Dívida
  const ebitdaDebtCoverage = ebitda && ebitda > 0 && shortTermDebt && shortTermDebt > 0
    ? r(ebitda / shortTermDebt)
    : (ebitda && ebitda > 0 && totalDebt && totalDebt > 0
      ? r(ebitda / (totalDebt * 0.15))
      : null);

  const avgVolume = raw.averageDailyVolume10Day || raw.regularMarketVolume;

  return {
    // Rentabilidade
    roe,
    roa,
    roic,
    
    // Margens
    profit_margin: netMargin,
    gross_margin: grossMargin,
    ebitda_margin: ebitdaMargin,
    ebit_margin: ebitMargin,
    operating_margin: operatingMargin,
    
    // Múltiplos de Preço
    pe_ratio: peRatio,
    pb_ratio: pbRatio,
    pebitda,
    price_to_sales: psr,
    price_to_fcf: priceToFCF,
    
    // Enterprise Value
    ev: ev != null ? r(ev) : null,
    ev_ebitda: evEbitda,
    ev_ebit: evEbit,
    ev_revenue: evRevenue,
    
    // Endividamento
    net_debt: netDebt,
    net_debt_ebitda: netDebtEbitda,
    net_debt_to_equity: netDebtEquity,
    debt_to_equity: debtToEquity,
    debt_to_assets: debtToAssets,
    
    // Liquidez
    current_ratio: currentRatio,
    quick_ratio: quickRatio,
    cash_ratio: cashRatio,
    
    // Dividendos
    dividend_yield: dy,
    payout_ratio: payoutRatio,
    
    // Por Ação
    lpa,
    vpa,
    
    // Eficiência e Giro
    asset_turnover: assetTurnover,
    inventory_turnover: inventoryTurnover,
    days_receivable: daysReceivable,
    days_payable: daysPayable,
    
    // Crescimento
    cagr_receita: cagrReceita,
    cagr_lucro: cagrLucro,
    
    // Cobertura
    interest_coverage: interestCoverage,
    ebitda_debt_coverage: ebitdaDebtCoverage,
    
    // Novos indicadores adicionais
    price_to_ebit: pEbit,
    price_to_assets: pAtivo,
    working_capital: capitalGiro,
    price_to_working_capital: pCapitalGiro,
    forward_pe: plFuturo,
    book_value_per_share: vpa,
    earnings_per_share: lpa,
    giro_ativos: giroAtivos,
    net_debt_to_ebitda: netDebtEbitda,
    equity_to_assets: shareholderEquity && totalAssets && totalAssets > 0 ? r(shareholderEquity / totalAssets) : null,
    
    // Dados Brutos
    total_revenue: totalRevenue != null ? r(totalRevenue) : null,
    ebitda: ebitda != null ? r(ebitda) : null,
    ebit: operatingIncome != null ? r(operatingIncome) : null,
    net_income: netIncome != null ? r(netIncome) : null,
    free_cashflow: freeCashflow != null ? r(freeCashflow) : null,
    operating_cashflow: operatingCashflow != null ? r(operatingCashflow) : null,
    gross_profit: grossProfit != null ? r(grossProfit) : null,
    shareholder_equity: shareholderEquity != null ? r(shareholderEquity) : null,
    total_assets: totalAssets != null ? r(totalAssets) : null,
    total_debt: totalDebt != null ? r(totalDebt) : null,
    total_cash: cash != null ? r(cash) : null,
    beta: beta != null ? r(beta) : null,
    avg_volume: avgVolume != null ? r(avgVolume) : null,
    shares_outstanding: sharesOutstanding != null ? r(sharesOutstanding) : null,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { ticker } = await req.json();
    if (!ticker) return Response.json({ error: 'Ticker required' }, { status: 400 });

    const apiKey = Deno.env.get("BRAPI_API_KEY");
    const t = ticker.toUpperCase();
    const modules = 'defaultKeyStatistics,financialData,balanceSheetHistory,incomeStatementHistory';
    const url = `https://brapi.dev/api/quote/${t}?modules=${encodeURIComponent(modules)}&dividends=true&token=${apiKey}`;

    const res = await fetch(url);
    const data = await res.json();

    const raw = data.results?.[0];
    if (!raw) return Response.json({ error: 'Ticker não encontrado' }, { status: 404 });

    const fundamentals = calcFundamentals(raw);
    
    const incomeStatements = raw.incomeStatementHistory || [];
    const balanceSheetStatements = raw.balanceSheetHistory || [];

    return Response.json({
      ...fundamentals,
      incomeStatements,
      balanceSheetStatements,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});