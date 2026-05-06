'use client'

import { useState, useRef } from 'react'
import styles from './page.module.css'

const CONTENT_TYPES = [
  'News Article',
  'Industry Analysis',
  'Game Review',
  'Bonus Guide',
  'How-To Guide',
  'Trend Report',
]

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

type GeneratedArticle = {
  title: string
  summary: string
  slug: string
  categories: string[]
  content: object
  contentMarkdown: string
  image: string
}

type Step = 'input' | 'generating' | 'review' | 'publishing' | 'done'

export default function Home() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [authError, setAuthError] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [contentType, setContentType] = useState('News Article')
  const [additionalContext, setAdditionalContext] = useState('')
  const [step, setStep] = useState<Step>('input')
  const [article, setArticle] = useState<GeneratedArticle | null>(null)
  const [editedTitle, setEditedTitle] = useState('')
  const [editedSummary, setEditedSummary] = useState('')
  const [editedSlug, setEditedSlug] = useState('')
  const [editedCategories, setEditedCategories] = useState<string[]>([])
  const [editedMarkdown, setEditedMarkdown] = useState('')
  const [imageFile, setImageFile] = useState('')
  const [error, setError] = useState('')
  const [publishedUrl, setPublishedUrl] = useState('')
  const logRef = useRef<HTMLDivElement>(null)
  const [log, setLog] = useState<string[]>([])

  const addLog = (msg: string) => {
    setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`])
  }

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length > 3) {
      setAuthed(true)
      setAuthError(false)
    } else {
      setAuthError(true)
    }
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!keyword.trim()) return
    setStep('generating')
    setError('')
    setLog([])
    addLog(`Starting generation for: "${keyword}"`)
    addLog(`Content type: ${contentType}`)
    addLog('Searching the web with Tavily...')
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({ keyword, contentType, additionalContext }),
      })
      addLog('Web search complete. Sending to Claude...')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      addLog('Claude generation complete.')
      addLog(`Title: ${data.title}`)
      addLog(`Categories: ${data.categories?.join(', ')}`)
      addLog(`Slug: ${data.slug}`)
      if (data.image) {
        addLog('Image generated via Replicate ✓')
      } else {
        addLog('No image generated (check REPLICATE_API_TOKEN env var)')
      }
      addLog('Ready for review.')
      setArticle(data)
      setEditedTitle(data.title)
      setEditedSummary(data.summary)
      setEditedSlug(data.slug)
      setEditedCategories(data.categories || [])
      setEditedMarkdown(data.contentMarkdown)
      setImageFile(data.image || '')  // ← wire image URL from generate response
      setStep('review')
    } catch (err) {
      setError(String(err))
      addLog('ERROR: ' + String(err))
      setStep('input')
    }
  }

  const handlePublish = async () => {
    if (!article) return
    setStep('publishing')
    addLog('Publishing to Supabase...')
    try {
      const { textToTiptap } = await import('@/lib/tiptap')
      const freshContent = textToTiptap(editedMarkdown)
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({
          title: editedTitle,
          slug: editedSlug,
          summary: editedSummary,
          categories: editedCategories,
          content: freshContent,
          image: imageFile,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Publish failed')
      addLog('Published successfully!')
      addLog(`Live at: https://onlinemobileslots.com/news/${data.slug}`)
      setPublishedUrl(`https://onlinemobileslots.com/news/${data.slug}`)
      setStep('done')
    } catch (err) {
      setError(String(err))
      addLog('PUBLISH ERROR: ' + String(err))
      setStep('review')
    }
  }

  const handleReset = () => {
    setStep('input')
    setArticle(null)
    setKeyword('')
    setAdditionalContext('')
    setError('')
    setLog([])
    setPublishedUrl('')
    setImageFile('')
  }

  const toggleCategory = (cat: string) => {
    setEditedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }

  if (!authed) {
    return (
      <div className={styles.authWrap}>
        <div className={styles.authBox}>
          <div className={styles.logo}>OMS<span>///</span>ENGINE</div>
          <p className={styles.authSub}>Content Generation System</p>
          <form onSubmit={handleAuth} className={styles.authForm}>
            <input
              type="password"
              placeholder="Admin password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={styles.input}
              autoFocus
            />
            {authError && <p className={styles.errorMsg}>Invalid password</p>}
            <button type="submit" className={styles.btnPrimary}>AUTHENTICATE →</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.logo}>OMS<span>///</span>ENGINE</span>
          <span className={styles.headerSub}>onlinemobileslots.com</span>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.statusDot} data-active={step !== 'input'} />
          <span className={styles.statusText}>
            {step === 'input' && 'READY'}
            {step === 'generating' && 'GENERATING...'}
            {step === 'review' && 'AWAITING REVIEW'}
            {step === 'publishing' && 'PUBLISHING...'}
            {step === 'done' && 'PUBLISHED'}
          </span>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.leftPanel}>
          {(step === 'input' || step === 'generating') && (
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>// GENERATE ARTICLE</h2>
              <form onSubmit={handleGenerate} className={styles.form}>
                <label className={styles.label}>KEYWORD / TOPIC</label>
                <input
                  className={styles.input}
                  type="text"
                  value={keyword}
                  onChange={e => setKeyword(e.target.value)}
                  placeholder="e.g. Aviator game tips South Africa 2025"
                  disabled={step === 'generating'}
                  required
                />
                <label className={styles.label}>CONTENT TYPE</label>
                <select
                  className={styles.select}
                  value={contentType}
                  onChange={e => setContentType(e.target.value)}
                  disabled={step === 'generating'}
                >
                  {CONTENT_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
                <label className={styles.label}>ADDITIONAL CONTEXT <span className={styles.optional}>(optional)</span></label>
                <textarea
                  className={styles.textarea}
                  value={additionalContext}
                  onChange={e => setAdditionalContext(e.target.value)}
                  placeholder="Any specific angles, operators to mention, facts to include..."
                  rows={3}
                  disabled={step === 'generating'}
                />
                {error && <p className={styles.errorMsg}>{error}</p>}
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={step === 'generating' || !keyword.trim()}
                >
                  {step === 'generating' ? 'GENERATING...' : 'GENERATE →'}
                </button>
              </form>
            </section>
          )}

          {(step === 'review' || step === 'publishing') && article && (
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>// REVIEW & EDIT</h2>
              <label className={styles.label}>TITLE</label>
              <input className={styles.input} value={editedTitle} onChange={e => setEditedTitle(e.target.value)} />
              <label className={styles.label}>SLUG</label>
              <input className={styles.input} value={editedSlug} onChange={e => setEditedSlug(e.target.value)} />
              <p className={styles.hint}>↳ onlinemobileslots.com/news/{editedSlug}</p>
              <label className={styles.label}>SUMMARY</label>
              <textarea className={styles.textarea} value={editedSummary} onChange={e => setEditedSummary(e.target.value)} rows={2} />

              <label className={styles.label}>IMAGE URL</label>
              {imageFile && imageFile.startsWith('http') && (
                <img
                  src={imageFile}
                  alt="Generated article image"
                  style={{ width: '100%', borderRadius: '6px', marginBottom: '8px', maxHeight: '200px', objectFit: 'cover' }}
                />
              )}
              <input
                className={styles.input}
                value={imageFile}
                onChange={e => setImageFile(e.target.value)}
                placeholder="Auto-generated or paste a URL"
              />
              {!imageFile && (
                <p className={styles.hint}>⚠ No image generated. Add REPLICATE_API_TOKEN to Vercel env vars to enable auto-generation.</p>
              )}

              <label className={styles.label}>CATEGORIES</label>
              <div className={styles.catGrid}>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    className={styles.catBtn}
                    data-active={editedCategories.includes(cat)}
                    onClick={() => toggleCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <label className={styles.label}>CONTENT (MARKDOWN)</label>
              <textarea
                className={styles.contentEditor}
                value={editedMarkdown}
                onChange={e => setEditedMarkdown(e.target.value)}
                rows={25}
                spellCheck
              />
              {error && <p className={styles.errorMsg}>{error}</p>}
              <div className={styles.btnRow}>
                <button className={styles.btnSecondary} onClick={handleReset}>← START OVER</button>
                <button
                  className={styles.btnPrimary}
                  onClick={handlePublish}
                  disabled={step === 'publishing'}
                >
                  {step === 'publishing' ? 'PUBLISHING...' : 'PUBLISH LIVE →'}
                </button>
              </div>
            </section>
          )}

          {step === 'done' && (
            <section className={styles.card}>
              <div className={styles.doneBox}>
                <div className={styles.doneIcon}>✓</div>
                <h2 className={styles.doneTitle}>PUBLISHED</h2>
                <a href={publishedUrl} target="_blank" rel="noopener noreferrer" className={styles.doneLink}>
                  {publishedUrl}
                </a>
                <button className={styles.btnPrimary} onClick={handleReset}>GENERATE ANOTHER →</button>
              </div>
            </section>
          )}
        </div>

        <div className={styles.rightPanel}>
          <section className={styles.logCard}>
            <h2 className={styles.cardTitle}>// ACTIVITY LOG</h2>
            <div className={styles.log} ref={logRef}>
              {log.length === 0 && (
                <p className={styles.logEmpty}>Waiting for generation to start...</p>
              )}
              {log.map((line, i) => (
                <div key={i} className={styles.logLine}>{line}</div>
              ))}
            </div>
          </section>

          {article && step !== 'input' && (
            <section className={styles.previewCard}>
              <h2 className={styles.cardTitle}>// PREVIEW</h2>
              <div className={styles.preview}>
                {imageFile && imageFile.startsWith('http') && (
                  <img
                    src={imageFile}
                    alt={editedTitle}
                    style={{ width: '100%', borderRadius: '6px', marginBottom: '12px', maxHeight: '180px', objectFit: 'cover' }}
                  />
                )}
                <h1 className={styles.previewTitle}>{editedTitle}</h1>
                <p className={styles.previewMeta}>
                  {editedCategories.join(' · ')} &nbsp;|&nbsp; {editedSlug}
                </p>
                <p className={styles.previewSummary}>{editedSummary}</p>
                <hr className={styles.previewDivider} />
                <div className={styles.previewContent}>
                  {editedMarkdown.split('\n').map((line, i) => {
                    if (line.startsWith('## ')) return <h2 key={i} className={styles.previewH2}>{line.slice(3)}</h2>
                    if (line.startsWith('### ')) return <h3 key={i} className={styles.previewH3}>{line.slice(4)}</h3>
                    if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className={styles.previewLi}>{line.slice(2)}</li>
                    if (line.trim() === '') return <br key={i} />
                    return <p key={i} className={styles.previewP}>{line.replace(/\*\*(.*?)\*\*/g, '$1')}</p>
                  })}
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  )
}
