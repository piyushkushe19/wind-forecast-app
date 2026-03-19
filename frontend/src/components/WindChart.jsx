import React, { useMemo } from 'react';
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { format } from 'date-fns';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;

  const actual = payload.find(p => p.dataKey === 'actual');
  const forecast = payload.find(p => p.dataKey === 'forecast');
  const error = actual?.value != null && forecast?.value != null
    ? forecast.value - actual.value
    : null;

  return (
    <div style={{
      background: 'var(--panel)',
      border: '1px solid var(--border2)',
      borderRadius: 8,
      padding: '12px 14px',
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      lineHeight: 1.6,
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    }}>
      <div style={{ color: 'var(--text2)', marginBottom: 6, fontSize: 11 }}>
        {label ? format(new Date(label), 'dd MMM yyyy HH:mm') : ''}
      </div>
      {actual?.value != null && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4da8ff', display: 'inline-block' }} />
          <span style={{ color: 'var(--text2)' }}>Actual:</span>
          <span style={{ color: '#4da8ff', fontWeight: 500 }}>{Math.round(actual.value).toLocaleString()} MW</span>
        </div>
      )}
      {forecast?.value != null && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3dffa0', display: 'inline-block' }} />
          <span style={{ color: 'var(--text2)' }}>Forecast:</span>
          <span style={{ color: '#3dffa0', fontWeight: 500 }}>{Math.round(forecast.value).toLocaleString()} MW</span>
        </div>
      )}
      {error != null && (
        <div style={{
          marginTop: 6,
          paddingTop: 6,
          borderTop: '1px solid var(--border)',
          display: 'flex',
          gap: 8,
          alignItems: 'center',
        }}>
          <span style={{ color: 'var(--text2)' }}>Error:</span>
          <span style={{ color: error > 0 ? 'var(--accent-amber)' : 'var(--accent-red)', fontWeight: 500 }}>
            {error > 0 ? '+' : ''}{Math.round(error).toLocaleString()} MW
          </span>
        </div>
      )}
    </div>
  );
}

function CustomLegend({ payload }) {
  return (
    <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 8 }}>
      {payload?.map(entry => (
        <div key={entry.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 20, height: 2,
            background: entry.color,
            borderRadius: 1,
            ...(entry.dataKey === 'actual' ? {} : { borderBottom: '2px dashed' }),
          }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text2)' }}>
            {entry.dataKey === 'actual' ? 'Actual generation' : 'Forecast (latest ≥ horizon)'}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function WindChart({ data, loading }) {
  const formatted = useMemo(() =>
    data.map(d => ({ ...d, ts: d.startTime })),
    [data]
  );

  const tickFormatter = (ts) => {
    try { return format(new Date(ts), 'dd/MM HH:mm'); } catch { return ''; }
  };

  if (loading) {
    return (
      <div style={{
        height: 360,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 16,
        color: 'var(--text3)',
      }}>
        <div style={{
          width: 32,
          height: 32,
          border: '2px solid var(--border2)',
          borderTopColor: 'var(--accent-blue)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>Fetching wind data…</span>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div style={{
        height: 360,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text3)',
        fontFamily: 'var(--font-mono)',
        fontSize: 13,
        flexDirection: 'column',
        gap: 8,
      }}>
        <div style={{ fontSize: 24, opacity: 0.3 }}>〰</div>
        <span>Select a time range and click Load</span>
      </div>
    );
  }

  return (
    <div style={{ animation: 'slideIn 0.4s ease' }}>
      <ResponsiveContainer width="100%" height={360}>
        <ComposedChart data={formatted} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4da8ff" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#4da8ff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="ts"
            tickFormatter={tickFormatter}
            tick={{ fill: 'var(--text3)', fontFamily: 'DM Mono', fontSize: 11 }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
            minTickGap={60}
          />
          <YAxis
            tick={{ fill: 'var(--text3)', fontFamily: 'DM Mono', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => `${(v / 1000).toFixed(0)}GW`}
            width={48}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
          <Area
            type="monotone"
            dataKey="actual"
            stroke="#4da8ff"
            strokeWidth={2}
            fill="url(#actualGrad)"
            dot={false}
            activeDot={{ r: 4, fill: '#4da8ff', stroke: 'var(--bg)', strokeWidth: 2 }}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="forecast"
            stroke="#3dffa0"
            strokeWidth={1.5}
            strokeDasharray="6 3"
            dot={false}
            activeDot={{ r: 4, fill: '#3dffa0', stroke: 'var(--bg)', strokeWidth: 2 }}
            connectNulls={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
