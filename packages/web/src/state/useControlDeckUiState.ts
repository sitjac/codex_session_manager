import { startTransition, useEffect, useRef, useState } from "react";
import type { UiNotice } from "../control-deck-model.js";
import { readUiStateFromUrl, writeUiStateToUrl } from "../control-deck-model.js";

export function useControlDeckUiState() {
  const initialUiStateRef = useRef<ReturnType<typeof readUiStateFromUrl> | null>(null);
  if (!initialUiStateRef.current) {
    initialUiStateRef.current = readUiStateFromUrl();
  }
  const initialUiState = initialUiStateRef.current;

  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>(
    initialUiState.selectedWorkspaceId,
  );
  const [selectedId, setSelectedId] = useState<string | undefined>(initialUiState.selectedId);
  const [search, setSearchState] = useState(initialUiState.search);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<UiNotice | null>(null);

  useEffect(() => {
    writeUiStateToUrl({
      tab: "sessions",
      search,
      selectedWorkspaceId,
      selectedId,
    });
  }, [search, selectedId, selectedWorkspaceId]);

  useEffect(() => {
    const handlePopState = () => {
      const nextState = readUiStateFromUrl();
      setSelectedWorkspaceId(nextState.selectedWorkspaceId);
      setSelectedId(nextState.selectedId);
      startTransition(() => {
        setSearchState(nextState.search);
      });
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    if (!notice || notice.tone === "error") {
      return;
    }

    const timer = window.setTimeout(() => {
      setNotice((current) => (current === notice ? null : current));
    }, 4_000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [notice]);

  return {
    tab: "sessions" as const,
    setTab: () => undefined,
    selectedWorkspaceId,
    setSelectedWorkspaceId,
    selectedId,
    setSelectedId,
    search,
    setSearch: (value: string) => {
      startTransition(() => {
        setSearchState(value);
      });
    },
    error,
    setError,
    notice,
    setNotice,
  };
}
