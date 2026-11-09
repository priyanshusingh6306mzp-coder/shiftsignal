// frontend/src/components/AnimatedCard.jsx
import React from 'react';
import { useCountUp } from '../hooks/useCountUp';

export function AnimatedCard({ title, value, subtitle, icon: Icon, iconColor = "#3b82f6", onClick, delay = 0, isDanger = false }) {
  const animatedValue = useCountUp(typeof value === 'number' ? value : 0);

  return (
    <button
      onClick={onClick}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        background: 'var(--bg-card)',
        border: isDanger ? '1px solid var(--status-open-border)' : '1px solid var(--border-subtle)',
        borderRadius: '10px',
        padding: '18px 20px',
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
        animationDelay: `${delay}ms`,
        transition: 'all 0.18s ease-in-out',
        position: 'relative',
        overflow: 'hidden'
      }}
      className="card-stagger"
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.borderColor = isDanger ? 'var(--status-open)' : 'var(--border-accent)';
          e.currentTarget.style.boxShadow = isDanger 
            ? '0 6px 20px rgba(239, 68, 68, 0.2)' 
            : '0 6px 20px var(--accent-blue-glow)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.borderColor = isDanger ? 'var(--status-open-border)' : 'var(--border-subtle)';
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
        }
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
          {title}
        </span>
        {Icon && (
          <div style={{ padding: '6px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.03)' }}>
            <Icon size={18} color={iconColor} />
          </div>
        )}
      </div>

      <div style={{ fontSize: '32px', fontWeight: '700', color: isDanger ? 'var(--status-open)' : 'var(--text-main)', lineHeight: '1.2' }}>
        {typeof value === 'number' ? animatedValue : value}
      </div>

      {subtitle && (
        <div style={{ fontSize: '12px', color: 'var(--text-faint)', marginTop: '6px' }}>
          {subtitle}
        </div>
      )}
    </button>
  );
}