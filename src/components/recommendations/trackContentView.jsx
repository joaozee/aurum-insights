import { base44 } from "@/api/base44Client";

/**
 * Track content view for recommendation engine
 */
export const trackContentView = async (userEmail, contentType, contentId, contentTitle, contentCategory) => {
  try {
    if (!userEmail) return;

    await base44.entities.ContentView.create({
      user_email: userEmail,
      content_type: contentType,
      content_id: contentId,
      content_title: contentTitle,
      content_category: contentCategory,
      time_spent_seconds: 0,
      completed: false
    });
  } catch (e) {
    console.log("Error tracking content view:", e);
  }
};

/**
 * Update content view with completion status and time spent
 */
export const updateContentView = async (userEmail, contentId, timeSpentSeconds, completed = false) => {
  try {
    if (!userEmail) return;

    const existingViews = await base44.entities.ContentView.filter({
      user_email: userEmail,
      content_id: contentId
    }, "-created_date", 1);

    if (existingViews.length > 0) {
      await base44.entities.ContentView.update(existingViews[0].id, {
        time_spent_seconds: timeSpentSeconds,
        completed: completed
      });
    }
  } catch (e) {
    console.log("Error updating content view:", e);
  }
};