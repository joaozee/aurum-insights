import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import NoticiasAurumContent from "./NoticiasAurumContent";
import { fetchNoticiasAurumBundle, NOTICIAS_AURUM } from "./load";

// Rota dedicada ao canal oficial de notícias. Precede a rota dinâmica
// `/dashboard/perfil/[username]` no Next.js (segmento estático tem prioridade),
// então mesmo sem entrada em user_profile para "noticias_aurum" a página
// carrega sem hit no notFound() do loader genérico.

export const metadata: Metadata = {
  title: "Notícias Aurum | Canal Oficial",
  description:
    "Curadoria oficial de notícias de mercado, macroeconomia, FIIs, cripto e empresas — direto pelo time do Aurum.",
};

export default async function NoticiasAurumProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const bundle = await fetchNoticiasAurumBundle(supabase);

  return (
    <NoticiasAurumContent
      currentUserEmail={user.email ?? ""}
      channel={{
        username: NOTICIAS_AURUM.username,
        display_name: NOTICIAS_AURUM.display_name,
        bio: NOTICIAS_AURUM.bio,
      }}
      bundle={bundle}
    />
  );
}
