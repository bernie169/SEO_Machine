import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { textToTiptap, slugify } from '@/lib/tiptap'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const CATEGORIES = ['Industry News','Game Reviews','Bonuses & Promotions','Mobile & App Gaming','Responsible Gambling','Interviews & Opinions','Regulatory Updates','New Game Releases']

const CASINO_LINKS = [
  { name: 'Punt Casino', url: '/casinos/punt-casino' },
  { name: 'Mzansibet', url: '/casinos/mzansibet' },
  { name: 'Hollywoodbets Casino', url: '/casinos/hollywood-bets-casino' },
  { name: 'Betway Casino', url: '/casinos/betway-casino' },
  { name: 'YesPlay Casino', url: '/casinos/yesplay-casino' },
  { name: 'Easybet Casino', url: '/casinos/easybet-casino' },
  { name: 'Yebo Casino', url: '/casinos/yebo-casino' },
  { name: 'Lottostar Casino', url: '/casinos/lottostar-casino' },
]

const SLOT_LINKS = [
  { name: 'Aviator', url: '/slots/aviator' },
  { name: 'Gates of Olympus', url: '/slots/gates-of-olympus-1000' },
  { name: 'Sweet Bonanza', url: '/slots/sweet-bonanza' },
  { name: 'Big Bass Bonanza', url: '/slots/big-bass-bonanza' },
  { name: 'Starburst', url: '/slots/starburst' },
  { name: 'Book of Dead', url: '/slots/book-of-dead' },
  { name: 'Mega Moolah', url: '/slots/mega-moolah' },
  { name: 'Wolf Gold', url: '/slots/wolf-gold' },
  { name: 'Hot Hot Fruit', url: '/slots/hot-hot-fruit' },
  { name: 'Reactoonz', url: '/slots/reactoonz' },
  { name: 'Divine Fortune', url: '/slots/divine-fortune' },
  { name: 'Dead or Alive 2', url: '/slots/dead-or-alive-2' },
  { name: 'Fire Joker', url: '/slots/fire-joker' },
  { name: 'Rise of Olympus', url: '/slots/rise-of-olympus' },
  { name: 'Extra Chilli', url: '/slots/extra-chilli' },
]

async function searchWeb(query: string): Promise<string> {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) return 'No search results available.'
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
Add image gen (Replicate/Flux), internal links to all casino+slot pages      body: JSON.stringify({ api_key: apiKey, query: query + ' South Africa 2025', search_depth: 'advanced', max_results: 5, include_answer: true }),
    })
    const data = await res.json()
    return (data.results || []).map((r: { title: string; content: string; url: string }) =>
      'SOURCE: ' + r.title + '\nURL: ' + r.url + '\nCONTENT: ' + r.content
    ).join('\n\n---\n\n')
  } catch (e) { return 'Search unavailable.' }
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
  } catch (e) { return '' }
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('x-admin-password')
  if (auth !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { keyword, contentType, additionalContext } = await req.json()
  if (!keyword) return NextResponse.json({ error: 'keyword required' }, { status: 400 })

  const searchContext = await searchWeb(keyword)

  const internalLinksCtx = 'CASINO PAGES (link when mentioning these casinos):\n'
    + CASINO_LINKS.map(c => '[' + c.name + '](https://onlinemobileslots.com' + c.url + ')').join(', ')
    + '\n\nSLOT GAME PAGES (link when mentioning these games):\n'
    + SLOT_LINKS.map(s => '[' + s.name + '](https://onlinemobileslots.com' + s.url + ')').join(', ')

  const systemPrompt = 'You are an SEO content writer for onlinemobileslots.com, a South African casino affiliate. Write for ZAR players. Direct, human, no puffery, no em dashes.\n\nAVAILABLE CATEGORIES: ' + CATEGORIES.join(', ') + '\n\nINTERNAL LINKS - include 3-5 naturally in the article using markdown [Anchor Text](URL) format:\n' + internalLinksCtx + '\n\nRespond ONLY with valid JSON:\n{\n  "title": "SEO headline under 70 chars",\n  "summary": "1-2 sentence teaser under 160 chars",\n  "categories": ["array from available categories"],\n  "imagePrompt": "vivid 16:9 banner prompt, digital illustration, vibrant casino/gaming theme, no text in image",\n  "content": "full article markdown with ## H2, ### H3, **bold**, - bullets, 3-5 internal links, 600+ words"\n}\n\nRules: never invent bonus amounts, always mention NRGP where relevant, write for SA players using Rand.\nContent type: ' + (contentType || 'news article')

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: 'Write a ' + (contentType || 'news article') + ' about: "' + keyword + '"' + (additionalContext ? '\n\nAdditional context: ' + additionalContext : '') + '\n\nWeb research:\n' + searchContext + '\n\nRespond ONLY with JSON.' }],
    })

    const rawText = message.content[0].type === 'text' ? message.content[0].text : ''
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)

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
    })
  } catch (e) {
    return NextResponse.json({ error: 'Generation failed: ' + String(e) }, { status: 500 })
  }
}
