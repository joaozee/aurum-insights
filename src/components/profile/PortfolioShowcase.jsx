import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Award, Target, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function PortfolioShowcase({ userEmail }) {
  const [achievements, setAchievements] = useState([]);
  const [points, setPoints] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userEmail) {
      loadPortfolioData();
    }
  }, [userEmail]);

  const loadPortfolioData = async () => {
    try {
      const [achievementsData, pointsData, enrollmentsData] = await Promise.all([
        base44.entities.UserAchievement.filter({ user_email: userEmail }),
        base44.entities.UserPoints.filter({ user_email: userEmail }),
        base44.entities.UserEnrollment.filter({ user_email: userEmail })
      ]);

      setAchievements(achievementsData);
      setPoints(pointsData[0] || null);
      setEnrollments(enrollmentsData.filter(e => e.completed_at));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          Portfólio & Conquistas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950 dark:to-purple-950 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-violet-600" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Pontos</span>
            </div>
            <p className="text-2xl font-bold text-violet-600">{points?.total_points || 0}</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950 dark:to-green-950 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-4 w-4 text-emerald-600" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Badges</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{achievements.length}</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Cursos</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{enrollments.length}</p>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-4 w-4 text-amber-600" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Posts</span>
            </div>
            <p className="text-2xl font-bold text-amber-600">{points?.posts_created || 0}</p>
          </div>
        </div>

        {/* Recent Achievements */}
        {achievements.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Conquistas Recentes
            </h4>
            <div className="flex flex-wrap gap-2">
              {achievements.slice(0, 6).map((achievement) => (
                <Badge 
                  key={achievement.id}
                  className="bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300 border-0"
                >
                  <Award className="h-3 w-3 mr-1" />
                  {achievement.badge_name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Completed Courses */}
        {enrollments.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Cursos Concluídos
            </h4>
            <div className="space-y-2">
              {enrollments.slice(0, 3).map((enrollment) => (
                <div 
                  key={enrollment.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
                      <Award className="h-4 w-4 text-emerald-600" />
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Curso ID: {enrollment.course_id.slice(0, 8)}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {enrollment.progress}% completo
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}