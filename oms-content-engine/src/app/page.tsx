'use client'
import { useState, useEffect } from 'react'

const CATS = ['Industry News','Game Reviews','Bonuses & Promotions','Mobile & App Gaming','Responsible Gambling','Interviews & Opinions','Regulatory Updates','New Game Releases']
const TYPES = ['News Article','Game Review','Bonus Guide','How-To Guide','Top List','Opinion Piece']
const PW = 'omsadmin2025'

export default function Page() {
  const [auth, setAuth] = useState(false)
  const [pw, setPw] = useState('')
  const [tab, setTab] = useState<'gen'|'ideas'|'settings'>('gen')
  const [keyword, setKeyword] = useState('')
  const [ctype, setCtype] = useState('News Article')
  const [loading, setLoading] = useState(false)
  const [res, setRes] = useState<any>(null)
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [slug, setSlug] = useState('')
  const [body, setBody] = useState('')
  const [cats, setCats] = useState<string[]>([])
  const [pub, setPub] = useState(false)
  const [pubbing, setPubbing] = useState(false)
  const [err, setErr] = useState('')
  const [ideas, setIdeas] = useState<string[]>([])
  const [ideaIn, setIdeaIn] = useState('')
  const [ideaIdx, setIdeaIdx] = useState(0)
  const [kws, setKws] = useState<string[]>([])
  const [kwIn, setKwIn] = useState('')

  useEffect(() => {
    try {
      const a = localStorage.getItem('oms_auth'); if (a==='1') setAuth(true)
      const i = localStorage.getItem('oms_ideas'); if (i) setIdeas(JSON.parse(i))
      const x = localStorage.getItem('oms_idx'); if (x) setIdeaIdx(parseInt(x))
      const k = localStorage.getItem('oms_kws'); if (k) setKws(JSON.parse(k))
    } catch {}
  }, [])

  function login() {
    if (pw === PW) { setAuth(true); localStorage.setItem('oms_auth','1') }
    else setErr('Wrong password')
  }
  function addIdea() {
    if (!ideaIn.trim()) return
    const u = [...ideas, ideaIn.trim()]; setIdeas(u)
    localStorage.setItem('oms_ideas', JSON.stringify(u)); setIdeaIn('')
  }
  function delIdea(i: number) {
    const u = ideas.filter((_,n) => n!==i); setIdeas(u)
    localStorage.setItem('oms_ideas', JSON.stringify(u))
  }
  function nextIdea() {
    if (!ideas.length) return
    setKeyword(ideas[ideaIdx % ideas.length])
    const n = (ideaIdx+1) % ideas.length; setIdeaIdx(n)
    localStorage.setItem('oms_idx', String(n)); setTab('gen')
  }
  function addKw() {
    if (!kwIn.trim()) return
    const u = [...kws, kwIn.trim()]; setKws(u)
    localStorage.setItem('oms_kws', JSON.stringify(u)); setKwIn('')
  }
  function delKw(i: number) {
    const u = kws.filter((_,n) => n!==i); setKws(u)
    localStorage.setItem('oms_kws', JSON.stringify(u))
  }
  async function generate() {
    if (!keyword) return
    setLoading(true); setErr(''); setRes(null); setPub(false)
    try {
      const r = await fetch('/api/generate', {
        method: 'POST',
        headers: {'Content-Type':'application/json','x-admin-password': PW},
        body: JSON.stringify({keyword, contentType: ctype, globalKeywords: kws}),
      })
      const d = await r.json()
      if (d.error) { setErr(d.error); return }
      setRes(d); setTitle(d.title); setSummary(d.summary)
      setSlug(d.slug); setBody(d.contentMarkdown||''); setCats(d.categories||[])
    } catch(e) { setErr(String(e)) } finally { setLoading(false) }
  }
  async function publish() {
    if (!res) return
    setPubbing(true)
    try {
      const r = await fetch('/api/publish', {
        method: 'POST',
        headers: {'Content-Type':'application/json','x-admin-password': PW},
        body: JSON.stringify({
          title, slug, summary, categories: cats,
          content: res.content, image: res.imageUrl||'',
          authorId: res.authorId||null, tags: res.tags||[],
        }),
      })
      const d = await r.json()
      if (d.error) { setErr(d.error); return }
      setPub(true)
    } catch(e) { setErr(String(e)) } finally { setPubbing(false) }
  }

  const G = '#22c55e', BG = '#0a0a0a', CARD = '#111', DIM = '#666', TXT = '#e5e5e5'
  const inp: React.CSSProperties = {width:'100%',background:CARD,border:'1px solid #333',color:TXT,padding:'10px 14px',borderRadius:6,fontSize:14,boxSizing:'border-box'}
  const btn: React.CSSProperties = {background:G,color:'#fff',border:'none',borderRadius:6,padding:'10px 20px',fontSize:13,fontWeight:600,cursor:'pointer'}
  const card: React.CSSProperties = {background:CARD,border:'1px solid #1e1e1e',borderRadius:8,padding:20,marginBottom:16}
  const tag: React.CSSProperties = {background:'#1a1a1a',border:'1px solid #2a2a2a',borderRadius:4,padding:'3px 10px',fontSize:11,color:'#888',display:'inline-flex',alignItems:'center',gap:6}
  const lbl: React.CSSProperties = {fontSize:11,letterSpacing:'0.1em',color:DIM,display:'block',marginBottom:6,textTransform:'uppercase'}
  const tabS = (a: boolean): React.CSSProperties => ({background:a?G:'transparent',border:'1px solid '+(a?G:'#333'),color:a?'#fff':'#888',padding:'6px 16px',fontSize:11,borderRadius:4,cursor:'pointer'})

  if (!auth) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:BG}}>
      <div style={{background:CARD,border:'1px solid #222',borderRadius:8,padding:40,width:340}}>
        <div style={{fontSize:18,fontWeight:700,color:'#fff',marginBottom:24}}>OMS CONTENT ENGINE</div>
        <input value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==='Enter'&&login()} type="password" placeholder="Password" style={{...inp,marginBottom:12}} />
        <button onClick={login} style={{...btn,width:'100%',padding:10}}>Login</button>
        {err && <div style={{color:'#ef4444',marginTop:8,fontSize:13}}>{err}</div>}
      </div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:BG,color:TXT,fontFamily:'system-ui,sans-serif'}}>
      <div style={{background:CARD,borderBottom:'1px solid #222',padding:'12px 24px',display:'flex',alignItems:'center'}}>
        <span style={{fontSize:14,fontWeight:700,color:G}}>OMS CONTENT ENGINE</span>
        <div style={{display:'flex',gap:4,marginLeft:'auto'}}>
          <button onClick={()=>setTab('gen')} style={tabS(tab==='gen')}>GENERATE</button>
          <button onClick={()=>setTab('ideas')} style={tabS(tab==='ideas')}>IDEAS</button>
          <button onClick={()=>setTab('settings')} style={tabS(tab==='settings')}>SETTINGS</button>
        </div>
      </div>
      <div style={{maxWidth:900,margin:'0 auto',padding:'32px 24px'}}>

        {tab==='gen' && (
          <div>
            <div style={card}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
                <div>
                  <label style={lbl}>Keyword / Topic</label>
                  <input style={inp} value={keyword} onChange={e=>setKeyword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&generate()} placeholder="e.g. Best slots South Africa 2025" />
                </div>
                <div>
                  <label style={lbl}>Content Type</label>
                  <select style={{...inp,background:CARD}} value={ctype} onChange={e=>setCtype(e.target.value)}>
                    {TYPES.map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              {kws.length>0 && <div style={{marginBottom:12}}>
                <div style={lbl}>Global Keywords Active</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:6}}>{kws.map((k,i)=><span key={i} style={tag}>{k}</span>)}</div>
              </div>}
              {ideas.length>0 && <div style={{marginBottom:12}}>
                <button onClick={nextIdea} style={{...btn,background:'transparent',border:'1px solid '+G,color:G,fontSize:11,padding:'6px 14px'}}>
                  USE NEXT IDEA: {ideas[ideaIdx%ideas.length]}
                </button>
              </div>}
              <button onClick={generate} disabled={loading||!keyword} style={{...btn,opacity:loading||!keyword?0.5:1}}>
                {loading?'GENERATING...':'GENERATE ARTICLE'}
              </button>
              {err && <div style={{color:'#ef4444',marginTop:12,fontSize:13}}>{err}</div>}
            </div>
            {res && (
              <div>
                {res.imageUrl && <div style={{...card,padding:0,overflow:'hidden'}}>
                  <img src={res.imageUrl} alt="Banner" style={{width:'100%',display:'block',maxHeight:300,objectFit:'cover'}} />
                  <div style={{padding:'8px 12px',fontSize:11,color:'#444'}}>AI-generated 16:9 banner — saved as article image</div>
                </div>}
                <div style={card}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                    <div style={{fontSize:13,fontWeight:600,color:'#aaa',textTransform:'uppercase'}}>Review & Edit</div>
                    {res.authorName && <div style={{fontSize:12,color:DIM}}>By <span style={{color:G}}>{res.authorName}</span> · {res.authorRole}</div>}
                  </div>
                  <div style={{marginBottom:12}}><label style={lbl}>Title</label><input style={inp} value={title} onChange={e=>setTitle(e.target.value)} /></div>
                  <div style={{marginBottom:12}}><label style={lbl}>Slug</label><input style={inp} value={slug} onChange={e=>setSlug(e.target.value)} /></div>
                  <div style={{marginBottom:12}}><label style={lbl}>Summary</label><input style={inp} value={summary} onChange={e=>setSummary(e.target.value)} /></div>
                  <div style={{marginBottom:12}}>
                    <label style={lbl}>Categories</label>
                    <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                      {CATS.map(c=>(
                        <label key={c} style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer',fontSize:12,color:cats.includes(c)?G:DIM}}>
                          <input type="checkbox" checked={cats.includes(c)} onChange={e=>setCats(e.target.checked?[...cats,c]:cats.filter(x=>x!==c))} style={{accentColor:G}} />
                          {c}
                        </label>
                      ))}
                    </div>
                  </div>
                  {res.tags && res.tags.length>0 && <div style={{marginBottom:12}}>
                    <label style={lbl}>Auto-Tags (from article content)</label>
                    <div style={{display:'flex',flexWrap:'wrap',gap:6}}>{res.tags.map((t:string,i:number)=><span key={i} style={tag}>{t}</span>)}</div>
                  </div>}
                  <div style={{marginBottom:16}}>
                    <label style={lbl}>Content (Markdown)</label>
                    <textarea style={{...inp,height:280,resize:'vertical',fontFamily:'monospace',fontSize:12}} value={body} onChange={e=>setBody(e.target.value)} />
                  </div>
                  {pub
                    ? <div style={{color:G,fontWeight:600}}>Published at onlinemobileslots.com/news/{slug}</div>
                    : <button onClick={publish} disabled={pubbing} style={{...btn,background:'#2563eb',opacity:pubbing?0.5:1}}>{pubbing?'PUBLISHING...':'PUBLISH LIVE'}</button>}
                </div>
              </div>
            )}
          </div>
        )}

        {tab==='ideas' && (
          <div style={card}>
            <div style={{fontSize:13,fontWeight:600,color:'#aaa',textTransform:'uppercase',marginBottom:8}}>Article Ideas Queue</div>
            <p style={{fontSize:13,color:DIM,marginBottom:16}}>Add topics — the daily cron picks the next one each day and generates a fresh SEO article.</p>
            <div style={{display:'flex',gap:8,marginBottom:20}}>
              <input style={{...inp,flex:1}} value={ideaIn} onChange={e=>setIdeaIn(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addIdea()} placeholder="e.g. Aviator, Sweet Bonanza, Easybet bonuses..." />
              <button onClick={addIdea} style={btn}>ADD</button>
            </div>
            {ideas.length===0
              ? <div style={{color:'#444',textAlign:'center',padding:32}}>No ideas yet.</div>
              : ideas.map((idea,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',background:i===ideaIdx%ideas.length?'#0d2218':'#0d0d0d',border:'1px solid '+(i===ideaIdx%ideas.length?'#22c55e33':'#1a1a1a'),borderRadius:6,marginBottom:6}}>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <span style={{fontSize:11,color:'#444',minWidth:24}}>#{i+1}</span>
                    <span style={{fontSize:13,color:i===ideaIdx%ideas.length?G:'#ccc'}}>{idea}</span>
                    {i===ideaIdx%ideas.length && <span style={{fontSize:10,color:G,background:'#0a3322',padding:'2px 6px',borderRadius:3}}>NEXT</span>}
                  </div>
                  <div style={{display:'flex',gap:8}}>
                    <button onClick={()=>{setKeyword(idea);setTab('gen')}} style={{background:'#1a1a1a',border:'1px solid #333',color:'#888',borderRadius:4,padding:'4px 10px',fontSize:11,cursor:'pointer'}}>USE NOW</button>
                    <button onClick={()=>delIdea(i)} style={{background:'transparent',border:'1px solid #ef4444',color:'#ef4444',borderRadius:4,padding:'4px 10px',fontSize:11,cursor:'pointer'}}>X</button>
                  </div>
                </div>
              ))}
          </div>
        )}

        {tab==='settings' && (
          <div style={card}>
            <div style={{fontSize:13,fontWeight:600,color:'#aaa',textTransform:'uppercase',marginBottom:8}}>Global Keywords</div>
            <p style={{fontSize:13,color:DIM,marginBottom:16}}>Injected into every article prompt so Claude weaves them naturally throughout all content.</p>
            <div style={{display:'flex',gap:8,marginBottom:20}}>
              <input style={{...inp,flex:1}} value={kwIn} onChange={e=>setKwIn(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addKw()} placeholder="e.g. online casino South Africa, best slots ZAR..." />
              <button onClick={addKw} style={btn}>ADD</button>
            </div>
            {kws.length===0
              ? <div style={{color:'#444',textAlign:'center',padding:32}}>No global keywords yet.</div>
              : <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                  {kws.map((k,i)=>(
                    <div key={i} style={{...tag,padding:'6px 12px'}}>
                      <span>{k}</span>
                      <button onClick={()=>delKw(i)} style={{background:'none',border:'none',color:'#ef4444',cursor:'pointer',padding:0,fontSize:12,marginLeft:4}}>X</button>
                    </div>
                  ))}
                </div>}
          </div>
        )}

      </div>
    </div>
  )
}
