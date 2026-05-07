import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import ProfileContent from "./ProfileContent";
import { fetchProfileBundle } from "./load";

export const metadata: Metadata = {
  title: "Meu Perfil | Aurum Investimentos",
};

export default async function MyProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const email = user.email ?? "";
  const fullName: string =
    user.user_metadata?.full_name || email.split("@")[0] || "Usuário";

  const bundle = await fetchProfileBundle(supabase, email, fullName, true);

  return (
    <ProfileContent
      mode="self"
      currentUserEmail={email}
      currentUserName={fullName}
      bundle={bundle}
    />
  );
}
