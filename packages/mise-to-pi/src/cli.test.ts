import { expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { $ } from "bun";

const projectDirectory = resolve(import.meta.dir, "../../..");
const cliPath = join(import.meta.dir, "cli.ts");

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
    expect(source).toContain('new URL("../../../", import.meta.url)');
  } finally {
    await rm(temporaryDirectory, {
      recursive: true,
      force: true,
    });
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
