import { useMemo, useState } from 'react';
import { PlusCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { validateReadingFields } from '../utils/csv';

const NEW_BUILDING_VALUE = '__NEW__';
const NEW_FLOOR_VALUE = '__NEW_FLOOR__';
const DEFAULT_FLOORS = ['Floor 1', 'Floor 2', 'Floor 3', 'Floor 4'];

export default function AddReadingForm({
  buildings,
  readings = [],
  onAddReading,
}) {
  const [selectedBuilding, setSelectedBuilding] = useState(
    buildings[0] || NEW_BUILDING_VALUE
  );
  const [newBuilding, setNewBuilding] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('Floor 1');
  const [customFloor, setCustomFloor] = useState('');
  const [room, setRoom] = useState('');
  const [month, setMonth] = useState('2026-12');
  const [kwh, setKwh] = useState('');
  const [water, setWater] = useState('');
  const [errors, setErrors] = useState([]);
  const [successMsg, setSuccessMsg] = useState('');

  const resolvedSelection =
    selectedBuilding === NEW_BUILDING_VALUE || buildings.includes(selectedBuilding)
      ? selectedBuilding
      : buildings[0] || NEW_BUILDING_VALUE;

  const effectiveBuilding =
    resolvedSelection === NEW_BUILDING_VALUE ? newBuilding : resolvedSelection;

  const floorOptions = useMemo(() => {
    const set = new Set(DEFAULT_FLOORS);
    readings.forEach((r) => {
      if (r.floor) set.add(r.floor);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [readings]);

  const effectiveFloor =
    selectedFloor === NEW_FLOOR_VALUE ? customFloor : selectedFloor;

  const suggestedRooms = useMemo(() => {
    const set = new Set();
    readings.forEach((r) => {
      if (
        (!effectiveBuilding || r.building === effectiveBuilding) &&
        (!effectiveFloor || r.floor === effectiveFloor) &&
        r.room
      ) {
        set.add(r.room);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [readings, effectiveBuilding, effectiveFloor]);

  function handleSubmit(e) {
    e.preventDefault();
    setSuccessMsg('');

    const result = validateReadingFields({
      building: effectiveBuilding,
      floor: effectiveFloor,
      room,
      month,
      kwh,
      water,
    });

    if (!result.valid) {
      setErrors(result.errors);
      return;
    }

    setErrors([]);
    const outcome = onAddReading({
      id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ...result.value,
    });

    if (resolvedSelection === NEW_BUILDING_VALUE) {
      setSelectedBuilding(result.value.building);
      setNewBuilding('');
    }
    if (selectedFloor === NEW_FLOOR_VALUE) {
      setSelectedFloor(result.value.floor);
      setCustomFloor('');
    }
    setRoom('');
    setKwh('');
    setWater('');

    const verb = outcome?.updatedCount > 0 ? 'Updated existing' : 'Added';
    setSuccessMsg(
      `${verb} reading for ${result.value.room} (${result.value.building}, ${result.value.floor} — ${result.value.month}).`
    );
  }

  return (
    <div className="glass-panel panel-pad">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">
            <PlusCircle size={16} color="#0044cc" />
            Add Single Reading
          </h2>
          <p className="panel-subtitle">
            Log or update electricity and water per lab and floor
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
        noValidate
      >
        <div className="form-grid-2">
          <div className="field">
            <label className="field__label" htmlFor="reading-building">
              Building
            </label>
            <select
              id="reading-building"
              className="select"
              value={resolvedSelection}
              onChange={(e) => setSelectedBuilding(e.target.value)}
            >
              {buildings.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
              <option value={NEW_BUILDING_VALUE}>+ New building...</option>
            </select>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="reading-floor">
              Floor
            </label>
            <select
              id="reading-floor"
              className="select"
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value)}
            >
              {floorOptions.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
              <option value={NEW_FLOOR_VALUE}>+ Custom floor...</option>
            </select>
          </div>
        </div>

        {(resolvedSelection === NEW_BUILDING_VALUE ||
          selectedFloor === NEW_FLOOR_VALUE) && (
          <div className="form-grid-2">
            {resolvedSelection === NEW_BUILDING_VALUE && (
              <div className="field">
                <label className="field__label" htmlFor="reading-new-building">
                  New Building Name
                </label>
                <input
                  id="reading-new-building"
                  type="text"
                  className="input"
                  placeholder="Enter building name here"
                  value={newBuilding}
                  onChange={(e) => setNewBuilding(e.target.value)}
                />
              </div>
            )}

            {selectedFloor === NEW_FLOOR_VALUE && (
              <div className="field">
                <label className="field__label" htmlFor="reading-custom-floor">
                  Custom Floor Name
                </label>
                <input
                  id="reading-custom-floor"
                  type="text"
                  className="input"
                  placeholder="Enter floor name here"
                  value={customFloor}
                  onChange={(e) => setCustomFloor(e.target.value)}
                />
              </div>
            )}
          </div>
        )}

        <div className="form-grid-2">
          <div className="field">
            <label className="field__label" htmlFor="reading-room">
              Room / Lab
            </label>
            <input
              id="reading-room"
              type="text"
              list="existing-rooms"
              className="input"
              placeholder="Enter room or lab name here"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
            />
            <datalist id="existing-rooms">
              {suggestedRooms.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="reading-month">
              Month (YYYY-MM)
            </label>
            <input
              id="reading-month"
              type="month"
              className="input input--mono"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-grid-2">
          <div className="field">
            <label className="field__label" htmlFor="reading-kwh">
              Electricity (kWh)
            </label>
            <input
              id="reading-kwh"
              type="number"
              min="0"
              step="1"
              className="input input--mono"
              placeholder="Enter electricity in kWh here"
              value={kwh}
              onChange={(e) => setKwh(e.target.value)}
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="reading-water">
              Water (litres)
            </label>
            <input
              id="reading-water"
              type="number"
              min="0"
              step="1"
              className="input input--mono"
              placeholder="Enter water in litres here"
              value={water}
              onChange={(e) => setWater(e.target.value)}
            />
          </div>
        </div>

        {errors.length > 0 && (
          <div className="error-banner" role="alert">
            <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>{errors.join(' ')}</div>
          </div>
        )}

        {successMsg && (
          <div className="success-banner" role="status">
            <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn--primary">
            <PlusCircle size={15} />
            Save Reading
          </button>
        </div>
      </form>
    </div>
  );
}
