import { useState } from "react";

import { deleteSession, renameSession } from "../api.js";
import type { DataResource, TabId, UiNotice } from "../control-deck-model.js";
import type {
  RenameApplyResponse,
  SessionDeleteResult,
  SessionDetail,
  SessionSummary,
} from "../types.js";

type ControlDeckActionResources = {
  detail: SessionDetail | null;
  patchSelectedSession: (threadId: string, patch: Partial<SessionSummary & SessionDetail>) => void;
  removeSession: (threadId: string) => void;
  loadResources: (
    resources: readonly DataResource[],
    resourceOptions?: {
      threadId?: string;
      urgentPreview?: boolean;
      urgentPromptPreview?: boolean;
    },
  ) => Promise<void>;
  mergeCurrentTabResources: (...groups: readonly DataResource[][]) => DataResource[];
  refreshCurrentView: (refreshOptions?: {
    threadId?: string;
    includePromptPreview?: boolean;
  }) => void;
};

type ControlDeckActionUi = {
  tab: TabId;
  selectedId?: string;
  setError: (value: string | null) => void;
  setNotice: (notice: UiNotice | null) => void;
};

export function useControlDeckActions(params: {
  resources: ControlDeckActionResources;
  ui: ControlDeckActionUi;
}) {
  const { resources, ui } = params;
  const [actioning, setActioning] = useState(false);
  const [actionLabel, setActionLabel] = useState<string | null>(null);

  const setFailure = (nextError: unknown) => {
    const message = nextError instanceof Error ? nextError.message : "Unknown error";
    ui.setError(message);
    ui.setNotice({
      tone: "error",
      text: message,
    });
  };

  const refreshAfterAction = (threadId: string) => {
    resources.refreshCurrentView({
      threadId,
      includePromptPreview: true,
    });
  };

  const runAction = async <T>(options: {
    threadId: string;
    actionName: string;
    action: () => Promise<T>;
    onSuccess: (result: T) => {
      message: string;
      patch?: Partial<SessionSummary & SessionDetail>;
    };
  }) => {
    setActioning(true);
    setActionLabel(options.actionName);
    ui.setError(null);
    ui.setNotice({
      tone: "info",
      text: `${options.actionName}...`,
    });
    try {
      const result = await options.action();
      const success = options.onSuccess(result);
      if (success.patch) {
        resources.patchSelectedSession(options.threadId, success.patch);
      }
      ui.setNotice({
        tone: "success",
        text: success.message,
      });
      refreshAfterAction(options.threadId);
      return true;
    } catch (nextError) {
      setFailure(nextError);
      return false;
    } finally {
      setActioning(false);
      setActionLabel(null);
    }
  };

  return {
    actioning,
    actionLabel,
    savingConfig: false,
    daemonActioning: null,
    saveConfig: async () => undefined,
    replayRenamesSince: async () => ({
      since: "",
      basis: "session-updated-at" as const,
      queued: 0,
      clearedCandidates: 0,
      matchedThreadIds: [],
      skipped: 0,
      skipCounts: {},
    }),
    startDaemon: async () => {
      throw new Error("Daemon controls are disabled in manual rename mode.");
    },
    stopDaemon: async () => {
      throw new Error("Daemon controls are disabled in manual rename mode.");
    },
    actions: {
      suggest: async () => undefined,
      apply: async () => undefined,
      rename: (name: string): Promise<boolean> =>
        resources.detail
          ? runAction<RenameApplyResponse>({
              threadId: resources.detail.threadId,
              actionName: "Renaming session",
              action: () => renameSession(resources.detail!.threadId, name),
              onSuccess: (result) => ({
                message: result.written
                  ? `Renamed: ${result.name}`
                  : `Already named: ${result.name}`,
                patch: {
                  officialName: result.name,
                  candidateName: result.name,
                  dirty: false,
                  lastAppliedSource: "manual",
                  lastAppliedRuleSignature: undefined,
                },
              }),
            })
          : Promise.resolve(false),
      delete: (threadId: string): Promise<boolean> =>
        runAction<SessionDeleteResult>({
          threadId,
          actionName: "Deleting session",
          action: () => deleteSession(threadId),
          onSuccess: (result) => {
            if (result.deleted) {
              resources.removeSession(threadId);
            }
            return {
              message: result.deleted ? "Deleted session." : "Session was already deleted.",
            };
          },
        }),
      toggleFreeze: async () => undefined,
    },
  };
}
