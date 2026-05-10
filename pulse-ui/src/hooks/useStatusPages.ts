// useStatusPages: load list of status pages (for sidebar) + a specific one for the
// composer's editor. The /api/v1/status-pages endpoint may be empty if none have
// been provisioned yet — the composer renders an empty-state hint in that case.

import { useEffect, useState } from "react";
import {
  fetchStatusPages,
  fetchStatusPage,
  type ApiStatusPage,
} from "../lib/api";

export type StatusPagesState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | {
      kind: "ready";
      list: ApiStatusPage[];
      active: ApiStatusPage | null;
    };

export function useStatusPages(slug?: string): StatusPagesState {
  const [state, setState] = useState<StatusPagesState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchStatusPages();
        let active: ApiStatusPage | null = null;
        const wantedSlug = slug && slug !== "aspendora" ? slug : list[0]?.slug;
        if (wantedSlug) {
          try {
            active = await fetchStatusPage(wantedSlug);
          } catch {
            active = list[0] || null;
          }
        }
        if (cancelled) return;
        setState({ kind: "ready", list, active });
      } catch (e) {
        if (cancelled) return;
        setState({ kind: "error", message: e instanceof Error ? e.message : String(e) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return state;
}
