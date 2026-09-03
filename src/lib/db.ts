/**
 * Journal persistence layer.
 *
 * The existing Supabase `journal_entries` table is the source of truth
 * for journal/article data.
 *
 * Mapping:
 *   Article.id        -> journal_entries.id
 *   Article.category  -> journal_entries.section_type
 *   Article.className -> journal_entries.section_name
 *   Article.title     -> journal_entries.heading
 *   Article.content   -> journal_entries.description
 *   Article.photos    -> journal_entries.photo_urls
 *   Article order     -> journal_entries.page_order
 *
 * Images are uploaded directly to Supabase Storage ('photos' bucket).
 */

import { supabase, supabaseConfigured } from "./supabase";
import type { Article, Journal, Photo } from "./types";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const SUPABASE_JOURNAL_ID = "supabase:journal_entries";
const STORAGE_BUCKET = "photos";

/* -------------------------------------------------------------------------- */
/* Supabase row type                                                          */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function requireSupabase() {
  if (!supabaseConfigured || !supabase) {
    throw new Error(
      "Supabase is not configured. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
  }

  return supabase;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");
}

function normalizeSectionType(category?: string | null): string {
  if (!category || !category.trim()) return "other";
  return category.trim().toLowerCase();
}

/**
 * Converts a base64 Data URL into a binary Blob for Supabase Storage uploads.
 */
function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(";base64,");
  const contentType = parts[0].split(":")[1] || "image/png";
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; i += 1) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
}

/**
 * Converts photo_urls from Supabase into application Photo models.
 */
function parsePhotoUrls(raw: unknown, rowId: string): Photo[] {
  let value: unknown = raw;

  if (typeof raw === "string") {
    try {
      value = JSON.parse(raw);
    } catch (error) {
      console.error(
        `[db] Could not parse photo_urls for row ${rowId}:`,
        raw,
        error,
      );
      return [];
    }
  }

  if (!Array.isArray(value)) {
    if (value != null) {
      console.error(
        `[db] photo_urls for row ${rowId} is not an array:`,
        value,
      );
    }
    return [];
  }

  return value
    .filter(
      (url): url is string =>
        typeof url === "string" && url.trim().length > 0,
    )
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
    date: row.created_at
      ? new Date(row.created_at).toLocaleDateString()
      : "",
    content: row.description
      ? `<p>${escapeHtml(row.description)}</p>`
      : "<p></p>",
    photos: parsePhotoUrls(row.photo_urls, row.id),
  };
}

function rowsToJournal(rows: JournalEntryRow[]): Journal {
  const articles = rows.map(rowToArticle);

  const createdTimes = rows
    .map((row) =>
      row.created_at ? new Date(row.created_at).getTime() : NaN,
    )
    .filter((value) => Number.isFinite(value));

  const updatedTimes = rows
    .map((row) =>
      row.updated_at ? new Date(row.updated_at).getTime() : NaN,
    )
    .filter((value) => Number.isFinite(value));

  const createdAt =
    createdTimes.length > 0 ? Math.min(...createdTimes) : Date.now();

  const updatedAt =
    updatedTimes.length > 0 ? Math.max(...updatedTimes) : Date.now();

  return {
    id: SUPABASE_JOURNAL_ID,
    title: "Jeevana Journal",
    subtitle: "Existing Supabase content",
    month: "",
    year: new Date().getFullYear(),
    articles,
    createdAt,
    updatedAt,
  };
}

/* -------------------------------------------------------------------------- */
/* Supabase loading                                                           */
/* -------------------------------------------------------------------------- */

async function loadSupabaseRows(): Promise<JournalEntryRow[]> {
  const client = requireSupabase();

  const { data, error } = await client
    .from("journal_entries")
    .select("*")
    .order("page_order", {
      ascending: true,
      nullsFirst: true,
    });

  if (error) {
    console.error("[db] journal_entries SELECT failed:", error);
    throw error;
  }

  return (data ?? []) as JournalEntryRow[];
}

async function loadSupabaseJournal(): Promise<Journal | undefined> {
  const rows = await loadSupabaseRows();

  if (rows.length === 0) {
    return undefined;
  }

  return rowsToJournal(rows);
}

/* -------------------------------------------------------------------------- */
/* Journal API                                                                */
/* -------------------------------------------------------------------------- */

export async function listJournals(): Promise<Journal[]> {
  const journal = await loadSupabaseJournal();
  return journal ? [journal] : [];
}

export async function getJournal(
  id: string,
): Promise<Journal | undefined> {
  if (id !== SUPABASE_JOURNAL_ID) {
    return undefined;
  }

  return loadSupabaseJournal();
}

export async function saveJournal(journal: Journal): Promise<Journal> {
  const client = requireSupabase();

  if (journal.id !== SUPABASE_JOURNAL_ID) {
    throw new Error(`Unsupported journal ID: ${journal.id}`);
  }

  const existingRows = await loadSupabaseRows();

  const existingIds = new Set(existingRows.map((row) => row.id));
  const currentIds = new Set(journal.articles.map((article) => article.id));

  /* 1. Delete articles removed from the journal */
  const idsToDelete = existingRows
    .map((row) => row.id)
    .filter((id) => !currentIds.has(id));

  if (idsToDelete.length > 0) {
    const { error } = await client
      .from("journal_entries")
      .delete()
      .in("id", idsToDelete);

    if (error) {
      console.error("[db] Failed to delete removed articles:", error);
      throw error;
    }
  }

  /* 2. Insert/update current articles */
  for (let index = 0; index < journal.articles.length; index += 1) {
    const article = journal.articles[index];
    const payload = articleToRow(article, index);

    if (existingIds.has(article.id)) {
      const { error } = await client
        .from("journal_entries")
        .update({
          section_type: payload.section_type,
          section_name: payload.section_name,
          heading: payload.heading,
          description: payload.description,
          photo_urls: payload.photo_urls,
          page_order: payload.page_order,
          updated_at: new Date().toISOString(),
        })
        .eq("id", article.id);

      if (error) {
        console.error(
          `[db] Failed to update article ${article.id}:`,
          error,
        );
        throw error;
      }
    } else {
      const { error } = await client
        .from("journal_entries")
        .insert({
          id: article.id,
          section_type: payload.section_type,
          section_name: payload.section_name,
          heading: payload.heading,
          description: payload.description,
          photo_urls: payload.photo_urls,
          page_order: payload.page_order,
          status: "approved",
        });

      if (error) {
        console.error(
          `[db] Failed to insert article ${article.id}:`,
          error,
        );
        throw error;
      }
    }
  }

  return {
    ...journal,
    updatedAt: Date.now(),
  };
}

export async function deleteJournal(id: string): Promise<void> {
  const client = requireSupabase();

  if (id !== SUPABASE_JOURNAL_ID) {
    return;
  }

  const { error } = await client
    .from("journal_entries")
    .delete()
    .neq("id", "");

  if (error) {
    console.error("[db] Failed to delete journal entries:", error);
    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/* Article -> Supabase mapping                                                */
/* -------------------------------------------------------------------------- */

function articleToRow(
  article: Article,
  pageOrder: number,
): {
  id: string;
  section_type: string;
  section_name: string;
  heading: string;
  description: string;
  photo_urls: string[];
  page_order: number;
} {
  return {
    id: article.id,
    section_type: normalizeSectionType(article.category),
    section_name: article.className,
    heading: article.title,
    description: htmlToPlainText(article.content),
    photo_urls: article.photos.map((photo) => photo.id),
    page_order: pageOrder,
  };
}

function htmlToPlainText(html: string): string {
  if (!html) {
    return "";
  }

  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<p[^>]*>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .trim();
}

/* -------------------------------------------------------------------------- */
/* Supabase Storage Image Management                                          */
/* -------------------------------------------------------------------------- */

/**
 * Uploads a base64 image or URL directly to the Supabase Storage bucket ('photos').
 * Returns the public HTTP URL of the uploaded file.
 */
export async function putImage(
  id: string,
  dataUrl: string,
): Promise<string> {
  if (/^https?:\/\//i.test(dataUrl)) {
    return dataUrl;
  }

  if (!dataUrl.startsWith("data:")) {
    return dataUrl;
  }

  try {
    const client = requireSupabase();
    const blob = dataUrlToBlob(dataUrl);
    const ext = blob.type.split("/")[1] || "png";
    const cleanId = id.replace(/[^a-zA-Z0-9_-]/g, "");
    const fileName = `${cleanId}_${Date.now()}.${ext}`;

    const { data, error } = await client.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, blob, {
        upsert: true,
        contentType: blob.type,
      });

    if (error) {
      console.error("[db] Supabase storage upload failed:", error);
      return dataUrl;
    }

    const { data: publicUrlData } = client.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("[db] Failed to process image upload:", error);
    return dataUrl;
  }
}

/**
 * Returns the URL for an image.
 */
export async function getImage(
  id: string,
): Promise<string | undefined> {
  if (!id) return undefined;

  if (/^(https?:\/\/|data:image\/)/i.test(id)) {
    return id;
  }

  try {
    const client = requireSupabase();
    const { data } = client.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(id);

    return data.publicUrl;
  } catch {
    return id;
  }
}

/**
 * Resolves multiple image IDs to their public URLs.
 */
export async function getImages(
  ids: string[],
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};

  await Promise.all(
    ids.map(async (id) => {
      const image = await getImage(id);
      if (image) {
        result[id] = image;
      }
    }),
  );

  return result;
}

/**
 * Deletes an image from the Supabase Storage bucket.
 */
export async function deleteImage(id: string): Promise<void> {
  if (!id || !id.includes(`/${STORAGE_BUCKET}/`)) {
    return;
  }

  try {
    const client = requireSupabase();
    const filePath = id.split(`/${STORAGE_BUCKET}/`)[1];

    if (filePath) {
      const { error } = await client.storage
        .from(STORAGE_BUCKET)
        .remove([filePath]);

      if (error) {
        console.error(
          "[db] Failed to delete image from Supabase storage:",
          error,
        );
      }
    }
  } catch (error) {
    console.error("[db] Error deleting image:", error);
  }
}