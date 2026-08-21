import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpenCheck, Eye, GripVertical, Pencil, Plus, Settings, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useJournal } from "@/lib/store";
import { emptyArticle, estimateArticlePages } from "@/lib/types";

export const Route = createFileRoute("/journal/$id/")({
  head: () => ({
    meta: [
      { title: "Journal Editor — Jeevana E-Journal" },
      { name: "description", content: "Add, edit and reorder the articles that make up this journal issue." },
      { property: "og:title", content: "Journal Editor — Jeevana E-Journal" },
      { property: "og:description", content: "Manage the articles of your school journal issue." },
    ],
  }),
  component: JournalEditor,
});

function JournalEditor() {
  const { id } = Route.useParams();
  const { journal, loading, status, update } = useJournal(id);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  if (loading) return <p className="p-10 text-sm text-muted-foreground">Loading…</p>;
  if (!journal)
    return (
      <div className="p-10">
        <p className="text-sm text-muted-foreground">Journal not found.</p>
        <Link to="/" className="text-sm underline">
          Back to dashboard
        </Link>
      </div>
    );

  const move = (from: number, to: number) => {
    if (from === to || to < 0 || to >= journal.articles.length) return;
    update((j) => {
      const articles = [...j.articles];
      const [item] = articles.splice(from, 1);
      articles.splice(to, 0, item!);
      return { ...j, articles };
    });
  };

  const addArticle = () => update((j) => ({ ...j, articles: [...j.articles, emptyArticle()] }));

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <Link to="/" className="text-sm text-muted-foreground hover:underline">
        ← Dashboard
      </Link>

      <header className="mt-4 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{journal.title}</h1>
          <p className="text-sm text-muted-foreground">
            {journal.month} {journal.year} · {journal.articles.length} article
            {journal.articles.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="self-center text-xs text-muted-foreground">
            {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : ""}
          </span>
          <Button variant="outline" size="sm" asChild>
            <Link to="/journal/$id/settings" params={{ id }}>
              <Settings className="mr-1 h-4 w-4" /> Journal settings
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/journal/$id/preview" params={{ id }}>
              <Eye className="mr-1 h-4 w-4" /> Preview Journal
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/journal/$id/flipbook" params={{ id }}>
              <BookOpenCheck className="mr-1 h-4 w-4" /> Flipbook
            </Link>
          </Button>
        </div>
      </header>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Articles</h2>
          <Button size="sm" onClick={addArticle}>
            <Plus className="mr-1 h-4 w-4" /> Add Article
          </Button>
        </div>

        {journal.articles.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No articles yet. Add your first article to begin.
          </div>
        ) : (
          <ul className="space-y-2">
            {journal.articles.map((article, i) => (
              <li
                key={article.id}
                draggable
                onDragStart={() => setDragIndex(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragIndex !== null) move(dragIndex, i);
                  setDragIndex(null);
                }}
                className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-card p-3"
              >
                <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground" />
                <span className="w-6 text-sm text-muted-foreground">{i + 1}.</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{article.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {[article.category, article.className].filter(Boolean).join(" · ") || "No category"} ·{" "}
                    {article.photos.length} photo{article.photos.length === 1 ? "" : "s"} · ~
                    {estimateArticlePages(article)} page{estimateArticlePages(article) === 1 ? "" : "s"}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/journal/$id/article/$articleId" params={{ id, articleId: article.id }}>
                      <Pencil className="mr-1 h-4 w-4" /> Edit
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (confirm(`Delete article "${article.title}"?`))
                        update((j) => ({ ...j, articles: j.articles.filter((a) => a.id !== article.id) }));
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
