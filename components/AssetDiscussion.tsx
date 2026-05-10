"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { ThumbsUp, MessageSquare, MessageSquareText, Send, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Discussion {
  id: string;
  ticker: string;
  content: string;
  author_email: string;
  author_name: string;
  author_avatar: string | null;
  created_at: string;
  likes_count: number;
  replies_count: number;
}

interface Reply {
  id: string;
  discussion_id: string;
  content: string;
  author_email: string;
  author_name: string;
  author_avatar: string | null;
  created_at: string;
}

interface Props {
  ticker: string;
  userEmail: string;
  userName: string;
  userAvatar: string | null;
}

const PAGE_SIZE = 10;

export default function AssetDiscussion({ ticker, userEmail, userName, userAvatar }: Props) {
  const supabase = useMemo(() => createClient(), []);

  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);

  const [composer, setComposer] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  const [openReplies, setOpenReplies] = useState<Set<string>>(new Set());
  const [repliesById, setRepliesById] = useState<Map<string, Reply[]>>(new Map());
  const [replyDrafts, setReplyDrafts] = useState<Map<string, string>>(new Map());
  const [replySubmitting, setReplySubmitting] = useState<Set<string>>(new Set());

  // ─── Loaders ────────────────────────────────────────────────────────────────

  const loadDiscussions = useCallback(async (pageOffset: number) => {
    const { data, error } = await supabase
      .from("asset_discussion")
      .select("*")
      .eq("ticker", ticker)
      .order("created_at", { ascending: false })
      .range(pageOffset, pageOffset + PAGE_SIZE);
    if (error) {
      console.error("[AssetDiscussion] load error", error);
      return { items: [], more: false };
    }
    const all = (data ?? []) as Discussion[];
    return { items: all.slice(0, PAGE_SIZE), more: all.length > PAGE_SIZE };
  }, [supabase, ticker]);

  const loadLikes = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    const { data } = await supabase
      .from("asset_discussion_like")
      .select("discussion_id")
      .eq("user_email", userEmail)
      .in("discussion_id", ids);
    setLikedIds((prev) => {
      const next = new Set(prev);
      for (const r of (data ?? []) as { discussion_id: string }[]) next.add(r.discussion_id);
      return next;
    });
  }, [supabase, userEmail]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setDiscussions([]);
    setLikedIds(new Set());
    setOpenReplies(new Set());
    setRepliesById(new Map());
    (async () => {
      const { items, more } = await loadDiscussions(0);
      if (cancelled) return;
      setDiscussions(items);
      setHasMore(more);
      setLoading(false);
      await loadLikes(items.map((d) => d.id));
    })();
    return () => { cancelled = true; };
  }, [loadDiscussions, loadLikes]);

  // ─── Actions ────────────────────────────────────────────────────────────────

  async function handleSubmitQuestion(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = composer.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);

    const { data, error } = await supabase
      .from("asset_discussion")
      .insert({
        ticker,
        content: trimmed,
        author_email: userEmail,
        author_name: userName,
        author_avatar: userAvatar,
      })
      .select()
      .single();

    setSubmitting(false);
    if (error) {
      console.error("[AssetDiscussion] insert", error);
      return;
    }
    setComposer("");
    if (data) setDiscussions((prev) => [data as Discussion, ...prev]);
  }

  async function toggleLike(d: Discussion) {
    const isLiked = likedIds.has(d.id);

    // Optimistic
    setLikedIds((prev) => {
      const next = new Set(prev);
      isLiked ? next.delete(d.id) : next.add(d.id);
      return next;
    });
    setDiscussions((prev) => prev.map((x) =>
      x.id === d.id
        ? { ...x, likes_count: Math.max(0, x.likes_count + (isLiked ? -1 : 1)) }
        : x
    ));

    if (isLiked) {
      const { error } = await supabase
        .from("asset_discussion_like")
        .delete()
        .eq("discussion_id", d.id)
        .eq("user_email", userEmail);
      if (error) console.error("[AssetDiscussion] unlike", error);
    } else {
      const { error } = await supabase
        .from("asset_discussion_like")
        .insert({ discussion_id: d.id, user_email: userEmail });
      if (error) console.error("[AssetDiscussion] like", error);
    }
  }

  async function toggleReplies(d: Discussion) {
    const willOpen = !openReplies.has(d.id);
    setOpenReplies((prev) => {
      const next = new Set(prev);
      willOpen ? next.add(d.id) : next.delete(d.id);
      return next;
    });

    if (willOpen && !repliesById.has(d.id)) {
      const { data, error } = await supabase
        .from("asset_discussion_reply")
        .select("*")
        .eq("discussion_id", d.id)
        .order("created_at", { ascending: true });
      if (error) {
        console.error("[AssetDiscussion] replies", error);
        return;
      }
      setRepliesById((prev) => new Map(prev).set(d.id, (data ?? []) as Reply[]));
    }
  }

  async function handleSubmitReply(d: Discussion) {
    const text = (replyDrafts.get(d.id) ?? "").trim();
    if (!text || replySubmitting.has(d.id)) return;
    setReplySubmitting((prev) => new Set(prev).add(d.id));

    const { data, error } = await supabase
      .from("asset_discussion_reply")
      .insert({
        discussion_id: d.id,
        content: text,
        author_email: userEmail,
        author_name: userName,
        author_avatar: userAvatar,
      })
      .select()
      .single();

    setReplySubmitting((prev) => {
      const next = new Set(prev);
      next.delete(d.id);
      return next;
    });
    if (error) {
      console.error("[AssetDiscussion] reply insert", error);
      return;
    }

    setReplyDrafts((prev) => {
      const next = new Map(prev);
      next.delete(d.id);
      return next;
    });
    setRepliesById((prev) => {
      const list = prev.get(d.id) ?? [];
      return new Map(prev).set(d.id, [...list, data as Reply]);
    });
    setDiscussions((prev) => prev.map((x) =>
      x.id === d.id ? { ...x, replies_count: x.replies_count + 1 } : x
    ));
    if (!openReplies.has(d.id)) {
      setOpenReplies((prev) => new Set(prev).add(d.id));
    }
  }

  async function loadMore() {
    const { items, more } = await loadDiscussions(discussions.length);
    setDiscussions((prev) => [...prev, ...items]);
    setHasMore(more);
    await loadLikes(items.map((d) => d.id));
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <section
      aria-label={`Discussão sobre ${ticker}`}
      style={{
        background: "#130f09",
        border: "1px solid rgba(201,168,76,0.1)",
        borderRadius: "14px",
        padding: "24px",
        marginBottom: "16px",
      }}
    >
      <header style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "20px" }}>
        <h3 style={{
          fontSize: "12px",
          fontWeight: 700,
          color: "#e8dcc0",
          fontFamily: "var(--font-display)",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          margin: 0,
        }}>
          Discussão
        </h3>
        <MessageSquareText size={15} style={{ color: "#C9A84C" }} aria-hidden="true" />
      </header>

      {/* Composer */}
      <form onSubmit={handleSubmitQuestion} style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
          <Avatar name={userName} url={userAvatar} size={28} />
          <p style={{ fontSize: "12px", color: "#a09068", fontFamily: "var(--font-sans)", margin: 0 }}>
            <strong style={{ color: "#e8dcc0" }}>{firstName(userName)}</strong>, envie aqui sua pergunta
          </p>
        </div>
        <textarea
          value={composer}
          onChange={(e) => setComposer(e.target.value)}
          placeholder={`Descrição da pergunta sobre ${ticker}...`}
          rows={3}
          maxLength={2000}
          aria-label="Pergunta para a comunidade"
          style={{
            width: "100%",
            padding: "12px 14px",
            background: "#0d0b07",
            border: "1px solid rgba(201,168,76,0.12)",
            borderRadius: "10px",
            color: "#e8dcc0",
            fontSize: "13px",
            fontFamily: "var(--font-sans)",
            lineHeight: 1.55,
            outline: "none",
            resize: "vertical",
            minHeight: "70px",
            transition: "border-color 0.15s",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.35)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.12)")}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
          <span style={{ fontSize: "10px", color: "#7a6d57", fontFamily: "var(--font-sans)", fontVariantNumeric: "tabular-nums" }}>
            {composer.length}/2000
          </span>
          <button
            type="submit"
            disabled={!composer.trim() || submitting}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              minHeight: "36px",
              background: composer.trim() && !submitting
                ? "linear-gradient(135deg, #C9A84C 0%, #A07820 100%)"
                : "rgba(201,168,76,0.08)",
              border: "1px solid rgba(201,168,76,0.2)",
              borderRadius: "8px",
              color: composer.trim() && !submitting ? "#0d0b07" : "#7a6d57",
              fontSize: "11px",
              fontWeight: 700,
              fontFamily: "var(--font-sans)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              cursor: composer.trim() && !submitting ? "pointer" : "not-allowed",
              transition: "all 0.15s",
            }}
          >
            {submitting ? <Loader2 size={12} className="aurum-spin" /> : <Send size={12} />}
            Enviar pergunta
          </button>
        </div>
      </form>

      {/* List */}
      {loading ? (
        <p style={{ textAlign: "center", padding: "32px 0", fontSize: "12px", color: "#7a6d57", fontFamily: "var(--font-sans)" }}>
          Carregando discussão...
        </p>
      ) : discussions.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 16px" }}>
          <MessageSquare size={28} style={{ color: "rgba(201,168,76,0.25)", marginBottom: "10px" }} aria-hidden="true" />
          <p style={{ fontSize: "13px", color: "#a09068", fontFamily: "var(--font-sans)", margin: 0, marginBottom: "4px" }}>
            Seja o primeiro a iniciar uma discussão sobre {ticker}.
          </p>
          <p style={{ fontSize: "11px", color: "#7a6d57", fontFamily: "var(--font-sans)", margin: 0 }}>
            Sua pergunta pode ajudar outros investidores.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {discussions.map((d) => (
            <DiscussionItem
              key={d.id}
              discussion={d}
              isLiked={likedIds.has(d.id)}
              onToggleLike={() => toggleLike(d)}
              onToggleReplies={() => toggleReplies(d)}
              repliesOpen={openReplies.has(d.id)}
              replies={repliesById.get(d.id) ?? null}
              replyDraft={replyDrafts.get(d.id) ?? ""}
              onChangeReply={(v) => setReplyDrafts((prev) => new Map(prev).set(d.id, v))}
              onSubmitReply={() => handleSubmitReply(d)}
              replySubmitting={replySubmitting.has(d.id)}
            />
          ))}

          {hasMore && (
            <button
              onClick={loadMore}
              style={{
                marginTop: "8px",
                padding: "10px 16px",
                background: "transparent",
                border: "1px solid rgba(201,168,76,0.18)",
                borderRadius: "8px",
                color: "#C9A84C",
                fontSize: "11px",
                fontWeight: 600,
                fontFamily: "var(--font-sans)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "all 0.15s",
                alignSelf: "center",
              }}
            >
              Carregar mais perguntas
            </button>
          )}
        </div>
      )}
    </section>
  );
}

// ─── Subcomponentes ───────────────────────────────────────────────────────────

interface DiscussionItemProps {
  discussion: Discussion;
  isLiked: boolean;
  onToggleLike: () => void;
  onToggleReplies: () => void;
  repliesOpen: boolean;
  replies: Reply[] | null;
  replyDraft: string;
  onChangeReply: (v: string) => void;
  onSubmitReply: () => void;
  replySubmitting: boolean;
}

function DiscussionItem({
  discussion: d, isLiked, onToggleLike, onToggleReplies,
  repliesOpen, replies, replyDraft, onChangeReply, onSubmitReply, replySubmitting,
}: DiscussionItemProps) {
  return (
    <article style={{
      borderLeft: "2px solid rgba(201,168,76,0.18)",
      paddingLeft: "16px",
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "12px",
        marginBottom: "8px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
          <Avatar name={d.author_name} url={d.author_avatar} size={32} />
          <span style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "#C9A84C",
            fontFamily: "var(--font-sans)",
          }}>
            {d.author_name}
          </span>
        </div>
        <time
          dateTime={d.created_at}
          style={{
            fontSize: "10px",
            color: "#7a6d57",
            fontFamily: "var(--font-sans)",
            fontVariantNumeric: "tabular-nums",
            flexShrink: 0,
          }}
        >
          {formatDate(d.created_at)}
        </time>
      </div>

      {/* Content */}
      <p style={{
        fontSize: "13px",
        color: "#e8dcc0",
        fontFamily: "var(--font-sans)",
        lineHeight: 1.6,
        marginTop: 0,
        marginBottom: "12px",
        whiteSpace: "pre-wrap",
      }}>
        {d.content}
      </p>

      {/* Actions */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
        <button
          onClick={onToggleLike}
          aria-pressed={isLiked}
          aria-label={`${isLiked ? "Descurtir" : "Curtir"} pergunta. ${d.likes_count} curtidas.`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 12px",
            minHeight: "32px",
            background: isLiked ? "rgba(201,168,76,0.12)" : "#0d0b07",
            border: `1px solid ${isLiked ? "rgba(201,168,76,0.35)" : "rgba(201,168,76,0.08)"}`,
            borderRadius: "16px",
            color: isLiked ? "#C9A84C" : "#a09068",
            fontSize: "11px",
            fontWeight: 600,
            fontFamily: "var(--font-sans)",
            cursor: "pointer",
            transition: "all 0.15s",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          <ThumbsUp size={12} fill={isLiked ? "#C9A84C" : "transparent"} />
          {d.likes_count}
        </button>

        <button
          onClick={onToggleReplies}
          aria-expanded={repliesOpen}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 12px",
            minHeight: "32px",
            background: repliesOpen ? "rgba(201,168,76,0.08)" : "#0d0b07",
            border: "1px solid rgba(201,168,76,0.08)",
            borderRadius: "16px",
            color: "#e8dcc0",
            fontSize: "11px",
            fontWeight: 600,
            fontFamily: "var(--font-sans)",
            cursor: "pointer",
            transition: "all 0.15s",
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "0.04em",
          }}
        >
          <MessageSquare size={12} />
          {d.replies_count} {d.replies_count === 1 ? "RESPOSTA" : "RESPOSTAS"}
        </button>
      </div>

      {/* Replies */}
      {repliesOpen && (
        <div style={{
          marginTop: "16px",
          paddingTop: "12px",
          borderTop: "1px solid rgba(201,168,76,0.06)",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}>
          {replies === null ? (
            <p style={{ fontSize: "11px", color: "#7a6d57", fontFamily: "var(--font-sans)", margin: 0 }}>
              Carregando respostas...
            </p>
          ) : replies.length === 0 ? (
            <p style={{ fontSize: "11px", color: "#7a6d57", fontFamily: "var(--font-sans)", margin: 0, fontStyle: "italic" }}>
              Sem respostas ainda. Seja o primeiro.
            </p>
          ) : (
            replies.map((r) => (
              <div key={r.id} style={{ paddingLeft: "12px", borderLeft: "1px solid rgba(201,168,76,0.08)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Avatar name={r.author_name} url={r.author_avatar} size={22} />
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "#c8b89a", fontFamily: "var(--font-sans)" }}>
                      {r.author_name}
                    </span>
                  </div>
                  <time dateTime={r.created_at} style={{
                    fontSize: "10px", color: "#7a6d57", fontFamily: "var(--font-sans)",
                    fontVariantNumeric: "tabular-nums",
                  }}>
                    {formatDate(r.created_at)}
                  </time>
                </div>
                <p style={{
                  fontSize: "12px",
                  color: "#c8b89a",
                  fontFamily: "var(--font-sans)",
                  lineHeight: 1.55,
                  margin: 0,
                  whiteSpace: "pre-wrap",
                }}>
                  {r.content}
                </p>
              </div>
            ))
          )}

          {/* Reply form */}
          <form
            onSubmit={(e) => { e.preventDefault(); onSubmitReply(); }}
            style={{ display: "flex", gap: "8px", alignItems: "stretch" }}
          >
            <input
              value={replyDraft}
              onChange={(e) => onChangeReply(e.target.value)}
              placeholder="Sua resposta..."
              maxLength={2000}
              aria-label="Sua resposta"
              style={{
                flex: 1,
                minHeight: "36px",
                padding: "0 12px",
                background: "#0d0b07",
                border: "1px solid rgba(201,168,76,0.12)",
                borderRadius: "8px",
                color: "#e8dcc0",
                fontSize: "12px",
                fontFamily: "var(--font-sans)",
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={!replyDraft.trim() || replySubmitting}
              style={{
                padding: "0 14px",
                minHeight: "36px",
                minWidth: "44px",
                background: replyDraft.trim() && !replySubmitting
                  ? "linear-gradient(135deg, #C9A84C 0%, #A07820 100%)"
                  : "rgba(201,168,76,0.08)",
                border: "none",
                borderRadius: "8px",
                color: replyDraft.trim() && !replySubmitting ? "#0d0b07" : "#7a6d57",
                cursor: replyDraft.trim() && !replySubmitting ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s",
              }}
              aria-label="Enviar resposta"
            >
              {replySubmitting ? <Loader2 size={14} className="aurum-spin" /> : <Send size={14} />}
            </button>
          </form>
        </div>
      )}
    </article>
  );
}

function Avatar({ name, url, size }: { name: string; url: string | null; size: number }) {
  if (url) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={url}
        alt=""
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: "50%",
          objectFit: "cover",
          background: "#1a1410",
          flexShrink: 0,
        }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #1a1410, #0d0b07)",
        border: "1px solid rgba(201,168,76,0.18)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#C9A84C",
        fontSize: `${Math.max(10, Math.round(size * 0.4))}px`,
        fontWeight: 700,
        fontFamily: "var(--font-display)",
        flexShrink: 0,
      }}
    >
      {initial(name)}
    </span>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initial(name: string): string {
  const trim = (name ?? "").trim();
  return trim ? trim[0]!.toUpperCase() : "?";
}

function firstName(name: string): string {
  const trim = (name ?? "").trim();
  if (!trim) return "Você";
  return trim.split(/\s+/)[0]!;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const diffMs = Date.now() - d.getTime();
  const diffH = diffMs / 3.6e6;
  if (diffH < 1) {
    const m = Math.max(1, Math.round(diffMs / 60000));
    return `há ${m} min`;
  }
  if (diffH < 24) return `há ${Math.round(diffH)}h`;
  const diffD = diffH / 24;
  if (diffD < 7) return `há ${Math.round(diffD)}d`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}
