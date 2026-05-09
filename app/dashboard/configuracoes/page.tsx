import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import ConfiguracoesContent from "./ConfiguracoesContent";

export const metadata: Metadata = {
  title: "Configurações | Aurum Investimentos",
};

export default async function ConfiguracoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const email = user.email ?? "";
  const fullName: string =
    user.user_metadata?.full_name || email.split("@")[0] || "Usuário";

  return (
    <ConfiguracoesContent
      currentUserEmail={email}
      currentUserName={fullName}
    />
  );
}
