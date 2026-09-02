/**
 * Reads the EXISTING `journal_entries` table from the existing Supabase
 * project and reshapes it into the app's local `Journal` model, purely for
 * display in the current UI.
 *
 * This is intentionally read-only and additive:
 *  - does not touch IndexedDB / src/lib/db.ts / src/lib/store.ts
 *  - does not change the journal_entries schema
 *  - does not rename photo_urls
 *  - does not migrate or re-upload images — photo_urls values are used as-is
 *
 * Mapping (per product decision): each row becomes its own Article.
 *   heading        -> Article.title
 *   description     -> Article.content
 *   photo_urls      -> Article.photos (Photo.id is set to the URL itself,
 *                      see note below)
 *   section_type    -> Article.category
 *   section_name    -> Article.className
 *   page_order      -> sort order
 *
 * Note on Photo.id: the local Photo/PhotoGallery/JournalRenderer components
 * resolve an image by looking up `images[photo.id]` in an `images` map
 * (normally id -> IndexedDB data URL). Since journal_entries already stores
 * full public URLs, we set `photo.id` to the URL itself and `images[url] =
 * url`, so the existing rendering components work completely unchanged.
 */
import { useEffect, useState } from "react";

import { supabase, supabaseConfigured } from "./supabase";
import type { Article, Journal, Photo } from "./types";

interface JournalEntryRow {
  id: string;
  section_type: string | null;
  section_name: string | null;
  heading: string | null;
  description: string | null;
  photo_urls: unknown;
  page_order: number | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
}

/** Parses photo_urls (JSON array of public URLs, possibly already-parsed by the client). */
function parsePhotoUrls(raw: unknown, rowId: string): Photo[] {
  let value: unknown = raw;
  if (typeof raw === "string") {
    try {
      value = JSON.parse(raw);
    } catch (err) {
      console.error(`[legacyJournal] malformed photo_urls on row ${rowId}:`, raw, err);
      return [];
    }
  }
  if (!Array.isArray(value)) {
    if (value != null) {
      console.error(`[legacyJournal] photo_urls on row ${rowId} is not an array:`, value);
    }
    return [];
  }
  return value
    .filter((url): url is string => typeof url === "string" && url.length > 0)
    .map((url) => ({
      id: url,
      name: url.split("/").pop() || "photo",
      width: 0,
      height: 0,
    }));
}

function rowToArticle(row: JournalEntryRow): Article {
  return {
    id: row.id,
    title: row.heading || row.section_name || "Untitled entry",
    category: row.section_type ?? "",
    className: row.section_name ?? "",
    date: row.created_at ? new Date(row.created_at).toLocaleDateString() : "",
    content: row.description ? `<p>${escapeHtml(row.description)}</p>` : "<p></p>",
    photos: parsePhotoUrls(row.photo_urls, row.id),
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");
}

export interface LegacySupabaseJournal {
  journal: Journal | null;
  /** id (== url) -> url, for direct use as the JournalRenderer `images` map. */
  images: Record<string, string>;
  loading: boolean;
  error: string | null;
  rowCount: number;
}

const EMPTY: LegacySupabaseJournal = { journal: null, images: {}, loading: true, error: null, rowCount: 0 };

/** Loads all journal_entries rows and exposes them as a single read-only Journal. */
export function useSupabaseJournal(): LegacySupabaseJournal {
  const [state, setState] = useState<LegacySupabaseJournal>(EMPTY);

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!supabaseConfigured || !supabase) {
        if (alive) {
          setState({
            journal: null,
            images: {},
            loading: false,
            error: "Supabase is not configured (missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).",
            rowCount: 0,
          });
        }
        return;
      }

      const { data, error } = await supabase
        .from("journal_entries")
        .select("*")
        .order("page_order", { ascending: true, nullsFirst: true });

      if (!alive) return;

      if (error) {
        console.error("[legacyJournal] journal_entries query failed:", error);
        setState({
          journal: null,
          images: {},
          loading: false,
          error: `Failed to load journal_entries: ${error.message}`,
          rowCount: 0,
        });
        return;
      }

      const rows = (data ?? []) as JournalEntryRow[];

      if (rows.length === 0) {
        setState({ journal: null, images: {}, loading: false, error: "journal_entries is empty.", rowCount: 0 });
        return;
      }

      let articles: Article[];
      try {
        articles = rows.map(rowToArticle);
      } catch (err) {
        console.error("[legacyJournal] failed to map journal_entries rows:", err);
        setState({
          journal: null,
          images: {},
          loading: false,
          error: "Failed to read one or more journal_entries rows. See console for details.",
          rowCount: rows.length,
        });
        return;
      }

      const images: Record<string, string> = {};
      let missingPhotoRows = 0;
      articles.forEach((article, i) => {
        if (article.photos.length === 0 && rows[i]?.photo_urls) missingPhotoRows += 1;
        article.photos.forEach((photo) => {
          images[photo.id] = photo.id;
        });
      });
      if (missingPhotoRows > 0) {
        console.warn(`[legacyJournal] ${missingPhotoRows} row(s) had photo_urls that could not be parsed.`);
      }

      const journal: Journal = {
        id: "supabase:journal_entries",
        title: "Jeevana Journal",
        subtitle: "Existing Supabase content (read-only)",
        month: "",
        year: new Date().getFullYear(),
        articles,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      setState({ journal, images, loading: false, error: null, rowCount: rows.length });
    })();

    return () => {
      alive = false;
    };
  }, []);

  return state;
}
