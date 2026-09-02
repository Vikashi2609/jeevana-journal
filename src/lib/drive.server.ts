/**
 * Server-only Google Drive access, routed through the Lovable connector
 * gateway. No Google credentials ever reach the browser: only this module
 * (and the server functions / server route that import it) can talk to Drive.
 */

const GATEWAY = "https://connector-gateway.lovable.dev/google_drive";

const ROOT_FOLDER = "Jeevana Journal";
const JOURNALS_FOLDER = "Journals";

/** folder path -> folder id, cached for the lifetime of the worker isolate. */
const folderCache = new Map<string, string>();

function authHeaders(): Record<string, string> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const connectionKey = process.env["GOOGLE_DRIVE_API_KEY"];
  if (!lovableKey || !connectionKey) {
    throw new Error(
      "Google Drive is not connected for this project (missing gateway credentials).",
    );
  }
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": connectionKey,
  };
}

async function driveFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(`${GATEWAY}${path}`, {
    ...init,
    headers: { ...authHeaders(), ...(init.headers as Record<string, string> | undefined) },
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`Drive request failed [${res.status}] ${path}: ${body}`);
    throw new Error(`Google Drive request failed [${res.status}]: ${body.slice(0, 500)}`);
  }
  return res;
}

const FOLDER_MIME = "application/vnd.google-apps.folder";

function escapeQuery(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

/** Finds a child folder by name, creating it when absent. */
async function ensureFolder(name: string, parentId: string | null): Promise<string> {
  const cacheKey = `${parentId ?? "root"}/${name}`;
  const cached = folderCache.get(cacheKey);
  if (cached) return cached;

  const clauses = [
    `name = '${escapeQuery(name)}'`,
    `mimeType = '${FOLDER_MIME}'`,
    "trashed = false",
    parentId ? `'${escapeQuery(parentId)}' in parents` : null,
  ].filter(Boolean);

  const search = await driveFetch(
    `/drive/v3/files?q=${encodeURIComponent(clauses.join(" and "))}&fields=${encodeURIComponent(
      "files(id,name)",
    )}&pageSize=1`,
  );
  const found = (await search.json()) as { files?: Array<{ id: string }> };
  const existing = found.files?.[0]?.id;
  if (existing) {
    folderCache.set(cacheKey, existing);
    return existing;
  }

  const created = await driveFetch(`/drive/v3/files?fields=id`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name,
      mimeType: FOLDER_MIME,
      ...(parentId ? { parents: [parentId] } : {}),
    }),
  });
  const folder = (await created.json()) as { id: string };
  folderCache.set(cacheKey, folder.id);
  return folder.id;
}

/**
 * Jeevana Journal / Journals / <journalId> / <Photos|Covers>
 * Folder ids are cached, so opening a journal never scans the whole Drive.
 */
export async function ensureJournalFolder(
  journalId: string,
  kind: "Photos" | "Covers",
): Promise<string> {
  const root = await ensureFolder(ROOT_FOLDER, null);
  const journals = await ensureFolder(JOURNALS_FOLDER, root);
  const journal = await ensureFolder(journalId, journals);
  return ensureFolder(kind, journal);
}

/** Looks for a previously uploaded file with the same content checksum. */
export async function findByChecksum(
  folderId: string,
  checksum: string,
): Promise<{ id: string; name: string } | null> {
  const q = [
    `'${escapeQuery(folderId)}' in parents`,
    "trashed = false",
    `appProperties has { key='checksum' and value='${escapeQuery(checksum)}' }`,
  ].join(" and ");
  const res = await driveFetch(
    `/drive/v3/files?q=${encodeURIComponent(q)}&fields=${encodeURIComponent(
      "files(id,name)",
    )}&pageSize=1`,
  );
  const json = (await res.json()) as { files?: Array<{ id: string; name: string }> };
  return json.files?.[0] ?? null;
}

/** Multipart upload of raw bytes; returns the permanent Drive file id. */
export async function uploadToDrive(params: {
  folderId: string;
  filename: string;
  mimeType: string;
  bytes: Uint8Array;
  checksum: string;
}): Promise<string> {
  const boundary = `jeevana${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  const metadata = JSON.stringify({
    name: params.filename,
    parents: [params.folderId],
    appProperties: { checksum: params.checksum, app: "jeevana-journal" },
  });

  const encoder = new TextEncoder();
  const head = encoder.encode(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n` +
      `--${boundary}\r\nContent-Type: ${params.mimeType}\r\n\r\n`,
  );
  const tail = encoder.encode(`\r\n--${boundary}--\r\n`);
  const body = new Uint8Array(head.length + params.bytes.length + tail.length);
  body.set(head, 0);
  body.set(params.bytes, head.length);
  body.set(tail, head.length + params.bytes.length);

  const res = await driveFetch(`/upload/drive/v3/files?uploadType=multipart&fields=id`, {
    method: "POST",
    headers: { "content-type": `multipart/related; boundary=${boundary}` },
    body,
  });
  const json = (await res.json()) as { id: string };
  return json.id;
}

/** Streams the file bytes back. Returns null when the file is gone/trashed. */
export async function readFromDrive(
  fileId: string,
): Promise<{ bytes: ArrayBuffer; mimeType: string } | null> {
  const res = await fetch(
    `${GATEWAY}/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
    { headers: authHeaders() },
  );
  if (res.status === 404 || res.status === 410) return null;
  if (!res.ok) {
    const body = await res.text();
    console.error(`Drive download failed [${res.status}] ${fileId}: ${body}`);
    if (res.status === 401 || res.status === 403) {
      throw new Error("Google Drive authorisation failed. Reconnect the Drive connection.");
    }
    return null;
  }
  return {
    bytes: await res.arrayBuffer(),
    mimeType: res.headers.get("content-type") ?? "application/octet-stream",
  };
}

export async function deleteFromDrive(fileId: string): Promise<void> {
  const res = await fetch(`${GATEWAY}/drive/v3/files/${encodeURIComponent(fileId)}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok && res.status !== 404) {
    console.error(`Drive delete failed [${res.status}] ${fileId}`);
  }
}
