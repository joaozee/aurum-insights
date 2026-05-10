"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap, Search, ChevronDown, Star, BookOpen,
  Clock, Users, FileText, PlayCircle, Sparkles,
} from "lucide-react";
import {
  CURSOS, CONTEUDO_GRATUITO, CATEGORIA_LABEL, NIVEL_LABEL,
  type CursoCategoria, type ConteudoTipo, type Curso,
} from "@/lib/cursos-data";
import { fetchEnrollments, progressFromLessons, type EnrollmentRow } from "@/lib/enrollment";
import { EmptyState } from "@/components/ui/empty-state";
import { CourseCover } from "@/components/ui/course-cover";

type Filtro = "todos" | CursoCategoria;
type Ordenacao = "recentes" | "populares" | "preco";

const FILTROS: { id: Filtro; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "investimentos", label: "Investimentos" },
  { id: "formacao", label: "Formação" },
  { id: "avancado", label: "Avançado" },
];

const TIPO_ICON: Record<ConteudoTipo, typeof FileText> = {
  tutorial: PlayCircle,
  artigo: FileText,
  video: PlayCircle,
};

const TIPO_LABEL: Record<ConteudoTipo, string> = {
  tutorial: "Tutorial",
  artigo: "Artigo",
  video: "Vídeo",
};

interface CursosContentProps {
  userEmail: string;
}

export default function CursosContent({ userEmail }: CursosContentProps) {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [ordenacao, setOrdenacao] = useState<Ordenacao>("recentes");
  const [meusCursos, setMeusCursos] = useState(false);
  const [favoritos, setFavoritos] = useState(false);
  const [enrollments, setEnrollments] = useState<Map<string, EnrollmentRow>>(new Map());

  const reload = useCallback(() => {
    fetchEnrollments(userEmail).then(setEnrollments);
  }, [userEmail]);

  useEffect(() => { reload(); }, [reload]);

  // Mescla cursos estáticos com estado de matrícula real do Supabase
  const cursosComEnrollment = useMemo<Curso[]>(() => {
    return CURSOS.map((c) => {
      const row = enrollments.get(c.id);
      if (!row) return { ...c, matriculado: false, progresso: 0 };
      return {
        ...c,
        matriculado: true,
        progresso: progressFromLessons(c, row.completed_lessons),
      };
    });
  }, [enrollments]);

  const cursosFiltrados = useMemo(() => {
    let lista = cursosComEnrollment;
    if (filtro !== "todos") lista = lista.filter((c) => c.categoria === filtro);
    if (meusCursos) lista = lista.filter((c) => c.matriculado);
    if (busca.trim()) {
      const b = busca.toLowerCase();
      lista = lista.filter(
        (c) => c.titulo.toLowerCase().includes(b) || c.descricao.toLowerCase().includes(b)
      );
    }
    if (ordenacao === "populares") {
      lista = [...lista].sort((a, b) => b.alunos - a.alunos);
    } else if (ordenacao === "preco") {
      lista = [...lista].sort((a, b) => a.preco - b.preco);
    }
    return lista;
  }, [busca, filtro, ordenacao, meusCursos, cursosComEnrollment]);

  return (
    <div style={{ minHeight: "calc(100vh - 58px)", background: "#0a0806" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 24px 64px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <GraduationCap size={18} style={{ color: "#C9A84C" }} />
          <span style={{
            fontSize: "13px", fontWeight: 600, color: "#C9A84C",
            fontFamily: "var(--font-sans)", letterSpacing: "0.06em",
          }}>
            Aurum Academy
          </span>
        </div>
        <h1 style={{
          fontSize: "32px", fontWeight: 700, color: "#e8dcc0",
          fontFamily: "var(--font-display)", marginBottom: "8px",
          letterSpacing: "-0.01em", lineHeight: 1.2,
        }}>
          Aprenda a investir com os melhores
        </h1>
        <p style={{
          fontSize: "14px", color: "#a09068", fontFamily: "var(--font-sans)",
          marginBottom: "32px", lineHeight: 1.6,
        }}>
          Cursos completos para transformar você em um investidor de sucesso, do básico ao avançado.
        </p>

        {/* Search + sort */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: "260px" }}>
            <Search
              size={15}
              style={{
                position: "absolute", left: "14px", top: "50%",
                transform: "translateY(-50%)", color: "#9a8a6a",
              }}
            />
            <input
              type="text"
              placeholder="Buscar por título, descrição, módulos ou aulas…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{
                width: "100%", height: "42px",
                background: "#130f09",
                border: "1px solid rgba(201,168,76,0.12)",
                borderRadius: "10px",
                padding: "0 16px 0 40px",
                color: "#e8dcc0", fontSize: "13px",
                fontFamily: "var(--font-sans)", outline: "none",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.35)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.12)"; }}
            />
          </div>
          <div style={{ position: "relative" }}>
            <select
              value={ordenacao}
              onChange={(e) => setOrdenacao(e.target.value as Ordenacao)}
              style={{
                appearance: "none",
                height: "42px",
                background: "#130f09",
                border: "1px solid rgba(201,168,76,0.12)",
                borderRadius: "10px",
                padding: "0 36px 0 14px",
                color: "#e8dcc0", fontSize: "13px",
                fontFamily: "var(--font-sans)", cursor: "pointer", outline: "none",
                minWidth: "160px",
              }}
            >
              <option value="recentes">Mais Recentes</option>
              <option value="populares">Mais Populares</option>
              <option value="preco">Menor Preço</option>
            </select>
            <ChevronDown
              size={14}
              style={{
                position: "absolute", right: "12px", top: "50%",
                transform: "translateY(-50%)", color: "#a09068", pointerEvents: "none",
              }}
            />
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: "32px", flexWrap: "wrap", gap: "12px",
        }}>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {FILTROS.map((f) => {
              const ativo = filtro === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setFiltro(f.id)}
                  aria-pressed={ativo}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "1px solid",
                    borderColor: ativo ? "rgba(201,168,76,0.35)" : "rgba(201,168,76,0.15)",
                    background: ativo ? "rgba(201,168,76,0.10)" : "#130f09",
                    color: ativo ? "#C9A84C" : "#9a8a6a",
                    fontSize: "13px",
                    fontWeight: ativo ? 600 : 500,
                    fontFamily: "var(--font-sans)",
                    cursor: "pointer",
                    transition: "border-color 0.15s, background 0.15s, color 0.15s",
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <ToggleBtn
              active={favoritos}
              onClick={() => setFavoritos((v) => !v)}
              icon={<Star size={13} fill={favoritos ? "#C9A84C" : "none"} />}
              label="Favoritos"
            />
            <ToggleBtn
              active={meusCursos}
              onClick={() => setMeusCursos((v) => !v)}
              icon={<BookOpen size={13} />}
              label="Meus Cursos"
            />
          </div>
        </div>

        {/* Cursos Pagos */}
        <h2 style={{
          fontSize: "18px", fontWeight: 600, color: "#e8dcc0",
          fontFamily: "var(--font-display)", marginBottom: "16px",
        }}>
          Cursos Pagos
        </h2>
        {cursosFiltrados.length === 0 ? (
          <div style={{ marginBottom: "48px" }}>
            <EmptyState
              icon={Search}
              title="Nenhum curso bate com esses filtros"
              description={meusCursos
                ? "Você ainda não está matriculado em nenhum curso. Limpe o filtro 'Meus cursos' pra ver tudo."
                : favoritos
                ? "Você não tem cursos favoritos ainda. Limpe o filtro 'Favoritos' ou marque alguma estrela."
                : busca.trim()
                ? `Nenhum resultado pra "${busca.trim()}". Tente buscar por categoria, instrutor ou tópico.`
                : "Tente trocar de categoria ou ordenação no topo."}
              action={(busca.trim() || meusCursos || favoritos) ? {
                label: "Limpar filtros",
                onClick: () => { setBusca(""); setFiltro("todos"); setMeusCursos(false); setFavoritos(false); },
              } : undefined}
            />
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "20px", marginBottom: "48px",
          }}>
            {cursosFiltrados.map((c, i) => (
              <CursoCard
                key={c.id}
                curso={c}
                index={i + 1}
                onClick={() => router.push(`/dashboard/cursos/${c.id}`)}
              />
            ))}
          </div>
        )}

        {/* Conteúdo Gratuito */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <h2 style={{
            fontSize: "18px", fontWeight: 600, color: "#e8dcc0",
            fontFamily: "var(--font-display)", margin: 0,
          }}>
            Conteúdo Gratuito
          </h2>
          <span style={{
            fontSize: "10px", fontWeight: 700,
            background: "linear-gradient(135deg, #10b981, #059669)",
            color: "#0a0806", padding: "3px 8px",
            borderRadius: "4px", letterSpacing: "0.06em",
            fontFamily: "var(--font-sans)",
          }}>
            GRÁTIS
          </span>
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: "12px",
        }}>
          {CONTEUDO_GRATUITO.map((item) => {
            const Icon = TIPO_ICON[item.tipo];
            return (
              <button
                key={item.id}
                style={{
                  display: "flex", alignItems: "flex-start", gap: "12px",
                  background: "#130f09",
                  border: "1px solid rgba(201,168,76,0.08)",
                  borderRadius: "10px", padding: "14px 16px",
                  textAlign: "left", cursor: "pointer",
                  transition: "all 0.15s",
                  fontFamily: "var(--font-sans)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(201,168,76,0.25)";
                  e.currentTarget.style.background = "#1a1410";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(201,168,76,0.08)";
                  e.currentTarget.style.background = "#130f09";
                }}
              >
                <div style={{
                  width: "32px", height: "32px", borderRadius: "8px",
                  background: "rgba(201,168,76,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#C9A84C", flexShrink: 0,
                }}>
                  <Icon size={15} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: "13px", fontWeight: 500, color: "#e8dcc0",
                    marginBottom: "6px", lineHeight: 1.4,
                  }}>
                    {item.titulo}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{
                      fontSize: "10px", fontWeight: 600,
                      color: "#C9A84C", padding: "2px 6px",
                      background: "rgba(201,168,76,0.1)",
                      borderRadius: "4px", letterSpacing: "0.04em",
                    }}>
                      {TIPO_LABEL[item.tipo]}
                    </span>
                    {item.duracaoMin && (
                      <span style={{ fontSize: "11px", color: "#9a8a6a", display: "flex", alignItems: "center", gap: "3px" }}>
                        <Clock size={10} /> {item.duracaoMin} min
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function ToggleBtn({
  active, onClick, icon, label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: "6px",
        padding: "8px 14px", borderRadius: "8px",
        border: "1px solid",
        borderColor: active ? "rgba(201,168,76,0.4)" : "rgba(201,168,76,0.1)",
        background: active ? "rgba(201,168,76,0.08)" : "#130f09",
        color: active ? "#C9A84C" : "#9a8a6a",
        fontSize: "12px", fontWeight: 500,
        fontFamily: "var(--font-sans)", cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      {icon} {label}
    </button>
  );
}

function CursoCard({
  curso, index, onClick,
}: {
  curso: typeof CURSOS[number];
  index: number;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "#130f09",
        border: "1px solid rgba(201,168,76,0.1)",
        borderRadius: "12px",
        overflow: "hidden",
        cursor: "pointer",
        transition: "all 0.2s",
        display: "flex", flexDirection: "column",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(201,168,76,0.1)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Capa: tenta a foto em /public/cursos/. Se falhar, vira placeholder
          editorial tematizado por categoria (gradient + número Playfair + ícone). */}
      <div style={{ position: "relative" }}>
        <CourseCover
          src={curso.imagem}
          title={curso.titulo}
          categoria={curso.categoria}
          index={index}
          height={150}
          numberSize={64}
        />
        {curso.desconto && (
          <span style={{
            position: "absolute", top: "10px", left: "10px",
            background: "var(--negative)",
            color: "var(--text-strong)", fontSize: "11px", fontWeight: 700,
            padding: "4px 10px", borderRadius: "6px",
            fontFamily: "var(--font-sans)", letterSpacing: "0.04em",
          }}>
            -{curso.desconto}%
          </span>
        )}
        {curso.bestseller && (
          <span style={{
            position: "absolute", top: "10px", right: "10px",
            background: "linear-gradient(135deg, #C9A84C, #A07820)",
            color: "#0d0b07", fontSize: "10px", fontWeight: 700,
            padding: "4px 10px", borderRadius: "6px",
            fontFamily: "var(--font-sans)", letterSpacing: "0.06em",
            display: "flex", alignItems: "center", gap: "4px",
          }}>
            <Sparkles size={10} /> Bestseller
          </span>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "16px 18px 18px", display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{ display: "flex", gap: "6px", marginBottom: "10px", flexWrap: "wrap" }}>
          <span style={{
            fontSize: "10px", fontWeight: 600, color: "#C9A84C",
            background: "rgba(201,168,76,0.1)",
            padding: "3px 8px", borderRadius: "4px",
            fontFamily: "var(--font-sans)", letterSpacing: "0.04em",
          }}>
            {CATEGORIA_LABEL[curso.categoria]}
          </span>
          <span style={{
            fontSize: "10px", fontWeight: 600, color: "#34d399",
            background: "rgba(16,185,129,0.1)",
            padding: "3px 8px", borderRadius: "4px",
            fontFamily: "var(--font-sans)", letterSpacing: "0.04em",
          }}>
            {NIVEL_LABEL[curso.nivel]}
          </span>
        </div>

        <h3 style={{
          fontSize: "15px", fontWeight: 600, color: "#e8dcc0",
          fontFamily: "var(--font-sans)", marginBottom: "8px",
          lineHeight: 1.35,
        }}>
          {curso.titulo}
        </h3>

        <p style={{
          fontSize: "12px", color: "#a09068", fontFamily: "var(--font-sans)",
          lineHeight: 1.55, marginBottom: "14px",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          overflow: "hidden", flex: 1,
        }}>
          {curso.descricao}
        </p>

        <div style={{
          display: "flex", gap: "12px", marginBottom: "14px",
          fontSize: "11px", color: "#a09068", fontFamily: "var(--font-sans)",
        }}>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <Clock size={11} /> {curso.duracaoHoras}h
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <BookOpen size={11} /> {curso.totalAulas}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <Users size={11} /> {curso.alunos.toLocaleString("pt-BR")}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "12px" }}>
          <div>
            {curso.precoOriginal && (
              <p style={{
                fontSize: "11px", color: "#9a8a6a",
                textDecoration: "line-through",
                fontFamily: "var(--font-sans)", marginBottom: "2px",
              }}>
                R$ {curso.precoOriginal.toFixed(2).replace(".", ",")}
              </p>
            )}
            <p style={{
              fontSize: "18px", fontWeight: 700, color: "#C9A84C",
              fontFamily: "var(--font-display)", lineHeight: 1,
            }}>
              R$ {curso.preco.toFixed(2).replace(".", ",")}
            </p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            style={{
              background: "transparent",
              border: "1px solid rgba(201,168,76,0.30)",
              borderRadius: "8px",
              padding: "8px 16px",
              color: "#C9A84C",
              fontSize: "12px", fontWeight: 600,
              fontFamily: "var(--font-sans)", cursor: "pointer",
              letterSpacing: "0.02em",
              transition: "border-color 0.15s, background 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(201,168,76,0.55)";
              e.currentTarget.style.background = "rgba(201,168,76,0.06)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(201,168,76,0.30)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            Ver curso
          </button>
        </div>
      </div>
    </div>
  );
}
