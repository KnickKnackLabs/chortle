import type { UsageArgument, UsageCommand, UsageFlag } from "./task-metadata";

function getFlagSpelling(flag: UsageFlag): string {
  const longName = flag.long?.[0];
  if (longName !== undefined) {
    return `--${longName}`;
  }

  const shortName = flag.short?.[0];
  if (shortName !== undefined) {
    return `-${shortName}`;
  }

  throw new Error(`Flag "${flag.name}" has no command-line spelling`);
}

function renderValueFlag(flag: UsageFlag): string {
  const flagName = JSON.stringify(getFlagSpelling(flag));
  const value = `params[${JSON.stringify(flag.name)}]`;
  const statement = `argv.push(${flagName}, ${value});`;

  if (flag.required) {
    return statement;
  }

  return [
    `if (${value} !== undefined) {`,
    `  ${statement}`,
    `}`, //
  ].join("\n");
}

function renderBooleanFlag(flag: UsageFlag): string {
  const flagName = JSON.stringify(getFlagSpelling(flag));
  const value = `params[${JSON.stringify(flag.name)}]`;

  return [
    `if (${value} === true) {`,
    `  argv.push(${flagName});`,
    `}`, //
  ].join("\n");
}

function renderFlag(flag: UsageFlag): string {
  return flag.arg //
    ? renderValueFlag(flag)
    : renderBooleanFlag(flag);
}

function renderPositionalArg(argument: UsageArgument): string {
  const value = `params[${JSON.stringify(argument.name)}]`;
  const values = argument.var ? `...${value}` : value;
  const statement = `argv.push(${values});`;

  if (argument.required) {
    return statement;
  }

  return [
    `if (${value} !== undefined) {`,
    `  ${statement}`,
    `}`, //
  ].join("\n");
}

export function renderArgv(command: UsageCommand): string {
  const lines = ["const argv: string[] = [];"];

  if (command.flags.length > 0) {
    lines.push(
      "",
      "// Leave omitted options to Mise's defaults.",
      ...command.flags.map(renderFlag),
    );
  }

  if (command.args.length > 0) {
    lines.push(
      "",
      "// Keep positional values from being interpreted as flags.",
      'argv.push("--");',
      ...command.args.map(renderPositionalArg),
    );
  }

  return lines.join("\n");
}
