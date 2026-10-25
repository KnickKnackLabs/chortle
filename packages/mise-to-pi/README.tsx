/** @jsxImportSource jsx-md */

import dedent from "dedent";
import { CodeBlock, Heading, Link, Paragraph } from "readme";

const readme = (
  <>
    <Heading level={1}>mise-to-pi</Heading>
    <Paragraph>Mise tasks → Pi tools</Paragraph>

    <Heading level={2}>How it works</Heading>
    <Paragraph>A Mise task in .mise/tasks/greet:</Paragraph>
    <CodeBlock lang="bash">
      {dedent`
        #!/usr/bin/env bash
        #MISE description="Greet someone"
        #USAGE arg "<name>" help="Who to greet"

        echo "Hello, \${usage_name}!"
      `}
    </CodeBlock>

    <Paragraph>Becomes a tool Pi can call:</Paragraph>
    <CodeBlock lang="text">
      {dedent`
        Tool: greet
        Description: Greet someone
        Required parameter: name (string)

        Call: {"name": "Or"}
        Result: Hello, Or!
      `}
    </CodeBlock>

    <Heading level={2}>Install</Heading>
    <Paragraph>Requires Bun, Mise, and Pi.</Paragraph>

    <CodeBlock lang="bash">
      {dedent`
        bun add --global @knickknacklabs/mise-to-pi
      `}
    </CodeBlock>

    <Heading level={2}>Usage</Heading>

    <Heading level={3}>Generate an extension</Heading>
    <Paragraph>Run from your project's root:</Paragraph>

    <CodeBlock lang="bash">
      {dedent`
        mise-to-pi --output .pi/extensions/mise-tasks.ts
      `}
    </CodeBlock>

    <Paragraph>
      Start Pi in that project, or run /reload in an existing session.
    </Paragraph>

    <Heading level={3}>Regenerate</Heading>
    <Paragraph>
      The extension hardcodes the path to the mise project, so regenerate the
      extension if your project moves. If you change your task's name,
      description or `usage` specification, regenerate the extension, as well.
    </Paragraph>

    <Paragraph>Use `--force` to replace an existing extension</Paragraph>
    <CodeBlock lang="bash">
      {dedent`
        mise-to-pi --force --output .pi/extensions/mise-tasks.ts
      `}
    </CodeBlock>

    <Heading level={3}>Select tasks</Heading>
    <Paragraph>
      By default, all non-hidden project tasks become tools. Use `--task` to
      select specific tasks.
    </Paragraph>
    <CodeBlock lang="bash">
      {dedent`
        mise-to-pi --task greet --task 'foo:*' --output .pi/extensions/mise-tasks.ts
      `}
    </CodeBlock>

    <Heading level={3}>Prefix tool names</Heading>
    <Paragraph>
      Use `--prefix` to distinguish tools from different projects.
    </Paragraph>
    <CodeBlock lang="bash">
      {dedent`
        mise-to-pi --task greet --prefix project --output .pi/extensions/mise-tasks.ts

        # Pi sees: project_greet
      `}
    </CodeBlock>

    <Paragraph>
      <Link href="https://github.com/KnickKnackLabs/chortle/tree/main/packages/mise-to-pi">
        Source
      </Link>
      {" · "}
      <Link href="https://github.com/KnickKnackLabs/chortle/issues">
        Issues
      </Link>
      {" · "}
      <Link href="LICENSE">MIT license</Link>
    </Paragraph>
  </>
);

console.log(readme);
