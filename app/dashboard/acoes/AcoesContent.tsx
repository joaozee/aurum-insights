"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search, TrendingUp, TrendingDown, BarChart3, DollarSign,
  Bitcoin, Newspaper, ExternalLink, Sparkles, ChevronRight,
} from "lucide-react";

interface OverviewIbov { price: number | null; changePct: number | null; spark: number[] }
interface OverviewMover { symbol: string; name: string; price: number | null; change: number | null; logo?: string }
interface OverviewCurrency { symbol: string; label: string; price: number | null; changePct: number | null }
interface OverviewCrypto { symbol: string; name: string; price: number | null; changePct: number | null; logo?: string }
interface OverviewIndex { label: string; value: number; unit: string }
interface OverviewResponse {
  ibov: OverviewIbov;
  topGainers: OverviewMover[];
  topLosers: OverviewMover[];
  currencies: OverviewCurrency[];
  cryptos: OverviewCrypto[];
  indices: OverviewIndex[];
}

interface SearchResult {
  symbol: string;
  name: string;
  price: number | null;
  change: number | null;
  kind: "stock" | "fund" | "crypto";
  logo?: string;
}

const NEWS_DESTAQUE = [
  {
    id: "1",
    titulo: "Banco do Brasil reporta lucro de R$ 9,6 bilhões no 3T25",
    categoria: "MERCADO",
    data: "11/11/2025 — 14:21",
    img: "https://images.unsplash.com/photo-1550565118-3a14e8d0386f?auto=format&fit=crop&w=600&q=70",
  },
  {
    id: "2",
    titulo: "Selic mantida em 10,75%; Copom sinaliza próximos passos",
    categoria: "MACRO",
    data: "11/11/2025 — 09:30",
    img: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=600&q=70",
  },
  {
    id: "3",
    titulo: "Petrobras anuncia novos dividendos extraordinários",
    categoria: "DIVIDENDOS",
    data: "10/11/2025 — 18:00",
    img: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=70",
  },
  {
    id: "4",
    titulo: "Vale (VALE3) apresenta produção recorde de minério de ferro",
    categoria: "MERCADO",
    data: "10/11/2025 — 11:42",
    img: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=600&q=70",
  },
];

const NEWS_LIDAS = [
  "Por que esse banco está dando dividendos altos para os acionistas?",
  "Petrobras (PETR4) atualiza o plano de ações sobre o que pode mudar?",
  "10 ideias para você investir começar a investir hoje em ações suspeitas",
];

export default function AcoesContent() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [overview, setOverview] = useState<OverviewResponse | null>(null);

  const loadOverview = useCallback(async () => {
    try {
      const res = await fetch("/api/acoes-overview");
      if (res.ok) setOverview(await res.json());
    } catch (err) {
      console.error("[acoes-overview]", err);
    }
  }, []);

  useEffect(() => { loadOverview(); }, [loadOverview]);

  // Debounced search
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
        const res = await fetch(`/api/brapi-search?q=${encodeURIComponent(q)}&kind=stock`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results ?? []);
          setShowResults(true);
        }
      } catch (err) {
        console.error("[search]", err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  function handlePesquisar() {
    const q = query.trim().toUpperCase();
    if (!q) return;
    if (searchResults.length > 0) {
      router.push(`/dashboard/acoes/${searchResults[0].symbol}`);
    } else {
      router.push(`/dashboard/acoes/${q}`);
    }
  }

  return (
    <div style={{ minHeight: "calc(100vh - 58px)", background: "#0a0806" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "32px 24px 64px" }}>
        {/* Header + Search */}
        <div style={{
          background: "#130f09",
          border: "1px solid rgba(201,168,76,0.1)",
          borderRadius: "14px", padding: "20px 24px",
          marginBottom: "20px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "10px",
              background: "linear-gradient(135deg, rgba(201,168,76,0.2), rgba(201,168,76,0.05))",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#C9A84C",
            }}>
              <Sparkles size={18} />
            </div>
            <div>
              <h1 style={{
                fontSize: "20px", fontWeight: 700, color: "#e8dcc0",
                fontFamily: "var(--font-display)", letterSpacing: "-0.01em",
              }}>
                Análise de Ações
              </h1>
              <p style={{ fontSize: "12px", color: "#7a6a4a", fontFamily: "var(--font-sans)" }}>
                Pesquise ações, FIIs ou criptomoedas para análise completa
              </p>
            </div>
          </div>

          <div style={{ position: "relative", display: "flex", gap: "8px", marginTop: "16px" }}>
            <div style={{ flex: 1, position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#5a4a2a" }} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowResults(true)}
                onBlur={() => setTimeout(() => setShowResults(false), 200)}
                onKeyDown={(e) => { if (e.key === "Enter") handlePesquisar(); }}
                placeholder="Buscar ações, FIIs ou criptomoedas... (ex: PETR4, MXRF11, BTC)"
                style={{
                  width: "100%", height: "42px",
                  background: "#0d0b07",
                  border: "1px solid rgba(201,168,76,0.15)",
                  borderRadius: "10px", padding: "0 14px 0 38px",
                  color: "#e8dcc0", fontSize: "13px",
                  fontFamily: "var(--font-sans)", outline: "none",
                }}
              />
              {showResults && (
                <div style={{
                  position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                  background: "#130f09",
                  border: "1px solid rgba(201,168,76,0.15)",
                  borderRadius: "10px",
                  boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
                  zIndex: 20,
                  maxHeight: "320px", overflowY: "auto",
                }}>
                  {searchLoading ? (
                    <div style={{ padding: "16px", color: "#7a6a4a", fontSize: "12px", textAlign: "center", fontFamily: "var(--font-sans)" }}>
                      Buscando...
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div style={{ padding: "16px", color: "#7a6a4a", fontSize: "12px", textAlign: "center", fontFamily: "var(--font-sans)" }}>
                      Nenhum ativo encontrado para &quot;{query}&quot;
                    </div>
                  ) : (
                    searchResults.map((r) => (
                      <button
                        key={r.symbol}
                        onMouseDown={() => router.push(`/dashboard/acoes/${r.symbol}`)}
                        style={{
                          width: "100%",
                          display: "flex", alignItems: "center", gap: "10px",
                          padding: "10px 14px",
                          background: "transparent", border: "none",
                          cursor: "pointer", textAlign: "left",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(201,168,76,0.05)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                      >
                        {r.logo && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={r.logo} alt="" style={{ width: "26px", height: "26px", borderRadius: "6px", objectFit: "contain", background: "#fff" }} />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: "12px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-sans)" }}>
                            {r.symbol}
                          </p>
                          <p style={{ fontSize: "11px", color: "#7a6a4a", fontFamily: "var(--font-sans)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {r.name}
                          </p>
                        </div>
                        {r.price !== null && (
                          <div style={{ textAlign: "right" }}>
                            <p style={{ fontSize: "12px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-sans)" }}>
                              R$ {r.price.toFixed(2).replace(".", ",")}
                            </p>
                            {r.change !== null && (
                              <p style={{
                                fontSize: "10px",
                                color: r.change >= 0 ? "#10b981" : "#ef4444",
                                fontFamily: "var(--font-sans)",
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
                background: "linear-gradient(135deg, #C9A84C 0%, #A07820 100%)",
                border: "none", borderRadius: "10px",
                padding: "0 22px", color: "#0d0b07",
                fontSize: "13px", fontWeight: 600,
                fontFamily: "var(--font-sans)", cursor: "pointer",
                letterSpacing: "0.04em",
                display: "flex", alignItems: "center", gap: "6px",
                boxShadow: "0 2px 12px rgba(201,168,76,0.25)",
              }}
            >
              <Search size={13} /> Pesquisar
            </button>
          </div>
        </div>

        {/* Top row: Ibovespa | Maiores Altas | Maiores Baixas */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "12px", marginBottom: "20px" }}>
          <IbovCard ibov={overview?.ibov ?? null} />
          <MoversCard
            title="Maiores Altas"
            icon={<TrendingUp size={14} />}
            color="#10b981"
            movers={overview?.topGainers ?? []}
            onClick={(s) => router.push(`/dashboard/acoes/${s}`)}
          />
          <MoversCard
            title="Maiores Baixas"
            icon={<TrendingDown size={14} />}
            color="#ef4444"
            movers={overview?.topLosers ?? []}
            onClick={(s) => router.push(`/dashboard/acoes/${s}`)}
          />
        </div>

        {/* Mid row: Mercados | Índices | Cripto */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "24px" }}>
          <SectionCard title="Mercados" icon={<DollarSign size={14} />} subtitle="Cotação de moedas">
            {(overview?.currencies ?? []).map((c) => (
              <Row
                key={c.symbol}
                label={c.label}
                value={c.price !== null ? `R$ ${c.price.toFixed(2).replace(".", ",")}` : "—"}
                change={c.changePct}
              />
            ))}
            <FooterLink onClick={() => {}}>Atualizado em tempo real</FooterLink>
          </SectionCard>

          <SectionCard title="Índices" icon={<BarChart3 size={14} />} subtitle="Brasil">
            {(overview?.indices ?? []).map((i) => (
              <Row
                key={i.label}
                label={i.label}
                value={`${i.value.toFixed(2)}%`}
                muted
              />
            ))}
            <FooterLink onClick={() => {}}>Atualizado em tempo real</FooterLink>
          </SectionCard>

          <SectionCard title="Criptomoedas" icon={<Bitcoin size={14} />} subtitle="Top em BRL">
            {(overview?.cryptos ?? []).map((c) => (
              <Row
                key={c.symbol}
                label={c.symbol}
                sublabel={c.name}
                value={c.price !== null ? `R$ ${c.price.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}` : "—"}
                change={c.changePct}
              />
            ))}
            <FooterLink onClick={() => {}}>Atualizado em tempo real</FooterLink>
          </SectionCard>
        </div>

        {/* News */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <Newspaper size={16} style={{ color: "#C9A84C" }} />
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-display)" }}>
            Notícias em destaque
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "16px" }}>
          {/* News cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {NEWS_DESTAQUE.map((n) => (
              <div key={n.id} style={{
                background: "#130f09",
                border: "1px solid rgba(201,168,76,0.1)",
                borderRadius: "12px", overflow: "hidden",
                cursor: "pointer", transition: "border-color 0.15s",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.1)"; }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={n.img} alt="" style={{ width: "100%", height: "140px", objectFit: "cover" }} />
                <div style={{ padding: "12px 14px" }}>
                  <span style={{
                    fontSize: "9px", fontWeight: 700, color: "#C9A84C",
                    background: "rgba(201,168,76,0.1)",
                    padding: "3px 8px", borderRadius: "4px",
                    letterSpacing: "0.06em",
                    fontFamily: "var(--font-sans)",
                  }}>
                    {n.categoria}
                  </span>
                  <p style={{
                    fontSize: "13px", fontWeight: 600, color: "#e8dcc0",
                    fontFamily: "var(--font-sans)",
                    marginTop: "8px", marginBottom: "6px", lineHeight: 1.4,
                  }}>
                    {n.titulo}
                  </p>
                  <p style={{ fontSize: "10px", color: "#5a4a2a", fontFamily: "var(--font-sans)" }}>
                    {n.data}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* As mais lidas */}
          <div style={{
            background: "#130f09",
            border: "1px solid rgba(201,168,76,0.1)",
            borderRadius: "12px", padding: "20px",
            height: "fit-content",
          }}>
            <p style={{
              fontSize: "10px", fontWeight: 700, color: "#7a6a4a",
              fontFamily: "var(--font-sans)", letterSpacing: "0.08em",
              marginBottom: "16px", textTransform: "uppercase",
            }}>
              As mais lidas hoje
            </p>
            <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "14px" }}>
              {NEWS_LIDAS.map((n, i) => (
                <li key={i} style={{ display: "flex", gap: "10px" }}>
                  <span style={{
                    fontSize: "18px", fontWeight: 700, color: "#C9A84C",
                    fontFamily: "var(--font-display)",
                    lineHeight: 1, flexShrink: 0, minWidth: "20px",
                  }}>
                    {i + 1}
                  </span>
                  <p style={{
                    fontSize: "12px", color: "#c8b89a",
                    fontFamily: "var(--font-sans)", lineHeight: 1.5,
                    cursor: "pointer",
                  }}>
                    {n}
                  </p>
                </li>
              ))}
            </ol>
            <button style={{
              marginTop: "16px",
              background: "transparent", border: "none",
              color: "#C9A84C", fontSize: "11px", fontWeight: 500,
              fontFamily: "var(--font-sans)", cursor: "pointer",
              padding: 0,
              display: "flex", alignItems: "center", gap: "4px",
            }}>
              Ver lista completa <ChevronRight size={11} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function IbovCard({ ibov }: { ibov: OverviewIbov | null }) {
  const positive = ibov?.changePct !== null && (ibov?.changePct ?? 0) >= 0;
  const color = positive ? "#10b981" : "#ef4444";
  return (
    <div style={{
      background: "#130f09",
      border: "1px solid rgba(201,168,76,0.1)",
      borderRadius: "12px", padding: "18px 20px",
      display: "flex", flexDirection: "column", gap: "8px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{
          fontSize: "11px", fontWeight: 600, color: "#7a6a4a",
          fontFamily: "var(--font-sans)", letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}>
          Ibovespa
        </span>
        {ibov && ibov.spark.length > 1 && <Sparkline values={ibov.spark} color={color} />}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
        <span style={{
          fontSize: "22px", fontWeight: 700, color: "#e8dcc0",
          fontFamily: "var(--font-display)", letterSpacing: "-0.01em",
        }}>
          {ibov?.price !== null && ibov?.price !== undefined
            ? ibov.price.toLocaleString("pt-BR", { maximumFractionDigits: 2, minimumFractionDigits: 2 })
            : "—"}
        </span>
        {ibov?.changePct !== null && ibov?.changePct !== undefined && (
          <span style={{
            fontSize: "12px", fontWeight: 600, color,
            fontFamily: "var(--font-sans)",
            display: "flex", alignItems: "center", gap: "3px",
          }}>
            {positive ? "▲" : "▼"} {Math.abs(ibov.changePct).toFixed(2)}%
          </span>
        )}
      </div>
      <p style={{ fontSize: "10px", color: "#5a4a2a", fontFamily: "var(--font-sans)" }}>
        Pontos · Atualizado em tempo real
      </p>
    </div>
  );
}

function MoversCard({
  title, icon, color, movers, onClick,
}: {
  title: string;
  icon: React.ReactNode;
  color: string;
  movers: OverviewMover[];
  onClick: (symbol: string) => void;
}) {
  return (
    <div style={{
      background: "#130f09",
      border: "1px solid rgba(201,168,76,0.1)",
      borderRadius: "12px", padding: "16px 18px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", color, marginBottom: "10px" }}>
        {icon}
        <span style={{ fontSize: "11px", fontWeight: 600, fontFamily: "var(--font-sans)", letterSpacing: "0.04em" }}>
          {title}
        </span>
      </div>
      {movers.length === 0 ? (
        <p style={{ fontSize: "11px", color: "#5a4a2a", fontFamily: "var(--font-sans)", padding: "8px 0" }}>
          Carregando...
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {movers.slice(0, 4).map((m) => (
            <button
              key={m.symbol}
              onClick={() => onClick(m.symbol)}
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                background: "transparent", border: "none",
                cursor: "pointer", padding: "4px 0", textAlign: "left",
              }}
            >
              <span style={{ fontSize: "11px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-sans)", minWidth: "52px" }}>
                {m.symbol}
              </span>
              <span style={{
                flex: 1, fontSize: "10px", color: "#7a6a4a",
                fontFamily: "var(--font-sans)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {m.name}
              </span>
              <span style={{ fontSize: "11px", fontWeight: 600, color, fontFamily: "var(--font-sans)" }}>
                {m.change !== null ? `${m.change >= 0 ? "+" : ""}${m.change.toFixed(2)}%` : "—"}
              </span>
            </button>
          ))}
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
      background: "#130f09",
      border: "1px solid rgba(201,168,76,0.1)",
      borderRadius: "12px", padding: "16px 18px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            width: "26px", height: "26px", borderRadius: "7px",
            background: "rgba(201,168,76,0.1)", color: "#C9A84C",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {icon}
          </div>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-sans)" }}>
            {title}
          </p>
        </div>
        {subtitle && <span style={{ fontSize: "10px", color: "#5a4a2a", fontFamily: "var(--font-sans)" }}>{subtitle}</span>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {children}
      </div>
    </div>
  );
}

function Row({
  label, sublabel, value, change, muted,
}: {
  label: string;
  sublabel?: string;
  value: string;
  change?: number | null;
  muted?: boolean;
}) {
  const changeColor = change !== null && change !== undefined
    ? (change >= 0 ? "#10b981" : "#ef4444")
    : undefined;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div>
        <p style={{ fontSize: "12px", fontWeight: 500, color: "#c8b89a", fontFamily: "var(--font-sans)" }}>
          {label}
        </p>
        {sublabel && (
          <p style={{ fontSize: "10px", color: "#5a4a2a", fontFamily: "var(--font-sans)" }}>{sublabel}</p>
        )}
      </div>
      <div style={{ textAlign: "right" }}>
        <p style={{ fontSize: "12px", fontWeight: 600, color: muted ? "#9a8a6a" : "#e8dcc0", fontFamily: "var(--font-sans)" }}>
          {value}
        </p>
        {change !== null && change !== undefined && (
          <p style={{ fontSize: "10px", color: changeColor, fontFamily: "var(--font-sans)" }}>
            {change >= 0 ? "+" : ""}{change.toFixed(2)}%
          </p>
        )}
      </div>
    </div>
  );
}

function FooterLink({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "transparent", border: "none",
        padding: "8px 0 0 0",
        borderTop: "1px solid rgba(201,168,76,0.06)",
        marginTop: "4px",
        color: "#5a4a2a", fontSize: "10px",
        fontFamily: "var(--font-sans)",
        cursor: "pointer", textAlign: "left",
        display: "flex", alignItems: "center", gap: "4px",
      }}
    >
      {children} <ExternalLink size={9} />
    </button>
  );
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 80;
  const h = 28;
  const step = w / (values.length - 1);
  const points = values
    .map((v, i) => `${(i * step).toFixed(1)},${(h - ((v - min) / range) * h).toFixed(1)}`)
    .join(" ");
  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

