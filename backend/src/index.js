import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const BMRS_BASE = 'https://data.elexon.co.uk/bmrs/api/v1';

async function fetchAllPages(url, params, maxPages = 20) {
  const results = [];
  let page = 1;
  while (page <= maxPages) {
    const queryParams = new URLSearchParams({ ...params, page, pageSize: 500 });
    const fullUrl = `${url}?${queryParams}`;
    console.log(`  GET ${fullUrl}`);
    const res = await fetch(fullUrl, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) {
      const text = await res.text();
      console.error(`BMRS ${res.status}:`, text.slice(0, 300));
      throw new Error(`BMRS API error ${res.status}: ${text.slice(0, 200)}`);
    }
    const json = await res.json();
    const data = json.data || [];
    console.log(`  <- ${data.length} rows (page ${page})`);
    results.push(...data);
    if (data.length < 500) break;
    page++;
  }
  return results;
}

// GET /api/actuals?from=ISO&to=ISO
app.get('/api/actuals', async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) return res.status(400).json({ error: 'from and to required' });

    const fromDate = new Date(from);
    const toDate = new Date(to);

    const data = await fetchAllPages(`${BMRS_BASE}/datasets/FUELHH/stream`, {
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
      fuelType: 'WIND',
    });

    const seen = new Set();
    const deduped = data
      .filter(d => { const t = new Date(d.startTime); return t >= fromDate && t <= toDate; })
      .map(d => ({ startTime: d.startTime, generation: d.generation }))
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
      .filter(d => { if (seen.has(d.startTime)) return false; seen.add(d.startTime); return true; });

    res.json({ data: deduped });
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
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const publishFrom = new Date(fromDate.getTime() - 48 * 3600 * 1000);

    const data = await fetchAllPages(`${BMRS_BASE}/datasets/WINDFOR/stream`, {
      publishDateTimeFrom: publishFrom.toISOString(),
      publishDateTimeTo: toDate.toISOString(),
    });

    const byTarget = {};
    for (const d of data) {
      const startT = new Date(d.startTime);
      const publishT = new Date(d.publishTime);
      if (startT < fromDate || startT > toDate) continue;
      const forecastHorizonHours = (startT - publishT) / 3600000;
      if (forecastHorizonHours < horizonHours || forecastHorizonHours > 48) continue;
      const key = d.startTime;
      if (!byTarget[key] || publishT > new Date(byTarget[key].publishTime)) {
        byTarget[key] = { startTime: d.startTime, publishTime: d.publishTime, generation: d.generation };
      }
    }

    const result = Object.values(byTarget).sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    res.json({ data: result });
  } catch (err) {
    console.error('forecasts error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.listen(PORT, () => console.log(`Backend running on :${PORT}`));
