import type { SupabaseClient } from "@supabase/supabase-js";

export interface ProfileRow {
  id: string;
  user_email: string;
  user_name: string;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  social_links: Record<string, string> | null;
  investment_style: string | null;
  favorite_sectors: string[] | null;
  is_portfolio_public: boolean | null;
  is_transactions_public: boolean | null;
  followers_count: number | null;
  following_count: number | null;
  posts_count: number | null;
  joined_date: string | null;
  total_return_percent: number | null;
  experience_level: string | null;
  created_at: string | null;
}

export interface PointsRow {
  total_points: number;
  points_from_lessons: number;
  points_from_courses: number;
  points_from_community: number;
  courses_completed: number;
  posts_created: number;
  community_engagement_score: number;
}

export interface AchievementRow {
  id: string;
  badge_id: string | null;
  badge_name: string;
  unlocked_at: string | null;
  badge_icon: string | null;
  badge_color: string | null;
  badge_description: string | null;
  badge_type: string | null;
}

export interface CertificateRow {
  id: string;
  course_title: string;
  course_duration: number | null;
  completion_date: string;
  certificate_number: string;
  final_score: number | null;
}

export interface CollectionRow {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  post_ids: string[] | null;
  is_public: boolean | null;
  created_at: string | null;
}

export interface FeaturedPostRow {
  id: string;
  post_id: string;
  post_type: string;
  order: number | null;
}

export interface EngagementMetrics {
  posts: number;
  likes: number;
  comments: number;
  reposts: number;
  avgPerPost: number;
  rate: number;
}

export interface ProfileBundle {
  profile: ProfileRow | null;
  points: PointsRow;
  achievements: AchievementRow[];
  certificates: CertificateRow[];
  assetCount: number;
  collections: CollectionRow[];
  featured: FeaturedPostRow[];
  engagement: EngagementMetrics;
}

const EMPTY_POINTS: PointsRow = {
  total_points: 0,
  points_from_lessons: 0,
  points_from_courses: 0,
  points_from_community: 0,
  courses_completed: 0,
  posts_created: 0,
  community_engagement_score: 0,
};

const EMPTY_ENGAGEMENT: EngagementMetrics = {
  posts: 0,
  likes: 0,
  comments: 0,
  reposts: 0,
  avgPerPost: 0,
  rate: 0,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<any, any, any>;

export async function fetchProfileBundle(
  supabase: SB,
  email: string,
  fallbackName: string,
  isSelf: boolean
): Promise<ProfileBundle> {
  // 1. Profile (auto-create for self if missing)
  let { data: profile } = await supabase
    .from("user_profile")
    .select("*")
    .eq("user_email", email)
    .maybeSingle<ProfileRow>();

  if (!profile && isSelf) {
    const { data: created } = await supabase
      .from("user_profile")
      .insert({
        user_email: email,
        user_name: fallbackName,
        joined_date: new Date().toISOString().split("T")[0],
      })
      .select()
      .single<ProfileRow>();
    profile = created;
  }

  if (!profile) {
    return {
      profile: null,
      points: EMPTY_POINTS,
      achievements: [],
      certificates: [],
      assetCount: 0,
      collections: [],
      featured: [],
      engagement: EMPTY_ENGAGEMENT,
    };
  }

  const collectionsFilter = supabase
    .from("post_collection")
    .select("id, name, description, color, icon, post_ids, is_public, created_at")
    .eq("user_email", email)
    .order("created_at", { ascending: false });

  if (!isSelf) collectionsFilter.eq("is_public", true);

  // 2. Parallel fetches
  const [
    pointsRes,
    achievementsRes,
    certificatesRes,
    assetCountRes,
    collectionsRes,
    featuredRes,
    userPostsRes,
  ] = await Promise.all([
    supabase.from("user_points").select("*").eq("user_email", email).maybeSingle(),
    supabase
      .from("user_achievement")
      .select("id, badge_id, badge_name, unlocked_at, badge:badge_id(icon, color, description, type)")
      .eq("user_email", email)
      .order("unlocked_at", { ascending: false }),
    supabase
      .from("certificate")
      .select("id, course_title, course_duration, completion_date, certificate_number, final_score")
      .eq("user_email", email)
      .order("completion_date", { ascending: false }),
    supabase.from("asset").select("id", { count: "exact", head: true }).eq("user_email", email),
    collectionsFilter,
    supabase
      .from("featured_post")
      .select("id, post_id, post_type, \"order\"")
      .eq("user_email", email)
      .order("order", { ascending: true }),
    supabase
      .from("community_post")
      .select("likes_count, comments_count, reposts_count")
      .eq("author_email", email)
      .eq("moderation_status", "aprovado"),
  ]);

  const points: PointsRow = pointsRes.data
    ? {
        total_points: pointsRes.data.total_points ?? 0,
        points_from_lessons: pointsRes.data.points_from_lessons ?? 0,
        points_from_courses: pointsRes.data.points_from_courses ?? 0,
        points_from_community: pointsRes.data.points_from_community ?? 0,
        courses_completed: pointsRes.data.courses_completed ?? 0,
        posts_created: pointsRes.data.posts_created ?? 0,
        community_engagement_score: pointsRes.data.community_engagement_score ?? 0,
      }
    : EMPTY_POINTS;

  const achievements: AchievementRow[] = (achievementsRes.data ?? []).map((row: {
    id: string;
    badge_id: string | null;
    badge_name: string;
    unlocked_at: string | null;
    badge: { icon: string | null; color: string | null; description: string | null; type: string | null }[] | null;
  }) => {
    const b = Array.isArray(row.badge) ? row.badge[0] : row.badge;
    return {
      id: row.id,
      badge_id: row.badge_id,
      badge_name: row.badge_name,
      unlocked_at: row.unlocked_at,
      badge_icon: b?.icon ?? null,
      badge_color: b?.color ?? null,
      badge_description: b?.description ?? null,
      badge_type: b?.type ?? null,
    };
  });

  const certificates = (certificatesRes.data ?? []) as CertificateRow[];
  const collections = (collectionsRes.data ?? []) as CollectionRow[];
  const featured = (featuredRes.data ?? []) as FeaturedPostRow[];
  const assetCount = assetCountRes.count ?? 0;

  // Engagement: aggregate posts data
  const userPosts = (userPostsRes.data ?? []) as { likes_count: number; comments_count: number; reposts_count: number }[];
  const postsTotal = userPosts.length;
  const likesTotal = userPosts.reduce((s, p) => s + (p.likes_count ?? 0), 0);
  const commentsTotal = userPosts.reduce((s, p) => s + (p.comments_count ?? 0), 0);
  const repostsTotal = userPosts.reduce((s, p) => s + (p.reposts_count ?? 0), 0);
  const interactions = likesTotal + commentsTotal + repostsTotal;
  const avgPerPost = postsTotal > 0 ? interactions / postsTotal : 0;
  // Engagement rate: % of interactions per follower (capped to follower base when small)
  const followerBase = Math.max(1, profile.followers_count ?? 0);
  const rate = postsTotal > 0 ? interactions / (postsTotal * followerBase) : 0;

  const engagement: EngagementMetrics = {
    posts: postsTotal,
    likes: likesTotal,
    comments: commentsTotal,
    reposts: repostsTotal,
    avgPerPost,
    rate,
  };

  return {
    profile,
    points,
    achievements,
    certificates,
    assetCount,
    collections,
    featured,
    engagement,
  };
}
