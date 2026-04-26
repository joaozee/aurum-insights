import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Trophy, 
  TrendingUp, 
  Award,
  ArrowLeft
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/shared/PageHeader";
import LeaderboardTable from "@/components/gamification/LeaderboardTable";

export default function Leaderboard() {
  const [user, setUser] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("points");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [userData, pointsData, enrollmentData] = await Promise.all([
        base44.auth.me(),
        base44.entities.UserPoints.list("-total_points", 100),
        base44.entities.UserEnrollment.list()
      ]);
      
      setUser(userData);

      // Combine user data with points and courses
      const usersData = await base44.entities.User.list();
      const combined = pointsData.map(points => {
        const userData = usersData.find(u => u.email === points.user_email);
        const userCourses = enrollmentData.filter(e => e.user_email === points.user_email).length;
        
        return {
          email: points.user_email,
          full_name: userData?.full_name || "Usuário Anônimo",
          points: points.total_points || 0,
          courses_completed: userCourses,
          is_premium: userData?.is_premium || false
        };
      });

      setLeaderboardData(combined);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const leaderboardByPoints = [...leaderboardData].sort((a, b) => b.points - a.points);
  const leaderboardByCourses = [...leaderboardData].sort((a, b) => b.courses_completed - a.courses_completed);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to={createPageUrl("Home")} className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 group">
          <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          <span>Voltar</span>
        </Link>

        <PageHeader 
          title="Ranking da Comunidade"
          subtitle="Veja quem são os maiores investidores e mais engajados"
        />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-100 to-yellow-100 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Seu Ranking (Pontos)</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? "-" : `#${leaderboardByPoints.findIndex(u => u.email === user?.email) + 1}`}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Seu Ranking (Cursos)</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? "-" : `#${leaderboardByCourses.findIndex(u => u.email === user?.email) + 1}`}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-100 to-purple-100 flex items-center justify-center">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Participantes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? "-" : leaderboardData.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="bg-white border border-gray-200">
            <TabsTrigger value="points" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Por Pontos
            </TabsTrigger>
            <TabsTrigger value="courses" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Por Cursos
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Leaderboard */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <LeaderboardTable 
            users={activeTab === "points" ? leaderboardByPoints : leaderboardByCourses}
            currentUserEmail={user?.email}
          />
        )}
      </div>
    </div>
  );
}