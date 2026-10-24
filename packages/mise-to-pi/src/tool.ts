import dedentTemplate from "dedent";

import { renderArgv } from "./argv";
import { buildParameters } from "./parameter-schema";
import type { TaskMetadata } from "./task-metadata";

const dedent = dedentTemplate.withOptions({
  escapeSpecialCharacters: false,
  alignValues: true,
});

export type NameFn = (task: TaskMetadata) => string;

export const withPrefix =
  (prefix: string) =>
  (name: NameFn): NameFn =>
  (task: TaskMetadata) =>
    `${prefix}_${name(task)}`;

export const withSanitation =
  (name: NameFn): NameFn =>
  (task: TaskMetadata) =>
    name(task).replace(/[^a-zA-Z0-9_]/g, "_");

const raise = (e: Error): never => {
  throw e;
};

export const withoutCollisions =
  (tasks: Map<string, TaskMetadata>) =>
  (name: NameFn): NameFn =>
  (task: TaskMetadata) => {
    const out = name(task);

    const existing = tasks.get(out);
    !existing || existing.name === task.name
      ? tasks.set(out, task)
      : raise(
          new Error(
            `Tasks "${existing.name}" and "${task.name}" both generate tool name "${out}". ` +
              "Rename one task or select only one with --task.",
          ),
        );

    return out;
  };

export const renderTool =
  (name: NameFn) =>
  (task: TaskMetadata): string => {
    const command = task.usage_spec.cmd;
    const parameters = JSON.stringify(buildParameters(command), null, 2);
    const argvCode = renderArgv(command);

    return dedent`
      pi.registerTool(defineTool({
        name: ${JSON.stringify(name(task))},
        label: ${JSON.stringify(task.name)},
        description: ${JSON.stringify(task.description)},
        parameters: ${parameters} as const,

        async execute(_toolCallId, params, signal) {
          ${argvCode}
          return runTask(${JSON.stringify(task.name)}, argv, signal);
        }
      }));
    `;
  };
