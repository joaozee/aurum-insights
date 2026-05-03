import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AcoesContent from "./AcoesContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Análise de Ações | Aurum Investimentos",
};

export default async function AcoesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <AcoesContent />;
}
