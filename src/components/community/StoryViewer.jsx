import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function StoryViewer({ userStory, currentUserEmail, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const currentStory = userStory.stories[currentIndex];

  useEffect(() => {
    markAsViewed();
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [currentIndex]);

  const markAsViewed = async () => {
    if (!currentStory.viewed_by?.includes(currentUserEmail)) {
      await base44.entities.Story.update(currentStory.id, {
        viewed_by: [...(currentStory.viewed_by || []), currentUserEmail],
        views_count: (currentStory.views_count || 0) + 1
      });
    }
  };

  const handleNext = () => {
    if (currentIndex < userStory.stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Progress bars */}
      <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
        {userStory.stories.map((_, idx) => (
          <div key={idx} className="flex-1 h-0.5 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-100"
              style={{ 
                width: idx === currentIndex ? `${progress}%` : idx < currentIndex ? "100%" : "0%" 
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 ring-2 ring-white/20">
            {userStory.user_avatar ? (
              <img src={userStory.user_avatar} alt={userStory.user_name} />
            ) : (
              <AvatarFallback className="bg-violet-500">
                {userStory.user_name?.[0]}
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <p className="text-white font-semibold text-sm">{userStory.user_name}</p>
            <p className="text-gray-300 text-xs">
              {formatDistanceToNow(new Date(currentStory.created_date), { 
                addSuffix: true, 
                locale: ptBR 
              })}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="text-white">
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Story content */}
      <img 
        src={currentStory.media_url} 
        alt="Story"
        className="max-h-screen max-w-screen object-contain"
      />

      {/* Caption */}
      {currentStory.caption && (
        <div className="absolute bottom-8 left-4 right-4">
          <p className="text-white text-sm">{currentStory.caption}</p>
        </div>
      )}

      {/* Navigation */}
      {currentIndex > 0 && (
        <button 
          onClick={handlePrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white"
        >
          <ChevronLeft className="h-8 w-8" />
        </button>
      )}
      {currentIndex < userStory.stories.length - 1 && (
        <button 
          onClick={handleNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white"
        >
          <ChevronRight className="h-8 w-8" />
        </button>
      )}
    </div>
  );
}