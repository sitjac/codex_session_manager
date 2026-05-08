import type { ApiEventRecord } from "@codexnamer/shared";
import { useCallback, useEffect, useRef } from "react";
import type { DataResource, TabId } from "./control-deck-model.js";
import { mergeResources, panelResourcesForTab } from "./control-deck-model.js";
import { usePanelResourceStore } from "./resources/usePanelResourceStore.js";
import { useRefreshCoordinator } from "./resources/useRefreshCoordinator.js";
import { useSessionResourceStore } from "./resources/useSessionResourceStore.js";

type UseControlDeckResourcesOptions = {
  tab: TabId;
  search: string;
  selectedWorkspaceId: string;
  selectedId?: string;
  selectedRequestLogId?: number;
  onSelectSession: (threadId?: string) => void;
  onSelectWorkspace: (workspaceId: string) => void;
  onFailure: (error: unknown) => void;
};

export function useControlDeckResources(options: UseControlDeckResourcesOptions) {
  const {
    tab,
    search,
    selectedWorkspaceId,
    selectedId,
    onSelectSession,
    onSelectWorkspace,
    onFailure,
  } = options;
  const eventCursorRef = useRef(0);
  const latestUiStateRef = useRef({
    tab,
    selectedId,
  });
  const latestCallbacksRef = useRef({
    onFailure,
  });

  latestUiStateRef.current = {
    tab,
    selectedId,
  };
  latestCallbacksRef.current = {
    onFailure,
  };
  const reportFailure = useCallback((error: unknown) => {
    latestCallbacksRef.current.onFailure(error);
  }, []);

  const sessions = useSessionResourceStore({
    tab,
    search,
    selectedWorkspaceId,
    selectedId,
    onSelectSession,
    onSelectWorkspace,
    onFailure,
  });
  const panels = usePanelResourceStore({
    tab,
    selectedId,
    onFailure,
  });
  const {
    sessions: sessionItems,
    setSessions,
    workspaces,
    detail,
    setDetail,
    loadingSessions,
    loadingDetail,
    lastSyncAt,
    selectedSummary,
    patchSelectedSession,
    removeSession,
    refreshSessions,
    refreshDetail,
    setLastSyncAt,
  } = sessions;
  const { configView, setConfigView, refreshConfigView } = panels;

  const loadResources = useCallback(
    async (
      resources: readonly DataResource[],
      _resourceOptions?: {
        threadId?: string;
        urgentPreview?: boolean;
        urgentPromptPreview?: boolean;
      },
    ) => {
      const tasks: Array<Promise<void>> = [];

      if (resources.includes("sessions")) {
        tasks.push(refreshSessions());
      }
      if (resources.includes("config")) {
        tasks.push(refreshConfigView());
      }
      if (tasks.length === 0) {
        return;
      }

      await Promise.all(tasks);
    },
    [refreshConfigView, refreshSessions],
  );

  useEffect(() => {
    let active = true;
    void refreshConfigView()
      .then(() => {
        if (active) {
          setLastSyncAt((previous) => previous ?? new Date().toISOString());
        }
      })
      .catch((error) => {
        if (active) {
          reportFailure(error);
        }
      });
    return () => {
      active = false;
    };
  }, [refreshConfigView, reportFailure, setLastSyncAt]);

  const refreshCurrentView = useCallback(
    (refreshOptions?: { threadId?: string; includePromptPreview?: boolean }) => {
      const nextThreadId = refreshOptions?.threadId ?? latestUiStateRef.current.selectedId;
      const tasks: Array<Promise<unknown>> = [refreshSessions()];
      if (nextThreadId) {
        tasks.push(refreshDetail(nextThreadId));
      }
      void Promise.all(tasks).catch(() => undefined);
    },
    [refreshDetail, refreshSessions],
  );

  const refreshForEvents = useCallback(
    (events: ApiEventRecord[]) => {
      const nextThreadId = latestUiStateRef.current.selectedId;
      const tasks: Array<Promise<unknown>> = [];

      const shouldRefreshSessions = events.some((event) =>
        ["scan.completed", "session.renamed", "session.applied", "session.freeze.changed"].includes(
          event.type,
        ),
      );

      const shouldRefreshDetail =
        nextThreadId !== undefined &&
        events.some((event) => {
          if (event.type === "scan.completed") {
            return true;
          }
          return (
            typeof event.payload.threadId === "string" && event.payload.threadId === nextThreadId
          );
        });

      if (shouldRefreshSessions) {
        tasks.push(refreshSessions());
      }
      if (shouldRefreshDetail && nextThreadId) {
        tasks.push(refreshDetail(nextThreadId));
      }

      if (tasks.length === 0) {
        return;
      }

      void Promise.all(tasks).catch(() => undefined);
    },
    [refreshDetail, refreshSessions],
  );

  useRefreshCoordinator({
    tab,
    eventCursorRef,
    refreshForEvents,
    refreshFallback: () => {
      refreshCurrentView();
    },
  });

  return {
    sessions: sessionItems,
    setSessions,
    workspaces,
    detail,
    setDetail,
    configView,
    setConfigView,
    providers: null,
    doctor: null,
    overview: null,
    daemon: null,
    aiRequestLogs: null,
    aiRequestLogDetail: null,
    preview: null,
    loadingSessions,
    loadingDetail,
    lastSyncAt,
    previewRefreshing: false,
    promptPreview: null,
    promptPreviewRefreshing: false,
    selectedSummary,
    patchSelectedSession,
    removeSession,
    refreshCurrentView,
    refreshForEvents,
    refreshSessions,
    refreshPreview: async () => undefined,
    refreshPromptPreview: async () => undefined,
    refreshSettings: async () => undefined,
    refreshMaintenance: async () => undefined,
    refreshRequeue: async () => undefined,
    refreshDaemon: async () => undefined,
    loadResources,
    mergeCurrentTabResources: (...groups: readonly DataResource[][]) =>
      mergeResources(...groups, panelResourcesForTab(latestUiStateRef.current.tab)),
  };
}
