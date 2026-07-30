import { useState, useEffect, useRef, useMemo } from 'react'
import { Theme, buildHueTheme, buildPresetTheme, PRESETS } from './theme'
import { Page, Folder, FormatState, Panel, SyncStatus, CustomFont, PageFormat } from './types'
import LeftPanel from './LeftPanel'
import FormatRibbon from './FormatRibbon'
import RightPanel from './RightPanel'
import FullscreenPreview from './FullscreenPreview'
import { Lang, t, LANG_LABELS, LANG_FLAGS } from './i18n'

// ── Font map ──────────────────────────────────────────────────────────────────
const FONT_FAMILIES: Record<string, string> = {
  'Lora': "'Lora', Georgia, serif",
  'Playfair Display': "'Playfair Display', Georgia, serif",
  'Merriweather': "'Merriweather', Georgia, serif",
  'EB Garamond': "'EB Garamond', Georgia, serif",
  'Libre Baskerville': "'Libre Baskerville', serif",
  'Crimson Pro': "'Crimson Pro', serif",
  'Fraunces': "'Fraunces', serif",
  'DM Serif Display': "'DM Serif Display', serif",
  'Source Sans 3': "'Source Sans 3', system-ui, sans-serif",
  'Libre Franklin': "'Libre Franklin', system-ui, sans-serif",
  'DM Sans': "'DM Sans', system-ui, sans-serif",
  'Work Sans': "'Work Sans', system-ui, sans-serif",
  'Outfit': "'Outfit', system-ui, sans-serif",
  'JetBrains Mono': "'JetBrains Mono', monospace",
  'Space Mono': "'Space Mono', monospace",
  'Courier Prime': "'Courier Prime', monospace",
  'Georgia': 'Georgia, serif',
  'Times New Roman': "'Times New Roman', serif",
  'Helvetica': "Helvetica, Arial, sans-serif",
  'Verdana': "Verdana, Geneva, sans-serif",
  'Courier New': "'Courier New', monospace",
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const INITIAL_PAGES: Page[] = [
  {
    id: 'p1',
    title: 'The Lighthouse Keeper',
    content: `The fog had settled over the coast for three days now, and Marcus had stopped expecting it to lift.

Evenings were the hardest. The lamp needed tending every two hours, and between rounds he would sit by the window and watch the darkness press itself against the glass.

On the fourth morning, a boat appeared through the grey. It moved slowly, uncertain of the channel, and Marcus lit the lamp even though it was broad day. Some signals are worth making twice.

He watched the boat correct its course. He watched it disappear around the headland. He went back inside and made coffee, and for the first time in days he did not feel alone.

The fog lifted that afternoon. He had no way of knowing if the two things were connected. He preferred to believe they were.`,
    isDraft: false,
    createdAt: '2025-01-10',
    lastModified: '2 days ago',
  },
  {
    id: 'p2',
    title: 'Notes on Solitude',
    content: `There is a particular quality of light in the late afternoon that belongs entirely to itself. Not golden, exactly. Not amber. Something slower than either.

I have been trying to name it for years. The closest I have come is this: it is the colour of attention.

When you sit very still and let the afternoon do what it does, the light stops being a backdrop and becomes a presence. The room changes. Objects become more themselves.

This is what solitude offers, if you let it: not absence, but a kind of fullness that crowds tend to thin out. A space in which things can finally be what they are.`,
    isDraft: false,
    createdAt: '2025-01-03',
    lastModified: '1 week ago',
  },
  {
    id: 'p3',
    title: 'Summer Correspondence',
    content: `Dear Elena,

I have been meaning to write for weeks now, which is to say that I have been thinking of you for weeks and doing nothing about it, which is its own kind of failing.

The summer here has been extraordinary. I mean this almost literally — outside of the ordinary, outside of what I expected summer to be when I moved here three years ago.

There are days when I sit on the terrace until the stars are fully out, just watching the valley. No agenda. No book. Just the valley and the cooling air and the sound of the town going quiet.

I hope you are well. I hope the novel is going where you need it to go. Write when you can.`,
    isDraft: true,
    createdAt: '2024-12-20',
    lastModified: '3 weeks ago',
  },
  {
    id: 'p4',
    title: 'River Town',
    content: `The town had two rivers and no bridge worth mentioning. You crossed by ferry in the morning and hoped the ferryman was sober, which he usually was, mostly.

People here measured distance in minutes, not miles. The market was fifteen minutes. The doctor was twenty. The city — when anyone spoke of the city at all — was simply "far."

I rented a room above the bakery for six months one winter. The smell of bread woke me every morning at four, and I came to think of it as a kind of alarm clock, the best kind — warm and specific and impossible to resent.`,
    isDraft: false,
    createdAt: '2024-12-01',
    lastModified: '1 month ago',
  },
]

const MOCK_FILES = INITIAL_PAGES.map(p => ({
  id: p.id,
  title: p.title,
  excerpt: p.content.slice(0, 80) + '...',
  lastModified: p.lastModified,
  wordCount: p.content.trim().split(/\s+/).length,
}))

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0
}

function getGreeting(lang: Lang): string {
  const hour = new Date().getHours()
  if (hour < 12) return t(lang, 'goodMorning')
  if (hour < 17) return t(lang, 'goodAfternoon')
  if (hour < 21) return t(lang, 'goodEvening')
  return t(lang, 'goodNight')
}

type SortKey = 'lastModified' | 'created' | 'name' | 'words'
type HomeView = 'grid' | 'list'

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState<'home' | 'editor'>('home')

  // Pages
  const [pages, setPages] = useState<Page[]>(INITIAL_PAGES)
  const [activePageId, setActivePageId] = useState('p1')

  // Layout
  const [leftOpen, setLeftOpen] = useState(true)
  const [panel, setPanel] = useState<Panel>('none')
  const [isDnd, setIsDnd] = useState(false)
  const [ribbonOpen, setRibbonOpen] = useState(true)
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false)

  // Theme
  const [hue, setHue] = useState(220)
  const [activePresetName, setActivePresetName] = useState<string | null>(null)
  const [colorOverrides, setColorOverrides] = useState<Record<string, string>>({})

  // Format
  const [formatState, setFormatState] = useState<FormatState>({
    fontFam: 'Lora',
    headingFontFam: 'Lora',
    fontSize: 18,
    lineH: 1.85,
    align: 'left',
    maxW: 660,
    paraSpacing: 1.2,
    letterSpacing: 0,
    wordSpacing: 0,
    firstLineIndent: false,
  })

  // Fonts
  const [bodyFont, setBodyFont] = useState('Lora')
  const [headingFont, setHeadingFont] = useState('Lora')
  const [uiFont, setUiFont] = useState('Source Sans 3')
  const [monoFont, setMonoFont] = useState('JetBrains Mono')
  const [customFonts, setCustomFonts] = useState<CustomFont[]>([])

  // Sync
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('saved')
  const [lastSaved, setLastSaved] = useState(new Date())
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Drive
  const [driveConnected, setDriveConnected] = useState(false)
  const [driveConnecting, setDriveConnecting] = useState(false)

  // Timer
  const [timerSet, setTimerSet] = useState(25)
  const [timerLeft, setTimerLeft] = useState(25 * 60)
  const [timerOn, setTimerOn] = useState(false)
  const [timerDone, setTimerDone] = useState(false)

  // Export
  const [copied, setCopied] = useState(false)

  // Language
  const [lang, setLang] = useState<Lang>('en')
  const [showLangMenu, setShowLangMenu] = useState(false)

  // Focus mode
  const [isFocusMode, setIsFocusMode] = useState(false)

  // Zoom
  const [zoom, setZoom] = useState(100)

  // Page format
  const [pageFormat, setPageFormat] = useState<PageFormat>({ paperSize: 'pageless', orientation: 'portrait', mode: 'pageless' })

  // Folders
  const [folders, setFolders] = useState<Folder[]>([])

  // Home view
  const [homeView, setHomeView] = useState<HomeView>('grid')
  const [sortKey, setSortKey] = useState<SortKey>('lastModified')

  // Undo/Redo
  const undoStack = useRef<string[]>([])
  const redoStack = useRef<string[]>([])

  // Bin
  const [bin, setBin] = useState<Page[]>([])

  // DnD
  const [blocks, setBlocks] = useState<string[]>([])
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // ── Active page ────────────────────────────────────────────────────────────
  const activePage = pages.find(p => p.id === activePageId) ?? pages[0]
  const content = activePage.content
  const title = activePage.title

  const setContent = (newContent: string, pushUndo = true) => {
    if (pushUndo) {
      undoStack.current = [...undoStack.current.slice(-49), content]
      redoStack.current = []
    }
    setPages(prev => prev.map(p =>
      p.id === activePageId ? { ...p, content: newContent, lastModified: 'just now' } : p
    ))
    setSyncStatus('unsaved')
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      setSyncStatus('saving')
      setTimeout(() => { setSyncStatus('saved'); setLastSaved(new Date()) }, 700)
    }, 1800)
  }

  const handleUndo = () => {
    if (undoStack.current.length === 0) return
    const prev = undoStack.current[undoStack.current.length - 1]
    undoStack.current = undoStack.current.slice(0, -1)
    redoStack.current = [content, ...redoStack.current]
    setContent(prev, false)
  }

  const handleRedo = () => {
    if (redoStack.current.length === 0) return
    const next = redoStack.current[0]
    redoStack.current = redoStack.current.slice(1)
    undoStack.current = [...undoStack.current, content]
    setContent(next, false)
  }

  const setTitle = (newTitle: string) => {
    setPages(prev => prev.map(p => p.id === activePageId ? { ...p, title: newTitle } : p))
  }

  // ── Theme ──────────────────────────────────────────────────────────────────
  const c: Theme = useMemo(() => {
    if (activePresetName) {
      const preset = PRESETS.find(p => p.name === activePresetName)!
      return buildPresetTheme(preset, colorOverrides as Parameters<typeof buildPresetTheme>[1])
    }
    const base = buildHueTheme(hue)
    if (Object.keys(colorOverrides).length > 0) {
      return {
        ...base,
        ...(colorOverrides.bg && { bg: colorOverrides.bg }),
        ...(colorOverrides.text && {
          text: colorOverrides.text,
          textMuted: colorOverrides.text + '99',
          textFaint: colorOverrides.text + '55',
        }),
        ...(colorOverrides.accent && {
          accent: colorOverrides.accent,
          accentLight: colorOverrides.accent + '20',
          accentMid: colorOverrides.accent + '88',
        }),
        ...(colorOverrides.surface && {
          surface: colorOverrides.surface,
          panel: colorOverrides.surface,
          header: colorOverrides.surface + 'e8',
        }),
        ...(colorOverrides.border && {
          border: colorOverrides.border,
          borderFaint: colorOverrides.border + '80',
        }),
      }
    }
    return base
  }, [hue, activePresetName, colorOverrides])

  // ── Focus mode keyboard shortcut ───────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F11') { e.preventDefault(); setIsFocusMode(v => !v) }
      if (e.key === 'Escape' && isFocusMode && !isFullscreenPreview) setIsFocusMode(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isFocusMode, isFullscreenPreview])

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!timerOn) return
    const id = setInterval(() => {
      setTimerLeft(t => {
        if (t <= 1) {
          setTimerOn(false)
          setTimerDone(true)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [timerOn])

  const timerMin = Math.floor(timerLeft / 60)
  const timerSec = timerLeft % 60

  // ── Font helpers ───────────────────────────────────────────────────────────
  const uiFontCss = FONT_FAMILIES[uiFont] ?? `'${uiFont}', sans-serif`
  const monoFontCss = FONT_FAMILIES[monoFont] ?? `'${monoFont}', monospace`
  const bodyFontCss = FONT_FAMILIES[bodyFont] ?? `'${bodyFont}', serif`

  const availableFontNames = [
    ...Object.keys(FONT_FAMILIES),
    ...customFonts.map(f => f.name),
  ]

  // ── Format change handler ──────────────────────────────────────────────────
  const handleFormatChange = (updates: Partial<FormatState>) => {
    setFormatState(prev => ({ ...prev, ...updates }))
    if (updates.fontFam) setBodyFont(updates.fontFam)
    if (updates.headingFontFam) setHeadingFont(updates.headingFontFam)
  }

  // ── Font upload ────────────────────────────────────────────────────────────
  const handleFontUpload = (file: File) => {
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'woff2'
      const fmt = ext === 'ttf' ? 'truetype' : ext === 'otf' ? 'opentype' : ext
      const name = file.name.replace(/\.[^.]+$/, '')
      const style = document.createElement('style')
      style.textContent = `@font-face { font-family: '${name}'; src: url('${dataUrl}') format('${fmt}'); }`
      document.head.appendChild(style)
      setCustomFonts(prev => [...prev, { id: Date.now().toString(), name, fileName: file.name }])
      FONT_FAMILIES[name] = `'${name}', sans-serif`
    }
    reader.readAsDataURL(file)
  }

  // ── Page CRUD ──────────────────────────────────────────────────────────────
  const handleNewPage = (isDraft: boolean) => {
    const id = 'p' + Date.now()
    const newPage: Page = {
      id,
      title: isDraft ? 'Draft' : 'Untitled',
      content: '',
      isDraft,
      createdAt: new Date().toISOString().split('T')[0],
      lastModified: 'just now',
    }
    setPages(prev => [...prev, newPage])
    setActivePageId(id)
  }

  const handleDeletePage = (id: string) => {
    const page = pages.find(p => p.id === id)
    if (page) setBin(prev => [{ ...page, lastModified: 'deleted just now' }, ...prev])
    setPages(prev => {
      const next = prev.filter(p => p.id !== id)
      if (activePageId === id && next.length > 0) setActivePageId(next[0].id)
      return next
    })
  }

  const handleRestorePage = (id: string) => {
    const page = bin.find(p => p.id === id)
    if (page) {
      setPages(prev => [...prev, { ...page, lastModified: 'restored just now' }])
      setBin(prev => prev.filter(p => p.id !== id))
    }
  }

  const handlePermanentDelete = (id: string) => {
    setBin(prev => prev.filter(p => p.id !== id))
  }

  const handleEmptyBin = () => setBin([])

  const handleRenamePage = (id: string, newTitle: string) => {
    setPages(prev => prev.map(p => p.id === id ? { ...p, title: newTitle } : p))
  }

  // ── Folder CRUD ───────────────────────────────────────────────────────────
  const handleCreateFolder = (parentId: string | null) => {
    const id = 'f' + Date.now()
    setFolders(prev => [...prev, { id, name: 'New Folder', parentId }])
  }
  const handleRenameFolder = (id: string, name: string) => {
    setFolders(prev => prev.map(f => f.id === id ? { ...f, name } : f))
  }
  const handleDeleteFolder = (id: string) => {
    setFolders(prev => prev.filter(f => f.id !== id && f.parentId !== id))
    setPages(prev => prev.map(p => p.folderId === id ? { ...p, folderId: undefined } : p))
  }
  const handleMovePageToFolder = (pageId: string, folderId: string | undefined) => {
    setPages(prev => prev.map(p => p.id === pageId ? { ...p, folderId } : p))
  }

  // ── Drive ──────────────────────────────────────────────────────────────────
  const handleConnectDrive = () => {
    setDriveConnecting(true)
    setTimeout(() => {
      setDriveConnecting(false)
      setDriveConnected(true)
    }, 1800)
  }

  // ── DnD ───────────────────────────────────────────────────────────────────
  const enterDnd = () => {
    setPanel('none')
    const segs = content.split(/\n\n+/).filter(s => s.trim())
    setBlocks(segs.length > 0 ? segs : [''])
    setIsDnd(true)
  }
  const exitDnd = () => {
    setContent(blocks.join('\n\n'))
    setIsDnd(false)
  }
  const handleDragStart = (i: number) => setDragIdx(i)
  const handleDragOver = (e: React.DragEvent, i: number) => { e.preventDefault(); setDragOverIdx(i) }
  const handleDrop = (i: number) => {
    if (dragIdx === null || dragIdx === i) { setDragIdx(null); setDragOverIdx(null); return }
    const nb = [...blocks]
    const [moved] = nb.splice(dragIdx, 1)
    nb.splice(i, 0, moved)
    setBlocks(nb)
    setDragIdx(null); setDragOverIdx(null)
  }
  const handleDragEnd = () => { setDragIdx(null); setDragOverIdx(null) }

  // ── Open editor ────────────────────────────────────────────────────────────
  const openEditor = (pageId?: string) => {
    if (pageId) setActivePageId(pageId)
    setView('editor')
    setPanel('none')
    setIsDnd(false)
  }

  const openNewEditor = () => {
    handleNewPage(false)
    setView('editor')
    setPanel('none')
    setIsDnd(false)
  }

  // ── Import ─────────────────────────────────────────────────────────────────
  const handleImport = () => {
    const inp = document.createElement('input')
    inp.type = 'file'; inp.accept = '.txt,.md'
    inp.onchange = (e) => {
      const f = (e.target as HTMLInputElement).files?.[0]
      if (!f) return
      const r = new FileReader()
      r.onload = (ev) => {
        const id = 'p' + Date.now()
        const newPage: Page = {
          id,
          title: f.name.replace(/\.(txt|md)$/, ''),
          content: ev.target?.result as string ?? '',
          isDraft: false,
          createdAt: new Date().toISOString().split('T')[0],
          lastModified: 'just now',
        }
        setPages(prev => [...prev, newPage])
        setActivePageId(id)
        setView('editor')
        setPanel('none')
        setIsDnd(false)
      }
      r.readAsText(f)
    }
    inp.click()
  }

  const togglePanel = (p: Exclude<Panel, 'none'>) => {
    if (isDnd) exitDnd()
    setPanel(prev => prev === p ? 'none' : p)
  }

  // ── Counts ─────────────────────────────────────────────────────────────────
  const wc = countWords(content)
  const cc = content.length

  // ── Styles ─────────────────────────────────────────────────────────────────
  const toolbarBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '4px 7px', borderRadius: 5,
    border: `1px solid ${active ? c.accent : c.border}`,
    background: active ? c.accentLight : 'transparent',
    fontFamily: uiFontCss, fontSize: '0.74rem',
    color: active ? c.accent : c.textMuted,
    fontWeight: active ? 600 : 400,
    cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
  })

  // ── HOME ───────────────────────────────────────────────────────────────────
  if (view === 'home') return (
    <div style={{ minHeight: '100vh', background: c.bg, color: c.text, fontFamily: uiFontCss }}>

      {/* Header */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: c.header, backdropFilter: 'blur(14px)',
        borderBottom: `1px solid ${c.borderFaint}`,
        height: 56, padding: '0 2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: `linear-gradient(135deg, ${c.accent}, ${c.accentMid})`,
            flexShrink: 0,
          }} />
          <span style={{ fontFamily: FONT_FAMILIES['Lora'], fontSize: '1.08rem', fontWeight: 600, letterSpacing: '-0.02em', color: c.text }}>
            Prose
          </span>
        </div>
        <div />
      </header>

      {/* Compact greeting bar */}
      <div style={{ paddingTop: 56, background: c.heroGrad, borderBottom: `1px solid ${c.borderFaint}` }}>
        <div style={{ maxWidth: 1020, margin: '0 auto', padding: '0.9rem 2.5rem', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: FONT_FAMILIES['Lora'], fontSize: '1rem', fontWeight: 600, color: c.text, whiteSpace: 'nowrap' }}>
            {getGreeting(lang)}.
          </span>
          <span style={{ fontSize: '0.74rem', color: c.textFaint, flex: 1 }}>
            {pages.length} {t(lang, 'documents')} · {pages.reduce((sum, p) => sum + (p.content.trim() ? p.content.trim().split(/\s+/).length : 0), 0).toLocaleString()} {t(lang, 'words')}
          </span>
          <button onClick={openNewEditor} style={{ padding: '0.42rem 1rem', borderRadius: 7, background: c.accent, color: 'white', border: 'none', fontFamily: uiFontCss, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.84')} onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
            + {t(lang, 'newDocument')}
          </button>
          <button onClick={() => handleCreateFolder(null)} style={{ padding: '0.42rem 1rem', borderRadius: 7, background: 'transparent', color: c.text, border: `1.5px solid ${c.border}`, fontFamily: uiFontCss, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = c.accentMid)} onMouseLeave={e => (e.currentTarget.style.borderColor = c.border)}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M1 3.5A1.5 1.5 0 012.5 2H6l1.5 2H13.5A1.5 1.5 0 0115 5.5v7A1.5 1.5 0 0113.5 14h-11A1.5 1.5 0 011 12.5V3.5z"/></svg>
            New Folder
          </button>
          <button onClick={handleImport} style={{ padding: '0.42rem 1rem', borderRadius: 7, background: 'transparent', color: c.text, border: `1.5px solid ${c.border}`, fontFamily: uiFontCss, fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = c.accentMid)} onMouseLeave={e => (e.currentTarget.style.borderColor = c.border)}>
            {t(lang, 'importFile')}
          </button>
        </div>
      </div>

      {/* File dashboard */}
      <section style={{ maxWidth: 1020, margin: '0 auto', padding: '1.5rem 2.5rem 4rem' }}>
        {/* Toolbar row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: 8 }}>
          <h2 style={{ fontFamily: FONT_FAMILIES['Lora'], fontSize: '1.08rem', fontWeight: 600, color: c.text }}>{t(lang, 'recentFiles')}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Sort */}
            <select value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)} style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${c.border}`, background: c.surface, fontFamily: uiFontCss, fontSize: '0.72rem', color: c.textMuted, cursor: 'pointer', outline: 'none' }}>
              <option value="lastModified">Last modified</option>
              <option value="created">Date created</option>
              <option value="name">Name</option>
              <option value="words">Word count</option>
            </select>
            {/* View toggle */}
            <div style={{ display: 'flex', borderRadius: 6, border: `1px solid ${c.border}`, overflow: 'hidden' }}>
              {(['grid', 'list'] as const).map(v => (
                <button key={v} onClick={() => setHomeView(v)} style={{ padding: '4px 9px', background: homeView === v ? c.accentLight : 'transparent', border: 'none', cursor: 'pointer', color: homeView === v ? c.accent : c.textMuted, fontSize: '0.78rem', transition: 'all 0.12s' }}>
                  {v === 'grid' ? '⊞' : '☰'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* File list computed from live pages */}
        {(() => {
          const fileList = pages.map(p => ({
            id: p.id, title: p.title, isDraft: p.isDraft,
            excerpt: p.content.slice(0, 90) + (p.content.length > 90 ? '...' : ''),
            lastModified: p.lastModified, createdAt: p.createdAt,
            wordCount: p.content.trim() ? p.content.trim().split(/\s+/).length : 0,
          }))
          const sorted = [...fileList].sort((a, b) => {
            if (sortKey === 'name') return a.title.localeCompare(b.title)
            if (sortKey === 'words') return b.wordCount - a.wordCount
            if (sortKey === 'created') return b.createdAt.localeCompare(a.createdAt)
            return 0
          })
          if (homeView === 'grid') return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '1rem' }}>
              {sorted.map(file => (
                <button key={file.id} onClick={() => openEditor(file.id)} style={{ textAlign: 'left', background: c.cardGrad, border: `1px solid ${c.borderFaint}`, borderRadius: 12, padding: '1.2rem', cursor: 'pointer', transition: 'transform 0.18s, box-shadow 0.18s, border-color 0.18s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.1)'; e.currentTarget.style.borderColor = c.accentMid }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = c.borderFaint }}>
                  <div style={{ height: 3, borderRadius: 2, marginBottom: '1rem', background: `linear-gradient(90deg, ${c.accent}, ${c.accentMid})` }} />
                  <div style={{ fontFamily: FONT_FAMILIES['Lora'], fontSize: '0.9rem', fontWeight: 600, color: c.text, marginBottom: '0.4rem', lineHeight: 1.3 }}>{file.title}</div>
                  <div style={{ fontSize: '0.72rem', color: c.textMuted, lineHeight: 1.5, marginBottom: '0.9rem' }}>{file.excerpt}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: monoFontCss, fontSize: '0.65rem', color: c.accent, fontWeight: 500 }}>{file.wordCount.toLocaleString()} w</span>
                    <span style={{ fontSize: '0.65rem', color: c.textFaint }}>{file.lastModified}</span>
                  </div>
                </button>
              ))}
            </div>
          )
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {sorted.map(file => (
                <button key={file.id} onClick={() => openEditor(file.id)} style={{ textAlign: 'left', background: 'transparent', border: `1px solid transparent`, borderRadius: 8, padding: '0.75rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, transition: 'background 0.14s, border-color 0.14s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = c.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'; e.currentTarget.style.borderColor = c.borderFaint }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' }}>
                  <div style={{ width: 3, height: 38, borderRadius: 2, background: `linear-gradient(to bottom, ${c.accent}, ${c.accentMid})`, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: FONT_FAMILIES['Lora'], fontSize: '0.88rem', fontWeight: 600, color: c.text, marginBottom: 2 }}>{file.title}</div>
                    <div style={{ fontSize: '0.7rem', color: c.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.excerpt}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
                    <span style={{ fontFamily: monoFontCss, fontSize: '0.64rem', color: c.accent }}>{file.wordCount.toLocaleString()} w</span>
                    <span style={{ fontSize: '0.64rem', color: c.textFaint }}>{file.lastModified}</span>
                  </div>
                </button>
              ))}
            </div>
          )
        })()}
      </section>
    </div>
  )

  // ── EDITOR ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: c.bg, color: c.text }}>

      {/* Toolbar */}
      <div style={{
        height: 50, flexShrink: 0,
        background: c.header, backdropFilter: 'blur(14px)',
        borderBottom: `1px solid ${c.borderFaint}`,
        display: 'flex', alignItems: 'center', gap: 3,
        padding: '0 10px', zIndex: 20,
      }}>
        {/* Left group */}
        <button
          onClick={() => setLeftOpen(v => !v)}
          title="Sidebar"
          style={toolbarBtnStyle(leftOpen)}
        >
          ☰
        </button>

        <button
          onClick={() => { setView('home'); setPanel('none'); setIsDnd(false) }}
          style={{ ...toolbarBtnStyle(false), fontSize: '0.9rem' }}
          title="Back to home"
        >
          ←
        </button>

        <div style={{ width: 1, height: 16, background: c.borderFaint, margin: '0 2px' }} />

        {/* Title */}
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={{
            flex: 1, minWidth: 0, textAlign: 'center',
            fontFamily: FONT_FAMILIES['Lora'], fontSize: '0.9rem', fontWeight: 600,
            color: c.text, background: 'transparent', border: 'none', outline: 'none',
          }}
        />

        <div style={{ width: 1, height: 16, background: c.borderFaint, margin: '0 2px' }} />

        {/* Right group */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
          {/* Ribbon toggle */}
          <button
            onClick={() => setRibbonOpen(v => !v)}
            title="Format ribbon"
            style={toolbarBtnStyle(ribbonOpen)}
          >
            T
          </button>

          <div style={{ width: 1, height: 16, background: c.borderFaint, margin: '0 2px' }} />

          {/* Arrange */}
          <button onClick={isDnd ? exitDnd : enterDnd} style={toolbarBtnStyle(isDnd)} title="Arrange">
            ⠿
          </button>

          {/* Timer shortcut — opens dashboard to timer tab */}
          <button
            onClick={() => setPanel(prev => prev === 'timer' ? 'none' : 'timer')}
            style={toolbarBtnStyle(panel === 'timer')}
            title="Timer"
          >
            ◷
          </button>

          {/* Preview */}
          <button onClick={() => setIsFullscreenPreview(true)} style={toolbarBtnStyle(isFullscreenPreview)} title="Preview">
            ⊙
          </button>

          {/* Focus mode */}
          <button onClick={() => setIsFocusMode(v => !v)} style={toolbarBtnStyle(isFocusMode)} title="Focus mode (F11)">
            {isFocusMode ? '◉' : '◎'}
          </button>

          <div style={{ width: 1, height: 16, background: c.borderFaint, margin: '0 2px' }} />

          {/* Dashboard toggle — opens right panel to last active section */}
          <button
            onClick={() => {
              if (panel === 'none') {
                setPanel('format')
              } else if (panel === 'timer') {
                setPanel('none')
              } else {
                setPanel('none')
              }
            }}
            style={toolbarBtnStyle(panel !== 'none' && panel !== 'timer')}
            title="Dashboard"
          >
            ⊞
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'visible', minHeight: 0 }}>

        {/* Left panel */}
        {leftOpen && (
          <LeftPanel
            c={c}
            uiFont={uiFontCss}
            monoFont={monoFontCss}
            pages={pages}
            activePageId={activePageId}
            onSelectPage={setActivePageId}
            onNewPage={handleNewPage}
            onDeletePage={handleDeletePage}
            onRenamePage={handleRenamePage}
            syncStatus={syncStatus}
            lastSaved={lastSaved}
            driveConnected={driveConnected}
            driveConnecting={driveConnecting}
            onConnectDrive={handleConnectDrive}
            onDisconnectDrive={() => setDriveConnected(false)}
            bin={bin}
            onRestorePage={handleRestorePage}
            onPermanentDelete={handlePermanentDelete}
            onEmptyBin={handleEmptyBin}
            lang={lang}
            folders={folders}
            onCreateFolder={handleCreateFolder}
            onRenameFolder={handleRenameFolder}
            onDeleteFolder={handleDeleteFolder}
            onMovePageToFolder={handleMovePageToFolder}
          />
        )}

        {/* Center */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0 }}>

          {/* Format ribbon */}
          {ribbonOpen && !isDnd && (
            <FormatRibbon
              c={c}
              uiFont={uiFontCss}
              bodyFont={bodyFontCss}
              formatState={formatState}
              onFormatChange={handleFormatChange}
              textareaRef={textareaRef}
              content={content}
              onContentChange={setContent}
              availableFontNames={availableFontNames}
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={undoStack.current.length > 0}
              canRedo={redoStack.current.length > 0}
            />
          )}

          {/* Writing area */}
          <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>

            {/* Top fade overlay */}
            <div style={{
              position: 'sticky', top: 0, left: 0, right: 0, height: 48,
              zIndex: 4, pointerEvents: 'none',
              background: c.isDark
                ? 'linear-gradient(to bottom, rgba(20,20,30,0.65) 0%, transparent 100%)'
                : 'linear-gradient(to bottom, rgba(248,248,252,0.8) 0%, transparent 100%)',
              marginBottom: -48,
            }} />

            {/* Write mode */}
            {!isDnd && (
              <div style={{ padding: '4rem 2rem 6rem', display: 'flex', justifyContent: 'center', minHeight: '100%', zoom: zoom / 100 }}>
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Begin writing..."
                  spellCheck
                  style={{
                    width: '100%', maxWidth: formatState.maxW,
                    minHeight: 'calc(100vh - 200px)',
                    fontFamily: FONT_FAMILIES[bodyFont] ?? `'${bodyFont}', serif`,
                    fontSize: formatState.fontSize,
                    lineHeight: formatState.lineH,
                    textAlign: formatState.align,
                    letterSpacing: `${formatState.letterSpacing}px`,
                    wordSpacing: `${formatState.wordSpacing}px`,
                    color: c.text,
                    background: 'transparent',
                    border: 'none', outline: 'none', resize: 'none',
                    caretColor: c.accent,
                  }}
                />
              </div>
            )}

            {/* DnD mode */}
            {isDnd && (
              <div style={{ padding: '3rem 2rem 5rem', display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: '100%', maxWidth: formatState.maxW }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <span style={{ fontFamily: uiFontCss, fontSize: '0.68rem', color: c.textFaint, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Drag sections to reorder
                    </span>
                    <button
                      onClick={exitDnd}
                      style={{ padding: '5px 14px', borderRadius: 6, background: c.accent, color: 'white', border: 'none', fontFamily: uiFontCss, fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Done
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {blocks.map((block, i) => (
                      <div
                        key={i} draggable
                        onDragStart={() => handleDragStart(i)}
                        onDragOver={e => handleDragOver(e, i)}
                        onDrop={() => handleDrop(i)}
                        onDragEnd={handleDragEnd}
                        style={{ display: 'flex', gap: 10, alignItems: 'flex-start', opacity: dragIdx === i ? 0.3 : 1, transition: 'opacity 0.12s' }}
                      >
                        <div
                          style={{ paddingTop: '0.9rem', color: c.textFaint, cursor: 'grab', userSelect: 'none', flexShrink: 0, fontSize: '0.9rem', lineHeight: 1, transition: 'color 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.color = c.accent)}
                          onMouseLeave={e => (e.currentTarget.style.color = c.textFaint)}
                        >
                          ⠿
                        </div>
                        <div style={{
                          flex: 1, borderRadius: 9, padding: '0.9rem 1.1rem',
                          fontFamily: bodyFontCss, fontSize: formatState.fontSize - 1,
                          lineHeight: formatState.lineH, color: c.text,
                          background: dragOverIdx === i && dragIdx !== i ? c.accentLight : c.surface,
                          border: `1px solid ${dragOverIdx === i && dragIdx !== i ? c.accentMid : c.borderFaint}`,
                          transition: 'background 0.15s, border-color 0.15s',
                          cursor: 'grab',
                        }}>
                          {block}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Bottom fade overlay */}
            <div style={{
              position: 'sticky', bottom: 0, left: 0, right: 0, height: 48,
              zIndex: 4, pointerEvents: 'none',
              background: c.isDark
                ? 'linear-gradient(to top, rgba(20,20,30,0.65) 0%, transparent 100%)'
                : 'linear-gradient(to top, rgba(248,248,252,0.8) 0%, transparent 100%)',
              marginTop: -48,
            }} />
          </div>
        </div>

        {/* Right panel — always rendered, animates in/out via width */}
        <RightPanel
          c={c}
          uiFont={uiFontCss}
          monoFont={monoFontCss}
          panel={panel}
          onClose={() => setPanel('none')}
          onSectionChange={(s) => setPanel(s as Panel)}
          formatState={formatState}
          onFormatChange={handleFormatChange}
          textareaRef={textareaRef}
          content={content}
          onContentChange={setContent}
          availableFontNames={availableFontNames}
          title={title}
          wordCount={wc}
          charCount={cc}
          timerSet={timerSet}
          timerLeft={timerLeft}
          timerOn={timerOn}
          timerDone={timerDone}
          onTimerSetChange={v => { setTimerSet(v); if (!timerOn) setTimerLeft(v * 60) }}
          onTimerToggle={() => setTimerOn(v => !v)}
          onTimerReset={() => { setTimerOn(false); setTimerLeft(timerSet * 60); setTimerDone(false) }}
          hue={hue}
          onHueChange={setHue}
          activePresetName={activePresetName}
          onPresetSelect={setActivePresetName}
          colorOverrides={colorOverrides}
          onColorOverride={(key, val) => setColorOverrides(prev => ({ ...prev, [key]: val }))}
          onColorReset={() => { setColorOverrides({}); setActivePresetName(null) }}
          bodyFont={bodyFont}
          headingFont={headingFont}
          uiFont2={uiFont}
          monoFont2={monoFont}
          customFonts={customFonts}
          onFontAssign={(role, name) => {
            if (role === 'body') { setBodyFont(name); setFormatState(prev => ({ ...prev, fontFam: name })) }
            if (role === 'heading') { setHeadingFont(name); setFormatState(prev => ({ ...prev, headingFontFam: name })) }
            if (role === 'ui') setUiFont(name)
            if (role === 'mono') setMonoFont(name)
          }}
          onFontUpload={handleFontUpload}
          onFontDelete={id => setCustomFonts(prev => prev.filter(f => f.id !== id))}
          onFontLoad={(name: string) => { if (!FONT_FAMILIES[name]) FONT_FAMILIES[name] = `'${name}', serif` }}
          pageFormat={pageFormat}
          onPageFormatChange={setPageFormat}
          lang={lang}
          onLangChange={setLang}
        />
      </div>

      {/* Status bar */}
      <div style={{
        height: 30, flexShrink: 0,
        background: c.status,
        borderTop: `1px solid ${c.borderFaint}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 1.5rem',
      }}>
        <div style={{ display: 'flex', gap: '1.25rem' }}>
          <span style={{ fontFamily: monoFontCss, fontSize: '0.66rem', color: c.textFaint }}>{wc.toLocaleString()} words</span>
          <span style={{ fontFamily: monoFontCss, fontSize: '0.66rem', color: c.textFaint }}>{cc.toLocaleString()} chars</span>
          {activePage.isDraft && (
            <span style={{ fontFamily: uiFontCss, fontSize: '0.66rem', color: c.accentMid }}>Draft</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {/* Zoom control */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <button
              onClick={() => setZoom(z => Math.max(50, Math.round((z - 10) / 10) * 10))}
              style={{
                width: 18, height: 18, borderRadius: 3, border: `1px solid ${c.borderFaint}`,
                background: 'none', color: c.textFaint, fontSize: '0.72rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                lineHeight: 1, padding: 0,
              }}
            >−</button>
            <input
              type="number"
              value={zoom}
              min={50} max={200}
              onChange={e => {
                const v = Number(e.target.value)
                if (v >= 50 && v <= 200) setZoom(v)
              }}
              style={{
                width: 36, padding: '1px 2px', textAlign: 'center',
                fontFamily: monoFontCss, fontSize: '0.64rem', color: c.textFaint,
                background: 'transparent', border: `1px solid ${c.borderFaint}`,
                borderRadius: 3, outline: 'none',
              }}
            />
            <span style={{ fontFamily: monoFontCss, fontSize: '0.64rem', color: c.textFaint }}>%</span>
            <button
              onClick={() => setZoom(z => Math.min(200, Math.round((z + 10) / 10) * 10))}
              style={{
                width: 18, height: 18, borderRadius: 3, border: `1px solid ${c.borderFaint}`,
                background: 'none', color: c.textFaint, fontSize: '0.72rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                lineHeight: 1, padding: 0,
              }}
            >+</button>
          </div>
          {timerOn && (
            <span style={{ fontFamily: monoFontCss, fontSize: '0.66rem', color: c.accent, fontWeight: 500 }}>
              ◷ {String(timerMin).padStart(2, '0')}:{String(timerSec).padStart(2, '0')}
            </span>
          )}
          {isDnd && (
            <span style={{ fontFamily: uiFontCss, fontSize: '0.66rem', color: c.accent }}>
              Arrange mode
            </span>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: syncStatus === 'saved' ? '#4caf72' : syncStatus === 'saving' ? '#f0a030' : syncStatus === 'error' ? '#e05050' : c.textFaint,
              transition: 'background 0.3s',
            }} />
            <span style={{ fontFamily: uiFontCss, fontSize: '0.66rem', color: c.textFaint }}>
              {syncStatus === 'saved' ? 'Saved' : syncStatus === 'saving' ? 'Saving...' : syncStatus === 'error' ? 'Error' : 'Unsaved'}
            </span>
          </div>
        </div>
      </div>

      {/* Focus mode overlay */}
      {isFocusMode && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 500,
          background: c.bg,
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Full-height writing area */}
          <div style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', padding: '4rem 2rem 8rem', zoom: zoom / 100 }}>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Begin writing..."
              spellCheck
              autoFocus
              style={{
                width: '100%', maxWidth: formatState.maxW,
                minHeight: 'calc(100vh - 200px)',
                fontFamily: FONT_FAMILIES[bodyFont] ?? `'${bodyFont}', serif`,
                fontSize: formatState.fontSize,
                lineHeight: formatState.lineH,
                textAlign: formatState.align,
                letterSpacing: `${formatState.letterSpacing}px`,
                wordSpacing: `${formatState.wordSpacing}px`,
                color: c.text,
                background: 'transparent',
                border: 'none', outline: 'none', resize: 'none',
                caretColor: c.accent,
              }}
            />
          </div>
          {/* Floating status bar */}
          <div style={{
            position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
            background: c.isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.75)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${c.borderFaint}`,
            borderRadius: 20, padding: '6px 16px',
            display: 'flex', alignItems: 'center', gap: 14,
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          }}>
            <span style={{ fontFamily: monoFontCss, fontSize: '0.68rem', color: c.textMuted }}>{wc.toLocaleString()} {t(lang, 'words')}</span>
            {timerOn && (
              <span style={{ fontFamily: monoFontCss, fontSize: '0.68rem', color: c.accent }}>
                ◷ {String(timerMin).padStart(2, '0')}:{String(timerSec).padStart(2, '0')}
              </span>
            )}
            <button
              onClick={() => setIsFocusMode(false)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: uiFontCss, fontSize: '0.72rem', color: c.textFaint,
                transition: 'color 0.12s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = c.accent)}
              onMouseLeave={e => (e.currentTarget.style.color = c.textFaint)}
            >
              {t(lang, 'exitFocus')} ×
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen preview */}
      {isFullscreenPreview && (
        <FullscreenPreview
          c={c}
          pages={pages}
          activePageId={activePageId}
          formatState={formatState}
          bodyFont={bodyFont}
          headingFont={headingFont}
          onClose={() => setIsFullscreenPreview(false)}
        />
      )}

      {/* Suppress unused warning */}
      {copied && null}
    </div>
  )
}
