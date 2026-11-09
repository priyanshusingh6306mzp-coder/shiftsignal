// frontend/src/components/Handover.jsx
import { useState } from 'react';
import { Copy, Check, Printer, ChevronDown, ChevronRight } from 'lucide-react';
import { StatusDot } from './StatusDot';
import { formatDate, humanizeText } from '../utils/formatters';

export function Handover({
  data,
  targetDate,
  setTargetDate,
  targetShift,
  setTargetShift,
  loading,
  onNavigateToIssues
}) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState({});

  const toggleExpand = (mId, defaultOpen) => {
    setExpanded(prev => ({
      ...prev,
      [mId]: prev[mId] !== undefined ? !prev[mId] : !defaultOpen
    }));
  };

  const handleCopy = () => {
    if (!data?.text) return;
    navigator.clipboard.writeText(data.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const eventsThisShift = data?.summary?.events_this_shift ?? 0;
  const pendingTotal = data?.summary?.pending_total ?? 0;
  const machinesAffected = data?.summary?.machines_affected ?? 0;
  const criticalGroup = data?.carry_over?.find(g => g.severity === 'critical');

  const formatStreak = (streak) => {
    return `${streak} consecutive shift${streak === 1 ? '' : 's'}`;
  };

  return (
    <div className="handover-column">
      {/* Top Controls Toolbar */}
      <div className="handover-topbar no-print">
        <div className="handover-controls-left">
          <input
            type="date"
            className="select-clean"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
          />
          <select
            className="select-clean"
            value={targetShift}
            onChange={(e) => setTargetShift(e.target.value)}
          >
            <option value="A">Shift A (Morning)</option>
            <option value="B">Shift B (Evening)</option>
            <option value="C">Shift C (Night)</option>
          </select>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Next shift: {data?.next_shift ?? '-'}
          </span>
        </div>

        <div className="handover-actions-right">
          <button
            type="button"
            className="btn-action-primary"
            onClick={handleCopy}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            {copied ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy as text'}</span>
          </button>
          <button
            type="button"
            className="btn-action-primary"
            onClick={() => window.print()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Printer size={14} />
            <span>Print</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '24px 0' }}>
          <div style={{ height: '24px', backgroundColor: 'var(--bg-surface)', borderRadius: '6px', marginBottom: '16px', width: '60%' }} />
          <div style={{ height: '80px', backgroundColor: 'var(--bg-surface)', borderRadius: '6px', marginBottom: '16px', width: '100%' }} />
          <div style={{ height: '120px', backgroundColor: 'var(--bg-surface)', borderRadius: '6px', width: '80%' }} />
        </div>
      ) : (
        <div className="handover-doc">
          {/* Deterministic Lead Sentence */}
          <div className="handover-summary-lead">
            Shift {targetShift} on {formatDate(targetDate)}: {eventsThisShift} new anomal{eventsThisShift === 1 ? 'y' : 'ies'}, {pendingTotal} unresolved across {machinesAffected} machine{machinesAffected === 1 ? '' : 's'} (unresolved as of Shift {targetShift}, {formatDate(targetDate)}). {criticalGroup ? `${criticalGroup.machine_id} needs attention first.` : 'All machines operational.'}
          </div>

          {/* Section: During this shift */}
          <div className="handover-section-heading">During this shift</div>
          {(!data?.this_shift || data.this_shift.length === 0) ? (
            <div className="handover-empty-notice">
              No anomalies were detected on the shop floor during Shift {targetShift}.
            </div>
          ) : (
            <div>
              {data.this_shift.map((ev, idx) => (
                <div key={idx} className="handover-item-row">
                  <div>
                    <span className="handover-item-desc" style={{ fontWeight: 600 }}>
                      Machine {ev.machine_id}:
                    </span>{' '}
                    <span>{humanizeText(ev.anomaly_type)}</span>
                  </div>
                  <div className="handover-item-meta">
                    Issue #{ev.issue_id} ({humanizeText(ev.status)})
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Section: Carried over */}
          <div className="handover-section-heading">Carried over</div>
          {(!data?.carry_over || data.carry_over.length === 0) ? (
            <div className="handover-empty-notice">
              Zero unresolved operational issues carried over.
            </div>
          ) : (
            <div>
              {data.carry_over.map(group => {
                const isAutoExpanded = group.count <= 3;
                const isExp = expanded[group.machine_id] !== undefined
                  ? expanded[group.machine_id]
                  : isAutoExpanded;

                const summaryLine = group.streak >= 6
                  ? `${group.count} unresolved · every shift since ${formatDate(group.first)} (${group.streak} in a row)`
                  : `${group.count} unresolved · ${formatDate(group.first)}${group.first !== group.last ? ` to ${formatDate(group.last)}` : ''} (${formatStreak(group.streak)})`;

                return (
                  <div key={group.machine_id} className="handover-carryover-row">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="carryover-left">
                        <StatusDot severity={group.severity} />
                        <span className="carryover-machine-name">Machine {group.machine_id}</span>
                        <span className="carryover-meta">({summaryLine})</span>
                      </div>

                      <div>
                        {group.count > 3 ? (
                          <button
                            type="button"
                            className="link-quiet no-print"
                            onClick={() => onNavigateToIssues && onNavigateToIssues({ machine: group.machine_id, status: 'ALL' })}
                          >
                            View issues →
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn-menu-trigger no-print"
                            onClick={() => toggleExpand(group.machine_id, isAutoExpanded)}
                            aria-label="Toggle issues"
                          >
                            {isExp ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Collapsible list for groups with <= 3 issues (or expanded) */}
                    {isExp && group.count <= 3 && (
                      <div className="carryover-sublist">
                        {group.issues.map(iss => (
                          <div key={iss.issue_id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>
                              Issue #{iss.issue_id} ({formatDate(iss.date)} · Shift {iss.shift}) ·{' '}
                              <span style={{ color: iss.status === 'OPEN' ? 'var(--critical)' : 'var(--warning)' }}>
                                {humanizeText(iss.status)}
                              </span>
                            </span>
                            {iss.notes && iss.notes !== '-' && (
                              <span style={{ color: 'var(--text-muted)' }}>{iss.notes}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Section: Next steps */}
          <div className="handover-section-heading">Next steps</div>
          <ul className="handover-steps-list">
            {data?.next_steps?.map((step, idx) => {
              const cleanStep = step.replace(/1 consecutive shifts/g, '1 consecutive shift');
              return <li key={idx}>{cleanStep}</li>;
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
