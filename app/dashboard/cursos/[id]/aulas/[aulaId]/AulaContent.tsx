"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, ChevronDown, Play, PlayCircle,
  CheckCircle2, GraduationCap, ArrowRight, Clock,
} from "lucide-react";
import {
  type Curso, CATEGORIA_LABEL, getProximaAula,
} from "@/lib/cursos-data";
import { setLessonComplete } from "@/lib/enrollment";

interface Props {
  curso: Curso;
  moduloAtualId: string;
  aulaAtualId: string;
  userEmail: string;
  initialCompletedLessons: string[];
}

export default function AulaContent({
  curso, moduloAtualId, aulaAtualId, userEmail, initialCompletedLessons,
}: Props) {
  const router = useRouter();
  const [moduloAberto, setModuloAberto] = useState<string | null>(moduloAtualId);
  const [completed, setCompleted] = useState<Set<string>>(new Set(initialCompletedLessons));
  const [marking, setMarking] = useState(false);

  const moduloAtual = curso.modulos.find((m) => m.id === moduloAtualId)!;
  const aulaAtual = moduloAtual.aulas.find((a) => a.id === aulaAtualId)!;
  const moduloIndex = curso.modulos.findIndex((m) => m.id === moduloAtualId);
  const aulaIndex = moduloAtual.aulas.findIndex((a) => a.id === aulaAtualId);
  const proxima = getProximaAula(curso.id, aulaAtualId);

  const flatAulas = useMemo(
    () => curso.modulos.flatMap((m) => m.aulas.map((a) => ({ moduloId: m.id, aulaId: a.id }))),
    [curso]
  );
  const totalAulas = flatAulas.length;
  const progressoCurso = totalAulas === 0 ? 0 : Math.round((completed.size / totalAulas) * 100);

  function aulaConcluida(globalIdx: number) {
    const aulaId = flatAulas[globalIdx]?.aulaId;
    return aulaId ? completed.has(aulaId) : false;
  }

  function moduloProgresso(moduloId: string) {
    const aulas = curso.modulos.find((m) => m.id === moduloId)?.aulas ?? [];
    if (aulas.length === 0) return 0;
    const concluidas = aulas.filter((a) => completed.has(a.id)).length;
    return Math.round((concluidas / aulas.length) * 100);
  }

  async function marcarConcluida() {
    if (marking || completed.has(aulaAtualId)) return;
    setMarking(true);
    const next = new Set(completed);
    next.add(aulaAtualId);
    setCompleted(next);
    await setLessonComplete(userEmail, curso.id, aulaAtualId, true);
    setMarking(false);
  }

  async function irParaProxima() {
    await marcarConcluida();
    if (proxima) {
      router.push(`/dashboard/cursos/${curso.id}/aulas/${proxima.aulaId}`);
    }
  }

  return (
    <div style={{ minHeight: "calc(100vh - 58px)", background: "#0a0806" }}>
      {/* Sub-header com curso */}
      <div style={{
        background: "#0d0b07",
        borderBottom: "1px solid rgba(201,168,76,0.08)",
      }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "8px",
            background: "rgba(201,168,76,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#C9A84C",
          }}>
            <GraduationCap size={16} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: "10px", fontWeight: 600, color: "#C9A84C",
              fontFamily: "var(--font-sans)", letterSpacing: "0.06em", marginBottom: "2px",
            }}>
              {CATEGORIA_LABEL[curso.categoria].toUpperCase()}
            </p>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-sans)" }}>
              {curso.titulo}
            </p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "24px 24px 64px" }}>
        {/* Voltar */}
        <button
          onClick={() => router.push(`/dashboard/cursos/${curso.id}`)}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            background: "none", border: "none", cursor: "pointer",
            color: "#a09068", fontSize: "13px",
            fontFamily: "var(--font-sans)", padding: 0, marginBottom: "20px",
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#C9A84C"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#a09068"; }}
        >
          <ChevronLeft size={15} /> Voltar para Curso
        </button>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "24px" }}>
          {/* Coluna principal */}
          <div>
            {/* Player */}
            <div style={{
              background: "#0d0b07",
              border: "1px solid rgba(201,168,76,0.1)",
              borderRadius: "14px",
              aspectRatio: "16 / 9",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: "8px", marginBottom: "16px",
            }}>
              <div style={{
                width: "64px", height: "64px",
                borderRadius: "50%",
                background: "rgba(201,168,76,0.1)",
                border: "1px solid rgba(201,168,76,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#C9A84C",
              }}>
                <Play size={26} fill="#C9A84C" />
              </div>
              <p style={{
                fontSize: "14px", color: "#9a8a6a",
                fontFamily: "var(--font-sans)", marginTop: "4px",
              }}>
                {aulaAtual.videoUrl ? "Carregando vídeo..." : "Vídeo não disponível"}
              </p>
              <p style={{ fontSize: "12px", color: "#9a8a6a", fontFamily: "var(--font-sans)" }}>
                {aulaAtual.videoUrl ? "" : "URL do vídeo não adicionada"}
              </p>
            </div>

            {/* Info da aula */}
            <div style={{
              background: "#130f09",
              border: "1px solid rgba(201,168,76,0.1)",
              borderRadius: "14px", padding: "24px 28px",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{
                  fontSize: "11px", fontWeight: 600, color: "#C9A84C",
                  fontFamily: "var(--font-sans)", letterSpacing: "0.06em",
                }}>
                  Módulo {moduloIndex + 1} · Aula {aulaIndex + 1}
                </span>
                <CheckCircle2 size={16} style={{ color: "#9a8a6a" }} />
              </div>
              <h1 style={{
                fontSize: "22px", fontWeight: 700, color: "#e8dcc0",
                fontFamily: "var(--font-display)", marginBottom: "10px",
                letterSpacing: "-0.01em",
              }}>
                {aulaAtual.titulo}
              </h1>
              <div style={{
                display: "flex", alignItems: "center", gap: "16px",
                fontSize: "12px", color: "#a09068", fontFamily: "var(--font-sans)",
                marginBottom: aulaAtual.descricao ? "16px" : "20px",
              }}>
                <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <Clock size={12} /> {aulaAtual.duracaoMin} minutos
                </span>
              </div>
              {aulaAtual.descricao && (
                <p style={{
                  fontSize: "13px", color: "#8a7a5a",
                  fontFamily: "var(--font-sans)", lineHeight: 1.7,
                  marginBottom: "20px",
                }}>
                  {aulaAtual.descricao}
                </p>
              )}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  onClick={irParaProxima}
                  disabled={!proxima}
                  style={{
                    background: proxima
                      ? "linear-gradient(135deg, #C9A84C 0%, #A07820 100%)"
                      : "rgba(201,168,76,0.15)",
                    border: "none", borderRadius: "8px",
                    padding: "10px 18px",
                    color: proxima ? "#0d0b07" : "#9a8a6a",
                    fontSize: "13px", fontWeight: 600,
                    fontFamily: "var(--font-sans)",
                    cursor: proxima ? "pointer" : "not-allowed",
                    letterSpacing: "0.04em",
                    display: "flex", alignItems: "center", gap: "6px",
                    boxShadow: proxima ? "0 2px 12px rgba(201,168,76,0.25)" : "none",
                    transition: "box-shadow 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (proxima) e.currentTarget.style.boxShadow = "0 4px 18px rgba(201,168,76,0.4)";
                  }}
                  onMouseLeave={(e) => {
                    if (proxima) e.currentTarget.style.boxShadow = "0 2px 12px rgba(201,168,76,0.25)";
                  }}
                >
                  Próxima Aula <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar — Currículo */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Progresso */}
            <div style={{
              background: "#130f09",
              border: "1px solid rgba(201,168,76,0.1)",
              borderRadius: "14px", padding: "20px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <span style={{
                  fontSize: "13px", fontWeight: 600, color: "#e8dcc0",
                  fontFamily: "var(--font-sans)",
                }}>
                  Progresso do Curso
                </span>
                <span style={{
                  fontSize: "14px", fontWeight: 700, color: "#C9A84C",
                  fontFamily: "var(--font-display)",
                }}>
                  {progressoCurso}%
                </span>
              </div>
              <div style={{
                height: "6px",
                background: "rgba(201,168,76,0.08)",
                borderRadius: "3px",
                overflow: "hidden", marginBottom: "16px",
              }}>
                <div style={{
                  width: `${progressoCurso}%`, height: "100%",
                  background: "linear-gradient(90deg, #C9A84C 0%, #A07820 100%)",
                  borderRadius: "3px",
                }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {curso.modulos.map((m, idx) => {
                  const prog = moduloProgresso(m.id);
                  const ativo = m.id === moduloAtualId;
                  return (
                    <div key={m.id} style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      padding: "8px 10px", borderRadius: "6px",
                      background: ativo ? "rgba(201,168,76,0.05)" : "transparent",
                    }}>
                      <div style={{
                        width: "22px", height: "22px", borderRadius: "50%",
                        background: prog === 100 ? "#10b981" : "rgba(201,168,76,0.15)",
                        color: prog === 100 ? "#0a0806" : "#C9A84C",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "10px", fontWeight: 700,
                        fontFamily: "var(--font-sans)", flexShrink: 0,
                      }}>
                        {prog === 100 ? <CheckCircle2 size={12} /> : idx + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: "12px", fontWeight: 500,
                          color: ativo ? "#e8dcc0" : "#9a8a6a",
                          fontFamily: "var(--font-sans)",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          marginBottom: "3px",
                        }}>
                          {m.titulo}
                        </p>
                        <div style={{
                          height: "3px",
                          background: "rgba(201,168,76,0.08)",
                          borderRadius: "2px", overflow: "hidden",
                        }}>
                          <div style={{
                            width: `${prog}%`, height: "100%",
                            background: prog === 100 ? "#10b981" : "#C9A84C",
                            borderRadius: "2px",
                          }} />
                        </div>
                      </div>
                      <span style={{
                        fontSize: "10px", color: "#9a8a6a",
                        fontFamily: "var(--font-sans)", flexShrink: 0,
                      }}>
                        {prog}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Currículo expandível */}
            <div style={{
              background: "#130f09",
              border: "1px solid rgba(201,168,76,0.1)",
              borderRadius: "14px", padding: "16px",
            }}>
              <h3 style={{
                fontSize: "13px", fontWeight: 600, color: "#e8dcc0",
                fontFamily: "var(--font-sans)", marginBottom: "12px",
                paddingLeft: "4px",
              }}>
                Currículo
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {curso.modulos.map((m, idx) => {
                  const aberto = moduloAberto === m.id;
                  return (
                    <div key={m.id} style={{
                      background: "#0d0b07",
                      border: `1px solid ${aberto ? "rgba(201,168,76,0.2)" : "rgba(201,168,76,0.08)"}`,
                      borderRadius: "8px", overflow: "hidden",
                      transition: "border-color 0.15s",
                    }}>
                      <button
                        onClick={() => setModuloAberto(aberto ? null : m.id)}
                        style={{
                          width: "100%",
                          display: "flex", alignItems: "center", gap: "10px",
                          padding: "10px 12px",
                          background: "transparent", border: "none", cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <div style={{
                          width: "22px", height: "22px", borderRadius: "50%",
                          background: "rgba(201,168,76,0.1)", color: "#C9A84C",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "10px", fontWeight: 700,
                          fontFamily: "var(--font-sans)", flexShrink: 0,
                        }}>
                          {idx + 1}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            fontSize: "12px", fontWeight: 600, color: "#e8dcc0",
                            fontFamily: "var(--font-sans)", marginBottom: "2px",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>
                            {m.titulo}
                          </p>
                          <p style={{ fontSize: "10px", color: "#9a8a6a", fontFamily: "var(--font-sans)" }}>
                            {m.aulas.length} aulas
                          </p>
                        </div>
                        <ChevronDown
                          size={13}
                          style={{
                            color: "#a09068",
                            transform: aberto ? "rotate(180deg)" : "rotate(0deg)",
                            transition: "transform 0.2s",
                          }}
                        />
                      </button>
                      {aberto && (
                        <div style={{ padding: "0 8px 10px 8px", display: "flex", flexDirection: "column", gap: "2px" }}>
                          {m.aulas.map((a) => {
                            const globalIdx = flatAulas.findIndex((x) => x.aulaId === a.id);
                            const ativa = a.id === aulaAtualId;
                            const concluida = aulaConcluida(globalIdx);
                            return (
                              <button
                                key={a.id}
                                onClick={() => router.push(`/dashboard/cursos/${curso.id}/aulas/${a.id}`)}
                                style={{
                                  display: "flex", alignItems: "center", gap: "8px",
                                  padding: "7px 10px", borderRadius: "6px",
                                  background: ativa ? "rgba(201,168,76,0.08)" : "transparent",
                                  border: "1px solid",
                                  borderColor: ativa ? "rgba(201,168,76,0.2)" : "transparent",
                                  cursor: "pointer", textAlign: "left",
                                  transition: "background 0.15s",
                                }}
                                onMouseEnter={(e) => {
                                  if (!ativa) e.currentTarget.style.background = "rgba(201,168,76,0.04)";
                                }}
                                onMouseLeave={(e) => {
                                  if (!ativa) e.currentTarget.style.background = "transparent";
                                }}
                              >
                                {concluida ? (
                                  <CheckCircle2 size={11} style={{ color: "#10b981", flexShrink: 0 }} />
                                ) : ativa ? (
                                  <PlayCircle size={11} style={{ color: "#C9A84C", flexShrink: 0 }} />
                                ) : (
                                  <PlayCircle size={11} style={{ color: "#9a8a6a", flexShrink: 0 }} />
                                )}
                                <span style={{
                                  flex: 1,
                                  fontSize: "11px",
                                  fontWeight: ativa ? 600 : 400,
                                  color: ativa ? "#C9A84C" : concluida ? "#7a8a6a" : "#9a8a6a",
                                  fontFamily: "var(--font-sans)",
                                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                }}>
                                  {a.titulo}
                                </span>
                                <span style={{
                                  fontSize: "10px", color: "#9a8a6a",
                                  fontFamily: "var(--font-sans)", flexShrink: 0,
                                }}>
                                  {a.duracaoMin}m
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
        </div>
      </div>
    </div>
  );
}
