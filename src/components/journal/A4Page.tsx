import type { ReactNode } from "react";

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
   DECORATIVE BACKGROUND
--------------------------------------------------------- */

function JournalBackground() {
  return (
    <>
      {/* Paper */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: COLORS.paper,
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      {/* Large cropped colour field */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: -110,
          right: -130,
          width: 410,
          height: 410,
          background: COLORS.primary,
          borderRadius: "0 0 0 100%",
          opacity: 0.95,
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      {/* Secondary colour field */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: -115,
          bottom: 120,
          width: 260,
          height: 260,
          background: COLORS.secondary,
          borderRadius: "50%",
          opacity: 0.9,
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      {/* Small accent block */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          right: 0,
          bottom: 0,
          width: 150,
          height: 150,
          background: COLORS.accent,
          opacity: 0.95,
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      {/* Small editorial square */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: 38,
          top: 165,
          width: 16,
          height: 16,
          background: COLORS.primary,
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      {/* Vertical editorial line */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: 38,
          top: 190,
          width: 1,
          height: 170,
          background: COLORS.ink,
          opacity: 0.18,
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      {/* Subtle inner frame */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: PAGE_PADDING - 16,
          border: `1px solid ${COLORS.line}`,
          pointerEvents: "none",
          zIndex: 2,
        }}
      />

      {/* Fine diagonal detail */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          right: 50,
          top: 440,
          width: 80,
          height: 1,
          background: COLORS.ink,
          opacity: 0.18,
          transform: "rotate(-35deg)",
          transformOrigin: "right center",
          zIndex: 2,
          pointerEvents: "none",
        }}
      />

      {/* Paper grain */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.12,
          zIndex: 3,
          pointerEvents: "none",
          backgroundImage:
            "radial-gradient(rgba(40,35,25,0.35) 0.45px, transparent 0.6px)",
          backgroundSize: "6px 6px",
        }}
      />
    </>
  );
}

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
      <JournalBackground />

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