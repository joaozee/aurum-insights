/**
 * Mapa curado de concorrentes por indústria (PT — campo
 * `summaryProfile.industry` da brapi).
 *
 * Por que curado e não 100% via API:
 * - brapi `/quote/list?sector=...` só aceita filtro por setor amplo
 *   ("Energy Minerals" mistura petróleo + mineração).
 * - Para uma comparação útil, queremos peers da MESMA indústria
 *   (ex: PETR4 com PRIO3/RECV3, não com VALE3).
 * - Fallback via setor existe em /api/peers para indústrias não mapeadas.
 *
 * Adicionar uma indústria nova: incluir uma chave aqui com a lista
 * ordenada por relevância de mercado (top primeiro).
 */
export const PEERS_BY_INDUSTRY: Record<string, string[]> = {
  // ─── Petróleo, Gás e Combustíveis ──────────────────────────────────────
  "Petróleo e Gás Integrado":
    ["PETR4", "PETR3", "PRIO3", "RECV3", "VBBR3", "BRAV3", "CSAN3", "UGPA3", "RAIZ4"],
  "Petróleo e Gás - Exploração e Produção":
    ["PRIO3", "RECV3", "BRAV3", "PETR4", "PETR3"],
  "Petróleo e Gás - Refino e Comercialização":
    ["VBBR3", "UGPA3", "RAIZ4", "PETR4", "RPMG3"],
  "Petróleo e Gás - Transporte":
    ["UGPA3", "VBBR3", "PETR4"],

  // ─── Bancos & Serviços Financeiros ─────────────────────────────────────
  "Bancos Diversificados":
    ["ITUB4", "BBDC4", "BBAS3", "SANB11", "BPAC11", "ITSA4"],
  "Bancos":
    ["ITUB4", "BBDC4", "BBAS3", "SANB11", "BPAC11"],
  "Bancos Regionais - América Latina":
    ["BPAC11", "BMEB4", "BAZA3"],
  "Seguradoras":
    ["BBSE3", "PSSA3", "CXSE3", "IRBR3"],
  "Crédito ao Consumidor":
    ["BPAC11", "PINE4"],
  "Bolsa de Valores":
    ["B3SA3"],

  // ─── Mineração & Siderurgia ────────────────────────────────────────────
  "Mineração":
    ["VALE3", "CMIN3"],
  "Mineração de Ferro":
    ["VALE3", "CMIN3"],
  "Mineração - Outros":
    ["CMIN3", "VALE3"],
  "Siderurgia e Metalurgia":
    ["GGBR4", "GOAU4", "CSNA3", "USIM5"],
  "Siderurgia":
    ["GGBR4", "GOAU4", "CSNA3", "USIM5"],
  "Metalurgia":
    ["GGBR4", "GOAU4", "USIM5"],

  // ─── Energia Elétrica & Saneamento ─────────────────────────────────────
  "Energia Elétrica":
    ["ELET3", "ELET6", "ENGI11", "EQTL3", "TAEE11", "CMIG4", "CPLE6", "ENBR3", "AURE3", "NEOE3"],
  "Geração de Energia":
    ["ELET3", "ELET6", "ENGI11", "AURE3", "EGIE3"],
  "Distribuição de Energia":
    ["EQTL3", "CMIG4", "CPLE6", "ENBR3", "NEOE3"],
  "Transmissão de Energia":
    ["TAEE11", "ALUP11", "TRPL4"],
  "Saneamento":
    ["SBSP3", "SAPR11", "CSMG3", "AMBP3"],

  // ─── Telecomunicações ──────────────────────────────────────────────────
  "Telecomunicações":
    ["VIVT3", "TIMS3", "OIBR3"],
  "Serviços Integrados de Telecomunicações":
    ["VIVT3", "TIMS3", "OIBR3"],

  // ─── Varejo ────────────────────────────────────────────────────────────
  "Varejo - Comércio Eletrônico":
    ["MGLU3", "AMER3", "MELI", "PETZ3"],
  "Varejo - Vestuário e Calçados":
    ["LREN3", "AMAR3", "GUAR3", "CEAB3", "ARZZ3", "VULC3"],
  "Varejo - Lojas de Departamento e Outros":
    ["MGLU3", "LREN3", "AMER3", "VVAR3"],
  "Atacado e Varejo - Alimentos":
    ["ASAI3", "PCAR3", "GMAT3"],
  "Varejo - Drogarias":
    ["RADL3", "PGMN3"],
  "Varejo - Móveis e Decoração":
    ["MGLU3", "VVAR3"],

  // ─── Construção & Imobiliário ──────────────────────────────────────────
  "Construção Civil":
    ["MRVE3", "CYRE3", "DIRR3", "EZTC3", "EVEN3", "TEND3", "JHSF3", "TRIS3"],
  "Imóveis Residenciais":
    ["MRVE3", "CYRE3", "DIRR3", "EZTC3", "TEND3"],
  "Imóveis Comerciais":
    ["MULT3", "BRML3", "IGTI11", "JHSF3"],
  "Construção e Engenharia":
    ["MRVE3", "CYRE3", "DIRR3", "EZTC3"],
  "Materiais de Construção":
    ["DXCO3", "ETER3"],

  // ─── Bebidas & Alimentos ───────────────────────────────────────────────
  "Bebidas":
    ["ABEV3"],
  "Cervejas e Bebidas":
    ["ABEV3"],
  "Alimentos Diversos":
    ["JBSS3", "BRFS3", "MRFG3", "BEEF3", "MDIA3", "CAML3"],
  "Frigoríficos":
    ["JBSS3", "BRFS3", "MRFG3", "BEEF3"],
  "Açúcar e Álcool":
    ["RAIZ4", "SMTO3"],
  "Agronegócio":
    ["SLCE3", "TTEN3", "AGRO3", "BOAS3"],

  // ─── Saúde ─────────────────────────────────────────────────────────────
  "Hospitais e Análises Clínicas":
    ["RDOR3", "HAPV3", "FLRY3", "DASA3", "ONCO3"],
  "Medicamentos e Outros Produtos":
    ["HYPE3", "RADL3", "BLAU3"],
  "Equipamentos Médicos":
    ["BIOM3"],
  "Planos de Saúde":
    ["HAPV3", "QUAL3", "GNDI3"],

  // ─── Tecnologia ────────────────────────────────────────────────────────
  "Software e Serviços":
    ["TOTS3", "POSI3", "LWSA3"],
  "Programas e Serviços":
    ["TOTS3", "POSI3", "LWSA3"],
  "Hardware":
    ["POSI3", "PADL3"],

  // ─── Papel & Celulose ──────────────────────────────────────────────────
  "Papel e Celulose":
    ["SUZB3", "KLBN11", "KLBN4", "IRANI3"],

  // ─── Transporte ────────────────────────────────────────────────────────
  "Transporte Aéreo":
    ["AZUL4", "GOLL4"],
  "Transporte Rodoviário":
    ["RAIL3", "STBP3", "CCRO3", "ECOR3"],
  "Transporte Ferroviário":
    ["RAIL3"],
  "Logística e Distribuição":
    ["RAIL3", "PORT3", "STBP3"],
  "Concessões Rodoviárias":
    ["CCRO3", "ECOR3", "RAIL3"],

  // ─── Indústria Aeronáutica ─────────────────────────────────────────────
  "Aeronaves e Aeropartes":
    ["EMBR3"],

  // ─── Educação ──────────────────────────────────────────────────────────
  "Educação":
    ["YDUQ3", "COGN3", "SEER3", "ANIM3"],

  // ─── Química ───────────────────────────────────────────────────────────
  "Química Diversos":
    ["BRKM5", "UNIP6"],
  "Petroquímicos":
    ["BRKM5", "UNIP6"],

  // ─── Holdings ──────────────────────────────────────────────────────────
  "Holdings Diversificadas":
    ["ITSA4", "SIMH3"],
  "Holding":
    ["ITSA4"],

  // ─── Calçados & Vestuário ──────────────────────────────────────────────
  "Calçados":
    ["GRND3", "VULC3", "ARZZ3"],
  "Tecidos, Vestuário e Calçados":
    ["LREN3", "GUAR3", "CEAB3", "ARZZ3"],
};

/**
 * Tradução de setor PT (`summaryProfile.sector`) → EN (filtro de
 * `/api/quote/list?sector=...`). Só usado no fallback genérico.
 */
export const SECTOR_PT_TO_EN: Record<string, string> = {
  "Energia": "Energy Minerals",
  "Serviços Financeiros": "Finance",
  "Saúde": "Health Services",
  "Materiais Básicos": "Non-Energy Minerals",
  "Bens de Consumo Cíclico": "Consumer Durables",
  "Bens de Consumo Não Cíclico": "Consumer Non-Durables",
  "Bens de Consumo": "Consumer Durables",
  "Tecnologia": "Technology Services",
  "Utilidade Pública": "Utilities",
  "Utilidades Públicas": "Utilities",
  "Industriais": "Producer Manufacturing",
  "Indústria": "Producer Manufacturing",
  "Bens Industriais": "Producer Manufacturing",
  "Comunicações": "Communications",
  "Serviços de Comunicação": "Communications",
  "Varejo": "Retail Trade",
  "Consumo Cíclico": "Consumer Durables",
  "Consumo Não Cíclico": "Consumer Non-Durables",
};

/**
 * Retorna a lista de concorrentes para uma indústria (PT). Tenta match
 * exato primeiro, depois match parcial (substring) — útil quando a brapi
 * usa variações como "Bancos" vs "Bancos Diversificados".
 */
export function findCuratedPeers(industry: string | null | undefined): string[] | null {
  if (!industry) return null;
  const trimmed = industry.trim();
  if (!trimmed) return null;

  // Match exato
  if (PEERS_BY_INDUSTRY[trimmed]) return PEERS_BY_INDUSTRY[trimmed]!;

  // Match por substring (mais conservador: só prefixo)
  const lower = trimmed.toLowerCase();
  for (const key of Object.keys(PEERS_BY_INDUSTRY)) {
    const kl = key.toLowerCase();
    if (lower.startsWith(kl) || kl.startsWith(lower)) {
      return PEERS_BY_INDUSTRY[key]!;
    }
  }
  return null;
}
