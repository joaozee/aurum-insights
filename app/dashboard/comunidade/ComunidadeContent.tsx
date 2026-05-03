"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Image as ImageIcon, Sparkles, RefreshCw, Heart,
  MessageCircle, Share2, Bookmark, Newspaper, TrendingUp,
  Bookmark as BookmarkIcon, Users as UsersIcon, Settings2,
  MessageSquare, X, ExternalLink,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  type CommunityPost, formatRelativeTime, initialFromName,
  TOPICOS_INTERESSE, FEED_ALGORITHMS, type FeedAlgorithm,
} from "@/lib/comunidade";

interface Props {
  userEmail: string;
  userName: string;
}

export default function ComunidadeContent({ userEmail, userName }: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [composerText, setComposerText] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [posting, setPosting] = useState(false);
  const [busca, setBusca] = useState("");
  const [followingCount, setFollowingCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [showFeedModal, setShowFeedModal] = useState(false);

  // Preferências do feed
  const [topicos, setTopicos] = useState<string[]>(["acoes", "dividendos", "macroeconomia"]);
  const [algoritmo, setAlgoritmo] = useState<FeedAlgorithm>("relevance");

  const userInitial = initialFromName(userName);

  const loadPosts = useCallback(async () => {
    const { data } = await supabase
      .from("community_post")
      .select("*")
      .eq("moderation_status", "aprovado")
      .order("created_at", { ascending: false })
      .limit(50);
    setPosts((data ?? []) as CommunityPost[]);
    setLoading(false);
  }, [supabase]);

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

  useEffect(() => {
    loadPosts();
    loadConnections();
    loadReactions();
    loadPreferences();
  }, [loadPosts, loadConnections, loadReactions, loadPreferences]);

  async function handlePost() {
    if (!composerText.trim() || posting) return;
    setPosting(true);
    const { error } = await supabase.from("community_post").insert({
      content: composerText.trim(),
      author_name: userName,
      author_email: userEmail,
      author_avatar: null,
      post_type: "text",
      is_premium_only: isPremium,
    });
    setPosting(false);
    if (!error) {
      setComposerText("");
      setIsPremium(false);
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
    if (!busca.trim()) return posts;
    const b = busca.toLowerCase();
    return posts.filter((p) =>
      p.content.toLowerCase().includes(b) ||
      (p.author_name ?? "").toLowerCase().includes(b)
    );
  }, [posts, busca]);

  return (
    <div style={{ minHeight: "calc(100vh - 58px)", background: "#0a0806" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "20px 24px 64px",
        display: "grid", gridTemplateColumns: "240px 1fr 280px", gap: "16px", alignItems: "flex-start" }}>

        {/* ─── LEFT SIDEBAR ─── */}
        <aside style={{ display: "flex", flexDirection: "column", gap: "12px", position: "sticky", top: "78px" }}>
          {/* Search */}
          <div style={{ position: "relative" }}>
            <Search size={13} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#5a4a2a" }} />
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
              background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: "20px", fontWeight: 700,
              fontFamily: "var(--font-sans)", marginBottom: "10px",
              border: "2px solid rgba(139,92,246,0.4)",
            }}>
              {userInitial}
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
              fontSize: "11px", fontWeight: 600, color: "#7a6a4a",
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
            <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
              <Avatar initial={userInitial} size={36} />
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
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              paddingTop: "10px", borderTop: "1px solid rgba(201,168,76,0.06)",
            }}>
              <div style={{ display: "flex", gap: "6px" }}>
                <ComposerIconBtn icon={<ImageIcon size={14} />} label="Imagem" />
                <button
                  onClick={() => setIsPremium((v) => !v)}
                  style={{
                    display: "flex", alignItems: "center", gap: "5px",
                    padding: "5px 10px",
                    borderRadius: "6px",
                    border: "1px solid",
                    borderColor: isPremium ? "rgba(201,168,76,0.4)" : "rgba(201,168,76,0.1)",
                    background: isPremium ? "rgba(201,168,76,0.08)" : "transparent",
                    color: isPremium ? "#C9A84C" : "#7a6a4a",
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
                disabled={!composerText.trim() || posting}
                style={{
                  background: composerText.trim() && !posting
                    ? "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)"
                    : "rgba(139,92,246,0.2)",
                  border: "none", borderRadius: "8px",
                  padding: "8px 18px",
                  color: composerText.trim() && !posting ? "#fff" : "#7a6a8a",
                  fontSize: "12px", fontWeight: 600,
                  fontFamily: "var(--font-sans)",
                  cursor: composerText.trim() && !posting ? "pointer" : "not-allowed",
                  letterSpacing: "0.04em",
                  boxShadow: composerText.trim() && !posting ? "0 2px 12px rgba(139,92,246,0.3)" : "none",
                  transition: "box-shadow 0.15s",
                }}
              >
                {posting ? "..." : "Postar"}
              </button>
            </div>
          </div>

          {/* Feed header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 4px" }}>
            <h2 style={{ fontSize: "14px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-display)" }}>
              Feed Cronológico
            </h2>
            <button
              onClick={loadPosts}
              aria-label="Atualizar feed"
              style={{
                background: "transparent", border: "none", cursor: "pointer",
                color: "#7a6a4a", padding: "4px",
                display: "flex", alignItems: "center",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#C9A84C"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#7a6a4a"; }}
            >
              <RefreshCw size={14} />
            </button>
          </div>

          {/* Posts */}
          {loading ? (
            <FeedEmpty text="Carregando feed..." />
          ) : filteredPosts.length === 0 ? (
            <FeedEmpty text={busca ? "Nenhum post encontrado." : "Ainda não há posts. Seja o primeiro!"} />
          ) : (
            filteredPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                liked={likedPosts.has(post.id)}
                saved={savedPosts.has(post.id)}
                onLike={() => toggleLike(post)}
                onSave={() => toggleSave(post)}
              />
            ))
          )}
        </div>

        {/* ─── RIGHT SIDEBAR ─── */}
        <aside style={{ display: "flex", flexDirection: "column", gap: "12px", position: "sticky", top: "78px" }}>
          <RightCard title="Notícias do mercado" icon={<Newspaper size={13} />}>
            <RightItem
              label="Banco do Brasil registra lucro de R$ 9,6 bi"
              meta="BBAS3 · há 2h"
            />
            <RightItem
              label="Selic mantida em 10,75%, sinaliza Copom"
              meta="Macro · há 5h"
            />
            <RightItem
              label="Petrobras anuncia novos dividendos extraordinários"
              meta="PETR4 · há 1d"
            />
          </RightCard>

          <RightCard title="Top investidores" icon={<TrendingUp size={13} />}>
            <TopInvestor name="Investidor 1" returnPct={28.4} rank={1} />
            <TopInvestor name="Investidor 2" returnPct={19.7} rank={2} />
            <TopInvestor name="Investidor 3" returnPct={14.2} rank={3} />
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
    </div>
  );
}

// ─── PostCard ─────────────────────────────────────────────────────────────────

function PostCard({
  post, liked, saved, onLike, onSave,
}: {
  post: CommunityPost;
  liked: boolean;
  saved: boolean;
  onLike: () => void;
  onSave: () => void;
}) {
  const initial = initialFromName(post.author_name);
  const isNews = post.post_type === "news";

  return (
    <div style={{
      background: "#130f09",
      border: "1px solid rgba(201,168,76,0.1)",
      borderRadius: "12px", padding: "16px 18px",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "10px" }}>
        <Avatar initial={initial} size={34} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-sans)" }}>
              {post.author_name ?? "Anônimo"}
            </span>
            {post.is_premium_only && (
              <Sparkles size={10} style={{ color: "#C9A84C" }} fill="#C9A84C" />
            )}
          </div>
          <p style={{ fontSize: "11px", color: "#5a4a2a", fontFamily: "var(--font-sans)" }}>
            {formatRelativeTime(post.created_at)}
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
      {isNews && post.news_title && (
        <div style={{
          background: "#0d0b07",
          border: "1px solid rgba(59,130,246,0.15)",
          borderRadius: "10px", padding: "12px 14px", marginBottom: "10px",
        }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-sans)", marginBottom: "4px", lineHeight: 1.4 }}>
            {post.news_title}
          </p>
          {post.news_url && (
            <a
              href={post.news_url}
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
      <p style={{
        fontSize: "13px", color: "#c8b89a",
        fontFamily: "var(--font-sans)", lineHeight: 1.6,
        marginBottom: post.tags && post.tags.length > 0 ? "10px" : "12px",
        whiteSpace: "pre-wrap", wordBreak: "break-word",
      }}>
        {post.content}
      </p>

      {/* Image */}
      {post.images && post.images.length > 0 && (
        <div style={{
          marginBottom: "12px",
          borderRadius: "10px", overflow: "hidden",
          border: "1px solid rgba(201,168,76,0.08)",
        }}>
          <img src={post.images[0]} alt="" style={{ width: "100%", display: "block" }} />
        </div>
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
          {post.tags.map((tag) => (
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

      {/* Actions */}
      <div style={{
        display: "flex", gap: "16px", paddingTop: "10px",
        borderTop: "1px solid rgba(201,168,76,0.06)",
      }}>
        <ActionBtn
          icon={<Heart size={13} fill={liked ? "#ef4444" : "none"} />}
          count={post.likes_count}
          active={liked}
          activeColor="#ef4444"
          onClick={onLike}
        />
        <ActionBtn icon={<MessageCircle size={13} />} count={0} />
        <ActionBtn icon={<Share2 size={13} />} count={post.shares_count} />
        <div style={{ flex: 1 }} />
        <ActionBtn
          icon={<Bookmark size={13} fill={saved ? "#C9A84C" : "none"} />}
          active={saved}
          activeColor="#C9A84C"
          onClick={onSave}
        />
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
              color: "#7a6a4a", padding: "4px",
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
          <p style={{ fontSize: "11px", color: "#7a6a4a", fontFamily: "var(--font-sans)", marginBottom: "12px" }}>
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
                    <p style={{ fontSize: "11px", color: "#6a5a3a", fontFamily: "var(--font-sans)" }}>
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

function Avatar({ initial, size }: { initial: string; size: number }) {
  return (
    <div style={{
      width: `${size}px`, height: `${size}px`, borderRadius: "50%",
      background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontSize: `${Math.round(size * 0.4)}px`, fontWeight: 700,
      fontFamily: "var(--font-sans)", flexShrink: 0,
    }}>
      {initial}
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
      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(201,168,76,0.05)"; e.currentTarget.style.color = "#C9A84C"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#9a8a6a"; }}
    >
      {icon} {label}
    </button>
  );
}

function ComposerIconBtn({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      aria-label={label}
      style={{
        display: "flex", alignItems: "center", gap: "5px",
        padding: "5px 10px", borderRadius: "6px",
        background: "transparent",
        border: "1px solid rgba(201,168,76,0.1)",
        color: "#7a6a4a", fontSize: "11px", fontWeight: 500,
        fontFamily: "var(--font-sans)", cursor: "pointer",
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(201,168,76,0.25)";
        e.currentTarget.style.color = "#C9A84C";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(201,168,76,0.1)";
        e.currentTarget.style.color = "#7a6a4a";
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
        color: active && activeColor ? activeColor : "#7a6a4a",
        fontSize: "12px", fontFamily: "var(--font-sans)",
        padding: "4px 6px", borderRadius: "4px",
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => {
        if (onClick && !active) e.currentTarget.style.color = "#C9A84C";
      }}
      onMouseLeave={(e) => {
        if (onClick && !active) e.currentTarget.style.color = "#7a6a4a";
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
      textAlign: "center", color: "#7a6a4a", fontSize: "13px",
      fontFamily: "var(--font-sans)",
    }}>
      {text}
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
        <RefreshCw size={11} style={{ color: "#5a4a2a", cursor: "pointer" }} />
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
      <p style={{ fontSize: "10px", color: "#5a4a2a", fontFamily: "var(--font-sans)" }}>
        {meta}
      </p>
    </div>
  );
}

function TopInvestor({ name, returnPct, rank }: { name: string; returnPct: number; rank: number }) {
  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <span style={{ fontSize: "16px" }}>{medal}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: "12px", color: "#e8dcc0", fontFamily: "var(--font-sans)", marginBottom: "2px" }}>
          {name}
        </p>
        <p style={{ fontSize: "10px", color: "#10b981", fontFamily: "var(--font-sans)", fontWeight: 600 }}>
          +{returnPct.toFixed(1)}%
        </p>
      </div>
    </div>
  );
}
