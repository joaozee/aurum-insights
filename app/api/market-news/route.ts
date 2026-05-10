import { NextResponse } from "next/server";

export interface MarketNewsItem {
  id: string;
  title: string;
  link: string;
  pubDate: string | null;
  category: string | null;
  thumb: string | null;
}

const RSS_URL = "https://www.infomoney.com.br/feed/";

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'");
}

function unwrapCdata(s: string): string {
  const m = s.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
  return decode((m ? m[1] : s).trim());
}

function extractTag(item: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const m = item.match(re);
  return m ? unwrapCdata(m[1]) : null;
}

function extractFirstImg(html: string | null): string | null {
  if (!html) return null;
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : null;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ticker = (searchParams.get("ticker") ?? "").trim().toUpperCase();

  try {
    const res = await fetch(RSS_URL, {
      next: { revalidate: 600 },
      headers: { "User-Agent": "Mozilla/5.0 AurumNewsBot" },
    });
    if (!res.ok) return NextResponse.json({ items: [] }, { status: 200 });
    const xml = await res.text();
    const allItems: MarketNewsItem[] = [];
    const itemRe = /<item>([\s\S]*?)<\/item>/g;
    let match: RegExpExecArray | null;
    while ((match = itemRe.exec(xml)) !== null && allItems.length < 60) {
      const block = match[1];
      const title = extractTag(block, "title");
      const link = extractTag(block, "link");
      const pubDate = extractTag(block, "pubDate");
      const category = extractTag(block, "category");
      const description = extractTag(block, "description");
      const thumb = extractFirstImg(description);
      if (title && link) {
        allItems.push({ id: link, title, link, pubDate, category, thumb });
      }
    }

    let items = allItems;
    if (ticker) {
      // Casa o ticker exato (BBAS3) ou o radical (BBAS) em title/category
      const radical = ticker.replace(/\d+$/, "");
      const re = new RegExp(`\\b(${escapeRegex(ticker)}|${escapeRegex(radical)})\\b`, "i");
      const matched = allItems.filter((n) => re.test(n.title) || (n.category && re.test(n.category)));
      // Se não houver matches, devolve as gerais (melhor que vazio)
      items = matched.length > 0 ? matched.slice(0, 8) : allItems.slice(0, 8);
    } else {
      items = allItems.slice(0, 8);
    }

    return NextResponse.json({ items }, { status: 200 });
  } catch {
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
