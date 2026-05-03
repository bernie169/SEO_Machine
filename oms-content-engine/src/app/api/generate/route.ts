import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { textToTiptap, slugify } from '@/lib/tiptap'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const CATEGORIES = [
  'Industry News',
  'Game Reviews',
  'Bonuses & Promotions',
  'Mobile & App Gaming',
  'Responsible Gambling',
  'Interviews & Opinions',
  'Regulatory Updates',
  'New Game Releases',
]

async function searchWeb(query: string): Promise<string> {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) return 'No search results available - Tavily API key not configured.'

  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query: query + ' South Africa 2025',
        search_depth: 'advanced',
        max_results: 5,
        include_answer: true,
      }),
    })
    const data = await res.json()
    const results = data.results || []
    return results
      .map((r: { title: string; content: string; url: string }) =>
        `SOURCE: ${r.title}\nURL: ${r.url}\nCONTENT: ${r.content}`
      )
      .join('\n\n---\n\n')
  } catch (e) {
    console.error('Tavily search failed:', e)
    return 'Search unavailable.'
  }
}

export async function POST(req: NextRequest) {
  // Auth check
  const auth = req.headers.get('x-admin-password')
  if (auth !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { keyword, contentType, additionalContext } = await req.json()
  if (!keyword) return NextResponse.json({ error: 'keyword required' }, { status: 400 })

  // 1. Search the web
  const searchContext = await searchWeb(keyword)

  // 2. Generate with Claude
  const systemPrompt = `You are an SEO content writer for onlinemobileslots.com, a South African online casino and slots affiliate site. You write for ZAR players, referencing South African gambling context (WCGRB, NRGP, rand amounts). Your writing is direct, informative, and human - no AI puffery, no em dashes, no "rule of three" lists, no filler phrases like "in conclusion" or "it's worth noting".

Available categories: ${CATEGORIES.join(', ')}

You MUST respond with ONLY a valid JSON object - no markdown, no backticks, no preamble. The JSON must have exactly these fields:
{
  "title": "string - compelling SEO headline under 70 chars",
  "summary": "string - 1-2 sentence teaser for the article listing page, under 160 chars",
  "categories": ["array", "of", "category", "strings", "from", "the", "available", "list"],
  "content": "string - full article body in markdown with ## H2 and ### H3 headings, **bold** for emphasis, - for bullet lists. Minimum 600 words."
}

Rules:
- Never invent bonus amounts, wagering requirements, or specific figures unless confirmed in search results
- Always mention NRGP (National Responsible Gambling Programme) where relevant  
- Write for South African players - use Rand, reference SA operators where relevant
- Content type: ${contentType || 'news article'}`

  const userPrompt = `Write a ${contentType || 'news article'} about: "${keyword}"

${additionalContext ? `Additional context: ${additionalContext}\n\n` : ''}Web research results:
${searchContext}

Generate the article now. Respond ONLY with the JSON object.`

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt,
    })

    const rawText = message.content[0].type === 'text' ? message.content[0].text : ''

    // Parse JSON response
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)

    // Convert markdown content to TipTap JSON
    const tiptapContent = textToTiptap(parsed.content)
    const slug = slugify(parsed.title)

    return NextResponse.json({
      title: parsed.title,
      summary: parsed.summary,
      categories: parsed.categories,
      slug,
      content: tiptapContent,
      contentMarkdown: parsed.content, // for preview
    })
  } catch (e) {
    console.error('Generation error:', e)
    return NextResponse.json({ error: 'Generation failed: ' + String(e) }, { status: 500 })
  }
}
