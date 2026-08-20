import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { BookOpen, Eye, FilePlus2, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { useJournals } from "@/lib/store";
import { estimateArticlePages, type Journal } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Jeevana E-Journal — School Journal Builder" },
      {
        name: "description",
        content:
          "Create, edit and preview school journals as printable A4 pages, with a flipbook viewer and PDF export.",
      },
      { property: "og:title", content: "Jeevana E-Journal — School Journal Builder" },
      {
        property: "og:description",
        content: "Build professionally formatted school journals with reliable A4 pagination.",
      },
    ],
  }),
  component: Dashboard,
});

function JournalCard({ journal, onDelete }: { journal: Journal; onDelete: (id: string) => void }) {
  const pages = journal.articles.reduce((sum, a) => sum + estimateArticlePages(a), 1);
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">{journal.title}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {journal.month} {journal.year}
        </p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between gap-4">
        <dl className="space-y-1 text-sm text-muted-foreground">
          <div>Articles: {journal.articles.length}</div>
          <div>Approx. pages: {pages}</div>
          <div>Modified: {formatDate(journal.updatedAt)}</div>
        </dl>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link to="/journal/$id" params={{ id: journal.id }}>
              <BookOpen className="mr-1 h-4 w-4" /> Open
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/journal/$id/settings" params={{ id: journal.id }}>
              <Pencil className="mr-1 h-4 w-4" /> Edit
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/journal/$id/preview" params={{ id: journal.id }}>
              <Eye className="mr-1 h-4 w-4" /> Preview
            </Link>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (confirm(`Delete "${journal.title}"? This cannot be undone.`)) onDelete(journal.id);
            }}
          >
            <Trash2 className="mr-1 h-4 w-4" /> Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const { journals, remove } = useJournals();
  const navigate = useNavigate();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Jeevana E-Journal</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create, edit and publish your school journal as printable A4 pages.
          </p>
        </div>
        <Button onClick={() => navigate({ to: "/journal/new" })}>
          <FilePlus2 className="mr-2 h-4 w-4" /> New Journal
        </Button>
      </header>

      {journals === null && <p className="text-sm text-muted-foreground">Loading journals…</p>}

      {journals !== null && journals.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <h2 className="text-lg font-medium">No journals yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Start by creating your first journal issue.
          </p>
          <Button className="mt-6" onClick={() => navigate({ to: "/journal/new" })}>
            <FilePlus2 className="mr-2 h-4 w-4" /> New Journal
          </Button>
        </div>
      )}

      {journals !== null && journals.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {journals.map((j) => (
            <JournalCard key={j.id} journal={j} onDelete={(id) => void remove(id)} />
          ))}
        </div>
      )}
    </main>
  );
}