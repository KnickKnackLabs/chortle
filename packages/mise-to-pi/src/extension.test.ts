import { expect, mock, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { ExecOptions } from "@earendil-works/pi-coding-agent";
import { $ } from "bun";

import { renderExtension } from "./extension";
import type { TaskMetadata } from "./task-metadata";

const projectDirectory = fileURLToPath(new URL("../../../", import.meta.url));

async function executeCommand(
  command: string,
  args: string[],
  options: ExecOptions,
) {
  const child = Bun.spawn([command, ...args], {
    cwd: options.cwd,
    signal: options.signal,
    env: { ...process.env, MISE_AUTO_INSTALL: "false" },
    stdout: "pipe",
    stderr: "pipe",
  });

  const [stdout, stderr, code] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);

  return { stdout, stderr, code, killed: child.signalCode !== null };
}

test("loads a generated extension and runs the text:transform Mise task", async () => {
  // Keep the generated file inside the project so it resolves Pi's installed modules.
  const generatedDirectory = await mkdtemp(
    join(projectDirectory, "node_modules/.mise-to-pi-test-"),
  );

  try {
    const metadata: TaskMetadata =
      await $`mise tasks info text:transform --json`
        .cwd(projectDirectory)
        .env({ ...process.env, MISE_AUTO_INSTALL: "false" })
        .json();

    const source = renderExtension(metadata, "../../");
    const extensionPath = join(generatedDirectory, "mise-tasks.ts");
    await Bun.write(extensionPath, source);

    const extension = await import(pathToFileURL(extensionPath).href);
    const registerTool = mock();
    const exec = mock(executeCommand);
    extension.default({ registerTool, exec });

    expect(registerTool).toHaveBeenCalledTimes(1);
    const tool = registerTool.mock.calls[0]?.[0];
    expect(tool.name).toBe("text_transform");

    const signal = new AbortController().signal;
    const result = await tool.execute(
      "generated-extension-test",
      { text: "Hello World", case: "upper", reverse: true },
      signal,
    );

    expect(exec).toHaveBeenCalledWith(
      "mise",
      [
        "run",
        "text:transform",
        "--case",
        "upper",
        "--reverse",
        "--",
        "Hello World",
      ],
      { cwd: projectDirectory, signal },
    );
    expect(result).toEqual({
      content: [{ type: "text", text: "DLROW OLLEH\n" }],
      details: { taskName: "text:transform", exitCode: 0, stderr: "" },
    });
  } finally {
    await rm(generatedDirectory, { recursive: true, force: true });
  }
});
