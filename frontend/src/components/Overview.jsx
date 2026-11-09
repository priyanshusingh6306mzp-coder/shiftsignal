// frontend/src/components/Overview.jsx
import { Fragment, useMemo } from 'react';
import { AnimatedCard } from './AnimatedCard';
import { Timeline } from './Timeline';
import { formatDate } from '../utils/formatters';

const SHIFT_MAP = { A: 0, B: 1, C: 2 };

function getShiftOrdinal(dateStr, shiftChar) {
  if (!dateStr) return 0;
  const dt = new Date(dateStr);
  const ord = Math.floor(dt.getTime() / (1000 * 60 * 60 * 24));
  return ord * 3 + (SHIFT_MAP[shiftChar] ?? 0);
}

export function Overview({ overview, issues = [], onNavigateWithFilter, onOpenHandover }) {
  const unresolvedIssues = useMemo(() => {
    return issues.filter(i => i.status === 'OPEN' || i.status === 'ACKNOWLEDGED');
  }, [issues]);

  const counts = useMemo(() => {
    const open = issues.filter(i => i.status === 'OPEN').length;
    const ack = issues.filter(i => i.status === 'ACKNOWLEDGED').length;
    const res = issues.filter(i => i.status === 'RESOLVED').length;
    return { open, ack, res, unresolved: open + ack };
  }, [issues]);

  const machineStats = useMemo(() => {
    const map = {};
    unresolvedIssues.forEach(iss => {
      if (!map[iss.machine_id]) map[iss.machine_id] = [];
      map[iss.machine_id].push(iss);
    });

    const list = Object.entries(map).map(([mId, items]) => {
      items.sort((a, b) => {
        const ordA = getShiftOrdinal(a.anomaly_date, a.anomaly_shift);
        const ordB = getShiftOrdinal(b.anomaly_date, b.anomaly_shift);
        return ordA - ordB;
      });

      const uniqueOrds = Array.from(new Set(items.map(i => getShiftOrdinal(i.anomaly_date, i.anomaly_shift))));
      let streak = 1;

      for (let i = uniqueOrds.length - 1; i > 0; i--) {
        if (uniqueOrds[i] - uniqueOrds[i - 1] === 1) {
          streak++;
        } else {
          break;
        }
      }

      // Find the first date belonging to the unbroken streak
      const streakStartDate = items[Math.max(0, items.length - streak)]?.anomaly_date;

      return {
        machineId: mId,
        count: items.length,
        streak,
        streakStartDate,
        isCritical: streak >= 6 || items.length >= 10
      };
    });

    list.sort((a, b) => b.count - a.count);
    return list;
  }, [unresolvedIssues]);

  const criticalHotspot = machineStats.find(m => m.isCritical);

  return (
    <div>
      {/* Hotspot Banner */}
      {criticalHotspot ? (
        <div className="hotspot-banner">
          <div className="hotspot-left">
            <span className="hotspot-pulse-dot" />
            <span className="hotspot-text">
              {criticalHotspot.machineId} needs attention: {criticalHotspot.count} unresolved, anomalies on every shift since {formatDate(criticalHotspot.streakStartDate)}.
            </span>
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={onOpenHandover}
          >
            Open handover
          </button>
        </div>
      ) : (
        <div className="hotspot-banner normal">
          <span>All machines within normal range.</span>
        </div>
      )}

      {/* KPI Tiles */}
      <div className="kpi-grid">
        <AnimatedCard
          title="Machines"
          value={overview?.total_machines ?? 6}
          subtitle="Monitored fleet assets"
          delay={0}
          onClick={() => onNavigateWithFilter({ status: 'ALL', machine: 'ALL' })}
        />

        <AnimatedCard
          title="Anomalies detected"
          value={overview?.total_detected_anomalies ?? issues.length}
          subtitle="Total detected incidents"
          delay={80}
          onClick={() => onNavigateWithFilter({ status: 'ALL', machine: 'ALL' })}
        />

        <AnimatedCard
          title="Unresolved"
          value={counts.unresolved}
          subtitle={`${counts.open} open, ${counts.ack} acknowledged`}
          delay={160}
          onClick={() => onNavigateWithFilter({ status: 'UNRESOLVED', machine: 'ALL' })}
        />
      </div>

      {/* Unresolved by machine inline row */}
      {machineStats.length > 0 && (
        <div className="machine-row-strip">
          <span className="machine-row-label">Unresolved by machine:</span>
          {machineStats.map((item, idx) => (
            <Fragment key={item.machineId}>
              {idx > 0 && <span className="machine-row-label">·</span>}
              <button
                type="button"
                className="machine-pill-btn"
                onClick={() => onNavigateWithFilter({ machine: item.machineId, status: 'ALL' })}
              >
                <span>{item.machineId} </span>
                <span className={item.isCritical ? 'machine-count-critical' : 'machine-count-muted'}>
                  {item.count}
                </span>
              </button>
            </Fragment>
          ))}
        </div>
      )}

      {/* Continuous Daily Timeline */}
      <Timeline issues={issues} />
    </div>
  );
}
