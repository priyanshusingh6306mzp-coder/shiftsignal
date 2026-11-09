// frontend/src/components/IssueRow.jsx
import { MoreHorizontal } from 'lucide-react';
import { StatusDot } from './StatusDot';
import { formatDate } from '../utils/formatters';

export function IssueRow({
  issue,
  onSelect,
  onUpdateStatus,
  onOpenResolve,
  isMenuOpen,
  onToggleMenu
}) {
  const statusLabel = issue.status === 'OPEN' ? 'Open'
    : issue.status === 'ACKNOWLEDGED' ? 'Acknowledged'
    : issue.status === 'RESOLVED' ? 'Resolved'
    : issue.status;

  return (
    <tr className="clickable-row" onClick={() => onSelect(issue)}>
      <td style={{ color: 'var(--text-muted)' }}>#{issue.issue_id}</td>
      <td style={{ fontWeight: 600 }}>{issue.machine_id}</td>
      <td>{formatDate(issue.anomaly_date)} · {issue.anomaly_shift || '-'}</td>
      <td>
        <StatusDot status={issue.status} label={statusLabel} />
      </td>
      <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
        <div className="action-cell-wrapper">
          {issue.status === 'OPEN' && (
            <button
              type="button"
              className="btn-action-primary"
              onClick={() => onUpdateStatus(issue.issue_id, 'ACKNOWLEDGED')}
            >
              Acknowledge
            </button>
          )}
          {issue.status === 'ACKNOWLEDGED' && (
            <button
              type="button"
              className="btn-action-primary"
              onClick={(e) => onOpenResolve(issue, e)}
            >
              Resolve
            </button>
          )}
          {issue.status === 'RESOLVED' && (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Resolved</span>
          )}

          <button
            type="button"
            className="btn-menu-trigger"
            onClick={(e) => {
              e.stopPropagation();
              onToggleMenu(issue.issue_id);
            }}
            aria-label="More actions"
          >
            <MoreHorizontal size={16} />
          </button>

          {isMenuOpen && (
            <div className="action-menu-dropdown" onClick={(e) => e.stopPropagation()}>
              {issue.status === 'OPEN' && (
                <button
                  type="button"
                  className="menu-item-btn"
                  onClick={() => onOpenResolve(issue)}
                >
                  Resolve...
                </button>
              )}
              {issue.status === 'ACKNOWLEDGED' && (
                <button
                  type="button"
                  className="menu-item-btn"
                  onClick={() => onUpdateStatus(issue.issue_id, 'OPEN')}
                >
                  Mark as open
                </button>
              )}
              {issue.status === 'RESOLVED' && (
                <button
                  type="button"
                  className="menu-item-btn"
                  onClick={() => onUpdateStatus(issue.issue_id, 'OPEN')}
                >
                  Reopen issue
                </button>
              )}
              <button
                type="button"
                className="menu-item-btn"
                onClick={() => onSelect(issue)}
              >
                View details
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}
