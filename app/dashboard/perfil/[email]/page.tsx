import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import ProfileContent from "../ProfileContent";
import { fetchProfileBundle } from "../load";

interface RouteProps {
  params: Promise<{ email: string }>;
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { email } = await params;
  return { title: `${decodeURIComponent(email)} | Aurum Investimentos` };
}

export default async function PublicProfilePage({ params }: RouteProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { email: rawParam } = await params;
  const targetEmail = decodeURIComponent(rawParam);
  const myEmail = user.email ?? "";

  // Visiting own profile via public URL → redirect to canonical /dashboard/perfil
  if (targetEmail.toLowerCase() === myEmail.toLowerCase()) {
    redirect("/dashboard/perfil");
  }

  const bundle = await fetchProfileBundle(supabase, targetEmail, "", false);
  if (!bundle.profile) notFound();

  const myFullName: string =
    user.user_metadata?.full_name || myEmail.split("@")[0] || "Usuário";

  return (
    <ProfileContent
      mode="public"
      currentUserEmail={myEmail}
      currentUserName={myFullName}
      bundle={bundle}
    />
  );
}
