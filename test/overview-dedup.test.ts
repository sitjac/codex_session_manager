import { describe, expect, it } from "vitest";

import { createManagerForTest, createTempWorkspace, writeRolloutFixture } from "./helpers.js";

function isoAtDaysAgo(daysAgo: number, hour: number): string {
  const date = new Date();
  date.setUTCHours(hour, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString();
}

describe("overview rename aggregation", () => {
  it("deduplicates repeated rename history from the same session", async () => {
    const previousDayAtNoon = isoAtDaysAgo(1, 12);
    const todayAtNoon = isoAtDaysAgo(0, 12);
    const todayAtOne = isoAtDaysAgo(0, 13);
    const previousDay = previousDayAtNoon.slice(0, 10);
    const today = todayAtNoon.slice(0, 10);
    const workspace = await createTempWorkspace();
    const manager = await createManagerForTest({
      codexHome: workspace.codexHome,
      stateDir: workspace.stateDir,
    });

    try {
      await writeRolloutFixture({
        codexHome: workspace.codexHome,
        threadId: "overview-dedup-1",
        userMessage: "第一个会话",
        lastAgentMessage: "第一个会话已经完成",
        updatedAt: todayAtNoon,
      });
      await writeRolloutFixture({
        codexHome: workspace.codexHome,
        threadId: "overview-dedup-2",
        userMessage: "第二个会话",
        lastAgentMessage: "第二个会话已经完成",
        updatedAt: todayAtOne,
      });

      await manager.scan();
      manager.db.recordRename({
        threadId: "overview-dedup-1",
        newName: "第一次命名",
        source: "manual",
        kind: "manual",
        style: "detailed",
        status: "applied",
        operator: "test",
        appliedAt: previousDayAtNoon,
        autoApply: false,
      });
      manager.db.recordRename({
        threadId: "overview-dedup-1",
        newName: "第二次命名",
        source: "manual",
        kind: "manual",
        style: "detailed",
        status: "applied",
        operator: "test",
        appliedAt: todayAtNoon,
        autoApply: false,
      });
      manager.db.recordRename({
        threadId: "overview-dedup-2",
        newName: "AI 命名",
        source: "ai",
        kind: "auto",
        style: "detailed",
        status: "applied",
        operator: "test",
        appliedAt: todayAtOne,
        autoApply: true,
      });

      const overview = await manager.overview();
      expect(overview.renameHistory.applied).toBe(2);
      expect(overview.renameHistory.manualApplied).toBe(1);
      expect(overview.renameHistory.aiApplied).toBe(1);
      expect(overview.renameHistory.autoApplied).toBe(1);

      const previousDayBucket = overview.activity.buckets.find(
        (bucket) => bucket.date === previousDay,
      );
      const todayBucket = overview.activity.buckets.find((bucket) => bucket.date === today);
      expect(previousDayBucket?.applied ?? 0).toBe(0);
      expect(todayBucket?.applied ?? 0).toBe(2);
    } finally {
      await manager.close();
    }
  });
});
