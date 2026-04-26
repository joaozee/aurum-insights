import { base44 } from "@/api/base44Client";

/**
 * Generate a certificate for course completion
 */
export const generateCertificate = async (userEmail, userName, courseId, courseTitle, courseDuration, finalScore = 100) => {
  try {
    // Check if certificate already exists
    const existing = await base44.entities.Certificate.filter({
      user_email: userEmail,
      course_id: courseId
    });

    if (existing.length > 0) {
      return existing[0];
    }

    // Generate unique certificate number
    const certificateNumber = `AUR-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create certificate
    const certificate = await base44.entities.Certificate.create({
      user_email: userEmail,
      user_name: userName,
      course_id: courseId,
      course_title: courseTitle,
      course_duration: courseDuration,
      completion_date: new Date().toISOString().split("T")[0],
      certificate_number: certificateNumber,
      final_score: finalScore
    });

    return certificate;
  } catch (e) {
    console.log("Error generating certificate:", e);
    throw e;
  }
};