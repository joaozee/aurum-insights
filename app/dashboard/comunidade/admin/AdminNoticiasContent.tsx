"use client";

/**
 * AdminNoticiasContent — Curadoria de notícias da Comunidade.
 *
 * Fluxo:
 *  1. Admin abre /dashboard/comunidade/admin
 *  2. Vê um grid de notícias agregadas via GDELT (default: PT-BR, últimas 24h)
 *  3. Pode filtrar por idioma/país/janela/temas
 *  4. Seleciona as relevantes (checkbox), define hashtag/tema, posta tudo de uma vez
 *  5. Cada artigo selecionado vira um post na community_post com:
 *       post_type = "news"
 *       news_title, news_url, news_thumbnail = dados do GDELT
 *       content = "<#hashtag> <título>" (pro feed render bonito + filtro por hashtag)
 *       tags = ["noticia", ...tags extras]
 *
 * Identidade visual segue o padrão da página /acoes (cards de notícias com thumb +
 * categoria + título + data).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Newspaper, Search, RefreshCw, ArrowLeft, Check, ExternalLink,
  Filter, Globe, Languages, Calendar, Hash, Sparkles, Send,
  AlertCircle, ChevronDown, Wand2, Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { toast } from "sonner";

// ─── Identidade do autor das notícias ────────────────────────────────────────
// Posts curados pelo admin aparecem como "Notícias Aurum" — usuário oficial
// (fictício) que centraliza o canal de notícias. Evita confundir o feed com
// posts pessoais do admin. Author_avatar fica null pra que o componente Avatar
// caia no fallback de inicial "N" sobre fundo gold.

const AURUM_NEWS_AUTHOR = {
  author_name: "Notícias Aurum",
  author_username: "noticias_aurum",
  author_email: "noticias@aurum.app",
  author_avatar: null as string | null,
};

interface Props {
  userEmail: string;
  userName: string;
  userAvatar: string | null;
}

interface GdeltNewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  pubDate: string | null;
  thumb: string | null;
  language: string;
  country: string;
}

type Lang = "pt" | "en" | "es" | "fr";
type Timespan = "24h" | "3d" | "7d";
type CountryCode = "BR" | "US" | "PT" | "EU" | "GLOBAL";

const COUNTRIES: { code: CountryCode; label: string; flag: string }[] = [
  { code: "BR",     label: "Brasil",          flag: "BR" },
  { code: "US",     label: "Estados Unidos",  flag: "US" },
  { code: "PT",     label: "Portugal",        flag: "PT" },
  { code: "GLOBAL", label: "Global",          flag: "GL" },
];

const TIMESPANS: { code: Timespan; label: string }[] = [
  { code: "24h", label: "Últimas 24h" },
  { code: "3d",  label: "3 dias" },
  { code: "7d",  label: "7 dias" },
];

const LANGUAGES: { code: Lang; label: string }[] = [
  { code: "pt", label: "Português" },
  { code: "en", label: "Inglês" },
  { code: "es", label: "Espanhol" },
  { code: "fr", label: "Francês" },
];

// Temas pré-definidos — botões rápidos pra explorar
const QUICK_THEMES: { label: string; query: string; tag: string }[] = [
  { label: "Mercado",      query: "(mercado financeiro OR bolsa OR ações OR Ibovespa)", tag: "mercado" },
  { label: "Macro",        query: "(Selic OR inflação OR PIB OR IPCA OR taxa de juros)", tag: "macro" },
  { label: "Cripto",       query: "(criptomoeda OR Bitcoin OR Ethereum OR cripto)", tag: "cripto" },
  { label: "FIIs",         query: "(fundos imobiliários OR FII OR \"fundos de investimento\")", tag: "fiis" },
  { label: "Internacional",query: "(Fed OR Wall Street OR \"S&P 500\" OR Dow Jones OR Nasdaq)", tag: "internacional" },
  { label: "Empresas",     query: "(Petrobras OR Vale OR Itaú OR Bradesco OR balanço resultado)", tag: "empresas" },
];

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function fmtRelative(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

// O componente ainda recebe userEmail/Name/Avatar via Props pra retrocompat com
// page.tsx, mas agora os posts são publicados como "Notícias Aurum" (autor
// fictício oficial). Os args ficam não usados intencionalmente — eslint-disable
// pontual abaixo evita warning.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function AdminNoticiasContent({ userEmail, userName, userAvatar }: Props) {
  // Silencia "noUnusedLocals" do TS estrito sem perder o shape de Props.
  void userEmail; void userName; void userAvatar;
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  // Filtros
  const [country, setCountry] = useState<CountryCode>("BR");
  const [lang, setLang] = useState<Lang>("pt");
  const [timespan, setTimespan] = useState<Timespan>("24h");
  const [customQuery, setCustomQuery] = useState("");
  const [activeTheme, setActiveTheme] = useState<string | null>(null);
  const [hashtag, setHashtag] = useState("noticia");

  // Dados
  const [items, setItems] = useState<GdeltNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [alreadyPosted, setAlreadyPosted] = useState<Set<string>>(new Set());
  const [posting, setPosting] = useState(false);
  // Resumo por item selecionado (vai pro content do post). Mapeia id (URL) → resumo
  const [summaries, setSummaries] = useState<Map<string, string>>(new Map());
  // IDs em fetch de preview (loading state do botão "Sugerir resumo")
  const [fetchingPreview, setFetchingPreview] = useState<Set<string>>(new Set());
  // Cache de previews já buscados (URL → description) — evita rebuscar
  const previewCache = useRef<Map<string, string>>(new Map());

  // Traduz códigos de erro técnicos do backend pra mensagem amigável ao admin.
  // Mantém intencionalmente factual — não promete nada que não está sob controle.
  const friendlyError = useCallback(
    (code: string, retryAfterSec: number | null): string => {
      switch (code) {
        case "rate_limit": {
          const wait = retryAfterSec && retryAfterSec > 0
            ? ` Tente novamente em ~${retryAfterSec}s.`
            : " Aguarde alguns segundos e tente de novo.";
          return `O GDELT está limitando o número de buscas no momento.${wait}`;
        }
        case "gdelt_unavailable":
          return "O GDELT está temporariamente fora do ar. Tente em alguns minutos.";
        case "empty_response":
          return "Nenhum artigo retornado para essa combinação de filtros — tente abrir o tema ou janela de tempo.";
        case "parse_error":
          return "Resposta inesperada do GDELT. Tentar de novo costuma resolver.";
        case "network_error":
          return "Não foi possível alcançar o GDELT. Verifique a conexão e tente novamente.";
        default:
          if (code.startsWith("http_")) {
            return `O GDELT respondeu com erro (${code.replace("http_", "")}). Tente novamente em instantes.`;
          }
          return "Não consegui carregar as notícias do GDELT.";
      }
    },
    [],
  );

  // AbortController pra cancelar requests em voo quando os filtros mudam.
  // Sem isso, mudanças rápidas em sequência (clicar 3 temas seguidos) disparam
  // 3 chamadas paralelas — algumas resolvem fora de ordem e o GDELT castiga.
  const inFlightRef = useRef<AbortController | null>(null);

  const loadNews = useCallback(async () => {
    // Cancela qualquer request anterior em voo
    inFlightRef.current?.abort();
    const ac = new AbortController();
    inFlightRef.current = ac;

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (customQuery.trim()) params.set("q", customQuery.trim());
      else if (activeTheme) {
        const theme = QUICK_THEMES.find((t) => t.label === activeTheme);
        if (theme) params.set("q", theme.query);
      }
      params.set("lang", lang);
      if (country !== "GLOBAL") params.set("country", country);
      params.set("timespan", timespan);
      params.set("max", "50");

      const res = await fetch(`/api/gdelt-news?${params.toString()}`, { signal: ac.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as {
        items?: GdeltNewsItem[];
        error?: string;
        retryAfterSeconds?: number | null;
      };
      // Se a request foi cancelada entre o fetch e o setState, sai sem mexer
      if (ac.signal.aborted) return;
      setItems(data.items ?? []);
      if (data.error) {
        setError(friendlyError(data.error, data.retryAfterSeconds ?? null));
      }
    } catch (err) {
      // AbortError é esperado quando filtros mudam — não é erro real
      if ((err as Error)?.name === "AbortError") return;
      console.error("[admin-noticias/loadNews]", err);
      setError("Não consegui carregar as notícias do GDELT.");
    } finally {
      if (!ac.signal.aborted) setLoading(false);
    }
  }, [customQuery, activeTheme, lang, country, timespan, friendlyError]);

  // Refaz a busca quando os filtros mudam — com debounce de 350ms.
  // Mudanças rápidas (clicar 3 temas em sequência, digitar na busca) viram
  // uma única chamada ao GDELT, reduzindo risco de 429.
  useEffect(() => {
    const t = setTimeout(() => { loadNews(); }, 350);
    return () => clearTimeout(t);
  }, [loadNews]);

  // Carrega os URLs já postados como notícia pra desabilitar duplicatas
  const loadAlreadyPosted = useCallback(async () => {
    const { data } = await supabase
      .from("community_post")
      .select("news_url")
      .eq("post_type", "news")
      .not("news_url", "is", null)
      .order("created_at", { ascending: false })
      .limit(500);
    const urls = new Set<string>((data ?? []).map((r: { news_url: string | null }) => r.news_url).filter((x): x is string => Boolean(x)));
    setAlreadyPosted(urls);
  }, [supabase]);

  useEffect(() => { loadAlreadyPosted(); }, [loadAlreadyPosted]);

  // Busca o resumo OG da página da notícia e popula o textarea. Não sobrescreve
  // se o admin já digitou algo — só preenche quando o campo está vazio.
  const fetchPreview = useCallback(async (item: GdeltNewsItem, force = false) => {
    if (!force) {
      // Se já tem cache e o draft já foi preenchido, pula
      if (previewCache.current.has(item.url) && (summaries.get(item.id) ?? "").trim()) return;
    }
    setFetchingPreview((prev) => {
      const next = new Set(prev);
      next.add(item.id);
      return next;
    });
    try {
      let description = previewCache.current.get(item.url);
      if (!description || force) {
        const res = await fetch(`/api/news-preview?url=${encodeURIComponent(item.url)}`);
        if (res.ok) {
          const data = (await res.json()) as { description: string | null };
          description = data.description ?? "";
          if (description) previewCache.current.set(item.url, description);
        }
      }
      if (description && description.length > 0) {
        // Só popula se o campo estiver vazio (não sobrescreve edição do admin)
        const current = summaries.get(item.id) ?? "";
        if (!current.trim() || force) {
          setSummaries((prev) => {
            const next = new Map(prev);
            next.set(item.id, description!);
            return next;
          });
        }
      }
    } catch (err) {
      console.warn("[news-preview] falhou", err);
    } finally {
      setFetchingPreview((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  }, [summaries]);

  function toggleSelect(id: string) {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
      // Limpa resumo associado quando desseleciona — evita acumular drafts órfãos
      const nextSummaries = new Map(summaries);
      nextSummaries.delete(id);
      setSummaries(nextSummaries);
    } else {
      next.add(id);
      // Auto-fetch do preview ao selecionar — popula o textarea em background
      const item = items.find((i) => i.id === id);
      if (item) {
        // Não bloqueia o setSelected; roda async
        Promise.resolve().then(() => fetchPreview(item));
      }
    }
    setSelected(next);
  }

  function selectAllVisible() {
    const next = new Set(selected);
    for (const item of items) {
      if (!alreadyPosted.has(item.url)) next.add(item.id);
    }
    setSelected(next);
  }

  function clearSelection() {
    setSelected(new Set());
    setSummaries(new Map());
  }

  function updateSummary(id: string, value: string) {
    const next = new Map(summaries);
    if (value.trim()) next.set(id, value);
    else next.delete(id);
    setSummaries(next);
  }

  async function publishSelected() {
    if (selected.size === 0 || posting) return;
    setPosting(true);

    const tag = hashtag.replace(/^#/, "").trim().toLowerCase() || "noticia";
    const tagsArray = Array.from(new Set(["noticia", tag]));

    const rows = items
      .filter((i) => selected.has(i.id))
      .map((item) => {
        // content = resumo escrito pelo admin (vai virar o corpo do card no feed).
        // Se vazio, deixa null — o card mostra só título + footer.
        const summary = summaries.get(item.id)?.trim() ?? "";
        return {
          // Posts aparecem como "Notícias Aurum" — usuário oficial fictício
          // (centraliza o canal de notícias e separa visualmente do admin pessoal).
          author_name: AURUM_NEWS_AUTHOR.author_name,
          author_email: AURUM_NEWS_AUTHOR.author_email,
          author_username: AURUM_NEWS_AUTHOR.author_username,
          author_avatar: AURUM_NEWS_AUTHOR.author_avatar,
          post_type: "news",
          content: summary.length > 0 ? summary : null,
          news_title: item.title,
          news_url: item.url,
          news_thumbnail: item.thumb,
          tags: tagsArray,
          moderation_status: "aprovado",
          images: [],
        };
      });

    const { error } = await supabase.from("community_post").insert(rows);
    setPosting(false);
    if (error) {
      console.error("[admin/publish]", error);
      toast.error("Falha ao publicar.", { description: error.message });
      return;
    }
    toast.success(`${rows.length} ${rows.length === 1 ? "notícia publicada" : "notícias publicadas"} na comunidade.`);
    // marca como já postadas pra refletir no UI
    const newPosted = new Set(alreadyPosted);
    for (const r of rows) if (r.news_url) newPosted.add(r.news_url);
    setAlreadyPosted(newPosted);
    setSelected(new Set());
    setSummaries(new Map());
  }

  const selectableCount = items.filter((i) => !alreadyPosted.has(i.url)).length;

  return (
    <div style={{ minHeight: "calc(100vh - 58px)", background: "var(--bg-page)" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "32px 24px 64px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <button
              onClick={() => router.push("/dashboard/comunidade")}
              aria-label="Voltar"
              style={{
                width: "36px", height: "36px", borderRadius: "9px",
                background: "var(--bg-card)",
                border: "1px solid var(--border-soft)",
                color: "var(--text-muted)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
                transition: "all 150ms var(--ease-out)",
              }}
              className="aurum-hover-gold aurum-hover-border"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <p style={{
                fontSize: "10px", fontWeight: 700, color: "var(--gold)",
                fontFamily: "var(--font-sans)", letterSpacing: "0.16em",
                textTransform: "uppercase", marginBottom: "4px",
              }}>
                Admin · Comunidade
              </p>
              <h1 style={{
                fontSize: "22px", fontWeight: 700, color: "var(--text-strong)",
                fontFamily: "var(--font-display)", letterSpacing: "-0.01em",
                lineHeight: 1.2,
              }}>
                Curar notícias
              </h1>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-sans)", marginTop: "2px" }}>
                Fonte: GDELT (Global Database of Events) · Selecione o que vai pra Home da comunidade.
              </p>
            </div>
          </div>

          <button
            onClick={loadNews}
            disabled={loading}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "8px 14px", borderRadius: "8px",
              background: "var(--bg-card)",
              border: "1px solid var(--border-soft)",
              color: "var(--text-muted)",
              fontSize: "12px", fontWeight: 600,
              fontFamily: "var(--font-sans)", cursor: loading ? "wait" : "pointer",
              transition: "all 150ms var(--ease-out)",
              opacity: loading ? 0.6 : 1,
            }}
            className="aurum-hover-gold aurum-hover-border"
          >
            <RefreshCw size={12} className={loading ? "aurum-spin" : ""} />
            Atualizar
          </button>
        </div>

        {/* Filtros */}
        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-soft)",
          borderRadius: "14px", padding: "18px 20px",
          marginBottom: "20px",
          display: "flex", flexDirection: "column", gap: "14px",
        }}>
          {/* Linha 1: temas rápidos */}
          <div>
            <p style={{
              fontSize: "9px", fontWeight: 700, color: "var(--text-faint)",
              fontFamily: "var(--font-sans)", letterSpacing: "0.12em",
              textTransform: "uppercase", marginBottom: "8px",
            }}>
              Tema (preenche a busca)
            </p>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {QUICK_THEMES.map((t) => {
                const active = activeTheme === t.label && !customQuery.trim();
                return (
                  <button
                    key={t.label}
                    onClick={() => {
                      setCustomQuery("");
                      setActiveTheme(active ? null : t.label);
                      // Sincroniza hashtag pro tema (override fácil pelo user)
                      if (!active) setHashtag(t.tag);
                    }}
                    style={{
                      fontSize: "11px", fontWeight: active ? 700 : 500,
                      padding: "5px 11px", borderRadius: "999px",
                      background: active ? "rgba(201,168,76,0.15)" : "var(--bg-input)",
                      border: `1px solid ${active ? "var(--border-emphasis)" : "var(--border-faint)"}`,
                      color: active ? "var(--gold-light)" : "var(--text-muted)",
                      cursor: "pointer", fontFamily: "var(--font-sans)",
                      transition: "all 150ms var(--ease-out)",
                      letterSpacing: "0.02em",
                    }}
                  >
                    {t.label}
                  </button>
                );
              })}
              {(activeTheme || customQuery.trim()) && (
                <button
                  onClick={() => { setActiveTheme(null); setCustomQuery(""); }}
                  style={{
                    fontSize: "11px", padding: "5px 11px", borderRadius: "999px",
                    background: "transparent", border: "1px dashed var(--border-faint)",
                    color: "var(--text-faint)", cursor: "pointer",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          {/* Linha 2: busca custom + país/idioma/tempo */}
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr auto auto auto", gap: "10px", alignItems: "stretch" }}>
            <div style={{ position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-faint)" }} />
              <input
                value={customQuery}
                onChange={(e) => { setCustomQuery(e.target.value); if (e.target.value) setActiveTheme(null); }}
                placeholder='Busca livre (ex: "Petrobras balanço")'
                style={{
                  width: "100%", height: "38px",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-soft)",
                  borderRadius: "8px", padding: "0 12px 0 32px",
                  color: "var(--text-default)", fontSize: "13px",
                  fontFamily: "var(--font-sans)", outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <Selector
              icon={<Globe size={12} />}
              value={country}
              onChange={(v) => setCountry(v as CountryCode)}
              options={COUNTRIES.map((c) => ({ value: c.code, label: c.label }))}
            />
            <Selector
              icon={<Languages size={12} />}
              value={lang}
              onChange={(v) => setLang(v as Lang)}
              options={LANGUAGES.map((l) => ({ value: l.code, label: l.label }))}
            />
            <Selector
              icon={<Calendar size={12} />}
              value={timespan}
              onChange={(v) => setTimespan(v as Timespan)}
              options={TIMESPANS.map((t) => ({ value: t.code, label: t.label }))}
            />
          </div>
        </div>

        {/* Barra de ação fixa quando há selecionados */}
        {selected.size > 0 && (
          <div style={{
            background: "linear-gradient(135deg, rgba(201,168,76,0.12), rgba(201,168,76,0.04))",
            border: "1px solid var(--border-emphasis)",
            borderRadius: "12px", padding: "14px 18px",
            marginBottom: "16px",
            display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap",
          }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "9px",
              background: "rgba(201,168,76,0.18)",
              color: "var(--gold)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <Sparkles size={16} />
            </div>
            <div style={{ flex: 1, minWidth: "180px" }}>
              <p style={{
                fontSize: "13px", fontWeight: 700, color: "var(--text-strong)",
                fontFamily: "var(--font-display)", marginBottom: "2px",
              }}>
                {selected.size} {selected.size === 1 ? "notícia" : "notícias"} selecionada{selected.size === 1 ? "" : "s"}
              </p>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>
                Publicar como post na comunidade com hashtag <strong style={{ color: "var(--gold)" }}>#{hashtag}</strong>
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <Hash size={12} style={{ color: "var(--text-faint)" }} />
                <input
                  value={hashtag}
                  onChange={(e) => setHashtag(e.target.value.replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase())}
                  placeholder="noticia"
                  style={{
                    width: "120px", height: "32px",
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-soft)",
                    borderRadius: "6px", padding: "0 10px",
                    color: "var(--gold)", fontSize: "12px", fontWeight: 600,
                    fontFamily: "var(--font-sans)", outline: "none",
                  }}
                />
              </div>

              <button
                onClick={clearSelection}
                style={{
                  background: "transparent", border: "1px solid var(--border-faint)",
                  borderRadius: "6px", padding: "7px 12px",
                  color: "var(--text-muted)", fontSize: "12px", fontWeight: 600,
                  fontFamily: "var(--font-sans)", cursor: "pointer",
                }}
                className="aurum-hover-gold aurum-hover-border aurum-hover-transition"
              >
                Limpar
              </button>

              <button
                onClick={publishSelected}
                disabled={posting}
                style={{
                  background: posting
                    ? "rgba(201,168,76,0.3)"
                    : "linear-gradient(135deg, var(--gold-light), var(--gold), var(--gold-dim))",
                  border: "none", borderRadius: "8px",
                  padding: "8px 16px",
                  color: "#0d0b07", fontSize: "12px", fontWeight: 700,
                  fontFamily: "var(--font-sans)",
                  cursor: posting ? "wait" : "pointer",
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  boxShadow: posting ? "none" : "0 4px 16px rgba(201,168,76,0.3)",
                  letterSpacing: "0.04em",
                }}
              >
                <Send size={12} />
                {posting ? "Publicando..." : `Publicar ${selected.size}`}
              </button>
            </div>
          </div>
        )}

        {/* Sumário + select all */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Filter size={12} style={{ color: "var(--text-faint)" }} />
            <p style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>
              {loading
                ? "Buscando…"
                : `${items.length} ${items.length === 1 ? "artigo" : "artigos"} encontrado${items.length === 1 ? "" : "s"}`}
              {alreadyPosted.size > 0 && items.length > 0 && (
                <> · <span style={{ color: "var(--text-faint)" }}>{items.length - selectableCount} já postado{items.length - selectableCount === 1 ? "" : "s"}</span></>
              )}
            </p>
          </div>
          {!loading && selectableCount > 0 && (
            <button
              onClick={selectAllVisible}
              style={{
                fontSize: "11px", fontWeight: 600,
                color: "var(--gold)",
                background: "transparent", border: "none",
                cursor: "pointer", fontFamily: "var(--font-sans)",
                letterSpacing: "0.02em",
              }}
              className="aurum-hover-gold aurum-hover-transition"
            >
              Selecionar {selectableCount} disponíveis
            </button>
          )}
        </div>

        {/* Erros */}
        {error && (
          <div style={{ marginBottom: "14px" }}>
            <ErrorState
              title="Aviso ao carregar notícias"
              message={error}
              onRetry={loadNews}
            />
          </div>
        )}

        {/* Grid de notícias */}
        {loading && items.length === 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "14px" }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <NewsCardSkeleton key={i} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div style={{
            background: "var(--bg-card)",
            border: "1px dashed var(--border-soft)",
            borderRadius: "12px", padding: "48px 32px",
            textAlign: "center",
          }}>
            <div style={{
              width: "48px", height: "48px", borderRadius: "12px",
              background: "rgba(201,168,76,0.08)", color: "var(--gold)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 14px",
            }}>
              <AlertCircle size={22} />
            </div>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-default)", fontFamily: "var(--font-display)", marginBottom: "6px" }}>
              Nenhum artigo encontrado
            </p>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-sans)", maxWidth: "360px", margin: "0 auto", lineHeight: 1.5 }}>
              Tente outro tema, idioma ou janela de tempo. O GDELT indexa mídias do mundo todo — quanto mais ampla a busca, mais resultados.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "14px" }}>
            {items.map((item) => (
              <NewsCard
                key={item.id}
                item={item}
                selected={selected.has(item.id)}
                disabled={alreadyPosted.has(item.url)}
                onToggle={() => toggleSelect(item.id)}
                summary={summaries.get(item.id) ?? ""}
                onSummaryChange={(v) => updateSummary(item.id, v)}
                fetchingPreview={fetchingPreview.has(item.id)}
                onFetchPreview={() => fetchPreview(item, true)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Selector<T extends string>({
  icon, value, onChange, options,
}: {
  icon: React.ReactNode;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
      <span style={{ position: "absolute", left: "12px", color: "var(--text-faint)", pointerEvents: "none" }}>{icon}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        style={{
          height: "38px",
          background: "var(--bg-input)",
          border: "1px solid var(--border-soft)",
          borderRadius: "8px",
          padding: "0 28px 0 32px",
          color: "var(--text-default)", fontSize: "12px",
          fontFamily: "var(--font-sans)", outline: "none",
          appearance: "none",
          cursor: "pointer",
          minWidth: "140px",
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown size={12} style={{ position: "absolute", right: "10px", color: "var(--text-faint)", pointerEvents: "none" }} />
    </div>
  );
}

function NewsCard({
  item, selected, disabled, onToggle, summary, onSummaryChange,
  fetchingPreview, onFetchPreview,
}: {
  item: GdeltNewsItem;
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
  summary: string;
  onSummaryChange: (value: string) => void;
  fetchingPreview: boolean;
  onFetchPreview: () => void;
}) {
  return (
    <div
      onClick={disabled ? undefined : onToggle}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => { if (!disabled && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onToggle(); } }}
      style={{
        position: "relative",
        background: "var(--bg-card)",
        border: `1px solid ${selected ? "var(--border-emphasis)" : "var(--border-soft)"}`,
        borderRadius: "12px", overflow: "hidden",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        transition: "border-color 200ms var(--ease-out), transform 200ms var(--ease-out), box-shadow 200ms var(--ease-out)",
        transform: selected ? "translateY(-2px)" : "translateY(0)",
        boxShadow: selected ? "0 8px 24px rgba(201,168,76,0.18)" : "none",
        outline: "none",
      }}
      className="aurum-news-curate"
    >
      {/* Thumb com checkbox sobreposto */}
      <div style={{ position: "relative", height: "150px", overflow: "hidden" }}>
        {item.thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.thumb} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{
            width: "100%", height: "100%",
            background: "linear-gradient(135deg, #1a1410 0%, #2a1f12 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Newspaper size={28} style={{ color: "var(--text-faint)" }} />
          </div>
        )}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, rgba(10,8,6,0.2) 0%, transparent 30%, rgba(10,8,6,0.55) 100%)",
          pointerEvents: "none",
        }} />

        {/* Checkbox */}
        <div style={{
          position: "absolute", top: "10px", left: "10px",
          width: "26px", height: "26px", borderRadius: "7px",
          background: selected ? "var(--gold)" : "rgba(10,8,6,0.7)",
          border: `1.5px solid ${selected ? "var(--gold)" : "rgba(255,255,255,0.4)"}`,
          backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: selected ? "#0d0b07" : "transparent",
          transition: "all 150ms var(--ease-out)",
        }}>
          {selected && <Check size={15} strokeWidth={3} />}
        </div>

        {/* Já postado badge */}
        {disabled && (
          <div style={{
            position: "absolute", top: "10px", right: "10px",
            fontSize: "9px", fontWeight: 700, color: "var(--positive)",
            background: "rgba(52,211,153,0.18)",
            backdropFilter: "blur(6px)",
            border: "1px solid rgba(52,211,153,0.4)",
            padding: "3px 8px", borderRadius: "5px",
            letterSpacing: "0.08em", textTransform: "uppercase",
            fontFamily: "var(--font-sans)",
            display: "inline-flex", alignItems: "center", gap: "3px",
          }}>
            <Check size={9} strokeWidth={3} /> Postado
          </div>
        )}

        {/* Source badge */}
        {item.source && (
          <div style={{
            position: "absolute", bottom: "10px", left: "10px",
            fontSize: "9px", fontWeight: 700, color: "var(--gold-light)",
            background: "rgba(10,8,6,0.75)",
            backdropFilter: "blur(6px)",
            border: "1px solid rgba(201,168,76,0.3)",
            padding: "3px 8px", borderRadius: "5px",
            letterSpacing: "0.06em",
            fontFamily: "var(--font-sans)",
            maxWidth: "calc(100% - 20px)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {item.source}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "12px 14px 14px", display: "flex", flexDirection: "column", gap: "8px" }}>
        <p style={{
          fontSize: "13px", fontWeight: 600, color: "var(--text-default)",
          fontFamily: "var(--font-sans)", lineHeight: 1.4,
          display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {item.title}
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
          <p style={{ fontSize: "10px", color: "var(--text-faint)", fontFamily: "var(--font-sans)" }}>
            {item.pubDate ? fmtRelative(item.pubDate) : ""}
            {item.country && <> · {item.country}</>}
          </p>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              fontSize: "10px", color: "var(--gold)",
              fontFamily: "var(--font-sans)", fontWeight: 600,
              textDecoration: "none",
              display: "inline-flex", alignItems: "center", gap: "3px",
              letterSpacing: "0.02em",
            }}
            className="aurum-hover-gold aurum-hover-transition"
            title={fmtDate(item.pubDate)}
          >
            Abrir fonte <ExternalLink size={9} />
          </a>
        </div>

        {/* Resumo — auto-populado via og:description ao selecionar, editável.
            Captura cliques pra não desselecionar o card ao digitar/clicar. */}
        {selected && (
          <div
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            style={{ marginTop: "8px", paddingTop: "10px", borderTop: "1px solid var(--border-faint)" }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "5px", gap: "8px" }}>
              <label style={{
                fontSize: "9px", fontWeight: 700, color: "var(--gold)",
                fontFamily: "var(--font-sans)", letterSpacing: "0.12em",
                textTransform: "uppercase",
                display: "inline-flex", alignItems: "center", gap: "5px",
              }}>
                Resumo
                {fetchingPreview && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", color: "var(--text-faint)", letterSpacing: "0.04em", textTransform: "none", fontWeight: 500 }}>
                    <Loader2 size={9} className="aurum-spin" />
                    <span style={{ fontSize: "9px" }}>buscando...</span>
                  </span>
                )}
              </label>
              <button
                type="button"
                onClick={onFetchPreview}
                disabled={fetchingPreview}
                title="Buscar resumo da página da notícia"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "4px",
                  fontSize: "9px", fontWeight: 600,
                  color: "var(--gold)",
                  background: "rgba(201,168,76,0.08)",
                  border: "1px solid rgba(201,168,76,0.18)",
                  borderRadius: "5px",
                  padding: "3px 8px",
                  cursor: fetchingPreview ? "wait" : "pointer",
                  fontFamily: "var(--font-sans)",
                  letterSpacing: "0.04em",
                  opacity: fetchingPreview ? 0.6 : 1,
                  transition: "all 150ms var(--ease-out)",
                }}
              >
                {fetchingPreview ? <Loader2 size={9} className="aurum-spin" /> : <Wand2 size={9} />}
                Sugerir
              </button>
            </div>
            <textarea
              value={summary}
              onChange={(e) => onSummaryChange(e.target.value)}
              placeholder={fetchingPreview ? "Buscando resumo automático..." : "O resumo será preenchido automaticamente — você pode editar."}
              rows={5}
              maxLength={1000}
              style={{
                width: "100%",
                background: "var(--bg-input)",
                border: "1px solid var(--border-soft)",
                borderRadius: "6px",
                padding: "8px 10px",
                color: "var(--text-default)", fontSize: "12px",
                fontFamily: "var(--font-sans)",
                outline: "none", resize: "vertical",
                lineHeight: 1.5,
                boxSizing: "border-box",
                minHeight: "100px",
              }}
            />
            <p style={{ fontSize: "9px", color: "var(--text-faint)", fontFamily: "var(--font-sans)", marginTop: "4px", fontVariantNumeric: "tabular-nums" }}>
              {summary.length}/1000
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function NewsCardSkeleton() {
  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border-soft)",
      borderRadius: "12px", overflow: "hidden",
    }}>
      <Skeleton className="h-[150px] w-full rounded-none" />
      <div style={{ padding: "14px 16px 16px" }}>
        <Skeleton className="h-3 w-full mb-2" />
        <Skeleton className="h-3 w-[70%] mb-3" />
        <Skeleton className="h-2.5 w-20" />
      </div>
    </div>
  );
}
