#!/usr/bin/env bun
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { Command } from "commander";

import { renderExtension } from "./extension";
import { readLocalTaskNames, readTaskMetadata } from "./task-metadata";
import { createSelector } from "./task-selection";
import { renderTool } from "./tool";

type Args = {
  task: string[];
  prefix: string;
  output?: string;
  force: boolean;
};

const program = new Command()
  .name("mise-to-pi")
  .description("Generate standalone Pi tool extensions from Mise tasks")
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

const tasks = createSelector(options.task)(
  await readLocalTaskNames(), // tasks
);

// Generate and save the extension
const metadata = await Promise.all(
  tasks.map(readTaskMetadata), // metadata
);

const projectDirectory = process.cwd();
const source = renderExtension(renderTool({ prefix: options.prefix }))(
  metadata,
  projectDirectory,
);

if (options.output === undefined) {
  process.stdout.write(source);
} else {
  const outputPath = resolve(projectDirectory, options.output);
  const outputDirectory = dirname(outputPath);

  await mkdir(outputDirectory, { recursive: true });
  await writeFile(outputPath, source, {
    flag: options.force ? "w" : "wx",
  });
}
