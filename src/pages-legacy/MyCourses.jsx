import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  BookOpen, 
  Play, 
  Clock,
  Trophy,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import CertificateDownload from "@/components/certificates/CertificateDownload";

export default function MyCourses() {
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState({});
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      const enrollmentData = await base44.entities.UserEnrollment.filter({ 
        user_email: userData.email 
      });
      setEnrollments(enrollmentData);

      // Load course details
      const courseIds = enrollmentData.map(e => e.course_id);
      const courseData = await base44.entities.Course.list();
      const coursesMap = {};
      courseData.forEach(c => {
        if (courseIds.includes(c.id)) {
          coursesMap[c.id] = c;
        }
      });
      setCourses(coursesMap);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Skeleton className="h-10 w-48 mb-8 bg-gray-800" />
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-2xl bg-gray-800" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Meus Cursos</h1>
          <p className="text-gray-400">Acompanhe seu progresso e continue aprendendo</p>
        </div>

        {enrollments.length > 0 ? (
          <div className="space-y-6">
            {enrollments.map((enrollment) => {
              const course = courses[enrollment.course_id];
              if (!course) return null;

              const totalLessons = course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0;
              const completedLessons = enrollment.completed_lessons?.length || 0;
              const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

              return (
                <div 
                  key={enrollment.id}
                  className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden hover:border-violet-500/50 transition-all duration-300"
                >
                  <div className="flex flex-col sm:flex-row">
                    <div className="sm:w-56 h-40 sm:h-auto flex-shrink-0">
                      <img 
                        src={course.thumbnail_url || "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400"}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="flex-1 p-8">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
                        <div className="flex-1">
                          <h3 className="font-bold text-white text-xl mb-3">{course.title}</h3>
                          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400 mb-6">
                            <span className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-violet-400" />
                              {completedLessons}/{totalLessons} aulas
                            </span>
                            {course.duration_hours && (
                              <span className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-violet-400" />
                                {course.duration_hours}h
                              </span>
                            )}
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-400">Progresso</span>
                              <span className="font-semibold text-white">{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2 bg-gray-800" />
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                          {progress === 100 ? (
                            <CertificateDownload 
                              userName={user?.full_name || "Usuário"} 
                              courseTitle={course.title} 
                              completionDate={new Date().toLocaleDateString("pt-BR")}
                            />
                          ) : (
                            <Link to={createPageUrl(`CoursePlayer?id=${enrollment.course_id}&enrollment=${enrollment.id}`)}>
                              <Button className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold whitespace-nowrap">
                                {progress === 0 ? (
                                  <>
                                    <Play className="h-4 w-4 mr-2" />
                                    Começar
                                  </>
                                ) : (
                                  <>
                                    <Play className="h-4 w-4 mr-2" />
                                    Continuar
                                  </>
                                )}
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState 
            icon={BookOpen}
            title="Você ainda não tem cursos"
            description="Explore nosso catálogo e comece sua jornada de aprendizado"
            action={
              <Link to={createPageUrl("Courses")}>
                <Button className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold">
                  Explorar Cursos
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
}