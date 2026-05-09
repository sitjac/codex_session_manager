#!/usr/bin/env node

import { getHealthStatus } from "@codexnamer/core";

export function health() {
  return getHealthStatus();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(health(), null, 2));
}
