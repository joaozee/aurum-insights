import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";

const PushNotificationService = {
  init: (userEmail) => {
    if (!("Notification" in window)) {
      console.log("Este navegador não suporta notificações");
      return;
    }

    // Request permission if not already decided
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    // Subscribe to notifications in real-time
    if (userEmail) {
      const unsubscribe = base44.entities.Notification.subscribe((event) => {
        if (event.type === 'create' && event.data.user_email === userEmail && !event.data.is_read) {
          PushNotificationService.showNotification(event.data);
        }
      });

      return unsubscribe;
    }
  },

  showNotification: (notificationData) => {
    if (Notification.permission === "granted") {
      const notification = new Notification(notificationData.title || "Aurum", {
        body: notificationData.message,
        icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6962dc8bf4f8f8a96c5dc36b/e3135d805_WhatsAppImage2026-01-30at190245.jpg",
        badge: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6962dc8bf4f8f8a96c5dc36b/e3135d805_WhatsAppImage2026-01-30at190245.jpg",
        tag: notificationData.id,
        requireInteraction: false,
        silent: false
      });

      notification.onclick = () => {
        window.focus();
        if (notificationData.type === "message" && notificationData.data) {
          try {
            const data = JSON.parse(notificationData.data);
            window.location.href = `/messages?conversation=${data.conversation_id}&email=${data.sender_email}`;
          } catch (e) {
            console.error(e);
          }
        }
        notification.close();
      };
    } else {
      toast.info(notificationData.message, {
        description: notificationData.title
      });
    }
  }
};

export default PushNotificationService;

export function PushNotificationButton({ userEmail }) {
  const [permission, setPermission] = useState(
    "Notification" in window ? Notification.permission : "denied"
  );

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      toast.error("Este navegador não suporta notificações");
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === "granted") {
        toast.success("Notificações ativadas!");
      } else {
        toast.error("Permissão negada para notificações");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao solicitar permissão");
    }
  };

  if (!("Notification" in window)) {
    return null;
  }

  if (permission === "granted") {
    return (
      <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
        <Bell className="h-3 w-3" />
        <span className="hidden sm:inline">Notificações ativas</span>
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <BellOff className="h-3 w-3" />
        <span className="hidden sm:inline">Notificações bloqueadas</span>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={requestPermission}
      className="text-xs"
    >
      <Bell className="h-3 w-3 mr-1" />
      <span className="hidden sm:inline">Ativar notificações</span>
    </Button>
  );
}