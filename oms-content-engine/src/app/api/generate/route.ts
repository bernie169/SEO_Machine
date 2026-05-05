import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { textToTiptap, slugify } from '@/lib/tiptap'

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
  { name: 'Rise of Olympus', url: '/slots/rise-of-olympus', tags: ['rise-of-olympus'] },
  { name: 'Extra Chilli', url: '/slots/extra-chilli', tags: ['extra-chilli'] },
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
  if (!apiKey) return 'No search results available.'
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey, query: query + ' South Africa 2025', search_depth: 'advanced', max_results: 5, include_answer: true }),
    })
    const data = await res.json()
    return (data.results || []).map((r: { title: string; content: string; url: string }) =>
      'SOURCE: ' + r.title + '\nURL: ' + r.url + '\nCONTENT: ' + r.content
    ).join('\n\n---\n\n')
  } catch { return 'Search unavailable.' }
}

// Fire and forget image generation - runs in background, updates Supabase when done
async function generateImageBackground(prompt: string, slug: string): Promise<void> {
  const apiKey = process.env.REPLICATE_API_KEY
  if (!apiKey || !prompt) return
  try {
    // Start prediction (don't wait)
    const startRes = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: { prompt, go_fast: true, num_outputs: 1, aspect_ratio: '16:9', output_format: 'webp', output_quality: 80 } }),
    })
    const prediction = await startRes.json()
    const predId = prediction.id
    if (!predId) return

    // Poll for result (up to 30 seconds)
    for (let i = 0; i < 15; i++) {
      await new Promise(r => setTimeout(r, 2000))
      const pollRes = await fetch('https://api.replicate.com/v1/predictions/' + predId, {
        headers: { 'Authorization': 'Bearer ' + apiKey },
      })
      const pollData = await pollRes.json()
      if (pollData.status === 'succeeded' && pollData.output) {
        const imageUrl = Array.isArray(pollData.output) ? String(pollData.output[0]) : String(pollData.output)
        // Update the news record with the image URL
        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
        await supabase.from('news').update({ image: imageUrl }).eq('slug', slug)
        return
      }
      if (pollData.status === 'failed') return
    }
  } catch (e) {
    console.error('Background image error:', e)
  }
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('x-admin-password')
  if (auth !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { keyword, contentType, additionalContext, globalKeywords } = await req.json()
  if (!keyword) return NextResponse.json({ error: 'keyword required' }, { status: 400 })

  const [searchContext, author] = await Promise.all([searchWeb(keyword), getRandomAuthor()])

  const internalLinksCtx = 'CASINO PAGES:\n'
    + CASINO_LINKS.map(c => '[' + c.name + '](https://onlinemobileslots.com' + c.url + ')').join(', ')
    + '\n\nSLOT GAME PAGES:\n'
    + SLOT_LINKS.map(s => '[' + s.name + '](https://onlinemobileslots.com' + s.url + ')').join(', ')

  const keywordsCtx = Array.isArray(globalKeywords) && globalKeywords.length > 0
    ? '\n\nGLOBAL KEYWORDS - weave naturally: ' + globalKeywords.join(', ')
    : ''

  const systemPrompt = 'You are an SEO content writer for onlinemobileslots.com, South African casino affiliate. Write for ZAR players. Direct, human, no puffery, no em dashes.\n\nAVAILABLE CATEGORIES: ' + CATEGORIES.join(', ')
    + '\n\nINTERNAL LINKS - include 3-5 using markdown [Anchor Text](URL):\n' + internalLinksCtx
    + keywordsCtx
    + '\n\nRespond ONLY with valid JSON (no backticks):\n{"title":"under 70 chars","summary":"under 160 chars","categories":["from list"],"imagePrompt":"vivid 16:9 banner digital illustration casino gaming theme no text","content":"full markdown 600+ words ## H2 ### H3 **bold** 3-5 internal links never invent bonus amounts"}'
    + '\nContent type: ' + (contentType || 'news article')
    + (author ? '\nByline: ' + author.name + ' (' + author.role + ')' : '')

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: 'Write a ' + (contentType || 'news article') + ' about: "' + keyword + '"' + (additionalContext ? '\nContext: ' + additionalContext : '') + '\n\nResearch:\n' + searchContext + '\n\nJSON only.' }],
    })

    const rawText = message.content[0].type === 'text' ? message.content[0].text : ''
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)

    const tags = inferTags(parsed.content + ' ' + parsed.title + ' ' + keyword)
    const tiptapContent = textToTiptap(parsed.content)
    const slug = slugify(parsed.title)

    // Fire image generation in background — does NOT block response
    // Image updates Supabase directly once Replicate finishes
    if (parsed.imagePrompt) {
      generateImageBackground(parsed.imagePrompt, slug).catch(console.error)
    }

    return NextResponse.json({
      title: parsed.title,
      summary: parsed.summary,
      categories: parsed.categories,
      slug,
      content: tiptapContent,
      contentMarkdown: parsed.content,
      imageUrl: '', // Will be updated in background
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
