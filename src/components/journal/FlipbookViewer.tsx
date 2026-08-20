import { ChevronLeft, ChevronRight, Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { Journal } from "@/lib/types";

import { A4Page, PAGE_H, PAGE_W } from "./A4Page";
import type { Block } from "./blocks";

/**
 * Viewer only: it renders exactly the pages produced by the A4 page generator.
 */
export function FlipbookViewer({ journal, pages }: { journal: Journal; pages: Block[][] }) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [flip, setFlip] = useState<"none" | "next" | "prev">("none");
  const shellRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [base, setBase] = useState(0.6);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth - 32;
      const h = el.clientHeight - 32;
      setBase(Math.max(0.15, Math.min(w / PAGE_W, h / PAGE_H)));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const go = (delta: number) => {
    setIndex((i) => {
      const next = Math.min(pages.length - 1, Math.max(0, i + delta));
      if (next !== i) {
        setFlip(delta > 0 ? "next" : "prev");
        setTimeout(() => setFlip("none"), 320);
      }
      return next;
    });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages.length]);

  const blocks = pages[index] ?? [];
  const s = base * zoom;

  return (
    <div ref={shellRef} className="flex h-full flex-col bg-neutral-800">
      <div ref={stageRef} className="flex flex-1 items-center justify-center overflow-auto p-4">
        <div
          key={index}
          className={`flip-page flip-${flip} shadow-2xl`}
          style={{ zoom: s }}
        >
          <A4Page
            journalTitle={journal.title}
            period={`${journal.month} ${journal.year}`}
            pageNumber={index + 1}
            totalPages={pages.length}
            bare={blocks[0]?.bare}
          >
            {blocks.map((b) => (
              <div key={b.key}>{b.node}</div>
            ))}
          </A4Page>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 border-t border-neutral-700 bg-neutral-900 p-2 text-neutral-100">
        <Button variant="secondary" size="sm" onClick={() => go(-1)} disabled={index === 0}>
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>
        <span className="px-2 text-sm">
          Page {index + 1} / {pages.length}
        </span>
        <Button variant="secondary" size="sm" onClick={() => go(1)} disabled={index >= pages.length - 1}>
          Next <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setZoom((z) => Math.max(0.5, z - 0.15))}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setZoom((z) => Math.min(3, z + 0.15))}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            const el = shellRef.current;
            if (!el) return;
            if (document.fullscreenElement) void document.exitFullscreen();
            else void el.requestFullscreen?.();
          }}
        >
          <Maximize2 className="h-4 w-4" /> Fullscreen
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto border-t border-neutral-700 bg-neutral-900 p-2">
        {pages.map((p, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`shrink-0 border-2 ${i === index ? "border-amber-400" : "border-transparent"}`}
            title={`Page ${i + 1}`}
          >
            <div style={{ zoom: 0.11, pointerEvents: "none" }}>
              <A4Page
                journalTitle={journal.title}
                period={`${journal.month} ${journal.year}`}
                pageNumber={i + 1}
                totalPages={pages.length}
                bare={p[0]?.bare}
              >
                {p.map((b) => (
                  <div key={b.key}>{b.node}</div>
                ))}
              </A4Page>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}