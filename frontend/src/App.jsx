import React, { useState, useCallback } from 'react';
import { format, subDays } from 'date-fns';
import WindChart from './components/WindChart.jsx';
import MetricCard from './components/MetricCard.jsx';
import DateRangePicker from './components/DateRangePicker.jsx';
import HorizonSlider from './components/HorizonSlider.jsx';
import { useWindData } from './hooks/useWindData.js';

function toDatetimeLocal(d) {
  return format(d, "yyyy-MM-dd'T'HH:mm");
}

const DEFAULT_END = new Date();
DEFAULT_END.setMinutes(0, 0, 0);
const DEFAULT_START = subDays(DEFAULT_END, 3);

export default function App() {
  const [startDate, setStartDate] = useState(toDatetimeLocal(DEFAULT_START));
  const [endDate, setEndDate] = useState(toDatetimeLocal(DEFAULT_END));
  const [horizon, setHorizon] = useState(4);

  const { chartData, metrics, loading, error, lastFetched, load } = useWindData();

  const handleLoad = useCallback(() => {
    const from = new Date(startDate);
    const to = new Date(endDate);
    if (isNaN(from) || isNaN(to) || from >= to) return;
    load(from, to, horizon);
  }, [startDate, endDate, horizon, load]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        padding: '20px 24px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg2)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Wind icon SVG */}
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="13" stroke="var(--accent-blue)" strokeWidth="1" strokeOpacity="0.4" />
            <path d="M6 14c2.5-3 5.5-4.5 8-4.5s5 1.5 5 3.5-2 3.5-5 3.5H6" stroke="var(--accent-blue)" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M8 17c1.5-2 3.5-3 5-3s3.5 1 3.5 2.5-1.5 2.5-3.5 2.5H8" stroke="var(--accent-green)" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M10 11c1-1.5 2.5-2.5 4-2.5s2.5.8 2.5 2-.8 2-2.5 2H10" stroke="var(--accent-amber)" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>
              UK Wind Monitor
            </h1>
            <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
              National grid · BMRS live data
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {lastFetched && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text3)' }}>
              Updated {format(lastFetched, 'HH:mm:ss')}
            </span>
          )}
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: loading ? 'var(--accent-amber)' : chartData.length ? 'var(--accent-green)' : 'var(--text3)',
            animation: loading ? 'pulse 1s ease infinite' : 'none',
          }} />
        </div>
      </header>

      <main style={{ flex: 1, padding: '24px', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        {/* Controls panel */}
        <div style={{
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '20px',
          marginBottom: 24,
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) minmax(0,280px) auto',
          gap: 20,
          alignItems: 'end',
        }}
        className="controls-grid"
        >
          <div style={{ gridColumn: 'span 2' }}>
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartChange={setStartDate}
              onEndChange={setEndDate}
            />
          </div>
          <HorizonSlider value={horizon} onChange={setHorizon} />
          <button
            onClick={handleLoad}
            disabled={loading}
            style={{
              background: loading ? 'var(--border2)' : 'var(--accent-blue)',
              color: loading ? 'var(--text3)' : '#000',
              border: 'none',
              borderRadius: 8,
              padding: '10px 24px',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 14,
              cursor: loading ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
              height: 40,
            }}
          >
            {loading ? 'Loading…' : 'Load data'}
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{
            background: 'rgba(255,92,92,0.1)',
            border: '1px solid rgba(255,92,92,0.3)',
            borderRadius: 8,
            padding: '12px 16px',
            marginBottom: 20,
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start',
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            color: 'var(--accent-red)',
            animation: 'slideIn 0.3s ease',
          }}>
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}

        {/* Chart card */}
        <div style={{
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '20px',
          marginBottom: 20,
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 16,
            flexWrap: 'wrap',
            gap: 8,
          }}>
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em' }}>
                Generation time series
              </h2>
              <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                MW · 30-min resolution · green dashes = latest forecast ≥ {horizon}h before target
              </p>
            </div>
            {chartData.length > 0 && (
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--text3)',
                background: 'var(--bg3)',
                border: '1px solid var(--border)',
                borderRadius: 4,
                padding: '2px 8px',
              }}>
                {chartData.length} points
              </span>
            )}
          </div>
          <WindChart data={chartData} loading={loading} />
        </div>

        {/* Metrics row */}
        {metrics && (
          <div style={{ animation: 'slideIn 0.4s ease' }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 12 }}>
              Error metrics
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 12,
              marginBottom: 24,
            }}>
              <MetricCard
                label="MAE"
                value={metrics.mae}
                color="var(--accent-blue)"
                sub="Mean abs. error"
              />
              <MetricCard
                label="RMSE"
                value={metrics.rmse}
                color="var(--accent-amber)"
                sub="Root mean sq. error"
              />
              <MetricCard
                label="Bias"
                value={metrics.bias}
                unit="MW"
                color={metrics.bias > 0 ? 'var(--accent-amber)' : 'var(--accent-red)'}
                sub={metrics.bias > 0 ? 'Over-forecasting' : 'Under-forecasting'}
              />
              <MetricCard
                label="Median |error|"
                value={metrics.median}
                color="var(--accent-green)"
                sub="50th percentile"
              />
              <MetricCard
                label="P90 |error|"
                value={metrics.p90}
                color="var(--accent-red)"
                sub="90th percentile"
              />
              <MetricCard
                label="±500 MW"
                value={metrics.coverage500}
                unit="%"
                color="var(--accent-green)"
                sub={`${metrics.count} forecast pairs`}
              />
            </div>
          </div>
        )}
      </main>

      {/* Mobile responsive overrides */}
      <style>{`
        @media (max-width: 700px) {
          .controls-grid {
            grid-template-columns: 1fr !important;
          }
          .controls-grid > div:first-child {
            grid-column: span 1 !important;
          }
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--accent-amber);
          cursor: pointer;
          border: 2px solid var(--bg);
        }
        input[type=range]::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--accent-amber);
          cursor: pointer;
          border: 2px solid var(--bg);
        }
      `}</style>
    </div>
  );
}
