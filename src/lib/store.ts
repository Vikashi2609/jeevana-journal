import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import * as db from "./db";
import { ensureSampleData } from "./sample";
import type { Journal } from "./types";

export function useJournals() {
  const [journals, setJournals] = useState<Journal[] | null>(null);

  const refresh = useCallback(async () => {
    setJournals(await db.listJournals());
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      await ensureSampleData().catch(() => undefined);
      const list = await db.listJournals().catch(() => []);
      if (alive) setJournals(list);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const remove = useCallback(
    async (id: string) => {
      await db.deleteJournal(id);
      await refresh();
    },
    [refresh],
  );

  return { journals, refresh, remove };
}

export type SaveStatus = "idle" | "saving" | "saved";

/** Loads a journal and autosaves any mutation after a short debounce. */
export function useJournal(id: string) {
  const [journal, setJournal] = useState<Journal | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      await ensureSampleData().catch(() => undefined);
      const j = await db.getJournal(id).catch(() => undefined);
      if (!alive) return;
      setJournal(j ?? null);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  const update = useCallback((mutator: (draft: Journal) => Journal) => {
    setJournal((current) => {
      if (!current) return current;
      const next = mutator(current);
      setStatus("saving");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        db.saveJournal(next)
          .then(() => setStatus("saved"))
          .catch(() => setStatus("idle"));
      }, 400);
      return next;
    });
  }, []);

  return { journal, loading, status, update };
}

/** Resolves photo ids to data URLs from IndexedDB. */
export function useImages(ids: string[]) {
  const key = useMemo(() => ids.join("|"), [ids]);
  const [images, setImages] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(ids.length === 0);

  useEffect(() => {
    let alive = true;
    const list = key ? key.split("|") : [];
    setReady(false);
    db.getImages(list)
      .then((map) => {
        if (!alive) return;
        setImages(map);
        setReady(true);
      })
      .catch(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, [key]);

  return { images, ready };
}