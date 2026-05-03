import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CursosContent from "./CursosContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cursos | Aurum Investimentos",
};

export default async function CursosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <CursosContent />;
}
