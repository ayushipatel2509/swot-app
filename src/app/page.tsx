'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { ChevronDown, X, Loader, Download, RotateCcw, BookmarkPlus, Bookmark, ArrowUp, Maximize2 } from 'lucide-react'

const PRODUCTS = ['Electric Cars','Coffee Brand','Fitness App','FinTech App','Smart Home','EdTech Platform','Healthcare App','E-commerce Store','Restaurant Chain','Fashion Brand','SaaS Tool','Real Estate']
const OBJECTIVES = ['Increase Awareness','Increase Consideration','Increase Sales','Improve Retention','Drive Referrals','Enter a New Market','Launch a New Product']
const SEGMENTS = [
  {id:'genz',label:'Gen Z Creators',desc:'Ages 18–26, content-first'},
  {id:'climate',label:'Urban Climate Advocates',desc:'Eco-conscious millennials'},
  {id:'smb',label:'Cost-Sensitive SMB Owners',desc:'Small business, budget-driven'},
  {id:'diy',label:'Retired DIYers',desc:'Ages 60+, project-oriented'},
  {id:'enterprise',label:'Enterprise IT Leaders',desc:'CTOs, VPs, ROI-focused'},
  {id:'parents',label:'Millennial Parents',desc:'Ages 28–40, family-first'},
  {id:'remote',label:'Remote Workers',desc:'Location-independent'},
  {id:'health',label:'Health-Conscious Boomers',desc:'Ages 55+, wellness-oriented'},
]
const ANALYSES = [
  {key:'okrs',         label:'Marketing OKRs',         desc:'3 measurable OKRs'},
  {key:'strengths',    label:'Strengths',               desc:'What resonates most'},
  {key:'weaknesses',   label:'Weaknesses',              desc:'Concerns and friction'},
  {key:'opportunities',label:'Opportunities',           desc:'Growth angles'},
  {key:'threats',      label:'Threats',                 desc:'Adoption blockers'},
  {key:'positioning',  label:'Market Positioning',      desc:'How to position'},
  {key:'persona',      label:'Buyer Persona',           desc:'Real customer portrait'},
  {key:'investment',   label:'Investment Opportunity',  desc:'Strategic value'},
  {key:'channels',     label:'Channels & Distribution', desc:'How to reach them'},
]
const QUICK_QS = [
  'What price would they accept?',
  'Write 3 ad headlines',
  'What makes them switch?',
  'Best seasonal moment?',
  'Partnership idea?',
]

interface Result { content:string; confidence:number; ts:number }
interface ChatMsg { id:string; role:'user'|'assistant'; text:string }
type Results = Record<string,Result>
type LoadMap = Record<string,boolean>
const rk=(s:string,p:string)=>`${s}__${p}`
const uid=()=>Math.random().toString(36).slice(2,9)

function ConfBar({score}:{score:number}){
  return (
    <div style={{display:'flex',alignItems:'center',gap:6}}>
      <div style={{flex:1,height:2,background:'var(--bg4)',borderRadius:1,overflow:'hidden'}}>
        <div style={{width:`${score}%`,height:'100%',background:'var(--accent)',borderRadius:1,transition:'width .5s ease'}}/>
      </div>
      <span style={{fontSize:10,color:'var(--accent)',fontWeight:600,minWidth:26}}>{score}%</span>
    </div>
  )
}

function Modal({result,analysis,segment,onClose}:{result:Result;analysis:typeof ANALYSES[0];segment:typeof SEGMENTS[0];onClose:()=>void}){
  useEffect(()=>{const h=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose()};window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h)},[onClose])
  return (
    <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div className="modal-box">
        <div style={{padding:'18px 20px 14px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,position:'sticky',top:0,background:'var(--bg2)'}}>
          <div>
            <p style={{fontSize:18,fontWeight:700,color:'var(--ink)',marginBottom:3}}>{analysis.label}</p>
            <p style={{fontSize:12,color:'var(--ink3)'}}>{segment.label}</p>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'var(--ink3)',padding:4,flexShrink:0,marginTop:2}}><X size={16}/></button>
        </div>
        <div style={{padding:'18px 20px 22px'}}>
          <div className="md"><ReactMarkdown>{result.content}</ReactMarkdown></div>
          <div style={{marginTop:16,paddingTop:12,borderTop:'1px solid var(--border)'}}>
            <p style={{fontSize:10,color:'var(--ink3)',letterSpacing:'0.07em',textTransform:'uppercase',marginBottom:6}}>Relevance Score</p>
            <ConfBar score={result.confidence}/>
          </div>
        </div>
      </div>
    </div>
  )
}

function Card({analysis,result,loading,onRun,onSave,saved,onExpand,ready}:{
  analysis:typeof ANALYSES[0];result?:Result;loading:boolean;
  onRun:()=>void;onSave:()=>void;saved:boolean;onExpand:()=>void;ready:boolean
}){
  const preview=result?.content.replace(/\*\*/g,'').replace(/#+\s/g,'').replace(/\n+/g,' ').slice(0,100)
  return (
    <div style={{border:'1px solid var(--border-md)',borderRadius:8,background:'var(--bg2)',display:'flex',flexDirection:'column',height:'100%',transition:'border-color .15s'}}
      onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.borderColor='var(--border-hv)'}
      onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.borderColor='var(--border-md)'}
    >
      {/* accent top */}
      <div style={{height:2,background:result?'var(--accent)':'var(--muted)',borderRadius:'8px 8px 0 0',flexShrink:0,opacity:result?1:0.4}}/>
      {/* header */}
      <div style={{padding:'8px 10px 7px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <p style={{fontSize:12,fontWeight:600,color:'var(--ink)',lineHeight:1.3}}>{analysis.label}</p>
        {result && <button onClick={onSave} style={{background:'none',border:'none',cursor:'pointer',color:saved?'var(--accent)':'var(--muted)',padding:2,display:'flex',flexShrink:0}}>{saved?<Bookmark size={11} fill="currentColor"/>:<BookmarkPlus size={11}/>}</button>}
      </div>
      {/* body */}
      <div style={{flex:1,padding:'8px 10px',overflow:'hidden',position:'relative'}}>
        {loading && <div style={{display:'flex',flexDirection:'column',gap:6}}>{[90,75,85].map((w,i)=><div key={i} className="shimmer" style={{height:8,width:`${w}%`}}/>)}</div>}
        {!loading && result && (
          <div className="fade-up">
            <p style={{fontSize:12,color:'var(--ink2)',lineHeight:1.7}}>{preview}{(result.content.length>100)?'...':''}</p>
            <div style={{position:'absolute',bottom:0,left:0,right:0,height:24,background:'linear-gradient(transparent,var(--bg2))'}}/>
          </div>
        )}
        {!loading && !result && <p style={{fontSize:11,color:'var(--muted)',lineHeight:1.6}}>{ready?analysis.desc:'Select product + objective'}</p>}
      </div>
      {/* footer */}
      <div style={{padding:'6px 10px 9px',borderTop:'1px solid var(--border)',flexShrink:0}}>
        {result && !loading && (
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <div style={{flex:1}}><ConfBar score={result.confidence}/></div>
            <button onClick={onExpand} style={{padding:'3px 8px',borderRadius:4,border:'1px solid var(--border-md)',background:'transparent',color:'var(--ink2)',fontSize:10,fontWeight:500,cursor:'pointer',display:'flex',alignItems:'center',gap:3,flexShrink:0}}>
              <Maximize2 size={9}/> View
            </button>
          </div>
        )}
        {!result && !loading && (
          <button onClick={onRun} disabled={!ready} style={{width:'100%',padding:'5px 0',borderRadius:5,border:'1px solid var(--border-md)',background:'transparent',color:ready?'var(--ink2)':'var(--muted)',fontSize:11,fontWeight:500,cursor:ready?'pointer':'not-allowed',transition:'background .12s'}}
            onMouseEnter={e=>{if(ready)(e.currentTarget as HTMLButtonElement).style.background='var(--bg3)'}}
            onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background='transparent'}}
          >Run</button>
        )}
        {loading && <div style={{display:'flex',alignItems:'center',gap:5}}><Loader size={10} className="spin" color="var(--ink3)"/><span style={{fontSize:11,color:'var(--ink3)'}}>Generating...</span></div>}
      </div>
    </div>
  )
}

export default function Page(){
  const [product,   setProduct]   = useState('')
  const [custProd,  setCustProd]  = useState('')
  const [objective, setObjective] = useState('')
  const [activeSegs,setActiveSegs]= useState<string[]>(['genz','climate','smb','diy','enterprise'])
  const [activeSeg, setActiveSeg] = useState('genz')
  const [results,   setResults]   = useState<Results>({})
  const [loading,   setLoading]   = useState<LoadMap>({})
  const [saved,     setSaved]     = useState<Set<string>>(new Set())
  const [modal,     setModal]     = useState<{segId:string;ptKey:string}|null>(null)
  const [chatMsgs,  setChatMsgs]  = useState<ChatMsg[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatBusy,  setChatBusy]  = useState(false)
  const [error,     setError]     = useState('')
  const chatBottom = useRef<HTMLDivElement>(null)

  const fp    = product==='__custom__'?custProd:product
  const ready = !!fp && !!objective
  const seg   = SEGMENTS.find(s=>s.id===activeSeg)??SEGMENTS[0]

  useEffect(()=>{chatBottom.current?.scrollIntoView({behavior:'smooth'})},[chatMsgs,chatBusy])
  useEffect(()=>{if(activeSegs.length>0&&!activeSegs.includes(activeSeg))setActiveSeg(activeSegs[0])},[activeSegs,activeSeg])

  const runOne=useCallback(async(segId:string,ptKey:string)=>{
    if(!fp||!objective)return
    const k=rk(segId,ptKey)
    setLoading(p=>({...p,[k]:true}));setError('')
    try{
      const res=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({product:fp,objective,segment:SEGMENTS.find(s=>s.id===segId)?.label||segId,promptType:ptKey})})
      const data=await res.json()
      if(data.error){setError(data.error);return}
      setResults(p=>({...p,[k]:{content:data.content,confidence:data.confidence,ts:Date.now()}}))
    }catch{setError('Network error.')}
    finally{setLoading(p=>({...p,[k]:false}))}
  },[fp,objective])

  const runAll=async(segId:string)=>{for(const a of ANALYSES){await runOne(segId,a.key);await new Promise(r=>setTimeout(r,380))}}

  const sendChat=async(text:string)=>{
    if(!text.trim()||!ready||chatBusy)return
    setChatMsgs(p=>[...p,{id:uid(),role:'user',text:text.trim()}])
    setChatInput('');setChatBusy(true);setError('')
    try{
      const res=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({product:fp,objective,segment:seg.label,promptType:'custom',customPrompt:text.trim()})})
      const data=await res.json()
      if(data.error){setError(data.error);return}
      setChatMsgs(p=>[...p,{id:uid(),role:'assistant',text:data.content}])
    }catch{setError('Network error.')}
    finally{setChatBusy(false)}
  }

  const toggleSave=(k:string)=>setSaved(p=>{const n=new Set(p);n.has(k)?n.delete(k):n.add(k);return n})
  const isAnyLoading=Object.values(loading).some(Boolean)
  const totalDone=ANALYSES.filter(a=>results[rk(activeSeg,a.key)]).length
  const modalResult  =modal?results[rk(modal.segId,modal.ptKey)]:null
  const modalAnalysis=modal?ANALYSES.find(a=>a.key===modal.ptKey):null
  const modalSeg     =modal?SEGMENTS.find(s=>s.id===modal.segId):null

  const exportAll=()=>{
    let txt=`SEGMENT INTELLIGENCE\nProduct: ${fp} | Objective: ${objective}\n\n`
    activeSegs.forEach(sid=>{const s=SEGMENTS.find(x=>x.id===sid)!;txt+=`\n${s.label.toUpperCase()}\n${'─'.repeat(30)}\n`;ANALYSES.forEach(a=>{const r=results[rk(sid,a.key)];if(r)txt+=`\n${a.label} (${r.confidence}%)\n${r.content}\n`})})
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:'text/plain'}));a.download='segment-intelligence.txt';a.click()
  }

  return (
    <div style={{height:'100vh',display:'flex',flexDirection:'column',background:'var(--bg)',overflow:'hidden'}}>

      {/* HEADER — compact */}
      <header style={{height:48,background:'var(--surface)',borderBottom:'1px solid var(--border-md)',display:'flex',alignItems:'center',padding:'0 16px',justifyContent:'space-between',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <span className="serif" style={{fontSize:18,fontWeight:500,color:'var(--ink)',fontStyle:'italic',letterSpacing:'-0.01em'}}>Segment Intelligence</span>
          <span style={{fontSize:9,color:'var(--muted)',letterSpacing:'0.1em',textTransform:'uppercase',borderLeft:'1px solid var(--border-md)',paddingLeft:12}}>by Ayushi Patel</span>
        </div>
        <div style={{display:'flex',gap:6,alignItems:'center'}}>
          {error && <span style={{fontSize:11,color:'#e06060',maxWidth:280,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{error}</span>}
          {Object.keys(results).length>0&&<button onClick={exportAll} style={{padding:'4px 10px',borderRadius:5,border:'1px solid var(--border-md)',background:'transparent',color:'var(--ink3)',fontSize:11,cursor:'pointer',display:'flex',alignItems:'center',gap:4}}><Download size={10}/>Export</button>}
          <button onClick={()=>{setResults({});setSaved(new Set());setChatMsgs([]);setError('')}} style={{padding:'4px 10px',borderRadius:5,border:'1px solid var(--border-md)',background:'transparent',color:'var(--ink3)',fontSize:11,cursor:'pointer',display:'flex',alignItems:'center',gap:4}}><RotateCcw size={10}/>Reset</button>
        </div>
      </header>

      {/* BODY — 3 columns, fills remaining height */}
      <div style={{flex:1,display:'flex',overflow:'hidden',minHeight:0}}>

        {/* COL 1 — SIDEBAR */}
        <aside style={{width:220,borderRight:'1px solid var(--border-md)',background:'var(--surface)',display:'flex',flexDirection:'column',flexShrink:0,overflow:'hidden'}}>
          <div style={{flex:1,overflowY:'auto',padding:'14px 12px',display:'flex',flexDirection:'column',gap:14}}>

            {/* Product */}
            <div>
              <p style={{fontSize:9,color:'var(--ink3)',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:6,fontWeight:500}}>Product</p>
              <div style={{position:'relative'}}>
                <select value={product} onChange={e=>setProduct(e.target.value)} style={{width:'100%',padding:'8px 26px 8px 10px',border:'1px solid var(--border-md)',borderRadius:6,background:'var(--bg3)',color:product?'var(--ink)':'var(--ink3)',fontSize:12,appearance:'none',cursor:'pointer',outline:'none'}}>
                  <option value="" disabled>Select...</option>
                  {PRODUCTS.map(p=><option key={p} value={p}>{p}</option>)}
                  <option value="__custom__">Other...</option>
                </select>
                <ChevronDown size={11} style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',color:'var(--ink3)',pointerEvents:'none'}}/>
              </div>
              {product==='__custom__'&&<input value={custProd} onChange={e=>setCustProd(e.target.value)} placeholder="Product name..." style={{marginTop:5,width:'100%',padding:'8px 10px',border:'1px solid var(--border-md)',borderRadius:6,background:'var(--bg3)',color:'var(--ink)',fontSize:12,outline:'none'}}/>}
            </div>

            {/* Objective */}
            <div>
              <p style={{fontSize:9,color:'var(--ink3)',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:6,fontWeight:500}}>Objective</p>
              <div style={{position:'relative'}}>
                <select value={objective} onChange={e=>setObjective(e.target.value)} style={{width:'100%',padding:'8px 26px 8px 10px',border:'1px solid var(--border-md)',borderRadius:6,background:'var(--bg3)',color:objective?'var(--ink)':'var(--ink3)',fontSize:12,appearance:'none',cursor:'pointer',outline:'none'}}>
                  <option value="" disabled>Select...</option>
                  {OBJECTIVES.map(o=><option key={o} value={o}>{o}</option>)}
                </select>
                <ChevronDown size={11} style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',color:'var(--ink3)',pointerEvents:'none'}}/>
              </div>
            </div>

            <div style={{height:1,background:'var(--border)'}}/>

            {/* Segments */}
            <div>
              <p style={{fontSize:9,color:'var(--ink3)',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:7,fontWeight:500}}>Segments</p>
              <div style={{display:'flex',flexDirection:'column',gap:3,marginBottom:7}}>
                {activeSegs.map(sid=>{
                  const s=SEGMENTS.find(x=>x.id===sid)!
                  const done=ANALYSES.filter(a=>results[rk(sid,a.key)]).length
                  const isActive=activeSeg===sid
                  return (
                    <div key={sid} onClick={()=>setActiveSeg(sid)} style={{padding:'7px 9px',borderRadius:6,border:`1px solid ${isActive?'var(--accent)40':'var(--border)'}`,background:isActive?'rgba(200,169,110,0.07)':'transparent',cursor:'pointer',transition:'all .12s',display:'flex',alignItems:'center',gap:7}}>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{fontSize:12,color:isActive?'var(--ink)':'var(--ink2)',fontWeight:isActive?600:400,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s.label}</p>
                        <div style={{display:'flex',alignItems:'center',gap:5,marginTop:3}}>
                          <div style={{flex:1,height:2,background:'var(--bg4)',borderRadius:1}}>
                            <div style={{width:`${(done/ANALYSES.length)*100}%`,height:'100%',background:'var(--accent)',borderRadius:1}}/>
                          </div>
                          <span style={{fontSize:9,color:'var(--muted)',flexShrink:0}}>{done}/{ANALYSES.length}</span>
                        </div>
                      </div>
                      <button onClick={e=>{e.stopPropagation();setActiveSegs(p=>p.filter(x=>x!==sid))}} style={{background:'none',border:'none',color:'var(--muted)',cursor:'pointer',padding:1,flexShrink:0,display:'flex'}}>
                        <X size={9}/>
                      </button>
                    </div>
                  )
                })}
              </div>
              <div style={{position:'relative'}}>
                <select onChange={e=>{if(e.target.value){setActiveSegs(p=>[...p,e.target.value]);e.currentTarget.value=''}}} style={{width:'100%',padding:'6px 22px 6px 9px',border:'1px solid var(--border)',borderRadius:5,background:'var(--bg3)',color:'var(--ink3)',fontSize:11,appearance:'none',cursor:'pointer',outline:'none'}}>
                  <option value="">+ Add segment...</option>
                  {SEGMENTS.filter(s=>!activeSegs.includes(s.id)).map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
                <ChevronDown size={10} style={{position:'absolute',right:7,top:'50%',transform:'translateY(-50%)',color:'var(--muted)',pointerEvents:'none'}}/>
              </div>
            </div>

            <div style={{height:1,background:'var(--border)'}}/>

            {/* Actions */}
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              <button onClick={()=>ready&&!isAnyLoading&&runAll(activeSeg)} disabled={!ready||isAnyLoading} style={{padding:'8px 10px',borderRadius:6,border:'none',background:ready?'var(--accent)':'var(--bg3)',color:ready?'#000':'var(--muted)',fontSize:12,fontWeight:600,cursor:ready&&!isAnyLoading?'pointer':'not-allowed',transition:'all .15s'}}>
                {isAnyLoading?'Running...':'Run full analysis'}
              </button>
              <button onClick={()=>{if(!ready||isAnyLoading)return;ANALYSES.filter(a=>!results[rk(activeSeg,a.key)]).forEach((a,i)=>setTimeout(()=>runOne(activeSeg,a.key),i*400))}} disabled={!ready||isAnyLoading} style={{padding:'7px 10px',borderRadius:6,border:'1px solid var(--border-md)',background:'transparent',color:ready?'var(--ink2)':'var(--muted)',fontSize:12,cursor:ready&&!isAnyLoading?'pointer':'not-allowed'}}>
                Run missing
              </button>
            </div>
            {!ready&&<p style={{fontSize:11,color:'var(--muted)',lineHeight:1.65,textAlign:'center'}}>Select product and objective to begin</p>}
          </div>
        </aside>

        {/* COL 2 — CARDS */}
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',borderRight:'1px solid var(--border-md)'}}>

          {/* Segment tabs */}
          <div style={{height:40,borderBottom:'1px solid var(--border-md)',display:'flex',alignItems:'center',padding:'0 14px',gap:6,flexShrink:0,overflowX:'auto'}}>
            {ready ? (
              <>
                {activeSegs.map(sid=>{
                  const s=SEGMENTS.find(x=>x.id===sid)!
                  return (
                    <button key={sid} onClick={()=>setActiveSeg(sid)} style={{padding:'4px 10px',borderRadius:4,border:'none',background:activeSeg===sid?'rgba(200,169,110,0.15)':'transparent',color:activeSeg===sid?'var(--accent)':'var(--ink3)',fontSize:11,fontWeight:activeSeg===sid?600:400,cursor:'pointer',whiteSpace:'nowrap',transition:'all .12s'}}>
                      {s.label}
                    </button>
                  )
                })}
                <span style={{fontSize:11,color:'var(--muted)',marginLeft:'auto',whiteSpace:'nowrap'}}>{totalDone}/{ANALYSES.length} done</span>
              </>
            ) : (
              <span className="serif" style={{fontSize:16,fontStyle:'italic',color:'var(--ink3)'}}>Know your <span style={{color:'var(--accent)'}}>customer</span></span>
            )}
          </div>

          {/* 3x3 grid — fills all available space */}
          <div style={{flex:1,padding:'12px',display:'grid',gridTemplateColumns:'repeat(3,1fr)',gridTemplateRows:'repeat(3,1fr)',gap:'10px',minHeight:0}}>
            {ANALYSES.map(a=>(
              <Card key={a.key} analysis={a}
                result={results[rk(activeSeg,a.key)]}
                loading={loading[rk(activeSeg,a.key)]||false}
                onRun={()=>ready&&runOne(activeSeg,a.key)}
                onSave={()=>toggleSave(rk(activeSeg,a.key))}
                saved={saved.has(rk(activeSeg,a.key))}
                onExpand={()=>setModal({segId:activeSeg,ptKey:a.key})}
                ready={ready}
              />
            ))}
          </div>
        </div>

        {/* COL 3 — CHAT */}
        <div style={{width:280,display:'flex',flexDirection:'column',overflow:'hidden',flexShrink:0}}>

          <div style={{padding:'10px 14px 8px',borderBottom:'1px solid var(--border)',flexShrink:0}}>
            <p className="serif" style={{fontSize:15,fontWeight:500,color:'var(--ink)',fontStyle:'italic'}}>Ask the AI</p>
            <p style={{fontSize:11,color:'var(--ink3)',marginTop:1}}>{ready?`About ${seg.label}`:'Configure settings first'}</p>
          </div>

          {/* Messages — scrollable */}
          <div style={{flex:1,overflowY:'auto',padding:'10px 12px',display:'flex',flexDirection:'column',gap:8,minHeight:0}}>
            {chatMsgs.length===0 && (
              <div style={{display:'flex',flexDirection:'column',gap:5}}>
                <p style={{fontSize:10,color:'var(--muted)',letterSpacing:'0.07em',textTransform:'uppercase',marginBottom:4}}>Quick questions</p>
                {QUICK_QS.map(q=>(
                  <button key={q} onClick={()=>sendChat(q)} disabled={!ready||chatBusy} style={{textAlign:'left',padding:'7px 10px',borderRadius:5,border:'1px solid var(--border)',background:'transparent',color:ready?'var(--ink2)':'var(--muted)',fontSize:12,cursor:ready?'pointer':'not-allowed',lineHeight:1.5,transition:'background .12s'}}
                    onMouseEnter={e=>{if(ready)(e.currentTarget as HTMLButtonElement).style.background='var(--bg3)'}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background='transparent'}}
                  >{q}</button>
                ))}
              </div>
            )}
            {chatMsgs.map((m,i)=>(
              <div key={m.id} className={i>=chatMsgs.length-2?'fade-in':''} style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start'}}>
                {m.role==='user'
                  ? <div style={{maxWidth:'82%',padding:'7px 10px',borderRadius:'7px 7px 2px 7px',background:'var(--ink)',color:'var(--bg)',fontSize:12,lineHeight:1.6}}>{m.text}</div>
                  : <div style={{maxWidth:'95%',padding:'8px 10px',borderRadius:'2px 7px 7px 7px',border:'1px solid var(--border-md)',background:'var(--bg2)'}}>
                      <div className="md" style={{fontSize:12}}><ReactMarkdown>{m.text}</ReactMarkdown></div>
                    </div>
                }
              </div>
            ))}
            {chatBusy && (
              <div style={{display:'flex',gap:6,alignItems:'center',padding:'7px 10px',border:'1px solid var(--border)',borderRadius:'2px 7px 7px 7px',background:'var(--bg2)',width:'fit-content'}}>
                <Loader size={10} className="spin" color="var(--ink3)"/>
                <span style={{fontSize:11,color:'var(--ink3)'}}>Thinking...</span>
              </div>
            )}
            <div ref={chatBottom}/>
          </div>

          {/* Input */}
          <div style={{padding:'8px 12px 10px',borderTop:'1px solid var(--border)',flexShrink:0}}>
            <div style={{display:'flex',gap:6,alignItems:'flex-end'}}>
              <textarea value={chatInput} onChange={e=>setChatInput(e.target.value)}
                onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendChat(chatInput)}}}
                disabled={!ready||chatBusy} rows={1}
                placeholder={ready?'Ask anything...':'Configure first'}
                style={{flex:1,resize:'none',padding:'8px 10px',border:'1px solid var(--border-md)',borderRadius:6,background:'var(--bg3)',color:'var(--ink)',fontSize:12,lineHeight:1.5,outline:'none',opacity:ready?1:0.5}}
                onInput={e=>{const t=e.currentTarget;t.style.height='auto';t.style.height=Math.min(t.scrollHeight,90)+'px'}}
              />
              <button onClick={()=>sendChat(chatInput)} disabled={!ready||chatBusy||!chatInput.trim()} style={{padding:'8px 10px',borderRadius:6,border:'none',background:ready&&chatInput.trim()&&!chatBusy?'var(--accent)':'var(--bg4)',color:ready&&chatInput.trim()&&!chatBusy?'#000':'var(--muted)',cursor:ready&&chatInput.trim()&&!chatBusy?'pointer':'not-allowed',display:'flex',alignItems:'center',flexShrink:0,transition:'all .15s'}}>
                {chatBusy?<Loader size={13} className="spin"/>:<ArrowUp size={13}/>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {modal&&modalResult&&modalAnalysis&&modalSeg&&(
        <Modal result={modalResult} analysis={modalAnalysis} segment={modalSeg} onClose={()=>setModal(null)}/>
      )}
    </div>
  )
}
