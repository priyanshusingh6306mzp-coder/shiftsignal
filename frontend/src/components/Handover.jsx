// frontend/src/components/Handover.jsx
import React, { useState } from 'react';
import { Copy, Check, Printer, ChevronDown, ChevronRight, AlertCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';

export function Handover({ data, targetDate, setTargetDate, targetShift, setTargetShift, loading }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState({});

  const toggleExpand = (mId) => {
    setExpanded(prev => ({ ...prev, [mId]: !prev[mId] }));
  };

  const handleCopy = () => {
    if (!data?.text) return;
    navigator.clipboard.writeText(data.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="handover-print-container" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '10px', overflow: 'hidden' }}>
      
      {/* Controls Bar */}
      <div className="no-print" style={{ padding: '16px 20px', backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input 
            type="date"
            value={targetDate}
            onChange={e => setTargetDate(e.target.value)}
            style={{ backgroundColor: 'var(--bg-app)', color: '#fff', border: '1px solid var(--border-subtle)', padding: '6px 10px', borderRadius: '6px', fontSize: '12px' }}
          />
          <select
            value={targetShift}
            onChange={e => setTargetShift(e.target.value)}
            style={{ backgroundColor: 'var(--bg-app)', color: '#fff', border: '1px solid var(--border-subtle)', padding: '6px 10px', borderRadius: '6px', fontSize: '12px' }}
          >
            <option value="A">Shift A (Morning)</option>
            <option value="B">Shift B (Evening)</option>
            <option value="C">Shift C (Night)</option>
          </select>
          <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
            Handover to Shift {data?.next_shift ?? '-'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={handleCopy}
            style={{ background: 'var(--bg-app)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {copied ? <Check size={14} color="var(--status-res)" /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy as text"}
          </button>
          <button 
            onClick={() => window.print()}
            style={{ background: 'var(--bg-app)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Printer size={14} /> Print
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '24px' }}>
          <div className="skeleton-box" style={{ width: '40%', height: '24px', marginBottom: '16px' }} />
          <div className="skeleton-box" style={{ width: '100%', height: '80px', marginBottom: '16px' }} />
          <div className="skeleton-box" style={{ width: '80%', height: '120px' }} />
        </div>
      ) : (
        <div style={{ padding: '24px' }}>
          
          {/* Summary Stats Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '24px' }}>
            <div style={{ background: 'var(--bg-app)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>EVENTS THIS SHIFT</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--accent-cyan)' }}>{data?.summary?.events_this_shift ?? 0}</div>
            </div>
            <div style={{ background: 'var(--bg-app)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>UNRESOLVED TOTAL</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--status-open)' }}>{data?.summary?.pending_total ?? 0}</div>
            </div>
            <div style={{ background: 'var(--bg-app)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>AFFECTED ASSETS</div>
              <div style={{ fontSize: '20px', fontWeight: '700' }}>{data?.summary?.machines_affected ?? 0}</div>
            </div>
          </div>

          {/* Section 1: During Shift X */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: '12px' }}>
              1. During Shift {targetShift}
            </h3>
            {(!data?.this_shift || data.this_shift.length === 0) ? (
              <div style={{ background: 'var(--bg-app)', padding: '12px 16px', borderRadius: '8px', color: 'var(--text-faint)', fontSize: '13px' }}>
                No anomalies were detected on the shop floor during Shift {targetShift}.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '8px' }}>
                {data.this_shift.map((ev, idx) => (
                  <div key={idx} style={{ background: 'var(--bg-app)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '13px' }}>
                        Machine {ev.machine_id}: {ev.anomaly_type}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Evidence: {ev.evidence}
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: 'var(--status-open-bg)', color: 'var(--status-open)', fontWeight: 'bold' }}>
                      Issue #{ev.issue_id} ({ev.status})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Collapsible Carry-Over Groups */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: '12px' }}>
              2. Carry-Over Issues Requiring Attention
            </h3>
            {(!data?.carry_over || data.carry_over.length === 0) ? (
              <div style={{ background: 'var(--bg-app)', padding: '12px 16px', borderRadius: '8px', color: 'var(--text-faint)', fontSize: '13px' }}>
                Zero outstanding issues to carry over.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '10px' }}>
                {data.carry_over.map(group => {
                  const isAutoExpanded = group.count <= 3;
                  const isExp = expanded[group.machine_id] !== undefined ? expanded[group.machine_id] : isAutoExpanded;
                  const isCrit = group.severity === 'critical';

                  return (
                    <div key={group.machine_id} style={{ background: 'var(--bg-app)', border: isCrit ? '1px solid var(--status-open-border)' : '1px solid var(--border-subtle)', borderRadius: '8px', overflow: 'hidden' }}>
                      <button
                        onClick={() => toggleExpand(group.machine_id)}
                        style={{ width: '100%', background: 'transparent', border: 'none', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', textAlign: 'left', color: 'var(--text-main)' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {isExp ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          <span style={{ fontWeight: '700', fontSize: '14px' }}>Machine {group.machine_id}</span>
                          <span style={{
                            fontSize: '10px',
                            textTransform: 'uppercase',
                            fontWeight: 'bold',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: isCrit ? 'var(--status-open-bg)' : 'var(--status-ack-bg)',
                            color: isCrit ? 'var(--status-open)' : 'var(--status-ack)'
                          }}>
                            {group.severity}
                          </span>
                        </div>

                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {group.count} unresolved ({group.open} open, {group.acknowledged} ack) · {group.first.slice(5)} to {group.last.slice(5)} · {group.streak} consecutive shifts
                        </div>
                      </button>

                      {isExp && (
                        <div style={{ padding: '0 16px 12px 16px', borderTop: '1px solid var(--border-subtle)' }}>
                          {group.issues.map(iss => (
                            <div key={iss.issue_id} style={{ fontSize: '12px', padding: '6px 0', borderBottom: '1px dashed rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between' }}>
                              <span>
                                Issue #{iss.issue_id} ({iss.date} Shift {iss.shift}) - <span style={{ color: iss.status === 'OPEN' ? 'var(--status-open)' : 'var(--status-ack)' }}>{iss.status}</span>
                              </span>
                              <span style={{ color: 'var(--text-faint)' }}>{iss.notes !== '-' ? iss.notes : ''}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 3: Next Steps */}
          <div>
            <h3 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: '12px' }}>
              3. Recommended Next Steps
            </h3>
            <div style={{ background: 'var(--bg-app)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '16px' }}>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--text-main)', lineHeight: '1.6' }}>
                {data?.next_steps?.map((step, idx) => (
                  <li key={idx} style={{ marginBottom: '4px' }}>{step}</li>
                ))}
              </ul>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}