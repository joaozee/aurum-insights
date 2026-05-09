"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  Heart,
  MessageCircle,
  Repeat2,
  TrendingUp,
  TrendingDown,
  Wallet,
  BookOpen,
  Users,
  Plus,
  ArrowRight,
} from "lucide-react";
import type { MarketItem } from "@/app/api/market/route";
import { createClient } from "@/lib/supabase/client";
import { formatRelativeTime, initialFromName } from "@/lib/comunidade";
import { CHART_PALETTE } from "@/lib/aurum-colors";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
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

export interface AssetBreakdown {
  acoes: number;
  fiis: number;
  renda_fixa: number;
  cripto: number;
  fundos: number;
  total: number;
}

interface HomeContentProps {
  firstName: string;
  marketData: MarketItem[];
  quickStats?: {
    assetCount: number;
    monthBalance: number;
  };
  assetBreakdown?: AssetBreakdown;
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

const CLASS_LABELS: Record<keyof Omit<AssetBreakdown, "total">, string> = {
  acoes: "Ações",
  fiis: "FIIs",
  renda_fixa: "Renda Fixa",
  cripto: "Cripto",
  fundos: "Fundos",
};

const CLASS_COLORS: Record<keyof Omit<AssetBreakdown, "total">, string> = {
  acoes: CHART_PALETTE[5],      // slate blue
  fiis: CHART_PALETTE[2],       // terracotta
  renda_fixa: CHART_PALETTE[7], // olive
  cripto: CHART_PALETTE[0],     // gold
  fundos: CHART_PALETTE[4],     // mauve
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function HomeContent({
  firstName,
  marketData,
  quickStats,
  assetBreakdown,
}: HomeContentProps) {
  const router = useRouter();
  const stats = quickStats ?? { assetCount: 0, monthBalance: 0 };
  const breakdown = assetBreakdown ?? { acoes: 0, fiis: 0, renda_fixa: 0, cripto: 0, fundos: 0, total: 0 };
  const supabase = useMemo(() => createClient(), []);

  const [posts, setPosts] = useState<HomePost[]>([]);
  const [postsThisWeek, setPostsThisWeek] = useState<number>(0);
  const [avatarByEmail, setAvatarByEmail] = useState<Map<string, string>>(new Map());
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  const reloadPosts = useCallback(() => setLoadAttempt((n) => n + 1), []);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoadingPosts(true);
      setPostsError(null);
      try {
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

        if (postsRes.error) throw postsRes.error;
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
      } catch (err) {
        console.error("[home/posts]", err);
        if (active) setPostsError("Não consegui carregar os posts da comunidade.");
      } finally {
        if (active) setLoadingPosts(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [supabase, loadAttempt]);

  const statement = buildStatement(stats, marketData);

  return (
    <div className="bg-background min-h-[calc(100vh-58px)]">
      <div className="mx-auto max-w-[1080px] px-6 pt-10 pb-20 sm:pt-14">
        {/* ─── Hero ──────────────────────────────────────────────────── */}
        <header className="mb-10">
          <Eyebrow>{getGreeting()}</Eyebrow>
          <h1 className="mt-3 font-display font-bold tracking-[-0.02em] leading-[1.05] text-[var(--text-strong)] text-[clamp(36px,4.5vw,52px)]">
            {getGreeting()},{" "}
            <span className="text-primary">{capitalize(firstName)}</span>
          </h1>
          <p className="mt-4 max-w-[560px] text-[15px] sm:text-[17px] leading-[1.6] text-[var(--text-body)]">
            {statement}
          </p>
        </header>

        {/* ─── Mercado strip ──────────────────────────────────────────── */}
        <section className="mb-10">
          <SectionHeader
            label="Mercado agora"
            cta="Análise completa"
            onClick={() => router.push("/dashboard/acoes")}
          />
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {marketData.map((item) => (
              <MarketCard key={item.label} item={item} />
            ))}
          </div>
        </section>

        {/* ─── Carteira widget ────────────────────────────────────────── */}
        <section className="mb-10">
          <SectionHeader
            label="Sua carteira"
            cta="Ver detalhes"
            onClick={() => router.push("/dashboard/carteira")}
          />
          <div className="mt-4">
            {breakdown.total === 0 ? (
              <CarteiraEmpty
                onClick={() => router.push("/dashboard/carteira")}
              />
            ) : (
              <CarteiraOverview
                breakdown={breakdown}
                onClick={() => router.push("/dashboard/carteira")}
              />
            )}
          </div>
        </section>

        {/* ─── Painel: 3 quick links ──────────────────────────────────── */}
        <section className="mb-12 border-t border-[var(--border-faint)]">
          <DashboardRow
            href="/dashboard/financas"
            icon={Wallet}
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
            icon={BookOpen}
            label="Cursos"
            stat="Continue aprendendo"
            hint="Renda Fixa, Análise Fundamentalista, FIIs"
            onClick={() => router.push("/dashboard/cursos")}
          />
          <DashboardRow
            href="/dashboard/comunidade"
            icon={Users}
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
        <section className="mb-14">
          <SectionHeader
            label="Comunidade em destaque"
            cta="Ver todos"
            onClick={() => router.push("/dashboard/comunidade")}
          />
          {postsError ? (
            <div className="mt-4">
              <ErrorState
                title={postsError}
                message="Pode ser uma flutuação na conexão."
                onRetry={reloadPosts}
              />
            </div>
          ) : loadingPosts ? (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <PostPreviewSkeleton />
              <PostPreviewSkeleton />
            </div>
          ) : posts.length === 0 ? (
            <button
              onClick={() => router.push("/dashboard/comunidade")}
              className="mt-4 w-full rounded-[10px] border border-[var(--border-faint)] bg-card px-6 py-9 text-center text-[13px] text-muted-foreground transition-colors hover:border-[var(--border-soft)] hover:bg-[var(--bg-card-hover)]"
            >
              Ainda não há posts. Seja o primeiro a compartilhar.
            </button>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
        <footer className="border-t border-[var(--border-faint)] pt-8 text-center">
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

function SectionHeader({
  label,
  cta,
  onClick,
}: {
  label: string;
  cta?: string;
  onClick?: () => void;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <h2 className="font-display text-[18px] sm:text-[20px] font-semibold tracking-[-0.01em] text-[var(--text-default)]">
        {label}
      </h2>
      {cta && onClick && (
        <button
          onClick={onClick}
          className="inline-flex items-center gap-1 text-[12px] text-primary transition-colors hover:text-[var(--gold-light)]"
        >
          {cta}
          <ChevronRight className="size-3" />
        </button>
      )}
    </div>
  );
}

// ─── Mercado card with sparkline ─────────────────────────────────────────────

function MarketCard({ item }: { item: MarketItem }) {
  const tone = item.positive ? "positive" : "negative";
  const lineColor = item.positive ? "var(--positive)" : "var(--negative)";

  return (
    <div className="group relative overflow-hidden rounded-[10px] border border-[var(--border-faint)] bg-card p-4 transition-colors hover:border-[var(--border-soft)]">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-[11px] uppercase tracking-[0.12em] font-medium text-muted-foreground">
          {item.label}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1 text-[12px] font-semibold tabular-nums",
            tone === "positive"
              ? "text-[var(--positive)]"
              : "text-[var(--negative)]",
          )}
        >
          {item.positive ? (
            <TrendingUp className="size-3" />
          ) : (
            <TrendingDown className="size-3" />
          )}
          {item.value}
        </span>
      </div>
      <div className="mb-3 flex items-baseline">
        <span className="font-display text-[22px] font-bold tracking-[-0.01em] tabular-nums text-[var(--text-default)]">
          {item.price}
        </span>
      </div>
      <Sparkline values={item.spark} color={lineColor} />
    </div>
  );
}

// Inline SVG sparkline. Renders 1d intraday close samples as a smooth path with
// a faint area fill underneath. Returns null when there's not enough data.
function Sparkline({
  values,
  color,
  height = 36,
}: {
  values: number[];
  color: string;
  height?: number;
}) {
  if (!values || values.length < 2) {
    return <div className="h-9 w-full" aria-hidden />;
  }
  const w = 200;
  const h = height;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = w / (values.length - 1);
  const pts = values.map((v, i) => {
    const x = i * step;
    const y = h - ((v - min) / range) * h;
    return [x, y] as const;
  });

  // Build a smooth polyline path using cardinal-like interpolation (cheap).
  const linePath = pts
    .map(([x, y], i) => (i === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : `L ${x.toFixed(1)} ${y.toFixed(1)}`))
    .join(" ");
  const areaPath = `${linePath} L ${w} ${h} L 0 ${h} Z`;

  const gradId = `spark-${Math.abs(values.length * (values[0] || 1)).toFixed(0)}-${color.replace(/[^a-z]/gi, "")}`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      width="100%"
      height={h}
      className="block"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Carteira widget ─────────────────────────────────────────────────────────

function CarteiraOverview({
  breakdown,
  onClick,
}: {
  breakdown: AssetBreakdown;
  onClick: () => void;
}) {
  const classes = (Object.keys(CLASS_LABELS) as (keyof typeof CLASS_LABELS)[])
    .map((k) => ({
      key: k,
      label: CLASS_LABELS[k],
      count: breakdown[k] as number,
      color: CLASS_COLORS[k],
    }))
    .filter((c) => c.count > 0);

  return (
    <button
      onClick={onClick}
      className="group block w-full rounded-[14px] border border-[var(--border-faint)] bg-card p-6 text-left transition-colors hover:border-[var(--border-soft)] sm:p-7"
    >
      <div className="grid grid-cols-1 gap-7 sm:grid-cols-[1fr_auto] sm:items-end">
        {/* Left: count + breakdown */}
        <div>
          <p className="text-[11px] uppercase tracking-[0.12em] font-medium text-muted-foreground">
            Acompanhando
          </p>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="font-display text-[40px] font-bold leading-none tracking-[-0.02em] tabular-nums text-[var(--text-strong)]">
              {breakdown.total}
            </span>
            <span className="text-[14px] text-muted-foreground">
              {breakdown.total === 1 ? "ativo" : "ativos"}
            </span>
          </div>

          {/* Stacked allocation bar */}
          <div className="mt-5 flex h-2 overflow-hidden rounded-full bg-[var(--bg-input)]">
            {classes.map((c) => (
              <div
                key={c.key}
                style={{
                  width: `${(c.count / breakdown.total) * 100}%`,
                  background: c.color,
                }}
                aria-label={`${c.label}: ${c.count}`}
              />
            ))}
          </div>

          {/* Legend */}
          <ul className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px]">
            {classes.map((c) => (
              <li key={c.key} className="flex items-center gap-2">
                <span
                  className="inline-block size-2 rounded-full"
                  style={{ background: c.color }}
                />
                <span className="text-[var(--text-body)]">
                  {c.label}{" "}
                  <span className="text-[var(--text-faint)] tabular-nums">
                    {c.count}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right: arrow */}
        <div className="flex shrink-0 items-center justify-end gap-2 text-[13px] text-muted-foreground transition-colors group-hover:text-primary">
          Ver carteira
          <ArrowRight className="size-4" />
        </div>
      </div>
    </button>
  );
}

function CarteiraEmpty({ onClick }: { onClick: () => void }) {
  return (
    <div className="rounded-[14px] border border-[var(--border-faint)] bg-card p-7 sm:p-8">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-[440px]">
          <p className="text-[11px] uppercase tracking-[0.12em] font-medium text-muted-foreground">
            Vazia
          </p>
          <h3 className="mt-2 font-display text-[22px] sm:text-[26px] font-semibold tracking-[-0.01em] text-[var(--text-strong)]">
            Comece pelo primeiro ativo
          </h3>
          <p className="mt-2 text-[13px] sm:text-[14px] leading-[1.6] text-muted-foreground">
            Cadastre uma ação, FII, posição em renda fixa ou cripto. A partir
            daí o Aurum acompanha preço, dividendos e performance pra você.
          </p>
        </div>
        <Button variant="gold" size="lg" onClick={onClick} className="shrink-0">
          <Plus className="size-4" />
          Cadastrar ativo
        </Button>
      </div>
    </div>
  );
}

// ─── Dashboard row ───────────────────────────────────────────────────────────

function DashboardRow({
  label,
  stat,
  hint,
  icon: Icon,
  statTone,
  onClick,
}: {
  href: string;
  label: string;
  stat: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  statTone?: "positive" | "negative" | "muted";
  onClick: () => void;
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
      className="group grid w-full grid-cols-[28px_1fr_auto_18px] items-center gap-x-4 sm:gap-x-6 border-b border-[var(--border-faint)] py-5 sm:py-6 text-left transition-colors hover:bg-[var(--bg-card)]/50"
    >
      <Icon className="size-[18px] text-muted-foreground transition-colors group-hover:text-primary" />
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

// ─── Post preview ────────────────────────────────────────────────────────────

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

// Skeleton shaped like a PostPreview, so the section size doesn't shift when
// the real posts replace the placeholders.
function PostPreviewSkeleton() {
  return (
    <div className="rounded-[10px] border border-[var(--border-faint)] bg-card p-5">
      <div className="mb-3 flex items-center gap-2.5">
        <Skeleton className="size-8 rounded-full" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-2.5 w-16" />
        </div>
      </div>
      <div className="mb-4 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-[92%]" />
        <Skeleton className="h-3 w-[78%]" />
      </div>
      <div className="flex gap-5 border-t border-[var(--border-faint)] pt-3">
        <Skeleton className="h-3 w-8" />
        <Skeleton className="h-3 w-8" />
        <Skeleton className="h-3 w-8" />
      </div>
    </div>
  );
}
