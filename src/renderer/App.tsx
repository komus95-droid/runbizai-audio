import React, { useState, useEffect, useCallback } from 'react'
import Scheduler from './components/Scheduler'
import Equalizer from './components/Equalizer'
import LibraryManager from './components/LibraryManager'
import { DaySchedule, EQState, Library } from './types'

const isElectron = typeof window !== 'undefined' && !!window.api

const DAYS_COUNT = 7
const DEFAULT_DAY = (): DaySchedule => ({ bg: null, anns: [], special: null })

function makeDefaultWeek(): DaySchedule[] {
  return Array.from({ length: DAYS_COUNT }, DEFAULT_DAY)
}

function getWeekLabel(weekOffset: number): string {
  const now = new Date()
  now.setDate(now.getDate() - now.getDay() + 1 + weekOffset * 7)
  const end = new Date(now)
  end.setDate(end.getDate() + 6)
  const fmt = (d: Date) => d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  const weekNum = Math.ceil((((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000) + 1) / 7)
  return `Неделя ${weekNum} · ${fmt(now)} – ${fmt(end)}`
}

type Tab = 'schedule' | 'equalizer' | 'library'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'schedule', label: 'Расписание', icon: '📅' },
  { id: 'equalizer', label: 'Эквалайзер', icon: '🎚️' },
  { id: 'library', label: 'Библиотека', icon: '🗂️' },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('schedule')
  const [weekOffset, setWeekOffset] = useState(0)
  const [week, setWeek] = useState<DaySchedule[]>(makeDefaultWeek())
  const [eq, setEq] = useState<EQState>({ bands: Array(10).fill(0), volume: 75, balance: 0 })
  const [library, setLibrary] = useState<Library>({ playlists: [], announcements: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isElectron) { setLoading(false); return }
    Promise.all([
      window.api.schedule.load(),
      window.api.eq.load(),
      window.api.library.load()
    ]).then(([sched, eqData, lib]) => {
      const weekKey = `week-${weekOffset}`
      if (sched[weekKey]) setWeek(sched[weekKey])
      if (eqData.presets?.Нейтрал) {
        setEq(prev => ({ ...prev, bands: eqData.presets[eqData.active] || prev.bands }))
      }
      if (lib.playlists) setLibrary(lib)
    }).finally(() => setLoading(false))
  }, [])

  const saveSchedule = useCallback(async () => {
    if (!isElectron) return
    const weekKey = `week-${weekOffset}`
    const existing = await window.api.schedule.load()
    await window.api.schedule.save({ ...existing, [weekKey]: week })
  }, [week, weekOffset])

  const saveEq = useCallback(async () => {
    if (!isElectron) return
    await window.api.eq.save({ presets: { Custom: eq.bands }, active: 'Custom' })
  }, [eq])

  const saveLibrary = useCallback(async () => {
    if (!isElectron) return
    await window.api.library.save(library)
  }, [library])

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)', fontSize: 14 }}>
        Загрузка RunBizAI…
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 0,
        borderBottom: '0.5px solid var(--border)',
        background: 'var(--bg)', padding: '0 20px',
        height: 48, flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 28 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--purple)', letterSpacing: '-0.3px' }}>RunBizAI</span>
          <span style={{ fontSize: 11, color: 'var(--text3)', background: 'var(--bg2)', padding: '2px 6px', borderRadius: 4 }}>Аудио</span>
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                fontSize: 13, padding: '6px 14px', borderRadius: 6,
                background: tab === t.id ? 'var(--bg2)' : 'transparent',
                color: tab === t.id ? 'var(--text)' : 'var(--text2)',
                border: tab === t.id ? '0.5px solid var(--border)' : '0.5px solid transparent',
                fontWeight: tab === t.id ? 500 : 400,
                gap: 6
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        {!isElectron && (
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text3)', background: 'var(--amber-light)', color: 'var(--amber-text)', padding: '3px 8px', borderRadius: 4 }}>
            Браузер — файловые функции недоступны
          </span>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
        {tab === 'schedule' && (
          <Scheduler
            week={week}
            playlists={library.playlists}
            announcements={library.announcements}
            onWeekChange={setWeek}
            weekLabel={getWeekLabel(weekOffset)}
            onPrev={() => setWeekOffset(w => w - 1)}
            onNext={() => setWeekOffset(w => w + 1)}
            onSave={saveSchedule}
          />
        )}
        {tab === 'equalizer' && (
          <Equalizer eq={eq} onChange={setEq} onSave={saveEq} />
        )}
        {tab === 'library' && (
          <LibraryManager library={library} onChange={setLibrary} onSave={saveLibrary} />
        )}
      </div>
    </div>
  )
}
