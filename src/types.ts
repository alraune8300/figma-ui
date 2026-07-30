export interface Folder {
  id: string
  name: string
  parentId: string | null
}

export interface Page {
  id: string
  title: string
  content: string
  isDraft: boolean
  createdAt: string
  lastModified: string
  folderId?: string
}

export interface CustomFont {
  id: string
  name: string
  fileName: string
}

export type SyncStatus = 'saved' | 'saving' | 'unsaved' | 'error'

export type Panel = 'none' | 'format' | 'export' | 'preview' | 'timer' | 'colors' | 'fonts' | 'importexport' | 'settings'

export type PaperSize = 'A4' | 'Letter' | 'Legal' | 'A5' | 'Tabloid' | 'pageless'
export type PageOrientation = 'portrait' | 'landscape'
export type PageMode = 'pageless' | 'pages'

export interface PageFormat {
  paperSize: PaperSize
  orientation: PageOrientation
  mode: PageMode
}

export const PAPER_SIZES_PX: Record<PaperSize, { w: number; h: number }> = {
  'A4':      { w: 794,  h: 1123 },
  'Letter':  { w: 816,  h: 1056 },
  'Legal':   { w: 816,  h: 1344 },
  'A5':      { w: 559,  h: 794  },
  'Tabloid': { w: 1056, h: 1632 },
  'pageless': { w: 660, h: 0 },
}

export interface FormatState {
  fontFam: string
  headingFontFam: string
  fontSize: number
  lineH: number
  align: 'left' | 'center' | 'right' | 'justify'
  maxW: number
  paraSpacing: number
  letterSpacing: number
  wordSpacing: number
  firstLineIndent: boolean
}
