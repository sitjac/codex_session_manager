import { describe, expect, it } from "vitest";

import {
  eventRefreshResourcesForTab,
  liveRefreshResourcesForTab,
  panelResourcesForTab,
} from "../packages/web/src/control-deck-model.js";

describe("useControlDeckState resource planning", () => {
  it("does not load secondary panel resources in the simplified reader", () => {
    expect(panelResourcesForTab("sessions")).toEqual([]);
    expect(panelResourcesForTab("settings")).toEqual([]);
    expect(panelResourcesForTab("maintenance")).toEqual([]);
    expect(panelResourcesForTab("requeue")).toEqual([]);
    expect(panelResourcesForTab("daemon")).toEqual([]);
  });

  it("keeps live refresh focused on sessions", () => {
    expect(liveRefreshResourcesForTab("sessions")).toEqual(["sessions"]);
    expect(liveRefreshResourcesForTab("settings")).toEqual(["sessions"]);
    expect(liveRefreshResourcesForTab("maintenance")).toEqual(["sessions"]);
    expect(liveRefreshResourcesForTab("requeue")).toEqual(["sessions"]);
    expect(liveRefreshResourcesForTab("daemon")).toEqual(["sessions"]);
  });

  it("ignores prompt preview refresh requests in the simplified reader", () => {
    expect(liveRefreshResourcesForTab("settings", { includePromptPreview: true })).toEqual([
      "sessions",
    ]);
  });

  it("refreshes sessions only for session-impacting events", () => {
    expect(eventRefreshResourcesForTab("sessions", [{ type: "session.renamed" }])).toEqual([
      "sessions",
    ]);
    expect(eventRefreshResourcesForTab("sessions", [{ type: "session.applied" }])).toEqual([
      "sessions",
    ]);
    expect(eventRefreshResourcesForTab("sessions", [{ type: "scan.completed" }])).toEqual([
      "sessions",
    ]);
  });

  it("ignores non-session control events", () => {
    expect(eventRefreshResourcesForTab("settings", [{ type: "config.updated" }])).toEqual([]);
    expect(
      eventRefreshResourcesForTab("maintenance", [{ type: "maintenance.compact.completed" }]),
    ).toEqual([]);
  });
});
