import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpenCheck, Printer } from "lucide-react";

import { JournalPages, useJournalPages } from "@/components/journal/JournalRenderer";
import { PageStage } from "@/components/journal/PageStage";
import { Button } from "@/components/ui/button";
import { useJournal } from "@/lib/store";

export const Route = createFileRoute("/journal/$id/preview")({
  head: () => ({
    meta: [
      { title: "A4 Preview — Jeevana E-Journal" },
      { name: "description", content: "See the exact A4 pages of the journal before printing or exporting to PDF." },
      { property: "og:title", content: "A4 Preview — Jeevana E-Journal" },
      { property: "og:description", content: "Print-accurate A4 preview of the journal." },
    ],
  }),
  component: PreviewPage,
});

function PreviewPage() {
  const { id } = Route.useParams();
  const { journal, loading } = useJournal(id);
  const { pages, ready, measurer } = useJournalPages(journal);

  if (loading) return <p className="p-10 text-sm text-muted-foreground">Loading…</p>;
  if (!journal) return <p className="p-10 text-sm text-muted-foreground">Journal not found.</p>;

  return (
    <div className="min-h-screen bg-neutral-200">
      {measurer}
      <div className="no-print sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background px-4 py-3">
        <div className="flex items-center gap-3">
          <Link to="/journal/$id" params={{ id }} className="text-sm text-muted-foreground hover:underline">
            ← Editor
          </Link>
          <h1 className="text-sm font-medium">
            {journal.title} — {journal.month} {journal.year}
          </h1>
          <span className="text-xs text-muted-foreground">{ready ? `${pages.length} pages` : "Laying out…"}</span>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link to="/journal/$id/flipbook" params={{ id }}>
              <BookOpenCheck className="mr-1 h-4 w-4" /> Flipbook
            </Link>
          </Button>
          <Button size="sm" onClick={() => window.print()} disabled={!ready}>
            <Printer className="mr-1 h-4 w-4" /> Print / Export PDF
          </Button>
        </div>
      </div>

      <div className="py-8">
        {!ready ? (
          <p className="text-center text-sm text-muted-foreground">Generating A4 pages…</p>
        ) : (
          <div className="print-root">
            <PageStage>
              <JournalPages journal={journal} pages={pages} />
            </PageStage>
          </div>
        )}
      </div>
    </div>
  );
}
