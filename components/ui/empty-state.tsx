"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";

/**
 * EmptyState — first-use onboarding for surfaces that haven't accumulated
 * data yet (carteira sem ativos, finanças sem transações, etc).
 *
 * Tom: mentor calmo + sócio direto (PRODUCT.md). Nunca paternalizante,
 * nunca seco. Diz o que falta e qual é o próximo passo concreto.
 *
 * Uses Aurum tokens; no inline hex, no Tailwind 500.
 */

export interface EmptyStateProps {
  /** Optional lucide icon — rendered in a gold-tinted circle. */
  icon?: LucideIcon;
  /** Eyebrow line, uppercase tracking, sits above the heading. Optional. */
  eyebrow?: string;
  /** One short headline, sentence case. */
  title: string;
  /** Plain-language explanation. 1-2 sentences. */
  description?: string;
  /** Primary CTA. */
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  /** Secondary CTA, shown next to action. */
  secondaryAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  /** "card" (default) or "inline" for use inside an existing card. */
  variant?: "card" | "inline";
  className?: string;
}

export function EmptyState({
  icon: Icon,
  eyebrow,
  title,
  description,
  action,
  secondaryAction,
  variant = "card",
  className,
}: EmptyStateProps) {
  const wrapperClass = variant === "card"
    ? "rounded-xl border border-[var(--border-soft)] bg-card px-8 py-10 text-center"
    : "px-4 py-10 text-center";

  return (
    <div className={cn(wrapperClass, className)}>
      {Icon && (
        <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-full bg-[rgba(201,168,76,0.08)]">
          <Icon className="size-5 text-[var(--gold)]" />
        </div>
      )}
      {eyebrow && (
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--gold)] mb-3">
          {eyebrow}
        </p>
      )}
      <h3 className="font-display text-[18px] font-semibold tracking-[-0.005em] text-[var(--text-default)] leading-snug max-w-[420px] mx-auto">
        {title}
      </h3>
      {description && (
        <p className="mt-2.5 text-[13px] leading-[1.6] text-[var(--text-body)] max-w-[460px] mx-auto">
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-6 flex justify-center gap-2.5 flex-wrap">
          {action && <CTA cta={action} variant="gold" />}
          {secondaryAction && <CTA cta={secondaryAction} variant="outline" />}
        </div>
      )}
    </div>
  );
}

function CTA({
  cta,
  variant,
}: {
  cta: NonNullable<EmptyStateProps["action"]>;
  variant: "gold" | "outline";
}) {
  if (cta.href) {
    return (
      <Button asChild variant={variant} size="default" className="text-[13px]">
        <a href={cta.href}>{cta.label}</a>
      </Button>
    );
  }
  return (
    <Button variant={variant} size="default" onClick={cta.onClick} className="text-[13px]">
      {cta.label}
    </Button>
  );
}
