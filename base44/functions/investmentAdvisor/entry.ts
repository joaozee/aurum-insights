import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { riskTolerance, investmentHorizon, monthlyCapacity, targetAmount, targetDate, currentAssets } = body;

    // Fetch stocks with DY >= 6%
    const stocks = await base44.entities.StockData.filter({});
    const highDividendStocks = stocks.filter(s => s.dividend_yield >= 6);

    // Filter by risk tolerance
    let recommendedStocks = highDividendStocks;
    if (riskTolerance === 'conservador') {
      recommendedStocks = highDividendStocks.filter(s => s.pe_ratio < 15 && s.pb_ratio < 1.5);
    } else if (riskTolerance === 'agressivo') {
      recommendedStocks = highDividendStocks.filter(s => s.pb_ratio < 3);
    }

    // Sort by dividend yield
    recommendedStocks.sort((a, b) => (b.dividend_yield || 0) - (a.dividend_yield || 0));
    recommendedStocks = recommendedStocks.slice(0, 10);

    // Calculate portfolio allocation
    const allocation = {
      high_dividend: 60,
      growth_dividend: 25,
      defensive_dividend: 15
    };

    // Simulate performance
    let projectedValue = monthlyCapacity * 12;
    if (targetDate) {
      const targetDateObj = new Date(targetDate);
      const currentDate = new Date();
      const years = (targetDateObj - currentDate) / (1000 * 60 * 60 * 24 * 365);
      
      // Average dividend yield is 7%
      const annualReturn = 0.07;
      projectedValue = monthlyCapacity * 12 * ((Math.pow(1 + annualReturn, years) - 1) / annualReturn + years);
    }

    // Generate strategy
    const strategy = {
      name: 'Carteira Renda Passiva - Dividendos',
      description: `Estratégia personalizada para ${riskTolerance === 'conservador' ? 'investidores conservadores' : riskTolerance === 'moderado' ? 'investidores moderados' : 'investidores agressivos'} focada em renda passiva com ações DY ≥ 6%`,
      riskProfile: riskTolerance,
      horizon: investmentHorizon,
      allocation,
      monthlyInvestment: monthlyCapacity,
      expectedReturn: '8-12% ao ano',
      dividend_yield_target: '7%',
      tickers: recommendedStocks.map(s => ({
        ticker: s.ticker,
        name: s.company_name,
        dy: s.dividend_yield + '%',
        peRatio: s.pe_ratio,
        pbRatio: s.pb_ratio,
        reason: `Alto dividend yield (${s.dividend_yield}%), valorização fundamental, sustentável a longo prazo`
      }))
    };

    // Calculate projection
    const totalContributed = monthlyCapacity * 12 * (targetDate ? ((new Date(targetDate) - new Date()) / (1000 * 60 * 60 * 24 * 365)) : 5);
    const projectedGains = projectedValue - totalContributed;

    const projection = {
      targetAmount: targetAmount || 0,
      projectedValue: Math.round(projectedValue),
      totalContributed: Math.round(totalContributed),
      projectedGains: Math.round(projectedGains),
      onTrack: projectedValue >= (targetAmount || 0),
      surplusOrGap: projectedValue - (targetAmount || 0)
    };

    return Response.json({ strategy, projection });
  } catch (error) {
    console.error(error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});