# UK Wind Power Forecast Monitor

A full-stack application for monitoring UK national wind power generation forecasts against actuals, with supporting analysis of forecast error characteristics and reliable wind capacity estimation.

> **AI tools used:** This application was built with AI assistance (Claude) for code generation, UI scaffolding, and analysis structure. All analytical reasoning, metric choices, and interpretation are original.

---

## Live Demo

🌐 **Frontend:** `https://YOUR_APP.vercel.app` *(update after deployment)*  
🎥 **Video demo:** `https://youtu.be/YOUR_VIDEO_ID` *(update after recording)*

---

## Repository Structure

```
wind-forecast/
├── frontend/                  # React + Vite frontend application
│   ├── src/
│   │   ├── App.jsx            # Root component, controls layout
│   │   ├── components/
│   │   │   ├── WindChart.jsx  # Recharts time-series chart
│   │   │   ├── MetricCard.jsx # Individual error metric display
│   │   │   ├── DateRangePicker.jsx  # Start/end datetime inputs
│   │   │   └── HorizonSlider.jsx    # Configurable forecast horizon
│   │   ├── hooks/
│   │   │   └── useWindData.js # Data-fetching hook (actuals + forecasts)
│   │   └── utils/
│   │       └── api.js         # API calls, data merging, metric computation
│   ├── index.html
│   ├── vite.config.js
│   └── vercel.json            # Rewrite rules for backend proxy
│
├── backend/                   # Node.js + Express API proxy
│   └── src/
│       └── index.js           # Proxy endpoints for Elexon BMRS API
│
└── analysis/
    ├── wind_analysis.ipynb    # Jupyter notebook: forecast error + reliability
    └── requirements.txt       # Python dependencies
```

---

## How to Run

### Prerequisites

- Node.js ≥ 18
- Python ≥ 3.10 (for the notebook)

### 1. Backend

```bash
cd backend
npm install
npm start           # starts on :3001
# or: npm run dev   # with --watch for development
```

The backend exposes:
- `GET /api/actuals?from=<ISO>&to=<ISO>` — wind generation actuals (FUELHH, fuelType=WIND)
- `GET /api/forecasts?from=<ISO>&to=<ISO>&horizon=<h>` — WINDFOR forecasts filtered to the latest forecast ≥ horizon hours before each target time
- `GET /health` — health check

### 2. Frontend

```bash
cd frontend
cp .env.example .env          # copy environment template
# Edit .env if backend is not at localhost:3001
npm install
npm run dev                   # starts on :5173
```

Open [http://localhost:5173](http://localhost:5173).

### 3. Analysis notebook

```bash
cd analysis
pip install -r requirements.txt
jupyter notebook wind_analysis.ipynb
```

Run all cells from top to bottom. The notebook fetches data directly from the Elexon BMRS API — no local data files needed. Expect ~5–10 minutes for a full data pull (Jan 2025 → present).

---

## Deployment

### Backend — Render / Railway

1. Push the `backend/` directory to a git repo (or monorepo root).
2. Set the **start command** to `node src/index.js`.
3. Set environment variable `PORT` (Render/Railway set this automatically).
4. Note the deployed URL, e.g. `https://wind-backend.onrender.com`.

### Frontend — Vercel

1. In `frontend/vercel.json`, replace `YOUR_BACKEND_URL` with the backend URL above.
2. In `frontend/.env.production`, set:
   ```
   VITE_API_URL=https://wind-backend.onrender.com/api
   ```
3. Deploy with `vercel --prod` from the `frontend/` directory, or connect the repo in the Vercel dashboard.

---

## Application Features

| Feature | Description |
|---------|-------------|
| **Date range picker** | Select any start/end datetime from Jan 2025 onwards |
| **Forecast horizon slider** | Configurable 1–48h; controls which forecasts are shown |
| **Time-series chart** | Actual (blue area) vs forecast (green dashed) at 30-min resolution |
| **Tooltip** | Hover shows actual, forecast, and signed error at each time step |
| **Error metrics** | MAE, RMSE, bias, median error, P90, and ±500 MW coverage |
| **Mobile responsive** | Controls stack vertically on small screens |
| **Loading states** | Spinner during fetch; animated status indicator in header |
| **Error banner** | Displays API errors clearly with the underlying message |

---

## Design decisions

### Backend as proxy
The Elexon BMRS API does not send CORS headers permitting browser requests. A lightweight Express proxy handles authentication concerns and paginates the API transparently.

### "Latest forecast ≥ horizon" logic
For each target `startTime`, we take the **most recently published** forecast whose publish time is at least `horizon` hours before the target. This is what an operator would have access to in real time.

### Forecast horizon filter (0–48h)
As specified, only forecasts with a horizon between 0 and 48 hours are included. This eliminates very long-range outlier forecasts that are rarely operationally relevant.

### Analysis methodology
- **MAE** is the primary error metric — interpretable in MW and directly useful for reserve sizing.
- **P10 of actual generation** is used as the reliable capacity estimate, consistent with industry practice (also called "firm capacity" or "dependable capacity" in capacity market frameworks).
- **Summer P10** is the binding constraint for annual planning because UK summer has structurally lower wind speeds than winter.

---

## Data Sources

| Source | Endpoint | Description |
|--------|----------|-------------|
| Elexon BMRS | `FUELHH/stream` | Half-hourly actual fuel-level generation |
| Elexon BMRS | `WINDFOR/stream` | National wind power forecasts with publish timestamps |

Both endpoints are public and require no API key.
