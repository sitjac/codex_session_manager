#!/usr/bin/env node

import { getHealthStatus } from "@codexnamer/core";

console.log(JSON.stringify(getHealthStatus(), null, 2));
