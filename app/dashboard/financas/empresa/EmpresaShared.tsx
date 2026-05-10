"use client";

import type React from "react";

// ─── Tokens visuais ─────────────────────────────────────────────────────────
// Mantemos a paleta Aurum (#0a0806 bg, #130f09 cards, #C9A84C primary gold).

export const E = {
  bg: "#0a0806",
  card: "#130f09",
  cardSoft: "#0d0b07",
  border: "rgba(201,168,76,0.1)",
  borderStrong: "rgba(201,168,76,0.22)",
  text: "#e8dcc0",
  textStrong: "#f0e8d0",
  textMuted: "#a09068",
  textFaint: "#857560",
  gold: "#C9A84C",
  goldSoft: "rgba(201,168,76,0.12)",
  green: "#34d399",
  greenSoft: "rgba(34,197,94,0.1)",
  red: "#f87171",
  redSoft: "rgba(248,113,113,0.1)",
  amber: "#f59e0b",
  amberSoft: "rgba(245,158,11,0.12)",
  blue: "#5E6B8C",
  teal: "#4F8A82",
  terracotta: "#B85C3A",
  olive: "#6E8C4A",
  mauve: "#8C6E78",
  rose: "#A8617A",
};

// ─── Card shell ─────────────────────────────────────────────────────────────

export function ECard({
  children,
  style,
  padding = "20px 22px",
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  padding?: string;
}) {
  return (
    <div
      style={{
        background: E.card,
        border: `1px solid ${E.border}`,
        borderRadius: "12px",
        padding,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Section header ─────────────────────────────────────────────────────────

export function ESection({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: "24px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: "14px",
          gap: "12px",
        }}
      >
        <div>
          <h2
            style={{
              fontSize: "16px",
              fontWeight: 600,
              color: E.textStrong,
              fontFamily: "var(--font-display)",
              letterSpacing: "-0.005em",
              marginBottom: subtitle ? "3px" : 0,
            }}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              style={{
                fontSize: "12px",
                color: E.textMuted,
                fontFamily: "var(--font-sans)",
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

// ─── KPI card ───────────────────────────────────────────────────────────────

export function EKpi({
  label,
  value,
  sub,
  tone = "neutral",
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "neutral" | "positive" | "negative" | "warning" | "gold";
  icon?: React.ReactNode;
}) {
  const accent =
    tone === "positive"
      ? E.green
      : tone === "negative"
      ? E.red
      : tone === "warning"
      ? E.amber
      : tone === "gold"
      ? E.gold
      : E.textMuted;
  const accentBg =
    tone === "positive"
      ? E.greenSoft
      : tone === "negative"
      ? E.redSoft
      : tone === "warning"
      ? E.amberSoft
      : tone === "gold"
      ? E.goldSoft
      : "transparent";
  return (
    <ECard padding="16px 18px">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "10px",
        }}
      >
        <p
          style={{
            fontSize: "10px",
            fontWeight: 600,
            color: E.textMuted,
            fontFamily: "var(--font-sans)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </p>
        {icon && (
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "8px",
              background: accentBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: accent,
            }}
          >
            {icon}
          </div>
        )}
      </div>
      <p
        style={{
          fontSize: "22px",
          fontWeight: 700,
          color: tone === "neutral" ? E.text : accent,
          fontFamily: "var(--font-sans)",
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "-0.01em",
          marginBottom: sub ? "2px" : 0,
          lineHeight: 1.1,
        }}
      >
        {value}
      </p>
      {sub && (
        <p
          style={{
            fontSize: "11px",
            color: E.textFaint,
            fontFamily: "var(--font-sans)",
          }}
        >
          {sub}
        </p>
      )}
    </ECard>
  );
}

// ─── Botao primario gold + outline ──────────────────────────────────────────

export function EButton({
  children,
  onClick,
  variant = "outline",
  size = "default",
  disabled,
  type = "button",
  style,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "gold" | "outline" | "ghost" | "danger";
  size?: "sm" | "default";
  disabled?: boolean;
  type?: "button" | "submit";
  style?: React.CSSProperties;
}) {
  const sz =
    size === "sm"
      ? { padding: "6px 12px", fontSize: "11px" }
      : { padding: "8px 16px", fontSize: "12px" };
  const styles: Record<string, React.CSSProperties> = {
    gold: {
      background: "linear-gradient(135deg,#C9A84C,#A07820)",
      color: "#0d0b07",
      border: "none",
      fontWeight: 600,
    },
    outline: {
      background: "transparent",
      color: E.text,
      border: `1px solid ${E.border}`,
      fontWeight: 500,
    },
    ghost: {
      background: "transparent",
      color: E.textMuted,
      border: "none",
      fontWeight: 500,
    },
    danger: {
      background: E.redSoft,
      color: E.red,
      border: `1px solid ${E.redSoft}`,
      fontWeight: 500,
    },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...sz,
        ...styles[variant],
        borderRadius: "6px",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        fontFamily: "var(--font-sans)",
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        transition: "opacity 0.15s, border-color 0.15s",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ─── Empty state ────────────────────────────────────────────────────────────

export function EEmpty({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <ECard padding="40px 24px">
      <div style={{ textAlign: "center" }}>
        <p
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: E.text,
            fontFamily: "var(--font-display)",
            marginBottom: "6px",
          }}
        >
          {title}
        </p>
        {hint && (
          <p
            style={{
              fontSize: "12px",
              color: E.textMuted,
              fontFamily: "var(--font-sans)",
              marginBottom: action ? "16px" : 0,
              maxWidth: "360px",
              margin: action ? "0 auto 16px" : "0 auto",
              lineHeight: 1.5,
            }}
          >
            {hint}
          </p>
        )}
        {action}
      </div>
    </ECard>
  );
}

// ─── Status pill ────────────────────────────────────────────────────────────

export function EPill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "positive" | "negative" | "warning" | "gold";
}) {
  const accent =
    tone === "positive"
      ? E.green
      : tone === "negative"
      ? E.red
      : tone === "warning"
      ? E.amber
      : tone === "gold"
      ? E.gold
      : E.textMuted;
  const accentBg =
    tone === "positive"
      ? E.greenSoft
      : tone === "negative"
      ? E.redSoft
      : tone === "warning"
      ? E.amberSoft
      : tone === "gold"
      ? E.goldSoft
      : "rgba(160,144,104,0.1)";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        fontSize: "10px",
        fontWeight: 600,
        color: accent,
        background: accentBg,
        padding: "2px 8px",
        borderRadius: "10px",
        letterSpacing: "0.04em",
        fontFamily: "var(--font-sans)",
      }}
    >
      {children}
    </span>
  );
}

// ─── Mini bar chart (12m) ──────────────────────────────────────────────────

export function ETrendBars({
  data,
  height = 100,
  format,
}: {
  data: { label: string; value: number }[];
  height?: number;
  format?: (v: number) => string;
}) {
  if (data.length === 0) return null;
  const max = Math.max(...data.map((d) => Math.abs(d.value)), 1);
  const fmt = format ?? ((v: number) => v.toFixed(0));
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${data.length}, 1fr)`,
        gap: "8px",
        alignItems: "end",
        height: `${height}px`,
      }}
    >
      {data.map((d, i) => {
        const h = (Math.abs(d.value) / max) * (height - 24);
        const positive = d.value >= 0;
        return (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-end",
              height: "100%",
              gap: "4px",
            }}
            title={fmt(d.value)}
          >
            <div
              style={{
                width: "100%",
                height: `${h}px`,
                background: positive
                  ? "linear-gradient(180deg, #C9A84C, rgba(201,168,76,0.4))"
                  : "linear-gradient(180deg, #f87171, rgba(248,113,113,0.4))",
                borderRadius: "3px 3px 0 0",
                minHeight: "2px",
              }}
            />
            <span
              style={{
                fontSize: "9px",
                color: E.textFaint,
                fontFamily: "var(--font-sans)",
                letterSpacing: "0.02em",
              }}
            >
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
