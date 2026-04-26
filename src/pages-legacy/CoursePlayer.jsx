import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, ChevronRight, PlayCircle, CheckCircle2, Clock, FileText, Star, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import CoursePlayerHeader from "@/components/course/CoursePlayerHeader";
import CoursePlayerVideo from "@/components/course/CoursePlayerVideo";
import CourseCurriculum from "@/components/course/CourseCurriculum";
import CertificateDownload from "@/components/certificates/CertificateDownload";
import { useGamificationTracker } from "@/components/gamification/GamificationTracker";
import VisualProgressTracker from "@/components/course/VisualProgressTracker";
import ModuleQuizDialog from "@/components/course/ModuleQuizDialog";
import { toast } from "sonner";

export default function CoursePlayer() {
  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [exam, setExam] = useState(null);
  const [examPassed, setExamPassed] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const { awardPoints } = useGamificationTracker(user?.email);

  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get("id");

  useEffect(() => {
    if (courseId) {
      loadData();
    }
  }, [courseId]);

  useEffect(() => {
    if (user && courseId) {
      checkFavorite();
    }
  }, [user, courseId, currentModuleIndex, currentLessonIndex]);

  const checkFavorite = async () => {
    try {
      const favorites = await base44.entities.FavoriteLesson.filter({
        user_email: user.email,
        course_id: courseId,
        module_index: currentModuleIndex,
        lesson_index: currentLessonIndex
      });
      setIsFavorite(favorites.length > 0);
    } catch (e) {
      console.log(e);
    }
  };

  const loadData = async () => {
    try {
      const [courseData, userData] = await Promise.all([
        base44.entities.Course.filter({ id: courseId }),
        base44.auth.me()
      ]);

      if (courseData.length > 0) {
        setCourse(courseData[0]);
      }
      
      setUser(userData);

      if (userData) {
        const enrollments = await base44.entities.UserEnrollment.filter({
          user_email: userData.email,
          course_id: courseId
        });
        if (enrollments.length > 0) {
          setEnrollment(enrollments[0]);
        }
      }

      // Load exam for this course
      const exams = await base44.entities.CourseExam.filter({ course_id: courseId });
      if (exams.length > 0) {
        setExam(exams[0]);
        
        // Check if user passed the exam
        if (userData) {
          const attempts = await base44.entities.ExamAttempt.filter({
            user_email: userData.email,
            exam_id: exams[0].id,
            passed: true
          });
          setExamPassed(attempts.length > 0);
        }
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLessonClick = async (moduleIndex, lessonIndex) => {
    setCurrentModuleIndex(moduleIndex);
    setCurrentLessonIndex(lessonIndex);

    if (enrollment && user) {
      const lessonId = `${moduleIndex}-${lessonIndex}`;
      const completedLessons = enrollment.completed_lessons || [];
      
      if (!completedLessons.includes(lessonId)) {
        const newCompleted = [...completedLessons, lessonId];
        const totalLessons = course.modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);
        const progress = Math.round((newCompleted.length / totalLessons) * 100);

        // Check if module is completed
        const module = course.modules[moduleIndex];
        const moduleCompleted = module.lessons?.every((_, i) => 
          newCompleted.includes(`${moduleIndex}-${i}`)
        );

        const completedModules = enrollment.completed_modules || [];
        const newCompletedModules = moduleCompleted && !completedModules.includes(moduleIndex)
          ? [...completedModules, moduleIndex]
          : completedModules;

        await base44.entities.UserEnrollment.update(enrollment.id, {
          completed_lessons: newCompleted,
          completed_modules: newCompletedModules,
          progress: progress
        });

        setEnrollment({
          ...enrollment,
          completed_lessons: newCompleted,
          completed_modules: newCompletedModules,
          progress: progress
        });

        // Award points
        await awardPoints('lesson_completed', 10);
        if (progress === 100) {
          await awardPoints('course_completed', 100);
        }

        // Check for module quiz
        if (moduleCompleted && !completedModules.includes(moduleIndex)) {
          checkModuleQuiz(moduleIndex);
        }
      }
    }
  };

  const checkModuleQuiz = async (moduleIndex) => {
    try {
      const quizzes = await base44.entities.ModuleQuiz.filter({
        course_id: courseId,
        module_index: moduleIndex
      });

      if (quizzes.length > 0) {
        setCurrentQuiz(quizzes[0]);
        setShowQuiz(true);
      }
    } catch (e) {
      console.log(e);
    }
  };

  const handleQuizPass = async () => {
    toast.success("Quiz aprovado! Continue para o próximo módulo.");
    await awardPoints('quiz_completed', 20);
  };

  const toggleFavorite = async () => {
    try {
      if (isFavorite) {
        const favorites = await base44.entities.FavoriteLesson.filter({
          user_email: user.email,
          course_id: courseId,
          module_index: currentModuleIndex,
          lesson_index: currentLessonIndex
        });
        if (favorites.length > 0) {
          await base44.entities.FavoriteLesson.delete(favorites[0].id);
        }
        setIsFavorite(false);
        toast.success("Removido dos favoritos");
      } else {
        await base44.entities.FavoriteLesson.create({
          user_email: user.email,
          course_id: courseId,
          module_index: currentModuleIndex,
          lesson_index: currentLessonIndex,
          lesson_title: currentLesson?.title,
          course_title: course.title
        });
        setIsFavorite(true);
        toast.success("Adicionado aos favoritos!");
      }
    } catch (e) {
      console.log(e);
      toast.error("Erro ao atualizar favoritos");
    }
  };

  const handleNextLesson = () => {
    const module = course.modules[currentModuleIndex];
    if (currentLessonIndex < (module.lessons?.length || 0) - 1) {
      handleLessonClick(currentModuleIndex, currentLessonIndex + 1);
    } else if (currentModuleIndex < course.modules.length - 1) {
      handleLessonClick(currentModuleIndex + 1, 0);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Skeleton className="h-12 w-32 mb-8 bg-gray-800" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Skeleton className="h-96 w-full rounded-2xl mb-6 bg-gray-800" />
              <Skeleton className="h-10 w-3/4 mb-4 bg-gray-800" />
            </div>
            <div>
              <Skeleton className="h-96 w-full rounded-2xl bg-gray-800" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!course || !enrollment) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Acesso não permitido</h2>
          <p className="text-gray-400 mb-6">Você precisa estar matriculado neste curso</p>
          <Link to={createPageUrl("Courses")}>
            <Button className="bg-violet-600 hover:bg-violet-700">Voltar para cursos</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentModule = course.modules?.[currentModuleIndex];
  const currentLesson = currentModule?.lessons?.[currentLessonIndex];

  return (
    <div className="min-h-screen bg-gray-950">
      <CoursePlayerHeader course={course} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to={createPageUrl("MyCourses")} className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 mb-8">
          <ArrowLeft className="h-5 w-5" />
          Meus Cursos
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <CoursePlayerVideo lesson={currentLesson} />

            {/* Lesson Info */}
            <Card className="bg-gray-900 border-gray-800 p-8">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-violet-400 font-medium">
                    Módulo {currentModuleIndex + 1} • Aula {currentLessonIndex + 1}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleFavorite}
                    className={isFavorite ? "text-amber-400 hover:text-amber-300" : "text-gray-400 hover:text-amber-400"}
                  >
                    <Star className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
                  </Button>
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">{currentLesson?.title}</h2>
                {currentLesson?.duration_minutes && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Clock className="h-5 w-5" />
                    <span>{currentLesson.duration_minutes} minutos</span>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="flex gap-4 mt-8 pt-8 border-t border-gray-800">
                {currentModuleIndex > 0 || currentLessonIndex > 0 ? (
                  <Button
                    variant="outline"
                    className="border-gray-700 text-gray-300 hover:bg-gray-800"
                    onClick={() => {
                      if (currentLessonIndex > 0) {
                        handleLessonClick(currentModuleIndex, currentLessonIndex - 1);
                      } else {
                        const prevModule = course.modules[currentModuleIndex - 1];
                        handleLessonClick(
                          currentModuleIndex - 1,
                          (prevModule.lessons?.length || 1) - 1
                        );
                      }
                    }}
                  >
                    ← Aula Anterior
                  </Button>
                ) : null}

                {currentModuleIndex < course.modules.length - 1 ||
                currentLessonIndex < (currentModule?.lessons?.length || 0) - 1 ? (
                  <Button
                    className="bg-violet-600 hover:bg-violet-700 ml-auto"
                    onClick={handleNextLesson}
                  >
                    Próxima Aula →
                  </Button>
                ) : (
                  <div className="flex flex-col gap-3 ml-auto w-full">
                    {exam && !examPassed && (
                      <Link to={createPageUrl(`CourseExam?id=${exam.id}&courseId=${course.id}`)} className="w-full">
                        <Button className="w-full bg-violet-600 hover:bg-violet-700">
                          <FileText className="h-5 w-5 mr-2" />
                          Fazer Prova Final
                        </Button>
                      </Link>
                    )}
                    
                    {exam && examPassed && (
                      <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/30 text-center mb-3">
                        <p className="text-violet-400 font-semibold text-sm">
                          ✓ Prova aprovada!
                        </p>
                      </div>
                    )}
                    
                    <div className="flex gap-3">
                      {(!exam || examPassed) && (
                        <CertificateDownload 
                          userName={user?.full_name || "Usuário"}
                          courseTitle={course.title}
                          completionDate={new Date().toLocaleDateString("pt-BR")}
                        />
                      )}
                      <Button
                        className="bg-gray-700 hover:bg-gray-600"
                        onClick={() => window.location.href = createPageUrl("MyCourses")}
                      >
                        <CheckCircle2 className="h-5 w-5 mr-2" />
                        Meus Cursos
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:sticky lg:top-8 h-fit space-y-6">
            <VisualProgressTracker course={course} enrollment={enrollment} />
            <CourseCurriculum
              course={course}
              currentModuleIndex={currentModuleIndex}
              currentLessonIndex={currentLessonIndex}
              onLessonClick={handleLessonClick}
              completedLessons={enrollment.completed_lessons || []}
            />
          </div>
        </div>
      </div>

      {/* Module Quiz Dialog */}
      <ModuleQuizDialog
        quiz={currentQuiz}
        open={showQuiz}
        onClose={() => setShowQuiz(false)}
        userEmail={user?.email}
        courseId={courseId}
        moduleIndex={currentModuleIndex}
        onPass={handleQuizPass}
      />
    </div>
  );
}