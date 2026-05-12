"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search, TrendingUp, TrendingDown, BarChart3, DollarSign,
  Bitcoin, Newspaper, ExternalLink, Sparkles, ChevronRight,
  Activity, ArrowUpRight, ArrowDownRight, Building2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";

type AssetClass = "stocks" | "fiis" | "cryptos";
type HeroIndex = "ibov" | "ifix";

interface OverviewIbov {
  price: number | null;
  changePct: number | null;
  spark: number[];
  open: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  volume: number | null;
  prevClose: number | null;
}
interface OverviewMover { symbol: string; name: string; price: number | null; change: number | null; logo?: string }
interface OverviewCurrency { symbol: string; label: string; price: number | null; changePct: number | null }
interface OverviewCrypto { symbol: string; name: string; price: number | null; changePct: number | null; logo?: string }
interface OverviewIndex { label: string; value: number; unit: string }
interface OverviewMoversBundle { gainers: OverviewMover[]; losers: OverviewMover[] }
interface OverviewResponse {
  ibov: OverviewIbov;
  ifix: OverviewIbov;
  currencies: OverviewCurrency[];
  cryptos: OverviewCrypto[];
  indices: OverviewIndex[];
}
interface MoversResponse {
  stocks: OverviewMoversBundle;
  fiis: OverviewMoversBundle;
  cryptos: OverviewMoversBundle;
}

const HERO_INDEX_LABELS: Record<HeroIndex, { short: string; full: string; venue: string }> = {
  ibov: { short: "IBOV", full: "Ibovespa", venue: "B3" },
  ifix: { short: "IFIX", full: "Ifix", venue: "B3 · FIIs" },
};

const ASSET_CLASS_META: Record<AssetClass, { label: string; pluralLabel: string }> = {
  stocks: { label: "Ações", pluralLabel: "Ações" },
  fiis: { label: "FIIs", pluralLabel: "FIIs" },
  cryptos: { label: "Cripto", pluralLabel: "Cripto" },
};

interface SearchResult {
  symbol: string;
  name: string;
  price: number | null;
  change: number | null;
  kind: "stock" | "fund" | "crypto";
  logo?: string;
}

interface MarketNewsItem {
  id: string;
  title: string;
  link: string;
  pubDate: string | null;
  category: string | null;
  thumb: string | null;
}

function fmtNewsDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function fmtBr(n: number | null | undefined, digits = 2): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  return n.toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function fmtVolume(v: number | null): string {
  if (v === null || !Number.isFinite(v)) return "—";
  if (v >= 1e9) return `${(v / 1e9).toFixed(2).replace(".", ",")} B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(2).replace(".", ",")} M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1).replace(".", ",")} K`;
  return v.toLocaleString("pt-BR");
}

export default function AcoesContent() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [movers, setMovers] = useState<MoversResponse | null>(null);
  const [news, setNews] = useState<MarketNewsItem[]>([]);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [moversLoading, setMoversLoading] = useState(true);
  const [moversError, setMoversError] = useState<string | null>(null);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState<string | null>(null);

  // Hero index (Ibov vs Ifix) e classe de cada mover (independentes — usuário pediu
  // "botão no canto de cada"). Default em ações pra manter expectativa atual.
  const [heroIndex, setHeroIndex] = useState<HeroIndex>("ibov");
  const [gainersClass, setGainersClass] = useState<AssetClass>("stocks");
  const [losersClass, setLosersClass] = useState<AssetClass>("stocks");

  const loadOverview = useCallback(async () => {
    setOverviewLoading(true);
    setOverviewError(null);
    try {
      const res = await fetch("/api/acoes-overview");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setOverview(await res.json());
    } catch (err) {
      console.error("[acoes-overview]", err);
      setOverviewError("Não consegui carregar os dados de mercado.");
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  const loadMovers = useCallback(async () => {
    setMoversLoading(true);
    setMoversError(null);
    try {
      const res = await fetch("/api/acoes-movers");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setMovers(await res.json());
    } catch (err) {
      console.error("[acoes-movers]", err);
      setMoversError("Não consegui carregar os movers.");
    } finally {
      setMoversLoading(false);
    }
  }, []);

  const loadNews = useCallback(async () => {
    setNewsLoading(true);
    setNewsError(null);
    try {
      const res = await fetch("/api/market-news");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { items?: MarketNewsItem[] };
      setNews(data.items ?? []);
    } catch (err) {
      console.error("[market-news]", err);
      setNewsError("Não consegui carregar as notícias.");
    } finally {
      setNewsLoading(false);
    }
  }, []);

  useEffect(() => { loadOverview(); loadMovers(); loadNews(); }, [loadOverview, loadMovers, loadNews]);

  // Debounced search — busca ações E FIIs em paralelo
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    setSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const [stockRes, fundRes] = await Promise.all([
          fetch(`/api/brapi-search?q=${encodeURIComponent(q)}&kind=stock`),
          fetch(`/api/brapi-search?q=${encodeURIComponent(q)}&kind=fund`),
        ]);
        const stockData = stockRes.ok ? await stockRes.json() : { results: [] };
        const fundData = fundRes.ok ? await fundRes.json() : { results: [] };
        const merged: SearchResult[] = [...(fundData.results ?? []), ...(stockData.results ?? [])];
        const seen = new Set<string>();
        const unique = merged.filter((r) => {
          if (seen.has(r.symbol)) return false;
          seen.add(r.symbol);
          return true;
        }).slice(0, 10);
        setSearchResults(unique);
        setShowResults(true);
      } catch (err) {
        console.error("[search]", err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  function routeFor(symbol: string, kind?: string): string {
    const isFII = kind === "fund" || /^[A-Z]{4}11$/.test(symbol);
    return isFII
      ? `/dashboard/acoes/fiis/${symbol}`
      : `/dashboard/acoes/${symbol}`;
  }

  function handleMoverClick(cls: AssetClass, symbol: string) {
    if (cls === "fiis") {
      router.push(`/dashboard/acoes/fiis/${symbol}`);
    } else if (cls === "cryptos") {
      // Página de cripto ainda não existe; redireciona pra busca/page de ações
      // com fallback amigável. Mantém o app funcional.
      router.push(`/dashboard/acoes/${symbol}`);
    } else {
      router.push(`/dashboard/acoes/${symbol}`);
    }
  }

  function handlePesquisar() {
    const q = query.trim().toUpperCase();
    if (!q) return;
    if (searchResults.length > 0) {
      router.push(routeFor(searchResults[0].symbol, searchResults[0].kind));
    } else {
      router.push(routeFor(q));
    }
  }

  return (
    <div style={{ minHeight: "calc(100vh - 58px)", background: "var(--bg-page)" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "32px 24px 64px" }}>
        {/* Header + Search */}
        <div style={{
          position: "relative",
          background: `
            radial-gradient(circle at 100% 0%, rgba(201,168,76,0.06), transparent 55%),
            var(--bg-card)
          `,
          border: "1px solid var(--border-soft)",
          borderRadius: "16px", padding: "22px 26px",
          marginBottom: "20px",
          overflow: "hidden",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "4px" }}>
            <div style={{
              width: "40px", height: "40px", borderRadius: "11px",
              background: "linear-gradient(135deg, rgba(201,168,76,0.22), rgba(201,168,76,0.04))",
              border: "1px solid rgba(201,168,76,0.18)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--gold-light)",
              boxShadow: "0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(201,168,76,0.08)",
            }}>
              <Sparkles size={18} />
            </div>
            <div>
              <h1 style={{
                fontSize: "21px", fontWeight: 700, color: "var(--text-strong)",
                fontFamily: "var(--font-display)", letterSpacing: "-0.01em",
              }}>
                Análise de Ações
              </h1>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>
                Pesquise ações, FIIs ou criptomoedas para análise completa
              </p>
            </div>
          </div>

          <div style={{ position: "relative", display: "flex", gap: "8px", marginTop: "18px" }}>
            <div style={{ flex: 1, position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-faint)" }} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowResults(true)}
                onBlur={() => setTimeout(() => setShowResults(false), 200)}
                onKeyDown={(e) => { if (e.key === "Enter") handlePesquisar(); }}
                placeholder="Buscar ações, FIIs ou criptomoedas... (ex: PETR4, MXRF11, BTC)"
                style={{
                  width: "100%", height: "44px",
                  background: "var(--bg-page)",
                  border: "1px solid var(--border-soft)",
                  borderRadius: "10px", padding: "0 14px 0 38px",
                  color: "var(--text-default)", fontSize: "13px",
                  fontFamily: "var(--font-sans)", outline: "none",
                  transition: "border-color 150ms var(--ease-out), box-shadow 150ms var(--ease-out)",
                }}
                className="aurum-search-input"
              />
              {showResults && (
                <div style={{
                  position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-emphasis)",
                  borderRadius: "12px",
                  boxShadow: "0 16px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,168,76,0.05)",
                  zIndex: 20,
                  maxHeight: "320px", overflowY: "auto",
                }}>
                  {searchLoading ? (
                    <div style={{ padding: "16px", color: "var(--text-muted)", fontSize: "12px", textAlign: "center", fontFamily: "var(--font-sans)" }}>
                      Buscando...
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div style={{ padding: "16px", color: "var(--text-muted)", fontSize: "12px", textAlign: "center", fontFamily: "var(--font-sans)" }}>
                      Nenhum ativo encontrado para &quot;{query}&quot;
                    </div>
                  ) : (
                    searchResults.map((r) => (
                      <button
                        key={r.symbol}
                        onMouseDown={() => router.push(routeFor(r.symbol, r.kind))}
                        style={{
                          width: "100%",
                          display: "flex", alignItems: "center", gap: "10px",
                          padding: "10px 14px",
                          background: "transparent", border: "none",
                          cursor: "pointer", textAlign: "left",
                        }}
                        className="aurum-hover-bg aurum-hover-transition"
                      >
                        {r.logo && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={r.logo} alt="" style={{ width: "26px", height: "26px", borderRadius: "6px", objectFit: "contain", background: "#fff" }} />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-default)", fontFamily: "var(--font-sans)" }}>
                            {r.symbol}
                          </p>
                          <p style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-sans)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {r.name}
                          </p>
                        </div>
                        {r.price !== null && (
                          <div style={{ textAlign: "right" }}>
                            <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-default)", fontFamily: "var(--font-sans)", fontVariantNumeric: "tabular-nums" }}>
                              R$ {r.price.toFixed(2).replace(".", ",")}
                            </p>
                            {r.change !== null && (
                              <p style={{
                                fontSize: "10px",
                                color: r.change >= 0 ? "var(--positive)" : "var(--negative)",
                                fontFamily: "var(--font-sans)",
                                fontVariantNumeric: "tabular-nums",
                              }}>
                                {r.change >= 0 ? "+" : ""}{r.change.toFixed(2)}%
                              </p>
                            )}
                          </div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            <button
              onClick={handlePesquisar}
              style={{
                background: "linear-gradient(135deg, #E8C96A 0%, #C9A84C 50%, #A07820 100%)",
                border: "none", borderRadius: "10px",
                padding: "0 22px", color: "#0d0b07",
                fontSize: "13px", fontWeight: 700,
                fontFamily: "var(--font-sans)", cursor: "pointer",
                letterSpacing: "0.04em",
                display: "flex", alignItems: "center", gap: "6px",
                boxShadow: "0 4px 16px rgba(201,168,76,0.28), inset 0 1px 0 rgba(255,255,255,0.18)",
                transition: "transform 150ms var(--ease-out), box-shadow 150ms var(--ease-out)",
              }}
              className="aurum-cta-button"
            >
              <Search size={13} /> Pesquisar
            </button>
          </div>
        </div>

        {/* Top row: Hero (overview) | Maiores Altas (movers) | Maiores Baixas (movers)
            Cada um tem seu próprio loading — overview chega rápido, movers carrega
            em paralelo e mostra skeleton independente. */}
        {overviewError ? (
          <div style={{ marginBottom: "20px" }}>
            <ErrorState
              title={overviewError}
              message="Pode ser uma flutuação na conexão com o brapi."
              onRetry={loadOverview}
            />
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: "14px", marginBottom: "20px" }}>
            {overviewLoading && !overview ? (
              <Skeleton className="h-[220px] rounded-[14px]" />
            ) : (
              <IndexHeroCard
                value={heroIndex === "ibov" ? overview?.ibov ?? null : overview?.ifix ?? null}
                activeIndex={heroIndex}
                onChange={setHeroIndex}
              />
            )}

            {moversLoading && !movers ? (
              <Skeleton className="h-[220px] rounded-[14px]" />
            ) : (
              <MoversCard
                title="Maiores Altas"
                icon={<TrendingUp size={13} />}
                color="var(--positive)"
                colorBg="var(--positive-bg)"
                movers={movers?.[gainersClass]?.gainers ?? []}
                assetClass={gainersClass}
                onAssetClassChange={setGainersClass}
                onClick={(s) => handleMoverClick(gainersClass, s)}
                errored={!!moversError}
                onRetry={loadMovers}
              />
            )}

            {moversLoading && !movers ? (
              <Skeleton className="h-[220px] rounded-[14px]" />
            ) : (
              <MoversCard
                title="Maiores Baixas"
                icon={<TrendingDown size={13} />}
                color="var(--negative)"
                colorBg="var(--negative-bg)"
                movers={movers?.[losersClass]?.losers ?? []}
                assetClass={losersClass}
                onAssetClassChange={setLosersClass}
                onClick={(s) => handleMoverClick(losersClass, s)}
                errored={!!moversError}
                onRetry={loadMovers}
              />
            )}
          </div>
        )}

        {/* Mid row: Mercados | Índices | Cripto */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px", marginBottom: "28px" }}>
          <SectionCard title="Mercados" icon={<DollarSign size={14} />} subtitle="Cotação de moedas">
            {(overview?.currencies ?? []).map((c) => (
              <CurrencyRow
                key={c.symbol}
                code={c.symbol.split("-")[0]}
                label={c.label}
                value={c.price !== null ? `R$ ${c.price.toFixed(2).replace(".", ",")}` : "—"}
                change={c.changePct}
              />
            ))}
            <FooterLink>Atualizado em tempo real</FooterLink>
          </SectionCard>

          <SectionCard title="Índices" icon={<BarChart3 size={14} />} subtitle="Brasil">
            {(overview?.indices ?? []).map((i) => (
              <IndexRow
                key={i.label}
                label={i.label}
                value={`${i.value.toFixed(2).replace(".", ",")}%`}
              />
            ))}
            <FooterLink>Macroeconomia · BCB / IBGE</FooterLink>
          </SectionCard>

          <SectionCard title="Criptomoedas" icon={<Bitcoin size={14} />} subtitle="Top em BRL">
            {(overview?.cryptos ?? []).map((c) => (
              <CryptoRow
                key={c.symbol}
                symbol={c.symbol}
                name={c.name}
                logo={c.logo}
                value={c.price !== null ? `R$ ${c.price.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}` : "—"}
                change={c.changePct}
              />
            ))}
            <FooterLink>Atualizado em tempo real</FooterLink>
          </SectionCard>
        </div>

        {/* News */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "28px", height: "28px", borderRadius: "8px",
              background: "rgba(201,168,76,0.1)", color: "var(--gold)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Newspaper size={14} />
            </div>
            <div>
              <h2 style={{
                fontSize: "17px", fontWeight: 700, color: "var(--text-strong)",
                fontFamily: "var(--font-display)", letterSpacing: "-0.01em",
              }}>
                Notícias em destaque
              </h2>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>
                As principais movimentações do mercado
              </p>
            </div>
          </div>
        </div>

        {newsError && (
          <div style={{ marginBottom: "16px" }}>
            <ErrorState
              title={newsError}
              message="As notícias vêm de uma fonte externa, pode ter dado timeout."
              onRetry={loadNews}
            />
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "16px" }}>
          {/* News cards (4 maiores destaques) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {newsLoading && news.length === 0 ? (
              <>
                <NewsCardSkeleton />
                <NewsCardSkeleton />
                <NewsCardSkeleton />
                <NewsCardSkeleton />
              </>
            ) : news.length === 0 ? (
              <p style={{ gridColumn: "1 / -1", fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-sans)", textAlign: "center", padding: "30px" }}>
                Sem notícias disponíveis no momento.
              </p>
            ) : (
              news.slice(0, 4).map((n) => <NewsCard key={n.id} item={n} />)
            )}
          </div>

          {/* As mais recentes */}
          <div style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-soft)",
            borderRadius: "14px", padding: "20px 22px",
            height: "fit-content",
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: "1px",
              background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.3), transparent)",
            }} />
            <p style={{
              fontSize: "10px", fontWeight: 700, color: "var(--gold)",
              fontFamily: "var(--font-sans)", letterSpacing: "0.1em",
              marginBottom: "18px", textTransform: "uppercase",
            }}>
              Mais recentes
            </p>
            <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
              {news.slice(4, 7).map((n, i) => (
                <li key={n.id}>
                  <a
                    href={n.link} target="_blank" rel="noopener noreferrer"
                    className="aurum-recent-item aurum-hover-transition"
                    style={{
                      display: "flex", gap: "12px", textDecoration: "none",
                      cursor: "pointer",
                    }}
                  >
                    <span style={{
                      fontSize: "22px", fontWeight: 700,
                      background: "linear-gradient(180deg, var(--gold-light), var(--gold-dim))",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      fontFamily: "var(--font-display)",
                      lineHeight: 1, flexShrink: 0, minWidth: "22px",
                    }}>
                      {i + 1}
                    </span>
                    <p style={{
                      fontSize: "12px", color: "var(--text-body)",
                      fontFamily: "var(--font-sans)", lineHeight: 1.5,
                    }}>
                      {n.title}
                    </p>
                  </a>
                </li>
              ))}
            </ol>
            <a
              href="https://www.infomoney.com.br/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                marginTop: "20px",
                background: "transparent", border: "none",
                color: "var(--gold)", fontSize: "11px", fontWeight: 600,
                fontFamily: "var(--font-sans)", cursor: "pointer",
                padding: 0,
                display: "inline-flex", alignItems: "center", gap: "4px",
                textDecoration: "none",
                letterSpacing: "0.02em",
              }}
              className="aurum-hover-gold aurum-hover-transition"
            >
              Ver mais no InfoMoney <ChevronRight size={11} />
            </a>
          </div>
        </div>
      </div>

      {/* Component-local styles: keyframes + hover tweaks que só fazem sentido aqui */}
      <style jsx>{`
        :global(.aurum-search-input:focus) {
          border-color: var(--border-emphasis) !important;
          box-shadow: 0 0 0 3px rgba(201,168,76,0.08);
        }
        :global(.aurum-cta-button:hover) {
          transform: translateY(-1px);
          box-shadow: 0 6px 22px rgba(201,168,76,0.38), inset 0 1px 0 rgba(255,255,255,0.25) !important;
        }
        :global(.aurum-cta-button:active) {
          transform: translateY(0);
        }
        :global(.aurum-mover-row) {
          transition: background-color 150ms var(--ease-out);
          border-radius: 8px;
        }
        :global(.aurum-mover-row:hover) {
          background-color: rgba(201,168,76,0.06);
        }
        :global(.aurum-segment-btn) {
          transition: background-color 150ms var(--ease-out), color 150ms var(--ease-out);
        }
        :global(.aurum-segment-btn:hover[aria-selected="false"]) {
          color: var(--text-body) !important;
          background-color: rgba(201,168,76,0.06) !important;
        }
        :global(.aurum-segment-btn:focus-visible) {
          outline: 2px solid var(--gold);
          outline-offset: 1px;
        }
        :global(.aurum-news-card) {
          transition: border-color 200ms var(--ease-out), transform 200ms var(--ease-out);
        }
        :global(.aurum-news-card:hover) {
          border-color: var(--border-emphasis);
          transform: translateY(-2px);
        }
        :global(.aurum-news-card:hover .aurum-news-thumb) {
          transform: scale(1.04);
        }
        :global(.aurum-news-thumb) {
          transition: transform 400ms var(--ease-out);
        }
        :global(.aurum-recent-item:hover p) {
          color: var(--text-strong) !important;
        }
        @keyframes aurumPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.55; transform: scale(0.92); }
        }
        :global(.aurum-live-dot) {
          animation: aurumPulse 1.6s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          :global(.aurum-live-dot) { animation: none; }
          :global(.aurum-news-card:hover) { transform: none; }
        }
      `}</style>
    </div>
  );
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function IndexHeroCard({
  value, activeIndex, onChange,
}: {
  value: OverviewIbov | null;
  activeIndex: HeroIndex;
  onChange: (v: HeroIndex) => void;
}) {
  const positive = value?.changePct !== null && value?.changePct !== undefined && value.changePct >= 0;
  const color = positive ? "var(--positive)" : "var(--negative)";
  const colorHex = positive ? "#34d399" : "#f87171";
  const meta = HERO_INDEX_LABELS[activeIndex];
  // Quando o índice atual veio sem preço (ex: IFIX fora de pregão ou falha brapi),
  // mostramos um placeholder amigável ao invés de "—" repetido.
  const hasData = value !== null && value.price !== null && Number.isFinite(value.price);

  return (
    <div style={{
      position: "relative",
      background: `
        radial-gradient(circle at 0% 100%, ${positive ? "rgba(52,211,153,0.05)" : "rgba(248,113,113,0.05)"}, transparent 50%),
        radial-gradient(circle at 100% 0%, rgba(201,168,76,0.08), transparent 55%),
        var(--bg-card)
      `,
      border: "1px solid var(--border-soft)",
      borderRadius: "14px",
      padding: "20px 22px",
      display: "flex", flexDirection: "column", gap: "14px",
      overflow: "hidden",
      minHeight: "220px",
    }}>
      {/* Top gold accent line */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "1px",
        background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.35), transparent)",
      }} />

      {/* Header: tabs (IBOV/IFIX) + venue + live badge */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
          <IndexTabs value={activeIndex} onChange={onChange} />
          <span style={{
            fontSize: "9px", color: "var(--text-faint)",
            fontFamily: "var(--font-sans)", letterSpacing: "0.06em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}>
            · {meta.venue}
          </span>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: "6px",
          padding: "3px 10px 3px 8px",
          background: hasData
            ? (positive ? "var(--positive-bg)" : "var(--negative-bg)")
            : "rgba(154,138,106,0.08)",
          borderRadius: "999px",
          border: `1px solid ${hasData
            ? (positive ? "rgba(52,211,153,0.25)" : "rgba(248,113,113,0.25)")
            : "var(--border-faint)"}`,
        }}>
          <span
            className={hasData ? "aurum-live-dot" : ""}
            style={{
              width: "6px", height: "6px", borderRadius: "50%",
              background: hasData ? colorHex : "var(--text-faint)",
              boxShadow: hasData ? `0 0 8px ${colorHex}` : "none",
            }}
          />
          <span style={{
            fontSize: "9px", fontWeight: 700, color: hasData ? color : "var(--text-faint)",
            fontFamily: "var(--font-sans)", letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}>
            {hasData ? "Ao vivo" : "Indisponível"}
          </span>
        </div>
      </div>

      {/* Price + change */}
      <div style={{ display: "flex", alignItems: "baseline", gap: "12px", flexWrap: "wrap" }}>
        <span style={{
          fontSize: "36px", fontWeight: 700, color: "var(--text-strong)",
          fontFamily: "var(--font-display)", letterSpacing: "-0.02em",
          lineHeight: 1, fontVariantNumeric: "tabular-nums",
        }}>
          {fmtBr(value?.price ?? null)}
        </span>
        {value?.changePct !== null && value?.changePct !== undefined && (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: "3px",
            fontSize: "13px", fontWeight: 700, color,
            fontFamily: "var(--font-sans)",
            fontVariantNumeric: "tabular-nums",
            padding: "4px 10px",
            background: positive ? "var(--positive-bg)" : "var(--negative-bg)",
            borderRadius: "8px",
          }}>
            {positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {positive ? "+" : ""}{value.changePct.toFixed(2)}%
          </span>
        )}
      </div>

      {/* Sparkline (full-width) */}
      {value && value.spark.length > 1 ? (
        <HeroSparkline values={value.spark} color={colorHex} positive={positive} />
      ) : (
        <div style={{ height: "60px" }} />
      )}

      {/* Stats grid: Abertura, Máxima, Mínima, Volume */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "10px",
        paddingTop: "12px",
        borderTop: "1px solid var(--border-faint)",
      }}>
        <Stat label="Abertura" value={fmtBr(value?.open ?? null)} />
        <Stat label="Máxima" value={fmtBr(value?.dayHigh ?? null)} accent="var(--positive)" />
        <Stat label="Mínima" value={fmtBr(value?.dayLow ?? null)} accent="var(--negative)" />
        <Stat label="Volume" value={fmtVolume(value?.volume ?? null)} />
      </div>
    </div>
  );
}

function IndexTabs({
  value, onChange,
}: {
  value: HeroIndex;
  onChange: (v: HeroIndex) => void;
}) {
  const opts: { v: HeroIndex; label: string }[] = [
    { v: "ibov", label: "IBOV" },
    { v: "ifix", label: "IFIX" },
  ];
  return (
    <div
      role="tablist"
      aria-label="Selecionar índice"
      style={{
        display: "inline-flex",
        background: "rgba(201,168,76,0.04)",
        border: "1px solid var(--border-faint)",
        borderRadius: "8px",
        padding: "2px",
        gap: "1px",
      }}
    >
      {opts.map((o) => {
        const active = value === o.v;
        return (
          <button
            key={o.v}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.v)}
            className="aurum-segment-btn"
            style={{
              padding: "4px 10px",
              borderRadius: "6px",
              border: "none",
              background: active
                ? "linear-gradient(180deg, rgba(201,168,76,0.22), rgba(201,168,76,0.1))"
                : "transparent",
              color: active ? "var(--gold-light)" : "var(--text-muted)",
              cursor: "pointer",
              fontSize: "10px", fontWeight: 700,
              fontFamily: "var(--font-sans)",
              letterSpacing: "0.08em",
              boxShadow: active ? "inset 0 1px 0 rgba(255,255,255,0.06)" : "none",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function AssetClassSegmented({
  value, onChange,
}: {
  value: AssetClass;
  onChange: (v: AssetClass) => void;
}) {
  const opts: { v: AssetClass; label: string; Icon: typeof BarChart3 }[] = [
    { v: "stocks",  label: "Ações",  Icon: BarChart3 },
    { v: "fiis",    label: "FIIs",   Icon: Building2 },
    { v: "cryptos", label: "Cripto", Icon: Bitcoin   },
  ];
  return (
    <div
      role="tablist"
      aria-label="Selecionar classe de ativo"
      style={{
        display: "inline-flex",
        background: "rgba(201,168,76,0.04)",
        border: "1px solid var(--border-faint)",
        borderRadius: "8px",
        padding: "2px",
      }}
    >
      {opts.map((o) => {
        const active = value === o.v;
        const Icon = o.Icon;
        return (
          <button
            key={o.v}
            role="tab"
            aria-selected={active}
            aria-label={o.label}
            title={o.label}
            onClick={() => onChange(o.v)}
            className="aurum-segment-btn"
            style={{
              padding: "4px 7px",
              borderRadius: "6px",
              border: "none",
              background: active
                ? "linear-gradient(180deg, rgba(201,168,76,0.22), rgba(201,168,76,0.1))"
                : "transparent",
              color: active ? "var(--gold-light)" : "var(--text-faint)",
              cursor: "pointer",
              display: "flex", alignItems: "center",
              boxShadow: active ? "inset 0 1px 0 rgba(255,255,255,0.06)" : "none",
            }}
          >
            <Icon size={11} />
          </button>
        );
      })}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: 0 }}>
      <span style={{
        fontSize: "9px", fontWeight: 600, color: "var(--text-faint)",
        fontFamily: "var(--font-sans)", letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}>
        {label}
      </span>
      <span style={{
        fontSize: "12px", fontWeight: 600,
        color: accent ?? "var(--text-default)",
        fontFamily: "var(--font-sans)",
        fontVariantNumeric: "tabular-nums",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {value}
      </span>
    </div>
  );
}

function HeroSparkline({ values, color, positive }: { values: number[]; color: string; positive: boolean }) {
  const w = 100; // viewBox width (we'll stretch to 100%)
  const h = 60;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = w / (values.length - 1);
  const pts = values.map((v, i) => ({
    x: i * step,
    y: h - ((v - min) / range) * (h - 4) - 2,
  }));
  const linePoints = pts.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
  const areaPath = `M${pts[0].x},${h} L${pts.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" L")} L${pts[pts.length - 1].x},${h} Z`;
  const gradId = positive ? "aurum-spark-up" : "aurum-spark-dn";

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      style={{ width: "100%", height: "60px", display: "block" }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <polyline
        points={linePoints}
        fill="none"
        stroke={color}
        strokeWidth={1.4}
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MoversCard({
  title, icon, color, colorBg, movers, onClick,
  assetClass, onAssetClassChange,
  errored, onRetry,
}: {
  title: string;
  icon: React.ReactNode;
  color: string;
  colorBg: string;
  movers: OverviewMover[];
  onClick: (symbol: string) => void;
  assetClass: AssetClass;
  onAssetClassChange: (v: AssetClass) => void;
  errored?: boolean;
  onRetry?: () => void;
}) {
  const maxChange = useMemo(
    () => movers.reduce((m, x) => Math.max(m, Math.abs(x.change ?? 0)), 0) || 1,
    [movers]
  );

  return (
    <div style={{
      position: "relative",
      background: "var(--bg-card)",
      border: "1px solid var(--border-soft)",
      borderRadius: "14px",
      padding: "18px 18px 14px",
      display: "flex", flexDirection: "column",
      minHeight: "220px",
      overflow: "hidden",
    }}>
      {/* Header: title + segmented control */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: "8px", marginBottom: "14px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
          <div style={{
            width: "24px", height: "24px", borderRadius: "7px",
            background: colorBg, color,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            {icon}
          </div>
          <span style={{
            fontSize: "12px", fontWeight: 700, color: "var(--text-default)",
            fontFamily: "var(--font-sans)", letterSpacing: "0.02em",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {title}
          </span>
        </div>
        <AssetClassSegmented value={assetClass} onChange={onAssetClassChange} />
      </div>

      {movers.length === 0 ? (
        errored ? (
          <div style={{ padding: "8px 0", display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-start" }}>
            <p style={{ fontSize: "11px", color: "var(--text-faint)", fontFamily: "var(--font-sans)" }}>
              Não consegui carregar {ASSET_CLASS_META[assetClass].pluralLabel}.
            </p>
            {onRetry && (
              <button
                onClick={onRetry}
                style={{
                  fontSize: "10px", color: "var(--gold)",
                  background: "rgba(201,168,76,0.1)",
                  border: "1px solid var(--border-soft)",
                  borderRadius: "6px",
                  padding: "4px 10px",
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)", fontWeight: 600,
                  letterSpacing: "0.04em",
                }}
                className="aurum-hover-bg aurum-hover-transition"
              >
                Tentar novamente
              </button>
            )}
          </div>
        ) : (
          <p style={{ fontSize: "11px", color: "var(--text-faint)", fontFamily: "var(--font-sans)", padding: "8px 0" }}>
            Sem movimentação em {ASSET_CLASS_META[assetClass].pluralLabel} no momento.
          </p>
        )
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
          {movers.slice(0, 4).map((m) => {
            const change = m.change ?? 0;
            const intensity = Math.min(100, (Math.abs(change) / maxChange) * 100);
            return (
              <button
                key={m.symbol}
                onClick={() => onClick(m.symbol)}
                className="aurum-mover-row"
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr auto",
                  alignItems: "center", gap: "8px",
                  background: "transparent", border: "none",
                  cursor: "pointer", padding: "6px 8px",
                  textAlign: "left",
                }}
              >
                {/* Logo (or fallback initial) — crypto vira círculo s/ fundo branco */}
                {m.logo ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={m.logo}
                    alt=""
                    style={{
                      width: "22px", height: "22px",
                      borderRadius: assetClass === "cryptos" ? "50%" : "5px",
                      objectFit: "contain",
                      background: assetClass === "cryptos" ? "transparent" : "#fff",
                      flexShrink: 0,
                    }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <div style={{
                    width: "22px", height: "22px",
                    borderRadius: assetClass === "cryptos" ? "50%" : "5px",
                    background: "rgba(201,168,76,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "9px", fontWeight: 700, color: "var(--gold)",
                    fontFamily: "var(--font-sans)",
                  }}>
                    {m.symbol.slice(0, assetClass === "cryptos" ? 1 : 2)}
                  </div>
                )}

                {/* Symbol + intensity bar */}
                <div style={{ minWidth: 0 }}>
                  <p style={{
                    fontSize: "11px", fontWeight: 700, color: "var(--text-default)",
                    fontFamily: "var(--font-sans)",
                    marginBottom: "3px",
                  }}>
                    {m.symbol}
                  </p>
                  <div style={{
                    height: "3px",
                    background: "rgba(201,168,76,0.05)",
                    borderRadius: "2px",
                    overflow: "hidden",
                  }}>
                    <div style={{
                      height: "100%",
                      width: `${intensity}%`,
                      background: color,
                      borderRadius: "2px",
                      boxShadow: `0 0 6px ${color === "var(--positive)" ? "rgba(52,211,153,0.4)" : "rgba(248,113,113,0.4)"}`,
                    }} />
                  </div>
                </div>

                {/* Change % */}
                <span style={{
                  fontSize: "11px", fontWeight: 700, color,
                  fontFamily: "var(--font-sans)",
                  fontVariantNumeric: "tabular-nums",
                  whiteSpace: "nowrap",
                }}>
                  {m.change !== null ? `${m.change >= 0 ? "+" : ""}${m.change.toFixed(2)}%` : "—"}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SectionCard({
  title, subtitle, icon, children,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      position: "relative",
      background: "var(--bg-card)",
      border: "1px solid var(--border-soft)",
      borderRadius: "14px",
      padding: "18px 20px",
      overflow: "hidden",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "26px", height: "26px", borderRadius: "7px",
            background: "rgba(201,168,76,0.1)", color: "var(--gold)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {icon}
          </div>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-default)", fontFamily: "var(--font-sans)" }}>
            {title}
          </p>
        </div>
        {subtitle && (
          <span style={{
            fontSize: "10px", color: "var(--text-faint)",
            fontFamily: "var(--font-sans)",
            letterSpacing: "0.04em",
          }}>
            {subtitle}
          </span>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {children}
      </div>
    </div>
  );
}

function CurrencyRow({
  code, label, value, change,
}: {
  code: string;
  label: string;
  value: string;
  change?: number | null;
}) {
  const positive = (change ?? 0) >= 0;
  const changeColor = change !== null && change !== undefined
    ? (positive ? "var(--positive)" : "var(--negative)")
    : "var(--text-faint)";
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
        <span style={{
          fontSize: "9px", fontWeight: 700, color: "var(--gold)",
          background: "rgba(201,168,76,0.1)",
          border: "1px solid rgba(201,168,76,0.18)",
          padding: "3px 7px", borderRadius: "5px",
          fontFamily: "var(--font-sans)", letterSpacing: "0.08em",
          flexShrink: 0,
        }}>
          {code}
        </span>
        <p style={{
          fontSize: "12px", fontWeight: 500, color: "var(--text-body)",
          fontFamily: "var(--font-sans)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {label}
        </p>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <p style={{
          fontSize: "13px", fontWeight: 600, color: "var(--text-default)",
          fontFamily: "var(--font-sans)",
          fontVariantNumeric: "tabular-nums",
        }}>
          {value}
        </p>
        {change !== null && change !== undefined && (
          <p style={{
            fontSize: "10px", color: changeColor,
            fontFamily: "var(--font-sans)",
            fontVariantNumeric: "tabular-nums",
            display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "2px",
          }}>
            {positive ? "▲" : "▼"} {Math.abs(change).toFixed(2)}%
          </p>
        )}
      </div>
    </div>
  );
}

function IndexRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{
          width: "5px", height: "5px", borderRadius: "50%",
          background: "var(--gold)",
          boxShadow: "0 0 6px rgba(201,168,76,0.5)",
        }} />
        <p style={{
          fontSize: "12px", fontWeight: 500, color: "var(--text-body)",
          fontFamily: "var(--font-sans)",
        }}>
          {label}
        </p>
      </div>
      <p style={{
        fontSize: "14px", fontWeight: 700, color: "var(--text-strong)",
        fontFamily: "var(--font-display)",
        fontVariantNumeric: "tabular-nums",
        letterSpacing: "-0.01em",
      }}>
        {value}
      </p>
    </div>
  );
}

function CryptoRow({
  symbol, name, logo, value, change,
}: {
  symbol: string;
  name: string;
  logo?: string;
  value: string;
  change?: number | null;
}) {
  const positive = (change ?? 0) >= 0;
  const changeColor = change !== null && change !== undefined
    ? (positive ? "var(--positive)" : "var(--negative)")
    : "var(--text-faint)";
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
        {logo ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={logo}
            alt=""
            style={{
              width: "22px", height: "22px", borderRadius: "50%",
              objectFit: "contain", flexShrink: 0,
            }}
          />
        ) : (
          <div style={{
            width: "22px", height: "22px", borderRadius: "50%",
            background: "rgba(201,168,76,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "9px", fontWeight: 700, color: "var(--gold)",
            flexShrink: 0,
          }}>
            {symbol.slice(0, 1)}
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <p style={{
            fontSize: "12px", fontWeight: 700, color: "var(--text-default)",
            fontFamily: "var(--font-sans)",
            letterSpacing: "0.02em",
          }}>
            {symbol}
          </p>
          <p style={{
            fontSize: "10px", color: "var(--text-faint)",
            fontFamily: "var(--font-sans)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {name}
          </p>
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <p style={{
          fontSize: "13px", fontWeight: 600, color: "var(--text-default)",
          fontFamily: "var(--font-sans)",
          fontVariantNumeric: "tabular-nums",
        }}>
          {value}
        </p>
        {change !== null && change !== undefined && (
          <p style={{
            fontSize: "10px", color: changeColor,
            fontFamily: "var(--font-sans)",
            fontVariantNumeric: "tabular-nums",
            display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "2px",
          }}>
            {positive ? "▲" : "▼"} {Math.abs(change).toFixed(2)}%
          </p>
        )}
      </div>
    </div>
  );
}

function FooterLink({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      paddingTop: "10px",
      marginTop: "4px",
      borderTop: "1px solid var(--border-faint)",
      color: "var(--text-faint)", fontSize: "10px",
      fontFamily: "var(--font-sans)",
      display: "flex", alignItems: "center", gap: "5px",
      letterSpacing: "0.02em",
    }}>
      {children} <ExternalLink size={9} />
    </div>
  );
}

function NewsCard({ item }: { item: MarketNewsItem }) {
  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="aurum-news-card"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-soft)",
        borderRadius: "14px", overflow: "hidden",
        cursor: "pointer",
        textDecoration: "none",
        display: "flex", flexDirection: "column",
      }}
    >
      <div style={{ position: "relative", overflow: "hidden", height: "150px" }}>
        {item.thumb ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.thumb}
              alt=""
              className="aurum-news-thumb"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(180deg, transparent 40%, rgba(10,8,6,0.5) 100%)",
              pointerEvents: "none",
            }} />
          </>
        ) : (
          <div style={{
            width: "100%", height: "100%",
            background: "linear-gradient(135deg, #1a1410 0%, #2a1f12 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Newspaper size={28} style={{ color: "var(--text-faint)" }} />
          </div>
        )}
        {item.category && (
          <span style={{
            position: "absolute", top: "10px", left: "10px",
            fontSize: "9px", fontWeight: 700, color: "var(--gold-light)",
            background: "rgba(10,8,6,0.7)",
            backdropFilter: "blur(6px)",
            border: "1px solid rgba(201,168,76,0.3)",
            padding: "3px 8px", borderRadius: "5px",
            letterSpacing: "0.08em",
            fontFamily: "var(--font-sans)",
            textTransform: "uppercase",
          }}>
            {item.category}
          </span>
        )}
      </div>
      <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
        <p style={{
          fontSize: "13px", fontWeight: 600, color: "var(--text-default)",
          fontFamily: "var(--font-sans)",
          lineHeight: 1.4,
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {item.title}
        </p>
        <p style={{
          fontSize: "10px", color: "var(--text-faint)",
          fontFamily: "var(--font-sans)",
          display: "flex", alignItems: "center", gap: "5px",
          marginTop: "auto",
        }}>
          <Activity size={9} style={{ color: "var(--gold-dim)" }} />
          {fmtNewsDate(item.pubDate)}
        </p>
      </div>
    </a>
  );
}

function NewsCardSkeleton() {
  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border-soft)",
      borderRadius: "14px", overflow: "hidden",
    }}>
      <Skeleton className="h-[150px] w-full rounded-none" />
      <div style={{ padding: "14px 16px 16px" }}>
        <Skeleton className="h-3 w-16 mb-2" />
        <Skeleton className="h-3.5 w-full mb-1.5" />
        <Skeleton className="h-3.5 w-[80%] mb-3" />
        <Skeleton className="h-2.5 w-20" />
      </div>
    </div>
  );
}
