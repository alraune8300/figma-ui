import { useState, useEffect } from 'react'
import { Theme } from './theme'
import { FormatState } from './types'

interface FormatRibbonProps {
  c: Theme
  uiFont: string
  bodyFont: string
  formatState: FormatState
  onFormatChange: (updates: Partial<FormatState>) => void
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  content: string
  onContentChange: (content: string) => void
  availableFontNames: string[]
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
}

const PARA_STYLES = [
  { label: 'Normal', prefix: '' },
  { label: 'H1', prefix: '# ' },
  { label: 'H2', prefix: '## ' },
  { label: 'H3', prefix: '### ' },
  { label: 'H4', prefix: '#### ' },
  { label: 'Quote', prefix: '> ' },
  { label: 'Code', prefix: '```\n' },
]

function applyLinePrefix(content: string, prefix: string, textarea: HTMLTextAreaElement, onContentChange: (c: string) => void) {
  const start = content.lastIndexOf('\n', textarea.selectionStart - 1) + 1
  const end = content.indexOf('\n', textarea.selectionStart)
  const lineEnd = end === -1 ? content.length : end
  const line = content.slice(start, lineEnd)
  const stripped = line.replace(/^(#{1,4} |> |```\n?|- |\d+\. )/, '')
  const newLine = prefix + stripped
  const newContent = content.slice(0, start) + newLine + content.slice(lineEnd)
  onContentChange(newContent)
  requestAnimationFrame(() => {
    textarea.focus()
    const newCaret = start + newLine.length
    textarea.setSelectionRange(newCaret, newCaret)
  })
}

function wrapSelection(content: string, wrap: string, textarea: HTMLTextAreaElement, onContentChange: (c: string) => void) {
  const s = textarea.selectionStart
  const e = textarea.selectionEnd
  const selected = content.slice(s, e)
  const wrapped = selected ? `${wrap}${selected}${wrap}` : `${wrap}${wrap}`
  const newContent = content.slice(0, s) + wrapped + content.slice(e)
  onContentChange(newContent)
  requestAnimationFrame(() => {
    textarea.focus()
    if (selected) {
      textarea.setSelectionRange(s, s + wrapped.length)
    } else {
      const mid = s + wrap.length
      textarea.setSelectionRange(mid, mid)
    }
  })
}

function buildMarkdownTable(rows: number, cols: number): string {
  const header = '| ' + Array.from({ length: cols }, (_, i) => `Col ${i + 1}`).join(' | ') + ' |'
  const sep = '| ' + Array.from({ length: cols }, () => '---').join(' | ') + ' |'
  const body = Array.from({ length: rows - 1 }, () =>
    '| ' + Array.from({ length: cols }, () => '   ').join(' | ') + ' |'
  ).join('\n')
  return header + '\n' + sep + (rows > 1 ? '\n' + body : '')
}

export default function FormatRibbon({
  c, uiFont, formatState, onFormatChange,
  textareaRef, content, onContentChange, availableFontNames,
  onUndo, onRedo, canUndo, canRedo,
}: FormatRibbonProps) {
  const [showParaMenu, setShowParaMenu] = useState(false)
  const [paraMenuPos, setParaMenuPos] = useState<{ top: number; left: number } | null>(null)
  const [showFontMenu, setShowFontMenu] = useState(false)
  const [fontMenuPos, setFontMenuPos] = useState<{ top: number; left: number } | null>(null)
  const [textColor, setTextColor] = useState('#000000')
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [colorPickerPos, setColorPickerPos] = useState<{ top: number; left: number } | null>(null)
  const [showTablePicker, setShowTablePicker] = useState(false)
  const [tablePickerPos, setTablePickerPos] = useState<{ top: number; left: number } | null>(null)
  const [tableHover, setTableHover] = useState<[number, number]>([1, 1])

  useEffect(() => {
    const close = () => {
      setShowParaMenu(false); setParaMenuPos(null)
      setShowFontMenu(false); setFontMenuPos(null)
      setShowColorPicker(false); setColorPickerPos(null)
      setShowTablePicker(false); setTablePickerPos(null)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const ta = textareaRef.current

  const divider = (
    <div style={{ width: 1, height: 18, background: c.borderFaint, flexShrink: 0, margin: '0 3px' }} />
  )

  const btn = (
    label: string,
    title: string,
    onClick: () => void,
    active = false,
    disabled = false
  ) => (
    <button
      key={label + title}
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '3px 7px', borderRadius: 4,
        border: `1px solid ${active ? c.accent : 'transparent'}`,
        background: active ? c.accentLight : 'transparent',
        color: disabled ? c.textFaint : active ? c.accent : c.textMuted,
        fontFamily: uiFont,
        fontSize: '0.74rem',
        fontWeight: active ? 600 : 400,
        cursor: disabled ? 'default' : 'pointer',
        lineHeight: '1.4', opacity: disabled ? 0.4 : 1,
        transition: 'all 0.12s', flexShrink: 0,
      }}
      onMouseEnter={e => { if (!active && !disabled) e.currentTarget.style.background = c.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }}
      onMouseLeave={e => { if (!active && !disabled) e.currentTarget.style.background = 'transparent' }}
    >
      {label}
    </button>
  )

  const currentParaStyle = PARA_STYLES.find(s => {
    if (!ta) return false
    const lineStart = content.lastIndexOf('\n', ta.selectionStart - 1) + 1
    const line = content.slice(lineStart, content.indexOf('\n', ta.selectionStart) === -1 ? content.length : content.indexOf('\n', ta.selectionStart))
    if (s.prefix === '') return !PARA_STYLES.slice(1).some(o => line.startsWith(o.prefix))
    return line.startsWith(s.prefix)
  }) || PARA_STYLES[0]

  const insertTable = (rows: number, cols: number) => {
    const table = buildMarkdownTable(rows, cols)
    const ta2 = textareaRef.current
    if (!ta2) { onContentChange(content + '\n\n' + table + '\n'); return }
    const s = ta2.selectionStart
    const before = content.slice(0, s)
    const after = content.slice(s)
    const newContent = before + (before.endsWith('\n\n') || before === '' ? '' : '\n\n') + table + '\n\n' + after
    onContentChange(newContent)
    requestAnimationFrame(() => {
      ta2.focus()
      ta2.setSelectionRange(s + table.length + 2, s + table.length + 2)
    })
  }

  return (
    <div style={{
      height: 38, flexShrink: 0,
      background: c.isDark ? 'rgba(0,0,0,0.18)' : 'rgba(0,0,0,0.025)',
      borderBottom: `1px solid ${c.borderFaint}`,
      display: 'flex', alignItems: 'center',
      padding: '0 12px', gap: 2,
      overflowX: 'auto', overflowY: 'visible',
      position: 'relative', zIndex: 2,
    }}>

      {/* Undo / Redo */}
      {btn('⟲', 'Undo (Ctrl+Z)', onUndo, false, !canUndo)}
      {btn('⟳', 'Redo (Ctrl+Y)', onRedo, false, !canRedo)}

      {divider}

      {/* Paragraph style */}
      <div style={{ flexShrink: 0 }}>
        <button
          onClick={e => {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
            if (showParaMenu) { setShowParaMenu(false); setParaMenuPos(null) }
            else { setParaMenuPos({ top: rect.bottom + 2, left: rect.left }); setShowParaMenu(true); setShowFontMenu(false) }
          }}
          onMouseDown={e => e.stopPropagation()}
          style={{
            padding: '3px 8px', borderRadius: 4,
            border: `1px solid ${showParaMenu ? c.accent : c.borderFaint}`,
            background: showParaMenu ? c.accentLight : 'transparent',
            color: showParaMenu ? c.accent : c.textMuted,
            fontFamily: uiFont, fontSize: '0.73rem',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
            whiteSpace: 'nowrap', transition: 'all 0.12s',
          }}
        >
          {currentParaStyle.label} <span style={{ fontSize: '0.6rem' }}>▾</span>
        </button>
        {showParaMenu && paraMenuPos && (
          <div onMouseDown={e => e.stopPropagation()} style={{ position: 'fixed', top: paraMenuPos.top, left: paraMenuPos.left, zIndex: 9999, background: c.surface, border: `1px solid ${c.border}`, borderRadius: 7, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', minWidth: 110, padding: '4px 0' }}>
            {PARA_STYLES.map(s => (
              <button key={s.label} onClick={() => { if (ta) applyLinePrefix(content, s.prefix, ta, onContentChange); setShowParaMenu(false) }}
                style={{ width: '100%', padding: '5px 12px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontFamily: uiFont, fontSize: s.label === 'H1' ? '0.95rem' : s.label === 'H2' ? '0.85rem' : '0.78rem', fontWeight: ['H1','H2','H3','H4'].includes(s.label) ? 600 : 400, color: c.text, transition: 'background 0.1s' }}
                onMouseEnter={e => (e.currentTarget.style.background = c.accentLight)}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >{s.label}</button>
            ))}
          </div>
        )}
      </div>

      {divider}

      {/* Font family */}
      <div style={{ flexShrink: 0 }}>
        <button
          onClick={e => {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
            if (showFontMenu) { setShowFontMenu(false); setFontMenuPos(null) }
            else { setFontMenuPos({ top: rect.bottom + 2, left: rect.left }); setShowFontMenu(true); setShowParaMenu(false) }
          }}
          onMouseDown={e => e.stopPropagation()}
          style={{ padding: '3px 8px', borderRadius: 4, maxWidth: 110, border: `1px solid ${showFontMenu ? c.accent : c.borderFaint}`, background: showFontMenu ? c.accentLight : 'transparent', color: showFontMenu ? c.accent : c.textMuted, fontFamily: `'${formatState.fontFam}', serif`, fontSize: '0.73rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', transition: 'all 0.12s' }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 80 }}>{formatState.fontFam}</span>
          <span style={{ fontSize: '0.6rem', flexShrink: 0 }}>▾</span>
        </button>
        {showFontMenu && fontMenuPos && (
          <div onMouseDown={e => e.stopPropagation()} style={{ position: 'fixed', top: fontMenuPos.top, left: fontMenuPos.left, zIndex: 9999, background: c.surface, border: `1px solid ${c.border}`, borderRadius: 7, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', minWidth: 150, maxHeight: 200, overflowY: 'auto', padding: '4px 0' }}>
            {availableFontNames.map(name => (
              <button key={name} onClick={() => { onFormatChange({ fontFam: name }); setShowFontMenu(false) }}
                style={{ width: '100%', padding: '5px 12px', textAlign: 'left', background: formatState.fontFam === name ? c.accentLight : 'none', border: 'none', cursor: 'pointer', fontFamily: `'${name}', serif`, fontSize: '0.82rem', color: formatState.fontFam === name ? c.accent : c.text, transition: 'background 0.1s' }}
                onMouseEnter={e => { if (formatState.fontFam !== name) e.currentTarget.style.background = c.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}
                onMouseLeave={e => { if (formatState.fontFam !== name) e.currentTarget.style.background = 'none' }}
              >{name}</button>
            ))}
          </div>
        )}
      </div>

      {divider}

      {/* Font size */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
        {btn('−', 'Decrease font size', () => onFormatChange({ fontSize: Math.max(8, formatState.fontSize - 1) }))}
        <input
          type="number" min={8} max={72} value={formatState.fontSize}
          onChange={e => { const v = Number(e.target.value); if (v >= 8 && v <= 72) onFormatChange({ fontSize: v }) }}
          className="no-spin"
          style={{ width: 34, padding: '2px 4px', textAlign: 'center', fontFamily: uiFont, fontSize: '0.72rem', color: c.text, background: 'transparent', border: `1px solid ${c.borderFaint}`, borderRadius: 4, outline: 'none' }}
        />
        {btn('+', 'Increase font size', () => onFormatChange({ fontSize: Math.min(72, formatState.fontSize + 1) }))}
      </div>

      {divider}

      {/* Text style buttons — unified sizing so none shift vertically */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
        {[
          { char: 'B', title: 'Bold', extraStyle: { fontWeight: 700 } as React.CSSProperties, action: () => { if (ta) wrapSelection(content, '**', ta, onContentChange) } },
          { char: 'I', title: 'Italic', extraStyle: { fontStyle: 'italic' as const }, action: () => { if (ta) wrapSelection(content, '*', ta, onContentChange) } },
          { char: 'U', title: 'Underline', extraStyle: { textDecoration: 'underline' as const }, action: () => {} },
          { char: 'S', title: 'Strikethrough', extraStyle: { textDecoration: 'line-through' as const }, action: () => { if (ta) wrapSelection(content, '~~', ta, onContentChange) } },
        ].map(({ char, title, extraStyle, action }) => (
          <button
            key={char} title={title} onClick={action}
            style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, border: '1px solid transparent', background: 'transparent', color: c.textMuted, fontFamily: uiFont, fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.12s', flexShrink: 0, lineHeight: 1, padding: 0, ...extraStyle }}
            onMouseEnter={e => (e.currentTarget.style.background = c.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >{char}</button>
        ))}
      </div>

      {divider}

      {/* Text colour */}
      <div style={{ flexShrink: 0 }}>
        <button title="Text colour"
          onClick={e => {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
            if (showColorPicker) { setShowColorPicker(false); setColorPickerPos(null) }
            else { setColorPickerPos({ top: rect.bottom + 4, left: rect.left - 20 }); setShowColorPicker(true) }
          }}
          onMouseDown={e => e.stopPropagation()}
          style={{ padding: '3px 7px', borderRadius: 4, border: `1px solid ${showColorPicker ? c.accent : 'transparent'}`, background: showColorPicker ? c.accentLight : 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, transition: 'all 0.12s' }}
        >
          <span style={{ fontFamily: uiFont, fontSize: '0.74rem', color: c.textMuted }}>A</span>
          <div style={{ width: 14, height: 3, borderRadius: 1, background: textColor }} />
        </button>
        {showColorPicker && colorPickerPos && (
          <div onMouseDown={e => e.stopPropagation()} style={{ position: 'fixed', top: colorPickerPos.top, left: colorPickerPos.left, zIndex: 9999, background: c.surface, border: `1px solid ${c.border}`, borderRadius: 7, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', padding: '8px' }}>
            <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} style={{ width: 40, height: 28, border: 'none', cursor: 'pointer', borderRadius: 4 }} />
          </div>
        )}
      </div>

      {divider}

      {/* Alignment */}
      {(['left', 'center', 'right', 'justify'] as const).map(a =>
        btn(a === 'left' ? '≡L' : a === 'center' ? '≡C' : a === 'right' ? '≡R' : '≡J', `Align ${a}`, () => onFormatChange({ align: a }), formatState.align === a)
      )}

      {divider}

      {/* Lists */}
      {btn('• List', 'Bullet list', () => { if (ta) applyLinePrefix(content, '- ', ta, onContentChange) })}
      {btn('1. List', 'Numbered list', () => { if (ta) applyLinePrefix(content, '1. ', ta, onContentChange) })}

      {divider}

      {/* Quote / Code block */}
      {btn('" Quote', 'Blockquote', () => { if (ta) applyLinePrefix(content, '> ', ta, onContentChange) })}
      {btn('</> Code', 'Code block', () => { if (ta) wrapSelection(content, '```\n', ta, onContentChange) })}

      {divider}

      {/* Table insert */}
      <div style={{ flexShrink: 0 }}>
        <button
          title="Insert table"
          onClick={e => {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
            if (showTablePicker) { setShowTablePicker(false); setTablePickerPos(null) }
            else { setTablePickerPos({ top: rect.bottom + 4, left: rect.left }); setShowTablePicker(true); setTableHover([1, 1]) }
          }}
          onMouseDown={e => e.stopPropagation()}
          style={{ padding: '3px 7px', borderRadius: 4, border: `1px solid ${showTablePicker ? c.accent : 'transparent'}`, background: showTablePicker ? c.accentLight : 'transparent', color: showTablePicker ? c.accent : c.textMuted, fontFamily: uiFont, fontSize: '0.74rem', cursor: 'pointer', transition: 'all 0.12s', display: 'flex', alignItems: 'center', gap: 3 }}
          onMouseEnter={e => { if (!showTablePicker) e.currentTarget.style.background = c.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }}
          onMouseLeave={e => { if (!showTablePicker) e.currentTarget.style.background = 'transparent' }}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" style={{ flexShrink: 0 }}>
            <path d="M0 2a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H2a2 2 0 01-2-2V2zm1 8v4h5v-4H1zm0-5v4h5V5H1zm6 5v4h5v-4H7zm0-5v4h5V5H7z"/>
          </svg>
          Table
        </button>
        {showTablePicker && tablePickerPos && (
          <div onMouseDown={e => e.stopPropagation()} style={{ position: 'fixed', top: tablePickerPos.top, left: tablePickerPos.left, zIndex: 9999, background: c.surface, border: `1px solid ${c.border}`, borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.14)', padding: '10px' }}>
            <div style={{ fontFamily: uiFont, fontSize: '0.68rem', color: c.textFaint, marginBottom: 6, textAlign: 'center' }}>
              {tableHover[0]} × {tableHover[1]} table
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 18px)', gap: 2 }}>
              {Array.from({ length: 36 }, (_, i) => {
                const row = Math.floor(i / 6) + 1
                const col = (i % 6) + 1
                const active = row <= tableHover[0] && col <= tableHover[1]
                return (
                  <div
                    key={i}
                    onMouseEnter={() => setTableHover([row, col])}
                    onClick={() => { insertTable(tableHover[0], tableHover[1]); setShowTablePicker(false) }}
                    style={{ width: 18, height: 18, borderRadius: 2, cursor: 'pointer', border: `1px solid ${active ? c.accent : c.borderFaint}`, background: active ? c.accentLight : 'transparent', transition: 'all 0.08s' }}
                  />
                )
              })}
            </div>
          </div>
        )}
      </div>

      {divider}

      {/* Clear formatting */}
      {btn('✕ Clear', 'Clear formatting', () => {
        if (!ta) return
        const s = ta.selectionStart
        const e = ta.selectionEnd
        const sel = content.slice(s, e)
        const cleared = sel
          .replace(/\*\*(.+?)\*\*/g, '$1')
          .replace(/\*(.+?)\*/g, '$1')
          .replace(/~~(.+?)~~/g, '$1')
          .replace(/`(.+?)`/g, '$1')
          .replace(/^(#{1,4} |> |- |\d+\. )/gm, '')
        const newContent = content.slice(0, s) + cleared + content.slice(e)
        onContentChange(newContent)
        requestAnimationFrame(() => {
          ta.focus()
          ta.setSelectionRange(s, s + cleared.length)
        })
      })}
    </div>
  )
}
