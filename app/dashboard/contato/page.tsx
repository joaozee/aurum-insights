import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import ContatoContent from "./ContatoContent";

export const metadata: Metadata = {
  title: "Contato | Aurum Investimentos",
};

export default async function ContatoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const email = user.email ?? "";
  const fullName: string =
    user.user_metadata?.full_name || email.split("@")[0] || "Usuário";

  return <ContatoContent currentUserEmail={email} currentUserName={fullName} />;
}
