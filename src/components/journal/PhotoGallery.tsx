import type { Photo } from "@/lib/types";

/** Groups photos into rows: 1 / 2 / 3 across, with 4 = 3 + 1 wide. */
export function photoRows(photos: Photo[]): Photo[][] {
  const n = photos.length;
  if (n === 0) return [];
  if (n <= 3) return [photos];
  if (n === 4) return [photos.slice(0, 3), photos.slice(3)];
  const rows: Photo[][] = [];
  for (let i = 0; i < n; i += 3) rows.push(photos.slice(i, i + 3));
  return rows;
}

export function PhotoRow({ photos, images }: { photos: Photo[]; images: Record<string, string> }) {
  const cols = photos.length;
  return (
    <div className="jr-photo-row" style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
      {photos.map((p) => (
        <figure key={p.id} style={{ flex: `1 1 0`, margin: 0, minWidth: 0 }}>
          <img
            src={images[p.id]}
            alt={p.name}
            style={{
              display: "block",
              width: "100%",
              height: "auto",
              maxHeight: cols === 1 ? "360px" : cols === 2 ? "260px" : "190px",
              objectFit: "contain",
              border: "1px solid #d6d3cd",
              background: "#fff",
            }}
          />
        </figure>
      ))}
    </div>
  );
}