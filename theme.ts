export interface Theme {
  bg: string
  heroGrad: string
  cardGrad: string
  text: string
  textMuted: string
  textFaint: string
  accent: string
  accentLight: string
  accentMid: string
  border: string
  borderFaint: string
  surface: string
  header: string
  panel: string
  status: string
  isDark: boolean
}

export interface PresetColors {
  name: string
  emoji: string
  accent: string
  bg: string
  bgAlt: string
  text: string
  textMuted: string
  textFaint: string
  accentLight: string
  accentMid: string
  border: string
  borderFaint: string
  surface: string
  isDark: boolean
}

export const PRESETS: PresetColors[] = [
  {
    name: 'Sky',
    emoji: '☁',
    accent: '#3a78d0',
    bg: '#f0f5fc',
    bgAlt: '#e4edf8',
    text: '#1a2a3a',
    textMuted: '#5a7090',
    textFaint: '#8aaabf',
    accentLight: '#ddeafb',
    accentMid: '#7aaade',
    border: '#c8d8ee',
    borderFaint: '#ddeafb',
    surface: '#f8fbff',
    isDark: false,
  },
  {
    name: 'Ivory',
    emoji: '🕯',
    accent: '#b8693a',
    bg: '#faf7f0',
    bgAlt: '#f3ede0',
    text: '#2a1f12',
    textMuted: '#8a6a50',
    textFaint: '#b8a090',
    accentLight: '#f5e8d8',
    accentMid: '#d49070',
    border: '#e0d0bc',
    borderFaint: '#ede5d4',
    surface: '#fdfaf5',
    isDark: false,
  },
  {
    name: 'Sage',
    emoji: '🌿',
    accent: '#3d7a5c',
    bg: '#f0f5f0',
    bgAlt: '#e4ede6',
    text: '#1a2a1e',
    textMuted: '#507060',
    textFaint: '#88a890',
    accentLight: '#d8ece3',
    accentMid: '#72b090',
    border: '#c4d8c8',
    borderFaint: '#d8ece3',
    surface: '#f6fbf7',
    isDark: false,
  },
  {
    name: 'Dusk',
    emoji: '🌆',
    accent: '#7c5cc4',
    bg: '#f4f0fb',
    bgAlt: '#ece4f6',
    text: '#1e1530',
    textMuted: '#6a5088',
    textFaint: '#a088c0',
    accentLight: '#ede5fb',
    accentMid: '#a888dc',
    border: '#d4c8ec',
    borderFaint: '#e8dff6',
    surface: '#faf8ff',
    isDark: false,
  },
  {
    name: 'Sepia',
    emoji: '📜',
    accent: '#8a5a30',
    bg: '#f5eedf',
    bgAlt: '#eee3cc',
    text: '#2a1e0e',
    textMuted: '#7a5a38',
    textFaint: '#b09070',
    accentLight: '#f0dfc8',
    accentMid: '#c09060',
    border: '#d8c4a0',
    borderFaint: '#e8d8bc',
    surface: '#faf6ec',
    isDark: false,
  },
  {
    name: 'Night',
    emoji: '🌙',
    accent: '#8b72e0',
    bg: '#1a1628',
    bgAlt: '#211c34',
    text: '#e8e0f8',
    textMuted: '#a090c8',
    textFaint: '#6a5a90',
    accentLight: '#2e2650',
    accentMid: '#6048b8',
    border: '#362e58',
    borderFaint: '#28224a',
    surface: '#211c34',
    isDark: true,
  },
  {
    name: 'Midnight',
    emoji: '🌊',
    accent: '#5b92e0',
    bg: '#141c2e',
    bgAlt: '#1a2440',
    text: '#d8e8f8',
    textMuted: '#8098c0',
    textFaint: '#506080',
    accentLight: '#1e2e4e',
    accentMid: '#3a68b8',
    border: '#283850',
    borderFaint: '#1e2e44',
    surface: '#1a2440',
    isDark: true,
  },
  {
    name: 'Forest',
    emoji: '🌲',
    accent: '#5ab870',
    bg: '#141e18',
    bgAlt: '#1a2820',
    text: '#d8f0dc',
    textMuted: '#78a880',
    textFaint: '#486850',
    accentLight: '#1c3024',
    accentMid: '#38885a',
    border: '#243830',
    borderFaint: '#1c2e24',
    surface: '#1a2820',
    isDark: true,
  },
  {
    name: 'Obsidian',
    emoji: '',
    accent: '#c8a86e',
    bg: '#0d0d0f',
    bgAlt: '#111115',
    text: '#e8e4d8',
    textMuted: '#9a9080',
    textFaint: '#5a5448',
    accentLight: '#1e1a12',
    accentMid: '#a07848',
    border: '#222018',
    borderFaint: '#1a1814',
    surface: '#111115',
    isDark: true,
  },
  {
    name: 'Carbon',
    emoji: '',
    accent: '#7ec8e3',
    bg: '#1c1c1e',
    bgAlt: '#242426',
    text: '#f0f0f0',
    textMuted: '#9a9a9e',
    textFaint: '#5c5c60',
    accentLight: '#1c2a30',
    accentMid: '#4a9ab8',
    border: '#3a3a3e',
    borderFaint: '#2a2a2e',
    surface: '#242426',
    isDark: true,
  },
  {
    name: 'Ash',
    emoji: '',
    accent: '#e8856a',
    bg: '#1e1a18',
    bgAlt: '#262220',
    text: '#ede8e0',
    textMuted: '#9a9088',
    textFaint: '#5a5450',
    accentLight: '#2a1e1a',
    accentMid: '#c06048',
    border: '#363028',
    borderFaint: '#2a2620',
    surface: '#262220',
    isDark: true,
  },
]

export function buildPresetTheme(p: PresetColors, overrides?: Partial<PresetColors>): Theme {
  const m = { ...p, ...overrides }
  const headerSuffix = m.isDark ? 'd8' : 'e8'
  return {
    bg: `linear-gradient(150deg, ${m.bg} 0%, ${m.bgAlt} 100%)`,
    heroGrad: `linear-gradient(148deg, ${m.bg} 0%, ${m.bgAlt} 55%, ${m.bg} 100%)`,
    cardGrad: `linear-gradient(135deg, ${m.surface} 0%, ${m.bgAlt} 100%)`,
    text: m.text,
    textMuted: m.textMuted,
    textFaint: m.textFaint,
    accent: m.accent,
    accentLight: m.accentLight,
    accentMid: m.accentMid,
    border: m.border,
    borderFaint: m.borderFaint,
    surface: m.surface,
    header: m.bg + headerSuffix,
    panel: m.surface,
    status: m.bg,
    isDark: m.isDark,
  }
}

export function buildHueTheme(hue: number): Theme {
  return {
    bg: `linear-gradient(150deg, hsl(${hue}, 26%, 97%) 0%, hsl(${(hue + 48) % 360}, 20%, 93%) 100%)`,
    heroGrad: `linear-gradient(148deg, hsl(${hue}, 34%, 95%) 0%, hsl(${(hue + 28) % 360}, 28%, 91%) 55%, hsl(${(hue + 68) % 360}, 26%, 94%) 100%)`,
    cardGrad: `linear-gradient(135deg, hsl(${hue}, 16%, 99%) 0%, hsl(${(hue + 22) % 360}, 14%, 97%) 100%)`,
    text: `hsl(${hue}, 12%, 15%)`,
    textMuted: `hsl(${hue}, 8%, 52%)`,
    textFaint: `hsl(${hue}, 8%, 68%)`,
    accent: `hsl(${hue}, 58%, 46%)`,
    accentLight: `hsl(${hue}, 68%, 95%)`,
    accentMid: `hsl(${hue}, 44%, 72%)`,
    border: `hsl(${hue}, 14%, 87%)`,
    borderFaint: `hsl(${hue}, 14%, 92%)`,
    surface: `hsl(${hue}, 14%, 99%)`,
    header: `hsla(${hue}, 20%, 98%, 0.9)`,
    panel: `hsl(${hue}, 13%, 98%)`,
    status: `hsl(${hue}, 13%, 97%)`,
    isDark: false,
  }
}
