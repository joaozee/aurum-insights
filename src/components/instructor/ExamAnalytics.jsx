import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  XCircle, 
  BarChart3,
  AlertTriangle 
} from "lucide-react";

export default function ExamAnalytics({ instructorEmail }) {
  const [exams, setExams] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [selectedExam, setSelectedExam] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [instructorEmail]);

  const loadData = async () => {
    try {
      const courses = await base44.entities.Course.filter({ instructor_email: instructorEmail });
      const courseIds = courses.map(c => c.id);
      
      const allExams = await base44.entities.CourseExam.list();
      const instructorExams = allExams.filter(e => courseIds.includes(e.course_id));
      setExams(instructorExams);

      const allAttempts = await base44.entities.ExamAttempt.list();
      const examIds = instructorExams.map(e => e.id);
      const instructorAttempts = allAttempts.filter(a => examIds.includes(a.exam_id));
      setAttempts(instructorAttempts);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredAttempts = selectedExam === "all"
    ? attempts
    : attempts.filter(a => a.exam_id === selectedExam);

  const stats = {
    totalAttempts: filteredAttempts.length,
    passed: filteredAttempts.filter(a => a.passed).length,
    failed: filteredAttempts.filter(a => !a.passed).length,
    avgScore: filteredAttempts.length > 0
      ? Math.round(filteredAttempts.reduce((sum, a) => sum + a.score, 0) / filteredAttempts.length)
      : 0,
    uniqueStudents: new Set(filteredAttempts.map(a => a.user_email)).size
  };

  const getQuestionStats = () => {
    if (selectedExam === "all" || filteredAttempts.length === 0) return [];
    
    const exam = exams.find(e => e.id === selectedExam);
    if (!exam) return [];

    return exam.questions.map((question, qIndex) => {
      const correctCount = filteredAttempts.filter(attempt => {
        const userAnswer = attempt.answers[qIndex];
        const correctAnswer = Number(question.correct_answer);
        return userAnswer === correctAnswer;
      }).length;

      const totalAnswers = filteredAttempts.length;
      const successRate = totalAnswers > 0 ? Math.round((correctCount / totalAnswers) * 100) : 0;

      return {
        question: question.question,
        successRate,
        correctCount,
        totalAnswers
      };
    });
  };

  const questionStats = getQuestionStats();

  if (loading) {
    return <div className="text-gray-400">Carregando análises...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Análise de Provas</h2>
        <Select value={selectedExam} onValueChange={setSelectedExam}>
          <SelectTrigger className="bg-gray-800 border-gray-700 text-white w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700 text-white">
            <SelectItem value="all">Todas as Provas</SelectItem>
            {exams.map(e => (
              <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-gray-900 border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="h-5 w-5 text-blue-400" />
            <span className="text-sm text-gray-400">Tentativas</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalAttempts}</p>
        </Card>

        <Card className="bg-gray-900 border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-5 w-5 text-violet-400" />
            <span className="text-sm text-gray-400">Alunos</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.uniqueStudents}</p>
        </Card>

        <Card className="bg-gray-900 border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="h-5 w-5 text-green-400" />
            <span className="text-sm text-gray-400">Aprovados</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.passed}</p>
        </Card>

        <Card className="bg-gray-900 border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-2">
            <XCircle className="h-5 w-5 text-red-400" />
            <span className="text-sm text-gray-400">Reprovados</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.failed}</p>
        </Card>

        <Card className="bg-gray-900 border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-5 w-5 text-amber-400" />
            <span className="text-sm text-gray-400">Média</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.avgScore}%</p>
        </Card>
      </div>

      {questionStats.length > 0 && (
        <Card className="bg-gray-900 border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Análise por Questão</h3>
          <div className="space-y-4">
            {questionStats.map((stat, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white mb-1">
                      Questão {index + 1}: {stat.question}
                    </p>
                    <p className="text-xs text-gray-400">
                      {stat.correctCount} de {stat.totalAnswers} acertaram
                    </p>
                  </div>
                  <Badge className={
                    stat.successRate >= 70
                      ? "bg-green-500/20 text-green-400"
                      : stat.successRate >= 50
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-red-500/20 text-red-400"
                  }>
                    {stat.successRate}%
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={stat.successRate} className="flex-1" />
                  {stat.successRate < 50 && (
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {filteredAttempts.length === 0 && (
        <Card className="bg-gray-900 border-gray-800 p-12 text-center">
          <BarChart3 className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Nenhuma tentativa registrada ainda</p>
        </Card>
      )}

      {filteredAttempts.length > 0 && (
        <Card className="bg-gray-900 border-gray-800">
          <div className="p-6 border-b border-gray-800">
            <h3 className="text-lg font-semibold text-white">Últimas Tentativas</h3>
          </div>
          <div className="divide-y divide-gray-800 max-h-96 overflow-y-auto">
            {filteredAttempts.slice(0, 20).map((attempt) => {
              const exam = exams.find(e => e.id === attempt.exam_id);
              return (
                <div key={attempt.id} className="p-4 hover:bg-gray-800/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{attempt.user_email}</p>
                      <p className="text-sm text-gray-400">{exam?.title}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={
                        attempt.passed
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }>
                        {attempt.score}%
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(attempt.created_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}