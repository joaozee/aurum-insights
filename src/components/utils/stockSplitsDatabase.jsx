/**
 * Base de desdobramentos (splits) e grupamentos de ações brasileiras.
 * 
 * Formato de cada entrada:
 *   ticker: código do ativo (ex: 'BBAS3')
 *   date: data de efeito do desdobramento (ISO string 'YYYY-MM-DD')
 *   ratio: fator multiplicador de ações (ex: 2 = dobrou o número de ações = dividir dividendo por 2)
 * 
 * Para um DESDOBRAMENTO 1:2 (cada ação vira 2): ratio = 2
 * Para um GRUPAMENTO 2:1 (cada 2 ações viram 1): ratio = 0.5
 * 
 * Impacto nos dividendos históricos:
 *   Dividendos pagos ANTES da data de split devem ser divididos pelo ratio acumulado
 *   de todos os splits ocorridos APÓS aquela data.
 * 
 * Fontes: B3, Fundamentus, Statusinvest, Suno, XP Research
 */

export const STOCK_SPLITS_DATABASE = [
  // ─── BANCO DO BRASIL ───────────────────────────────────────────
  { ticker: 'BBAS3', date: '2022-09-21', ratio: 2 },   // desdobramento 1:2

  // ─── ITAÚ UNIBANCO ─────────────────────────────────────────────
  { ticker: 'ITUB3', date: '2022-08-22', ratio: 2 },   // desdobramento 1:2
  { ticker: 'ITUB4', date: '2022-08-22', ratio: 2 },   // desdobramento 1:2

  // ─── BRADESCO ──────────────────────────────────────────────────
  { ticker: 'BBDC3', date: '2021-05-04', ratio: 2 },   // desdobramento 1:2
  { ticker: 'BBDC4', date: '2021-05-04', ratio: 2 },   // desdobramento 1:2

  // ─── PETROBRAS ─────────────────────────────────────────────────
  // Petrobras não teve splits nos últimos 10 anos

  // ─── VALE ──────────────────────────────────────────────────────
  // Vale não teve splits nos últimos 10 anos (recompras e cancelamentos, não splits)

  // ─── WEG ───────────────────────────────────────────────────────
  { ticker: 'WEGE3', date: '2020-04-20', ratio: 3 },   // desdobramento 1:3
  { ticker: 'WEGE3', date: '2016-04-18', ratio: 3 },   // desdobramento 1:3 (impacta histórico 10y)

  // ─── LOCALIZA ──────────────────────────────────────────────────
  { ticker: 'RENT3', date: '2022-07-18', ratio: 2 },   // desdobramento 1:2

  // ─── LOJAS RENNER ──────────────────────────────────────────────
  { ticker: 'LREN3', date: '2020-09-10', ratio: 2 },   // desdobramento 1:2

  // ─── AMBEV ─────────────────────────────────────────────────────
  // Ambev não teve splits nos últimos 10 anos

  // ─── MAGAZINE LUIZA ────────────────────────────────────────────
  { ticker: 'MGLU3', date: '2020-07-20', ratio: 7 },   // desdobramento 1:7
  { ticker: 'MGLU3', date: '2017-10-02', ratio: 3 },   // desdobramento 1:3

  // ─── B3 (BOLSA) ────────────────────────────────────────────────
  { ticker: 'B3SA3', date: '2022-10-17', ratio: 2 },   // desdobramento 1:2

  // ─── TOTVS ─────────────────────────────────────────────────────
  { ticker: 'TOTS3', date: '2021-10-04', ratio: 2 },   // desdobramento 1:2

  // ─── HAPVIDA ───────────────────────────────────────────────────
  { ticker: 'HAPV3', date: '2021-12-06', ratio: 2 },   // desdobramento 1:2

  // ─── RAIA DROGASIL ─────────────────────────────────────────────
  { ticker: 'RADL3', date: '2020-05-15', ratio: 3 },   // desdobramento 1:3

  // ─── FLEURY ────────────────────────────────────────────────────
  { ticker: 'FLRY3', date: '2021-11-22', ratio: 2 },   // desdobramento 1:2

  // ─── ENGIE BRASIL ──────────────────────────────────────────────
  { ticker: 'EGIE3', date: '2023-05-22', ratio: 2 },   // desdobramento 1:2

  // ─── TAESA ─────────────────────────────────────────────────────
  { ticker: 'TAEE11', date: '2021-05-24', ratio: 4 },  // desdobramento 1:4

  // ─── ITAÚSA ────────────────────────────────────────────────────
  { ticker: 'ITSA3', date: '2022-08-22', ratio: 2 },   // desdobramento 1:2 (acompanhou ITUB)
  { ticker: 'ITSA4', date: '2022-08-22', ratio: 2 },   // desdobramento 1:2

  // ─── INTER ─────────────────────────────────────────────────────
  { ticker: 'INTR3', date: '2022-06-22', ratio: 2 },   // desdobramento 1:2

  // ─── PRIO (antiga PetroRio) ────────────────────────────────────
  { ticker: 'PRIO3', date: '2021-05-03', ratio: 4 },   // desdobramento 1:4

  // ─── VIVARA ────────────────────────────────────────────────────
  { ticker: 'VIVA3', date: '2023-03-06', ratio: 2 },   // desdobramento 1:2

  // ─── COSAN ─────────────────────────────────────────────────────
  { ticker: 'CSAN3', date: '2021-03-24', ratio: 2 },   // desdobramento 1:2

  // ─── ENERGIAS DO BRASIL (EDP) ──────────────────────────────────
  { ticker: 'ENBR3', date: '2022-09-12', ratio: 2 },   // desdobramento 1:2

  // ─── COPEL ─────────────────────────────────────────────────────
  { ticker: 'CPLE3', date: '2023-06-12', ratio: 5 },   // desdobramento 1:5
  { ticker: 'CPLE6', date: '2023-06-12', ratio: 5 },   // desdobramento 1:5

  // ─── ELETROBRAS ────────────────────────────────────────────────
  { ticker: 'ELET3', date: '2023-09-25', ratio: 2 },   // desdobramento 1:2
  { ticker: 'ELET6', date: '2023-09-25', ratio: 2 },   // desdobramento 1:2

  // ─── AREZZO ────────────────────────────────────────────────────
  { ticker: 'ARZZ3', date: '2021-07-12', ratio: 2 },   // desdobramento 1:2

  // ─── NATURA ────────────────────────────────────────────────────
  { ticker: 'NTCO3', date: '2020-01-02', ratio: 2 },   // desdobramento 1:2

  // ─── SIMPAR ────────────────────────────────────────────────────
  { ticker: 'SIMH3', date: '2021-11-15', ratio: 4 },   // desdobramento 1:4

  // ─── PORTO SEGURO ──────────────────────────────────────────────
  { ticker: 'PSSA3', date: '2022-06-01', ratio: 2 },   // desdobramento 1:2

  // ─── CYRELA ────────────────────────────────────────────────────
  { ticker: 'CYRE3', date: '2021-10-18', ratio: 2 },   // desdobramento 1:2

  // ─── GRENDENE ──────────────────────────────────────────────────
  { ticker: 'GRND3', date: '2021-09-20', ratio: 3 },   // desdobramento 1:3

  // ─── IRANI ─────────────────────────────────────────────────────
  { ticker: 'RANI3', date: '2022-09-20', ratio: 2 },   // desdobramento 1:2

  // ─── SÃO MARTINHO ──────────────────────────────────────────────
  { ticker: 'SMTO3', date: '2022-11-14', ratio: 2 },   // desdobramento 1:2
];

/**
 * Retorna os eventos de split para um ticker específico, ordenados por data.
 * @param {string} ticker 
 * @returns {Array<{date: Date, ratio: number}>}
 */
export function getSplitsForTicker(ticker) {
  const t = (ticker || '').toUpperCase().trim();
  return STOCK_SPLITS_DATABASE
    .filter(s => s.ticker === t)
    .map(s => ({ date: new Date(s.date), ratio: s.ratio }))
    .sort((a, b) => a.date - b.date);
}

/**
 * Calcula o fator de ajuste acumulado para um dividendo pago em `divDate`.
 * Multiplica todos os ratios de splits que ocorreram APÓS essa data.
 * 
 * Ex: BBAS3 split 1:2 em set/2022.
 *   - Dividendo de jan/2022 → fator = 2 (precisa dividir por 2)
 *   - Dividendo de out/2022 → fator = 1 (já é pós-split, sem ajuste)
 * 
 * @param {string} ticker 
 * @param {string|Date} divDate 
 * @returns {number} fator divisor (1 = sem ajuste, 2 = dividir por 2, etc.)
 */
export function getSplitAdjustmentFactor(ticker, divDate) {
  const splits = getSplitsForTicker(ticker);
  if (splits.length === 0) return 1;

  const d = new Date(divDate);
  let factor = 1;
  splits.forEach(s => {
    if (s.date > d) {
      factor *= s.ratio;
    }
  });
  return factor;
}