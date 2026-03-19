import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import https from 'https';

const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json());

const BMRS_BASE = 'https://data.elexon.co.uk/bmrs/api/v1';
const agent = new https.Agent({ rejectUnauthorized: false });

async function bmrsGet(endpoint, params) {
  const url = `${BMRS_BASE}/${endpoint}?${new URLSearchParams(params)}`;
  console.log('GET', url);
  const res = await fetch(url, { headers: { Accept: 'application/json' }, agent });
  const text = await res.text();
  if (!res.ok) throw new Error(`BMRS ${res.status}: ${text.slice(0, 300)}`);
  const parsed = JSON.parse(text);
  const rows = Array.isArray(parsed) ? parsed : (parsed.data || []);
  console.log(`  <- ${rows.length} rows`);
  return rows;
}

app.get('/api/actuals', async (req, res) => {
  try {
    const { from, to } = req.query;
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const rows = await bmrsGet('datasets/FUELHH/stream', {
      settlementDateFrom: fromDate.toISOString().slice(0, 10),
      settlementDateTo: toDate.toISOString().slice(0, 10),
      fuelType: 'WIND',
      page: 1,
      pageSize: 500,
    });
    if (rows.length > 0) console.log('  sample:', JSON.stringify(rows[0]));
    const seen = new Set();
    const result = rows
      .filter(d => { const t = new Date(d.startTime); return t >= fromDate && t <= toDate; })
      .map(d => ({ startTime: d.startTime, generation: d.generation }))
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
      .filter(d => { if (seen.has(d.startTime)) return false; seen.add(d.startTime); return true; });
    console.log('  returning', result.length, 'rows');
    res.json({ data: result });
  } catch (err) {
    console.error('actuals error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/forecasts', async (req, res) => {
  try {
    const { from, to, horizon = 4 } = req.query;
    const horizonHours = parseFloat(horizon);
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const publishFrom = new Date(fromDate.getTime() - 48 * 3600 * 1000);
    const rows = await bmrsGet('datasets/WINDFOR/stream', {
      publishDateTimeFrom: publishFrom.toISOString().slice(0, 10),
      publishDateTimeTo: toDate.toISOString().slice(0, 10),
      page: 1,
      pageSize: 500,
    });
    if (rows.length > 0) console.log('  sample:', JSON.stringify(rows[0]));
    const byTarget = {};
    for (const d of rows) {
      const startT = new Date(d.startTime);
      const publishT = new Date(d.publishTime);
      if (startT < fromDate || startT > toDate) continue;
      const h = (startT - publishT) / 3600000;
      if (h < horizonHours || h > 48) continue;
      const key = d.startTime;
      if (!byTarget[key] || publishT > new Date(byTarget[key].publishTime)) {
        byTarget[key] = { startTime: d.startTime, publishTime: d.publishTime, generation: d.generation };
      }
    }
    const result = Object.values(byTarget).sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    console.log('  returning', result.length, 'forecast rows');
    res.json({ data: result });
  } catch (err) {
    console.error('forecasts error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (_, res) => res.json({ status: 'ok' }));
app.listen(PORT, () => console.log(`Backend running on :${PORT}`));