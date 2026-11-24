const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function formatMonth(monthStr) {
  const match = /^(\d{4})-(\d{2})$/.exec(String(monthStr || '').trim());
  if (!match) return String(monthStr || '');
  const year = match[1];
  const idx = Number(match[2]) - 1;
  return MONTH_NAMES[idx] ? `${MONTH_NAMES[idx]} ${year}` : String(monthStr);
}

function computeStats(values) {
  if (values.length === 0) return { mean: 0, stdDev: 0 };
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance =
    values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return { mean, stdDev: Math.sqrt(variance) };
}

/**
 * Enrich each reading with spike flags and reasons.
 * Grouped per lab/room (falling back to building+floor) so each lab has its own baseline.
 */
export function analyzeReadings(readings) {
  const byUnit = new Map();

  for (const r of readings) {
    const key = r.room
      ? `${r.building}::${r.room}`
      : `${r.building}::${r.floor || 'Floor 1'}`;
    if (!byUnit.has(key)) {
      byUnit.set(key, []);
    }
    byUnit.get(key).push(r);
  }

  const analyzedById = new Map();

  for (const [, list] of byUnit.entries()) {
    const sorted = [...list].sort((a, b) => a.month.localeCompare(b.month));
    const kwhStats = computeStats(sorted.map((r) => r.kwh));
    const waterStats = computeStats(sorted.map((r) => r.water));

    sorted.forEach((r, idx) => {
      const prev = idx > 0 ? sorted[idx - 1] : null;
      const reasons = [];

      const kwhAboveSd =
        sorted.length >= 2 &&
        kwhStats.stdDev > 0 &&
        r.kwh > kwhStats.mean + 2 * kwhStats.stdDev;
      const kwhMomPct =
        prev && prev.kwh > 0 ? ((r.kwh - prev.kwh) / prev.kwh) * 100 : 0;
      const kwhAboveMom = prev !== null && kwhMomPct > 25;

      const waterAboveSd =
        sorted.length >= 2 &&
        waterStats.stdDev > 0 &&
        r.water > waterStats.mean + 2 * waterStats.stdDev;
      const waterMomPct =
        prev && prev.water > 0 ? ((r.water - prev.water) / prev.water) * 100 : 0;
      const waterAboveMom = prev !== null && waterMomPct > 25;

      if (kwhAboveMom) {
        reasons.push(`Electricity +${Math.round(kwhMomPct)}% vs prev month`);
      } else if (kwhAboveSd) {
        reasons.push('Electricity above 2σ lab threshold');
      }

      if (waterAboveMom) {
        reasons.push(`Water +${Math.round(waterMomPct)}% vs prev month`);
      } else if (waterAboveSd) {
        reasons.push('Water above 2σ lab threshold');
      }

      const kwhSpike = kwhAboveSd || kwhAboveMom;
      const waterSpike = waterAboveSd || waterMomPct > 25;

      analyzedById.set(r.id, {
        ...r,
        floor: r.floor || 'Floor 1',
        room: r.room || 'General',
        kwhSpike,
        waterSpike,
        isSpike: kwhSpike || waterSpike,
        spikeReasons: reasons,
        kwhPctAboveAvg:
          kwhStats.mean > 0 ? ((r.kwh - kwhStats.mean) / kwhStats.mean) * 100 : 0,
        waterPctAboveAvg:
          waterStats.mean > 0
            ? ((r.water - waterStats.mean) / waterStats.mean) * 100
            : 0,
      });
    });
  }

  return readings.map((r) => analyzedById.get(r.id));
}

export function calculateElectricityCost(kwh, electricityTiers) {
  const tier1 = Math.min(kwh, 100) * electricityTiers.tier1;
  const tier2 = Math.min(Math.max(kwh - 100, 0), 100) * electricityTiers.tier2;
  const tier3 = Math.max(kwh - 200, 0) * electricityTiers.tier3;
  return tier1 + tier2 + tier3;
}

export function computeSummary(analyzedReadings, settings) {
  let totalKwh = 0;
  let totalWater = 0;
  let totalElectricityCost = 0;
  let spikeCount = 0;

  for (const r of analyzedReadings) {
    totalKwh += r.kwh;
    totalWater += r.water;
    totalElectricityCost += calculateElectricityCost(
      r.kwh,
      settings.electricityTiers
    );
    if (r.isSpike) spikeCount += 1;
  }

  const estimatedCost =
    totalElectricityCost + totalWater * settings.waterRate;
  const totalCo2Kg = totalKwh * settings.co2Factor;

  return {
    totalKwh,
    totalWater,
    estimatedCost,
    totalCo2Kg,
    spikeCount,
  };
}

/**
 * Generate up to 4 rule-based savings insights sorted by severity.
 */
export function generateInsights(analyzedReadings) {
  if (analyzedReadings.length === 0) return [];

  const insights = [];
  const seenTopics = new Set();

  // 1. Flagged lab/floor spikes
  const spikes = analyzedReadings
    .filter((r) => r.isSpike)
    .sort((a, b) => {
      const aScore = Math.max(a.kwhPctAboveAvg, a.waterPctAboveAvg);
      const bScore = Math.max(b.kwhPctAboveAvg, b.waterPctAboveAvg);
      return bScore - aScore;
    });

  for (const s of spikes) {
    const label = `${s.room} (${s.building}, ${s.floor})`;
    if (s.kwhSpike && !seenTopics.has(`kwh-spike-${s.room}`)) {
      seenTopics.add(`kwh-spike-${s.room}`);
      const pct = Math.max(1, Math.round(s.kwhPctAboveAvg));
      insights.push({
        id: `insight-kwh-spike-${s.id}`,
        severity: 'high',
        score: 100 + pct,
        message: `${label} electricity in ${formatMonth(s.month)} is ${pct}% above its average. Check lab equipment standby power and AC schedules.`,
      });
    }
    if (s.waterSpike && !seenTopics.has(`water-spike-${s.room}`)) {
      seenTopics.add(`water-spike-${s.room}`);
      const pct = Math.max(1, Math.round(s.waterPctAboveAvg));
      insights.push({
        id: `insight-water-spike-${s.id}`,
        severity: 'high',
        score: 100 + pct,
        message: `${label} water usage in ${formatMonth(s.month)} is ${pct}% above its average. Inspect lab sinks, valves, and floor supply lines for leaks.`,
      });
    }
  }

  // 2. Highest electricity floor
  const byFloor = new Map();
  for (const r of analyzedReadings) {
    const key = `${r.building} ${r.floor}`;
    const curr = byFloor.get(key) || { kwh: 0, water: 0 };
    curr.kwh += r.kwh;
    curr.water += r.water;
    byFloor.set(key, curr);
  }
  const floorTotals = Array.from(byFloor.entries()).map(([label, v]) => ({
    label,
    ...v,
  }));

  const totalKwh = floorTotals.reduce((sum, f) => sum + f.kwh, 0);
  const topElecFloor = [...floorTotals].sort((a, b) => b.kwh - a.kwh)[0];
  if (topElecFloor && totalKwh > 0) {
    const share = Math.round((topElecFloor.kwh / totalKwh) * 100);
    insights.push({
      id: `insight-top-kwh-${topElecFloor.label}`,
      severity: 'medium',
      score: 60 + share,
      message: `${topElecFloor.label} accounts for ${share}% of campus electricity. Audit lab workstation power-down policies and HVAC timers.`,
    });
  }

  // 3. Highest water floor
  const totalWater = floorTotals.reduce((sum, f) => sum + f.water, 0);
  const topWaterFloor = [...floorTotals].sort((a, b) => b.water - a.water)[0];
  if (topWaterFloor && totalWater > 0) {
    const share = Math.round((topWaterFloor.water / totalWater) * 100);
    insights.push({
      id: `insight-top-water-${topWaterFloor.label}`,
      severity: 'medium',
      score: 50 + share,
      message: `${topWaterFloor.label} uses ${share}% of campus water. Check restroom fixtures and lab cooling lines on this floor.`,
    });
  }

  return insights.sort((a, b) => b.score - a.score).slice(0, 4);
}
