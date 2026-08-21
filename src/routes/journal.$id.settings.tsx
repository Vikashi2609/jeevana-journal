import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { putImage } from "@/lib/db";
import { useImages, useJournal } from "@/lib/store";
import { MONTHS, uid } from "@/lib/types";

export const Route = createFileRoute("/journal/$id/settings")({
  head: () => ({
    meta: [
      { title: "Journal Settings — Jeevana E-Journal" },
      { name: "description", content: "Edit the title, month, year, cover image and editor's note of the journal." },
      { property: "og:title", content: "Journal Settings — Jeevana E-Journal" },
      { property: "og:description", content: "Edit journal details and cover." },
    ],
  }),
  component: JournalSettings,
});

function JournalSettings() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { journal, loading, status, update } = useJournal(id);
  const { images } = useImages(journal?.coverImageId ? [journal.coverImageId] : []);

  if (loading) return <p className="p-10 text-sm text-muted-foreground">Loading…</p>;
  if (!journal) return <p className="p-10 text-sm text-muted-foreground">Journal not found.</p>;

  const onCover = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const imgId = uid("img");
      await putImage(imgId, String(reader.result));
      update((j) => ({ ...j, coverImageId: imgId }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <Link to="/journal/$id" params={{ id }} className="text-sm text-muted-foreground hover:underline">
        ← Back to journal
      </Link>
      <div className="mt-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Journal Settings</h1>
        <span className="text-xs text-muted-foreground">{status === "saving" ? "Saving…" : status === "saved" ? "Saved" : ""}</span>
      </div>

      <div className="mt-8 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={journal.title} onChange={(e) => update((j) => ({ ...j, title: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="subtitle">Subtitle</Label>
          <Input
            id="subtitle"
            value={journal.subtitle ?? ""}
            onChange={(e) => update((j) => ({ ...j, subtitle: e.target.value }))}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="month">Month</Label>
            <select
              id="month"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={journal.month}
              onChange={(e) => update((j) => ({ ...j, month: e.target.value }))}
            >
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="year">Year</Label>
            <Input
              id="year"
              type="number"
              value={journal.year}
              onChange={(e) => update((j) => ({ ...j, year: Number(e.target.value) || j.year }))}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="cover">Cover image</Label>
          <Input id="cover" type="file" accept="image/*" onChange={(e) => onCover(e.target.files?.[0])} />
          {journal.coverImageId && images[journal.coverImageId] && (
            <img
              src={images[journal.coverImageId]}
              alt="Cover"
              className="mt-2 max-h-60 w-auto border border-border"
            />
          )}
        </div>
        <div className="space-y-2">
          <Label>Editor&apos;s note</Label>
          <RichTextEditor
            key={journal.id}
            value={journal.editorsNote ?? "<p></p>"}
            onChange={(html) => update((j) => ({ ...j, editorsNote: html }))}
            minHeight={180}
          />
        </div>
        <Button onClick={() => void navigate({ to: "/journal/$id", params: { id } })}>Done</Button>
      </div>
    </main>
  );
}
