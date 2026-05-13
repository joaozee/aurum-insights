// ─── Whitelist de admin ──────────────────────────────────────────────────────
// Lista hardcoded de emails que têm acesso a recursos administrativos do app
// (ex: página de curadoria de notícias da comunidade). Mantemos hardcoded por
// enquanto pra não depender de RLS/role; quando o app crescer, migrar pra um
// campo `is_admin` em user_profile + policy específica.
//
// IMPORTANTE: comparação é case-insensitive — Supabase pode normalizar emails.

const ADMIN_EMAILS = new Set([
  "joaomalaquias05@hotmail.com",
]);

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.has(email.toLowerCase());
}
