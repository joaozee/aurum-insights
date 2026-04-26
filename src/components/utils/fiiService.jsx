import { base44 } from "@/api/base44Client";

// ══════════════════════════════════════════════════════════
// IDENTIFICAÇÃO
// ══════════════════════════════════════════════════════════

/**
 * Verifica se o símbolo é um FII (termina com "11")
 */
export function isFII(symbol) {
  if (!symbol || typeof symbol !== 'string') return false;
  return symbol.trim().toUpperCase().endsWith('11');
}

// ══════════════════════════════════════════════════════════
// FORMATAÇÃO
// ══════════════════════════════════════════════════════════

/**
 * Formata valores de FII por tipo
 */
export function formatFII(value, type) {
  if (value == null || value === 'N/A') return 'N/A';
  switch (type) {
    case 'currency':
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value);
    case 'percent':
      return `${Number(value).toFixed(2)}%`;
    case 'number':
      return new Intl.NumberFormat('pt-BR').format(value);
    case 'large': {
      const n = Number(value);
      if (n >= 1_000_000_000) return `R$ ${(n / 1_000_000_000).toFixed(2)} Bi`;
      if (n >= 1_000_000) return `R$ ${(n / 1_000_000).toFixed(2)} Mi`;
      if (n >= 1_000) return `R$ ${(n / 1_000).toFixed(2)} Mi`;
      return formatFII(value, 'currency');
    }
    default:
      return String(value);
  }
}

// ══════════════════════════════════════════════════════════
// NORMALIZAÇÃO
// ══════════════════════════════════════════════════════════

/**
 * Normaliza valores patrimoniais de FII (ajusta escala se necessário)
 */
export function normalizeFIIValue(value) {
  if (value == null || !isFinite(Number(value))) return null;
  return Number(value);
}

// ══════════════════════════════════════════════════════════
// CACHE LOCAL (frontend)
// ══════════════════════════════════════════════════════════
const _cache = new Map();
const CACHE_TTL = 0; // sem cache para garantir dados frescos

function getCache(key) {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) { _cache.delete(key); return null; }
  return entry.data;
}
function saveCache(key, data) {
  _cache.set(key, { data, ts: Date.now() });
}

// ══════════════════════════════════════════════════════════
// FETCH PRINCIPAL
// ══════════════════════════════════════════════════════════

/**
 * Busca dados completos de um FII via backend function
 */
export async function getFIIData(symbol, options = {}) {
  const sym = symbol.toUpperCase().replace(/\.SA$/i, '').trim();

  if (!isFII(sym)) {
    throw new Error(`${sym} não é um FII. FIIs terminam com "11".`);
  }

  const { includeHistory = true, initialValue = 10000 } = options;
  const cacheKey = `fii:${sym}:${includeHistory}`;

  const cached = getCache(cacheKey);
  if (cached) return cached;

  const res = await base44.functions.invoke('getFIIData', {
    action: 'full',
    symbol: sym,
    initialValue,
    includeHistory,
  });

  const data = res?.data;
  if (!data || data.error) throw new Error(data?.error || 'Erro ao buscar dados do FII');

  saveCache(cacheKey, data);
  return data;
}

// ══════════════════════════════════════════════════════════
// COMPARAÇÃO
// ══════════════════════════════════════════════════════════

/**
 * Compara múltiplos FIIs
 * @param {string[]} symbols - Lista de tickers
 */
export async function compareFIIs(symbols) {
  if (!symbols?.length) return [];

  const validSymbols = symbols.map(s => s.toUpperCase().trim()).filter(isFII);
  if (!validSymbols.length) throw new Error('Nenhum símbolo válido de FII');

  const res = await base44.functions.invoke('getFIIData', {
    action: 'compare',
    symbols: validSymbols,
  });

  return res?.data?.comparison || [];
}

// ══════════════════════════════════════════════════════════
// INDICADORES
// ══════════════════════════════════════════════════════════

/**
 * Calcula indicadores de FII no frontend (para dados já carregados)
 */
export function calculateFIIIndicators(data) {
  const { current_price, cotas_emitidas, valor_patrimonial, valor_patrimonial_cota, dividends = [] } = data;

  const vpc = valor_patrimonial_cota ||
    (valor_patrimonial && cotas_emitidas ? valor_patrimonial / cotas_emitidas : null);

  const now = new Date();
  const d12ago = new Date(now); d12ago.setFullYear(d12ago.getFullYear() - 1);
  const divs12m = dividends.filter(d => new Date(d.paymentDate || d.date) >= d12ago);
  const total12m = divs12m.reduce((s, d) => s + (d.rate || 0), 0);

  return {
    dy_12m: current_price && total12m ? +((total12m / current_price) * 100).toFixed(2) : null,
    pvp: current_price && vpc ? +(current_price / vpc).toFixed(2) : null,
    market_cap: current_price && cotas_emitidas ? current_price * cotas_emitidas : null,
    liquidez_diaria: data.volume && current_price ? data.volume * current_price : null,
    vpc: vpc ? +vpc.toFixed(2) : null,
  };
}

// ══════════════════════════════════════════════════════════
// LABELS / TRADUÇÕES
// ══════════════════════════════════════════════════════════

export const FII_LABELS = {
  tipo_fundo: {
    tijolo: 'Tijolo',
    papel: 'Papel',
    hibrido: 'Híbrido',
    fundo_de_fundos: 'Fundo de Fundos',
  },
  segmento: {
    lajes_corporativas: 'Lajes Corporativas',
    shoppings: 'Shoppings',
    logistica: 'Logística',
    residencial: 'Residencial',
    agro: 'Agro',
    papel: 'Papel / CRI',
    hibrido: 'Híbrido',
    outros: 'Outros',
  },
  mandato: {
    renda: 'Renda',
    ganho_capital: 'Ganho de Capital',
    hibrido: 'Híbrido',
    desenvolvimento: 'Desenvolvimento',
  },
};