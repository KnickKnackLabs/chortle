import { $ } from "bun";

type UsageArgument = {
  name: string;
  help?: string;
  required?: boolean;
  var?: boolean;
  validate?: string;
  choices?: {
    choices: string[];
  };
};

type UsageFlag = {
  name: string;
  long: string[];
  short: string[];
  help?: string;
  required?: boolean;
  arg?: UsageArgument;
  default?: string[];
};

type UsageCommand = {
  args: UsageArgument[];
  flags: UsageFlag[];
};

type TaskMetadata = {
  name: string;
  description: string;
  usage_spec: {
    cmd: UsageCommand;
  };
};

export async function readTaskMetadata(name: string): Promise<TaskMetadata> {
  return $`mise tasks info ${name} --json`.json();
}

function buildArgument(argument: UsageArgument) {
  const descriptions = [argument.help ?? ""];

  if (argument.validate) {
    descriptions.push(`Must satisfy: ${argument.validate}`);
  }

  const valueSchema = {
    type: "string" as const,
    description: descriptions.join(". "),
    enum: argument.choices?.choices,
  };

  if (!argument.var) {
    return valueSchema;
  }

  return {
    type: "array" as const,
    description: argument.help ?? "",
    items: valueSchema,
    minItems: argument.required ? 1 : 0,
  };
}

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
    `if (${value}) !== undefined {`,
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

function buildFlag(flag: UsageFlag) {
  if (flag.arg) {
    const argumentSchema = buildArgument({
      ...flag.arg,
      help: flag.help ?? flag.arg.help,
    });

    return {
      ...argumentSchema,
      default: flag.default?.[0],
    };
  }

  const defaultText = flag.default?.[0];
  const defaultValue =
    defaultText === undefined ? undefined : defaultText === "true";

  return {
    type: "boolean" as const,
    description: flag.help ?? "",
    default: defaultValue,
  };
}

export function buildParameters(command: UsageCommand) {
  const argumentProperties = command.args.map((argument) => [
    argument.name,
    buildArgument(argument),
  ]);

  const flagProperties = command.flags.map((flag) => [
    flag.name,
    buildFlag(flag),
  ]);

  const required = [...command.args, ...command.flags]
    .filter((parameter) => parameter.required)
    .map((parameter) => parameter.name);

  return {
    type: "object" as const,
    properties: Object.fromEntries([...argumentProperties, ...flagProperties]),
    required,
  };
}
