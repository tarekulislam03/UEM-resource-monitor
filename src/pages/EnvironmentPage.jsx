function getAqiInfo(aqi) {
  if (aqi == null || !Number.isFinite(aqi)) {
    return { label: 'Unknown', color: 'var(--text-secondary)' };
  }
  if (aqi <= 50) return { label: 'Good', color: '#10b981' };
  if (aqi <= 100) return { label: 'Moderate', color: 'var(--text-secondary)' };
  if (aqi <= 150) return { label: 'Unhealthy for Sensitive', color: 'var(--alert)' };
  if (aqi <= 200) return { label: 'Unhealthy', color: 'var(--alert)' };
  if (aqi <= 300) return { label: 'Very Unhealthy', color: 'var(--alert)' };
  return { label: 'Hazardous', color: 'var(--alert)' };
}

function formatTimestamp(ts) {
  try {
    return new Date(ts).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(ts);
  }
}

export default function EnvironmentPage({
  settings,
  weather,
  airQuality,
  loading,
  error,
  lastUpdated,
  onRefresh,
}) {
  const aqiVal = airQuality?.us_aqi;
  const aqiInfo = getAqiInfo(aqiVal);

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-header__title">Campus Environment</h1>
          <p className="page-header__subtitle">
            Coordinates <span className="mono">{settings.latitude}, {settings.longitude}</span>
            {lastUpdated && (
              <>
                {' '}— Last updated <span className="mono">{formatTimestamp(lastUpdated)}</span>
              </>
            )}
          </p>
        </div>

        <div className="panel-controls">
          <button
            type="button"
            className="btn"
            disabled={loading}
            onClick={onRefresh}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </header>

      {loading && !weather && !airQuality && (
        <div className="glass-panel panel-pad">
          <p style={{ color: 'var(--text-secondary)' }}>
            Loading weather and air quality...
          </p>
        </div>
      )}

      {error && (
        <div
          className="error-banner"
          style={{ justifyContent: 'space-between', alignItems: 'center' }}
          role="alert"
        >
          <span>{error}</span>
          <button type="button" className="btn" onClick={onRefresh}>
            Retry
          </button>
        </div>
      )}

      {weather && (
        <section aria-label="Current weather">
          <div className="summary-grid">
            <div className="glass-panel stat-card">
              <div className="stat-card__top">
                <span>Temperature</span>
              </div>
              <div className="stat-card__value">
                {weather.temperature_2m} °C
              </div>
            </div>

            <div className="glass-panel stat-card">
              <div className="stat-card__top">
                <span>Feels Like</span>
              </div>
              <div className="stat-card__value">
                {weather.apparent_temperature} °C
              </div>
            </div>

            <div className="glass-panel stat-card">
              <div className="stat-card__top">
                <span>Humidity</span>
              </div>
              <div className="stat-card__value">
                {weather.relative_humidity_2m}%
              </div>
            </div>

            <div className="glass-panel stat-card">
              <div className="stat-card__top">
                <span>Wind</span>
              </div>
              <div className="stat-card__value">
                {weather.wind_speed_10m} km/h
              </div>
            </div>
          </div>
        </section>
      )}

      {airQuality && (
        <section
          className="glass-panel panel-pad"
          aria-label="Air quality"
        >
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Air Quality</h2>
              <p className="panel-subtitle">US AQI and particulate matter</p>
            </div>
          </div>

          <div className="form-grid-3">
            <div
              className="glass-panel stat-card"
              style={{ borderTopColor: aqiInfo.color }}
            >
              <div className="stat-card__top">
                <span>US AQI</span>
              </div>
              <div
                className="stat-card__value"
                style={{ fontSize: 30, color: aqiInfo.color }}
              >
                {aqiVal ?? '--'}
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: aqiInfo.color,
                  textTransform: 'uppercase',
                }}
              >
                {aqiInfo.label}
              </div>
            </div>

            <div className="glass-panel stat-card">
              <div className="stat-card__top">
                <span>PM2.5</span>
              </div>
              <div className="stat-card__value">
                {airQuality.pm2_5} µg/m³
              </div>
            </div>

            <div className="glass-panel stat-card">
              <div className="stat-card__top">
                <span>PM10</span>
              </div>
              <div className="stat-card__value">
                {airQuality.pm10} µg/m³
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
