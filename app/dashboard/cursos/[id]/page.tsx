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

  // Carrega matrícula do usuário (server-side) para hidratar a UI sem flicker
  const { data: enroll } = await supabase
    .from("user_enrollment")
    .select("progress, completed_lessons, started_at, completed_at")
    .eq("user_email", user.email!)
    .eq("course_id", curso.dbId)
    .maybeSingle();

  return (
    <CursoDetalheContent
      curso={curso}
      userEmail={user.email!}
      initialEnrollment={
        enroll
          ? {
              progress: (enroll.progress as number | null) ?? 0,
              completed_lessons: (enroll.completed_lessons as string[] | null) ?? [],
              started_at: (enroll.started_at as string | null) ?? null,
              completed_at: (enroll.completed_at as string | null) ?? null,
            }
          : null
      }
    />
  );
}
