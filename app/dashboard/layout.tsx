import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const fullName: string =
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Usuário";

  const userInitial = fullName.charAt(0).toUpperCase();

  const { data: profile } = await supabase
    .from("user_profile")
    .select("avatar_url")
    .eq("user_email", user.email!)
    .maybeSingle();

  return (
    <div style={{ minHeight: "100vh", background: "#0d0b07" }}>
      <Navbar
        userName={fullName}
        userInitial={userInitial}
        userAvatar={profile?.avatar_url ?? null}
      />
      <main>{children}</main>
    </div>
  );
}
