#!/usr/bin/env bun
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { Command } from "commander";

import { renderExtension } from "./extension";
import {
  readLocalTaskNames,
  readTaskMetadata,
  type TaskMetadata,
} from "./task-metadata";
import { createSelector } from "./task-selection";
import {
  renderTool,
  withoutCollisions,
  withPrefix,
  withSanitation,
} from "./tool";

type Args = {
  task: string[];
  prefix: string;
  output?: string;
  force: boolean;
};

const program = new Command()
  .name("mise-to-pi")
  .description("Generate standalone Pi tool extensions from Mise tasks")
  .argument("[project-directory]", "Mise project directory", ".")
  .requiredOption(
    "-t, --task <selectors...>",
    "Task names or globs to expose",
    [],
  )
  .option("-p, --prefix <prefix>", "Prefix generated tool names", "")
  .option("-o, --output <file>", "Write the extension to this file")
  .option("-f, --force", "Overwrite an existing output file", false)
  .parse();

const options = program.opts<Args>();
const projectDirectory = resolve(program.args[0] ?? ".");

const tasks = createSelector(options.task)(
  await readLocalTaskNames(projectDirectory)(), // tasks
);

// Generate and save the extension
const metadata = await Promise.all(
  tasks.map(readTaskMetadata(projectDirectory)), // metadata
);

let nameTool = (task: TaskMetadata) => task.name;
nameTool = options.prefix ? withPrefix(options.prefix)(nameTool) : nameTool;
nameTool = withSanitation(nameTool);
nameTool = withoutCollisions(new Map())(nameTool);

const source = renderExtension(renderTool(nameTool))(
  metadata,
  projectDirectory,
);

if (options.output === undefined) {
  process.stdout.write(source);
} else {
  const outputPath = resolve(options.output);
  const outputDirectory = dirname(outputPath);

  await mkdir(outputDirectory, { recursive: true });
  await writeFile(outputPath, source, {
    flag: options.force ? "w" : "wx",
  });
}
