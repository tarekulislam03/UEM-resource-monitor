# UEM Resource Manager — Campus Resource Analyzer

> [!NOTE]
> **Institution:** University of Engineering & Management  
> **Project Title:** UEM Resource Manager (Campus Resource Analyzer)  
> **Domain:** Campus Sustainability, Utility Analytics & Environmental Monitoring  
> **Tech Stack:** React 19, Vite 6, React Router, Recharts, Papaparse, Open-Meteo API, LocalStorage

---

> [!IMPORTANT]
> **Abstract**  
> **UEM Resource Manager** is a client-side web application built for the **University of Engineering & Management** to monitor, analyze, and optimize monthly electricity and water consumption across campus buildings (`B1`, `B2`, `B3`), floors, and laboratories (such as `B3 LG3.7`). The system combines automated anomaly (spike) detection, progressive slab-based tariff estimation, CO₂ emission tracking, rule-based savings recommendations, and live campus weather and air-quality monitoring in a responsive, zero-backend interface.

---

## 1. Problem Statement & Objectives

> [!TIP]
> **Project Objectives**
> 1. Centralize monthly electricity (`kWh`) and water (`litres`) meter readings across buildings, floors, and individual labs.
> 2. Automatically detect abnormal consumption spikes using statistical thresholds and month-over-month deltas.
> 3. Estimate utility bills using progressive 3-tier electricity slabs and compute grid CO₂ emissions.
> 4. Provide actionable, severity-ranked energy and water conservation insights.
> 5. Integrate live local weather and US AQI air-quality telemetry for campus-wide environmental awareness.

Traditional spreadsheet-based utility tracking makes it difficult for campus administrators to spot sudden equipment faults, overnight HVAC/lab load leaks, or water line losses across multiple floors. **UEM Resource Manager** solves this with an established, high-density operational dashboard that runs entirely in the browser using `localStorage` persistence.

---

## 2. System Architecture & Technology Stack

| Layer | Technology / Module | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 + Vite 6 | Component-based SPA with fast bundling |
| **Routing** | `react-router-dom` | Multi-page navigation (`/`, `/add`, `/readings`, `/insights`, `/environment`, `/settings`) |
| **Data Visualization** | `recharts` | Time-series line charts and building/floor comparison bar charts |
| **CSV Processing** | `papaparse` | Client-side CSV parsing, header normalization, and row validation |
| **Icons** | `lucide-react` | Vector UI icons for navigation badges, forms, and status indicators |
| **External APIs** | Open-Meteo Forecast & Air Quality | Live weather and US AQI / PM2.5 / PM10 without API keys |
| **Persistence** | Browser `localStorage` | Offline-capable storage for readings, buildings, and tariff settings |

---

## 3. Core Methodology & Calculations

### 3.1 Data Model
Each utility record follows a structured schema (`src/data/seedData.js`):
```json
{
  "id": "seed-b3-lg3.7-2026-09",
  "building": "B3",
  "floor": "Floor 3",
  "room": "B3 LG3.7",
  "month": "2026-09",
  "kwh": 1612,
  "water": 3240
}
```
The preloaded campus dataset covers **3 buildings** (`B1`, `B2`, `B3`), **3 floors per building**, **29 laboratories**, and **6 months** (`Jun 2026` – `Nov 2026`, totaling **174 readings**) with realistic seasonal variation and 3 planted anomaly spikes.

### 3.2 Progressive Electricity Slab Pricing & Cost Estimation
Implemented in `calculateElectricityCost()` and `computeSummary()` (`src/utils/analytics.js`, defaults in `src/data/defaults.js`):
- **Tier 1 (`0 – 100 kWh`):** `Rs 5 / kWh`
- **Tier 2 (`101 – 200 kWh`):** `Rs 8 / kWh`
- **Tier 3 (`Above 200 kWh`):** `Rs 11 / kWh`
- **Water Rate:** `Rs 0.05 / litre`

$$\text{Estimated Cost} = \sum_{r} \text{SlabCost}(r.\text{kwh}) + \left(\sum_{r} r.\text{water} \times \text{WaterRate}\right)$$

### 3.3 Carbon Footprint (CO₂) Calculation
Electricity drawn from the regional power grid corresponds to fossil-fuel generation emissions:

$$\text{Total CO}_2\text{ (kg)} = \text{Total Electricity (kWh)} \times \text{CO}_2\text{ Factor}$$

- Default **CO₂ Factor:** `0.71 kg CO₂ / kWh` (configurable in **Settings**).

### 3.4 Automated Spike Detection
Implemented in `analyzeReadings()` (`src/utils/analytics.js`), readings are grouped per lab/room and sorted chronologically. A reading is flagged with a **Spike** badge if either electricity or water satisfies:
1. **Statistical Threshold:** $\text{value} > \mu + 2\sigma$ for that lab's historical readings (with $\ge 2$ records and $\sigma > 0$), **OR**
2. **Month-over-Month Jump:** $\frac{\text{current} - \text{previous}}{\text{previous}} > 25\%$.

### 3.5 Live Campus Environment Telemetry
Implemented in `src/utils/environmentApi.js` and `src/pages/EnvironmentPage.jsx`:
- **Weather:** Open-Meteo Forecast API (`temperature_2m`, `apparent_temperature`, `relative_humidity_2m`, `wind_speed_10m`, `precipitation`).
- **Air Quality:** Open-Meteo Air Quality API (`us_aqi`, `pm2_5`, `pm10`) with category mapping (`Good`, `Moderate`, `Unhealthy for Sensitive`, `Unhealthy`, `Very Unhealthy`, `Hazardous`).
- **Resilience:** Uses `Promise.allSettled` with a 10-second `AbortController` timeout and 10-minute auto-refresh so partial network issues do not block available telemetry.

---

## 4. Application Pages & Features

1. **Dashboard (`/`)** — Displays 4 summary KPI cards (`Total Electricity`, `Total Water`, `Estimated Cost`, `CO2`), a month filter, a live **Campus Environment** summary card, a monthly trend line chart (Electricity/Water toggle, Building & Floor filters, red spike markers), and a Building/Floor comparison bar chart.
2. **Add Data (`/add`)** — Provides a **Buildings** name manager, a duplicate-safe **Add Single Reading** form (with custom floor support and room autocomplete), and **Upload CSV** with sample file download and row-level validation.
3. **Readings (`/readings`)** — Dense, sortable spreadsheet-style table with Building and Floor filters, red `Spike` status badges, and row deletion.
4. **Insights (`/insights`)** — Highlights all detected lab/floor spikes alongside up to 4 severity-ranked savings recommendations.
5. **Environment (`/environment`)** — Displays live campus weather cards, US AQI status, PM2.5/PM10 metrics, last-updated timestamp, and manual refresh/retry controls.
6. **Settings (`/settings`)** — Configures the 3 electricity slabs, water rate, CO₂ factor, campus coordinates (default `22.5726, 88.3639`), and data reset controls.

---

## 5. Project Structure

```text
Campus Resource Analyzer/
├── index.html
├── package.json
├── vite.config.js
├── README.md
├── public/
│   ├── logo.webp
│   └── siteicon.png
└── src/
    ├── App.jsx
    ├── main.jsx
    ├── components/
    │   ├── AddReadingForm.jsx
    │   ├── BuildingAdder.jsx
    │   ├── CsvUploadPanel.jsx
    │   ├── ReadingsTable.jsx
    │   ├── SummaryCards.jsx
    │   └── UsageCharts.jsx
    ├── data/
    │   ├── defaults.js
    │   └── seedData.js
    ├── pages/
    │   ├── AddDataPage.jsx
    │   ├── DashboardPage.jsx
    │   ├── EnvironmentPage.jsx
    │   ├── InsightsPage.jsx
    │   ├── ReadingsPage.jsx
    │   └── SettingsPage.jsx
    ├── styles/
    │   ├── global.css
    │   └── tokens.css
    └── utils/
        ├── analytics.js
        ├── csv.js
        ├── environmentApi.js
        └── storage.js
```

---

## 6. Installation & Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Build for production
npm run build
```
