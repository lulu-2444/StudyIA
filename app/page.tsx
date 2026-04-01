'use client'
import { useState, useRef } from 'react'

type Page = 'home' | 'folders' | 'tools' | 'quiz' | 'flashcards' | 'podcast' | 'cours'
type ToolType = 'quiz' | 'flashcards' | 'podcast' | 'cours'
interface UploadedFile { name: string; size: string; text: string; imageBase64?: string; mimeType?: string }
interface Folder { id: string; emoji: string; name: string; color: string; files: UploadedFile[] }
interface QuizQuestion { type: 'qcm'|'vf'|'open'; question: string; options: string[]; answer: number|null; explanation: string }
interface Flashcard { front: string; back: string }
interface PodcastLine { speaker: string; text: string }

export default function App() {
  const [page, setPage] = useState<Page>('home')
  const [folders, setFolders] = useState<Folder[]>([
    { id: 'maths', emoji: '📐', name: 'Mathématiques', color: 'var(--purple)', files: [] },
    { id: 'histoire', emoji: '📜', name: 'Histoire', color: 'var(--orange)', files: [] },
  ])
  const [openFolder, setOpenFolder] = useState<Folder|null>(null)
  const [selectedFolder, setSelectedFolder] = useState<Folder|null>(null)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [quizData, setQuizData] = useState<QuizQuestion[]>([])
  const [flashData, setFlashData] = useState<Flashcard[]>([])
  const [podcastData, setPodcastData] = useState<any>(null)
  const [coursData, setCoursData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [stats, setStats] = useState({ filesImported: 0, quizDone: 0 })

  async function generateTool(tool: ToolType) {
    if (!selectedFolder) return alert('Sélectionne un dossier !')
    if (selectedFolder.files.length === 0) return alert('Ajoute des fichiers dans ce dossier !')
    const msgs: Record<ToolType, string[]> = {
      quiz: ['Analyse du cours…','Génération des questions…','Calibrage…'],
      flashcards: ['Extraction des concepts…','Création des cartes…','Organisation…'],
      podcast: ['Écriture du script…','Attribution des rôles…','Finalisation…'],
      cours: ['Lecture approfondie…','Enrichissement…','Ajout des exemples…'],
    }
    setLoading(true); let i = 0; setLoadingMsg(msgs[tool][0])
    const iv = setInterval(() => { i++; if (i < msgs[tool].length) setLoadingMsg(msgs[tool][i]) }, 900)
    try {
      const file = selectedFolder.files[0]
      const res = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tool, courseText: file.text, imageBase64: file.imageBase64, mimeType: file.mimeType }) })
      const data = await res.json()
      if (tool === 'quiz') { setQuizData(data.questions || []); setStats(s => ({...s, quizDone: s.quizDone+1})) }
      if (tool === 'flashcards') setFlashData(data.flashcards || [])
      if (tool === 'podcast') setPodcastData(data)
      if (tool === 'cours') setCoursData(data)
      setPage(tool)
    } catch(e) { alert('Erreur. Vérifie ta clé API.') }
    finally { clearInterval(iv); setLoading(false) }
  }

  function addFiles(folder: Folder, newFiles: UploadedFile[]) {
    setFolders(prev => prev.map(f => f.id === folder.id ? {...f, files: [...f.files, ...newFiles]} : f))
    setOpenFolder(prev => prev?.id === folder.id ? {...prev, files: [...prev.files, ...newFiles]} : prev)
    setStats(s => ({...s, filesImported: s.filesImported + newFiles.length}))
  }

  const NAV = [
    {id:'home',label:'Accueil'},{id:'folders',label:'Mes cours'},{id:'tools',label:'Outils IA'},
    {id:'quiz',label:'Quiz'},{id:'flashcards',label:'Flashcards'},{id:'podcast',label:'Podcast'},{id:'cours',label:'Cours approfondi'}
  ]

  return (
    <div style={{display:'flex',minHeight:'100vh'}}>
      <nav style={{width:220,background:'var(--surface)',borderRight:'1px solid var(--border)',display:'flex',flexDirection:'column',padding:'24px 16px',position:'fixed',top:0,left:0,height:'100vh',overflowY:'auto'}}>
        <div style={{fontFamily:'Syne',fontWeight:800,fontSize:22,padding:'0 8px 28px'}} className="gradient-text">StudyAI</div>
        {NAV.map(n => (
          <button key={n.id} onClick={() => setPage(n.id as Page)} style={{display:'flex',alignItems:'center',padding:'10px 12px',borderRadius:10,cursor:'pointer',fontSize:14,color:page===n.id?'var(--text)':'var(--muted2)',fontWeight:500,marginBottom:2,border:page===n.id?'1px solid rgba(155,89,255,.25)':'1px solid transparent',background:page===n.id?'linear-gradient(135deg,rgba(155,89,255,.18),rgba(0,212,255,.12))':'transparent',width:'100%',textAlign:'left'}}>
            {n.label}
          </button>
        ))}
        <div style={{marginTop:'auto',paddingTop:20,borderTop:'1px solid var(--border)'}}>
          <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px'}}>
            <div style={{width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,var(--pink),var(--purple))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700}}>T</div>
            <div><div style={{fontSize:13,fontWeight:600}}>Thomas</div><div style={{fontSize:11,color:'var(--muted2)'}}>Plan Gratuit</div></div>
          </div>
        </div>
      </nav>
      <main style={{marginLeft:220,flex:1,padding:'32px 36px',overflowY:'auto'}}>
        {page==='home' && <HomePage stats={stats} setPage={setPage}/>}
        {page==='folders' && <FoldersPage folders={folders} openFolder={openFolder} setOpenFolder={setOpenFolder} showNewFolder={showNewFolder} setShowNewFolder={setShowNewFolder} setFolders={setFolders} addFiles={addFiles}/>}
        {page==='tools' && <ToolsPage folders={folders} selectedFolder={selectedFolder} setSelectedFolder={setSelectedFolder} generateTool={generateTool} loading={loading} loadingMsg={loadingMsg}/>}
        {page==='quiz' && <QuizPage questions={quizData}/>}
        {page==='flashcards' && <FlashcardsPage cards={flashData}/>}
        {page==='podcast' && <PodcastPage data={podcastData}/>}
        {page==='cours' && <CoursPage data={coursData}/>}
      </main>
    </div>
  )
}
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
export async function POST(req: NextRequest) {
  try {
    const { tool, courseText, imageBase64, mimeType } = await req.json()
    const prompts: Record<string, string> = {
      quiz: `Génère un quiz de 6 questions (2 QCM, 2 vrai/faux, 2 ouvertes) à partir de ce cours:\n${courseText?.slice(0,6000)}\nRéponds UNIQUEMENT en JSON sans markdown:\n{"questions":[{"type":"qcm","question":"...","options":["A","B","C","D"],"answer":0,"explanation":"..."},{"type":"vf","question":"...","options":["Vrai","Faux"],"answer":0,"explanation":"..."},{"type":"open","question":"...","options":[],"answer":null,"explanation":"..."}]}`,
      flashcards: `Génère 8 flashcards à partir de ce cours:\n${courseText?.slice(0,6000)}\nRéponds UNIQUEMENT en JSON sans markdown:\n{"flashcards":[{"front":"...","back":"..."}]}`,
      podcast: `Crée un podcast entre Alex (enthousiaste) et Sam (rigoureux). Cours:\n${courseText?.slice(0,6000)}\nRéponds UNIQUEMENT en JSON sans markdown:\n{"title":"...","duration":"~8 min","lines":[{"speaker":"Alex","text":"..."}]}`,
      cours: `Enrichis ce cours pour un lycéen:\n${courseText?.slice(0,6000)}\nRéponds UNIQUEMENT en JSON sans markdown:\n{"title":"...","sections":[{"number":"01","title":"...","subtitle":"...","content":"...","callout":{"title":"...","text":"..."},"concepts":[{"label":"...","value":"..."}]}]}`,
    }
    const content: Anthropic.MessageParam['content'] = []
    if (imageBase64) content.push({ type: 'image', source: { type: 'base64', media_type: mimeType, data: imageBase64 } } as Anthropic.ImageBlockParam)
    content.push({ type: 'text', text: prompts[tool] })
    const response = await client.messages.create({ model: 'claude-sonnet-4-20250514', max_tokens: 3000, messages: [{ role: 'user', content }] })
    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    return NextResponse.json(JSON.parse(text.replace(/```json|```/g, '').trim()))
  } catch(e) {
    return NextResponse.json({ error: 'Erreur' }, { status: 500 })
  }
}
function QuizPage({ questions }: { questions: any[] }) {
  const [cur, setCur] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [selected, setSelected] = useState<number|null>(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)

  if (questions.length===0) return (
    <div style={{textAlign:'center',padding:'60px 20px',color:'var(--muted2)'}}>
      <div style={{fontSize:40,marginBottom:16}}>🧠</div>
      <div style={{fontFamily:'Syne',fontWeight:700,fontSize:18,marginBottom:8,color:'var(--text)'}}>Aucun quiz généré</div>
      <div style={{fontSize:14}}>Va dans Outils IA, sélectionne un dossier et génère un quiz !</div>
    </div>
  )

  if (done) {
    const pct = Math.round((score/questions.length)*100)
    return (
      <div className="fade-up" style={{textAlign:'center',padding:'40px 20px',maxWidth:520,margin:'0 auto'}}>
        <svg viewBox="0 0 100 100" style={{width:120,height:120,margin:'0 auto 20px'}}>
          <circle cx="50" cy="50" r="45" fill="none" stroke="var(--card2)" strokeWidth="8"/>
          <circle cx="50" cy="50" r="45" fill="none" stroke="url(#sg)" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(pct/100)*2*Math.PI*45} ${2*Math.PI*45}`} strokeDashoffset={2*Math.PI*45/4} transform="rotate(-90 50 50)"/>
          <defs><linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#9b59ff"/><stop offset="100%" stopColor="#ff4fa3"/></linearGradient></defs>
          <text x="50" y="46" textAnchor="middle" fill="var(--text)" fontFamily="Syne" fontWeight="800" fontSize="18">{score}/{questions.length}</text>
          <text x="50" y="60" textAnchor="middle" fill="var(--muted2)" fontSize="9">bonnes rép.</text>
        </svg>
        <div style={{fontFamily:'Syne',fontWeight:800,fontSize:22,marginBottom:8}}>{pct>=80?'Excellent ! 🎉':pct>=60?'Bien joué ! 👍':'Continue à réviser 💪'}</div>
        <div style={{fontSize:14,color:'var(--muted2)',marginBottom:24}}>Tu as répondu correctement à {pct}% des questions.</div>
        <button onClick={()=>{setCur(0);setAnswered(false);setSelected(null);setScore(0);setDone(false)}} style={{background:'linear-gradient(135deg,var(--purple),var(--pink))',border:'none',color:'white',fontFamily:'Syne',fontWeight:700,fontSize:13,padding:'12px 32px',borderRadius:10,cursor:'pointer'}}>↺ Recommencer</button>
      </div>
    )
  }

  const q = questions[cur]
  const pct = Math.round((cur/questions.length)*100)
  const typeColor = {qcm:'var(--pink)',vf:'var(--cyan)',open:'var(--purple)'}[q.type as 'qcm'|'vf'|'open']
  const typeLabel = {qcm:'QCM',vf:'VRAI / FAUX',open:'QUESTION OUVERTE'}[q.type as 'qcm'|'vf'|'open']

  function selectAnswer(i: number) {
    if (answered) return
    setAnswered(true); setSelected(i)
    if (q.answer!==null && i===q.answer) setScore(s=>s+1)
    if (q.type!=='open') setTimeout(()=>next(), 1300)
  }
  function next() {
    if (cur+1>=questions.length) setDone(true)
    else { setCur(c=>c+1); setAnswered(false); setSelected(null) }
  }

  return (
    <div className="fade-up">
      <div style={{fontFamily:'Syne',fontWeight:800,fontSize:26,marginBottom:6}}>Quiz IA</div>
      <div style={{color:'var(--muted2)',fontSize:14,marginBottom:28}}>Teste tes connaissances</div>
      <div style={{maxWidth:680}}>
        <div style={{display:'flex',alignItems:'center',marginBottom:24}}>
          <div style={{flex:1,height:6,background:'var(--card2)',borderRadius:3,margin:'0 16px'}}>
            <div style={{height:'100%',borderRadius:3,background:'linear-gradient(90deg,var(--purple),var(--pink))',width:pct+'%',transition:'width .4s'}}/>
          </div>
          <div style={{fontSize:13,color:'var(--muted2)',fontWeight:600}}>{cur+1} / {questions.length}</div>
        </div>
        <div style={{fontSize:11,fontWeight:700,padding:'4px 10px',borderRadius:20,marginBottom:12,display:'inline-block',color:typeColor}}>{typeLabel}</div>
        <div style={{fontFamily:'Syne',fontWeight:700,fontSize:20,lineHeight:1.45,marginBottom:24}}>{q.question}</div>
        {q.type==='open' ? (
          <>
            <textarea placeholder="Écris ta réponse ici…" style={{width:'100%',background:'var(--card2)',border:'1.5px solid var(--border2)',color:'var(--text)',fontFamily:'DM Sans',fontSize:14,padding:14,borderRadius:12,outline:'none',resize:'vertical',minHeight:100,marginBottom:16}}/>
            {answered&&<div style={{background:'rgba(155,89,255,.08)',borderLeft:'3px solid var(--purple)',padding:'12px 16px',marginBottom:16,fontSize:13,color:'var(--muted2)'}}><strong style={{color:'var(--text)'}}>Réponse type :</strong> {q.explanation}</div>}
            <button onClick={answered?next:()=>setAnswered(true)} style={{background:'linear-gradient(135deg,var(--purple),var(--pink))',border:'none',color:'white',fontFamily:'Syne',fontWeight:700,fontSize:13,padding:'12px 32px',borderRadius:10,cursor:'pointer'}}>{answered?'Question suivante →':'Valider'}</button>
          </>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:24}}>
            {q.options.map((opt: string,i: number) => {
              let bg='var(--card)',border='1.5px solid var(--border2)',color='var(--text)'
              if (answered) {
                if (i===q.answer){bg='rgba(0,229,160,.12)';border='1.5px solid var(--green)';color='var(--green)'}
                else if (i===selected){bg='rgba(255,79,163,.12)';border='1.5px solid var(--pink)';color='var(--pink)'}
              }
              return <button key={i} onClick={()=>selectAnswer(i)} style={{padding:'14px 18px',borderRadius:12,border,cursor:'pointer',fontSize:14,fontWeight:500,background:bg,color,textAlign:'left'}}>{String.fromCharCode(65+i)}. {opt}</button>
            })}
            {answered&&q.explanation&&<div style={{background:'rgba(155,89,255,.08)',borderLeft:'3px solid var(--purple)',padding:'12px 16px',fontSize:13,color:'var(--muted2)'}}><strong style={{color:'var(--text)'}}>Explication :</strong> {q.explanation}</div>}
          </div>
        )}
      </div>
    </div>
  )
}

function FlashcardsPage({ cards }: { cards: any[] }) {
  const [cur, setCur] = useState(0)
  const [flipped, setFlipped] = useState(false)
  if (cards.length===0) return (
    <div style={{textAlign:'center',padding:'60px 20px',color:'var(--muted2)'}}>
      <div style={{fontSize:40,marginBottom:16}}>🃏</div>
      <div style={{fontFamily:'Syne',fontWeight:700,fontSize:18,marginBottom:8,color:'var(--text)'}}>Aucune flashcard générée</div>
      <div style={{fontSize:14}}>Va dans Outils IA et génère des flashcards !</div>
    </div>
  )
  const card = cards[cur]
  return (
    <div className="fade-up">
      <div style={{fontFamily:'Syne',fontWeight:800,fontSize:26,marginBottom:6}}>Flashcards</div>
      <div style={{color:'var(--muted2)',fontSize:14,marginBottom:28}}>Clique sur la carte pour la retourner</div>
      <div className={`card-flip ${flipped?'flipped':''}`} onClick={()=>setFlipped(f=>!f)} style={{maxWidth:540,height:280,margin:'0 auto 24px',cursor:'pointer',position:'relative'}}>
        <div className="card-flip-inner" style={{width:'100%',height:'100%',position:'relative'}}>
          <div className="card-face" style={{background:'linear-gradient(135deg,#1e1e35,#2a1e40)',border:'1px solid rgba(155,89,255,.3)'}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase',opacity:.4,marginBottom:12}}>Question</div>
            <div style={{fontFamily:'Syne',fontSize:18,fontWeight:700,lineHeight:1.45,textAlign:'center'}}>{card.front}</div>
          </div>
          <div className="card-face card-back-face" style={{background:'linear-gradient(135deg,#1e2a35,#1e3530)',border:'1px solid rgba(0,229,160,.3)'}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase',opacity:.4,marginBottom:12}}>Réponse</div>
            <div style={{fontSize:15,fontWeight:500,lineHeight:1.55,textAlign:'center',color:'#ccd'}}>{card.back}</div>
          </div>
        </div>
      </div>
      <div style={{textAlign:'center',fontSize:12,color:'var(--muted2)',marginBottom:16}}>👆 Clique pour retourner</div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:16,marginBottom:20}}>
        <button onClick={()=>{setCur(c=>(c-1+cards.length)%cards.length);setFlipped(false)}} style={{width:44,height:44,borderRadius:10,background:'var(--card)',border:'1px solid var(--border2)',color:'var(--text)',fontSize:20,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>←</button>
        <span style={{fontSize:14,fontWeight:600,color:'var(--muted2)'}}>{cur+1} / {cards.length}</span>
        <button onClick={()=>{setCur(c=>(c+1)%cards.length);setFlipped(false)}} style={{width:44,height:44,borderRadius:10,background:'var(--card)',border:'1px solid var(--border2)',color:'var(--text)',fontSize:20,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>→</button>
      </div>
      <div style={{display:'flex',gap:10,justifyContent:'center'}}>
        {[{label:'😣 Difficile',c:'var(--pink)'},{label:'🤔 Moyen',c:'var(--yellow)'},{label:'😊 Facile',c:'var(--green)'}].map((b,i)=>(
          <button key={i} onClick={()=>{setCur(c=>(c+1)%cards.length);setFlipped(false)}} style={{flex:1,maxWidth:160,background:'var(--card2)',border:`1px solid ${b.c}`,color:b.c,fontFamily:'Syne',fontWeight:700,fontSize:13,padding:'10px',borderRadius:10,cursor:'pointer'}}>{b.label}</button>
        ))}
      </div>
    </div>
  )
}

function PodcastPage({ data }: { data: any }) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const ivRef = useRef<any>(null)

  function togglePlay() {
    setPlaying(p => {
      if (!p) { ivRef.current = setInterval(()=>setProgress(pr=>{if(pr>=100){clearInterval(ivRef.current);return 100}return pr+0.14}),100) }
      else clearInterval(ivRef.current)
      return !p
    })
  }
  const secs = Math.round(progress*7.2)
  const timeStr = `${Math.floor(secs/60)}:${(secs%60).toString().padStart(2,'0')}`

  if (!data) return (
    <div style={{textAlign:'center',padding:'60px 20px',color:'var(--muted2)'}}>
      <div style={{fontSize:40,marginBottom:16}}>🎙️</div>
      <div style={{fontFamily:'Syne',fontWeight:700,fontSize:18,marginBottom:8,color:'var(--text)'}}>Aucun podcast généré</div>
      <div style={{fontSize:14}}>Va dans Outils IA et génère un podcast !</div>
    </div>
  )
  return (
    <div className="fade-up" style={{maxWidth:720}}>
      <div style={{fontFamily:'Syne',fontWeight:800,fontSize:26,marginBottom:6}}>Podcast IA</div>
      <div style={{color:'var(--muted2)',fontSize:14,marginBottom:28}}>Deux profs IA expliquent ton cours</div>
      <div style={{background:'linear-gradient(135deg,#1a1a2e,#16213e)',border:'1px solid rgba(0,212,255,.15)',borderRadius:20,padding:28,marginBottom:20}}>
        <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:20}}>
          <div style={{width:64,height:64,borderRadius:12,background:'linear-gradient(135deg,var(--purple),var(--cyan))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28}}>🎙️</div>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:'var(--cyan)',letterSpacing:'.06em',textTransform:'uppercase',marginBottom:4}}>Podcast IA</div>
            <div style={{fontFamily:'Syne',fontWeight:700,fontSize:16}}>{data.title}</div>
            <div style={{fontSize:12,color:'var(--muted2)',marginTop:3}}>Alex & Sam · {data.duration}</div>
          </div>
        </div>
        <div style={{marginBottom:18}}>
          <div style={{width:'100%',height:4,background:'rgba(255,255,255,.1)',borderRadius:2,marginBottom:8,cursor:'pointer'}} onClick={e=>{const r=(e.target as HTMLDivElement).getBoundingClientRect();setProgress(((e.clientX-r.left)/r.width)*100)}}>
            <div style={{height:'100%',background:'linear-gradient(90deg,var(--cyan),var(--purple))',borderRadius:2,width:progress+'%',pointerEvents:'none'}}/>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'var(--muted2)'}}><span>{timeStr}</span><span>{data.duration}</span></div>
        </div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:16}}>
          <button onClick={()=>setProgress(p=>Math.max(0,p-2))} style={{background:'none',border:'none',color:'var(--muted2)',fontSize:14,cursor:'pointer',padding:8}}>⏮ 15s</button>
          <button onClick={togglePlay} style={{width:52,height:52,borderRadius:'50%',background:'linear-gradient(135deg,var(--cyan),var(--purple))',border:'none',color:'white',fontSize:18,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>{playing?'⏸':'▶'}</button>
          <button onClick={()=>setProgress(p=>Math.min(100,p+2))} style={{background:'none',border:'none',color:'var(--muted2)',fontSize:14,cursor:'pointer',padding:8}}>15s ⏭</button>
        </div>
      </div>
      <div style={{fontFamily:'Syne',fontWeight:700,fontSize:14,marginBottom:12}}>Transcription</div>
      <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:20,padding:20,maxHeight:320,overflowY:'auto'}}>
        {data.lines?.map((line: PodcastLine,i: number)=>(
          <div key={i} style={{display:'flex',gap:12,marginBottom:14,alignItems:'flex-start'}}>
            <span style={{fontSize:11,fontWeight:700,padding:'3px 8px',borderRadius:20,whiteSpace:'nowrap',marginTop:2,flexShrink:0,background:line.speaker==='Alex'?'rgba(155,89,255,.15)':'rgba(0,212,255,.15)',color:line.speaker==='Alex'?'var(--purple)':'var(--cyan)'}}>{line.speaker}</span>
            <div style={{fontSize:13,lineHeight:1.65,color:'var(--muted2)'}}>{line.text}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CoursPage({ data }: { data: any }) {
  if (!data) return (
    <div style={{textAlign:'center',padding:'60px 20px',color:'var(--muted2)'}}>
      <div style={{fontSize:40,marginBottom:16}}>📚</div>
      <div style={{fontFamily:'Syne',fontWeight:700,fontSize:18,marginBottom:8,color:'var(--text)'}}>Aucun cours généré</div>
      <div style={{fontSize:14}}>Va dans Outils IA et génère un cours approfondi !</div>
    </div>
  )
  return (
    <div className="fade-up" style={{maxWidth:760}}>
      <div style={{fontFamily:'Syne',fontWeight:800,fontSize:26,marginBottom:6}}>Cours approfondi</div>
      <div style={{color:'var(--muted2)',fontSize:14,marginBottom:28}}>Généré par l'IA à partir de ton cours</div>
      <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:14,padding:18,marginBottom:24}}>
        <div style={{fontSize:12,fontWeight:700,color:'var(--muted2)',letterSpacing:'.06em',textTransform:'uppercase',marginBottom:12}}>Sommaire</div>
        {data.sections?.map((s: any,i: number)=>(
          <div key={i} style={{fontSize:13,color:'var(--muted2)',padding:'5px 0',display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontFamily:'Syne',fontWeight:700,fontSize:11,color:'var(--purple)'}}>{s.number||String(i+1).padStart(2,'0')}</span>{s.title}
          </div>
        ))}
      </div>
      {data.sections?.map((s: any,i: number)=>(
        <div key={i} style={{marginBottom:32}}>
          <div style={{fontFamily:'Syne',fontWeight:800,fontSize:22,marginBottom:6,borderLeft:'3px solid var(--purple)',paddingLeft:14}}>{s.number}. {s.title}</div>
          {s.subtitle&&<div style={{fontFamily:'Syne',fontWeight:700,fontSize:16,color:'var(--muted2)',marginBottom:14,paddingLeft:17}}>{s.subtitle}</div>}
          <div style={{fontSize:14,lineHeight:1.8,color:'var(--muted2)',marginBottom:14}}>{s.content}</div>
          {s.callout&&<div style={{background:'rgba(155,89,255,.08)',borderLeft:'3px solid var(--purple)',padding:'14px 18px',margin:'16px 0'}}>
            <div style={{fontSize:12,fontWeight:700,color:'var(--purple)',marginBottom:6}}>💡 {s.callout.title}</div>
            <div style={{fontSize:13,color:'var(--muted2)',lineHeight:1.65}}>{s.callout.text}</div>
          </div>}
          {s.concepts&&<div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,margin:'16px 0'}}>
            {s.concepts.map((c: any,j: number)=>(
              <div key={j} style={{background:'var(--card2)',border:'1px solid var(--border)',borderRadius:10,padding:12,textAlign:'center'}}>
                <div style={{fontSize:11,color:'var(--muted2)',marginBottom:4}}>{c.label}</div>
                <div style={{fontSize:13,fontWeight:600,fontFamily:'Syne'}}>{c.value}</div>
              </div>
            ))}
          </div>}
        </div>
      ))}
    </div>
  )
}
