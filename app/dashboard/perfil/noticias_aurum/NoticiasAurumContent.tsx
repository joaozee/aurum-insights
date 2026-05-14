"use client";

/**
 * NoticiasAurumContent — Perfil do canal oficial "Notícias Aurum".
 *
 * Diferente do ProfileContent genérico (que serve perfis de usuário com
 * coleções, portfólio, conquistas), esta página é 100% editorial: o foco é a
 * timeline de notícias publicadas pelo canal. Layout inspirado em homepage de
 * publicação financeira premium — hero com identidade, métricas do canal,
 * destaque editorial, filtros por hashtag e grid principal.
 */

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck, Newspaper, Search, ArrowLeft, Heart, MessageCircle,
  Repeat2, ExternalLink, TrendingUp, Calendar, Globe, Clock,
  ChevronRight, Sparkles, Flame, Filter, LayoutGrid, List as ListIcon,
  AlertCircle, Bookmark,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime } from "@/lib/comunidade";
import type { NewsPostRow, NoticiasAurumBundle, TagBucket } from "./load";

interface Channel {
  username: string;
  display_name: string;
  bio: string;
}

interface Props {
  currentUserEmail: string;
  channel: Channel;
  bundle: NoticiasAurumBundle;
}

type ViewMode = "magazine" | "list";
type SortMode = "recent" | "popular";

const PAGE_SIZE = 15;

// Mapeia hashtags conhecidas para labels bonitos. Tags fora dessa lista usam
// a própria string capitalizada.
const TAG_LABELS: Record<string, { label: string; tone: string }> = {
  mercado: { label: "Mercado", tone: "#C9A84C" },
  macro: { label: "Macroeconomia", tone: "#C58A3D" },
  cripto: { label: "Cripto", tone: "#B85C3A" },
  fiis: { label: "Fundos Imobiliários", tone: "#8B5470" },
  internacional: { label: "Internacional", tone: "#5E6B8C" },
  empresas: { label: "Empresas", tone: "#6E8C4A" },
};

function labelForTag(tag: string): string {
  return TAG_LABELS[tag.toLowerCase()]?.label ?? tag.charAt(0).toUpperCase() + tag.slice(1);
}

function toneForTag(tag: string): string {
  return TAG_LABELS[tag.toLowerCase()]?.tone ?? "var(--gold)";
}

function primaryTagOf(post: NewsPostRow): string | null {
  return (post.tags ?? []).find((t) => t.toLowerCase() !== "noticia") ?? null;
}

function sourceDomainOf(post: NewsPostRow): string | null {
  if (!post.news_url) return null;
  try {
    return new URL(post.news_url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function compactNumber(n: number): string {
  if (n < 1000) return String(n);
  if (n < 10_000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  if (n < 1_000_000) return Math.round(n / 1000) + "k";
  return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
}

function fmtMonthYear(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const fmt = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return fmt.charAt(0).toUpperCase() + fmt.slice(1);
}

function fmtFull(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function readingMinutes(text: string | null): number {
  if (!text) return 1;
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 220));
}

export default function NoticiasAurumContent({ currentUserEmail, channel, bundle }: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [posts, setPosts] = useState<NewsPostRow[]>(bundle.posts);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("magazine");
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(bundle.has_more);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingMoreRef = useRef(false);
  const hasMoreRef = useRef(bundle.has_more);
  const postsRef = useRef<NewsPostRow[]>(bundle.posts);

  useEffect(() => { postsRef.current = posts; }, [posts]);
  useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);

  // Carrega likes/saves do user pra refletir estado real nas cards
  useEffect(() => {
    if (!currentUserEmail) return;
    let cancelled = false;
    (async () => {
      const ids = bundle.posts.map((p) => p.id);
      if (ids.length === 0) return;
      const [likesRes, savesRes] = await Promise.all([
        supabase
          .from("post_reaction")
          .select("post_id")
          .eq("user_email", currentUserEmail)
          .in("post_id", ids),
        supabase
          .from("post_save")
          .select("post_id")
          .eq("user_email", currentUserEmail)
          .in("post_id", ids),
      ]);
      if (cancelled) return;
      const lk = new Set<string>(
        (likesRes.data ?? []).map((r: { post_id: string }) => r.post_id)
      );
      const sv = new Set<string>(
        (savesRes.data ?? []).map((r: { post_id: string }) => r.post_id)
      );
      setLikedPosts(lk);
      setSavedPosts(sv);
    })();
    return () => { cancelled = true; };
  }, [bundle.posts, currentUserEmail, supabase]);

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const offset = postsRef.current.length;
      const { data, error } = await supabase
        .from("community_post")
        .select(
          "id, content, news_url, news_title, news_thumbnail, tags, likes_count, comments_count, reposts_count, shares_count, created_at"
        )
        .eq("post_type", "news")
        .eq("author_username", channel.username)
        .eq("moderation_status", "aprovado")
        .order("created_at", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) {
        console.error("[noticias_aurum/loadMore]", error);
        return;
      }
      const rows = (data ?? []) as NewsPostRow[];
      if (rows.length === 0) {
        setHasMore(false);
        return;
      }
      setPosts((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        const merged = [...prev];
        for (const r of rows) if (!seen.has(r.id)) merged.push(r);
        return merged;
      });
      if (rows.length < PAGE_SIZE) setHasMore(false);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [supabase, channel.username]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "400px 0px" }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [loadMore]);

  // ─── Derived: filtragem + ordenação ────────────────────────────────────────
  const filteredPosts = useMemo(() => {
    let out = posts;

    if (activeTag) {
      out = out.filter((p) =>
        (p.tags ?? []).some((t) => t.toLowerCase() === activeTag.toLowerCase())
      );
    }

    const q = searchQuery.trim().toLowerCase();
    if (q.length > 0) {
      out = out.filter((p) => {
        const title = (p.news_title ?? "").toLowerCase();
        const summary = (p.content ?? "").toLowerCase();
        return title.includes(q) || summary.includes(q);
      });
    }

    if (sortMode === "popular") {
      out = [...out].sort((a, b) => {
        const ae = (a.likes_count ?? 0) + (a.comments_count ?? 0) + (a.reposts_count ?? 0);
        const be = (b.likes_count ?? 0) + (b.comments_count ?? 0) + (b.reposts_count ?? 0);
        return be - ae;
      });
    }

    return out;
  }, [posts, activeTag, searchQuery, sortMode]);

  // Rebuilds tag buckets dinamicamente conforme novos posts são carregados
  const dynamicTagBuckets: TagBucket[] = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of posts) {
      for (const raw of p.tags ?? []) {
        const tag = raw.trim().toLowerCase();
        if (!tag || tag === "noticia") continue;
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }, [posts]);

  // Headline editorial: post mais engajado dos últimos 30 dias
  // (cai pro mais recente se nenhum tem engajamento)
  const headline = useMemo<NewsPostRow | null>(() => {
    if (filteredPosts.length === 0) return null;
    const thirtyDays = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const candidates = filteredPosts.filter(
      (p) => new Date(p.created_at).getTime() >= thirtyDays
    );
    const pool = candidates.length > 0 ? candidates : filteredPosts;
    const ranked = [...pool].sort((a, b) => {
      const ae = (a.likes_count ?? 0) + (a.comments_count ?? 0) + (a.reposts_count ?? 0);
      const be = (b.likes_count ?? 0) + (b.comments_count ?? 0) + (b.reposts_count ?? 0);
      if (be !== ae) return be - ae;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return ranked[0];
  }, [filteredPosts]);

  const subFeed = useMemo(() => {
    return headline ? filteredPosts.filter((p) => p.id !== headline.id) : filteredPosts;
  }, [filteredPosts, headline]);

  async function toggleLike(post: NewsPostRow) {
    if (!currentUserEmail) return;
    const isLiked = likedPosts.has(post.id);
    // Optimistic UI
    setLikedPosts((prev) => {
      const next = new Set(prev);
      if (isLiked) next.delete(post.id);
      else next.add(post.id);
      return next;
    });
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? { ...p, likes_count: Math.max(0, (p.likes_count ?? 0) + (isLiked ? -1 : 1)) }
          : p
      )
    );

    if (isLiked) {
      await supabase
        .from("post_reaction")
        .delete()
        .eq("post_id", post.id)
        .eq("user_email", currentUserEmail);
    } else {
      await supabase
        .from("post_reaction")
        .insert({ post_id: post.id, user_email: currentUserEmail, reaction_type: "like" });
    }
  }

  async function toggleSave(post: NewsPostRow) {
    if (!currentUserEmail) return;
    const isSaved = savedPosts.has(post.id);
    setSavedPosts((prev) => {
      const next = new Set(prev);
      if (isSaved) next.delete(post.id);
      else next.add(post.id);
      return next;
    });

    if (isSaved) {
      await supabase
        .from("post_save")
        .delete()
        .eq("post_id", post.id)
        .eq("user_email", currentUserEmail);
    } else {
      await supabase
        .from("post_save")
        .insert({ post_id: post.id, user_email: currentUserEmail });
    }
  }

  const memberSince = fmtMonthYear(bundle.stats.first_post_at);
  const filterActive = activeTag !== null || searchQuery.trim().length > 0;

  return (
    <div style={{ minHeight: "calc(100vh - 58px)", background: "var(--bg-page)", paddingBottom: "80px" }}>
      <style jsx>{`
        @keyframes aurum-news-fadein {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .news-card { animation: aurum-news-fadein 280ms var(--ease-out) both; }
        .news-card:hover { border-color: var(--border-emphasis); }
        .news-thumb { transition: transform 500ms var(--ease-out); }
        .news-card:hover .news-thumb { transform: scale(1.04); }
        .news-headline-card:hover .news-thumb { transform: scale(1.03); }
        @media (prefers-reduced-motion: reduce) {
          .news-card { animation: none; }
          .news-thumb, .news-card:hover .news-thumb { transform: none !important; transition: none; }
        }
      `}</style>

      {/* ─── HERO ──────────────────────────────────────────────────────────── */}
      <header
        style={{
          position: "relative",
          background:
            "radial-gradient(120% 80% at 20% 0%, rgba(201,168,76,0.18) 0%, rgba(201,168,76,0) 55%), radial-gradient(80% 60% at 90% 100%, rgba(184,92,58,0.12) 0%, rgba(184,92,58,0) 60%), linear-gradient(180deg, #130f09 0%, #0a0806 100%)",
          borderBottom: "1px solid var(--border-soft)",
          overflow: "hidden",
        }}
      >
        {/* Padrão sutil de pontos dourados */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(201,168,76,0.07) 1px, transparent 0)",
            backgroundSize: "32px 32px",
            maskImage: "linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 80%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 24px 36px", position: "relative" }}>
          {/* Voltar */}
          <button
            onClick={() => router.push("/dashboard/comunidade")}
            style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              background: "transparent", border: "none",
              color: "var(--text-muted)", fontSize: "12px", fontWeight: 600,
              cursor: "pointer", fontFamily: "var(--font-sans)",
              letterSpacing: "0.02em",
              padding: 0, marginBottom: "20px",
            }}
          >
            <ArrowLeft size={13} /> Voltar à comunidade
          </button>

          {/* Identidade do canal */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "20px", flexWrap: "wrap" }}>
            {/* Logo/avatar do canal */}
            <div
              style={{
                position: "relative",
                width: "92px", height: "92px",
                borderRadius: "22px",
                background:
                  "linear-gradient(135deg, var(--gold-light) 0%, var(--gold) 45%, var(--gold-dim) 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#0d0b07",
                boxShadow:
                  "0 16px 40px rgba(201,168,76,0.28), inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(0,0,0,0.2)",
                flexShrink: 0,
              }}
            >
              <Newspaper size={42} strokeWidth={1.8} />
              <BadgeCheck
                size={26}
                strokeWidth={2.4}
                aria-label="Canal verificado"
                style={{
                  position: "absolute", bottom: "-6px", right: "-6px",
                  color: "var(--gold-light)",
                  background: "var(--bg-page)",
                  borderRadius: "50%",
                  padding: "1px",
                }}
              />
            </div>

            {/* Texto */}
            <div style={{ flex: 1, minWidth: "260px" }}>
              <p
                style={{
                  fontSize: "10px", fontWeight: 700, color: "var(--gold)",
                  letterSpacing: "0.22em", textTransform: "uppercase",
                  fontFamily: "var(--font-sans)", marginBottom: "8px",
                }}
              >
                Canal Oficial · O Aurum
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "6px" }}>
                <h1
                  style={{
                    fontSize: "clamp(28px, 4vw, 40px)",
                    fontWeight: 700, color: "var(--text-strong)",
                    fontFamily: "var(--font-display)",
                    letterSpacing: "-0.02em",
                    lineHeight: 1.05,
                  }}
                >
                  {channel.display_name}
                </h1>
              </div>
              <p
                style={{
                  fontSize: "12px", color: "var(--text-muted)",
                  fontFamily: "var(--font-sans)", letterSpacing: "0.02em",
                  marginBottom: "12px",
                }}
              >
                @{channel.username}
              </p>
              <p
                style={{
                  fontSize: "14px", color: "var(--text-body)",
                  fontFamily: "var(--font-sans)", lineHeight: 1.6,
                  maxWidth: "640px",
                }}
              >
                {channel.bio}
              </p>
            </div>
          </div>

          {/* Métricas do canal */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "12px",
              marginTop: "28px",
            }}
          >
            <ChannelStat
              icon={<Newspaper size={14} />}
              label="Matérias publicadas"
              value={compactNumber(bundle.stats.total_posts)}
              accent
            />
            <ChannelStat
              icon={<Flame size={14} />}
              label="Últimos 7 dias"
              value={compactNumber(bundle.stats.posts_last_7d)}
              hint={bundle.stats.posts_last_7d === 1 ? "matéria nova" : "matérias novas"}
            />
            <ChannelStat
              icon={<Globe size={14} />}
              label="Fontes únicas"
              value={compactNumber(bundle.stats.unique_sources)}
              hint="veículos curados"
            />
            <ChannelStat
              icon={<TrendingUp size={14} />}
              label="Engajamento total"
              value={compactNumber(bundle.stats.total_engagement)}
              hint={`${compactNumber(bundle.stats.total_likes)} curtidas`}
            />
            <ChannelStat
              icon={<Calendar size={14} />}
              label="No ar desde"
              value={memberSince}
              isText
            />
          </div>
        </div>
      </header>

      {/* ─── CONTROL BAR (filtros + busca + view) ────────────────────────── */}
      <section
        style={{
          position: "sticky",
          top: "0",
          zIndex: 20,
          background: "rgba(13, 11, 7, 0.92)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderBottom: "1px solid var(--border-soft)",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "14px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            {/* Busca */}
            <div style={{ position: "relative", flex: "1 1 240px", minWidth: "200px", maxWidth: "420px" }}>
              <Search
                size={14}
                style={{
                  position: "absolute", left: "12px", top: "50%",
                  transform: "translateY(-50%)", color: "var(--text-faint)",
                  pointerEvents: "none",
                }}
              />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar matérias…"
                aria-label="Buscar matérias"
                style={{
                  width: "100%", height: "38px",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-soft)",
                  borderRadius: "999px",
                  padding: "0 14px 0 34px",
                  color: "var(--text-default)", fontSize: "13px",
                  fontFamily: "var(--font-sans)", outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Sort */}
            <div
              role="group"
              aria-label="Ordenar"
              style={{
                display: "flex", gap: "2px",
                background: "var(--bg-card)",
                border: "1px solid var(--border-soft)",
                borderRadius: "8px", padding: "3px",
              }}
            >
              <SegBtn
                active={sortMode === "recent"}
                onClick={() => setSortMode("recent")}
                icon={<Clock size={12} />}
                label="Recentes"
              />
              <SegBtn
                active={sortMode === "popular"}
                onClick={() => setSortMode("popular")}
                icon={<Flame size={12} />}
                label="Populares"
              />
            </div>

            {/* View toggle */}
            <div
              role="group"
              aria-label="Modo de visualização"
              style={{
                display: "flex", gap: "2px",
                background: "var(--bg-card)",
                border: "1px solid var(--border-soft)",
                borderRadius: "8px", padding: "3px",
                marginLeft: "auto",
              }}
            >
              <IconToggle
                active={viewMode === "magazine"}
                onClick={() => setViewMode("magazine")}
                icon={<LayoutGrid size={13} />}
                label="Magazine"
              />
              <IconToggle
                active={viewMode === "list"}
                onClick={() => setViewMode("list")}
                icon={<ListIcon size={13} />}
                label="Lista"
              />
            </div>
          </div>

          {/* Hashtag chips */}
          {dynamicTagBuckets.length > 0 && (
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "12px" }}>
              <TagChip
                tag={null}
                label="Tudo"
                count={posts.length}
                active={activeTag === null}
                onClick={() => setActiveTag(null)}
              />
              {dynamicTagBuckets.slice(0, 12).map(({ tag, count }) => (
                <TagChip
                  key={tag}
                  tag={tag}
                  label={labelForTag(tag)}
                  count={count}
                  active={activeTag === tag}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── MAIN FEED ─────────────────────────────────────────────────────── */}
      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 24px 0" }}>
        {filteredPosts.length === 0 ? (
          <EmptyEditorial filterActive={filterActive} onClear={() => { setActiveTag(null); setSearchQuery(""); }} />
        ) : (
          <>
            {/* Filter summary */}
            {filterActive && (
              <div
                style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  marginBottom: "20px",
                  fontSize: "12px", color: "var(--text-muted)",
                  fontFamily: "var(--font-sans)",
                }}
              >
                <Filter size={12} style={{ color: "var(--text-faint)" }} />
                <span>
                  {filteredPosts.length} {filteredPosts.length === 1 ? "matéria" : "matérias"}
                  {activeTag && (
                    <> em <strong style={{ color: "var(--gold)" }}>{labelForTag(activeTag)}</strong></>
                  )}
                  {searchQuery.trim().length > 0 && (
                    <> com <strong style={{ color: "var(--text-default)" }}>“{searchQuery.trim()}”</strong></>
                  )}
                </span>
                <button
                  onClick={() => { setActiveTag(null); setSearchQuery(""); }}
                  style={{
                    background: "transparent", border: "none",
                    color: "var(--gold)", fontSize: "11px", fontWeight: 600,
                    cursor: "pointer", fontFamily: "var(--font-sans)",
                    padding: 0, letterSpacing: "0.02em",
                  }}
                >
                  Limpar filtros
                </button>
              </div>
            )}

            {viewMode === "magazine" ? (
              <>
                {headline && !filterActive && (
                  <HeadlineCard
                    post={headline}
                    liked={likedPosts.has(headline.id)}
                    saved={savedPosts.has(headline.id)}
                    onLike={() => toggleLike(headline)}
                    onSave={() => toggleSave(headline)}
                  />
                )}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: "20px",
                    marginTop: headline && !filterActive ? "28px" : 0,
                  }}
                >
                  {(filterActive ? filteredPosts : subFeed).map((post, idx) => (
                    <MagazineCard
                      key={post.id}
                      post={post}
                      index={idx}
                      liked={likedPosts.has(post.id)}
                      saved={savedPosts.has(post.id)}
                      onLike={() => toggleLike(post)}
                      onSave={() => toggleSave(post)}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {filteredPosts.map((post, idx) => (
                  <ListRow
                    key={post.id}
                    post={post}
                    index={idx}
                    liked={likedPosts.has(post.id)}
                    saved={savedPosts.has(post.id)}
                    onLike={() => toggleLike(post)}
                    onSave={() => toggleSave(post)}
                  />
                ))}
              </div>
            )}

            {/* Sentinel + estados de paginação */}
            <div ref={sentinelRef} style={{ height: "1px" }} aria-hidden />
            {loadingMore && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: viewMode === "magazine" ? "repeat(auto-fill, minmax(280px, 1fr))" : "1fr",
                  gap: viewMode === "magazine" ? "20px" : "14px",
                  marginTop: "20px",
                }}
              >
                {Array.from({ length: viewMode === "magazine" ? 3 : 2 }).map((_, i) => (
                  <CardSkeleton key={i} variant={viewMode} />
                ))}
              </div>
            )}
            {!hasMore && filteredPosts.length >= 6 && (
              <div
                style={{
                  textAlign: "center",
                  marginTop: "40px",
                  padding: "24px 0",
                  borderTop: "1px solid var(--border-faint)",
                  color: "var(--text-faint)",
                  fontSize: "11px",
                  fontFamily: "var(--font-sans)",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                }}
              >
                Você chegou ao fim do arquivo · {compactNumber(bundle.stats.total_posts)} matérias
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ChannelStat({
  icon, label, value, hint, accent = false, isText = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
  isText?: boolean;
}) {
  return (
    <div
      style={{
        background: accent
          ? "linear-gradient(135deg, rgba(201,168,76,0.12), rgba(201,168,76,0.02))"
          : "rgba(19, 15, 9, 0.65)",
        border: `1px solid ${accent ? "var(--border-emphasis)" : "var(--border-soft)"}`,
        borderRadius: "12px",
        padding: "14px 16px",
      }}
    >
      <div
        style={{
          display: "flex", alignItems: "center", gap: "6px",
          color: accent ? "var(--gold)" : "var(--text-faint)",
          marginBottom: "8px",
        }}
      >
        {icon}
        <span
          style={{
            fontSize: "10px", fontWeight: 600,
            letterSpacing: "0.12em", textTransform: "uppercase",
            fontFamily: "var(--font-sans)",
          }}
        >
          {label}
        </span>
      </div>
      <div
        style={{
          fontSize: isText ? "16px" : "24px",
          fontWeight: 700,
          color: "var(--text-strong)",
          fontFamily: isText ? "var(--font-sans)" : "var(--font-display)",
          letterSpacing: "-0.01em",
          lineHeight: 1.1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      {hint && (
        <p
          style={{
            fontSize: "11px", color: "var(--text-muted)",
            fontFamily: "var(--font-sans)", marginTop: "4px",
          }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

function SegBtn({
  active, onClick, icon, label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      style={{
        display: "inline-flex", alignItems: "center", gap: "5px",
        padding: "6px 12px",
        background: active ? "rgba(201,168,76,0.14)" : "transparent",
        border: "none", borderRadius: "6px",
        color: active ? "var(--gold-light)" : "var(--text-muted)",
        fontSize: "12px", fontWeight: active ? 700 : 500,
        fontFamily: "var(--font-sans)", cursor: "pointer",
        transition: "all 150ms var(--ease-out)",
        letterSpacing: "0.02em",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function IconToggle({
  active, onClick, icon, label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      title={label}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: "32px", height: "30px",
        background: active ? "rgba(201,168,76,0.14)" : "transparent",
        border: "none", borderRadius: "6px",
        color: active ? "var(--gold-light)" : "var(--text-muted)",
        cursor: "pointer",
        transition: "all 150ms var(--ease-out)",
      }}
    >
      {icon}
    </button>
  );
}

function TagChip({
  tag, label, count, active, onClick,
}: {
  tag: string | null;
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  const tone = tag ? toneForTag(tag) : "var(--gold)";
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      style={{
        display: "inline-flex", alignItems: "center", gap: "6px",
        padding: "6px 12px",
        background: active ? "rgba(201,168,76,0.14)" : "var(--bg-card)",
        border: `1px solid ${active ? "var(--border-emphasis)" : "var(--border-soft)"}`,
        borderRadius: "999px",
        color: active ? "var(--gold-light)" : "var(--text-muted)",
        fontSize: "12px", fontWeight: active ? 700 : 500,
        fontFamily: "var(--font-sans)", cursor: "pointer",
        transition: "all 150ms var(--ease-out)",
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
      }}
    >
      {tag !== null && (
        <span
          aria-hidden
          style={{
            width: "6px", height: "6px", borderRadius: "50%",
            background: tone,
            flexShrink: 0,
          }}
        />
      )}
      {label}
      <span
        style={{
          fontSize: "10px",
          color: active ? "var(--gold)" : "var(--text-faint)",
          fontVariantNumeric: "tabular-nums",
          fontWeight: 600,
        }}
      >
        {count}
      </span>
    </button>
  );
}

function HeadlineCard({
  post, liked, saved, onLike, onSave,
}: {
  post: NewsPostRow;
  liked: boolean;
  saved: boolean;
  onLike: () => void;
  onSave: () => void;
}) {
  const tag = primaryTagOf(post);
  const source = sourceDomainOf(post);
  return (
    <article
      className="news-headline-card"
      style={{
        position: "relative",
        background: "var(--bg-card)",
        border: "1px solid var(--border-soft)",
        borderRadius: "20px",
        overflow: "hidden",
        display: "grid",
        gridTemplateColumns: "minmax(0, 1.25fr) minmax(0, 1fr)",
        minHeight: "340px",
        transition: "border-color 200ms var(--ease-out)",
      }}
    >
      {/* Hero image */}
      <a
        href={post.news_url ?? "#"}
        target={post.news_url ? "_blank" : undefined}
        rel={post.news_url ? "noopener noreferrer" : undefined}
        style={{
          position: "relative",
          minHeight: "260px",
          overflow: "hidden",
          background: "linear-gradient(135deg, #1a1410 0%, #2a1f12 100%)",
          display: "block",
        }}
      >
        {post.news_thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.news_thumbnail}
            alt=""
            loading="eager"
            className="news-thumb"
            style={{
              width: "100%", height: "100%", objectFit: "cover", display: "block",
              minHeight: "260px",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%", height: "100%", minHeight: "260px",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--text-faint)",
            }}
          >
            <Newspaper size={42} />
          </div>
        )}
        <div
          style={{
            position: "absolute", inset: 0,
            background:
              "linear-gradient(180deg, rgba(10,8,6,0.25) 0%, transparent 35%, rgba(10,8,6,0.55) 100%)",
            pointerEvents: "none",
          }}
        />
        {tag && (
          <span
            style={{
              position: "absolute", top: "16px", left: "16px",
              display: "inline-flex", alignItems: "center", gap: "5px",
              fontSize: "10px", fontWeight: 700,
              color: "var(--gold-light)",
              background: "rgba(10,8,6,0.7)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(201,168,76,0.35)",
              padding: "5px 11px", borderRadius: "999px",
              letterSpacing: "0.12em", textTransform: "uppercase",
              fontFamily: "var(--font-sans)",
            }}
          >
            <Sparkles size={10} fill="var(--gold-light)" /> Destaque
          </span>
        )}
      </a>

      {/* Body */}
      <div
        style={{
          padding: "28px 28px 24px",
          display: "flex", flexDirection: "column", gap: "14px",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              marginBottom: "12px", flexWrap: "wrap",
            }}
          >
            {tag && (
              <span
                style={{
                  fontSize: "10px", fontWeight: 700,
                  color: toneForTag(tag),
                  letterSpacing: "0.14em", textTransform: "uppercase",
                  fontFamily: "var(--font-sans)",
                }}
              >
                {labelForTag(tag)}
              </span>
            )}
            <span
              style={{
                width: "3px", height: "3px", borderRadius: "50%",
                background: "var(--text-faint)",
              }}
            />
            <span
              style={{
                fontSize: "11px", color: "var(--text-muted)",
                fontFamily: "var(--font-sans)",
              }}
              title={fmtFull(post.created_at)}
            >
              {formatRelativeTime(post.created_at)}
            </span>
            <span
              style={{
                fontSize: "11px", color: "var(--text-faint)",
                fontFamily: "var(--font-sans)",
              }}
            >
              · {readingMinutes(post.content)} min de leitura
            </span>
          </div>

          <a
            href={post.news_url ?? "#"}
            target={post.news_url ? "_blank" : undefined}
            rel={post.news_url ? "noopener noreferrer" : undefined}
            style={{ textDecoration: "none" }}
          >
            <h2
              style={{
                fontSize: "clamp(22px, 2.4vw, 28px)",
                fontWeight: 700,
                color: "var(--text-strong)",
                fontFamily: "var(--font-display)",
                letterSpacing: "-0.015em",
                lineHeight: 1.18,
                marginBottom: "12px",
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {post.news_title ?? "Sem título"}
            </h2>
          </a>

          {post.content && (
            <p
              style={{
                fontSize: "14px", color: "var(--text-body)",
                fontFamily: "var(--font-sans)", lineHeight: 1.65,
                display: "-webkit-box",
                WebkitLineClamp: 4,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {post.content}
            </p>
          )}
        </div>

        {/* Footer ações */}
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            paddingTop: "16px", borderTop: "1px solid var(--border-faint)",
            gap: "12px", flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px", color: "var(--text-muted)", fontSize: "12px", fontFamily: "var(--font-sans)" }}>
            <InteractionBtn
              icon={<Heart size={14} fill={liked ? "#f87171" : "none"} />}
              count={post.likes_count}
              active={liked}
              activeColor="#f87171"
              onClick={onLike}
              label="Curtir"
            />
            <InteractionStat icon={<MessageCircle size={14} />} count={post.comments_count} label="Comentários" />
            <InteractionStat icon={<Repeat2 size={14} />} count={post.reposts_count} label="Reposts" />
            <InteractionBtn
              icon={<Bookmark size={14} fill={saved ? "var(--gold)" : "none"} />}
              active={saved}
              activeColor="var(--gold)"
              onClick={onSave}
              label="Salvar"
            />
          </div>
          {post.news_url && (
            <a
              href={post.news_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                fontSize: "12px", fontWeight: 700,
                color: "#0d0b07",
                background:
                  "linear-gradient(135deg, var(--gold-light), var(--gold), var(--gold-dim))",
                padding: "9px 16px", borderRadius: "999px",
                textDecoration: "none",
                fontFamily: "var(--font-sans)",
                letterSpacing: "0.04em",
                boxShadow: "0 6px 18px rgba(201,168,76,0.28)",
              }}
            >
              Ler em {source ?? "fonte"} <ChevronRight size={13} />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

function MagazineCard({
  post, index, liked, saved, onLike, onSave,
}: {
  post: NewsPostRow;
  index: number;
  liked: boolean;
  saved: boolean;
  onLike: () => void;
  onSave: () => void;
}) {
  const tag = primaryTagOf(post);
  const source = sourceDomainOf(post);
  return (
    <article
      className="news-card"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-soft)",
        borderRadius: "14px",
        overflow: "hidden",
        display: "flex", flexDirection: "column",
        transition: "border-color 200ms var(--ease-out)",
        animationDelay: `${Math.min(index, 8) * 40}ms`,
      }}
    >
      <a
        href={post.news_url ?? "#"}
        target={post.news_url ? "_blank" : undefined}
        rel={post.news_url ? "noopener noreferrer" : undefined}
        aria-label={post.news_title ?? "Matéria"}
        style={{
          position: "relative", display: "block",
          aspectRatio: "16 / 10",
          overflow: "hidden",
          background: "linear-gradient(135deg, #1a1410 0%, #2a1f12 100%)",
        }}
      >
        {post.news_thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.news_thumbnail}
            alt=""
            loading="lazy"
            className="news-thumb"
            style={{
              width: "100%", height: "100%", objectFit: "cover", display: "block",
            }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-faint)" }}>
            <Newspaper size={32} />
          </div>
        )}
        <div
          style={{
            position: "absolute", inset: 0,
            background:
              "linear-gradient(180deg, rgba(10,8,6,0.35) 0%, transparent 30%, rgba(10,8,6,0.55) 100%)",
            pointerEvents: "none",
          }}
        />
        {tag && (
          <span
            style={{
              position: "absolute", top: "12px", left: "12px",
              fontSize: "9px", fontWeight: 700,
              color: "#0d0b07",
              background: toneForTag(tag),
              padding: "4px 9px", borderRadius: "4px",
              letterSpacing: "0.12em", textTransform: "uppercase",
              fontFamily: "var(--font-sans)",
            }}
          >
            {labelForTag(tag)}
          </span>
        )}
        {source && (
          <span
            style={{
              position: "absolute", bottom: "10px", left: "12px",
              fontSize: "10px", fontWeight: 600,
              color: "#e8dcc0",
              background: "rgba(10,8,6,0.72)",
              backdropFilter: "blur(6px)",
              padding: "3px 8px", borderRadius: "5px",
              fontFamily: "var(--font-sans)",
              maxWidth: "calc(100% - 24px)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}
          >
            {source}
          </span>
        )}
      </a>

      <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
        <a
          href={post.news_url ?? "#"}
          target={post.news_url ? "_blank" : undefined}
          rel={post.news_url ? "noopener noreferrer" : undefined}
          style={{ textDecoration: "none" }}
        >
          <h3
            style={{
              fontSize: "16px", fontWeight: 700,
              color: "var(--text-strong)",
              fontFamily: "var(--font-display)",
              letterSpacing: "-0.01em",
              lineHeight: 1.3,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {post.news_title ?? "Sem título"}
          </h3>
        </a>

        {post.content && (
          <p
            style={{
              fontSize: "12.5px", color: "var(--text-muted)",
              fontFamily: "var(--font-sans)", lineHeight: 1.55,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              margin: 0,
            }}
          >
            {post.content}
          </p>
        )}

        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginTop: "auto", paddingTop: "10px",
            borderTop: "1px solid var(--border-faint)",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <InteractionBtn
              icon={<Heart size={13} fill={liked ? "#f87171" : "none"} />}
              count={post.likes_count}
              active={liked}
              activeColor="#f87171"
              compact
              onClick={onLike}
              label="Curtir"
            />
            <InteractionStat icon={<MessageCircle size={13} />} count={post.comments_count} compact label="Comentários" />
            <InteractionBtn
              icon={<Bookmark size={13} fill={saved ? "var(--gold)" : "none"} />}
              active={saved}
              activeColor="var(--gold)"
              compact
              onClick={onSave}
              label="Salvar"
            />
          </div>
          <span
            style={{
              fontSize: "10.5px", color: "var(--text-faint)",
              fontFamily: "var(--font-sans)",
              fontVariantNumeric: "tabular-nums",
            }}
            title={fmtFull(post.created_at)}
          >
            {formatRelativeTime(post.created_at)}
          </span>
        </div>
      </div>
    </article>
  );
}

function ListRow({
  post, index, liked, saved, onLike, onSave,
}: {
  post: NewsPostRow;
  index: number;
  liked: boolean;
  saved: boolean;
  onLike: () => void;
  onSave: () => void;
}) {
  const tag = primaryTagOf(post);
  const source = sourceDomainOf(post);
  return (
    <article
      className="news-card"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-soft)",
        borderRadius: "12px",
        overflow: "hidden",
        display: "grid",
        gridTemplateColumns: "180px minmax(0, 1fr)",
        gap: "0",
        animationDelay: `${Math.min(index, 8) * 30}ms`,
        transition: "border-color 200ms var(--ease-out)",
      }}
    >
      <a
        href={post.news_url ?? "#"}
        target={post.news_url ? "_blank" : undefined}
        rel={post.news_url ? "noopener noreferrer" : undefined}
        style={{
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(135deg, #1a1410 0%, #2a1f12 100%)",
          display: "block",
          minHeight: "130px",
        }}
        aria-label={post.news_title ?? "Matéria"}
      >
        {post.news_thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.news_thumbnail}
            alt=""
            loading="lazy"
            className="news-thumb"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-faint)" }}>
            <Newspaper size={26} />
          </div>
        )}
      </a>

      <div style={{ padding: "16px 18px 14px", display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          {tag && (
            <span
              style={{
                fontSize: "9px", fontWeight: 700,
                color: toneForTag(tag),
                letterSpacing: "0.14em", textTransform: "uppercase",
                fontFamily: "var(--font-sans)",
              }}
            >
              {labelForTag(tag)}
            </span>
          )}
          {tag && (
            <span style={{ width: "3px", height: "3px", borderRadius: "50%", background: "var(--text-faint)" }} />
          )}
          {source && (
            <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>
              {source}
            </span>
          )}
          <span style={{ width: "3px", height: "3px", borderRadius: "50%", background: "var(--text-faint)" }} />
          <span
            style={{ fontSize: "11px", color: "var(--text-faint)", fontFamily: "var(--font-sans)" }}
            title={fmtFull(post.created_at)}
          >
            {formatRelativeTime(post.created_at)}
          </span>
        </div>

        <a
          href={post.news_url ?? "#"}
          target={post.news_url ? "_blank" : undefined}
          rel={post.news_url ? "noopener noreferrer" : undefined}
          style={{ textDecoration: "none" }}
        >
          <h3
            style={{
              fontSize: "17px", fontWeight: 700,
              color: "var(--text-strong)",
              fontFamily: "var(--font-display)",
              letterSpacing: "-0.01em",
              lineHeight: 1.28,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {post.news_title ?? "Sem título"}
          </h3>
        </a>

        {post.content && (
          <p
            style={{
              fontSize: "13px", color: "var(--text-muted)",
              fontFamily: "var(--font-sans)", lineHeight: 1.55,
              margin: 0,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {post.content}
          </p>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "4px" }}>
          <InteractionBtn
            icon={<Heart size={13} fill={liked ? "#f87171" : "none"} />}
            count={post.likes_count}
            active={liked}
            activeColor="#f87171"
            compact
            onClick={onLike}
            label="Curtir"
          />
          <InteractionStat icon={<MessageCircle size={13} />} count={post.comments_count} compact label="Comentários" />
          <InteractionStat icon={<Repeat2 size={13} />} count={post.reposts_count} compact label="Reposts" />
          <InteractionBtn
            icon={<Bookmark size={13} fill={saved ? "var(--gold)" : "none"} />}
            active={saved}
            activeColor="var(--gold)"
            compact
            onClick={onSave}
            label="Salvar"
          />
          {post.news_url && (
            <a
              href={post.news_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                marginLeft: "auto",
                display: "inline-flex", alignItems: "center", gap: "4px",
                fontSize: "11.5px", fontWeight: 700,
                color: "var(--gold)",
                fontFamily: "var(--font-sans)",
                textDecoration: "none",
                letterSpacing: "0.02em",
              }}
            >
              Ler matéria <ExternalLink size={11} />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

function InteractionBtn({
  icon, count, active = false, activeColor, onClick, label, compact = false,
}: {
  icon: React.ReactNode;
  count?: number;
  active?: boolean;
  activeColor: string;
  onClick: () => void;
  label: string;
  compact?: boolean;
}) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      aria-pressed={active}
      aria-label={label}
      title={label}
      style={{
        display: "inline-flex", alignItems: "center", gap: "5px",
        background: "transparent", border: "none",
        color: active ? activeColor : "var(--text-muted)",
        fontSize: compact ? "11.5px" : "12px",
        fontWeight: active ? 600 : 500,
        fontFamily: "var(--font-sans)", cursor: "pointer",
        padding: 0,
        transition: "color 150ms var(--ease-out)",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {icon}
      {typeof count === "number" && count > 0 && <span>{compactNumber(count)}</span>}
    </button>
  );
}

function InteractionStat({
  icon, count, compact = false, label,
}: {
  icon: React.ReactNode;
  count: number;
  compact?: boolean;
  label: string;
}) {
  return (
    <span
      aria-label={`${label}: ${count}`}
      style={{
        display: "inline-flex", alignItems: "center", gap: "5px",
        color: "var(--text-muted)",
        fontSize: compact ? "11.5px" : "12px",
        fontWeight: 500,
        fontFamily: "var(--font-sans)",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {icon}
      {count > 0 && compactNumber(count)}
    </span>
  );
}

function EmptyEditorial({
  filterActive, onClear,
}: {
  filterActive: boolean;
  onClear: () => void;
}) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px dashed var(--border-soft)",
        borderRadius: "16px",
        padding: "56px 32px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: "56px", height: "56px", borderRadius: "16px",
          background: "rgba(201,168,76,0.08)",
          color: "var(--gold)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 16px",
        }}
      >
        <AlertCircle size={26} />
      </div>
      <p
        style={{
          fontSize: "18px", fontWeight: 700,
          color: "var(--text-strong)",
          fontFamily: "var(--font-display)",
          letterSpacing: "-0.01em",
          marginBottom: "8px",
        }}
      >
        {filterActive ? "Nenhuma matéria com esses filtros" : "Ainda não há matérias publicadas"}
      </p>
      <p
        style={{
          fontSize: "13px", color: "var(--text-muted)",
          fontFamily: "var(--font-sans)", lineHeight: 1.6,
          maxWidth: "420px", margin: "0 auto",
        }}
      >
        {filterActive
          ? "Tente outro tema ou busca. Talvez o tópico ainda não tenha entrado na pauta."
          : "Quando o time editorial publicar a primeira matéria, ela aparece aqui."}
      </p>
      {filterActive && (
        <button
          onClick={onClear}
          style={{
            marginTop: "18px",
            display: "inline-flex", alignItems: "center", gap: "6px",
            padding: "9px 18px",
            background:
              "linear-gradient(135deg, var(--gold-light), var(--gold), var(--gold-dim))",
            border: "none", borderRadius: "999px",
            color: "#0d0b07", fontSize: "12px", fontWeight: 700,
            fontFamily: "var(--font-sans)", cursor: "pointer",
            letterSpacing: "0.04em",
            boxShadow: "0 6px 16px rgba(201,168,76,0.25)",
          }}
        >
          Limpar filtros
        </button>
      )}
    </div>
  );
}

function CardSkeleton({ variant }: { variant: ViewMode }) {
  if (variant === "list") {
    return (
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-soft)",
          borderRadius: "12px",
          overflow: "hidden",
          display: "grid",
          gridTemplateColumns: "180px minmax(0, 1fr)",
        }}
      >
        <Skeleton className="h-[130px] w-full rounded-none" />
        <div style={{ padding: "16px 18px" }}>
          <Skeleton className="h-2.5 w-24 mb-3" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-[80%] mb-3" />
          <Skeleton className="h-3 w-[60%]" />
        </div>
      </div>
    );
  }
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-soft)",
        borderRadius: "14px",
        overflow: "hidden",
      }}
    >
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div style={{ padding: "14px 16px 16px" }}>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-[75%] mb-3" />
        <Skeleton className="h-3 w-[55%]" />
      </div>
    </div>
  );
}
