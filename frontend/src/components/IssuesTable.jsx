// frontend/src/components/IssuesTable.jsx
import { Fragment } from 'react';
import { ChevronDown, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';
import { IssueRow } from './IssueRow';

export function IssuesTable({
  groupByMachine,
  groupedData,
  expandedGroups,
  onToggleGroup,
  paginatedIssues,
  totalCount,
  page,
  pageSize,
  totalPages,
  onPageChange,
  sortDirection,
  onToggleSort,
  onSelectIssue,
  onUpdateStatus,
  onOpenResolve,
  menuOpenId,
  onToggleMenu
}) {
  if (totalCount === 0) {
    return (
      <div className="table-wrapper">
        <div className="empty-state-box">
          <div className="empty-state-title">No issues found</div>
          <div className="empty-state-help">
            No operational anomalies matched your search or filter settings. Try clearing the filters above.
          </div>
        </div>
      </div>
    );
  }

  if (groupByMachine) {
    return (
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '80px' }}>Issue</th>
              <th style={{ width: '100px' }}>Machine</th>
              <th>When</th>
              <th style={{ width: '150px' }}>Status</th>
              <th style={{ width: '160px', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {groupedData.map(group => {
              const isExp = !!expandedGroups[group.machineId];
              return (
                <Fragment key={group.machineId}>
                  <tr
                    style={{ backgroundColor: 'var(--bg-raised)', cursor: 'pointer' }}
                    onClick={() => onToggleGroup(group.machineId)}
                  >
                    <td colSpan={5} style={{ padding: '12px 16px', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isExp ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        <span>Machine {group.machineId}</span>
                        <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '13px' }}>
                          ({group.count} issues)
                        </span>
                      </div>
                    </td>
                  </tr>
                  {isExp && group.items.map(iss => (
                    <IssueRow
                      key={iss.issue_id}
                      issue={iss}
                      onSelect={onSelectIssue}
                      onUpdateStatus={onUpdateStatus}
                      onOpenResolve={onOpenResolve}
                      isMenuOpen={menuOpenId === iss.issue_id}
                      onToggleMenu={onToggleMenu}
                    />
                  ))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th style={{ width: '80px' }}>Issue</th>
            <th style={{ width: '100px' }}>Machine</th>
            <th className="sortable" onClick={onToggleSort}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span>When</span>
                {sortDirection === 'desc' ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
              </div>
            </th>
            <th style={{ width: '150px' }}>Status</th>
            <th style={{ width: '160px', textAlign: 'right' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {paginatedIssues.map(iss => (
            <IssueRow
              key={iss.issue_id}
              issue={iss}
              onSelect={onSelectIssue}
              onUpdateStatus={onUpdateStatus}
              onOpenResolve={onOpenResolve}
              isMenuOpen={menuOpenId === iss.issue_id}
              onToggleMenu={onToggleMenu}
            />
          ))}
        </tbody>
      </table>

      <div className="pagination-bar">
        <span>
          Showing {Math.min((page - 1) * pageSize + 1, totalCount)}–
          {Math.min(page * pageSize, totalCount)} of {totalCount} issues
        </span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            className="page-btn"
            disabled={page === 1}
            onClick={() => onPageChange(Math.max(page - 1, 1))}
          >
            Previous
          </button>
          <button
            type="button"
            className="page-btn"
            disabled={page >= totalPages}
            onClick={() => onPageChange(Math.min(page + 1, totalPages))}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
