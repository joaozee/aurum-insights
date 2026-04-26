import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Bell, X, MessageSquare, Heart, MessageCircle, UserPlus, AtSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function NotificationBell({ userEmail }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userEmail) return;
    loadNotifications();
    
    const unsubscribe = base44.entities.Notification.subscribe((event) => {
      if (event.data?.user_email === userEmail) {
        loadNotifications();
      }
    });

    return () => unsubscribe();
  }, [userEmail]);

  const loadNotifications = async () => {
    try {
      const data = await base44.entities.Notification.filter(
        { user_email: userEmail },
        '-created_date',
        20
      );
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await base44.entities.Notification.update(notificationId, { is_read: true });
      loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await base44.entities.Notification.delete(notificationId);
      loadNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      'nova_mensagem': MessageSquare,
      'novo_seguidor': UserPlus,
      'curtida_post': Heart,
      'comentario_post': MessageCircle,
      'mencao': AtSign,
    };
    return icons[type] || Bell;
  };

  const getNotificationColor = (type) => {
    const colors = {
      'nova_mensagem': 'text-blue-400',
      'novo_seguidor': 'text-violet-400',
      'curtida_post': 'text-red-400',
      'comentario_post': 'text-amber-400',
      'mencao': 'text-cyan-400',
    };
    return colors[type] || 'text-gray-400';
  };

  const getNotificationLink = (notification) => {
    switch (notification.type) {
      case 'nova_mensagem':
        return createPageUrl("Messages") + `?email=${notification.from_user_email}`;
      case 'novo_seguidor':
      case 'curtida_post':
      case 'comentario_post':
      case 'mencao':
        return createPageUrl("PublicProfile") + `?email=${notification.from_user_email}`;
      default:
        return null;
    }
  };

  return (
    <div className="relative">
      <Button
        onClick={() => setOpen(!open)}
        variant="ghost"
        size="icon"
        className="relative text-gray-400 hover:text-white"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500">
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl z-50">
          <div className="border-b border-gray-800 p-4 flex items-center justify-between">
            <h3 className="font-semibold text-white">Notificações</h3>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="h-6 w-6 text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              <div className="divide-y divide-gray-800">
                {notifications.map((notification) => {
                  const IconComponent = getNotificationIcon(notification.type);
                  const link = getNotificationLink(notification);

                  return (
                    <Link
                      key={notification.id}
                      to={link || "#"}
                      onClick={() => {
                        if (!notification.is_read) {
                          markAsRead(notification.id);
                        }
                        setOpen(false);
                      }}
                    >
                      <div className={`p-4 hover:bg-gray-800/50 transition-colors ${!notification.is_read ? 'bg-gray-800/30' : ''}`}>
                        <div className="flex gap-3">
                          <div className={`h-8 w-8 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-white">{notification.title}</p>
                            <p className="text-xs text-gray-400 mt-1 truncate">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              {new Date(notification.created_date).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.preventDefault();
                              deleteNotification(notification.id);
                            }}
                            className="h-6 w-6 text-gray-500 hover:text-red-400 flex-shrink-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Bell className="h-8 w-8 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Nenhuma notificação</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}