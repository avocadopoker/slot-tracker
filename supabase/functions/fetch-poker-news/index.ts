// ============================================================
// fetch-poker-news  (Supabase Edge Function)
//
// What this does:
//  1. Pulls headlines from OFFICIAL / press-release-style feeds only
//     (tour and site press releases — content meant to be redistributed).
//  2. Groups items that are clearly about the same story (title overlap).
//  3. Writes a short ORIGINAL digest per story — not a rewrite of any
//     single article — with links back to every source.
//  4. Inserts each as a pending row in news_drafts for approval.
//
// This does NOT scrape or rewrite competitor journalism. It aggregates
// facts from official sources and links out. See SOURCES below to add
// or remove feeds.
//
// Deploy:
//   supabase functions deploy fetch-poker-news
// Schedule: see supabase/schema_news.sql (pg_cron, runs daily)
// ============================================================

// Official / press-release feeds only. Add more as you find them —
// avoid third-party news sites here, that's the part to steer clear of.
const SOURCES = [
  { name: 'WSOP', url: 'https://www.wsop.com/blog/feed/' },
  { name: 'Hendon Mob News', url: 'https://www.thehendonmob.com/rss/news' },
]

function stripHtml(html) {
  return (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
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
    if (title) items.push({ title, link, desc, source: sourceName })
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
    return group.map((g) => `${g.desc || g.title} (${g.source})`).join(' ')
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
  if (!res.ok) return group.map((g) => `${g.desc || g.title} (${g.source})`).join(' ')
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
