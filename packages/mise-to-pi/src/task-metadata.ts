import { $ } from "bun";

export type UsageArgument = {
  name: string;
  help?: string;
  required?: boolean;
  var?: boolean;
  validate?: string;
  choices?: {
    choices: string[];
  };
};

export type UsageFlag = {
  name: string;
  long: string[];
  short: string[];
  help?: string;
  required?: boolean;
  arg?: UsageArgument;
  default?: string[];
};

export type UsageCommand = {
  args: UsageArgument[];
  flags: UsageFlag[];
};

export type TaskMetadata = {
  name: string;
  description: string;
  usage_spec: {
    cmd: UsageCommand;
  };
};

export async function readTaskMetadata(name: string): Promise<TaskMetadata> {
  return $`mise tasks info ${name} --json`.json();
}
