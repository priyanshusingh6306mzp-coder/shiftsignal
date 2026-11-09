// frontend/src/components/Overview.jsx
import React, { useMemo } from 'react';
import { Server, AlertTriangle, AlertCircle, Flame } from 'lucide-react';
import { AnimatedCard } from './AnimatedCard';
import { Timeline } from './Timeline';

export function Overview({ overview, issues = [], onNavigateWithFilter }) {
  const counts = useMemo(() => {
    const open = issues.filter(i => i.status === 'OPEN').length;
    const ack = issues.filter(i => i.status === 'ACKNOWLEDGED').length;
    const res = issues.filter(i => i.status === 'RESOLVED').length;
    return { open, ack, res };
  }, [issues]);

  const machineHotspots = useMemo(() => {
    const pendingByM = {};
    issues.filter(i => i.status !== 'RESOLVED').forEach(i => {
      pendingByM[i.machine_id] = (pendingByM[i.machine_id] || 0) + 1;
    });
    return Object.entries(pendingByM).sort((a, b) => b[1] - a[1]);
  }, [issues]);

  return (
    <div>
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
        <AnimatedCard 
          title="Monitored Fleet" 
          value={overview?.total_machines ?? 6} 
          subtitle="Active CNC Milling Assets"
          icon={Server} 
          iconColor="#3b82f6" 
          delay={0}
          onClick={() => onNavigateWithFilter({ status: 'ALL', machine: 'ALL' })}
        />

        <AnimatedCard 
          title="Detected Anomalies" 
          value={overview?.total_detected_anomalies ?? 0} 
          subtitle="Flagged via Robust Z-Score"
          icon={AlertTriangle} 
          iconColor="#f59e0b" 
          delay={100}
          onClick={() => onNavigateWithFilter({ status: 'ALL', machine: 'ALL' })}
        />

        <AnimatedCard 
          title="Active Issues" 
          value={overview?.active_open_issues ?? 0} 
          subtitle={`${counts.open} open, ${counts.ack} acknowledged, ${counts.res} resolved`}
          icon={AlertCircle} 
          iconColor="#ef4444" 
          isDanger={true}
          delay={200}
          onClick={() => onNavigateWithFilter({ status: 'OPEN', machine: 'ALL' })}
        />
      </div>

      {/* Hotspots Strip */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
          <Flame size={16} color="var(--status-open)" />
          <span>Unresolved issues by asset:</span>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {machineHotspots.map(([mId, cnt]) => {
            const isSevere = cnt >= 5;
            return (
              <button
                key={mId}
                onClick={() => onNavigateWithFilter({ machine: mId, status: 'ALL' })}
                style={{
                  background: isSevere ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                  border: isSevere ? '1px solid var(--status-open)' : '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '5px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  color: isSevere ? '#fca5a5' : 'var(--text-main)',
                  fontSize: '12px'
                }}
              >
                {isSevere && <span className="hotspot-pulse" />}
                <span style={{ fontWeight: '600' }}>{mId}</span>
                <span style={{ fontSize: '11px', color: isSevere ? 'var(--status-open)' : 'var(--text-muted)' }}>
                  ({cnt})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Calendar Timeline */}
      <Timeline issues={issues} />
    </div>
  );
}