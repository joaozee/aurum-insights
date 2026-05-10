"use client";

import { useEffect, useRef, useState } from "react";
import {
  TrendingUp, GraduationCap, BarChart3, BookOpen,
  type LucideIcon,
} from "lucide-react";
import type { CursoCategoria } from "@/lib/cursos-data";

/**
 * CourseCover — capa visual de um curso.
 *
 * Tenta carregar a imagem do `src`. Se falhar (404, formato inválido, sem
 * conexão), renderiza um placeholder editorial tematizado por categoria:
 * gradient warm-dark, número grande em Playfair, ícone temático sutil.
 *
 * Resolve o caso atual onde public/cursos/*.jpg não existe ainda — fica
 * com cara de "design intencional", não de bug.
 */

const CATEGORY_ICON: Record<CursoCategoria, LucideIcon> = {
  investimentos: TrendingUp,
  formacao: GraduationCap,
  avancado: BarChart3,
};

const CATEGORY_TINT: Record<CursoCategoria, string> = {
  // Tons quentes derivados da paleta Aurum, não Tailwind 500.
  investimentos: "rgba(201,168,76,0.12)",  // gold tint
  formacao:      "rgba(184,92,58,0.10)",   // terracotta tint
  avancado:      "rgba(94,107,140,0.10)",  // slate blue tint
};

export interface CourseCoverProps {
  src: string;
  title: string;
  categoria: CursoCategoria;
  /** Posição 1-based do curso na lista (mostrado em Playfair big). */
  index: number;
  /** Altura total da capa. */
  height: number;
  /** Tamanho do número Playfair display. */
  numberSize?: number;
  /** Ratio de prioridade — quando true, eager load (above-fold heroes). */
  eager?: boolean;
}

export function CourseCover({
  src, title, categoria, index, height, numberSize = 56, eager = false,
}: CourseCoverProps) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  // Detecta failure que aconteceu antes do React montar (cache hit em 404)
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  if (!failed) {
    return (
      <div style={{
        position: "relative", width: "100%", height: `${height}px`,
        overflow: "hidden",
        background: "linear-gradient(135deg, #1a1410 0%, #130f09 60%, #0d0b07 100%)",
      }}>
        <img
          ref={ref}
          src={src}
          alt={title}
          loading={eager ? "eager" : "lazy"}
          onError={() => setFailed(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, transparent 55%, rgba(13,11,7,0.45) 100%)",
          pointerEvents: "none",
        }} aria-hidden />
      </div>
    );
  }

  // ─── Placeholder editorial ─────────────────────────────────────
  const Icon = CATEGORY_ICON[categoria];
  const tint = CATEGORY_TINT[categoria];

  return (
    <div
      role="img"
      aria-label={title}
      style={{
        position: "relative", width: "100%", height: `${height}px`,
        overflow: "hidden",
        background: `linear-gradient(135deg, #1a1410 0%, #130f09 50%, ${tint} 100%)`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      {/* Número editorial em Playfair (eyebrow visual, ancora no fallback) */}
      <span
        aria-hidden
        style={{
          fontFamily: "var(--font-display)",
          fontSize: `${numberSize}px`,
          fontWeight: 700,
          color: "var(--gold)",
          opacity: 0.18,
          letterSpacing: "-0.04em",
          lineHeight: 1,
          fontVariantNumeric: "lining-nums",
          userSelect: "none",
        }}
      >
        {String(index).padStart(2, "0")}
      </span>

      {/* Ícone categoria centro-baixo */}
      <Icon
        size={Math.round(height * 0.18)}
        strokeWidth={1.2}
        style={{
          position: "absolute",
          bottom: "16px",
          right: "16px",
          color: "var(--gold)",
          opacity: 0.32,
        }}
        aria-hidden
      />

      {/* Hairline divisora topo (textura editorial) */}
      <div style={{
        position: "absolute", top: 0, left: "16px", right: "16px",
        height: "1px",
        background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.18), transparent)",
        pointerEvents: "none",
      }} aria-hidden />

      {/* Overlay sutil só pra ancorar borda inferior (consistente com img real) */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(180deg, transparent 55%, rgba(13,11,7,0.35) 100%)",
        pointerEvents: "none",
      }} aria-hidden />
    </div>
  );
}

// Backup direto pra detail (sem ícone Sparkles fora do escopo)
export { BookOpen };
