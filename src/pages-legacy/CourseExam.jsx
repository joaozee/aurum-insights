import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle,
  ArrowRight,
  RotateCcw,
  Trophy
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function CourseExam() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const examId = searchParams.get("id");

  const [exam, setExam] = useState(null);
  const [course, setCourse] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [enrollment, setEnrollment] = useState(null);
  const [canTakeExam, setCanTakeExam] = useState(false);

  useEffect(() => {
    loadData();
  }, [examId]);

  useEffect(() => {
    let interval;
    if (examStarted && !showResults) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 60000); // Update every minute
    }
    return () => clearInterval(interval);
  }, [examStarted, showResults]);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      const examData = await base44.entities.CourseExam.list();
      const foundExam = examData.find(e => e.id === examId);
      setExam(foundExam);

      if (foundExam) {
        const courseData = await base44.entities.Course.list();
        const foundCourse = courseData.find(c => c.id === foundExam.course_id);
        setCourse(foundCourse);

        // Check enrollment and progress
        const enrollments = await base44.entities.UserEnrollment.filter({
          user_email: userData.email,
          course_id: foundExam.course_id
        });
        
        if (enrollments.length > 0) {
          setEnrollment(enrollments[0]);
          
          // Calculate total lessons in course
          let totalLessons = 0;
          if (foundCourse?.modules) {
            foundCourse.modules.forEach(module => {
              totalLessons += module.lessons?.length || 0;
            });
          }
          
          // Check if all lessons are completed
          const completedCount = enrollments[0].completed_lessons?.length || 0;
          setCanTakeExam(completedCount >= totalLessons && totalLessons > 0);
        }

        const attemptsData = await base44.entities.ExamAttempt.filter({
          user_email: userData.email,
          exam_id: examId
        });
        setAttempts(attemptsData);
        setSelectedAnswers(new Array(foundExam.questions.length).fill(null));
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = () => {
    setExamStarted(true);
    setTimeElapsed(0);
  };

  const handleAnswerSelect = (answerIndex) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    try {
      let correctCount = 0;
      exam.questions.forEach((q, index) => {
        const userAnswer = selectedAnswers[index];
        const correctAnswer = Number(q.correct_answer);
        
        if (userAnswer === correctAnswer) {
          correctCount++;
        }
      });

      const score = Math.round((correctCount / exam.questions.length) * 100);
      const passed = score >= exam.passing_score;

      await base44.entities.ExamAttempt.create({
        user_email: user.email,
        exam_id: exam.id,
        course_id: exam.course_id,
        answers: selectedAnswers,
        score,
        passed,
        time_taken_minutes: timeElapsed,
        attempt_number: attempts.length + 1
      });

      setShowResults(true);
      await loadData();
    } catch (e) {
      console.error(e);
      alert('Erro ao enviar prova');
    }
  };

  const handleRetry = () => {
    setExamStarted(false);
    setShowResults(false);
    setCurrentQuestion(0);
    setSelectedAnswers(new Array(exam.questions.length).fill(null));
    setTimeElapsed(0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Prova não encontrada</h2>
          <Link to={createPageUrl("Courses")}>
            <Button>Voltar aos Cursos</Button>
          </Link>
        </div>
      </div>
    );
  }

  const lastAttempt = attempts[attempts.length - 1];
  const bestScore = Math.max(...attempts.map(a => a.score), 0);

  // Results view
  if (showResults) {
    let correctCount = 0;
    exam.questions.forEach((q, index) => {
      const userAnswer = selectedAnswers[index];
      const correctAnswer = Number(q.correct_answer);
      if (userAnswer === correctAnswer) {
        correctCount++;
      }
    });
    const score = Math.round((correctCount / exam.questions.length) * 100);
    const passed = score >= exam.passing_score;

    return (
      <div className="min-h-screen bg-gray-950 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="bg-gray-900 border-gray-800 p-8 text-center">
            <div className={`h-20 w-20 mx-auto mb-6 rounded-full flex items-center justify-center ${passed ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              {passed ? (
                <Trophy className="h-10 w-10 text-green-400" />
              ) : (
                <XCircle className="h-10 w-10 text-red-400" />
              )}
            </div>

            <h1 className="text-3xl font-bold text-white mb-2">
              {passed ? 'Parabéns! Você passou!' : 'Não foi dessa vez'}
            </h1>
            <p className="text-gray-400 mb-8">
              {passed ? 'Você atingiu a nota mínima necessária' : 'Continue estudando e tente novamente'}
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-3xl font-bold text-violet-400">{score}%</div>
                <div className="text-sm text-gray-400">Sua Nota</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-3xl font-bold text-gray-300">{exam.passing_score}%</div>
                <div className="text-sm text-gray-400">Nota Mínima</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-3xl font-bold text-gray-300">{correctCount}/{exam.questions.length}</div>
                <div className="text-sm text-gray-400">Acertos</div>
              </div>
            </div>

            <div className="space-y-4 mb-8 text-left">
              {exam.questions.map((q, index) => {
                const userAnswer = selectedAnswers[index];
                const correctAnswer = Number(q.correct_answer);
                const isCorrect = userAnswer === correctAnswer;

                return (
                  <div key={index} className="bg-gray-800/30 rounded-lg p-4">
                    <div className="flex items-start gap-3 mb-2">
                      {isCorrect ? (
                        <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="text-white font-medium mb-2">{index + 1}. {q.question}</p>
                        <p className="text-sm text-gray-400">
                          Sua resposta: <span className={isCorrect ? 'text-green-400' : 'text-red-400'}>
                            {q.options[userAnswer]}
                          </span>
                        </p>
                        {!isCorrect && (
                          <p className="text-sm text-green-400">
                            Resposta correta: {q.options[correctAnswer]}
                          </p>
                        )}
                        {q.explanation && (
                          <p className="text-sm text-gray-500 mt-2 italic">{q.explanation}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-4 justify-center">
              {!passed && (
                <Button onClick={handleRetry} className="bg-violet-600 hover:bg-violet-700">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Tentar Novamente
                </Button>
              )}
              <Link to={createPageUrl(`CourseDetail?id=${course?.id}`)}>
                <Button variant="outline" className="border-gray-700 text-gray-300">
                  Voltar ao Curso
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Exam not started - intro screen
  if (!examStarted) {
    return (
      <div className="min-h-screen bg-gray-950 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="bg-gray-900 border-gray-800 p-8">
            <h1 className="text-3xl font-bold text-white mb-2">{exam.title}</h1>
            <p className="text-gray-400 mb-6">{course?.title}</p>

            {exam.description && (
              <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
                <p className="text-gray-300">{exam.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-gray-800/30 rounded-lg p-4">
                <div className="text-2xl font-bold text-white mb-1">{exam.questions.length}</div>
                <div className="text-sm text-gray-400">Questões</div>
              </div>
              <div className="bg-gray-800/30 rounded-lg p-4">
                <div className="text-2xl font-bold text-white mb-1">{exam.passing_score}%</div>
                <div className="text-sm text-gray-400">Nota Mínima</div>
              </div>
              {exam.time_limit_minutes && (
                <div className="bg-gray-800/30 rounded-lg p-4">
                  <div className="text-2xl font-bold text-white mb-1">{exam.time_limit_minutes}</div>
                  <div className="text-sm text-gray-400">Minutos</div>
                </div>
              )}
            </div>

            {attempts.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">Suas Tentativas</h3>
                <div className="space-y-2">
                  {attempts.map((attempt, index) => (
                    <div key={attempt.id} className="flex items-center justify-between bg-gray-800/30 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <Badge className={attempt.passed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                          Tentativa {attempt.attempt_number}
                        </Badge>
                        <span className="text-white font-medium">{attempt.score}%</span>
                      </div>
                      {attempt.passed && <CheckCircle2 className="h-5 w-5 text-green-400" />}
                    </div>
                  ))}
                </div>
                {bestScore > 0 && (
                  <p className="text-sm text-gray-400 mt-3">Melhor nota: {bestScore}%</p>
                )}
              </div>
            )}

            {!canTakeExam ? (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-amber-400">
                  <AlertCircle className="h-5 w-5" />
                  <p className="font-medium">Você precisa completar todas as aulas antes de fazer a prova</p>
                </div>
              </div>
            ) : (
              <Button onClick={handleStartExam} className="w-full bg-violet-600 hover:bg-violet-700" size="lg">
                {attempts.length > 0 ? 'Fazer Nova Tentativa' : 'Iniciar Prova'}
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            )}
          </Card>
        </div>
      </div>
    );
  }

  // Exam in progress
  const question = exam.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / exam.questions.length) * 100;
  const allAnswered = selectedAnswers.every(a => a !== null);

  return (
    <div className="min-h-screen bg-gray-950 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">Questão {currentQuestion + 1} de {exam.questions.length}</p>
            <Progress value={progress} className="w-64" />
          </div>
          {exam.time_limit_minutes && (
            <div className="flex items-center gap-2 text-gray-400">
              <Clock className="h-4 w-4" />
              <span>{timeElapsed} min</span>
            </div>
          )}
        </div>

        <Card className="bg-gray-900 border-gray-800 p-8 mb-6">
          <h2 className="text-2xl font-semibold text-white mb-6">{question.question}</h2>

          <div className="space-y-3">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  selectedAnswers[currentQuestion] === index
                    ? 'border-violet-500 bg-violet-500/10'
                    : 'border-gray-700 bg-gray-800/30 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${
                    selectedAnswers[currentQuestion] === index
                      ? 'border-violet-500 bg-violet-500'
                      : 'border-gray-600'
                  }`}>
                    {selectedAnswers[currentQuestion] === index && (
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <span className="text-white">{option}</span>
                </div>
              </button>
            ))}
          </div>
        </Card>

        <div className="flex justify-between">
          <Button
            onClick={() => setCurrentQuestion(prev => prev - 1)}
            disabled={currentQuestion === 0}
            variant="outline"
            className="border-gray-700 text-gray-300"
          >
            Anterior
          </Button>

          {currentQuestion === exam.questions.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={!allAnswered}
              className="bg-green-600 hover:bg-green-700"
            >
              Finalizar Prova
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentQuestion(prev => prev + 1)}
              disabled={selectedAnswers[currentQuestion] === null}
              className="bg-violet-600 hover:bg-violet-700"
            >
              Próxima
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}