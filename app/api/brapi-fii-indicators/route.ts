import { NextResponse } from "next/server";

const BASE = "https://brapi.dev/api";

function brapiHeaders(): HeadersInit {
  const token = process.env.BRAPI_TOKEN;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Bulk proxy para indicadores de FIIs.
 * Wraps GET https://brapi.dev/api/v2/fii/indicators?symbols=A,B,C
 *
 * brapi v2 aceita até 20 símbolos por request. Retorna array com indicadores
 * fundamentais (pvp, dividendYield12m, navPerShare, equity, etc).
 *
 * Usado por Carteira pra exibir P/VP de FIIs sem fazer N requests à
 * /api/fii-detail/[ticker]. Cache 5 min via revalidate.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbols = (searchParams.get("symbols") ?? "").trim();

  if (!symbols) {
    return NextResponse.json({ error: "Missing 'symbols' parameter" }, { status: 400 });
  }

  const list = symbols
    .split(",")
    .map(s => s.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 20); // brapi limit

  if (list.length === 0) {
    return NextResponse.json({ error: "No valid symbols provided" }, { status: 400 });
  }

  const url = `${BASE}/v2/fii/indicators?symbols=${encodeURIComponent(list.join(","))}`;

  try {
    const res = await fetch(url, {
      headers: brapiHeaders(),
      next: { revalidate: 300 },
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.message ?? res.statusText, status: res.status },
        { status: res.status },
      );
    }
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("[brapi-fii-indicators] fetch failed:", err);
    return NextResponse.json({ error: "Failed to fetch brapi fii indicators" }, { status: 500 });
  }
}
