import { useEffect, useState } from "react";

import { fetchSessionTranscript } from "./api.js";
import { transcriptTone } from "./browser-utils.js";
import type { UiLanguage } from "./i18n.js";
import { t, transcriptRoleLabel } from "./i18n.js";
import type { SessionDetail, SessionTranscriptPage } from "./types.js";

const TRANSCRIPT_PAGE_SIZE = 30;

export function TranscriptPanel(props: { detail: SessionDetail; uiLanguage: UiLanguage }) {
  const [pageState, setPageState] = useState<SessionTranscriptPage | null>(null);
  const [items, setItems] = useState<SessionTranscriptPage["items"]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    void fetchSessionTranscript(props.detail.threadId, {
      page: 1,
      pageSize: TRANSCRIPT_PAGE_SIZE,
      includeHidden: false,
      role: "all",
    })
      .then((payload) => {
        if (!active) {
          return;
        }
        setPageState(payload);
        setItems(payload.items.filter((item) => item.kind === "message" && item.role !== "system"));
      })
      .catch((nextError) => {
        if (!active) {
          return;
        }
        setError(nextError instanceof Error ? nextError.message : "Failed to load transcript");
        setPageState(null);
        setItems([]);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [props.detail.threadId]);

  const loadEarlier = async () => {
    if (!pageState?.hasMore || loading) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const nextPage = await fetchSessionTranscript(props.detail.threadId, {
        page: pageState.page + 1,
        pageSize: pageState.pageSize,
        includeHidden: false,
        role: "all",
      });
      setItems((previous) => [
        ...nextPage.items.filter((item) => item.kind === "message" && item.role !== "system"),
        ...previous,
      ]);
      setPageState(nextPage);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to load transcript");
    } finally {
      setLoading(false);
    }
  };

  const totalShown = items.length;
  const hiddenOlderCount = Math.max(0, (pageState?.totalItems ?? 0) - totalShown);
  const tt = (key: Parameters<typeof t>[1]) => t(props.uiLanguage, key);

  return (
    <section className="chat-view-shell">
      <div className="chat-messages">
        {pageState?.hasMore ? (
          <div className="load-more">
            <button className="btn-sm" onClick={() => void loadEarlier()} type="button">
              {loading
                ? tt("loading")
                : `${tt("loadEarlierMessages")} (${Math.min(hiddenOlderCount, pageState.pageSize)})`}
            </button>
          </div>
        ) : null}

        {error ? <div className="error-banner transcript-error">{error}</div> : null}
        {!loading && items.length === 0 ? (
          <div className="empty-note">{tt("noTranscript")}</div>
        ) : null}

        <div className="messages-container">
          {items.map((item) => (
            <article className="message-turn" data-role={item.role} key={item.id}>
              <div className="turn-header">
                <div className="turn-header-left">
                  <span className={`message-role ${transcriptTone(item.role)}`}>
                    {transcriptRoleLabel(item.role, props.uiLanguage)}
                  </span>
                </div>
              </div>
              <pre className="turn-body">{item.content}</pre>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
