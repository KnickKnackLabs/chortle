import { describe, expect, test } from "bun:test";

import { createSelector } from "./task-selection";

const tasks = ["text:transform", "math:sum", "deez:gonads"];

describe("task selection", () => {
  test("selects every task when no selectors are supplied", () => {
    expect(createSelector([])(tasks)).toEqual(tasks);
  });

  test("combines names and globs without duplicates, preserving inventory order", () => {
    expect(createSelector(["math:sum", "text:*", "math:*"])(tasks)).toEqual([
      "text:transform",
      "math:sum",
    ]);
  });

  test("rejects an unmatched selector even when another selector matches", () => {
    expect(() => createSelector(["math:*", "missing:*"])(tasks)).toThrow(
      'No local tasks match "missing:*"',
    );
  });
});
