import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Cache 30 minutos
const cache = new Map();
const CACHE_TTL = 30 * 60 * 1000;

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) { cache.delete(key); return null; }
  return entry.data;
}
function setCache(key, data) {
  cache.set(key, { data, ts: Date.now() });
}

async function fetchBrapi(path, apiKey) {
  const sep = path.includes('?') ? '&' : '?';
  const url = `https://brapi.dev/api${path}${sep}token=${apiKey}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`Brapi ${res.status}: ${path}`);
  return res.json();
}

function r2(val) {
  if (val == null || !isFinite(val)) return null;
  return Math.round(val * 100) / 100;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { ticker, action } = body;
    if (!ticker) return Response.json({ error: 'Ticker required' }, { status: 400 });

    const t = ticker.toUpperCase().replace(/\.SA$/i, '').trim();
    const apiKey = Deno.env.get("BRAPI_API_KEY");
    const cacheKey = `${action}:${t}`;

    const cached = getCached(cacheKey);
    if (cached) return Response.json({ ...cached, _cached: true });

    // ─── PAYOUT CHART ───────────────────────────────────────────────────────────
    if (action === 'payout') {
      const mods = 'incomeStatementHistory,defaultKeyStatistics';
      const data = await fetchBrapi(`/quote/${t}?modules=${encodeURIComponent(mods)}&dividends=true`, apiKey);
      const raw = data.results?.[0];
      if (!raw) return Response.json({ error: 'Not found' }, { status: 404 });

      const income = raw.incomeStatementHistory || [];
      const dividendsRaw = raw.dividendsData?.cashDividends || [];
      const price = raw.regularMarketPrice;

      // Agrupar dividendos pagos por ano via cashDividends
      const divByYear = {};
      dividendsRaw.forEach(d => {
        if (!d.paymentDate) return;
        const y = new Date(d.paymentDate).getFullYear();
        divByYear[y] = (divByYear[y] || 0) + (d.rate || 0);
      });

      const rows = income
        .filter(item => item.endDate)
        .map(item => {
          const year = new Date(item.endDate).getFullYear();
          const netIncome = item.netIncome || item.netIncomeApplicableToCommonShares || null;
          const dividendsPaid = divByYear[year] || null;

          let payout = null;
          if (dividendsPaid && netIncome && netIncome > 0 && price) {
            const sharesApprox = raw.marketCap ? raw.marketCap / price : null;
            const totalDivPaid = sharesApprox ? dividendsPaid * sharesApprox : null;
            if (totalDivPaid) {
              payout = r2((totalDivPaid / netIncome) * 100);
              if (payout > 300 || payout < 0) payout = null;
            }
          }

          const dy = dividendsPaid && price ? r2((dividendsPaid / price) * 100) : null;

          return {
            year,
            netIncome,
            netIncomeB: netIncome ? r2(netIncome / 1e9) : null,
            payout,
            dy,
          };
        })
        .filter(r => r.netIncome != null)
        .sort((a, b) => a.year - b.year);

      const result = { rows, ticker: t };
      setCache(cacheKey, result);
      return Response.json(result);
    }

    // ─── DIVIDEND RADAR ──────────────────────────────────────────────────────────
    if (action === 'dividend_radar') {
      const data = await fetchBrapi(`/quote/${t}?dividends=true`, apiKey);
      const raw = data.results?.[0];
      if (!raw) return Response.json({ error: 'Not found' }, { status: 404 });

      const dividends = raw.dividendsData?.cashDividends || [];

      // Filtrar últimos 5 anos
      const fiveYearsAgo = new Date();
      fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
      const recent = dividends.filter(d => d.paymentDate && new Date(d.paymentDate) >= fiveYearsAgo);

      // Contar frequência por mês de pagamento
      const payMonthFreq = {};
      const exMonthFreq = {};
      recent.forEach(d => {
        if (d.paymentDate) {
          const m = new Date(d.paymentDate).getMonth(); // 0-11
          payMonthFreq[m] = (payMonthFreq[m] || 0) + 1;
        }
        const exDate = d.declaredDate || d.exDividendDate;
        if (exDate) {
          const m = new Date(exDate).getMonth();
          exMonthFreq[m] = (exMonthFreq[m] || 0) + 1;
        } else if (d.paymentDate) {
          // Estimar como ~30 dias antes do pagamento
          const approxEx = new Date(d.paymentDate);
          approxEx.setDate(approxEx.getDate() - 30);
          const m = approxEx.getMonth();
          exMonthFreq[m] = (exMonthFreq[m] || 0) + 1;
        }
      });

      // Limiar mínimo: 1 ocorrência nos últimos 5 anos
      const payMonths = Array.from({length: 12}, (_, i) => ({
        month: i,
        count: payMonthFreq[i] || 0,
        active: (payMonthFreq[i] || 0) >= 1,
      }));
      const exMonths = Array.from({length: 12}, (_, i) => ({
        month: i,
        count: exMonthFreq[i] || 0,
        active: (exMonthFreq[i] || 0) >= 1,
      }));

      const result = { payMonths, exMonths, totalDividends: recent.length, ticker: t };
      setCache(cacheKey, result);
      return Response.json(result);
    }

    // ─── SECTOR COMPARATOR ───────────────────────────────────────────────────────
    if (action === 'sector_compare') {
      const mods = 'summaryProfile,defaultKeyStatistics,financialData';
      const data = await fetchBrapi(`/quote/${t}?modules=${encodeURIComponent(mods)}`, apiKey);
      const raw = data.results?.[0];
      if (!raw) return Response.json({ error: 'Not found' }, { status: 404 });

      const sector = raw.summaryProfile?.sector || raw.sector || null;
      const mainStock = buildStockRow(t, raw);

      let peers = [];
      if (sector) {
        try {
          const listData = await fetchBrapi(`/quote/list?sector=${encodeURIComponent(sector)}&limit=15`, apiKey);
          const stocks = (listData.stocks || []).filter(s => s.stock && s.stock !== t).slice(0, 10);
          if (stocks.length > 0) {
            const peerTickers = stocks.map(s => s.stock).join(',');
            const peerMods = 'defaultKeyStatistics,financialData';
            const peerData = await fetchBrapi(`/quote/${peerTickers}?modules=${encodeURIComponent(peerMods)}`, apiKey);
            peers = (peerData.results || []).map(p => buildStockRow(p.symbol, p)).filter(p => p.marketCap);
            peers.sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0));
            peers = peers.slice(0, 8);
          }
        } catch (e) {
          // Sem comparação de setor disponível
        }
      }

      const result = { main: mainStock, peers, sector, ticker: t };
      setCache(cacheKey, result);
      return Response.json(result);
    }

    // ─── COMPANY INFO ────────────────────────────────────────────────────────────
    if (action === 'company_info') {
      const mods = 'summaryProfile,defaultKeyStatistics,financialData,balanceSheetHistory';
      const data = await fetchBrapi(`/quote/${t}?modules=${encodeURIComponent(mods)}`, apiKey);
      const raw = data.results?.[0];
      if (!raw) return Response.json({ error: 'Not found' }, { status: 404 });

      const sp = raw.summaryProfile || {};
      const ks = raw.defaultKeyStatistics || {};
      const fd = raw.financialData || {};
      const bs = raw.balanceSheetHistory?.[0] || {};

      const marketCap = raw.marketCap;
      const totalDebt = fd.totalDebt || ((bs.shortLongTermDebt || 0) + (bs.longTermDebt || 0));
      const cash = fd.totalCash || bs.cash;
      const ev = ks.enterpriseValue || (marketCap && totalDebt != null && cash != null ? marketCap + totalDebt - cash : null);
      const equity = bs.totalStockholderEquity || (ks.bookValue && ks.sharesOutstanding ? ks.bookValue * ks.sharesOutstanding : null);
      const netDebt = totalDebt != null && cash != null ? totalDebt - cash : null;
      const shares = ks.sharesOutstanding || ks.impliedSharesOutstanding;
      const floatShares = ks.floatShares;
      const freeFloat = shares && floatShares ? r2((floatShares / shares) * 100) : null;

      const result = {
        ticker: t,
        company_name: raw.longName || raw.shortName || t,
        logo_url: raw.logourl || null,
        sector: sp.sector || raw.sector || null,
        industry: sp.industry || raw.industry || null,
        website: sp.website || null,
        employees: sp.fullTimeEmployees || null,
        country: sp.country || null,
        city: sp.city || null,
        state: sp.state || null,
        listingSegment: raw.listingSegment || null,
        exchange: raw.exchangeShortName || raw.exchange || null,
        ipoYear: ks.lastSplitDate ? null : null, // BRAPI não expõe IPO year diretamente

        // Métricas financeiras
        marketCap,
        enterpriseValue: ev,
        shareholderEquity: equity,
        sharesOutstanding: shares,
        totalAssets: bs.totalAssets || ks.totalAssets || null,
        totalCurrentAssets: bs.totalCurrentAssets || null,
        totalDebt,
        netDebt,
        cash,
        freeFloat,
        tagAlong: raw.tagAlong || null,
        avgDailyVolume: raw.averageDailyVolume10Day || raw.regularMarketVolume || null,
      };
      setCache(cacheKey, result);
      return Response.json(result);
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function buildStockRow(ticker, raw) {
  const ks = raw.defaultKeyStatistics || {};
  const fd = raw.financialData || {};
  return {
    ticker: ticker || raw.symbol,
    company_name: raw.longName || raw.shortName || ticker,
    logo_url: raw.logourl || null,
    pe: r2(ks.trailingPE || raw.priceEarnings),
    pb: r2(ks.priceToBook || raw.priceToBook),
    roe: r2(fd.returnOnEquity != null ? fd.returnOnEquity * 100 : null),
    dy: r2(ks.dividendYield != null ? (ks.dividendYield < 1 ? ks.dividendYield * 100 : ks.dividendYield) : null),
    marketCap: raw.marketCap || null,
    netMargin: r2(fd.profitMargins != null ? fd.profitMargins * 100 : null),
  };
}