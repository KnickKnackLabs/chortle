#!/usr/bin/env bun
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";

import { Command } from "commander";

import { renderExtension } from "./extension";
import { readTaskMetadata } from "./task-metadata";

type Args = {
  task: string;
  output: string;
  force: boolean;
};

const program = new Command()
  .name("mise-to-pi")
  .description("Generate standalone Pi tool extensions from Mise tasks")
  .requiredOption("-t, --task <name>", "Mise task to expose")
  .requiredOption("-o, --output <file>", "Write the extension to this file")
  .option("-f, --force", "Overwrite an existing output file", false)
  .parse();

const options = program.opts<Args>();

// Locate output file and its path in relation to us
const projectDirectory = process.cwd();
const outputPath = resolve(projectDirectory, options.output);
const outputDirectory = dirname(outputPath);

const relativeRoot = relative(outputDirectory, projectDirectory) || ".";

// Generate and save the extension
const metadata = await readTaskMetadata(options.task);
const source = renderExtension(metadata, `${relativeRoot}/`);

await mkdir(outputDirectory, { recursive: true });
await writeFile(outputPath, source, {
  flag: options.force ? "w" : "wx",
});
