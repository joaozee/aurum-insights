import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FinancasContent from "./FinancasContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Finanças | Aurum Investimentos",
};

export default async function FinancasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <FinancasContent userEmail={user.email!} />;
}
