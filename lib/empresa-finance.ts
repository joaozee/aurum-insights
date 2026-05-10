// Tipos e helpers compartilhados pelos modulos de financas da empresa.
// O DRE, Fluxo e Balanco sao derivados da tabela finance_transaction
// (com campos opcionais company_id, cost_center_id, dre_line) combinada com
// ap_ar, balance_entry e cost_center.

// ─── Tipos ──────────────────────────────────────────────────────────────────

export interface Company {
  id: string;
  owner_email: string;
  name: string;
  cnpj: string | null;
  trade_name: string | null;
  tax_regime: "simples" | "lucro_presumido" | "lucro_real" | "mei" | null;
  is_default: boolean;
  created_at: string;
}

export interface CostCenter {
  id: string;
  company_id: string;
  name: string;
  type: "area" | "projeto";
  budget: number | null;
  color: string | null;
  status: "ativo" | "encerrado";
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export interface ApAr {
  id: string;
  company_id: string;
  user_email: string;
  kind: "pagar" | "receber";
  counterparty: string;
  description: string | null;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: "aberto" | "pago" | "vencido" | "cancelado";
  category: string | null;
  cost_center_id: string | null;
  payment_method: string | null;
  document_number: string | null;
  notes: string | null;
  created_at: string;
}

export interface BalanceEntry {
  id: string;
  company_id: string;
  group_type:
    | "ativo_circulante"
    | "ativo_nao_circulante"
    | "passivo_circulante"
    | "passivo_nao_circulante"
    | "patrimonio_liquido";
  label: string;
  amount: number;
  reference_date: string;
  notes: string | null;
  created_at: string;
}

export interface FinanceTxRow {
  id: string;
  account_type: "pessoal" | "empresa";
  type: "entrada" | "saida";
  category: string;
  amount: number;
  description: string;
  transaction_date: string;
  company_id: string | null;
  cost_center_id: string | null;
  dre_line: DreLine | null;
}

export type DreLine =
  | "receita_bruta"
  | "deducao"
  | "cmv"
  | "despesa_operacional"
  | "depreciacao"
  | "resultado_financeiro"
  | "imposto_renda";

// ─── Categoria → linha do DRE ───────────────────────────────────────────────

export function inferDreLine(
  type: "entrada" | "saida",
  category: string,
): DreLine {
  if (type === "entrada") {
    if (/financ/i.test(category)) return "resultado_financeiro";
    return "receita_bruta";
  }
  // saidas
  if (/imposto|tributo|tax|icms|iss|pis|cofins|ir|csll/i.test(category))
    return "deducao";
  if (/fornecedor|materia.prima|insumo|cmv|cpv/i.test(category)) return "cmv";
  if (/deprec|amortiza/i.test(category)) return "depreciacao";
  if (/juro|emprest|financiamento|tarifa banc/i.test(category))
    return "resultado_financeiro";
  if (/imposto.de.renda|^ir(pj)?\b/i.test(category)) return "imposto_renda";
  return "despesa_operacional";
}

export const DRE_LABELS: Record<DreLine, string> = {
  receita_bruta: "Receita Bruta",
  deducao: "Deduções e Impostos sobre Venda",
  cmv: "CMV / CPV",
  despesa_operacional: "Despesas Operacionais",
  depreciacao: "Depreciação e Amortização",
  resultado_financeiro: "Resultado Financeiro",
  imposto_renda: "IR / CSLL",
};

// ─── Helpers de periodo ─────────────────────────────────────────────────────

export type Period = "mes" | "trimestre" | "ano" | "12m";

export function periodRange(
  period: Period,
  ref: Date = new Date(),
): { from: string; to: string; label: string } {
  const y = ref.getFullYear();
  const m = ref.getMonth();
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  if (period === "mes") {
    return {
      from: fmt(new Date(y, m, 1)),
      to: fmt(new Date(y, m + 1, 0)),
      label: ref.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
    };
  }
  if (period === "trimestre") {
    const qStart = Math.floor(m / 3) * 3;
    return {
      from: fmt(new Date(y, qStart, 1)),
      to: fmt(new Date(y, qStart + 3, 0)),
      label: `${Math.floor(m / 3) + 1}º trimestre ${y}`,
    };
  }
  if (period === "ano") {
    return { from: `${y}-01-01`, to: `${y}-12-31`, label: String(y) };
  }
  // 12m
  return {
    from: fmt(new Date(y, m - 11, 1)),
    to: fmt(new Date(y, m + 1, 0)),
    label: "Últimos 12 meses",
  };
}

// ─── Calculo do DRE ─────────────────────────────────────────────────────────

export interface DreLineSummary {
  line: DreLine;
  label: string;
  total: number;
  byCategory: { category: string; total: number; count: number }[];
  txIds: string[];
}

export interface DreResult {
  receita_bruta: DreLineSummary;
  deducao: DreLineSummary;
  receita_liquida: number;
  cmv: DreLineSummary;
  margem_bruta: number;
  margem_bruta_pct: number;
  despesa_operacional: DreLineSummary;
  ebitda: number;
  ebitda_pct: number;
  depreciacao: DreLineSummary;
  resultado_financeiro: DreLineSummary;
  imposto_renda: DreLineSummary;
  lucro_liquido: number;
  lucro_liquido_pct: number;
}

export function computeDre(transactions: FinanceTxRow[]): DreResult {
  const buckets = new Map<DreLine, FinanceTxRow[]>();
  for (const t of transactions) {
    const line = t.dre_line ?? inferDreLine(t.type, t.category);
    const arr = buckets.get(line) ?? [];
    arr.push(t);
    buckets.set(line, arr);
  }
  const summarize = (line: DreLine): DreLineSummary => {
    const txs = buckets.get(line) ?? [];
    const total = txs.reduce((s, t) => s + Number(t.amount), 0);
    const byCat = new Map<string, { total: number; count: number }>();
    for (const t of txs) {
      const cur = byCat.get(t.category) ?? { total: 0, count: 0 };
      cur.total += Number(t.amount);
      cur.count += 1;
      byCat.set(t.category, cur);
    }
    return {
      line,
      label: DRE_LABELS[line],
      total,
      byCategory: Array.from(byCat.entries())
        .map(([category, v]) => ({ category, ...v }))
        .sort((a, b) => b.total - a.total),
      txIds: txs.map((t) => t.id),
    };
  };

  const receita_bruta = summarize("receita_bruta");
  const deducao = summarize("deducao");
  const cmv = summarize("cmv");
  const despesa_operacional = summarize("despesa_operacional");
  const depreciacao = summarize("depreciacao");
  const resultado_financeiro = summarize("resultado_financeiro");
  const imposto_renda = summarize("imposto_renda");

  const receita_liquida = receita_bruta.total - deducao.total;
  const margem_bruta = receita_liquida - cmv.total;
  const margem_bruta_pct = receita_liquida > 0 ? (margem_bruta / receita_liquida) * 100 : 0;
  const ebitda = margem_bruta - despesa_operacional.total;
  const ebitda_pct = receita_liquida > 0 ? (ebitda / receita_liquida) * 100 : 0;
  // Resultado financeiro: entradas (receita financeira) ja vem positiva,
  // saidas (juros) entram como reducao. Como ambas estao em finance_transaction
  // e trataremos saida como custo no DRE financeiro:
  // Sinal de cada linha: receita_bruta entra +, deducao/cmv/despesa/depreciacao
  // entram como custo (-). Resultado financeiro: depende do sinal das txs.
  // Para simplificar e porque na pratica essa linha contem mais saidas (juros),
  // tratamos como CUSTO se total > 0. Receitas financeiras viram receita_bruta?
  // Nao: inferDreLine ja roteia "receita financeira" para resultado_financeiro
  // via /financ/i. Aqui, entradas devem aparecer como positivas e saidas como
  // negativas. Vamos calcular liquido (entradas - saidas) dentro do bucket:
  const rfBucket = buckets.get("resultado_financeiro") ?? [];
  const rfLiquido = rfBucket.reduce(
    (s, t) => s + (t.type === "entrada" ? Number(t.amount) : -Number(t.amount)),
    0,
  );
  const irBucket = buckets.get("imposto_renda") ?? [];
  const irTotal = irBucket.reduce((s, t) => s + Number(t.amount), 0);

  const lucro_liquido =
    ebitda - depreciacao.total + rfLiquido - irTotal;
  const lucro_liquido_pct = receita_liquida > 0 ? (lucro_liquido / receita_liquida) * 100 : 0;

  return {
    receita_bruta,
    deducao,
    receita_liquida,
    cmv,
    margem_bruta,
    margem_bruta_pct,
    despesa_operacional,
    ebitda,
    ebitda_pct,
    depreciacao,
    resultado_financeiro: { ...resultado_financeiro, total: rfLiquido },
    imposto_renda,
    lucro_liquido,
    lucro_liquido_pct,
  };
}

// ─── Fluxo de caixa ─────────────────────────────────────────────────────────

export interface CashFlowDay {
  date: string;
  in: number;
  out: number;
  net: number;
  balance: number;
}

export function buildRealizedCashFlow(
  transactions: FinanceTxRow[],
  startingBalance = 0,
): CashFlowDay[] {
  const map = new Map<string, { in: number; out: number }>();
  for (const t of transactions) {
    const cur = map.get(t.transaction_date) ?? { in: 0, out: 0 };
    if (t.type === "entrada") cur.in += Number(t.amount);
    else cur.out += Number(t.amount);
    map.set(t.transaction_date, cur);
  }
  const days = Array.from(map.entries())
    .map(([date, v]) => ({ date, ...v, net: v.in - v.out }))
    .sort((a, b) => a.date.localeCompare(b.date));
  let running = startingBalance;
  return days.map((d) => {
    running += d.net;
    return { ...d, balance: running };
  });
}

export function buildProjectedCashFlow(
  apar: ApAr[],
  startingBalance: number,
  horizonDays: 30 | 60 | 90,
): CashFlowDay[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setDate(end.getDate() + horizonDays);
  const map = new Map<string, { in: number; out: number }>();
  for (const r of apar) {
    if (r.status === "cancelado" || r.status === "pago") continue;
    const due = new Date(r.due_date + "T00:00:00");
    if (due < today || due > end) continue;
    const cur = map.get(r.due_date) ?? { in: 0, out: 0 };
    if (r.kind === "receber") cur.in += Number(r.amount);
    else cur.out += Number(r.amount);
    map.set(r.due_date, cur);
  }
  const days = Array.from(map.entries())
    .map(([date, v]) => ({ date, ...v, net: v.in - v.out }))
    .sort((a, b) => a.date.localeCompare(b.date));
  let running = startingBalance;
  return days.map((d) => {
    running += d.net;
    return { ...d, balance: running };
  });
}

// ─── Categoria de fluxo (operacional / financeiro / investimento) ───────────

export type CashCategory = "operacional" | "financeiro" | "investimento";

export function inferCashCategory(
  type: "entrada" | "saida",
  category: string,
): CashCategory {
  if (/juro|emprest|financiamento|tarifa banc|receita financeira/i.test(category))
    return "financeiro";
  if (/equipamento|software|imobilizado|investimento|aquisi/i.test(category))
    return "investimento";
  return "operacional";
}

// ─── Balanco Patrimonial ────────────────────────────────────────────────────

export interface BalanceSheet {
  ativo_circulante: { label: string; amount: number }[];
  ativo_nao_circulante: { label: string; amount: number }[];
  passivo_circulante: { label: string; amount: number }[];
  passivo_nao_circulante: { label: string; amount: number }[];
  patrimonio_liquido: { label: string; amount: number }[];
  totalAtivo: number;
  totalPassivo: number;
  totalPL: number;
  liquidezCorrente: number | null; // AC / PC
  liquidezSeca: number | null; // (AC - estoque) / PC — sem dado de estoque, == LC
  liquidezGeral: number | null; // (AC + ARLP) / (PC + PNC)
}

export function computeBalance(entries: BalanceEntry[]): BalanceSheet {
  const groups = {
    ativo_circulante: [] as { label: string; amount: number }[],
    ativo_nao_circulante: [] as { label: string; amount: number }[],
    passivo_circulante: [] as { label: string; amount: number }[],
    passivo_nao_circulante: [] as { label: string; amount: number }[],
    patrimonio_liquido: [] as { label: string; amount: number }[],
  };
  for (const e of entries) groups[e.group_type].push({ label: e.label, amount: Number(e.amount) });
  const sum = (arr: { amount: number }[]) => arr.reduce((s, x) => s + x.amount, 0);
  const ac = sum(groups.ativo_circulante);
  const anc = sum(groups.ativo_nao_circulante);
  const pc = sum(groups.passivo_circulante);
  const pnc = sum(groups.passivo_nao_circulante);
  const pl = sum(groups.patrimonio_liquido);
  return {
    ...groups,
    totalAtivo: ac + anc,
    totalPassivo: pc + pnc,
    totalPL: pl,
    liquidezCorrente: pc > 0 ? ac / pc : null,
    liquidezSeca: pc > 0 ? ac / pc : null,
    liquidezGeral: pc + pnc > 0 ? (ac + anc) / (pc + pnc) : null,
  };
}

// ─── Format ─────────────────────────────────────────────────────────────────

export const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const fmtBRLShort = (v: number) => {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1).replace(".", ",")}M`;
  if (abs >= 1_000) return `R$ ${(v / 1_000).toFixed(1).replace(".", ",")}k`;
  return fmtBRL(v);
};
