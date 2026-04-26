import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, GraduationCap, Clock, Users, BookOpen, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import FreeCoursePlayer from "@/components/freecourse/FreeCoursePlayer";
import RelatedCourses from "@/components/course/RelatedCourses";
import CourseReviews from "@/components/course/CourseReviews";

export default function FreeCourseDetail() {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState(false);
  const [user, setUser] = useState(null);
  const [userProgress, setUserProgress] = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get("id");

  useEffect(() => {
    const init = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        if (userData && courseId) {
          await loadCourseAndProgress(userData.email);
        }
      } catch (e) {
        console.log(e);
        if (courseId) {
          await loadCourse();
        }
      }
    };
    init();
  }, [courseId]);

  const loadCourse = async () => {
    try {
      const courseData = await base44.entities.Course.filter({ id: courseId });
      if (courseData.length > 0) {
        setCourse(courseData[0]);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const loadCourseAndProgress = async (email) => {
    try {
      const [courseData, profiles] = await Promise.all([
        base44.entities.Course.filter({ id: courseId }),
        base44.entities.UserProfile.filter({ user_email: email })
      ]);

      if (courseData.length > 0) {
        setCourse(courseData[0]);
      }

      if (profiles.length > 0) {
        const progress = profiles[0].course_progress?.[courseId];
        setUserProgress({
          ...profiles[0],
          courseProgress: progress
        });
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-8 w-32 mb-8 bg-gray-800" />
          <Skeleton className="h-96 w-full rounded-2xl bg-gray-800" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Curso não encontrado
          </h2>
          <Link to={createPageUrl("Courses")}>
            <Button className="bg-violet-600 hover:bg-violet-700 text-white">
              Voltar para Cursos
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (viewing) {
    const totalLessons = course.modules?.reduce(
      (acc, m) => acc + (m.lessons?.length || 0),
      0
    ) || 0;
    const completedLessons = userProgress?.courseProgress?.completedLessons?.length || 0;
    const courseProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    return (
      <div className="min-h-screen bg-gray-950">
        {/* Course Header with Progress */}
        <div className="bg-gradient-to-r from-gray-900 to-violet-950/30 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setViewing(false)}
                className="inline-flex items-center gap-2 text-gray-400 hover:text-violet-400 group transition-colors"
              >
                <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                <span>Voltar</span>
              </button>
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">{course.title}</h1>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">
                  {completedLessons} de {totalLessons} aulas completadas
                </span>
                <span className="font-semibold text-violet-400">{courseProgress}%</span>
              </div>
              <Progress value={courseProgress} className="h-2 bg-gray-800" />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <FreeCoursePlayer course={course} userEmail={user?.email} />
        </div>
      </div>
    );
  }

  const totalLessons = course.modules?.reduce(
    (acc, m) => acc + (m.lessons?.length || 0),
    0
  ) || 0;

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Hero */}
      <div className="bg-gradient-to-br from-gray-900 via-violet-950/50 to-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            to={createPageUrl("Courses")}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-violet-400 mb-6 group transition-colors"
          >
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            <span>Voltar aos Cursos</span>
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Content */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 text-emerald-400 mb-4">
                <GraduationCap className="h-5 w-5" />
                <span className="text-sm font-medium">Curso Gratuito</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                {course.title}
              </h1>
              <p className="text-lg text-gray-300 mb-6 max-w-xl">
                {course.description}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                {totalLessons > 0 && (
                  <span className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-emerald-400" />
                    {totalLessons} aulas
                  </span>
                )}
                {course.duration_hours && (
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-emerald-400" />
                    {course.duration_hours}h
                  </span>
                )}
                {course.students_count && (
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-emerald-400" />
                    {course.students_count} alunos
                  </span>
                )}
              </div>
            </div>

            {/* CTA Card */}
            <div>
              <Card className="bg-gray-900 border-gray-800 p-6 sticky top-20">
                <img
                  src={
                    course.thumbnail_url ||
                    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400"
                  }
                  alt={course.title}
                  className="w-full h-40 object-cover rounded-lg mb-6"
                />

                <div className="mb-6 space-y-4">
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-0">
                    100% Gratuito
                  </Badge>
                  
                  {userProgress?.courseProgress && (
                    <div className="bg-violet-500/10 border border-violet-500/30 rounded-lg p-4">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-gray-300 font-medium">Progresso</span>
                        <span className="text-violet-400 font-semibold">
                          {userProgress.courseProgress.completedLessons?.length || 0}/{totalLessons}
                        </span>
                      </div>
                      <Progress 
                        value={totalLessons > 0 ? Math.round((userProgress.courseProgress.completedLessons?.length || 0) / totalLessons * 100) : 0} 
                        className="h-2 bg-gray-800" 
                      />
                    </div>
                  )}

                  <Button
                    onClick={() => setViewing(true)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-6 rounded-lg flex items-center justify-center gap-2"
                  >
                    <Zap className="h-4 w-4" />
                    {userProgress?.courseProgress ? "Continuar Curso" : "Começar Agora"}
                  </Button>
                </div>

                {/* Related Courses */}
                <div className="mt-6 pt-6 border-t border-gray-800">
                  <RelatedCourses currentCourse={course} courseType="free" />
                </div>

                {course.benefits && course.benefits.length > 0 && (
                  <div className="border-t border-gray-800 pt-6">
                    <h4 className="font-semibold text-white mb-3 text-sm">
                      O que você vai aprender
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-300">
                      {course.benefits.slice(0, 4).map((benefit, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span className="text-emerald-400 flex-shrink-0">✓</span>
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Curriculum Preview */}
      {course.modules && course.modules.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl font-bold text-white mb-6">Currículo</h2>
          <div className="space-y-4">
            {course.modules.map((module, idx) => (
              <Card
                key={idx}
                className="bg-gray-900 border-gray-800 p-6 hover:border-emerald-500/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-white mb-2">
                      Módulo {idx + 1}: {module.title}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {module.lessons?.length || 0} aulas
                    </p>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-0">
                    {module.lessons?.length || 0} aulas
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Reviews Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <CourseReviews 
          courseId={course.id}
          userEmail={user?.email}
          userName={user?.full_name}
          isAdmin={user?.role === "admin"}
        />
      </div>
    </div>
  );
}