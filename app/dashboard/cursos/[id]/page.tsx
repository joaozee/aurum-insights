import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { getCurso } from "@/lib/cursos-data";
import CursoDetalheContent from "./CursoDetalheContent";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const curso = getCurso(id);
  return {
    title: curso ? `${curso.titulo} | Aurum Academy` : "Curso | Aurum Academy",
  };
}

export default async function CursoPage({ params }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const curso = getCurso(id);
  if (!curso) notFound();

  return <CursoDetalheContent curso={curso} />;
}
