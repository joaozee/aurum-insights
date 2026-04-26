import { useEffect } from "react";
import { base44 } from "@/api/base44Client";

// Component to track and award points for user actions
export const useGamificationTracker = (userEmail) => {
  
  const awardPoints = async (action, amount) => {
    if (!userEmail) return;
    
    try {
      const pointsRecords = await base44.entities.UserPoints.filter({ user_email: userEmail });
      
      if (pointsRecords.length === 0) {
        // Create new points record
        await base44.entities.UserPoints.create({
          user_email: userEmail,
          total_points: amount,
          points_from_lessons: action === 'lesson_completed' ? amount : 0,
          points_from_courses: action === 'course_completed' ? amount : 0,
          points_from_community: action === 'community_action' ? amount : 0,
          courses_completed: action === 'course_completed' ? 1 : 0,
          posts_created: action === 'post_created' ? 1 : 0,
          community_engagement_score: action === 'post_liked' ? 1 : 0
        });
      } else {
        const current = pointsRecords[0];
        const updates = {
          total_points: (current.total_points || 0) + amount
        };

        if (action === 'lesson_completed') {
          updates.points_from_lessons = (current.points_from_lessons || 0) + amount;
        } else if (action === 'course_completed') {
          updates.points_from_courses = (current.points_from_courses || 0) + amount;
          updates.courses_completed = (current.courses_completed || 0) + 1;
        } else if (action === 'post_created') {
          updates.points_from_community = (current.points_from_community || 0) + amount;
          updates.posts_created = (current.posts_created || 0) + 1;
        } else if (action === 'post_liked' || action === 'comment_created') {
          updates.points_from_community = (current.points_from_community || 0) + amount;
          updates.community_engagement_score = (current.community_engagement_score || 0) + 1;
        }

        await base44.entities.UserPoints.update(current.id, updates);
      }

      // Check for badge unlocks
      await checkBadgeUnlocks(userEmail);
    } catch (e) {
      console.error('Error awarding points:', e);
    }
  };

  const checkBadgeUnlocks = async (userEmail) => {
    try {
      const [pointsRecords, badges, achievements] = await Promise.all([
        base44.entities.UserPoints.filter({ user_email: userEmail }),
        base44.entities.Badge.list(),
        base44.entities.UserAchievement.filter({ user_email: userEmail })
      ]);

      if (pointsRecords.length === 0) return;

      const userPoints = pointsRecords[0];
      const unlockedBadgeIds = new Set(achievements.map(a => a.badge_id));

      for (const badge of badges) {
        if (unlockedBadgeIds.has(badge.id)) continue;

        let shouldUnlock = false;

        switch (badge.requirement_type) {
          case 'courses_completed':
            shouldUnlock = (userPoints.courses_completed || 0) >= badge.requirement_value;
            break;
          case 'points':
            shouldUnlock = (userPoints.total_points || 0) >= badge.requirement_value;
            break;
          case 'posts':
            shouldUnlock = (userPoints.posts_created || 0) >= badge.requirement_value;
            break;
          case 'community_engagement':
            shouldUnlock = (userPoints.community_engagement_score || 0) >= badge.requirement_value;
            break;
        }

        if (shouldUnlock) {
          await base44.entities.UserAchievement.create({
            user_email: userEmail,
            badge_id: badge.id,
            badge_name: badge.name,
            unlocked_at: new Date().toISOString()
          });
        }
      }
    } catch (e) {
      console.error('Error checking badges:', e);
    }
  };

  return { awardPoints };
};

export default useGamificationTracker;