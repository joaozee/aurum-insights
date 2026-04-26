import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Heart, MessageCircle, Share2, TrendingUp, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function EngagementDashboard({ userEmail }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalLikes: 0,
    totalComments: 0,
    totalShares: 0,
    avgEngagement: 0
  });

  useEffect(() => {
    if (userEmail) {
      loadEngagementData();
    }
  }, [userEmail]);

  const loadEngagementData = async () => {
    try {
      const userPosts = await base44.entities.CommunityPost.filter({
        author_email: userEmail
      });

      setPosts(userPosts);

      // Calculate stats
      const totalLikes = userPosts.reduce((sum, post) => sum + (post.likes_count || 0), 0);
      const totalComments = userPosts.reduce((sum, post) => sum + (post.comments?.length || 0), 0);
      const totalShares = userPosts.reduce((sum, post) => sum + (post.shares_count || 0), 0);
      const totalEngagement = totalLikes + totalComments + totalShares;
      const avgEngagement = userPosts.length > 0 ? (totalEngagement / userPosts.length).toFixed(1) : 0;

      setStats({
        totalPosts: userPosts.length,
        totalLikes,
        totalComments,
        totalShares,
        avgEngagement
      });
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
          <Skeleton className="h-64" />
        </CardContent>
      </Card>
    );
  }

  const topPosts = [...posts].sort((a, b) => {
    const engagementA = (a.likes_count || 0) + (a.comments?.length || 0) + (a.shares_count || 0);
    const engagementB = (b.likes_count || 0) + (b.comments?.length || 0) + (b.shares_count || 0);
    return engagementB - engagementA;
  }).slice(0, 5);

  return (
    <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-violet-500" />
          Métricas de Engajamento
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="top">Top Posts</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="h-4 w-4 text-blue-600" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Posts</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">{stats.totalPosts}</p>
              </div>

              <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950 dark:to-rose-950 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="h-4 w-4 text-pink-600" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Curtidas</span>
                </div>
                <p className="text-2xl font-bold text-pink-600">{stats.totalLikes}</p>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950 dark:to-green-950 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Comentários</span>
                </div>
                <p className="text-2xl font-bold text-emerald-600">{stats.totalComments}</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Share2 className="h-4 w-4 text-purple-600" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Compartilhamentos</span>
                </div>
                <p className="text-2xl font-bold text-purple-600">{stats.totalShares}</p>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 p-4 rounded-lg col-span-2">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-amber-600" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Engajamento Médio/Post</span>
                </div>
                <p className="text-2xl font-bold text-amber-600">{stats.avgEngagement}</p>
              </div>
            </div>

            {/* Engagement Rate */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Taxa de Engajamento</span>
                <span className="text-sm font-semibold text-violet-600">
                  {stats.totalPosts > 0 
                    ? ((stats.totalLikes + stats.totalComments) / stats.totalPosts * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-violet-500 to-purple-600 h-2 rounded-full transition-all"
                  style={{ 
                    width: `${Math.min(((stats.totalLikes + stats.totalComments) / (stats.totalPosts || 1) * 10), 100)}%` 
                  }}
                ></div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="top" className="space-y-3">
            {topPosts.length > 0 ? (
              topPosts.map((post) => {
                const engagement = (post.likes_count || 0) + (post.comments?.length || 0) + (post.shares_count || 0);
                return (
                  <div 
                    key={post.id}
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
                  >
                    <p className="text-sm text-gray-900 dark:text-white mb-2 line-clamp-2">
                      {post.content}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {post.likes_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        {post.comments?.length || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Share2 className="h-3 w-3" />
                        {post.shares_count || 0}
                      </span>
                      <span className="ml-auto font-semibold text-violet-600">
                        {engagement} engajamentos
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-8">
                Nenhum post ainda
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}