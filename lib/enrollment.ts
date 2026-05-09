import { createClient } from "@/lib/supabase/client";
import { CURSOS, type Curso } from "@/lib/cursos-data";

export interface EnrollmentRow {
  course_id: string;
  user_email: string;
  progress: number | null;
  completed_lessons: string[] | null;
  completed_modules: string[] | null;
  started_at: string | null;
  completed_at: string | null;
}

export function totalLessons(curso: Curso): number {
  return curso.modulos.reduce((sum, m) => sum + m.aulas.length, 0);
}

export function progressFromLessons(curso: Curso, completed: string[] | null | undefined): number {
  const total = totalLessons(curso);
  if (total === 0) return 0;
  const done = (completed ?? []).filter((id) =>
    curso.modulos.some((m) => m.aulas.some((a) => a.id === id))
  ).length;
  return Math.min(100, Math.round((done / total) * 100));
}

export async function fetchEnrollments(userEmail: string): Promise<Map<string, EnrollmentRow>> {
  const supabase = createClient();
  const { data } = await supabase
    .from("user_enrollment")
    .select("course_id, user_email, progress, completed_lessons, completed_modules, started_at, completed_at")
    .eq("user_email", userEmail);

  const byUuid = new Map<string, EnrollmentRow>();
  for (const row of (data ?? []) as EnrollmentRow[]) {
    byUuid.set(row.course_id, row);
  }
  // Reindexa pelo slug do curso pra uso na UI
  const result = new Map<string, EnrollmentRow>();
  for (const c of CURSOS) {
    const row = byUuid.get(c.dbId);
    if (row) result.set(c.id, row);
  }
  return result;
}

export async function enrollInCourse(userEmail: string, courseSlug: string): Promise<boolean> {
  const supabase = createClient();
  const curso = CURSOS.find((c) => c.id === courseSlug);
  if (!curso) return false;
  const { error } = await supabase.from("user_enrollment").upsert(
    {
      user_email: userEmail,
      course_id: curso.dbId,
      progress: 0,
      completed_lessons: [],
      completed_modules: [],
      started_at: new Date().toISOString().slice(0, 10),
    },
    { onConflict: "user_email,course_id" }
  );
  return !error;
}

export async function setLessonComplete(
  userEmail: string,
  courseSlug: string,
  lessonId: string,
  done: boolean
): Promise<{ completed: string[]; progress: number } | null> {
  const supabase = createClient();
  const curso = CURSOS.find((c) => c.id === courseSlug);
  if (!curso) return null;

  const { data: cur } = await supabase
    .from("user_enrollment")
    .select("completed_lessons")
    .eq("user_email", userEmail)
    .eq("course_id", curso.dbId)
    .maybeSingle();

  const existing: string[] = (cur?.completed_lessons as string[] | null) ?? [];
  let next: string[];
  if (done) {
    next = existing.includes(lessonId) ? existing : [...existing, lessonId];
  } else {
    next = existing.filter((x) => x !== lessonId);
  }

  const progress = progressFromLessons(curso, next);
  const completedModules = curso.modulos
    .filter((m) => m.aulas.every((a) => next.includes(a.id)))
    .map((m) => m.id);

  const update: Record<string, unknown> = {
    user_email: userEmail,
    course_id: curso.dbId,
    completed_lessons: next,
    completed_modules: completedModules,
    progress,
    completed_at: progress === 100 ? new Date().toISOString().slice(0, 10) : null,
  };

  const { error } = await supabase
    .from("user_enrollment")
    .upsert(update, { onConflict: "user_email,course_id" });
  if (error) return null;
  return { completed: next, progress };
}
