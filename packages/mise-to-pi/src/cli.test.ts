import { describe, expect, test } from "bun:test";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { $ } from "bun";

import dedent from "dedent";

const projectDirectory = resolve(import.meta.dir, "../../..");
const cliPath = join(import.meta.dir, "cli.ts");

describe("CLI", () => {
  test("writes the selected tool into a new nested output file", async () => {
    const temporaryDirectory = await mkdtemp(
      join(projectDirectory, "node_modules/.mise-to-pi-cli-"),
    );

    try {
      const outputPath = join(temporaryDirectory, "nested", "mise-tasks.ts");

      await $`${process.execPath} ${cliPath} --task math:sum --output ${outputPath}`
        .cwd(projectDirectory)
        .env({ ...process.env, MISE_AUTO_INSTALL: "false" })
        .quiet();

      const source = await Bun.file(outputPath).text();

      expect(source).toContain('name: "math_sum"');
      expect(source).toContain(
        `const projectDirectory = ${JSON.stringify(projectDirectory)};`,
      );
    } finally {
      await rm(temporaryDirectory, {
        recursive: true,
        force: true,
      });
    }
  });

  test("prints selected prefixed tools to stdout when no output file is supplied", async () => {
    const result =
      await $`${process.execPath} ${cliPath} --task 'text:*' --task math:sum text:transform --prefix demo-project`
        .cwd(projectDirectory)
        .env({ ...process.env, MISE_AUTO_INSTALL: "false" })
        .quiet();

    const source = result.stdout.toString();
    const toolNames = Array.from(
      source.matchAll(/^\s+name: "([^"]+)"/gm),
      (match) => match[1],
    );

    expect(toolNames).toEqual([
      "demo_project_math_sum",
      "demo_project_text_transform",
    ]);
    expect(source).toContain(
      `const projectDirectory = ${JSON.stringify(projectDirectory)};`,
    );
    expect(() =>
      new Bun.Transpiler({ loader: "ts" }).transformSync(source),
    ).not.toThrow();
  });

  test("includes every local task when no selectors are supplied", async () => {
    const result = await $`${process.execPath} ${cliPath}`
      .cwd(projectDirectory)
      .env({ ...process.env, MISE_AUTO_INSTALL: "false" })
      .quiet();

    const toolNames = Array.from(
      result.stdout.toString().matchAll(/^\s+name: "([^"]+)"/gm),
      (match) => match[1],
    );

    expect(toolNames).toEqual(["deez_gonads", "math_sum", "text_transform"]);
  });

  test("rejects an unmatched selector before creating output directories", async () => {
    const temporaryDirectory = await mkdtemp(
      join(projectDirectory, "node_modules/.mise-to-pi-cli-"),
    );

    try {
      const outputPath = join(temporaryDirectory, "nested", "mise-tasks.ts");

      const result =
        await $`${process.execPath} ${cliPath} --task math:sum --task 'missing:*' --output ${outputPath}`
          .cwd(projectDirectory)
          .env({ ...process.env, MISE_AUTO_INSTALL: "false" })
          .nothrow()
          .quiet();

      expect(result.exitCode).not.toBe(0);
      expect(result.stdout.toString()).toBe("");
      expect(result.stderr.toString()).toContain(
        'No local tasks match "missing:*"',
      );

      expect(await readdir(temporaryDirectory)).toEqual([]);
    } finally {
      await rm(temporaryDirectory, { recursive: true, force: true });
    }
  });

  test("rejects colliding tool names before printing source or creating output directories", async () => {
    const temporaryDirectory = await mkdtemp(
      join(projectDirectory, "node_modules/.mise-to-pi-cli-"),
    );

    const mise = dedent`
      [tasks."foo-bar"]
      run = "echo first"

      [tasks."foo:bar"]
      run = "echo second"
    `;

    try {
      await Bun.write(join(temporaryDirectory, "mise.toml"), mise);
      const outputPath = join(temporaryDirectory, "nested", "mise-tasks.ts");

      const result =
        await $`${process.execPath} ${cliPath} --task foo-bar --task foo:bar --output ${outputPath}`
          .cwd(temporaryDirectory)
          .env({
            ...process.env,
            MISE_AUTO_INSTALL: "false",
            MISE_TRUSTED_CONFIG_PATHS: temporaryDirectory,
          })
          .nothrow()
          .quiet();

      expect(result.exitCode).not.toBe(0);
      expect(result.stdout.toString()).toBe("");
      expect(result.stderr.toString()).toContain(
        'Tasks "foo-bar" and "foo:bar" both generate tool name "foo_bar". ' +
          "Rename one task or select only one with --task.",
      );
      expect(await readdir(temporaryDirectory)).toEqual(["mise.toml"]);
    } finally {
      await rm(temporaryDirectory, { recursive: true, force: true });
    }
  });

  test("refuses to overwrite an existing file without --force", async () => {
    const temporaryDirectory = await mkdtemp(
      join(projectDirectory, "node_modules/.mise-to-pi-cli-"),
    );

    try {
      const outputPath = join(temporaryDirectory, "mise-tasks.ts");
      const originalSource = "// Existing extension.\n";
      await Bun.write(outputPath, originalSource);

      const result =
        await $`${process.execPath} ${cliPath} --task math:sum --output ${outputPath}`
          .cwd(projectDirectory)
          .env({ ...process.env, MISE_AUTO_INSTALL: "false" })
          .nothrow()
          .quiet();

      const remainingSource = await Bun.file(outputPath).text();

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr.toString()).toContain("EEXIST");

      expect(remainingSource).toBe(originalSource);
    } finally {
      await rm(temporaryDirectory, {
        recursive: true,
        force: true,
      });
    }
  });

  test("replaces an existing file when --force is supplied", async () => {
    const temporaryDirectory = await mkdtemp(
      join(projectDirectory, "node_modules/.mise-to-pi-cli-"),
    );

    try {
      const outputPath = join(temporaryDirectory, "mise-tasks.ts");
      const originalSource = "// Existing extension.\n";
      await Bun.write(outputPath, originalSource);

      await $`${process.execPath} ${cliPath} --task math:sum --output ${outputPath} --force`
        .cwd(projectDirectory)
        .env({ ...process.env, MISE_AUTO_INSTALL: "false" })
        .quiet();

      const replacementSource = await Bun.file(outputPath).text();

      expect(replacementSource).not.toBe(originalSource);
      expect(replacementSource).toContain('name: "math_sum"');
    } finally {
      await rm(temporaryDirectory, {
        recursive: true,
        force: true,
      });
    }
  });
});
