#!/usr/bin/env bun

import { buildParameters, readTaskMetadata } from "./generate";

const metadata = await readTaskMetadata("math:sum");
const parameters = buildParameters(metadata.usage_spec.cmd);
console.log(JSON.stringify(parameters, null, 2));
