import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { textToTiptap, slugify } from '@/lib/tiptap'

export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface LinkItem { name: string; url: string; tags: string[] }
interface Author { id: string; name: string; role: string }

const CASINO_LINKS: LinkItem[] = [
  { name: 'Punt Casino', url: '/casinos/punt-casino', tags: ['punt-casino'] },
  { name: 'Mzansibet', url: '/casinos/mzansibet', tags: ['mzansibet'] },
  { name: 'Hollywoodbets Casino', url: '/casinos/hollywood-bets-casino', tags: ['hollywoodbets'] },
  { name: 'Betway Casino', url: '/casinos/betway-casino', tags: ['betway'] },
  { name: 'YesPlay Casino', url: '/casinos/yesplay-casino', tags: ['yesplay'] },
  { name: 'Easybet Casino', url: '/casinos/easybet-casino', tags: ['easybet'] },
  { name: 'Yebo Casino', url: '/casinos/yebo-casino', tags: ['yebo-casino'] },
  { name: 'Lottostar Casino', url: '/casinos/lottostar-casino', tags: ['lottostar'] },
]

const SLOT_LINKS: LinkItem[] = [
  { name: 'Aviator', url: '/slots/aviator', tags: ['aviator'] },
  { name: 'Gates of Olympus', url: '/slots/gates-of-olympus-1000', tags: ['gates-of-olympus'] },
  { name: 'Sweet Bonanza', url: '/slots/sweet-bonanza', tags: ['sweet-bonanza'] },
  { name: 'Big Bass Bonanza', url: '/slots/big-bass-bonanza', tags: ['big-bass-bonanza'] },
  { name: 'Starburst', url: '/slots/starburst', tags: ['starburst'] },
  { name: 'Book of Dead', url: '/slots/book-of-dead', tags: ['book-of-dead'] },
  { name: 'Mega Moolah', url: '/slots/mega-moolah', tags: ['mega-moolah'] },
  { name: 'Wolf Gold', url: '/slots/wolf-gold', tags: ['wolf-gold'] },
  { name: 'Hot Hot Fruit', url: '/slots/hot-hot-fruit', tags: ['hot-hot-fruit'] },
  { name: 'Reactoonz', url: '/slots/reactoonz', tags: ['reactoonz'] },
  { name: 'Dead or Alive 2', url: '/slots/dead-or-alive-2', tags: ['dead-or-alive-2'] },
  { name: 'Fire Joker', url: '/slots/fire-joker', tags: ['fire-joker'] },
]

const CATEGORIES = ['Industry News','Game Reviews','Bonuses & Promotions','Mobile & App Gaming','Responsible Gambling','Interviews & Opinions','Regulatory Updates','New Game Releases']

function inferTags(text: string): string[] {
  const lower = text.toLowerCase()
  const seen: Record<string, boolean> = {}
  const tags: string[] = []
  for (const c of CASINO_LINKS) {
    if (lower.includes(c.name.toLowerCase()) || c.tags.some(t => lower.includes(t))) {
      for (const t of c.tags) { if (!seen[t]) { seen[t] = true; tags.push(t) } }
    }
  }
  for (const s of SLOT_LINKS) {
    if (lower.includes(s.name.toLowerCase()) || s.tags.some(t => lower.includes(t))) {
      for (const t of s.tags) { if (!seen[t]) { seen[t] = true; tags.push(t) } }
    }
  }
  return tags
}

async function getRandomAuthor(): Promise<Author | null> {
  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data } = await supabase.from('authors').select('id, name, role')
    if (!data || data.length === 0) return null
    const row = data[Math.floor(Math.random() * data.length)]
    return { id: String(row.id), name: String(row.name), role: String(row.role) }
  } catch { return null }
}

async function searchWeb(query: string): Promise<string> {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) return ''
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey, query: query + ' South Africa 2025', search_depth: 'advanced', max_results: 5 }),
    })
    const data = await res.json()
    return (data.results || []).map((r: { title: string; content: string; url: string }) =>
      r.title + ': ' + r.content
    ).join('\n\n')
  } catch { return '' }
}

// Synchronous image generation with 25s timeout — runs within the request
async function generateImage(prompt: string): Promise<string> {
  const apiKey = process.env.REPLICATE_API_KEY
  if (!apiKey) return ''
  try {
    // Start prediction
    const startRes = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: { prompt, go_fast: true, num_outputs: 1, aspect_ratio: '16:9', output_format: 'webp', output_quality: 80 } }),
    })
    const prediction = await startRes.json()
    if (!prediction.id) return ''

    // Poll every 2s up to 12 attempts (24s total)
    for (let i = 0; i < 12; i++) {
      await new Promise(r => setTimeout(r, 2000))
      const pollRes = await fetch('https://api.replicate.com/v1/predictions/' + prediction.id, {
        headers: { 'Authorization': 'Bearer ' + apiKey },
      })
      const poll = await pollRes.json()
      if (poll.status === 'succeeded' && poll.output) {
        return Array.isArray(poll.output) ? String(poll.output[0]) : String(poll.output)
      }
      if (poll.status === 'failed') return ''
    }
    return ''
  } catch { return '' }
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('x-admin-password')
  if (auth !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { keyword, contentType, additionalContext, globalKeywords } = await req.json()
  if (!keyword) return NextResponse.json({ error: 'keyword required' }, { status: 400 })

  const [searchContext, author] = await Promise.all([searchWeb(keyword), getRandomAuthor()])

  const internalLinksCtx = 'CASINO PAGES (link with markdown [Name](url) when mentioned):\n'
    + CASINO_LINKS.map(c => '[' + c.name + '](https://onlinemobileslots.com' + c.url + ')').join(', ')
    + '\n\nSLOT GAME PAGES (link with markdown [Name](url) when mentioned):\n'
    + SLOT_LINKS.map(s => '[' + s.name + '](https://onlinemobileslots.com' + s.url + ')').join(', ')

  const keywordsCtx = Array.isArray(globalKeywords) && globalKeywords.length > 0
    ? '\n\nGLOBAL KEYWORDS - weave naturally: ' + globalKeywords.join(', ')
    : ''

  const systemPrompt = 'You are an SEO writer for onlinemobileslots.com, South African casino affiliate. ZAR players. Direct, human, no puffery, no em dashes.\n\nCATEGORIES: ' + CATEGORIES.join(', ')
    + '\n\nINTERNAL LINKS — use markdown format [Anchor Text](https://onlinemobileslots.com/path) inline in paragraphs, 3-5 per article:\n' + internalLinksCtx
    + keywordsCtx
    + '\n\nRespond ONLY with valid JSON (no backticks):\n{"title":"under 70 chars","summary":"under 160 chars","categories":["from list"],"imagePrompt":"vivid 16:9 banner digital illustration casino gaming theme no text in image","content":"full markdown 600+ words ## H2 ### H3 **bold** [link text](url) never invent bonus amounts"}'
    + '\nContent type: ' + (contentType || 'news article')
    + (author ? '\nByline: ' + author.name + ' (' + author.role + ')' : '')

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: 'Write about: "' + keyword + '"' + (additionalContext ? '\n' + additionalContext : '') + '\n\nResearch:\n' + searchContext + '\n\nJSON only.' }],
    })

    const rawText = message.content[0].type === 'text' ? message.content[0].text : ''
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)

    const tags = inferTags(parsed.content + ' ' + parsed.title + ' ' + keyword)
    const tiptapContent = textToTiptap(parsed.content)
    const slug = slugify(parsed.title)

    // Generate image synchronously — maxDuration=60 gives us time
    const imageUrl = parsed.imagePrompt ? await generateImage(parsed.imagePrompt) : ''

    return NextResponse.json({
      title: parsed.title,
      summary: parsed.summary,
      categories: parsed.categories,
      slug,
      content: tiptapContent,
      contentMarkdown: parsed.content,
      imageUrl,
      imagePrompt: parsed.imagePrompt,
      authorId: author ? author.id : null,
      authorName: author ? author.name : null,
      authorRole: author ? author.role : null,
      tags,
    })
  } catch (e) {
    return NextResponse.json({ error: 'Generation failed: ' + String(e) }, { status: 500 })
  }
}
