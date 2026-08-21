import { useEffect, useRef, useState, type ReactNode } from "react";

import { PAGE_H, PAGE_W } from "./A4Page";

/** Scales A4 pages down to fit the viewport without changing their proportions. */
export function PageStage({ children, zoom = 1 }: { children: ReactNode; zoom?: number }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth - 24;
      setScale(Math.min(1, w / PAGE_W));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const s = scale * zoom;

  return (
    <div ref={ref} className="w-full overflow-auto">
      {/* `zoom` keeps the scaled pages in normal flow so the container height is correct. */}
      <div
        className="page-stage mx-auto flex flex-col items-center gap-6"
        style={{ ["--stage-zoom" as string]: String(s), width: `${PAGE_W}px` } as React.CSSProperties}
      >
        {children}
      </div>
    </div>
  );
}

export { PAGE_H, PAGE_W };