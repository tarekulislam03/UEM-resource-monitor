import { useMemo, useState } from 'react';
import {
  Table as TableIcon,
  ArrowUpDown,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { formatMonth } from '../utils/analytics';

export default function ReadingsTable({ readings, buildings, onDeleteReading }) {
  const [buildingFilter, setBuildingFilter] = useState('ALL');
  const [floorFilter, setFloorFilter] = useState('ALL');
  const [sortKey, setSortKey] = useState('month');
  const [sortDir, setSortDir] = useState('desc');

  const floors = useMemo(() => {
    const set = new Set(readings.map((r) => r.floor || 'Floor 1'));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [readings]);

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(
        key === 'building' || key === 'floor' || key === 'room' ? 'asc' : 'desc'
      );
    }
  }

  const filteredAndSorted = useMemo(() => {
    const filtered = readings.filter((r) => {
      if (buildingFilter !== 'ALL' && r.building !== buildingFilter) return false;
      if (floorFilter !== 'ALL' && (r.floor || 'Floor 1') !== floorFilter) return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (
        sortKey === 'building' ||
        sortKey === 'floor' ||
        sortKey === 'room' ||
        sortKey === 'month'
      ) {
        cmp = String(a[sortKey] || '').localeCompare(String(b[sortKey] || ''));
      } else if (sortKey === 'isSpike') {
        cmp = Number(a.isSpike) - Number(b.isSpike);
      } else {
        cmp = a[sortKey] - b[sortKey];
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [readings, buildingFilter, floorFilter, sortKey, sortDir]);

  return (
    <section className="glass-panel panel-pad" aria-label="Readings table">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">
            <TableIcon size={16} color="#0044cc" />
            Monthly Readings
          </h2>
          <p className="panel-subtitle">
            Showing {filteredAndSorted.length} of {readings.length} readings
          </p>
        </div>

        <div className="panel-controls">
          <select
            className="select"
            style={{ width: 'auto', minWidth: 140 }}
            aria-label="Filter table by building"
            value={buildingFilter}
            onChange={(e) => setBuildingFilter(e.target.value)}
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
            style={{ width: 'auto', minWidth: 125 }}
            aria-label="Filter table by floor"
            value={floorFilter}
            onChange={(e) => setFloorFilter(e.target.value)}
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

      {filteredAndSorted.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">
            <TableIcon size={18} />
          </div>
          <p>No readings match the selected filter.</p>
        </div>
      ) : (
        <div className="table-wrap" style={{ maxHeight: 480, overflowY: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>
                  <button type="button" onClick={() => toggleSort('building')}>
                    Building <ArrowUpDown size={12} />
                  </button>
                </th>
                <th>
                  <button type="button" onClick={() => toggleSort('floor')}>
                    Floor <ArrowUpDown size={12} />
                  </button>
                </th>
                <th>
                  <button type="button" onClick={() => toggleSort('room')}>
                    Room / Lab <ArrowUpDown size={12} />
                  </button>
                </th>
                <th>
                  <button type="button" onClick={() => toggleSort('month')}>
                    Month <ArrowUpDown size={12} />
                  </button>
                </th>
                <th>
                  <button type="button" onClick={() => toggleSort('kwh')}>
                    Electricity <ArrowUpDown size={12} />
                  </button>
                </th>
                <th>
                  <button type="button" onClick={() => toggleSort('water')}>
                    Water <ArrowUpDown size={12} />
                  </button>
                </th>
                <th>
                  <button type="button" onClick={() => toggleSort('isSpike')}>
                    Status <ArrowUpDown size={12} />
                  </button>
                </th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSorted.map((row) => (
                <tr key={row.id}>
                  <td style={{ fontWeight: 500 }}>{row.building}</td>
                  <td>{row.floor}</td>
                  <td className="mono">{row.room}</td>
                  <td className="mono">{formatMonth(row.month)}</td>
                  <td className="mono">{row.kwh.toLocaleString('en-IN')} kWh</td>
                  <td className="mono">{row.water.toLocaleString('en-IN')} L</td>
                  <td>
                    {row.isSpike ? (
                      <span
                        className="badge badge--spike"
                        title={row.spikeReasons.join(' | ')}
                      >
                        <AlertTriangle size={11} />
                        Spike
                      </span>
                    ) : (
                      <span className="badge badge--normal">Normal</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn btn--danger-ghost"
                      aria-label={`Delete reading for ${row.room} ${row.month}`}
                      onClick={() => onDeleteReading(row.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
