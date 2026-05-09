"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Camera, Pencil, Bookmark, Users, Activity, BarChart2,
  MessageSquare, Star,
  FolderOpen, Briefcase, BookOpen, Newspaper, MessageCircle, Heart,
  Repeat2, Share2, Link2, Trophy, GraduationCap, Calendar, Check,
  Crown, ExternalLink, Plus,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ProfileBundle } from "./load";
import { toast } from "sonner";

interface Props {
  mode: "self" | "public";
  currentUserEmail: string;
  currentUserName: string;
  bundle: ProfileBundle;
}

type TopTab = "geral" | "salvos" | "grupos" | "atividade";
type EngTab = "geral" | "topposts";
type ConquistaTab = "conquistas" | "certificados";

function pluralize(n: number, sing: string, plural: string) {
  return `${n} ${n === 1 ? sing : plural}`;
}

function memberSince(date: string | null): string {
  if (!date) return "—";
  const d = new Date(date);
  const fmt = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return fmt.charAt(0).toUpperCase() + fmt.slice(1);
}


export default function ProfileContent({ mode, currentUserEmail, currentUserName, bundle }: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const isSelf = mode === "self";
  const profile = bundle.profile!;

  const [topTab, setTopTab] = useState<TopTab>("geral");
  const [engTab, setEngTab] = useState<EngTab>("geral");
  const [conqTab, setConqTab] = useState<ConquistaTab>("conquistas");
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [name, setName] = useState(profile.user_name);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [following, setFollowing] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [activityPosts, setActivityPosts] = useState<{ id: string; content: string | null; created_at: string; likes_count: number; comments_count: number; reposts_count: number }[]>([]);
  const [activityLoaded, setActivityLoaded] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const initial = (profile.user_name || profile.user_email).charAt(0).toUpperCase();
  const profileUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/dashboard/perfil/${encodeURIComponent(profile.username)}`
      : `/dashboard/perfil/${encodeURIComponent(profile.username)}`;

  // Check follow status (public mode only)
  useEffect(() => {
    if (mode !== "public") return;
    let cancelled = false;
    (async () => {
      const { count } = await supabase
        .from("user_follow")
        .select("id", { count: "exact", head: true })
        .eq("follower_email", currentUserEmail)
        .eq("following_email", profile.user_email);
      if (!cancelled) setFollowing((count ?? 0) > 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, supabase, currentUserEmail, profile.user_email]);

  async function handleAvatarUpload(file: File) {
    setUploadingAvatar(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${currentUserEmail}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("profile-uploads").upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });
    if (upErr) {
      console.error("[avatar-upload]", upErr);
      toast.error("Não consegui enviar a foto.", {
        description: "Pode ser tamanho ou formato. Tenta de novo?",
      });
    } else {
      const { data: pub } = supabase.storage.from("profile-uploads").getPublicUrl(path);
      const { error: dbErr } = await supabase
        .from("user_profile")
        .update({ avatar_url: pub.publicUrl })
        .eq("user_email", currentUserEmail);
      if (dbErr) {
        console.error("[avatar-update]", dbErr);
        toast.error("Foto enviada, mas não consegui salvar no perfil.", {
          description: "Tenta de novo em um instante.",
        });
      } else {
        toast.success("Foto de perfil atualizada.");
        router.refresh();
      }
    }
    setUploadingAvatar(false);
  }

  async function handleBannerUpload(file: File) {
    setUploadingBanner(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${currentUserEmail}/banner-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("profile-uploads").upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });
    if (upErr) {
      console.error("[banner-upload]", upErr);
      toast.error("Não consegui enviar a capa.", {
        description: "Pode ser tamanho ou formato. Tenta de novo?",
      });
    } else {
      const { data: pub } = supabase.storage.from("profile-uploads").getPublicUrl(path);
      const { error: dbErr } = await supabase
        .from("user_profile")
        .update({ banner_url: pub.publicUrl })
        .eq("user_email", currentUserEmail);
      if (dbErr) {
        console.error("[banner-update]", dbErr);
        toast.error("Capa enviada, mas não consegui salvar no perfil.", {
          description: "Tenta de novo em um instante.",
        });
      } else {
        toast.success("Capa atualizada.");
        router.refresh();
      }
    }
    setUploadingBanner(false);
  }

  async function saveProfileFields() {
    setSavingProfile(true);
    const trimmedName = name.trim() || profile.user_name;
    await supabase
      .from("user_profile")
      .update({ user_name: trimmedName, bio: bio.trim() || null })
      .eq("user_email", currentUserEmail);
    setSavingProfile(false);
    setEditing(false);
    router.refresh();
  }

  async function toggleFollow() {
    if (mode !== "public") return;
    if (following) {
      setFollowing(false);
      await supabase
        .from("user_follow")
        .delete()
        .eq("follower_email", currentUserEmail)
        .eq("following_email", profile.user_email);
    } else {
      setFollowing(true);
      await supabase.from("user_follow").insert({
        follower_email: currentUserEmail,
        follower_name: currentUserName,
        following_email: profile.user_email,
        following_name: profile.user_name,
      });
    }
    router.refresh();
  }

  function copyProfileLink() {
    if (typeof navigator === "undefined") return;
    navigator.clipboard.writeText(profileUrl).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  }

  async function loadActivity() {
    if (activityLoaded) return;
    setActivityLoaded(true);
    const { data } = await supabase
      .from("community_post")
      .select("id, content, created_at, likes_count, comments_count, reposts_count")
      .eq("author_email", profile.user_email)
      .eq("moderation_status", "aprovado")
      .order("created_at", { ascending: false })
      .limit(20);
    setActivityPosts((data ?? []) as typeof activityPosts);
  }

  useEffect(() => {
    if (topTab === "atividade") loadActivity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topTab]);

  const totalEngagementCount =
    bundle.engagement.likes + bundle.engagement.comments + bundle.engagement.reposts;

  return (
    <div style={{ minHeight: "calc(100vh - 58px)", background: "#0a0806", paddingBottom: "64px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "20px 24px 0" }}>
        {/* ─── HERO ─────────────────────────────────────────────────────────── */}
        <div
          style={{
            position: "relative",
            background: "#130f09",
            border: "1px solid rgba(201,168,76,0.1)",
            borderRadius: "14px",
            overflow: "hidden",
          }}
        >
          {/* Banner */}
          <div
            style={{
              position: "relative",
              height: "180px",
              background: profile.banner_url
                ? `url(${profile.banner_url}) center/cover no-repeat`
                : "linear-gradient(135deg, #2a1f12 0%, #3d2c18 50%, #1a1410 100%)",
            }}
          >
            {/* Top-right buttons */}
            <div
              style={{
                position: "absolute",
                top: "14px",
                right: "14px",
                display: "flex",
                gap: "8px",
              }}
            >
              {isSelf && (
                <>
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleBannerUpload(f);
                    }}
                  />
                  <HeaderBtn
                    icon={<Camera size={13} />}
                    label={uploadingBanner ? "Enviando..." : "Capa"}
                    onClick={() => bannerInputRef.current?.click()}
                    disabled={uploadingBanner}
                  />
                  <HeaderBtn
                    icon={<Pencil size={13} />}
                    label={editing ? "Cancelar" : "Editar Perfil"}
                    onClick={() => setEditing((v) => !v)}
                  />
                </>
              )}
              {!isSelf && (
                <>
                  <HeaderBtn
                    icon={following ? <Check size={13} /> : <Plus size={13} />}
                    label={following ? "Seguindo" : "Seguir"}
                    onClick={toggleFollow}
                    primary={!following}
                  />
                  <HeaderBtn
                    icon={<MessageSquare size={13} />}
                    label="Mensagem"
                    onClick={() => router.push(`/dashboard/comunidade/mensagens?to=${encodeURIComponent(profile.username)}`)}
                  />
                </>
              )}
            </div>
          </div>

          {/* Profile row */}
          <div style={{ padding: "0 24px 24px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "18px", flexWrap: "wrap" }}>
              {/* Avatar — só ele sobe sobre o banner; o texto fica abaixo */}
              <div style={{ position: "relative", flexShrink: 0, marginTop: "-44px" }}>
                <div
                  style={{
                    width: "92px",
                    height: "92px",
                    borderRadius: "50%",
                    border: "4px solid #130f09",
                    background: profile.avatar_url
                      ? `url(${profile.avatar_url}) center/cover no-repeat`
                      : "linear-gradient(135deg, #C9A84C, #8B6914)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: "32px",
                    fontWeight: 700,
                    fontFamily: "var(--font-sans)",
                    overflow: "hidden",
                  }}
                >
                  {!profile.avatar_url && initial}
                </div>
                {isSelf && (
                  <>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleAvatarUpload(f);
                      }}
                    />
                    <button
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      aria-label="Trocar foto de perfil"
                      style={{
                        position: "absolute",
                        bottom: "0",
                        right: "0",
                        width: "30px",
                        height: "30px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #C9A84C, #A07820)",
                        border: "3px solid #130f09",
                        cursor: uploadingAvatar ? "wait" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#0d0b07",
                      }}
                    >
                      <Camera size={13} />
                    </button>
                  </>
                )}
              </div>

              {/* Info */}
              <div style={{ paddingTop: "12px", flex: 1, minWidth: 0 }}>
                {editing ? (
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                      width: "100%",
                      maxWidth: "420px",
                      background: "#0d0b07",
                      border: "1px solid rgba(201,168,76,0.2)",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      color: "#e8dcc0",
                      fontSize: "20px",
                      fontWeight: 700,
                      fontFamily: "var(--font-display)",
                      outline: "none",
                      marginBottom: "6px",
                    }}
                  />
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "4px" }}>
                    <h1
                      style={{
                        fontSize: "22px",
                        fontWeight: 700,
                        color: "#e8dcc0",
                        fontFamily: "var(--font-display)",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {profile.user_name}
                    </h1>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "#C9A84C",
                        background: "rgba(201,168,76,0.1)",
                        border: "1px solid rgba(201,168,76,0.25)",
                        padding: "2px 8px",
                        borderRadius: "12px",
                        letterSpacing: "0.06em",
                        fontFamily: "var(--font-sans)",
                      }}
                    >
                      <Crown size={9} fill="#C9A84C" /> PREMIUM
                    </span>
                  </div>
                )}

                {editing ? (
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={2}
                    placeholder="Escreva uma bio curta..."
                    style={{
                      width: "100%",
                      maxWidth: "560px",
                      background: "#0d0b07",
                      border: "1px solid rgba(201,168,76,0.2)",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      color: "#c8b89a",
                      fontSize: "13px",
                      fontFamily: "var(--font-sans)",
                      outline: "none",
                      resize: "none",
                      marginBottom: "8px",
                    }}
                  />
                ) : profile.bio ? (
                  <p style={{ fontSize: "13px", color: "#9a8a6a", fontFamily: "var(--font-sans)", lineHeight: 1.5, marginBottom: "8px", maxWidth: "560px" }}>
                    {profile.bio}
                  </p>
                ) : null}

                <div style={{ display: "flex", flexWrap: "wrap", gap: "16px 18px", fontSize: "12px", color: "#a09068", fontFamily: "var(--font-sans)" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                    <span style={{ color: "#9a8a6a" }}>{isSelf ? "✉" : "@"}</span>
                    {isSelf ? profile.user_email : profile.username}
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                    <Calendar size={11} />
                    Membro desde {memberSince(profile.joined_date ?? profile.created_at)}
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                    <Users size={11} />
                    {pluralize(profile.following_count ?? 0, "seguindo", "seguindo")}
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                    <Users size={11} />
                    {pluralize(profile.followers_count ?? 0, "seguidor", "seguidores")}
                  </span>
                </div>

                {editing && (
                  <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                    <button
                      onClick={saveProfileFields}
                      disabled={savingProfile}
                      style={{
                        background: "linear-gradient(135deg, #C9A84C, #A07820)",
                        border: "none",
                        borderRadius: "8px",
                        padding: "8px 18px",
                        color: "#0d0b07",
                        fontSize: "12px",
                        fontWeight: 600,
                        fontFamily: "var(--font-sans)",
                        cursor: "pointer",
                      }}
                    >
                      {savingProfile ? "Salvando..." : "Salvar"}
                    </button>
                    <button
                      onClick={() => { setEditing(false); setName(profile.user_name); setBio(profile.bio ?? ""); }}
                      style={{
                        background: "transparent",
                        border: "1px solid rgba(201,168,76,0.2)",
                        borderRadius: "8px",
                        padding: "8px 18px",
                        color: "#9a8a6a",
                        fontSize: "12px",
                        fontFamily: "var(--font-sans)",
                        cursor: "pointer",
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ─── TOP TABS ─────────────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            gap: "2px",
            background: "#130f09",
            border: "1px solid rgba(201,168,76,0.1)",
            borderRadius: "10px",
            padding: "4px",
            marginTop: "16px",
          }}
        >
          {([
            { id: "geral", label: "Visão Geral", icon: BarChart2 },
            ...(isSelf ? [{ id: "salvos", label: "Salvos", icon: Bookmark }] : []),
            { id: "grupos", label: "Grupos", icon: Users },
            { id: "atividade", label: "Atividade", icon: Activity },
          ] as { id: TopTab; label: string; icon: typeof BarChart2 }[]).map(({ id, label, icon: Icon }) => {
            const active = topTab === id;
            return (
              <button
                key={id}
                onClick={() => setTopTab(id)}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "9px 12px",
                  border: "none",
                  borderRadius: "7px",
                  background: active ? "rgba(201,168,76,0.1)" : "transparent",
                  color: active ? "#C9A84C" : "#a09068",
                  fontSize: "12px",
                  fontWeight: active ? 600 : 500,
                  fontFamily: "var(--font-sans)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <Icon size={13} />
                {label}
              </button>
            );
          })}
        </div>

        {/* ─── TAB CONTENT ──────────────────────────────────────────────────── */}
        {topTab === "geral" && (
          <>
            {/* Posts Destacados */}
            <Card style={{ marginTop: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <CardHeader title="Posts Destacados" icon={<Star size={14} fill="#C9A84C" />} subtitle={isSelf ? "Seus melhores posts no topo do perfil" : "Posts em destaque"} />
                </div>
                {isSelf && (
                  <PrimaryBtn icon={<Plus size={12} />} label="Destacar Post" onClick={() => router.push("/dashboard/comunidade")} />
                )}
              </div>
              {bundle.featured.length === 0 ? (
                <EmptyState text={isSelf ? "Nenhum post destacado ainda" : "Sem posts destacados"} />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
                  {bundle.featured.map((f) => (
                    <div key={f.id} style={{ background: "#0d0b07", border: "1px solid rgba(201,168,76,0.08)", borderRadius: "8px", padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "12px", color: "#c8b89a", fontFamily: "var(--font-sans)" }}>
                        Post #{f.post_id.slice(0, 8)}
                      </span>
                      <ExternalLink size={12} style={{ color: "#a09068" }} />
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Minhas Coleções */}
            <Card style={{ marginTop: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <CardHeader title={isSelf ? "Minhas Coleções" : "Coleções"} icon={<FolderOpen size={14} style={{ color: "#C9A84C" }} />} subtitle="Organize seus posts em coleções temáticas" />
                {isSelf && <PrimaryBtn icon={<Plus size={12} />} label="Nova Coleção" onClick={() => alert("Em breve")} />}
              </div>
              {bundle.collections.length === 0 ? (
                <EmptyState text="Nenhuma coleção criada ainda" />
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "10px", marginTop: "12px" }}>
                  {bundle.collections.map((c) => (
                    <div key={c.id} style={{ background: "#0d0b07", border: "1px solid rgba(201,168,76,0.08)", borderRadius: "8px", padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <FolderOpen size={13} style={{ color: c.color ?? "#C9A84C" }} />
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-sans)" }}>{c.name}</span>
                      </div>
                      {c.description && (
                        <p style={{ fontSize: "11px", color: "#a09068", fontFamily: "var(--font-sans)", marginBottom: "6px" }}>{c.description}</p>
                      )}
                      <span style={{ fontSize: "10px", color: "#9a8a6a", fontFamily: "var(--font-sans)" }}>
                        {(c.post_ids ?? []).length} {(c.post_ids ?? []).length === 1 ? "post" : "posts"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Portfolio + Share */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
              <Card>
                <CardHeader title="Portfólio & Conquistas" icon={<Briefcase size={14} style={{ color: "#C9A84C" }} />} />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginTop: "10px" }}>
                  <StatCell icon={<Star size={12} />} label="Pontos" value={bundle.points.total_points} />
                  <StatCell icon={<Trophy size={12} />} label="Badges" value={bundle.achievements.length} />
                  <StatCell icon={<GraduationCap size={12} />} label="Cursos" value={bundle.points.courses_completed} />
                  <StatCell icon={<MessageCircle size={12} />} label="Posts" value={bundle.engagement.posts} />
                </div>
                {bundle.achievements.length > 0 && (
                  <div style={{ marginTop: "14px" }}>
                    <p style={{ fontSize: "11px", color: "#a09068", fontFamily: "var(--font-sans)", marginBottom: "8px", letterSpacing: "0.04em" }}>
                      Conquistas Recentes
                    </p>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {bundle.achievements.slice(0, 4).map((a) => (
                        <span key={a.id} style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "10px", fontWeight: 600, color: a.badge_color ?? "#C9A84C", background: "rgba(201,168,76,0.08)", padding: "4px 8px", borderRadius: "5px", fontFamily: "var(--font-sans)" }}>
                          <Trophy size={9} />
                          {a.badge_name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
              <Card>
                <CardHeader title="Compartilhar Perfil" icon={<Share2 size={14} style={{ color: "#C9A84C" }} />} />
                <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#0d0b07", border: "1px solid rgba(201,168,76,0.1)", borderRadius: "8px", padding: "8px 12px", marginTop: "8px", marginBottom: "10px" }}>
                  <Link2 size={11} style={{ color: "#a09068", flexShrink: 0 }} />
                  <span style={{ fontSize: "11px", color: "#9a8a6a", fontFamily: "var(--font-sans)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                    {profileUrl}
                  </span>
                  <button
                    onClick={copyProfileLink}
                    aria-label="Copiar link"
                    style={{ background: "transparent", border: "none", cursor: "pointer", color: linkCopied ? "#10b981" : "#C9A84C", padding: "2px", display: "flex", alignItems: "center" }}
                  >
                    {linkCopied ? <Check size={13} /> : <ExternalLink size={13} />}
                  </button>
                </div>
                <p style={{ fontSize: "11px", color: "#a09068", fontFamily: "var(--font-sans)", marginBottom: "8px" }}>Compartilhe seu perfil em redes sociais:</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                  <SocialBtn label="Facebook" color="#1877f2" url={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`} />
                  <SocialBtn label="Twitter" color="#1da1f2" url={`https://twitter.com/intent/tweet?url=${encodeURIComponent(profileUrl)}`} />
                  <SocialBtn label="LinkedIn" color="#0077b5" url={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`} />
                  <SocialBtn label="WhatsApp" color="#25d366" url={`https://wa.me/?text=${encodeURIComponent(profileUrl)}`} />
                </div>
              </Card>
            </div>

            {/* Engagement metrics */}
            <Card style={{ marginTop: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <CardHeader title="Métricas de Engajamento" icon={<BarChart2 size={14} style={{ color: "#C9A84C" }} />} />
                <div style={{ display: "flex", gap: "2px", background: "#0d0b07", border: "1px solid rgba(201,168,76,0.1)", borderRadius: "7px", padding: "3px" }}>
                  {(["geral", "topposts"] as EngTab[]).map((id) => (
                    <button
                      key={id}
                      onClick={() => setEngTab(id)}
                      style={{
                        padding: "5px 12px",
                        border: "none",
                        borderRadius: "5px",
                        background: engTab === id ? "rgba(201,168,76,0.1)" : "transparent",
                        color: engTab === id ? "#C9A84C" : "#a09068",
                        fontSize: "11px",
                        fontWeight: engTab === id ? 600 : 500,
                        fontFamily: "var(--font-sans)",
                        cursor: "pointer",
                      }}
                    >
                      {id === "geral" ? "Visão Geral" : "Top Posts"}
                    </button>
                  ))}
                </div>
              </div>

              {engTab === "geral" ? (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px", marginBottom: "8px" }}>
                    <MetricCell icon={<MessageCircle size={12} />} label="Posts" value={bundle.engagement.posts} color="#5E6B8C" />
                    <MetricCell icon={<Heart size={12} />} label="Curtidas" value={bundle.engagement.likes} color="#A4485E" />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
                    <MetricCell icon={<MessageCircle size={12} />} label="Comentários" value={bundle.engagement.comments} color="#4F8A82" />
                    <MetricCell icon={<Repeat2 size={12} />} label="Compartilhamentos" value={bundle.engagement.reposts} color="#6E8C4A" />
                  </div>
                </>
              ) : (
                <EmptyState text={bundle.engagement.posts === 0 ? "Sem posts ainda" : "Top posts em breve"} />
              )}
            </Card>

            {/* Conquistas + Certificados */}
            <Card style={{ marginTop: "16px" }}>
              <div style={{ display: "flex", gap: "2px", background: "#0d0b07", border: "1px solid rgba(201,168,76,0.1)", borderRadius: "8px", padding: "4px" }}>
                {(["conquistas", "certificados"] as ConquistaTab[]).map((id) => (
                  <button
                    key={id}
                    onClick={() => setConqTab(id)}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      padding: "9px 12px",
                      border: "none",
                      borderRadius: "6px",
                      background: conqTab === id ? "linear-gradient(135deg, #2a1f3e, #1a1410)" : "transparent",
                      color: conqTab === id ? "#e8dcc0" : "#a09068",
                      fontSize: "12px",
                      fontWeight: conqTab === id ? 600 : 500,
                      fontFamily: "var(--font-sans)",
                      cursor: "pointer",
                    }}
                  >
                    {id === "conquistas" ? <Trophy size={13} /> : <GraduationCap size={13} />}
                    {id === "conquistas" ? "Conquistas" : "Certificados"}
                  </button>
                ))}
              </div>

              <div style={{ marginTop: "16px" }}>
                {conqTab === "conquistas" ? (
                  bundle.achievements.length === 0 ? (
                    <EmptyState text="Nenhuma conquista desbloqueada ainda" />
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "10px" }}>
                      {bundle.achievements.map((a) => (
                        <div key={a.id} style={{ background: "#0d0b07", border: "1px solid rgba(201,168,76,0.08)", borderRadius: "8px", padding: "12px 14px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
                          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: a.badge_color ?? "rgba(201,168,76,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Trophy size={15} style={{ color: "#fff" }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: "12px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-sans)", marginBottom: "2px" }}>
                              {a.badge_name}
                            </p>
                            {a.badge_description && (
                              <p style={{ fontSize: "10px", color: "#a09068", fontFamily: "var(--font-sans)" }}>
                                {a.badge_description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : bundle.certificates.length === 0 ? (
                  <EmptyState text="Nenhum certificado emitido ainda" />
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {bundle.certificates.map((c) => (
                      <div key={c.id} style={{ background: "#0d0b07", border: "1px solid rgba(201,168,76,0.08)", borderRadius: "8px", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <p style={{ fontSize: "13px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-sans)", marginBottom: "2px" }}>
                            {c.course_title}
                          </p>
                          <p style={{ fontSize: "11px", color: "#a09068", fontFamily: "var(--font-sans)" }}>
                            {new Date(c.completion_date).toLocaleDateString("pt-BR")} · #{c.certificate_number}
                          </p>
                        </div>
                        {c.final_score != null && (
                          <span style={{ fontSize: "12px", fontWeight: 700, color: "#10b981", fontFamily: "var(--font-sans)" }}>
                            {c.final_score.toFixed(0)}%
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

          </>
        )}

        {topTab === "salvos" && isSelf && <SavedTab supabase={supabase} email={currentUserEmail} />}

        {topTab === "grupos" && (
          <Card style={{ marginTop: "16px" }}>
            <CardHeader title="Grupos" icon={<Users size={14} style={{ color: "#C9A84C" }} />} />
            <EmptyState text="Funcionalidade de grupos em breve" />
          </Card>
        )}

        {topTab === "atividade" && (
          <Card style={{ marginTop: "16px" }}>
            <CardHeader title="Atividade" icon={<Activity size={14} style={{ color: "#C9A84C" }} />} subtitle="Posts mais recentes" />
            {!activityLoaded ? (
              <EmptyState text="Carregando..." />
            ) : activityPosts.length === 0 ? (
              <EmptyState text="Nenhum post ainda" />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
                {activityPosts.map((p) => (
                  <div key={p.id} style={{ background: "#0d0b07", border: "1px solid rgba(201,168,76,0.08)", borderRadius: "8px", padding: "12px 14px" }}>
                    <p style={{ fontSize: "12px", color: "#c8b89a", fontFamily: "var(--font-sans)", lineHeight: 1.5, marginBottom: "8px", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                      {p.content || "(sem texto)"}
                    </p>
                    <div style={{ display: "flex", gap: "14px", fontSize: "11px", color: "#a09068", fontFamily: "var(--font-sans)" }}>
                      <span>{new Date(p.created_at).toLocaleDateString("pt-BR")}</span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}><Heart size={10} /> {p.likes_count}</span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}><MessageCircle size={10} /> {p.comments_count}</span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}><Repeat2 size={10} /> {p.reposts_count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

// ─── Subcomponents ───────────────────────────────────────────────────────────

function HeaderBtn({
  icon, label, onClick, primary, disabled,
}: { icon: React.ReactNode; label: string; onClick: () => void; primary?: boolean; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "7px 14px",
        borderRadius: "8px",
        border: "1px solid rgba(201,168,76,0.25)",
        background: primary
          ? "linear-gradient(135deg, #C9A84C, #A07820)"
          : "rgba(13,11,7,0.7)",
        backdropFilter: "blur(8px)",
        color: primary ? "#0d0b07" : "#e8dcc0",
        fontSize: "11px",
        fontWeight: 600,
        fontFamily: "var(--font-sans)",
        cursor: disabled ? "wait" : "pointer",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {icon} {label}
    </button>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: "#130f09",
        border: "1px solid rgba(201,168,76,0.1)",
        borderRadius: "12px",
        padding: "20px 22px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function CardHeader({
  title, icon, subtitle,
}: { title: string; icon?: React.ReactNode; subtitle?: string }) {
  return (
    <div style={{ marginBottom: "8px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {icon}
        <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}>
          {title}
        </h3>
      </div>
      {subtitle && (
        <p style={{ fontSize: "11px", color: "#a09068", fontFamily: "var(--font-sans)", marginTop: "3px" }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

function PrimaryBtn({
  icon, label, onClick,
}: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "7px 12px",
        borderRadius: "7px",
        border: "none",
        background: "linear-gradient(135deg, #C9A84C, #A07820)",
        color: "#0d0b07",
        fontSize: "11px",
        fontWeight: 600,
        fontFamily: "var(--font-sans)",
        cursor: "pointer",
        boxShadow: "0 2px 12px rgba(201,168,76,0.25)",
      }}
    >
      {icon} {label}
    </button>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <p style={{
      fontSize: "12px",
      color: "#a09068",
      fontFamily: "var(--font-sans)",
      textAlign: "center",
      padding: "24px 0",
    }}>
      {text}
    </p>
  );
}

function StatCell({
  icon, label, value,
}: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div style={{ background: "#0d0b07", border: "1px solid rgba(201,168,76,0.06)", borderRadius: "8px", padding: "10px 12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#a09068", marginBottom: "4px" }}>
        {icon}
        <span style={{ fontSize: "10px", color: "#a09068", fontFamily: "var(--font-sans)" }}>{label}</span>
      </div>
      <p style={{ fontSize: "18px", fontWeight: 700, color: "#e8dcc0", fontFamily: "var(--font-display)" }}>{value}</p>
    </div>
  );
}

function MetricCell({
  icon, label, value, color,
}: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
  return (
    <div style={{ background: "#0d0b07", border: "1px solid rgba(201,168,76,0.06)", borderRadius: "8px", padding: "10px 12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "5px", color, marginBottom: "4px" }}>
        {icon}
        <span style={{ fontSize: "10px", color: "#9a8a6a", fontFamily: "var(--font-sans)" }}>{label}</span>
      </div>
      <p style={{ fontSize: "16px", fontWeight: 700, color: "#e8dcc0", fontFamily: "var(--font-display)" }}>{value}</p>
    </div>
  );
}

function SocialBtn({ label, color, url }: { label: string; color: string; url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        padding: "8px 12px",
        borderRadius: "7px",
        background: "#0d0b07",
        border: `1px solid ${color}33`,
        color,
        fontSize: "11px",
        fontWeight: 600,
        fontFamily: "var(--font-sans)",
        textDecoration: "none",
      }}
    >
      <Share2 size={11} />
      {label}
    </a>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SavedTab({ supabase, email }: { supabase: any; email: string }) {
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState<{ id: string; post_id: string; post_type: string; saved_at: string }[]>([]);
  const [news, setNews] = useState<{ id: string; title: string; url: string | null; saved_at: string }[]>([]);

  useEffect(() => {
    (async () => {
      const [s, n] = await Promise.all([
        supabase
          .from("saved_post")
          .select("id, post_id, post_type, saved_at")
          .eq("user_email", email)
          .order("saved_at", { ascending: false }),
        supabase
          .from("saved_news")
          .select("id, title, url, saved_at")
          .eq("user_email", email)
          .order("saved_at", { ascending: false }),
      ]);
      setSaved(s.data ?? []);
      setNews(n.data ?? []);
      setLoaded(true);
    })();
  }, [supabase, email]);

  return (
    <Card style={{ marginTop: "16px" }}>
      <CardHeader title="Itens Salvos" icon={<Bookmark size={14} style={{ color: "#C9A84C" }} fill="#C9A84C" />} subtitle="Posts e notícias salvos por você" />
      {!loaded ? (
        <EmptyState text="Carregando..." />
      ) : saved.length === 0 && news.length === 0 ? (
        <EmptyState text="Nada salvo ainda" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
          {saved.map((s) => (
            <div key={s.id} style={{ background: "#0d0b07", border: "1px solid rgba(201,168,76,0.08)", borderRadius: "8px", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Bookmark size={12} style={{ color: "#C9A84C" }} fill="#C9A84C" />
                <span style={{ fontSize: "12px", color: "#c8b89a", fontFamily: "var(--font-sans)" }}>
                  Post #{s.post_id.slice(0, 8)}
                </span>
              </div>
              <span style={{ fontSize: "10px", color: "#a09068", fontFamily: "var(--font-sans)" }}>
                {new Date(s.saved_at).toLocaleDateString("pt-BR")}
              </span>
            </div>
          ))}
          {news.map((n) => (
            <div key={n.id} style={{ background: "#0d0b07", border: "1px solid rgba(201,168,76,0.08)", borderRadius: "8px", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                <Newspaper size={12} style={{ color: "#3b82f6", flexShrink: 0 }} />
                <span style={{ fontSize: "12px", color: "#c8b89a", fontFamily: "var(--font-sans)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {n.title}
                </span>
              </div>
              <span style={{ fontSize: "10px", color: "#a09068", fontFamily: "var(--font-sans)", flexShrink: 0 }}>
                {new Date(n.saved_at).toLocaleDateString("pt-BR")}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

