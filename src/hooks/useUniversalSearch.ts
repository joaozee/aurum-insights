import { useState, useEffect, useRef } from "react";
import type { SearchResult, SearchResults } from "@/types/search";

const BRAPI_TOKEN = "iNyQwWqh7mVeGFEkWgXumQ";
const DEBOUNCE_MS = 350;

const emptyResults: SearchResults = { stocks: [], funds: [], cryptos: [] };

async function searchB3(query: string, signal: AbortSignal): Promise<Pick<SearchResults, 'stocks' | 'funds'>> {
  const url = `https://brapi.dev/api/quote/list?search=${encodeURIComponent(query)}&limit=5&token=${BRAPI_TOKEN}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`B3 search failed: ${res.status}`);
  const data = await res.json();

  const stocks: SearchResult[] = [];
  const funds: SearchResult[] = [];

  (data.stocks || []).forEach((item: { stock: string; name: string; close: number; change: number; sector?: string; type?: string; logo?: string }) => {
    const assetType = item.type === 'fund' ? 'fund' : item.type === 'bdr' ? 'bdr' : 'stock';
    const result: SearchResult = {
      ticker: item.stock,
      name: item.name || item.stock,
      price: item.close ?? null,
      changePercent: item.change ?? null,
      logoUrl: `https://icons.brapi.dev/icons/${item.stock}.svg`,
      type: assetType,
      sector: item.sector,
    };
    if (assetType === 'fund') {
      funds.push(result);
    } else {
      stocks.push(result);
    }
  });

  return { stocks, funds };
}

async function searchCrypto(query: string, signal: AbortSignal): Promise<SearchResult[]> {
  const url = `https://brapi.dev/api/v2/crypto/available?search=${encodeURIComponent(query)}&token=${BRAPI_TOKEN}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Crypto search failed: ${res.status}`);
  const data = await res.json();

  const coins = (data.coins || []).slice(0, 5);
  return coins.map((coin: { coin: string; name?: string }) => ({
    ticker: coin.coin,
    name: coin.name || coin.coin,
    price: null,
    changePercent: null,
    logoUrl: `https://icons.brapi.dev/icons/${coin.coin}.svg`,
    type: 'crypto' as const,
  }));
}

export function useUniversalSearch(query: string) {
  const [results, setResults] = useState<SearchResults>(emptyResults);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const lastQueryRef = useRef<string>("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const trimmed = query.trim().toUpperCase();

    if (trimmed.length < 3) {
      setResults(emptyResults);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Don't re-fetch for identical query
    if (trimmed === lastQueryRef.current) return;

    // Clear previous debounce
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      // Cancel previous in-flight requests
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      lastQueryRef.current = trimmed;

      setIsLoading(true);
      setError(null);

      const [b3Result, cryptoResult] = await Promise.allSettled([
        searchB3(trimmed, controller.signal),
        searchCrypto(trimmed, controller.signal),
      ]);

      if (controller.signal.aborted) return;

      let stocks: SearchResult[] = [];
      let funds: SearchResult[] = [];
      let cryptos: SearchResult[] = [];
      let hasError = false;

      if (b3Result.status === 'fulfilled') {
        stocks = b3Result.value.stocks;
        funds = b3Result.value.funds;
      } else if (b3Result.reason?.name !== 'AbortError') {
        console.error("B3 search error:", b3Result.reason);
        hasError = true;
      }

      if (cryptoResult.status === 'fulfilled') {
        cryptos = cryptoResult.value;
      } else if (cryptoResult.reason?.name !== 'AbortError') {
        console.error("Crypto search error:", cryptoResult.reason);
      }

      const total = stocks.length + funds.length + cryptos.length;
      if (hasError && total === 0) {
        setError("Erro ao buscar ativos. Tente novamente.");
      }

      setResults({ stocks, funds, cryptos });
      setIsLoading(false);
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { results, isLoading, error };
}