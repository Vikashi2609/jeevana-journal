/**
 * TEMPORARY TEST ROUTE — isolated proof that the current colourful Journal
 * UI can read the EXISTING Supabase journal_entries table and render its
 * content/images. Nothing here touches the local IndexedDB journals, the
 * editor, or any other route.
 *
 * Visit: /supabase-test
 */
import { createFileRoute, Link } from "@tanstack/react-router";

import { JournalPages, useJournalPages } from "@/components/journal/JournalRenderer";
import { PageStage } from "@/components/journal/PageStage";
import { useSupabaseJournal } from "@/lib/legacyJournal";
import { supabaseConfigured } from "@/lib/supabase";

export const Route = createFileRoute("/supabase-test")({
  head: () => ({
    meta: [{ title: "Supabase Connection Test — Jeevana Journal" }],
  }),
  component: SupabaseTestPage,
});

function SupabaseTestPage() {
  const { journal, images, loading, error, rowCount } = useSupabaseJournal();
  const { pages, ready, measurer } = useJournalPages(journal, images);

  return (
    <div className="min-h-screen bg-neutral-200">
      {measurer}
      <div className="no-print sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background px-4 py-3">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-sm text-muted-foreground hover:underline">
            ← Dashboard
          </Link>
          <h1 className="text-sm font-medium">Supabase connection test (temporary)</h1>
        </div>
        <div className="text-xs text-muted-foreground">
          {!supabaseConfigured
            ? "Not configured"
            : loading
              ? "Loading from Supabase…"
              : error
                ? "Error"
                : `${rowCount} row(s) · ${ready ? `${pages.length} pages` : "laying out…"}`}
        </div>
      </div>

      <div className="py-8">
        {!supabaseConfigured && (
          <StatusMessage
            title="Supabase is not configured"
            detail="Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (see .env.local.example) and restart the dev server."
          />
        )}

        {supabaseConfigured && loading && (
          <p className="text-center text-sm text-muted-foreground">Connecting to Supabase…</p>
        )}

        {supabaseConfigured && !loading && error && (
          <StatusMessage title="Couldn't load journal_entries" detail={error} />
        )}

        {supabaseConfigured && !loading && !error && journal && !ready && (
          <p className="text-center text-sm text-muted-foreground">Generating A4 pages…</p>
        )}

        {supabaseConfigured && !loading && !error && journal && ready && (
          <PageStage>
            <JournalPages journal={journal} pages={pages} />
          </PageStage>
        )}
      </div>
    </div>
  );
}

function StatusMessage({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="mx-auto max-w-md rounded-lg border border-dashed border-border p-8 text-center">
      <h2 className="text-sm font-medium text-foreground">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}
