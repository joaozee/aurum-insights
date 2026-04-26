import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StoriesBar({ currentUserEmail, onViewStory, onCreateStory }) {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      const now = new Date();
      const allStories = await base44.entities.Story.list("-created_date", 50);
      
      // Filter stories that haven't expired (24h)
      const activeStories = allStories.filter(story => {
        const expiresAt = new Date(story.expires_at);
        return expiresAt > now;
      });

      // Group by user
      const groupedStories = activeStories.reduce((acc, story) => {
        if (!acc[story.user_email]) {
          acc[story.user_email] = {
            user_email: story.user_email,
            user_name: story.user_name,
            user_avatar: story.user_avatar,
            stories: []
          };
        }
        acc[story.user_email].stories.push(story);
        return acc;
      }, {});

      setStories(Object.values(groupedStories));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const hasViewedAll = (userStories) => {
    return userStories.stories.every(s => s.viewed_by?.includes(currentUserEmail));
  };

  return (
    <div className="bg-gray-900 border-b border-gray-800 px-4 py-4">
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {/* Add Story */}
        <button
          onClick={onCreateStory}
          className="flex-shrink-0 flex flex-col items-center gap-2 group"
        >
          <div className="relative">
            <Avatar className="h-16 w-16 ring-2 ring-gray-700">
              <AvatarFallback className="bg-violet-500/20 text-violet-400">
                U
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 h-5 w-5 bg-violet-600 rounded-full flex items-center justify-center ring-2 ring-gray-900">
              <Plus className="h-3 w-3 text-white" />
            </div>
          </div>
          <span className="text-xs text-gray-400">Seu Story</span>
        </button>

        {/* Stories */}
        {stories.map((userStory) => {
          const viewed = hasViewedAll(userStory);
          return (
            <button
              key={userStory.user_email}
              onClick={() => onViewStory(userStory)}
              className="flex-shrink-0 flex flex-col items-center gap-2 group"
            >
              <div className={cn(
                "p-0.5 rounded-full",
                viewed ? "bg-gray-700" : "bg-gradient-to-tr from-violet-500 via-purple-500 to-pink-500"
              )}>
                <Avatar className="h-16 w-16 ring-2 ring-gray-900">
                  {userStory.user_avatar ? (
                    <img src={userStory.user_avatar} alt={userStory.user_name} />
                  ) : (
                    <AvatarFallback className="bg-violet-500/20 text-violet-400">
                      {userStory.user_name?.[0] || "U"}
                    </AvatarFallback>
                  )}
                </Avatar>
              </div>
              <span className={cn(
                "text-xs max-w-[70px] truncate",
                viewed ? "text-gray-500" : "text-white"
              )}>
                {userStory.user_name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}