import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AcaoContent from "./AcaoContent";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ ticker: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ticker } = await params;
  return {
    title: `${ticker.toUpperCase()} | Análise — Aurum`,
  };
}

export default async function AcaoPage({ params }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { ticker } = await params;
  return <AcaoContent ticker={ticker.toUpperCase()} />;
}
