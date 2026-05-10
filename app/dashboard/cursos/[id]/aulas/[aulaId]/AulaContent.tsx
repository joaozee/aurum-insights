"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, ChevronDown, Play, PlayCircle,
  CheckCircle2, GraduationCap, ArrowRight, Clock, Loader2,
} from "lucide-react";
import {
  type Curso, CATEGORIA_LABEL, getProximaAula,
} from "@/lib/cursos-data";
import { setLessonComplete } from "@/lib/enrollment";
import { Skeleton } from "@/components/ui/skeleton";

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
  const [completed, setCompleted] = useState<Set<string>>(new Set(initialCompletedLessons));
  const [marking, setMarking] = useState(false);

  // Múltiplos módulos abertos no currículo. Inicia com o módulo atual aberto.
  const [modulosAbertos, setModulosAbertos] = useState<Set<string>>(
    () => new Set([moduloAtualId])
  );
  const toggleModulo = (id: string) =>
    setModulosAbertos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

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
  const aulaConcluidaAtual = completed.has(aulaAtualId);

  function moduloProgresso(moduloId: string) {
    const aulas = curso.modulos.find((m) => m.id === moduloId)?.aulas ?? [];
    if (aulas.length === 0) return { prog: 0, concluidas: 0, total: 0 };
    const concluidas = aulas.filter((a) => completed.has(a.id)).length;
    return {
      prog: Math.round((concluidas / aulas.length) * 100),
      concluidas,
      total: aulas.length,
    };
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
      {/* Sub-header: curso + progresso fino na borda inferior */}
      <div style={{
        background: "#0d0b07",
        borderBottom: "1px solid rgba(201,168,76,0.08)",
        position: "relative",
      }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "8px",
            background: "rgba(201,168,76,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#C9A84C", flexShrink: 0,
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
            <p style={{
              fontSize: "14px", fontWeight: 600, color: "#e8dcc0",
              fontFamily: "var(--font-sans)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {curso.titulo}
            </p>
          </div>
          <div style={{
            display: "flex", alignItems: "baseline", gap: "6px",
            fontFamily: "var(--font-sans)",
            fontVariantNumeric: "tabular-nums",
            flexShrink: 0,
          }}>
            <span style={{ fontSize: "12px", color: "#a09068" }}>
              {completed.size}<span style={{ color: "#7a6a4a" }}>/{totalAulas}</span>
            </span>
            <span style={{ fontSize: "11px", color: "#7a6a4a", letterSpacing: "0.04em" }}>
              {progressoCurso}%
            </span>
          </div>
        </div>
        {/* Strip de progresso global na borda inferior (sempre visível) */}
        <div
          role="progressbar"
          aria-valuenow={progressoCurso}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progresso geral do curso"
          style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            height: "2px",
            background: "rgba(201,168,76,0.06)",
          }}
        >
          <div style={{
            width: "100%", height: "100%",
            background: "#C9A84C",
            transformOrigin: "left center",
            transform: `scaleX(${progressoCurso / 100})`,
            transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          }} />
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
          className="aurum-hover-gold aurum-hover-transition"
        >
          <ChevronLeft size={15} /> Voltar para o curso
        </button>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "24px", alignItems: "start" }}>
          {/* Coluna principal */}
          <div>
            {/* Player */}
            {aulaAtual.videoUrl ? (
              <div style={{
                position: "relative",
                background: "#0d0b07",
                border: "1px solid rgba(201,168,76,0.1)",
                borderRadius: "14px",
                aspectRatio: "16 / 9",
                marginBottom: "16px",
                overflow: "hidden",
              }}>
                <Skeleton className="absolute inset-0 rounded-[14px]" />
                <iframe
                  src={aulaAtual.videoUrl}
                  title={aulaAtual.titulo}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="relative w-full h-full"
                  style={{ border: 0 }}
                />
              </div>
            ) : (
              <div style={{
                position: "relative",
                background: "linear-gradient(135deg, #1a1410 0%, #130f09 60%, #0d0b07 100%)",
                border: "1px solid rgba(201,168,76,0.10)",
                borderRadius: "14px",
                aspectRatio: "16 / 9",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                gap: "10px", marginBottom: "16px",
                overflow: "hidden",
              }}>
                {/* Hairline editorial topo */}
                <div style={{
                  position: "absolute", top: 0, left: "16px", right: "16px",
                  height: "1px",
                  background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.18), transparent)",
                }} aria-hidden />
                <div style={{
                  width: "56px", height: "56px",
                  borderRadius: "50%",
                  background: "rgba(201,168,76,0.08)",
                  border: "1px solid rgba(201,168,76,0.18)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#C9A84C",
                }}>
                  <Play size={22} fill="currentColor" strokeWidth={0} />
                </div>
                <p style={{
                  fontSize: "13px", color: "#c8b89a",
                  fontFamily: "var(--font-sans)", marginTop: "2px", fontWeight: 500,
                }}>
                  Vídeo em produção
                </p>
                <p style={{
                  fontSize: "11px", color: "#7a6a4a",
                  fontFamily: "var(--font-sans)", letterSpacing: "0.04em",
                  textAlign: "center", maxWidth: "300px",
                }}>
                  O conteúdo desta aula está sendo gravado e estará disponível em breve.
                </p>
              </div>
            )}

            {/* Info da aula */}
            <div style={{
              background: "#130f09",
              border: "1px solid rgba(201,168,76,0.1)",
              borderRadius: "14px", padding: "24px 28px",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "10px", flexWrap: "wrap" }}>
                <span style={{
                  fontSize: "11px", fontWeight: 600, color: "#C9A84C",
                  fontFamily: "var(--font-sans)", letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}>
                  Módulo {moduloIndex + 1} · Aula {aulaIndex + 1} de {moduloAtual.aulas.length}
                </span>
                {aulaConcluidaAtual && (
                  <span style={{
                    display: "flex", alignItems: "center", gap: "5px",
                    fontSize: "11px", fontWeight: 600, color: "var(--positive)",
                    fontFamily: "var(--font-sans)", letterSpacing: "0.04em",
                  }}>
                    <CheckCircle2 size={13} /> Concluída
                  </span>
                )}
              </div>
              <h1 style={{
                fontSize: "24px", fontWeight: 700, color: "#e8dcc0",
                fontFamily: "var(--font-display)", marginBottom: "10px",
                letterSpacing: "-0.01em", lineHeight: 1.22,
              }}>
                {aulaAtual.titulo}
              </h1>
              <div style={{
                display: "flex", alignItems: "center", gap: "16px",
                fontSize: "12px", color: "#a09068", fontFamily: "var(--font-sans)",
                marginBottom: aulaAtual.descricao ? "16px" : "20px",
              }}>
                <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <Clock size={12} /> {aulaAtual.duracaoMin} min
                </span>
              </div>
              {aulaAtual.descricao && (
                <p style={{
                  fontSize: "13.5px", color: "#a09068",
                  fontFamily: "var(--font-sans)", lineHeight: 1.7,
                  marginBottom: "20px", maxWidth: "62ch",
                }}>
                  {aulaAtual.descricao}
                </p>
              )}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: "12px", flexWrap: "wrap",
                paddingTop: "4px",
              }}>
                {/* Marcar como concluída — ação explícita separada da navegação */}
                {!aulaConcluidaAtual ? (
                  <button
                    onClick={marcarConcluida}
                    disabled={marking}
                    style={{
                      display: "flex", alignItems: "center", gap: "7px",
                      background: "transparent",
                      border: "1px solid rgba(201,168,76,0.22)",
                      borderRadius: "8px",
                      padding: "9px 14px",
                      color: "#a09068",
                      fontSize: "12px", fontWeight: 500,
                      fontFamily: "var(--font-sans)",
                      cursor: marking ? "wait" : "pointer",
                      letterSpacing: "0.02em",
                      transition: "border-color 0.15s, color 0.15s",
                      opacity: marking ? 0.7 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (!marking) {
                        e.currentTarget.style.borderColor = "rgba(201,168,76,0.45)";
                        e.currentTarget.style.color = "#e8dcc0";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "rgba(201,168,76,0.22)";
                      e.currentTarget.style.color = "#a09068";
                    }}
                  >
                    {marking ? (
                      <>
                        <Loader2 size={13} className="aurum-spin" />
                        Marcando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={13} />
                        Marcar como concluída
                      </>
                    )}
                  </button>
                ) : (
                  <span style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    fontSize: "12px", color: "var(--positive)",
                    fontFamily: "var(--font-sans)", fontWeight: 500,
                  }}>
                    <CheckCircle2 size={14} /> Você já viu essa aula
                  </span>
                )}

                {/* Próxima aula (ou voltar ao curso se for a última) */}
                {proxima ? (
                  <button
                    onClick={irParaProxima}
                    style={{
                      background: "#C9A84C",
                      border: "none", borderRadius: "8px",
                      padding: "10px 18px",
                      color: "#0d0b07",
                      fontSize: "13px", fontWeight: 600,
                      fontFamily: "var(--font-sans)",
                      cursor: "pointer",
                      letterSpacing: "0.02em",
                      display: "flex", alignItems: "center", gap: "6px",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#E8C96A"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "#C9A84C"; }}
                  >
                    Próxima aula <ArrowRight size={13} />
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      await marcarConcluida();
                      router.push(`/dashboard/cursos/${curso.id}`);
                    }}
                    style={{
                      background: "#C9A84C",
                      border: "none", borderRadius: "8px",
                      padding: "10px 18px",
                      color: "#0d0b07",
                      fontSize: "13px", fontWeight: 600,
                      fontFamily: "var(--font-sans)",
                      cursor: "pointer",
                      letterSpacing: "0.02em",
                      display: "flex", alignItems: "center", gap: "6px",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#E8C96A"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "#C9A84C"; }}
                  >
                    Concluir curso <CheckCircle2 size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar — UM card só com progresso + currículo, em vez de dois redundantes */}
          <aside
            aria-label="Conteúdo do curso"
            style={{
              background: "#130f09",
              border: "1px solid rgba(201,168,76,0.10)",
              borderRadius: "14px", padding: "20px",
              position: "sticky",
              top: "78px",
              maxHeight: "calc(100vh - 96px)",
              overflowY: "auto",
            }}
          >
            {/* Header: título + contagem global */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "baseline",
              marginBottom: "10px",
            }}>
              <h3 style={{
                fontSize: "13px", fontWeight: 600, color: "#e8dcc0",
                fontFamily: "var(--font-sans)",
                letterSpacing: "0.02em",
              }}>
                Conteúdo do curso
              </h3>
              <span style={{
                fontSize: "11px", color: "#a09068",
                fontFamily: "var(--font-sans)",
                fontVariantNumeric: "tabular-nums",
              }}>
                {completed.size} <span style={{ color: "#7a6a4a" }}>de</span> {totalAulas}
              </span>
            </div>

            {/* Progress bar global */}
            <div
              role="progressbar"
              aria-valuenow={progressoCurso}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progresso do curso"
              style={{
                height: "5px",
                background: "rgba(201,168,76,0.08)",
                borderRadius: "3px",
                overflow: "hidden", marginBottom: "18px",
              }}
            >
              <div style={{
                width: "100%", height: "100%",
                background: progressoCurso === 100 ? "var(--positive)" : "#C9A84C",
                borderRadius: "3px",
                transformOrigin: "left center",
                transform: `scaleX(${progressoCurso / 100})`,
                transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              }} />
            </div>

            {/* Lista de módulos: cada um com mini-progress visível e expandível */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {curso.modulos.map((m, idx) => {
                const aberto = modulosAbertos.has(m.id);
                const { prog, concluidas, total } = moduloProgresso(m.id);
                const isAtivo = m.id === moduloAtualId;
                const allDone = prog === 100 && total > 0;
                return (
                  <div key={m.id} style={{
                    background: isAtivo ? "rgba(201,168,76,0.05)" : "#0d0b07",
                    border: `1px solid ${
                      isAtivo
                        ? "rgba(201,168,76,0.22)"
                        : aberto
                        ? "rgba(201,168,76,0.14)"
                        : "rgba(201,168,76,0.08)"
                    }`,
                    borderRadius: "8px", overflow: "hidden",
                    transition: "border-color 0.15s, background 0.15s",
                  }}>
                    <button
                      onClick={() => toggleModulo(m.id)}
                      aria-expanded={aberto}
                      aria-controls={`modulo-${m.id}-aulas-aside`}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", gap: "10px",
                        padding: "11px 12px",
                        background: "transparent", border: "none", cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <div style={{
                        width: "22px", height: "22px", borderRadius: "50%",
                        background: allDone ? "var(--positive)" : "rgba(201,168,76,0.12)",
                        color: allDone ? "#0a0806" : "#C9A84C",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "10px", fontWeight: 700,
                        fontFamily: "var(--font-sans)", flexShrink: 0,
                      }}>
                        {allDone ? <CheckCircle2 size={12} /> : idx + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: "12px", fontWeight: 600,
                          color: isAtivo ? "#e8dcc0" : "#c8b89a",
                          fontFamily: "var(--font-sans)",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          marginBottom: "5px",
                          lineHeight: 1.3,
                        }}>
                          {m.titulo}
                        </p>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div
                            role="progressbar"
                            aria-valuenow={prog}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            style={{
                              flex: 1, height: "3px",
                              background: "rgba(201,168,76,0.08)",
                              borderRadius: "2px", overflow: "hidden",
                            }}
                          >
                            <div style={{
                              width: "100%", height: "100%",
                              background: allDone ? "var(--positive)" : "#C9A84C",
                              transformOrigin: "left center",
                              transform: `scaleX(${prog / 100})`,
                              transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                            }} />
                          </div>
                          <span style={{
                            fontSize: "10px", color: "#a09068",
                            fontFamily: "var(--font-sans)",
                            fontVariantNumeric: "tabular-nums", flexShrink: 0,
                          }}>
                            {concluidas}/{total}
                          </span>
                        </div>
                      </div>
                      <ChevronDown
                        size={13}
                        style={{
                          color: "#a09068", flexShrink: 0,
                          transform: aberto ? "rotate(180deg)" : "rotate(0deg)",
                          transition: "transform 0.2s",
                        }}
                      />
                    </button>
                    {aberto && (
                      <div
                        id={`modulo-${m.id}-aulas-aside`}
                        style={{
                          padding: "0 8px 10px 8px",
                          display: "flex", flexDirection: "column", gap: "2px",
                          borderTop: "1px solid rgba(201,168,76,0.06)",
                          paddingTop: "6px",
                        }}
                      >
                        {m.aulas.map((a) => {
                          const ativa = a.id === aulaAtualId;
                          const concluida = completed.has(a.id);
                          return (
                            <button
                              key={a.id}
                              onClick={() => router.push(`/dashboard/cursos/${curso.id}/aulas/${a.id}`)}
                              aria-current={ativa ? "page" : undefined}
                              style={{
                                display: "flex", alignItems: "flex-start", gap: "10px",
                                padding: "9px 10px", borderRadius: "6px",
                                background: ativa ? "rgba(201,168,76,0.10)" : "transparent",
                                border: "1px solid",
                                borderColor: ativa ? "rgba(201,168,76,0.22)" : "transparent",
                                cursor: "pointer", textAlign: "left",
                                transition: "background 0.15s, border-color 0.15s",
                                minHeight: "36px",
                              }}
                              onMouseEnter={(e) => {
                                if (!ativa) e.currentTarget.style.background = "rgba(201,168,76,0.04)";
                              }}
                              onMouseLeave={(e) => {
                                if (!ativa) e.currentTarget.style.background = "transparent";
                              }}
                            >
                              {concluida ? (
                                <CheckCircle2 size={12} style={{ color: "var(--positive)", flexShrink: 0, marginTop: "2px" }} />
                              ) : ativa ? (
                                <PlayCircle size={12} style={{ color: "#C9A84C", flexShrink: 0, marginTop: "2px" }} />
                              ) : (
                                <PlayCircle size={12} style={{ color: "#7a6a4a", flexShrink: 0, marginTop: "2px" }} />
                              )}
                              <span style={{
                                flex: 1, minWidth: 0,
                                fontSize: "11.5px",
                                fontWeight: ativa ? 600 : 400,
                                color: ativa ? "#C9A84C" : concluida ? "#a09068" : "#a09068",
                                fontFamily: "var(--font-sans)",
                                lineHeight: 1.4,
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                textDecoration: concluida ? "line-through" : "none",
                                textDecorationColor: "rgba(160,144,104,0.5)",
                              }}>
                                {a.titulo}
                              </span>
                              <span style={{
                                fontSize: "10px", color: "#9a8a6a",
                                fontFamily: "var(--font-sans)",
                                fontVariantNumeric: "tabular-nums",
                                flexShrink: 0, marginTop: "2px",
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
          </aside>
        </div>
      </div>
    </div>
  );
}
