import { useState } from 'react'
import { Theme } from './theme'
import { Page, Folder, SyncStatus } from './types'
import { Lang, t } from './i18n'

interface LeftPanelProps {
  c: Theme
  uiFont: string
  monoFont: string
  pages: Page[]
  activePageId: string
  onSelectPage: (id: string) => void
  onNewPage: (isDraft: boolean) => void
  onDeletePage: (id: string) => void
  onRenamePage: (id: string, newTitle: string) => void
  syncStatus: SyncStatus
  lastSaved: Date
  driveConnected: boolean
  driveConnecting: boolean
  onConnectDrive: () => void
  onDisconnectDrive: () => void
  bin: Page[]
  onRestorePage: (id: string) => void
  onPermanentDelete: (id: string) => void
  onEmptyBin: () => void
  lang: Lang
  folders: Folder[]
  onCreateFolder: (parentId: string | null) => void
  onRenameFolder: (id: string, name: string) => void
  onDeleteFolder: (id: string) => void
  onMovePageToFolder: (pageId: string, folderId: string | undefined) => void
}

function timeSince(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 10) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  return `${Math.floor(minutes / 60)}h ago`
}

export default function LeftPanel({
  c, uiFont, monoFont,
  pages, activePageId, onSelectPage, onNewPage, onDeletePage, onRenamePage,
  syncStatus, lastSaved, driveConnected, driveConnecting, onConnectDrive, onDisconnectDrive,
  bin, onRestorePage, onPermanentDelete, onEmptyBin,
  lang, folders, onCreateFolder, onRenameFolder, onDeleteFolder, onMovePageToFolder,
}: LeftPanelProps) {
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameVal, setRenameVal] = useState('')
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [, setTick] = useState(0)
  const [activeTab, setActiveTab] = useState<'pages' | 'drafts'>('pages')
  const [binOpen, setBinOpen] = useState(false)
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set())
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null)
  const [folderRenameVal, setFolderRenameVal] = useState('')
  const [hoverFolderId, setHoverFolderId] = useState<string | null>(null)
  const [dragPageId, setDragPageId] = useState<string | null>(null)
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null | 'root'>('root')

  useState(() => {
    const id = setInterval(() => setTick(tk => tk + 1), 30000)
    return () => clearInterval(id)
  })

  const nonDrafts = pages.filter(p => !p.isDraft)
  const drafts = pages.filter(p => p.isDraft)

  const syncDotColor = { saved: '#4caf72', saving: '#f0a030', unsaved: c.textFaint, error: '#e05050' }[syncStatus]
  const syncLabel = { saved: `Saved ${timeSince(lastSaved)}`, saving: 'Saving...', unsaved: 'Unsaved changes', error: 'Save error' }[syncStatus]

  const toggleFolder = (id: string) => {
    setCollapsedFolders(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const commitRename = (id: string) => {
    if (renameVal.trim()) onRenamePage(id, renameVal.trim())
    setRenamingId(null)
  }

  const commitFolderRename = (id: string) => {
    if (folderRenameVal.trim()) onRenameFolder(id, folderRenameVal.trim())
    setRenamingFolderId(null)
  }

  const iconBtn = (label: string, title: string, onClick: (e: React.MouseEvent) => void, danger = false) => (
    <button
      title={title}
      onClick={onClick}
      style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px',
        fontFamily: uiFont, fontSize: '0.7rem', lineHeight: 1, borderRadius: 3,
        color: danger ? c.textFaint : c.textFaint, transition: 'color 0.12s',
      }}
      onMouseEnter={e => (e.currentTarget.style.color = danger ? '#e05050' : c.accent)}
      onMouseLeave={e => (e.currentTarget.style.color = c.textFaint)}
    >
      {label}
    </button>
  )

  const renderPage = (page: Page, indent = 0) => (
    <div
      key={page.id}
      draggable
      onDragStart={() => setDragPageId(page.id)}
      onDragEnd={() => { setDragPageId(null); setDragOverFolderId(null) }}
      onMouseEnter={() => setHoverId(page.id)}
      onMouseLeave={() => setHoverId(null)}
      style={{
        position: 'relative',
        margin: '1px 6px',
        marginLeft: 6 + indent * 14,
        borderRadius: 6,
        background: activePageId === page.id
          ? c.accentLight
          : hoverId === page.id
            ? (c.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)')
            : 'transparent',
        transition: 'background 0.12s',
        opacity: dragPageId === page.id ? 0.4 : 1,
      }}
    >
      {renamingId === page.id ? (
        <input
          autoFocus
          value={renameVal}
          onChange={e => setRenameVal(e.target.value)}
          onBlur={() => commitRename(page.id)}
          onKeyDown={e => {
            if (e.key === 'Enter') commitRename(page.id)
            if (e.key === 'Escape') setRenamingId(null)
          }}
          style={{
            width: '100%', padding: '6px 10px',
            fontFamily: uiFont, fontSize: '0.78rem',
            background: 'transparent', border: 'none',
            outline: `1.5px solid ${c.accent}`, borderRadius: 5, color: c.text,
          }}
        />
      ) : (
        <div
          onClick={() => onSelectPage(page.id)}
          onDoubleClick={() => { setRenamingId(page.id); setRenameVal(page.title) }}
          style={{
            padding: '6px 28px 6px 10px',
            fontFamily: uiFont, fontSize: '0.78rem',
            color: activePageId === page.id ? c.accent : c.text,
            fontWeight: activePageId === page.id ? 600 : 400,
            cursor: 'pointer', lineHeight: 1.4,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            borderLeft: activePageId === page.id ? `2px solid ${c.accent}` : '2px solid transparent',
            transition: 'color 0.12s',
          }}
        >
          {page.title}
        </div>
      )}
      {hoverId === page.id && renamingId !== page.id && (
        <button
          onClick={e => { e.stopPropagation(); onDeletePage(page.id) }}
          style={{
            position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer',
            color: c.textFaint, fontSize: '0.85rem', lineHeight: 1,
            padding: '2px 4px', borderRadius: 3, transition: 'color 0.12s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#e05050')}
          onMouseLeave={e => (e.currentTarget.style.color = c.textFaint)}
        >
          ×
        </button>
      )}
    </div>
  )

  const renderFolder = (folder: Folder, depth = 0): React.ReactNode => {
    const isCollapsed = collapsedFolders.has(folder.id)
    const childFolders = folders.filter(f => f.parentId === folder.id)
    const folderPages = (activeTab === 'pages' ? nonDrafts : drafts).filter(p => p.folderId === folder.id)
    const isDragOver = dragOverFolderId === folder.id

    return (
      <div key={folder.id}>
        {/* Folder row */}
        <div
          onMouseEnter={() => setHoverFolderId(folder.id)}
          onMouseLeave={() => setHoverFolderId(null)}
          onDragOver={e => { e.preventDefault(); setDragOverFolderId(folder.id) }}
          onDragLeave={() => setDragOverFolderId(null)}
          onDrop={e => {
            e.preventDefault()
            if (dragPageId) onMovePageToFolder(dragPageId, folder.id)
            setDragOverFolderId(null)
          }}
          style={{
            margin: '1px 6px',
            marginLeft: 6 + depth * 14,
            borderRadius: 6,
            background: isDragOver
              ? c.accentLight
              : hoverFolderId === folder.id
                ? (c.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)')
                : 'transparent',
            border: isDragOver ? `1px dashed ${c.accentMid}` : '1px solid transparent',
            transition: 'all 0.1s',
          }}
        >
          {renamingFolderId === folder.id ? (
            <input
              autoFocus
              value={folderRenameVal}
              onChange={e => setFolderRenameVal(e.target.value)}
              onBlur={() => commitFolderRename(folder.id)}
              onKeyDown={e => {
                if (e.key === 'Enter') commitFolderRename(folder.id)
                if (e.key === 'Escape') setRenamingFolderId(null)
              }}
              style={{
                width: '100%', padding: '5px 10px',
                fontFamily: uiFont, fontSize: '0.76rem',
                background: 'transparent', border: 'none',
                outline: `1.5px solid ${c.accent}`, borderRadius: 5, color: c.text,
              }}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', padding: '5px 8px', gap: 4 }}>
              <button
                onClick={() => toggleFolder(folder.id)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: c.textFaint, fontSize: '0.6rem', padding: '0 2px', flexShrink: 0,
                  transform: isCollapsed ? 'rotate(-90deg)' : 'none', transition: 'transform 0.15s',
                }}
              >
                ▾
              </button>
              <svg width="12" height="12" viewBox="0 0 16 16" fill={c.textFaint} style={{ flexShrink: 0 }}>
                <path d="M1 3.5A1.5 1.5 0 012.5 2H6l1.5 2H13.5A1.5 1.5 0 0115 5.5v7A1.5 1.5 0 0113.5 14h-11A1.5 1.5 0 011 12.5V3.5z"/>
              </svg>
              <span
                onDoubleClick={() => { setRenamingFolderId(folder.id); setFolderRenameVal(folder.name) }}
                style={{ flex: 1, fontFamily: uiFont, fontSize: '0.76rem', color: c.text, cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                {folder.name}
              </span>
              {hoverFolderId === folder.id && (
                <div style={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                  {iconBtn('+', 'New subfolder', e => { e.stopPropagation(); onCreateFolder(folder.id) })}
                  {iconBtn('×', 'Delete folder', e => { e.stopPropagation(); onDeleteFolder(folder.id) }, true)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Children */}
        {!isCollapsed && (
          <div>
            {childFolders.map(cf => renderFolder(cf, depth + 1))}
            {folderPages.map(p => renderPage(p, depth + 1))}
            {childFolders.length === 0 && folderPages.length === 0 && (
              <div
                onDragOver={e => { e.preventDefault(); setDragOverFolderId(folder.id) }}
                onDragLeave={() => setDragOverFolderId(null)}
                onDrop={e => {
                  e.preventDefault()
                  if (dragPageId) onMovePageToFolder(dragPageId, folder.id)
                  setDragOverFolderId(null)
                }}
                style={{
                  marginLeft: 6 + (depth + 1) * 14 + 6, padding: '4px 10px',
                  fontFamily: uiFont, fontSize: '0.68rem', color: c.textFaint, fontStyle: 'italic',
                }}
              >
                Drop files here
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const renderTabContent = (isDraftSection: boolean) => {
    const list = isDraftSection ? drafts : nonDrafts
    const rootFolders = folders.filter(f => f.parentId === null)
    const rootPages = list.filter(p => !p.folderId || !folders.find(f => f.id === p.folderId))

    return (
      <div>
        {/* Root folders */}
        {rootFolders.map(f => renderFolder(f, 0))}

        {/* Root-level pages drop zone */}
        {rootPages.length === 0 && rootFolders.length === 0 ? (
          <div
            onDragOver={e => { e.preventDefault(); setDragOverFolderId('root') }}
            onDragLeave={() => setDragOverFolderId(null)}
            onDrop={e => {
              e.preventDefault()
              if (dragPageId) onMovePageToFolder(dragPageId, undefined)
              setDragOverFolderId(null)
            }}
            style={{
              padding: '10px 12px', fontFamily: uiFont, fontSize: '0.72rem',
              color: c.textFaint, fontStyle: 'italic',
              background: dragOverFolderId === 'root' ? c.accentLight : 'transparent',
              borderRadius: 6, margin: '2px 6px', transition: 'background 0.1s',
            }}
          >
            {isDraftSection ? 'No drafts yet. Click + to start one.' : 'No pages yet. Click + to create one.'}
          </div>
        ) : (
          <div
            onDragOver={e => { e.preventDefault(); setDragOverFolderId('root') }}
            onDragLeave={() => setDragOverFolderId(null)}
            onDrop={e => {
              e.preventDefault()
              if (dragPageId) onMovePageToFolder(dragPageId, undefined)
              setDragOverFolderId(null)
            }}
            style={{
              background: dragOverFolderId === 'root' ? c.accentLight : 'transparent',
              border: dragOverFolderId === 'root' ? `1px dashed ${c.accentMid}` : '1px solid transparent',
              borderRadius: 6, margin: '2px 4px', transition: 'all 0.1s',
            }}
          >
            {rootPages.map(p => renderPage(p, 0))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{
      width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column',
      background: c.isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.025)',
      borderRight: `1px solid ${c.borderFaint}`,
      overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

        {/* Tab strip */}
        <div style={{ display: 'flex', alignItems: 'center', borderBottom: `1px solid ${c.borderFaint}` }}>
          {(['pages', 'drafts'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1, padding: '8px 4px', background: 'none', border: 'none',
                borderBottom: `2px solid ${activeTab === tab ? c.accent : 'transparent'}`,
                fontFamily: uiFont, fontSize: '0.7rem', fontWeight: activeTab === tab ? 600 : 400,
                color: activeTab === tab ? c.accent : c.textFaint,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {t(lang, tab)}
              <span style={{ marginLeft: 4, fontSize: '0.62rem', opacity: 0.7 }}>
                ({tab === 'pages' ? nonDrafts.length : drafts.length})
              </span>
            </button>
          ))}
          {/* New page */}
          <button
            onClick={() => onNewPage(activeTab === 'drafts')}
            title={activeTab === 'drafts' ? t(lang, 'newDraft') : t(lang, 'newPage')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: c.textFaint, fontSize: '1rem', lineHeight: 1,
              padding: '4px 6px', transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = c.accent)}
            onMouseLeave={e => (e.currentTarget.style.color = c.textFaint)}
          >
            +
          </button>
          {/* New folder */}
          <button
            onClick={() => onCreateFolder(null)}
            title="New folder"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: c.textFaint, lineHeight: 1,
              padding: '4px 8px', transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = c.accent)}
            onMouseLeave={e => (e.currentTarget.style.color = c.textFaint)}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
              <path d="M1 3.5A1.5 1.5 0 012.5 2H6l1.5 2H13.5A1.5 1.5 0 0115 5.5v7A1.5 1.5 0 0113.5 14h-11A1.5 1.5 0 011 12.5V3.5z"/>
              <path d="M8 7v2H6v1h2v2h1v-2h2v-1H9V7H8z" fill="white"/>
            </svg>
          </button>
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflow: 'auto', paddingTop: 6, paddingBottom: 8 }}>
          {renderTabContent(activeTab === 'drafts')}
        </div>
      </div>

      {/* Bin */}
      <div style={{ borderTop: `1px solid ${c.borderFaint}`, padding: '8px 0 4px' }}>
        <button
          onClick={() => setBinOpen(v => !v)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '4px 12px', background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: uiFont, fontSize: '0.62rem', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.1em', color: c.textFaint,
            transition: 'color 0.12s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = c.accent)}
          onMouseLeave={e => (e.currentTarget.style.color = c.textFaint)}
        >
          <span>{t(lang, 'bin')}{bin.length > 0 ? ` (${bin.length})` : ''}</span>
          <span style={{ fontSize: '0.6rem', transform: binOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
        </button>
        {binOpen && (
          <div style={{ padding: '4px 0' }}>
            {bin.length === 0 ? (
              <div style={{ padding: '6px 12px', fontFamily: uiFont, fontSize: '0.72rem', color: c.textFaint, fontStyle: 'italic' }}>
                {t(lang, 'deletedItems')} (0)
              </div>
            ) : (
              <>
                {bin.map(page => (
                  <div key={page.id} style={{ padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ flex: 1, fontFamily: uiFont, fontSize: '0.74rem', color: c.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {page.title}
                    </span>
                    <button onClick={() => onRestorePage(page.id)} title={t(lang, 'restore')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: uiFont, fontSize: '0.65rem', color: c.accent, padding: '1px 4px', flexShrink: 0 }}>
                      ↩
                    </button>
                    <button onClick={() => onPermanentDelete(page.id)} title={t(lang, 'deleteForever')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: uiFont, fontSize: '0.7rem', color: c.textFaint, padding: '1px 4px', flexShrink: 0, transition: 'color 0.12s' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#e05050')}
                      onMouseLeave={e => (e.currentTarget.style.color = c.textFaint)}>
                      ×
                    </button>
                  </div>
                ))}
                <button onClick={onEmptyBin}
                  style={{
                    display: 'block', width: 'calc(100% - 24px)', margin: '4px 12px',
                    padding: '4px 8px', borderRadius: 5, border: `1px solid ${c.borderFaint}`,
                    background: 'none', cursor: 'pointer',
                    fontFamily: uiFont, fontSize: '0.68rem', color: c.textFaint,
                    transition: 'color 0.12s, border-color 0.12s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#e05050'; e.currentTarget.style.borderColor = '#e05050' }}
                  onMouseLeave={e => { e.currentTarget.style.color = c.textFaint; e.currentTarget.style.borderColor = c.borderFaint }}>
                  {t(lang, 'emptyBin')}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Sync status */}
      <div style={{ padding: '8px 14px', borderTop: `1px solid ${c.borderFaint}`, display: 'flex', alignItems: 'center', gap: 7 }}>
        <div style={{
          width: 7, height: 7, borderRadius: '50%', background: syncDotColor, flexShrink: 0,
          boxShadow: syncStatus === 'saving' ? `0 0 0 3px ${syncDotColor}44` : 'none',
          animation: syncStatus === 'saving' ? 'pulse 1.2s ease-in-out infinite' : 'none',
          transition: 'background 0.3s, box-shadow 0.3s',
        }} />
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
        <span style={{ fontFamily: uiFont, fontSize: '0.68rem', color: c.textFaint, lineHeight: 1.4 }}>{syncLabel}</span>
      </div>

      {/* Google Drive */}
      <div style={{ padding: '10px 14px', borderTop: `1px solid ${c.borderFaint}` }}>
        <span style={{ fontFamily: uiFont, fontSize: '0.62rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: c.textFaint, display: 'block', marginBottom: 7 }}>
          {t(lang, 'googleDrive')}
        </span>
        {driveConnected ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M4.5 20L1 14l5.5-9.5h11L23 14l-3.5 6H4.5z" fill="#4285f4" opacity="0.2"/>
                <path d="M8 20l-4-6.5 4-7h8l4 7-4 6.5H8z" stroke="#4285f4" strokeWidth="1.5" fill="none"/>
              </svg>
              <span style={{ fontFamily: uiFont, fontSize: '0.72rem', color: c.text }}>drive@gmail.com</span>
            </div>
            <button onClick={onDisconnectDrive}
              style={{ fontFamily: uiFont, fontSize: '0.68rem', color: c.textFaint, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline', transition: 'color 0.12s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#e05050')}
              onMouseLeave={e => (e.currentTarget.style.color = c.textFaint)}>
              {t(lang, 'disconnect')}
            </button>
          </div>
        ) : (
          <button onClick={onConnectDrive} disabled={driveConnecting}
            style={{
              width: '100%', padding: '6px 10px', borderRadius: 6, border: `1px solid ${c.border}`,
              background: driveConnecting ? c.accentLight : 'transparent',
              fontFamily: uiFont, fontSize: '0.74rem', color: driveConnecting ? c.accent : c.textMuted,
              cursor: driveConnecting ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s',
            }}
            onMouseEnter={e => { if (!driveConnecting) e.currentTarget.style.borderColor = c.accentMid }}
            onMouseLeave={e => { if (!driveConnecting) e.currentTarget.style.borderColor = c.border }}>
            {driveConnecting ? (
              <>
                <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
                <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
                {t(lang, 'connecting')}
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill={c.textMuted}>
                  <path d="M4.5 20L1 14l5.5-9.5h11L23 14l-3.5 6H4.5z"/>
                </svg>
                {t(lang, 'connectDrive')}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
