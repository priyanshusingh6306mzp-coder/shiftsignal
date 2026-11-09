// frontend/src/components/ResolveModal.jsx
import { useEffect } from 'react';

export function ResolveModal({ issue, note, onNoteChange, onConfirm, onCancel }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  if (!issue) return null;

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">Resolve issue #{issue.issue_id} ({issue.machine_id})</h3>
        <p className="modal-help">
          Optional technician corrective note prior to resolving this incident:
        </p>
        <textarea
          className="textarea-clean"
          rows={3}
          placeholder="e.g. Spindle bearings inspected and recalibrated."
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          autoFocus
        />
        <div className="modal-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-resolve-confirm"
            onClick={onConfirm}
          >
            Confirm resolution
          </button>
        </div>
      </div>
    </div>
  );
}
