import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ComunidadeContent from "./ComunidadeContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Comunidade | Aurum Investimentos",
};

export default async function ComunidadePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const userName: string =
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Usuário";

  return <ComunidadeContent userEmail={user.email!} userName={userName} />;
}
