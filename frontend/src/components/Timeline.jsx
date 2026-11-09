// frontend/src/components/Timeline.jsx
import { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { formatDate } from '../utils/formatters';

const MACHINE_PALETTE = {
  'M-01': 'var(--slate-1, #4a5565)',
  'M-02': 'var(--slate-2, #5d6b7e)',
  'M-03': 'var(--slate-3, #6f7f94)',
  'M-04': 'var(--slate-4, #8090a5)',
  'M-05': 'var(--slate-5, #94a3b7)',
  'M-06': 'var(--critical, #ff5d5d)'
};

export function Timeline({ issues = [] }) {
  const prefersReducedMotion = typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const { chartData, activeMachines, tickDates } = useMemo(() => {
    if (!issues.length) return { chartData: [], activeMachines: [], tickDates: [] };

    const dates = issues.map(i => i.anomaly_date).filter(Boolean).sort();
    if (!dates.length) return { chartData: [], activeMachines: [], tickDates: [] };

    const minDate = new Date(dates[0]);
    const maxDate = new Date(dates[dates.length - 1]);

    const machineTotals = {};
    const dateMap = {};
    for (let d = new Date(minDate); d <= maxDate; d.setDate(d.getDate() + 1)) {
      const dStr = d.toISOString().slice(0, 10);
      dateMap[dStr] = {
        dateStr: dStr,
        'M-01': 0, 'M-02': 0, 'M-03': 0, 'M-04': 0, 'M-05': 0, 'M-06': 0
      };
    }

    issues.forEach(iss => {
      const d = iss.anomaly_date;
      if (dateMap[d] && iss.machine_id) {
        dateMap[d][iss.machine_id] = (dateMap[d][iss.machine_id] || 0) + 1;
        machineTotals[iss.machine_id] = (machineTotals[iss.machine_id] || 0) + 1;
      }
    });

    const activeM = Object.keys(MACHINE_PALETTE).filter(m => (machineTotals[m] || 0) > 0);

    // Compute tick dates every 7 days starting from minDate
    const ticks = [];
    for (let d = new Date(minDate); d <= maxDate; d.setDate(d.getDate() + 7)) {
      ticks.push(d.toISOString().slice(0, 10));
    }

    return {
      chartData: Object.values(dateMap),
      activeMachines: activeM,
      tickDates: ticks
    };
  }, [issues]);

  const customTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const activeEntries = payload.filter(p => p.value > 0);
      return (
        <div style={{
          backgroundColor: 'var(--bg-raised)',
          border: '1px solid var(--border-hairline)',
          borderRadius: '8px',
          padding: '10px 14px',
          fontSize: '12px',
          color: 'var(--text-main)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
        }}>
          <div style={{ fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
            {formatDate(label)}
          </div>
          {activeEntries.length === 0 ? (
            <div style={{ color: 'var(--text-muted)' }}>No anomalies</div>
          ) : (
            activeEntries.map(entry => (
              <div key={entry.name} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '2px' }}>
                <span style={{ color: entry.color, fontWeight: 600 }}>{entry.name}:</span>
                <span>{entry.value}</span>
              </div>
            ))
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h2 className="chart-title">Daily anomaly distribution by machine</h2>
        <p className="chart-subtitle">Continuous timeline across all operational shifts</p>
      </div>

      <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="#232a33" vertical={false} strokeDasharray="0" />
            <XAxis
              dataKey="dateStr"
              stroke="#8a93a0"
              ticks={tickDates}
              tickFormatter={formatDate}
              tick={{ fontSize: 12, fill: '#8a93a0' }}
              tickLine={false}
              axisLine={{ stroke: '#232a33' }}
            />
            <YAxis
              stroke="#8a93a0"
              tick={{ fontSize: 12, fill: '#8a93a0' }}
              allowDecimals={false}
              tickLine={false}
              axisLine={{ stroke: '#232a33' }}
            />
            <Tooltip content={customTooltip} />
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '12px', color: '#8a93a0' }}
              formatter={(value) => <span style={{ color: '#8a93a0', marginRight: 12 }}>{value}</span>}
            />
            {activeMachines.map(m => (
              <Bar
                key={m}
                dataKey={m}
                stackId="fleet"
                fill={MACHINE_PALETTE[m]}
                isAnimationActive={!prefersReducedMotion}
                animationDuration={600}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
