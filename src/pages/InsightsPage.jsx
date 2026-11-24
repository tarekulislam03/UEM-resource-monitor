import { AlertTriangle, Lightbulb, CheckCircle2 } from 'lucide-react';
import { formatMonth } from '../utils/analytics';

export default function InsightsPage({ readings, insights }) {
  const spikes = readings
    .filter((r) => r.isSpike)
    .sort((a, b) => b.month.localeCompare(a.month));

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-header__title">Insights</h1>
          <p className="page-header__subtitle">
            {spikes.length > 0
              ? `${spikes.length} usage spike${spikes.length === 1 ? '' : 's'} flagged and ${insights.length} savings recommendations`
              : 'Detected usage spikes and practical savings recommendations'}
          </p>
        </div>
      </header>

      <section
        className="glass-panel panel-pad"
        style={{
          borderColor: spikes.length > 0 ? 'var(--alert)' : '#111111',
          borderTop: spikes.length > 0 ? '3px solid var(--alert)' : '3px solid #111111',
          background: '#ffffff',
        }}
        aria-label="Detected spikes"
      >
        <div className="panel-header">
          <div>
            <h2 className="panel-title" style={{ fontSize: 16 }}>
              <AlertTriangle size={17} color="#cc0000" />
              Detected Spikes ({spikes.length})
            </h2>
            <p className="panel-subtitle">
              Readings exceeding lab average + 2σ or +25% month-over-month
            </p>
          </div>
        </div>

        {spikes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">
              <CheckCircle2 size={18} />
            </div>
            <p>No spikes detected in the current readings.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {spikes.map((s) => (
              <div
                key={s.id}
                className="insight-item insight-item--high spike-row"
              >
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div className="insight-icon insight-icon--high">
                    <AlertTriangle size={17} />
                  </div>
                  <div>
                    <div className="insight-title" style={{ fontSize: 15 }}>
                      {s.room} ({s.building}, {s.floor}) —{' '}
                      <span className="mono">{formatMonth(s.month)}</span>
                    </div>
                    <p className="insight-body" style={{ fontSize: 13 }}>
                      {s.spikeReasons.join(' • ')}
                    </p>
                  </div>
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--alert-text)',
                  }}
                >
                  {s.kwh.toLocaleString('en-IN')} kWh /{' '}
                  {s.water.toLocaleString('en-IN')} L
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section
        className="glass-panel panel-pad"
        style={{ borderTop: '3px solid var(--accent)' }}
        aria-label="Savings tips"
      >
        <div className="panel-header">
          <div>
            <h2 className="panel-title" style={{ fontSize: 16 }}>
              <Lightbulb size={17} color="#0044cc" />
              Savings Tips
            </h2>
            <p className="panel-subtitle">
              Top recommendations sorted by severity
            </p>
          </div>
        </div>

        {insights.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">
              <Lightbulb size={18} />
            </div>
            <p>Add readings to generate savings tips.</p>
          </div>
        ) : (
          <div className="insights-list">
            {insights.slice(0, 4).map((tip) => {
              const isHigh = tip.severity === 'high';
              return (
                <div
                  key={tip.id}
                  className={`insight-item ${
                    isHigh ? 'insight-item--high' : ''
                  }`}
                  style={{
                    padding: '18px',
                    borderLeft: `3px solid ${
                      isHigh ? 'var(--alert)' : 'var(--accent)'
                    }`,
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                    }}
                  >
                    <div
                      className={`insight-icon ${
                        isHigh ? 'insight-icon--high' : ''
                      }`}
                    >
                      <Lightbulb size={16} />
                    </div>
                    <span
                      className={`badge ${
                        isHigh ? 'badge--spike' : 'badge--normal'
                      }`}
                      style={
                        !isHigh
                          ? {
                              background: 'var(--accent-soft)',
                              borderColor: 'var(--accent-border)',
                              color: 'var(--accent-bright)',
                            }
                          : undefined
                      }
                    >
                      {isHigh ? 'High Priority' : 'Recommended'}
                    </span>
                  </div>
                  <p
                    className="insight-body"
                    style={{
                      color: 'var(--text-primary)',
                      fontSize: 14,
                      lineHeight: 1.55,
                    }}
                  >
                    {tip.message}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
