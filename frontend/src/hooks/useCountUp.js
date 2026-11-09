// frontend/src/hooks/useCountUp.js
import { useState, useEffect } from 'react';

export function useCountUp(target, duration = 600) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (typeof target !== 'number' || isNaN(target)) {
      setCount(target);
      return;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(target);
      return;
    }

    let start = 0;
    const finalValue = target;
    const stepTime = 16;
    const totalSteps = duration / stepTime;
    const stepIncrement = (finalValue - start) / totalSteps;

    let current = start;
    const timer = setInterval(() => {
      current += stepIncrement;
      if ((stepIncrement > 0 && current >= finalValue) || (stepIncrement < 0 && current <= finalValue)) {
        setCount(finalValue);
        clearInterval(timer);
      } else {
        setCount(Math.round(current));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [target, duration]);

  return count;
}