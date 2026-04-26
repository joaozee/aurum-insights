import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Briefcase,
  TrendingUp,
  Users,
  MessageSquare,
  Heart,
  Award,
  Trophy,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PostCard from "@/components/community/PostCard";
import LevelBadge from "@/components/shared/LevelBadge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function PublicProfile() {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [userPoints, setUserPoints] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [connections, setConnections] = useState(0);

  const urlParams = new URLSearchParams(window.location.search);
  const profileEmail = urlParams.get("email");

  useEffect(() => {
    loadProfile();
  }, [profileEmail]);

  const loadProfile = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      // Load profile
      let profileData;
      const profiles = await base44.entities.UserProfile.filter({
        user_email: profileEmail
      });

      if (profiles.length === 0) {
        // Create basic profile if doesn't exist
        profileData = await base44.entities.UserProfile.create({
          user_email: profileEmail,
          user_name: profileEmail.split('@')[0],
          posts_count: 0,
          followers_count: 0,
          following_count: 0
        });
      } else {
        profileData = profiles[0];
      }

      // Count actual followers and following
      const [followers, following, userPosts, points] = await Promise.all([
        base44.entities.UserFollow.filter({ following_email: profileEmail }),
        base44.entities.UserFollow.filter({ follower_email: profileEmail }),
        base44.entities.CommunityPost.filter({ author_email: profileEmail }, '-created_date', 20),
        base44.entities.UserPoints.filter({ user_email: profileEmail })
      ]);

      // Calculate connections (mutual follows)
      const connectionCount = followers.filter(f => 
        following.some(u => u.following_email === f.follower_email)
      ).length;

      // Update profile with actual counts
      profileData.followers_count = followers.length;
      profileData.following_count = following.length;
      profileData.posts_count = userPosts.length;
      
      setProfile(profileData);
      setPosts(userPosts);
      setConnections(connectionCount);

      if (points.length > 0) {
        setUserPoints(points[0]);
      }

      // Check if following
      if (user && user.email !== profileEmail) {
        setIsFollowing(followers.some(f => f.follower_email === user.email));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUser) return;

    try {
      if (isFollowing) {
        const follows = await base44.entities.UserFollow.filter({
          follower_email: currentUser.email,
          following_email: profileEmail
        });
        if (follows.length > 0) {
          await base44.entities.UserFollow.delete(follows[0].id);
        }
        // Update current user's following count
        const userProfiles = await base44.entities.UserProfile.filter({
          user_email: currentUser.email
        });
        if (userProfiles.length > 0) {
          await base44.entities.UserProfile.update(userProfiles[0].id, {
            following_count: Math.max(0, (userProfiles[0].following_count || 1) - 1)
          });
        }
      } else {
        await base44.entities.UserFollow.create({
          follower_email: currentUser.email,
          following_email: profileEmail
        });
        // Update current user's following count
        const userProfiles = await base44.entities.UserProfile.filter({
          user_email: currentUser.email
        });
        if (userProfiles.length > 0) {
          await base44.entities.UserProfile.update(userProfiles[0].id, {
            following_count: (userProfiles[0].following_count || 0) + 1
          });
        }
      }
      setIsFollowing(!isFollowing);
      loadProfile();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 p-8">
        <div className="max-w-5xl mx-auto">
          <Skeleton className="h-64 bg-gray-800 rounded-2xl mb-8" />
          <div className="grid lg:grid-cols-3 gap-6">
            <Skeleton className="h-40 bg-gray-800 rounded-2xl" />
            <Skeleton className="lg:col-span-2 h-96 bg-gray-800 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  const investmentStyleLabels = {
    buy_hold: "Buy & Hold",
    day_trade: "Day Trade",
    swing_trade: "Swing Trade",
    dividendos: "Dividendos",
    growth: "Growth",
    value: "Value"
  };

  const experienceLevelLabels = {
    iniciante: "Iniciante",
    intermediario: "Intermediário",
    avancado: "Avançado",
    especialista: "Especialista"
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link to={createPageUrl("Community")} className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 mb-6">
          <ArrowLeft className="h-4 w-4" />
          Voltar para comunidade
        </Link>

        {/* Profile Header */}
        <Card className="bg-gray-900 border-gray-800 overflow-hidden mb-6">
          <div className="h-32 bg-gradient-to-r from-violet-600 to-purple-700"></div>
          
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-16 mb-4">
              <Avatar className="h-32 w-32 border-4 border-gray-900">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.user_name} className="object-cover" />
                ) : (
                  <AvatarFallback className="bg-violet-500 text-white text-3xl">
                    {profile?.user_name?.[0] || "U"}
                  </AvatarFallback>
                )}
              </Avatar>

              <div className="flex-1">
                    <h1 className="text-2xl font-bold text-white">{profile?.user_name}</h1>
                {profile?.bio && (
                  <p className="text-gray-400 mb-3">{profile.bio}</p>
                )}
                
                <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-4">
                  {profile?.experience_level && (
                    <Badge className="bg-violet-500/20 text-violet-400 border-0">
                      {experienceLevelLabels[profile.experience_level]}
                    </Badge>
                  )}
                  {profile?.investment_style && (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-0">
                      {investmentStyleLabels[profile.investment_style]}
                    </Badge>
                  )}
                  {profile?.joined_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Membro desde {format(new Date(profile.joined_date), "MMM yyyy", { locale: ptBR })}
                    </span>
                  )}
                </div>
              </div>

              {currentUser && currentUser.email !== profileEmail && (
                <div className="flex gap-2">
                  <Button
                    onClick={handleFollow}
                    className={isFollowing 
                      ? "border-violet-500 text-violet-400 hover:bg-violet-500/10" 
                      : "bg-violet-600 hover:bg-violet-700"
                    }
                    variant={isFollowing ? "outline" : "default"}
                  >
                    {isFollowing ? "Seguindo" : "Seguir"}
                  </Button>
                  <Link to={createPageUrl("Messages") + `?email=${profileEmail}`}>
                    <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
                      <Send className="h-4 w-4 mr-2" />
                      Mensagem
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Stats */}
             <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-800 relative">
               <div className="text-center">
                 <p className="text-2xl font-bold text-white">{profile?.posts_count || 0}</p>
                 <p className="text-xs text-gray-400">Posts</p>
               </div>
               <div className="text-center">
                 <p className="text-2xl font-bold text-white">{profile?.followers_count || 0}</p>
                 <p className="text-xs text-gray-400">Seguidores</p>
               </div>
               <div className="text-center">
                 <p className="text-2xl font-bold text-white">{connections}</p>
                 <p className="text-xs text-gray-400">Conexões</p>
               </div>
               <div className="text-center">
                 <div className="absolute top-0 right-0 -translate-y-2">
                   {userPoints && <LevelBadge points={userPoints.total_points} />}
                 </div>
                 <p className="text-2xl font-bold text-white">{userPoints?.total_points || 0}</p>
                 <p className="text-xs text-gray-400">Pontos</p>
               </div>
             </div>
          </div>
        </Card>

        {/* Content Tabs */}
        <Tabs defaultValue="posts">
          <TabsList className="bg-gray-900 border border-gray-800 w-full">
            <TabsTrigger value="posts" className="flex-1">Posts</TabsTrigger>
            <TabsTrigger value="about" className="flex-1">Sobre</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-6 space-y-4">
            {posts.length > 0 ? (
              posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserEmail={currentUser?.email}
                  onLike={() => {}}
                  onComment={() => {}}
                  onDelete={() => {}}
                  onShare={() => {}}
                />
              ))
            ) : (
              <Card className="bg-gray-900 border-gray-800 p-12 text-center">
                <MessageSquare className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">Nenhum post ainda</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="about" className="mt-6">
            <Card className="bg-gray-900 border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Informações</h3>
              <div className="space-y-4">
                {profile?.investment_style && (
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Estilo de Investimento</p>
                    <p className="text-white">{investmentStyleLabels[profile.investment_style]}</p>
                  </div>
                )}
                {profile?.favorite_sectors && profile.favorite_sectors.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Setores Favoritos</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.favorite_sectors.map((sector, index) => (
                        <Badge key={index} className="bg-gray-800 text-gray-300">
                          {sector}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {profile?.total_return_percent !== undefined && profile?.total_return_percent !== null && (
                   <div>
                     <p className="text-sm text-gray-400 mb-1">Retorno Total</p>
                     <p className={`text-xl font-bold ${profile.total_return_percent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                       {profile.total_return_percent >= 0 ? '+' : ''}{profile.total_return_percent.toFixed(2)}%
                     </p>
                   </div>
                 )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}