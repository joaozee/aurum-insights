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

// ─── Contas oficiais (mostram selo de verificado) ────────────────────────────
// Lista de emails/usernames que pertencem ao próprio app (canais oficiais).
// Esses posts ganham o ícone BadgeCheck ao lado do nome no feed.

const OFFICIAL_EMAILS = new Set<string>([
  "noticias@aurum.app",
]);
const OFFICIAL_USERNAMES = new Set<string>([
  "noticias_aurum",
]);

export function isOfficialAccount(
  email: string | null | undefined,
  username?: string | null,
): boolean {
  if (email && OFFICIAL_EMAILS.has(email.toLowerCase())) return true;
  if (username && OFFICIAL_USERNAMES.has(username.toLowerCase())) return true;
  return false;
}
