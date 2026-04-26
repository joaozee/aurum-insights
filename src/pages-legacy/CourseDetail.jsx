import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  ArrowLeft, 
  Clock, 
  Users, 
  Play,
  CheckCircle2,
  Star,
  GraduationCap,
  BookOpen,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { trackContentView } from "@/components/recommendations/trackContentView";
import { Card } from "@/components/ui/card";
import RelatedCourses from "@/components/course/RelatedCourses";
import CourseExamButton from "@/components/course/CourseExamButton";

export default function CourseDetail() {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [enrollment, setEnrollment] = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get("id");

  useEffect(() => {
    if (courseId) {
      loadData();
    }
  }, [courseId]);

  const loadData = async () => {
    try {
      const [courseData, userData] = await Promise.all([
        base44.entities.Course.filter({ id: courseId }),
        base44.auth.me()
      ]);
      if (courseData.length > 0) {
        setCourse(courseData[0]);
        // Track view
        if (userData) {
          trackContentView(
            userData.email, 
            "course", 
            courseData[0].id, 
            courseData[0].title,
            courseData[0].category
          );
        }
      }
      setUser(userData);

      // Check enrollment
      if (userData) {
        const enrollments = await base44.entities.UserEnrollment.filter({ 
          user_email: userData.email, 
          course_id: courseId 
        });
        if (enrollments.length > 0) {
          setEnrollment(enrollments[0]);
        }
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
  try {
    await base44.entities.UserEnrollment.create({
      user_email: user.email,
      course_id: course.id,
      progress: 0,
      completed_lessons: [],
      started_at: new Date().toISOString().split("T")[0]
    });
    // Update student count
    await base44.entities.Course.update(course.id, {
      students_count: (course.students_count || 0) + 1
    });
    window.location.href = createPageUrl(`CoursePlayer?id=${course.id}`);
  } catch (e) {
    console.log(e);
  }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-8 w-32 mb-8 bg-gray-800" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Skeleton className="h-80 w-full rounded-2xl mb-6 bg-gray-800" />
              <Skeleton className="h-10 w-3/4 mb-4 bg-gray-800" />
              <Skeleton className="h-6 w-full mb-2 bg-gray-800" />
              <Skeleton className="h-6 w-2/3 bg-gray-800" />
            </div>
            <div>
              <Skeleton className="h-96 w-full rounded-2xl bg-gray-800" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Curso não encontrado</h2>
          <Link to={createPageUrl("Courses")}>
            <Button variant="outline" className="border-gray-800 text-gray-300 hover:bg-gray-800">Voltar para cursos</Button>
          </Link>
        </div>
      </div>
    );
  }

  const totalLessons = course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0;
  const discountPercent = course.original_price && course.original_price > course.price 
    ? Math.round((1 - course.price / course.original_price) * 100)
    : null;

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link to={createPageUrl("Courses")} className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 transition-colors mb-4">
            <ArrowLeft className="h-5 w-5" />
            Voltar para cursos
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Image */}
            <Card className="bg-gray-900 border-gray-800 overflow-hidden">
              <img 
                src={course.thumbnail_url || "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200"}
                alt={course.title}
                className="w-full h-80 object-cover"
              />
            </Card>

            {/* Course Info */}
            <Card className="bg-gray-900 border-gray-800 p-8">
              <div className="flex flex-wrap gap-2 mb-6">
                <Badge className="bg-violet-500/20 text-violet-400 border border-violet-500/30">
                  {course.category === "investimentos" ? "Investimentos" : 
                   course.category === "formacao" ? "Formação" : "Avançado"}
                </Badge>
                <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {course.level === "iniciante" ? "Iniciante" : 
                   course.level === "intermediario" ? "Intermediário" : "Avançado"}
                </Badge>
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">{course.title}</h1>
              <p className="text-gray-300 text-lg mb-8">{course.description}</p>
              
              <div className="flex flex-wrap gap-6 text-gray-400 mb-8">
                {course.duration_hours && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-violet-400" />
                    <span>{course.duration_hours} horas</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-violet-400" />
                  <span>{totalLessons} aulas</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-violet-400" />
                  <span>{course.students_count || 0} alunos</span>
                </div>
              </div>

              {/* Benefits */}
              {course.benefits && course.benefits.length > 0 && (
                <div>
                  <h3 className="font-semibold text-white mb-4">O que você vai aprender</h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {course.benefits.map((benefit, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-300">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Curriculum */}
            {course.modules && course.modules.length > 0 && (
              <Card className="bg-gray-900 border-gray-800 p-8">
                <h3 className="text-2xl font-semibold text-white mb-6">Conteúdo do Curso</h3>
                <Accordion type="single" collapsible className="space-y-3">
                  {course.modules.map((module, mIndex) => (
                    <AccordionItem 
                      key={mIndex} 
                      value={`module-${mIndex}`}
                      className="border border-gray-800 rounded-xl px-6"
                    >
                      <AccordionTrigger className="py-4 hover:no-underline">
                        <div className="flex items-center gap-3 text-left">
                          <div className="h-8 w-8 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-400 font-semibold text-sm">
                            {mIndex + 1}
                          </div>
                          <div>
                            <p className="font-medium text-white">{module.title}</p>
                            <p className="text-sm text-gray-400">{module.lessons?.length || 0} aulas</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 pb-4">
                          {module.lessons?.map((lesson, lIndex) => (
                            <div 
                              key={lIndex}
                              className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                {enrollment ? (
                                  <Play className="h-4 w-4 text-violet-400" />
                                ) : (
                                  <Lock className="h-4 w-4 text-gray-500" />
                                )}
                                <span className="text-gray-300">{lesson.title}</span>
                              </div>
                              {lesson.duration_minutes && (
                                <span className="text-sm text-gray-400">
                                  {lesson.duration_minutes} min
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:sticky lg:top-8 h-fit space-y-6">
            <Card className="bg-gray-900 border-gray-800 p-8">
              {enrollment ? (
                <>
                  <div className="text-center mb-6">
                    <div className="h-16 w-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                    </div>
                    <h3 className="font-semibold text-white">Você está matriculado!</h3>
                    <p className="text-sm text-gray-400 mt-1">Continue de onde parou</p>
                  </div>
                  <div className="space-y-3">
                    <Link to={createPageUrl(`CoursePlayer?id=${course.id}`)}>
                      <Button className="w-full bg-violet-600 hover:bg-violet-700 h-12 text-base">
                        <Play className="h-5 w-5 mr-2" />
                        Continuar Curso
                      </Button>
                    </Link>
                    <CourseExamButton courseId={course.id} />
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2 mb-2">
                      {course.original_price && course.original_price > course.price && (
                        <span className="text-lg text-gray-500 line-through">
                          R$ {course.original_price?.toFixed(2)}
                        </span>
                      )}
                      <span className="text-4xl font-bold text-white">
                        R$ {course.price?.toFixed(2)}
                      </span>
                    </div>
                    {discountPercent && (
                      <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {discountPercent}% de desconto
                      </Badge>
                    )}
                  </div>
                  <Button 
                    className="w-full bg-violet-600 hover:bg-violet-700 h-12 text-base mb-4"
                    onClick={handleEnroll}
                  >
                    <GraduationCap className="h-5 w-5 mr-2" />
                    Matricular-se Agora
                  </Button>
                  <p className="text-xs text-gray-500 text-center">
                    Clique para se matricular e começar
                  </p>
                  <p className="text-sm text-gray-400 text-center">
                    Acesso vitalício • Certificado incluso
                  </p>
                </>
              )}
            </Card>

            {/* Related Courses */}
            <Card className="bg-gray-900 border-gray-800 p-8">
              <RelatedCourses currentCourse={course} courseType="paid" />
            </Card>
          </div>
        </div>


      </div>
    </div>
  );
}