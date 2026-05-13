import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import AdminNoticiasContent from "./AdminNoticiasContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Curar Notícias | Aurum Comunidade",
};

export default async function AdminNoticiasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  // Apenas admins (whitelist em lib/admin.ts) acessam essa página. Não-admins
  // são redirecionados pro feed normal da comunidade sem error message visível,
  // tratando como "rota inexistente" pra esse perfil.
  if (!isAdmin(user.email)) redirect("/dashboard/comunidade");

  return (
    <AdminNoticiasContent
      userEmail={user.email ?? ""}
      userName={user.user_metadata?.name ?? user.email?.split("@")[0] ?? "Aurum"}
      userAvatar={user.user_metadata?.avatar_url ?? null}
    />
  );
}
