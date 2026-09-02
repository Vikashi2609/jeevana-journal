# Jeevana Journal — Google Drive photo storage + cloud database

Photos move to your Google Drive; journal, article and photo metadata move to the app database. The editor, A4 pagination, editorial backgrounds, flipbook and print output stay exactly as they are.

## What changes

**Storage split**
- Google Drive: the actual image files, owned by your Google account.
- Database (Lovable Cloud): journals, articles, photo metadata — references only, no image bytes.
- Backend: TanStack server functions are the only thing that ever touches Drive. No Google credentials reach the browser.

**Drive folder layout**
```text
Jeevana Journal/
  Journals/
    <journal-id>/
      Photos/
      Covers/
```
Folder ids are looked up once and cached, so opening a journal never scans your Drive.

## Database tables

- `journals` — id, title, subtitle, month, year, cover_photo_id, editors_note, palette, created_at, updated_at
- `articles` — id, journal_id, title, category, class_name, date, content, display_order, created_at, updated_at
- `photos` — id, journal_id, article_id, drive_file_id, filename, mime_type, width, height, checksum, display_order, created_at, updated_at

No authentication is added; the app stays open as it is today. Tables are readable/writable without login, matching current behaviour.

## Server functions

- `uploadPhoto` — validates type and size, computes a SHA-256 checksum, reuses the existing Drive file when the checksum already exists for that journal (duplicate protection), otherwise uploads and writes the metadata row.
- `getPhoto` — streams image bytes from Drive through a cached backend route (`/api/photos/$id`), so `<img src>` is a stable app URL that survives refresh and browser restarts. Missing or deleted Drive files return a placeholder response and the UI shows a clear "image unavailable" state.
- `deletePhoto`, `reorderPhotos`, journal/article CRUD.

Failures are surfaced as inline errors with retry, never as a broken journal.

## Migration of existing journals

On first open after the change, each journal in browser storage is uploaded to Drive and written to the database in the background, with a small progress indicator. Nothing is deleted from the browser — the local copy stays as a fallback and cache, so an interrupted or failed migration cannot lose a journal. Already-migrated journals are skipped via a stored flag.

## Image loading behaviour

`useImages` resolves in this order: in-memory cache → backend Drive URL → local IndexedDB fallback. Only the photos on the pages being rendered are requested. Responses carry long cache headers since Drive file contents are immutable.

## What you need to do

1. Approve the Lovable Cloud enable step (creates the database, no account needed).
2. Complete the Google Drive connection card I open — sign in with the Google account that should own the files. Only the `drive.file` scope is requested, which limits the app to files it creates itself; it cannot see the rest of your Drive.

No client secrets, no Google Cloud Console project, nothing to paste.

## Safety

Existing journals are never deleted or rewritten in place. Migration is additive and reversible: if anything goes wrong, the browser copy still renders the journal exactly as today.
