import { describe, expect, test } from "bun:test";

import type { TaskMetadata } from "./task-metadata";
import { withoutCollisions, withPrefix, withSanitation } from "./tool";

const taskNamed = (name: string): TaskMetadata => ({
  name,
  description: "",
  usage_spec: { cmd: { args: [], flags: [] } },
});

describe("tool name prefixes", () => {
  test("prepends the prefix and an underscore to the supplied name", () => {
    const nameTool = withPrefix("chortle")((task) => task.name);
    expect(nameTool(taskNamed("math:sum"))).toBe("chortle_math:sum");
  });
});

describe("tool name sanitation", () => {
  test("replaces punctuation while preserving letters, digits, and underscores", () => {
    const nameTool = withSanitation((task) => task.name);
    expect(nameTool(taskNamed("My_Project:build-assets.v2"))).toBe(
      "My_Project_build_assets_v2",
    );
  });
});

describe("tool name collisions", () => {
  test("rejects different tasks that produce the same tool name", () => {
    const nameTool = withoutCollisions(new Map())(() => "tool-name");

    // First call
    nameTool(taskNamed("task-1"));

    // Conflicting task
    expect(() => nameTool(taskNamed("task-2"))).toThrow(
      /Rename one task or select only one with --task\./i,
    );
  });

  test("allows repeated calls for the same task", () => {
    const nameTool = withoutCollisions(new Map())((task) => task.name);
    expect(nameTool(taskNamed("task-1"))).toBe("task-1");
    expect(nameTool(taskNamed("task-1"))).toBe("task-1");
  });
});
