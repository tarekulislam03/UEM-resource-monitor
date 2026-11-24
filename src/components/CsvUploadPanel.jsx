import { useRef, useState } from 'react';
import {
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { downloadSampleCsv, parseReadingsCsv } from '../utils/csv';

export default function CsvUploadPanel({ onImportReadings }) {
  const fileInputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rowErrors, setRowErrors] = useState([]);
  const [importSummary, setImportSummary] = useState(null);

  async function processFile(file) {
    if (!file) return;
    setLoading(true);
    setRowErrors([]);
    setImportSummary(null);

    const { validRows, rowErrors: errors } = await parseReadingsCsv(file);

    if (validRows.length > 0) {
      const outcome = onImportReadings(validRows);
      setImportSummary({
        added: outcome?.addedCount ?? validRows.length,
        updated: outcome?.updatedCount ?? 0,
      });
    }
    setRowErrors(errors);
    setLoading(false);
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    processFile(file);
    e.target.value = '';
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    processFile(file);
  }

  return (
    <div className="glass-panel panel-pad">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">
            <FileSpreadsheet size={16} color="#0044cc" />
            Upload CSV
          </h2>
          <p className="panel-subtitle">
            Columns: <span className="mono">building,floor,room,month,kwh,water</span>
          </p>
        </div>

        <button
          type="button"
          className="btn btn--ghost"
          style={{ textDecoration: 'underline', padding: '6px 10px' }}
          onClick={downloadSampleCsv}
        >
          <Download size={14} />
          Download sample CSV
        </button>
      </div>

      <div
        className={`dropzone ${dragging ? 'dropzone--active' : ''}`}
        role="button"
        tabIndex={0}
        aria-label="Upload CSV file"
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            fileInputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <Upload size={18} color="#0044cc" />
        <div style={{ fontWeight: 600, fontSize: 13 }}>
          {loading ? 'Parsing CSV...' : 'Drop a CSV file here or click to browse'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          Duplicate lab + month entries update existing rows automatically
        </div>
      </div>

      {importSummary && (
        <div className="success-banner" style={{ marginTop: 12 }} role="status">
          <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
          <span>
            Imported {importSummary.added} new reading(s)
            {importSummary.updated > 0
              ? ` and updated ${importSummary.updated} existing reading(s)`
              : ''}
            .
          </span>
        </div>
      )}

      {rowErrors.length > 0 && (
        <div
          className="error-banner"
          style={{ marginTop: 12, flexDirection: 'column', gap: 4 }}
          role="alert"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
            <AlertCircle size={15} />
            <span>
              {rowErrors.length} validation issue{rowErrors.length > 1 ? 's' : ''}
            </span>
          </div>
          <ul style={{ margin: '2px 0 0 18px', padding: 0 }}>
            {rowErrors.slice(0, 6).map((err, i) => (
              <li key={i}>{err}</li>
            ))}
            {rowErrors.length > 6 && (
              <li>And {rowErrors.length - 6} more row error(s)...</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
