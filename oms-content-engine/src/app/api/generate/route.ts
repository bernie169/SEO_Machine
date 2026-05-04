import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { textToTiptap, slugify } from '@/lib/tiptap'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const CATEGORIES = ['Industry News','Game Reviews','Bonuses & Promotions','Mobile & App Gaming','Responsible Gambling','Interviews & Opinions','Regulatory Updates','New Game Releases']

const CASINO_LINKS = [
  { name: 'Punt Casino', url: '/casinos/punt-casino', tag: 'punt-casino' },
  { name: 'Mzansibet', url: '/casinos/mzansibet', tag: 'mzansibet' },
  { name: 'Hollywoodbets Casino', url: '/casinos/hollywood-bets-casino', tag: 'hollywoodbets' },
  { name: 'Betway Casino', url: '/casinos/betway-casino', tag: 'betway' },
  { name: 'YesPlay Casino', url: '/casinos/yesplay-casino', tag: 'yesplay' },
  { name: 'Easybet Casino', url: '/casinos/easybet-casino', tag: 'easybet' },
  { name: 'Yebo Casino', url: '/casinos/yebo-casino', tag: 'yebo-casino' },
  { name: 'Lottostar Casino', url: '/casinos/lottostar-casino', tag: 'lottostar' },
  { name: 'Betshezi Casino', url: '/casinos/betshezi-casino', tag: 'betshezi' },
  { name: 'Play Live', url: '/casinos/play-live', tag: 'play-live' },
]

const SLOT_LINKS = [
  { name: 'Aviator', url: '/slots/aviator', tag: 'aviator' },
  { name: 'Gates of Olympus', url: '/slots/gates-of-olympus-1000', tag: 'gates-of-olympus' },
  { name: 'Sweet Bonanza', url: '/slots/sweet-bonanza', tag: 'sweet-bonanza' },
  { name: 'Big Bass Bonanza', url: '/slots/big-bass-bonanza', tag: 'big-bass-bonanza' },
  { name: 'Starburst', url: '/slots/starburst', tag: 'starburst' },
  { name: 'Book of Dead', url: '/slots/book-of-dead', tag: 'book-of-dead' },
  { name: 'Mega Moolah', url: '/slots/mega-moolah', tag: 'mega-moolah' },
  { name: 'Wolf Gold', url: '/slots/wolf-gold', tag: 'wolf-gold' },
  { name: 'Hot Hot Fruit', url: '/slots/hot-hot-fruit', tag: 'hot-hot-fruit' },
  { name: 'Reactoonz', url: '/slots/reactoonz', tag: 'reactoonz' },
  { name: 'Divine Fortune', url: '/slots/divine-fortune', tag: 'divine-fortune' },
  { name: 'Dead or Alive 2', url: '/slots/dead-or-alive-2', tag: 'dead-or-alive-2' },
  { name: 'Fire Joker', url: '/slots/fire-joker', tag: 'fire-joker' },
  { name: 'Rise of Olympus', url: '/slots/rise-of-olympus', tag: 'rise-of-olympus' },
  { name: 'Extra Chilli', url: '/slots/extra-chilli', tag: 'extra-chilli' },
]

function inferTags(text: string): string[] {
  const lower = text.toLowerCase()
  const tagSet: Record<string, boolean> = {}
  for (const c of CASINO_LINKS) {
    if (lower.includes(c.name.toLowerCase()) || lower.includes(c.tag)) tagSet[c.tag] = true
  }
  for (const s of SLOT_LINKS) {
    if (lower.includes(s.name.toLowerCase()) || lower.includes(s.tag)) tagSet[s.tag] = true
  }
  return Object.keys(tagSet)
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
      body: JSON.stringify({ api_key: apiKey, query: query + ' South Africa 2025', search_depth: 'advanced', max_results: 5 }),
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

  const casinoLinkStr = CASINO_LINKS.map(c => '[' + c.name + '](https://onlinemobileslots.com' + c.url + ')').join(', ')
  const slotLinkStr = SLOT_LINKS.map(s => '[' + s.name + '](https://onlinemobileslots.com' + s.url + ')').join(', ')

  const keywordsCtx = globalKeywords && globalKeywords.length > 0
    ? '\n\nGLOBAL KEYWORDS to weave naturally throughout: ' + globalKeywords.join(', ')
    : ''

  const systemPrompt = 'You are an SEO content writer for onlinemobileslots.com, a South African casino affiliate. Write for ZAR players (WCGRB licensed, NRGP). Direct, human tone. No puffery, no em dashes, no filler.'
    + '\n\nAVAILABLE CATEGORIES: ' + CATEGORIES.join(', ')
    + '\n\nINTERNAL LINKS - include 3-5 naturally using markdown [Anchor Text](URL):'
    + '\nCASINOS: ' + casinoLinkStr
    + '\nSLOTS: ' + slotLinkStr
    + keywordsCtx
    + '\n\nRespond ONLY with valid JSON (no backticks):'
    + '\n{ "title": "SEO headline under 70 chars", "summary": "1-2 sentence teaser under 160 chars", "categories": ["from available list"], "imagePrompt": "vivid 16:9 banner, digital illustration, vibrant casino/gaming theme, no text in image", "content": "full markdown ## H2 ### H3 **bold** - bullets, 3-5 internal links, 600+ words. Never invent bonus amounts." }'
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
      authorId: author ? author.id : null,
      authorName: author ? author.name : null,
      authorRole: author ? author.role : null,
      tags,
    })
  } catch (e) {
    return NextResponse.json({ error: 'Generation failed: ' + String(e) }, { status: 500 })
  }
}
