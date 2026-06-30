#!/usr/bin/env node

// eslint-disable-next-line node/shebang
import { execute } from '@oclif/core';

// No top-level `await`: on Node >=24.x a pending top-level await at process
// exit is mis-flagged as "Detected unsettled top-level await" → the CLI exits
// 13 with no stdout (nodejs/node#58398). `execute` already awaits
// run + flush + Errors.handle internally, so fire-and-forget is sufficient.
void execute({ dir: import.meta.url });
