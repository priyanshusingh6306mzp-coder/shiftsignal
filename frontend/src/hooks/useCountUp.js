// frontend/src/hooks/useCountUp.js
import { useState, useEffect, useRef } from 'react';

export function useCountUp(target, duration = 600) {
  const [count, setCount] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return target;
    }
    return 0;
  });
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    if (typeof target !== 'number' || isNaN(target)) {
      requestAnimationFrame(() => setCount(target));
      return;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      requestAnimationFrame(() => setCount(target));
      hasAnimatedRef.current = true;
      return;
    }

    if (hasAnimatedRef.current) {
      requestAnimationFrame(() => setCount(target));
      return;
    }

    if (target === 0) {
      requestAnimationFrame(() => setCount(0));
      return;
    }

    hasAnimatedRef.current = true;
    let start = 0;
    const finalValue = target;
    const stepTime = 16;
    const totalSteps = duration / stepTime;
    const stepIncrement = (finalValue - start) / totalSteps;

    let current = start;
    const timer = setInterval(() => {
      current += stepIncrement;
      if (current >= finalValue) {
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
