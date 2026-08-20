import type { ReactNode } from "react";

import { autoBoldLabels } from "@/lib/format";
import type { Article, Journal } from "@/lib/types";

import { PhotoRow, photoRows } from "./PhotoGallery";

export interface Block {
  key: string;
  node: ReactNode;
  /** Occupies a whole page on its own (cover, editor's note). */
  full?: boolean;
  /** Avoid leaving this block alone at the bottom of a page. */
  keepWithNext?: boolean;
  bare?: boolean;
}

const BLOCK_TAGS = /<(p|h1|h2|h3|h4|ul|ol|blockquote|pre)\b[^>]*>[\s\S]*?<\/\1>/gi;

function textLength(html: string) {
  return html.replace(/<[^>]+>/g, "").length;
}

/** Splits article HTML into flowable blocks; very long paragraphs are chunked. */
export function splitHtml(html: string): string[] {
  const matches = html.match(BLOCK_TAGS);
  const raw = matches && matches.length ? matches : [`<p>${html}</p>`];
  const out: string[] = [];
  for (const block of raw) {
    if (textLength(block) < 900 || !/^<p\b/i.test(block)) {
      out.push(block);
      continue;
    }
    const inner = block.replace(/^<p[^>]*>/i, "").replace(/<\/p>$/i, "");
    const sentences = inner.split(/(?<=[.!?])\s+/);
    let buf = "";
    for (const s of sentences) {
      if (textLength(buf) + s.length > 700 && buf) {
        out.push(`<p>${buf.trim()}</p>`);
        buf = "";
      }
      buf += `${s} `;
    }
    if (buf.trim()) out.push(`<p>${buf.trim()}</p>`);
  }
  return out;
}

function HtmlBlock({ html }: { html: string }) {
  return (
    <div
      className="jr-prose"
      dangerouslySetInnerHTML={{ __html: autoBoldLabels(html) }}
    />
  );
}

function ArticleHeader({ article, index }: { article: Article; index: number }) {
  const meta = [article.category, article.className, article.date].filter(Boolean).join("  •  ");
  return (
    <div style={{ marginBottom: "14px", paddingBottom: "8px", borderBottom: "2px solid #2c2a26" }}>
      <div style={{ fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#6b6459" }}>
        Article {index + 1}
      </div>
      <h2 style={{ fontSize: "22px", fontWeight: 700, margin: "4px 0 6px", lineHeight: 1.25 }}>{article.title}</h2>
      {meta && <div style={{ fontSize: "12px", fontStyle: "italic", color: "#4a453d" }}>{meta}</div>}
    </div>
  );
}

function CoverPage({ journal, images }: { journal: Journal; images: Record<string, string> }) {
  const cover = journal.coverImageId ? images[journal.coverImageId] : undefined;
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "24px",
      }}
    >
      <div style={{ fontSize: "12px", letterSpacing: "0.3em", textTransform: "uppercase", color: "#6b6459" }}>
        School Publication
      </div>
      <h1 style={{ fontSize: "40px", fontWeight: 700, margin: "14px 0 6px", lineHeight: 1.2 }}>{journal.title}</h1>
      {journal.subtitle && <div style={{ fontSize: "15px", fontStyle: "italic", color: "#4a453d" }}>{journal.subtitle}</div>}
      <div style={{ margin: "18px 0", width: "120px", borderTop: "2px solid #2c2a26" }} />
      <div style={{ fontSize: "16px", letterSpacing: "0.12em", textTransform: "uppercase" }}>
        {journal.month} {journal.year}
      </div>
      {cover && (
        <img
          src={cover}
          alt="Cover"
          style={{
            marginTop: "28px",
            maxWidth: "100%",
            maxHeight: "520px",
            width: "auto",
            height: "auto",
            objectFit: "contain",
            border: "1px solid #cfc9bd",
          }}
        />
      )}
    </div>
  );
}

export function buildBlocks(journal: Journal, images: Record<string, string>): Block[] {
  const blocks: Block[] = [];

  blocks.push({ key: "cover", full: true, bare: true, node: <CoverPage journal={journal} images={images} /> });

  if (journal.editorsNote && journal.editorsNote.replace(/<[^>]+>/g, "").trim()) {
    blocks.push({
      key: "note",
      full: true,
      node: (
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "12px", borderBottom: "2px solid #2c2a26", paddingBottom: "6px" }}>
            Editor&apos;s Note
          </h2>
          <HtmlBlock html={journal.editorsNote} />
        </div>
      ),
    });
  }

  journal.articles.forEach((article, index) => {
    blocks.push({
      key: `${article.id}-head`,
      keepWithNext: true,
      node: <ArticleHeader article={article} index={index} />,
    });

    photoRows(article.photos).forEach((row, i) => {
      blocks.push({
        key: `${article.id}-row-${i}`,
        node: <PhotoRow photos={row} images={images} />,
      });
    });

    splitHtml(article.content).forEach((html, i) => {
      blocks.push({ key: `${article.id}-c-${i}`, node: <HtmlBlock html={html} /> });
    });

    blocks.push({
      key: `${article.id}-end`,
      node: <div style={{ height: "22px" }} />,
    });
  });

  return blocks;
}