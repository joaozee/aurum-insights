"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Clock, BookOpen, Users, CheckCircle2, ChevronDown,
  Play, Award, Sparkles, PlayCircle, Loader2, X,
} from "lucide-react";
import { toast } from "sonner";
import {
  type Curso, CATEGORIA_LABEL, NIVEL_LABEL,
} from "@/lib/cursos-data";
import { enrollInCourse, progressFromLessons } from "@/lib/enrollment";
import { CourseCover } from "@/components/ui/course-cover";

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
  // Set permite múltiplos módulos abertos (poder revisar dois ao mesmo tempo).
  // Inicia com o primeiro aberto pra que o usuário veja conteúdo sem clicar.
  const [modulosAbertos, setModulosAbertos] = useState<Set<string>>(
    () => new Set(curso.modulos[0]?.id ? [curso.modulos[0].id] : [])
  );
  const toggleModulo = (id: string) =>
    setModulosAbertos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const [enrollment, setEnrollment] = useState<InitialEnrollment | null>(initialEnrollment);
  const [confirming, setConfirming] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  const matriculado = enrollment !== null;
  const progresso = enrollment ? progressFromLessons(curso, enrollment.completed_lessons) : 0;

  const primeiraAula = curso.modulos[0]?.aulas[0];

  // Set de aulas concluídas, recomputado quando enrollment muda.
  const completedSet = useMemo(
    () => new Set(enrollment?.completed_lessons ?? []),
    [enrollment]
  );
  // Próxima aula = primeira não concluída (ou primeira do curso, se nada feito).
  // Usado pra destacar no accordion E pra direcionar "Continuar curso".
  const proximaAulaId = useMemo(() => {
    const found = curso.modulos
      .flatMap((m) => m.aulas)
      .find((a) => !completedSet.has(a.id));
    return found?.id ?? primeiraAula?.id ?? null;
  }, [completedSet, curso.modulos, primeiraAula]);

  function handleContinuar() {
    if (proximaAulaId) {
      router.push(`/dashboard/cursos/${curso.id}/aulas/${proximaAulaId}`);
    }
  }

  async function handleConfirmarMatricula() {
    if (enrolling) return;
    setEnrolling(true);
    try {
      await enrollInCourse(userEmail, curso.id);
      setEnrollment({
        progress: 0,
        completed_lessons: [],
        started_at: new Date().toISOString().slice(0, 10),
        completed_at: null,
      });
      toast.success("Matrícula confirmada.", {
        description: "Bons estudos.",
      });
      if (primeiraAula) {
        router.push(`/dashboard/cursos/${curso.id}/aulas/${primeiraAula.id}`);
      } else {
        setConfirming(false);
        setEnrolling(false);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro inesperado.";
      console.error("[CursoDetalheContent] enroll failed:", err);
      toast.error("Não consegui matricular agora.", {
        description: msg,
        action: {
          label: "Tentar de novo",
          onClick: () => handleConfirmarMatricula(),
        },
      });
      setEnrolling(false);
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
            {/* Hero — CourseCover trata fallback editorial automático */}
            <div style={{
              borderRadius: "14px",
              overflow: "hidden",
              marginBottom: "28px",
              border: "1px solid rgba(201,168,76,0.12)",
            }}>
              <CourseCover
                src={curso.imagem}
                title={curso.titulo}
                categoria={curso.categoria}
                index={1}
                height={260}
                numberSize={104}
                eager
              />
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
              <Badge color="var(--positive)" bg="var(--positive-bg)">{NIVEL_LABEL[curso.nivel]}</Badge>
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
                      onClick={handleContinuar}
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
                      fontSize: "12px", color: "var(--positive)",
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
                    <div
                      role="progressbar"
                      aria-valuenow={progresso}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="Progresso do curso"
                      style={{
                        width: "100%", height: "4px",
                        background: "rgba(201,168,76,0.08)", borderRadius: "2px",
                        overflow: "hidden",
                      }}
                    >
                      <div style={{
                        width: "100%", height: "100%",
                        background: "#C9A84C",
                        transformOrigin: "left center",
                        transform: `scaleX(${progresso / 100})`,
                        transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                      }} />
                    </div>
                  </div>
                </>
              ) : !confirming ? (
                /* Estado inicial: preço + botão "Matricular" */
                <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                  <button
                    onClick={() => setConfirming(true)}
                    style={{
                      background: "#C9A84C",
                      border: "none", borderRadius: "8px",
                      padding: "10px 20px", color: "#0d0b07",
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
                    Matricular
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
              ) : (
                /* Estado de confirmação: review + Confirmar/Cancelar */
                <div
                  role="dialog"
                  aria-label="Confirmar matrícula"
                  aria-busy={enrolling}
                  style={{
                    background: "rgba(201,168,76,0.05)",
                    border: "1px solid rgba(201,168,76,0.25)",
                    borderRadius: "10px",
                    padding: "18px 20px",
                    maxWidth: "560px",
                    display: "flex", flexDirection: "column", gap: "14px",
                  }}
                >
                  <p style={{
                    fontSize: "13px", color: "#c8b89a",
                    fontFamily: "var(--font-sans)", lineHeight: 1.55,
                  }}>
                    Confirmar matrícula em <strong style={{ color: "#e8dcc0", fontWeight: 600 }}>{curso.titulo}</strong>{" "}
                    por <strong style={{ color: "#C9A84C", fontWeight: 600 }}>R$ {curso.preco.toFixed(2).replace(".", ",")}</strong>?
                  </p>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                    <button
                      onClick={handleConfirmarMatricula}
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
                      {enrolling ? (
                        <>
                          <Loader2 size={13} className="aurum-spin" />
                          Confirmando...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={13} />
                          Confirmar matrícula
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setConfirming(false)}
                      disabled={enrolling}
                      style={{
                        background: "transparent",
                        border: "1px solid rgba(201,168,76,0.2)",
                        borderRadius: "8px",
                        padding: "10px 16px", color: "#a09068",
                        fontSize: "13px", fontWeight: 500,
                        fontFamily: "var(--font-sans)",
                        cursor: enrolling ? "not-allowed" : "pointer",
                        letterSpacing: "0.02em",
                        display: "flex", alignItems: "center", gap: "6px",
                        transition: "color 0.15s, border-color 0.15s",
                        opacity: enrolling ? 0.5 : 1,
                      }}
                      onMouseEnter={(e) => {
                        if (!enrolling) {
                          e.currentTarget.style.color = "#e8dcc0";
                          e.currentTarget.style.borderColor = "rgba(201,168,76,0.4)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "#a09068";
                        e.currentTarget.style.borderColor = "rgba(201,168,76,0.2)";
                      }}
                    >
                      <X size={13} />
                      Cancelar
                    </button>
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
                  <CheckCircle2 size={15} style={{ color: "var(--positive)", flexShrink: 0, marginTop: "1px" }} />
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
                  const aberto = modulosAbertos.has(modulo.id);
                  const concluidasNoModulo = modulo.aulas.filter((a) => completedSet.has(a.id)).length;
                  const moduloCompleto = matriculado && concluidasNoModulo === modulo.aulas.length && modulo.aulas.length > 0;
                  const moduloProg = modulo.aulas.length === 0
                    ? 0
                    : Math.round((concluidasNoModulo / modulo.aulas.length) * 100);
                  return (
                    <div key={modulo.id} style={{
                      background: "#0d0b07",
                      border: "1px solid rgba(201,168,76,0.08)",
                      borderRadius: "10px", overflow: "hidden",
                    }}>
                      <button
                        onClick={() => toggleModulo(modulo.id)}
                        aria-expanded={aberto}
                        aria-controls={`modulo-${modulo.id}-aulas`}
                        style={{
                          width: "100%", display: "flex", alignItems: "center",
                          gap: "12px", padding: "14px 18px",
                          background: "transparent", border: "none", cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <div style={{
                          width: "28px", height: "28px", borderRadius: "50%",
                          background: moduloCompleto ? "var(--positive)" : "rgba(201,168,76,0.1)",
                          color: moduloCompleto ? "#0a0806" : "#C9A84C",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "12px", fontWeight: 700, flexShrink: 0,
                          fontFamily: "var(--font-sans)",
                          transition: "background 0.2s",
                        }}>
                          {moduloCompleto ? <CheckCircle2 size={14} /> : idx + 1}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            fontSize: "14px", fontWeight: 600, color: "#e8dcc0",
                            fontFamily: "var(--font-sans)", marginBottom: "5px",
                            lineHeight: 1.3,
                          }}>
                            {modulo.titulo}
                          </p>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <p style={{
                              fontSize: "11px", color: "#a09068",
                              fontFamily: "var(--font-sans)",
                              fontVariantNumeric: "tabular-nums",
                              flexShrink: 0,
                            }}>
                              {modulo.aulas.length} aulas
                              {matriculado && concluidasNoModulo > 0 && (
                                <>
                                  <span style={{ color: "#7a6a4a", margin: "0 6px" }}>·</span>
                                  <span style={{ color: moduloCompleto ? "var(--positive)" : "#a09068", fontWeight: 500 }}>
                                    {concluidasNoModulo} {concluidasNoModulo === 1 ? "concluída" : "concluídas"}
                                  </span>
                                </>
                              )}
                            </p>
                            {matriculado && modulo.aulas.length > 0 && (
                              <div
                                role="progressbar"
                                aria-valuenow={moduloProg}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label={`Progresso do módulo ${idx + 1}`}
                                style={{
                                  flex: 1, maxWidth: "120px", height: "3px",
                                  background: "rgba(201,168,76,0.08)",
                                  borderRadius: "2px", overflow: "hidden",
                                }}
                              >
                                <div style={{
                                  width: "100%", height: "100%",
                                  background: moduloCompleto ? "var(--positive)" : "#C9A84C",
                                  transformOrigin: "left center",
                                  transform: `scaleX(${moduloProg / 100})`,
                                  transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                                }} />
                              </div>
                            )}
                          </div>
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
                        <div
                          id={`modulo-${modulo.id}-aulas`}
                          style={{
                            padding: "0 18px 14px 58px",
                            display: "flex", flexDirection: "column", gap: "4px",
                          }}
                        >
                          {modulo.aulas.map((aula) => {
                            const concluida = completedSet.has(aula.id);
                            const isProxima = matriculado && aula.id === proximaAulaId;
                            const Icon = concluida ? CheckCircle2 : PlayCircle;
                            const iconColor = concluida
                              ? "var(--positive)"
                              : isProxima
                              ? "#C9A84C"
                              : "#a09068";
                            const titleColor = isProxima
                              ? "#e8dcc0"
                              : "#a09068";
                            return (
                              <button
                                key={aula.id}
                                onClick={() => router.push(`/dashboard/cursos/${curso.id}/aulas/${aula.id}`)}
                                style={{
                                  display: "flex", alignItems: "flex-start", gap: "10px",
                                  padding: "10px 12px", borderRadius: "6px",
                                  background: isProxima ? "rgba(201,168,76,0.06)" : "transparent",
                                  border: "1px solid",
                                  borderColor: isProxima ? "rgba(201,168,76,0.18)" : "transparent",
                                  cursor: "pointer", textAlign: "left",
                                  transition: "background 0.15s, border-color 0.15s",
                                  minHeight: "40px",
                                }}
                                className={isProxima ? undefined : "aurum-hover-bg aurum-hover-transition"}
                              >
                                <Icon size={14} style={{ color: iconColor, flexShrink: 0, marginTop: "2px" }} />
                                <span style={{
                                  flex: 1, minWidth: 0,
                                  fontSize: "13px",
                                  color: titleColor,
                                  fontWeight: isProxima ? 600 : 400,
                                  fontFamily: "var(--font-sans)",
                                  lineHeight: 1.4,
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                  overflow: "hidden",
                                  textDecoration: concluida ? "line-through" : "none",
                                  textDecorationColor: "rgba(160,144,104,0.5)",
                                }}>
                                  {aula.titulo}
                                </span>
                                {isProxima && (
                                  <span style={{
                                    fontSize: "10px", fontWeight: 600,
                                    color: "#C9A84C",
                                    fontFamily: "var(--font-sans)",
                                    letterSpacing: "0.08em",
                                    textTransform: "uppercase",
                                    flexShrink: 0,
                                    marginTop: "2px",
                                  }}>
                                    Próxima
                                  </span>
                                )}
                                <span style={{
                                  fontSize: "11px", color: "#a09068",
                                  fontFamily: "var(--font-sans)",
                                  fontVariantNumeric: "tabular-nums",
                                  flexShrink: 0, marginTop: "2px",
                                }}>
                                  {aula.duracaoMin} min
                                </span>
                              </button>
                            );
                          })}
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

function Badge({
  children, color, bg,
}: {
  children: React.ReactNode;
  color: string;
  /** bg explícito, pra cobrir tokens CSS (var(--x)) onde concat hex + alpha não funciona. */
  bg?: string;
}) {
  return (
    <span style={{
      fontSize: "10px", fontWeight: 600, color,
      background: bg ?? (color.startsWith("#") ? `${color}1a` : "rgba(201,168,76,0.10)"),
      padding: "4px 10px", borderRadius: "5px",
      fontFamily: "var(--font-sans)", letterSpacing: "0.06em",
    }}>
      {children}
    </span>
  );
}
