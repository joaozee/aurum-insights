"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  Home,
  BarChart2,
  Briefcase,
  BookOpen,
  Users as UsersIcon,
  TrendingUp,
  User as UserIcon,
  Settings,
  Info,
  Plus,
  Search,
  LogOut,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { createClient } from "@/lib/supabase/client";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SearchResult {
  symbol: string;
  name: string;
  price: number | null;
  change: number | null;
  kind: "stock" | "fund" | "crypto";
  logo?: string;
}

const NAV_ITEMS = [
  { label: "Início", href: "/dashboard", icon: Home, keywords: "home dashboard" },
  { label: "Finanças", href: "/dashboard/financas", icon: BarChart2, keywords: "saldo gastos receita despesa" },
  { label: "Carteira", href: "/dashboard/carteira", icon: Briefcase, keywords: "ativos investimentos posicoes" },
  { label: "Cursos", href: "/dashboard/cursos", icon: BookOpen, keywords: "academia aprender estudo" },
  { label: "Comunidade", href: "/dashboard/comunidade", icon: UsersIcon, keywords: "feed posts investidores" },
  { label: "Ações", href: "/dashboard/acoes", icon: TrendingUp, keywords: "mercado bolsa stocks fii cripto" },
  { label: "Perfil", href: "/dashboard/perfil", icon: UserIcon, keywords: "minha conta avatar" },
  { label: "Configurações", href: "/dashboard/configuracoes", icon: Settings, keywords: "ajustes settings preferencias" },
  { label: "Conhecer o Aurum", href: "/dashboard/sobre", icon: Info, keywords: "sobre about manifesto" },
] as const;

// ─── Context ─────────────────────────────────────────────────────────────────

interface CommandPaletteContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

export function useCommandPalette(): CommandPaletteContextValue {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) {
    throw new Error("useCommandPalette must be used within a CommandPaletteProvider");
  }
  return ctx;
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((o) => !o), []);

  // Global Cmd+K / Ctrl+K shortcut. Reuses the toggle: same key opens AND
  // closes (matches Linear, Raycast, Vercel convention).
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const isCmd = e.metaKey || e.ctrlKey;
      if (isCmd && e.key.toLowerCase() === "k") {
        // Don't intercept when the user is typing in a real input/textarea
        // unless they explicitly press Cmd+K (which we always honor).
        e.preventDefault();
        toggle();
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [toggle]);

  return (
    <CommandPaletteContext.Provider value={{ open, setOpen, toggle }}>
      {children}
      <CommandPalette open={open} onOpenChange={setOpen} />
    </CommandPaletteContext.Provider>
  );
}

// ─── Palette ─────────────────────────────────────────────────────────────────

function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  // Reset query when palette closes (so reopening starts fresh)
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  // Debounced ticker search via brapi (same endpoint AcoesContent uses)
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const [stockRes, fundRes] = await Promise.all([
          fetch(`/api/brapi-search?q=${encodeURIComponent(q)}&kind=stock`),
          fetch(`/api/brapi-search?q=${encodeURIComponent(q)}&kind=fund`),
        ]);
        const stockData = stockRes.ok ? await stockRes.json() : { results: [] };
        const fundData = fundRes.ok ? await fundRes.json() : { results: [] };
        const merged: SearchResult[] = [
          ...(fundData.results ?? []),
          ...(stockData.results ?? []),
        ];
        const seen = new Set<string>();
        const unique = merged
          .filter((r) => {
            if (seen.has(r.symbol)) return false;
            seen.add(r.symbol);
            return true;
          })
          .slice(0, 8);
        setResults(unique);
      } catch (err) {
        console.error("[command-palette/search]", err);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const navigate = useCallback(
    (path: string) => {
      onOpenChange(false);
      router.push(path);
    },
    [router, onOpenChange],
  );

  function routeForTicker(symbol: string, kind?: string): string {
    const isFII = kind === "fund" || /^[A-Z]{4}11$/.test(symbol);
    return isFII
      ? `/dashboard/acoes/fiis/${symbol}`
      : `/dashboard/acoes/${symbol}`;
  }

  async function handleSignOut() {
    onOpenChange(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const showTickerGroup = query.trim().length >= 2;
  const noResults = showTickerGroup && !searching && results.length === 0;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Buscar ativos, navegar, ou executar uma ação..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {/* Ticker results take top priority when querying */}
        {showTickerGroup && (
          <>
            <CommandGroup heading={searching ? "Buscando..." : "Buscar ativo"}>
              {results.map((r) => (
                <CommandItem
                  key={r.symbol}
                  value={`ticker-${r.symbol}-${r.name}`}
                  keywords={[r.symbol, r.name]}
                  onSelect={() => navigate(routeForTicker(r.symbol, r.kind))}
                >
                  {r.logo ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={r.logo}
                      alt=""
                      className="size-5 shrink-0 rounded object-contain bg-white/90"
                    />
                  ) : (
                    <Search className="text-muted-foreground" />
                  )}
                  <span className="font-semibold tabular-nums text-[var(--text-default)]">
                    {r.symbol}
                  </span>
                  <span className="ml-1 truncate text-muted-foreground">
                    {r.name}
                  </span>
                  {r.price !== null && (
                    <CommandShortcut className="tabular-nums">
                      R$ {r.price.toFixed(2).replace(".", ",")}
                    </CommandShortcut>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {noResults && (
          <CommandEmpty>
            Nenhum ativo encontrado para “{query}”. Continue digitando ou navegue abaixo.
          </CommandEmpty>
        )}

        {/* Navegação sempre visível */}
        <CommandGroup heading="Navegação">
          {NAV_ITEMS.map((item) => (
            <CommandItem
              key={item.href}
              value={`nav-${item.label}`}
              keywords={[item.label, item.keywords]}
              onSelect={() => navigate(item.href)}
            >
              <item.icon className="text-muted-foreground" />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Ações */}
        <CommandGroup heading="Ações">
          <CommandItem
            value="action-add-asset"
            keywords={["cadastrar", "ativo", "comprar", "novo"]}
            onSelect={() => navigate("/dashboard/carteira")}
          >
            <Plus className="text-primary" />
            <span>Cadastrar novo ativo</span>
            <CommandShortcut>Carteira</CommandShortcut>
          </CommandItem>
          <CommandItem
            value="action-conhecer"
            keywords={["sobre", "manifesto", "história"]}
            onSelect={() => navigate("/dashboard/sobre")}
          >
            <Info className="text-muted-foreground" />
            <span>Conhecer o Aurum</span>
          </CommandItem>
          <CommandItem
            value="action-sign-out"
            keywords={["sair", "logout", "encerrar"]}
            onSelect={handleSignOut}
            className="text-[var(--negative)] data-[selected=true]:bg-[var(--negative-bg)]"
          >
            <LogOut className="text-[var(--negative)]" />
            <span>Sair da conta</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
