import { createFileRoute, Link } from "@tanstack/react-router";
import { Printer } from "lucide-react";

import { FlipbookViewer } from "@/components/journal/FlipbookViewer";
import { useJournalPages } from "@/components/journal/JournalRenderer";
import { Button } from "@/components/ui/button";
import { useJournal } from "@/lib/store";

export const Route = createFileRoute("/journal/$id/flipbook")({
  head: () => ({
    meta: [
      { title: "Flipbook — Jeevana E-Journal" },
      { name: "description", content: "Read the finished journal as a digital flipbook, page by page." },
      { property: "og:title", content: "Flipbook — Jeevana E-Journal" },
      { property: "og:description", content: "Digital flipbook viewer for the school journal." },
    ],
  }),
  component: FlipbookRoute,
});

function FlipbookRoute() {
  const { id } = Route.useParams();
  const { journal, loading } = useJournal(id);
  const { pages, ready, measurer } = useJournalPages(journal);

  if (loading) return <p className="p-10 text-sm text-muted-foreground">Loading…</p>;
  if (!journal) return <p className="p-10 text-sm text-muted-foreground">Journal not found.</p>;

  return (
    <div className="flex h-screen flex-col">
      {measurer}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background px-4 py-3">
        <div className="flex items-center gap-3">
          <Link to="/journal/$id" params={{ id }} className="text-sm text-muted-foreground hover:underline">
            ← Editor
          </Link>
          <h1 className="text-sm font-medium">
            {journal.title} — {journal.month} {journal.year}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link to="/journal/$id/preview" params={{ id }}>
              A4 Preview
            </Link>
          </Button>
          <Button size="sm" variant="outline" onClick={() => window.print()} disabled={!ready}>
            <Printer className="mr-1 h-4 w-4" /> Print
          </Button>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        {ready ? (
          <FlipbookViewer journal={journal} pages={pages} />
        ) : (
          <p className="p-10 text-center text-sm text-muted-foreground">Generating pages…</p>
        )}
      </div>
    </div>
  );
}
