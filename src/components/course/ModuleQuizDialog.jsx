import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, XCircle, Trophy, Clock, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import confetti from "canvas-confetti";

export default function ModuleQuizDialog({ quiz, open, onClose, userEmail, courseId, moduleIndex, onPass }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (open) {
      setCurrentQuestion(0);
      setAnswers([]);
      setShowResults(false);
      setScore(0);
      setTimeSpent(0);
    }
  }, [open]);

  const handleAnswer = (answerIndex) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    const timeSpentSeconds = Math.floor((Date.now() - startTime) / 1000);
    setTimeSpent(timeSpentSeconds);

    let correct = 0;
    quiz.questions.forEach((q, i) => {
      if (answers[i] === q.correct_answer) correct++;
    });

    const finalScore = Math.round((correct / quiz.questions.length) * 100);
    setScore(finalScore);
    setShowResults(true);

    const passed = finalScore >= (quiz.passing_score || 70);

    // Save attempt
    await base44.entities.QuizAttempt.create({
      user_email: userEmail,
      quiz_id: quiz.id,
      course_id: courseId,
      module_index: moduleIndex,
      score: finalScore,
      answers: answers,
      passed: passed,
      time_spent_seconds: timeSpentSeconds
    });

    if (passed) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      if (onPass) onPass();
    }
  };

  if (!quiz) return null;

  const question = quiz.questions[currentQuestion];
  const passed = score >= (quiz.passing_score || 70);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        {!showResults ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">Quiz - {quiz.module_title}</DialogTitle>
              <p className="text-gray-400 text-sm">
                Questão {currentQuestion + 1} de {quiz.questions.length}
              </p>
            </DialogHeader>

            <div className="space-y-6 mt-6">
              <Card className="bg-gray-800 border-gray-700 p-6">
                <p className="text-lg text-white mb-6">{question.question}</p>

                <div className="space-y-3">
                  {question.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswer(index)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        answers[currentQuestion] === index
                          ? "border-violet-500 bg-violet-500/10"
                          : "border-gray-700 hover:border-gray-600 bg-gray-900"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${
                          answers[currentQuestion] === index
                            ? "border-violet-500 bg-violet-500"
                            : "border-gray-600"
                        }`}>
                          {answers[currentQuestion] === index && (
                            <CheckCircle2 className="h-4 w-4 text-white" />
                          )}
                        </div>
                        <span className="text-gray-200">{option}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  className="border-gray-700 text-gray-300"
                  onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                  disabled={currentQuestion === 0}
                >
                  Anterior
                </Button>
                <Button
                  className="bg-violet-600 hover:bg-violet-700"
                  onClick={handleNext}
                  disabled={answers[currentQuestion] === undefined}
                >
                  {currentQuestion === quiz.questions.length - 1 ? "Finalizar" : "Próxima"}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                {passed ? (
                  <>
                    <Trophy className="h-6 w-6 text-amber-400" />
                    Parabéns!
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-6 w-6 text-orange-400" />
                    Continue Praticando
                  </>
                )}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 mt-6">
              <Card className={`border-2 p-6 ${passed ? "bg-violet-500/10 border-violet-500/30" : "bg-orange-500/10 border-orange-500/30"}`}>
                <div className="text-center">
                  <div className="text-5xl font-bold mb-2">
                    {score}%
                  </div>
                  <p className="text-gray-300 mb-4">
                    {passed ? "Você passou no quiz!" : `Necessário ${quiz.passing_score || 70}% para aprovação`}
                  </p>
                  <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}
                    </span>
                    <span>
                      {quiz.questions.filter((q, i) => answers[i] === q.correct_answer).length}/{quiz.questions.length} corretas
                    </span>
                  </div>
                </div>
              </Card>

              <div className="space-y-4">
                <h3 className="font-semibold text-white">Revisão das Respostas</h3>
                {quiz.questions.map((q, i) => {
                  const isCorrect = answers[i] === q.correct_answer;
                  return (
                    <Card key={i} className={`border p-4 ${isCorrect ? "bg-green-500/5 border-green-500/30" : "bg-red-500/5 border-red-500/30"}`}>
                      <div className="flex items-start gap-3">
                        {isCorrect ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="text-white font-medium mb-2">{q.question}</p>
                          <p className="text-sm text-gray-400 mb-1">
                            Sua resposta: <span className={isCorrect ? "text-green-400" : "text-red-400"}>{q.options[answers[i]]}</span>
                          </p>
                          {!isCorrect && (
                            <p className="text-sm text-gray-400 mb-2">
                              Resposta correta: <span className="text-green-400">{q.options[q.correct_answer]}</span>
                            </p>
                          )}
                          {q.explanation && (
                            <p className="text-sm text-gray-300 mt-2 p-3 bg-gray-800 rounded-lg">
                              💡 {q.explanation}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-gray-700"
                  onClick={onClose}
                >
                  Fechar
                </Button>
                {!passed && (
                  <Button
                    className="flex-1 bg-violet-600 hover:bg-violet-700"
                    onClick={() => {
                      setShowResults(false);
                      setCurrentQuestion(0);
                      setAnswers([]);
                    }}
                  >
                    Tentar Novamente
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}