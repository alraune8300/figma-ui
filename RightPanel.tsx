import { useState, useRef } from 'react'
import { Theme, PRESETS } from './theme'
import { Panel, FormatState, CustomFont, PageFormat } from './types'
import ColorWheel from './ColorWheel'
import GoogleFontsPanel from './GoogleFontsPanel'
import { Lang, t, LANG_LABELS, LANG_FLAGS } from './i18n'

interface RightPanelProps {
  c: Theme
  uiFont: string
  monoFont: string
  panel: Panel
  onClose: () => void
  onSectionChange: (s: string) => void
  // Format
  formatState: FormatState
  onFormatChange: (updates: Partial<FormatState>) => void
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  content: string
  onContentChange: (content: string) => void
  availableFontNames: string[]
  // Export
  title: string
  wordCount: number
  charCount: number
  // Timer
  timerSet: number
  timerLeft: number
  timerOn: boolean
  timerDone: boolean
  onTimerSetChange: (v: number) => void
  onTimerToggle: () => void
  onTimerReset: () => void
  // Colors
  hue: number
  onHueChange: (h: number) => void
  activePresetName: string | null
  onPresetSelect: (name: string | null) => void
  colorOverrides: Record<string, string>
  onColorOverride: (key: string, value: string) => void
  onColorReset: () => void
  // Fonts
  bodyFont: string
  headingFont: string
  uiFont2: string
  monoFont2: string
  customFonts: CustomFont[]
  onFontAssign: (role: 'body' | 'heading' | 'ui' | 'mono', fontName: string) => void
  onFontUpload: (file: File) => void
  onFontDelete: (id: string) => void
  onFontLoad?: (name: string) => void
  pageFormat: PageFormat
  onPageFormatChange: (pf: PageFormat) => void
  lang: Lang
  onLangChange: (l: Lang) => void
}

const SERIF_FONTS = ['Lora', 'Playfair Display', 'Merriweather', 'EB Garamond', 'Libre Baskerville', 'Crimson Pro', 'Fraunces', 'DM Serif Display', 'Georgia', 'Times New Roman']
const SANS_FONTS = ['Source Sans 3', 'Libre Franklin', 'DM Sans', 'Work Sans', 'Outfit', 'Helvetica', 'Verdana']
const MONO_FONTS = ['JetBrains Mono', 'Space Mono', 'Courier Prime', 'Courier New']

function SectionLabel({ label, uiFont, c }: { label: string, uiFont: string, c: Theme }) {
  return (
    <div style={{
      fontFamily: uiFont, fontSize: '0.6rem', fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.12em',
      color: c.textFaint, marginBottom: 8, marginTop: 4,
    }}>
      {label}
    </div>
  )
}

function Accordion({ title, uiFont, c, children, defaultOpen = false }: { title: string, uiFont: string, c: Theme, children: React.ReactNode, defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ borderBottom: `1px solid ${c.borderFaint}` }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', padding: '10px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: uiFont, fontSize: '0.76rem', fontWeight: 600, color: c.text,
          transition: 'color 0.12s',
        }}
      >
        {title}
        <span style={{ fontSize: '0.65rem', color: c.textFaint, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
      </button>
      {open && <div style={{ paddingBottom: 14 }}>{children}</div>}
    </div>
  )
}

export default function RightPanel({
  c, uiFont, monoFont, panel, onClose, onSectionChange,
  formatState, onFormatChange, textareaRef, content, onContentChange, availableFontNames,
  title, wordCount, charCount,
  timerSet, timerLeft, timerOn, timerDone, onTimerSetChange, onTimerToggle, onTimerReset,
  hue, onHueChange, activePresetName, onPresetSelect, colorOverrides, onColorOverride, onColorReset,
  bodyFont, headingFont, uiFont2, monoFont2, customFonts, onFontAssign, onFontUpload, onFontDelete,
  onFontLoad, pageFormat, onPageFormatChange, lang, onLangChange,
}: RightPanelProps) {
  const [copied, setCopied] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [activeRole, setActiveRole] = useState<'body' | 'heading' | 'ui' | 'mono'>('body')
  const [showColorWheel, setShowColorWheel] = useState(false)
  const [showGoogleFonts, setShowGoogleFonts] = useState(false)
  const [gradColor1, setGradColor1] = useState('#667eea')
  const [gradColor2, setGradColor2] = useState('#764ba2')
  const [gradAngle, setGradAngle] = useState(135)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const timerMin = Math.floor(timerLeft / 60)
  const timerSec = timerLeft % 60
  const timerProgress = timerSet > 0 ? (timerSet * 60 - timerLeft) / (timerSet * 60) : 0
  const R = 52
  const CIRC = 2 * Math.PI * R

  const readMin = Math.ceil(wordCount / 200)

  const panelTitle: Record<Exclude<Panel, 'none'>, string> = {
    format: t(lang, 'format'),
    export: t(lang, 'export'),
    preview: t(lang, 'preview2'),
    timer: t(lang, 'focusTimer'),
    colors: t(lang, 'colors'),
    fonts: t(lang, 'fonts'),
    importexport: 'Import / Export',
    settings: '⚙ Settings',
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2200)
  }

  const handlePrintPDF = () => {
    const existing = document.getElementById('prose-print-style')
    if (existing) existing.remove()
    const style = document.createElement('style')
    style.id = 'prose-print-style'
    style.textContent = `@media print { body > *:not(#prose-print-content) { display: none !important; } #prose-print-content { display: block !important; } }`
    document.head.appendChild(style)
    const printDiv = document.createElement('div')
    printDiv.id = 'prose-print-content'
    printDiv.style.cssText = 'display:none; font-family: serif; font-size: 12pt; line-height: 1.6; padding: 2cm; max-width: 21cm; margin: 0 auto;'
    printDiv.innerHTML = `<h1>${title}</h1>` + content.split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('')
    document.body.appendChild(printDiv)
    window.print()
    setTimeout(() => {
      const s = document.getElementById('prose-print-style')
      const d = document.getElementById('prose-print-content')
      if (s) s.remove()
      if (d) d.remove()
    }, 1000)
  }

  const handleDownload = (ext: 'txt' | 'md' | 'html') => {
    let body = content
    if (ext === 'html') {
      body = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title></head><body><h1>${title}</h1>${content.split(/\n\n+/).map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('')}</body></html>`
    }
    const blob = new Blob([body], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${title}.${ext}`; a.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadDocx = () => {
    const htmlContent = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>${title}</title>
<!--[if gte mso 9]>
<xml><w:WordDocument><w:View>Print</w:View><w:Zoom>90</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml>
<![endif]-->
<style>
  body { font-family: "Times New Roman", serif; font-size: 12pt; line-height: 1.6; margin: 2cm; }
  h1 { font-size: 18pt; } h2 { font-size: 15pt; } h3 { font-size: 13pt; }
  p { margin-bottom: 12pt; }
  blockquote { margin-left: 2em; font-style: italic; }
</style>
</head>
<body>
<h1>${title}</h1>
${content.split('\n\n').map(para => {
  const p = para.trim()
  if (p.startsWith('# ')) return `<h1>${p.slice(2)}</h1>`
  if (p.startsWith('## ')) return `<h2>${p.slice(3)}</h2>`
  if (p.startsWith('### ')) return `<h3>${p.slice(4)}</h3>`
  if (p.startsWith('> ')) return `<blockquote><p>${p.slice(2)}</p></blockquote>`
  const html = p
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/~~(.+?)~~/g, '<s>$1</s>')
    .replace(/\n/g, '<br>')
  return `<p>${html}</p>`
}).join('\n')}
</body>
</html>`
    const blob = new Blob(['﻿', htmlContent], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${title}.doc`; a.click()
    URL.revokeObjectURL(url)
  }

  const applyLinePrefix = (prefix: string) => {
    const ta = textareaRef.current
    if (!ta) return
    const start = content.lastIndexOf('\n', ta.selectionStart - 1) + 1
    const end = content.indexOf('\n', ta.selectionStart)
    const lineEnd = end === -1 ? content.length : end
    const line = content.slice(start, lineEnd)
    const stripped = line.replace(/^(#{1,4} |> |```\n?|- |\d+\. )/, '')
    const newLine = prefix + stripped
    const newContent = content.slice(0, start) + newLine + content.slice(lineEnd)
    onContentChange(newContent)
    requestAnimationFrame(() => {
      ta.focus()
      const newCaret = start + newLine.length
      ta.setSelectionRange(newCaret, newCaret)
    })
  }

  const label = (text: string) => (
    <label style={{
      fontFamily: uiFont, fontSize: '0.66rem', color: c.textFaint,
      textTransform: 'uppercase' as const, letterSpacing: '0.08em',
      display: 'flex', justifyContent: 'space-between', marginBottom: 7,
    }}>
      <span>{text}</span>
    </label>
  )

  // Number stepper with +/- and no browser spinners
  const numInput = (
    val: number, min: number, max: number, step: number, unit: string,
    onChange: (v: number) => void,
    decimals = 0
  ) => {
    const fmt = (n: number) => decimals > 0 ? n.toFixed(decimals) : String(n)
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button onClick={() => onChange(Math.max(min, Math.round((val - step) / step) * step))}
          style={{ width: 22, height: 22, borderRadius: 4, border: `1px solid ${c.borderFaint}`, background: 'none', color: c.textMuted, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, lineHeight: 1, padding: 0 }}>−</button>
        <input
          type="number" min={min} max={max} step={step} value={fmt(val)}
          className="no-spin"
          onChange={e => {
            const v = parseFloat(e.target.value)
            if (!isNaN(v) && v >= min && v <= max) onChange(v)
          }}
          style={{ flex: 1, padding: '3px 4px', textAlign: 'center', fontFamily: monoFont, fontSize: '0.72rem', color: c.text, background: 'transparent', border: `1px solid ${c.borderFaint}`, borderRadius: 4, outline: 'none', minWidth: 0 }}
        />
        <span style={{ fontFamily: uiFont, fontSize: '0.64rem', color: c.textFaint, flexShrink: 0 }}>{unit}</span>
        <button onClick={() => onChange(Math.min(max, Math.round((val + step) / step) * step))}
          style={{ width: 22, height: 22, borderRadius: 4, border: `1px solid ${c.borderFaint}`, background: 'none', color: c.textMuted, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, lineHeight: 1, padding: 0 }}>+</button>
      </div>
    )
  }

  const fontSelect = (value: string, onChange: (v: string) => void) => (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%', padding: '5px 8px', borderRadius: 6,
        border: `1px solid ${c.border}`, background: c.surface,
        fontFamily: `'${value}', serif`, fontSize: '0.82rem', color: c.text,
        cursor: 'pointer', outline: 'none',
        appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23888'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center',
        paddingRight: 24,
      }}
    >
      {availableFontNames.map(n => <option key={n} value={n}>{n}</option>)}
    </select>
  )

  const isOpen = panel !== 'none'

  const TABS: { key: Exclude<Panel, 'none' | 'preview' | 'importexport'>; icon: string; label: string }[] = [
    { key: 'format', icon: '¶', label: 'Format' },
    { key: 'export', icon: '↓', label: 'Export' },
    { key: 'colors', icon: '◉', label: 'Colors' },
    { key: 'fonts', icon: 'Aa', label: 'Fonts' },
    { key: 'timer', icon: '◷', label: 'Timer' },
    { key: 'settings', icon: '⚙', label: 'Settings' },
  ]

  return (
    <div style={{
      width: isOpen ? 300 : 0,
      flexShrink: 0,
      display: 'flex',
      overflow: 'hidden',
      transition: 'width 0.22s ease',
      borderLeft: isOpen ? `1px solid ${c.borderFaint}` : 'none',
    }}>
      {isOpen && (
        <div style={{ width: 300, display: 'flex', flexShrink: 0, flexDirection: 'row', background: c.panel, overflow: 'hidden' }}>
          {/* Vertical tab strip */}
          <div style={{
            width: 40, flexShrink: 0,
            background: c.isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.04)',
            borderRight: `1px solid ${c.borderFaint}`,
            display: 'flex', flexDirection: 'column',
            paddingTop: 8,
          }}>
            {TABS.map(tab => {
              const active = panel === tab.key
              return (
                <button
                  key={tab.key}
                  title={tab.label}
                  onClick={() => onSectionChange(tab.key)}
                  style={{
                    width: 40, height: 40,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: 'none',
                    background: active ? c.accentLight : 'none',
                    color: active ? c.accent : c.textFaint,
                    cursor: 'pointer', fontSize: '0.8rem',
                    borderLeft: `2px solid ${active ? c.accent : 'transparent'}`,
                    transition: 'all 0.12s',
                    flexShrink: 0,
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = c.text }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.color = c.textFaint }}
                >
                  {tab.icon}
                </button>
              )
            })}
            <div style={{ flex: 1 }} />
            <button
              title="Close panel"
              onClick={onClose}
              style={{
                width: 40, height: 36,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: 'none', background: 'none',
                color: c.textFaint, cursor: 'pointer', fontSize: '1rem',
                transition: 'color 0.12s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = c.text)}
              onMouseLeave={e => (e.currentTarget.style.color = c.textFaint)}
            >
              ×
            </button>
          </div>

          {/* Content area */}
          <div style={{ flex: 1, overflow: 'auto', padding: '14px 16px', minWidth: 0 }}>

        {/* FORMAT PANEL */}
        {panel === 'format' && (
          <div>
            <Accordion title="Typography" uiFont={uiFont} c={c} defaultOpen>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  {label('Body font')}
                  {fontSelect(formatState.fontFam, v => onFormatChange({ fontFam: v }))}
                </div>
                <div>
                  {label('Heading font')}
                  {fontSelect(formatState.headingFontFam, v => onFormatChange({ headingFontFam: v }))}
                </div>
                <div>
                  {label('Font size')}
                  {numInput(formatState.fontSize, 8, 96, 1, 'px', v => onFormatChange({ fontSize: v }))}
                </div>
                <div>
                  {label('Line height')}
                  {numInput(formatState.lineH, 1.0, 4.0, 0.05, '×', v => onFormatChange({ lineH: v }), 2)}
                </div>
                <div>
                  {label('Letter spacing')}
                  {numInput(formatState.letterSpacing, -3, 8, 0.5, 'px', v => onFormatChange({ letterSpacing: v }), 1)}
                </div>
                <div>
                  {label('Word spacing')}
                  {numInput(formatState.wordSpacing, -4, 16, 0.5, 'px', v => onFormatChange({ wordSpacing: v }), 1)}
                </div>
              </div>
            </Accordion>

            <Accordion title="Advanced Typography" uiFont={uiFont} c={c}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  {label('Text transform')}
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {([
                      { val: 'none', label: 'Aa' },
                      { val: 'uppercase', label: 'AA' },
                      { val: 'lowercase', label: 'aa' },
                      { val: 'capitalize', label: 'Aa.' },
                    ] as const).map(({ val, label: lbl }) => (
                      <button key={val}
                        onClick={() => onFormatChange({ textTransform: val } as Partial<FormatState>)}
                        style={{ padding: '4px 9px', borderRadius: 5, cursor: 'pointer', fontFamily: uiFont, fontSize: '0.7rem', border: `1px solid ${(formatState as Record<string,string>)['textTransform'] === val ? c.accent : c.border}`, background: (formatState as Record<string,string>)['textTransform'] === val ? c.accentLight : 'transparent', color: (formatState as Record<string,string>)['textTransform'] === val ? c.accent : c.textMuted, transition: 'all 0.12s' }}>
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  {label('Superscript / Subscript')}
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => { const ta = textareaRef.current; if (ta) { const s = ta.selectionStart, e = ta.selectionEnd; const sel = content.slice(s, e); onContentChange(content.slice(0, s) + `<sup>${sel || 'sup'}</sup>` + content.slice(e)) } }}
                      style={{ flex: 1, padding: '5px', borderRadius: 5, border: `1px solid ${c.border}`, background: 'transparent', fontFamily: uiFont, fontSize: '0.72rem', color: c.textMuted, cursor: 'pointer', transition: 'all 0.12s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = c.accentMid; e.currentTarget.style.color = c.accent }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.textMuted }}>
                      X<sup style={{ fontSize: '0.6em' }}>2</sup> Sup
                    </button>
                    <button onClick={() => { const ta = textareaRef.current; if (ta) { const s = ta.selectionStart, e = ta.selectionEnd; const sel = content.slice(s, e); onContentChange(content.slice(0, s) + `<sub>${sel || 'sub'}</sub>` + content.slice(e)) } }}
                      style={{ flex: 1, padding: '5px', borderRadius: 5, border: `1px solid ${c.border}`, background: 'transparent', fontFamily: uiFont, fontSize: '0.72rem', color: c.textMuted, cursor: 'pointer', transition: 'all 0.12s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = c.accentMid; e.currentTarget.style.color = c.accent }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.textMuted }}>
                      X<sub style={{ fontSize: '0.6em' }}>2</sub> Sub
                    </button>
                  </div>
                </div>
                <div>
                  {label('OpenType features')}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {[
                      { label: 'Ligatures', feat: 'liga' },
                      { label: 'Small caps', feat: 'smcp' },
                      { label: 'Old figures', feat: 'onum' },
                      { label: 'Fractions', feat: 'frac' },
                    ].map(({ label: lbl, feat }) => {
                      const active = ((formatState as Record<string, string>)['fontFeatures'] ?? '').includes(feat)
                      return (
                        <button key={feat}
                          onClick={() => {
                            const current = ((formatState as Record<string, string>)['fontFeatures'] ?? '').split(',').filter(Boolean)
                            const next = active ? current.filter(f => f !== feat) : [...current, feat]
                            onFormatChange({ fontFeatures: next.join(',') } as Partial<FormatState>)
                          }}
                          style={{ padding: '3px 8px', borderRadius: 5, cursor: 'pointer', fontFamily: uiFont, fontSize: '0.68rem', border: `1px solid ${active ? c.accent : c.border}`, background: active ? c.accentLight : 'transparent', color: active ? c.accent : c.textMuted, transition: 'all 0.12s' }}>
                          {lbl}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </Accordion>

            <Accordion title="Paragraph" uiFont={uiFont} c={c}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  {label('Alignment')}
                  <div style={{ display: 'flex', gap: 4 }}>
                    {(['left', 'center', 'right', 'justify'] as const).map(a => (
                      <button key={a} onClick={() => onFormatChange({ align: a })}
                        style={{ flex: 1, padding: '5px 0', borderRadius: 5, border: `1.5px solid ${formatState.align === a ? c.accent : c.border}`, background: formatState.align === a ? c.accentLight : 'transparent', color: formatState.align === a ? c.accent : c.textMuted, fontFamily: uiFont, fontSize: '0.68rem', cursor: 'pointer', transition: 'all 0.12s' }}>
                        {a === 'left' ? '≡L' : a === 'center' ? '≡C' : a === 'right' ? '≡R' : '≡J'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  {label('Para spacing')}
                  {numInput(formatState.paraSpacing, 0, 4, 0.1, 'em', v => onFormatChange({ paraSpacing: v }), 1)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: uiFont, fontSize: '0.74rem', color: c.text }}>First-line indent</span>
                  <button onClick={() => onFormatChange({ firstLineIndent: !formatState.firstLineIndent })}
                    style={{ width: 36, height: 20, borderRadius: 10, background: formatState.firstLineIndent ? c.accent : c.border, border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                    <div style={{ position: 'absolute', top: 2, left: formatState.firstLineIndent ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </button>
                </div>
              </div>
            </Accordion>

            <Accordion title="Column" uiFont={uiFont} c={c}>
              <div>
                {label('Max width')}
                {numInput(formatState.maxW, 300, 1200, 10, 'px', v => onFormatChange({ maxW: v }))}
              </div>
            </Accordion>

            <Accordion title={t(lang, 'quickStyles')} uiFont={uiFont} c={c}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {[
                  { label: 'Normal', prefix: '' },
                  { label: 'H1', prefix: '# ' },
                  { label: 'H2', prefix: '## ' },
                  { label: 'H3', prefix: '### ' },
                  { label: 'Quote', prefix: '> ' },
                  { label: 'Code', prefix: '```\n' },
                ].map(s => (
                  <button key={s.label} onClick={() => applyLinePrefix(s.prefix)}
                    style={{
                      padding: '4px 10px', borderRadius: 5,
                      border: `1px solid ${c.border}`,
                      background: 'transparent', color: c.textMuted,
                      fontFamily: uiFont, fontSize: '0.72rem',
                      cursor: 'pointer', transition: 'all 0.12s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = c.accentMid; e.currentTarget.style.color = c.accent }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.textMuted }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </Accordion>

            <Accordion title={t(lang, 'pageFormat')} uiFont={uiFont} c={c}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <div style={{ fontFamily: uiFont, fontSize: '0.66rem', color: c.textFaint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{t(lang, 'paperSize')}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {(['A4', 'Letter', 'Legal', 'A5', 'Tabloid', 'pageless'] as const).map(size => (
                      <button key={size} onClick={() => onPageFormatChange({ ...pageFormat, paperSize: size, mode: size === 'pageless' ? 'pageless' : 'pages' })}
                        style={{
                          padding: '4px 8px', borderRadius: 5, cursor: 'pointer',
                          border: `1px solid ${pageFormat.paperSize === size ? c.accent : c.border}`,
                          background: pageFormat.paperSize === size ? c.accentLight : 'transparent',
                          color: pageFormat.paperSize === size ? c.accent : c.textMuted,
                          fontFamily: uiFont, fontSize: '0.68rem', transition: 'all 0.12s',
                        }}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
                {pageFormat.paperSize !== 'pageless' && (
                  <div>
                    <div style={{ fontFamily: uiFont, fontSize: '0.66rem', color: c.textFaint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{t(lang, 'orientation')}</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {(['portrait', 'landscape'] as const).map(o => (
                        <button key={o} onClick={() => onPageFormatChange({ ...pageFormat, orientation: o })}
                          style={{
                            flex: 1, padding: '5px 0', borderRadius: 5, cursor: 'pointer',
                            border: `1.5px solid ${pageFormat.orientation === o ? c.accent : c.border}`,
                            background: pageFormat.orientation === o ? c.accentLight : 'transparent',
                            color: pageFormat.orientation === o ? c.accent : c.textMuted,
                            fontFamily: uiFont, fontSize: '0.72rem', transition: 'all 0.12s',
                          }}
                        >
                          {o === 'portrait' ? t(lang, 'portrait') : t(lang, 'landscape')}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Accordion>
          </div>
        )}

        {/* EXPORT PANEL */}
        {panel === 'export' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{
              background: c.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
              border: `1px solid ${c.borderFaint}`,
              borderRadius: 8, padding: '12px 14px',
            }}>
              <div style={{ fontFamily: `'${bodyFont}', serif`, fontSize: '0.9rem', fontWeight: 600, color: c.text, marginBottom: 8, lineHeight: 1.3 }}>
                {title}
              </div>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: monoFont, fontSize: '0.7rem', color: c.accent }}>{wordCount.toLocaleString()} words</span>
                <span style={{ fontFamily: monoFont, fontSize: '0.7rem', color: c.textFaint }}>{charCount.toLocaleString()} chars</span>
                <span style={{ fontFamily: monoFont, fontSize: '0.7rem', color: c.textFaint }}>~{readMin} min read</span>
              </div>
            </div>

            <button onClick={handleCopy}
              style={{
                padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                background: copied ? 'hsl(145, 52%, 94%)' : c.accentLight,
                border: `1.5px solid ${copied ? 'hsl(145, 52%, 70%)' : c.accentMid}`,
                color: copied ? 'hsl(145, 52%, 34%)' : c.accent,
                fontFamily: uiFont, fontSize: '0.82rem', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 8,
                transition: 'all 0.22s',
              }}
            >
              {copied ? '✓ Copied to clipboard' : '⊕ Copy to Clipboard'}
            </button>

            {(['txt', 'md', 'html'] as const).map(ext => (
              <button key={ext} onClick={() => handleDownload(ext)}
                style={{
                  padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                  background: 'transparent',
                  border: `1.5px solid ${c.border}`,
                  color: c.text, fontFamily: uiFont, fontSize: '0.82rem', fontWeight: 500,
                  display: 'flex', alignItems: 'center', gap: 8,
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = c.accentMid)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = c.border)}
              >
                ↓ {t(lang, 'downloadAs')} .{ext}
              </button>
            ))}
            <button onClick={handleDownloadDocx}
              style={{
                padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                background: 'transparent',
                border: `1.5px solid ${c.border}`,
                color: c.text, fontFamily: uiFont, fontSize: '0.82rem', fontWeight: 500,
                display: 'flex', alignItems: 'center', gap: 8,
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = c.accentMid)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = c.border)}
            >
              ↓ {t(lang, 'downloadWord')}
            </button>
            <button onClick={handlePrintPDF}
              style={{
                padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                background: 'transparent',
                border: `1.5px solid ${c.border}`,
                color: c.text, fontFamily: uiFont, fontSize: '0.82rem', fontWeight: 500,
                display: 'flex', alignItems: 'center', gap: 8,
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = c.accentMid)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = c.border)}
            >
              ⎙ Save as PDF
            </button>
          </div>
        )}

        {/* PREVIEW PANEL */}
        {panel === 'preview' && (
          <div style={{ fontFamily: `'${bodyFont}', serif`, fontSize: formatState.fontSize - 2, lineHeight: formatState.lineH, color: c.text }}>
            <h2 style={{ fontFamily: `'${headingFont}', serif`, fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: c.text }}>{title}</h2>
            {content.split(/\n\n+/).filter(p => p.trim()).map((para, i) => {
              const t = para.trim()
              if (t.startsWith('# ')) return <h1 key={i} style={{ fontFamily: `'${headingFont}', serif`, fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.7rem', color: c.text }}>{t.slice(2)}</h1>
              if (t.startsWith('## ')) return <h2 key={i} style={{ fontFamily: `'${headingFont}', serif`, fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem', color: c.text }}>{t.slice(3)}</h2>
              if (t.startsWith('> ')) return <blockquote key={i} style={{ borderLeft: `2px solid ${c.accentMid}`, paddingLeft: '0.8em', color: c.textMuted, fontStyle: 'italic', margin: '0.5em 0' }}>{t.slice(2)}</blockquote>
              const html = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/~~(.+?)~~/g, '<s>$1</s>')
              return <p key={i} style={{ marginBottom: '0.8em' }} dangerouslySetInnerHTML={{ __html: html }} />
            })}
          </div>
        )}

        {/* TIMER PANEL */}
        {panel === 'timer' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 8 }}>
            {/* Ring */}
            <div style={{ position: 'relative', width: 134, height: 134, marginBottom: 20 }}>
              <svg width={134} height={134} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={67} cy={67} r={R} fill="none" stroke={c.borderFaint} strokeWidth={6} />
                <circle
                  cx={67} cy={67} r={R} fill="none"
                  stroke={timerDone ? '#4caf72' : c.accent}
                  strokeWidth={6} strokeLinecap="round"
                  strokeDasharray={CIRC}
                  strokeDashoffset={CIRC * (1 - (timerDone ? 1 : timerProgress))}
                  style={{ transition: 'stroke-dashoffset 0.9s ease, stroke 0.4s' }}
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                {timerDone ? (
                  <span style={{ fontFamily: uiFont, fontSize: '0.9rem', color: '#4caf72', fontWeight: 600 }}>Done</span>
                ) : (
                  <span style={{ fontFamily: monoFont, fontSize: '1.38rem', fontWeight: 500, color: c.text, letterSpacing: '0.02em' }}>
                    {String(timerMin).padStart(2, '0')}:{String(timerSec).padStart(2, '0')}
                  </span>
                )}
              </div>
            </div>

            {timerDone ? (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: `'Lora', serif`, fontSize: '0.9rem', color: c.textMuted, marginBottom: 12, fontStyle: 'italic' }}>
                  Session complete.
                </p>
                <button onClick={onTimerReset}
                  style={{
                    padding: '6px 20px', borderRadius: 6,
                    background: c.accent, color: 'white', border: 'none',
                    fontFamily: uiFont, fontSize: '0.8rem', fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Reset
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
                  <button onClick={onTimerToggle}
                    style={{
                      width: 44, height: 44, borderRadius: '50%',
                      background: c.accent, color: 'white', border: 'none',
                      fontSize: '1rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'opacity 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.84')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                  >
                    {timerOn ? 'Pause' : 'Play'}
                  </button>
                  <button onClick={onTimerReset}
                    style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: 'transparent', border: `1.5px solid ${c.border}`,
                      color: c.textMuted, fontSize: '0.95rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = c.accentMid)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = c.border)}
                  >
                    ↺
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontFamily: uiFont, fontSize: '0.76rem', color: c.textMuted }}>Duration</span>
                  <input
                    type="number" min={1} max={120} value={timerSet}
                    onChange={e => onTimerSetChange(Math.max(1, Math.min(120, Number(e.target.value))))}
                    style={{
                      width: 52, padding: '4px 7px', borderRadius: 6,
                      border: `1px solid ${c.border}`,
                      fontFamily: monoFont, fontSize: '0.82rem', color: c.text,
                      background: c.surface, textAlign: 'center', outline: 'none',
                    }}
                  />
                  <span style={{ fontFamily: uiFont, fontSize: '0.76rem', color: c.textMuted }}>min</span>
                </div>

                {timerOn && (
                  <p style={{ fontFamily: uiFont, fontSize: '0.72rem', color: c.accent, textAlign: 'center' }}>
                    Focus session in progress
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {/* COLORS PANEL */}
        {panel === 'colors' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <SectionLabel label={t(lang, 'themePresets')} uiFont={uiFont} c={c} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {PRESETS.map(preset => (
                  <button
                    key={preset.name}
                    onClick={() => onPresetSelect(preset.name)}
                    style={{
                      padding: '8px 10px', borderRadius: 8, textAlign: 'left',
                      border: `1.5px solid ${activePresetName === preset.name ? c.accent : c.borderFaint}`,
                      background: activePresetName === preset.name ? c.accentLight : (c.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)'),
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { if (activePresetName !== preset.name) e.currentTarget.style.borderColor = c.accentMid }}
                    onMouseLeave={e => { if (activePresetName !== preset.name) e.currentTarget.style.borderColor = c.borderFaint }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                      <span style={{ fontFamily: uiFont, fontSize: '0.72rem', fontWeight: 600, color: activePresetName === preset.name ? c.accent : c.text }}>
                        {preset.name}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 3 }}>
                      {[preset.bg, preset.accent, preset.accentMid, preset.surface].map((clr, i) => (
                        <div key={i} style={{ flex: 1, height: 6, borderRadius: 2, background: clr }} />
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <SectionLabel label={t(lang, 'custom')} uiFont={uiFont} c={c} />
              {/* Colour Wheel toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontFamily: uiFont, fontSize: '0.72rem', color: c.text }}>{t(lang, 'colourWheel')}</span>
                <button
                  onClick={() => setShowColorWheel(v => !v)}
                  style={{
                    padding: '3px 9px', borderRadius: 5, cursor: 'pointer',
                    border: `1px solid ${showColorWheel ? c.accent : c.border}`,
                    background: showColorWheel ? c.accentLight : 'transparent',
                    fontFamily: uiFont, fontSize: '0.68rem',
                    color: showColorWheel ? c.accent : c.textMuted,
                    transition: 'all 0.12s',
                  }}
                >
                  {showColorWheel ? t(lang, 'colourPicker') : t(lang, 'colourWheel')}
                </button>
              </div>
              {showColorWheel ? (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                  <ColorWheel
                    value={colorOverrides['accent'] || c.accent.replace(/[^#\w]/g, '').substring(0, 7) || '#6688cc'}
                    onChange={v => onColorOverride('accent', v)}
                    size={130}
                  />
                </div>
              ) : (
                [
                  { key: 'bg', label: 'Background' },
                  { key: 'text', label: 'Text' },
                  { key: 'accent', label: 'Accent' },
                  { key: 'surface', label: 'Surface' },
                  { key: 'border', label: 'Border' },
                ].map(({ key, label: lbl }) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontFamily: uiFont, fontSize: '0.75rem', color: c.text }}>{lbl}</span>
                    <input
                      type="color"
                      value={colorOverrides[key] || '#888888'}
                      onChange={e => onColorOverride(key, e.target.value)}
                      style={{ width: 32, height: 22, border: `1px solid ${c.border}`, borderRadius: 4, cursor: 'pointer' }}
                    />
                  </div>
                ))
              )}
            </div>

            <div>
              <SectionLabel label={t(lang, 'backgroundGradient')} uiFont={uiFont} c={c} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontFamily: uiFont, fontSize: '0.72rem', color: c.textFaint, width: 50 }}>{t(lang, 'colour1')}</span>
                <input type="color" value={gradColor1} onChange={e => { setGradColor1(e.target.value); onColorOverride('gradient', `linear-gradient(${gradAngle}deg, ${e.target.value}, ${gradColor2})`) }} style={{ width: 32, height: 22, border: `1px solid ${c.border}`, borderRadius: 4, cursor: 'pointer' }} />
                <div style={{ flex: 1, height: 10, borderRadius: 4, background: `linear-gradient(90deg, ${gradColor1}, ${gradColor2})` }} />
                <input type="color" value={gradColor2} onChange={e => { setGradColor2(e.target.value); onColorOverride('gradient', `linear-gradient(${gradAngle}deg, ${gradColor1}, ${e.target.value})`) }} style={{ width: 32, height: 22, border: `1px solid ${c.border}`, borderRadius: 4, cursor: 'pointer' }} />
                <span style={{ fontFamily: uiFont, fontSize: '0.72rem', color: c.textFaint, width: 50, textAlign: 'right' }}>{t(lang, 'colour2')}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: uiFont, fontSize: '0.72rem', color: c.textFaint }}>{t(lang, 'angle')} {gradAngle}°</span>
                <input type="range" min={0} max={360} value={gradAngle}
                  onChange={e => { const a = Number(e.target.value); setGradAngle(a); onColorOverride('gradient', `linear-gradient(${a}deg, ${gradColor1}, ${gradColor2})`) }}
                  style={{ flex: 1 }}
                />
              </div>
            </div>

            <div>
              <SectionLabel label={t(lang, 'hueSlider')} uiFont={uiFont} c={c} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="range" min={0} max={359} value={hue}
                  onChange={e => { onPresetSelect(null); onHueChange(Number(e.target.value)) }}
                  className="hue-slider" style={{ flex: 1 }} />
                <input type="number" min={0} max={359} value={hue}
                  className="no-spin"
                  onChange={e => { const v = Number(e.target.value); if (v >= 0 && v <= 359) { onPresetSelect(null); onHueChange(v) } }}
                  style={{ width: 42, padding: '3px 4px', textAlign: 'center', fontFamily: monoFont, fontSize: '0.7rem', color: c.text, background: 'transparent', border: `1px solid ${c.borderFaint}`, borderRadius: 4, outline: 'none' }} />
              </div>
            </div>

            <button
              onClick={onColorReset}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: uiFont, fontSize: '0.72rem', color: c.textFaint,
                textDecoration: 'underline', padding: 0, alignSelf: 'flex-start',
                transition: 'color 0.12s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = c.accent)}
              onMouseLeave={e => (e.currentTarget.style.color = c.textFaint)}
            >
              {t(lang, 'resetToDefault')}
            </button>
          </div>
        )}

        {/* IMPORT/EXPORT PANEL */}
        {panel === 'importexport' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Preview */}
            <div style={{
              background: c.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
              border: `1px solid ${c.borderFaint}`, borderRadius: 8, padding: '10px 12px',
            }}>
              <div style={{ fontFamily: `'${bodyFont}', serif`, fontSize: '0.82rem', fontWeight: 600, color: c.text, marginBottom: 4 }}>{title}</div>
              <div style={{ fontFamily: uiFont, fontSize: '0.72rem', color: c.textMuted, lineHeight: 1.5 }}>
                {content.slice(0, 150)}{content.length > 150 ? '...' : ''}
              </div>
            </div>
            {/* Import */}
            <div>
              <SectionLabel label="Import" uiFont={uiFont} c={c} />
              <div
                onClick={() => {
                  const inp = document.createElement('input')
                  inp.type = 'file'; inp.accept = '.txt,.md,.html'
                  inp.onchange = (e) => {
                    const f = (e.target as HTMLInputElement).files?.[0]
                    if (!f) return
                    const r = new FileReader()
                    r.onload = (ev) => {
                      onContentChange(ev.target?.result as string ?? '')
                    }
                    r.readAsText(f)
                  }
                  inp.click()
                }}
                style={{
                  border: `2px dashed ${c.border}`, borderRadius: 8, padding: '14px', textAlign: 'center',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = c.accentMid }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = c.border }}
              >
                <div style={{ fontFamily: uiFont, fontSize: '0.74rem', color: c.textMuted, lineHeight: 1.5 }}>
                  {t(lang, 'dropFontHere').replace('font file', 'file (.txt, .md, .html)')}<br />
                  <span style={{ fontSize: '0.66rem', color: c.textFaint }}>{t(lang, 'orClickToBrowse')}</span>
                </div>
              </div>
            </div>
            {/* Export */}
            <div>
              <SectionLabel label={t(lang, 'export')} uiFont={uiFont} c={c} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button onClick={handleCopy}
                  style={{
                    padding: '8px 12px', borderRadius: 7, cursor: 'pointer',
                    background: copied ? 'hsl(145, 52%, 94%)' : c.accentLight,
                    border: `1.5px solid ${copied ? 'hsl(145, 52%, 70%)' : c.accentMid}`,
                    color: copied ? 'hsl(145, 52%, 34%)' : c.accent,
                    fontFamily: uiFont, fontSize: '0.78rem', fontWeight: 600,
                    transition: 'all 0.22s',
                  }}
                >
                  {copied ? `✓ ${t(lang, 'copied')}` : `⊕ ${t(lang, 'copyToClipboard')}`}
                </button>
                {(['txt', 'md', 'html'] as const).map(ext => (
                  <button key={ext} onClick={() => handleDownload(ext)}
                    style={{
                      padding: '8px 12px', borderRadius: 7, cursor: 'pointer',
                      background: 'transparent', border: `1.5px solid ${c.border}`,
                      color: c.text, fontFamily: uiFont, fontSize: '0.78rem',
                      transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = c.accentMid)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = c.border)}
                  >
                    ↓ .{ext}
                  </button>
                ))}
                <button onClick={handlePrintPDF}
                  style={{
                    padding: '8px 12px', borderRadius: 7, cursor: 'pointer',
                    background: 'transparent', border: `1.5px solid ${c.border}`,
                    color: c.text, fontFamily: uiFont, fontSize: '0.78rem',
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = c.accentMid)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = c.border)}
                >
                  ⎙ PDF
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FONTS PANEL */}
        {panel === 'fonts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <SectionLabel label="Font roles" uiFont={uiFont} c={c} />
              {([
                { role: 'body' as const, label: 'Body', value: bodyFont },
                { role: 'heading' as const, label: 'Heading', value: headingFont },
                { role: 'ui' as const, label: 'UI', value: uiFont2 },
                { role: 'mono' as const, label: 'Mono', value: monoFont2 },
              ]).map(({ role, label: lbl, value }) => (
                <div key={role} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontFamily: uiFont, fontSize: '0.68rem', color: c.textFaint, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{lbl}</span>
                    <span style={{ fontFamily: `'${value}', serif`, fontSize: '0.78rem', color: c.textMuted }}>
                      {value}
                    </span>
                  </div>
                  <select
                    value={value}
                    onChange={e => onFontAssign(role, e.target.value)}
                    onFocus={() => setActiveRole(role)}
                    style={{
                      width: '100%', padding: '5px 8px', borderRadius: 6,
                      border: `1px solid ${activeRole === role ? c.accent : c.border}`,
                      background: c.surface, fontFamily: `'${value}', serif`,
                      fontSize: '0.8rem', color: c.text, cursor: 'pointer', outline: 'none',
                    }}
                  >
                    {availableFontNames.concat(customFonts.map(f => f.name)).map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div>
              <SectionLabel label="Available fonts" uiFont={uiFont} c={c} />
              {[
                { group: 'Serif', fonts: SERIF_FONTS },
                { group: 'Sans', fonts: SANS_FONTS },
                { group: 'Mono', fonts: MONO_FONTS },
              ].map(({ group, fonts }) => (
                <div key={group} style={{ marginBottom: 10 }}>
                  <div style={{ fontFamily: uiFont, fontSize: '0.64rem', color: c.textFaint, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {group}
                  </div>
                  {fonts.map(name => (
                    <button
                      key={name}
                      onClick={() => onFontAssign(activeRole, name)}
                      style={{
                        width: '100%', padding: '5px 10px', textAlign: 'left',
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        fontFamily: `'${name}', serif`, fontSize: '0.84rem', color: c.text,
                        borderRadius: 5, transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = c.accentLight)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              ))}
            </div>

            <div>
              <SectionLabel label={t(lang, 'browseGoogleFonts')} uiFont={uiFont} c={c} />
              <button
                onClick={() => setShowGoogleFonts(v => !v)}
                style={{
                  width: '100%', padding: '7px 10px', borderRadius: 6, marginBottom: 8,
                  border: `1px solid ${showGoogleFonts ? c.accent : c.border}`,
                  background: showGoogleFonts ? c.accentLight : 'transparent',
                  color: showGoogleFonts ? c.accent : c.textMuted,
                  fontFamily: uiFont, fontSize: '0.78rem', cursor: 'pointer',
                  transition: 'all 0.12s',
                }}
              >
                {t(lang, 'browseGoogleFonts')} {showGoogleFonts ? '▲' : '▼'}
              </button>
              {showGoogleFonts && (
                <div style={{ marginBottom: 12 }}>
                  <GoogleFontsPanel
                    onSelect={name => {
                      if (onFontLoad) onFontLoad(name)
                      onFontAssign(activeRole, name)
                      setShowGoogleFonts(false)
                    }}
                    c={c}
                    uiFont={uiFont}
                  />
                </div>
              )}
            </div>

            <div>
              <SectionLabel label={t(lang, 'customFonts')} uiFont={uiFont} c={c} />
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => {
                  e.preventDefault(); setDragOver(false)
                  const file = e.dataTransfer.files[0]
                  if (file) onFontUpload(file)
                }}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? c.accent : c.border}`,
                  borderRadius: 8, padding: '16px', textAlign: 'center',
                  cursor: 'pointer', transition: 'all 0.15s',
                  background: dragOver ? c.accentLight : 'transparent',
                  marginBottom: 10,
                }}
              >
                <div style={{ fontFamily: uiFont, fontSize: '0.74rem', color: c.textMuted, lineHeight: 1.5 }}>
                  Drop font file here<br />
                  <span style={{ fontSize: '0.66rem', color: c.textFaint }}>or click to browse</span>
                </div>
              </div>
              <input
                ref={fileInputRef} type="file" accept=".ttf,.otf,.woff,.woff2"
                style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) onFontUpload(f) }}
              />
              {customFonts.map(font => (
                <div key={font.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '6px 8px', borderRadius: 6,
                  background: c.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                  marginBottom: 4,
                }}>
                  <span style={{ fontFamily: `'${font.name}', sans-serif`, fontSize: '0.8rem', color: c.text }}>
                    {font.name}
                  </span>
                  <button
                    onClick={() => onFontDelete(font.id)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: c.textFaint, fontSize: '0.8rem', transition: 'color 0.12s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#e05050')}
                    onMouseLeave={e => (e.currentTarget.style.color = c.textFaint)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* SETTINGS PANEL */}
        {panel === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <SectionLabel label="Language" uiFont={uiFont} c={c} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {(Object.keys(LANG_LABELS) as Lang[]).map(l => (
                  <button
                    key={l}
                    onClick={() => onLangChange(l)}
                    style={{
                      padding: '5px 10px', borderRadius: 6, cursor: 'pointer',
                      border: `1px solid ${lang === l ? c.accent : c.border}`,
                      background: lang === l ? c.accentLight : 'transparent',
                      color: lang === l ? c.accent : c.textMuted,
                      fontFamily: uiFont, fontSize: '0.74rem',
                      transition: 'all 0.12s',
                    }}
                  >
                    {LANG_FLAGS[l] ? `${LANG_FLAGS[l]} ` : ''}{LANG_LABELS[l]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <SectionLabel label={t(lang, 'hueSlider')} uiFont={uiFont} c={c} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="range" min={0} max={359} value={hue}
                  onChange={e => { onPresetSelect(null); onHueChange(Number(e.target.value)) }}
                  className="hue-slider" style={{ flex: 1 }} />
                <input type="number" min={0} max={359} value={hue}
                  className="no-spin"
                  onChange={e => { const v = Number(e.target.value); if (v >= 0 && v <= 359) { onPresetSelect(null); onHueChange(v) } }}
                  style={{ width: 42, padding: '3px 4px', textAlign: 'center', fontFamily: monoFont, fontSize: '0.7rem', color: c.text, background: 'transparent', border: `1px solid ${c.borderFaint}`, borderRadius: 4, outline: 'none' }} />
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: c.accent, border: `2px solid ${c.border}`, flexShrink: 0 }} />
              </div>
            </div>

            <div>
              <SectionLabel label={t(lang, 'themePresets')} uiFont={uiFont} c={c} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {PRESETS.map(preset => (
                  <button
                    key={preset.name}
                    onClick={() => onPresetSelect(activePresetName === preset.name ? null : preset.name)}
                    style={{
                      padding: '7px 9px', borderRadius: 7, textAlign: 'left',
                      border: `1.5px solid ${activePresetName === preset.name ? c.accent : c.borderFaint}`,
                      background: activePresetName === preset.name ? c.accentLight : (c.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                      <span style={{ fontFamily: uiFont, fontSize: '0.7rem', fontWeight: 600, color: activePresetName === preset.name ? c.accent : c.text }}>{preset.name}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 3 }}>
                      {[preset.bg, preset.accent, preset.accentMid, preset.surface].map((clr, i) => (
                        <div key={i} style={{ flex: 1, height: 5, borderRadius: 2, background: clr }} />
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ padding: '12px 0', borderTop: `1px solid ${c.borderFaint}`, textAlign: 'center' }}>
              <span style={{ fontFamily: uiFont, fontSize: '0.66rem', color: c.textFaint }}>Prose · Writing app</span>
            </div>
          </div>
        )}
          </div>
        </div>
      )}
    </div>
  )
}
