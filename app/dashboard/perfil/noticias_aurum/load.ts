import type { SupabaseClient } from "@supabase/supabase-js";

// ─── Identidade do canal oficial ────────────────────────────────────────────
// "Notícias Aurum" é um autor fictício oficial. Posts são criados pelo admin
// via /dashboard/comunidade/admin e atribuídos a este perfil. O canal não
// existe na tabela user_profile — toda a identidade visual é renderizada
// aqui, na própria página.

export const NOTICIAS_AURUM = {
  username: "noticias_aurum",
  email: "noticias@aurum.app",
  display_name: "Notícias Aurum",
  bio: "Canal oficial de notícias do Aurum. Curadoria diária de mercado, macroeconomia, FIIs, cripto e empresas — o que o investidor precisa saber, em um só lugar.",
} as const;

export interface NewsPostRow {
  id: string;
  content: string | null;
  news_url: string | null;
  news_title: string | null;
  news_thumbnail: string | null;
  tags: string[] | null;
  likes_count: number;
  comments_count: number;
  reposts_count: number;
  shares_count: number;
  created_at: string;
}

export interface TagBucket {
  tag: string;
  count: number;
}

export interface NoticiasAurumStats {
  total_posts: number;
  total_likes: number;
  total_comments: number;
  total_reposts: number;
  total_engagement: number;
  first_post_at: string | null;
  last_post_at: string | null;
  unique_sources: number;
  posts_last_7d: number;
}

export interface NoticiasAurumBundle {
  stats: NoticiasAurumStats;
  posts: NewsPostRow[];
  tag_buckets: TagBucket[];
  has_more: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<any, any, any>;

const INITIAL_PAGE_SIZE = 30;

function buildTagBuckets(posts: NewsPostRow[]): TagBucket[] {
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const raw of post.tags ?? []) {
      const tag = raw.trim().toLowerCase();
      if (!tag || tag === "noticia") continue;
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

function uniqueSources(posts: NewsPostRow[]): number {
  const set = new Set<string>();
  for (const post of posts) {
    if (!post.news_url) continue;
    try {
      const host = new URL(post.news_url).hostname.replace(/^www\./, "");
      set.add(host);
    } catch {
      // skip malformed
    }
  }
  return set.size;
}

export async function fetchNoticiasAurumBundle(supabase: SB): Promise<NoticiasAurumBundle> {
  // 1) Página inicial de posts (mais recentes primeiro)
  const { data: postRows, error: postsErr } = await supabase
    .from("community_post")
    .select(
      "id, content, news_url, news_title, news_thumbnail, tags, likes_count, comments_count, reposts_count, shares_count, created_at"
    )
    .eq("post_type", "news")
    .eq("author_username", NOTICIAS_AURUM.username)
    .eq("moderation_status", "aprovado")
    .order("created_at", { ascending: false })
    .limit(INITIAL_PAGE_SIZE);

  if (postsErr) {
    console.error("[noticias_aurum/load] posts", postsErr);
  }
  const posts = (postRows ?? []) as NewsPostRow[];

  // 2) Estatísticas agregadas — count total + soma de engajamento
  // Usamos head:true pra count rápido sem trazer linhas
  const { count: totalCount } = await supabase
    .from("community_post")
    .select("id", { count: "exact", head: true })
    .eq("post_type", "news")
    .eq("author_username", NOTICIAS_AURUM.username)
    .eq("moderation_status", "aprovado");

  // Soma de engajamento — uma única query trazendo só os counters
  const { data: engRows } = await supabase
    .from("community_post")
    .select("likes_count, comments_count, reposts_count, created_at")
    .eq("post_type", "news")
    .eq("author_username", NOTICIAS_AURUM.username)
    .eq("moderation_status", "aprovado")
    .order("created_at", { ascending: true });

  const engagement = (engRows ?? []) as {
    likes_count: number;
    comments_count: number;
    reposts_count: number;
    created_at: string;
  }[];

  const total_likes = engagement.reduce((s, p) => s + (p.likes_count ?? 0), 0);
  const total_comments = engagement.reduce((s, p) => s + (p.comments_count ?? 0), 0);
  const total_reposts = engagement.reduce((s, p) => s + (p.reposts_count ?? 0), 0);
  const total_engagement = total_likes + total_comments + total_reposts;

  const first_post_at = engagement.length > 0 ? engagement[0].created_at : null;
  const last_post_at = engagement.length > 0 ? engagement[engagement.length - 1].created_at : null;

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const posts_last_7d = engagement.filter((p) => new Date(p.created_at).getTime() >= sevenDaysAgo).length;

  const stats: NoticiasAurumStats = {
    total_posts: totalCount ?? engagement.length,
    total_likes,
    total_comments,
    total_reposts,
    total_engagement,
    first_post_at,
    last_post_at,
    unique_sources: uniqueSources(posts),
    posts_last_7d,
  };

  const tag_buckets = buildTagBuckets(posts);
  const has_more = (totalCount ?? 0) > posts.length;

  return { stats, posts, tag_buckets, has_more };
}
