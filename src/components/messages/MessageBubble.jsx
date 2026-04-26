import { Play, Pause, Image as ImageIcon, Download } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function MessageBubble({ message, isOwn, senderProfile }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current;
      
      const handleLoadedMetadata = () => {
        if (audio) {
          setDuration(audio.duration || 0);
        }
      };
      
      const handleTimeUpdate = () => {
        if (audio) {
          setCurrentTime(audio.currentTime || 0);
        }
      };
      
      const handleEnded = () => {
        setIsPlaying(false);
      };
      
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('ended', handleEnded);
      
      return () => {
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, [message.attachment_url]);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const bubbleClasses = isOwn
    ? 'bg-violet-600 text-white'
    : 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white';

  const timeClasses = isOwn ? 'text-violet-200' : 'text-gray-500';

  if (message.message_type === 'image') {
    return (
      <div className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end`}>
        {!isOwn && (
          <Avatar className="h-8 w-8 flex-shrink-0">
            {senderProfile?.profile_image_url ? (
              <img 
                src={senderProfile.profile_image_url} 
                alt={senderProfile.display_name || 'User'}
                className="w-full h-full object-cover"
              />
            ) : (
              <AvatarFallback className="bg-violet-500 text-white text-xs">
                {message.sender_email?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            )}
          </Avatar>
        )}
        <div className={`max-w-[70%] rounded-2xl overflow-hidden`}>
          <img 
            src={message.attachment_url} 
            alt="Imagem" 
            className="w-full max-h-96 object-cover cursor-pointer"
            onClick={() => window.open(message.attachment_url, '_blank')}
          />
          {message.message && (
            <div className={`px-4 py-2 ${bubbleClasses}`}>
              <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
            </div>
          )}
          <div className={`px-4 py-1 ${bubbleClasses}`}>
            <p className={`text-xs ${timeClasses}`}>
              {new Date(message.created_date).toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (message.message_type === 'audio') {
    return (
      <div className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end`}>
        {!isOwn && (
          <Avatar className="h-8 w-8 flex-shrink-0">
            {senderProfile?.profile_image_url ? (
              <img 
                src={senderProfile.profile_image_url} 
                alt={senderProfile.display_name || 'User'}
                className="w-full h-full object-cover"
              />
            ) : (
              <AvatarFallback className="bg-violet-500 text-white text-xs">
                {message.sender_email?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            )}
          </Avatar>
        )}
        <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${bubbleClasses}`}>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlayPause}
              className="h-8 w-8 rounded-full"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <div className="flex-1">
              <div className="h-1 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-current"
                  style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>
            </div>
            <span className={`text-xs ${timeClasses} font-mono`}>
              {formatTime(duration - currentTime)}
            </span>
          </div>
          <audio ref={audioRef} src={message.attachment_url} />
          <p className={`text-xs ${timeClasses} mt-1`}>
            {new Date(message.created_date).toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end`}>
      {!isOwn && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          {senderProfile?.profile_image_url ? (
            <img 
              src={senderProfile.profile_image_url} 
              alt={senderProfile.display_name || 'User'}
              className="w-full h-full object-cover"
            />
          ) : (
            <AvatarFallback className="bg-violet-500 text-white text-xs">
              {message.sender_email?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          )}
        </Avatar>
      )}
      <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${bubbleClasses}`}>
        <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
        <div className="flex items-center gap-2 mt-1">
          <p className={`text-xs ${timeClasses}`}>
            {new Date(message.created_date).toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
          {isOwn && message.is_read && (
            <span className={`text-xs ${timeClasses}`}>✓✓</span>
          )}
        </div>
      </div>
    </div>
  );
}