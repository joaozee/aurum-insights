"use client";

import { useRouter } from "next/navigation";
import {
  TrendingUp,
  Target,
  Eye,
  Shield,
  Users,
  BarChart2,
  BookOpen,
  Cpu,
  ChevronLeft,
  Check,
} from "lucide-react";

const VALORES = [
  "Transparência total",
  "Educação de qualidade",
  "Inovação constante",
  "Comunidade colaborativa",
];

const MVV = [
  {
    icon: Target,
    label: "Missão",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.1)",
    border: "rgba(245,158,11,0.2)",
    text: "Empoderar investidores brasileiros através de educação financeira de excelência, análises precisas e uma comunidade colaborativa.",
    type: "text",
  },
  {
    icon: Eye,
    label: "Visão",
    color: "#06b6d4",
    bg: "rgba(6,182,212,0.1)",
    border: "rgba(6,182,212,0.2)",
    text: "Ser a plataforma de educação financeira mais confiável e completa do Brasil, transformando milhões de vidas através do conhecimento.",
    type: "text",
  },
  {
    icon: Shield,
    label: "Valores",
    color: "#10b981",
    bg: "rgba(16,185,129,0.1)",
    border: "rgba(16,185,129,0.2)",
    text: "",
    type: "list",
  },
];

const DIFERENCIAIS = [
  {
    icon: Users,
    label: "Comunidade Ativa",
    text: "Conecte-se com milhares de investidores, compartilhe experiências e aprenda em conjunto.",
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.1)",
  },
  {
    icon: BarChart2,
    label: "Análises Profissionais",
    text: "Receba análises detalhadas de ações, FIIs e tendências de mercado feitas por especialistas.",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.1)",
  },
  {
    icon: BookOpen,
    label: "Cursos Práticos",
    text: "Aprenda do básico ao avançado com cursos estruturados e certificados reconhecidos.",
    color: "#10b981",
    bg: "rgba(16,185,129,0.1)",
  },
  {
    icon: Cpu,
    label: "Tecnologia Avançada",
    text: "Ferramentas inteligentes de análise, gestão de portfólio e acompanhamento em tempo real.",
    color: "#06b6d4",
    bg: "rgba(6,182,212,0.1)",
  },
];

export default function SobreContent() {
  const router = useRouter();

  return (
    <div style={{ minHeight: "calc(100vh - 58px)", background: "#0a0806" }}>
      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "40px 24px 64px" }}>

        {/* Back */}
        <button
          onClick={() => router.push("/dashboard")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#7a6a4a",
            fontSize: "13px",
            fontFamily: "var(--font-sans)",
            padding: 0,
            marginBottom: "40px",
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#C9A84C"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#7a6a4a"; }}
        >
          <ChevronLeft size={15} /> Voltar
        </button>

        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              overflow: "hidden",
              margin: "0 auto 20px",
              border: "2px solid rgba(201,168,76,0.2)",
            }}
          >
            <img src="/selo.png" alt="Aurum" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>

          <h1
            style={{
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 700,
              color: "#f0e8d0",
              fontFamily: "var(--font-display)",
              marginBottom: "14px",
              letterSpacing: "-0.01em",
            }}
          >
            Aurum Investimentos
          </h1>
          <p
            style={{
              fontSize: "15px",
              color: "#6a5a3a",
              fontFamily: "var(--font-sans)",
              lineHeight: 1.7,
              maxWidth: "520px",
              margin: "0 auto",
            }}
          >
            Transformando conhecimento em patrimônio através de educação
            financeira e análises inteligentes.
          </p>
        </div>

        {/* Nossa História */}
        <section style={{ marginBottom: "48px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
            <TrendingUp size={16} style={{ color: "#C9A84C" }} />
            <h2 style={{ fontSize: "20px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-display)" }}>
              Nossa História
            </h2>
          </div>
          <div
            style={{
              background: "#130f09",
              border: "1px solid rgba(201,168,76,0.1)",
              borderRadius: "12px",
              padding: "28px 32px",
            }}
          >
            <p style={{ fontSize: "14px", color: "#8a7a5a", fontFamily: "var(--font-sans)", lineHeight: 1.8, marginBottom: "16px" }}>
              A Aurum nasceu com o propósito de democratizar o acesso à educação financeira de qualidade no Brasil.
              Fundada por investidores apaixonados, nossa missão é capacitar pessoas a tomarem decisões financeiras mais
              inteligentes e construírem patrimônio de forma sustentável.
            </p>
            <p style={{ fontSize: "14px", color: "#8a7a5a", fontFamily: "var(--font-sans)", lineHeight: 1.8, margin: 0 }}>
              Combinamos análises profundas de mercado, cursos práticos e uma comunidade ativa para criar o ecossistema
              completo que o investidor brasileiro precisa para prosperar no mercado financeiro.
            </p>
          </div>
        </section>

        {/* Missão, Visão e Valores */}
        <section style={{ marginBottom: "48px" }}>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 600,
              color: "#e8dcc0",
              fontFamily: "var(--font-display)",
              textAlign: "center",
              marginBottom: "24px",
            }}
          >
            Missão, Visão e Valores
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
            {MVV.map(({ icon: Icon, label, color, bg, border, text, type }) => (
              <div
                key={label}
                style={{
                  background: "#130f09",
                  border: `1px solid ${border}`,
                  borderRadius: "12px",
                  padding: "24px 20px",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "14px",
                    color,
                  }}
                >
                  <Icon size={20} />
                </div>
                <p style={{ fontSize: "15px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-sans)", marginBottom: "10px" }}>
                  {label}
                </p>
                {type === "text" ? (
                  <p style={{ fontSize: "13px", color: "#7a6a4a", fontFamily: "var(--font-sans)", lineHeight: 1.7, margin: 0 }}>
                    {text}
                  </p>
                ) : (
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                    {VALORES.map((v) => (
                      <li key={v} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Check size={12} style={{ color, flexShrink: 0 }} />
                        <span style={{ fontSize: "13px", color: "#7a6a4a", fontFamily: "var(--font-sans)" }}>{v}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* O que nos torna únicos */}
        <section style={{ marginBottom: "48px" }}>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 600,
              color: "#e8dcc0",
              fontFamily: "var(--font-display)",
              textAlign: "center",
              marginBottom: "24px",
            }}
          >
            O que nos torna únicos
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {DIFERENCIAIS.map(({ icon: Icon, label, text, color, bg }) => (
              <div
                key={label}
                style={{
                  background: "#130f09",
                  border: "1px solid rgba(201,168,76,0.08)",
                  borderRadius: "12px",
                  padding: "22px 24px",
                  display: "flex",
                  gap: "16px",
                  alignItems: "flex-start",
                  transition: "border-color 0.2s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(201,168,76,0.2)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(201,168,76,0.08)"; }}
              >
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "10px",
                    background: bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color,
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} />
                </div>
                <div>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-sans)", marginBottom: "6px" }}>
                    {label}
                  </p>
                  <p style={{ fontSize: "13px", color: "#6a5a3a", fontFamily: "var(--font-sans)", lineHeight: 1.65, margin: 0 }}>
                    {text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div
          style={{
            background: "linear-gradient(135deg, #1a0f2e 0%, #130f1a 50%, #0f1520 100%)",
            border: "1px solid rgba(139,92,246,0.2)",
            borderRadius: "16px",
            padding: "40px 32px",
            textAlign: "center",
          }}
        >
          <h3
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "#f0e8d0",
              fontFamily: "var(--font-display)",
              marginBottom: "12px",
              letterSpacing: "-0.01em",
            }}
          >
            Pronto para transformar seus investimentos?
          </h3>
          <p
            style={{
              fontSize: "14px",
              color: "#7a6a8a",
              fontFamily: "var(--font-sans)",
              lineHeight: 1.7,
              marginBottom: "28px",
              maxWidth: "440px",
              margin: "0 auto 28px",
            }}
          >
            Junte-se a milhares de investidores que estão construindo patrimônio
            de forma inteligente com a Aurum.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              background: "linear-gradient(135deg, #C9A84C 0%, #A07820 100%)",
              border: "none",
              borderRadius: "8px",
              padding: "13px 32px",
              color: "#0d0b07",
              fontSize: "14px",
              fontWeight: 600,
              fontFamily: "var(--font-sans)",
              cursor: "pointer",
              letterSpacing: "0.04em",
              transition: "box-shadow 0.2s",
              boxShadow: "0 2px 16px rgba(201,168,76,0.25)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 24px rgba(201,168,76,0.4)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 2px 16px rgba(201,168,76,0.25)"; }}
          >
            Começar agora
          </button>
        </div>

      </div>
    </div>
  );
}
