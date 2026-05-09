/**
 * Aurum design tokens — TypeScript surface.
 *
 * The CSS source of truth lives in app/globals.css under :root.
 * This file mirrors those tokens for inline-style consumers (most of the
 * legacy components). Once shadcn/ui lands, prefer Tailwind classes that
 * reference the CSS variables directly via tailwind.config.ts.
 */

export const COLORS = {
  // Surface
  bgPage: "#0a0806",
  bgShell: "#0d0b07",
  bgCard: "#130f09",
  bgCardHover: "#1a1410",
  bgInput: "#1a1508",

  // Borders
  borderFaint: "rgba(201, 168, 76, 0.08)",
  borderSoft: "rgba(201, 168, 76, 0.12)",
  borderEmphasis: "rgba(201, 168, 76, 0.25)",
  borderStrong: "rgba(201, 168, 76, 0.4)",

  // Text — all AA-passing on bgPage
  textStrong: "#f0e8d0",
  textDefault: "#e8dcc0",
  textBody: "#c8b89a",
  textMuted: "#a09068",
  textFaint: "#9a8a6a",

  // Brand
  gold: "#C9A84C",
  goldLight: "#E8C96A",
  goldDim: "#9B7A29",

  // Status
  positive: "#34d399",
  positiveBg: "rgba(52, 211, 153, 0.1)",
  negative: "#f87171",
  negativeBg: "rgba(248, 113, 113, 0.1)",
} as const;

/**
 * Aurum chart palette — 8 hues in the same lightness band, hue-spaced.
 *
 * Use this for any category/ticker/sector/event coloring. Never mix with
 * the Tailwind 500 default palette (#3b82f6, #ef4444, #8b5cf6, etc.) — that
 * collides with Aurum's warm-dark editorial identity.
 */
export const CHART_PALETTE = [
  "#C9A84C", // 1 — gold (anchor)
  "#C58A3D", // 2 — amber
  "#B85C3A", // 3 — terracotta
  "#A4485E", // 4 — dusky rose
  "#8B5470", // 5 — mauve
  "#5E6B8C", // 6 — slate blue
  "#4F8A82", // 7 — desaturated teal
  "#6E8C4A", // 8 — olive green
] as const;

/**
 * Deterministic ticker → color mapping using djb2-style hash.
 * Same input always produces same color, distribution is reasonably even.
 */
export function tickerColor(ticker: string): string {
  let h = 5381;
  for (let i = 0; i < ticker.length; i++) {
    h = ((h << 5) + h + ticker.charCodeAt(i)) | 0;
  }
  return CHART_PALETTE[Math.abs(h) % CHART_PALETTE.length];
}

/**
 * Asset class → chart palette index. Stable across the app.
 */
export const ASSET_CLASS_COLORS: Record<string, string> = {
  acoes:      CHART_PALETTE[5], // slate blue
  fiis:       CHART_PALETTE[2], // terracotta
  renda_fixa: CHART_PALETTE[7], // olive green
  cripto:     CHART_PALETTE[0], // gold
  fundos:     CHART_PALETTE[4], // mauve (legacy)
};

/**
 * B3 sectors → chart palette. Each sector gets a stable color from the
 * Aurum family. "Outros" falls back to muted text (legible on dark bg).
 */
export const SECTOR_COLORS: Record<string, string> = {
  "Serviços Financeiros":  CHART_PALETTE[5], // slate blue
  "Energia":               CHART_PALETTE[2], // terracotta
  "Materiais":             CHART_PALETTE[6], // teal
  "Bens de Consumo":       CHART_PALETTE[3], // dusky rose
  "Saúde":                 CHART_PALETTE[7], // olive
  "Tecnologia":            CHART_PALETTE[6], // teal
  "Utilidade Pública":     CHART_PALETTE[1], // amber
  "Industrial":            CHART_PALETTE[2], // terracotta
  "Imobiliário":           CHART_PALETTE[4], // mauve
  "Comunicações":          CHART_PALETTE[5], // slate blue
  "Outros":                "#a09068",        // text-muted, legible on dark
};

/**
 * Finance category → chart palette. Reuses the 8-hue family so that
 * dashboards stay coherent even when full of category dots.
 */
export const FINANCE_CATEGORY_COLORS: Record<string, string> = {
  // Pessoal — despesas
  "Alimentação":  CHART_PALETTE[1], // amber
  "Transporte":   CHART_PALETTE[5], // slate blue
  "Moradia":      CHART_PALETTE[4], // mauve
  "Saúde":        CHART_PALETTE[3], // dusky rose
  "Educação":     CHART_PALETTE[6], // teal
  "Lazer":        CHART_PALETTE[7], // olive
  "Vestuário":    CHART_PALETTE[2], // terracotta
  "Serviços":     CHART_PALETTE[4], // mauve
  "Impostos":     CHART_PALETTE[3], // dusky rose
  // Pessoal — receitas
  "Salário":      CHART_PALETTE[7], // olive
  "Freelance":    CHART_PALETTE[6], // teal
  "Dividendos":   CHART_PALETTE[0], // gold
  "Investimentos":CHART_PALETTE[7], // olive
  "Aluguel":      CHART_PALETTE[5], // slate blue
  // Empresa — despesas
  "Fornecedores":           CHART_PALETTE[1], // amber
  "Folha de Pagamento":     CHART_PALETTE[7], // olive
  "Aluguel Comercial":      CHART_PALETTE[5], // slate blue
  "Marketing":              CHART_PALETTE[3], // dusky rose
  "Impostos e Taxas":       CHART_PALETTE[3], // dusky rose
  "Serviços / Terceiros":   CHART_PALETTE[4], // mauve
  "Infraestrutura":         CHART_PALETTE[4], // mauve
  "Equipamentos":           CHART_PALETTE[6], // teal
  "Viagens Corporativas":   CHART_PALETTE[2], // terracotta
  "Logística":              CHART_PALETTE[5], // slate blue
  "Contabilidade / Jurídico":CHART_PALETTE[7],// olive
  // Empresa — receitas
  "Vendas":             CHART_PALETTE[7], // olive
  "Serviços Prestados": CHART_PALETTE[7], // olive
  "Comissões":          CHART_PALETTE[0], // gold
  "Contratos":          CHART_PALETTE[6], // teal
  "Receitas Financeiras":CHART_PALETTE[5],// slate blue
  // Both
  "Expansão":         CHART_PALETTE[4], // mauve
  "Capital de Giro":  CHART_PALETTE[6], // teal
  "Outros":           "#a09068",        // text-muted
};

/**
 * Event types in the financial calendar → chart palette.
 */
export const EVENT_TYPE_COLORS: Record<string, string> = {
  vencimento: CHART_PALETTE[3], // dusky rose
  meta:       CHART_PALETTE[4], // mauve
  receita:    CHART_PALETTE[7], // olive
  despesa:    CHART_PALETTE[1], // amber
  outro:      "#a09068",
};
