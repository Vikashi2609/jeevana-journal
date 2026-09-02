import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Printer } from "lucide-react";

import FlipbookViewer from "@/components/journal/FlipbookViewer";
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
          <Link to="/journal/`$id" params={{ id }} className="text-sm text-muted-foreground hover:underline">
            <ArrowLeft size={14} className="mr-1 inline" />
            Back to journal
          </Link>
        </div>
        <h1 className="text-sm font-semibold">{journal.title} — Flipbook</h1>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer size={14} className="mr-1" />
          Print
        </Button>
      </div>
      <div className="min-h-0 flex-1">
        {ready ? (
          <FlipbookViewer journalPages={pages} />
        ) : (
          <p className="p-10 text-center text-sm text-muted-foreground">Generating pages…</p>
        )}
      </div>
    </div>
  );
}