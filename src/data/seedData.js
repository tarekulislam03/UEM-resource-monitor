export const CAMPUS_STRUCTURE = {
  B1: {
    'Floor 1': ['B1 LG1.1', 'B1 LG1.2', 'B1 LG1.3'],
    'Floor 2': ['B1 LG2.1', 'B1 LG2.2', 'B1 LG2.3', 'B1 LG2.4'],
    'Floor 3': ['B1 LG3.1', 'B1 LG3.2', 'B1 LG3.3'],
  },
  B2: {
    'Floor 1': ['B2 LG1.1', 'B2 LG1.2', 'B2 LG1.3'],
    'Floor 2': ['B2 LG2.1', 'B2 LG2.2', 'B2 LG2.3'],
    'Floor 3': ['B2 LG3.1', 'B2 LG3.2', 'B2 LG3.3', 'B2 LG3.4'],
  },
  B3: {
    'Floor 1': ['B3 LG1.1', 'B3 LG1.2', 'B3 LG1.3'],
    'Floor 2': ['B3 LG2.1', 'B3 LG2.2', 'B3 LG2.3'],
    'Floor 3': ['B3 LG3.1', 'B3 LG3.4', 'B3 LG3.7'],
  },
};

export const SEED_BUILDINGS = Object.keys(CAMPUS_STRUCTURE);

const MONTHS = [
  '2026-06',
  '2026-07',
  '2026-08',
  '2026-09',
  '2026-10',
  '2026-11',
];

// Smooth seasonal factors (summer peak in Jun-Aug, cooler in Oct-Nov)
const KWH_SEASONAL = [1.14, 1.16, 1.11, 1.04, 0.96, 0.90];
const WATER_SEASONAL = [1.10, 1.12, 1.07, 1.02, 0.97, 0.93];

const BUILDING_BASE = {
  B1: { kwh: 820, water: 3600 },
  B2: { kwh: 760, water: 4100 },
  B3: { kwh: 940, water: 3400 },
};

const FLOOR_FACTOR = {
  'Floor 1': { kwh: 0.95, water: 1.12 },
  'Floor 2': { kwh: 1.05, water: 1.0 },
  'Floor 3': { kwh: 1.15, water: 0.92 },
};

const PLANTED_SPIKES = {
  'B3 LG3.7|2026-09': { kwhMultiplier: 1.58 },
  'B1 LG2.3|2026-08': { kwhMultiplier: 1.52 },
  'B2 LG1.2|2026-10': { waterMultiplier: 1.65 },
};

export function createSeedReadings() {
  const readings = [];

  Object.entries(CAMPUS_STRUCTURE).forEach(([building, floors], bIdx) => {
    const bBase = BUILDING_BASE[building];

    Object.entries(floors).forEach(([floor, rooms], fIdx) => {
      const fFactor = FLOOR_FACTOR[floor];

      rooms.forEach((room, rIdx) => {
        // Slight per-lab load variation (+/- 8%)
        const labFactor = 0.92 + ((bIdx + fIdx + rIdx) % 4) * 0.055;

        MONTHS.forEach((month, mIdx) => {
          const jitter = 1 + (((bIdx * 5 + fIdx * 3 + rIdx * 7 + mIdx * 11) % 5) - 2) * 0.015;
          let kwh = Math.round(
            bBase.kwh * fFactor.kwh * labFactor * KWH_SEASONAL[mIdx] * jitter
          );
          let water = Math.round(
            bBase.water * fFactor.water * labFactor * WATER_SEASONAL[mIdx] * jitter
          );

          const spike = PLANTED_SPIKES[`${room}|${month}`];
          if (spike?.kwhMultiplier) {
            kwh = Math.round(kwh * spike.kwhMultiplier);
          }
          if (spike?.waterMultiplier) {
            water = Math.round(water * spike.waterMultiplier);
          }

          readings.push({
            id: `seed-${room.toLowerCase().replace(/\s+/g, '-')}-${month}`,
            building,
            floor,
            room,
            month,
            kwh,
            water,
          });
        });
      });
    });
  });

  return readings;
}
