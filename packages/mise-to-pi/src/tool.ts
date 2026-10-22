import dedentTemplate from "dedent";

import { renderArgv } from "./argv";
import { buildParameters } from "./parameter-schema";
import type { TaskMetadata } from "./task-metadata";

const dedent = dedentTemplate.withOptions({
  escapeSpecialCharacters: false,
  alignValues: true,
});

export function renderTool(metadata: TaskMetadata): string {
  const command = metadata.usage_spec.cmd;
  const toolName = metadata.name.replace(/[^a-zA-Z0-9_]/g, "_");
  const parameters = JSON.stringify(buildParameters(command), null, 2);
  const argvCode = renderArgv(command);

  return dedent`
    pi.registerTool(defineTool({
      name: ${JSON.stringify(toolName)},
      label: ${JSON.stringify(metadata.name)},
      description: ${JSON.stringify(metadata.description)},
      parameters: ${parameters} as const,

      async execute(_toolCallId, params, signal) {
        ${argvCode}
        return runTask(${JSON.stringify(metadata.name)}, argv, signal);
      }
    }));
  `;
}
