"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Search, MessageSquare, UserPlus, UserCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { initialFromName, conversationIdFor } from "@/lib/comunidade";

interface UsuarioRede {
  email: string;
  name: string;
  isFollowing: boolean;
  isFollower: boolean;
}

export default function RedeContent({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [following, setFollowing] = useState<{ email: string; name: string }[]>([]);
  const [followers, setFollowers] = useState<{ email: string; name: string }[]>([]);
  const [allUsers, setAllUsers] = useState<{ email: string; name: string }[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const [{ data: ing }, { data: ers }, { data: profiles }] = await Promise.all([
      supabase.from("user_follow").select("following_email, following_name").eq("follower_email", userEmail),
      supabase.from("user_follow").select("follower_email, follower_name").eq("following_email", userEmail),
      supabase.from("user_profile").select("user_email, user_name").neq("user_email", userEmail).limit(50),
    ]);
    setFollowing((ing ?? []).map((r) => ({ email: r.following_email, name: r.following_name ?? r.following_email })));
    setFollowers((ers ?? []).map((r) => ({ email: r.follower_email, name: r.follower_name ?? r.follower_email })));
    setAllUsers((profiles ?? []).map((p) => ({ email: p.user_email, name: p.user_name })));
    setLoading(false);
  }, [supabase, userEmail]);

  useEffect(() => { loadData(); }, [loadData]);

  const usuarios: UsuarioRede[] = useMemo(() => {
    const map = new Map<string, UsuarioRede>();
    for (const u of allUsers) {
      map.set(u.email, { email: u.email, name: u.name, isFollowing: false, isFollower: false });
    }
    for (const f of following) {
      const ex = map.get(f.email);
      if (ex) ex.isFollowing = true;
      else map.set(f.email, { email: f.email, name: f.name, isFollowing: true, isFollower: false });
    }
    for (const f of followers) {
      const ex = map.get(f.email);
      if (ex) ex.isFollower = true;
      else map.set(f.email, { email: f.email, name: f.name, isFollowing: false, isFollower: true });
    }
    let list = Array.from(map.values());
    if (busca.trim()) {
      const b = busca.toLowerCase();
      list = list.filter((u) => u.name.toLowerCase().includes(b) || u.email.toLowerCase().includes(b));
    }
    return list;
  }, [allUsers, following, followers, busca]);

  async function toggleFollow(u: UsuarioRede) {
    if (u.isFollowing) {
      setFollowing((prev) => prev.filter((p) => p.email !== u.email));
      await supabase.from("user_follow").delete()
        .eq("follower_email", userEmail).eq("following_email", u.email);
    } else {
      setFollowing((prev) => [...prev, { email: u.email, name: u.name }]);
      await supabase.from("user_follow").insert({
        follower_email: userEmail, following_email: u.email, following_name: u.name,
      });
    }
  }

  function abrirMensagem(email: string) {
    const cid = conversationIdFor(userEmail, email);
    router.push(`/dashboard/comunidade/mensagens?c=${encodeURIComponent(cid)}`);
  }

  return (
    <div style={{ minHeight: "calc(100vh - 58px)", background: "#0a0806" }}>
      <div style={{ maxWidth: "880px", margin: "0 auto", padding: "32px 24px 64px" }}>
        {/* Voltar */}
        <button
          onClick={() => router.push("/dashboard/comunidade")}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            background: "none", border: "none", cursor: "pointer",
            color: "#a09068", fontSize: "13px",
            fontFamily: "var(--font-sans)", padding: 0, marginBottom: "24px",
            transition: "color 0.15s",
          }}
          className="aurum-hover-gold aurum-hover-transition"
        >
          <ChevronLeft size={15} /> Voltar para comunidade
        </button>

        {/* Header */}
        <h1 style={{
          fontSize: "26px", fontWeight: 700, color: "#e8dcc0",
          fontFamily: "var(--font-display)", marginBottom: "6px",
          letterSpacing: "-0.01em",
        }}>
          Minha Rede
        </h1>
        <p style={{ fontSize: "13px", color: "#a09068", fontFamily: "var(--font-sans)", marginBottom: "24px" }}>
          Conecte-se com outros investidores
        </p>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
          <StatCard label="Seguindo" value={following.length} accent="#5E6B8C" />
          <StatCard label="Seguidores" value={followers.length} accent="#34d399" />
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: "20px" }}>
          <Search size={14} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9a8a6a" }} />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar investidores..."
            style={{
              width: "100%", height: "42px",
              background: "#130f09",
              border: "1px solid rgba(201,168,76,0.12)",
              borderRadius: "10px", padding: "0 14px 0 40px",
              color: "#e8dcc0", fontSize: "13px",
              fontFamily: "var(--font-sans)", outline: "none",
            }}
          />
        </div>

        {/* List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {loading ? (
            <Empty text="Carregando..." />
          ) : usuarios.length === 0 ? (
            <Empty text="Nenhum investidor encontrado." />
          ) : (
            usuarios.map((u) => (
              <UserRow
                key={u.email}
                user={u}
                onMessage={() => abrirMensagem(u.email)}
                onToggleFollow={() => toggleFollow(u)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div style={{
      background: "#130f09",
      border: `1px solid ${accent}33`,
      borderRadius: "12px", padding: "20px",
      display: "flex", alignItems: "center", gap: "16px",
    }}>
      <p style={{
        fontSize: "32px", fontWeight: 700, color: accent,
        fontFamily: "var(--font-display)", lineHeight: 1,
      }}>
        {value}
      </p>
      <p style={{ fontSize: "13px", color: "#9a8a6a", fontFamily: "var(--font-sans)" }}>
        {label}
      </p>
    </div>
  );
}

function UserRow({
  user, onMessage, onToggleFollow,
}: {
  user: UsuarioRede;
  onMessage: () => void;
  onToggleFollow: () => void;
}) {
  const initial = initialFromName(user.name);
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "12px",
      background: "#130f09",
      border: "1px solid rgba(201,168,76,0.08)",
      borderRadius: "10px", padding: "12px 16px",
    }}>
      <div style={{
        width: "36px", height: "36px", borderRadius: "50%",
        background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontSize: "14px", fontWeight: 700,
        fontFamily: "var(--font-sans)", flexShrink: 0,
      }}>
        {initial}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: "13px", fontWeight: 600, color: "#e8dcc0",
          fontFamily: "var(--font-sans)", marginBottom: "2px",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {user.name}
        </p>
        <p style={{
          fontSize: "11px", color: "#a09068", fontFamily: "var(--font-sans)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {user.email}
        </p>
      </div>
      <button
        onClick={onMessage}
        style={{
          display: "flex", alignItems: "center", gap: "5px",
          background: "transparent",
          border: "1px solid rgba(201,168,76,0.15)",
          borderRadius: "6px", padding: "6px 12px",
          color: "#C9A84C", fontSize: "11px", fontWeight: 500,
          fontFamily: "var(--font-sans)", cursor: "pointer",
          transition: "background 0.15s",
        }}
        className="aurum-hover-bg aurum-hover-transition"
      >
        <MessageSquare size={11} /> Mensagem
      </button>
      <button
        onClick={onToggleFollow}
        style={{
          display: "flex", alignItems: "center", gap: "5px",
          background: user.isFollowing ? "transparent" : "linear-gradient(135deg, #8b5cf6, #6d28d9)",
          border: "1px solid",
          borderColor: user.isFollowing ? "rgba(139,92,246,0.4)" : "transparent",
          borderRadius: "6px", padding: "6px 12px",
          color: user.isFollowing ? "#a89aba" : "#fff",
          fontSize: "11px", fontWeight: 600,
          fontFamily: "var(--font-sans)", cursor: "pointer",
          transition: "all 0.15s",
        }}
      >
        {user.isFollowing ? <><UserCheck size={11} /> Seguindo</> : <><UserPlus size={11} /> Seguir</>}
      </button>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div style={{
      background: "#130f09",
      border: "1px solid rgba(201,168,76,0.08)",
      borderRadius: "10px", padding: "32px 24px",
      textAlign: "center", color: "#a09068",
      fontSize: "13px", fontFamily: "var(--font-sans)",
    }}>
      {text}
    </div>
  );
}
