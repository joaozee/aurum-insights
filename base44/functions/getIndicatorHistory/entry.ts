import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const BRAPI_API_KEY = Deno.env.get("BRAPI_API_KEY");

const round = (value, decimals = 2) => {
  if (value === null || value === undefined || isNaN(value)) return null;
  const n = parseFloat(value);
  if (!isFinite(n)) return null;
  return parseFloat(n.toFixed(decimals));
};

const getRaw = (field) => {
  if (field === null || field === undefined) return null;
  if (typeof field === 'object' && 'raw' in field) return field.raw;
  return typeof field === 'number' ? field : null;
};

const getYear = (item) => {
  if (!item?.endDate) return null;
  const d = item.endDate?.raw ? new Date(item.endDate.raw * 1000) : new Date(item.endDate);
  return d.getFullYear();
};

const safe = (num, den) => {
  if (num == null || den == null || den === 0) return null;
  return num / den;
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { ticker } = await req.json();
    if (!ticker) return Response.json({ error: 'ticker required' }, { status: 400 });

    const modules = [
      'defaultKeyStatisticsHistory',
      'incomeStatementHistory',
      'financialDataHistory',
      'balanceSheetHistory',
      'cashflowHistory'
    ].join(',');

    const url = `https://brapi.dev/api/quote/${ticker}?modules=${modules}&fundamental=true&dividends=true&range=10y&interval=1mo&token=${BRAPI_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`BRAPI error: ${response.status}`);

    const data = await response.json();
    const result = data.results?.[0];
    if (!result) return Response.json({ indicators: [] });

    // ===== PREÇOS HISTÓRICOS =====
    const historicalPrices = result.historicalDataPrice || [];
    const yearlyPricesMap = {};
    historicalPrices.forEach(item => {
      if (!item.close || item.close <= 0) return;
      const year = new Date(item.date * 1000).getFullYear();
      if (!yearlyPricesMap[year]) yearlyPricesMap[year] = [];
      yearlyPricesMap[year].push(item.close);
    });
    const avgPriceByYear = {};
    Object.entries(yearlyPricesMap).forEach(([year, prices]) => {
      avgPriceByYear[year] = prices.reduce((a, b) => a + b, 0) / prices.length;
    });

    // ===== DIVIDENDOS =====
    const dividendsData = result.dividendsData?.cashDividends || [];
    const dividendsByYear = {};
    dividendsData.forEach(d => {
      const dateStr = d.paymentDate || d.declaredDate;
      if (!dateStr) return;
      const year = new Date(dateStr).getFullYear();
      if (!dividendsByYear[year]) dividendsByYear[year] = 0;
      dividendsByYear[year] += d.rate || 0;
    });

    // ===== HISTÓRICOS POR ANO =====
    const keyStatsHistory = result.defaultKeyStatisticsHistory || [];
    const keyStatsByYear = {};
    keyStatsHistory.forEach(item => {
      const year = getYear(item);
      if (year) keyStatsByYear[year] = item;
    });

    const incomeHistory = result.incomeStatementHistory?.incomeStatementHistory || [];
    const incomeByYear = {};
    incomeHistory.forEach(item => {
      const year = getYear(item);
      if (year) incomeByYear[year] = item;
    });

    const financialHistory = result.financialDataHistory || [];
    const financialByYear = {};
    financialHistory.forEach(item => {
      const year = getYear(item);
      if (year) financialByYear[year] = item;
    });

    const balanceHistory = result.balanceSheetHistory?.balanceSheetStatements || [];
    const balanceByYear = {};
    balanceHistory.forEach(item => {
      const year = getYear(item);
      if (year) balanceByYear[year] = item;
    });

    const cashflowHistoryData = result.cashflowHistory?.cashflowStatements || [];
    const cashflowByYear = {};
    cashflowHistoryData.forEach(item => {
      const year = getYear(item);
      if (year) cashflowByYear[year] = item;
    });

    // ===== ANOS DISPONÍVEIS =====
    const allYears = new Set([
      ...Object.keys(avgPriceByYear).map(Number),
      ...Object.keys(incomeByYear).map(Number),
      ...Object.keys(financialByYear).map(Number),
    ]);
    const currentYear = new Date().getFullYear();
    const years = [...allYears]
      .filter(y => y < currentYear && y >= currentYear - 10)
      .sort((a, b) => a - b);

    // ===== ARRAYS ORDENADOS PARA CAGR =====
    const sortedIncomeYears = Object.keys(incomeByYear).map(Number).sort((a, b) => a - b);

    const indicators = years.map(year => {
      const avgPrice = avgPriceByYear[year] || null;
      const dividend = dividendsByYear[year] || 0;
      const ks = keyStatsByYear[year] || {};
      const income = incomeByYear[year] || {};
      const financial = financialByYear[year] || {};
      const balance = balanceByYear[year] || {};

      // --- Dados Brutos ---
      const sharesOutstanding = getRaw(ks.sharesOutstanding) || getRaw(ks.impliedSharesOutstanding) || null;
      const marketCap = avgPrice && sharesOutstanding ? avgPrice * sharesOutstanding : null;

      const totalRevenue = getRaw(income.totalRevenue) || getRaw(financial.totalRevenue) || null;
      const grossProfit = getRaw(income.grossProfit) || getRaw(financial.grossProfits) || null;
      const netIncome = getRaw(income.netIncome) || getRaw(ks.netIncomeToCommon) || null;
      const operatingIncome = getRaw(income.operatingIncome) || getRaw(income.ebit) || null;
      const ebitda = getRaw(financial.ebitda) || null;
      const interestExpense = getRaw(income.interestExpense) || null;
      const incomeTaxExpense = getRaw(income.incomeTaxExpense) || null;

      const totalAssets = getRaw(ks.totalAssets) || getRaw(balance.totalAssets) || null;
      const totalCurrentAssets = getRaw(balance.totalCurrentAssets) || null;
      const totalCurrentLiabilities = getRaw(balance.totalCurrentLiabilities) || null;
      const cash = getRaw(financial.totalCash) || getRaw(balance.cash) || null;
      const longTermDebt = getRaw(balance.longTermDebt) || 0;
      const shortTermDebt = getRaw(balance.shortLongTermDebt) || getRaw(balance.shortTermDebt) || 0;
      const totalDebt = getRaw(financial.totalDebt) || (longTermDebt + shortTermDebt) || null;
      const shareholderEquity = getRaw(balance.totalStockholderEquity) ||
        (getRaw(ks.bookValue) && sharesOutstanding ? getRaw(ks.bookValue) * sharesOutstanding : null);
      const totalLiabilities = totalAssets && shareholderEquity ? totalAssets - shareholderEquity : null;
      const inventory = getRaw(balance.inventory) || null;

      const freeCashflowRaw = getRaw(financial.freeCashflow) || null;

      // --- EPS ---
      const eps_income = getRaw(income.dilutedEPS) || null;
      const eps_ks = getRaw(ks.trailingEps) || null;
      const eps = eps_income || eps_ks;

      // --- VPA ---
      const vpa = shareholderEquity && sharesOutstanding ? shareholderEquity / sharesOutstanding : null;

      // --- EV ---
      const ev = marketCap != null && totalDebt != null && cash != null
        ? marketCap + totalDebt - cash
        : null;

      // ===================================================
      // VALUATION
      // ===================================================

      // P/L: usar BRAPI se razoável, senão recalcular
      let pe_ratio = null;
      const pe_brapi = getRaw(ks.trailingPE);
      if (pe_brapi && pe_brapi >= 3 && pe_brapi <= 60) {
        pe_ratio = round(pe_brapi);
      } else if (avgPrice && eps && eps > 0) {
        const calc = avgPrice / eps;
        if (calc >= 2 && calc <= 60) pe_ratio = round(calc);
      }

      // P/VP
      const pb_ratio = round(getRaw(ks.priceToBook)) ||
        round(safe(avgPrice, vpa));

      // Dividend Yield = dividendos do ano / preço médio
      const dividend_yield = avgPrice && dividend > 0
        ? round((dividend / avgPrice) * 100)
        : null;

      // PEG Ratio (usando crescimento YoY do lucro quando disponível)
      let peg_ratio = null;
      const prevYear = year - 1;
      const prevIncome = incomeByYear[prevYear] || {};
      const prevNetIncome = getRaw(prevIncome.netIncome) || null;
      if (pe_ratio && netIncome && prevNetIncome && prevNetIncome > 0) {
        const earningsGrowth = ((netIncome - prevNetIncome) / prevNetIncome) * 100;
        if (earningsGrowth > 0) peg_ratio = round(pe_ratio / earningsGrowth);
      }

      // EV/EBITDA
      const ev_ebitda = round(getRaw(ks.enterpriseToEbitda)) ||
        round(safe(ev, ebitda));

      // EV/EBIT
      const ev_ebit = round(safe(ev, operatingIncome));

      // P/EBITDA
      const p_ebitda = round(safe(marketCap, ebitda));

      // P/EBIT
      const p_ebit = round(safe(marketCap, operatingIncome));

      // LPA
      const lpa = eps ? round(eps) : (netIncome && sharesOutstanding ? round(netIncome / sharesOutstanding) : null);

      // VPA
      const vpa_rounded = vpa ? round(vpa) : null;

      // P/SR (Price to Sales Ratio)
      const p_sr = round(safe(marketCap, totalRevenue));

      // ===================================================
      // ENDIVIDAMENTO
      // ===================================================

      const net_debt = totalDebt != null && cash != null
        ? round((totalDebt - cash) / 1e6, 0)
        : null;

      const net_debt_to_equity = shareholderEquity && shareholderEquity > 0 && totalDebt != null && cash != null
        ? round((totalDebt - cash) / shareholderEquity)
        : null;

      const net_debt_to_ebitda = ebitda && ebitda > 0 && totalDebt != null && cash != null
        ? round((totalDebt - cash) / ebitda)
        : null;

      const net_debt_to_ebit = operatingIncome && operatingIncome > 0 && totalDebt != null && cash != null
        ? round((totalDebt - cash) / operatingIncome)
        : null;

      const liabilities_to_assets = totalLiabilities && totalAssets && totalAssets > 0
        ? round(totalLiabilities / totalAssets)
        : null;

      const current_ratio = totalCurrentAssets && totalCurrentLiabilities && totalCurrentLiabilities > 0
        ? round(totalCurrentAssets / totalCurrentLiabilities)
        : round(getRaw(financial.currentRatio));

      // ===================================================
      // EFICIÊNCIA
      // ===================================================

      const gross_margin = grossProfit && totalRevenue && totalRevenue > 0
        ? round((grossProfit / totalRevenue) * 100)
        : round(getRaw(financial.grossMargins) != null ? getRaw(financial.grossMargins) * 100 : null);

      const ebitda_margin = ebitda && totalRevenue && totalRevenue > 0
        ? round((ebitda / totalRevenue) * 100)
        : round(getRaw(financial.ebitdaMargins) != null ? getRaw(financial.ebitdaMargins) * 100 : null);

      const ebit_margin = operatingIncome && totalRevenue && totalRevenue > 0
        ? round((operatingIncome / totalRevenue) * 100)
        : null;

      const operating_margin = round(getRaw(financial.operatingMargins) != null
        ? getRaw(financial.operatingMargins) * 100
        : ebit_margin);

      const net_margin = netIncome && totalRevenue && totalRevenue > 0
        ? round((netIncome / totalRevenue) * 100)
        : round(getRaw(financial.profitMargins) != null ? getRaw(financial.profitMargins) * 100 : null);

      // ===================================================
      // RENTABILIDADE
      // ===================================================

      const roe = getRaw(financial.returnOnEquity) != null
        ? round(getRaw(financial.returnOnEquity) * 100)
        : (netIncome && shareholderEquity && shareholderEquity > 0
          ? round((netIncome / shareholderEquity) * 100)
          : null);

      const roa = getRaw(financial.returnOnAssets) != null
        ? round(getRaw(financial.returnOnAssets) * 100)
        : (netIncome && totalAssets && totalAssets > 0
          ? round((netIncome / totalAssets) * 100)
          : null);

      // ROIC = NOPAT / (Dívida Total + PL)
      let roic = null;
      if (operatingIncome && totalDebt != null && shareholderEquity) {
        const taxRate = incomeTaxExpense && operatingIncome > 0
          ? Math.abs(incomeTaxExpense) / operatingIncome
          : 0.34;
        const nopat = operatingIncome * (1 - taxRate);
        const investedCapital = totalDebt + shareholderEquity;
        if (investedCapital > 0) roic = round((nopat / investedCapital) * 100);
      }

      // ===================================================
      // CRESCIMENTO (CAGR 5 anos — calculado relativo ao ano corrente do loop)
      // ===================================================
      let cagr_revenue = null;
      let cagr_net_income = null;

      const idx = sortedIncomeYears.indexOf(year);
      if (idx >= 5) {
        const year5ago = sortedIncomeYears[idx - 5];
        const old = incomeByYear[year5ago] || {};
        const oldRevenue = getRaw(old.totalRevenue);
        const oldNetIncome = getRaw(old.netIncome);
        if (oldRevenue && oldRevenue > 0 && totalRevenue && totalRevenue > 0) {
          cagr_revenue = round((Math.pow(totalRevenue / oldRevenue, 1 / 5) - 1) * 100);
        }
        if (oldNetIncome && oldNetIncome > 0 && netIncome && netIncome > 0) {
          cagr_net_income = round((Math.pow(netIncome / oldNetIncome, 1 / 5) - 1) * 100);
        }
      }

      // ===================================================
      // DADOS BRUTOS (em milhões para evitar números gigantes)
      // ===================================================
      const revenue_m = totalRevenue ? round(totalRevenue / 1e6, 0) : null;
      const ebitda_m = ebitda ? round(ebitda / 1e6, 0) : null;
      const net_income_m = netIncome ? round(netIncome / 1e6, 0) : null;
      const free_cashflow = freeCashflowRaw ? round(freeCashflowRaw / 1e6, 0) : null;

      // Payout
      let payout = null;
      if (dividend > 0 && eps && eps > 0) {
        const p = (dividend / eps) * 100;
        if (p > 0 && p <= 200) payout = round(p);
      }

      return {
        year,
        // Valuation
        pe_ratio,
        pb_ratio,
        dividend_yield,
        payout,
        peg_ratio,
        ev_ebitda,
        ev_ebit,
        p_ebitda,
        p_ebit,
        p_sr,
        lpa,
        vpa: vpa_rounded,
        // Endividamento
        net_debt,
        net_debt_to_equity,
        net_debt_to_ebitda,
        net_debt_to_ebit,
        liabilities_to_assets,
        current_ratio,
        // Eficiência
        gross_margin,
        ebitda_margin,
        ebit_margin,
        operating_margin,
        net_margin,
        // Rentabilidade
        roe,
        roa,
        roic,
        // Crescimento
        cagr_revenue,
        cagr_net_income,
        // Dados brutos
        revenue: revenue_m,
        ebitda: ebitda_m,
        net_income: net_income_m,
        free_cashflow,
        eps,
      };
    });

    return Response.json({ indicators, ticker });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});