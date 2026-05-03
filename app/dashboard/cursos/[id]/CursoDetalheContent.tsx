"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Clock, BookOpen, Users, CheckCircle2, ChevronDown,
  Play, Award, Sparkles, PlayCircle,
} from "lucide-react";
import {
  type Curso, CATEGORIA_LABEL, NIVEL_LABEL,
} from "@/lib/cursos-data";

export default function CursoDetalheContent({ curso }: { curso: Curso }) {
  const router = useRouter();
  const [moduloAberto, setModuloAberto] = useState<string | null>(curso.modulos[0]?.id ?? null);

  const primeiraAula = curso.modulos[0]?.aulas[0];

  function continuarCurso() {
    if (primeiraAula) {
      router.push(`/dashboard/cursos/${curso.id}/aulas/${primeiraAula.id}`);
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
            color: "#7a6a4a", fontSize: "13px",
            fontFamily: "var(--font-sans)", padding: 0, marginBottom: "24px",
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#C9A84C"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#7a6a4a"; }}
        >
          <ChevronLeft size={15} /> Voltar para cursos
        </button>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px" }}>
          {/* Coluna principal */}
          <div>
            {/* Hero image */}
            <div style={{
              position: "relative",
              borderRadius: "14px",
              overflow: "hidden",
              marginBottom: "24px",
              height: "260px",
              border: "1px solid rgba(201,168,76,0.1)",
            }}>
              <img
                src={curso.imagem}
                alt={curso.titulo}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(180deg, rgba(13,11,7,0.2) 0%, rgba(13,11,7,0.7) 100%)",
              }} />
              {curso.bestseller && (
                <span style={{
                  position: "absolute", top: "16px", left: "16px",
                  background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
                  color: "#fff", fontSize: "11px", fontWeight: 700,
                  padding: "5px 12px", borderRadius: "6px",
                  fontFamily: "var(--font-sans)", letterSpacing: "0.06em",
                  display: "flex", alignItems: "center", gap: "5px",
                }}>
                  <Sparkles size={11} /> Bestseller
                </span>
              )}
            </div>

            {/* Badges + Título */}
            <div style={{ background: "#130f09", border: "1px solid rgba(201,168,76,0.1)", borderRadius: "14px", padding: "28px 32px", marginBottom: "20px" }}>
              <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                <Badge color="#C9A84C">{CATEGORIA_LABEL[curso.categoria]}</Badge>
                <Badge color="#10b981">{NIVEL_LABEL[curso.nivel]}</Badge>
              </div>
              <h1 style={{
                fontSize: "28px", fontWeight: 700, color: "#e8dcc0",
                fontFamily: "var(--font-display)", marginBottom: "12px",
                letterSpacing: "-0.01em", lineHeight: 1.2,
              }}>
                {curso.titulo}
              </h1>
              <p style={{
                fontSize: "14px", color: "#8a7a5a", fontFamily: "var(--font-sans)",
                lineHeight: 1.7, marginBottom: "20px",
              }}>
                {curso.descricao}
              </p>
              <div style={{
                display: "flex", gap: "20px", paddingTop: "16px",
                borderTop: "1px solid rgba(201,168,76,0.08)",
                fontSize: "13px", color: "#9a8a6a", fontFamily: "var(--font-sans)",
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
            </div>

            {/* O que vai aprender */}
            <div style={{ background: "#130f09", border: "1px solid rgba(201,168,76,0.1)", borderRadius: "14px", padding: "24px 28px", marginBottom: "20px" }}>
              <h2 style={{
                fontSize: "16px", fontWeight: 600, color: "#e8dcc0",
                fontFamily: "var(--font-display)", marginBottom: "16px",
              }}>
                O que você vai aprender
              </h2>
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px",
              }}>
                {curso.aprendizado.map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <CheckCircle2 size={15} style={{ color: "#10b981", flexShrink: 0, marginTop: "1px" }} />
                    <span style={{ fontSize: "13px", color: "#9a8a6a", fontFamily: "var(--font-sans)", lineHeight: 1.5 }}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Conteúdo do Curso */}
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
                          <p style={{ fontSize: "11px", color: "#6a5a3a", fontFamily: "var(--font-sans)" }}>
                            {modulo.aulas.length} aulas
                          </p>
                        </div>
                        <ChevronDown
                          size={16}
                          style={{
                            color: "#7a6a4a",
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
                              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(201,168,76,0.05)"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                            >
                              <PlayCircle size={13} style={{ color: "#7a6a4a" }} />
                              <span style={{ flex: 1, fontSize: "13px", color: "#9a8a6a", fontFamily: "var(--font-sans)" }}>
                                {aula.titulo}
                              </span>
                              <span style={{ fontSize: "11px", color: "#5a4a2a", fontFamily: "var(--font-sans)" }}>
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

          {/* Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", height: "fit-content", position: "sticky", top: "78px" }}>
            {/* Status / CTA */}
            <div style={{
              background: "#130f09",
              border: "1px solid rgba(16,185,129,0.2)",
              borderRadius: "14px", padding: "24px",
            }}>
              {curso.matriculado ? (
                <>
                  <div style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    color: "#10b981", marginBottom: "6px",
                  }}>
                    <CheckCircle2 size={16} />
                    <span style={{ fontSize: "14px", fontWeight: 600, fontFamily: "var(--font-sans)" }}>
                      Você está matriculado!
                    </span>
                  </div>
                  <p style={{ fontSize: "12px", color: "#7a6a4a", fontFamily: "var(--font-sans)", marginBottom: "16px" }}>
                    Continue de onde parou.
                  </p>
                </>
              ) : (
                <>
                  <p style={{
                    fontSize: "20px", fontWeight: 700, color: "#C9A84C",
                    fontFamily: "var(--font-display)", marginBottom: "4px",
                  }}>
                    R$ {curso.preco.toFixed(2).replace(".", ",")}
                  </p>
                  {curso.precoOriginal && (
                    <p style={{
                      fontSize: "12px", color: "#5a4a2a",
                      textDecoration: "line-through",
                      fontFamily: "var(--font-sans)", marginBottom: "16px",
                    }}>
                      De R$ {curso.precoOriginal.toFixed(2).replace(".", ",")}
                    </p>
                  )}
                </>
              )}

              <button
                onClick={continuarCurso}
                style={{
                  width: "100%",
                  background: "linear-gradient(135deg, #C9A84C 0%, #A07820 100%)",
                  border: "none", borderRadius: "8px",
                  padding: "12px 18px", color: "#0d0b07",
                  fontSize: "13px", fontWeight: 600,
                  fontFamily: "var(--font-sans)", cursor: "pointer",
                  letterSpacing: "0.04em",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  boxShadow: "0 2px 14px rgba(201,168,76,0.25)",
                  transition: "box-shadow 0.15s",
                  marginBottom: "10px",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 22px rgba(201,168,76,0.4)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 2px 14px rgba(201,168,76,0.25)"; }}
              >
                <Play size={13} fill="#0d0b07" />
                {curso.matriculado ? "Continuar Curso" : "Comprar Curso"}
              </button>

              {curso.matriculado && curso.progresso !== undefined && (
                <button
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "1px solid rgba(201,168,76,0.3)",
                    borderRadius: "8px",
                    padding: "10px 18px",
                    color: "#C9A84C",
                    fontSize: "12px", fontWeight: 500,
                    fontFamily: "var(--font-sans)", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(201,168,76,0.05)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <Award size={12} />
                  Prova Concluída ({curso.progresso}%)
                </button>
              )}
            </div>

            {/* Próximos Passos */}
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
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.08)"; }}
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
                      <span style={{ fontSize: "11px", color: "#5a4a2a", display: "flex", alignItems: "center", gap: "3px" }}>
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
