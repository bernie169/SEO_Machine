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
  'Big Bass Bonanza South Africa guide',
  'New slot releases South Africa',
  'Mega Moolah jackpot South Africa',
  'Wolf Gold slot South Africa',
  'Hot Hot Fruit slot South Africa',
  'South Africa casino loyalty programs',
  'Free spins no deposit South Africa',
  'Book of Dead slot South Africa tips',
]

const CASINOS = [
  { name: 'Betway Casino', url: '/casinos/betway-casino', tag: 'betway' },
  { name: 'YesPlay Casino', url: '/casinos/yesplay-casino', tag: 'yesplay' },
  { name: 'Easybet Casino', url: '/casinos/easybet-casino', tag: 'easybet' },
  { name: 'Hollywoodbets Casino', url: '/casinos/hollywood-bets-casino', tag: 'hollywoodbets' },
  { name: 'Punt Casino', url: '/casinos/punt-casino', tag: 'punt-casino' },
  { name: 'Yebo Casino', url: '/casinos/yebo-casino', tag: 'yebo-casino' },
]

const SLOTS = [
  { name: 'Aviator', url: '/slots/aviator', tag: 'aviator' },
  { name: 'Gates of Olympus', url: '/slots/gates-of-olympus-1000', tag: 'gates-of-olympus' },
  { name: 'Sweet Bonanza', url: '/slots/sweet-bonanza', tag: 'sweet-bonanza' },
  { name: 'Big Bass Bonanza', url: '/slots/big-bass-bonanza', tag: 'big-bass-bonanza' },
  { name: 'Book of Dead', url: '/slots/book-of-dead', tag: 'book-of-dead' },
  { name: 'Mega Moolah', url: '/slots/mega-moolah', tag: 'mega-moolah' },
  { name: 'Wolf Gold', url: '/slots/wolf-gold', tag: 'wolf-gold' },
  { name: 'Hot Hot Fruit', url: '/slots/hot-hot-fruit', tag: 'hot-hot-fruit' },
]

function inferTags(text: string): string[] {
  const lower = text.toLowerCase()
  const seen: Record<string, boolean> = {}
  const tags: string[] = []
  for (const c of CASINOS) {
    if (lower.includes(c.name.toLowerCase()) || lower.includes(c.tag)) {
      if (!seen[c.tag]) { seen[c.tag] = true; tags.push(c.tag) }
    }
  }
  for (const s of SLOTS) {
    if (lower.includes(s.name.toLowerCase()) || lower.includes(s.tag)) {
      if (!seen[s.tag]) { seen[s.tag] = true; tags.push(s.tag) }
    }
  }
  return tags
}

async function getAuthor(supabase: ReturnType<typeof createClient>) {
  try {
    const { data } = await supabase.from('authors').select('id, name, role')
    if (!data || !data.length) return null
    const r = data[Math.floor(Math.random() * data.length)]
    return { id: String(r.id), name: String(r.name), role: String(r.role) }
  } catch { return null }
}

async function search(query: string): Promise<string> {
  const key = process.env.TAVILY_API_KEY
  if (!key) return ''
  try {
    const r = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: key, query: query + ' South Africa 2025', search_depth: 'basic', max_results: 3 }),
    })
    const d = await r.json()
    return (d.results || []).map((x: { title: string; content: string }) => x.title + ': ' + x.content).join('\n\n')
  } catch { return '' }
}

async function genImage(prompt: string): Promise<string> {
  const key = process.env.REPLICATE_API_KEY
  if (!key) return ''
  try {
    const r = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json', 'Prefer': 'wait' },
      body: JSON.stringify({ input: { prompt, go_fast: true, num_outputs: 1, aspect_ratio: '16:9', output_format: 'webp', output_quality: 80 } }),
    })
    const d = await r.json()
    return Array.isArray(d.output) ? String(d.output[0]) : String(d.output || '')
  } catch { return '' }
}

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const author = await getAuthor(supabase)

  const day = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
  const keyword = DAILY_TOPICS[day % DAILY_TOPICS.length]

  const links = 'CASINOS: ' + CASINOS.map(c => '[' + c.name + '](https://onlinemobileslots.com' + c.url + ')').join(', ')
    + '\nSLOTS: ' + SLOTS.map(s => '[' + s.name + '](https://onlinemobileslots.com' + s.url + ')').join(', ')

  const system = 'SEO writer for onlinemobileslots.com, South African casino affiliate. Direct, human, ZAR players. No puffery.\n\nLinks to include (3-5):\n' + links
    + '\n\nJSON only: { "title": "string", "summary": "string", "categories": ["array"], "imagePrompt": "string", "content": "markdown 600+ words" }'
    + (author ? '\nByline: ' + author.name : '')

  const ctx = await search(keyword)

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      system,
      messages: [{ role: 'user', content: 'Article about: "' + keyword + '"\n\n' + ctx + '\n\nJSON only.' }],
    })

    const raw = msg.content[0].type === 'text' ? msg.content[0].text : ''
    const parsed = JSON.parse(raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())
    const tags = inferTags(parsed.content + ' ' + keyword)
    const imageUrl = parsed.imagePrompt ? await genImage(parsed.imagePrompt) : ''
    const slug = slugify(parsed.title)
    const content = textToTiptap(parsed.content)

    const row: Record<string, unknown> = {
      title: parsed.title, slug, summary: parsed.summary,
      categories: parsed.categories, content, image: imageUrl,
      tags, created_at: new Date().toISOString(),
    }
    if (author) row.author_id = author.id

    const { error } = await supabase.from('news').insert(row)
    if (error) throw new Error(error.message)

    return NextResponse.json({ success: true, keyword, title: parsed.title, slug, author: author?.name })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
