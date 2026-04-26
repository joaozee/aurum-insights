import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { 
  BookOpen, 
  FileText, 
  MessageCircle, 
  Users,
  TrendingUp
} from "lucide-react";
import InstructorCourses from "@/components/instructor/InstructorCourses";
import InstructorExams from "@/components/instructor/InstructorExams";
import InstructorDiscussions from "@/components/instructor/InstructorDiscussions";
import InstructorStudentProgress from "@/components/instructor/InstructorStudentProgress";
import ExamAnalytics from "@/components/instructor/ExamAnalytics";

export default function InstructorDashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ courses: 0, students: 0, discussions: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      // Load instructor stats
      const [courses, enrollments, discussions] = await Promise.all([
        base44.entities.Course.filter({ instructor_email: userData.email }),
        base44.entities.UserEnrollment.list(),
        base44.entities.CourseDiscussion.list()
      ]);

      const courseIds = courses.map(c => c.id);
      const studentCount = new Set(
        enrollments.filter(e => courseIds.includes(e.course_id)).map(e => e.user_email)
      ).size;
      const discussionCount = discussions.filter(d => 
        courseIds.includes(d.course_id) && d.status === 'pending'
      ).length;

      setStats({
        courses: courses.length,
        students: studentCount,
        discussions: discussionCount
      });
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Painel do Instrutor</h1>
          <p className="text-gray-400">Gerencie seus cursos, provas e interaja com seus alunos</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gray-900 border-gray-800 p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-violet-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.courses}</p>
                <p className="text-sm text-gray-400">Cursos</p>
              </div>
            </div>
          </Card>

          <Card className="bg-gray-900 border-gray-800 p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.students}</p>
                <p className="text-sm text-gray-400">Alunos</p>
              </div>
            </div>
          </Card>

          <Card className="bg-gray-900 border-gray-800 p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <MessageCircle className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.discussions}</p>
                <p className="text-sm text-gray-400">Pendentes</p>
              </div>
            </div>
          </Card>

          <Card className="bg-gray-900 border-gray-800 p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">92%</p>
                <p className="text-sm text-gray-400">Satisfação</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="courses" className="space-y-6">
          <TabsList className="bg-gray-900 border border-gray-800">
            <TabsTrigger value="courses" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400">
              <BookOpen className="h-4 w-4 mr-2" />
              Cursos
            </TabsTrigger>
            <TabsTrigger value="exams" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400">
              <FileText className="h-4 w-4 mr-2" />
              Provas
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400">
              <TrendingUp className="h-4 w-4 mr-2" />
              Análises
            </TabsTrigger>
            <TabsTrigger value="discussions" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400">
              <MessageCircle className="h-4 w-4 mr-2" />
              Discussões ({stats.discussions})
            </TabsTrigger>
            <TabsTrigger value="progress" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400">
              <Users className="h-4 w-4 mr-2" />
              Progresso dos Alunos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courses">
            <InstructorCourses instructorEmail={user?.email} instructorName={user?.full_name} />
          </TabsContent>

          <TabsContent value="exams">
            <InstructorExams instructorEmail={user?.email} />
          </TabsContent>

          <TabsContent value="analytics">
            <ExamAnalytics instructorEmail={user?.email} />
          </TabsContent>

          <TabsContent value="discussions">
            <InstructorDiscussions instructorEmail={user?.email} />
          </TabsContent>

          <TabsContent value="progress">
            <InstructorStudentProgress instructorEmail={user?.email} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}