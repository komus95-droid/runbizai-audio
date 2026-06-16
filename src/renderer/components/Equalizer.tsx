import React, { useState } from 'react'
import { EQState } from '../types'

const FREQS = ['32','64','125','250','500','1k','2k','4k','8k','16k']

const DEFAULT_PRESETS: Record<string, number[]> = {
  'Нейтрал':  [0,0,0,0,0,0,0,0,0,0],
  'Магазин':  [2,2,0,-1,-1,0,1,2,2,1],
  'Речь':     [-2,0,2,4,4,3,2,1,0,-1],
  'Бас':      [5,4,3,1,0,0,0,0,0,0],
  'Клубный':  [4,3,0,2,0,-1,0,2,3,3],
}

interface Props {
  eq: EQState
  onChange: (eq: EQState) => void
  onSave: () => void
}

export default function Equalizer({ eq, onChange, onSave }: Props) {
  const [activePreset, setActivePreset] = useState('Нейтрал')
  const [saved, setSaved] = useState(false)

  function applyPreset(name: string) {
    const bands = DEFAULT_PRESETS[name]
    if (!bands) return
    setActivePreset(name)
    onChange({ ...eq, bands })
  }

  function updateBand(i: number, v: number) {
    const bands = [...eq.bands]
    bands[i] = v
    setActivePreset('')
    onChange({ ...eq, bands })
  }

  function handleSave() {
    onSave()
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const balLabel = eq.balance === 0 ? 'Центр' : eq.balance < 0 ? `${Math.abs(eq.balance)}% Л` : `${eq.balance}% П`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Presets row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: 'var(--text2)', marginRight: 4 }}>Пресет:</span>
        {Object.keys(DEFAULT_PRESETS).map(p => (
          <button
            key={p}
            onClick={() => applyPreset(p)}
            style={{
              fontSize: 11, padding: '4px 10px',
              background: activePreset === p ? 'var(--purple)' : 'var(--bg)',
              color: activePreset === p ? 'var(--purple-light)' : 'var(--text2)',
              borderColor: activePreset === p ? 'var(--purple)' : 'var(--border)',
            }}
          >{p}</button>
        ))}
        <button className="primary" style={{ marginLeft: 'auto' }} onClick={handleSave}>
          {saved ? '✓' : '💾'} {saved ? 'Сохранено' : 'Сохранить'}
        </button>
      </div>

      {/* Band sliders */}
      <div style={{
        display: 'grid', gridTemplateColumns: `repeat(${FREQS.length}, 1fr)`,
        gap: 4, background: 'var(--bg2)', borderRadius: 10,
        padding: '16px 12px', border: '0.5px solid var(--border)'
      }}>
        {eq.bands.map((v, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, color: v > 0 ? 'var(--purple)' : v < 0 ? '#D85A30' : 'var(--text3)', fontWeight: 500 }}>
              {v > 0 ? '+' : ''}{v}
            </span>
            <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <input
                type="range" min={-12} max={12} step={1} value={v}
                onChange={e => updateBand(i, parseInt(e.target.value))}
                aria-label={`${FREQS[i]} Гц`}
                style={{
                  writingMode: 'vertical-lr',
                  direction: 'rtl',
                  WebkitAppearance: 'slider-vertical',
                  width: 24, height: 96,
                  cursor: 'pointer'
                } as React.CSSProperties}
              />
            </div>
            <span style={{ fontSize: 10, color: 'var(--text3)' }}>{FREQS[i]}</span>
          </div>
        ))}
      </div>

      {/* Volume + Balance */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'center', padding: '10px 12px', background: 'var(--bg2)', borderRadius: 10, border: '0.5px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <span style={{ fontSize: 12, color: 'var(--text2)', minWidth: 70 }}>🔊 Громкость</span>
          <input type="range" min={0} max={100} step={1} value={eq.volume} style={{ flex: 1 }}
            onChange={e => onChange({ ...eq, volume: parseInt(e.target.value) })} />
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', minWidth: 34, textAlign: 'right' }}>{eq.volume}%</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <span style={{ fontSize: 12, color: 'var(--text2)', minWidth: 60 }}>⚖️ Баланс</span>
          <input type="range" min={-100} max={100} step={1} value={eq.balance} style={{ flex: 1 }}
            onChange={e => onChange({ ...eq, balance: parseInt(e.target.value) })} />
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', minWidth: 52, textAlign: 'right' }}>{balLabel}</span>
        </div>
      </div>
    </div>
  )
}
