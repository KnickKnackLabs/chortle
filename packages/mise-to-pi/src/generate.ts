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
