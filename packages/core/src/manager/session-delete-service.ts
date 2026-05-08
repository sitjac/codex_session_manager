import fs from "node:fs/promises";
import type { SessionDeleteResult } from "@codexnamer/shared";

import { removeSessionIndexThread } from "../session-index.js";
import type { ManagerServiceContext } from "./shared.js";

export async function deleteSession(
  context: ManagerServiceContext,
  threadId: string,
): Promise<SessionDeleteResult> {
  await context.scan();
  const detail = context.db.getSessionDetail(threadId);
  if (!detail) {
    return {
      threadId,
      deleted: false,
      removedIndexEntries: 0,
    };
  }

  const deleted = context.db.deleteSession(threadId);
  if (!deleted.deleted) {
    return {
      threadId,
      deleted: false,
      removedIndexEntries: 0,
    };
  }

  await fs.rm(detail.rolloutPath, { force: true });
  const indexRemoval = await removeSessionIndexThread({
    filePath: context.sessionIndexPath,
    threadId,
  });
  context.invalidateSessionIndexCache();

  return {
    threadId,
    deleted: true,
    rolloutPath: detail.rolloutPath,
    removedIndexEntries: indexRemoval.removed,
  };
}
