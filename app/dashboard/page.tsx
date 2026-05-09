import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import HomeContent, { type AssetBreakdown } from "./HomeContent";
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

function formatPrice(symbol: string, price: number): string {
  if (price === 0 || !Number.isFinite(price)) return "--";
  if (symbol === "USDBRL=X") {
    return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
  if (symbol === "^BVSP") {
    return price.toLocaleString("pt-BR", { maximumFractionDigits: 0 }) + " pts";
  }
  return price.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface BrapiHistoricalPoint {
  date: number;
  close: number;
}

async function getMarketData(): Promise<MarketItem[]> {
  const BASE = "https://brapi.dev/api";
  const headers = brapiHeaders();

  try {
    // Busca IBOV, S&P 500 e Dólar com spark intraday (range=1d, interval=1h)
    // num único request, pra alimentar as mini sparklines do Home.
    const res = await fetch(
      `${BASE}/quote/%5EBVSP,%5EGSPC,USDBRL=X?range=1d&interval=1h`,
      { headers, next: { revalidate: 300 } }
    );
    const data = await res.json();
    const pcts: Record<string, number> = {};
    const prices: Record<string, number> = {};
    const sparks: Record<string, number[]> = {};

    for (const r of data?.results ?? []) {
      pcts[r.symbol] = r.regularMarketChangePercent ?? 0;
      prices[r.symbol] = r.regularMarketPrice ?? 0;
      const hist: BrapiHistoricalPoint[] = r.historicalDataPrice ?? [];
      sparks[r.symbol] = hist
        .map((h) => h.close)
        .filter((v) => Number.isFinite(v));
    }

    const map: { label: string; symbol: string }[] = [
      { label: "IBOV",    symbol: "^BVSP"   },
      { label: "S&P 500", symbol: "^GSPC"   },
      { label: "Dólar",   symbol: "USDBRL=X" },
    ];

    return map.map(({ label, symbol }) => {
      const pct = pcts[symbol] ?? 0;
      const price = prices[symbol] ?? 0;
      return {
        label,
        raw: pct,
        value: `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`,
        price: formatPrice(symbol, price),
        positive: pct >= 0,
        spark: sparks[symbol] ?? [],
      };
    });
  } catch {
    return [
      { label: "IBOV", value: "--", price: "--", raw: 0, positive: true, spark: [] },
      { label: "S&P 500", value: "--", price: "--", raw: 0, positive: true, spark: [] },
      { label: "Dólar", value: "--", price: "--", raw: 0, positive: false, spark: [] },
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

  // Quick stats for shortcut cards
  const userEmail = user.email ?? "";
  const today  = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
  const lastDay  = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split("T")[0];

  const [assetsRes, txRes] = await Promise.all([
    // Pega o tipo de cada ativo do user pra montar o breakdown por classe.
    supabase.from("asset").select("type").eq("user_email", userEmail),
    supabase.from("finance_transaction").select("type, amount").eq("user_email", userEmail).gte("transaction_date", firstDay).lte("transaction_date", lastDay),
  ]);

  // Aggregate asset count by class. The 'asset' table uses the same constants
  // as Carteira ("acoes" | "fiis" | "renda_fixa" | "cripto" | "fundos" legacy).
  const breakdown: AssetBreakdown = { acoes: 0, fiis: 0, renda_fixa: 0, cripto: 0, fundos: 0, total: 0 };
  for (const a of (assetsRes.data ?? []) as { type: string }[]) {
    const k = a.type as keyof AssetBreakdown;
    if (k in breakdown && k !== "total") {
      breakdown[k] = (breakdown[k] as number) + 1;
    }
    breakdown.total += 1;
  }

  let monthIncome = 0, monthExpense = 0;
  for (const t of (txRes.data ?? []) as { type: string; amount: number }[]) {
    if (t.type === "entrada") monthIncome += Number(t.amount);
    else                      monthExpense += Number(t.amount);
  }
  const monthBalance = monthIncome - monthExpense;

  return (
    <HomeContent
      firstName={firstName}
      marketData={marketData}
      quickStats={{ assetCount: breakdown.total, monthBalance }}
      assetBreakdown={breakdown}
    />
  );
}
