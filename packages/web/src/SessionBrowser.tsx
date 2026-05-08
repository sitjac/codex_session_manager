import * as React from "react";
import { SessionDetailHeader } from "./features/sessions/SessionDetailHeader.js";
import { SessionListPane } from "./features/sessions/SessionListPane.js";
import type { UiLanguage } from "./i18n.js";
import { t } from "./i18n.js";
import { TranscriptPanel } from "./TranscriptPanel.js";
import type { SessionDetail, SessionSummary } from "./types.js";
import { AppViewTransition } from "./view-transitions.js";

const SESSION_PANE_MIN_WIDTH = 320;
const SESSION_PANE_MAX_WIDTH = 560;
const PANE_KEYBOARD_STEP = 24;

export function SessionBrowser(props: {
  sessions: SessionSummary[];
  search: string;
  selectedId?: string;
  detail: SessionDetail | null;
  focusMode: boolean;
  sessionPaneCollapsed: boolean;
  sessionPaneWidth: number;
  loadingSessions: boolean;
  loadingDetail: boolean;
  actioning: boolean;
  actionLabel: string | null;
  error: string | null;
  uiLanguage: UiLanguage;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  onSelectSession: (threadId: string) => void;
  onCopySessionId: (threadId: string) => void | Promise<void>;
  onDeleteSession: (threadId: string) => boolean | Promise<boolean>;
  onEnterFocusMode: () => void;
  onExitFocusMode: () => void;
  onToggleSessionPane: () => void;
  onSessionPaneWidthChange: (delta: number) => void;
  onStartSessionResize: (event: React.PointerEvent<HTMLDivElement>) => void;
  onRename: (name: string) => boolean | Promise<boolean>;
}) {
  const tt = React.useCallback(
    (key: Parameters<typeof t>[1]) => t(props.uiLanguage, key),
    [props.uiLanguage],
  );
  const sessionPaneToggleLabel = props.sessionPaneCollapsed
    ? tt("showSessions")
    : tt("hideSessions");

  const handleSessionSplitterKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      switch (event.key) {
        case "ArrowLeft":
        case "ArrowUp":
          event.preventDefault();
          props.onSessionPaneWidthChange(-PANE_KEYBOARD_STEP);
          break;
        case "ArrowRight":
        case "ArrowDown":
          event.preventDefault();
          props.onSessionPaneWidthChange(PANE_KEYBOARD_STEP);
          break;
        case "Home":
          event.preventDefault();
          props.onSessionPaneWidthChange(SESSION_PANE_MIN_WIDTH - props.sessionPaneWidth);
          break;
        case "End":
          event.preventDefault();
          props.onSessionPaneWidthChange(SESSION_PANE_MAX_WIDTH - props.sessionPaneWidth);
          break;
        default:
          break;
      }
    },
    [props],
  );

  return (
    <section
      className={
        props.focusMode
          ? "history-layout session-focus-mode"
          : props.sessionPaneCollapsed
            ? "history-layout session-pane-collapsed"
            : "history-layout"
      }
    >
      <SessionListPane
        error={props.error}
        loadingSessions={props.loadingSessions}
        onCopySessionId={props.onCopySessionId}
        onDeleteSession={props.onDeleteSession}
        onRefresh={props.onRefresh}
        onSearchChange={props.onSearchChange}
        onSelectSession={props.onSelectSession}
        onToggleSessionPane={props.onToggleSessionPane}
        search={props.search}
        selectedId={props.selectedId}
        sessionPaneCollapsed={props.sessionPaneCollapsed}
        sessions={props.sessions}
        uiLanguage={props.uiLanguage}
      />

      {!props.sessionPaneCollapsed && !props.focusMode ? (
        <div
          aria-controls="session-list-pane"
          aria-label={tt("resizeSessionList")}
          aria-orientation="vertical"
          aria-valuemax={SESSION_PANE_MAX_WIDTH}
          aria-valuemin={SESSION_PANE_MIN_WIDTH}
          aria-valuenow={props.sessionPaneWidth}
          className="history-splitter"
          onKeyDown={handleSessionSplitterKeyDown}
          onPointerDown={props.onStartSessionResize}
          role="separator"
          tabIndex={0}
        />
      ) : null}

      <section className="chat-view">
        {props.detail ? (
          <AppViewTransition
            default="none"
            enter={{ "nav-forward": "nav-forward", default: "fade-in" }}
            exit={{ "nav-forward": "nav-forward", default: "fade-out" }}
            key={props.detail.threadId}
          >
            <>
              <SessionDetailHeader
                actionLabel={props.actionLabel}
                actioning={props.actioning}
                detail={props.detail}
                focusMode={props.focusMode}
                onEnterFocusMode={props.onEnterFocusMode}
                onExitFocusMode={props.onExitFocusMode}
                onRename={props.onRename}
                onToggleSessionPane={props.onToggleSessionPane}
                sessionPaneToggleLabel={sessionPaneToggleLabel}
                tt={tt}
                uiLanguage={props.uiLanguage}
              />

              {props.error ? (
                <div className="error-banner notice-banner error">{props.error}</div>
              ) : null}

              <div className="chat-content-shell">
                <div className="chat-primary-stack">
                  {props.loadingDetail ? (
                    <div className="loading-state chat-loading">{tt("loadingSessionDetail")}</div>
                  ) : null}
                  <TranscriptPanel detail={props.detail} uiLanguage={props.uiLanguage} />
                </div>
              </div>
            </>
          </AppViewTransition>
        ) : (
          <div className="history-empty">
            <p>{tt("selectSessionHint")}</p>
            <div className="history-empty-actions">
              <button className="btn-sm" onClick={props.onToggleSessionPane} type="button">
                {tt("showSessions")}
              </button>
            </div>
          </div>
        )}
      </section>
    </section>
  );
}
