            <p style={{fontSize:13,color:dim,marginBottom:16}}>Add topics — the daily cron cycles through in order, generating a creative article for each.</p>
            <div style={{display:'flex',gap:8,marginBottom:20}}>
              <input style={{...inp,flex:1}} value={ideaInput} onChange={e=>setIdeaInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addIdea()} placeholder="e.g. Aviator, Sweet Bonanza, Easybet bonuses..." />
              <button onClick={addIdea} style={btn}>ADD</button>
            </div>
            {ideas.length===0
              ? <div style={{color:'#444',textAlign:'center',padding:32}}>No ideas yet. Add some above.</div>
              : ideas.map((idea,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',background:i===ideaIndex%ideas.length?'#0d2218':'#0d0d0d',border:'1px solid '+(i===ideaIndex%ideas.length?'#22c55e22':'#1a1a1a'),borderRadius:6,marginBottom:6}}>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <span style={{fontSize:11,color:'#444',minWidth:24}}>#{i+1}</span>
                    <span style={{fontSize:13,color:i===ideaIndex%ideas.length?green:'#ccc'}}>{idea}</span>
                    {i===ideaIndex%ideas.length && <span style={{fontSize:10,color:green,background:'#0a3322',padding:'2px 6px',borderRadius:3}}>NEXT</span>}
                  </div>
                  <div style={{display:,gap:8}}>'flex'
                    <button onClick={()=>{setKeyword(idea);setTab('generate')}} style={{background:'#1a1a1a',border:'1px solid #333',color:'#888',borderRadius:4,padding:'4px 10px',fontSize:11,cursor:'pointer'}}>USE NOW</button>
                    <button onClick={()=>removeIdea(i)} style={{background:'transparent',border:'1px solid #ef4444',color:'#ef4444',borderRadius:4,padding:'4px 10px',fontSize:11,cursor:'pointer'}}>✕</button>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {tab==='settings' && (
          <div style={cardS}>
            <div style={{fontSize:13,fontWeight:600,color:'#aaa',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:8}}>Global Keywords</div>
            <p style={{fontSize:13,color:dim,marginBottom:16}}>Injected into every article prompt — Claude weaves them naturally throughout all content.</p>
            <div style={{display:'flex',gap:8,marginBottom:20}}>
              <input style={{...inp,flex:1}} value={kwInput} onChange={e=>setKwInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addKeyword()} placeholder="e.g. online casino South Africa, best slots..." />
F                        </div>
            {keywords.length===0
              ? <div style={{color:'#444',textAlign:'center',padding:32}}>No global keywords yet.</div>
              : <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                {keywords.map((k,i)=>(
                  <div key={i} style={{...tagS,padding:'6px 12px'}}>
                    <span>{k}</span>
                    <button onClick={()=>removeKeyword(i)} style={{background:'none',border:'none',color:'#ef4444',cursor:'pointer',padding:0,fontSize:12,marginLeft:4}}>✕</button>
                  </div>
                ))}
              </div>
            }
          </div>
        )}

      </div>
    </div>
  )
}import { useState, useEffect } from 'react'

const CATEGORIES = ['Industry News','Game Reviews','Bonuses & Promotions','Mobile & App Gaming','Responsible Gambling','Interviews & Opinions','Regulatory Updates','New Game Releases']
const CONTENT_TYPES = ['News Article','Game Review','Bonus Guide','How-To Guide','Top List','Opinion Piece']

export default function AdminPage() {
  const [auth, setAuth] = useState(false)
  const [pw, setPw] = useState('')
  const [tab, setTab] = useState('generate')
  const [keyword, setKeyword] = useState('')
  const [contentType, setContentType] = useState('News Article')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editSummary, setEditSummary] = useState('')
  const [editSlug, setEditSlug] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editCategories, setEditCategories] = useState([])
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState(false)
  const [error, setError] = useState('')
  const [ideas, setIdeas] = useState([])
  const [ideaInput, setIdeaInput] = useState('')
  const [ideaIndex, setIdeaIndex] = useState(0)
  const [keywords, setKeywords] = useState([])
  const [kwInput, setKwInput] = useState('')

  useEffect(() => {
    try {
      const si = localStorage.getItem('oms_ideas'); if (si) setIdeas(JSON.parse(si))
      const sx = localStorage.getItem('oms_idea_index'); if (sx) setIdeaIndex(parseInt(sx))
      const sk = localStorage.getItem('oms_keywords'); if (sk) setKeywords(JSON.parse(sk))
      const sa = localStorage.getItem('oms_auth'); if (sa === '1') setAuth(true)
    } catch(e) {}
  }, [])
'use client'
import { useState, useEffect } from 'react'

const CATEGORIES = ['Industry News','Game Reviews','Bonuses & Promotions','Mobile & App Gaming','Responsible Gambling','Interviews & Opinions','Regulatory Updates','New Game Releases']
const CONTENT_TYPES = ['News Article','Game Review','Bonus Guide','How-To Guide','Top List','Opinion Piece']

export default function AdminPage() {
  const [auth, setAuth] = useState(false)
  const [pw, setPw] = useState('')
  const [tab, setTab] = useState('generate')
  const [keyword, setKeyword] = useState('')
  const [contentType, setContentType] = useState('News Article')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editSummary, setEditSummary] = useState('')
  const [editSlug, setEditSlug] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editCategories, setEditCategories] = useState([])
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState(false)
  const [error, setError] = useState('')
  const [ideas, setIdeas] = useState([])
  const [ideaInput, setIdeaInput] = useState('')
  const [ideaIndex, setIdeaIndex] = useState(0)
  const [keywords, setKeywords] = useState([])
  const [kwInput, setKwInput] = useState('')

  useEffect(() => {
    try {
      const si = localStorage.getItem('oms_ideas'); if (si) setIdeas(JSON.parse(si))
      const sx = localStorage.getItem('oms_idea_index'); if (sx) setIdeaIndex(parseInt(sx))
      const sk = localStorage.getItem('oms_keywords'); if (sk) setKeywords(JSON.parse(sk))
      const sa = localStorage.getItem('oms_auth'); if (sa === '1') setAuth(true)
    } catch(e) {}
  }, [])

  function login() {
    if (pw === 'omsadmin2025') { setAuth(true); localStorage.setItem('oms_auth','1') }
    else setError('Wrong password')
  }
  function addIdea() {
    if (!ideaInput.trim()) return
    const u = [...ideas, ideaInput.trim()]; setIdeas(u)
    localStorage.setItem('oms_ideas', JSON.stringify(u)); setIdeaInput('')
  }
  function removeIdea(i) {
    const u = ideas.filter((_,idx) => idx !== i); setIdeas(u)
    localStorage.setItem('oms_ideas', JSON.stringify(u))
  }
  function useNextIdea() {
    if (ideas.length === 0) return
    setKeyword(ideas[ideaIndex % ideas.length])
    const n = (ideaIndex + 1) % ideas.length; setIdeaIndex(n)
    localStorage.setItem('oms_idea_index', String(n)); setTab('generate')
  }
  function addKeyword() {
    if (!kwInput.trim()) return
    const u = [...keywords, kwInput.trim()]; setKeywords(u)
    localStorage.setItem('oms_keywords', JSON.stringify(u)); setKwInput('')
  }
  function removeKeyword(i) {
    const u = keywords.filter((_,idx) => idx !== i); setKeywords(u)
    localStorage.setItem('oms_keywords', JSON.stringify(u))
  }
  async function generate() {
    setLoading(true); setError(''); setResult(null); setPublished(false)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: {'Content-Type':'application/json','x-admin-password':'omsadmin2025'},
        body: JSON.stringify({keyword, contentType, globalKeywords: keywords}),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      setResult(data); setEditTitle(data.title); setEditSummary(data.summary)
      setEditSlug(data.slug); setEditContent(data.contentMarkdown || ''); setEditCategories(data.categories || [])
    } catch(e) { setError(String(e)) } finally { setLoading(false) }
  }
  async function publish() {
    if (!result) return; setPublishing(true)
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: {'Content-Type':'application/json','x-admin-password':'omsadmin2025'},
        body: JSON.stringify({
          title: editTitle, slug: editSlug, summary: editSummary,
          categories: editCategories, content: result.content,
          image: result.imageUrl || '', authorId: result.authorId || null, tags: result.tags || [],
        }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      setPublished(true)
    } catch(e) { setError(String(e)) } finally { setPublishing(false) }
  }

  const bg='#0a0a0a',card='#111',border='#1e1e1e',green='#22c55e',text='#e5e5e5',dim='#666'
  const inp = {width:'100%',background:card,border:'1px solid #333',color:text,padding:'10px 14px',borderRadius:6,fontSize:14,boxSizing:'border-box' as const}
  const btn = {background:green,color:'#fff',border:'none',borderRadius:6,padding:'10px 20px',fontSize:13,fontWeight:600,cursor:'pointer'}
  const cardS = {background:card,border:'1px solid '+border,borderRadius:8,padding:20,marginBottom:16}
  const tagS = {background:'#1a1a1a',border:'1px solid #2a2a2a',borderRadius:4,padding:'3px 10px',fontSize:11,color:'#888',display:'inline-flex' as const,alignItems:'center',gap:6}
  const tabBtn = (active:boolean) => ({background:active?green:'transparent',border:'1px solid '+(active?green:'#333'),color:active?'#fff':'#888',padding:'6px 16px',fontSize:11,letterSpacing:'0.08em',borderRadius:4,cursor:'pointer'})
  const lbl = {fontSize:11,letterSpacing:'0.1em',color:dim,display:'block' as const,marginBottom:6,textTransform:'uppercase' as const}

  if (!auth) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:bg}}>
      <div style={{background:card,border:'1px solid #222',borderRadius:8,padding:40,width:340}}>
        <div style={{fontSize:18,fontWeight:700,color:'#fff',marginBottom:24,letterSpacing:'0.05em'}}>OMS CONTENT ENGINE</div>
        <input value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==='Enter'&&login()} type="password" placeholder="Password" style={{...inp,marginBottom:12}} />
        <button onClick={login} style={{...btn,width:'100%',padding:10}}>Login</button>
        {error && <div style={{color:'#ef4444',marginTop:8,fontSize:13}}>{error}</div>}
      </div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:bg,color:text,fontFamily:'system-ui,sans-serif'}}>
      <div style={{background:card,borderBottom:'1px solid #222',padding:'12px 24px',display:'flex',alignItems:'center',gap:16}}>
        <span style={{fontSize:14,fontWeight:700,letterSpacing:'0.1em',color:green}}>OMS CONTENT ENGINE</span>
        <div style={{display:'flex',gap:4,marginLeft:'auto'}}>
          {(['generate','ideas','settings'] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={tabBtn(tab===t)}>{t.toUpperCase()}</button>
          ))}
        </div>
      </div>

      <div style={{maxWidth:900,margin:'0 auto',padding:'32px 24px'}}>

        {tab==='generate' && (
          <div>
            <div style={cardS}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
                <div>
                  <label style={lbl}>Keyword / Topic</label>
                  <input style={inp} value={keyword} onChange={e=>setKeyword(e.target.value)} placeholder="e.g. Best slots South Africa 2025" onKeyDown={e=>e.key==='Enter'&&generate()} />
                </div>
                <div>
                  <label style={lbl}>Content Type</label>
                  <select style={{...inp,background:card}} value={contentType} onChange={e=>setContentType(e.target.value)}>
                    {CONTENT_TYPES.map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              {keywords.length>0 && <div style={{marginBottom:12}}>
                <div style={lbl}>Global Keywords Active</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:6}}>{keywords.map((k,i)=><span key={i} style={tagS}>{k}</span>)}</div>
              </div>}
              {ideas.length>0 && <div style={{marginBottom:12}}>
                <button onClick={useNextIdea} style={{...btn,background:'transparent',border:'1px solid '+green,color:green,fontSize:11,padding:'6px 14px'}}>
                  USE NEXT IDEA: {ideas[ideaIndex%ideas.length]}
                </button>
              </div>}
              <button onClick={generate} disabled={loading||!keyword} style={{...btn,opacity:loading||!keyword?0.5:1}}>
                {loading?'GENERATING...':'GENERATE ARTICLE'}
              </button>
              {error && <div style={{color:'#ef4444',marginTop:12,fontSize:13}}>{error}</div>}
            </div>

            {result && (
              <div>
                {result.imageUrl && (
                  <div style={{...cardS,padding:0,overflow:'hidden'}}>
                    <img src={result.imageUrl} alt="Generated banner" style={{width:'100%',display:'block',maxHeight:300,objectFit:'cover'}} />
                    <div style={{padding:'8px 12px',fontSize:11,color:'#555'}}>AI generated 16:9 banner — saves automatically as article image</div>
                  </div>
                )}
                <div style={cardS}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                    <div style={{fontSize:13,fontWeight:600,color:'#aaa',letterSpacing:'0.08em',textTransform:'uppercase'}}>Review & Edit</div>
                    {result.authorName && <div style={{fontSize:12,color:dim}}>By <span style={{color:green}}>{result.authorName}</span> · <span style={{color:'#555'}}>{result.authorRole}</span></div>}
                  </div>
                  <div style={{marginBottom:12}}>
                    <label style={lbl}>Title</label>
                    <input style={inp} value={editTitle} onChange={e=>setEditTitle(e.target.value)} />
                  </div>
                  <div style={{marginBottom:12}}>
                    <label style={lbl}>Slug</label>
                    <input style={inp} value={editSlug} onChange={e=>setEditSlug(e.target.value)} />
                  </div>
                  <div style={{marginBottom:12}}>
                    <label style={lbl}>Summary</label>
                    <input style={inp} value={editSummary} onChange={e=>setEditSummary(e.target.value)} />
                  </div>
                  <div style={{marginBottom:12}}>
                    <label style={lbl}>Categories</label>
                    <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                      {CATEGORIES.map(c=>(
                        <label key={c} style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer',fontSize:12,color:editCategories.includes(c)?green:dim}}>
                          <input type="checkbox" checked={editCategories.includes(c)} onChange={e=>setEditCategories(e.target.checked?[...editCategories,c]:editCategories.filter(x=>x!==c))} style={{accentColor:green}} />
                          {c}
                        </label>
                      ))}
                    </div>
                  </div>
                  {result.tags && result.tags.length>0 && (
                    <div style={{marginBottom:12}}>
                      <label style={lbl}>Auto-Tags (detected from article content)</label>
                      <div style={{display:'flex',flexWrap:'wrap',gap:6}}>{result.tags.map((t:string,i:number)=><span key={i} style={tagS}>{t}</span>)}</div>
                    </div>
                  )}
                  <div style={{marginBottom:16}}>
                    <label style={lbl}>Content (Markdown)</label>
                    <textarea style={{...inp,height:280,resize:'vertical',fontFamily:'monospace',fontSize:12}} value={editContent} onChange={e=>setEditContent(e.target.value)} />
                  </div>
                  {published
                    ? <div style={{color:green,fontWeight:600}}>Published at onlinemobileslots.com/news/{editSlug}</div>
                    : <button onClick={publish} disabled={publishing} style={{...btn,background:'#2563eb',opacity:publishing?0.5:1}}>{publishing?'PUBLISHING...':'PUBLISH LIVE'}</button>
                  }
                </div>
              </div>
            )}
          </div>
        )}

        {tab==='ideas' && (
          <div style={cardS}>
            <div style={{fontSize:13,fontWeight:600,color:'#aaa',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:8}}>Article Ideas Queue</div>
