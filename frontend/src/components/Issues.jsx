// frontend/src/components/Issues.jsx
import React, { useState, useMemo } from 'react';
import { Search, Clock, CheckCircle2, X } from 'lucide-react';

export function Issues({ issues = [], onUpdateStatus, initialStatus = 'ALL', initialMachine = 'ALL' }) {
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [machineFilter, setMachineFilter] = useState(initialMachine);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('asc'); // asc / desc
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // Resolve dialog state
  const [modalIssue, setModalIssue] = useState(null);
  const [note, setNote] = useState('');

  const statusCounts = useMemo(() => {
    return {
      ALL: issues.length,
      OPEN: issues.filter(i => i.status === 'OPEN').length,
      ACKNOWLEDGED: issues.filter(i => i.status === 'ACKNOWLEDGED').length,
      RESOLVED: issues.filter(i => i.status === 'RESOLVED').length,
    };
  }, [issues]);

  const filtered = useMemo(() => {
    return issues.filter(item => {
      const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;
      const matchMachine = machineFilter === 'ALL' || item.machine_id === machineFilter;
      const matchSearch = item.machine_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.issue_id.toString().includes(searchQuery) ||
                          (item.evidence && item.evidence.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchStatus && matchMachine && matchSearch;
    }).sort((a, b) => {
      const comp = a.issue_id - b.issue_id;
      return sortOrder === 'asc' ? comp : -comp;
    });
  }, [issues, statusFilter, machineFilter, searchQuery, sortOrder]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleConfirmResolve = () => {
    if (!modalIssue) return;
    onUpdateStatus(modalIssue.issue_id, 'RESOLVED', note);
    setModalIssue(null);
    setNote('');
  };

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '10px', overflow: 'hidden' }}>
      
      {/* Filter and Search Bar */}
      <div style={{ padding: '16px 20px', backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} color="var(--text-faint)" style={{ position: 'absolute', left: 10, top: 9 }} />
            <input 
              type="text"
              placeholder="Search by ID, machine, evidence..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
              style={{ backgroundColor: 'var(--bg-app)', color: '#fff', border: '1px solid var(--border-subtle)', padding: '6px 12px 6px 32px', borderRadius: '6px', fontSize: '12px', width: '230px' }}
            />
          </div>

          <select
            value={machineFilter}
            onChange={e => { setMachineFilter(e.target.value); setPage(1); }}
            style={{ backgroundColor: 'var(--bg-app)', color: '#fff', border: '1px solid var(--border-subtle)', padding: '6px 10px', borderRadius: '6px', fontSize: '12px' }}
          >
            <option value="ALL">All Machines</option>
            {['M-01', 'M-02', 'M-03', 'M-04', 'M-05', 'M-06'].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <button 
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            style={{ background: 'var(--bg-app)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
          >
            Sort ID: {sortOrder.toUpperCase()}
          </button>
        </div>

        {/* Status Chips */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {['ALL', 'OPEN', 'ACKNOWLEDGED', 'RESOLVED'].map(st => (
            <button
              key={st}
              onClick={() => { setStatusFilter(st); setPage(1); }}
              style={{
                backgroundColor: statusFilter === st ? 'var(--accent-blue)' : 'var(--bg-app)',
                border: '1px solid var(--border-subtle)',
                color: statusFilter === st ? '#fff' : 'var(--text-muted)',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {st} ({statusCounts[st] ?? 0})
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {paginated.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-faint)' }}>
          No operational issues matched the selected criteria.
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-app)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-faint)', fontSize: '11px', textTransform: 'uppercase' }}>
              <th style={{ padding: '12px 16px' }}>Issue ID</th>
              <th style={{ padding: '12px 16px' }}>Asset</th>
              <th style={{ padding: '12px 16px' }}>Date / Shift</th>
              <th style={{ padding: '12px 16px' }}>Evidence</th>
              <th style={{ padding: '12px 16px' }}>Status</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map(iss => (
              <tr key={iss.issue_id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-faint)' }}>#{iss.issue_id}</td>
                <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>{iss.machine_id}</td>
                <td style={{ padding: '12px 16px', fontSize: '12px' }}>{iss.anomaly_date} (Shift {iss.anomaly_shift})</td>
                <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>{iss.evidence || "-"}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    backgroundColor: iss.status === 'OPEN' ? 'var(--status-open-bg)' : iss.status === 'ACKNOWLEDGED' ? 'var(--status-ack-bg)' : 'var(--status-res-bg)',
                    color: iss.status === 'OPEN' ? 'var(--status-open)' : iss.status === 'ACKNOWLEDGED' ? 'var(--status-ack)' : 'var(--status-res)'
                  }}>
                    {iss.status}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                    {iss.status === 'OPEN' && (
                      <button
                        onClick={() => onUpdateStatus(iss.issue_id, 'ACKNOWLEDGED')}
                        style={{ background: 'transparent', border: '1px solid var(--status-ack)', color: 'var(--status-ack)', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Clock size={11} /> Ack
                      </button>
                    )}
                    {iss.status !== 'RESOLVED' && (
                      <button
                        onClick={() => setModalIssue(iss)}
                        style={{ background: 'transparent', border: '1px solid var(--status-res)', color: 'var(--status-res)', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <CheckCircle2 size={11} /> Resolve...
                      </button>
                    )}
                    {iss.status === 'RESOLVED' && (
                      <span style={{ color: 'var(--text-faint)', fontSize: '11px' }}>Archived</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Pagination Controls */}
      <div style={{ padding: '12px 20px', backgroundColor: 'var(--bg-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
          Page {page} of {totalPages} ({filtered.length} total issues)
        </span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button 
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(p - 1, 1))}
            style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-subtle)', color: '#fff', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
          >
            Previous
          </button>
          <button 
            disabled={page >= totalPages}
            onClick={() => setPage(p => Math.min(p + 1, totalPages))}
            style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-subtle)', color: '#fff', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}
          >
            Next
          </button>
        </div>
      </div>

      {/* Resolve Dialog Modal */}
      {modalIssue && (
        <div 
          onClick={() => setModalIssue(null)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-accent)', borderRadius: '10px', width: '420px', padding: '20px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '15px' }}>Resolve Issue #{modalIssue.issue_id} ({modalIssue.machine_id})</h3>
              <X size={16} style={{ cursor: 'pointer' }} onClick={() => setModalIssue(null)} />
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
              Enter technician corrective notes prior to ticket archiving:
            </p>

            <textarea
              rows={3}
              placeholder="e.g., Calibrated spindle bearings; mechanical inspection passed."
              value={note}
              onChange={e => setNote(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '8px', color: '#fff', fontSize: '12px', marginBottom: '16px' }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button 
                onClick={() => setModalIssue(null)}
                style={{ background: 'var(--bg-app)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmResolve}
                style={{ background: 'var(--status-res)', border: 'none', color: '#fff', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}