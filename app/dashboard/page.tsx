import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import HomeContent from "./HomeContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Início | Aurum Investimentos",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const fullName: string =
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Usuário";

  const firstName = fullName.split(" ")[0];

  return <HomeContent firstName={firstName} />;
}
