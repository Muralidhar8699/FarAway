import { useCallback, useEffect, useRef, useState } from "react";

type State<T> =
  | { status: "loading"; data: null; error: null }
  | { status: "success"; data: T; error: null }
  | { status: "error"; data: null; error: Error };

/**
 * Runs an async loader on mount and when deps change, ignoring results from stale runs.
 * reload() fetches again in the background, keeping the current data on screen.
 */
export function useAsync<T>(loader: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<State<T>>({ status: "loading", data: null, error: null });
  const [version, setVersion] = useState(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(loader, deps);
  const lastLoad = useRef<typeof load | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Show the loading state for new data (e.g. another tournament), not for a reload().
    if (lastLoad.current !== load) setState({ status: "loading", data: null, error: null });
    lastLoad.current = load;
    load().then(
      (data) => !cancelled && setState({ status: "success", data, error: null }),
      (err: unknown) =>
        !cancelled &&
        setState({ status: "error", data: null, error: err instanceof Error ? err : new Error(String(err)) })
    );
    return () => {
      cancelled = true;
    };
  }, [load, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { ...state, reload };
}
