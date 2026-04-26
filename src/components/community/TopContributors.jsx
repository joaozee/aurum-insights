import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Crown, Medal, Award } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function TopContributors() {
  const [contributors, setContributors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTopContributors();
  }, []);

  const loadTopContributors = async () => {
    try {
      const points = await base44.entities.UserPoints.list('-points_from_community', 10);
      
      const contributorsData = await Promise.all(
        points.map(async (p) => {
          const posts = await base44.entities.CommunityPost.filter({ created_by: p.user_email });
          return {
            email: p.user_email,
            points: p.points_from_community || 0,
            posts_count: p.posts_created || 0,
            engagement: p.community_engagement_score || 0,
            total_posts: posts.length
          };
        })
      );

      const sortedContributors = contributorsData
        .filter(c => c.points > 0)
        .sort((a, b) => b.points - a.points)
        .slice(0, 5);

      setContributors(sortedContributors);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index) => {
    if (index === 0) return <Crown className="h-5 w-5 text-yellow-400" />;
    if (index === 1) return <Medal className="h-5 w-5 text-gray-300" />;
    if (index === 2) return <Award className="h-5 w-5 text-amber-600" />;
    return <Trophy className="h-4 w-4 text-gray-500" />;
  };

  const getRankBg = (index) => {
    if (index === 0) return "from-yellow-500/20 to-amber-500/20 border-yellow-500/30";
    if (index === 1) return "from-gray-400/20 to-gray-500/20 border-gray-400/30";
    if (index === 2) return "from-amber-600/20 to-amber-700/20 border-amber-600/30";
    return "from-gray-800/50 to-gray-800/50 border-gray-700";
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-400" />
          Top Contribuidores
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 bg-gray-800 rounded-lg" />
            ))}
          </div>
        ) : contributors.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Nenhum contribuidor ainda</p>
          </div>
        ) : (
          <div className="space-y-3">
            {contributors.map((contributor, index) => (
              <div 
                key={contributor.email}
                className={`bg-gradient-to-r ${getRankBg(index)} rounded-lg p-4 border transition-all hover:scale-[1.02]`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8">
                      {getRankIcon(index)}
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-violet-500/20 text-violet-400">
                        {contributor.email?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-white font-semibold text-sm">
                        {contributor.email?.split('@')[0]}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>{contributor.posts_count} posts</span>
                        <span>•</span>
                        <span>{contributor.engagement} interações</span>
                      </div>
                    </div>
                  </div>
                  <Badge className="bg-violet-500/20 text-violet-400 font-semibold">
                    {contributor.points} pts
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}