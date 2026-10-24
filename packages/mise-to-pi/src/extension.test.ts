import { describe, expect, mock, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { $ } from "bun";

import type { ExecOptions } from "@earendil-works/pi-coding-agent";

import { renderExtension } from "./extension";
import type { TaskMetadata } from "./task-metadata";
import {
  renderTool,
  withoutCollisions,
  withPrefix,
  withSanitation,
} from "./tool";

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

describe("generated extension", () => {
  test("loads multiple prefixed tools and runs their original Mise tasks", async () => {
    // Keep the generated file inside the project so it resolves Pi's installed modules.
    const generatedDirectory = await mkdtemp(
      join(projectDirectory, "node_modules/.mise-to-pi-test-"),
    );

    try {
      const metadata: TaskMetadata[] = await Promise.all(
        ["text:transform", "math:sum"].map((task) =>
          $`mise tasks info ${task} --json`
            .cwd(projectDirectory)
            .env({ ...process.env, MISE_AUTO_INSTALL: "false" })
            .json(),
        ),
      );

      let nameTool = (task: TaskMetadata) => task.name;
      nameTool = withPrefix("chortle")(nameTool);
      nameTool = withSanitation(nameTool);
      nameTool = withoutCollisions(new Map())(nameTool);

      const source = renderExtension(renderTool(nameTool))(
        metadata,
        projectDirectory,
      );

      const extensionPath = join(generatedDirectory, "mise-tasks.ts");
      await Bun.write(extensionPath, source);

      const extension = await import(pathToFileURL(extensionPath).href);
      const registerTool = mock();
      const exec = mock(executeCommand);
      extension.default({ registerTool, exec });
      expect(registerTool).toHaveBeenCalledTimes(2);

      const tool = registerTool.mock.calls[0]?.[0];
      expect(tool.name).toBe("chortle_text_transform");
      expect(tool.label).toBe("text:transform");

      const sumTool = registerTool.mock.calls[1]?.[0];
      expect(sumTool.name).toBe("chortle_math_sum");
      expect(sumTool.label).toBe("math:sum");

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

      const sumResult = await sumTool.execute(
        "generated-sum-test",
        { numbers: ["2", "3"] },
        signal,
      );

      expect(exec).toHaveBeenCalledTimes(2);
      expect(exec).toHaveBeenLastCalledWith(
        "mise",
        ["run", "math:sum", "--", "2", "3"],
        { cwd: projectDirectory, signal },
      );

      expect(sumResult).toEqual({
        content: [{ type: "text", text: "5\n" }],
        details: { taskName: "math:sum", exitCode: 0, stderr: "" },
      });
    } finally {
      await rm(generatedDirectory, { recursive: true, force: true });
    }
  });
});
