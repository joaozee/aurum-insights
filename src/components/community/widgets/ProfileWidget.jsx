import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";

export default function ProfileWidget({ user, userProfile, userPoints }) {
  const [connectionsCount, setConnectionsCount] = useState(0);

  useEffect(() => {
    if (user?.email) {
      loadConnections();
    }
  }, [user?.email]);

  const loadConnections = async () => {
    try {
      const followers = await base44.entities.UserFollow.filter({
        following_email: user.email
      });
      const following = await base44.entities.UserFollow.filter({
        follower_email: user.email
      });
      
      // Conexões são seguidores mútuos
      const followerEmails = new Set(followers.map(f => f.follower_email));
      const connections = following.filter(f => followerEmails.has(f.following_email));
      
      setConnectionsCount(connections.length);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 overflow-hidden">
      {userProfile?.cover_image ? (
        <div 
          className="h-16 bg-cover bg-center"
          style={{ backgroundImage: `url(${userProfile.cover_image})` }}
        />
      ) : (
        <div className="h-16 bg-gradient-to-r from-violet-600 to-purple-700"></div>
      )}
      <div className="px-4 pb-4 -mt-8">
        <Link to={createPageUrl("Profile")}>
          <Avatar className="h-16 w-16 border-4 border-white dark:border-gray-900 mb-3">
            <AvatarImage src={userProfile?.avatar_url || user?.avatar_url} alt={user?.full_name} />
            <AvatarFallback className="bg-violet-500 text-white text-xl">
              {user?.full_name?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
        </Link>
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
          {user?.full_name}
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
          {userProfile?.bio || "Investidor"}
        </p>
        
        <div className="border-t border-gray-200 dark:border-gray-800 pt-3">
          <Link 
            to={createPageUrl("Network")} 
            className="flex justify-between text-xs hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg p-2 -mx-2 transition-colors"
          >
            <span className="text-gray-600 dark:text-gray-400">Conexões</span>
            <span className="font-semibold text-violet-600">{connectionsCount}</span>
          </Link>
        </div>
      </div>
    </Card>
  );
}