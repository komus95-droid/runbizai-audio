import React, { useState } from 'react'
import { Library, Playlist, Announcement, AudioFile } from '../types'

const PLAYLIST_COLORS = [
  { color: '#1D9E75', textColor: '#04342C' },
  { color: '#534AB7', textColor: '#EEEDFE' },
  { color: '#D85A30', textColor: '#4A1B0C' },
  { color: '#185FA5', textColor: '#042C53' },
  { color: '#854F0B', textColor: '#412402' },
]

const isElectron = typeof window !== 'undefined' && !!window.api

interface Props {
  library: Library
  onChange: (lib: Library) => void
  onSave: () => void
}

export default function LibraryManager({ library, onChange, onSave }: Props) {
  const [scanningId, setScanningId] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function addPlaylist() {
    if (!isElectron) return
    const folder = await window.api.dialog.pickFolder()
    if (!folder) return
    const files = await window.api.fs.scanFolder(folder)
    const colorIdx = library.playlists.length % PLAYLIST_COLORS.length
    const folderName = folder.split(/[/\\]/).pop() || 'Плейлист'
    const pl: Playlist = {
      id: `pl-${Date.now()}`,
      label: folderName,
      folder,
      files,
      ...PLAYLIST_COLORS[colorIdx]
    }
    onChange({ ...library, playlists: [...library.playlists, pl] })
  }

  async function refreshPlaylist(id: string) {
    if (!isElectron) return
    setScanningId(id)
    const pl = library.playlists.find(p => p.id === id)
    if (!pl) { setScanningId(null); return }
    const files = await window.api.fs.scanFolder(pl.folder)
    onChange({
      ...library,
      playlists: library.playlists.map(p => p.id === id ? { ...p, files } : p)
    })
    setScanningId(null)
  }

  function removePlaylist(id: string) {
    onChange({ ...library, playlists: library.playlists.filter(p => p.id !== id) })
  }

  async function addAnnouncements() {
    if (!isElectron) return
    const paths = await window.api.dialog.pickFiles()
    if (!paths.length) return
    const newAnns: Announcement[] = paths
      .filter(p => !library.announcements.find(a => a.path === p))
      .map(p => ({
        id: `ann-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        label: p.split(/[/\\]/).pop()?.replace(/\.[^.]+$/, '') || 'Объявление',
        path: p,
        dur: 0.04
      }))
    onChange({ ...library, announcements: [...library.announcements, ...newAnns] })
  }

  function removeAnn(id: string) {
    onChange({ ...library, announcements: library.announcements.filter(a => a.id !== id) })
  }

  function handleSave() {
    onSave()
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Playlists */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', flex: 1 }}>🎵 Фоновые плейлисты</span>
          <button onClick={addPlaylist} disabled={!isElectron}>+ Добавить папку</button>
        </div>
        {library.playlists.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--text3)', padding: '16px 0' }}>
            Нажми «+ Добавить папку» — выбери папку с MP3 на компьютере
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {library.playlists.map(pl => (
              <div key={pl.id} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                border: '0.5px solid var(--border)', borderRadius: 8, background: 'var(--bg)'
              }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: pl.color, flexShrink: 0
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {pl.label}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {pl.folder} · {pl.files.length} файлов
                  </div>
                </div>
                <button onClick={() => refreshPlaylist(pl.id)} disabled={scanningId === pl.id} style={{ fontSize: 11 }}>
                  {scanningId === pl.id ? '⏳' : '🔄'}
                </button>
                <button onClick={() => removePlaylist(pl.id)} style={{ fontSize: 11, color: '#D85A30', borderColor: '#F09595' }}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Announcements */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', flex: 1 }}>📢 Объявления</span>
          <button onClick={addAnnouncements} disabled={!isElectron}>+ Добавить файлы</button>
        </div>
        {library.announcements.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--text3)', padding: '16px 0' }}>
            Нажми «+ Добавить файлы» — выбери MP3 с записями объявлений
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {library.announcements.map(a => (
              <div key={a.id} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px',
                border: '0.5px solid var(--border)', borderRadius: 8, background: 'var(--bg)'
              }}>
                <span style={{ fontSize: 12, color: 'var(--purple)' }}>🔔</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.label}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.path}
                  </div>
                </div>
                <button onClick={() => removeAnn(a.id)} style={{ fontSize: 11, color: '#D85A30', borderColor: '#F09595' }}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4, borderTop: '0.5px solid var(--border)' }}>
        {isElectron && (
          <button onClick={() => window.api.shell.openDataDir()} style={{ fontSize: 11 }}>
            📁 Открыть папку данных
          </button>
        )}
        <button className="primary" onClick={handleSave}>
          {saved ? '✓ Сохранено' : '💾 Сохранить библиотеку'}
        </button>
      </div>
    </div>
  )
}
