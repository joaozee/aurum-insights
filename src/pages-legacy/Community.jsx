import { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Home,
  Users,
  Briefcase,
  MessageSquare,
  Bell,
  Search,
  TrendingUp,
  Award,
  Bookmark,
  Sliders
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import CreatePostCard from "@/components/community/CreatePostCard";
import PostCard from "@/components/community/PostCard";
import PersonalizedFeed from "@/components/community/PersonalizedFeed";
import AIMarketNews from "@/components/community/AIMarketNews";

import ProfileWidget from "@/components/community/widgets/ProfileWidget";
import TopInvestorsWidget from "@/components/community/widgets/TopInvestorsWidget";
import MyItemsSidebar from "@/components/community/MyItemsSidebar";
import FeedPreferencesDialog from "@/components/community/FeedPreferencesDialog";
import { toast } from "sonner";

export default function Community() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [userPoints, setUserPoints] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [preferencesDialogOpen, setPreferencesDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
    
    // Subscribe to real-time post updates
    const unsubscribe = base44.entities.CommunityPost.subscribe((event) => {
      if (event.type === 'create') {
        setPosts(prev => [event.data, ...prev]);
      } else if (event.type === 'update') {
        setPosts(prev => prev.map(p => p.id === event.id ? event.data : p));
      } else if (event.type === 'delete') {
        setPosts(prev => prev.filter(p => p.id !== event.id));
      }
    });
    
    return unsubscribe;
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      
      // Load user profile
      const profiles = await base44.entities.UserProfile.filter({
        user_email: userData.email
      });
      if (profiles.length > 0) {
        setUserProfile(profiles[0]);
      }

      // Load user points
      const points = await base44.entities.UserPoints.filter({
        user_email: userData.email
      });
      if (points.length > 0) {
        setUserPoints(points[0]);
      }

      // Load feed preferences
      const prefs = await base44.entities.FeedPreferences.filter({
        user_email: userData.email
      });
      setPreferences(prefs[0] || null);
      
      const postData = await base44.entities.CommunityPost.list("-created_date", 50);
      setPosts(postData);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (post) => {
    if (!user) return;

    try {
      const isLiked = post.liked_by?.includes(user.email);
      
      if (isLiked) {
        await base44.entities.CommunityPost.update(post.id, {
          liked_by: post.liked_by.filter(email => email !== user.email),
          likes_count: (post.likes_count || 1) - 1
        });
      } else {
        await base44.entities.CommunityPost.update(post.id, {
          liked_by: [...(post.liked_by || []), user.email],
          likes_count: (post.likes_count || 0) + 1
        });
      }
      
      loadData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleComment = (post) => {
   // Handled by CommentDialog now
  };

  const handleDelete = async (postId) => {
   try {
     await base44.entities.CommunityPost.delete(postId);
     toast.success("Post deletado");
     loadData();
   } catch (error) {
     console.error(error);
     toast.error("Erro ao deletar post");
   }
  };

  const handleShare = (post) => {
   toast.info("Use o botão de compartilhamento para recomendar para seus seguidores");
  };

  // Pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartY = useRef(0);

  const handleTouchStart = useCallback((e) => {
    if (window.scrollY === 0) touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!touchStartY.current) return;
    const dist = e.touches[0].clientY - touchStartY.current;
    if (dist > 0 && dist < 90) setPullDistance(dist);
  }, []);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance > 65 && !refreshing) {
      setRefreshing(true);
      await loadData();
      setRefreshing(false);
    }
    setPullDistance(0);
    touchStartY.current = 0;
  }, [pullDistance, refreshing]);

  return (
    <div
      className="min-h-screen bg-gray-100 dark:bg-gray-950"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      {(pullDistance > 10 || refreshing) && (
        <div
          className="flex items-center justify-center overflow-hidden transition-all duration-200 bg-gray-950"
          style={{ height: refreshing ? 48 : pullDistance * 0.6 }}
        >
          <div className={`h-5 w-5 rounded-full border-2 border-violet-400 border-t-transparent ${refreshing ? 'animate-spin' : ''}`} />
        </div>
      )}
      {/* Top Navigation */}
      <div className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-4 flex-1">
              <div className="hidden md:flex relative max-w-xs flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Pesquisar"
                  className="pl-9 bg-gray-100 dark:bg-gray-800 border-0"
                />
              </div>
            </div>

            <div className="flex items-center gap-8">
              <Link to={createPageUrl("Home")} className="flex flex-col items-center gap-0.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                <Home className="h-5 w-5" />
                <span className="text-[10px] hidden sm:block">Início</span>
              </Link>
              <Link to={createPageUrl("Network")} className="flex flex-col items-center gap-0.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                <Users className="h-5 w-5" />
                <span className="text-[10px] hidden sm:block">Rede</span>
              </Link>
              <Link to={createPageUrl("Messages")} className="flex flex-col items-center gap-0.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                <MessageSquare className="h-5 w-5" />
                <span className="text-[10px] hidden sm:block">Mensagens</span>
              </Link>
              <Link to={createPageUrl("NotificationHistory")} className="flex flex-col items-center gap-0.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                <Bell className="h-5 w-5" />
                <span className="text-[10px] hidden sm:block">Notificações</span>
              </Link>
              <button 
                onClick={() => setPreferencesDialogOpen(true)}
                className="flex flex-col items-center gap-0.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                title="Personalizar Feed"
              >
                <Sliders className="h-5 w-5" />
                <span className="text-[10px] hidden sm:block">Feed</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - 3 Column Layout */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Profile */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            <ProfileWidget user={user} userProfile={userProfile} userPoints={userPoints} />
            <MyItemsSidebar userProfile={userProfile} />
          </div>

          {/* Center Feed */}
          <div className="col-span-12 lg:col-span-6 space-y-4">
            {/* Create Post */}
            {user && <CreatePostCard user={user} onPostCreated={loadData} />}

            {/* Personalized Posts Feed */}
            <PersonalizedFeed 
              userEmail={user?.email}
              preferences={preferences}
              currentUser={user}
              onRefresh={loadData}
            />
          </div>

          {/* Right Sidebar - News */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            {/* AI-Powered Market News */}
            <AIMarketNews userEmail={user?.email} />

            {/* Top Contributors */}
            <TopInvestorsWidget />
          </div>
        </div>
      </div>

      <FeedPreferencesDialog
        open={preferencesDialogOpen}
        onClose={() => setPreferencesDialogOpen(false)}
        userEmail={user?.email}
        onSuccess={() => {
          loadData();
          setPreferencesDialogOpen(false);
        }}
      />
    </div>
  );
}