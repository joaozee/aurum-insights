import { useEffect } from "react";
import { base44 } from "@/api/base44Client";

export default function CommunityNotificationHandler({ userEmail }) {
  useEffect(() => {
    if (!userEmail) return;

    // Subscribe to DirectMessage changes
    const unsubscribeDM = base44.entities.DirectMessage.subscribe((event) => {
      if (event.type === 'create') {
        const msg = event.data;
        if (msg.receiver_email === userEmail) {
          createNotification({
            user_email: userEmail,
            type: 'nova_mensagem',
            title: 'Nova mensagem',
            message: `${msg.sender_email} enviou uma mensagem`,
            from_user_email: msg.sender_email,
            from_user_name: msg.sender_email.split('@')[0],
            related_entity_id: msg.conversation_id,
            severity: 'info'
          });
        }
      }
    });

    // Subscribe to UserFollow changes
    const unsubscribeFollow = base44.entities.UserFollow.subscribe((event) => {
      if (event.type === 'create') {
        const follow = event.data;
        if (follow.followed_email === userEmail) {
          createNotification({
            user_email: userEmail,
            type: 'novo_seguidor',
            title: 'Novo seguidor',
            message: `${follow.follower_email} começou a te seguir`,
            from_user_email: follow.follower_email,
            from_user_name: follow.follower_email.split('@')[0],
            related_entity_id: follow.follower_email,
            severity: 'info'
          });
        }
      }
    });

    // Subscribe to CommunityPost changes (for mentions)
    const unsubscribePost = base44.entities.CommunityPost.subscribe((event) => {
      if (event.type === 'create' || event.type === 'update') {
        const post = event.data;
        // Check for mentions
        if (post.content && post.content.includes('@')) {
          const mentions = post.content.match(/@[\w.-]+@[\w.-]+/g);
          if (mentions && mentions.includes(`@${userEmail}`)) {
            createNotification({
              user_email: userEmail,
              type: 'mencao',
              title: 'Você foi mencionado',
              message: `${post.author_name} mencionou você em um post`,
              from_user_email: post.author_email,
              from_user_name: post.author_name,
              related_entity_id: post.id,
              severity: 'info'
            });
          }
        }
      }
    });

    return () => {
      unsubscribeDM();
      unsubscribeFollow();
      unsubscribePost();
    };
  }, [userEmail]);

  const createNotification = async (data) => {
    try {
      const settings = await base44.entities.NotificationSettings.filter({
        user_email: data.user_email
      });

      const userSettings = settings.length > 0 ? settings[0] : {};
      
      // Check if this type of notification is enabled
      const notificationTypeKey = `${data.type.split('_').slice(0, -1).join('_')}_enabled`;
      if (notificationTypeKey === 'novo_' || !userSettings[notificationTypeKey]) {
        return; // Skip if not enabled
      }

      // Create the notification
      await base44.entities.Notification.create(data);
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  return null;
}