"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Heart, MessageCircle, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  from_user_email: string | null;
  from_user_name: string | null;
  related_entity_id: string | null;
  created_at: string;
}

interface Props {
  userEmail: string;
}

function relativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - t);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString("pt-BR");
}

function iconFor(type: string) {
  switch (type) {
    case "like":    return <Heart size={13} />;
    case "comment": return <MessageCircle size={13} />;
    case "follow":  return <UserPlus size={13} />;
    default:        return <Bell size={13} />;
  }
}

export default function NotificationsBell({ userEmail }: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      const { data } = await supabase
        .from("notification")
        .select("*")
        .eq("user_email", userEmail)
        .order("created_at", { ascending: false })
        .limit(20);
      if (!active) return;
      const list = (data ?? []) as NotificationRow[];
      setItems(list);
      setUnread(list.filter((n) => !n.is_read).length);
    }
    load();
    const interval = setInterval(load, 30000);
    return () => { active = false; clearInterval(interval); };
  }, [supabase, userEmail]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function markAllRead() {
    if (unread === 0) return;
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnread(0);
    await supabase
      .from("notification")
      .update({ is_read: true })
      .eq("user_email", userEmail)
      .eq("is_read", false);
  }

  async function handleClickItem(n: NotificationRow) {
    setOpen(false);
    if (!n.is_read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
      setUnread((c) => Math.max(0, c - 1));
      await supabase.from("notification").update({ is_read: true }).eq("id", n.id);
    }
    if (n.type === "like" || n.type === "comment") {
      router.push("/dashboard/comunidade");
    } else if (n.type === "follow" && n.from_user_email) {
      router.push(`/dashboard/comunidade/rede`);
    }
  }

  return (
    <div style={{ position: "relative" }} ref={ref}>
      <button
        aria-label="Notificações"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "34px", height: "34px", borderRadius: "8px",
          background: "transparent", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#7a6a4a", transition: "all 0.15s", position: "relative",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(201,168,76,0.08)"; e.currentTarget.style.color = "#C9A84C"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#7a6a4a"; }}
      >
        <Bell size={16} />
        {unread > 0 && (
          <span style={{
            position: "absolute", top: "5px", right: "5px",
            minWidth: "16px", height: "16px",
            background: "#ef4444", color: "#fff",
            borderRadius: "8px", fontSize: "9px", fontWeight: 700,
            fontFamily: "var(--font-sans)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 4px",
            boxShadow: "0 0 0 2px rgba(10,8,6,0.92)",
          }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "44px", right: 0,
          background: "#130f09",
          border: "1px solid rgba(201,168,76,0.15)",
          borderRadius: "10px",
          width: "340px",
          maxHeight: "440px",
          overflow: "hidden",
          boxShadow: "0 12px 40px rgba(0,0,0,0.7)",
          display: "flex", flexDirection: "column",
          zIndex: 60,
        }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "12px 14px",
            borderBottom: "1px solid rgba(201,168,76,0.1)",
          }}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-sans)" }}>
              Notificações
            </p>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  background: "transparent", border: "none",
                  fontSize: "11px", color: "#C9A84C", cursor: "pointer",
                  fontFamily: "var(--font-sans)", padding: 0,
                }}
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            {items.length === 0 ? (
              <p style={{ padding: "30px 16px", textAlign: "center", color: "#7a6a4a", fontSize: "12px", fontFamily: "var(--font-sans)" }}>
                Sem notificações ainda.
              </p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClickItem(n)}
                  style={{
                    width: "100%", textAlign: "left",
                    padding: "12px 14px",
                    background: n.is_read ? "transparent" : "rgba(201,168,76,0.04)",
                    border: "none",
                    borderBottom: "1px solid rgba(201,168,76,0.05)",
                    cursor: "pointer",
                    display: "flex", gap: "10px", alignItems: "flex-start",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(201,168,76,0.08)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = n.is_read ? "transparent" : "rgba(201,168,76,0.04)"; }}
                >
                  <div style={{
                    width: "26px", height: "26px", borderRadius: "50%",
                    background: "rgba(201,168,76,0.1)", color: "#C9A84C",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    {iconFor(n.type)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: "12px", fontWeight: n.is_read ? 400 : 600,
                      color: "#e8dcc0", fontFamily: "var(--font-sans)",
                      marginBottom: "2px", lineHeight: 1.4,
                    }}>
                      {n.title}
                    </p>
                    {n.message && (
                      <p style={{
                        fontSize: "11px", color: "#7a6a4a",
                        fontFamily: "var(--font-sans)", lineHeight: 1.4,
                        marginBottom: "2px",
                        overflow: "hidden", textOverflow: "ellipsis",
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                      }}>
                        {n.message}
                      </p>
                    )}
                    <p style={{ fontSize: "10px", color: "#5a4a2a", fontFamily: "var(--font-sans)" }}>
                      {relativeTime(n.created_at)}
                    </p>
                  </div>
                  {!n.is_read && (
                    <span style={{
                      width: "6px", height: "6px", borderRadius: "50%",
                      background: "#C9A84C", flexShrink: 0, marginTop: "8px",
                    }} />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
