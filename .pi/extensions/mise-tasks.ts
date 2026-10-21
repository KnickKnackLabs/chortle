import { fileURLToPath } from "node:url";

import { Type } from "@earendil-works/pi-ai";
import { defineTool, type ExtensionAPI } from "@earendil-works/pi-coding-agent";

const projectDirectory = fileURLToPath(new URL("../../", import.meta.url));

export default async function (pi: ExtensionAPI) {
  async function describeTask(taskName: string) {
    const metadata = await pi.exec("mise", ["tasks", "info", taskName, "--json"], {
      cwd: projectDirectory,
    });
    if (metadata.code !== 0) {
      throw new Error(metadata.stderr || `Could not read ${taskName} task metadata.`);
    }

    const task = JSON.parse(metadata.stdout);
    return task.description?.trim() || `Run the ${taskName} Mise task.`;
  }

  async function runTask(taskName: string, args: string[], signal?: AbortSignal) {
    const result = await pi.exec("mise", ["run", taskName, ...args], {
      cwd: projectDirectory,
      signal,
    });

    if (result.killed) throw new Error("Task cancelled.");
    if (result.code !== 0) {
      throw new Error(result.stderr || `Task exited with code ${result.code}.`);
    }

    return {
      content: [{ type: "text" as const, text: result.stdout }],
      details: undefined,
    };
  }

  pi.registerTool(
    defineTool({
      name: "deez_gonads",
      label: "deez:gonads",
      description: await describeTask("deez:gonads"),
      parameters: Type.Object({
        name: Type.String({
          description: "Who to greet",
        }),
        greeting: Type.String({
          description: "Greeting to use",
        }),
        times: Type.Optional(
          Type.String({
            default: "1",
            description:
              "Number of greetings, from 1 to 5. " +
              "Must satisfy: value matches '^[1-5]$'",
          }),
        ),
      }),

      async execute(_toolCallId, params, signal) {
        const args = ["--greeting", params.greeting];
        if (params.times !== undefined) {
          args.push("--times", params.times);
        }
        args.push("--", params.name);

        return runTask("deez:gonads", args, signal);
      },
    }),
  );

  pi.registerTool(
    defineTool({
      name: "text_transform",
      label: "text:transform",
      description: await describeTask("text:transform"),
      parameters: Type.Object({
        text: Type.String({ description: "Text to transform" }),
        case: Type.Union([Type.Literal("upper"), Type.Literal("lower")], {
          description: "Letter case to use",
        }),
        reverse: Type.Optional(Type.Boolean({
          default: false,
          description: "Reverse the transformed text",
        })),
      }),

      async execute(_toolCallId, params, signal) {
        const args = ["--case", params.case];
        if (params.reverse) args.push("--reverse");
        args.push("--", params.text);
        return runTask("text:transform", args, signal);
      },
    }),
  );

  pi.registerTool(
    defineTool({
      name: "math_sum",
      label: "math:sum",
      description: await describeTask("math:sum"),
      parameters: Type.Object({
        numbers: Type.Array(Type.String({
          description: "Integer to add. Must satisfy: value matches '^-?[0-9]+$'",
        }), {
          minItems: 1,
          description: "Integers to add",
        }),
      }),

      async execute(_toolCallId, params, signal) {
        return runTask("math:sum", ["--", ...params.numbers], signal);
      },
    }),
  );
}
