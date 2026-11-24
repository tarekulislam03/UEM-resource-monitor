import { useState } from 'react';
import { SlidersHorizontal, AlertCircle, CheckCircle2, Trash2, RotateCcw } from 'lucide-react';
import { DEFAULT_SETTINGS } from '../data/defaults';

export default function SettingsPage({
  settings,
  onSaveSettings,
  readingCount,
  onClearData,
  onResetSeed,
}) {
  const [tier1, setTier1] = useState(String(settings.electricityTiers.tier1));
  const [tier2, setTier2] = useState(String(settings.electricityTiers.tier2));
  const [tier3, setTier3] = useState(String(settings.electricityTiers.tier3));
  const [waterRate, setWaterRate] = useState(String(settings.waterRate));
  const [co2Factor, setCo2Factor] = useState(String(settings.co2Factor));
  const [latitude, setLatitude] = useState(String(settings.latitude));
  const [longitude, setLongitude] = useState(String(settings.longitude));
  const [error, setError] = useState('');
  const [savedMsg, setSavedMsg] = useState('');

  function handleSave(e) {
    e.preventDefault();
    setSavedMsg('');
    const t1 = Number(tier1);
    const t2 = Number(tier2);
    const t3 = Number(tier3);
    const water = Number(waterRate);
    const co2 = Number(co2Factor);
    const lat = Number(latitude);
    const lng = Number(longitude);

    if (
      !Number.isFinite(t1) ||
      t1 < 0 ||
      !Number.isFinite(t2) ||
      t2 < 0 ||
      !Number.isFinite(t3) ||
      t3 < 0 ||
      !Number.isFinite(water) ||
      water < 0 ||
      !Number.isFinite(co2) ||
      co2 < 0
    ) {
      setError('All rates and factors must be non-negative numbers.');
      return;
    }

    if (
      !Number.isFinite(lat) ||
      lat < -90 ||
      lat > 90 ||
      !Number.isFinite(lng) ||
      lng < -180 ||
      lng > 180
    ) {
      setError('Latitude must be -90 to 90 and Longitude must be -180 to 180.');
      return;
    }

    setError('');
    onSaveSettings({
      electricityTiers: {
        tier1: t1,
        tier2: t2,
        tier3: t3,
      },
      waterRate: water,
      co2Factor: co2,
      latitude: lat,
      longitude: lng,
    });
    setSavedMsg('Settings saved.');
  }

  function handleRestoreDefaults() {
    setTier1(String(DEFAULT_SETTINGS.electricityTiers.tier1));
    setTier2(String(DEFAULT_SETTINGS.electricityTiers.tier2));
    setTier3(String(DEFAULT_SETTINGS.electricityTiers.tier3));
    setWaterRate(String(DEFAULT_SETTINGS.waterRate));
    setCo2Factor(String(DEFAULT_SETTINGS.co2Factor));
    setLatitude(String(DEFAULT_SETTINGS.latitude));
    setLongitude(String(DEFAULT_SETTINGS.longitude));
    onSaveSettings({
      electricityTiers: { ...DEFAULT_SETTINGS.electricityTiers },
      waterRate: DEFAULT_SETTINGS.waterRate,
      co2Factor: DEFAULT_SETTINGS.co2Factor,
      latitude: DEFAULT_SETTINGS.latitude,
      longitude: DEFAULT_SETTINGS.longitude,
    });
    setError('');
    setSavedMsg('Default rates and coordinates restored.');
  }

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-header__title">Settings</h1>
          <p className="page-header__subtitle">
            Configure tariff rates, campus coordinates, and stored data
          </p>
        </div>
      </header>

      <div className="workspace-grid">
        <section className="glass-panel panel-pad">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">
                <SlidersHorizontal size={16} color="#0044cc" />
                Rates, Emissions & Location
              </h2>
              <p className="panel-subtitle">
                Progressive slab pricing and campus coordinates for environment data
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSave}
            style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            <div className="form-grid-3">
              <div className="field">
                <label className="field__label" htmlFor="setting-tier1">
                  0–100 kWh (Rs)
                </label>
                <input
                  id="setting-tier1"
                  type="number"
                  step="0.01"
                  min="0"
                  className="input input--mono"
                  placeholder="Enter 0-100 kWh rate here"
                  value={tier1}
                  onChange={(e) => setTier1(e.target.value)}
                />
              </div>

              <div className="field">
                <label className="field__label" htmlFor="setting-tier2">
                  101–200 kWh (Rs)
                </label>
                <input
                  id="setting-tier2"
                  type="number"
                  step="0.01"
                  min="0"
                  className="input input--mono"
                  placeholder="Enter 101-200 kWh rate here"
                  value={tier2}
                  onChange={(e) => setTier2(e.target.value)}
                />
              </div>

              <div className="field">
                <label className="field__label" htmlFor="setting-tier3">
                  Above 200 kWh (Rs)
                </label>
                <input
                  id="setting-tier3"
                  type="number"
                  step="0.01"
                  min="0"
                  className="input input--mono"
                  placeholder="Enter above 200 kWh rate here"
                  value={tier3}
                  onChange={(e) => setTier3(e.target.value)}
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="field">
                <label className="field__label" htmlFor="setting-water">
                  Water Rate (Rs / litre)
                </label>
                <input
                  id="setting-water"
                  type="number"
                  step="0.001"
                  min="0"
                  className="input input--mono"
                  placeholder="Enter water rate per litre here"
                  value={waterRate}
                  onChange={(e) => setWaterRate(e.target.value)}
                />
              </div>

              <div className="field">
                <label className="field__label" htmlFor="setting-co2">
                  CO2 Factor (kg / kWh)
                </label>
                <input
                  id="setting-co2"
                  type="number"
                  step="0.01"
                  min="0"
                  className="input input--mono"
                  placeholder="Enter CO2 factor here"
                  value={co2Factor}
                  onChange={(e) => setCo2Factor(e.target.value)}
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="field">
                <label className="field__label" htmlFor="setting-lat">
                  Latitude
                </label>
                <input
                  id="setting-lat"
                  type="number"
                  step="0.0001"
                  min="-90"
                  max="90"
                  className="input input--mono"
                  placeholder="Enter latitude here"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                />
              </div>

              <div className="field">
                <label className="field__label" htmlFor="setting-lng">
                  Longitude
                </label>
                <input
                  id="setting-lng"
                  type="number"
                  step="0.0001"
                  min="-180"
                  max="180"
                  className="input input--mono"
                  placeholder="Enter longitude here"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="error-banner" role="alert">
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {savedMsg && (
              <div className="success-banner" role="status">
                <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
                <span>{savedMsg}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={handleRestoreDefaults}
              >
                Reset Default Rates
              </button>
              <button type="submit" className="btn btn--primary">
                Save Settings
              </button>
            </div>
          </form>
        </section>

        <section className="glass-panel panel-pad" style={{ alignSelf: 'start' }}>
          <div className="panel-header">
            <div>
              <h2 className="panel-title">
                <Trash2 size={16} color="#cc0000" />
                Reset Data
              </h2>
              <p className="panel-subtitle">
                Manage stored readings in localStorage
              </p>
            </div>
          </div>

          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14 }}>
            Currently storing <span className="mono">{readingCount}</span> reading
            {readingCount === 1 ? '' : 's'} in this browser.
          </p>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn"
              onClick={onResetSeed}
            >
              <RotateCcw size={15} />
              Load Campus Data (B1-B3)
            </button>
            <button
              type="button"
              className="btn"
              disabled={readingCount === 0}
              onClick={onClearData}
            >
              <Trash2 size={15} />
              Clear All Readings
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
