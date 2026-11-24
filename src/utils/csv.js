import Papa from 'papaparse';

const MONTH_REGEX = /^(20\d{2})-(0[1-9]|1[0-2])$/;

function normalizeText(val) {
  return String(val ?? '')
    .trim()
    .replace(/\s+/g, ' ');
}

export function getReadingKey(r) {
  return [
    normalizeText(r.building).toLowerCase(),
    normalizeText(r.floor || 'Floor 1').toLowerCase(),
    normalizeText(r.room || r.building).toLowerCase(),
    normalizeText(r.month),
  ].join('|');
}

export function validateReadingFields({
  building,
  floor,
  room,
  month,
  kwh,
  water,
}) {
  const errors = [];
  const cleanBuilding = normalizeText(building);
  const cleanFloor = normalizeText(floor) || 'Floor 1';
  const cleanRoom = normalizeText(room);
  const cleanMonth = normalizeText(month);
  const rawKwh = String(kwh ?? '').trim();
  const rawWater = String(water ?? '').trim();
  const numKwh = Number(rawKwh);
  const numWater = Number(rawWater);

  if (!cleanBuilding) {
    errors.push('Building name is required.');
  }
  if (!cleanRoom) {
    errors.push('Room / Lab name is required (e.g. B3 LG3.7).');
  }
  if (!MONTH_REGEX.test(cleanMonth)) {
    errors.push('Month must be in YYYY-MM format (e.g. 2026-09).');
  }
  if (rawKwh === '' || !Number.isFinite(numKwh) || numKwh < 0) {
    errors.push('Electricity (kWh) must be a non-negative number.');
  }
  if (rawWater === '' || !Number.isFinite(numWater) || numWater < 0) {
    errors.push('Water (litres) must be a non-negative number.');
  }

  return {
    valid: errors.length === 0,
    errors,
    value: {
      building: cleanBuilding,
      floor: cleanFloor,
      room: cleanRoom,
      month: cleanMonth,
      kwh: numKwh,
      water: numWater,
    },
  };
}

export function parseReadingsCsv(file) {
  return new Promise((resolve) => {
    if (!file) {
      resolve({ validRows: [], rowErrors: ['No file selected.'] });
      return;
    }

    const isCsv =
      file.name.toLowerCase().endsWith('.csv') ||
      file.type === 'text/csv' ||
      file.type === 'application/vnd.ms-excel';

    if (!isCsv) {
      resolve({
        validRows: [],
        rowErrors: ['Please upload a valid .csv file.'],
      });
      return;
    }

    if (file.size === 0) {
      resolve({
        validRows: [],
        rowErrors: ['The uploaded CSV file is empty.'],
      });
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (h) => h.trim().toLowerCase(),
      complete: (results) => {
        const requiredCols = ['building', 'month', 'kwh', 'water'];
        const fields = results.meta?.fields || [];
        const missingCols = requiredCols.filter((c) => !fields.includes(c));

        if (missingCols.length > 0) {
          resolve({
            validRows: [],
            rowErrors: [
              `Missing required column(s): ${missingCols.join(', ')}. Expected: building,floor,room,month,kwh,water`,
            ],
          });
          return;
        }

        if (!results.data || results.data.length === 0) {
          resolve({
            validRows: [],
            rowErrors: ['CSV contains headers but no data rows.'],
          });
          return;
        }

        const dedupedByKey = new Map();
        const rowErrors = [];

        results.data.forEach((row, index) => {
          const lineNumber = index + 2;
          const check = validateReadingFields({
            building: row.building,
            floor: row.floor || 'Floor 1',
            room: row.room || row.building,
            month: row.month,
            kwh: row.kwh,
            water: row.water,
          });

          if (check.valid) {
            const key = getReadingKey(check.value);
            dedupedByKey.set(key, {
              id: `csv-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
              ...check.value,
            });
          } else {
            rowErrors.push(`Row ${lineNumber}: ${check.errors.join(' ')}`);
          }
        });

        resolve({
          validRows: Array.from(dedupedByKey.values()),
          rowErrors,
        });
      },
      error: (err) => {
        resolve({
          validRows: [],
          rowErrors: [`Failed to parse CSV: ${err.message}`],
        });
      },
    });
  });
}

export function downloadSampleCsv() {
  const sample = [
    'building,floor,room,month,kwh,water',
    'B1,Floor 1,B1 LG1.1,2026-12,810,3500',
    'B2,Floor 2,B2 LG2.2,2026-12,790,3950',
    'B3,Floor 3,B3 LG3.7,2026-12,1020,3100',
  ].join('\n');

  const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'campus-readings-sample.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
