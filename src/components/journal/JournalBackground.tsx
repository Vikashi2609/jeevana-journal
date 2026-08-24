/* ---------------------------------------------------------
   JEEVANA JOURNAL — EDITORIAL BACKGROUND SYSTEM
   Flat, art-directed A4 compositions.
   Palette system and composition system are independent.
--------------------------------------------------------- */

export type JournalPalette =
  | "terra"
  | "botanical"
  | "coastal"
  | "bloom"
  | "sunlit";

export type JournalBackgroundProps = {
  pageNumber: number;
  palette?: JournalPalette;
  variant?: "editorial";
};

const PAPER = "#F6F1E7";

type Ink = {
  paper: string;
  c1: string; // dominant field
  c2: string; // secondary field
  c3: string; // accent
  ink: string;
};

const PALETTES: Record<JournalPalette, Ink> = {
  terra: {
    paper: PAPER,
    c1: "#B9563C", // terracotta
    c2: "#D9A441", // mustard
    c3: "#6B7B4F", // olive
    ink: "#2B2721",
  },
  botanical: {
    paper: "#F3F2E8",
    c1: "#7B8C63", // sage
    c2: "#C98B2E", // ochre
    c3: "#B9563C", // terracotta
    ink: "#272B24",
  },
  coastal: {
    paper: "#EFF2F1",
    c1: "#1E4C63", // deep blue
    c2: "#3E8C8A", // teal
    c3: "#E2705A", // coral
    ink: "#22303А".replace("А", "A"),
  },
  bloom: {
    paper: "#F6EFF1",
    c1: "#6E3A5B", // plum
    c2: "#E2705A", // coral
    c3: "#D4A439", // gold
    ink: "#2E2530",
  },
  sunlit: {
    paper: "#F8F2E4",
    c1: "#C98B2E", // ochre
    c2: "#D2513A", // tomato
    c3: "#5E7A46", // leaf
    ink: "#2A2720",
  },
};

const W = 794;
const H = 1123;

/* ---------------------------------------------------------
   COMPOSITIONS — flat geometry, generous negative space
--------------------------------------------------------- */

function Composition0(c: Ink) {
  // Large field entering top-right, tiny left accent, low colour strip
  return (
    <>
      <path d={`M ${W} 0 L ${W} 372 L 322 0 Z`} fill={c.c1} />
      <rect x={0} y={0} width={W} height={0} fill="none" />
      <rect x={64} y={286} width={26} height={26} fill={c.c3} />
      <rect x={64} y={1006} width={318} height={10} fill={c.c2} />
    </>
  );
}

function Composition1(c: Ink) {
  // Strong vertical field left, mid rectangular field, tiny accent
  return (
    <>
      <rect x={0} y={0} width={104} height={H} fill={c.c1} />
      <rect x={452} y={392} width={342} height={286} fill={c.c2} />
      <rect x={452} y={716} width={54} height={6} fill={c.c3} />
    </>
  );
}

function Composition2(c: Ink) {
  // Horizontal band, top-right geometric element, narrow lower accent
  return (
    <>
      <rect x={0} y={210} width={W} height={92} fill={c.c1} />
      <path d={`M ${W} 0 L ${W} 150 L 644 0 Z`} fill={c.c2} />
      <rect x={72} y={962} width={190} height={8} fill={c.c3} />
    </>
  );
}

function Composition3(c: Ink) {
  // Quietest: one large flat block on one side
  return (
    <>
      <rect x={W - 232} y={0} width={232} height={604} fill={c.c1} />
      <rect x={72} y={1044} width={64} height={6} fill={c.c3} />
    </>
  );
}

function Composition4(c: Ink) {
  // Asymmetric diagonal conversation: top-left to bottom-right
  return (
    <>
      <path d={`M 0 0 L 396 0 L 0 322 Z`} fill={c.c1} />
      <rect x={0} y={296} width={168} height={16} fill={c.c2} />
      <rect x={470} y={834} width={324} height={289} fill={c.c2} />
      <rect x={470} y={834} width={112} height={112} fill={c.c3} />
    </>
  );
}

function Composition5(c: Ink) {
  // Backing frame for a photograph / feature, two restrained accents
  return (
    <>
      <rect x={108} y={196} width={620} height={520} fill={c.c1} opacity={0.16} />
      <rect x={108} y={196} width={620} height={14} fill={c.c1} />
      <rect x={694} y={196} width={34} height={220} fill={c.c2} />
      <rect x={108} y={1000} width={130} height={6} fill={c.c3} />
    </>
  );
}

const COMPOSITIONS = [
  Composition0,
  Composition1,
  Composition2,
  Composition3,
  Composition4,
  Composition5,
];

export function JournalBackground({
  pageNumber,
  palette = "terra",
}: JournalBackgroundProps) {
  const colors = PALETTES[palette] ?? PALETTES.terra;
  const composition = (Math.max(1, pageNumber) - 1) % 6;
  const Shape = COMPOSITIONS[composition]!;

  return (
    <svg
      aria-hidden
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      <rect x={0} y={0} width={W} height={H} fill={colors.paper} />
      {Shape(colors)}
    </svg>
  );
}

export default JournalBackground;
