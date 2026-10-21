#!/usr/bin/env bun

import { buildParameters, readTaskMetadata, renderArgv } from "./generate";

// const metadata = await readTaskMetadata("math:sum");
// const parameters = buildParameters(metadata.usage_spec.cmd);
// console.log(JSON.stringify(parameters, null, 2));

const metadata = await readTaskMetadata("text:transform");
console.log(renderArgv(metadata.usage_spec.cmd));
