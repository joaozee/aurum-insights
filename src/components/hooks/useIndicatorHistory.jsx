import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { calculateAverage } from '@/components/lib/indicatorUtils';

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos
const cache = new Map();

// Metadados de cada indicador: label, categoria, formato
export const INDICATOR_META = {
  // Valuation
  pe_ratio:         { label: 'P/L',              category: 'valuation',      isPercentage: false, isCurrency: false },
  pb_ratio:         { label: 'P/VP',             category: 'valuation',      isPercentage: false, isCurrency: false },
  dividend_yield:   { label: 'Dividend Yield',   category: 'valuation',      isPercentage: true,  isCurrency: false },
  payout:           { label: 'Payout',           category: 'valuation',      isPercentage: true,  isCurrency: false },
  peg_ratio:        { label: 'PEG Ratio',        category: 'valuation',      isPercentage: false, isCurrency: false },
  ev_ebitda:        { label: 'EV/EBITDA',        category: 'valuation',      isPercentage: false, isCurrency: false },
  ev_ebit:          { label: 'EV/EBIT',          category: 'valuation',      isPercentage: false, isCurrency: false },
  p_ebitda:         { label: 'P/EBITDA',         category: 'valuation',      isPercentage: false, isCurrency: false },
  p_ebit:           { label: 'P/EBIT',           category: 'valuation',      isPercentage: false, isCurrency: false },
  p_sr:             { label: 'P/SR (PSR)',        category: 'valuation',      isPercentage: false, isCurrency: false },
  lpa:              { label: 'LPA',              category: 'valuation',      isPercentage: false, isCurrency: false },
  vpa:              { label: 'VPA',              category: 'valuation',      isPercentage: false, isCurrency: false },
  // Endividamento
  net_debt_to_equity:  { label: 'Dív. Líq. / PL',  category: 'debt',        isPercentage: false, isCurrency: false },
  net_debt_to_ebitda:  { label: 'Dív. Líq. / EBITDA', category: 'debt',     isPercentage: false, isCurrency: false },
  net_debt_to_ebit:    { label: 'Dív. Líq. / EBIT',   category: 'debt',     isPercentage: false, isCurrency: false },
  liabilities_to_assets: { label: 'Passivo / Ativo', category: 'debt',      isPercentage: false, isCurrency: false },
  current_ratio:    { label: 'Liquidez Corrente', category: 'debt',          isPercentage: false, isCurrency: false },
  // Eficiência
  gross_margin:     { label: 'Margem Bruta',     category: 'efficiency',     isPercentage: true,  isCurrency: false },
  ebitda_margin:    { label: 'Margem EBITDA',    category: 'efficiency',     isPercentage: true,  isCurrency: false },
  ebit_margin:      { label: 'Margem EBIT',      category: 'efficiency',     isPercentage: true,  isCurrency: false },
  operating_margin: { label: 'Margem Operacional', category: 'efficiency',   isPercentage: true,  isCurrency: false },
  net_margin:       { label: 'Margem Líquida',   category: 'efficiency',     isPercentage: true,  isCurrency: false },
  // Rentabilidade
  roe:              { label: 'ROE',              category: 'profitability',  isPercentage: true,  isCurrency: false },
  roa:              { label: 'ROA',              category: 'profitability',  isPercentage: true,  isCurrency: false },
  roic:             { label: 'ROIC',             category: 'profitability',  isPercentage: true,  isCurrency: false },
  // Crescimento
  cagr_revenue:     { label: 'CAGR Receita 5a',  category: 'growth',         isPercentage: true,  isCurrency: false },
  cagr_net_income:  { label: 'CAGR Lucro 5a',    category: 'growth',         isPercentage: true,  isCurrency: false },
  // Dados brutos (valores chegam em milhões do backend)
  revenue:          { label: 'Receita Líquida',  category: 'raw',            isPercentage: false, isCurrency: false, isMillions: true },
  ebitda:           { label: 'EBITDA',           category: 'raw',            isPercentage: false, isCurrency: false, isMillions: true },
  net_income:       { label: 'Lucro Líquido',    category: 'raw',            isPercentage: false, isCurrency: false, isMillions: true },
  free_cashflow:    { label: 'Free Cash Flow',   category: 'raw',            isPercentage: false, isCurrency: false, isMillions: true },
  net_debt:         { label: 'Dívida Líquida',   category: 'debt',           isPercentage: false, isCurrency: false, isMillions: true },
  eps:              { label: 'EPS (R$)',          category: 'raw',            isPercentage: false, isCurrency: false },
};

export const ALL_INDICATOR_KEYS = Object.keys(INDICATOR_META);

export const useIndicatorHistory = (ticker) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [allIndicators, setAllIndicators] = useState({});
  const cacheRef = useRef(cache);

  const getFromCache = (t) => {
    const cached = cacheRef.current.get(t);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) return cached.data;
    cacheRef.current.delete(t);
    return null;
  };

  const saveToCache = (t, data) => {
    cacheRef.current.set(t, { data, timestamp: Date.now() });
  };

  useEffect(() => {
    if (!ticker) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const cached = getFromCache(ticker);
        if (cached) {
          setAllIndicators(cached);
          return;
        }

        const response = await base44.functions.invoke('getIndicatorHistory', { ticker });
        const indicators = response.data?.indicators || [];

        if (!indicators.length) {
          setError('Nenhum dado histórico disponível para este ticker');
          return;
        }

        const mappedData = {};
        ALL_INDICATOR_KEYS.forEach((key) => {
          mappedData[key] = indicators
            .map((ind) => ({ year: String(ind.year), value: ind[key] ?? null }))
            .filter((item) => item.value !== null);
        });

        saveToCache(ticker, mappedData);
        setAllIndicators(mappedData);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao buscar histórico de indicadores';
        setError(message);
        console.error('useIndicatorHistory error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [ticker]);

  const getIndicatorData = (key) => {
    const meta = INDICATOR_META[key] || {};
    const data = allIndicators[key] || [];
    const values = data.map((d) => d.value);
    const avg = calculateAverage(values);

    return {
      key,
      label: meta.label || key,
      data,
      historicalAverage: avg,
      sectorAverage: null,
      isPercentage: meta.isPercentage || false,
      isCurrency: meta.isCurrency || false,
      isMillions: meta.isMillions || false,
      unit: meta.isCurrency ? 'R$' : meta.isPercentage ? '%' : '',
    };
  };

  return { loading, error, allIndicators, getIndicatorData };
};