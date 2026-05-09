import type { HealthStatus } from "@codexnamer/shared";

export function getHealthStatus(): HealthStatus {
  return {
    ok: true,
    name: "codex-session-manager",
  };
}
