import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import HomeContent from "./HomeContent";
import type { Metadata } from "next";
import type { MarketItem } from "@/app/api/market/route";

export const metadata: Metadata = {
  title: "Início | Aurum Investimentos",
};

// Revalidate this page every 5 minutes so market data stays fresh
export const revalidate = 300;

async function getMarketData(): Promise<MarketItem[]> {
  const BRAPI_TOKEN = process.env.BRAPI_TOKEN;
  const token = BRAPI_TOKEN ? `?token=${BRAPI_TOKEN}` : "";
  const BASE = "https://brapi.dev/api";

  try {
    const [quotesRes, currencyRes] = await Promise.all([
      fetch(`${BASE}/quote/%5EBVSP,%5EGSPC${token}`, {
        next: { revalidate: 300 },
      }),
      fetch(`${BASE}/v2/currency?currency=USD-BRL${token}`, {
        next: { revalidate: 300 },
      }),
    ]);

    const quotesData = await quotesRes.json();
    const currencyData = await currencyRes.json();

    const results: MarketItem[] = [];

    const ibov = quotesData?.results?.find(
      (r: { symbol: string }) => r.symbol === "^BVSP"
    );
    if (ibov) {
      const pct: number = ibov.regularMarketChangePercent ?? 0;
      results.push({
        label: "IBOV",
        raw: pct,
        value: `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`,
        positive: pct >= 0,
      });
    }

    const sp = quotesData?.results?.find(
      (r: { symbol: string }) => r.symbol === "^GSPC"
    );
    if (sp) {
      const pct: number = sp.regularMarketChangePercent ?? 0;
      results.push({
        label: "S&P 500",
        raw: pct,
        value: `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`,
        positive: pct >= 0,
      });
    }

    const usd = currencyData?.currency?.[0];
    if (usd) {
      const pct: number = usd.pctChange ?? 0;
      results.push({
        label: "Dólar",
        raw: pct,
        value: `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`,
        positive: pct >= 0,
      });
    }

    return results;
  } catch {
    // Return fallback data if API fails
    return [
      { label: "IBOV", value: "--", raw: 0, positive: true },
      { label: "S&P 500", value: "--", raw: 0, positive: true },
      { label: "Dólar", value: "--", raw: 0, positive: false },
    ];
  }
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const fullName: string =
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Usuário";

  const rawFirst = fullName.split(" ")[0];
  const firstName =
    rawFirst.charAt(0).toUpperCase() + rawFirst.slice(1).toLowerCase();

  const marketData = await getMarketData();

  return <HomeContent firstName={firstName} marketData={marketData} />;
}
