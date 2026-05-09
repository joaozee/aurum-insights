"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  BarChart2,
  BookOpen,
  Users,
  ChevronRight,
  Sparkles,
  Heart,
  MessageCircle,
  Repeat2,
} from "lucide-react";
import type { MarketItem } from "@/app/api/market/route";
import { createClient } from "@/lib/supabase/client";
import { formatRelativeTime, initialFromName } from "@/lib/comunidade";

// Cards do Acesso Rápido usam a paleta Aurum (lib/aurum-colors.ts) em vez
// dos gradientes vibrantes Tailwind-500 que brigavam com a identidade
// dourada do app.
const QUICK_ACCESS = [
  {
    label: "Minhas Finanças",
    sub: "Controle completo",
    href: "/dashboard/financas",
    icon: Wallet,
    accent: "#5E6B8C", // chart-6 slate blue
    glow: "rgba(94,107,140,0.25)",
  },
  {
    label: "Minha Carteira",
    sub: "Acompanhe ativos",
    href: "/dashboard/carteira",
    icon: BarChart2,
    accent: "#4F8A82", // chart-7 desat teal
    glow: "rgba(79,138,130,0.25)",
  },
  {
    label: "Aprender",
    sub: "Cursos e conteúdos",
    href: "/dashboard/cursos",
    icon: BookOpen,
    accent: "#B85C3A", // chart-3 terracotta
    glow: "rgba(184,92,58,0.25)",
  },
  {
    label: "Comunidade",
    sub: "Conecte-se",
    href: "/dashboard/comunidade",
    icon: Users,
    accent: "#6E8C4A", // chart-8 olive green
    glow: "rgba(110,140,74,0.25)",
  },
];

interface HomePost {
  id: string;
  author_name: string | null;
  author_avatar: string | null;
  author_username: string | null;
  author_email: string | null;
  content: string | null;
  created_at: string;
  likes_count: number;
  comments_count: number;
  reposts_count: number;
}

interface HomeContentProps {
  firstName: string;
  marketData: MarketItem[];
  quickStats?: {
    assetCount: number;
    monthBalance: number;
  };
}

const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export default function HomeContent({ firstName, marketData, quickStats }: HomeContentProps) {
  const router = useRouter();
  const stats = quickStats ?? { assetCount: 0, monthBalance: 0 };

  const supabase = useMemo(() => createClient(), []);
  const [posts, setPosts] = useState<HomePost[]>([]);
  const [avatarByEmail, setAvatarByEmail] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("community_post")
        .select("id, author_name, author_avatar, author_username, author_email, content, created_at, likes_count, comments_count, reposts_count, moderation_status, repost_of_id")
        .neq("moderation_status", "rejeitado")
        .not("content", "is", null)
        .is("repost_of_id", null)
        .order("created_at", { ascending: false })
        .limit(2);
      const list = (data ?? []) as HomePost[];
      if (!active) return;
      setPosts(list);

      const emails = Array.from(
        new Set(list.map((p) => p.author_email).filter((e): e is string => Boolean(e)))
      );
      if (emails.length > 0) {
        const { data: profs } = await supabase
          .from("user_profile")
          .select("user_email, avatar_url")
          .in("user_email", emails);
        if (!active) return;
        const m = new Map<string, string>();
        for (const p of (profs ?? []) as { user_email: string; avatar_url: string | null }[]) {
          if (p.avatar_url) m.set(p.user_email, p.avatar_url);
        }
        setAvatarByEmail(m);
      } else {
        setAvatarByEmail(new Map());
      }
    })();
    return () => { active = false; };
  }, [supabase]);

  return (
    <div style={{ minHeight: "calc(100vh - 58px)", background: "#0a0806" }}>
      {/* Hero */}
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          borderBottom: "1px solid rgba(201,168,76,0.08)",
        }}
      >
        {/* Subtle radial glow behind hero */}
        <div
          style={{
            position: "absolute",
            top: "-80px",
            left: "-100px",
            width: "600px",
            height: "400px",
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse, rgba(201,168,76,0.06) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            right: "10%",
            width: "400px",
            height: "300px",
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse, rgba(201,168,76,0.04) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "48px 24px 44px",
            display: "grid",
            gridTemplateColumns: "1fr 300px",
            gap: "32px",
            alignItems: "start",
          }}
        >
          {/* Left */}
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                background: "rgba(201,168,76,0.08)",
                border: "1px solid rgba(201,168,76,0.15)",
                borderRadius: "20px",
                padding: "5px 14px",
                marginBottom: "20px",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  color: "#C9A84C",
                  fontFamily: "var(--font-sans)",
                  letterSpacing: "0.1em",
                  fontWeight: 500,
                }}
              >
                Aurum
              </span>
            </div>

            <h1
              style={{
                fontSize: "clamp(36px, 4vw, 52px)",
                fontWeight: 700,
                color: "#f0e8d0",
                fontFamily: "var(--font-display)",
                lineHeight: 1.1,
                marginBottom: "16px",
                letterSpacing: "-0.01em",
              }}
            >
              {getGreeting()},{" "}
              <span style={{ color: "#E8C96A" }}>
                {capitalize(firstName)}
              </span>
            </h1>

            <p
              style={{
                fontSize: "15px",
                color: "#a09068",
                fontFamily: "var(--font-sans)",
                lineHeight: 1.75,
                maxWidth: "460px",
              }}
            >
              Transforme conhecimento em patrimônio. Análises exclusivas, cursos
              completos e uma comunidade de investidores.
            </p>
          </div>

          {/* Market card */}
          <div
            style={{
              background: "#130f09",
              border: "1px solid rgba(201,168,76,0.12)",
              borderRadius: "12px",
              padding: "22px 24px",
              boxShadow: "0 4px 32px rgba(0,0,0,0.5)",
              backdropFilter: "blur(8px)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "18px",
                paddingBottom: "14px",
                borderBottom: "1px solid rgba(201,168,76,0.08)",
              }}
            >
              <TrendingUp size={14} style={{ color: "#C9A84C" }} />
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#e8dcc0",
                  fontFamily: "var(--font-sans)",
                  letterSpacing: "0.04em",
                }}
              >
                Mercado Hoje
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "13px" }}>
              {marketData.map(({ label, value, price, positive }) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
                    <span
                      style={{
                        fontSize: "13px",
                        color: "#a09068",
                        fontFamily: "var(--font-sans)",
                      }}
                    >
                      {label}
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#e8dcc0",
                        fontFamily: "var(--font-sans)",
                        fontWeight: 600,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {price}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      fontFamily: "var(--font-sans)",
                      color: positive ? "#34d399" : "#f87171",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      background: positive
                        ? "rgba(52,211,153,0.08)"
                        : "rgba(248,113,113,0.08)",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      flexShrink: 0,
                    }}
                  >
                    {positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "36px 24px 56px",
        }}
      >
        {/* Acesso Rápido */}
        <section style={{ marginBottom: "36px" }}>
          <SectionTitle>Acesso Rápido</SectionTitle>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "14px",
            }}
          >
            {QUICK_ACCESS.map(({ label, sub, href, icon: Icon, accent, glow }) => {
              const stat =
                href === "/dashboard/carteira" && stats.assetCount > 0
                  ? `${stats.assetCount} ${stats.assetCount === 1 ? "ativo" : "ativos"}`
                  : href === "/dashboard/financas" && (stats.monthBalance !== 0)
                  ? `${stats.monthBalance >= 0 ? "+" : ""}${fmtBRL(stats.monthBalance)} no mês`
                  : null;
              return (
              <button
                key={href}
                onClick={() => router.push(href)}
                style={{
                  background: "#130f09",
                  border: `1px solid ${accent}24`,
                  borderRadius: "12px",
                  padding: "22px 20px 20px",
                  cursor: "pointer",
                  textAlign: "left",
                  position: "relative",
                  overflow: "hidden",
                  transition: "transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.borderColor = `${accent}55`;
                  e.currentTarget.style.boxShadow = `0 8px 28px ${glow}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = `${accent}24`;
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "30px",
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      background: `${accent}1f`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: accent,
                    }}
                  >
                    <Icon size={18} />
                  </div>
                  <ChevronRight size={14} style={{ color: "#a09068" }} />
                </div>

                <p
                  style={{
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "#e8dcc0",
                    fontFamily: "var(--font-sans)",
                    marginBottom: "4px",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {label}
                </p>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#a09068",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {sub}
                </p>
                {stat && (
                  <p
                    style={{
                      marginTop: "10px",
                      display: "inline-block",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: accent,
                      background: `${accent}14`,
                      padding: "3px 8px",
                      borderRadius: "5px",
                      fontFamily: "var(--font-sans)",
                      letterSpacing: "0.01em",
                    }}
                  >
                    {stat}
                  </p>
                )}
              </button>
              );
            })}
          </div>
        </section>

        {/* Conheça o Aurum */}
        <section style={{ marginBottom: "36px" }}>
          <button
            onClick={() => router.push("/dashboard/sobre")}
            style={{
              width: "100%",
              background: "linear-gradient(135deg, #130f09 0%, #1a1205 100%)",
              border: "1px solid rgba(201,168,76,0.12)",
              borderRadius: "12px",
              padding: "26px 32px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "20px",
              textAlign: "left",
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)";
              e.currentTarget.style.boxShadow = "0 4px 24px rgba(201,168,76,0.06)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(201,168,76,0.12)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div
              style={{
                width: "46px",
                height: "46px",
                flexShrink: 0,
                overflow: "hidden",
                borderRadius: "50%",
              }}
            >
              <img
                src="/selo.png"
                alt="Aurum"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <p
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "#e8dcc0",
                  fontFamily: "var(--font-sans)",
                  marginBottom: "5px",
                  letterSpacing: "-0.01em",
                }}
              >
                Conheça o Aurum
              </p>
              <p
                style={{
                  fontSize: "13px",
                  color: "#a09068",
                  fontFamily: "var(--font-sans)",
                  lineHeight: 1.5,
                }}
              >
                Descubra nossa história, missão e valores. Saiba por que somos a
                melhor escolha para sua jornada de investimentos.
              </p>
            </div>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                border: "1px solid rgba(201,168,76,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <ChevronRight size={15} style={{ color: "#C9A84C" }} />
            </div>
          </button>
        </section>

        {/* Notícias */}
        <section>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <div>
              <SectionTitle>Comunidade Aurum</SectionTitle>
              <p style={{ fontSize: "11px", color: "#a09068", fontFamily: "var(--font-sans)", marginTop: "2px" }}>
                Posts em destaque dos investidores
              </p>
            </div>
            <button
              onClick={() => router.push("/dashboard/comunidade")}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontSize: "13px",
                color: "#C9A84C",
                fontFamily: "var(--font-sans)",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: 0,
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#E8C96A"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#C9A84C"; }}
            >
              Ver todos <ChevronRight size={13} />
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: posts.length > 0 ? "1fr 1fr" : "1fr",
              gap: "14px",
            }}
          >
            {posts.length === 0 ? (
              <div
                onClick={() => router.push("/dashboard/comunidade")}
                role="link"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") router.push("/dashboard/comunidade"); }}
                style={{
                  background: "#130f09",
                  border: "1px solid rgba(201,168,76,0.08)",
                  borderRadius: "12px",
                  padding: "30px 20px",
                  cursor: "pointer",
                  textAlign: "center",
                  color: "#a09068",
                  fontSize: "13px",
                  fontFamily: "var(--font-sans)",
                }}
              >
                Ainda não há posts na comunidade. Seja o primeiro a compartilhar.
              </div>
            ) : (
              posts.map((p) => {
                const initial = initialFromName(p.author_name);
                const avatarUrl =
                  (p.author_email && avatarByEmail.get(p.author_email)) || p.author_avatar;
                return (
                  <div
                    key={p.id}
                    onClick={() => router.push("/dashboard/comunidade")}
                    role="link"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") router.push("/dashboard/comunidade"); }}
                    style={{
                      background: "#130f09",
                      border: "1px solid rgba(201,168,76,0.08)",
                      borderRadius: "12px",
                      padding: "20px",
                      cursor: "pointer",
                      transition: "border-color 0.2s, box-shadow 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(201,168,76,0.2)";
                      (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.3)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(201,168,76,0.08)";
                      (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                    }}
                  >
                    {/* Author */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          overflow: "hidden",
                          flexShrink: 0,
                          background: avatarUrl
                            ? `url(${avatarUrl}) center/cover no-repeat`
                            : "linear-gradient(135deg, #C9A84C, #8a6a20)",
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "13px",
                          fontWeight: 700,
                          fontFamily: "var(--font-sans)",
                        }}
                      >
                        {!avatarUrl && initial}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: "13px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-sans)", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {p.author_name ?? "Anônimo"}
                        </p>
                        <p style={{ fontSize: "11px", color: "#9a8a6a", fontFamily: "var(--font-sans)" }}>
                          {formatRelativeTime(p.created_at)}
                        </p>
                      </div>
                    </div>

                    <p
                      style={{
                        fontSize: "13px",
                        color: "#8a7a5a",
                        fontFamily: "var(--font-sans)",
                        lineHeight: 1.65,
                        marginBottom: "16px",
                        display: "-webkit-box",
                        WebkitLineClamp: 4,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {p.content}
                    </p>

                    <div style={{ display: "flex", gap: "18px", paddingTop: "12px", borderTop: "1px solid rgba(201,168,76,0.06)" }}>
                      {[
                        { icon: Heart, count: p.likes_count },
                        { icon: MessageCircle, count: p.comments_count },
                        { icon: Repeat2, count: p.reposts_count },
                      ].map(({ icon: Icon, count }, i) => (
                        <span
                          key={i}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            color: "#9a8a6a",
                            fontSize: "12px",
                            fontFamily: "var(--font-sans)",
                          }}
                        >
                          <Icon size={13} />
                          {count ?? 0}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <h2
        style={{
          fontSize: "18px",
          fontWeight: 600,
          color: "#e8dcc0",
          fontFamily: "var(--font-display)",
          letterSpacing: "-0.01em",
          display: "inline-block",
        }}
      >
        {children}
      </h2>
      <div
        style={{
          width: "28px",
          height: "2px",
          background: "linear-gradient(90deg, #C9A84C, transparent)",
          marginTop: "6px",
          borderRadius: "1px",
        }}
      />
    </div>
  );
}
