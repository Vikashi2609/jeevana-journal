import { useEffect, useMemo, useRef, useState } from "react";

import { useImages } from "@/lib/store";
import type { Journal } from "@/lib/types";

import { A4Page, CONTENT_H, CONTENT_W } from "./A4Page";
import { buildBlocks, HtmlBlock, splitHtmlBlock, type Block } from "./blocks";

/** Usable flow height on a page (small safety margin against sub-pixel rounding). */
const MAX_H = CONTENT_H - 18;

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
    if (block.startsPage) flush();
    const remaining = MAX_H - used;
    const needed = block.keepWithNext ? h + Math.min(140, heights[i + 1] ?? 0) : h;
    if (current.length > 0 && needed > remaining) flush();
    current.push(block);
    used += h;
  });
  flush();
  return pages.length ? pages : [[]];
}

/**
 * Splits any measured block that is taller than a single page into two blocks.
 * Returns null when nothing could be split further (measurement is stable).
 */
function splitOversized(blocks: Block[], heights: number[]): Block[] | null {
  let changed = false;
  const out: Block[] = [];
  blocks.forEach((block, i) => {
    const h = heights[i] ?? 0;
    if (!block.full && h > MAX_H && block.html) {
      const halves = splitHtmlBlock(block.html);
      if (halves) {
        changed = true;
        halves.forEach((html, j) => {
          out.push({
            ...block,
            key: `${block.key}.${j}`,
            html,
            node: <HtmlFragment html={html} />,
            ...(j > 0 ? { keepWithNext: false, startsPage: false } : {}),
          });
        });
        return;
      }
    }
    out.push(block);
  });
  return changed ? out : null;
}

function HtmlFragment({ html }: { html: string }) {
  return <HtmlBlock html={html} />;
}


export interface RenderedPages {
  pages: Block[][];
  ready: boolean;
}

/**
 * Measures every block at true A4 content width and flows them onto pages.
 * The A4 preview, the flipbook and print all consume these same pages.
 */
export function useJournalPages(
  journal: Journal | null,
  /**
   * Optional pre-resolved id -> src map. When provided, image resolution
   * skips IndexedDB entirely (used by the Supabase-backed legacy view,
   * whose photo ids are already public URLs). Existing callers that omit
   * this keep resolving photos from IndexedDB exactly as before.
   */
  externalImages?: Record<string, string>,
): RenderedPages & { measurer: React.ReactNode } {
  const ids = useMemo(() => {
    if (!journal || externalImages) return [];
    const list = journal.articles.flatMap((a) => a.photos.map((p) => p.id));
    if (journal.coverImageId) list.push(journal.coverImageId);
    return list;
  }, [journal, externalImages]);

  const { images: dbImages, ready: dbImagesReady } = useImages(ids);
  const images = externalImages ?? dbImages;
  const imagesReady = externalImages ? true : dbImagesReady;
  const blocks = useMemo(() => (journal ? buildBlocks(journal, images) : []), [journal, images]);
  const ref = useRef<HTMLDivElement | null>(null);
  const [items, setItems] = useState<Block[]>(blocks);
  const [pages, setPages] = useState<Block[][] | null>(null);
  const passRef = useRef(0);

  useEffect(() => {
    passRef.current = 0;
    setPages(null);
    setItems(blocks);
  }, [blocks]);

  useEffect(() => {
    let alive = true;
    if (!journal || !imagesReady || !items.length) return;
    const node = ref.current;
    if (!node) return;
    (async () => {
      await waitForImages(node);
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      if (!alive) return;
      const children = Array.from(node.children) as HTMLElement[];
      const heights = children.map((c) => c.getBoundingClientRect().height);
      if (passRef.current < 24) {
        const split = splitOversized(items, heights);
        if (split) {
          passRef.current += 1;
          setItems(split);
          return;
        }
      }
      setPages(paginate(items, heights));
    })();
    return () => {
      alive = false;
    };
  }, [items, journal, imagesReady]);

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
      {/*
        IMPORTANT: this must mirror the real display markup exactly
        (see JournalPages / FlipbookViewer's PageArtwork below), including
        the .jr-content wrapper. .jr-content is where the body-text font
        size, line-height, and heading rules live (see styles.css) — if
        this measurer doesn't wrap blocks in it too, blocks get measured
        at the browser's default font size but *displayed* at the real
        (larger) one, so the page thinks less room is needed than it
        actually is and text overflows past the page boundary.
      */}
      <div className="jr-content">
        {items.map((b) => (
          <div key={b.key} className="jr-block">{b.node}</div>
        ))}
      </div>
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