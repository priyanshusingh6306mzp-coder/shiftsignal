// frontend/src/components/Issues.jsx
import { useState, useMemo, useEffect } from 'react';
import { Search } from 'lucide-react';
import { IssueDrawer } from './IssueDrawer';
import { ResolveModal } from './ResolveModal';
import { IssuesTable } from './IssuesTable';

const SHIFT_MAP = { A: 0, B: 1, C: 2 };

function getShiftOrdinal(dateStr, shiftChar) {
  if (!dateStr) return 0;
  const dt = new Date(dateStr);
  const ord = Math.floor(dt.getTime() / (1000 * 60 * 60 * 24));
  return ord * 3 + (SHIFT_MAP[shiftChar] ?? 0);
}

export function Issues({ issues = [], onUpdateStatus, initialStatus = 'ALL', initialMachine = 'ALL' }) {
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [machineFilter, setMachineFilter] = useState(initialMachine);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupByMachine, setGroupByMachine] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [sortDirection, setSortDirection] = useState('desc');
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const [selectedIssue, setSelectedIssue] = useState(null);
  const [modalIssue, setModalIssue] = useState(null);
  const [resolveNote, setResolveNote] = useState('');
  const [menuOpenId, setMenuOpenId] = useState(null);

  useEffect(() => {
    const handleWindowClick = () => setMenuOpenId(null);
    window.addEventListener('click', handleWindowClick);
    return () => window.removeEventListener('click', handleWindowClick);
  }, []);

  const counts = useMemo(() => {
    const open = issues.filter(i => i.status === 'OPEN').length;
    const ack = issues.filter(i => i.status === 'ACKNOWLEDGED').length;
    const res = issues.filter(i => i.status === 'RESOLVED').length;
    return {
      ALL: issues.length,
      UNRESOLVED: open + ack,
      OPEN: open,
      ACKNOWLEDGED: ack,
      RESOLVED: res
    };
  }, [issues]);

  const filteredIssues = useMemo(() => {
    return issues.filter(item => {
      let matchStatus = true;
      if (statusFilter === 'UNRESOLVED') {
        matchStatus = item.status === 'OPEN' || item.status === 'ACKNOWLEDGED';
      } else if (statusFilter !== 'ALL') {
        matchStatus = item.status === statusFilter;
      }

      const matchMachine = machineFilter === 'ALL' || item.machine_id === machineFilter;
      const query = searchQuery.trim().toLowerCase();
      const matchSearch = !query ||
        item.machine_id.toLowerCase().includes(query) ||
        String(item.issue_id).includes(query) ||
        (item.evidence && item.evidence.toLowerCase().includes(query)) ||
        (item.anomaly_type && item.anomaly_type.toLowerCase().includes(query));

      return matchStatus && matchMachine && matchSearch;
    }).sort((a, b) => {
      const ordA = getShiftOrdinal(a.anomaly_date, a.anomaly_shift);
      const ordB = getShiftOrdinal(b.anomaly_date, b.anomaly_shift);
      if (ordA !== ordB) {
        return sortDirection === 'desc' ? ordB - ordA : ordA - ordB;
      }
      return sortDirection === 'desc' ? b.issue_id - a.issue_id : a.issue_id - b.issue_id;
    });
  }, [issues, statusFilter, machineFilter, searchQuery, sortDirection]);

  const totalPages = Math.ceil(filteredIssues.length / pageSize) || 1;
  const paginatedIssues = useMemo(() => {
    return filteredIssues.slice((page - 1) * pageSize, page * pageSize);
  }, [filteredIssues, page, pageSize]);

  const groupedData = useMemo(() => {
    if (!groupByMachine) return [];
    const map = {};
    filteredIssues.forEach(iss => {
      if (!map[iss.machine_id]) map[iss.machine_id] = [];
      map[iss.machine_id].push(iss);
    });
    return Object.entries(map).map(([mId, items]) => ({
      machineId: mId,
      items,
      count: items.length
    }));
  }, [filteredIssues, groupByMachine]);

  const toggleGroup = (mId) => {
    setExpandedGroups(prev => ({ ...prev, [mId]: !prev[mId] }));
  };

  const handleOpenResolve = (iss, e) => {
    if (e) e.stopPropagation();
    setModalIssue(iss);
    setResolveNote('');
    setMenuOpenId(null);
  };

  const handleConfirmResolve = () => {
    if (!modalIssue) return;
    onUpdateStatus(modalIssue.issue_id, 'RESOLVED', resolveNote);
    setModalIssue(null);
    setResolveNote('');
  };

  return (
    <div>
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="input-search-wrapper">
            <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 10 }} />
            <input
              type="text"
              className="input-search"
              placeholder="Search by ID, machine, type..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            />
          </div>

          <select
            className="select-clean"
            value={machineFilter}
            onChange={(e) => { setMachineFilter(e.target.value); setPage(1); }}
          >
            <option value="ALL">All machines</option>
            {['M-01', 'M-02', 'M-03', 'M-04', 'M-05', 'M-06'].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <label className="toggle-group-label">
            <input
              type="checkbox"
              checked={groupByMachine}
              onChange={(e) => setGroupByMachine(e.target.checked)}
              style={{ accentColor: 'var(--accent)' }}
            />
            <span>Group by machine</span>
          </label>
        </div>

        <div className="segmented-control">
          {[
            { id: 'ALL', label: `All ${counts.ALL}` },
            { id: 'UNRESOLVED', label: `Unresolved ${counts.UNRESOLVED}` },
            { id: 'OPEN', label: `Open ${counts.OPEN}` },
            { id: 'ACKNOWLEDGED', label: `Acknowledged ${counts.ACKNOWLEDGED}` },
            { id: 'RESOLVED', label: `Resolved ${counts.RESOLVED}` }
          ].map(seg => (
            <button
              key={seg.id}
              type="button"
              className={`segment-btn ${statusFilter === seg.id ? 'active' : ''}`}
              onClick={() => { setStatusFilter(seg.id); setPage(1); }}
            >
              {seg.label}
            </button>
          ))}
        </div>
      </div>

      <IssuesTable
        groupByMachine={groupByMachine}
        groupedData={groupedData}
        expandedGroups={expandedGroups}
        onToggleGroup={toggleGroup}
        paginatedIssues={paginatedIssues}
        totalCount={filteredIssues.length}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        onPageChange={setPage}
        sortDirection={sortDirection}
        onToggleSort={() => setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc')}
        onSelectIssue={setSelectedIssue}
        onUpdateStatus={onUpdateStatus}
        onOpenResolve={handleOpenResolve}
        menuOpenId={menuOpenId}
        onToggleMenu={(id) => setMenuOpenId(menuOpenId === id ? null : id)}
      />

      <IssueDrawer
        issue={selectedIssue}
        onClose={() => setSelectedIssue(null)}
        onAcknowledge={(id) => onUpdateStatus(id, 'ACKNOWLEDGED')}
        onResolve={(iss) => handleOpenResolve(iss)}
      />

      <ResolveModal
        issue={modalIssue}
        note={resolveNote}
        onNoteChange={setResolveNote}
        onConfirm={handleConfirmResolve}
        onCancel={() => setModalIssue(null)}
      />
    </div>
  );
}
