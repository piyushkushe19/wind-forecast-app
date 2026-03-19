import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json());

const BMRS_BASE = 'https://data.elexon.co.uk/bmrs/api/v1';

async function bmrsGet(endpoint, params) {
  const url = `${BMRS_BASE}/${endpoint}?${new URLSearchParams(params)}`;
  console.log('\nFetching:', url);
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  const text = await res.text();
  if (!res.ok) throw new Error(`BMRS ${res.status}: ${text.slice(0, 300)}`);
  const json = JSON.parse(text);
  const rows = json.data || [];
  console.log(`  -> ${rows.length} rows`);
  return rows;
}

// GET /api/actuals?from=2025-01-15T00:00:00Z&to=2025-01-16T00:00:00Z
app.get('/api/actuals', async (req, res) => {
  try {
    const { from, to } = req.query;
    console.log('\n--- /api/actuals', from, to);

    const fromDate = new Date(from);
    const toDate   = new Date(to);

    // Try both param styles
    let rows = await bmrsGet('datasets/FUELHH/stream', {
      settlementDateFrom: from.slice(0, 10),
      settlementDateTo:   to.slice(0, 10),
      fuelType: 'WIND',
      page: 1,
      pageSize: 500,
    });

    // If empty, try with from/to style
    if (rows.length === 0) {
      console.log('  trying from/to style...');
      rows = await bmrsGet('datasets/FUELHH/stream', {
        from, to,
        fuelType: 'WIND',
        page: 1,
        pageSize: 500,
      });
    }

    console.log('  total rows before filter:', rows.length);
    if (rows.length > 0) console.log('  sample row:', JSON.stringify(rows[0]));

    const seen = new Set();
    const result = rows
      .filter(d => {
        const t = new Date(d.startTime);
        return t >= fromDate && t <= toDate;
      })
      .map(d => ({ startTime: d.startTime, generation: d.generation }))
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
      .filter(d => { if (seen.has(d.startTime)) return false; seen.add(d.startTime); return true; });

    console.log('  result rows:', result.length);
    res.json({ data: result });
  } catch (err) {
    console.error('actuals error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/forecasts?from=2025-01-15T00:00:00Z&to=2025-01-16T00:00:00Z&horizon=4
app.get('/api/forecasts', async (req, res) => {
  try {
    const { from, to, horizon = 4 } = req.query;
    console.log('\n--- /api/forecasts', from, to, 'horizon:', horizon);

    const horizonHours = parseFloat(horizon);
    const fromDate     = new Date(from);
    const toDate       = new Date(to);
    const publishFrom  = new Date(fromDate.getTime() - 48 * 3600 * 1000);

    // Try both param styles
    let rows = await bmrsGet('datasets/WINDFOR/stream', {
      publishDateTimeFrom: publishFrom.toISOString().slice(0, 10),
      publishDateTimeTo:   toDate.toISOString().slice(0, 10),
      page: 1,
      pageSize: 500,
    });

    if (rows.length === 0) {
      console.log('  trying from/to style...');
      rows = await bmrsGet('datasets/WINDFOR/stream', {
        from: publishFrom.toISOString(),
        to:   toDate.toISOString(),
        page: 1,
        pageSize: 500,
      });
    }

    console.log('  total rows before filter:', rows.length);
    if (rows.length > 0) console.log('  sample row:', JSON.stringify(rows[0]));

    const byTarget = {};
    for (const d of rows) {
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

    console.log('  result rows:', result.length);
    res.json({ data: result });
  } catch (err) {
    console.error('forecasts error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (_, res) => res.json({ status: 'ok' }));
app.listen(PORT, () => console.log(`\nBackend running on :${PORT}\n`));
