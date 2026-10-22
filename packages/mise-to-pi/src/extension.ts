import dedentTemplate from "dedent";

import type { TaskMetadata } from "./task-metadata";
import { renderTool } from "./tool";

const dedent = dedentTemplate.withOptions({
  escapeSpecialCharacters: false,
  alignValues: true,
});

const renderRunner = (): string => dedent`
  async function runTask(
    taskName: string,
    argv: string[],
    signal?: AbortSignal,
  ) {
    const commandArguments = ["run", taskName, ...argv];

    const executionOptions = {
      cwd: projectDirectory,
      signal,
    };

    const result = await pi.exec(
      "mise",
      commandArguments,
      executionOptions,
    );

    if (result.killed) {
      throw new Error("Task cancelled");
    }

    if (result.code !== 0) {
      throw new Error(
        // biome-ignore lint/style/useTemplate: generated code
        result.stderr || "Mise task failed with exit code " + result.code,
      );
    }

    return {
      content: [{
        type: "text" as const,
        text: result.stdout,
      }],

      details: {
        taskName,
        exitCode: result.code,
        stderr: result.stderr,
      },
    };
  }
`;

export function renderExtension(
  metadata: TaskMetadata,
  relativeProjectRoot: string,
): string {
  const runnerCode = renderRunner();
  const toolCode = renderTool(metadata);
  const projectRoot = JSON.stringify(relativeProjectRoot);

  return dedent`
    import { fileURLToPath } from "node:url";
    import {
      defineTool,
      type ExtensionAPI,
    } from "@earendil-works/pi-coding-agent";

    const projectDirectory = fileURLToPath(
      new URL(${projectRoot}, import.meta.url),
    );

    export default function (pi: ExtensionAPI) {
      ${runnerCode}
      ${toolCode}
    }
  `;
}
