import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { putImage, saveJournal } from "@/lib/db";
import { MONTHS, uid, type Journal } from "@/lib/types";

export const Route = createFileRoute("/journal/new")({
  head: () => ({
    meta: [
      { title: "New Journal — Jeevana E-Journal" },
      { name: "description", content: "Create a new school journal issue with title, month, year and cover." },
      { property: "og:title", content: "New Journal — Jeevana E-Journal" },
      { property: "og:description", content: "Create a new school journal issue." },
    ],
  }),
  component: NewJournal,
});

function NewJournal() {
  const navigate = useNavigate();
  const now = new Date();
  const [title, setTitle] = useState("Jeevana Journal");
  const [subtitle, setSubtitle] = useState("");
  const [month, setMonth] = useState(MONTHS[now.getMonth()]!);
  const [year, setYear] = useState(now.getFullYear());
  const [note, setNote] = useState("<p></p>");
  const [coverId, setCoverId] = useState<string | undefined>(undefined);
  const [coverPreview, setCoverPreview] = useState<string | undefined>(undefined);

  const onCover = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const id = uid("img");
      await putImage(id, String(reader.result));
      setCoverId(id);
      setCoverPreview(String(reader.result));
    };
    reader.readAsDataURL(file);
  };

  const create = async () => {
    const journal: Journal = {
      id: uid("jrn"),
      title: title.trim() || "Untitled Journal",
      month,
      year,
      articles: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...(subtitle.trim() ? { subtitle: subtitle.trim() } : {}),
      ...(coverId ? { coverImageId: coverId } : {}),
      ...(note.replace(/<[^>]+>/g, "").trim() ? { editorsNote: note } : {}),
    };
    await saveJournal(journal);
    void navigate({ to: "/journal/$id", params: { id: journal.id } });
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <Link to="/" className="text-sm text-muted-foreground hover:underline">
        ← Back to dashboard
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">Create Journal</h1>

      <div className="mt-8 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Journal title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="subtitle">Subtitle (optional)</Label>
          <Input id="subtitle" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="month">Month</Label>
            <select
              id="month"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
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
              value={year}
              onChange={(e) => setYear(Number(e.target.value) || now.getFullYear())}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="cover">Cover image (optional)</Label>
          <Input id="cover" type="file" accept="image/*" onChange={(e) => onCover(e.target.files?.[0])} />
          {coverPreview && (
            <img src={coverPreview} alt="Cover preview" className="mt-2 max-h-56 w-auto border border-border" />
          )}
        </div>
        <div className="space-y-2">
          <Label>Editor&apos;s note (optional)</Label>
          <RichTextEditor value={note} onChange={setNote} minHeight={160} />
        </div>
        <div className="flex gap-2">
          <Button onClick={() => void create()}>Create journal</Button>
          <Button variant="outline" asChild>
            <Link to="/">Cancel</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
