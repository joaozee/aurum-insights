"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * ErrorState — uniform fallback for failed network/data calls across the app.
 *
 * Three sizes:
 *  - "inline": dense one-liner inside another card or section
 *  - "card":   default standalone card (most common)
 *  - "page":   centered, full-section, used when the entire page failed
 *
 * Tom mentor + sócio: explica o que aconteceu, sem código técnico, sem
 * culpar o usuário, com botão de retry opcional.
 */

export interface ErrorStateProps {
  /** Short headline. Default: "Não consegui carregar isso." */
  title?: string;
  /** Plain-language explanation, one sentence. */
  message?: string;
  /** Retry callback. If provided, renders a "Tentar de novo" button. */
  onRetry?: () => void;
  /** Custom CTA label. Default: "Tentar de novo". */
  retryLabel?: string;
  /** Visual size. */
  variant?: "inline" | "card" | "page";
  /** Extra classes. */
  className?: string;
}

export function ErrorState({
  title = "Não consegui carregar isso.",
  message = "Pode ser uma flutuação na conexão.",
  onRetry,
  retryLabel = "Tentar de novo",
  variant = "card",
  className,
}: ErrorStateProps) {
  if (variant === "inline") {
    return (
      <div
        role="alert"
        className={cn(
          "flex items-center gap-3 rounded-md border border-[var(--border-faint)] bg-card px-4 py-3 text-[12px]",
          className,
        )}
      >
        <AlertCircle className="size-4 shrink-0 text-[var(--negative)]" />
        <span className="flex-1 text-[var(--text-body)]">{title}</span>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1 text-[12px] font-medium text-primary transition-colors hover:text-[var(--gold-light)]"
          >
            <RefreshCw className="size-3" />
            {retryLabel}
          </button>
        )}
      </div>
    );
  }

  if (variant === "page") {
    return (
      <div
        role="alert"
        className={cn(
          "mx-auto flex min-h-[300px] max-w-[420px] flex-col items-center justify-center px-6 py-10 text-center",
          className,
        )}
      >
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-[var(--negative-bg)]">
          <AlertCircle className="size-6 text-[var(--negative)]" />
        </div>
        <h2 className="font-display text-[20px] font-semibold tracking-[-0.01em] text-[var(--text-strong)]">
          {title}
        </h2>
        <p className="mt-2 text-[14px] leading-[1.6] text-[var(--text-body)]">
          {message}
        </p>
        {onRetry && (
          <Button
            variant="outline"
            size="default"
            onClick={onRetry}
            className="mt-6"
          >
            <RefreshCw className="size-4" />
            {retryLabel}
          </Button>
        )}
      </div>
    );
  }

  // Default: card
  return (
    <div
      role="alert"
      className={cn(
        "rounded-[10px] border border-[var(--border-faint)] bg-card p-5",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--negative-bg)]">
          <AlertCircle className="size-4 text-[var(--negative)]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-medium text-[var(--text-default)]">
            {title}
          </p>
          <p className="mt-1 text-[12px] leading-[1.5] text-muted-foreground">
            {message}
          </p>
        </div>
      </div>
      {onRetry && (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-soft)] px-3 py-1.5 text-[12px] font-medium text-primary transition-colors hover:border-[var(--border-emphasis)] hover:bg-[var(--bg-card-hover)]"
          >
            <RefreshCw className="size-3" />
            {retryLabel}
          </button>
        </div>
      )}
    </div>
  );
}
