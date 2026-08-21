import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { PhotoUploader } from "@/components/editor/PhotoUploader";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { JournalPages, useJournalPages } from "@/components/journal/JournalRenderer";
import { PageStage } from "@/components/journal/PageStage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useJournal } from "@/lib/store";
import type { Article, Journal } from "@/lib/types";

export const Route = createFileRoute("/journal/$id/article/$articleId")({
  head: () => ({
    meta: [
      { title: "Article Editor — Jeevana E-Journal" },
      { name: "description", content: "Write the article, add photos and preview how it flows across A4 pages." },
      { property: "og:title", content: "Article Editor — Jeevana E-Journal" },
      { property: "og:description", content: "Write articles and add photos to the school journal." },
    ],
  }),
  component: ArticleEditor,
});

function ArticleEditor() {
  const { id, articleId } = Route.useParams();
  const { journal, loading, status, update } = useJournal(id);
  const [showPreview, setShowPreview] = useState(false);

  const article = journal?.articles.find((a) => a.id === articleId);

  const patch = (changes: Partial<Article>) =>
    update((j) => ({
      ...j,
      articles: j.articles.map((a) => (a.id === articleId ? { ...a, ...changes } : a)),
    }));

  if (loading) return <p className="p-10 text-sm text-muted-foreground">Loading…</p>;
  if (!journal || !article) return <p className="p-10 text-sm text-muted-foreground">Article not found.</p>;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <Link to="/journal/$id" params={{ id }} className="text-sm text-muted-foreground hover:underline">
        ← Back to journal
      </Link>

      <header className="mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Article Editor</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : ""}
          </span>
          <Button size="sm" variant="outline" onClick={() => setShowPreview((v) => !v)}>
            {showPreview ? "Hide preview" : "Preview"}
          </Button>
        </div>
      </header>

      <div className="mt-6 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="topic">Topic / Title</Label>
          <Input id="topic" value={article.title} onChange={(e) => patch({ title: e.target.value })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input id="category" value={article.category} onChange={(e) => patch({ category: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="class">Class</Label>
            <Input id="class" value={article.className} onChange={(e) => patch({ className: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input id="date" value={article.date} onChange={(e) => patch({ date: e.target.value })} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Photos</Label>
          <PhotoUploader photos={article.photos} onChange={(photos) => patch({ photos })} />
        </div>

        <div className="space-y-2">
          <Label>Content</Label>
          <RichTextEditor key={article.id} value={article.content} onChange={(content) => patch({ content })} />
        </div>
      </div>

      {showPreview && <ArticlePreview journal={journal} article={article} />}
    </main>
  );
}

function ArticlePreview({ journal, article }: { journal: Journal; article: Article }) {
  const single: Journal = { ...journal, editorsNote: "", articles: [article] };
  const { pages, ready, measurer } = useJournalPages(single);
  const withoutCover = pages.slice(1);

  return (
    <section className="mt-8">
      {measurer}
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        A4 preview {ready ? `(${withoutCover.length} page${withoutCover.length === 1 ? "" : "s"})` : ""}
      </h2>
      <div className="rounded-md bg-neutral-200 py-6">
        {ready ? (
          <PageStage>
            <JournalPages journal={single} pages={withoutCover} />
          </PageStage>
        ) : (
          <p className="text-center text-sm text-muted-foreground">Laying out…</p>
        )}
      </div>
    </section>
  );
}
