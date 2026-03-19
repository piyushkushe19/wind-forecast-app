import React from 'react';

export default function HorizonSlider({ value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{
          fontSize: 11,
          color: 'var(--text3)',
          fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}>
          Forecast horizon
        </label>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 13,
          color: 'var(--accent-amber)',
          background: 'rgba(255,184,64,0.1)',
          border: '1px solid rgba(255,184,64,0.2)',
          borderRadius: 4,
          padding: '1px 8px',
        }}>
          {value}h
        </span>
      </div>
      <div style={{ position: 'relative', padding: '4px 0' }}>
        <input
          type="range"
          min={1}
          max={48}
          step={1}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{
            width: '100%',
            appearance: 'none',
            WebkitAppearance: 'none',
            height: 4,
            background: `linear-gradient(to right, var(--accent-amber) 0%, var(--accent-amber) ${((value - 1) / 47) * 100}%, var(--border2) ${((value - 1) / 47) * 100}%, var(--border2) 100%)`,
            borderRadius: 2,
            outline: 'none',
            cursor: 'pointer',
          }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text3)' }}>
        <span>1h</span>
        <span>24h</span>
        <span>48h</span>
      </div>
    </div>
  );
}
