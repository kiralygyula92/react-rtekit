---
pluginId: react-rtekit
pathname: /react-rtekit/getting-started/ai-context/
title: AI context
description: The whole documentation and the source of every example in one Markdown file, for AI coding agents.
archetype: F
section: getting-started
---

# AI context

## Prerequisites

- An AI coding agent that can read a file in your repository or fetch a URL — Claude Code, Cursor, Copilot, or anything else that takes documentation as context.

## Installation

Download [llms-full.md](/react-rtekit/llms-full.md) into your repository, somewhere your agent reads. A `docs/` folder is the usual place:

```bash
curl -o docs/react-rtekit.md %SITE_ORIGIN%/react-rtekit/llms-full.md
```

Then tell the agent it is there. For Claude Code, add a line to `CLAUDE.md`; most other agents read `AGENTS.md`:

```md
React RTE Kit documentation, with the source of every example: docs/react-rtekit.md
```

A tool that indexes documentation by URL can take the URL instead of the file.

## What is in the file

Every page of this documentation in reading order — the guides, every capability page and the whole API reference — with the source of each live example inlined where its page shows it. On the site those examples are running editors; in the file each one is the code behind it, which is the part an agent can use.

It is generated from the same Markdown as the site, in the same build, so it cannot say anything the site does not. Re-download it when you upgrade the package.

## Which file to use

| File | What it holds | Use it when |
|---|---|---|
| [llms-full.md](/react-rtekit/llms-full.md) | Every page and the source of every example | the agent should know the whole library |
| [llms-full.txt](/react-rtekit/llms-full.txt) | The same file, under the name tools look for | a tool asks for a documentation URL |
| [llms.txt](/react-rtekit/llms.txt) | An index: one line per page, each linking its Markdown | the agent should fetch only what it needs |
| A page's URL with `.md` | That one page as Markdown | you are working on a single feature |

The full file is large, but it fits whole in the context window of a current frontier model. If your tool's window is smaller, give it `llms.txt` and let it fetch the pages it needs.

## Minimal working example

With the file in `docs/`, a request like this has everything it needs to be answered from the documentation rather than from guesswork:

```text
Using docs/react-rtekit.md, add a rich-text field for the notes column of the customer
form: required, at most 2,000 characters, with a toolbar of bold, italic and lists only.
```

## Verify

Ask the agent something only the documentation answers — for example, whether an editor holding `<p><br></p>` counts as empty. An agent reading the file answers from it and can name the page it came from; one that is not reading it guesses.

## Next steps

- [Installation](/react-rtekit/getting-started/installation/) — the package, its peers and the stylesheet.
- [Usage](/react-rtekit/getting-started/usage/) — a working editor in fifteen lines.
- [API reference](/react-rtekit/api/) — generated from the TypeScript declarations.
