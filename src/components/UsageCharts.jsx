import { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { Activity, BarChart3 } from 'lucide-react';
import { formatMonth } from '../utils/analytics';

const CHART_TOOLTIP_STYLE = {
  background: '#ffffff',
  border: '1px solid #111111',
  borderRadius: '0px',
  padding: '8px 10px',
  boxShadow: '2px 2px 0 #111111',
  color: '#111111',
  fontSize: '12px',
};

function formatCompact(value) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
  return String(value);
}

function CustomLineTooltip({ active, payload, label, metric }) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
  const unit = metric === 'kwh' ? 'kWh' : 'L';
  const val = point.value;

  return (
    <div style={CHART_TOOLTIP_STYLE}>
      <div style={{ color: '#3f4650', marginBottom: 4, fontWeight: 700 }}>
        {formatMonth(label)}
      </div>
      <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: '#111111' }}>
        {val.toLocaleString('en-IN')} {unit}
      </div>
      {point.isSpike && (
        <div style={{ color: '#cc0000', marginTop: 4, fontSize: 11, fontWeight: 700 }}>
          SPIKE DETECTED{point.spikeLabel ? ` (${point.spikeLabel})` : ''}
        </div>
      )}
    </div>
  );
}

function CustomBarTooltip({ active, payload, label, metric }) {
  if (!active || !payload || payload.length === 0) return null;
  const unit = metric === 'kwh' ? 'kWh' : 'L';
  const val = payload[0].value;

  return (
    <div style={CHART_TOOLTIP_STYLE}>
      <div style={{ color: '#3f4650', marginBottom: 4, fontWeight: 700 }}>
        {formatMonth(label)}
      </div>
      <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: '#111111' }}>
        {val.toLocaleString('en-IN')} {unit}
      </div>
    </div>
  );
}

function SpikeDot(props) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null) return null;

  if (payload?.isSpike) {
    return (
      <rect
        x={cx - 4}
        y={cy - 4}
        width={8}
        height={8}
        fill="#cc0000"
        stroke="#111111"
        strokeWidth={1.5}
      />
    );
  }

  return (
    <rect
      x={cx - 3}
      y={cy - 3}
      width={6}
      height={6}
      fill="#0044cc"
      stroke="#ffffff"
      strokeWidth={1}
    />
  );
}

export default function UsageCharts({ readings, buildings }) {
  const [metric, setMetric] = useState('kwh');
  const [selectedBuilding, setSelectedBuilding] = useState('ALL');
  const [selectedFloor, setSelectedFloor] = useState('ALL');
  const [compareBy, setCompareBy] = useState('building');

  const floors = useMemo(() => {
    const set = new Set(
      readings
        .filter((r) => selectedBuilding === 'ALL' || r.building === selectedBuilding)
        .map((r) => r.floor || 'Floor 1')
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [readings, selectedBuilding]);

  const timeSeriesData = useMemo(() => {
    const filtered = readings.filter((r) => {
      if (selectedBuilding !== 'ALL' && r.building !== selectedBuilding) return false;
      if (selectedFloor !== 'ALL' && (r.floor || 'Floor 1') !== selectedFloor) return false;
      return true;
    });

    const byMonth = new Map();
    for (const r of filtered) {
      const curr = byMonth.get(r.month) || {
        month: r.month,
        value: 0,
        isSpike: false,
        spikeLabel: '',
      };
      curr.value += metric === 'kwh' ? r.kwh : r.water;
      const metricSpike = metric === 'kwh' ? r.kwhSpike : r.waterSpike;
      if (metricSpike) {
        curr.isSpike = true;
        const unitLabel = r.room || r.building;
        curr.spikeLabel = curr.spikeLabel
          ? `${curr.spikeLabel}, ${unitLabel}`
          : unitLabel;
      }
      byMonth.set(r.month, curr);
    }

    return Array.from(byMonth.values()).sort((a, b) =>
      a.month.localeCompare(b.month)
    );
  }, [readings, selectedBuilding, selectedFloor, metric]);

  const comparisonData = useMemo(() => {
    const filtered =
      selectedBuilding === 'ALL' || compareBy === 'building'
        ? readings
        : readings.filter((r) => r.building === selectedBuilding);

    const byKey = new Map();
    for (const r of filtered) {
      const key =
        compareBy === 'building'
          ? r.building
          : `${r.building} ${r.floor.replace('Floor ', 'F')}`;
      const curr = byKey.get(key) || { label: key, total: 0 };
      curr.total += metric === 'kwh' ? r.kwh : r.water;
      byKey.set(key, curr);
    }

    return Array.from(byKey.values()).sort((a, b) =>
      compareBy === 'floor'
        ? a.label.localeCompare(b.label)
        : b.total - a.total
    );
  }, [readings, selectedBuilding, compareBy, metric]);

  const topLabel = useMemo(() => {
    if (comparisonData.length === 0) return null;
    return [...comparisonData].sort((a, b) => b.total - a.total)[0].label;
  }, [comparisonData]);

  return (
    <section className="charts-grid" aria-label="Usage visualizations">
      <div className="glass-panel panel-pad">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">
              <Activity size={16} color="#0044cc" />
              Usage Over Time
            </h2>
            <p className="panel-subtitle">
              Monthly trend with red markers on flagged spikes
            </p>
          </div>

          <div className="panel-controls">
            <div className="segmented" role="group" aria-label="Metric toggle">
              <button
                type="button"
                className={`segmented__btn ${
                  metric === 'kwh' ? 'segmented__btn--active' : ''
                }`}
                onClick={() => setMetric('kwh')}
              >
                Electricity
              </button>
              <button
                type="button"
                className={`segmented__btn ${
                  metric === 'water' ? 'segmented__btn--active' : ''
                }`}
                onClick={() => setMetric('water')}
              >
                Water
              </button>
            </div>

            <select
              className="select"
              style={{ width: 'auto', minWidth: 130 }}
              aria-label="Filter chart by building"
              value={selectedBuilding}
              onChange={(e) => {
                setSelectedBuilding(e.target.value);
                setSelectedFloor('ALL');
              }}
            >
              <option value="ALL">All Buildings</option>
              {buildings.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>

            <select
              className="select"
              style={{ width: 'auto', minWidth: 115 }}
              aria-label="Filter chart by floor"
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value)}
            >
              <option value="ALL">All Floors</option>
              {floors.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
        </div>

        {timeSeriesData.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">
              <Activity size={18} />
            </div>
            <p>No readings available to plot.</p>
          </div>
        ) : (
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={timeSeriesData}
                margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  stroke="#d5dbe2"
                  strokeDasharray="2 2"
                />
                <XAxis
                  dataKey="month"
                  stroke="#111111"
                  tick={{ fill: '#111111', fontSize: 11 }}
                  tickFormatter={formatMonth}
                  tickLine={{ stroke: '#111111' }}
                />
                <YAxis
                  stroke="#111111"
                  tick={{ fill: '#111111', fontSize: 11 }}
                  tickFormatter={formatCompact}
                  tickLine={{ stroke: '#111111' }}
                  width={48}
                />
                <Tooltip
                  content={<CustomLineTooltip metric={metric} />}
                  cursor={{ stroke: '#111111', strokeDasharray: '2 2' }}
                />
                <Line
                  type="linear"
                  dataKey="value"
                  stroke="#0044cc"
                  strokeWidth={2}
                  dot={<SpikeDot />}
                  activeDot={{ r: 5, fill: '#0044cc', stroke: '#111111', strokeWidth: 1.5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="glass-panel panel-pad">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">
              <BarChart3 size={16} color="#0044cc" />
              {compareBy === 'building' ? 'Building Comparison' : 'Floor Comparison'}
            </h2>
            <p className="panel-subtitle">
              Total {metric === 'kwh' ? 'electricity (kWh)' : 'water (litres)'}
            </p>
          </div>

          <div className="segmented" role="group" aria-label="Comparison grouping">
            <button
              type="button"
              className={`segmented__btn ${
                compareBy === 'building' ? 'segmented__btn--active' : ''
              }`}
              onClick={() => setCompareBy('building')}
            >
              Building
            </button>
            <button
              type="button"
              className={`segmented__btn ${
                compareBy === 'floor' ? 'segmented__btn--active' : ''
              }`}
              onClick={() => setCompareBy('floor')}
            >
              Floor
            </button>
          </div>
        </div>

        {comparisonData.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">
              <BarChart3 size={18} />
            </div>
            <p>No data to compare.</p>
          </div>
        ) : (
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={comparisonData}
                margin={{ top: 10, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  stroke="#d5dbe2"
                  strokeDasharray="2 2"
                />
                <XAxis
                  dataKey="label"
                  stroke="#111111"
                  tick={{ fill: '#111111', fontSize: 11 }}
                  tickLine={{ stroke: '#111111' }}
                />
                <YAxis
                  stroke="#111111"
                  tick={{ fill: '#111111', fontSize: 11 }}
                  tickFormatter={formatCompact}
                  tickLine={{ stroke: '#111111' }}
                  width={48}
                />
                <Tooltip
                  content={<CustomBarTooltip metric={metric} />}
                  cursor={{ fill: 'rgba(0, 68, 204, 0.08)' }}
                />
                <Bar dataKey="total" radius={[0, 0, 0, 0]}>
                  {comparisonData.map((entry) => (
                    <Cell
                      key={entry.label}
                      fill={entry.label === topLabel ? '#0044cc' : '#222222'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </section>
  );
}
