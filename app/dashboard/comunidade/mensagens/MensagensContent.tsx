"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft, Search, Plus, MessageSquare, Send, Archive,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  type DirectMessage, formatRelativeTime, initialFromName, conversationIdFor,
} from "@/lib/comunidade";

interface Conversa {
  conversationId: string;
  otherEmail: string;
  otherName: string;
  lastMessage: string | null;
  lastAt: string;
  unread: number;
  isArchived: boolean;
}

interface Props {
  userEmail: string;
  userName: string;
}

export default function MensagensContent({ userEmail, userName }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [allMessages, setAllMessages] = useState<DirectMessage[]>([]);
  const [busca, setBusca] = useState("");
  const [tab, setTab] = useState<"todas" | "arquivadas">("todas");
  const [activeConvId, setActiveConvId] = useState<string | null>(searchParams.get("c"));
  const [activeMessages, setActiveMessages] = useState<DirectMessage[]>([]);
  const [composerText, setComposerText] = useState("");
  const [sending, setSending] = useState(false);
  const [novaConversa, setNovaConversa] = useState(false);
  const [novaEmail, setNovaEmail] = useState("");

  const loadConversas = useCallback(async () => {
    const { data: msgs } = await supabase
      .from("direct_message")
      .select("*")
      .or(`sender_email.eq.${userEmail},receiver_email.eq.${userEmail}`)
      .order("created_at", { ascending: false });
    const messages = (msgs ?? []) as DirectMessage[];
    setAllMessages(messages);

    const { data: meta } = await supabase
      .from("conversation_metadata")
      .select("conversation_id, is_archived")
      .eq("user_email", userEmail);
    const archivedSet = new Set((meta ?? []).filter((m) => m.is_archived).map((m) => m.conversation_id));

    // Agregar por conversation_id
    const map = new Map<string, Conversa>();
    for (const m of messages) {
      if (map.has(m.conversation_id)) continue;
      const otherEmail = m.sender_email === userEmail ? m.receiver_email : m.sender_email;
      map.set(m.conversation_id, {
        conversationId: m.conversation_id,
        otherEmail,
        otherName: otherEmail.split("@")[0],
        lastMessage: m.message,
        lastAt: m.created_at,
        unread: messages.filter((x) =>
          x.conversation_id === m.conversation_id &&
          x.receiver_email === userEmail &&
          !x.is_read
        ).length,
        isArchived: archivedSet.has(m.conversation_id),
      });
    }
    setConversas(Array.from(map.values()));
  }, [supabase, userEmail]);

  const loadActiveMessages = useCallback(async (cid: string) => {
    const { data } = await supabase
      .from("direct_message")
      .select("*")
      .eq("conversation_id", cid)
      .order("created_at", { ascending: true });
    setActiveMessages((data ?? []) as DirectMessage[]);

    // Marcar como lidas
    await supabase
      .from("direct_message")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("conversation_id", cid)
      .eq("receiver_email", userEmail)
      .eq("is_read", false);
  }, [supabase, userEmail]);

  useEffect(() => { loadConversas(); }, [loadConversas]);
  useEffect(() => {
    if (activeConvId) loadActiveMessages(activeConvId);
  }, [activeConvId, loadActiveMessages]);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages]);

  const filteredConversas = useMemo(() => {
    let list = conversas;
    if (tab === "arquivadas") list = list.filter((c) => c.isArchived);
    else list = list.filter((c) => !c.isArchived);
    if (busca.trim()) {
      const b = busca.toLowerCase();
      list = list.filter((c) => c.otherName.toLowerCase().includes(b) || c.otherEmail.toLowerCase().includes(b));
    }
    return list;
  }, [conversas, tab, busca]);

  const activeConv = activeConvId ? conversas.find((c) => c.conversationId === activeConvId) : null;
  const activeOtherEmail = useMemo(() => {
    if (!activeConvId) return null;
    if (activeConv) return activeConv.otherEmail;
    // Conversa nova vinda da URL — extrair do conversation_id
    const parts = activeConvId.split("__");
    return parts.find((p) => p !== userEmail) ?? null;
  }, [activeConvId, activeConv, userEmail]);

  async function enviarMensagem() {
    if (!composerText.trim() || sending || !activeConvId || !activeOtherEmail) return;
    setSending(true);
    const text = composerText.trim();
    setComposerText("");
    const optimistic: DirectMessage = {
      id: `tmp-${Date.now()}`,
      conversation_id: activeConvId,
      sender_email: userEmail,
      receiver_email: activeOtherEmail,
      message: text,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setActiveMessages((prev) => [...prev, optimistic]);
    const { error } = await supabase.from("direct_message").insert({
      conversation_id: activeConvId,
      sender_email: userEmail,
      receiver_email: activeOtherEmail,
      message: text,
      message_type: "text",
    });
    setSending(false);
    if (!error) {
      loadActiveMessages(activeConvId);
      loadConversas();
    }
  }

  function iniciarNovaConversa() {
    if (!novaEmail.trim()) return;
    const cid = conversationIdFor(userEmail, novaEmail.trim());
    setActiveConvId(cid);
    setNovaConversa(false);
    setNovaEmail("");
    router.replace(`/dashboard/comunidade/mensagens?c=${encodeURIComponent(cid)}`);
  }

  return (
    <div style={{ minHeight: "calc(100vh - 58px)", background: "#0a0806" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "20px 24px 24px" }}>
        {/* Voltar */}
        <button
          onClick={() => router.push("/dashboard/comunidade")}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            background: "none", border: "none", cursor: "pointer",
            color: "#a09068", fontSize: "13px",
            fontFamily: "var(--font-sans)", padding: 0, marginBottom: "16px",
            transition: "color 0.15s",
          }}
          className="aurum-hover-gold aurum-hover-transition"
        >
          <ChevronLeft size={15} /> Voltar para comunidade
        </button>

        <div style={{
          display: "grid", gridTemplateColumns: "300px 1fr", gap: "12px",
          height: "calc(100vh - 130px)",
          background: "#130f09",
          border: "1px solid rgba(201,168,76,0.1)",
          borderRadius: "14px",
          overflow: "hidden",
        }}>
          {/* ─── LEFT: Conversas ─── */}
          <div style={{
            borderRight: "1px solid rgba(201,168,76,0.08)",
            display: "flex", flexDirection: "column",
          }}>
            {/* Header */}
            <div style={{ padding: "16px 16px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-display)" }}>
                Mensagens
              </h2>
              <button
                onClick={() => setNovaConversa(true)}
                aria-label="Nova conversa"
                style={{
                  width: "28px", height: "28px", borderRadius: "6px",
                  background: "rgba(201,168,76,0.08)",
                  border: "1px solid rgba(201,168,76,0.15)",
                  color: "#C9A84C", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Search */}
            <div style={{ padding: "0 16px 12px", position: "relative" }}>
              <Search size={12} style={{ position: "absolute", left: "26px", top: "50%", transform: "translateY(-50%)", color: "#9a8a6a" }} />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar conversas..."
                style={{
                  width: "100%", height: "32px",
                  background: "#0d0b07",
                  border: "1px solid rgba(201,168,76,0.1)",
                  borderRadius: "6px", padding: "0 10px 0 28px",
                  color: "#e8dcc0", fontSize: "11px",
                  fontFamily: "var(--font-sans)", outline: "none",
                }}
              />
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: "4px", padding: "0 16px 12px" }}>
              <TabBtn active={tab === "todas"} onClick={() => setTab("todas")}>Todas</TabBtn>
              <TabBtn active={tab === "arquivadas"} onClick={() => setTab("arquivadas")}>
                <Archive size={11} /> Arquivadas
              </TabBtn>
            </div>

            {/* Lista */}
            <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 16px" }}>
              {filteredConversas.length === 0 ? (
                <div style={{
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  padding: "32px 16px", color: "#9a8a6a", textAlign: "center",
                }}>
                  <MessageSquare size={28} style={{ marginBottom: "10px", opacity: 0.4 }} />
                  <p style={{ fontSize: "12px", fontFamily: "var(--font-sans)" }}>
                    Nenhuma conversa ainda
                  </p>
                </div>
              ) : (
                filteredConversas.map((c) => (
                  <ConversaItem
                    key={c.conversationId}
                    conversa={c}
                    active={c.conversationId === activeConvId}
                    onClick={() => setActiveConvId(c.conversationId)}
                  />
                ))
              )}
            </div>
          </div>

          {/* ─── RIGHT: Conversa ativa ─── */}
          {activeConvId && activeOtherEmail ? (
            <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
              {/* Header conversa */}
              <div style={{
                padding: "14px 20px",
                borderBottom: "1px solid rgba(201,168,76,0.08)",
                display: "flex", alignItems: "center", gap: "10px",
              }}>
                <div style={{
                  width: "32px", height: "32px", borderRadius: "50%",
                  background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontSize: "13px", fontWeight: 700,
                  fontFamily: "var(--font-sans)",
                }}>
                  {initialFromName(activeConv?.otherName ?? activeOtherEmail)}
                </div>
                <div>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-sans)" }}>
                    {activeConv?.otherName ?? activeOtherEmail.split("@")[0]}
                  </p>
                  <p style={{ fontSize: "10px", color: "#a09068", fontFamily: "var(--font-sans)" }}>
                    {activeOtherEmail}
                  </p>
                </div>
              </div>

              {/* Mensagens */}
              <div style={{
                flex: 1, overflowY: "auto", padding: "20px",
                display: "flex", flexDirection: "column", gap: "8px",
              }}>
                {activeMessages.length === 0 ? (
                  <div style={{
                    margin: "auto", textAlign: "center",
                    color: "#9a8a6a", fontSize: "12px",
                    fontFamily: "var(--font-sans)",
                  }}>
                    Nenhuma mensagem ainda. Comece a conversa!
                  </div>
                ) : (
                  activeMessages.map((m) => (
                    <Bubble key={m.id} message={m} mine={m.sender_email === userEmail} />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Composer */}
              <div style={{
                padding: "14px 20px",
                borderTop: "1px solid rgba(201,168,76,0.08)",
                display: "flex", gap: "8px",
              }}>
                <input
                  value={composerText}
                  onChange={(e) => setComposerText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") enviarMensagem(); }}
                  placeholder="Digite uma mensagem..."
                  style={{
                    flex: 1, height: "38px",
                    background: "#0d0b07",
                    border: "1px solid rgba(201,168,76,0.12)",
                    borderRadius: "8px", padding: "0 14px",
                    color: "#e8dcc0", fontSize: "13px",
                    fontFamily: "var(--font-sans)", outline: "none",
                  }}
                />
                <button
                  onClick={enviarMensagem}
                  disabled={!composerText.trim() || sending}
                  style={{
                    background: composerText.trim() && !sending
                      ? "linear-gradient(135deg, #8b5cf6, #6d28d9)"
                      : "rgba(139,92,246,0.2)",
                    border: "none", borderRadius: "8px",
                    width: "42px", height: "38px",
                    color: "#fff",
                    cursor: composerText.trim() && !sending ? "pointer" : "not-allowed",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div style={{
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              color: "#9a8a6a", textAlign: "center", padding: "40px",
            }}>
              <MessageSquare size={42} style={{ marginBottom: "14px", opacity: 0.4 }} />
              <p style={{ fontSize: "15px", color: "#9a8a6a", fontWeight: 600, fontFamily: "var(--font-sans)", marginBottom: "4px" }}>
                Selecione uma conversa
              </p>
              <p style={{ fontSize: "12px", fontFamily: "var(--font-sans)" }}>
                Escolha uma conversa da lista para começar a mensagens
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal nova conversa */}
      {novaConversa && (
        <div
          onClick={() => setNovaConversa(false)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
            zIndex: 100,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#130f09",
              border: "1px solid rgba(201,168,76,0.15)",
              borderRadius: "12px",
              width: "100%", maxWidth: "400px",
              padding: "24px",
            }}
          >
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-display)", marginBottom: "12px" }}>
              Nova conversa
            </h3>
            <input
              value={novaEmail}
              onChange={(e) => setNovaEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") iniciarNovaConversa(); }}
              autoFocus
              type="email"
              placeholder="Email do investidor"
              style={{
                width: "100%", height: "40px",
                background: "#0d0b07",
                border: "1px solid rgba(201,168,76,0.12)",
                borderRadius: "8px", padding: "0 12px",
                color: "#e8dcc0", fontSize: "13px",
                fontFamily: "var(--font-sans)", outline: "none",
                marginBottom: "16px",
              }}
            />
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setNovaConversa(false)}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(201,168,76,0.15)",
                  borderRadius: "6px", padding: "7px 14px",
                  color: "#9a8a6a", fontSize: "12px",
                  fontFamily: "var(--font-sans)", cursor: "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={iniciarNovaConversa}
                style={{
                  background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
                  border: "none", borderRadius: "6px",
                  padding: "7px 14px", color: "#fff",
                  fontSize: "12px", fontWeight: 600,
                  fontFamily: "var(--font-sans)", cursor: "pointer",
                }}
              >
                Iniciar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TabBtn({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: "4px",
        padding: "5px 10px", borderRadius: "6px",
        border: "1px solid",
        borderColor: active ? "rgba(201,168,76,0.3)" : "transparent",
        background: active ? "rgba(201,168,76,0.05)" : "transparent",
        color: active ? "#C9A84C" : "#a09068",
        fontSize: "11px", fontWeight: active ? 600 : 500,
        fontFamily: "var(--font-sans)", cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      {children}
    </button>
  );
}

function ConversaItem({
  conversa, active, onClick,
}: {
  conversa: Conversa;
  active: boolean;
  onClick: () => void;
}) {
  const initial = initialFromName(conversa.otherName);
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", display: "flex", gap: "10px",
        padding: "10px",
        background: active ? "rgba(201,168,76,0.06)" : "transparent",
        border: "1px solid",
        borderColor: active ? "rgba(201,168,76,0.15)" : "transparent",
        borderRadius: "8px", cursor: "pointer", textAlign: "left",
        transition: "all 0.15s", marginBottom: "2px",
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = "rgba(201,168,76,0.03)";
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = "transparent";
      }}
    >
      <div style={{
        width: "32px", height: "32px", borderRadius: "50%",
        background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontSize: "13px", fontWeight: 700,
        fontFamily: "var(--font-sans)", flexShrink: 0,
      }}>
        {initial}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "6px", marginBottom: "2px" }}>
          <p style={{
            fontSize: "12px", fontWeight: 600,
            color: active ? "#e8dcc0" : "#c8b89a",
            fontFamily: "var(--font-sans)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {conversa.otherName}
          </p>
          <span style={{ fontSize: "10px", color: "#9a8a6a", fontFamily: "var(--font-sans)", flexShrink: 0 }}>
            {formatRelativeTime(conversa.lastAt)}
          </span>
        </div>
        <p style={{
          fontSize: "11px",
          color: conversa.unread > 0 ? "#C9A84C" : "#a09068",
          fontFamily: "var(--font-sans)",
          fontWeight: conversa.unread > 0 ? 500 : 400,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {conversa.lastMessage ?? "—"}
        </p>
      </div>
      {conversa.unread > 0 && (
        <span style={{
          minWidth: "18px", height: "18px",
          padding: "0 6px",
          borderRadius: "9px",
          background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
          color: "#fff", fontSize: "10px", fontWeight: 700,
          fontFamily: "var(--font-sans)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          {conversa.unread}
        </span>
      )}
    </button>
  );
}

function Bubble({ message, mine }: { message: DirectMessage; mine: boolean }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: mine ? "flex-end" : "flex-start",
    }}>
      <div style={{
        maxWidth: "70%",
        background: mine
          ? "linear-gradient(135deg, #8b5cf6, #6d28d9)"
          : "#0d0b07",
        border: mine ? "none" : "1px solid rgba(201,168,76,0.1)",
        borderRadius: "12px",
        padding: "8px 12px",
      }}>
        <p style={{
          fontSize: "13px",
          color: mine ? "#fff" : "#c8b89a",
          fontFamily: "var(--font-sans)",
          lineHeight: 1.5,
          whiteSpace: "pre-wrap", wordBreak: "break-word",
        }}>
          {message.message}
        </p>
        <p style={{
          fontSize: "9px",
          color: mine ? "rgba(255,255,255,0.6)" : "#9a8a6a",
          fontFamily: "var(--font-sans)",
          marginTop: "3px", textAlign: "right",
        }}>
          {formatRelativeTime(message.created_at)}
        </p>
      </div>
    </div>
  );
}
