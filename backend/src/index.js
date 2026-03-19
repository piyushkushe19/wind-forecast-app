import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json());

const BMRS_BASE = 'https://data.elexon.co.uk/bmrs/api/v1';

async function bmrsFetch(url, params) {
  const queryParams = new URLSearchParams({ ...params, page: 1, pageSize: 500 });
  const fullUrl = `${url}?${queryParams}`;
  console.log('GET', fullUrl);
  const res = await fetch(fullUrl, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`BMRS ${res.status}: ${text.slice(0, 300)}`);
  }
  const json = await res.json();
  console.log(`  <- ${(json.data || []).length} rows`);
  return json.data || [];
}

// GET /api/actuals?from=ISO&to=ISO
app.get('/api/actuals', async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) return res.status(400).json({ error: 'from and to required' });

    const fromDate = new Date(from);
    const toDate   = new Date(to);

    // FUELHH uses settlementDateFrom/To (date strings, not ISO datetimes)
    const dateFrom = fromDate.toISOString().split('T')[0];
    const dateTo   = toDate.toISOString().split('T')[0];

    const data = await bmrsFetch(`${BMRS_BASE}/datasets/FUELHH/stream`, {
      settlementDateFrom: dateFrom,
      settlementDateTo:   dateTo,
      fuelType: 'WIND',
    });

    const seen = new Set();
    const result = data
      .filter(d => {
        const t = new Date(d.startTime);
        return t >= fromDate && t <= toDate;
      })
      .map(d => ({ startTime: d.startTime, generation: d.generation }))
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
      .filter(d => { if (seen.has(d.startTime)) return false; seen.add(d.startTime); return true; });

    res.json({ data: result });
  } catch (err) {
    console.error('actuals error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/forecasts?from=ISO&to=ISO&horizon=4
app.get('/api/forecasts', async (req, res) => {
  try {
    const { from, to, horizon = 4 } = req.query;
    if (!from || !to) return res.status(400).json({ error: 'from and to required' });

    const horizonHours = parseFloat(horizon);
    const fromDate     = new Date(from);
    const toDate       = new Date(to);

    // Expand publish window to catch forecasts made up to 48h before target
    const publishFrom = new Date(fromDate.getTime() - 48 * 3600 * 1000);
    const dateFrom    = publishFrom.toISOString().split('T')[0];
    const dateTo      = toDate.toISOString().split('T')[0];

    // WINDFOR uses publishDateTimeFrom/To (date strings)
    const data = await bmrsFetch(`${BMRS_BASE}/datasets/WINDFOR/stream`, {
      publishDateTimeFrom: dateFrom,
      publishDateTimeTo:   dateTo,
    });

    const byTarget = {};
    for (const d of data) {
      const startT   = new Date(d.startTime);
      const publishT = new Date(d.publishTime);
      if (startT < fromDate || startT > toDate) continue;
      const h = (startT - publishT) / 3600000;
      if (h < horizonHours || h > 48) continue;
      const key = d.startTime;
      if (!byTarget[key] || publishT > new Date(byTarget[key].publishTime)) {
        byTarget[key] = { startTime: d.startTime, publishTime: d.publishTime, generation: d.generation };
      }
    }

    const result = Object.values(byTarget)
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    res.json({ data: result });
  } catch (err) {
    console.error('forecasts error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
app.listen(PORT, () => console.log(`Backend running on :${PORT}`));
