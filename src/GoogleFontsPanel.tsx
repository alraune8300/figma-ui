import { useState } from 'react'
import { Theme } from './theme'

const GOOGLE_FONTS = [
  // Serif
  'Abril Fatface', 'Alegreya', 'Alice', 'Amiri', 'Arvo',
  'Bitter', 'Bodoni Moda', 'Cinzel', 'Cormorant', 'Cormorant Garamond',
  'Crete Round', 'Domine', 'EB Garamond', 'Faustina', 'Fenix',
  'Frank Ruhl Libre', 'Fraunces', 'GFS Didot', 'Gelasio', 'Gentium Book Plus',
  'Gilda Display', 'Gravitas One', 'Headland One', 'Imbue', 'Josefin Slab',
  'Judson', 'Kameron', 'Libre Baskerville', 'Lora', 'Lustria',
  'Martel', 'Merriweather', 'Neuton', 'Noticia Text', 'Noto Serif',
  'Old Standard TT', 'Playfair Display', 'Podkova', 'Poly', 'PT Serif',
  'Quattrocento', 'Roboto Slab', 'Rokkitt', 'Rufina', 'Slabo 27px',
  'Source Serif 4', 'Spectral', 'Tinos', 'Ultra', 'Unna',
  // Sans
  'Abel', 'Acme', 'Alata', 'Alegreya Sans', 'Arimo',
  'Assistant', 'Barlow', 'Cabin', 'Catamaran', 'Chivo',
  'Comfortaa', 'DM Sans', 'Dosis', 'Encode Sans', 'Exo 2',
  'Fira Sans', 'Fjalla One', 'Heebo', 'Hind', 'IBM Plex Sans',
  'Josefin Sans', 'Kanit', 'Karla', 'Lato', 'Libre Franklin',
  'Manrope', 'Montserrat', 'Mukta', 'Mulish', 'Noto Sans',
  'Nunito', 'Nunito Sans', 'Open Sans', 'Oswald', 'Outfit',
  'Oxanium', 'Poppins', 'PT Sans', 'Questrial', 'Quicksand',
  'Raleway', 'Roboto', 'Rubik', 'Source Sans 3', 'Titillium Web',
  'Ubuntu', 'Varela Round', 'Work Sans', 'Yantramanav', 'Zilla Slab',
  // Mono
  'Anonymous Pro', 'Azeret Mono', 'B612 Mono', 'Courier Prime',
  'DM Mono', 'Fira Code', 'Fira Mono', 'Fragment Mono',
  'IBM Plex Mono', 'Inconsolata', 'JetBrains Mono', 'Jura',
  'Nanum Gothic Coding', 'Noto Sans Mono', 'Overpass Mono',
  'PT Mono', 'Roboto Mono', 'Share Tech Mono', 'Source Code Pro',
  'Space Mono', 'Ubuntu Mono', 'Xanh Mono',
]

const loadedFonts = new Set<string>()

function loadGoogleFont(name: string) {
  if (loadedFonts.has(name)) return
  loadedFonts.add(name)
  const id = `gf-${name.replace(/\s+/g, '-')}`
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name)}:ital,wght@0,400;0,700;1,400&display=swap`
  document.head.appendChild(link)
}

interface GoogleFontsPanelProps {
  onSelect: (fontName: string) => void
  c: Theme
  uiFont: string
}

export default function GoogleFontsPanel({ onSelect, c, uiFont }: GoogleFontsPanelProps) {
  const [search, setSearch] = useState('')
  const [preview, setPreview] = useState('The quick brown fox')
  const [loaded, setLoaded] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<string | null>(null)

  const filtered = GOOGLE_FONTS.filter(f =>
    f.toLowerCase().includes(search.toLowerCase())
  )

  const handleLoad = (name: string) => {
    loadGoogleFont(name)
    setLoaded(prev => new Set([...prev, name]))
  }

  const handleSelect = (name: string) => {
    handleLoad(name)
    setSelected(name)
    onSelect(name)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <input
        type="text"
        placeholder="Search fonts..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          width: '100%', padding: '5px 8px',
          fontFamily: uiFont, fontSize: '0.75rem',
          border: `1px solid ${c.border}`,
          borderRadius: 5, background: 'transparent',
          color: c.text, outline: 'none',
          boxSizing: 'border-box',
        }}
      />
      <input
        type="text"
        placeholder="Preview text..."
        value={preview}
        onChange={e => setPreview(e.target.value)}
        style={{
          width: '100%', padding: '4px 8px',
          fontFamily: uiFont, fontSize: '0.72rem',
          border: `1px solid ${c.borderFaint}`,
          borderRadius: 5, background: 'transparent',
          color: c.textMuted, outline: 'none',
          boxSizing: 'border-box',
        }}
      />
      <div style={{
        maxHeight: 280, overflowY: 'auto',
        border: `1px solid ${c.borderFaint}`,
        borderRadius: 6,
      }}>
        {filtered.map(name => {
          const isLoaded = loaded.has(name)
          const isSelected = selected === name
          return (
            <div
              key={name}
              onClick={() => handleSelect(name)}
              onMouseEnter={() => handleLoad(name)}
              style={{
                padding: '7px 10px',
                cursor: 'pointer',
                background: isSelected ? c.accentLight : 'transparent',
                borderBottom: `1px solid ${c.borderFaint}`,
                transition: 'background 0.1s',
              }}
              onMouseOver={e => {
                if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = c.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'
              }}
              onMouseOut={e => {
                if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'transparent'
              }}
            >
              <div style={{
                fontFamily: isLoaded ? `'${name}', serif` : uiFont,
                fontSize: '0.9rem',
                color: isSelected ? c.accent : c.text,
                lineHeight: 1.4,
              }}>
                {preview || name}
              </div>
              <div style={{
                fontFamily: uiFont, fontSize: '0.65rem',
                color: isSelected ? c.accentMid : c.textFaint,
                marginTop: 1,
              }}>
                {name}
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div style={{ padding: '12px 10px', fontFamily: uiFont, fontSize: '0.75rem', color: c.textFaint, textAlign: 'center' }}>
            No fonts found
          </div>
        )}
      </div>
    </div>
  )
}
