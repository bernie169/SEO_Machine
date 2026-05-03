# OMS Content Engine

AI-powered news article generator for onlinemobileslots.com.

## Stack
- Next.js 14 (App Router)
- Anthropic Claude (claude-sonnet-4-6) for generation
- Tavily for web search grounding
- Supabase (hotslotz project) for publishing

## Setup

### 1. Clone and install
```bash
git clone https://github.com/bernie169/oms-content-engine
cd oms-content-engine
npm install
```

### 2. Environment variables
Copy `.env.example` to `.env.local` and fill in:

```
SUPABASE_URL=https://shudxvgljacptrktvdvp.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ANTHROPIC_API_KEY=your_anthropic_api_key
TAVILY_API_KEY=your_tavily_api_key   # free at tavily.com
ADMIN_PASSWORD=choose_a_strong_password
```

### 3. Run locally
```bash
npm run dev
# Open http://localhost:3000
```

### 4. Deploy to Vercel
```bash
# Push to GitHub, then connect repo in Vercel dashboard
# Add all env vars in Vercel → Project → Settings → Environment Variables
```

## How it works

1. Enter a keyword/topic and content type
2. Claude searches the web via Tavily for current SA context
3. Claude generates: title, summary, slug, categories, full article body
4. You review and edit everything before publishing
5. Hit "Publish Live" — article goes straight to Supabase → live on site

## Content format
- Content is stored as TipTap JSON (ProseMirror) matching the existing hotslotz schema
- The editor shows markdown for easy editing; converted to TipTap on publish
- Supports ## H2, ### H3, **bold**, - bullet lists

## Workflow notes
- No draft/status field in the news table — articles go live on publish
- Always review before hitting Publish
- Image field is optional — leave blank if no image ready
