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

function brapiHeaders(): HeadersInit {
  const token = process.env.BRAPI_TOKEN;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function getMarketData(): Promise<MarketItem[]> {
  const BASE = "https://brapi.dev/api";
  const headers = brapiHeaders();

  try {
    // Busca IBOV, S&P 500 e Dólar num único request — todos em tempo real
    const res = await fetch(
      `${BASE}/quote/%5EBVSP,%5EGSPC,USDBRL=X`,
      { headers, next: { revalidate: 300 } }
    );
    const data = await res.json();
    const quotes: Record<string, number> = {};

    for (const r of data?.results ?? []) {
      quotes[r.symbol] = r.regularMarketChangePercent ?? 0;
    }

    const map: { label: string; symbol: string }[] = [
      { label: "IBOV",    symbol: "^BVSP"   },
      { label: "S&P 500", symbol: "^GSPC"   },
      { label: "Dólar",   symbol: "USDBRL=X" },
    ];

    return map.map(({ label, symbol }) => {
      const pct = quotes[symbol] ?? 0;
      return {
        label,
        raw: pct,
        value: `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`,
        positive: pct >= 0,
      };
    });
  } catch {
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
