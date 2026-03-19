const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function fetchActuals(from, to) {
  const params = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() });
  const res = await fetch(`${API_BASE}/actuals?${params}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchForecasts(from, to, horizon) {
  const params = new URLSearchParams({
    from: from.toISOString(),
    to: to.toISOString(),
    horizon: String(horizon),
  });
  const res = await fetch(`${API_BASE}/forecasts?${params}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// Merge actuals and forecasts by startTime for chart
export function mergeChartData(actuals, forecasts) {
  const map = {};

  for (const a of actuals) {
    map[a.startTime] = { startTime: a.startTime, actual: a.generation };
  }

  for (const f of forecasts) {
    if (map[f.startTime]) {
      map[f.startTime].forecast = f.generation;
      map[f.startTime].publishTime = f.publishTime;
    }
    // If we have forecast but no actual yet, include it too
    else if (!map[f.startTime]) {
      map[f.startTime] = {
        startTime: f.startTime,
        forecast: f.generation,
        publishTime: f.publishTime,
      };
    }
  }

  return Object.values(map).sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
}

// Compute error metrics from merged data
export function computeMetrics(chartData) {
  const pairs = chartData.filter(d => d.actual != null && d.forecast != null);
  if (pairs.length === 0) return null;

  const errors = pairs.map(d => Math.abs(d.actual - d.forecast));
  const signedErrors = pairs.map(d => d.forecast - d.actual);

  const mean = errors.reduce((s, e) => s + e, 0) / errors.length;
  const rmse = Math.sqrt(errors.reduce((s, e) => s + e * e, 0) / errors.length);
  const bias = signedErrors.reduce((s, e) => s + e, 0) / signedErrors.length;

  const sorted = [...errors].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const p90 = sorted[Math.floor(sorted.length * 0.9)];

  // Coverage: % of time forecast within ±500 MW of actual
  const within500 = errors.filter(e => e <= 500).length;
  const coverage500 = (within500 / errors.length) * 100;

  return {
    count: pairs.length,
    mae: mean,
    rmse,
    bias,
    median,
    p90,
    coverage500,
  };
}
