import { useEffect, useRef, useState, type ReactElement } from 'react';
import { ResponsiveContainer } from 'recharts';

interface SafeChartProps {
  height?: number;
  children: ReactElement;
}

/** Avoids Recharts "width(-1) height(-1)" warnings until container has layout. */
export function SafeChart({ height = 260, children }: SafeChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const check = () => {
      const { width, height: h } = el.getBoundingClientRect();
      setReady(width > 0 && h > 0);
    };

    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="w-full min-w-0"
      style={{ height, minHeight: height }}
    >
      {ready ? (
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={height}>
          {children}
        </ResponsiveContainer>
      ) : (
        <div className="h-full w-full animate-pulse rounded-lg bg-btp-800/40" />
      )}
    </div>
  );
}
