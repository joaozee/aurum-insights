import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, CheckCircle2 } from "lucide-react";

export default function InstructorStudentProgress({ instructorEmail }) {
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [instructorEmail]);

  const loadData = async () => {
    try {
      const coursesData = await base44.entities.Course.filter({ instructor_email: instructorEmail });
      setCourses(coursesData);

      const courseIds = coursesData.map(c => c.id);
      const allEnrollments = await base44.entities.UserEnrollment.list();
      const instructorEnrollments = allEnrollments.filter(e => courseIds.includes(e.course_id));
      setEnrollments(instructorEnrollments);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredEnrollments = selectedCourse === "all" 
    ? enrollments 
    : enrollments.filter(e => e.course_id === selectedCourse);

  const avgProgress = filteredEnrollments.length > 0
    ? Math.round(filteredEnrollments.reduce((acc, e) => acc + (e.progress || 0), 0) / filteredEnrollments.length)
    : 0;

  const completedCount = filteredEnrollments.filter(e => e.progress === 100).length;

  if (loading) {
    return <div className="text-gray-400">Carregando progresso...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Progresso dos Alunos</h2>
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="bg-gray-800 border-gray-700 text-white w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700 text-white">
            <SelectItem value="all">Todos os Cursos</SelectItem>
            {courses.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gray-900 border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-5 w-5 text-blue-400" />
            <span className="text-sm text-gray-400">Total de Alunos</span>
          </div>
          <p className="text-3xl font-bold text-white">{filteredEnrollments.length}</p>
        </Card>

        <Card className="bg-gray-900 border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-5 w-5 text-violet-400" />
            <span className="text-sm text-gray-400">Progresso Médio</span>
          </div>
          <p className="text-3xl font-bold text-white">{avgProgress}%</p>
        </Card>

        <Card className="bg-gray-900 border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="h-5 w-5 text-green-400" />
            <span className="text-sm text-gray-400">Concluíram</span>
          </div>
          <p className="text-3xl font-bold text-white">{completedCount}</p>
        </Card>
      </div>

      {filteredEnrollments.length === 0 ? (
        <Card className="bg-gray-900 border-gray-800 p-12 text-center">
          <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Nenhum aluno matriculado ainda</p>
        </Card>
      ) : (
        <Card className="bg-gray-900 border-gray-800">
          <div className="p-6 border-b border-gray-800">
            <h3 className="text-lg font-semibold text-white">Detalhes por Aluno</h3>
          </div>
          <div className="divide-y divide-gray-800">
            {filteredEnrollments.map((enrollment) => {
              const course = courses.find(c => c.id === enrollment.course_id);
              return (
                <div key={enrollment.id} className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                        <span className="text-violet-400 font-semibold">
                          {enrollment.user_email?.[0]?.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-white">{enrollment.user_email}</p>
                        <p className="text-sm text-gray-400">{course?.title}</p>
                      </div>
                    </div>
                    <Badge className={
                      enrollment.progress === 100 
                        ? "bg-green-500/20 text-green-400"
                        : enrollment.progress > 50
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-gray-500/20 text-gray-400"
                    }>
                      {enrollment.progress}% completo
                    </Badge>
                  </div>
                  <Progress value={enrollment.progress || 0} className="h-2" />
                  <div className="flex items-center justify-between mt-2 text-sm text-gray-400">
                    <span>Iniciado em: {new Date(enrollment.started_at).toLocaleDateString()}</span>
                    {enrollment.completed_at && (
                      <span>Concluído em: {new Date(enrollment.completed_at).toLocaleDateString()}</span>
                    )}
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