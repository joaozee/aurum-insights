import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import MensagensContent from "./MensagensContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mensagens | Aurum Investimentos",
};

export default async function MensagensPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const userName: string =
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Usuário";

  return (
    <Suspense fallback={null}>
      <MensagensContent userEmail={user.email!} userName={userName} />
    </Suspense>
  );
}
