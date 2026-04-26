import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { ticker, company_name } = await req.json();
    if (!ticker) return Response.json({ error: 'ticker required' }, { status: 400 });

    // Query para Google News RSS
    const query = encodeURIComponent(`${ticker} ${company_name || ticker}`);
    const rssUrl = `https://news.google.com/rss/search?q=${query}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;

    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
      }
    });

    if (!response.ok) throw new Error(`RSS fetch failed: ${response.status}`);

    const xml = await response.text();

    // Parse manual do XML RSS
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null && items.length < 8) {
      const itemXml = match[1];

      const titleMatch = itemXml.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) ||
                         itemXml.match(/<title>([\s\S]*?)<\/title>/);
      const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/);
      const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
      const sourceMatch = itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/);

      if (!titleMatch) continue;

      let title = titleMatch[1].trim();
      // Remove o sufixo " - Nome da Fonte" que o Google News adiciona
      title = title.replace(/\s*-\s*[^-]+$/, '').trim();

      const pubDate = pubDateMatch ? new Date(pubDateMatch[1].trim()) : new Date();
      const source = sourceMatch ? sourceMatch[1].trim() : '';
      const link = linkMatch ? linkMatch[1].trim() : '';

      items.push({
        title,
        source,
        link,
        date: isNaN(pubDate.getTime()) ? new Date().toISOString() : pubDate.toISOString(),
      });
    }

    return Response.json({ news: items });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});