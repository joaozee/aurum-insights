import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AchievementUnlockNotification from "./AchievementUnlockNotification";

export default function GamificationManager({ userEmail, children }) {
  const [unlockedBadge, setUnlockedBadge] = useState(null);
  const [userPoints, setUserPoints] = useState(null);

  useEffect(() => {
    if (userEmail) {
      loadUserPoints();
      checkAndUnlockBadges();
    }
  }, [userEmail]);

  const loadUserPoints = async () => {
    try {
      const points = await base44.entities.UserPoints.filter({ user_email: userEmail });
      setUserPoints(points[0]);
    } catch (err) {
      console.error(err);
    }
  };

  const checkAndUnlockBadges = async () => {
    try {
      const [allBadges, userAchievements, points] = await Promise.all([
        base44.entities.Badge.list(),
        base44.entities.UserAchievement.filter({ user_email: userEmail }),
        base44.entities.UserPoints.filter({ user_email: userEmail })
      ]);

      const currentPoints = points[0] || {};
      const unlockedBadgeIds = userAchievements.map(a => a.badge_id);

      // Check each badge
      for (const badge of allBadges) {
        if (unlockedBadgeIds.includes(badge.id)) continue;

        const currentValue = {
          courses_completed: currentPoints.courses_completed || 0,
          points: currentPoints.total_points || 0,
          posts: currentPoints.posts_created || 0,
          community_engagement: currentPoints.community_engagement_score || 0
        }[badge.requirement_type] || 0;

        // Unlock badge if requirement is met
        if (currentValue >= badge.requirement_value) {
          await base44.entities.UserAchievement.create({
            user_email: userEmail,
            badge_id: badge.id,
            badge_name: badge.name,
            unlocked_at: new Date().toISOString()
          });
          
          // Create notification
          await base44.entities.Notification.create({
            user_email: userEmail,
            type: "meta_atingida",
            title: "🏆 Nova Conquista!",
            message: `Você desbloqueou: ${badge.name}`,
            severity: "success",
            related_entity_id: badge.id,
            is_read: false
          });
          
          setUnlockedBadge(badge);
          
          // Show one at a time
          break;
        }
      }
    } catch (err) {
      console.error("Error checking badges:", err);
    }
  };

  return (
    <>
      {children}
      {unlockedBadge && (
        <AchievementUnlockNotification 
          badge={unlockedBadge}
          onClose={() => setUnlockedBadge(null)}
        />
      )}
    </>
  );
}