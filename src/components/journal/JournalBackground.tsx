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
  palette?: JournalPalette | undefined;
  variant?: "editorial" | undefined;
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
    ink: "#22303A",
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

/* The live text column occupies roughly x 40–754, y 86–1050.
   Compositions work the full-bleed margin ring and the page edges,
   so artwork frames the typography instead of sitting under it. */

function Composition0(c: Ink) {
  // Dominant field entering from the top-right, tiny left accent, low strip
  return (
    <>
      <path d={`M ${W} 0 L ${W} 470 L 748 470 L 748 0 Z`} fill={c.c1} />
      <path d={`M 748 0 L 748 96 L 596 0 Z`} fill={c.c1} />
      <rect x={12} y={300} width={16} height={16} fill={c.c3} />
      <rect x={0} y={1099} width={286} height={24} fill={c.c2} />
    </>
  );
}

function Composition1(c: Ink) {
  // Strong vertical field along the left, secondary field at mid-right
  return (
    <>
      <rect x={0} y={0} width={30} height={H} fill={c.c1} />
      <rect x={0} y={0} width={214} height={30} fill={c.c1} />
      <rect x={758} y={352} width={36} height={330} fill={c.c2} />
      <rect x={758} y={706} width={36} height={36} fill={c.c3} />
    </>
  );
}

function Composition2(c: Ink) {
  // Horizontal band across the top, small top-right element, lower accent
  return (
    <>
      <rect x={0} y={0} width={W} height={22} fill={c.c1} />
      <rect x={640} y={22} width={154} height={44} fill={c.c2} />
      <rect x={400} y={1105} width={394} height={18} fill={c.c3} />
    </>
  );
}

function Composition3(c: Ink) {
  // The quietest page: one large flat block, otherwise untouched paper
  return (
    <>
      <rect x={762} y={0} width={32} height={640} fill={c.c1} />
      <rect x={40} y={1113} width={72} height={10} fill={c.c3} />
    </>
  );
}

function Composition4(c: Ink) {
  // Asymmetric: an L anchored top-left answered by mass at bottom-right
  return (
    <>
      <rect x={0} y={0} width={26} height={430} fill={c.c1} />
      <rect x={0} y={0} width={318} height={26} fill={c.c1} />
      <rect x={768} y={742} width={26} height={381} fill={c.c2} />
      <rect x={520} y={1097} width={274} height={26} fill={c.c2} />
      <rect x={470} y={1097} width={26} height={26} fill={c.c3} />
    </>
  );
}

function Composition5(c: Ink) {
  // A restrained backing area for a photograph or feature opening
  return (
    <>
      <rect x={0} y={150} width={34} height={620} fill={c.c1} />
      <rect x={760} y={250} width={34} height={300} fill={c.c2} />
      <rect x={760} y={574} width={34} height={14} fill={c.c3} />
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
