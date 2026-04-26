import { useState, useEffect, useRef, useCallback } from "react";
import { Search, TrendingUp, Building2, Bitcoin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useUniversalSearch } from "@/hooks/useUniversalSearch";

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtPrice(price) {
  if (price == null) return null;
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });
}

function fmtChange(pct) {
  if (pct == null) return null;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

const TYPE_CONFIG = {
  stock: { label: "AÇÃO",  bg: "bg-amber-500/20",   text: "text-amber-400"   },
  fund:  { label: "FII",   bg: "bg-emerald-500/20",  text: "text-emerald-400" },
  bdr:   { label: "BDR",   bg: "bg-blue-500/20",     text: "text-blue-400"    },
  crypto:{ label: "CRIPTO",bg: "bg-violet-500/20",   text: "text-violet-400"  },
};

const GROUP_CONFIG = {
  stocks:  { icon: TrendingUp,  label: "AÇÕES" },
  funds:   { icon: Building2,   label: "FUNDOS IMOBILIÁRIOS" },
  cryptos: { icon: Bitcoin,     label: "CRIPTOMOEDAS" },
};

// ── Logo com fallback ─────────────────────────────────────────────────────────

function AssetLogo({ logoUrl, type, ticker }) {
  const [failed, setFailed] = useState(false);
  const FallbackIcon = type === 'crypto' ? Bitcoin : type === 'fund' ? Building2 : TrendingUp;

  if (!logoUrl || failed) {
    return (
      <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center shrink-0">
        <FallbackIcon className="h-4 w-4 text-gray-400" />
      </div>
    );
  }

  return (
    <img
      src={logoUrl}
      alt={ticker}
      onError={() => setFailed(true)}
      className="w-8 h-8 rounded-lg object-contain bg-gray-800 shrink-0"
    />
  );
}

// ── Result Row ────────────────────────────────────────────────────────────────

function ResultRow({ result, isSelected, onSelect }) {
  const cfg = TYPE_CONFIG[result.type] || TYPE_CONFIG.stock;
  const change = result.changePercent;
  const changeColor = change == null ? "text-gray-500" : change >= 0 ? "text-emerald-400" : "text-red-400";

  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      onClick={() => onSelect(result)}
      className={cn(
        "w-full px-4 py-3 flex items-center gap-3 text-left transition-all border-b border-gray-800/60 last:border-0",
        isSelected ? "bg-violet-500/20" : "hover:bg-gray-800/60"
      )}
    >
      <AssetLogo logoUrl={result.logoUrl} type={result.type} ticker={result.ticker} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn("font-bold text-sm", isSelected ? "text-violet-300" : "text-white")}>
            {result.ticker}
          </span>
          <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-semibold", cfg.bg, cfg.text)}>
            {cfg.label}
          </span>
        </div>
        <p className="text-gray-400 text-xs truncate mt-0.5">{result.name}</p>
      </div>
      <div className="text-right shrink-0">
        {result.price != null && (
          <p className="text-white text-sm font-medium">{fmtPrice(result.price)}</p>
        )}
        {change != null && (
          <p className={cn("text-xs font-medium", changeColor)}>{fmtChange(change)}</p>
        )}
      </div>
    </button>
  );
}

// ── Section Header ────────────────────────────────────────────────────────────

function SectionHeader({ groupKey }) {
  const cfg = GROUP_CONFIG[groupKey];
  const Icon = cfg.icon;
  return (
    <div className="px-4 py-2 flex items-center gap-2 bg-gray-800/50 border-b border-gray-700/50">
      <Icon className="h-3.5 w-3.5 text-gray-500" />
      <span className="text-gray-500 text-xs font-semibold tracking-wider">{cfg.label}</span>
    </div>
  );
}

// ── Skeleton rows ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-800/60">
      <div className="w-8 h-8 rounded-lg bg-gray-700 animate-pulse shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-16 bg-gray-700 rounded animate-pulse" />
        <div className="h-2.5 w-28 bg-gray-800 rounded animate-pulse" />
      </div>
      <div className="space-y-1 text-right">
        <div className="h-3 w-14 bg-gray-700 rounded animate-pulse" />
        <div className="h-2.5 w-10 bg-gray-800 rounded animate-pulse" />
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function UniversalSearchBar({ onSelect, placeholder = "Buscar ações, FIIs ou criptomoedas..." }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const { results, isLoading, error } = useUniversalSearch(query);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Flatten all results for keyboard navigation
  const allResults = [
    ...results.stocks,
    ...results.funds,
    ...results.cryptos,
  ];

  const hasResults = allResults.length > 0;
  const showDropdown = open && query.trim().length >= 3;

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Reset selected when results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [results]);

  const handleSelect = useCallback((result) => {
    setQuery(result.ticker);
    setOpen(false);
    onSelect(result.ticker, result.type);
  }, [onSelect]);

  const handleKeyDown = (e) => {
    if (!showDropdown) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, allResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < allResults.length) {
        handleSelect(allResults[selectedIndex]);
      } else if (query.trim()) {
        setOpen(false);
        onSelect(query.trim().toUpperCase(), 'stock');
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setSelectedIndex(-1);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setOpen(false);
      onSelect(query.trim().toUpperCase(), 'stock');
    }
  };

  // Build flat index map for selection highlighting
  const getResultIndex = (groupKey, itemIndex) => {
    const offsets = { stocks: 0, funds: results.stocks.length, cryptos: results.stocks.length + results.funds.length };
    return offsets[groupKey] + itemIndex;
  };

  const groupOrder = ['stocks', 'funds', 'cryptos'];
  const groupData = { stocks: results.stocks, funds: results.funds, cryptos: results.cryptos };

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value.toUpperCase());
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoComplete="off"
            aria-autocomplete="list"
            aria-expanded={showDropdown}
            aria-haspopup="listbox"
            className="bg-gray-800 border-gray-700 text-white h-12 text-base pr-10"
          />
          {isLoading
            ? <Loader2 className="h-4 w-4 absolute right-3 top-4 text-gray-400 animate-spin" />
            : <Search className="h-4 w-4 absolute right-3 top-4 text-gray-500" />
          }
        </div>
        <button
          type="submit"
          className="bg-amber-500 hover:bg-amber-600 text-black font-semibold h-12 px-6 rounded-md flex items-center gap-2 transition-colors"
        >
          <Search className="h-5 w-5" />
          Pesquisar
        </button>
      </form>

      {/* Dropdown */}
      {showDropdown && (
        <div
          role="listbox"
          className="absolute z-50 w-full mt-2 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden max-h-[420px] overflow-y-auto"
        >
          {/* Loading skeletons */}
          {isLoading && (
            <div>
              {[...Array(4)].map((_, i) => <SkeletonRow key={i} />)}
            </div>
          )}

          {/* Error state */}
          {!isLoading && error && !hasResults && (
            <div className="px-4 py-6 text-center text-gray-400 text-sm">{error}</div>
          )}

          {/* No results */}
          {!isLoading && !error && !hasResults && (
            <div className="px-4 py-6 text-center text-gray-400 text-sm">
              Nenhum ativo encontrado para "<span className="text-white">{query}</span>"
            </div>
          )}

          {/* Results grouped */}
          {!isLoading && groupOrder.map(groupKey => {
            const items = groupData[groupKey];
            if (!items.length) return null;
            return (
              <div key={groupKey}>
                <SectionHeader groupKey={groupKey} />
                {items.map((result, i) => {
                  const flatIdx = getResultIndex(groupKey, i);
                  return (
                    <ResultRow
                      key={result.ticker}
                      result={result}
                      isSelected={flatIdx === selectedIndex}
                      onSelect={handleSelect}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}