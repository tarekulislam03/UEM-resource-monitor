import { useCallback, useEffect, useMemo, useState } from 'react';
import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { Bell, Menu, X } from 'lucide-react';
import {
  loadReadings,
  saveReadings,
  clearReadings,
  resetReadingsToSeed,
  loadSettings,
  saveSettings,
  loadBuildings,
  saveBuildings,
} from './utils/storage';
import { SEED_BUILDINGS } from './data/seedData';
import {
  analyzeReadings,
  computeSummary,
  generateInsights,
} from './utils/analytics';
import { getReadingKey } from './utils/csv';
import DashboardPage from './pages/DashboardPage';
import AddDataPage from './pages/AddDataPage';
import ReadingsPage from './pages/ReadingsPage';
import InsightsPage from './pages/InsightsPage';
import SettingsPage from './pages/SettingsPage';
import EnvironmentPage from './pages/EnvironmentPage';
import { fetchWeather, fetchAirQuality } from './utils/environmentApi';

const NAV_LINKS = [
  { to: '/', label: 'Dashboard' },
  { to: '/add', label: 'Add Data' },
  { to: '/readings', label: 'Readings' },
  { to: '/insights', label: 'Insights' },
  { to: '/environment', label: 'Environment' },
  { to: '/settings', label: 'Settings' },
];

export default function App() {
  const [readings, setReadings] = useState(() => loadReadings());
  const [settings, setSettings] = useState(() => loadSettings());
  const [savedBuildings, setSavedBuildings] = useState(() => loadBuildings());
  const [menuOpen, setMenuOpen] = useState(false);
  const [envState, setEnvState] = useState({
    weather: null,
    airQuality: null,
    loading: false,
    error: '',
    lastUpdated: null,
  });

  const refreshEnvironment = useCallback(async () => {
    setEnvState((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const [weather, airQuality] = await Promise.all([
        fetchWeather(settings.latitude, settings.longitude),
        fetchAirQuality(settings.latitude, settings.longitude),
      ]);
      setEnvState({
        weather,
        airQuality,
        loading: false,
        error: '',
        lastUpdated: new Date().toISOString(),
      });
    } catch (err) {
      setEnvState((prev) => ({
        ...prev,
        loading: false,
        error: err?.message || 'Failed to fetch environment data.',
      }));
    }
  }, [settings.latitude, settings.longitude]);

  useEffect(() => {
    refreshEnvironment();
    const intervalId = setInterval(refreshEnvironment, 10 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [refreshEnvironment]);

  useEffect(() => {
    saveReadings(readings);
  }, [readings]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveBuildings(savedBuildings);
  }, [savedBuildings]);

  const analyzedReadings = useMemo(
    () => analyzeReadings(readings),
    [readings]
  );

  const summary = useMemo(
    () => computeSummary(analyzedReadings, settings),
    [analyzedReadings, settings]
  );

  const insights = useMemo(
    () => generateInsights(analyzedReadings),
    [analyzedReadings]
  );

  const buildings = useMemo(() => {
    const set = new Set([
      ...savedBuildings,
      ...readings.map((r) => r.building),
    ]);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [savedBuildings, readings]);

  function handleAddBuilding(name) {
    setSavedBuildings((prev) =>
      prev.some((b) => b.toLowerCase() === name.toLowerCase())
        ? prev
        : [...prev, name]
    );
  }

  function handleRemoveBuilding(name) {
    setSavedBuildings((prev) => prev.filter((b) => b !== name));
  }

  function upsertReadings(incomingRows) {
    let addedCount = 0;
    let updatedCount = 0;

    const next = [...readings];
    const indexByKey = new Map();
    next.forEach((item, idx) => {
      indexByKey.set(getReadingKey(item), idx);
    });

    for (const row of incomingRows) {
      const key = getReadingKey(row);
      if (indexByKey.has(key)) {
        const existingIdx = indexByKey.get(key);
        next[existingIdx] = { ...row, id: next[existingIdx].id };
        updatedCount += 1;
      } else {
        indexByKey.set(key, next.length);
        next.unshift(row);
        addedCount += 1;
      }
    }

    setReadings(next);
    return { addedCount, updatedCount };
  }

  function handleAddReading(newReading) {
    handleAddBuilding(newReading.building);
    return upsertReadings([newReading]);
  }

  function handleImportReadings(newRows) {
    setSavedBuildings((prev) => {
      const next = new Set(prev);
      newRows.forEach((r) => next.add(r.building));
      return Array.from(next);
    });
    return upsertReadings(newRows);
  }

  function handleDeleteReading(id) {
    setReadings((prev) => prev.filter((r) => r.id !== id));
  }

  function handleClearData() {
    setReadings(clearReadings());
  }

  function handleResetSeed() {
    setSavedBuildings([...SEED_BUILDINGS]);
    setReadings(resetReadingsToSeed());
  }

  return (
    <div className="app-shell">
      <div className="bg-blobs" aria-hidden="true">
        <div className="bg-blob bg-blob--one" />
        <div className="bg-blob bg-blob--two" />
        <div className="bg-blob bg-blob--three" />
      </div>

      <header className="topbar">
        <div className="topbar__inner">
          <div className="topbar__brand-row">
            <NavLink
              to="/"
              className="topbar__brand"
              onClick={() => setMenuOpen(false)}
            >
              <img
                src="/logo.webp"
                alt="UEM Resource Manager logo"
                className="topbar__logo"
              />
              <span>UEM Resource Manager</span>
            </NavLink>

            <button
              type="button"
              className="topbar__menu-btn"
              aria-label="Toggle navigation menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          <nav
            className={`topbar__nav ${menuOpen ? 'topbar__nav--open' : ''}`}
            aria-label="Primary navigation"
          >
            {NAV_LINKS.map((link) => {
              const isInsights = link.to === '/insights';
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `topbar__link ${isActive ? 'topbar__link--active' : ''}`
                  }
                >
                  {isInsights && <Bell size={14} />}
                  <span>{link.label}</span>
                  {isInsights && summary.spikeCount > 0 && (
                    <span className="topbar__badge">{summary.spikeCount}</span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="main-content">
        <Routes>
          <Route
            path="/"
            element={
              <DashboardPage
                readings={analyzedReadings}
                buildings={buildings}
                settings={settings}
                envState={envState}
              />
            }
          />
          <Route
            path="/add"
            element={
              <AddDataPage
                buildings={buildings}
                readings={analyzedReadings}
                onAddBuilding={handleAddBuilding}
                onRemoveBuilding={handleRemoveBuilding}
                onAddReading={handleAddReading}
                onImportReadings={handleImportReadings}
              />
            }
          />
          <Route
            path="/readings"
            element={
              <ReadingsPage
                readings={analyzedReadings}
                buildings={buildings}
                onDeleteReading={handleDeleteReading}
              />
            }
          />
          <Route
            path="/insights"
            element={
              <InsightsPage readings={analyzedReadings} insights={insights} />
            }
          />
          <Route
            path="/environment"
            element={
              <EnvironmentPage
                settings={settings}
                weather={envState.weather}
                airQuality={envState.airQuality}
                loading={envState.loading}
                error={envState.error}
                lastUpdated={envState.lastUpdated}
                onRefresh={refreshEnvironment}
              />
            }
          />
          <Route
            path="/settings"
            element={
              <SettingsPage
                settings={settings}
                onSaveSettings={setSettings}
                readingCount={readings.length}
                onClearData={handleClearData}
                onResetSeed={handleResetSeed}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
