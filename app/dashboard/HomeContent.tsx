"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  Heart,
  MessageCircle,
  Repeat2,
} from "lucide-react";
import type { MarketItem } from "@/app/api/market/route";
import { createClient } from "@/lib/supabase/client";
import { formatRelativeTime, initialFromName } from "@/lib/comunidade";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface HomePost {
  id: string;
  author_name: string | null;
  author_avatar: string | null;
  author_username: string | null;
  author_email: string | null;
  content: string | null;
  created_at: string;
  likes_count: number;
  comments_count: number;
  reposts_count: number;
}

interface HomeContentProps {
  firstName: string;
  marketData: MarketItem[];
  quickStats?: {
    assetCount: number;
    monthBalance: number;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const fmtBRLSigned = (v: number) =>
  `${v >= 0 ? "+" : ""}${fmtBRL(v)}`;

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Builds the contextual hero statement: prioritises month balance > assets >
// market summary > onboarding. Never templated; the answer changes with data.
function buildStatement(
  stats: { assetCount: number; monthBalance: number },
  marketData: MarketItem[],
): string {
  const ibov = marketData.find((m) => m.label === "IBOV");

  if (stats.assetCount === 0 && stats.monthBalance === 0) {
    return "Bom momento pra começar. Cadastre seu primeiro ativo ou registre uma despesa do mês.";
  }

  if (stats.monthBalance > 0) {
    return `Mês positivo: ${fmtBRLSigned(stats.monthBalance)} no saldo. Boa hora pra revisar a alocação.`;
  }
  if (stats.monthBalance < 0) {
    return `Mês fechando em ${fmtBRL(stats.monthBalance)}. Bom momento pra olhar os gastos.`;
  }

  if (stats.assetCount > 0 && ibov) {
    const dir = ibov.positive ? "em alta" : "em baixa";
    return `${stats.assetCount} ${stats.assetCount === 1 ? "ativo" : "ativos"} acompanhados. Mercado ${dir} hoje.`;
  }

  return "Acompanhe sua jornada de patrimônio com método.";
}

function resolveAvatar(
  email: string | null | undefined,
  fallback: string | null | undefined,
  byEmail?: Map<string, string>,
): string | null {
  if (email && byEmail) {
    const live = byEmail.get(email);
    if (live) return live;
  }
  return fallback ?? null;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function HomeContent({ firstName, marketData, quickStats }: HomeContentProps) {
  const router = useRouter();
  const stats = quickStats ?? { assetCount: 0, monthBalance: 0 };
  const supabase = useMemo(() => createClient(), []);

  const [posts, setPosts] = useState<HomePost[]>([]);
  const [postsThisWeek, setPostsThisWeek] = useState<number>(0);
  const [avatarByEmail, setAvatarByEmail] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    let active = true;
    (async () => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const [postsRes, weekCountRes] = await Promise.all([
        supabase
          .from("community_post")
          .select("id, author_name, author_avatar, author_username, author_email, content, created_at, likes_count, comments_count, reposts_count, moderation_status, repost_of_id")
          .neq("moderation_status", "rejeitado")
          .not("content", "is", null)
          .is("repost_of_id", null)
          .order("created_at", { ascending: false })
          .limit(2),
        supabase
          .from("community_post")
          .select("id", { count: "exact", head: true })
          .neq("moderation_status", "rejeitado")
          .not("content", "is", null)
          .gte("created_at", weekAgo.toISOString()),
      ]);

      if (!active) return;
      const list = (postsRes.data ?? []) as HomePost[];
      setPosts(list);
      setPostsThisWeek(weekCountRes.count ?? 0);

      const emails = Array.from(
        new Set(list.map((p) => p.author_email).filter((e): e is string => Boolean(e)))
      );
      if (emails.length > 0) {
        const { data: profs } = await supabase
          .from("user_profile")
          .select("user_email, avatar_url")
          .in("user_email", emails);
        if (!active) return;
        const m = new Map<string, string>();
        for (const p of (profs ?? []) as { user_email: string; avatar_url: string | null }[]) {
          if (p.avatar_url) m.set(p.user_email, p.avatar_url);
        }
        setAvatarByEmail(m);
      } else {
        setAvatarByEmail(new Map());
      }
    })();
    return () => {
      active = false;
    };
  }, [supabase]);

  const statement = buildStatement(stats, marketData);

  return (
    <div className="bg-background min-h-[calc(100vh-58px)]">
      <div className="mx-auto max-w-[960px] px-6 pt-12 pb-20 sm:pt-16">
        {/* ─── Hero ──────────────────────────────────────────────────── */}
        <header className="mb-12 sm:mb-14">
          <Eyebrow>{getGreeting()}</Eyebrow>
          <h1 className="mt-4 font-display font-bold tracking-[-0.02em] leading-[1.05] text-[var(--text-strong)] text-[clamp(36px,4.5vw,52px)]">
            {getGreeting()},{" "}
            <span className="text-primary">{capitalize(firstName)}</span>
          </h1>
          <p className="mt-5 max-w-[560px] text-[15px] sm:text-[17px] leading-[1.6] text-[var(--text-body)]">
            {statement}
          </p>
          <MarketStrip data={marketData} />
        </header>

        {/* ─── Dashboard list (replaces 4-card Quick Access grid) ────── */}
        <section className="border-t border-[var(--border-faint)]">
          <DashboardRow
            href="/dashboard/carteira"
            label="Sua carteira"
            stat={
              stats.assetCount > 0
                ? `${stats.assetCount} ${stats.assetCount === 1 ? "ativo" : "ativos"}`
                : "Vazia"
            }
            hint={stats.assetCount === 0 ? "Comece registrando" : undefined}
            onClick={() => router.push("/dashboard/carteira")}
          />
          <DashboardRow
            href="/dashboard/financas"
            label="Suas finanças"
            stat={
              stats.monthBalance !== 0
                ? `${fmtBRLSigned(stats.monthBalance)} no mês`
                : "Sem movimentos"
            }
            statTone={
              stats.monthBalance > 0
                ? "positive"
                : stats.monthBalance < 0
                ? "negative"
                : "muted"
            }
            hint={stats.monthBalance === 0 ? "Registre uma transação" : undefined}
            onClick={() => router.push("/dashboard/financas")}
          />
          <DashboardRow
            href="/dashboard/cursos"
            label="Cursos"
            stat="Continue aprendendo"
            hint="Renda Fixa, Análise Fundamentalista, FIIs"
            onClick={() => router.push("/dashboard/cursos")}
          />
          <DashboardRow
            href="/dashboard/comunidade"
            label="Comunidade"
            stat={
              postsThisWeek > 0
                ? `${postsThisWeek} ${postsThisWeek === 1 ? "post" : "posts"} esta semana`
                : "Comece o feed"
            }
            onClick={() => router.push("/dashboard/comunidade")}
          />
        </section>

        {/* ─── Comunidade em destaque ─────────────────────────────────── */}
        <section className="mt-16">
          <SectionHeader
            label="Comunidade em destaque"
            cta="Ver todos"
            onClick={() => router.push("/dashboard/comunidade")}
          />

          {posts.length === 0 ? (
            <button
              onClick={() => router.push("/dashboard/comunidade")}
              className="mt-5 w-full rounded-[10px] border border-[var(--border-faint)] bg-card px-6 py-9 text-center text-[13px] text-muted-foreground transition-colors hover:border-[var(--border-soft)] hover:bg-[var(--bg-card-hover)]"
            >
              Ainda não há posts. Seja o primeiro a compartilhar.
            </button>
          ) : (
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {posts.map((p) => (
                <PostPreview
                  key={p.id}
                  post={p}
                  avatarUrl={resolveAvatar(p.author_email, p.author_avatar, avatarByEmail)}
                  onClick={() => router.push("/dashboard/comunidade")}
                />
              ))}
            </div>
          )}
        </section>

        {/* ─── Footer link to Sobre ──────────────────────────────────── */}
        <footer className="mt-16 border-t border-[var(--border-faint)] pt-8 text-center">
          <button
            onClick={() => router.push("/dashboard/sobre")}
            className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-primary"
          >
            Conhecer o Aurum
            <ChevronRight className="size-3" />
          </button>
        </footer>
      </div>
    </div>
  );
}

// ─── Subcomponents ───────────────────────────────────────────────────────────

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-primary">
      {children}
    </span>
  );
}

// Inline market strip below the hero statement. Not a sidebar card; a quiet
// data line. Tabular-nums so percentages align across rows.
function MarketStrip({ data }: { data: MarketItem[] }) {
  if (data.length === 0) return null;
  return (
    <div className="mt-7 flex flex-wrap items-baseline gap-x-5 gap-y-2 text-[12px] sm:text-[13px] tabular-nums">
      {data.map((item, i) => (
        <span key={item.label} className="flex items-baseline gap-1.5">
          {i > 0 && (
            <span aria-hidden className="text-[var(--text-faint)] mr-3">·</span>
          )}
          <span className="text-muted-foreground font-medium">{item.label}</span>
          <span
            className={cn(
              "font-semibold",
              item.positive ? "text-[var(--positive)]" : "text-[var(--negative)]",
            )}
          >
            {item.value}
          </span>
        </span>
      ))}
    </div>
  );
}

// One row of the dashboard list. NOT a card. Three columns: label+hint, stat,
// chevron. Border-bottom only; the section's border-top creates the frame.
function DashboardRow({
  label,
  stat,
  hint,
  statTone,
  onClick,
  href,
}: {
  label: string;
  stat: string;
  hint?: string;
  statTone?: "positive" | "negative" | "muted";
  onClick: () => void;
  href: string;
}) {
  const toneClass =
    statTone === "positive"
      ? "text-[var(--positive)]"
      : statTone === "negative"
      ? "text-[var(--negative)]"
      : statTone === "muted"
      ? "text-muted-foreground"
      : "text-[var(--text-body)]";

  return (
    <button
      onClick={onClick}
      aria-label={`${label}: ${stat}`}
      data-href={href}
      className="group grid w-full grid-cols-[1fr_auto_18px] items-center gap-x-4 sm:gap-x-6 border-b border-[var(--border-faint)] py-5 sm:py-6 text-left transition-colors hover:bg-[var(--bg-card)]/50"
    >
      <div className="min-w-0">
        <span className="block font-display text-[18px] sm:text-[20px] font-semibold text-[var(--text-default)] transition-colors group-hover:text-primary">
          {label}
        </span>
        {hint && (
          <span className="mt-1 block text-[12px] leading-snug text-muted-foreground">
            {hint}
          </span>
        )}
      </div>
      <span className={cn("text-[14px] sm:text-[15px] font-medium tabular-nums", toneClass)}>
        {stat}
      </span>
      <ChevronRight className="size-[18px] text-[var(--text-faint)] transition-colors group-hover:text-primary" />
    </button>
  );
}

function SectionHeader({
  label,
  cta,
  onClick,
}: {
  label: string;
  cta: string;
  onClick: () => void;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <h2 className="font-display text-[18px] sm:text-[20px] font-semibold tracking-[-0.01em] text-[var(--text-default)]">
        {label}
      </h2>
      <button
        onClick={onClick}
        className="inline-flex items-center gap-1 text-[12px] text-primary transition-colors hover:text-[var(--gold-light)]"
      >
        {cta}
        <ChevronRight className="size-3" />
      </button>
    </div>
  );
}

function PostPreview({
  post,
  avatarUrl,
  onClick,
}: {
  post: HomePost;
  avatarUrl: string | null;
  onClick: () => void;
}) {
  const initial = initialFromName(post.author_name);
  return (
    <div
      onClick={onClick}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick(); }}
      className="cursor-pointer rounded-[10px] border border-[var(--border-faint)] bg-card p-5 transition-colors hover:border-[var(--border-soft)]"
    >
      <div className="mb-3 flex items-center gap-2.5">
        <div
          className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[var(--gold)] to-[var(--gold-dim)] text-[12px] font-bold text-[#0d0b07]"
          style={
            avatarUrl
              ? { background: `url(${avatarUrl}) center/cover no-repeat` }
              : undefined
          }
        >
          {!avatarUrl && initial}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold leading-tight text-[var(--text-default)]">
            {post.author_name ?? "Anônimo"}
          </p>
          <p className="text-[11px] text-[var(--text-faint)]">
            {formatRelativeTime(post.created_at)}
          </p>
        </div>
      </div>

      <p className="mb-4 line-clamp-4 text-[13px] leading-[1.6] text-[var(--text-body)]">
        {post.content}
      </p>

      <div className="flex gap-5 border-t border-[var(--border-faint)] pt-3 text-[11px] text-[var(--text-faint)]">
        <Stat icon={<Heart className="size-3" />} count={post.likes_count} />
        <Stat icon={<MessageCircle className="size-3" />} count={post.comments_count} />
        <Stat icon={<Repeat2 className="size-3" />} count={post.reposts_count} />
      </div>
    </div>
  );
}

function Stat({ icon, count }: { icon: React.ReactNode; count: number }) {
  return (
    <span className="flex items-center gap-1.5">
      {icon}
      {count ?? 0}
    </span>
  );
}
