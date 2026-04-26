import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { primaryGoal, riskTolerance, investmentHorizon, monthlyCapacity, targetAmount, targetDate } = payload;

    // Validate inputs
    if (!primaryGoal || !riskTolerance || !investmentHorizon) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Strategy recommendations based on profile
    const strategies = {
      conservador: {
        name: 'Renda Passiva Conservadora',
        description: 'Foco em dividendos com baixa volatilidade',
        allocation: { acoes_dividendos: 70, cash: 30 },
        dividend_yield_target: 6.5,
        tickers: [
          { ticker: 'TAEE11', name: 'Taesa', dy: '7.5%', reason: 'Concessões de energia com fluxo previsível' },
          { ticker: 'ITUB4', name: 'Itaú', dy: '5.5%', reason: 'Banco sólido com dividendos históricos' },
          { ticker: 'BBAS3', name: 'BB', dy: '6.2%', reason: 'Banco com bom pagamento de dividendos' },
          { ticker: 'EGIE3', name: 'Engie', dy: '6.8%', reason: 'Infraestrutura de energia' }
        ],
        monthlyInvestment: monthlyCapacity || 1000,
        expectedReturn: '7-9% aa'
      },
      moderado: {
        name: 'Renda Passiva Balanceada',
        description: 'Foco principal em dividendos com diversificação',
        allocation: { acoes_dividendos: 80, cash: 20 },
        dividend_yield_target: 6.0,
        tickers: [
          { ticker: 'ITUB4', name: 'Itaú', dy: '5.5%', reason: 'Banco com fundamentos sólidos' },
          { ticker: 'BBAS3', name: 'BB', dy: '6.2%', reason: 'Setor bancário, dividendos consistentes' },
          { ticker: 'CPLE6', name: 'Copel', dy: '6.5%', reason: 'Energia com dividendos consistentes' },
          { ticker: 'TAEE11', name: 'Taesa', dy: '7.5%', reason: 'Concessões de infraestrutura' },
          { ticker: 'EGIE3', name: 'Engie', dy: '6.8%', reason: 'Utilidade com receita previsível' }
        ],
        monthlyInvestment: monthlyCapacity || 2000,
        expectedReturn: '8-10% aa'
      },
      agressivo: {
        name: 'Renda Passiva Agressiva',
        description: 'Máximo foco em dividendos altos',
        allocation: { acoes_dividendos: 90, cash: 10 },
        dividend_yield_target: 6.8,
        tickers: [
          { ticker: 'TAEE11', name: 'Taesa', dy: '7.5%', reason: 'Concessões com fluxo excelente' },
          { ticker: 'EGIE3', name: 'Engie', dy: '6.8%', reason: 'Infraestrutura premium' },
          { ticker: 'CPLE6', name: 'Copel', dy: '6.5%', reason: 'Utilidade brasileira sólida' },
          { ticker: 'BBAS3', name: 'BB', dy: '6.2%', reason: 'Banco com máximos dividendos' },
          { ticker: 'ITUB4', name: 'Itaú', dy: '5.5%', reason: 'Excelente fundamento e dividendos' }
        ],
        monthlyInvestment: monthlyCapacity || 3000,
        expectedReturn: '9-11% aa'
      }
    };

    const strategy = strategies[riskTolerance] || strategies.moderado;

    // Calculate projection if target amount and date provided
    let projection = null;
    if (targetAmount && targetDate) {
      const monthlyAmount = monthlyCapacity || 1000;
      const returnRate = 0.10; // 10% annual (6% from dividends + 4% growth)
      const monthlyRate = returnRate / 12;
      const monthsRemaining = calculateMonthsUntil(targetDate);
      
      // Future value with monthly contributions
      const fv = monthlyAmount * (((Math.pow(1 + monthlyRate, monthsRemaining) - 1) / monthlyRate) * (1 + monthlyRate));
      const totalContributed = monthlyAmount * monthsRemaining;
      const gains = fv - totalContributed;

      projection = {
        targetAmount,
        targetDate,
        monthlyInvestment: monthlyAmount,
        monthsRemaining,
        projectedValue: Math.round(fv),
        totalContributed: Math.round(totalContributed),
        projectedGains: Math.round(gains),
        onTrack: fv >= targetAmount,
        surplusOrGap: Math.round(fv - targetAmount)
      };
    }

    return Response.json({
      strategy,
      projection,
      goalAlignment: {
        goal: primaryGoal,
        horizon: investmentHorizon,
        riskProfile: riskTolerance
      }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function calculateMonthsUntil(targetDate) {
  const now = new Date();
  const target = new Date(targetDate);
  const months = (target.getFullYear() - now.getFullYear()) * 12 + 
                 (target.getMonth() - now.getMonth());
  return Math.max(months, 1);
}