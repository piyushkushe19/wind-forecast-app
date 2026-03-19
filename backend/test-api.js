// Run with: node test-api.js
// Tests multiple param combinations to find what Elexon actually accepts

import fetch from 'node-fetch';

const BASE = 'https://data.elexon.co.uk/bmrs/api/v1';

async function tryUrl(label, url) {
  try {
    const r = await fetch(url, { headers: { Accept: 'application/json' }, timeout: 10000 });
    const text = await r.text();
    const preview = text.slice(0, 200);
    console.log(`\n[${label}] HTTP ${r.status}`);
    console.log(preview);
  } catch (e) {
    console.log(`\n[${label}] ERROR: ${e.message}`);
  }
}

// Try different param name combinations for FUELHH
await tryUrl('from/to ISO',
  `${BASE}/datasets/FUELHH/stream?from=2025-01-15T00:00:00Z&to=2025-01-15T03:00:00Z&fuelType=WIND&page=1&pageSize=5`);

await tryUrl('settlementDateFrom/To',
  `${BASE}/datasets/FUELHH/stream?settlementDateFrom=2025-01-15&settlementDateTo=2025-01-15&fuelType=WIND&page=1&pageSize=5`);

await tryUrl('WINDFOR publishDateTimeFrom/To',
  `${BASE}/datasets/WINDFOR/stream?publishDateTimeFrom=2025-01-15T00:00:00Z&publishDateTimeTo=2025-01-15T06:00:00Z&page=1&pageSize=5`);

await tryUrl('WINDFOR from/to',
  `${BASE}/datasets/WINDFOR/stream?from=2025-01-15T00:00:00Z&to=2025-01-15T06:00:00Z&page=1&pageSize=5`);
