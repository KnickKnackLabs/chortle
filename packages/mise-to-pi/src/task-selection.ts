import { Glob } from "bun";

type SelectorFn = (tasks: string[]) => string[];

const applySelector = (selector: string) => {
  const pattern = new Glob(selector);

  return (tasks: string[]) => {
    const matches = tasks.filter((name: string) => pattern.match(name));

    if (matches.length === 0) {
      throw new Error(`No local tasks match "${selector}"`);
    }

    return matches;
  };
};

const composeSelectors = (selectors: SelectorFn[]) => {
  return (tasks: string[]) => {
    if (selectors.length === 0) {
      return tasks;
    }

    const matches = new Set(
      selectors.flatMap((selector) => selector(tasks)), //
    );

    return tasks.filter((name) => matches.has(name));
  };
};

export const createSelector = (selectors: string[]): SelectorFn =>
  composeSelectors(selectors.map(applySelector));
