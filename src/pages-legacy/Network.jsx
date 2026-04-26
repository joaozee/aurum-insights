import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Users, UserPlus, MessageCircle, Search, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import StartConversationButton from "@/components/community/StartConversationButton";
import { toast } from "sonner";

export default function Network() {
  const [user, setUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      const [usersData, followingData, followersData] = await Promise.all([
        base44.entities.User.list(),
        base44.entities.UserFollow.filter({ follower_email: userData.email }),
        base44.entities.UserFollow.filter({ following_email: userData.email })
      ]);

      setAllUsers(usersData.filter(u => u.email !== userData.email));
      setFollowing(followingData);
      setFollowers(followersData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (targetEmail) => {
    try {
      const targetUser = allUsers.find(u => u.email === targetEmail);
      await base44.entities.UserFollow.create({
        follower_email: user.email,
        follower_name: user.full_name || user.email.split('@')[0],
        following_email: targetEmail,
        following_name: targetUser?.full_name || targetEmail.split('@')[0]
      });
      toast.success("Seguindo usuário!");
      loadData();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao seguir usuário");
    }
  };

  const handleUnfollow = async (targetEmail) => {
    try {
      const followRecord = following.find(f => f.following_email === targetEmail);
      if (followRecord) {
        await base44.entities.UserFollow.delete(followRecord.id);
        toast.success("Deixou de seguir");
        loadData();
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao deixar de seguir");
    }
  };

  const isFollowing = (email) => following.some(f => f.following_email === email);

  const filteredUsers = allUsers.filter(u => 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 p-4">
        <Skeleton className="h-32" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      <div className="max-w-6xl mx-auto p-4">
        {/* Back Button */}
        <Link to={createPageUrl("Community")} className="inline-flex items-center gap-2 text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Voltar para comunidade
        </Link>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Minha Rede</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Conecte-se com outros investidores
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-violet-500/20 flex items-center justify-center">
                <Users className="h-6 w-6 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{following.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Seguindo</p>
              </div>
            </div>
          </Card>
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <UserPlus className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{followers.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Seguidores</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search */}
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar investidores..."
              className="pl-9"
            />
          </div>
        </Card>

        {/* Users List */}
         <div className="space-y-3">
           {filteredUsers.length > 0 ? (
             filteredUsers.map((targetUser) => (
               <Card key={targetUser.id} className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 p-4 hover:border-violet-300 dark:hover:border-violet-700 transition-colors">
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3 flex-1">
                     <Link to={createPageUrl("PublicProfile") + `?email=${targetUser.email}`}>
                       <Avatar className="h-12 w-12">
                         <AvatarFallback className="bg-violet-500 text-white">
                           {targetUser.full_name?.[0] || targetUser.email[0].toUpperCase()}
                         </AvatarFallback>
                       </Avatar>
                     </Link>
                     <div>
                       <Link to={createPageUrl("PublicProfile") + `?email=${targetUser.email}`}>
                         <h3 className="font-semibold text-gray-900 dark:text-white hover:text-violet-600">
                           {targetUser.full_name || "Usuário"}
                         </h3>
                       </Link>
                       <p className="text-sm text-gray-600 dark:text-gray-400">{targetUser.email}</p>
                     </div>
                   </div>
                   <div className="flex items-center gap-2">
                     <StartConversationButton 
                       currentUserEmail={user?.email}
                       targetUserEmail={targetUser.email}
                     />
                     {isFollowing(targetUser.email) ? (
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => handleUnfollow(targetUser.email)}
                       >
                         Seguindo
                       </Button>
                     ) : (
                       <Button
                         size="sm"
                         className="bg-violet-600 hover:bg-violet-700"
                         onClick={() => handleFollow(targetUser.email)}
                       >
                         <UserPlus className="h-4 w-4 mr-1" />
                         Seguir
                       </Button>
                     )}
                   </div>
                 </div>
               </Card>
             ))
           ) : (
             <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 p-12 text-center">
               <Users className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
               <p className="text-gray-600 dark:text-gray-400">
                 {searchTerm ? "Nenhum investidor encontrado" : "Nenhum investidor disponível"}
               </p>
             </Card>
           )}
         </div>
      </div>
    </div>
  );
}