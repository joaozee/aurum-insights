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
    duracaoHoras: 20,
    totalAulas: 12,
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
      "Aprenda a investir de forma segura e rentável",
      "Domine análise fundamentalista e técnica",
      "Monte sua primeira carteira de investimentos",
      "Entenda renda fixa, ações e FIIs",
    ],
    modulos: [
      {
        id: "modulo-1",
        titulo: "Fundamentos do Mercado Financeiro",
        aulas: [
          { id: "1-1", titulo: "Bem-vindo ao curso", duracaoMin: 5, descricao: "Apresentação geral do curso, do método e do que você vai construir até o final." },
          { id: "1-2", titulo: "Como funciona o mercado financeiro", duracaoMin: 10 },
          { id: "1-3", titulo: "Tipos de investimentos", duracaoMin: 12 },
          { id: "1-4", titulo: "Perfil de investidor", duracaoMin: 8 },
        ],
      },
      {
        id: "modulo-2",
        titulo: "Renda Fixa",
        aulas: [
          { id: "2-1", titulo: "O que é renda fixa", duracaoMin: 9 },
          { id: "2-2", titulo: "Tesouro Direto na prática", duracaoMin: 14 },
          { id: "2-3", titulo: "CDB, LCI e LCA", duracaoMin: 11 },
          { id: "2-4", titulo: "Como montar uma reserva de emergência", duracaoMin: 10 },
        ],
      },
      {
        id: "modulo-3",
        titulo: "Renda Variável",
        aulas: [
          { id: "3-1", titulo: "Introdução à renda variável", duracaoMin: 9 },
          { id: "3-2", titulo: "Comprando sua primeira ação", duracaoMin: 13 },
          { id: "3-3", titulo: "Fundos imobiliários (FIIs)", duracaoMin: 12 },
          { id: "3-4", titulo: "Estratégias de longo prazo", duracaoMin: 14 },
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
