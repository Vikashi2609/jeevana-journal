import { useEffect, useMemo, useRef, useState } from "react";

import { useImages } from "@/lib/store";
import type { Journal } from "@/lib/types";

import { A4Page, CONTENT_H, CONTENT_W } from "./A4Page";
import { buildBlocks, type Block } from "./blocks";

async function waitForImages(root: HTMLElement) {
  const imgs = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) return resolve();
          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
        }),
    ),
  );
}

function paginate(blocks: Block[], heights: number[]): Block[][] {
  const pages: Block[][] = [];
  let current: Block[] = [];
  let used = 0;

  const flush = () => {
    if (current.length) pages.push(current);
    current = [];
    used = 0;
  };

  blocks.forEach((block, i) => {
    const h = heights[i] ?? 0;
    if (block.full) {
      flush();
      pages.push([block]);
      return;
    }
    const remaining = CONTENT_H - 6 - used;
    const needed = block.keepWithNext ? h + Math.min(140, heights[i + 1] ?? 0) : h;
    if (current.length > 0 && needed > remaining) flush();
    current.push(block);
    used += h;
  });
  flush();
  return pages.length ? pages : [[]];
}

export interface RenderedPages {
  pages: Block[][];
  ready: boolean;
}

/**
 * Measures every block at true A4 content width and flows them onto pages.
 * The A4 preview, the flipbook and print all consume these same pages.
 */
export function useJournalPages(journal: Journal | null): RenderedPages & { measurer: React.ReactNode } {
  const ids = useMemo(() => {
    if (!journal) return [];
    const list = journal.articles.flatMap((a) => a.photos.map((p) => p.id));
    if (journal.coverImageId) list.push(journal.coverImageId);
    return list;
  }, [journal]);

  const { images, ready: imagesReady } = useImages(ids);
  const blocks = useMemo(() => (journal ? buildBlocks(journal, images) : []), [journal, images]);
  const ref = useRef<HTMLDivElement | null>(null);
  const [pages, setPages] = useState<Block[][] | null>(null);

  useEffect(() => {
    let alive = true;
    setPages(null);
    if (!journal || !imagesReady) return;
    const node = ref.current;
    if (!node) return;
    (async () => {
      await waitForImages(node);
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      if (!alive) return;
      const children = Array.from(node.children) as HTMLElement[];
      const heights = children.map((c) => c.getBoundingClientRect().height);
      setPages(paginate(blocks, heights));
    })();
    return () => {
      alive = false;
    };
  }, [blocks, journal, imagesReady]);

  const measurer = (
    <div
      ref={ref}
      aria-hidden
      className="jr-measure"
      style={{
        position: "absolute",
        left: "-10000px",
        top: 0,
        width: `${CONTENT_W}px`,
        visibility: "hidden",
        pointerEvents: "none",
        fontFamily: 'Georgia, "Times New Roman", serif',
      }}
    >
      {blocks.map((b) => (
        <div key={b.key} className="jr-block">{b.node}</div>
      ))}
    </div>
  );

  return { pages: pages ?? [], ready: pages !== null, measurer };
}

export function JournalPages({
  journal,
  pages,
  className,
}: {
  journal: Journal;
  pages: Block[][];
  className?: string;
}) {
  return (
    <>
      {pages.map((blocks, i) => (
        <A4Page
          key={i}
          journalTitle={journal.title}
          period={`${journal.month} ${journal.year}`}
          pageNumber={i + 1}
          totalPages={pages.length}
          bare={blocks[0]?.bare}
        >
          <div className={className}>
            {blocks.map((b) => (
              <div key={b.key} className="jr-block">{b.node}</div>
            ))}
          </div>
        </A4Page>
      ))}
    </>
  );
}