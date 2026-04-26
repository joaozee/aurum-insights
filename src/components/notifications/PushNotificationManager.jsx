import { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function PushNotificationManager({ userEmail }) {
  useEffect(() => {
    if (!userEmail || !("Notification" in window)) return;

    // Request permission on mount if not already decided
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    // Subscribe to notifications in real-time
    const unsubscribe = base44.entities.Notification.subscribe((event) => {
      if (event.type === 'create' && event.data.user_email === userEmail && !event.data.is_read) {
        showNotification(event.data);
      }
    });

    return unsubscribe;
  }, [userEmail]);

  const showNotification = (notificationData) => {
    // Show browser notification if permission granted
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
        // Handle notification click based on type
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
    }
  };

  return null; // This is a utility component, no UI
}