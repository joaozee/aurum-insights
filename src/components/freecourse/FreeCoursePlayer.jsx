import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { useGamificationTracker } from "@/components/gamification/GamificationTracker";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle2, PlayCircle, RotateCcw, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import FreeCourseLessonViewer from "./FreeCourseLessonViewer";
import CertificateDownload from "@/components/certificates/CertificateDownload";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function FreeCoursePlayer({ course, userEmail }) {
  const [currentModule, setCurrentModule] = useState(0);
  const [currentLesson, setCurrentLesson] = useState(0);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [exam, setExam] = useState(null);
  const [examPassed, setExamPassed] = useState(false);
  const { awardPoints } = useGamificationTracker(userEmail);

  // Load user progress
  useEffect(() => {
    if (userEmail) {
      loadUserProgress();
      loadUser();
    } else {
      setLoading(false);
    }
  }, [userEmail, course?.id]);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      
      // Load exam for this course
      const exams = await base44.entities.CourseExam.filter({ course_id: course.id });
      if (exams.length > 0) {
        setExam(exams[0]);
        
        // Check if user passed the exam
        const attempts = await base44.entities.ExamAttempt.filter({
          user_email: userData.email,
          exam_id: exams[0].id,
          passed: true
        });
        setExamPassed(attempts.length > 0);
      }
    } catch (e) {
      console.log(e);
    }
  };

  const loadUserProgress = async () => {
    try {
      const profiles = await base44.entities.UserProfile.filter({
        user_email: userEmail
      });
      if (profiles.length > 0) {
        const profile = profiles[0];
        setUserProfile(profile);

        // Load course progress
        if (profile.course_progress?.[course.id]) {
          const courseProgress = profile.course_progress[course.id];
          setCompletedLessons(courseProgress.completedLessons || []);
        }

        // Resume from last viewed lesson
        if (profile.last_viewed_lesson?.course_id === course.id) {
          setCurrentModule(profile.last_viewed_lesson.module_index || 0);
          setCurrentLesson(profile.last_viewed_lesson.lesson_index || 0);
        }
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const saveProgress = async (newCompleted, moduleIdx, lessonIdx) => {
    if (!userEmail || !userProfile) return;

    try {
      const updatedProgress = {
        ...userProfile.course_progress,
        [course.id]: {
          completedLessons: newCompleted
        }
      };

      await base44.entities.UserProfile.update(userProfile.id, {
        course_progress: updatedProgress,
        last_viewed_lesson: {
          course_id: course.id,
          module_index: moduleIdx,
          lesson_index: lessonIdx,
          viewed_at: new Date().toISOString()
        }
      });
    } catch (e) {
      console.log(e);
    }
  };

  const totalLessons = course.modules?.reduce(
    (acc, m) => acc + (m.lessons?.length || 0),
    0
  ) || 0;

  const progress = totalLessons > 0 ? Math.round((completedLessons.length / totalLessons) * 100) : 0;
  const currentLesonData = course.modules?.[currentModule]?.lessons?.[currentLesson];
  const lessonId = `${currentModule}-${currentLesson}`;
  const isLessonCompleted = completedLessons.includes(lessonId);

  const handleLessonClick = (moduleIndex, lessonIndex) => {
    setCurrentModule(moduleIndex);
    setCurrentLesson(lessonIndex);
    saveProgress(completedLessons, moduleIndex, lessonIndex);
  };

  const handleCompleteLesson = async () => {
    if (!completedLessons.includes(lessonId)) {
      const newCompleted = [...completedLessons, lessonId];
      setCompletedLessons(newCompleted);
      saveProgress(newCompleted, currentModule, currentLesson);
      
      // Award points for completing lesson
      await awardPoints('lesson_completed', 10);
      
      // Check if course is complete and award bonus
      if (newCompleted.length === totalLessons) {
        await awardPoints('course_completed', 100);
      }
    }
  };

  const handleResetProgress = async () => {
    if (confirm("Tem certeza que deseja resetar o progresso?")) {
      setCompletedLessons([]);
      setCurrentModule(0);
      setCurrentLesson(0);
      if (userProfile) {
        await saveProgress([], 0, 0);
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Viewer */}
      <div className="lg:col-span-2">
        <FreeCourseLessonViewer
          lesson={currentLesonData}
          onComplete={handleCompleteLesson}
        />
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Progress */}
        <Card className="bg-gray-900 border-gray-800 p-6">
          <div className="mb-6">
            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="text-white font-semibold text-sm">Progresso do Curso</p>
                <p className="text-gray-400 text-xs">
                  {completedLessons.length} de {totalLessons} aulas
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-violet-500/20 flex items-center justify-center border border-violet-500/30">
                <span className="text-xl font-bold text-violet-400">
                  {progress}%
                </span>
              </div>
            </div>
            <Progress value={progress} className="h-3 bg-gray-800" />
            
            {/* Segmented Progress Bar */}
            <div className="mt-3 flex gap-1">
              {[...Array(totalLessons)].map((_, idx) => (
                <div
                  key={idx}
                  className={`flex-1 h-1 rounded-full transition-colors ${
                    completedLessons.includes(`${Math.floor(idx / course.modules[0]?.lessons?.length)}-${idx % (course.modules[0]?.lessons?.length || 1)}`)
                      ? "bg-emerald-500"
                      : "bg-gray-800"
                  }`}
                />
              ))}
            </div>
          </div>

          {progress === 100 && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center">
                <p className="text-emerald-400 font-semibold text-sm">
                  ✓ Curso completado!
                </p>
              </div>
              
              {exam && !examPassed && (
                <Link to={createPageUrl(`CourseExam?id=${exam.id}&courseId=${course.id}`)}>
                  <Button className="w-full bg-violet-600 hover:bg-violet-700">
                    <FileText className="h-4 w-4 mr-2" />
                    Fazer Prova Final
                  </Button>
                </Link>
              )}
              
              {exam && examPassed && (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/30 text-center">
                    <p className="text-violet-400 font-semibold text-sm">
                      ✓ Prova aprovada!
                    </p>
                  </div>
                  <CertificateDownload 
                    userName={user?.full_name || "Usuário"}
                    courseTitle={course.title}
                    completionDate={new Date().toLocaleDateString("pt-BR")}
                  />
                </div>
              )}
              
              {!exam && (
                <CertificateDownload 
                  userName={user?.full_name || "Usuário"}
                  courseTitle={course.title}
                  completionDate={new Date().toLocaleDateString("pt-BR")}
                />
              )}
            </div>
          )}

          {progress > 0 && progress < 100 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetProgress}
              className="w-full border-gray-700 text-gray-400 hover:bg-gray-800 mt-4"
            >
              <RotateCcw className="h-3 w-3 mr-2" />
              Resetar Progresso
            </Button>
          )}
        </Card>

        {/* Curriculum */}
        <Card className="bg-gray-900 border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Currículo</h3>
          <Accordion
            type="single"
            collapsible
            defaultValue={`module-${currentModule}`}
            className="space-y-2"
          >
            {course.modules?.map((module, moduleIndex) => (
              <AccordionItem
                key={moduleIndex}
                value={`module-${moduleIndex}`}
                className="border border-gray-800 rounded-lg px-4"
              >
                <AccordionTrigger className="py-3 hover:no-underline group">
                  <div className="flex items-center gap-3 text-left flex-1">
                    <div className="h-7 w-7 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 font-medium text-sm flex-shrink-0">
                      {moduleIndex + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white group-hover:text-violet-400 transition-colors text-sm">
                        {module.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {module.lessons?.length || 0} aulas
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pb-2">
                    {module.lessons?.map((lesson, lessonIndex) => {
                      const id = `${moduleIndex}-${lessonIndex}`;
                      const isCompleted = completedLessons.includes(id);
                      const isCurrent =
                        moduleIndex === currentModule &&
                        lessonIndex === currentLesson;

                      return (
                        <button
                          key={lessonIndex}
                          onClick={() => handleLessonClick(moduleIndex, lessonIndex)}
                          className={`w-full flex items-start gap-3 p-3 rounded-lg transition-colors text-left text-sm ${
                            isCurrent
                              ? "bg-violet-500/20 border border-violet-500/50"
                              : "hover:bg-gray-800/50"
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                          ) : (
                            <PlayCircle className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p
                              className={`font-medium truncate ${
                                isCurrent ? "text-violet-400" : "text-gray-300"
                              }`}
                            >
                              {lesson.title}
                            </p>
                            {lesson.duration_minutes && (
                              <p className="text-xs text-gray-500">
                                {lesson.duration_minutes} min
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>
      </div>
    </div>
  );
}