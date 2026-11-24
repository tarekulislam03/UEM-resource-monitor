import { DEFAULT_SETTINGS } from '../data/defaults';
import { createSeedReadings, SEED_BUILDINGS } from '../data/seedData';

const READINGS_KEY = 'cra_readings_v3';
const LEGACY_KEYS = ['cra_readings_v1', 'cra_readings_v2'];
const SETTINGS_KEY = 'cra_settings_v1';
const BUILDINGS_KEY = 'cra_buildings_v2';

export function loadReadings() {
  try {
    LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
    const raw = localStorage.getItem(READINGS_KEY);
    if (!raw) {
      const seed = createSeedReadings();
      localStorage.setItem(READINGS_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    const seed = createSeedReadings();
    localStorage.setItem(READINGS_KEY, JSON.stringify(seed));
    return seed;
  }
}

export function saveReadings(readings) {
  localStorage.setItem(READINGS_KEY, JSON.stringify(readings));
}

export function clearReadings() {
  saveReadings([]);
  return [];
}

export function resetReadingsToSeed() {
  const seed = createSeedReadings();
  saveReadings(seed);
  return seed;
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
      return { ...DEFAULT_SETTINGS };
    }
    const parsed = JSON.parse(raw);
    const tiers = parsed.electricityTiers || {};
    return {
      electricityTiers: {
        tier1:
          typeof tiers.tier1 === 'number' && tiers.tier1 >= 0
            ? tiers.tier1
            : DEFAULT_SETTINGS.electricityTiers.tier1,
        tier2:
          typeof tiers.tier2 === 'number' && tiers.tier2 >= 0
            ? tiers.tier2
            : DEFAULT_SETTINGS.electricityTiers.tier2,
        tier3:
          typeof tiers.tier3 === 'number' && tiers.tier3 >= 0
            ? tiers.tier3
            : DEFAULT_SETTINGS.electricityTiers.tier3,
      },
      waterRate:
        typeof parsed.waterRate === 'number' && parsed.waterRate >= 0
          ? parsed.waterRate
          : DEFAULT_SETTINGS.waterRate,
      co2Factor:
        typeof parsed.co2Factor === 'number' && parsed.co2Factor >= 0
          ? parsed.co2Factor
          : DEFAULT_SETTINGS.co2Factor,
      latitude:
        typeof parsed.latitude === 'number' &&
        parsed.latitude >= -90 &&
        parsed.latitude <= 90
          ? parsed.latitude
          : DEFAULT_SETTINGS.latitude,
      longitude:
        typeof parsed.longitude === 'number' &&
        parsed.longitude >= -180 &&
        parsed.longitude <= 180
          ? parsed.longitude
          : DEFAULT_SETTINGS.longitude,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadBuildings() {
  try {
    localStorage.removeItem('cra_buildings_v1');
    const raw = localStorage.getItem(BUILDINGS_KEY);
    if (!raw) {
      localStorage.setItem(BUILDINGS_KEY, JSON.stringify(SEED_BUILDINGS));
      return [...SEED_BUILDINGS];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.map((b) => String(b).trim()).filter(Boolean)
      : [...SEED_BUILDINGS];
  } catch {
    return [...SEED_BUILDINGS];
  }
}

export function saveBuildings(buildings) {
  localStorage.setItem(BUILDINGS_KEY, JSON.stringify(buildings));
}
