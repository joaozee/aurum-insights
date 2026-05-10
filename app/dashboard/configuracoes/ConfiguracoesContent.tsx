"use client";

import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  BookOpen,
  Crown,
  HelpCircle,
  FileText,
  Shield,
  MessageSquare,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  currentUserEmail: string;
  currentUserName: string;
}

interface SettingRow {
  icon: LucideIcon;
  label: string;
  hint?: string;
  href?: string;
  comingSoon?: boolean;
}

interface SettingGroup {
  label: string;
  description?: string;
  rows: SettingRow[];
}

const GROUPS: SettingGroup[] = [
  {
    label: "Conta",
    description: "Identidade e assinatura.",
    rows: [
      {
        icon: Pencil,
        label: "Editar perfil",
        hint: "Nome, bio, avatar e capa",
        href: "/dashboard/perfil",
      },
      {
        icon: BookOpen,
        label: "Meus cursos",
        hint: "Aulas em andamento e certificados",
        href: "/dashboard/cursos",
      },
      {
        icon: Crown,
        label: "Assinatura Premium",
        hint: "Plano, faturas e cancelamento",
        href: "/dashboard/assinaturas",
      },
    ],
  },
  {
    label: "Suporte",
    description: "Ajuda, documentos legais e contato.",
    rows: [
      {
        icon: HelpCircle,
        label: "Ajuda e perguntas frequentes",
        href: "/dashboard/ajuda",
      },
      {
        icon: MessageSquare,
        label: "Falar com suporte",
        href: "/dashboard/contato",
      },
      {
        icon: FileText,
        label: "Termos de uso",
        href: "/dashboard/termos",
      },
      {
        icon: Shield,
        label: "Política de privacidade",
        href: "/dashboard/privacidade",
      },
    ],
  },
];

export default function ConfiguracoesContent({
  currentUserEmail,
  currentUserName,
}: Props) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-[calc(100vh-58px)] bg-background">
      <div className="mx-auto max-w-[720px] px-6 pt-8 pb-20">
        {/* Back */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard")}
          className="mb-10 -ml-3 text-muted-foreground hover:text-primary"
        >
          <ChevronLeft className="size-[15px]" /> Voltar
        </Button>

        {/* Header */}
        <header className="mb-12">
          <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-primary">
            Configurações
          </span>
          <h1 className="mt-3 font-display font-bold tracking-[-0.01em] text-[clamp(28px,3.5vw,38px)] leading-tight text-[var(--text-strong)]">
            {currentUserName}
          </h1>
          <p className="mt-2 text-[13px] text-muted-foreground">
            {currentUserEmail}
          </p>
        </header>

        {/* Groups */}
        <div className="space-y-12">
          {GROUPS.map((g) => (
            <section key={g.label}>
              <div className="mb-4">
                <h2 className="font-display text-[18px] font-semibold tracking-[-0.01em] text-[var(--text-default)]">
                  {g.label}
                </h2>
                {g.description && (
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    {g.description}
                  </p>
                )}
              </div>
              <ul className="border-t border-[var(--border-faint)]">
                {g.rows.map((row) => (
                  <SettingItem
                    key={row.label}
                    row={row}
                    onClick={() => row.href && !row.comingSoon && router.push(row.href)}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>

        {/* Sair */}
        <section className="mt-14 border-t border-[var(--border-faint)] pt-8">
          <button
            onClick={handleSignOut}
            className="group flex w-full items-center justify-between rounded-md px-3 py-3 text-left transition-colors hover:bg-[var(--negative-bg)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <span className="flex items-center gap-3">
              <LogOut className="size-4 text-[var(--negative)]" />
              <span className="text-[14px] font-medium text-[var(--negative)]">
                Sair da conta
              </span>
            </span>
            <ChevronRight className="size-4 text-[var(--negative)]/60 transition-transform group-hover:translate-x-0.5" />
          </button>
        </section>

        {/* Footer */}
        <footer className="mt-16 text-center">
          <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-faint)]">
            © 2026 Grupo Aurum
          </p>
        </footer>
      </div>
    </div>
  );
}

// ─── Subcomponents ───────────────────────────────────────────────────────────

function SettingItem({
  row,
  onClick,
}: {
  row: SettingRow;
  onClick: () => void;
}) {
  const { icon: Icon, label, hint, comingSoon } = row;
  const interactive = !comingSoon && !!row.href;

  return (
    <li className="border-b border-[var(--border-faint)]">
      <button
        type="button"
        onClick={onClick}
        disabled={!interactive}
        aria-label={label}
        className={cn(
          "group grid w-full grid-cols-[28px_1fr_auto_18px] items-center gap-x-4 py-4 text-left transition-colors",
          interactive
            ? "cursor-pointer hover:bg-[var(--bg-card)]/50"
            : "cursor-default",
        )}
      >
        <Icon
          className={cn(
            "size-4",
            interactive ? "text-primary" : "text-[var(--text-faint)]",
          )}
        />
        <div className="min-w-0">
          <span
            className={cn(
              "block text-[14px] font-medium",
              interactive
                ? "text-[var(--text-default)] group-hover:text-primary"
                : "text-muted-foreground",
            )}
          >
            {label}
          </span>
          {hint && (
            <span className="mt-0.5 block text-[12px] text-muted-foreground">
              {hint}
            </span>
          )}
        </div>
        {comingSoon && (
          <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--text-faint)]">
            Em breve
          </span>
        )}
        {interactive && (
          <ChevronRight className="col-start-4 size-[18px] text-[var(--text-faint)] transition-colors group-hover:text-primary" />
        )}
      </button>
    </li>
  );
}
