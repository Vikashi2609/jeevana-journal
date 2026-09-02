import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/journal/new")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: (search.id as string) || undefined,
  }),
  component: JournalViewer,
});

interface JournalEntry {
  id: string;
  heading: string;
  description: string;
  section_name: string;
  photo_urls: string[] | string | null;
  created_at: string;
}

function JournalViewer() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { id?: string };
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    async function loadViewerData() {
      setIsLoading(true);

      let query = supabase
        .from("journal_entries")
        .select("*")
        .order("created_at", { ascending: false });

      // Filter by single ID if passed from preview button, otherwise load all
      if (search?.id) {
        query = query.eq("id", search.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error loading flipbook entries:", error);
        setEntries([]);
      } else {
        setEntries(data || []);
      }
      setIsLoading(false);
    }

    loadViewerData();
  }, [search?.id]);

  // Safely extract photo array regardless of database return type
  const getPhotos = (urls: unknown): string[] => {
    if (Array.isArray(urls)) return urls;
    if (typeof urls === "string") {
      try {
        const parsed = JSON.parse(urls);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading flipbook pages...</span>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 p-4 text-slate-100 text-center">
        <h2 className="text-xl font-semibold">No Pages Found</h2>
        <p className="max-w-md text-sm text-slate-400">
          {search?.id
            ? "The selected article could not be loaded from Supabase."
            : "There are no journal entries available to display."}
        </p>
        <Button variant="outline" onClick={() => navigate({ to: "/" })}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Return to Dashboard
        </Button>
      </div>
    );
  }

  const activeEntry = entries[currentPage];
  const photos = getPhotos(activeEntry?.photo_urls);

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      {/* Top Bar */}
      <header className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
        <Button
          variant="ghost"
          className="text-slate-300 hover:bg-slate-800 hover:text-white"
          onClick={() => navigate({ to: "/" })}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Dashboard
        </Button>
        <span className="text-sm font-medium text-slate-400">
          Page {currentPage + 1} of {entries.length}
        </span>
      </header>

      {/* Page Viewer Stage */}
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="flex aspect-[1/1.414] w-full max-w-2xl flex-col rounded-lg bg-white p-8 text-slate-900 shadow-2xl overflow-hidden">
          <div className="border-b border-slate-200 pb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              {activeEntry.section_name || "General Section"}
            </span>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">{activeEntry.heading}</h1>
          </div>

          <div className="mt-4 flex-1 overflow-y-auto text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
            {activeEntry.description}
          </div>

          {photos.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
              {photos.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`Attachment ${idx + 1}`}
                  className="h-32 w-full rounded border object-cover"
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Flipbook Controls */}
      <footer className="flex items-center justify-center gap-4 border-t border-slate-800 py-4">
        <Button
          variant="outline"
          disabled={currentPage === 0}
          onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
          className="bg-slate-900 border-slate-700 text-slate-200"
        >
          <ChevronLeft className="mr-1 h-4 w-4" /> Previous
        </Button>
        <Button
          variant="outline"
          disabled={currentPage === entries.length - 1}
          onClick={() => setCurrentPage((p) => Math.min(entries.length - 1, p + 1))}
          className="bg-slate-900 border-slate-700 text-slate-200"
        >
          Next <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </footer>
    </div>
  );
}