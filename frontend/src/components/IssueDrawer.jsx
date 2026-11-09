// frontend/src/components/IssueDrawer.jsx
import { useEffect } from 'react';
import { X } from 'lucide-react';
import { StatusDot } from './StatusDot';
import { humanizeText, formatDate } from '../utils/formatters';

export function IssueDrawer({ issue, onClose, onAcknowledge, onResolve }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!issue) return null;

  const statusLabel = issue.status === 'OPEN' ? 'Open'
    : issue.status === 'ACKNOWLEDGED' ? 'Acknowledged'
    : issue.status === 'RESOLVED' ? 'Resolved'
    : issue.status;

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div>
            <span className="drawer-section-label">Issue #{issue.issue_id}</span>
            <h2 className="drawer-title">Machine {issue.machine_id}</h2>
          </div>
          <button
            type="button"
            className="drawer-close-btn"
            onClick={onClose}
            aria-label="Close details"
          >
            <X size={18} />
          </button>
        </div>

        <div className="drawer-section">
          <div className="drawer-section-label">Status</div>
          <div className="drawer-section-value">
            <StatusDot status={issue.status} label={statusLabel} />
          </div>
        </div>

        <div className="drawer-section">
          <div className="drawer-section-label">Occurrence</div>
          <div className="drawer-section-value">
            {formatDate(issue.anomaly_date)} · Shift {issue.anomaly_shift || '-'}
          </div>
        </div>

        <div className="drawer-section">
          <div className="drawer-section-label">Anomaly classification</div>
          <div className="drawer-section-value">
            {humanizeText(issue.anomaly_type)}
          </div>
        </div>

        <div className="drawer-section">
          <div className="drawer-section-label">Evidence</div>
          <div className="drawer-section-value">
            {issue.evidence || '-'}
          </div>
          {/* TODO: Display telemetry metric, reading value, baseline, and MAD score when detector supports per-anomaly metrics */}
        </div>

        <div className="drawer-section">
          <div className="drawer-section-label">Supervisor notes</div>
          <div className="drawer-section-value">
            {issue.supervisor_notes && issue.supervisor_notes !== '-' ? issue.supervisor_notes : 'No notes recorded'}
          </div>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '20px', display: 'flex', gap: '8px' }}>
          {issue.status === 'OPEN' && (
            <button
              type="button"
              className="btn-action-primary"
              onClick={() => { onAcknowledge(issue.issue_id); onClose(); }}
            >
              Acknowledge
            </button>
          )}
          {issue.status !== 'RESOLVED' && (
            <button
              type="button"
              className="btn-action-primary"
              onClick={() => { onResolve(issue); onClose(); }}
            >
              Resolve
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
