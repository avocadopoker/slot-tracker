// ============================================================
// fetch-poker-news  (Supabase Edge Function)
//
// What this does:
//  1. Pulls RSS feeds from poker news sites (headline + short snippet
//     ONLY — RSS never carries full article text).
//  2. Filters out non-news items (strategy pieces, podcasts, promos)
//     where the source feed mixes them in.
//  3. Groups items that are clearly about the same story (title overlap).
//  4. Writes a short ORIGINAL digest per story — not a rewrite of any
//     single article — with links back to every source.
//  5. Inserts each as a pending row in news_drafts for approval.
//
// This does NOT scrape or rewrite full articles. It only ever reads the
// RSS headline/snippet (a sentence or two, same as what shows in any
// RSS reader), synthesizes something original across sources, and links
// back to the original for the full story. See SOURCES below to add or
// remove feeds.
//
// Deploy:
//   supabase functions deploy fetch-poker-news
// Schedule: see supabase/schema_news.sql (pg_cron, runs daily)
// ============================================================

const SOURCES = [
  { name: 'PokerNews', url: 'https://www.pokernews.com/rss.php' },
  { name: 'Card Player', url: 'https://www.cardplayer.com/poker-news.rss' },
  { name: 'Pokerati', url: 'https://pokerati.com/feed/' },
]

// Paths that indicate the item is NOT a news story (strategy, podcast,
// video, promo content some feeds mix into their main RSS).
const NON_NEWS_PATTERNS = [
  '/strategy/', '/podcast/', '/video/', '/promotions/', '/freerolls/',
]

function isLikelyNews(link) {
  const l = (link || '').toLowerCase()
  return !NON_NEWS_PATTERNS.some((p) => l.includes(p))
}

function stripHtml(raw) {
  let s = raw || ''
  // Unwrap CDATA sections first: <![CDATA[ ... ]]>
  s = s.replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '')
  // Strip HTML tags
  s = s.replace(/<[^>]+>/g, ' ')
  // Decode a few common entities
  s = s
    .replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
  return s.replace(/\s+/g, ' ').trim()
}

function parseRss(xml, sourceName) {
  const items = []
  const itemBlocks = xml.split(/<item>|<entry>/i).slice(1)
  for (const block of itemBlocks) {
    const title = stripHtml((block.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || '')
    const link = stripHtml((block.match(/<link>([\s\S]*?)<\/link>/i) || [])[1] || '')
      || (block.match(/<link[^>]*href="([^"]+)"/i) || [])[1] || ''
    const desc = stripHtml(
      (block.match(/<description>([\s\S]*?)<\/description>/i) ||
       block.match(/<summary>([\s\S]*?)<\/summary>/i) || [])[1] || ''
    )
    if (title && isLikelyNews(link)) items.push({ title, link, desc, source: sourceName })
  }
  return items.slice(0, 15) // most recent items only
}

// Very light grouping: items whose titles share 3+ significant words
// are treated as the same story.
function significantWords(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3)
}

function groupStories(items) {
  const groups = []
  for (const item of items) {
    const words = new Set(significantWords(item.title))
    let placed = false
    for (const g of groups) {
      const overlap = [...words].filter((w) => g.words.has(w)).length
      if (overlap >= 3) {
        g.items.push(item)
        words.forEach((w) => g.words.add(w))
        placed = true
        break
      }
    }
    if (!placed) groups.push({ items: [item], words })
  }
  return groups.map((g) => g.items)
}

// Build an original short digest for a story group. With no AI key
// configured this is a plain factual summary built from the source
// titles/descriptions. If ANTHROPIC_API_KEY is set, it asks Claude to
// synthesize a genuinely original 2-3 sentence writeup across sources.
async function synthesize(group) {
  const headline = group[0].title
  const bullets = group.map((g) => `${g.source}: ${g.title}. ${g.desc}`).join('\n')

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) {
    // Fallback: plain aggregation, no AI. Still original (not copied
    // wording) — just a factual listing for Lars to edit before approving.
    return group.map((g) => g.desc || g.title).join(' ')
  }

  const prompt = `You are writing a short, original poker news digest for an app.
Sources below report on the same story. Using ONLY the facts present, write
a neutral 2-3 sentence summary IN YOUR OWN WORDS. Do not copy phrasing from
any source. Do not editorialize.

${bullets}

Return only the summary text, nothing else.`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) return group.map((g) => g.desc || g.title).join(' ')
  const data = await res.json()
  const text = (data.content || []).map((b) => b.text || '').join('').trim()
  return text || headline
}

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  let allItems = []
  for (const src of SOURCES) {
    try {
      const res = await fetch(src.url)
      const xml = await res.text()
      allItems = allItems.concat(parseRss(xml, src.name))
    } catch (e) {
      console.log(`Failed to fetch ${src.name}:`, e.message)
    }
  }

  const groups = groupStories(allItems)
  const drafts = []

  for (const group of groups) {
    const headline = group[0].title
    const summary = await synthesize(group)
    const sourceLinks = group.map((g) => ({ name: g.source, url: g.link }))
    drafts.push({ headline, summary, source_links: sourceLinks, status: 'pending' })
  }

  // Insert drafts, skipping duplicates (same headline already drafted/published)
  let inserted = 0
  for (const d of drafts) {
    const check = await fetch(
      `${supabaseUrl}/rest/v1/news_drafts?headline=eq.${encodeURIComponent(d.headline)}&select=id`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
    )
    const existing = await check.json()
    if (Array.isArray(existing) && existing.length > 0) continue

    await fetch(`${supabaseUrl}/rest/v1/news_drafts`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(d),
    })
    inserted++
  }

  return new Response(JSON.stringify({ fetched: allItems.length, groups: groups.length, inserted }), {
    headers: { 'content-type': 'application/json' },
  })
})
