# 🌬️ UK Wind Power Forecast Monitoring System

A full-stack application built to analyze and visualize the accuracy of wind power forecasts in the United Kingdom. The system compares forecasted wind generation with actual generation and provides insights into forecast reliability and error behavior.

---

## 🌐 Live Demo

- **Frontend:** https://wind-forecast-app-8tme.vercel.app  
- **Backend API:** https://wind-forecast-app-1.onrender.com  
- **Demo Video:** https://youtu.be/YOUR_VIDEO_ID  

---

## 📌 Project Overview

This project focuses on solving a real-world problem in energy systems:  
**How accurate are wind power forecasts, and how much wind energy can we reliably depend on?**

The application allows users to:
- Visualize actual vs forecasted wind generation
- Adjust forecast horizon dynamically
- Analyze forecast errors in real time
- Understand reliability of wind power using historical data

---

## 🏗️ Tech Stack

### 🎨 Frontend
- ⚛️ React (Vite)  
- 📊 Recharts (Data Visualization)  
- 🎨 Tailwind CSS (Responsive UI)  

### ⚙️ Backend
- 🟢 Node.js  
- 🚀 Express.js  

### 📊 Analysis
- 🐍 Python  
- 📦 Pandas, NumPy  
- 📈 Matplotlib / Seaborn  
---

## 📁 Project Structure

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


---

## 🚀 Key Features

### 📊 Forecast Monitoring Dashboard
- Interactive time-series chart
- Actual generation vs forecasted generation
- 30-minute resolution data

### 🎚 Forecast Horizon Control
- Adjustable (1–48 hours)
- Shows latest available forecast before target time

### 📅 Date Range Selection
- Custom start and end time selection

### 📈 Error Metrics
- MAE (Mean Absolute Error)
- RMSE (Root Mean Square Error)
- Bias
- Median Error
- P90 Error
- Coverage within ±500 MW

### 📱 Responsive Design
- Fully optimized for mobile and desktop

---

## ⚙️ How It Works

### Forecast Selection Logic

For each timestamp:
- Select forecasts where:
  publishTime ≤ targetTime - horizon
- Choose the latest available forecast
- Ignore missing values

---

## 🔌 API Endpoints

### Backend Routes

- `/api/actuals`  
  Fetches actual wind generation data  

- `/api/forecasts`  
  Returns filtered forecasts based on horizon  

- `/health`  
  Health check endpoint  

---

## ▶️ Running Locally

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

### ☁️ Deployment

**Frontend**
- Deployed on Vercel

**Backend**
- Deployed on Render

**Notes**
- Backend may take a few seconds to respond initially due to free tier cold start.

---

## 📊 Analysis & Insights

The analysis focuses on understanding forecast accuracy and wind reliability.

### Key Observations
- Forecast error increases with longer horizons  
- Certain times of day show higher variability  
- Error distribution is skewed with occasional large deviations  

---

## ⚡ Reliability Recommendation

Based on historical wind generation data:

- A conservative estimate of reliable wind capacity is derived using lower percentile values (P10)  
- This ensures high confidence in availability even during low-wind conditions  

👉 This value can be used for:
- Grid planning  
- Reserve estimation  
- Energy reliability assessment  

---

## 📚 Data Sources

- Elexon BMRS API  
  - FUELHH (Actual Generation)  
  - WINDFOR (Forecast Data)  

---

## 🎯 Conclusion

This project demonstrates:

- Full-stack development (React + Node.js)  
- Real-time data processing  
- Data visualization and UX design  
- Analytical thinking applied to energy systems  

---

## 👨‍💻 Author

**Piyush Kushe**  
Computer Engineering Student | Full Stack Developer  
