// frontend/src/components/AnimatedCard.jsx
import { useCountUp } from '../hooks/useCountUp';

export function AnimatedCard({ title, value, subtitle, onClick, delay = 0 }) {
  const animatedValue = useCountUp(typeof value === 'number' ? value : 0);

  return (
    <button
      type="button"
      onClick={onClick}
      className="kpi-card card-stagger"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="kpi-label">{title}</span>
      <div className="kpi-value">
        {typeof value === 'number' ? animatedValue : (value || '-')}
      </div>
      {subtitle && <div className="kpi-subtitle">{subtitle}</div>}
    </button>
  );
}
