import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const BASE = "https://brapi.dev/api";
const TOKEN = Deno.env.get("BRAPI_API_KEY") || "";

// Available fields on free plan: priceEarnings, earningsPerShare, marketCap, regularMarketPrice, regularMarketChangePercent

const IBOV_STOCKS = [
  "PETR4","VALE3","ITUB4","BBDC4","BBAS3","WEGE3","RENT3","RDOR3",
  "ABEV3","ELET3","SUZB3","GGBR4","JBSS3","VIVT3","LREN3","PRIO3",
  "RADL3","EQTL3","CSAN3","BRFS3","BPAC11","CCRO3","EMBR3","ENEV3",
  "ENGI11","FLRY3","HAPV3","HYPE3","KLBN11","SANB11","SBSP3","TAEE11",
  "TIMS3","TOTS3","UGPA3","USIM5","VBBR3","YDUQ3","MRFG3","RAIL3"
];

const FII_TICKERS = [
  "MXRF11","HGLG11","XPML11","BTLG11","KNRI11","IRDM11","BCFF11",
  "HSML11","VISC11","HGRU11","XPLG11","CPTS11","JSRE11","DEVA11",
  "PVBI11","MALL11","BRCO11","TRXF11","RCRB11","KNCR11","HGCR11",
  "LVBI11","RBRF11","RBVA11","RECT11","BBPO11","GTWR11","VINO11"
];

const clean = v => (v != null && !isNaN(Number(v)) && isFinite(Number(v))) ? Number(v) : null;

async function fetchChunk(tickers) {
  if (!tickers.length) return [];
  const url = `${BASE}/quote/${tickers.join(",")}?token=${TOKEN}&fundamental=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`brapi HTTP ${res.status}`);
  const data = await res.json();
  return data?.results || [];
}

Deno.serve(async (req) => {
  const timestamp = new Date().toISOString();
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const tab = body?.tab || "stocks";
    const isFii = tab === "fiis";
    const tickers = isFii ? FII_TICKERS : IBOV_STOCKS;

    let fetchError = null;
    let allDetail = [];

    try {
      const [c1, c2] = await Promise.all([
        fetchChunk(tickers.slice(0, 20)),
        fetchChunk(tickers.slice(20, 40)),
      ]);
      allDetail = [...c1, ...c2];
    } catch (e) {
      fetchError = e.message;
    }

    const mapped = allDetail.map(s => ({
      ticker:  s.symbol || "",
      name:    s.shortName || s.longName || s.symbol || "",
      logoUrl: s.logourl || `https://icons.brapi.dev/icons/${s.symbol}.svg`,
      pl:      clean(s.priceEarnings),
      eps:     clean(s.earningsPerShare),
      mktcap:  clean(s.marketCap),
      price:   clean(s.regularMarketPrice),
      change:  clean(s.regularMarketChangePercent),
    }));

    const top = (key, asc, n = 5) =>
      [...mapped]
        .filter(s => s[key] != null && s[key] > 0)
        .sort((a, b) => asc ? a[key] - b[key] : b[key] - a[key])
        .slice(0, n);

    // Ranking 1: Melhores P/L (menor = melhor, exclui P/L negativos e > 50 para filtrar distorções)
    const plList = [...mapped]
      .filter(s => s.pl != null && s.pl > 0 && s.pl < 50)
      .sort((a, b) => a.pl - b.pl)
      .slice(0, 5);

    // Ranking 2: Maior Market Cap
    const mktcapList = top("mktcap", false);

    // Ranking 3: Maior EPS (Lucro por Ação)
    const epsList = top("eps", false);

    const inPL     = new Set(plList.map(s => s.ticker));
    const inMktcap = new Set(mktcapList.map(s => s.ticker));
    const inEps    = new Set(epsList.map(s => s.ticker));

    const discardedPL     = mapped.filter(s => !inPL.has(s.ticker)).map(s => ({ ticker: s.ticker, reason: `priceEarnings: ${s.pl ?? "null"}` }));
    const discardedMktcap = mapped.filter(s => !inMktcap.has(s.ticker)).map(s => ({ ticker: s.ticker, reason: `marketCap: ${s.mktcap ?? "null"}` }));
    const discardedEps    = mapped.filter(s => !inEps.has(s.ticker)).map(s => ({ ticker: s.ticker, reason: `earningsPerShare: ${s.eps ?? "null"}` }));

    return Response.json({
      // keys: pl = Melhores P/L, pvp = Market Cap, dy = EPS (reusing keys for frontend compat)
      pl:  plList,
      pvp: mktcapList,
      dy:  epsList,
      meta: {
        timestamp,
        sourceStatus: fetchError ? `Erro: ${fetchError}` : "OK",
        totalFetched: allDetail.length,
        totalRequested: tickers.length,
        rankings: {
          pl:  { valid: plList.length,     discarded: discardedPL.slice(0, 20)     },
          pvp: { valid: mktcapList.length, discarded: discardedMktcap.slice(0, 20) },
          dy:  { valid: epsList.length,    discarded: discardedEps.slice(0, 20)    },
        }
      }
    });

  } catch (error) {
    console.error("Error:", error.message);
    return Response.json({
      error: error.message,
      meta: { timestamp, sourceStatus: `Erro: ${error.message}`, totalFetched: 0, totalRequested: 0 }
    }, { status: 500 });
  }
});