import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SummaryCards from '../components/SummaryCards';
import UsageCharts from '../components/UsageCharts';
import { computeSummary, formatMonth } from '../utils/analytics';

function getAqiCategory(aqi) {
  if (aqi == null || !Number.isFinite(aqi)) return { label: 'Unavailable', color: 'var(--text-secondary)' };
  if (aqi <= 50) return { label: 'Good', color: '#10b981' };
  if (aqi <= 100) return { label: 'Moderate', color: 'var(--text-secondary)' };
  if (aqi <= 150) return { label: 'Unhealthy for Sensitive', color: 'var(--alert)' };
  if (aqi <= 200) return { label: 'Unhealthy', color: 'var(--alert)' };
  if (aqi <= 300) return { label: 'Very Unhealthy', color: 'var(--alert)' };
  return { label: 'Hazardous', color: 'var(--alert)' };
}

export default function DashboardPage({
  readings,
  buildings,
  settings,
  envState,
}) {
  const [selectedMonth, setSelectedMonth] = useState('ALL');

  const months = useMemo(() => {
    const set = new Set(readings.map((r) => r.month));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [readings]);

  const activeMonth =
    selectedMonth === 'ALL' || months.includes(selectedMonth)
      ? selectedMonth
      : 'ALL';

  const filteredReadings = useMemo(() => {
    if (activeMonth === 'ALL') return readings;
    return readings.filter((r) => r.month === activeMonth);
  }, [readings, activeMonth]);

  const summary = useMemo(
    () => computeSummary(filteredReadings, settings),
    [filteredReadings, settings]
  );

  const aqi = envState?.airQuality?.us_aqi;
  const temp = envState?.weather?.temperature_2m;
  const aqiInfo = getAqiCategory(aqi);

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-header__title">Dashboard</h1>
          <p className="page-header__subtitle">
            {buildings.length > 0
              ? `${activeMonth === 'ALL' ? 'All months' : formatMonth(activeMonth)} across ${buildings.length} building${buildings.length === 1 ? '' : 's'}`
              : 'No readings recorded yet'}
          </p>
        </div>

        <div className="panel-controls">
          <select
            className="select"
            style={{ width: 'auto', minWidth: 150 }}
            aria-label="Filter dashboard by month"
            value={activeMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="ALL">All Months</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {formatMonth(m)}
              </option>
            ))}
          </select>
        </div>
      </header>

      <SummaryCards summary={summary} />

      <Link
        to="/environment"
        className="glass-panel glass-panel--interactive stat-card"
        style={{
          textDecoration: 'none',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <div className="stat-card__top">
            <span>Campus Environment</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
            {envState?.loading && !envState?.weather
              ? 'Loading live weather and air quality...'
              : envState?.error && !envState?.weather
              ? 'Environment data unavailable'
              : `Temperature: ${temp ?? '--'} °C  |  US AQI: ${aqi ?? '--'} (${aqiInfo.label})`}
          </div>
        </div>
        <span
          className="mono"
          style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}
        >
          View details
        </span>
      </Link>

      <UsageCharts readings={filteredReadings} buildings={buildings} />
    </>
  );
}
