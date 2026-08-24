import type { ReactNode } from "react";
import {
  JournalBackground,
  type JournalPalette,
} from "./JournalBackground";

export const PAGE_W = 794; // A4 portrait @96dpi
export const PAGE_H = 1123;
export const PAGE_PADDING = 48;
export const HEADER_H = 46;
export const FOOTER_H = 34;
export const CONTENT_W = PAGE_W - PAGE_PADDING * 2;
export const CONTENT_H = PAGE_H - PAGE_PADDING * 2 - HEADER_H - FOOTER_H;

interface Props {
  children: ReactNode;
  journalTitle: string;
  period: string;
  pageNumber: number;
  totalPages: number;
  bare?: boolean | undefined;
  palette?: JournalPalette | undefined;
}

/* ---------------------------------------------------------
   JEEVANA JOURNAL COLOUR SYSTEM
--------------------------------------------------------- */

const COLORS = {
  paper: "#F7F1E7",
  primary: "#C45E46",
  secondary: "#D9A441",
  accent: "#647A61",
  ink: "#292722",
  muted: "#6D665B",
  line: "#CFC5B6",
};


/* ---------------------------------------------------------
   A4 PAGE
--------------------------------------------------------- */

export function A4Page({
  children,
  journalTitle,
  period,
  pageNumber,
  totalPages,
  bare,
  palette,
}: Props) {
  return (
    <div
      className="a4-page"
      style={{
        width: `${PAGE_W}px`,
        height: `${PAGE_H}px`,
        background: COLORS.paper,
        color: COLORS.ink,
        padding: `${PAGE_PADDING}px`,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        fontFamily: 'Georgia, "Times New Roman", serif',
        position: "relative",
        overflow: "hidden",
        isolation: "isolate",
      }}
    >
      {/* Background sits behind everything */}
      <JournalBackground pageNumber={pageNumber} palette={palette} />

      {/* Header */}
      {!bare && (
        <header
          style={{
            height: `${HEADER_H}px`,
            borderBottom: `1px solid ${COLORS.line}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "11px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: COLORS.muted,
            flex: "0 0 auto",
            position: "relative",
            zIndex: 5,
          }}
        >
          <span>{journalTitle}</span>

          <span
            style={{
              color: COLORS.primary,
              fontWeight: 600,
            }}
          >
            {period}
          </span>
        </header>
      )}

      {/* Content */}
      <div
        style={{
          flex: "1 1 auto",
          paddingTop: bare ? 0 : "14px",
          overflow: "hidden",
          minHeight: 0,
          position: "relative",
          zIndex: 5,
        }}
      >
        {children}
      </div>

      {/* Footer */}
      {!bare && (
        <footer
          style={{
            height: `${FOOTER_H}px`,
            borderTop: `1px solid ${COLORS.line}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "11px",
            color: COLORS.muted,
            flex: "0 0 auto",
            position: "relative",
            zIndex: 5,
          }}
        >
          <span>{journalTitle}</span>

          <span
            style={{
              color: COLORS.primary,
              fontWeight: 600,
            }}
          >
            Page {pageNumber} of {totalPages}
          </span>
        </footer>
      )}
    </div>
  );
}