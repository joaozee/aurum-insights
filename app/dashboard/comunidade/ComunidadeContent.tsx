"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search, Image as ImageIcon, Sparkles, RefreshCw, Heart,
  MessageCircle, Repeat2, Bookmark, Newspaper, TrendingUp,
  Bookmark as BookmarkIcon, Users as UsersIcon, Settings2,
  MessageSquare, X, ExternalLink, Send,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  type CommunityPost, type PostComment, formatRelativeTime, initialFromName,
  TOPICOS_INTERESSE, FEED_ALGORITHMS, type FeedAlgorithm,
} from "@/lib/comunidade";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";

interface Props {
  userEmail: string;
  userName: string;
  userAvatar: string | null;
}

export default function ComunidadeContent({ userEmail, userName, userAvatar }: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [composerText, setComposerText] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [posting, setPosting] = useState(false);
  const [busca, setBusca] = useState("");
  const [followingCount, setFollowingCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [myReposts, setMyReposts] = useState<Set<string>>(new Set());
  const [originalPosts, setOriginalPosts] = useState<Map<string, CommunityPost>>(new Map());
  const [avatarByEmail, setAvatarByEmail] = useState<Map<string, string>>(new Map());
  const [commentsByPost, setCommentsByPost] = useState<Map<string, PostComment[]>>(new Map());
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [quoteTarget, setQuoteTarget] = useState<CommunityPost | null>(null);
  const [showFeedModal, setShowFeedModal] = useState(false);

  // Preferências do feed
  const [topicos, setTopicos] = useState<string[]>(["acoes", "dividendos", "macroeconomia"]);
  const [algoritmo, setAlgoritmo] = useState<FeedAlgorithm>("relevance");

  // Sidebar direita — dados reais (substitui hardcoded antigo)
  const [topMovers, setTopMovers] = useState<{ symbol: string; name: string; change: number | null }[]>([]);
  const [topInvestors, setTopInvestors] = useState<{ name: string; points: number; rank: number }[]>([]);

  // Upload de imagem do composer
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const userInitial = initialFromName(userName);

  function handlePickImage() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) return; // 5MB
    setPendingImage(file);
    const reader = new FileReader();
    reader.onload = () => setPendingImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function clearPendingImage() {
    setPendingImage(null);
    setPendingImagePreview(null);
  }

  async function uploadPendingImage(): Promise<string | null> {
    if (!pendingImage) return null;
    setUploading(true);
    try {
      const ext = pendingImage.name.split(".").pop() || "jpg";
      const path = `${userEmail}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage
        .from("community-uploads")
        .upload(path, pendingImage, { upsert: false, contentType: pendingImage.type });
      if (error) return null;
      const { data: pub } = supabase.storage.from("community-uploads").getPublicUrl(path);
      return pub.publicUrl;
    } finally {
      setUploading(false);
    }
  }

  const [followingEmails, setFollowingEmails] = useState<Set<string>>(new Set());

  const loadFollowing = useCallback(async () => {
    const { data } = await supabase
      .from("user_follow")
      .select("following_email")
      .eq("follower_email", userEmail);
    setFollowingEmails(new Set((data ?? []).map((r: { following_email: string }) => r.following_email)));
  }, [supabase, userEmail]);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setFeedError(null);
    const { data, error } = await supabase
      .from("community_post")
      .select("*")
      .neq("moderation_status", "rejeitado")
      .order("created_at", { ascending: false })
      .limit(80);
    if (error) {
      console.error("[comunidade/loadPosts]", error);
      setFeedError("Não consegui carregar o feed.");
      setLoading(false);
      return;
    }
    const list = (data ?? []) as CommunityPost[];
    setPosts(list);

    // Fetch original posts referenced by reposts (so we can render the embedded card)
    const ids = Array.from(
      new Set(list.map((p) => p.repost_of_id).filter((x): x is string => Boolean(x)))
    );
    let origList: CommunityPost[] = [];
    if (ids.length > 0) {
      const { data: origs } = await supabase.from("community_post").select("*").in("id", ids);
      origList = (origs ?? []) as CommunityPost[];
      const m = new Map<string, CommunityPost>();
      for (const p of origList) m.set(p.id, p);
      setOriginalPosts(m);
    } else {
      setOriginalPosts(new Map());
    }

    // Resolve author avatars from user_profile so post avatars always reflect
    // the current profile photo (covers legacy rows with null author_avatar
    // and propagates avatar changes to old posts).
    const emails = Array.from(
      new Set(
        [...list, ...origList]
          .map((p) => p.author_email)
          .filter((x): x is string => Boolean(x))
      )
    );
    if (emails.length > 0) {
      const { data: profs } = await supabase
        .from("user_profile")
        .select("user_email, avatar_url")
        .in("user_email", emails);
      const next = new Map<string, string>();
      for (const p of (profs ?? []) as { user_email: string; avatar_url: string | null }[]) {
        if (p.avatar_url) next.set(p.user_email, p.avatar_url);
      }
      setAvatarByEmail(next);
    } else {
      setAvatarByEmail(new Map());
    }

    setLoading(false);
  }, [supabase]);

  const loadMyReposts = useCallback(async () => {
    const { data } = await supabase
      .from("community_post")
      .select("repost_of_id, content")
      .eq("author_email", userEmail)
      .not("repost_of_id", "is", null)
      .is("content", null);
    setMyReposts(
      new Set(
        (data ?? [])
          .map((r: { repost_of_id: string | null }) => r.repost_of_id)
          .filter((x): x is string => Boolean(x))
      )
    );
  }, [supabase, userEmail]);

  const loadConnections = useCallback(async () => {
    const [{ count: ing }, { count: ers }] = await Promise.all([
      supabase.from("user_follow").select("*", { count: "exact", head: true }).eq("follower_email", userEmail),
      supabase.from("user_follow").select("*", { count: "exact", head: true }).eq("following_email", userEmail),
    ]);
    setFollowingCount(ing ?? 0);
    setFollowersCount(ers ?? 0);
  }, [supabase, userEmail]);

  const loadReactions = useCallback(async () => {
    const { data } = await supabase
      .from("post_reaction")
      .select("post_id")
      .eq("user_email", userEmail)
      .eq("reaction_type", "like");
    setLikedPosts(new Set((data ?? []).map((r: { post_id: string }) => r.post_id)));

    const { data: saved } = await supabase
      .from("saved_post")
      .select("post_id")
      .eq("user_email", userEmail);
    setSavedPosts(new Set((saved ?? []).map((r: { post_id: string }) => r.post_id)));
  }, [supabase, userEmail]);

  const loadPreferences = useCallback(async () => {
    const { data } = await supabase
      .from("user_content_preferences")
      .select("feed_algorithm, interest_topics")
      .eq("user_email", userEmail)
      .maybeSingle();
    if (data) {
      setAlgoritmo((data.feed_algorithm as FeedAlgorithm) ?? "relevance");
      setTopicos(data.interest_topics ?? []);
    }
  }, [supabase, userEmail]);

  const loadSidebarData = useCallback(async () => {
    // Top movers — top 3 altas do dia via /api/acoes-overview
    try {
      const res = await fetch("/api/acoes-overview");
      if (res.ok) {
        const data = (await res.json()) as { topGainers?: { symbol: string; name: string; change: number | null }[] };
        setTopMovers((data.topGainers ?? []).slice(0, 3).map((m) => ({
          symbol: m.symbol, name: m.name, change: m.change,
        })));
      }
    } catch {}

    // Top investidores — query real em user_points
    const { data: pts } = await supabase
      .from("user_points")
      .select("user_email, total_points")
      .order("total_points", { ascending: false })
      .limit(3);

    const emails = (pts ?? []).map((p: { user_email: string }) => p.user_email);
    let nameByEmail = new Map<string, string>();
    if (emails.length > 0) {
      const { data: profs } = await supabase
        .from("user_profile")
        .select("user_email, user_name")
        .in("user_email", emails);
      nameByEmail = new Map(
        (profs ?? []).map((p: { user_email: string; user_name: string | null }) =>
          [p.user_email, p.user_name ?? p.user_email.split("@")[0]] as [string, string]
        )
      );
    }
    setTopInvestors(
      (pts ?? []).map((p: { user_email: string; total_points: number }, i: number) => ({
        name: nameByEmail.get(p.user_email) ?? p.user_email.split("@")[0],
        points: p.total_points ?? 0,
        rank: i + 1,
      }))
    );
  }, [supabase]);

  useEffect(() => {
    loadPosts();
    loadConnections();
    loadReactions();
    loadPreferences();
    loadMyReposts();
    loadSidebarData();
    loadFollowing();
  }, [loadPosts, loadConnections, loadReactions, loadPreferences, loadMyReposts, loadSidebarData, loadFollowing]);

  async function handlePost() {
    if ((!composerText.trim() && !pendingImage) || posting) return;
    setPosting(true);
    let imageUrl: string | null = null;
    if (pendingImage) {
      imageUrl = await uploadPendingImage();
    }
    const { error } = await supabase.from("community_post").insert({
      content: composerText.trim() || null,
      author_name: userName,
      author_email: userEmail,
      author_avatar: userAvatar,
      post_type: "text",
      is_premium_only: isPremium,
      moderation_status: "aprovado",
      images: imageUrl ? [imageUrl] : [],
    });
    setPosting(false);
    if (!error) {
      setComposerText("");
      setIsPremium(false);
      clearPendingImage();
      loadPosts();
    }
  }

  async function toggleLike(post: CommunityPost) {
    const isLiked = likedPosts.has(post.id);
    const next = new Set(likedPosts);
    if (isLiked) {
      next.delete(post.id);
      setLikedPosts(next);
      setPosts((ps) => ps.map((p) => (p.id === post.id ? { ...p, likes_count: Math.max(0, p.likes_count - 1) } : p)));
      await supabase.from("post_reaction").delete()
        .eq("post_id", post.id).eq("user_email", userEmail).eq("reaction_type", "like");
    } else {
      next.add(post.id);
      setLikedPosts(next);
      setPosts((ps) => ps.map((p) => (p.id === post.id ? { ...p, likes_count: p.likes_count + 1 } : p)));
      await supabase.from("post_reaction").insert({
        post_id: post.id, user_email: userEmail, user_name: userName, reaction_type: "like",
      });
    }
  }

  async function toggleSave(post: CommunityPost) {
    const isSaved = savedPosts.has(post.id);
    const next = new Set(savedPosts);
    if (isSaved) {
      next.delete(post.id);
      setSavedPosts(next);
      await supabase.from("saved_post").delete()
        .eq("post_id", post.id).eq("user_email", userEmail);
    } else {
      next.add(post.id);
      setSavedPosts(next);
      await supabase.from("saved_post").insert({
        user_email: userEmail, post_id: post.id, post_type: "community",
      });
    }
  }

  // Pure repost (no commentary). For posts that are themselves reposts,
  // operate on the underlying original so the count belongs to the source.
  async function toggleRepost(post: CommunityPost) {
    const targetId = post.repost_of_id ?? post.id;
    const already = myReposts.has(targetId);
    if (already) {
      setMyReposts((prev) => { const n = new Set(prev); n.delete(targetId); return n; });
      setPosts((ps) =>
        ps.map((p) => (p.id === targetId ? { ...p, reposts_count: Math.max(0, p.reposts_count - 1) } : p))
      );
      // Remove the repost row(s) created by this user for this target
      await supabase
        .from("community_post")
        .delete()
        .eq("author_email", userEmail)
        .eq("repost_of_id", targetId)
        .is("content", null);
      loadPosts();
    } else {
      setMyReposts((prev) => new Set(prev).add(targetId));
      setPosts((ps) =>
        ps.map((p) => (p.id === targetId ? { ...p, reposts_count: p.reposts_count + 1 } : p))
      );
      await supabase.from("community_post").insert({
        content: null,
        author_email: userEmail,
        author_name: userName,
        author_avatar: userAvatar,
        post_type: "text",
        repost_of_id: targetId,
        is_premium_only: false,
        moderation_status: "aprovado",
      });
      loadPosts();
    }
  }

  async function quoteRepost(post: CommunityPost, text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const targetId = post.repost_of_id ?? post.id;
    const { error } = await supabase.from("community_post").insert({
      content: trimmed,
      author_email: userEmail,
      author_name: userName,
      author_avatar: userAvatar,
      post_type: "text",
      repost_of_id: targetId,
      is_premium_only: false,
      moderation_status: "aprovado",
    });
    if (!error) {
      setQuoteTarget(null);
      loadPosts();
    }
  }

  async function toggleCommentsPanel(post: CommunityPost) {
    const isOpen = expandedComments.has(post.id);
    if (isOpen) {
      setExpandedComments((prev) => { const n = new Set(prev); n.delete(post.id); return n; });
      return;
    }
    setExpandedComments((prev) => new Set(prev).add(post.id));
    if (!commentsByPost.has(post.id)) {
      const { data } = await supabase
        .from("post_comment")
        .select("*")
        .eq("parent_type", "community_post")
        .eq("parent_id", post.id)
        .order("created_at", { ascending: true });
      const list = (data ?? []) as PostComment[];
      setCommentsByPost((prev) => new Map(prev).set(post.id, list));

      const newEmails = Array.from(
        new Set(list.map((c) => c.author_email).filter((e): e is string => Boolean(e)))
      ).filter((e) => !avatarByEmail.has(e));
      if (newEmails.length > 0) {
        const { data: profs } = await supabase
          .from("user_profile")
          .select("user_email, avatar_url")
          .in("user_email", newEmails);
        setAvatarByEmail((prev) => {
          const next = new Map(prev);
          for (const p of (profs ?? []) as { user_email: string; avatar_url: string | null }[]) {
            if (p.avatar_url) next.set(p.user_email, p.avatar_url);
          }
          return next;
        });
      }
    }
  }

  async function addComment(post: CommunityPost, text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const { data, error } = await supabase
      .from("post_comment")
      .insert({
        parent_type: "community_post",
        parent_id: post.id,
        author_email: userEmail,
        author_name: userName,
        author_avatar: userAvatar,
        content: trimmed,
      })
      .select()
      .single();
    if (!error && data) {
      const c = data as PostComment;
      setCommentsByPost((prev) => {
        const next = new Map(prev);
        next.set(post.id, [...(next.get(post.id) ?? []), c]);
        return next;
      });
      setPosts((ps) =>
        ps.map((p) => (p.id === post.id ? { ...p, comments_count: p.comments_count + 1 } : p))
      );
    }
  }

  async function savePreferences(novosTopicos: string[], novoAlgoritmo: FeedAlgorithm) {
    setTopicos(novosTopicos);
    setAlgoritmo(novoAlgoritmo);
    setShowFeedModal(false);
    await supabase.from("user_content_preferences").upsert(
      { user_email: userEmail, feed_algorithm: novoAlgoritmo, interest_topics: novosTopicos },
      { onConflict: "user_email" }
    );
  }

  const filteredPosts = useMemo(() => {
    let list = posts;

    if (busca.trim()) {
      const b = busca.toLowerCase();
      list = list.filter((p) =>
        (p.content ?? "").toLowerCase().includes(b) ||
        (p.author_name ?? "").toLowerCase().includes(b)
      );
    }

    const now = Date.now();
    const ageHours = (p: CommunityPost) =>
      Math.max(0.5, (now - new Date(p.created_at).getTime()) / 3_600_000);

    const engagementScore = (p: CommunityPost) =>
      (p.likes_count ?? 0) + 2 * (p.comments_count ?? 0) + 3 * (p.reposts_count ?? 0);

    const topicMatch = (p: CommunityPost) => {
      if (topicos.length === 0) return 0;
      const tags = p.tags ?? [];
      const hits = tags.filter((t) => topicos.includes(t)).length;
      return hits;
    };

    const relevanceScore = (p: CommunityPost) => {
      // Score combinado: tópicos de interesse + engajamento + recência + bônus de quem você segue
      const topicBoost = topicMatch(p) * 25;
      const followBoost = followingEmails.has(p.author_email ?? "") ? 30 : 0;
      const engagement = engagementScore(p);
      const recency = 50 / Math.sqrt(ageHours(p));
      return topicBoost + followBoost + engagement + recency;
    };

    if (algoritmo === "engagement") {
      list = [...list].sort((a, b) => engagementScore(b) - engagementScore(a)
        || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (algoritmo === "relevance") {
      list = [...list].sort((a, b) => relevanceScore(b) - relevanceScore(a));
    }
    // chronological: já vem ordenado por created_at desc na query

    return list;
  }, [posts, busca, algoritmo, topicos, followingEmails]);

  const feedHeading = useMemo(() => {
    switch (algoritmo) {
      case "engagement": return "Feed por Engajamento";
      case "relevance":  return "Feed Personalizado";
      default:           return "Feed Cronológico";
    }
  }, [algoritmo]);

  return (
    <div style={{ minHeight: "calc(100vh - 58px)", background: "#0a0806" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "20px 24px 64px",
        display: "grid", gridTemplateColumns: "240px 1fr 280px", gap: "16px", alignItems: "flex-start" }}>

        {/* ─── LEFT SIDEBAR ─── */}
        <aside style={{ display: "flex", flexDirection: "column", gap: "12px", position: "sticky", top: "78px" }}>
          {/* Search */}
          <div style={{ position: "relative" }}>
            <Search size={13} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9a8a6a" }} />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Pesquisar"
              style={{
                width: "100%", height: "36px",
                background: "#130f09",
                border: "1px solid rgba(201,168,76,0.1)",
                borderRadius: "8px", padding: "0 12px 0 32px",
                color: "#e8dcc0", fontSize: "12px",
                fontFamily: "var(--font-sans)", outline: "none",
              }}
            />
          </div>

          {/* Profile card */}
          <div style={{
            background: "linear-gradient(135deg, #2a1f3e 0%, #1a1410 50%, #2a1f12 100%)",
            border: "1px solid rgba(139,92,246,0.2)",
            borderRadius: "12px", padding: "20px 16px",
            display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
          }}>
            <div style={{
              width: "56px", height: "56px", borderRadius: "50%",
              background: userAvatar
                ? `url(${userAvatar}) center/cover no-repeat`
                : "linear-gradient(135deg, #8b5cf6, #6d28d9)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: "20px", fontWeight: 700,
              fontFamily: "var(--font-sans)", marginBottom: "10px",
              border: "2px solid rgba(139,92,246,0.4)",
              overflow: "hidden",
            }}>
              {!userAvatar && userInitial}
            </div>
            <p style={{
              fontSize: "13px", fontWeight: 600, color: "#e8dcc0",
              fontFamily: "var(--font-sans)", marginBottom: "2px",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%",
            }}>
              {userName}
            </p>
            <p style={{ fontSize: "10px", color: "#9a8aaa", fontFamily: "var(--font-sans)", marginBottom: "14px", letterSpacing: "0.04em" }}>
              Investidor
            </p>
            <button
              onClick={() => router.push("/dashboard/comunidade/rede")}
              style={{
                width: "100%",
                background: "rgba(13,11,7,0.5)",
                border: "1px solid rgba(139,92,246,0.25)",
                borderRadius: "8px", padding: "8px 12px",
                color: "#e8dcc0", fontSize: "11px",
                fontFamily: "var(--font-sans)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                transition: "border-color 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(139,92,246,0.5)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(139,92,246,0.25)"; }}
            >
              <span style={{ color: "#9a8aaa" }}>Conexões</span>
              <span style={{ fontWeight: 700, color: "#e8dcc0" }}>{followingCount + followersCount}</span>
            </button>
          </div>

          {/* Meus Itens */}
          <div style={{
            background: "#130f09",
            border: "1px solid rgba(201,168,76,0.1)",
            borderRadius: "12px", padding: "16px",
          }}>
            <p style={{
              fontSize: "11px", fontWeight: 600, color: "#a09068",
              fontFamily: "var(--font-sans)", letterSpacing: "0.06em",
              marginBottom: "12px", textTransform: "uppercase",
            }}>
              Meus Itens
            </p>
            <SidebarItem icon={<BookmarkIcon size={13} />} label="Itens salvos" onClick={() => router.push("/dashboard/comunidade?tab=saved")} />
            <SidebarItem icon={<UsersIcon size={13} />} label="Grupos" onClick={() => {}} />
            <SidebarItem icon={<MessageSquare size={13} />} label="Mensagens" onClick={() => router.push("/dashboard/comunidade/mensagens")} />
            <SidebarItem icon={<Settings2 size={13} />} label="Personalizar feed" onClick={() => setShowFeedModal(true)} />
          </div>
        </aside>

        {/* ─── CENTER FEED ─── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Composer */}
          <div style={{
            background: "#130f09",
            border: "1px solid rgba(201,168,76,0.1)",
            borderRadius: "12px", padding: "16px",
          }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
              <Avatar initial={userInitial} size={36} url={userAvatar} />
              <textarea
                value={composerText}
                onChange={(e) => setComposerText(e.target.value)}
                placeholder="Compartilhe seu pensamento sobre investimentos..."
                rows={2}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none", outline: "none",
                  color: "#e8dcc0", fontSize: "13px",
                  fontFamily: "var(--font-sans)", resize: "none",
                  padding: "8px 0", lineHeight: 1.5,
                }}
              />
            </div>
            {pendingImagePreview && (
              <div style={{
                position: "relative", marginBottom: "12px",
                borderRadius: "10px", overflow: "hidden",
                border: "1px solid rgba(201,168,76,0.1)",
                maxHeight: "300px",
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pendingImagePreview} alt="" style={{ width: "100%", display: "block", maxHeight: "300px", objectFit: "cover" }} />
                <button
                  onClick={clearPendingImage}
                  aria-label="Remover imagem"
                  style={{
                    position: "absolute", top: "8px", right: "8px",
                    width: "28px", height: "28px", borderRadius: "50%",
                    background: "rgba(0,0,0,0.7)", border: "none", cursor: "pointer",
                    color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            )}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              paddingTop: "10px", borderTop: "1px solid rgba(201,168,76,0.06)",
            }}>
              <div style={{ display: "flex", gap: "6px" }}>
                <ComposerIconBtn icon={<ImageIcon size={14} />} label="Imagem" onClick={handlePickImage} />
                <button
                  onClick={() => setIsPremium((v) => !v)}
                  style={{
                    display: "flex", alignItems: "center", gap: "5px",
                    padding: "5px 10px",
                    borderRadius: "6px",
                    border: "1px solid",
                    borderColor: isPremium ? "rgba(201,168,76,0.4)" : "rgba(201,168,76,0.1)",
                    background: isPremium ? "rgba(201,168,76,0.08)" : "transparent",
                    color: isPremium ? "#C9A84C" : "#a09068",
                    fontSize: "11px", fontWeight: 500,
                    fontFamily: "var(--font-sans)", cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <Sparkles size={11} fill={isPremium ? "#C9A84C" : "none"} /> Premium
                </button>
              </div>
              <button
                onClick={handlePost}
                disabled={(!composerText.trim() && !pendingImage) || posting || uploading}
                style={{
                  background: (composerText.trim() || pendingImage) && !posting && !uploading
                    ? "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)"
                    : "rgba(139,92,246,0.2)",
                  border: "none", borderRadius: "8px",
                  padding: "8px 18px",
                  color: (composerText.trim() || pendingImage) && !posting && !uploading ? "#fff" : "#7a6a8a",
                  fontSize: "12px", fontWeight: 600,
                  fontFamily: "var(--font-sans)",
                  cursor: (composerText.trim() || pendingImage) && !posting && !uploading ? "pointer" : "not-allowed",
                  letterSpacing: "0.04em",
                  boxShadow: (composerText.trim() || pendingImage) && !posting && !uploading ? "0 2px 12px rgba(139,92,246,0.3)" : "none",
                  transition: "box-shadow 0.15s",
                }}
              >
                {posting || uploading ? "..." : "Postar"}
              </button>
            </div>
          </div>

          {/* Feed header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 4px" }}>
            <h2 style={{ fontSize: "14px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-display)" }}>
              {feedHeading}
            </h2>
            <button
              onClick={loadPosts}
              aria-label="Atualizar feed"
              style={{
                background: "transparent", border: "none", cursor: "pointer",
                color: "#a09068", padding: "4px",
                display: "flex", alignItems: "center",
                transition: "color 0.15s",
              }}
              className="aurum-hover-gold aurum-hover-transition"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          {/* Posts */}
          {feedError ? (
            <ErrorState
              title={feedError}
              message="Pode ser uma flutuação na conexão com o Supabase."
              onRetry={loadPosts}
            />
          ) : loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <CommunityPostSkeleton />
              <CommunityPostSkeleton />
              <CommunityPostSkeleton />
            </div>
          ) : filteredPosts.length === 0 ? (
            <FeedEmpty text={busca ? "Nenhum post encontrado." : "Ainda não há posts. Seja o primeiro!"} />
          ) : (
            filteredPosts.map((post) => {
              const original = post.repost_of_id ? originalPosts.get(post.repost_of_id) ?? null : null;
              const isPureRepost = !!post.repost_of_id && !(post.content && post.content.trim());
              const main = isPureRepost && original ? original : post;
              return (
                <PostCard
                  key={post.id}
                  post={post}
                  main={main}
                  original={original}
                  isPureRepost={isPureRepost}
                  liked={likedPosts.has(main.id)}
                  saved={savedPosts.has(main.id)}
                  reposted={myReposts.has(main.id)}
                  comments={commentsByPost.get(main.id) ?? []}
                  commentsExpanded={expandedComments.has(main.id)}
                  currentUserName={userName}
                  currentUserAvatar={userAvatar}
                  avatarByEmail={avatarByEmail}
                  onLike={() => toggleLike(main)}
                  onSave={() => toggleSave(main)}
                  onRepost={() => toggleRepost(main)}
                  onQuote={() => setQuoteTarget(main)}
                  onToggleComments={() => toggleCommentsPanel(main)}
                  onAddComment={(text: string) => addComment(main, text)}
                />
              );
            })
          )}
        </div>

        {/* ─── RIGHT SIDEBAR ─── */}
        <aside style={{ display: "flex", flexDirection: "column", gap: "12px", position: "sticky", top: "78px" }}>
          <RightCard title="Maiores altas hoje" icon={<Newspaper size={13} />}>
            {topMovers.length === 0 ? (
              <p style={{ fontSize: "11px", color: "#a09068", fontFamily: "var(--font-sans)" }}>
                Carregando dados do mercado...
              </p>
            ) : (
              topMovers.map((m) => (
                <RightItem
                  key={m.symbol}
                  label={m.name}
                  meta={`${m.symbol} · ${m.change !== null ? (m.change > 0 ? "+" : "") + m.change.toFixed(2) + "%" : "—"}`}
                />
              ))
            )}
          </RightCard>

          <RightCard title="Top investidores" icon={<TrendingUp size={13} />}>
            {topInvestors.length === 0 ? (
              <p style={{ fontSize: "11px", color: "#a09068", fontFamily: "var(--font-sans)" }}>
                Sem ranking ainda.
              </p>
            ) : (
              topInvestors.map((inv) => (
                <TopInvestor key={inv.rank} name={inv.name} points={inv.points} rank={inv.rank} />
              ))
            )}
          </RightCard>
        </aside>
      </div>

      {/* Personalizar Feed Modal */}
      {showFeedModal && (
        <PersonalizarFeedModal
          topicosSelecionados={topicos}
          algoritmoSelecionado={algoritmo}
          onSave={savePreferences}
          onClose={() => setShowFeedModal(false)}
        />
      )}

      {/* Quote Repost Modal */}
      {quoteTarget && (
        <QuoteRepostModal
          post={quoteTarget}
          authorInitial={userInitial}
          authorName={userName}
          authorAvatar={userAvatar}
          onClose={() => setQuoteTarget(null)}
          onSubmit={(text) => quoteRepost(quoteTarget, text)}
        />
      )}
    </div>
  );
}

// ─── PostCard ─────────────────────────────────────────────────────────────────

function PostCard({
  post, main, original, isPureRepost,
  liked, saved, reposted,
  comments, commentsExpanded, currentUserName, currentUserAvatar,
  avatarByEmail,
  onLike, onSave, onRepost, onQuote, onToggleComments, onAddComment,
}: {
  post: CommunityPost;          // raw row from feed (could be a repost wrapper)
  main: CommunityPost;          // post we visually render as the main card
  original: CommunityPost | null; // original referenced by post.repost_of_id (if any)
  isPureRepost: boolean;
  liked: boolean;
  saved: boolean;
  reposted: boolean;
  comments: PostComment[];
  commentsExpanded: boolean;
  currentUserName: string;
  currentUserAvatar: string | null;
  avatarByEmail: Map<string, string>;
  onLike: () => void;
  onSave: () => void;
  onRepost: () => void;
  onQuote: () => void;
  onToggleComments: () => void;
  onAddComment: (text: string) => void;
}) {
  const [repostMenu, setRepostMenu] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const initial = initialFromName(main.author_name);
  const isNews = main.post_type === "news";
  const isQuoteRepost = !isPureRepost && !!post.repost_of_id;
  const mainAvatar = resolveAvatar(main.author_email, main.author_avatar, avatarByEmail);
  const repostHeaderAvatar = resolveAvatar(post.author_email, post.author_avatar, avatarByEmail);

  // Pure repost referencing a deleted/missing original
  if (isPureRepost && !original) {
    return (
      <div style={{
        background: "#130f09",
        border: "1px solid rgba(201,168,76,0.1)",
        borderRadius: "12px", padding: "14px 18px",
        color: "#a09068", fontSize: "12px",
        fontFamily: "var(--font-sans)",
      }}>
        Post original removido.
      </div>
    );
  }

  return (
    <div style={{
      background: "#130f09",
      border: "1px solid rgba(201,168,76,0.1)",
      borderRadius: "12px", padding: "16px 18px",
    }}>
      {/* Repost banner */}
      {isPureRepost && (
        <div style={{
          display: "flex", alignItems: "center", gap: "6px",
          fontSize: "11px", color: "#a09068",
          fontFamily: "var(--font-sans)", marginBottom: "10px",
        }}>
          <Repeat2 size={11} />
          <AuthorLink username={post.author_username} name={post.author_name} fallback="Alguém" inline />
          <span>repostou</span>
          <span style={{ color: "#9a8a6a" }}>· {formatRelativeTime(post.created_at)}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "10px" }}>
        <Avatar initial={initial} size={34} url={mainAvatar} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <AuthorLink username={main.author_username} name={main.author_name} />
            {main.is_premium_only && (
              <Sparkles size={10} style={{ color: "#C9A84C" }} fill="#C9A84C" />
            )}
          </div>
          <p style={{ fontSize: "11px", color: "#9a8a6a", fontFamily: "var(--font-sans)" }}>
            {formatRelativeTime(main.created_at)}
          </p>
        </div>
        {isNews && (
          <span style={{
            fontSize: "9px", fontWeight: 700, color: "#3b82f6",
            background: "rgba(59,130,246,0.1)",
            padding: "3px 8px", borderRadius: "4px",
            letterSpacing: "0.06em",
            fontFamily: "var(--font-sans)",
          }}>
            NOTÍCIA
          </span>
        )}
      </div>

      {/* News block */}
      {isNews && main.news_title && (
        <div style={{
          background: "#0d0b07",
          border: "1px solid rgba(59,130,246,0.15)",
          borderRadius: "10px", padding: "12px 14px", marginBottom: "10px",
        }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-sans)", marginBottom: "4px", lineHeight: 1.4 }}>
            {main.news_title}
          </p>
          {main.news_url && (
            <a
              href={main.news_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: "4px",
                fontSize: "11px", color: "#3b82f6",
                fontFamily: "var(--font-sans)", textDecoration: "none",
                marginTop: "6px",
              }}
            >
              Ver fonte <ExternalLink size={10} />
            </a>
          )}
        </div>
      )}

      {/* Content */}
      {main.content && (
        <p style={{
          fontSize: "13px", color: "#c8b89a",
          fontFamily: "var(--font-sans)", lineHeight: 1.6,
          marginBottom: main.tags && main.tags.length > 0 ? "10px" : "12px",
          whiteSpace: "pre-wrap", wordBreak: "break-word",
        }}>
          {main.content}
        </p>
      )}

      {/* Image */}
      {main.images && main.images.length > 0 && (
        <div style={{
          marginBottom: "12px",
          borderRadius: "10px", overflow: "hidden",
          border: "1px solid rgba(201,168,76,0.08)",
        }}>
          <img src={main.images[0]} alt="" style={{ width: "100%", display: "block" }} />
        </div>
      )}

      {/* Tags */}
      {main.tags && main.tags.length > 0 && (
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
          {main.tags.map((tag) => (
            <span key={tag} style={{
              fontSize: "10px", fontWeight: 600, color: "#C9A84C",
              background: "rgba(201,168,76,0.1)",
              padding: "3px 8px", borderRadius: "4px",
              fontFamily: "var(--font-sans)",
            }}>
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Embedded original (quote repost only) */}
      {isQuoteRepost && original && (
        <EmbeddedOriginal post={original} avatarByEmail={avatarByEmail} />
      )}
      {isQuoteRepost && !original && (
        <div style={{
          marginBottom: "12px",
          borderRadius: "10px", border: "1px dashed rgba(201,168,76,0.15)",
          padding: "12px 14px", color: "#a09068",
          fontSize: "12px", fontFamily: "var(--font-sans)",
        }}>
          Post original removido.
        </div>
      )}

      {/* Actions */}
      <div style={{
        display: "flex", gap: "16px", paddingTop: "10px",
        borderTop: "1px solid rgba(201,168,76,0.06)",
        position: "relative",
      }}>
        <ActionBtn
          icon={<Heart size={13} fill={liked ? "#ef4444" : "none"} />}
          count={main.likes_count}
          active={liked}
          activeColor="#ef4444"
          onClick={onLike}
        />
        <ActionBtn
          icon={<MessageCircle size={13} />}
          count={main.comments_count}
          active={commentsExpanded}
          activeColor="#C9A84C"
          onClick={onToggleComments}
        />
        <div style={{ position: "relative" }}>
          <ActionBtn
            icon={<Repeat2 size={13} />}
            count={main.reposts_count}
            active={reposted}
            activeColor="#10b981"
            onClick={() => setRepostMenu((v) => !v)}
          />
          {repostMenu && (
            <RepostMenu
              reposted={reposted}
              onRepost={() => { setRepostMenu(false); onRepost(); }}
              onQuote={() => { setRepostMenu(false); onQuote(); }}
              onClose={() => setRepostMenu(false)}
            />
          )}
        </div>
        <div style={{ flex: 1 }} />
        <ActionBtn
          icon={<Bookmark size={13} fill={saved ? "#C9A84C" : "none"} />}
          active={saved}
          activeColor="#C9A84C"
          onClick={onSave}
        />
      </div>

      {/* Comments panel */}
      {commentsExpanded && (
        <div style={{
          marginTop: "12px", paddingTop: "12px",
          borderTop: "1px solid rgba(201,168,76,0.06)",
        }}>
          {comments.length === 0 ? (
            <p style={{
              fontSize: "12px", color: "#a09068",
              fontFamily: "var(--font-sans)", textAlign: "center",
              padding: "8px 0 14px",
            }}>
              Nenhum comentário ainda. Seja o primeiro!
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "12px" }}>
              {comments.map((c) => (
                <CommentRow key={c.id} comment={c} avatarByEmail={avatarByEmail} />
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
            <Avatar initial={initialFromName(currentUserName)} size={28} url={currentUserAvatar} />
            <div style={{
              flex: 1,
              display: "flex", alignItems: "center", gap: "6px",
              background: "#0d0b07",
              border: "1px solid rgba(201,168,76,0.1)",
              borderRadius: "20px", padding: "4px 6px 4px 12px",
            }}>
              <input
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && commentDraft.trim()) {
                    onAddComment(commentDraft);
                    setCommentDraft("");
                  }
                }}
                placeholder="Escreva um comentário..."
                style={{
                  flex: 1, background: "transparent", border: "none",
                  outline: "none", color: "#e8dcc0",
                  fontSize: "12px", fontFamily: "var(--font-sans)",
                  padding: "4px 0",
                }}
              />
              <button
                aria-label="Enviar comentário"
                disabled={!commentDraft.trim()}
                onClick={() => {
                  if (!commentDraft.trim()) return;
                  onAddComment(commentDraft);
                  setCommentDraft("");
                }}
                style={{
                  background: commentDraft.trim()
                    ? "linear-gradient(135deg, #8b5cf6, #6d28d9)"
                    : "rgba(139,92,246,0.2)",
                  border: "none", borderRadius: "50%",
                  width: "28px", height: "28px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: commentDraft.trim() ? "#fff" : "#7a6a8a",
                  cursor: commentDraft.trim() ? "pointer" : "not-allowed",
                  flexShrink: 0,
                }}
              >
                <Send size={12} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Repost Menu (popover) ────────────────────────────────────────────────────

function RepostMenu({
  reposted, onRepost, onQuote, onClose,
}: {
  reposted: boolean;
  onRepost: () => void;
  onQuote: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onClick = () => onClose();
    // Defer so the opening click doesn't immediately dismiss
    const t = setTimeout(() => document.addEventListener("click", onClick), 0);
    return () => { clearTimeout(t); document.removeEventListener("click", onClick); };
  }, [onClose]);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "absolute", top: "calc(100% + 6px)", left: 0,
        background: "#130f09",
        border: "1px solid rgba(201,168,76,0.15)",
        borderRadius: "10px", padding: "4px",
        boxShadow: "0 8px 28px rgba(0,0,0,0.5)",
        zIndex: 20, minWidth: "180px",
      }}
    >
      <RepostMenuItem
        icon={<Repeat2 size={13} />}
        label={reposted ? "Desfazer repost" : "Repostar"}
        onClick={onRepost}
      />
      <RepostMenuItem
        icon={<MessageCircle size={13} />}
        label="Repostar com comentário"
        onClick={onQuote}
      />
    </div>
  );
}

function RepostMenuItem({
  icon, label, onClick,
}: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: "8px",
        padding: "8px 10px", borderRadius: "6px",
        background: "transparent", border: "none", cursor: "pointer",
        color: "#c8b89a", fontSize: "12px",
        fontFamily: "var(--font-sans)", textAlign: "left",
        transition: "background 0.15s, color 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(201,168,76,0.08)";
        e.currentTarget.style.color = "#C9A84C";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = "#c8b89a";
      }}
    >
      {icon} {label}
    </button>
  );
}

// ─── Embedded Original (for quote reposts) ────────────────────────────────────

function EmbeddedOriginal({ post, avatarByEmail }: { post: CommunityPost; avatarByEmail?: Map<string, string> }) {
  const initial = initialFromName(post.author_name);
  const avatar = resolveAvatar(post.author_email, post.author_avatar, avatarByEmail);
  return (
    <div style={{
      marginBottom: "12px",
      background: "#0d0b07",
      border: "1px solid rgba(201,168,76,0.1)",
      borderRadius: "10px", padding: "12px 14px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
        <Avatar initial={initial} size={24} url={avatar} />
        <AuthorLink username={post.author_username} name={post.author_name} small />
        <span style={{ fontSize: "10px", color: "#9a8a6a", fontFamily: "var(--font-sans)" }}>
          · {formatRelativeTime(post.created_at)}
        </span>
      </div>
      {post.content && (
        <p style={{
          fontSize: "12px", color: "#a89878",
          fontFamily: "var(--font-sans)", lineHeight: 1.55,
          whiteSpace: "pre-wrap", wordBreak: "break-word",
        }}>
          {post.content}
        </p>
      )}
      {post.images && post.images.length > 0 && (
        <div style={{
          marginTop: "8px", borderRadius: "8px", overflow: "hidden",
          border: "1px solid rgba(201,168,76,0.08)",
        }}>
          <img src={post.images[0]} alt="" style={{ width: "100%", display: "block" }} />
        </div>
      )}
    </div>
  );
}

// ─── Comment row ──────────────────────────────────────────────────────────────

function CommentRow({ comment, avatarByEmail }: { comment: PostComment; avatarByEmail?: Map<string, string> }) {
  const avatar = resolveAvatar(comment.author_email, comment.author_avatar, avatarByEmail);
  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
      <Avatar initial={initialFromName(comment.author_name)} size={28} url={avatar} />
      <div style={{
        flex: 1,
        background: "#0d0b07",
        border: "1px solid rgba(201,168,76,0.06)",
        borderRadius: "10px", padding: "8px 12px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
          <AuthorLink username={comment.author_username} name={comment.author_name} small />
          <span style={{ fontSize: "10px", color: "#9a8a6a", fontFamily: "var(--font-sans)" }}>
            · {formatRelativeTime(comment.created_at)}
          </span>
        </div>
        <p style={{
          fontSize: "12px", color: "#c8b89a",
          fontFamily: "var(--font-sans)", lineHeight: 1.5,
          whiteSpace: "pre-wrap", wordBreak: "break-word",
        }}>
          {comment.content}
        </p>
      </div>
    </div>
  );
}

// ─── Quote Repost Modal ───────────────────────────────────────────────────────

function QuoteRepostModal({
  post, authorInitial, authorName, authorAvatar, onClose, onSubmit,
}: {
  post: CommunityPost;
  authorInitial: string;
  authorName: string;
  authorAvatar: string | null;
  onClose: () => void;
  onSubmit: (text: string) => void;
}) {
  const [text, setText] = useState("");
  const canSubmit = text.trim().length > 0;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(4px)", zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#130f09",
          border: "1px solid rgba(201,168,76,0.15)",
          borderRadius: "14px",
          width: "100%", maxWidth: "520px",
          padding: "22px 24px", maxHeight: "90vh", overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-display)" }}>
            Repostar com comentário
          </h2>
          <button
            onClick={onClose}
            aria-label="Fechar"
            style={{
              background: "transparent", border: "none", cursor: "pointer",
              color: "#a09068", padding: "4px",
              display: "flex", alignItems: "center",
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
          <Avatar initial={authorInitial} size={36} url={authorAvatar} />
          <div style={{ flex: 1 }}>
            <p style={{
              fontSize: "12px", color: "#9a8a6a",
              fontFamily: "var(--font-sans)", marginBottom: "6px",
            }}>
              {authorName}
            </p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Adicione um comentário..."
              autoFocus
              rows={3}
              style={{
                width: "100%", background: "transparent",
                border: "none", outline: "none",
                color: "#e8dcc0", fontSize: "14px",
                fontFamily: "var(--font-sans)", resize: "none",
                lineHeight: 1.5,
              }}
            />
          </div>
        </div>

        <EmbeddedOriginal post={post} />

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "1px solid rgba(201,168,76,0.15)",
              borderRadius: "8px", padding: "9px 18px",
              color: "#9a8a6a", fontSize: "12px", fontWeight: 500,
              fontFamily: "var(--font-sans)", cursor: "pointer",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={() => onSubmit(text)}
            disabled={!canSubmit}
            style={{
              background: canSubmit
                ? "linear-gradient(135deg, #8b5cf6, #6d28d9)"
                : "rgba(139,92,246,0.2)",
              border: "none", borderRadius: "8px",
              padding: "9px 18px",
              color: canSubmit ? "#fff" : "#7a6a8a",
              fontSize: "12px", fontWeight: 600,
              fontFamily: "var(--font-sans)",
              cursor: canSubmit ? "pointer" : "not-allowed",
              boxShadow: canSubmit ? "0 2px 12px rgba(139,92,246,0.3)" : "none",
            }}
          >
            Repostar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Personalizar Feed Modal ─────────────────────────────────────────────────

function PersonalizarFeedModal({
  topicosSelecionados, algoritmoSelecionado, onSave, onClose,
}: {
  topicosSelecionados: string[];
  algoritmoSelecionado: FeedAlgorithm;
  onSave: (topicos: string[], algoritmo: FeedAlgorithm) => void;
  onClose: () => void;
}) {
  const [topicos, setTopicos] = useState<string[]>(topicosSelecionados);
  const [algoritmo, setAlgoritmo] = useState<FeedAlgorithm>(algoritmoSelecionado);

  function toggleTopico(id: string) {
    setTopicos((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(4px)", zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#130f09",
          border: "1px solid rgba(201,168,76,0.15)",
          borderRadius: "14px",
          width: "100%", maxWidth: "480px",
          padding: "28px", maxHeight: "90vh", overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-display)" }}>
            Personalizar Feed
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent", border: "none", cursor: "pointer",
              color: "#a09068", padding: "4px",
              display: "flex", alignItems: "center",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tópicos */}
        <div style={{ marginBottom: "24px" }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-sans)", marginBottom: "6px" }}>
            Tópicos de Interesse
          </p>
          <p style={{ fontSize: "11px", color: "#a09068", fontFamily: "var(--font-sans)", marginBottom: "12px" }}>
            Selecione os tópicos que mais te interessam
          </p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {TOPICOS_INTERESSE.map((t) => {
              const ativo = topicos.includes(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => toggleTopico(t.id)}
                  style={{
                    padding: "6px 12px", borderRadius: "20px",
                    border: "1px solid",
                    borderColor: ativo ? t.color : "rgba(201,168,76,0.15)",
                    background: ativo ? `${t.color}1f` : "#0d0b07",
                    color: ativo ? t.color : "#9a8a6a",
                    fontSize: "12px", fontWeight: ativo ? 600 : 500,
                    fontFamily: "var(--font-sans)", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: "5px",
                    transition: "all 0.15s",
                  }}
                >
                  {ativo && <span style={{ fontSize: "10px" }}>✓</span>} {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Algoritmo */}
        <div style={{ marginBottom: "20px" }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-sans)", marginBottom: "12px" }}>
            Algoritmo do Feed
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {FEED_ALGORITHMS.map((a) => {
              const ativo = algoritmo === a.id;
              return (
                <button
                  key={a.id}
                  onClick={() => setAlgoritmo(a.id)}
                  style={{
                    width: "100%", textAlign: "left",
                    padding: "12px 14px", borderRadius: "8px",
                    border: "1px solid",
                    borderColor: ativo ? "rgba(139,92,246,0.4)" : "rgba(201,168,76,0.1)",
                    background: ativo ? "rgba(139,92,246,0.08)" : "#0d0b07",
                    cursor: "pointer", transition: "all 0.15s",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}
                >
                  <div>
                    <p style={{
                      fontSize: "13px", fontWeight: 600,
                      color: ativo ? "#e8dcc0" : "#9a8a6a",
                      fontFamily: "var(--font-sans)", marginBottom: "2px",
                    }}>
                      {a.label}
                    </p>
                    <p style={{ fontSize: "11px", color: "#a09068", fontFamily: "var(--font-sans)" }}>
                      {a.description}
                    </p>
                  </div>
                  {ativo && <span style={{ color: "#8b5cf6", fontSize: "14px" }}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tip */}
        <div style={{
          background: "rgba(139,92,246,0.06)",
          border: "1px solid rgba(139,92,246,0.15)",
          borderRadius: "8px", padding: "10px 12px",
          fontSize: "11px", color: "#8a7a9a",
          fontFamily: "var(--font-sans)", lineHeight: 1.5,
          marginBottom: "20px",
        }}>
          💡 <strong style={{ color: "#a89aba" }}>Dica:</strong> Suas preferências ajudam a IA a sugerir conteúdo mais relevante para você. Você também pode seguir usuários específicos para ver seus posts no topo do feed.
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "1px solid rgba(201,168,76,0.15)",
              borderRadius: "8px", padding: "9px 18px",
              color: "#9a8a6a", fontSize: "12px", fontWeight: 500,
              fontFamily: "var(--font-sans)", cursor: "pointer",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave(topicos, algoritmo)}
            style={{
              background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
              border: "none", borderRadius: "8px",
              padding: "9px 18px", color: "#fff",
              fontSize: "12px", fontWeight: 600,
              fontFamily: "var(--font-sans)", cursor: "pointer",
              boxShadow: "0 2px 12px rgba(139,92,246,0.3)",
            }}
          >
            Salvar Preferências
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function AuthorLink({
  username, name, fallback = "Anônimo", small, inline,
}: { username: string | null; name: string | null; fallback?: string; small?: boolean; inline?: boolean }) {
  const text = name ?? fallback;
  const fontSize = small ? "12px" : "13px";
  const baseStyle: React.CSSProperties = {
    fontSize,
    fontWeight: 600,
    color: "#e8dcc0",
    fontFamily: "var(--font-sans)",
    textDecoration: "none",
    transition: "color 0.15s",
  };
  if (!username) return <span style={baseStyle}>{text}</span>;
  return (
    <Link
      href={`/dashboard/perfil/${encodeURIComponent(username)}`}
      style={{ ...baseStyle, cursor: "pointer", display: inline ? "inline" : undefined }}
      className="aurum-hover-gold aurum-hover-transition"
    >
      {text}
    </Link>
  );
}

// Prefer the live profile avatar (loaded from user_profile) over the snapshot
// stored on the post/comment row, so old rows reflect the user's current photo.
function resolveAvatar(
  email: string | null | undefined,
  fallback: string | null | undefined,
  byEmail?: Map<string, string>,
): string | null {
  if (email && byEmail) {
    const live = byEmail.get(email);
    if (live) return live;
  }
  return fallback ?? null;
}

function Avatar({ initial, size, url }: { initial: string; size: number; url?: string | null }) {
  return (
    <div style={{
      width: `${size}px`, height: `${size}px`, borderRadius: "50%",
      background: url
        ? `url(${url}) center/cover no-repeat`
        : "linear-gradient(135deg, #8b5cf6, #6d28d9)",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontSize: `${Math.round(size * 0.4)}px`, fontWeight: 700,
      fontFamily: "var(--font-sans)", flexShrink: 0,
      overflow: "hidden",
    }}>
      {!url && initial}
    </div>
  );
}

function SidebarItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: "10px",
        padding: "8px 10px", borderRadius: "6px",
        background: "transparent", border: "none",
        cursor: "pointer", color: "#9a8a6a",
        fontSize: "12px", fontFamily: "var(--font-sans)",
        textAlign: "left", transition: "all 0.15s",
      }}
      className="aurum-hover-gold aurum-hover-bg aurum-hover-transition"
    >
      {icon} {label}
    </button>
  );
}

function ComposerIconBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: "5px",
        padding: "5px 10px", borderRadius: "6px",
        background: "transparent",
        border: "1px solid rgba(201,168,76,0.1)",
        color: "#a09068", fontSize: "11px", fontWeight: 500,
        fontFamily: "var(--font-sans)", cursor: "pointer",
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(201,168,76,0.25)";
        e.currentTarget.style.color = "#C9A84C";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(201,168,76,0.1)";
        e.currentTarget.style.color = "#a09068";
      }}
    >
      {icon} {label}
    </button>
  );
}

function ActionBtn({
  icon, count, active, activeColor, onClick,
}: {
  icon: React.ReactNode;
  count?: number;
  active?: boolean;
  activeColor?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: "5px",
        background: "transparent", border: "none",
        cursor: onClick ? "pointer" : "default",
        color: active && activeColor ? activeColor : "#a09068",
        fontSize: "12px", fontFamily: "var(--font-sans)",
        padding: "4px 6px", borderRadius: "4px",
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => {
        if (onClick && !active) e.currentTarget.style.color = "#C9A84C";
      }}
      onMouseLeave={(e) => {
        if (onClick && !active) e.currentTarget.style.color = "#a09068";
      }}
    >
      {icon} {count !== undefined && <span>{count}</span>}
    </button>
  );
}

function FeedEmpty({ text }: { text: string }) {
  return (
    <div style={{
      background: "#130f09",
      border: "1px solid rgba(201,168,76,0.08)",
      borderRadius: "12px", padding: "40px 24px",
      textAlign: "center", color: "#a09068", fontSize: "13px",
      fontFamily: "var(--font-sans)",
    }}>
      {text}
    </div>
  );
}

// Skeleton com formato de PostCard (avatar 36 + name + 4 linhas de texto +
// barra de actions). Mantém altura proxima do card real pra evitar shift.
function CommunityPostSkeleton() {
  return (
    <div style={{
      background: "#130f09",
      border: "1px solid rgba(201,168,76,0.08)",
      borderRadius: "12px",
      padding: "16px 20px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
        <Skeleton className="size-9 rounded-full" />
        <div style={{ flex: 1 }}>
          <Skeleton className="h-3.5 w-32 mb-1.5" />
          <Skeleton className="h-2.5 w-20" />
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-[94%]" />
        <Skeleton className="h-3.5 w-[78%]" />
      </div>
      <div style={{ display: "flex", gap: "20px", paddingTop: "12px", borderTop: "1px solid rgba(201,168,76,0.06)" }}>
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
}

function RightCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{
      background: "#130f09",
      border: "1px solid rgba(201,168,76,0.1)",
      borderRadius: "12px", padding: "16px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#C9A84C" }}>
          {icon}
          <span style={{ fontSize: "12px", fontWeight: 600, fontFamily: "var(--font-sans)", letterSpacing: "0.04em" }}>
            {title}
          </span>
        </div>
        <RefreshCw size={11} style={{ color: "#9a8a6a", cursor: "pointer" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>{children}</div>
    </div>
  );
}

function RightItem({ label, meta }: { label: string; meta: string }) {
  return (
    <div style={{
      paddingBottom: "10px",
      borderBottom: "1px solid rgba(201,168,76,0.05)",
    }}>
      <p style={{
        fontSize: "12px", color: "#c8b89a",
        fontFamily: "var(--font-sans)", lineHeight: 1.4,
        marginBottom: "4px",
      }}>
        {label}
      </p>
      <p style={{ fontSize: "10px", color: "#9a8a6a", fontFamily: "var(--font-sans)" }}>
        {meta}
      </p>
    </div>
  );
}

function TopInvestor({ name, points, rank }: { name: string; points: number; rank: number }) {
  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <span style={{ fontSize: "16px" }}>{medal}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: "12px", color: "#e8dcc0", fontFamily: "var(--font-sans)", marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {name}
        </p>
        <p style={{ fontSize: "10px", color: "#C9A84C", fontFamily: "var(--font-sans)", fontWeight: 600 }}>
          {points.toLocaleString("pt-BR")} XP
        </p>
      </div>
    </div>
  );
}
