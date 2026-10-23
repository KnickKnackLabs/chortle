import dedentTemplate from "dedent";

import { renderArgv } from "./argv";
import { buildParameters } from "./parameter-schema";
import type { TaskMetadata } from "./task-metadata";

const dedent = dedentTemplate.withOptions({
  escapeSpecialCharacters: false,
  alignValues: true,
});

export const renderTool =
  ({ prefix = "" }) =>
  (metadata: TaskMetadata): string => {
    const name = prefix
      ? `${prefix}_${metadata.name}` //
      : metadata.name;

    const command = metadata.usage_spec.cmd;
    const parameters = JSON.stringify(buildParameters(command), null, 2);
    const argvCode = renderArgv(command);

    return dedent`
      pi.registerTool(defineTool({
        name: ${JSON.stringify(name.replace(/[^a-zA-Z0-9_]/g, "_"))},
        label: ${JSON.stringify(metadata.name)},
        description: ${JSON.stringify(metadata.description)},
        parameters: ${parameters} as const,

        async execute(_toolCallId, params, signal) {
          ${argvCode}
          return runTask(${JSON.stringify(metadata.name)}, argv, signal);
        }
      }));
    `;
  };
