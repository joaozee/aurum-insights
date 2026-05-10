import { NextResponse } from "next/server";
import { findCuratedPeers, SECTOR_PT_TO_EN } from "@/lib/peers";

const BASE = "https://brapi.dev/api";

function brapiHeaders(): HeadersInit {
  const token = process.env.BRAPI_TOKEN;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface BrapiListItem {
  stock: string;
  market_cap?: number;
  sector?: string;
  type?: string;
}

/**
 * GET /api/peers?industry=PT&sector=PT&exclude=PETR4&limit=8
 *
 * Estratégia:
 * 1. Tenta o map curado por indústria (lib/peers.ts) — preferível,
 *    pois agrupa por indústria específica (PETR4 com PRIO3, não com VALE3).
 * 2. Fallback: brapi /quote/list?sector=EN ordenado por market cap.
 *
 * Sempre exclui o ticker primário e tickers duplicados.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const industry = (searchParams.get("industry") ?? "").trim();
  const sector = (searchParams.get("sector") ?? "").trim();
  const exclude = (searchParams.get("exclude") ?? "").trim().toUpperCase();
  const limit = Math.min(20, Math.max(1, Number(searchParams.get("limit") ?? "8")));

  // 1) Curado por indústria
  const curated = findCuratedPeers(industry);
  if (curated && curated.length > 0) {
    const peers = curated.filter((t) => t !== exclude).slice(0, limit);
    return NextResponse.json(
      { peers, source: "curated", industry },
      { status: 200 },
    );
  }

  // 2) Fallback genérico via brapi (top market cap do mesmo setor)
  if (!sector) {
    return NextResponse.json({ peers: [], source: "none" }, { status: 200 });
  }

  const sectorEn = SECTOR_PT_TO_EN[sector] ?? sector;

  const params = new URLSearchParams({
    sector: sectorEn,
    type: "stock",
    sortBy: "market_cap_basic",
    sortOrder: "desc",
    limit: String(Math.min(20, limit + 4)), // pega alguns extras pra filtrar
  });

  try {
    const res = await fetch(`${BASE}/quote/list?${params}`, {
      headers: brapiHeaders(),
      next: { revalidate: 3600 }, // 1h cache no edge
    });
    if (!res.ok) {
      return NextResponse.json({ peers: [], source: "fallback_error" }, { status: 200 });
    }
    const data = (await res.json()) as { stocks?: BrapiListItem[] };
    const peers = (data.stocks ?? [])
      .map((s) => s.stock)
      .filter((t) => t && t !== exclude)
      .slice(0, limit);
    return NextResponse.json(
      { peers, source: "sector_fallback", sectorEn },
      { status: 200 },
    );
  } catch {
    return NextResponse.json({ peers: [], source: "fallback_error" }, { status: 200 });
  }
}
