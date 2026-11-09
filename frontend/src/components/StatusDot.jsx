// frontend/src/components/StatusDot.jsx

export function StatusDot({ status, severity, label }) {
  let dotClass = 'dot-muted';

  if (severity) {
    if (severity === 'critical') dotClass = 'dot-critical';
    else if (severity === 'warning') dotClass = 'dot-warning';
    else dotClass = 'dot-muted';
  } else if (status) {
    if (status === 'OPEN') dotClass = 'dot-critical';
    else if (status === 'ACKNOWLEDGED') dotClass = 'dot-warning';
    else if (status === 'RESOLVED') dotClass = 'dot-success';
  }

  return (
    <span className="status-indicator">
      <span className={`dot ${dotClass}`} />
      {label && <span>{label}</span>}
    </span>
  );
}
