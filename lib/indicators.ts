/**
 * Dicionário de explicações dos indicadores fundamentalistas exibidos
 * na página de detalhe da ação. Cada entrada tem:
 *
 *   - title: nome amigável do indicador
 *   - description: o que mede, em 1–2 frases
 *   - formula: como é calculado (opcional, quando aplicável)
 *   - benchmark: faixa "boa/ruim" típica (opcional)
 *
 * Mantido isolado do componente pra ficar fácil de revisar/atualizar
 * o copy sem mexer em UI.
 */

export interface IndicatorHelpEntry {
  title: string;
  description: string;
  formula?: string;
  benchmark?: string;
}

export const INDICATOR_HELP: Record<string, IndicatorHelpEntry> = {
  // ─── Valuation ───────────────────────────────────────────────────────────
  pl: {
    title: "P/L (Preço/Lucro)",
    description:
      "Mostra quanto o mercado paga por cada R$ 1 de lucro anual da empresa. Quanto menor, mais barata a ação parece — desde que o lucro seja sustentável.",
    formula: "Preço da ação ÷ Lucro por Ação (LPA)",
    benchmark: "Abaixo de 15 costuma ser atrativo. Bancos brasileiros: <12.",
  },
  pvp: {
    title: "P/VP (Preço/Valor Patrimonial)",
    description:
      "Compara o preço da ação ao patrimônio líquido por ação. Mostra se você está pagando ágio ou desconto sobre o valor contábil.",
    formula: "Preço da ação ÷ Valor Patrimonial por Ação (VPA)",
    benchmark: "Abaixo de 1,5 é bom. Abaixo de 1 sugere desconto sobre o patrimônio.",
  },
  dy: {
    title: "Dividend Yield",
    description:
      "Renda passiva anual paga pela empresa em dividendos, como percentual do preço da ação.",
    formula: "Dividendos pagos nos últimos 12 meses ÷ Preço atual × 100",
    benchmark: "Acima de 5% é considerado bom. Bancos costumam pagar 6%+.",
  },
  payout: {
    title: "Payout",
    description:
      "Percentual do lucro que a empresa distribui aos acionistas em forma de dividendos.",
    formula: "Dividendos por ação ÷ Lucro por ação × 100",
    benchmark: "Entre 30% e 80% é sustentável. Acima de 100% pode ser insustentável.",
  },
  evEbitda: {
    title: "EV/EBITDA",
    description:
      "Múltiplo de avaliação que considera a empresa inteira (incluindo dívida) sobre seu lucro operacional antes de juros, impostos, depreciação e amortização.",
    formula: "Enterprise Value ÷ EBITDA",
    benchmark: "Abaixo de 6 é atrativo. Não se aplica bem a bancos.",
  },
  evEbit: {
    title: "EV/EBIT",
    description:
      "Como o EV/EBITDA, mas considera depreciação e amortização. Mais conservador que EV/EBITDA.",
    formula: "Enterprise Value ÷ EBIT",
    benchmark: "Abaixo de 8 é atrativo.",
  },

  // ─── Por ação ───────────────────────────────────────────────────────────
  lpa: {
    title: "LPA (Lucro por Ação)",
    description: "Quanto a empresa lucrou por cada ação em circulação no último período.",
    formula: "Lucro Líquido ÷ Quantidade de ações",
    benchmark: "Quanto maior, melhor — desde que crescente ao longo dos anos.",
  },
  vpa: {
    title: "VPA (Valor Patrimonial por Ação)",
    description: "Patrimônio líquido da empresa dividido pelo número de ações.",
    formula: "Patrimônio Líquido ÷ Quantidade de ações",
    benchmark: "Comparado ao preço, gera o P/VP — chave da avaliação por patrimônio.",
  },
  revPerShare: {
    title: "Receita por Ação",
    description: "Quanto a empresa fatura por cada ação em circulação.",
    formula: "Receita Líquida ÷ Quantidade de ações",
  },

  // ─── Endividamento ──────────────────────────────────────────────────────
  netDebt: {
    title: "Dívida Líquida",
    description:
      "Dívida total da empresa menos o caixa disponível — mostra o real endividamento.",
    formula: "Dívida Bruta − Caixa e equivalentes",
    benchmark: "Negativa é ótimo (caixa > dívida). Para bancos, conceito não se aplica.",
  },
  netDebtToEquity: {
    title: "Dívida Líquida / PL",
    description:
      "Quanto da estrutura de capital vem de dívida líquida em relação ao patrimônio dos acionistas.",
    formula: "Dívida Líquida ÷ Patrimônio Líquido",
    benchmark: "Abaixo de 1 é saudável. Acima de 2 já preocupa.",
  },
  netDebtToEbitda: {
    title: "Dívida Líquida / EBITDA",
    description:
      "Quantos anos de geração operacional seriam necessários pra quitar toda a dívida líquida.",
    formula: "Dívida Líquida ÷ EBITDA",
    benchmark: "Abaixo de 3 é confortável. Acima de 4 é arriscado.",
  },
  liabToAssets: {
    title: "Passivos / Ativos",
    description:
      "Percentual dos ativos financiado por capital de terceiros (dívidas e obrigações).",
    formula: "Passivos Totais ÷ Ativos Totais",
    benchmark: "Abaixo de 60% é típico. Bancos têm naturalmente >90%.",
  },
  currentRatio: {
    title: "Liquidez Corrente",
    description:
      "Capacidade de a empresa pagar suas obrigações de curto prazo com seus ativos circulantes.",
    formula: "Ativo Circulante ÷ Passivo Circulante",
    benchmark: "Acima de 1 indica solvência de curto prazo. Abaixo já preocupa.",
  },

  // ─── Margens ────────────────────────────────────────────────────────────
  grossMargin: {
    title: "Margem Bruta",
    description: "Quanto sobra da receita após o custo direto da operação (CMV).",
    formula: "(Receita − CMV) ÷ Receita × 100",
    benchmark: "Varia por setor. Tech: 60%+. Indústria: 20-40%. Varejo: 20-30%.",
  },
  netMargin: {
    title: "Margem Líquida",
    description: "Percentual da receita que vira lucro líquido após todos os custos, despesas e impostos.",
    formula: "Lucro Líquido ÷ Receita Líquida × 100",
    benchmark: "Acima de 10% é saudável; bancos costumam ter >20%.",
  },
  ebitdaMargin: {
    title: "Margem EBITDA",
    description: "Percentual da receita que sobra como lucro operacional antes de juros, impostos, depreciação e amortização.",
    formula: "EBITDA ÷ Receita Líquida × 100",
    benchmark: "Acima de 20% é bom para a maioria dos setores.",
  },
  operatingMargin: {
    title: "Margem Operacional",
    description: "Lucro operacional como percentual da receita. Mostra a eficiência da operação principal.",
    formula: "Lucro Operacional ÷ Receita × 100",
    benchmark: "Acima de 15% é considerado eficiente.",
  },

  // ─── Rentabilidade ──────────────────────────────────────────────────────
  roe: {
    title: "ROE (Return on Equity)",
    description: "Retorno gerado sobre o patrimônio dos acionistas. Mostra quão eficiente é o capital próprio.",
    formula: "Lucro Líquido ÷ Patrimônio Líquido × 100",
    benchmark: "Acima de 15% é excelente. Bancos costumam ter 15–25%.",
  },
  roa: {
    title: "ROA (Return on Assets)",
    description: "Retorno gerado sobre os ativos totais. Mostra a eficiência em transformar ativos em lucro.",
    formula: "Lucro Líquido ÷ Ativos Totais × 100",
    benchmark: "Acima de 5% é bom. Bancos: >1% (têm muitos ativos por natureza).",
  },

  // ─── Crescimento ────────────────────────────────────────────────────────
  cagrRevenue: {
    title: "CAGR Receita 5A",
    description: "Taxa de crescimento anual composto da receita ao longo dos últimos 5 anos.",
    formula: "((Receita Final / Receita Inicial)^(1/5)) − 1",
    benchmark: "Acima da inflação é positivo. Acima de 10% é forte.",
  },
  cagrEarnings: {
    title: "CAGR Lucro 5A",
    description: "Taxa de crescimento anual composto do lucro líquido nos últimos 5 anos.",
    formula: "((Lucro Final / Lucro Inicial)^(1/5)) − 1",
    benchmark: "Acima de 10% indica empresa em crescimento sustentável.",
  },
  revGrowth: {
    title: "Crescimento Receita",
    description: "Variação da receita no período mais recente em relação ao período anterior.",
    benchmark: "Positivo é bom; acima de 10% sugere expansão forte.",
  },
  earnGrowth: {
    title: "Crescimento Lucro",
    description: "Variação do lucro líquido no período mais recente em relação ao anterior.",
    benchmark: "Crescimento sustentado de lucro é o sinal mais importante de uma boa empresa.",
  },

  // ─── Tamanho / Demonstrativos ───────────────────────────────────────────
  revenue: {
    title: "Receita Líquida",
    description: "Receita total após descontar impostos sobre vendas, devoluções e abatimentos.",
  },
  ebitda: {
    title: "EBITDA",
    description: "Lucro antes de juros, impostos, depreciação e amortização. Mostra a geração operacional pura.",
  },
  netIncome: {
    title: "Lucro Líquido",
    description: "Lucro final após todos os custos, despesas, juros e impostos.",
  },
  fcf: {
    title: "Free Cash Flow (FCF)",
    description: "Caixa que sobra após investimentos em manutenção e expansão. Disponível pra acionistas e dívida.",
    formula: "Fluxo de Caixa Operacional − CapEx",
    benchmark: "Positivo e crescente é o ideal.",
  },
  beta: {
    title: "Beta",
    description: "Sensibilidade da ação ao mercado. Beta 1 = move junto com o índice.",
    benchmark: "<1: defensiva (menos volátil). >1: agressiva. <0: contra-cíclica.",
  },

  // ─── Específicos pra setor financeiro ───────────────────────────────────
  leverage: {
    title: "Alavancagem (Ativos/PL)",
    description: "Em bancos, mostra quantas vezes o patrimônio próprio sustenta a operação total (depósitos + dívida).",
    formula: "Ativos Totais ÷ Patrimônio Líquido",
    benchmark: "Bancos saudáveis: 8× a 14×. Acima de 14× é arriscado.",
  },
  capitalRatio: {
    title: "Capital Ratio (PL/Ativos)",
    description: "Proxy do índice de Basileia — mostra quanto do banco é financiado por capital próprio em vez de dívida/depósitos.",
    formula: "Patrimônio Líquido ÷ Ativos Totais",
    benchmark: "Acima de 8% costuma ser o mínimo regulatório.",
  },
  revPerAssets: {
    title: "Receita / Ativos",
    description: "Eficiência do banco em gerar receita sobre seus ativos. Em bancos, indica intensidade de uso da carteira de crédito.",
    formula: "Receita Líquida ÷ Ativos Totais",
  },
  profitPerAssets: {
    title: "Lucro / Ativos",
    description: "Mesmo conceito que ROA — quanto o banco gera de lucro pra cada R$ de ativo.",
    formula: "Lucro Líquido ÷ Ativos Totais",
    benchmark: "Para bancos, >1% é saudável.",
  },
  equity: {
    title: "Patrimônio Líquido",
    description: "Capital dos acionistas — diferença entre ativos e passivos da empresa.",
  },
  totalAssets: {
    title: "Ativos Totais",
    description: "Soma de todos os bens, direitos e investimentos da empresa.",
  },
  cash: {
    title: "Caixa",
    description: "Caixa e investimentos de curto prazo disponíveis imediatamente.",
  },
};
