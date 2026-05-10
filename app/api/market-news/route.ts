import { NextResponse } from "next/server";

export interface MarketNewsItem {
  id: string;
  title: string;
  link: string;
  pubDate: string | null;
  category: string | null;
  thumb: string | null;
  /** Nome da publicação (ex: "Valor Econômico") quando vem do Google News. */
  source?: string | null;
}

// ─── Brand map: ticker radical → nomes da empresa pra busca ─────────────
//
// Necessário porque "PETR4" aparece em poucas matérias, mas "Petrobras"
// está em todas. A query do Google News é enriquecida com esses nomes,
// melhorando MUITO o recall e evitando falso negativo.
const BRAND_NAMES: Record<string, string[]> = {
  // Petróleo, Gás e Combustíveis
  PETR: ["Petrobras", "Petrobrás", "Petróleo Brasileiro"],
  PRIO: ["PRIO", "Petro Rio", "PetroRio"],
  RECV: ["Petroreconcavo", "PetroRecôncavo"],
  VBBR: ["Vibra Energia", "Vibra"],
  BRAV: ["Brava Energia", "3R Petroleum"],
  CSAN: ["Cosan"],
  UGPA: ["Ultrapar"],
  RAIZ: ["Raízen", "Raizen"],
  RPMG: ["Refinaria de Manguinhos"],

  // Bancos & Seguros
  ITUB: ["Itaú Unibanco", "Itaú", "Itau"],
  BBDC: ["Bradesco"],
  BBAS: ["Banco do Brasil"],
  SANB: ["Santander Brasil", "Santander"],
  BPAC: ["BTG Pactual", "BTG"],
  ITSA: ["Itaúsa", "Itausa"],
  BBSE: ["BB Seguridade"],
  PSSA: ["Porto Seguro", "Porto"],
  IRBR: ["IRB Brasil", "IRB"],
  CXSE: ["Caixa Seguridade"],
  B3SA: ["B3"],

  // Mineração & Siderurgia
  VALE: ["Vale"],
  CMIN: ["CSN Mineração"],
  GGBR: ["Gerdau"],
  GOAU: ["Metalúrgica Gerdau", "Gerdau Met"],
  CSNA: ["CSN", "Companhia Siderúrgica Nacional"],
  USIM: ["Usiminas"],

  // Energia Elétrica & Saneamento
  ELET: ["Eletrobras", "Eletrobrás"],
  ENGI: ["Energisa"],
  EQTL: ["Equatorial Energia", "Equatorial"],
  TAEE: ["Taesa"],
  ALUP: ["Alupar"],
  TRPL: ["Transmissão Paulista", "ISA Cteep"],
  CMIG: ["Cemig"],
  CPLE: ["Copel"],
  ENBR: ["EDP Brasil", "EDP"],
  AURE: ["Auren Energia", "Auren"],
  NEOE: ["Neoenergia"],
  EGIE: ["Engie Brasil"],
  SBSP: ["Sabesp"],
  SAPR: ["Sanepar"],
  CSMG: ["Copasa"],
  AMBP: ["Ambipar"],

  // Telecom & Serviços
  VIVT: ["Vivo", "Telefônica Brasil"],
  TIMS: ["TIM Brasil", "TIM"],
  OIBR: ["Oi"],

  // Varejo
  MGLU: ["Magalu", "Magazine Luiza"],
  AMER: ["Americanas"],
  LREN: ["Lojas Renner", "Renner"],
  ASAI: ["Assaí", "Assai Atacadista"],
  PCAR: ["Pão de Açúcar", "GPA"],
  RADL: ["Raia Drogasil", "Drogasil", "Droga Raia"],
  ARZZ: ["Arezzo"],
  GUAR: ["Guararapes", "Riachuelo"],
  CEAB: ["C&A"],
  GRND: ["Grendene"],
  VULC: ["Vulcabras"],
  PETZ: ["Petz"],

  // Construção & Imobiliário
  MRVE: ["MRV"],
  CYRE: ["Cyrela"],
  DIRR: ["Direcional Engenharia", "Direcional"],
  EZTC: ["EZ Tec", "EZTec"],
  EVEN: ["Even"],
  TEND: ["Tenda"],
  JHSF: ["JHSF"],
  TRIS: ["Trisul"],
  MULT: ["Multiplan"],
  BRML: ["BR Malls"],
  IGTI: ["Iguatemi"],
  DXCO: ["Dexco"],

  // Bebidas & Alimentos
  ABEV: ["Ambev"],
  JBSS: ["JBS"],
  BRFS: ["BRF", "Sadia", "Perdigão"],
  MRFG: ["Marfrig"],
  BEEF: ["Minerva Foods", "Minerva"],
  MDIA: ["M. Dias Branco", "Mdias Branco"],
  CAML: ["Camil"],
  SMTO: ["São Martinho"],
  SLCE: ["SLC Agrícola"],

  // Saúde
  RDOR: ["Rede D'Or", "Rede Dor"],
  HAPV: ["Hapvida"],
  FLRY: ["Fleury"],
  DASA: ["Dasa", "Diagnósticos da América"],
  ONCO: ["Oncoclínicas"],
  HYPE: ["Hypera Pharma", "Hypera"],
  BLAU: ["Blau Farmacêutica"],
  QUAL: ["Qualicorp"],

  // Tecnologia
  TOTS: ["Totvs"],
  POSI: ["Positivo Tecnologia", "Positivo"],
  LWSA: ["Locaweb"],

  // Papel & Celulose
  SUZB: ["Suzano"],
  KLBN: ["Klabin"],
  IRANI: ["Irani"],

  // Transporte
  AZUL: ["Azul Linhas Aéreas", "Azul"],
  GOLL: ["GOL Linhas Aéreas", "GOL"],
  RAIL: ["Rumo Logística", "Rumo"],
  STBP: ["Santos Brasil"],
  CCRO: ["CCR"],
  ECOR: ["Ecorodovias"],
  PORT: ["Wilson Sons"],

  // Aeronáutica
  EMBR: ["Embraer"],

  // Educação
  YDUQ: ["Yduqs"],
  COGN: ["Cogna Educação", "Cogna"],
  SEER: ["Ser Educacional"],
  ANIM: ["Ânima Educação", "Anima"],

  // Química
  BRKM: ["Braskem"],
  UNIP: ["Unipar"],

  // Industriais
  WEGE: ["WEG"],
  RANI: ["Irani Papel"],
};

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'");
}

function unwrapCdata(s: string): string {
  const m = s.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
  return decode((m ? m[1] : s).trim());
}

function extractTag(item: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const m = item.match(re);
  return m ? unwrapCdata(m[1]) : null;
}

function extractFirstImg(html: string | null): string | null {
  if (!html) return null;
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : null;
}

/** Termos de busca pra um ticker: ticker + radical + nomes de marca conhecidos. */
function searchTermsFor(ticker: string): string[] {
  const radical = ticker.replace(/\d+$/, "");
  const brands = BRAND_NAMES[radical] ?? [];
  const set = new Set<string>([ticker]);
  if (radical && radical !== ticker) set.add(radical);
  for (const b of brands) set.add(b);
  return Array.from(set);
}

/**
 * Busca notícias específicas do ticker via Google News RSS.
 * Retorna até 30 itens. Vazio em caso de erro/zero matches.
 */
async function fetchTickerNews(ticker: string): Promise<MarketNewsItem[]> {
  const terms = searchTermsFor(ticker);
  if (terms.length === 0) return [];

  // Google News aceita aspas duplas pra match exato + OR pra disjunção.
  const query = terms.map((t) => `"${t}"`).join(" OR ");
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 600 },
      headers: { "User-Agent": "Mozilla/5.0 AurumNewsBot" },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const items: MarketNewsItem[] = [];
    const itemRe = /<item>([\s\S]*?)<\/item>/g;
    let match: RegExpExecArray | null;
    while ((match = itemRe.exec(xml)) !== null && items.length < 30) {
      const block = match[1];
      const title = extractTag(block, "title");
      const link = extractTag(block, "link");
      const pubDate = extractTag(block, "pubDate");
      const source = extractTag(block, "source");
      const description = extractTag(block, "description");
      const thumb = extractFirstImg(description);
      if (title && link) {
        items.push({
          id: link,
          title,
          link,
          pubDate,
          category: source,
          source,
          thumb,
        });
      }
    }
    return items;
  } catch {
    return [];
  }
}

/** Feed geral InfoMoney — usado quando nenhum ticker é fornecido. */
async function fetchInfoMoney(): Promise<MarketNewsItem[]> {
  try {
    const res = await fetch("https://www.infomoney.com.br/feed/", {
      next: { revalidate: 600 },
      headers: { "User-Agent": "Mozilla/5.0 AurumNewsBot" },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const items: MarketNewsItem[] = [];
    const itemRe = /<item>([\s\S]*?)<\/item>/g;
    let match: RegExpExecArray | null;
    while ((match = itemRe.exec(xml)) !== null && items.length < 12) {
      const block = match[1];
      const title = extractTag(block, "title");
      const link = extractTag(block, "link");
      const pubDate = extractTag(block, "pubDate");
      const category = extractTag(block, "category");
      const description = extractTag(block, "description");
      const thumb = extractFirstImg(description);
      if (title && link) {
        items.push({
          id: link,
          title,
          link,
          pubDate,
          category,
          source: "InfoMoney",
          thumb,
        });
      }
    }
    return items;
  } catch {
    return [];
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ticker = (searchParams.get("ticker") ?? "").trim().toUpperCase();

  if (ticker) {
    const items = await fetchTickerNews(ticker);
    // Se vazio, retorna vazio mesmo — frontend mostra empty state explicando.
    // Antes caía em fallback genérico que mostrava notícias irrelevantes
    // (Mega-Sena, política, etc.) na página da ação.
    return NextResponse.json({ items: items.slice(0, 12) }, { status: 200 });
  }

  // Sem ticker = feed geral
  const items = await fetchInfoMoney();
  return NextResponse.json({ items: items.slice(0, 8) }, { status: 200 });
}
