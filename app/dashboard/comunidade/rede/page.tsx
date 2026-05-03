import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import RedeContent from "./RedeContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Minha Rede | Aurum Investimentos",
};

export default async function RedePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <RedeContent userEmail={user.email!} />;
}
