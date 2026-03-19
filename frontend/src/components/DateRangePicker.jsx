import React from 'react';

const inputStyle = {
  background: 'var(--bg3)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  padding: '7px 10px',
  color: 'var(--text)',
  fontFamily: 'var(--font-mono)',
  fontSize: 13,
  outline: 'none',
  width: '100%',
  colorScheme: 'dark',
};

export default function DateRangePicker({ startDate, endDate, onStartChange, onEndChange }) {
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1, minWidth: 160 }}>
        <label style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Start time
        </label>
        <input
          type="datetime-local"
          value={startDate}
          onChange={e => onStartChange(e.target.value)}
          min="2025-01-01T00:00"
          style={inputStyle}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1, minWidth: 160 }}>
        <label style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          End time
        </label>
        <input
          type="datetime-local"
          value={endDate}
          onChange={e => onEndChange(e.target.value)}
          min="2025-01-01T00:00"
          style={inputStyle}
        />
      </div>
    </div>
  );
}
