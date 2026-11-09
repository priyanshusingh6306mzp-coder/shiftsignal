// frontend/src/App.jsx
import { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { api } from './api';
import { Overview } from './components/Overview';
import { Handover } from './components/Handover';
import { Issues } from './components/Issues';

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [issues, setIssues] = useState([]);
  const [lastUpdated, setLastUpdated] = useState('');
  const [backendDown, setBackendDown] = useState(false);
  const [toast, setToast] = useState(null);

  const [targetDate, setTargetDate] = useState('2026-02-27');
  const [targetShift, setTargetShift] = useState('B');
  const [handoverData, setHandoverData] = useState(null);
  const [handoverLoading, setHandoverLoading] = useState(false);
  const [issueFilters, setIssueFilters] = useState({ status: 'ALL', machine: 'ALL' });

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = useCallback(async () => {
    try {
      const [oRes, iRes] = await Promise.all([api.get('/api/overview'), api.get('/api/issues')]);
      setOverview(oRes.data);
      setIssues(iRes.data);
      setLastUpdated(new Date().toLocaleTimeString());
      setBackendDown(false);
    } catch {
      setBackendDown(true);
    }
  }, []);

  const loadHandover = useCallback(async (d, s) => {
    setHandoverLoading(true);
    try {
      const res = await api.get(`/api/handover/structured?date=${d}&shift=${s}`);
      setHandoverData(res.data);
    } catch {
      showToast('Failed to fetch shift handover data');
    } finally {
      setHandoverLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const fetchAll = async () => {
      try {
        const [oRes, iRes] = await Promise.all([api.get('/api/overview'), api.get('/api/issues')]);
        if (active) {
          setOverview(oRes.data);
          setIssues(iRes.data);
          setLastUpdated(new Date().toLocaleTimeString());
          setBackendDown(false);
        }
      } catch {
        if (active) setBackendDown(true);
      }
    };
    fetchAll();
    const timer = setInterval(fetchAll, 30000);
    return () => { active = false; clearInterval(timer); };
  }, []);

  useEffect(() => {
    let active = true;
    const fetchH = async () => {
      setHandoverLoading(true);
      try {
        const res = await api.get(`/api/handover/structured?date=${targetDate}&shift=${targetShift}`);
        if (active) setHandoverData(res.data);
      } catch {
        if (active) showToast('Failed to fetch shift handover data');
      } finally {
        if (active) setHandoverLoading(false);
      }
    };
    fetchH();
    return () => { active = false; };
  }, [targetDate, targetShift]);

  const handleUpdateStatus = async (issueId, newStatus, notes = '') => {
    const previousIssues = [...issues];
    setIssues(prev => prev.map(iss => {
      if (iss.issue_id === issueId) {
        return { ...iss, status: newStatus, supervisor_notes: notes || iss.supervisor_notes };
      }
      return iss;
    }));

    try {
      await api.put(`/api/issues/${issueId}`, {
        status: newStatus,
        supervisor_notes: notes || `Updated to ${newStatus}`
      });
      showToast(`Issue #${issueId} marked as ${newStatus.toLowerCase()}`);
      loadData();
      loadHandover(targetDate, targetShift);
    } catch {
      setIssues(previousIssues);
      showToast(`Failed to update issue #${issueId}. Rollback applied.`);
    }
  };

  const handleNavigateWithFilter = ({ status = 'ALL', machine = 'ALL' }) => {
    setIssueFilters({ status, machine });
    setActiveTab('issues');
  };

  const unresolvedCount = issues.filter(i => i.status === 'OPEN' || i.status === 'ACKNOWLEDGED').length;

  return (
    <div className="app-container">
      {toast && <div className="toast-notice">{toast}</div>}

      {backendDown && (
        <div className="backend-banner">
          <span>
            Cannot reach the backend at 127.0.0.1:8000. Start it with: <code>uvicorn app.main:app --reload</code>
          </span>
          <button type="button" onClick={loadData} className="retry-btn">
            <RefreshCw size={12} />
            <span>Retry</span>
          </button>
        </div>
      )}

      <header className="app-header no-print">
        <div className="brand-section">
          <div>
            <h1 className="brand-title">ShiftSignal</h1>
            <p className="brand-subtitle">Production intelligence & shift handover</p>
          </div>
        </div>

        <div className="header-right">
          <span className="last-updated">Updated {lastUpdated || 'just now'}</span>

          <nav className="tab-nav">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'handover', label: 'Handover' },
              { id: 'issues', label: 'Issues', badge: unresolvedCount }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              >
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="tab-badge">{tab.badge}</span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="tab-content" key={activeTab}>
        {activeTab === 'overview' && (
          <Overview
            overview={overview}
            issues={issues}
            onNavigateWithFilter={handleNavigateWithFilter}
            onOpenHandover={() => setActiveTab('handover')}
          />
        )}
        {activeTab === 'handover' && (
          <Handover
            data={handoverData}
            targetDate={targetDate}
            setTargetDate={setTargetDate}
            targetShift={targetShift}
            setTargetShift={setTargetShift}
            loading={handoverLoading}
            onNavigateToIssues={handleNavigateWithFilter}
          />
        )}
        {activeTab === 'issues' && (
          <Issues
            key={`${issueFilters.status}-${issueFilters.machine}`}
            issues={issues}
            onUpdateStatus={handleUpdateStatus}
            initialStatus={issueFilters.status}
            initialMachine={issueFilters.machine}
          />
        )}
      </main>
    </div>
  );
}

export default App;
