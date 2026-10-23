import dedentTemplate from "dedent";

import type { TaskMetadata } from "./task-metadata";

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

type ToolRenderer = (metadata: TaskMetadata) => string;

export const renderExtension =
  (renderTool: ToolRenderer) =>
  (metadata: TaskMetadata[], projectDirectory: string): string =>
    dedent`
      import {
        defineTool,
        type ExtensionAPI,
      } from "@earendil-works/pi-coding-agent";

      const projectDirectory = ${JSON.stringify(projectDirectory)};

      export default function (pi: ExtensionAPI) {
        ${renderRunner()}
        ${metadata.map(renderTool).join("\n\n")}
      }
    `;
