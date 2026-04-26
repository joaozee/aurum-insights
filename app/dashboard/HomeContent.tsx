"use client";

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
} from "lucide-react";

const MARKET_DATA = [
  { label: "IBOV", value: "+1.24%", positive: true },
  { label: "S&P 500", value: "+0.87%", positive: true },
  { label: "Dólar", value: "-0.32%", positive: false },
];

const QUICK_ACCESS = [
  {
    label: "Minhas Finanças",
    sub: "Controle completo",
    href: "/dashboard/financas",
    icon: Wallet,
    color: "#2563eb",
    gradient: "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)",
  },
  {
    label: "Minha Carteira",
    sub: "Acompanhe ativos",
    href: "/dashboard/carteira",
    icon: BarChart2,
    color: "#0891b2",
    gradient: "linear-gradient(135deg, #0e7490 0%, #22d3ee 100%)",
  },
  {
    label: "Aprender",
    sub: "Cursos e conteúdos",
    href: "/dashboard/cursos",
    icon: BookOpen,
    color: "#7c3aed",
    gradient: "linear-gradient(135deg, #6d28d9 0%, #a78bfa 100%)",
  },
  {
    label: "Comunidade",
    sub: "Conecte-se",
    href: "/dashboard/comunidade",
    icon: Users,
    color: "#059669",
    gradient: "linear-gradient(135deg, #047857 0%, #34d399 100%)",
  },
];

const NEWS_MOCK = [
  {
    id: 1,
    author: "Aurum Investimentos",
    time: "2h",
    content: "IBOV fecha em alta de 1.24% impulsionado pelo setor financeiro. Analistas apontam continuidade para a semana.",
    likes: 14,
    comments: 3,
  },
  {
    id: 2,
    author: "Aurum Investimentos",
    time: "5h",
    content: "Dólar recua ante o real com dados positivos da balança comercial. Câmbio opera abaixo dos R$5,10.",
    likes: 8,
    comments: 1,
  },
];

interface HomeContentProps {
  firstName: string;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export default function HomeContent({ firstName }: HomeContentProps) {
  const router = useRouter();

  return (
    <div
      style={{
        maxWidth: "1280px",
        margin: "0 auto",
        padding: "0 24px 48px",
      }}
    >
      {/* Hero */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gap: "24px",
          padding: "40px 0 32px",
          alignItems: "start",
        }}
      >
        {/* Left */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "16px",
            }}
          >
            <Sparkles size={13} style={{ color: "#C9A84C" }} />
            <span
              style={{
                fontSize: "12px",
                color: "#C9A84C",
                fontFamily: "var(--font-sans)",
                letterSpacing: "0.08em",
              }}
            >
              Aurum Investimentos
            </span>
          </div>
          <h1
            style={{
              fontSize: "clamp(32px, 4vw, 48px)",
              fontWeight: 700,
              color: "#e8e0d0",
              fontFamily: "var(--font-display)",
              lineHeight: 1.15,
              marginBottom: "14px",
            }}
          >
            {getGreeting()}, {firstName}
          </h1>
          <p
            style={{
              fontSize: "15px",
              color: "#7a6a4a",
              fontFamily: "var(--font-sans)",
              lineHeight: 1.7,
              maxWidth: "480px",
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
            border: "1px solid #2a2010",
            borderRadius: "8px",
            padding: "20px 24px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              marginBottom: "16px",
            }}
          >
            <TrendingUp size={14} style={{ color: "#C9A84C" }} />
            <span
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "#e8dcc0",
                fontFamily: "var(--font-sans)",
              }}
            >
              Mercado Hoje
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {MARKET_DATA.map(({ label, value, positive }) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: "13px",
                    color: "#9a8a6a",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {label}
                </span>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    fontFamily: "var(--font-sans)",
                    color: positive ? "#34d399" : "#f87171",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  {positive ? (
                    <TrendingUp size={11} />
                  ) : (
                    <TrendingDown size={11} />
                  )}
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Acesso Rápido */}
      <section style={{ marginBottom: "32px" }}>
        <h2
          style={{
            fontSize: "18px",
            fontWeight: 600,
            color: "#e8dcc0",
            fontFamily: "var(--font-display)",
            marginBottom: "16px",
          }}
        >
          Acesso Rápido
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "16px",
          }}
        >
          {QUICK_ACCESS.map(({ label, sub, href, icon: Icon, gradient }) => (
            <button
              key={href}
              onClick={() => router.push(href)}
              style={{
                background: gradient,
                border: "none",
                borderRadius: "10px",
                padding: "22px 20px",
                cursor: "pointer",
                textAlign: "left",
                position: "relative",
                overflow: "hidden",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 8px 28px rgba(0,0,0,0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {/* Decorative circle */}
              <div
                style={{
                  position: "absolute",
                  bottom: "-20px",
                  right: "-20px",
                  width: "90px",
                  height: "90px",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.1)",
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "28px",
                }}
              >
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "8px",
                    background: "rgba(255,255,255,0.18)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                  }}
                >
                  <Icon size={17} />
                </div>
                <ChevronRight size={15} style={{ color: "rgba(255,255,255,0.6)" }} />
              </div>
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#fff",
                  fontFamily: "var(--font-sans)",
                  marginBottom: "3px",
                }}
              >
                {label}
              </p>
              <p
                style={{
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.65)",
                  fontFamily: "var(--font-sans)",
                }}
              >
                {sub}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Conheça a Aurum */}
      <section style={{ marginBottom: "32px" }}>
        <button
          onClick={() => router.push("/sobre")}
          style={{
            width: "100%",
            background: "#130f09",
            border: "1px solid #2a2010",
            borderRadius: "10px",
            padding: "28px 32px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "20px",
            textAlign: "left",
            transition: "border-color 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(201,168,76,0.35)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#2a2010";
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              border: "1.5px solid rgba(201,168,76,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#C9A84C",
              flexShrink: 0,
              fontSize: "18px",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
            }}
          >
            A
          </div>
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontSize: "15px",
                fontWeight: 600,
                color: "#e8dcc0",
                fontFamily: "var(--font-sans)",
                marginBottom: "4px",
              }}
            >
              Conheça a Aurum
            </p>
            <p
              style={{
                fontSize: "13px",
                color: "#7a6a4a",
                fontFamily: "var(--font-sans)",
              }}
            >
              Descubra nossa história, missão e valores. Saiba por que somos a
              melhor escolha para sua jornada de investimentos.
            </p>
          </div>
          <ChevronRight size={18} style={{ color: "#C9A84C", flexShrink: 0 }} />
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
          <h2
            style={{
              fontSize: "18px",
              fontWeight: 600,
              color: "#e8dcc0",
              fontFamily: "var(--font-display)",
            }}
          >
            Notícias
          </h2>
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
            }}
          >
            Ver todos <ChevronRight size={13} />
          </button>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
          }}
        >
          {NEWS_MOCK.map(({ id, author, time, content, likes, comments }) => (
            <div
              key={id}
              style={{
                background: "#130f09",
                border: "1px solid #2a2010",
                borderRadius: "8px",
                padding: "20px",
                transition: "border-color 0.2s",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor =
                  "rgba(201,168,76,0.25)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor =
                  "#2a2010";
              }}
            >
              {/* Author row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #C9A84C, #8B6914)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#0d0b07",
                    fontSize: "12px",
                    fontWeight: 700,
                    fontFamily: "var(--font-sans)",
                    flexShrink: 0,
                  }}
                >
                  A
                </div>
                <div>
                  <p
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#e8dcc0",
                      fontFamily: "var(--font-sans)",
                    }}
                  >
                    {author}
                  </p>
                  <p
                    style={{
                      fontSize: "11px",
                      color: "#5a4a2a",
                      fontFamily: "var(--font-sans)",
                    }}
                  >
                    {time}
                  </p>
                </div>
              </div>
              <p
                style={{
                  fontSize: "13px",
                  color: "#9a8a6a",
                  fontFamily: "var(--font-sans)",
                  lineHeight: 1.6,
                  marginBottom: "14px",
                }}
              >
                {content}
              </p>
              {/* Interactions */}
              <div
                style={{
                  display: "flex",
                  gap: "16px",
                }}
              >
                {[
                  { label: `♡ ${likes}` },
                  { label: `◇ ${comments}` },
                  { label: "↗ 0" },
                ].map(({ label }, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: "11px",
                      color: "#5a4a2a",
                      fontFamily: "var(--font-sans)",
                    }}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
