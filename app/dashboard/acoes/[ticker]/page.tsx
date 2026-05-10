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

  const userName: string =
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Usuário";

  const { data: profile } = await supabase
    .from("user_profile")
    .select("avatar_url")
    .eq("user_email", user.email!)
    .maybeSingle();

  const { ticker } = await params;
  return (
    <AcaoContent
      ticker={ticker.toUpperCase()}
      userEmail={user.email!}
      userName={userName}
      userAvatar={profile?.avatar_url ?? null}
    />
  );
}
