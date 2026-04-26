export type AssetType = 'stock' | 'fund' | 'bdr' | 'crypto';

export interface SearchResult {
  ticker: string;
  name: string;
  price: number | null;
  changePercent: number | null;
  logoUrl: string | null;
  type: AssetType;
  sector?: string;
}

export interface SearchResults {
  stocks: SearchResult[];
  funds: SearchResult[];
  cryptos: SearchResult[];
}

export interface SearchState {
  query: string;
  results: SearchResults;
  isLoading: boolean;
  error: string | null;
}