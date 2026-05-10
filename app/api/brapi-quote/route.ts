import { NextResponse } from "next/server";

const BASE = "https://brapi.dev/api";

function brapiHeaders(): HeadersInit {
  const token = process.env.BRAPI_TOKEN;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tickers = (searchParams.get("tickers") ?? "").trim();
  const dividends = searchParams.get("dividends") === "true";
  const modules = (searchParams.get("modules") ?? "").trim();
  const range = (searchParams.get("range") ?? "").trim();
  const interval = (searchParams.get("interval") ?? "").trim();
  const startDate = (searchParams.get("startDate") ?? "").trim();
  const endDate = (searchParams.get("endDate") ?? "").trim();

  if (!tickers) {
    return NextResponse.json({ error: "Missing 'tickers' parameter" }, { status: 400 });
  }

  const tickerList = tickers
    .split(",")
    .map(t => t.trim().toUpperCase())
    .filter(Boolean);

  if (tickerList.length === 0) {
    return NextResponse.json({ error: "No valid tickers provided" }, { status: 400 });
  }

  const params = new URLSearchParams();
  if (dividends) params.set("dividends", "true");
  if (modules) params.set("modules", modules);
  if (range) params.set("range", range);
  if (interval) params.set("interval", interval);
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  const qs = params.toString();
  const url = `${BASE}/quote/${encodeURIComponent(tickerList.join(","))}${qs ? `?${qs}` : ""}`;

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
    console.error("[brapi-quote] fetch failed:", err);
    return NextResponse.json({ error: "Failed to fetch brapi quote" }, { status: 500 });
  }
}
