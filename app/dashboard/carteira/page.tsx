import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CarteiraContent from "./CarteiraContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Minha Carteira | Aurum Investimentos",
};

export default async function CarteiraPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <CarteiraContent userEmail={user.email!} />;
}
