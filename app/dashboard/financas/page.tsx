import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FinancasContent from "./FinancasContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Finanças | Aurum Investimentos",
};

export interface Transaction {
  id: string;
  type: "income" | "expense";
  category: string;
  description: string;
  amount: number;
  date: string;
}

export default async function FinancasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", firstDay)
    .lte("date", lastDay)
    .order("date", { ascending: false });

  return <FinancasContent transactions={(transactions ?? []) as Transaction[]} userId={user.id} />;
}
