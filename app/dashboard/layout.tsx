import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import { CommandPaletteProvider } from "@/components/CommandPalette";

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

  const { data: profile } = await supabase
    .from("user_profile")
    .select("avatar_url, user_name")
    .eq("user_email", user.email!)
    .maybeSingle();

  const rawName: string =
    profile?.user_name ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Usuário";

  // NFC normaliza decompostos (ex: "a" + combining tilde) para sua forma composta ("ã"),
  // garantindo renderização consistente de acentos vindos de diferentes fontes.
  const fullName = rawName.normalize("NFC");

  const userInitial = fullName.charAt(0).toUpperCase();

  return (
    <CommandPaletteProvider>
      <div style={{ minHeight: "100vh", background: "#0d0b07" }}>
        <Navbar
          userName={fullName}
          userInitial={userInitial}
          userAvatar={profile?.avatar_url ?? null}
          userEmail={user.email!}
        />
        <main>{children}</main>
      </div>
    </CommandPaletteProvider>
  );
}
