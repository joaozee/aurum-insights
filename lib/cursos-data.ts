// ─── Tipos ────────────────────────────────────────────────────────────────────

export type CursoCategoria = "investimentos" | "formacao" | "avancado";
export type CursoNivel = "iniciante" | "intermediario" | "avancado";
export type ConteudoTipo = "tutorial" | "artigo" | "video";

export interface Aula {
  id: string;
  titulo: string;
  duracaoMin: number;
  videoUrl?: string;
  descricao?: string;
}

export interface Modulo {
  id: string;
  titulo: string;
  aulas: Aula[];
}

export interface Curso {
  id: string;
  // UUID estável usado como course_id no Supabase (FK em user_enrollment, etc).
  dbId: string;
  titulo: string;
  descricao: string;
  imagem: string;
  categoria: CursoCategoria;
  nivel: CursoNivel;
  bestseller?: boolean;
  destaque?: string;
  preco: number;
  precoOriginal?: number;
  desconto?: number;
  duracaoHoras: number;
  totalAulas: number;
  alunos: number;
  matriculado?: boolean;
  progresso?: number;
  proximoPasso?: { id: string; titulo: string; preco: number; duracaoHoras: number };
  aprendizado: string[];
  modulos: Modulo[];
}

export interface ConteudoGratuito {
  id: string;
  titulo: string;
  tipo: ConteudoTipo;
  duracaoMin?: number;
  novo?: boolean;
}

// ─── Labels ───────────────────────────────────────────────────────────────────

export const CATEGORIA_LABEL: Record<CursoCategoria, string> = {
  investimentos: "Investimentos",
  formacao: "Formação",
  avancado: "Avançado",
};

export const NIVEL_LABEL: Record<CursoNivel, string> = {
  iniciante: "Iniciante",
  intermediario: "Intermediário",
  avancado: "Avançado",
};

// ─── Dados ────────────────────────────────────────────────────────────────────
//
// Imagens dos cursos vivem em /public/cursos/{id}.jpg (recomendo 1200×600).
// Direção editorial: foto contextual brasileira (papelada de IR, B3, leitura
// de Valor/Money Times, recibo Tesouro Direto, contracheque, gráfico do
// Ibovespa), nunca stock-photo genérico americano. Quando o arquivo não
// existe, o hero renderiza um placeholder tonal dourado com ícone — sem
// imagem quebrada.
//
// Sugestão de tema por curso (para curadoria das fotos):
//   investimentos-do-zero     →  caderno + caneta + extrato, ou tela do home broker BR
//   dividendos-renda-passiva  →  recibos de proventos, planilha de carteira, calc
//   analise-fundamentalista   →  release de balanço, monitor com gráfico de empresa B3

export const CURSOS: Curso[] = [
  {
    id: "investimentos-do-zero",
    dbId: "a1c0b001-1111-4001-8001-000000000001",
    titulo: "Investimentos do Zero ao Avançado",
    descricao:
      "Curso completo para quem quer começar a investir do zero e dominar as principais estratégias do mercado financeiro.",
    imagem: "/cursos/investimentos-do-zero.jpg",
    categoria: "formacao",
    nivel: "iniciante",
    bestseller: true,
    destaque: "-40%",
    preco: 297,
    precoOriginal: 497,
    desconto: 40,
    duracaoHoras: 13,
    totalAulas: 60,
    alunos: 1252,
    matriculado: true,
    progresso: 100,
    proximoPasso: {
      id: "dividendos-renda-passiva",
      titulo: "Dividendos: Viva de Renda Passiva",
      preco: 247,
      duracaoHoras: 15,
    },
    aprendizado: [
      "Pense como sócio: mentalidade do investidor de longo prazo",
      "Método Aurum: dividendos sustentáveis sem cair em armadilhas",
      "Análise fundamentalista focada em quem busca renda",
      "Carteira sólida, gestão emocional e renda passiva real",
    ],
    modulos: [
      {
        id: "m1",
        titulo: "Mentalidade de Investidor: O Jogo de Quem Enriquece",
        aulas: [
          { id: "m1-1", titulo: "Investidor x Especulador: Quem Ganha no Longo Prazo", duracaoMin: 10 },
          { id: "m1-2", titulo: "Por Que a Maioria Perde Dinheiro na Bolsa", duracaoMin: 10 },
          { id: "m1-3", titulo: "Pensar Como Sócio, Não Como Apostador", duracaoMin: 9 },
          { id: "m1-4", titulo: "O Poder do Tempo e dos Juros Compostos", duracaoMin: 11 },
          { id: "m1-5", titulo: "Expectativas Reais", duracaoMin: 8 },
        ],
      },
      {
        id: "m2",
        titulo: "O Mercado Por Dentro: Tudo Que Você Precisava Saber e Ninguém Explicou Direito",
        aulas: [
          { id: "m2-1", titulo: "O Que É Uma Ação na Prática", duracaoMin: 10 },
          { id: "m2-2", titulo: "Como as Empresas Geram Lucro", duracaoMin: 12 },
          { id: "m2-3", titulo: "O Que São Dividendos e JCP", duracaoMin: 12 },
          { id: "m2-4", titulo: "Preço x Valor: O Erro Que Custa Caro", duracaoMin: 14 },
          { id: "m2-5", titulo: "B3, Corretoras e Custos Que Você Precisa Conhecer", duracaoMin: 12 },
        ],
      },
      {
        id: "m3",
        titulo: "Planejamento Financeiro do Investidor Inteligente",
        aulas: [
          { id: "m3-1", titulo: "Descobrindo Seu Perfil de Investidor", duracaoMin: 9 },
          { id: "m3-2", titulo: "Reserva de Emergência: A Base de Tudo", duracaoMin: 11 },
          { id: "m3-3", titulo: "Quanto Investir Por Mês?", duracaoMin: 10 },
          { id: "m3-4", titulo: "Constância e Disciplina: O Segredo Que Poucos Seguem", duracaoMin: 10 },
          { id: "m3-5", titulo: "Paz Financeira: Como Investir Sem Deixar o Mercado Controlar Suas Emoções", duracaoMin: 12 },
        ],
      },
      {
        id: "m4",
        titulo: "Estratégia de Dividendos (Método Aurum)",
        aulas: [
          { id: "m4-1", titulo: "O Que Faz as Empresas Serem Boas Pagadoras de Dividendos?", duracaoMin: 13 },
          { id: "m4-2", titulo: "Dividend Yield: Como Analisar Sem Cair em Armadilha", duracaoMin: 15 },
          { id: "m4-3", titulo: "Dividendos Altos x Dividendos Sustentáveis", duracaoMin: 14 },
          { id: "m4-4", titulo: "O Efeito Bola de Neve nos Dividendos", duracaoMin: 12 },
          { id: "m4-5", titulo: "Empresas de Crescimento x Empresas de Dividendos", duracaoMin: 14 },
        ],
      },
      {
        id: "m5",
        titulo: "Análise Fundamentalista Para Quem Busca Dividendos",
        aulas: [
          { id: "m5-1", titulo: "Indicadores Essenciais Que Realmente Importam", duracaoMin: 16 },
          { id: "m5-2", titulo: "Lucro, Margem e Qualidade do Negócio", duracaoMin: 15 },
          { id: "m5-3", titulo: "ROE, Dívida e Eficiência da Empresa", duracaoMin: 16 },
          { id: "m5-4", titulo: "Payout e Sustentabilidade dos Dividendos", duracaoMin: 14 },
          { id: "m5-5", titulo: "Do Papel Para a Prática: Como Analisar Uma Empresa Completa Antes de Investir", duracaoMin: 20 },
        ],
      },
      {
        id: "m6",
        titulo: "Preço Justo: Como Não Comprar Ações Caras",
        aulas: [
          { id: "m6-1", titulo: "O Preço Que Você Paga Determina o Retorno Que Você Terá", duracaoMin: 12 },
          { id: "m6-2", titulo: "O Conceito de Preço Teto na Prática", duracaoMin: 14 },
          { id: "m6-3", titulo: "Método Aurum (Bazin) Explicado de Forma Simples", duracaoMin: 16 },
          { id: "m6-4", titulo: "Definindo Seu Dividend Yield Alvo", duracaoMin: 12 },
          { id: "m6-5", titulo: "Quando Comprar, Esperar ou Aportar Mais", duracaoMin: 14 },
        ],
      },
      {
        id: "m7",
        titulo: "Mantendo uma Carteira de Dividendos Sólida",
        aulas: [
          { id: "m7-1", titulo: "Quantas Ações Ter na Carteira", duracaoMin: 11 },
          { id: "m7-2", titulo: "Diversificação por Setores: Proteção Natural", duracaoMin: 13 },
          { id: "m7-3", titulo: "Como a Carteira Se Equilibra Sozinha Com o Tempo", duracaoMin: 12 },
          { id: "m7-4", titulo: "Ações Brasileiras x Renda Fixa", duracaoMin: 14 },
          { id: "m7-5", titulo: "Os Erros Que Destroem Carteiras Boas: Concentração, Ilusão de Segurança e Armadilhas Comuns", duracaoMin: 15 },
        ],
      },
      {
        id: "m8",
        titulo: "Gestão de Risco e Controle Emocional",
        aulas: [
          { id: "m8-1", titulo: "Volatilidade Não É Risco", duracaoMin: 11 },
          { id: "m8-2", titulo: "O Que Fazer Quando Uma Ação Cai", duracaoMin: 12 },
          { id: "m8-3", titulo: "Como Agir em Crises e Momentos de Pânico", duracaoMin: 13 },
          { id: "m8-4", titulo: "O Maior Inimigo do Investidor: A Emoção", duracaoMin: 10 },
          { id: "m8-5", titulo: "Disciplina: O Verdadeiro Diferencial", duracaoMin: 10 },
        ],
      },
      {
        id: "m9",
        titulo: "Acompanhamento de uma Carteira de Longo Prazo",
        aulas: [
          { id: "m9-1", titulo: "Com Que Frequência Analisar Suas Ações", duracaoMin: 10 },
          { id: "m9-2", titulo: "Quando Vender uma Ação (e Quando Não Vender)", duracaoMin: 13 },
          { id: "m9-3", titulo: "Rebalanceamento de Carteira na Prática", duracaoMin: 14 },
          { id: "m9-4", titulo: "Reinvestindo Dividendos de Forma Estratégica", duracaoMin: 12 },
          { id: "m9-5", titulo: "Ajustando a Estratégia ao Longo dos Anos", duracaoMin: 11 },
        ],
      },
      {
        id: "m10",
        titulo: "Renda Passiva e Liberdade Financeira",
        aulas: [
          { id: "m10-1", titulo: "Quanto Tempo Leva Para Viver de Dividendos", duracaoMin: 13 },
          { id: "m10-2", titulo: "Simulações Reais de Crescimento Patrimonial", duracaoMin: 16 },
          { id: "m10-3", titulo: "Como Aumentar Aportes ao Longo da Vida", duracaoMin: 12 },
          { id: "m10-4", titulo: "Erros Que Atrasam a Independência Financeira", duracaoMin: 12 },
          { id: "m10-5", titulo: "Investir Como Estilo de Vida", duracaoMin: 11 },
        ],
      },
      {
        id: "m11",
        titulo: "Análise Prática por Setores: Onde Faz (e Não Faz) Sentido Investir",
        aulas: [
          { id: "m11-1", titulo: "Como Analisar um Setor Antes de Olhar o Ticker", duracaoMin: 13 },
          { id: "m11-2", titulo: "Setor Bancário", duracaoMin: 14 },
          { id: "m11-3", titulo: "Setor de Seguros", duracaoMin: 12 },
          { id: "m11-4", titulo: "Setor de Energia", duracaoMin: 14 },
          { id: "m11-5", titulo: "Setores Que Você Deve Ficar Longe", duracaoMin: 12 },
        ],
      },
      {
        id: "m12",
        titulo: "Família: O Verdadeiro Motivo de Investir",
        aulas: [
          { id: "m12-1", titulo: "Por Que o Dinheiro Nunca Foi o Fim, Mas o Meio", duracaoMin: 10 },
          { id: "m12-2", titulo: "Investir Pensando em Quem Depende de Você", duracaoMin: 11 },
          { id: "m12-3", titulo: "Tempo: O Ativo Mais Valioso que o Dinheiro Não Compra", duracaoMin: 10 },
          { id: "m12-4", titulo: "Liberdade Financeira e Ter Presença, Não Ostentação", duracaoMin: 11 },
          { id: "m12-5", titulo: "Construindo Legado para as Próximas Gerações", duracaoMin: 12 },
        ],
      },
    ],
  },
  {
    id: "dividendos-renda-passiva",
    dbId: "a1c0b001-1111-4001-8001-000000000002",
    titulo: "Dividendos: Viva de Renda Passiva",
    descricao: "Estratégias comprovadas para construir uma carteira que gera renda mensal.",
    imagem: "/cursos/dividendos-renda-passiva.jpg",
    categoria: "investimentos",
    nivel: "intermediario",
    bestseller: true,
    destaque: "-38%",
    preco: 247,
    precoOriginal: 397,
    desconto: 38,
    duracaoHoras: 15,
    totalAulas: 10,
    alunos: 982,
    matriculado: false,
    aprendizado: [
      "Identifique boas pagadoras de dividendos",
      "Calcule yield on cost e payout",
      "Construa um snowball de proventos",
      "Reinvista dividendos com inteligência",
    ],
    modulos: [
      {
        id: "div-1",
        titulo: "Fundamentos de Dividendos",
        aulas: [
          { id: "div-1-1", titulo: "O que são dividendos", duracaoMin: 8 },
          { id: "div-1-2", titulo: "Tipos de proventos", duracaoMin: 10 },
          { id: "div-1-3", titulo: "Datas importantes", duracaoMin: 9 },
        ],
      },
      {
        id: "div-2",
        titulo: "Análise de Pagadoras",
        aulas: [
          { id: "div-2-1", titulo: "Indicadores essenciais", duracaoMin: 14 },
          { id: "div-2-2", titulo: "Setores defensivos", duracaoMin: 12 },
          { id: "div-2-3", titulo: "Histórico de pagamentos", duracaoMin: 11 },
        ],
      },
      {
        id: "div-3",
        titulo: "Construindo a Carteira",
        aulas: [
          { id: "div-3-1", titulo: "Diversificação por setores", duracaoMin: 13 },
          { id: "div-3-2", titulo: "Estratégia de aportes", duracaoMin: 12 },
          { id: "div-3-3", titulo: "Reinvestimento de proventos", duracaoMin: 11 },
          { id: "div-3-4", titulo: "Rebalanceamento", duracaoMin: 10 },
        ],
      },
    ],
  },
  {
    id: "analise-fundamentalista",
    dbId: "a1c0b001-1111-4001-8001-000000000003",
    titulo: "Análise Fundamentalista Completa",
    descricao: "Aprenda a analisar empresas como um profissional e encontre as melhores oportunidades da bolsa.",
    imagem: "/cursos/analise-fundamentalista.jpg",
    categoria: "avancado",
    nivel: "avancado",
    preco: 397,
    duracaoHoras: 25,
    totalAulas: 18,
    alunos: 612,
    matriculado: false,
    aprendizado: [
      "Leia balanços, DRE e fluxo de caixa",
      "Domine os principais múltiplos (P/L, P/VP, ROE)",
      "Avalie empresas com DCF e modelos relativos",
      "Construa teses de investimento sólidas",
    ],
    modulos: [
      {
        id: "af-1",
        titulo: "Demonstrações Financeiras",
        aulas: [
          { id: "af-1-1", titulo: "Introdução à análise", duracaoMin: 10 },
          { id: "af-1-2", titulo: "Balanço patrimonial", duracaoMin: 16 },
          { id: "af-1-3", titulo: "DRE na prática", duracaoMin: 14 },
          { id: "af-1-4", titulo: "Fluxo de caixa", duracaoMin: 13 },
        ],
      },
      {
        id: "af-2",
        titulo: "Múltiplos e Indicadores",
        aulas: [
          { id: "af-2-1", titulo: "P/L, P/VP, EV/EBITDA", duracaoMin: 18 },
          { id: "af-2-2", titulo: "ROE, ROIC, ROA", duracaoMin: 15 },
          { id: "af-2-3", titulo: "Margens e endividamento", duracaoMin: 14 },
        ],
      },
      {
        id: "af-3",
        titulo: "Valuation",
        aulas: [
          { id: "af-3-1", titulo: "Fluxo de caixa descontado", duracaoMin: 22 },
          { id: "af-3-2", titulo: "Valuation por múltiplos", duracaoMin: 17 },
          { id: "af-3-3", titulo: "Margem de segurança", duracaoMin: 14 },
          { id: "af-3-4", titulo: "Construindo uma tese", duracaoMin: 19 },
        ],
      },
    ],
  },
];

export const CONTEUDO_GRATUITO: ConteudoGratuito[] = [
  { id: "beta", titulo: "Beta", tipo: "tutorial" },
  { id: "dividend-yield", titulo: "Dividend Yield", tipo: "tutorial" },
  { id: "analisando-relatorios", titulo: "Analisando Relatórios de Performance", tipo: "tutorial" },
  { id: "como-diversificar", titulo: "Como Diversificar Sua Carteira", tipo: "artigo", duracaoMin: 6 },
  { id: "como-rebalancear", titulo: "Como Rebalancear Sua Carteira", tipo: "tutorial" },
  { id: "acoes", titulo: "Ações", tipo: "tutorial" },
  { id: "diversificacao", titulo: "Diversificação", tipo: "video", duracaoMin: 8 },
  { id: "risco-retorno", titulo: "Entendendo Risco e Retorno", tipo: "video", duracaoMin: 10 },
  { id: "classes-ativos", titulo: "Classes de Ativos", tipo: "artigo", duracaoMin: 7 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getCurso(id: string): Curso | undefined {
  return CURSOS.find((c) => c.id === id);
}

export function getAula(cursoId: string, aulaId: string) {
  const curso = getCurso(cursoId);
  if (!curso) return null;
  for (const modulo of curso.modulos) {
    const idx = modulo.aulas.findIndex((a) => a.id === aulaId);
    if (idx >= 0) {
      return { curso, modulo, aula: modulo.aulas[idx], aulaIndex: idx };
    }
  }
  return null;
}

export function getProximaAula(cursoId: string, aulaId: string) {
  const curso = getCurso(cursoId);
  if (!curso) return null;
  const flat = curso.modulos.flatMap((m) =>
    m.aulas.map((a) => ({ moduloId: m.id, aulaId: a.id }))
  );
  const idx = flat.findIndex((x) => x.aulaId === aulaId);
  if (idx < 0 || idx >= flat.length - 1) return null;
  return flat[idx + 1];
}
