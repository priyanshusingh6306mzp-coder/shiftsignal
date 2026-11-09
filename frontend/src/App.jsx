// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw } from 'lucide-react';
import { api } from './api';
import { Overview } from './components/Overview';
import { Handover } from './components/Handover';
import { Issues } from './components/Issues';

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');
  const [backendDown, setBackendDown] = useState(false);
  const [toast, setToast] = useState(null);

  // Handover state
  const [targetDate, setTargetDate] = useState('2026-02-27');
  const [targetShift, setTargetShift] = useState('B');
  const [handoverData, setHandoverData] = useState(null);
  const [handoverLoading, setHandoverLoading] = useState(false);

  // Filter pass-through state for navigation
  const [issueFilters, setIssueFilters] = useState({ status: 'ALL', machine: 'ALL' });

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = async () => {
    try {
      const [oRes, iRes] = await Promise.all([
        api.get('/api/overview'),
        api.get('/api/issues')
      ]);
      setOverview(oRes.data);
      setIssues(iRes.data);
      setLastUpdated(new Date().toLocaleTimeString());
      setBackendDown(false);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setBackendDown(true);
      setLoading(false);
    }
  };

  const loadHandover = async (d, s) => {
    setHandoverLoading(true);
    try {
      const res = await api.get(`/api/handover/structured?date=${d}&shift=${s}`);
      setHandoverData(res.data);
    } catch (err) {
      console.error(err);
      showToast("Failed to fetch shift handover");
    } finally {
      setHandoverLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadHandover(targetDate, targetShift);
  }, [targetDate, targetShift]);

  // Optimistic UI updates
  const handleUpdateStatus = async (issueId, newStatus, notes = "") => {
    const previousIssues = [...issues];

    // Apply optimistic update immediately
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
      showToast(`Issue #${issueId} marked as ${newStatus}`);
      loadData();
      loadHandover(targetDate, targetShift);
    } catch (err) {
      console.error(err);
      // Rollback on failure
      setIssues(previousIssues);
      showToast(`Failed to update issue #${issueId}. Rollback applied.`);
    }
  };

  const handleNavigateWithFilter = ({ status = 'ALL', machine = 'ALL' }) => {
    setIssueFilters({ status, machine });
    setActiveTab('issues');
  };

  const openCount = issues.filter(i => i.status === 'OPEN').length;

  return (
    <div style={{ minHeight: '100vh', padding: '24px 32px' }}>
      
      {/* Toast Notification */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 20, right: 20, backgroundColor: 'var(--accent-blue)', color: '#fff', padding: '10px 18px', borderRadius: '8px', zIndex: 2000, boxShadow: '0 4px 16px rgba(0,0,0,0.5)', fontSize: '13px' }}>
          {toast}
        </div>
      )}

      {/* Backend Error Banner */}
      {backendDown && (
        <div style={{ backgroundColor: 'var(--status-open-bg)', border: '1px solid var(--status-open-border)', color: '#fca5a5', padding: '12px 18px', borderRadius: '8px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
          <span>Cannot reach the backend at 127.0.0.1:8000. Start it with <code>uvicorn app.main:app --reload</code></span>
          <button onClick={loadData} style={{ background: 'var(--status-open)', border: 'none', color: '#fff', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      )}

      {/* Header */}
      <header className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '18px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', padding: '8px', borderRadius: '8px' }}>
            <Activity size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>SHIFTSIGNAL</h1>
            <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-faint)' }}>Production Intelligence & Zero-Hallucination Shift Engine</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>Updated {lastUpdated || 'just now'}</span>
          
          <nav style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg-card)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            {['overview', 'handover', 'issues'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  backgroundColor: activeTab === tab ? 'var(--accent-blue)' : 'transparent',
                  color: activeTab === tab ? '#fff' : 'var(--text-muted)',
                  border: 'none',
                  padding: '6px 16px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  textTransform: 'capitalize',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {tab}
                {tab === 'issues' && openCount > 0 && (
                  <span style={{ backgroundColor: 'var(--status-open)', color: '#fff', fontSize: '10px', padding: '1px 6px', borderRadius: '10px' }}>
                    {openCount}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main>
        {activeTab === 'overview' && (
          <Overview 
            overview={overview} 
            issues={issues} 
            onNavigateWithFilter={handleNavigateWithFilter} 
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
          />
        )}

        {activeTab === 'issues' && (
          <Issues 
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