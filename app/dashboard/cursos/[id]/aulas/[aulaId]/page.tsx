import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { getAula } from "@/lib/cursos-data";
import AulaContent from "./AulaContent";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string; aulaId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, aulaId } = await params;
  const data = getAula(id, aulaId);
  return {
    title: data ? `${data.aula.titulo} | ${data.curso.titulo}` : "Aula | Aurum Academy",
  };
}

export default async function AulaPage({ params }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id, aulaId } = await params;
  const data = getAula(id, aulaId);
  if (!data) notFound();

  return <AulaContent curso={data.curso} moduloAtualId={data.modulo.id} aulaAtualId={data.aula.id} />;
}
