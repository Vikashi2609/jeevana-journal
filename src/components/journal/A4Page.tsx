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
  bare?: boolean; // cover page: no header/footer
}

export function A4Page({ children, journalTitle, period, pageNumber, totalPages, bare }: Props) {
  return (
    <div
      className="a4-page"
      style={{
        width: `${PAGE_W}px`,
        height: `${PAGE_H}px`,
        background: "#fff",
        color: "#1a1a1a",
        padding: `${PAGE_PADDING}px`,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        fontFamily: 'Georgia, "Times New Roman", serif',
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: `${PAGE_PADDING - 16}px`,
          border: "1px solid #b9b3a7",
          pointerEvents: "none",
        }}
      />
      {!bare && (
        <header
          style={{
            height: `${HEADER_H}px`,
            borderBottom: "1px solid #c9c3b7",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "11px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#5a5449",
            flex: "0 0 auto",
          }}
        >
          <span>{journalTitle}</span>
          <span>{period}</span>
        </header>
      )}
      <div
        style={{
          flex: "1 1 auto",
          paddingTop: bare ? 0 : "14px",
          overflow: "visible",
        }}
      >
        {children}
      </div>
      {!bare && (
        <footer
          style={{
            height: `${FOOTER_H}px`,
            borderTop: "1px solid #c9c3b7",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "11px",
            color: "#5a5449",
            flex: "0 0 auto",
          }}
        >
          <span>{journalTitle}</span>
          <span>
            Page {pageNumber} of {totalPages}
          </span>
        </footer>
      )}
    </div>
  );
}