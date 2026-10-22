#!/usr/bin/env bun
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";

import { Command } from "commander";

import { renderExtension } from "./extension";
import { readTaskMetadata } from "./task-metadata";

type Args = {
  output: string;
};

const program = new Command()
  .name("mise-to-pi")
  .description("Generate standalone Pi tool extensions from Mise tasks")
  .requiredOption("-o, --output <file>", "Write the extension to this file")
  .parse();

const options = program.opts<Args>();

// Locate output file and its path in relation to us
const projectDirectory = process.cwd();
const outputPath = resolve(projectDirectory, options.output);
const outputDirectory = dirname(outputPath);

const relativeRoot = relative(outputDirectory, projectDirectory) || ".";

// Generate and save the extension
const metadata = await readTaskMetadata("text:transform");
const source = renderExtension(metadata, `${relativeRoot}/`);

await mkdir(outputDirectory, { recursive: true });
await writeFile(outputPath, source, { flag: "wx" });
