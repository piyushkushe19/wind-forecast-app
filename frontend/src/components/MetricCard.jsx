import React from 'react';

export default function MetricCard({ label, value, unit = 'MW', color = '#4da8ff', sub }) {
  return (
    <div style={{
      background: 'var(--panel)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      animation: 'slideIn 0.3s ease',
    }}>
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        color: 'var(--text3)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
      }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 22,
          fontWeight: 500,
          color: color,
          lineHeight: 1,
        }}>{value != null ? Math.round(value).toLocaleString() : '—'}</span>
        {unit && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text3)' }}>{unit}</span>}
      </div>
      {sub && <span style={{ fontSize: 11, color: 'var(--text2)' }}>{sub}</span>}
    </div>
  );
}
