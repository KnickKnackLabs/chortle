# mise-to-pi

Mise tasks -> Pi tools

A Mise task in .mise/tasks/greet:

```bash
#!/usr/bin/env bash
#MISE description="Greet someone"
#USAGE arg "<name>" help="Who to greet"

echo "Hello, ${usage_name}!"
```

Becomes a tool Pi can call:

```text
Tool: greet
Description: Greet someone
Required parameter: name (string)

Call: {"name": "Or"}
Result: Hello, Or!
```

## Install

Requires Bun, Mise, and Pi.

```bash
bun add --global @knickknacklabs/mise-to-pi
```

## Usage

Run from your project's root:

```bash
mise-to-pi --output .pi/extensions/mise-tasks.ts
```

Start Pi in that project, or run /reload in an existing session.

The extension hardcodes the path to the mise project, so regenerate the extension if your project moves. If you change your task's name, description or `usage` specification, regenerate the extension, as well.

Use `--force` to replace an existing extension

```bash
mise-to-pi --force --output .pi/extensions/mise-tasks.ts
```

By default, all non-hidden project tasks become tools. Use `--task` to select specific tasks.

```bash
mise-to-pi --task greet --task 'foo:*' --output .pi/extensions/mise-tasks.ts
```

Use `--prefix` to distinguish tools from different projects.

```bash
mise-to-pi --task greet --prefix project --output .pi/extensions/mise-tasks.ts

# Pi sees: project_greet
```

[Source](https://github.com/KnickKnackLabs/chortle/tree/main/packages/mise-to-pi) · [Issues](https://github.com/KnickKnackLabs/chortle/issues) · [MIT license](LICENSE)
