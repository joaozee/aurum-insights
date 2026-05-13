// ─── Tipos das tabelas (refletem o schema do Supabase) ──────────────────────

export type PostType = "text" | "image" | "audio" | "video" | "news" | "article";
export type ReactionType = "like" | "foguete" | "alvo" | "coracao" | "pensativo";
export type FeedAlgorithm = "chronological" | "relevance" | "engagement";
export type ExperienceLevel = "iniciante" | "intermediario" | "avancado" | "especialista";

export interface CommunityPost {
  id: string;
  content: string | null;
  author_name: string | null;
  author_email: string | null;
  author_username: string | null;
  author_avatar: string | null;
  post_type: PostType;
  images: string[] | null;
  audio_url: string | null;
  video_url: string | null;
  tags: string[] | null;
  news_url: string | null;
  news_title: string | null;
  news_thumbnail: string | null;
  is_premium_only: boolean;
  likes_count: number;
  shares_count: number;
  comments_count: number;
  reposts_count: number;
  repost_of_id: string | null;
  created_at: string;
}

export interface PostComment {
  id: string;
  parent_type: string;
  parent_id: string;
  reply_to_id: string | null;
  author_email: string;
  author_name: string | null;
  author_username: string | null;
  author_avatar: string | null;
  content: string;
  likes_count: number;
  is_solution: boolean;
  created_at: string;
}

export interface UserProfile {
  id: string;
  user_email: string;
  user_name: string;
  bio: string | null;
  avatar_url: string | null;
  followers_count: number;
  following_count: number;
  posts_count: number;
  experience_level: ExperienceLevel;
  total_return_percent: number | null;
}

export interface UserFollow {
  id: string;
  follower_email: string;
  follower_name: string | null;
  following_email: string;
  following_name: string | null;
  created_at: string;
}

export interface DirectMessage {
  id: string;
  conversation_id: string;
  sender_email: string;
  receiver_email: string;
  message: string | null;
  is_read: boolean;
  created_at: string;
}

export interface UserContentPreferences {
  user_email: string;
  feed_algorithm: FeedAlgorithm;
  interest_topics: string[];
  followed_tickers: string[];
  followed_users: string[];
  followed_groups: string[];
}

// ─── Constantes de UI ─────────────────────────────────────────────────────────

export const TOPICOS_INTERESSE = [
  { id: "acoes", label: "Ações", color: "#3b82f6" },
  { id: "dividendos", label: "Dividendos", color: "#10b981" },
  { id: "macroeconomia", label: "Macroeconomia", color: "#f59e0b" },
  { id: "analises", label: "Análises", color: "#8b5cf6" },
  { id: "dicas", label: "Dicas", color: "#06b6d4" },
  { id: "educacao", label: "Educação", color: "#ec4899" },
] as const;

export const FEED_ALGORITHMS: { id: FeedAlgorithm; label: string; description: string }[] = [
  { id: "chronological", label: "Mais Recentes", description: "Posts ordenados por data" },
  { id: "relevance", label: "Relevância", description: "IA prioriza posts mais relevantes" },
  { id: "engagement", label: "Engajamento", description: "Posts com mais interações" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));
  if (diffSec < 60) return "agora";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `há ${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `há ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `há ${diffD}d`;
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function initialFromName(name: string | null | undefined): string {
  if (!name) return "?";
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "?";
}

export function conversationIdFor(emailA: string, emailB: string): string {
  return [emailA, emailB].sort().join("__");
}
