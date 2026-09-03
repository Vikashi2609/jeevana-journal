import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import * as db from "./db";
import type { Journal } from "./types";

export function useJournals() {
  const [journals, setJournals] = useState<Journal[] | null>(null);

  const refresh = useCallback(async () => {
    try {
      const list = await db.listJournals();
      setJournals(list);
    } catch (error) {
      console.error("[store] Failed to load journals:", error);
      setJournals([]);
    }
  }, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const list = await db.listJournals();

        if (alive) {
          setJournals(list);
        }
      } catch (error) {
        console.error("[store] Failed to load journals:", error);

        if (alive) {
          setJournals([]);
        }
      }
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

/**
 * Loads a journal from Supabase and autosaves mutations after a short debounce.
 */
export function useJournal(id: string) {
  const [journal, setJournal] = useState<Journal | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setStatus("idle");

      try {
        const j = await db.getJournal(id);

        if (!alive) return;

        setJournal(j ?? null);
      } catch (error) {
        console.error("[store] Failed to load journal:", error);

        if (alive) {
          setJournal(null);
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    })();

    return () => {
      alive = false;

      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
    };
  }, [id]);

  const update = useCallback(
    (mutator: (draft: Journal) => Journal) => {
      setJournal((current) => {
        if (!current) return current;

        const next = mutator(current);

        setStatus("saving");

        if (timer.current) {
          clearTimeout(timer.current);
        }

        timer.current = setTimeout(async () => {
          try {
const saved = await db.saveJournal(next);
setJournal(saved);
setStatus("saved");
          } catch (error) {
            console.error("[store] Failed to save journal:", error);
            setStatus("idle");
          } finally {
            timer.current = null;
          }
        }, 400);

        return next;
      });
    },
    [],
  );

  return { journal, loading, status, update };
}

/**
 * Resolves photo IDs to image URLs.
 *
 * Supabase photo URLs are returned directly.
 * Existing local IndexedDB images continue to work.
 */
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
      .catch((error) => {
        console.error("[store] Failed to load images:", error);

        if (alive) {
          setImages({});
          setReady(true);
        }
      });

    return () => {
      alive = false;
    };
  }, [key]);

  return { images, ready };
}
