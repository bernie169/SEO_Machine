import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { textToTiptap, slugify } from '@/lib/tiptap'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const DAILY_TOPICS = [
  'Best online slots South Africa this week',
  'Top casino bonuses South Africa',
  'Aviator game tips South Africa',
  'New online casino games South Africa',
  'Mobile casino South Africa guide',
  'Online slots winning strategies South Africa',
  'South Africa online gambling trends',
  'Best slot RTP South Africa',
  'Live casino South Africa guide',
  'Online casino deposit methods South Africa',
  'Gates of Olympus South Africa tips',
  'South Africa online casino regulations 2025',
  'Best jackpot slots South Africa',
  'How to play online slots South Africa beginners',
  'South Africa casino responsible gambling guide',
  'Sweet Bonanza South Africa tips',
  'Online casino withdrawal methods South Africa',
  'South Africa casino apps review',
  'Big Bass Bonanza South Africa guide',
  'New slot releases South Africa',
  'South Africa online casino welcome bonuses',
  'Crash games South Africa guide',
  'Book of Dead slot South Africa',
  'South Africa online gambling safety tips',
  'Best online casinos South Africa ranked',
  'Mega Moolah jackpot South Africa',
  'Free spins bonuses South Africa',
  'Wolf Gold slot South Africa review',
  'Hot Hot Fruit slot South Africa',
  'South Africa casino loyalty programs',
]

const CASINO_LINKS = [
  { name: 'Betway Casino', url: '/casinos/betway-casino', tags: ['betway'] },
  { name: 'YesPlay Casino', url: '/casinos/yesplay-casino', tags: ['yesplay'] },
  { name: 'Easybet Casino', url: '/casinos/easybet-casino', tags: ['easybet'] },
  { name: 'Hollywoodbets Casino', url: '/casinos/hollywood-bets-casino', tags: ['hollywoodbets'] },
  { name: 'Punt Casino', url: '/casinos/punt-casino', tags: ['punt-casino'] },
  { name: 'Yebo Casino', url: '/casinos/yebo-casino', tags: ['yebo-casino'] },
]

const SLOT_LINKS = [
  { name: 'Aviator', url: '/slots/aviator', tags: ['aviator'] },
  { name: 'Gates of Olympus', url: '/slots/gates-of-olympus-1000', tags: ['gates-of-olympus'] },
  { name: 'Sweet Bonanza', url: '/slots/sweet-bonanza', tags: ['sweet-bonanza'] },
  { name: 'Big Bass Bonanza', url: '/slots/big-bass-bonanza', tags: ['big-bass-bonanza'] },
  { name: 'Book of Dead', url: '/slots/book-of-dead', tags: ['book-of-dead'] },
  { name: 'Mega Moolah', url: '/slots/mega-moolah', tags: ['mega-moolah'] },
  { name: 'Wolf Gold', url: '/slots/wolf-gold', tags: ['wolf-gold'] },
  { name: 'Hot Hot Fruit', url: '/slots/hot-hot-fruit', tags: ['hot-hot-fruit'] },
  { name: 'Starburst', url: '/slots/starburst', tags: ['starburst'] },
  { name: 'Fire Joker', url: '/slots/fire-joker', tags: ['fire-joker'] },
]

function inferTags(text: string): string[] {
  const lower = text.toLowerCase()
  const tags: string[] = []
  for (const c of CASINO_LINKS) {
    if (lower.includes(c.name.toLowerCase()) || c.tags.some(t => lower.includes(t))) tags.push(...c.tags)
  }
  for (const s of SLOT_LINKS) {
    if (lower.includes(s.name.toLowerCase()) || s.tags.some(t => lower.includes(t))) tags.push(...s.tags)
  }
  return [...new Set(tags)]
}

async function getRandomAuthor(supabase: ReturnType<typeof createClient>) {
  try {
    const { data } = await supabase.from('authors').select('id, name, role')
    if (!data || data.length === 0) return null
    return data[Math.floor(Math.random() * data.length)]
  } catch { return null }
}

async function searchWeb(query: string): Promise<string> {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) return ''
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey, query: query + ' South Africa 2025', search_depth: 'basic', max_results: 3 }),
    })
    const data = await res.json()
    return (data.results || []).map((r: { title: string; content: string }) => r.title + ': ' + r.content).join('\n\n')
  } catch { return '' }
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

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== 'Bearer ' + process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
  const keyword = DAILY_TOPICS[dayOfYear % DAILY_TOPICS.length]

  const internalLinks = 'CASINOS: ' + CASINO_LINKS.map(c => '[' + c.name + '](https://onlinemobileslots.com' + c.url + ')').join(', ')
    + '\nSLOTS: ' + SLOT_LINKS.map(s => '[' + s.name + '](https://onlinemobileslots.com' + s.url + ')').join(', ')

  const author = await getRandomAuthor(supabase)

  const systemPrompt = 'You are an SEO writer for onlinemobileslots.com, a South African casino affiliate. Write direct, human content for ZAR players. No puffery, no em dashes.\n\nInternal links to include naturally (3-5):\n' + internalLinks
    + '\n\nRespond ONLY with valid JSON: { "title": "under 70 chars", "summary": "under 160 chars", "categories": ["array"], "imagePrompt": "vivid 16:9 banner, digital illustration, casino theme, no text", "content": "markdown article, ## H2, ### H3, **bold**, 3-5 internal links, 600+ words" }'
    + (author ? '\nByline: ' + author.name : '')

  const searchContext = await searchWeb(keyword)

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      system: systemPrompt,
      messages: [{ role: 'user', content: 'Write a news article about: "' + keyword + '"\n\nWeb research:\n' + searchContext + '\n\nRespond ONLY with JSON.' }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    const parsed = JSON.parse(raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())

    const tags = inferTags(parsed.content + ' ' + parsed.title + ' ' + keyword)
    const imageUrl = parsed.imagePrompt ? await generateImage(parsed.imagePrompt) : ''
    const tiptapContent = textToTiptap(parsed.content)
    const slug = slugify(parsed.title)

    const insertData: Record<string, unknown> = {
      title: parsed.title,
      slug,
      summary: parsed.summary,
      categories: parsed.categories,
      content: tiptapContent,
      image: imageUrl,
      tags,
      created_at: new Date().toISOString(),
    }
    if (author) insertData.author_id = author.id

    const { error } = await supabase.from('news').insert(insertData)
    if (error) throw new Error(error.message)

    return NextResponse.json({ success: true, keyword, title: parsed.title, slug, imageGenerated: !!imageUrl, author: author?.name })
  } catch (e) {
    console.error('Cron error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
