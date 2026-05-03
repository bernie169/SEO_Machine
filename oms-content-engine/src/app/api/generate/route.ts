import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { textToTiptap, slugify } from '@/lib/tiptap'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const CATEGORIES = ['Industry News','Game Reviews','Bonuses & Promotions','Mobile & App Gaming','Responsible Gambling','Interviews & Opinions','Regulatory Updates','New Game Releases']

const CASINO_LINKS = [
  { name: 'Punt Casino', url: '/casinos/punt-casino', tags: ['punt-casino'] },
  { name: 'Mzansibet', url: '/casinos/mzansibet', tags: ['mzansibet'] },
  { name: 'Hollywoodbets Casino', url: '/casinos/hollywood-bets-casino', tags: ['hollywoodbets'] },
  { name: 'Betway Casino', url: '/casinos/betway-casino', tags: ['betway'] },
  { name: 'YesPlay Casino', url: '/casinos/yesplay-casino', tags: ['yesplay'] },
  { name: 'Easybet Casino', url: '/casinos/easybet-casino', tags: ['easybet'] },
  { name: 'Yebo Casino', url: '/casinos/yebo-casino', tags: ['yebo-casino'] },
  { name: 'Lottostar Casino', url: '/casinos/lottostar-casino', tags: ['lottostar'] },
  { name: 'Betshezi Casino', url: '/casinos/betshezi-casino', tags: ['betshezi'] },
  { name: 'Play Live', url: '/casinos/play-live', tags: ['play-live'] },
]

const SLOT_LINKS = [
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
  { name: 'Divine Fortune', url: '/slots/divine-fortune', tags: ['divine-fortune'] },
  { name: 'Dead or Alive 2', url: '/slots/dead-or-alive-2', tags: ['dead-or-alive-2'] },
  { name: 'Fire Joker', url: '/slots/fire-joker', tags: ['fire-joker'] },
  { name: 'Rise of Olympus', url: '/slots/rise-of-olympus', tags: ['rise-of-olympus'] },
  { name: 'Extra Chilli', url: '/slots/extra-chilli', tags: ['extra-chilli'] },
  { name: 'Gold Blitz Ultimate', url: '/slots/gold-blitz-ultimate', tags: ['gold-blitz'] },
]

function inferTags(text: string): string[] {
  const lower = text.toLowerCase()
  const tags: string[] = []
  for (const c of CASINO_LINKS) {
    if (lower.includes(c.name.toLowerCase()) || c.tags.some(t => lower.includes(t))) {
      tags.push(...c.tags)
    }
  }
  for (const s of SLOT_LINKS) {
    if (lower.includes(s.name.toLowerCase()) || s.tags.some(t => lower.includes(t))) {
      tags.push(...s.tags)
    }
  }
  return [...new Set(tags)]
}

async function getRandomAuthor(): Promise<{ id: string; name: string; role: string } | null> {
  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data } = await supabase.from('authors').select('id, name, role')
    if (!data || data.length === 0) return null
    return data[Math.floor(Math.random() * data.length)]
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

async function generateImage(prompt: string): Promise<string> {
  const apiKey = process.env.REPLICATE_API_KEY
  if (!apiKey) return ''
  try {
    const res = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json', 'Prefer': 'wait' },
      body: JSON.stringify({ input: { prompt, go_fast: true, num_outputs: 1, aspect_ratio: '16:9', output_format: 'webp', output_quality: 80 } }),
    })
    const data = await res.json()
    return Array.isArray(data.output) ? data.output[0] : (data.output || '')
  } catch { return '' }
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('x-admin-password')
  if (auth !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { keyword, contentType, additionalContext, globalKeywords } = await req.json()
  if (!keyword) return NextResponse.json({ error: 'keyword required' }, { status: 400 })

  const [searchContext, author] = await Promise.all([
    searchWeb(keyword),
    getRandomAuthor(),
  ])

  const internalLinksCtx = 'CASINO PAGES:\n'
    + CASINO_LINKS.map(c => '[' + c.name + '](https://onlinemobileslots.com' + c.url + ')').join(', ')
    + '\n\nSLOT GAME PAGES:\n'
    + SLOT_LINKS.map(s => '[' + s.name + '](https://onlinemobileslots.com' + s.url + ')').join(', ')

  const keywordsCtx = globalKeywords && globalKeywords.length > 0
    ? '\n\nGLOBAL KEYWORDS - weave these naturally throughout the article: ' + globalKeywords.join(', ')
    : ''

  const systemPrompt = 'You are an SEO content writer for onlinemobileslots.com, a South African casino affiliate. Write for ZAR players (WCGRB licensed, NRGP responsible gambling). Direct, human tone — no puffery, no em dashes, no filler phrases.'
    + '\n\nAVAILABLE CATEGORIES: ' + CATEGORIES.join(', ')
    + '\n\nINTERNAL LINKS - include 3-5 naturally using markdown [Anchor Text](URL):\n' + internalLinksCtx
    + keywordsCtx
    + '\n\nRespond ONLY with valid JSON (no backticks, no preamble):\n{"title":"SEO headline under 70 chars","summary":"1-2 sentence teaser under 160 chars","categories":["from available list"],"imagePrompt":"vivid 16:9 banner, digital illustration, vibrant casino/gaming theme, no text","content":"full markdown article ## H2 ### H3 **bold** - bullets, 3-5 internal links, 600+ words. Never invent bonus amounts."}'
    + '\nContent type: ' + (contentType || 'news article')
    + (author ? '\nByline author: ' + author.name + ' (' + author.role + ')' : '')

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
    const [tiptapContent, imageUrl] = await Promise.all([
      Promise.resolve(textToTiptap(parsed.content)),
      parsed.imagePrompt ? generateImage(parsed.imagePrompt) : Promise.resolve(''),
    ])
    const slug = slugify(parsed.title)

    return NextResponse.json({
      title: parsed.title,
      summary: parsed.summary,
      categories: parsed.categories,
      slug,
      content: tiptapContent,
      contentMarkdown: parsed.content,
      imageUrl,
      imagePrompt: parsed.imagePrompt,
      authorId: author?.id || null,
      authorName: author?.name || null,
      authorRole: author?.role || null,
      tags,
    })
  } catch (e) {
    return NextResponse.json({ error: 'Generation failed: ' + String(e) }, { status: 500 })
  }
}
