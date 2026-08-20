import { ImagePlus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { putImage } from "@/lib/db";
import { useImages } from "@/lib/store";
import { uid, type Photo } from "@/lib/types";

interface Props {
  photos: Photo[];
  onChange: (photos: Photo[]) => void;
}

function readFile(file: File): Promise<{ dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const dataUrl = String(reader.result);
      const img = new Image();
      img.onload = () => resolve({ dataUrl, width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => resolve({ dataUrl, width: 0, height: 0 });
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export function PhotoUploader({ photos, onChange }: Props) {
  const input = useRef<HTMLInputElement | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const { images } = useImages(photos.map((p) => p.id));

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const added: Photo[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      const { dataUrl, width, height } = await readFile(file);
      const id = uid("img");
      await putImage(id, dataUrl);
      added.push({ id, name: file.name, width, height });
    }
    if (added.length) onChange([...photos, ...added]);
    if (input.current) input.current.value = "";
  };

  const move = (from: number, to: number) => {
    if (from === to) return;
    const next = [...photos];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item!);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => input.current?.click()}>
          <ImagePlus className="mr-2 h-4 w-4" /> Add photos
        </Button>
        <span className="text-xs text-muted-foreground">
          {photos.length} photo{photos.length === 1 ? "" : "s"} · drag thumbnails to reorder
        </span>
        <input
          ref={input}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => void handleFiles(e.target.files)}
        />
      </div>
      {photos.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((p, i) => (
            <li
              key={p.id}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null) move(dragIndex, i);
                setDragIndex(null);
              }}
              className="group relative rounded-md border border-border bg-card p-2"
            >
              <img
                src={images[p.id]}
                alt={p.name}
                className="h-28 w-full object-contain"
                draggable={false}
              />
              <div className="mt-1 flex items-center justify-between gap-1">
                <span className="truncate text-xs text-muted-foreground">{i + 1}. {p.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onChange(photos.filter((x) => x.id !== p.id))}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}