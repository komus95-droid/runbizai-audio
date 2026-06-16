import React, { useState, useRef } from 'react'
import { DaySchedule, Playlist, ScheduledAnnouncement, Announcement } from '../types'

const DAYS = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']
const HOURS = [8,10,12,14,16,18,20]
const DAY_START = 8
const DAY_HOURS = 14

interface Props {
  week: DaySchedule[]
  playlists: Playlist[]
  announcements: Announcement[]
  onWeekChange: (w: DaySchedule[]) => void
  weekLabel: string
  onPrev: () => void
  onNext: () => void
  onSave: () => void
}

export default function Scheduler({ week, playlists, announcements, onWeekChange, weekLabel, onPrev, onNext, onSave }: Props) {
  const [currentDay, setCurrentDay] = useState(0)
  const [dragging, setDragging] = useState<{ type: string; id?: string; idx?: number } | null>(null)
  const [dropVisible, setDropVisible] = useState(false)
  const [saved, setSaved] = useState(false)
  const annTrackRef = useRef<HTMLDivElement>(null)

  const sched = week[currentDay]

  function updateDay(patch: Partial<DaySchedule>) {
    const next = [...week]
    next[currentDay] = { ...sched, ...patch }
    onWeekChange(next)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDropVisible(false)
    if (!annTrackRef.current) return
    const rect = annTrackRef.current.getBoundingClientRect()
    const frac = Math.max(0, Math.min(0.92, (e.clientX - rect.left) / rect.width))

    if (dragging?.type === 'new-ann') {
      const ann = announcements.find(a => a.id === dragging.id)
      if (ann) updateDay({ anns: [...sched.anns, { ...ann, sf: frac }] })
    } else if (dragging?.type === 'existing' && dragging.idx !== undefined) {
      const next = [...sched.anns]
      next[dragging.idx] = { ...next[dragging.idx], sf: frac }
      updateDay({ anns: next })
    } else if (dragging?.type === 'bg') {
      const pl = playlists.find(p => p.id === dragging.id)
      if (pl) updateDay({ bg: pl, special: null })
    } else if (dragging?.type === 'special') {
      updateDay({ special: { id: dragging.id!, label: dragging.id === 's1' ? 'День России' : 'Ид аль-Адха' }, bg: null })
    }
    setDragging(null)
  }

  function removeAnn(idx: number) {
    const next = [...sched.anns]
    next.splice(idx, 1)
    updateDay({ anns: next })
  }

  const bgParts = sched.bg
    ? [
        { frac: 0, end: 0.35, label: 'Утро · ' + sched.bg.label, color: sched.bg.color, tc: sched.bg.textColor },
        { frac: 0.35, end: 0.65, label: 'День · ' + sched.bg.label, color: sched.bg.color + 'cc', tc: sched.bg.textColor },
        { frac: 0.65, end: 1, label: 'Вечер · ' + sched.bg.label, color: sched.bg.color + '99', tc: sched.bg.textColor },
      ]
    : []

  function pct(v: number) { return (v * 100).toFixed(2) + '%' }

  function handleSave() {
    onSave()
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', marginRight: 'auto' }}>{weekLabel}</span>
        <button onClick={onPrev}>‹</button>
        <button onClick={onNext}>›</button>
        <button className="primary" onClick={handleSave}>{saved ? '✓ Сохранено' : '💾 Сохранить'}</button>
      </div>

      {/* Day tabs */}
      <div style={{ display: 'flex', gap: 4 }}>
        {DAYS.map((d, i) => {
          const s = week[i]
          const isSpecial = !!s.special
          const isActive = i === currentDay
          return (
            <button
              key={d}
              onClick={() => setCurrentDay(i)}
              style={{
                flex: 1, textAlign: 'center', padding: '6px 4px', fontSize: 12,
                background: isActive ? (isSpecial ? 'var(--amber)' : 'var(--purple)') : 'var(--bg)',
                color: isActive ? (isSpecial ? 'var(--amber-light)' : 'var(--purple-light)') : isSpecial ? 'var(--amber)' : 'var(--text2)',
                borderColor: isSpecial ? 'var(--amber)' : isActive ? 'var(--purple)' : 'var(--border)',
                borderRadius: 8
              }}
            >
              <div>{d}</div>
            </button>
          )
        })}
      </div>

      {/* Timeline */}
      <div style={{ border: '0.5px solid var(--border)', borderRadius: 12, overflow: 'hidden', background: 'var(--bg)' }}>
        {/* Ruler */}
        <div style={{ display: 'flex', padding: '6px 12px', borderBottom: '0.5px solid var(--border)', background: 'var(--bg2)' }}>
          <div style={{ width: 90, flexShrink: 0 }} />
          <div style={{ flex: 1, position: 'relative', height: 16 }}>
            {HOURS.map(h => (
              <span key={h} style={{
                position: 'absolute', fontSize: 10, color: 'var(--text3)',
                left: pct((h - DAY_START) / DAY_HOURS), transform: 'translateX(-50%)'
              }}>{h}:00</span>
            ))}
          </div>
        </div>

        {/* BG track */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', borderBottom: '0.5px solid var(--border)' }}>
          <div style={{ width: 90, fontSize: 12, color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 5 }}>
            🎵 Фон
          </div>
          <div
            style={{ flex: 1, height: 44, position: 'relative', borderRadius: 6, background: 'var(--bg2)' }}
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
          >
            {sched.special ? (
              <div style={{
                position: 'absolute', inset: '4px 4px', borderRadius: 5,
                background: 'var(--amber)', color: 'var(--amber-light)',
                display: 'flex', alignItems: 'center', padding: '0 10px', fontSize: 11, fontWeight: 500
              }}>⭐ {sched.special.label}</div>
            ) : bgParts.map((p, i) => (
              <div key={i} style={{
                position: 'absolute', top: 4, bottom: 4,
                left: pct(p.frac), right: pct(1 - p.end),
                borderRadius: 5, background: p.color, color: p.tc,
                display: 'flex', alignItems: 'center', padding: '0 8px',
                fontSize: 11, fontWeight: 500, overflow: 'hidden', whiteSpace: 'nowrap'
              }}>{p.label}</div>
            ))}
          </div>
        </div>

        {/* Announcements track */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px' }}>
          <div style={{ width: 90, fontSize: 12, color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 5 }}>
            📢 Объявл.
          </div>
          <div
            ref={annTrackRef}
            style={{ flex: 1, height: 44, position: 'relative', borderRadius: 6, background: 'var(--bg2)' }}
            onDragOver={e => { e.preventDefault(); setDropVisible(true) }}
            onDragLeave={() => setDropVisible(false)}
            onDrop={handleDrop}
          >
            <div style={{
              position: 'absolute', inset: '4px 4px', borderRadius: 5,
              border: '1.5px dashed var(--purple)', background: 'var(--purple-light)',
              opacity: dropVisible ? 1 : 0, transition: 'opacity 0.15s', pointerEvents: 'none'
            }} />
            {sched.anns.map((ann, idx) => (
              <div
                key={idx}
                draggable
                onDragStart={e => { setDragging({ type: 'existing', idx }); e.dataTransfer.effectAllowed = 'move' }}
                onDoubleClick={() => removeAnn(idx)}
                title="Двойной клик — удалить"
                style={{
                  position: 'absolute', top: 4, bottom: 4,
                  left: pct(ann.sf), width: pct(ann.dur),
                  borderRadius: 5, background: 'var(--purple)', color: 'var(--purple-light)',
                  display: 'flex', alignItems: 'center', padding: '0 6px',
                  fontSize: 10, fontWeight: 500, cursor: 'grab', overflow: 'hidden', whiteSpace: 'nowrap'
                }}
              >{ann.label}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Library */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {playlists.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: 'var(--text3)', width: 90 }}>🎵 Плейлисты</span>
            {playlists.map(pl => (
              <div
                key={pl.id}
                draggable
                onDragStart={() => setDragging({ type: 'bg', id: pl.id })}
                style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500,
                  background: 'var(--teal-light)', color: 'var(--teal-text)',
                  border: '0.5px solid #9FE1CB', cursor: 'grab', userSelect: 'none'
                }}
              >{pl.label}</div>
            ))}
          </div>
        )}
        {announcements.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: 'var(--text3)', width: 90 }}>📢 Объявл.</span>
            {announcements.map(a => (
              <div
                key={a.id}
                draggable
                onDragStart={() => setDragging({ type: 'new-ann', id: a.id })}
                style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500,
                  background: 'var(--purple-light)', color: 'var(--purple-text)',
                  border: '0.5px solid #AFA9EC', cursor: 'grab', userSelect: 'none'
                }}
              >{a.label}</div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: 'var(--text3)', width: 90 }}>⭐ Праздн.</span>
          {[{ id:'s1', label:'День России' }, { id:'s2', label:'Ид аль-Адха' }].map(s => (
            <div
              key={s.id}
              draggable
              onDragStart={() => setDragging({ type: 'special', id: s.id })}
              style={{
                padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500,
                background: 'var(--amber-light)', color: 'var(--amber-text)',
                border: '0.5px solid #FAC775', cursor: 'grab', userSelect: 'none'
              }}
            >{s.label}</div>
          ))}
        </div>
      </div>
    </div>
  )
}
