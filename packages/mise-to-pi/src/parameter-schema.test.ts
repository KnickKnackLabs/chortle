import { describe, expect, test } from "bun:test";
import { buildParameters } from "./parameter-schema";
import type { UsageCommand } from "./task-metadata";

test("marks only required arguments and flags as required", () => {
  const command: UsageCommand = {
    args: [
      { name: "requiredArgument", required: true },
      { name: "optionalArgument", required: false },
    ],
    flags: [
      {
        name: "requiredValueFlag",
        long: ["required-value"],
        short: [],
        required: true,
        arg: { name: "requiredFlagValue", required: true },
      },
      {
        name: "optionalValueFlag",
        long: ["optional-value"],
        short: [],
        required: false,
        arg: { name: "optionalFlagValue", required: true },
      },
    ],
  };

  const parameters = buildParameters(command);

  expect(Object.keys(parameters.properties)).toEqual([
    "requiredArgument",
    "optionalArgument",
    "requiredValueFlag",
    "optionalValueFlag",
  ]);
  expect(parameters.required).toEqual([
    "requiredArgument",
    "requiredValueFlag",
  ]);
});

test("includes help, validation text, and choices in string schemas", () => {
  const command: UsageCommand = {
    args: [
      {
        name: "constrainedStringValue",
        help: "Choose an allowed string value",
        validate: "value matches '^allowed-'",
        choices: { choices: ["allowed-first", "allowed-second"] },
      },
    ],
    flags: [],
  };

  const parameters = buildParameters(command);

  expect(parameters.properties.constrainedStringValue).toEqual({
    type: "string",
    description:
      "Choose an allowed string value. Must satisfy: value matches '^allowed-'",
    enum: ["allowed-first", "allowed-second"],
  });
});

describe("parameter defaults", () => {
  test("preserves string flag defaults as strings", () => {
    const command: UsageCommand = {
      args: [],
      flags: [
        {
          name: "stringValueWithDefault",
          long: ["string-value"],
          short: [],
          arg: { name: "stringValueWithDefault", required: true },
          default: ["false"],
        },
      ],
    };

    const parameters = buildParameters(command);

    expect(parameters.properties.stringValueWithDefault).toMatchObject({
      type: "string",
      default: "false",
    });
  });

  test("converts boolean switch defaults from strings to booleans", () => {
    const command: UsageCommand = {
      args: [],
      flags: [
        {
          name: "enabledSwitchWithDefault",
          long: ["enabled-switch"],
          short: [],
          default: ["true"],
        },
        {
          name: "disabledSwitchWithDefault",
          long: ["disabled-switch"],
          short: [],
          default: ["false"],
        },
      ],
    };

    const parameters = buildParameters(command);

    expect(parameters.properties).toMatchObject({
      enabledSwitchWithDefault: { type: "boolean", default: true },
      disabledSwitchWithDefault: { type: "boolean", default: false },
    });
  });
});

describe("variadic argument schemas", () => {
  test("preserves help and item constraints inside an array schema", () => {
    const command: UsageCommand = {
      args: [
        {
          name: "constrainedVariadicValues",
          required: true,
          var: true,
          help: "Values selected from allowed choices",
          validate: "value matches '^allowed-'",
          choices: { choices: ["allowed-first", "allowed-second"] },
        },
      ],
      flags: [],
    };

    const parameters = buildParameters(command);

    expect(parameters.properties.constrainedVariadicValues).toMatchObject({
      type: "array",
      description: "Values selected from allowed choices",
      items: {
        type: "string",
        description:
          "Values selected from allowed choices. Must satisfy: value matches '^allowed-'",
        enum: ["allowed-first", "allowed-second"],
      },
    });
  });

  test("requires at least one item for a required variadic argument", () => {
    const command: UsageCommand = {
      args: [{ name: "requiredVariadicValues", required: true, var: true }],
      flags: [],
    };

    const parameters = buildParameters(command);

    expect(parameters.properties.requiredVariadicValues.minItems).toBe(1);
  });

  test("allows zero items for an optional variadic argument", () => {
    const command: UsageCommand = {
      args: [{ name: "optionalVariadicValues", required: false, var: true }],
      flags: [],
    };

    const parameters = buildParameters(command);

    expect(parameters.properties.optionalVariadicValues.minItems).toBe(0);
  });
});
