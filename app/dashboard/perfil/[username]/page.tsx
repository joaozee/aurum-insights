import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import ProfileContent from "../ProfileContent";
import { fetchProfileBundle } from "../load";

interface RouteProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { username } = await params;
  return { title: `@${decodeURIComponent(username)} | Aurum Investimentos` };
}

export default async function PublicProfilePage({ params }: RouteProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { username: rawParam } = await params;
  const targetUsername = decodeURIComponent(rawParam);
  const myEmail = user.email ?? "";

  const bundle = await fetchProfileBundle(supabase, targetUsername, "", false, "username");
  if (!bundle.profile) notFound();

  // Visiting own profile via public URL → redirect to canonical /dashboard/perfil
  if (bundle.profile.user_email.toLowerCase() === myEmail.toLowerCase()) {
    redirect("/dashboard/perfil");
  }

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
