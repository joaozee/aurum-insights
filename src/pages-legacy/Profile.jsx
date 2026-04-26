import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { 
  User, 
  Crown, 
  Settings, 
  LogOut,
  Trash2,
  BookOpen,
  Mail,
  Calendar,
  ChevronRight,
  HelpCircle,
  FileText,
  Shield,
  MessageSquare,
  Trophy,
  Award,
  Edit,
  Twitter,
  Linkedin,
  Instagram,
  Globe,
  CheckCircle2,
  Users,
  UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PremiumBadge from "@/components/ui/PremiumBadge";
import LevelIndicator from "@/components/shared/LevelIndicator";
import AchievementCard from "@/components/gamification/AchievementCard";
import PointsCard from "@/components/gamification/PointsCard";
import CertificatesList from "@/components/certificates/CertificatesList";
import BadgeShowcase from "@/components/course/BadgeShowcase";
import PortfolioShowcase from "@/components/profile/PortfolioShowcase";
import SocialMediaIntegration from "@/components/profile/SocialMediaIntegration";
import EngagementDashboard from "@/components/profile/EngagementDashboard";
import EditProfileDialog from "@/components/profile/EditProfileDialog";
import SavedPostsSection from "@/components/profile/SavedPostsSection";
import UserGroupsSection from "@/components/profile/UserGroupsSection";
import RecentActivitySection from "@/components/profile/RecentActivitySection";
import PostCollectionsManager from "@/components/profile/PostCollectionsManager";
import FeaturedPostsSection from "@/components/profile/FeaturedPostsSection";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [userPoints, setUserPoints] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [showUpdateSuccess, setShowUpdateSuccess] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (showSuccess = false) => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      const profiles = await base44.entities.UserProfile.filter({
        user_email: userData.email
      });
      
      if (profiles.length === 0) {
        const newProfile = await base44.entities.UserProfile.create({
          user_email: userData.email,
          user_name: userData.full_name,
          joined_date: new Date().toISOString().split('T')[0],
          followers_count: 0,
          following_count: 0
        });
        setProfile(newProfile);
      } else {
        setProfile(profiles[0]);
      }
      
      const [enrollmentData, pointsData, achievementData] = await Promise.all([
        base44.entities.UserEnrollment.filter({ 
          user_email: userData.email 
        }),
        base44.entities.UserPoints.filter({ 
          user_email: userData.email 
        }),
        base44.entities.UserAchievement.filter({ 
          user_email: userData.email 
        })
      ]);
      
      setEnrollments(enrollmentData);
      if (pointsData.length > 0) {
        setUserPoints(pointsData[0]);
      }
      setAchievements(achievementData);

      if (showSuccess) {
        setShowUpdateSuccess(true);
        setTimeout(() => setShowUpdateSuccess(false), 3000);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  const menuItems = [
    {
      icon: BookOpen,
      title: "Meus Cursos",
      description: `${enrollments.length} curso${enrollments.length !== 1 ? 's' : ''} matriculado${enrollments.length !== 1 ? 's' : ''}`,
      page: "MyCourses"
    },
    {
      icon: Settings,
      title: "Configurações do Perfil",
      description: "Configure como outros veem você",
      page: "ProfileSettings"
    },
    {
      icon: Crown,
      title: "Assinatura",
      description: user?.is_premium ? "Premium ativo" : "Seja Premium",
      page: "Premium"
    }
  ];

  const supportItems = [
    { icon: HelpCircle, title: "Ajuda / FAQ", page: "Help" },
    { icon: FileText, title: "Termos de Uso", page: "Terms" },
    { icon: Shield, title: "Política de Privacidade", page: "Privacy" },
    { icon: MessageSquare, title: "Contato / Suporte", page: "Support" }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div 
            className="bg-gray-900 rounded-2xl border border-gray-800 p-8 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-full bg-gray-800" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-40 bg-gray-800" />
                <Skeleton className="h-4 w-32 bg-gray-800" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Success Notification */}
      {showUpdateSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/50 rounded-full px-4 py-3 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-300">Perfil atualizado com sucesso!</span>
          </div>
        </motion.div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header with Cover */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden mb-6"
        >
          {/* Cover Image */}
          <div className="h-32 md:h-48 bg-gradient-to-br from-violet-600 to-purple-700 relative">
            {profile?.cover_image_url && (
              <img 
                src={profile.cover_image_url} 
                alt="Capa" 
                className="w-full h-full object-cover"
              />
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEditDialogOpen(true)}
              className="absolute top-4 right-4"
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar Perfil
            </Button>
          </div>

          {/* Profile Info */}
          <div className="p-6 relative">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-16 md:-mt-20">
              <div className="relative">
                <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-gray-900">
                  <AvatarFallback className={cn(
                    "text-3xl font-bold",
                    user?.is_premium 
                      ? "bg-gradient-to-br from-amber-400 to-yellow-500 text-gray-900" 
                      : profile?.avatar_url
                      ? "bg-gray-700"
                      : "bg-gray-700 text-white"
                  )}>
                    {profile?.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt="Avatar" 
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      user?.full_name?.[0] || "U"
                    )}
                  </AvatarFallback>
                </Avatar>
                {user?.is_premium && (
                  <div className="absolute -bottom-1 -right-1 bg-violet-600 rounded-full p-1.5">
                    <Crown className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                  <h1 className="text-2xl font-bold text-white">{user?.full_name || "Usuário"}</h1>
                  {user?.is_premium && <PremiumBadge size="sm" />}
                </div>

                {profile?.bio && (
                  <p className="text-sm text-gray-400 mb-3 max-w-2xl">
                    {profile.bio}
                  </p>
                )}

                {/* Social Links */}
                {profile?.social_links && (Object.values(profile.social_links).some(link => link)) && (
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
                    {profile.social_links.twitter && (
                      <a href={profile.social_links.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors">
                        <Twitter className="h-4 w-4" />
                      </a>
                    )}
                    {profile.social_links.linkedin && (
                      <a href={profile.social_links.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-500 transition-colors">
                        <Linkedin className="h-4 w-4" />
                      </a>
                    )}
                    {profile.social_links.instagram && (
                      <a href={profile.social_links.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-500 transition-colors">
                        <Instagram className="h-4 w-4" />
                      </a>
                    )}
                    {profile.social_links.website && (
                      <a href={profile.social_links.website} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-violet-400 transition-colors">
                        <Globe className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-2 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {user?.email}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Membro desde {user?.created_date 
                      ? format(new Date(user.created_date), "MMMM 'de' yyyy", { locale: ptBR })
                      : "hoje"}
                  </div>
                  <div className="flex items-center gap-4 mt-2 pt-2 border-t border-gray-700">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-violet-400" />
                      <span className="font-semibold text-white">{profile?.followers_count || 0}</span>
                      <span className="text-gray-500">Seguidores</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4 text-violet-400" />
                      <span className="font-semibold text-white">{profile?.following_count || 0}</span>
                      <span className="text-gray-500">Seguindo</span>
                    </div>
                  </div>
                </div>
                </div>

                {/* Level Indicator - Right Side */}
                {userPoints && (
                <div className="md:ml-auto">
                <LevelIndicator points={userPoints.total_points} compact />
                </div>
                )}
                </div>
                </div>
                </motion.div>

        {/* Tabs for different sections */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="w-full bg-gray-900 border border-gray-800 grid grid-cols-4 sticky top-14 z-40">
            <TabsTrigger value="overview" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400">
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="saved" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400">
              Salvos
            </TabsTrigger>
            <TabsTrigger value="groups" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400">
              Grupos
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400">
              Atividade
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Menu Sections */}
            <motion.div 
              className="grid lg:grid-cols-2 gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, staggerChildren: 0.1 }}
            >
              {/* Account */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-gray-700 transition-colors"
              >
                <div className="px-5 py-4 border-b border-gray-800">
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Conta</h3>
                </div>
                {menuItems.map((item, i) => (
                  <Link 
                    key={item.title}
                    to={createPageUrl(item.page)}
                    className={`flex items-center justify-between p-4 hover:bg-gray-800 transition-colors ${
                      i !== menuItems.length - 1 ? "border-b border-gray-800" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                        <item.icon className="h-5 w-5 text-violet-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white text-sm">{item.title}</p>
                        <p className="text-xs text-gray-400">{item.description}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-600" />
                  </Link>
                ))}
              </motion.div>

              {/* Support */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-gray-700 transition-colors"
              >
                <div className="px-5 py-4 border-b border-gray-800">
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Suporte</h3>
                </div>
                {supportItems.map((item, i) => (
                  <Link 
                    key={item.title}
                    to={createPageUrl(item.page)}
                    className={`flex items-center justify-between p-4 hover:bg-gray-800 transition-colors ${
                      i !== supportItems.length - 1 ? "border-b border-gray-800" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-5 w-5 text-gray-400" />
                      <p className="text-gray-300 text-sm">{item.title}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-600" />
                  </Link>
                ))}
              </motion.div>
            </motion.div>

            {/* Featured Posts & Collections */}
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
               <FeaturedPostsSection userEmail={user?.email} />
               <PostCollectionsManager userEmail={user?.email} />
               </motion.div>

               {/* Portfolio & Engagement */}
               <motion.div 
                 className="grid lg:grid-cols-2 gap-6"
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.6 }}
               >
                 <PortfolioShowcase userEmail={user?.email} />
                 <div className="space-y-6">
                   <SocialMediaIntegration userEmail={user?.email} userName={user?.full_name} />
                   <EngagementDashboard userEmail={user?.email} />
                 </div>
               </motion.div>

               {/* Gamification Section */}
               {userPoints && (
               <motion.div 
                 className="space-y-6"
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.7 }}
               >
                {/* Tabs for Progress and Certificates */}
                <Tabs defaultValue="progress">
                  <TabsList className="w-full bg-gray-900 border border-gray-800">
                    <TabsTrigger value="progress" className="flex-1 data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400">
                      <Trophy className="h-4 w-4 mr-2" />
                      Conquistas
                    </TabsTrigger>
                    <TabsTrigger value="certificates" className="flex-1 data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400">
                      <Award className="h-4 w-4 mr-2" />
                      Certificados
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="progress" className="space-y-6 mt-6">
                    {/* Points */}
                    <PointsCard points={userPoints.total_points} breakdown={userPoints} />

                    {/* Badge Showcase */}
                    <BadgeShowcase userEmail={user?.email} />

                    {/* Achievements */}
                    {achievements.length > 0 && (
                      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                          <Trophy className="h-5 w-5 text-amber-400" />
                          Suas Conquistas ({achievements.length})
                        </h3>
                        <div className="space-y-3">
                          {achievements.map((achievement) => (
                            <AchievementCard key={achievement.id} achievement={achievement} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* CTA to Leaderboard */}
                    <div className="bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/30 rounded-2xl p-6 text-center">
                      <Trophy className="h-12 w-12 text-amber-400 mx-auto mb-3" />
                      <p className="text-white mb-4">Veja como você se compara com outros investidores</p>
                      <Link to={createPageUrl("Leaderboard")}>
                        <Button className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-gray-900 font-semibold">
                          <Trophy className="h-4 w-4 mr-2" />
                          Ver Ranking
                        </Button>
                      </Link>
                    </div>
                  </TabsContent>

                  <TabsContent value="certificates" className="mt-6">
                    <CertificatesList userEmail={user?.email} />
                  </TabsContent>
                </Tabs>
                </motion.div>
                )}

                {/* Logout Button */}
                <Button
                  variant="outline"
                  className="w-full h-12 text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/30"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Sair da conta
                </Button>

                {/* Delete Account */}
                <div className="bg-red-950/20 border border-red-900/40 rounded-2xl p-5 mt-2">
                  <h3 className="text-sm font-semibold text-red-400 mb-1">Zona de perigo</h3>
                  <p className="text-xs text-gray-500 mb-4">A exclusão da conta é permanente e irrecuperável. Todos os seus dados serão removidos.</p>
                  <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="w-full h-11 border-red-800 text-red-500 hover:bg-red-900/30 hover:text-red-400">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir minha conta
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-gray-900 border-gray-700">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">Excluir conta permanentemente?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-400">
                          Esta ação não pode ser desfeita. Todos os seus dados, histórico, cursos e conquistas serão permanentemente excluídos.
                          <br /><br />
                          Para confirmar, entre em contato com nosso suporte — a exclusão definitiva é processada manualmente para garantir sua segurança.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="border-gray-700 text-gray-300 hover:bg-gray-800">
                          Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 hover:bg-red-700 text-white"
                          onClick={() => {
                            base44.auth.logout();
                            toast.info("Conta desconectada. Para exclusão definitiva, contate o suporte.");
                          }}
                        >
                          Entendo, prosseguir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                </TabsContent>

          <TabsContent value="saved">
            <SavedPostsSection userEmail={user?.email} />
          </TabsContent>

          <TabsContent value="groups">
            <UserGroupsSection userEmail={user?.email} />
          </TabsContent>

          <TabsContent value="activity">
            <RecentActivitySection userEmail={user?.email} />
          </TabsContent>
        </Tabs>
        </motion.div>
      </div>

      {profile && (
        <EditProfileDialog 
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          profile={profile}
          onSuccess={() => loadData(true)}
        />
      )}
    </div>
  );
}