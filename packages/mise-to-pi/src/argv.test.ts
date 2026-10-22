import { describe, expect, test } from "bun:test";
import { renderArgv } from "./argv";
import type { UsageCommand } from "./task-metadata";

function compileArgvBuilder(command: UsageCommand) {
  const source = renderArgv(command);
  const transpiler = new Bun.Transpiler({ loader: "ts" });
  const javascript = transpiler.transformSync(source);
  const buildArgv = new Function("params", `${javascript}\nreturn argv;`);

  return buildArgv;
}

test("includes required value flags and only supplied optional value flags", () => {
  const command: UsageCommand = {
    args: [],
    flags: [
      {
        name: "requiredValue",
        long: ["required-value"],
        short: [],
        required: true,
        arg: { name: "requiredValue", required: true },
      },
      {
        name: "optionalValue",
        long: ["optional-value"],
        short: [],
        required: false,
        arg: { name: "optionalValue", required: true },
      },
    ],
  };

  const buildArgv = compileArgvBuilder(command);

  const withoutOptionalValue = buildArgv({
    requiredValue: "supplied-required-value",
  });
  const withOptionalValue = buildArgv({
    requiredValue: "supplied-required-value",
    optionalValue: "supplied-optional-value",
  });

  expect(withoutOptionalValue).toEqual([
    "--required-value",
    "supplied-required-value",
  ]);
  expect(withOptionalValue).toEqual([
    "--required-value",
    "supplied-required-value",
    "--optional-value",
    "supplied-optional-value",
  ]);
});

test("emits boolean switches only when their value is true", () => {
  const command: UsageCommand = {
    args: [],
    flags: [
      {
        name: "booleanSwitch",
        long: ["boolean-switch"],
        short: [],
        required: false,
      },
    ],
  };

  const buildArgv = compileArgvBuilder(command);

  const omittedSwitch = buildArgv({});
  const disabledSwitch = buildArgv({ booleanSwitch: false });
  const enabledSwitch = buildArgv({ booleanSwitch: true });

  expect(omittedSwitch).toEqual([]);
  expect(disabledSwitch).toEqual([]);
  expect(enabledSwitch).toEqual(["--boolean-switch"]);
});

test("preserves positional values containing spaces or leading dashes after --", () => {
  const command: UsageCommand = {
    args: [
      { name: "valueWithSpaces", required: true },
      { name: "valueWithLeadingDash", required: true },
    ],
    flags: [],
  };

  const buildArgv = compileArgvBuilder(command);

  const positionalValues = buildArgv({
    valueWithSpaces: "value with spaces",
    valueWithLeadingDash: "--not-an-option",
  });

  expect(positionalValues).toEqual([
    "--",
    "value with spaces",
    "--not-an-option",
  ]);
});

test("omits absent optional positional values but preserves supplied empty strings", () => {
  const command: UsageCommand = {
    args: [{ name: "optionalValue", required: false }],
    flags: [],
  };

  const buildArgv = compileArgvBuilder(command);

  const omittedValue = buildArgv({});
  const suppliedValue = buildArgv({ optionalValue: "supplied-value" });
  const suppliedEmptyString = buildArgv({ optionalValue: "" });

  expect(omittedValue).toEqual(["--"]);
  expect(suppliedValue).toEqual(["--", "supplied-value"]);
  expect(suppliedEmptyString).toEqual(["--", ""]);
});

test("spreads variadic positional values into separate argv entries", () => {
  const command: UsageCommand = {
    args: [{ name: "variadicValues", required: true, var: true }],
    flags: [],
  };

  const buildArgv = compileArgvBuilder(command);

  const separateValues = buildArgv({
    variadicValues: ["first-value", "second-value", "-3"],
  });

  expect(separateValues).toEqual(["--", "first-value", "second-value", "-3"]);
});

describe("flag spellings", () => {
  test("prefers a long spelling when both spellings exist", () => {
    const command: UsageCommand = {
      args: [],
      flags: [
        {
          name: "valueWithLongAndShortSpellings",
          long: ["preferred-long"],
          short: ["p"],
          required: true,
          arg: { name: "valueWithLongAndShortSpellings", required: true },
        },
      ],
    };

    const buildArgv = compileArgvBuilder(command);

    const selectedSpelling = buildArgv({
      valueWithLongAndShortSpellings: "supplied-value",
    });

    expect(selectedSpelling).toEqual(["--preferred-long", "supplied-value"]);
  });

  test("uses a short spelling when no long spelling exists", () => {
    const command: UsageCommand = {
      args: [],
      flags: [
        {
          name: "valueWithShortSpellingOnly",
          long: [],
          short: ["s"],
          required: true,
          arg: { name: "valueWithShortSpellingOnly", required: true },
        },
      ],
    };

    const buildArgv = compileArgvBuilder(command);

    const selectedSpelling = buildArgv({
      valueWithShortSpellingOnly: "supplied-value",
    });

    expect(selectedSpelling).toEqual(["-s", "supplied-value"]);
  });

  test("rejects a flag with neither spelling", () => {
    const command: UsageCommand = {
      args: [],
      flags: [
        {
          name: "valueWithoutFlagSpelling",
          long: [],
          short: [],
          required: true,
          arg: { name: "valueWithoutFlagSpelling", required: true },
        },
      ],
    };

    expect(() => renderArgv(command)).toThrow(
      'Flag "valueWithoutFlagSpelling" has no command-line spelling',
    );
  });
});
