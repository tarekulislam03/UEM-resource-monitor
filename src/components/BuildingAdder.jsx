import { useState } from 'react';
import { Building2, Plus, X, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function BuildingAdder({
  buildings,
  readings,
  onAddBuilding,
  onRemoveBuilding,
}) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    setSuccessMsg('');
    const trimmed = name.trim().replace(/\s+/g, ' ');

    if (!trimmed) {
      setError('Enter a building name.');
      return;
    }

    const exists = buildings.some(
      (b) => b.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      setError(`"${trimmed}" already exists.`);
      return;
    }

    setError('');
    onAddBuilding(trimmed);
    setName('');
    setSuccessMsg(`Added building "${trimmed}".`);
  }

  return (
    <section className="glass-panel panel-pad" aria-label="Manage buildings">
      <div className="panel-header" style={{ marginBottom: 12 }}>
        <div>
          <h2 className="panel-title">
            <Building2 size={16} color="#0044cc" />
            Buildings
          </h2>
          <p className="panel-subtitle">
            Add building names so they appear in reading forms and filters
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <input
          type="text"
          className="input"
          style={{ flex: '1 1 220px', maxWidth: 340 }}
          placeholder="Enter building name here"
          aria-label="New building name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit" className="btn btn--primary">
          <Plus size={15} />
          Add Building
        </button>
      </form>

      {error && (
        <div className="error-banner" style={{ marginTop: 10 }} role="alert">
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="success-banner" style={{ marginTop: 10 }} role="status">
          <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
          <span>{successMsg}</span>
        </div>
      )}

      {buildings.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            marginTop: 12,
          }}
        >
          {buildings.map((b) => {
            const count = readings.filter((r) => r.building === b).length;
            return (
              <span
                key={b}
                className="badge badge--normal"
                title={
                  count > 0
                    ? `${count} reading(s) recorded — delete readings first to remove`
                    : 'No readings yet'
                }
                style={{
                  padding: '4px 8px',
                  fontSize: 11,
                  color: 'var(--text-primary)',
                }}
              >
                <span>{b}</span>
                <span className="mono" style={{ color: 'var(--text-muted)' }}>
                  ({count})
                </span>
                {count === 0 && (
                  <button
                    type="button"
                    aria-label={`Remove ${b}`}
                    onClick={() => onRemoveBuilding(b)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      marginLeft: 4,
                      color: 'var(--alert)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                    }}
                  >
                    <X size={12} />
                  </button>
                )}
              </span>
            );
          })}
        </div>
      )}
    </section>
  );
}
