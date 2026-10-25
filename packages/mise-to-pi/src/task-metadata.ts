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

export const readTaskMetadata = (directory: string) => {
  return async (name: string): Promise<TaskMetadata> =>
    $`mise tasks info ${name} --json`.cwd(directory).json();
};

type TaskSummary = {
  name: string;
};

export const readLocalTaskNames = (directory: string) => {
  return async (): Promise<string[]> => {
    const tasks = (await $`mise tasks ls --local --json`
      .cwd(directory)
      .json()) as TaskSummary[];

    return tasks.map((task) => task.name);
  };
};
