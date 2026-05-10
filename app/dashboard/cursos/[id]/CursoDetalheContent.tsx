"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Clock, BookOpen, Users, CheckCircle2, ChevronDown,
  Play, Award, Sparkles, PlayCircle,
} from "lucide-react";
import {
  type Curso, CATEGORIA_LABEL, NIVEL_LABEL,
} from "@/lib/cursos-data";
import { enrollInCourse, progressFromLessons } from "@/lib/enrollment";

interface InitialEnrollment {
  progress: number;
  completed_lessons: string[];
  started_at: string | null;
  completed_at: string | null;
}

export default function CursoDetalheContent({
  curso, userEmail, initialEnrollment,
}: {
  curso: Curso;
  userEmail: string;
  initialEnrollment: InitialEnrollment | null;
}) {
  const router = useRouter();
  const [moduloAberto, setModuloAberto] = useState<string | null>(curso.modulos[0]?.id ?? null);
  const [enrollment, setEnrollment] = useState<InitialEnrollment | null>(initialEnrollment);
  const [enrolling, setEnrolling] = useState(false);
  const [heroFailed, setHeroFailed] = useState(false);
  const heroImgRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const img = heroImgRef.current;
    if (img && img.complete && img.naturalWidth === 0) setHeroFailed(true);
  }, []);

  const matriculado = enrollment !== null;
  const progresso = enrollment ? progressFromLessons(curso, enrollment.completed_lessons) : 0;

  const primeiraAula = curso.modulos[0]?.aulas[0];

  async function handleCta() {
    if (matriculado) {
      const completed = new Set(enrollment?.completed_lessons ?? []);
      const next = curso.modulos.flatMap((m) => m.aulas).find((a) => !completed.has(a.id))
        ?? primeiraAula;
      if (next) router.push(`/dashboard/cursos/${curso.id}/aulas/${next.id}`);
      return;
    }
    setEnrolling(true);
    const ok = await enrollInCourse(userEmail, curso.id);
    setEnrolling(false);
    if (ok) {
      setEnrollment({ progress: 0, completed_lessons: [], started_at: new Date().toISOString().slice(0, 10), completed_at: null });
      if (primeiraAula) router.push(`/dashboard/cursos/${curso.id}/aulas/${primeiraAula.id}`);
    }
  }

  return (
    <div style={{ minHeight: "calc(100vh - 58px)", background: "#0a0806" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 24px 64px" }}>
        {/* Voltar */}
        <button
          onClick={() => router.push("/dashboard/cursos")}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            background: "none", border: "none", cursor: "pointer",
            color: "#a09068", fontSize: "13px",
            fontFamily: "var(--font-sans)", padding: 0, marginBottom: "24px",
            transition: "color 0.15s",
          }}
          className="aurum-hover-gold aurum-hover-transition"
        >
          <ChevronLeft size={15} /> Voltar para cursos
        </button>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "32px" }}>
          {/* Coluna principal */}
          <div>
            {/* Hero image (sem badge sobreposto, overlay leve, fallback tonal) */}
            <div style={{
              position: "relative",
              borderRadius: "14px",
              overflow: "hidden",
              marginBottom: "28px",
              height: "260px",
              border: "1px solid rgba(201,168,76,0.12)",
              background: "linear-gradient(135deg, #1a1410 0%, #130f09 60%, #0d0b07 100%)",
            }}>
              {!heroFailed && (
                <img
                  ref={heroImgRef}
                  src={curso.imagem}
                  alt={curso.titulo}
                  onError={() => setHeroFailed(true)}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              )}
              {heroFailed && (
                <div style={{
                  position: "absolute", inset: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "rgba(201,168,76,0.35)",
                }}>
                  <BookOpen size={56} strokeWidth={1.2} />
                </div>
              )}
              {/* Overlay sutil só pra ancorar na borda inferior */}
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(180deg, transparent 60%, rgba(13,11,7,0.35) 100%)",
                pointerEvents: "none",
              }} />
            </div>

            {/* Bestseller eyebrow tipográfico */}
            {curso.bestseller && (
              <p style={{
                fontSize: "10px", fontWeight: 600, color: "#a09068",
                fontFamily: "var(--font-sans)",
                letterSpacing: "0.14em", textTransform: "uppercase",
                marginBottom: "12px",
              }}>
                Bestseller
              </p>
            )}

            {/* Badges */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              <Badge color="#C9A84C">{CATEGORIA_LABEL[curso.categoria]}</Badge>
              <Badge color="#34d399">{NIVEL_LABEL[curso.nivel]}</Badge>
            </div>

            {/* Título */}
            <h1 style={{
              fontSize: "32px", fontWeight: 700, color: "#e8dcc0",
              fontFamily: "var(--font-display)", marginBottom: "14px",
              letterSpacing: "-0.01em", lineHeight: 1.18,
            }}>
              {curso.titulo}
            </h1>

            {/* Descrição */}
            <p style={{
              fontSize: "15px", color: "#a09068", fontFamily: "var(--font-sans)",
              lineHeight: 1.65, marginBottom: "20px", maxWidth: "62ch",
            }}>
              {curso.descricao}
            </p>

            {/* Métricas */}
            <div style={{
              display: "flex", gap: "24px", flexWrap: "wrap",
              fontSize: "13px", color: "#a09068", fontFamily: "var(--font-sans)",
              marginBottom: "24px",
            }}>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Clock size={14} style={{ color: "#C9A84C" }} /> {curso.duracaoHoras} horas
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <BookOpen size={14} style={{ color: "#C9A84C" }} /> {curso.totalAulas} aulas
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Users size={14} style={{ color: "#C9A84C" }} /> {curso.alunos.toLocaleString("pt-BR")} alunos
              </span>
            </div>

            {/* CTA + Status (inline, sem card sticky, botão menor calmo) */}
            <div style={{
              display: "flex", flexDirection: "column", gap: "14px",
              marginBottom: "32px",
            }}>
              {matriculado ? (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                    <button
                      onClick={handleCta}
                      style={{
                        background: "#C9A84C",
                        border: "none", borderRadius: "8px",
                        padding: "10px 18px", color: "#0d0b07",
                        fontSize: "13px", fontWeight: 600,
                        fontFamily: "var(--font-sans)", cursor: "pointer",
                        letterSpacing: "0.02em",
                        display: "flex", alignItems: "center", gap: "8px",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#E8C96A"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "#C9A84C"; }}
                    >
                      <Play size={12} fill="#0d0b07" />
                      Continuar curso
                    </button>
                    <span style={{
                      display: "flex", alignItems: "center", gap: "6px",
                      fontSize: "12px", color: "#34d399",
                      fontFamily: "var(--font-sans)",
                    }}>
                      <CheckCircle2 size={13} /> Você está matriculado
                    </span>
                  </div>
                  {/* Progresso */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxWidth: "420px" }}>
                    <div style={{
                      display: "flex", justifyContent: "space-between",
                      fontSize: "11px", color: "#a09068",
                      fontFamily: "var(--font-sans)",
                    }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <Award size={11} /> Progresso
                      </span>
                      <span style={{ color: "#C9A84C", fontWeight: 600 }}>{progresso}%</span>
                    </div>
                    <div style={{
                      width: "100%", height: "4px",
                      background: "rgba(201,168,76,0.08)", borderRadius: "2px",
                      overflow: "hidden",
                    }}>
                      <div style={{
                        width: `${progresso}%`, height: "100%",
                        background: "#C9A84C",
                        transition: "width 0.3s",
                      }} />
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                  <button
                    onClick={handleCta}
                    disabled={enrolling}
                    style={{
                      background: "#C9A84C",
                      border: "none", borderRadius: "8px",
                      padding: "10px 20px", color: "#0d0b07",
                      fontSize: "13px", fontWeight: 600,
                      fontFamily: "var(--font-sans)",
                      cursor: enrolling ? "wait" : "pointer",
                      letterSpacing: "0.02em",
                      display: "flex", alignItems: "center", gap: "8px",
                      transition: "background 0.15s",
                      opacity: enrolling ? 0.7 : 1,
                    }}
                    onMouseEnter={(e) => { if (!enrolling) e.currentTarget.style.background = "#E8C96A"; }}
                    onMouseLeave={(e) => { if (!enrolling) e.currentTarget.style.background = "#C9A84C"; }}
                  >
                    <Play size={12} fill="#0d0b07" />
                    {enrolling ? "Matriculando..." : "Matricular"}
                  </button>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
                    <span style={{
                      fontSize: "20px", fontWeight: 600, color: "#e8dcc0",
                      fontFamily: "var(--font-display)",
                    }}>
                      R$ {curso.preco.toFixed(2).replace(".", ",")}
                    </span>
                    {curso.precoOriginal && (
                      <span style={{
                        fontSize: "12px", color: "#9a8a6a",
                        textDecoration: "line-through",
                        fontFamily: "var(--font-sans)",
                      }}>
                        De R$ {curso.precoOriginal.toFixed(2).replace(".", ",")}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Regra horizontal */}
            <div style={{ height: "1px", background: "rgba(201,168,76,0.10)", marginBottom: "28px" }} />

            {/* O que vai aprender (sem card) */}
            <h2 style={{
              fontSize: "18px", fontWeight: 600, color: "#e8dcc0",
              fontFamily: "var(--font-display)", marginBottom: "18px",
              letterSpacing: "-0.005em",
            }}>
              O que você vai aprender
            </h2>
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "14px",
              marginBottom: "32px",
            }}>
              {curso.aprendizado.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                  <CheckCircle2 size={15} style={{ color: "#34d399", flexShrink: 0, marginTop: "1px" }} />
                  <span style={{ fontSize: "13px", color: "#a09068", fontFamily: "var(--font-sans)", lineHeight: 1.55 }}>
                    {item}
                  </span>
                </div>
              ))}
            </div>

            {/* Regra horizontal */}
            <div style={{ height: "1px", background: "rgba(201,168,76,0.10)", marginBottom: "28px" }} />

            {/* Conteúdo do Curso (card faz sentido aqui como container de lista densa) */}
            <div style={{ background: "#130f09", border: "1px solid rgba(201,168,76,0.1)", borderRadius: "14px", padding: "24px 28px" }}>
              <h2 style={{
                fontSize: "16px", fontWeight: 600, color: "#e8dcc0",
                fontFamily: "var(--font-display)", marginBottom: "16px",
              }}>
                Conteúdo do Curso
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {curso.modulos.map((modulo, idx) => {
                  const aberto = moduloAberto === modulo.id;
                  return (
                    <div key={modulo.id} style={{
                      background: "#0d0b07",
                      border: "1px solid rgba(201,168,76,0.08)",
                      borderRadius: "10px", overflow: "hidden",
                    }}>
                      <button
                        onClick={() => setModuloAberto(aberto ? null : modulo.id)}
                        style={{
                          width: "100%", display: "flex", alignItems: "center",
                          gap: "12px", padding: "14px 18px",
                          background: "transparent", border: "none", cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <div style={{
                          width: "28px", height: "28px", borderRadius: "50%",
                          background: "rgba(201,168,76,0.1)", color: "#C9A84C",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "12px", fontWeight: 700, flexShrink: 0,
                          fontFamily: "var(--font-sans)",
                        }}>
                          {idx + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{
                            fontSize: "14px", fontWeight: 600, color: "#e8dcc0",
                            fontFamily: "var(--font-sans)", marginBottom: "2px",
                          }}>
                            {modulo.titulo}
                          </p>
                          <p style={{ fontSize: "11px", color: "#a09068", fontFamily: "var(--font-sans)" }}>
                            {modulo.aulas.length} aulas
                          </p>
                        </div>
                        <ChevronDown
                          size={16}
                          style={{
                            color: "#a09068",
                            transform: aberto ? "rotate(180deg)" : "rotate(0deg)",
                            transition: "transform 0.2s",
                          }}
                        />
                      </button>
                      {aberto && (
                        <div style={{
                          padding: "0 18px 14px 58px",
                          display: "flex", flexDirection: "column", gap: "4px",
                        }}>
                          {modulo.aulas.map((aula) => (
                            <button
                              key={aula.id}
                              onClick={() => router.push(`/dashboard/cursos/${curso.id}/aulas/${aula.id}`)}
                              style={{
                                display: "flex", alignItems: "center", gap: "10px",
                                padding: "8px 10px", borderRadius: "6px",
                                background: "transparent", border: "none",
                                cursor: "pointer", textAlign: "left",
                                transition: "background 0.15s",
                              }}
                              className="aurum-hover-bg aurum-hover-transition"
                            >
                              <PlayCircle size={13} style={{ color: "#a09068" }} />
                              <span style={{ flex: 1, fontSize: "13px", color: "#a09068", fontFamily: "var(--font-sans)" }}>
                                {aula.titulo}
                              </span>
                              <span style={{ fontSize: "11px", color: "#a09068", fontFamily: "var(--font-sans)" }}>
                                {aula.duracaoMin} min
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar — só Próximos Passos, sem sticky */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", height: "fit-content" }}>
            {curso.proximoPasso && (
              <div style={{
                background: "#130f09",
                border: "1px solid rgba(201,168,76,0.1)",
                borderRadius: "14px", padding: "20px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                  <Sparkles size={14} style={{ color: "#C9A84C" }} />
                  <span style={{
                    fontSize: "12px", fontWeight: 600, color: "#C9A84C",
                    fontFamily: "var(--font-sans)", letterSpacing: "0.04em",
                  }}>
                    Próximos Passos
                  </span>
                </div>
                <button
                  onClick={() => router.push(`/dashboard/cursos/${curso.proximoPasso!.id}`)}
                  style={{
                    width: "100%",
                    display: "flex", gap: "12px",
                    background: "#0d0b07",
                    border: "1px solid rgba(201,168,76,0.08)",
                    borderRadius: "10px", padding: "10px",
                    cursor: "pointer", textAlign: "left",
                    transition: "border-color 0.15s",
                  }}
                  className="aurum-hover-border aurum-hover-transition"
                >
                  <div style={{
                    width: "60px", height: "60px",
                    borderRadius: "8px",
                    background: "linear-gradient(135deg, #1a1410, #2a1f12)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#C9A84C", flexShrink: 0,
                  }}>
                    <BookOpen size={20} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: "13px", fontWeight: 600, color: "#e8dcc0",
                      fontFamily: "var(--font-sans)", marginBottom: "4px",
                      lineHeight: 1.3,
                    }}>
                      {curso.proximoPasso.titulo}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "11px", color: "#a09068", display: "flex", alignItems: "center", gap: "3px" }}>
                        <Clock size={9} /> {curso.proximoPasso.duracaoHoras}h
                      </span>
                      <span style={{
                        fontSize: "11px", fontWeight: 600, color: "#C9A84C",
                        fontFamily: "var(--font-display)",
                      }}>
                        R$ {curso.proximoPasso.preco.toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span style={{
      fontSize: "10px", fontWeight: 600, color,
      background: `${color}1a`,
      padding: "4px 10px", borderRadius: "5px",
      fontFamily: "var(--font-sans)", letterSpacing: "0.06em",
    }}>
      {children}
    </span>
  );
}
