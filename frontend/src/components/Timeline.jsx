import React, { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';

const MACHINE_COLORS = {
  'M-01': '#3b82f6',
  'M-02': '#10b981',
  'M-03': '#8b5cf6',
  'M-04': '#f59e0b',
  'M-05': '#06b6d4',
  'M-06': '#ef4444'
};

export function Timeline({ issues = [] }) {
  const chartData = useMemo(() => {
    if (!issues.length) return [];
    
    const dates = issues.map(i => i.anomaly_date).filter(Boolean).sort();
    if (!dates.length) return [];

    const minDate = new Date(dates[0]);
    const maxDate = new Date(dates[dates.length - 1]);

    const dateMap = {};
    for (let d = new Date(minDate); d <= maxDate; d.setDate(d.getDate() + 1)) {
      const dStr = d.toISOString().slice(0, 10);
      dateMap[dStr] = {
        date: dStr.slice(5),
        'M-01': 0, 'M-02': 0, 'M-03': 0, 'M-04': 0, 'M-05': 0, 'M-06': 0
      };
    }

    issues.forEach(iss => {
      const d = iss.anomaly_date;
      if (dateMap[d] && iss.machine_id) {
        dateMap[d][iss.machine_id] = (dateMap[d][iss.machine_id] || 0) + 1;
      }
    });

    return Object.values(dateMap);
  }, [issues]);

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={18} color='var(--accent-cyan)' />
          <h2 style={{ fontSize: '14px', fontWeight: '600', margin: 0, color: 'var(--text-main)' }}>
            Daily Anomaly Distribution by Machine (Full Timeline)
          </h2>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>Includes zero-event operational gaps</span>
      </div>

      <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer width='100%' height='100%'>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray='3 3' stroke='#1c273a' vertical={false} />
            <XAxis dataKey='date' stroke='#64748b' tick={{ fontSize: 11 }} />
            <YAxis stroke='#64748b' tick={{ fontSize: 11 }} allowDecimals={false} label={{ value: 'Anomalies', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }} />
            <Tooltip contentStyle={{ backgroundColor: '#0f1726', borderColor: '#22324f', borderRadius: '6px', fontSize: '12px' }} />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
            {Object.keys(MACHINE_COLORS).map(m => (
              <Bar key={m} dataKey={m} stackId='fleet' fill={MACHINE_COLORS[m]} isAnimationActive={true} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
