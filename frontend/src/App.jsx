// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Activity, 
  Server, 
  AlertTriangle, 
  AlertCircle, 
  List, 
  FileText, 
  Send, 
  CheckCircle2, 
  Clock, 
  TrendingUp 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

function App() {
  const [overview, setOverview] = useState(null);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Handover report state
  const [targetDate, setTargetDate] = useState('2026-02-27');
  const [targetShift, setTargetShift] = useState('B');
  const [handoverText, setHandoverText] = useState('');
  const [reportLoading, setReportLoading] = useState(false);

  // Centralized data fetcher
  const loadDashboardData = async () => {
    try {
      const overviewRes = await axios.get('http://127.0.0.1:8000/api/overview');
      const issuesRes = await axios.get('http://127.0.0.1:8000/api/issues');
      
      setOverview(overviewRes.data);
      setIssues(issuesRes.data);
      setLoading(false);
    } catch (err) {
      console.error("API Error:", err);
      setError("Failed to connect to FastAPI backend.");
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    fetchHandover('2026-02-27', 'B');
  }, []);

  const fetchHandover = async (date, shift) => {
    setReportLoading(true);
    try {
      const res = await axios.get(`http://127.0.0.1:8000/api/handover?date=${date}&shift=${shift}`);
      setHandoverText(res.data.handover_report);
    } catch (err) {
      console.error("Handover fetch error:", err);
      setHandoverText("Failed to generate shift handover report.");
    } finally {
      setReportLoading(false);
    }
  };

  const handleGenerateReport = (e) => {
    e.preventDefault();
    fetchHandover(targetDate, targetShift);
  };

  const handleUpdateStatus = async (issueId, newStatus) => {
    try {
      await axios.put(`http://127.0.0.1:8000/api/issues/${issueId}`, {
        status: newStatus,
        supervisor_notes: `Marked as ${newStatus} from ShiftSignal UI`
      });
      await loadDashboardData();
      fetchHandover(targetDate, targetShift);
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Failed to update status. Check backend connection.");
    }
  };

  // Derive anomaly frequency timeline for visualization
  const trendData = React.useMemo(() => {
    const counts = {};
    issues.forEach(i => {
      const d = i.anomaly_date;
      counts[d] = (counts[d] || 0) + 1;
    });
    return Object.keys(counts)
      .sort()
      .map(date => ({
        date: date.slice(5), // MM-DD
        anomalies: counts[date]
      }));
  }, [issues]);

  return (
    <div className="dashboard-container">
      <header className="header">
        <h1>
          <Activity size={24} color="#3b82f6" style={{ marginRight: '10px', verticalAlign: 'middle' }} />
          SHIFTSIGNAL <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>| Production Intelligence</span>
        </h1>
      </header>
      
      <main>
        {loading && <p style={{ color: 'var(--text-muted)' }}>Connecting to Production Sensors...</p>}
        {error && <p style={{ color: 'var(--status-danger)' }}>{error}</p>}
        
        {overview && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '25px' }}>
            <div style={{ backgroundColor: 'var(--bg-panel)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '10px' }}>
                <Server size={16} style={{ verticalAlign: 'text-bottom', marginRight: '5px' }}/> MONITORED MACHINES
              </div>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{overview.total_machines}</div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-panel)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '10px' }}>
                <AlertTriangle size={16} color="var(--status-warning)" style={{ verticalAlign: 'text-bottom', marginRight: '5px' }}/> DETECTED ANOMALIES
              </div>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{overview.total_detected_anomalies}</div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-panel)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '10px' }}>
                <AlertCircle size={16} color="var(--status-danger)" style={{ verticalAlign: 'text-bottom', marginRight: '5px' }}/> ACTIVE OPEN ISSUES
              </div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--status-danger)' }}>{overview.active_open_issues}</div>
            </div>
          </div>
        )}

        {/* Anomaly Trend Chart */}
        {trendData.length > 0 && (
          <div style={{ backgroundColor: 'var(--bg-panel)', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '25px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
              <TrendingUp size={18} color="var(--accent-blue)" />
              <h2 style={{ fontSize: '16px' }}>Incident Timeline & Cluster Trend</h2>
            </div>
            <div style={{ width: '100%', height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="anomalyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis dataKey="date" stroke="#737373" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#737373" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#333333', borderRadius: '4px', fontSize: '12px' }} 
                  />
                  <Area type="monotone" dataKey="anomalies" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#anomalyGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Handover Report Section */}
        <div style={{ backgroundColor: 'var(--bg-panel)', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '25px', overflow: 'hidden' }}>
          <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--border-color)', backgroundColor: '#1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="var(--accent-blue)" /> Deterministic Shift Handover
            </h2>
            <form onSubmit={handleGenerateReport} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input 
                type="date" 
                value={targetDate} 
                onChange={(e) => setTargetDate(e.target.value)}
                style={{ backgroundColor: '#121212', color: '#fff', border: '1px solid var(--border-color)', padding: '6px 10px', borderRadius: '4px', fontSize: '12px' }}
              />
              <select 
                value={targetShift} 
                onChange={(e) => setTargetShift(e.target.value)}
                style={{ backgroundColor: '#121212', color: '#fff', border: '1px solid var(--border-color)', padding: '6px 10px', borderRadius: '4px', fontSize: '12px' }}
              >
                <option value="A">Shift A (Morning)</option>
                <option value="B">Shift B (Evening)</option>
                <option value="C">Shift C (Night)</option>
              </select>
              <button 
                type="submit" 
                style={{ backgroundColor: 'var(--accent-blue)', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <Send size={12} /> Generate
              </button>
            </form>
          </div>
          <div style={{ padding: '20px' }}>
            <pre style={{ 
              backgroundColor: '#121212', 
              color: '#38bdf8', 
              padding: '15px', 
              borderRadius: '6px', 
              fontFamily: 'Consolas, monospace', 
              fontSize: '13px', 
              lineHeight: '1.5',
              whiteSpace: 'pre-wrap',
              border: '1px solid #2a2a2a'
            }}>
              {reportLoading ? "Querying database facts and synthesizing handover..." : handoverText}
            </pre>
          </div>
        </div>

        {/* Operational Issues Table */}
        {!loading && !error && (
          <div style={{ backgroundColor: 'var(--bg-panel)', borderRadius: '8px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--border-color)', backgroundColor: '#1a1a1a' }}>
              <h2 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <List size={18} color="var(--accent-blue)" /> Operational Issues & Lifecycle Management
              </h2>
            </div>
            
            <div style={{ overflowX: 'auto', maxHeight: '420px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ position: 'sticky', top: 0, backgroundColor: '#1a1a1a', zIndex: 1 }}>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>
                    <th style={{ padding: '15px 20px' }}>Issue ID</th>
                    <th style={{ padding: '15px 20px' }}>Machine</th>
                    <th style={{ padding: '15px 20px' }}>Anomaly Type</th>
                    <th style={{ padding: '15px 20px' }}>Date / Shift</th>
                    <th style={{ padding: '15px 20px' }}>Status</th>
                    <th style={{ padding: '15px 20px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {issues.map((issue) => (
                    <tr key={issue.issue_id} style={{ borderBottom: '1px solid #2a2a2a' }}>
                      <td style={{ padding: '15px 20px' }}>#{issue.issue_id}</td>
                      <td style={{ padding: '15px 20px', fontWeight: 'bold' }}>{issue.machine_id}</td>
                      <td style={{ padding: '15px 20px' }}>{issue.anomaly_type.replace('_', ' ').toUpperCase()}</td>
                      <td style={{ padding: '15px 20px' }}>{issue.anomaly_date} | Shift {issue.anomaly_shift}</td>
                      <td style={{ padding: '15px 20px' }}>
                        <span style={{ 
                          padding: '4px 8px', 
                          borderRadius: '4px', 
                          fontSize: '12px', 
                          fontWeight: 'bold',
                          backgroundColor: 
                            issue.status === 'OPEN' ? 'rgba(239, 68, 68, 0.2)' : 
                            issue.status === 'ACKNOWLEDGED' ? 'rgba(245, 158, 11, 0.2)' : 
                            'rgba(16, 185, 129, 0.2)',
                          color: 
                            issue.status === 'OPEN' ? 'var(--status-danger)' : 
                            issue.status === 'ACKNOWLEDGED' ? 'var(--status-warning)' : 
                            'var(--status-success)'
                        }}>
                          {issue.status}
                        </span>
                      </td>
                      <td style={{ padding: '15px 20px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {issue.status === 'OPEN' && (
                            <button
                              onClick={() => handleUpdateStatus(issue.issue_id, 'ACKNOWLEDGED')}
                              style={{ 
                                backgroundColor: 'transparent', 
                                border: '1px solid var(--status-warning)', 
                                color: 'var(--status-warning)', 
                                padding: '4px 8px', 
                                borderRadius: '4px', 
                                fontSize: '11px', 
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Clock size={12} /> Ack
                            </button>
                          )}
                          {issue.status !== 'RESOLVED' && (
                            <button
                              onClick={() => handleUpdateStatus(issue.issue_id, 'RESOLVED')}
                              style={{ 
                                backgroundColor: 'transparent', 
                                border: '1px solid var(--status-success)', 
                                color: 'var(--status-success)', 
                                padding: '4px 8px', 
                                borderRadius: '4px', 
                                fontSize: '11px', 
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <CheckCircle2 size={12} /> Resolve
                            </button>
                          )}
                          {issue.status === 'RESOLVED' && (
                            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Archived</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;