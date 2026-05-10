// Exportacao de relatorios para PDF (apresentacao), Excel/CSV (contador) e
// SPED (.txt — esqueleto compatível). PDF aqui sai como HTML printable
// (a janela de impressao do navegador converte em PDF), que mantem o app
// dependency-free. Para excel usamos CSV; o contador importa via Domínio
// e similares. SPED é um esqueleto do bloco fiscal F100 (lancamentos).

import {
  type FinanceTxRow,
  type ApAr,
  type Company,
  computeDre,
  fmtBRL,
  DRE_LABELS,
} from "@/lib/empresa-finance";

// ─── PDF (via window.print) ────────────────────────────────────────────────

export function exportDrePdf({
  company,
  transactions,
  periodLabel,
}: {
  company: Company;
  transactions: FinanceTxRow[];
  periodLabel: string;
}) {
  const dre = computeDre(transactions);
  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>DRE — ${escape(company.name)} — ${escape(periodLabel)}</title>
<style>
  body { font-family: Georgia, 'Times New Roman', serif; padding: 32px 48px; color: #1a1a1a; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .meta { color: #666; font-size: 11px; margin-bottom: 24px; border-bottom: 1px solid #ccc; padding-bottom: 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  td { padding: 6px 8px; }
  tr.subtotal td { background: #f4f0e0; font-weight: 600; border-top: 1px solid #ccc; }
  tr.total td { background: #e8d99a; font-weight: 700; font-size: 13px; border-top: 2px solid #999; border-bottom: 2px solid #999; }
  td.amount { text-align: right; font-variant-numeric: tabular-nums; }
  .ind { padding-left: 24px; color: #555; }
  .footer { margin-top: 32px; font-size: 10px; color: #888; border-top: 1px solid #ddd; padding-top: 12px; }
</style>
</head>
<body>
<h1>Demonstrativo de Resultado do Exercício</h1>
<div class="meta">
  <strong>${escape(company.name)}</strong>${company.cnpj ? ` · CNPJ ${escape(company.cnpj)}` : ""}<br/>
  Período: ${escape(periodLabel)}
</div>
<table>
  ${row("(+) Receita Bruta", dre.receita_bruta.total)}
  ${row("(−) Deduções", -dre.deducao.total, "ind")}
  ${row("(=) Receita Líquida", dre.receita_liquida, "subtotal")}
  ${row("(−) CMV / CPV", -dre.cmv.total, "ind")}
  ${row("(=) Margem Bruta", dre.margem_bruta, "subtotal")}
  ${row("(−) Despesas Operacionais", -dre.despesa_operacional.total, "ind")}
  ${row("(=) EBITDA", dre.ebitda, "subtotal")}
  ${row("(−) Depreciação", -dre.depreciacao.total, "ind")}
  ${row(`(${dre.resultado_financeiro.total >= 0 ? "+" : "−"}) Resultado Financeiro`, dre.resultado_financeiro.total, "ind")}
  ${row("(−) IR / CSLL", -dre.imposto_renda.total, "ind")}
  ${row("(=) Lucro Líquido", dre.lucro_liquido, "total")}
</table>
<div class="footer">
  Margens: bruta ${dre.margem_bruta_pct.toFixed(1)}% · EBITDA ${dre.ebitda_pct.toFixed(1)}% · líquida ${dre.lucro_liquido_pct.toFixed(1)}%<br/>
  Gerado em ${new Date().toLocaleString("pt-BR")} pelo Aurum.
</div>
<script>setTimeout(() => window.print(), 300);</script>
</body>
</html>`;
  openHtmlInTab(html);
}

function row(label: string, amount: number, klass: "" | "ind" | "subtotal" | "total" = "") {
  const isSub = klass === "subtotal" || klass === "total";
  return `<tr class="${isSub ? klass : ""}"><td class="${klass === "ind" ? "ind" : ""}">${escape(label)}</td><td class="amount">${escape(fmtBRL(amount))}</td></tr>`;
}

// ─── CSV / Excel ────────────────────────────────────────────────────────────

export function exportTransactionsCsv({
  company,
  transactions,
  periodLabel,
}: {
  company: Company;
  transactions: FinanceTxRow[];
  periodLabel: string;
}) {
  const lines = [
    `Empresa,${csvEscape(company.name)}`,
    company.cnpj ? `CNPJ,${csvEscape(company.cnpj)}` : "",
    `Período,${csvEscape(periodLabel)}`,
    "",
    "Data,Tipo,Categoria,Linha DRE,Descrição,Valor",
  ];
  for (const t of transactions) {
    const dre = t.dre_line ?? "";
    lines.push(
      [
        t.transaction_date,
        t.type,
        csvEscape(t.category ?? ""),
        csvEscape(dre ? DRE_LABELS[t.dre_line!] : ""),
        csvEscape(t.description ?? ""),
        Number(t.amount).toFixed(2).replace(".", ","),
      ].join(","),
    );
  }
  download(
    lines.filter(Boolean).join("\n"),
    `aurum-transacoes-${slug(company.name)}-${todayIso()}.csv`,
    "text/csv;charset=utf-8;",
  );
}

export function exportApArCsv({
  company,
  apar,
}: {
  company: Company;
  apar: ApAr[];
}) {
  const lines = [
    `Empresa,${csvEscape(company.name)}`,
    "",
    "Tipo,Contraparte,Descrição,Valor,Vencimento,Pago em,Status,Categoria,Documento",
  ];
  for (const r of apar) {
    lines.push(
      [
        r.kind,
        csvEscape(r.counterparty),
        csvEscape(r.description ?? ""),
        Number(r.amount).toFixed(2).replace(".", ","),
        r.due_date,
        r.paid_date ?? "",
        r.status,
        csvEscape(r.category ?? ""),
        csvEscape(r.document_number ?? ""),
      ].join(","),
    );
  }
  download(
    lines.join("\n"),
    `aurum-contas-${slug(company.name)}-${todayIso()}.csv`,
    "text/csv;charset=utf-8;",
  );
}

// ─── SPED (esqueleto F100 — bloco financeiro/lançamentos) ──────────────────
// Formato pipe-delimited, padrao SPED Contribuicoes/Contabil. Nao substitui o
// gerador oficial, mas serve como ponto de partida para o contador. Cada
// linha do tipo F100 representa um lançamento financeiro.
export function exportSped({
  company,
  transactions,
  periodLabel,
}: {
  company: Company;
  transactions: FinanceTxRow[];
  periodLabel: string;
}) {
  const lines: string[] = [];
  // Bloco 0 (abertura)
  lines.push(`|0000|${periodLabel}|${escape(company.name)}|${company.cnpj ?? ""}|`);
  lines.push(`|0001|0|`);
  // Bloco F100 — Demais Operações
  for (const t of transactions) {
    const ind = t.type === "entrada" ? "1" : "0";
    lines.push(
      `|F100|${ind}|${t.transaction_date.replace(/-/g, "")}||${Number(t.amount).toFixed(2)}||${csvEscape(t.category ?? "")}|${csvEscape(t.description ?? "")}|`,
    );
  }
  lines.push(`|9999|${lines.length + 1}|`);
  download(
    lines.join("\n"),
    `aurum-sped-${slug(company.name)}-${todayIso()}.txt`,
    "text/plain;charset=utf-8;",
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function openHtmlInTab(html: string) {
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, "_blank");
  if (!w) {
    // Fallback se pop-up bloqueado
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener";
    a.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

function download(content: string, filename: string, mime: string) {
  const blob = new Blob(["﻿" + content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function csvEscape(v: string): string {
  if (v == null) return "";
  if (/[",;\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function slug(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function todayIso() {
  return new Date().toISOString().split("T")[0];
}
