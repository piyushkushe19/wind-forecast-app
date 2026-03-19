import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const BMRS_BASE = 'https://data.elexon.co.uk/bmrs/api/v1';

// Helper: fetch all pages of a paginated BMRS endpoint
async function fetchAllPages(url, params, maxPages = 20) {
  const results = [];
  let page = 1;

  while (page <= maxPages) {
    const queryParams = new URLSearchParams({ ...params, page, pageSize: 500 });
    const fullUrl = `${url}?${queryParams}`;

    const res = await fetch(fullUrl, {
      headers: { 'Accept': 'application/json' }
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`BMRS API error ${res.status}: ${text}`);
    }

    const json = await res.json();
    const data = json.data || [];
    results.push(...data);

    // If we got fewer items than pageSize, we're done
    if (data.length < 500) break;
    page++;
  }

  return results;
}

// GET /api/actuals?from=2025-01-01T00:00Z&to=2025-01-02T00:00Z
app.get('/api/actuals', async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) {
      return res.status(400).json({ error: 'from and to query params required' });
    }

    const data = await fetchAllPages(`${BMRS_BASE}/datasets/FUELHH/stream`, {
      settlementDateFrom: from.split('T')[0],
      settlementDateTo: to.split('T')[0],
      fuelType: 'WIND',
    });

    // Filter to date range and map fields
    const fromDate = new Date(from);
    const toDate = new Date(to);

    const filtered = data
      .filter(d => {
        const t = new Date(d.startTime);
        return t >= fromDate && t <= toDate;
      })
      .map(d => ({
        startTime: d.startTime,
        generation: d.generation,
      }))
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    // Deduplicate by startTime (keep latest)
    const deduped = [];
    const seen = new Set();
    for (const item of filtered) {
      if (!seen.has(item.startTime)) {
        seen.add(item.startTime);
        deduped.push(item);
      }
    }

    res.json({ data: deduped });
  } catch (err) {
    console.error('Error fetching actuals:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/forecasts?from=2025-01-01T00:00Z&to=2025-01-02T00:00Z&horizon=4
app.get('/api/forecasts', async (req, res) => {
  try {
    const { from, to, horizon = 4 } = req.query;
    if (!from || !to) {
      return res.status(400).json({ error: 'from and to query params required' });
    }

    const horizonHours = parseFloat(horizon);

    // Fetch forecast data — we need forecasts published before (target - horizon)
    // So we need publishTime up to `to`
    const fromDate = new Date(from);
    const toDate = new Date(to);

    // Expand fetch window to get forecasts published early enough
    const expandedFrom = new Date(fromDate.getTime() - 48 * 3600 * 1000);

    const data = await fetchAllPages(`${BMRS_BASE}/datasets/WINDFOR/stream`, {
      publishDateTimeFrom: expandedFrom.toISOString().split('T')[0],
      publishDateTimeTo: toDate.toISOString().split('T')[0],
    });

    // Filter: only startTime within [from, to], publishTime < startTime - horizon
    const filtered = data.filter(d => {
      const startT = new Date(d.startTime);
      const publishT = new Date(d.publishTime);
      if (startT < fromDate || startT > toDate) return false;
      const horizonMs = horizonHours * 3600 * 1000;
      const forecastHorizonHours = (startT - publishT) / 3600000;
      return forecastHorizonHours >= 0 && forecastHorizonHours <= 48;
    });

    // For each target startTime, keep only the latest forecast published at least `horizon` hours before
    const byTarget = {};
    for (const d of filtered) {
      const startT = new Date(d.startTime);
      const publishT = new Date(d.publishTime);
      const horizonMs = horizonHours * 3600 * 1000;

      // Forecast must have been published at least horizon hours before target
      if (startT - publishT < horizonMs) continue;

      const key = d.startTime;
      if (!byTarget[key] || new Date(d.publishTime) > new Date(byTarget[key].publishTime)) {
        byTarget[key] = {
          startTime: d.startTime,
          publishTime: d.publishTime,
          generation: d.generation,
        };
      }
    }

    const result = Object.values(byTarget).sort(
      (a, b) => new Date(a.startTime) - new Date(b.startTime)
    );

    res.json({ data: result });
  } catch (err) {
    console.error('Error fetching forecasts:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.listen(PORT, () => {
  console.log(`Wind forecast backend running on port ${PORT}`);
});
