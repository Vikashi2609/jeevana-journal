import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { BookOpen, Eye, FilePlus2, Pencil, Trash2, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { useJournals } from "@/lib/store";
import { estimateArticlePages, type Journal } from "@/lib/types";

export const Route = createFileRoute("/editor")({
  head: () => ({
    meta: [{ title: "Jeevana E-Journal — Editor Admin" }],
  }),
  component: EditorGuard,
});

function EditorGuard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (sessionStorage.getItem("editor_auth") === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = import.meta.env.VITE_EDITOR_PASSWORD || "vikashi@2000";

    if (password === correctPassword) {
      sessionStorage.setItem("editor_auth", "true");
      setIsAuthenticated(true);
      setError("");
    } else {
      setError("Incorrect password");
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="flex min-h-[80vh] items-center justify-center px-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl">Admin Access</CardTitle>
            <p className="text-sm text-muted-foreground">Enter password to manage journals</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="text"
                name="username"
                value="admin"
                autoComplete="username"
                readOnly
                className="hidden"
              />
              <input
                type="password"
                placeholder="Password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                autoFocus
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
              <Button type="submit" className="w-full">
                Unlock Editor
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  return <Dashboard />;
}

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
          <h1 className="text-3xl font-semibold tracking-tight">Jeevana E-Journal Admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create, edit and manage school journal issues.
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