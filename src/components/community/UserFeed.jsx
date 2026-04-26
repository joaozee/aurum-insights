import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function UserFeed({ userEmail }) {
  const [following, setFollowing] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userEmail) loadData();
  }, [userEmail]);

  const loadData = async () => {
    try {
      // Get users I'm following
      const followData = await base44.entities.UserFollow.filter({ 
        follower_email: userEmail 
      });
      
      // Get their profiles
      const followingEmails = followData.map(f => f.following_email);
      const profiles = await base44.entities.UserProfile.list();
      
      const followingProfiles = profiles.filter(p => followingEmails.includes(p.user_email));
      setFollowing(followingProfiles);

      // Suggest users (not following, has posts)
      const notFollowing = profiles.filter(p => 
        p.user_email !== userEmail && 
        !followingEmails.includes(p.user_email) &&
        (p.posts_count > 0 || p.followers_count > 5)
      ).sort((a, b) => (b.followers_count || 0) - (a.followers_count || 0)).slice(0, 5);
      
      setSuggestions(notFollowing);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-gray-900 border-gray-800 p-6">
        <Skeleton className="h-8 w-32 bg-gray-800 mb-4" />
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <Skeleton key={i} className="h-16 bg-gray-800" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Suggestions */}
      {suggestions.length > 0 && (
        <Card className="bg-gray-900 border-gray-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-violet-400" />
            <h3 className="font-semibold text-white">Sugestões para Seguir</h3>
          </div>
          <div className="space-y-3">
            {suggestions.map(profile => (
              <Link 
                key={profile.id} 
                to={`${createPageUrl("PublicProfile")}?email=${profile.user_email}`}
                className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-violet-500/20 text-violet-400">
                      {profile.user_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-white text-sm group-hover:text-violet-400 transition-colors">
                      {profile.user_name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {profile.followers_count || 0} seguidores
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="border-violet-500/30 text-violet-400">
                  Ver
                </Button>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* Following */}
      {following.length > 0 && (
        <Card className="bg-gray-900 border-gray-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-violet-400" />
            <h3 className="font-semibold text-white">Seguindo ({following.length})</h3>
          </div>
          <div className="space-y-2">
            {following.slice(0, 8).map(profile => (
              <Link 
                key={profile.id}
                to={`${createPageUrl("PublicProfile")}?email=${profile.user_email}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800/50 transition-colors"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-violet-500/20 text-violet-400 text-xs">
                    {profile.user_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <p className="text-sm text-gray-300 hover:text-violet-400 transition-colors">
                  {profile.user_name}
                </p>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}