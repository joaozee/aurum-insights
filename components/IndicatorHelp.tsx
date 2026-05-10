"use client";

import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { INDICATOR_HELP } from "@/lib/indicators";

interface Props {
  helpKey: string;
  /** Tempo (ms) de hover antes de abrir o tooltip. Default 3000ms. */
  hoverDelay?: number;
}

/**
 * Botão "?" que abre tooltip explicando o indicador.
 *
 * Comportamento:
 *   - Click/tap: alterna aberto/fechado imediatamente
 *   - Hover (mouse) por hoverDelay ms: abre automaticamente
 *   - Click fora ou ESC: fecha
 *
 * Mobile: só responde a clique (touch lift cancela o timer de hover).
 */
export function IndicatorHelp({ helpKey, hoverDelay = 3000 }: Props) {
  const [open, setOpen] = useState(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const help = INDICATOR_HELP[helpKey];

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [open]);

  // Limpa o timer ao desmontar
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  if (!help) return null;

  function clearHoverTimer() {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }

  function handlePointerEnter(e: React.PointerEvent<HTMLButtonElement>) {
    // Só agenda hover-to-open pra mouse — touch tem o tap explícito
    if (e.pointerType !== "mouse") return;
    clearHoverTimer();
    hoverTimerRef.current = setTimeout(() => setOpen(true), hoverDelay);
  }

  function handlePointerLeave() {
    clearHoverTimer();
  }

  return (
    <div ref={containerRef} style={{ position: "relative", display: "inline-flex", flexShrink: 0 }}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          clearHoverTimer();
          setOpen((o) => !o);
        }}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        aria-label={`O que é ${help.title}?`}
        aria-expanded={open}
        aria-haspopup="dialog"
        style={{
          width: "16px",
          height: "16px",
          padding: 0,
          // Hit area expandido sem mudar layout
          margin: "-6px",
          boxSizing: "content-box",
          borderWidth: "6px",
          borderStyle: "solid",
          borderColor: "transparent",
          background: open ? "rgba(201,168,76,0.15)" : "transparent",
          borderRadius: "50%",
          color: open ? "#C9A84C" : "#7a6d57",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "10px",
          fontWeight: 700,
          fontFamily: "var(--font-sans)",
          lineHeight: 1,
          transition: "all 0.15s",
          backgroundClip: "padding-box",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "16px",
            height: "16px",
            border: `1px solid ${open ? "rgba(201,168,76,0.5)" : "rgba(201,168,76,0.2)"}`,
            borderRadius: "50%",
            transition: "border-color 0.15s",
          }}
        >
          ?
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={help.title}
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            zIndex: 100,
            minWidth: "260px",
            maxWidth: "320px",
            background: "rgba(15, 12, 7, 0.98)",
            border: "1px solid rgba(201,168,76,0.3)",
            borderRadius: "10px",
            padding: "12px 14px",
            boxShadow: "0 10px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,0,0,0.4)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "8px",
            marginBottom: "8px",
          }}>
            <p style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "#C9A84C",
              fontFamily: "var(--font-display)",
              margin: 0,
              lineHeight: 1.3,
            }}>
              {help.title}
            </p>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setOpen(false); }}
              aria-label="Fechar explicação"
              style={{
                width: "24px",
                height: "24px",
                background: "transparent",
                border: "none",
                padding: 0,
                color: "#7a6d57",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "4px",
                transition: "background 0.15s",
                marginRight: "-4px",
                marginTop: "-4px",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(201,168,76,0.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <X size={12} />
            </button>
          </div>

          <p style={{
            fontSize: "11px",
            color: "#c8b89a",
            fontFamily: "var(--font-sans)",
            lineHeight: 1.55,
            margin: 0,
          }}>
            {help.description}
          </p>

          {help.formula && (
            <div style={{
              fontSize: "10px",
              color: "#a09068",
              fontFamily: "var(--font-sans)",
              lineHeight: 1.5,
              marginTop: "8px",
              padding: "6px 10px",
              background: "rgba(201,168,76,0.06)",
              border: "1px solid rgba(201,168,76,0.1)",
              borderRadius: "6px",
            }}>
              <strong style={{ color: "#C9A84C" }}>Fórmula: </strong>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>{help.formula}</span>
            </div>
          )}

          {help.benchmark && (
            <p style={{
              fontSize: "10px",
              color: "#9a8a6a",
              fontFamily: "var(--font-sans)",
              lineHeight: 1.5,
              margin: "8px 0 0",
            }}>
              <strong style={{ color: "#C9A84C" }}>Referência: </strong>
              {help.benchmark}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
