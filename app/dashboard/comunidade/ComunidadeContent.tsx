"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search, Image as ImageIcon, RefreshCw, Heart,
  MessageCircle, Repeat2, Bookmark, Newspaper, TrendingUp,
  Bookmark as BookmarkIcon, Users as UsersIcon, Settings2,
  MessageSquare, X, ExternalLink, Send,
  Mic, Video, Square, Headphones, Film,
  ShieldCheck,
} from "lucide-react";
import { isAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/client";
import {
  type CommunityPost, type PostComment, type PostType,
  formatRelativeTime, initialFromName,
  TOPICOS_INTERESSE, FEED_ALGORITHMS, type FeedAlgorithm,
} from "@/lib/comunidade";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";

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

  // ─── Composer media (image / audio / video) ─────────────────────────────
  // Cada slot é mutuamente exclusivo — um post tem 1 mídia. Trocar de tipo
  // descarta o anterior. `pendingMedia` carrega tudo num único state pra
  // simplificar lifecycle.

  type MediaKind = "image" | "audio" | "video";
  type PendingMedia = {
    kind: MediaKind;
    file: File;
    /** Object URL pra preview. Revogado quando o slot é limpo. */
    previewUrl: string;
    /** Marca se veio de uma gravação ao vivo (vs upload de arquivo). */
    recorded?: boolean;
  };

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingMedia, setPendingMedia] = useState<PendingMedia | null>(null);
  const [uploading, setUploading] = useState(false);

  // Gravação ao vivo
  type RecState = { kind: "audio" | "video"; stream: MediaStream; recorder: MediaRecorder; chunks: Blob[]; startedAt: number };
  const [recording, setRecording] = useState<{ kind: "audio" | "video"; elapsed: number } | null>(null);
  const recRef = useRef<RecState | null>(null);
  const recTickRef = useRef<number | null>(null);
  // Preview ao vivo da câmera durante gravação de vídeo
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);

  const userInitial = initialFromName(userName);

  function clearPendingMedia() {
    if (pendingMedia?.previewUrl) {
      URL.revokeObjectURL(pendingMedia.previewUrl);
    }
    setPendingMedia(null);
  }

  function acceptFile(kind: MediaKind, file: File) {
    // Limites por tipo — equilibram custo de storage e usabilidade
    const limits: Record<MediaKind, number> = {
      image: 5 * 1024 * 1024,   //  5 MB
      audio: 20 * 1024 * 1024,  // 20 MB
      video: 50 * 1024 * 1024,  // 50 MB
    };
    if (file.size > limits[kind]) {
      const mb = (limits[kind] / 1024 / 1024).toFixed(0);
      alert(`Arquivo muito grande. Máximo: ${mb} MB.`);
      return;
    }
    const expectedPrefix = kind + "/";
    if (!file.type.startsWith(expectedPrefix)) {
      alert(`Esse arquivo não parece ser ${kind === "image" ? "uma imagem" : kind === "audio" ? "um áudio" : "um vídeo"}.`);
      return;
    }
    if (pendingMedia?.previewUrl) URL.revokeObjectURL(pendingMedia.previewUrl);
    setPendingMedia({ kind, file, previewUrl: URL.createObjectURL(file) });
  }

  function handleFileChange(kind: MediaKind) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (file) acceptFile(kind, file);
    };
  }

  // ─── Gravação ao vivo (MediaRecorder API) ──────────────────────────────
  async function startRecording(kind: "audio" | "video") {
    if (recording) return;
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      alert("Seu navegador não suporta captura de mídia.");
      return;
    }
    try {
      const constraints: MediaStreamConstraints =
        kind === "video"
          ? { video: { facingMode: "user" }, audio: true }
          : { audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Escolher o melhor mime suportado pelo navegador
      const candidates =
        kind === "video"
          ? ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"]
          : ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
      const mimeType = candidates.find((m) => MediaRecorder.isTypeSupported(m)) ?? "";

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunks.push(ev.data);
      };
      recorder.onstop = () => {
        const type = recorder.mimeType || (kind === "video" ? "video/webm" : "audio/webm");
        const ext = type.includes("mp4") ? (kind === "video" ? "mp4" : "m4a")
                  : type.includes("ogg") ? "ogg"
                  : kind === "video" ? "webm" : "webm";
        const blob = new Blob(chunks, { type });
        const file = new File([blob], `${kind}-${Date.now()}.${ext}`, { type });
        if (pendingMedia?.previewUrl) URL.revokeObjectURL(pendingMedia.previewUrl);
        setPendingMedia({ kind, file, previewUrl: URL.createObjectURL(blob), recorded: true });
        // libera câmera/microfone
        stream.getTracks().forEach((t) => t.stop());
      };

      recRef.current = { kind, stream, recorder, chunks, startedAt: Date.now() };

      // Anexa o stream ao <video> de preview ao vivo, se for gravação de vídeo
      if (kind === "video") {
        // O elemento ainda pode não estar montado — setRecording dispara render
        requestAnimationFrame(() => {
          if (liveVideoRef.current) {
            liveVideoRef.current.srcObject = stream;
            liveVideoRef.current.play().catch(() => { /* autoplay pode falhar; user-gesture já feito */ });
          }
        });
      }

      recorder.start();
      setRecording({ kind, elapsed: 0 });
      // Tick a cada segundo pra atualizar o timer
      recTickRef.current = window.setInterval(() => {
        if (recRef.current) {
          setRecording({ kind, elapsed: Math.floor((Date.now() - recRef.current.startedAt) / 1000) });
        }
      }, 500);
    } catch (err) {
      console.error("[recording] getUserMedia falhou:", err);
      alert("Não consegui acessar microfone/câmera. Verifique as permissões do navegador.");
    }
  }

  function stopRecording() {
    if (!recRef.current) return;
    try { recRef.current.recorder.stop(); } catch { /* já parado */ }
    if (recTickRef.current !== null) {
      clearInterval(recTickRef.current);
      recTickRef.current = null;
    }
    recRef.current = null;
    setRecording(null);
  }

  function cancelRecording() {
    if (!recRef.current) return;
    // Detach do handler de stop pra não criar pendingMedia descartado
    recRef.current.recorder.ondataavailable = null;
    recRef.current.recorder.onstop = null;
    try { recRef.current.recorder.stop(); } catch { /* já parado */ }
    recRef.current.stream.getTracks().forEach((t) => t.stop());
    if (recTickRef.current !== null) {
      clearInterval(recTickRef.current);
      recTickRef.current = null;
    }
    recRef.current = null;
    setRecording(null);
  }

  // Cleanup quando o componente desmonta — evita vazamento de stream e timer
  useEffect(() => {
    return () => {
      if (recRef.current) {
        recRef.current.stream.getTracks().forEach((t) => t.stop());
      }
      if (recTickRef.current !== null) clearInterval(recTickRef.current);
      if (pendingMedia?.previewUrl) URL.revokeObjectURL(pendingMedia.previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function uploadPendingMedia(): Promise<{ url: string; kind: MediaKind } | null> {
    if (!pendingMedia) return null;
    setUploading(true);
    try {
      const { kind, file } = pendingMedia;
      const ext = file.name.split(".").pop()?.toLowerCase() || (kind === "image" ? "jpg" : kind === "audio" ? "webm" : "webm");
      // Subpasta por tipo deixa o bucket mais navegável; mantém o prefixo por
      // user pra facilitar policies por owner (já existentes pra imagens).
      const path = `${userEmail}/${kind}s/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage
        .from("community-uploads")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (error) {
        console.error("[upload] falha", error);
        return null;
      }
      const { data: pub } = supabase.storage.from("community-uploads").getPublicUrl(path);
      return { url: pub.publicUrl, kind };
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
    // Top movers — top 3 altas do dia (ações) via /api/acoes-movers
    try {
      const res = await fetch("/api/acoes-movers");
      if (res.ok) {
        const data = (await res.json()) as {
          stocks?: { gainers?: { symbol: string; name: string; change: number | null }[] };
        };
        setTopMovers((data.stocks?.gainers ?? []).slice(0, 3).map((m) => ({
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
    if ((!composerText.trim() && !pendingMedia) || posting) return;
    setPosting(true);
    let mediaUrl: string | null = null;
    let mediaKind: MediaKind | null = null;
    if (pendingMedia) {
      const res = await uploadPendingMedia();
      if (res) {
        mediaUrl = res.url;
        mediaKind = res.kind;
      } else {
        setPosting(false);
        alert("Não consegui subir a mídia. Tenta de novo em um instante.");
        return;
      }
    }

    // post_type segue a mídia anexa; sem mídia, é texto puro.
    const postType: PostType =
      mediaKind === "image" ? "image" :
      mediaKind === "audio" ? "audio" :
      mediaKind === "video" ? "video" :
      "text";

    const { error } = await supabase.from("community_post").insert({
      content: composerText.trim() || null,
      author_name: userName,
      author_email: userEmail,
      author_avatar: userAvatar,
      post_type: postType,
      moderation_status: "aprovado",
      images: mediaKind === "image" && mediaUrl ? [mediaUrl] : [],
      audio_url: mediaKind === "audio" ? mediaUrl : null,
      video_url: mediaKind === "video" ? mediaUrl : null,
    });
    setPosting(false);
    if (!error) {
      setComposerText("");
      clearPendingMedia();
      loadPosts();
    } else {
      console.error("[handlePost]", error);
      alert("Erro ao postar. Tenta de novo.");
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
            background: "var(--bg-card)",
            border: "1px solid var(--border-soft)",
            borderRadius: "12px", padding: "20px 16px",
            display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
          }}>
            <div style={{
              width: "56px", height: "56px", borderRadius: "50%",
              background: userAvatar
                ? `url(${userAvatar}) center/cover no-repeat`
                : "linear-gradient(135deg, var(--gold-light), var(--gold-dim))",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#0d0b07", fontSize: "20px", fontWeight: 700,
              fontFamily: "var(--font-sans)", marginBottom: "10px",
              border: "2px solid var(--border-emphasis)",
              overflow: "hidden",
            }}>
              {!userAvatar && userInitial}
            </div>
            <p style={{
              fontSize: "13px", fontWeight: 600, color: "var(--text-default)",
              fontFamily: "var(--font-sans)", marginBottom: "2px",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%",
            }}>
              {userName}
            </p>
            <p style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-sans)", marginBottom: "14px", letterSpacing: "0.04em" }}>
              Investidor
            </p>
            <button
              onClick={() => router.push("/dashboard/comunidade/rede")}
              style={{
                width: "100%",
                background: "rgba(13,11,7,0.5)",
                border: "1px solid var(--border-soft)",
                borderRadius: "8px", padding: "8px 12px",
                color: "var(--text-default)", fontSize: "11px",
                fontFamily: "var(--font-sans)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}
              className="aurum-hover-border aurum-hover-transition"
            >
              <span style={{ color: "var(--text-muted)" }}>Conexões</span>
              <span style={{ fontWeight: 700, color: "var(--text-default)" }}>{followingCount + followersCount}</span>
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
            {isAdmin(userEmail) && (
              <SidebarItem
                icon={<ShieldCheck size={13} />}
                label="Curar notícias"
                onClick={() => router.push("/dashboard/comunidade/admin")}
                accent
              />
            )}
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
            <input ref={imageInputRef} type="file" accept="image/*" onChange={handleFileChange("image")} style={{ display: "none" }} />
            <input ref={audioInputRef} type="file" accept="audio/*" onChange={handleFileChange("audio")} style={{ display: "none" }} />
            <input ref={videoInputRef} type="file" accept="video/*" onChange={handleFileChange("video")} style={{ display: "none" }} />

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

            {/* Recording overlay — mostra preview da câmera + timer durante captura */}
            {recording && (
              <div style={{
                position: "relative", marginBottom: "12px",
                borderRadius: "10px", overflow: "hidden",
                border: "1px solid rgba(248,113,113,0.3)",
                background: "rgba(248,113,113,0.04)",
                padding: recording.kind === "audio" ? "20px" : "0",
              }}>
                {recording.kind === "video" ? (
                  <video
                    ref={liveVideoRef}
                    autoPlay
                    muted
                    playsInline
                    style={{ width: "100%", maxHeight: "320px", display: "block", background: "#000" }}
                  />
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "12px 4px" }}>
                    <div style={{
                      width: "44px", height: "44px", borderRadius: "50%",
                      background: "rgba(248,113,113,0.18)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#f87171",
                    }}>
                      <Mic size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: "13px", fontWeight: 700, color: "#e8dcc0", fontFamily: "var(--font-display)", marginBottom: "2px" }}>
                        Gravando áudio…
                      </p>
                      <p style={{ fontSize: "11px", color: "#a09068", fontFamily: "var(--font-sans)" }}>
                        Toque em Parar quando terminar.
                      </p>
                    </div>
                  </div>
                )}

                {/* Timer + controles, sobrepostos no canto inferior */}
                <div style={{
                  position: recording.kind === "video" ? "absolute" : "static",
                  left: 0, right: 0, bottom: 0,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 12px",
                  background: recording.kind === "video"
                    ? "linear-gradient(180deg, transparent, rgba(0,0,0,0.65))"
                    : "transparent",
                  gap: "10px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      className="aurum-rec-dot"
                      style={{
                        width: "10px", height: "10px", borderRadius: "50%",
                        background: "#f87171",
                        boxShadow: "0 0 8px #f87171",
                      }}
                    />
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#fff", fontFamily: "var(--font-sans)", fontVariantNumeric: "tabular-nums", letterSpacing: "0.04em" }}>
                      REC · {formatElapsed(recording.elapsed)}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      onClick={cancelRecording}
                      style={{
                        background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.15)",
                        borderRadius: "6px", padding: "5px 10px", cursor: "pointer",
                        color: "#fff", fontSize: "11px", fontWeight: 600, fontFamily: "var(--font-sans)",
                        display: "inline-flex", alignItems: "center", gap: "4px",
                      }}
                    >
                      <X size={11} /> Cancelar
                    </button>
                    <button
                      onClick={stopRecording}
                      style={{
                        background: "linear-gradient(135deg, #f87171, #c54848)",
                        border: "none",
                        borderRadius: "6px", padding: "5px 12px", cursor: "pointer",
                        color: "#fff", fontSize: "11px", fontWeight: 700, fontFamily: "var(--font-sans)",
                        display: "inline-flex", alignItems: "center", gap: "4px",
                        boxShadow: "0 2px 12px rgba(248,113,113,0.4)",
                      }}
                    >
                      <Square size={10} fill="#fff" /> Parar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Preview da mídia anexa */}
            {pendingMedia && !recording && (
              <div style={{
                position: "relative", marginBottom: "12px",
                borderRadius: "10px", overflow: "hidden",
                border: "1px solid rgba(201,168,76,0.1)",
              }}>
                {pendingMedia.kind === "image" && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={pendingMedia.previewUrl} alt="" style={{ width: "100%", display: "block", maxHeight: "320px", objectFit: "cover" }} />
                )}
                {pendingMedia.kind === "video" && (
                  <video
                    src={pendingMedia.previewUrl}
                    controls
                    playsInline
                    style={{ width: "100%", display: "block", maxHeight: "360px", background: "#000" }}
                  />
                )}
                {pendingMedia.kind === "audio" && (
                  <div style={{ padding: "14px 16px", background: "#0d0a06", display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                      width: "40px", height: "40px", borderRadius: "10px",
                      background: "rgba(201,168,76,0.12)", color: "#C9A84C",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <Headphones size={18} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "12px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-sans)", marginBottom: "6px" }}>
                        {pendingMedia.recorded ? "Áudio gravado" : pendingMedia.file.name}
                      </p>
                      <audio src={pendingMedia.previewUrl} controls style={{ width: "100%", height: "32px" }} />
                    </div>
                  </div>
                )}
                <button
                  onClick={clearPendingMedia}
                  aria-label="Remover mídia"
                  style={{
                    position: "absolute", top: "8px", right: "8px",
                    width: "30px", height: "30px", borderRadius: "50%",
                    background: "rgba(0,0,0,0.75)", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer",
                    color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                    zIndex: 2,
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              paddingTop: "10px", borderTop: "1px solid rgba(201,168,76,0.06)",
              gap: "8px", flexWrap: "wrap",
            }}>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                <ComposerIconBtn
                  icon={<ImageIcon size={14} />}
                  label="Imagem"
                  active={pendingMedia?.kind === "image"}
                  disabled={!!recording}
                  onClick={() => imageInputRef.current?.click()}
                />
                <ComposerIconBtn
                  icon={<Film size={14} />}
                  label="Vídeo"
                  active={pendingMedia?.kind === "video"}
                  disabled={!!recording}
                  onClick={() => videoInputRef.current?.click()}
                />
                <ComposerIconBtn
                  icon={<Headphones size={14} />}
                  label="Áudio"
                  active={pendingMedia?.kind === "audio"}
                  disabled={!!recording}
                  onClick={() => audioInputRef.current?.click()}
                />
                <span style={{ width: "1px", background: "rgba(201,168,76,0.1)", margin: "2px 4px" }} />
                <ComposerIconBtn
                  icon={<Mic size={14} />}
                  label="Gravar áudio"
                  active={recording?.kind === "audio"}
                  disabled={!!recording && recording.kind !== "audio"}
                  onClick={() => startRecording("audio")}
                  tone={recording?.kind === "audio" ? "danger" : undefined}
                />
                <ComposerIconBtn
                  icon={<Video size={14} />}
                  label="Gravar vídeo"
                  active={recording?.kind === "video"}
                  disabled={!!recording && recording.kind !== "video"}
                  onClick={() => startRecording("video")}
                  tone={recording?.kind === "video" ? "danger" : undefined}
                />
              </div>
              <button
                onClick={handlePost}
                disabled={(!composerText.trim() && !pendingMedia) || posting || uploading || !!recording}
                style={{
                  background: (composerText.trim() || pendingMedia) && !posting && !uploading && !recording
                    ? "linear-gradient(135deg, var(--gold-light), var(--gold), var(--gold-dim))"
                    : "rgba(201,168,76,0.2)",
                  border: "none", borderRadius: "8px",
                  padding: "8px 18px",
                  color: (composerText.trim() || pendingMedia) && !posting && !uploading && !recording ? "#0d0b07" : "var(--text-faint)",
                  fontSize: "12px", fontWeight: 700,
                  fontFamily: "var(--font-sans)",
                  cursor: (composerText.trim() || pendingMedia) && !posting && !uploading && !recording ? "pointer" : "not-allowed",
                  letterSpacing: "0.04em",
                  boxShadow: (composerText.trim() || pendingMedia) && !posting && !uploading && !recording ? "0 2px 12px rgba(201,168,76,0.3)" : "none",
                  transition: "box-shadow 0.15s",
                }}
              >
                {uploading ? "Subindo..." : posting ? "Postando..." : "Postar"}
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
            busca ? (
              <EmptyState
                icon={Search}
                title="Nenhum post para essa busca"
                description={`Não achei nada que combine com "${busca}". Tenta outra palavra, um ticker, ou um nome de autor.`}
              />
            ) : (
              <EmptyState
                icon={MessageCircle}
                eyebrow="Comunidade"
                title="Ainda não há posts no feed"
                description="Compartilhe um pensamento sobre investimentos, uma análise de empresa, ou uma dúvida. A comunidade do Aurum prefere análise calma a hot take — sua perspectiva importa."
                action={{
                  label: "Escrever o primeiro post",
                  onClick: () => {
                    const composer = document.querySelector<HTMLTextAreaElement>("textarea");
                    composer?.focus();
                  },
                }}
              />
            )
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
          </div>
          <p style={{ fontSize: "11px", color: "#9a8a6a", fontFamily: "var(--font-sans)" }}>
            {formatRelativeTime(main.created_at)}
          </p>
        </div>
        {isNews && (
          <span style={{
            fontSize: "9px", fontWeight: 700, color: "var(--gold)",
            background: "rgba(201,168,76,0.1)",
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
          border: "1px solid var(--border-soft)",
          borderRadius: "10px", padding: "12px 14px", marginBottom: "10px",
        }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-default)", fontFamily: "var(--font-sans)", marginBottom: "4px", lineHeight: 1.4 }}>
            {main.news_title}
          </p>
          {main.news_url && (
            <a
              href={main.news_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: "4px",
                fontSize: "11px", color: "var(--gold)",
                fontFamily: "var(--font-sans)", textDecoration: "none",
                marginTop: "6px",
              }}
              className="aurum-hover-gold aurum-hover-transition"
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

      {/* Media (image / audio / video) */}
      <PostMedia post={main} variant="main" />


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
          icon={<Heart size={13} fill={liked ? "#f87171" : "none"} />}
          count={main.likes_count}
          active={liked}
          activeColor="#f87171"
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
            activeColor="#34d399"
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
                    ? "linear-gradient(135deg, var(--gold-light), var(--gold-dim))"
                    : "rgba(201,168,76,0.2)",
                  border: "none", borderRadius: "50%",
                  width: "28px", height: "28px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: commentDraft.trim() ? "#0d0b07" : "var(--text-faint)",
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
      className="aurum-hover-bg aurum-hover-gold aurum-hover-transition"
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: "8px",
        padding: "8px 10px", borderRadius: "6px",
        background: "transparent", border: "none", cursor: "pointer",
        color: "var(--text-body)", fontSize: "12px",
        fontFamily: "var(--font-sans)", textAlign: "left",
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
      <PostMedia post={post} variant="embed" />
    </div>
  );
}

// ─── PostMedia ───────────────────────────────────────────────────────────────
// Renderiza a midia do post (imagem, audio ou video) de forma consistente,
// tanto no card principal quanto no embed de repost. Quando o post nao tem
// midia, renderiza nada.

function PostMedia({ post, variant }: { post: CommunityPost; variant: "main" | "embed" }) {
  const hasImage = post.images && post.images.length > 0;
  const hasVideo = !!post.video_url;
  const hasAudio = !!post.audio_url;
  if (!hasImage && !hasVideo && !hasAudio) return null;

  const isMain = variant === "main";
  const wrap: React.CSSProperties = {
    marginTop: isMain ? 0 : "8px",
    marginBottom: isMain ? "12px" : 0,
    borderRadius: isMain ? "10px" : "8px",
    overflow: "hidden",
    border: "1px solid rgba(201,168,76,0.08)",
  };

  if (hasVideo) {
    return (
      <div style={{ ...wrap, background: "#000" }}>
        <video
          src={post.video_url ?? undefined}
          controls
          playsInline
          preload="metadata"
          style={{ width: "100%", display: "block", maxHeight: isMain ? "560px" : "320px" }}
        />
      </div>
    );
  }
  if (hasAudio) {
    return (
      <div style={{ ...wrap, padding: "12px 14px", background: "#0d0a06", display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{
          width: "34px", height: "34px", borderRadius: "9px",
          background: "rgba(201,168,76,0.12)", color: "#C9A84C",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <Headphones size={15} />
        </div>
        <audio
          src={post.audio_url ?? undefined}
          controls
          preload="metadata"
          style={{ flex: 1, height: "32px" }}
        />
      </div>
    );
  }
  return (
    <div style={wrap}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={(post.images as string[])[0]} alt="" style={{ width: "100%", display: "block" }} />
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
                ? "linear-gradient(135deg, var(--gold-light), var(--gold), var(--gold-dim))"
                : "rgba(201,168,76,0.2)",
              border: "none", borderRadius: "8px",
              padding: "9px 18px",
              color: canSubmit ? "#0d0b07" : "var(--text-faint)",
              fontSize: "12px", fontWeight: 700,
              fontFamily: "var(--font-sans)",
              cursor: canSubmit ? "pointer" : "not-allowed",
              boxShadow: canSubmit ? "0 2px 12px rgba(201,168,76,0.3)" : "none",
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
                    borderColor: ativo ? "var(--border-strong)" : "var(--border-soft)",
                    background: ativo ? "rgba(201,168,76,0.08)" : "#0d0b07",
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
                  {ativo && <span style={{ color: "var(--gold)", fontSize: "14px" }}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tip */}
        <div style={{
          background: "rgba(201,168,76,0.05)",
          border: "1px solid var(--border-soft)",
          borderRadius: "8px", padding: "10px 12px",
          fontSize: "11px", color: "var(--text-muted)",
          fontFamily: "var(--font-sans)", lineHeight: 1.5,
          marginBottom: "20px",
        }}>
          💡 <strong style={{ color: "var(--text-default)" }}>Dica:</strong> Suas preferências ajudam a IA a sugerir conteúdo mais relevante para você. Você também pode seguir usuários específicos para ver seus posts no topo do feed.
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
              background: "linear-gradient(135deg, var(--gold-light), var(--gold), var(--gold-dim))",
              border: "none", borderRadius: "8px",
              padding: "9px 18px", color: "#0d0b07",
              fontSize: "12px", fontWeight: 700,
              fontFamily: "var(--font-sans)", cursor: "pointer",
              boxShadow: "0 2px 12px rgba(201,168,76,0.3)",
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
        : "linear-gradient(135deg, var(--gold-light), var(--gold-dim))",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#0d0b07", fontSize: `${Math.round(size * 0.4)}px`, fontWeight: 700,
      fontFamily: "var(--font-sans)", flexShrink: 0,
      overflow: "hidden",
    }}>
      {!url && initial}
    </div>
  );
}

function SidebarItem({ icon, label, onClick, accent }: { icon: React.ReactNode; label: string; onClick: () => void; accent?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: "10px",
        padding: "8px 10px", borderRadius: "6px",
        background: accent ? "rgba(201,168,76,0.06)" : "transparent",
        border: accent ? "1px solid rgba(201,168,76,0.18)" : "none",
        cursor: "pointer",
        color: accent ? "var(--gold)" : "#9a8a6a",
        fontSize: "12px", fontWeight: accent ? 600 : 400,
        fontFamily: "var(--font-sans)",
        textAlign: "left", transition: "all 0.15s",
      }}
      className="aurum-hover-gold aurum-hover-bg aurum-hover-transition"
    >
      {icon} {label}
    </button>
  );
}

function ComposerIconBtn({
  icon, label, onClick, active, disabled, tone,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  tone?: "danger";
}) {
  // tone="danger" sinaliza estados destrutivos/críticos (ex: gravação em curso)
  const dangerActive = tone === "danger" && active;
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={!active && !disabled ? "aurum-hover-gold aurum-hover-border aurum-hover-transition" : undefined}
      style={{
        display: "flex", alignItems: "center", gap: "5px",
        padding: "5px 10px", borderRadius: "6px",
        background: dangerActive
          ? "rgba(248,113,113,0.12)"
          : active
            ? "rgba(201,168,76,0.12)"
            : "transparent",
        border: `1px solid ${dangerActive ? "rgba(248,113,113,0.4)" : active ? "rgba(201,168,76,0.4)" : "var(--border-soft)"}`,
        color: dangerActive ? "#f87171" : active ? "var(--gold)" : "var(--text-muted)",
        fontSize: "11px", fontWeight: active ? 600 : 500,
        fontFamily: "var(--font-sans)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "all 0.15s",
      }}
    >
      {icon} {label}
    </button>
  );
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
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
      className={onClick && !active ? "aurum-hover-gold aurum-hover-transition" : undefined}
      style={{
        display: "flex", alignItems: "center", gap: "5px",
        background: "transparent", border: "none",
        cursor: onClick ? "pointer" : "default",
        color: active && activeColor ? activeColor : "var(--text-muted)",
        fontSize: "12px", fontFamily: "var(--font-sans)",
        padding: "4px 6px", borderRadius: "4px",
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
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <span style={{
        fontSize: "11px", fontWeight: 700, color: "var(--gold)",
        fontFamily: "var(--font-sans)", width: "18px", textAlign: "center",
        flexShrink: 0,
      }}>
        {rank}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: "12px", color: "var(--text-default)", fontFamily: "var(--font-sans)", marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {name}
        </p>
        <p style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>
          {points.toLocaleString("pt-BR")} interações
        </p>
      </div>
    </div>
  );
}
