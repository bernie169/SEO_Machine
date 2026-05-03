'use client'

import { useState, useEffect } from 'react'
import styles from './page.module.css'

const CONTENT_TYPES = ['News Article','Industry Analysis','Game Review','Bonus Guide','How-To Guide','Trend Report']
const CATEGORIES = ['Industry News','Game Reviews','Bonuses & Promotions','Mobile & App Gaming','Responsible Gambling','Interviews & Opinions','Regulatory Updates','New Game Releases']
const CASINO_TAGS = ['Betway','YesPlay','Easybet','Hollywoodbets','Punt Casino','Yebo Casino','Mzansibet','Lottostar']
const GAME_TAGS = ['Aviator','Gates of Olympus','Sweet Bonanza','Big Bass Bonanza','Starburst','Book of Dead','Mega Moolah','Wolf Gold','Hot Hot Fruit','Reactoonz','Fire Joker','Divine Fortune']

type GeneratedArticle = {
  title: string; summary: string; slug: string; categories: string[]
  content: object; contentMarkdown: string; imageUrl: string; imagePrompt: string
  authorId: string; authorName: string; tags: string[]
}
type Step = 'input' | 'generating' | 'review' | 'publishing' | 'done'
type ActiveTab = 'generate' | 'settings' | 'ideas'

export default function Home() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [authError, setAuthError] = useState(false)
  const [activeTab, setActiveTab] = useState<ActiveTab>('generate')

  // Generate state
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
  const [editedTags, setEditedTags] = useState<string[]>([])
  const [error, setError] = useState('')
  const [publishedUrl, setPublishedUrl] = useState('')
  const [log, setLog] = useState<string[]>([])

  // Settings state - stored in memory (resets on refresh, edit cron route to persist)
  const [keywords, setKeywords] = useState<string[]>([])
  const [newKeyword, setNewKeyword] = useState('')
  const [ideas, setIdeas] = useState<string[]>([])
  const [newIdea, setNewIdea] = useState('')
  const [ideaIndex, setIdeaIndex] = useState(0)

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedKeywords = localStorage.getItem('oms_keywords')
      const savedIdeas = localStorage.getItem('oms_ideas')
      const savedIdeaIndex = localStorage.getItem('oms_idea_index')
      if (savedKeywords) setKeywords(JSON.parse(savedKeywords))
      if (savedIdeas) setIdeas(JSON.parse(savedIdeas))
      if (savedIdeaIndex) setIdeaIndex(parseInt(savedIdeaIndex))
    } catch {}
  }, [])

  const saveKeywords = (kws: string[]) => {
    setKeywords(kws)
    localStorage.setItem('oms_keywords', JSON.stringify(kws))
  }

  const saveIdeas = (ids: string[]) => {
    setIdeas(ids)
    localStorage.setItem('oms_ideas', JSON.stringify(ids))
  }

  const saveIdeaIndex = (idx: number) => {
    setIdeaIndex(idx)
    localStorage.setItem('oms_idea_index', String(idx))
  }

  const addLog = (msg: string) => setLog(prev => [...prev, '[' + new Date().toLocaleTimeString() + '] ' + msg])

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length > 3) { setAuthed(true); setAuthError(false) }
    else setAuthError(true)
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!keyword.trim()) return
    setStep('generating'); setError(''); setLog([])
    addLog('Starting: "' + keyword + '"')
    addLog('Searching web...')

    const keywordsCtx = keywords.length > 0 ? 'Include these keywords naturally: ' + keywords.join(', ') : ''

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify({ keyword, contentType, additionalContext: additionalContext + (keywordsCtx ? '\n' + keywordsCtx : '') }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      addLog('Generated: ' + data.title)
      addLog('Author: ' + data.authorName)
      addLog('Tags: ' + (data.tags || []).join(', '))
      addLog('Image: ' + (data.imageUrl ? 'Generated ✓' : 'Skipped'))
      setArticle(data)
      setEditedTitle(data.title); setEditedSummary(data.summary)
      setEditedSlug(data.slug); setEditedCategories(data.categories || [])
      setEditedMarkdown(data.contentMarkdown); setEditedTags(data.tags || [])
      setStep('review')
    } catch (err) {
      setError(String(err)); addLog('ERROR: ' + String(err)); setStep('input')
    }
  }

  const handlePublish = async () => {
    if (!article) return
    setStep('publishing'); addLog('Publishing...')
    try {
      const { textToTiptap } = await import('@/lib/tiptap')
      const freshContent = textToTiptap(editedMarkdown)
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify({
          title: editedTitle, slug: editedSlug, summary: editedSummary,
          categories: editedCategories, content: freshContent,
          image: article.imageUrl || '', authorId: article.authorId,
          tags: editedTags,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Publish failed')
      addLog('Published! Live at: /news/' + data.slug)
      setPublishedUrl('https://onlinemobileslots.com/news/' + data.slug)
      setStep('done')
    } catch (err) {
      setError(String(err)); addLog('ERROR: ' + String(err)); setStep('review')
    }
  }

  const handleReset = () => {
    setStep('input'); setArticle(null); setKeyword('')
    setAdditionalContext(''); setError(''); setLog([]); setPublishedUrl('')
  }

  const toggleCategory = (cat: string) =>
    setEditedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])

  const toggleTag = (tag: string) =>
    setEditedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])

  if (!authed) {
    return (
      <div className={styles.authWrap}>
        <div className={styles.authBox}>
          <div className={styles.logo}>OMS<span>///</span>ENGINE</div>
          <p className={styles.authSub}>Content Generation System</p>
          <form onSubmit={handleAuth} className={styles.authForm}>
            <input type="password" placeholder="Admin password" value={password}
              onChange={e => setPassword(e.target.value)} className={styles.input} autoFocus />
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
        <div className={styles.headerTabs}>
          <button className={styles.tabBtn + (activeTab === 'generate' ? ' ' + styles.tabActive : '')} onClick={() => setActiveTab('generate')}>GENERATE</button>
          <button className={styles.tabBtn + (activeTab === 'ideas' ? ' ' + styles.tabActive : '')} onClick={() => setActiveTab('ideas')}>IDEAS ({ideas.length})</button>
          <button className={styles.tabBtn + (activeTab === 'settings' ? ' ' + styles.tabActive : '')} onClick={() => setActiveTab('settings')}>SETTINGS</button>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.statusDot} data-active={step !== 'input'} />
          <span className={styles.statusText}>
            {step === 'input' && 'READY'}{step === 'generating' && 'GENERATING...'}
            {step === 'review' && 'AWAITING REVIEW'}{step === 'publishing' && 'PUBLISHING...'}{step === 'done' && 'PUBLISHED'}
          </span>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.leftPanel}>

          {/* ── SETTINGS TAB ── */}
          {activeTab === 'settings' && (
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>// GLOBAL KEYWORDS</h2>
              <p className={styles.hint}>↳ These keywords will be woven into every article naturally</p>
              <div className={styles.tagGrid} style={{marginTop:'8px'}}>
                {keywords.map(k => (
                  <button key={k} className={styles.catBtn} data-active="true"
                    onClick={() => saveKeywords(keywords.filter(x => x !== k))}>
                    {k} ×
                  </button>
                ))}
              </div>
              <div style={{display:'flex',gap:'8px',marginTop:'12px'}}>
                <input className={styles.input} value={newKeyword} onChange={e => setNewKeyword(e.target.value)}
                  placeholder="Add keyword (e.g. online slots South Africa)"
                  onKeyDown={e => { if (e.key === 'Enter' && newKeyword.trim()) { saveKeywords([...keywords, newKeyword.trim()]); setNewKeyword('') }}} />
                <button className={styles.btnSecondary} style={{flex:'0 0 auto',width:'80px'}}
                  onClick={() => { if (newKeyword.trim()) { saveKeywords([...keywords, newKeyword.trim()]); setNewKeyword('') }}}>ADD</button>
              </div>
            </section>
          )}

          {/* ── IDEAS TAB ── */}
          {activeTab === 'ideas' && (
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>// ARTICLE IDEAS</h2>
              <p className={styles.hint}>↳ Add topics/games. Daily cron cycles through these in order.</p>
              <p className={styles.hint} style={{color:'var(--accent)'}}>↳ Next up: {ideas.length > 0 ? ideas[ideaIndex % ideas.length] : 'No ideas yet'} (#{(ideaIndex % (ideas.length || 1)) + 1})</p>

              <div style={{display:'flex',flexDirection:'column',gap:'6px',marginTop:'12px'}}>
                {ideas.map((idea, i) => (
                  <div key={i} style={{display:'flex',alignItems:'center',gap:'8px',padding:'8px',background: i === ideaIndex % (ideas.length||1) ? 'var(--bg-2)' : 'transparent',border:'1px solid ' + (i === ideaIndex % (ideas.length||1) ? 'var(--accent)' : 'var(--border)')}}>
                    <span style={{color:'var(--accent)',fontSize:'10px',width:'20px'}}>{i+1}</span>
                    <span style={{flex:1,fontSize:'12px'}}>{idea}</span>
                    <button style={{background:'none',border:'none',color:'var(--text-dimmer)',cursor:'pointer'}}
                      onClick={() => { const next = ideas.filter((_,j) => j !== i); saveIdeas(next); if (ideaIndex >= next.length) saveIdeaIndex(0) }}>×</button>
                  </div>
                ))}
              </div>

              <div style={{display:'flex',gap:'8px',marginTop:'12px'}}>
                <input className={styles.input} value={newIdea} onChange={e => setNewIdea(e.target.value)}
                  placeholder="Add idea (e.g. Aviator, Big Bass Bonanza tips)"
                  onKeyDown={e => { if (e.key === 'Enter' && newIdea.trim()) { saveIdeas([...ideas, newIdea.trim()]); setNewIdea('') }}} />
                <button className={styles.btnSecondary} style={{flex:'0 0 auto',width:'80px'}}
                  onClick={() => { if (newIdea.trim()) { saveIdeas([...ideas, newIdea.trim()]); setNewIdea('') }}}>ADD</button>
              </div>

              {ideas.length > 0 && (
                <div style={{marginTop:'16px',paddingTop:'16px',borderTop:'1px solid var(--border)'}}>
                  <p className={styles.hint}>Generate from next idea:</p>
                  <button className={styles.btnPrimary} style={{marginTop:'8px'}} onClick={() => {
                    const idea = ideas[ideaIndex % ideas.length]
                    setKeyword(idea)
                    saveIdeaIndex((ideaIndex + 1) % ideas.length)
                    setActiveTab('generate')
                  }}>USE NEXT IDEA: {ideas[ideaIndex % ideas.length]} →</button>
                </div>
              )}
            </section>
          )}

          {/* ── GENERATE TAB ── */}
          {activeTab === 'generate' && (
            <>
              {(step === 'input' || step === 'generating') && (
                <section className={styles.card}>
                  <h2 className={styles.cardTitle}>// GENERATE ARTICLE</h2>
                  <form onSubmit={handleGenerate} className={styles.form}>
                    <label className={styles.label}>KEYWORD / TOPIC</label>
                    <input className={styles.input} value={keyword} onChange={e => setKeyword(e.target.value)}
                      placeholder="e.g. Aviator game tips South Africa 2025" disabled={step === 'generating'} required />
                    <label className={styles.label}>CONTENT TYPE</label>
                    <select className={styles.select} value={contentType} onChange={e => setContentType(e.target.value)} disabled={step === 'generating'}>
                      {CONTENT_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                    <label className={styles.label}>ADDITIONAL CONTEXT <span className={styles.optional}>(optional)</span></label>
                    <textarea className={styles.textarea} value={additionalContext} onChange={e => setAdditionalContext(e.target.value)}
                      placeholder="Specific angles, operators to mention..." rows={3} disabled={step === 'generating'} />
                    {keywords.length > 0 && <p className={styles.hint}>↳ {keywords.length} global keywords will be included</p>}
                    {error && <p className={styles.errorMsg}>{error}</p>}
                    <button type="submit" className={styles.btnPrimary} disabled={step === 'generating' || !keyword.trim()}>
                      {step === 'generating' ? 'GENERATING...' : 'GENERATE →'}
                    </button>
                  </form>
                </section>
              )}

              {(step === 'review' || step === 'publishing') && article && (
                <section className={styles.card}>
                  <h2 className={styles.cardTitle}>// REVIEW & EDIT</h2>

                  {article.imageUrl && (
                    <div style={{marginBottom:'12px'}}>
                      <label className={styles.label}>GENERATED IMAGE</label>
                      <img src={article.imageUrl} alt="Generated" style={{width:'100%',height:'160px',objectFit:'cover',border:'1px solid var(--border)',marginTop:'6px'}} />
                    </div>
                  )}

                  <label className={styles.label}>AUTHOR</label>
                  <p style={{fontSize:'12px',color:'var(--text-dim)',padding:'8px',background:'var(--bg-2)',border:'1px solid var(--border)'}}>{article.authorName}</p>

                  <label className={styles.label}>TITLE</label>
                  <input className={styles.input} value={editedTitle} onChange={e => setEditedTitle(e.target.value)} />

                  <label className={styles.label}>SLUG</label>
                  <input className={styles.input} value={editedSlug} onChange={e => setEditedSlug(e.target.value)} />
                  <p className={styles.hint}>↳ onlinemobileslots.com/news/{editedSlug}</p>

                  <label className={styles.label}>SUMMARY</label>
                  <textarea className={styles.textarea} value={editedSummary} onChange={e => setEditedSummary(e.target.value)} rows={2} />

                  <label className={styles.label}>CATEGORIES</label>
                  <div className={styles.catGrid}>
                    {CATEGORIES.map(cat => (
                      <button key={cat} type="button" className={styles.catBtn}
                        data-active={editedCategories.includes(cat)} onClick={() => toggleCategory(cat)}>{cat}</button>
                    ))}
                  </div>

                  <label className={styles.label}>CASINO TAGS</label>
                  <div className={styles.catGrid}>
                    {CASINO_TAGS.map(tag => (
                      <button key={tag} type="button" className={styles.catBtn}
                        data-active={editedTags.includes(tag)} onClick={() => toggleTag(tag)}>{tag}</button>
                    ))}
                  </div>

                  <label className={styles.label}>GAME TAGS</label>
                  <div className={styles.catGrid}>
                    {GAME_TAGS.map(tag => (
                      <button key={tag} type="button" className={styles.catBtn}
                        data-active={editedTags.includes(tag)} onClick={() => toggleTag(tag)}>{tag}</button>
                    ))}
                  </div>

                  <label className={styles.label}>CONTENT (MARKDOWN)</label>
                  <textarea className={styles.contentEditor} value={editedMarkdown} onChange={e => setEditedMarkdown(e.target.value)} rows={25} spellCheck />

                  {error && <p className={styles.errorMsg}>{error}</p>}
                  <div className={styles.btnRow}>
                    <button className={styles.btnSecondary} onClick={handleReset}>← START OVER</button>
                    <button className={styles.btnPrimary} onClick={handlePublish} disabled={step === 'publishing'}>
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
                    <a href={publishedUrl} target="_blank" rel="noopener noreferrer" className={styles.doneLink}>{publishedUrl}</a>
                    <button className={styles.btnPrimary} onClick={handleReset}>GENERATE ANOTHER →</button>
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        {/* Right panel */}
        <div className={styles.rightPanel}>
          <section className={styles.logCard}>
            <h2 className={styles.cardTitle}>// ACTIVITY LOG</h2>
            <div className={styles.log}>
              {log.length === 0 && <p className={styles.logEmpty}>Waiting...</p>}
              {log.map((line, i) => <div key={i} className={styles.logLine}>{line}</div>)}
            </div>
          </section>

          {article && step !== 'input' && (
            <section className={styles.previewCard}>
Add Settings + Ideas tabs, author/tags display, image preview              <div className={styles.preview}>
                {article.imageUrl && <img src={article.imageUrl} alt="" style={{width:'100%',height:'140px',objectFit:'cover',marginBottom:'12px'}} />}
                <h1 className={styles.previewTitle}>{editedTitle}</h1>
                <p className={styles.previewMeta}>{editedCategories.join(' · ')}</p>
                <p className={styles.previewMeta} style={{color:'var(--text-dimmer)'}}>{article.authorName}</p>
                <p className={styles.previewSummary}>{editedSummary}</p>
                <hr className={styles.previewDivider} />
                <div className={styles.previewContent}>
                  {editedMarkdown.split('\n').map((line, i) => {
                    if (line.startsWith('## ')) return <h2 key={i} className={styles.previewH2}>{line.slice(3)}</h2>
                    if (line.startsWith('### ')) return <h3 key={i} className={styles.previewH3}>{line.slice(4)}</h3>
                    if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className={styles.previewLi}>{line.slice(2)}</li>
                    if (line.trim() === '') return <br key={i} />
                    return <p key={i} className={styles.previewP}>{line.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')}</p>
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
