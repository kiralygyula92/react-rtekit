# React RTE Kit — the complete documentation

> A production-grade React rich-text editor you can actually own.

React RTE Kit is an accessible, themeable React rich-text editor with no dependencies: 46 replaceable slots, handler middleware, theme tokens, sanitization at every content boundary and HTML interop that reads legacy Quill markup.

Every page of the documentation at https://react-rtekit.vercel.app/react-rtekit/, in reading order, with the source of every live example inlined where its page shows it. It is generated from the same Markdown as the site, so it says exactly what the site says.

- Package: `react-rtekit` 1.0.0 on npm. Peer dependencies: `react` >=18.2, `react-dom` >=18.2, and nothing else.
- Page index: https://react-rtekit.vercel.app/react-rtekit/llms.txt — and any single page as Markdown, at its URL with `.md`.
- 124 pages, 44 examples.

The examples import a few components that belong to the documentation site rather than to the package — `CodeBlock`, `ChoiceGroup` and the shared test fixtures. They display output; the editor code around them is the part to copy.

---

# Overview

> An accessible, themeable React rich-text editor with no dependencies: 46 replaceable slots, handler middleware, theme tokens, sanitization at every boundary and HTML interop that reads Quill markup.

Getting started · https://react-rtekit.vercel.app/react-rtekit/

## Introduction

React RTE Kit is a React component and a set of building blocks for editing rich text. The editing engine is its own — no third-party editor underneath — and it arrives as a complete field: a real ARIA toolbar, a sanitizer on every content boundary, HTML interop that reads legacy Quill markup, and 114 design tokens instead of a UI-kit dependency.

Everything is controlled through props, CSS variables, slots and handler middleware, so the editor fits into your design system and your state management rather than the other way round. When the all-in-one component is the wrong shape, the same editor is available as eleven composable parts and as a headless hook.

The package edits text. It does not manage documents, collaborate in real time, or store anything — the value goes in as a string and comes out as one.

## Why React RTE Kit

- **Sanitized at every boundary:** the initial value, every paste, every drop, every programmatic insert and the output all pass an allowlist sanitizer with four profiles and hard rules no configuration can switch off.
- **Your stored HTML keeps working:** interop profiles read legacy Quill markup and emit standards-compliant, Quill-compatible or e-mail-safe HTML, so existing content needs no migration in either direction.
- **No dependencies at all:** React and React DOM are the only peers. The document model, the engine, the parser, the sanitizer and every serializer are this project's own code, behind an `EditorEngine` interface that keeps the engine swappable.
- **Emptiness is a first-class concept:** `isEmpty()` ignores `<p><br></p>` and limits count text rather than markup, so `required` actually means required.
- **Accessible by construction:** a real ARIA toolbar with roving focus, a named textbox, errors linked with `aria-describedby`, live announcements, and every shipped theme meeting WCAG AA with a test enforcing it.
- **Replaceable at ten levels:** theme tokens, class names, slot props, toolbar config, custom items, slots, handler middleware, command overrides, composable parts and a headless hook. Use the lowest level that does the job.

## Start now

- [Installation](https://react-rtekit.vercel.app/react-rtekit/getting-started/installation/) — the package, its peers and the stylesheet.
- [Usage](https://react-rtekit.vercel.app/react-rtekit/getting-started/usage/) — a working editor in fifteen lines.
- [All features](https://react-rtekit.vercel.app/react-rtekit/all-features/) — every capability, grouped.
- [Playground](https://react-rtekit.vercel.app/react-rtekit/demos/playground/) — every prop, live.
- [API reference](https://react-rtekit.vercel.app/react-rtekit/api/) — generated from the TypeScript declarations.
- [Customization](https://react-rtekit.vercel.app/react-rtekit/customization/) — the ten levels, and how to pick one.

Nothing in this documentation is behind a plan. The package is MIT licensed and every capability is available to everyone.

---

# Installation

> Install the package, its peers and the stylesheet, and check that the editor renders.

Getting started · https://react-rtekit.vercel.app/react-rtekit/getting-started/installation/

## Prerequisites

- **React** 18.2 or later, including 19.
- **TypeScript** 5.0 or later, if you use it. The package ships its own declarations.
- A bundler that understands the `exports` field: Vite, webpack 5, Rollup, esbuild, Next.js.

## Installation

One package. React and React DOM are the only peer dependencies, and there is nothing else to install:

```bash
npm install react-rtekit
```

```bash
pnpm add react-rtekit
```

Then import the stylesheet once, wherever you import your application's other global CSS:

```ts
import 'react-rtekit/styles.css';
```

The stylesheet is plain CSS in a cascade layer. There is no CSS-in-JS runtime, no UI kit and no icon package.

## Minimal working example

```tsx
import { useState } from 'react';
import { RichTextEditor } from 'react-rtekit';
import 'react-rtekit/styles.css';

export function Editor() {
  const [value, setValue] = useState('<p>Hello</p>');

  return <RichTextEditor label="Message" value={value} onChange={setValue} />;
}
```

## Verify

You should see a bordered field with a toolbar above it, the word *Hello* inside, and a caret when you click into it. Typing should update `value`; pressing Mod+B should embolden the selection.

If the field appears but has no styling, the stylesheet import is missing.

## Next steps

- [Usage](https://react-rtekit.vercel.app/react-rtekit/getting-started/usage/) — controlled and uncontrolled, and the four value formats.
- [Requirements](https://react-rtekit.vercel.app/react-rtekit/getting-started/requirements/) — what is supported.
- [All features](https://react-rtekit.vercel.app/react-rtekit/all-features/) — what you can turn on.

---

# Usage

> A working editor in about fifteen lines, controlled or uncontrolled, with the value in the format you want.

Getting started · https://react-rtekit.vercel.app/react-rtekit/getting-started/usage/

## Prerequisites

A working [installation](https://react-rtekit.vercel.app/react-rtekit/getting-started/installation/).

## Installation

Already done — this page is about using what you installed.

## Minimal working example

*Example: Basic* — the source of the live demo on this page.

```tsx
import { useState } from 'react';
import { Rte, useEditor, type ChangeMeta, type EditorValue } from 'react-rtekit';
import { RteContentView } from 'react-rtekit/view';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * The smallest possible editor, plus the read-only view of the same value.
 *
 * Proves the two render identically: that is what makes `<RteContentView>` the right
 * way to show stored content outside a form.
 */
export default function BasicExample() {
  const [html, setHtml] = useState('<p>Type something, and watch the preview follow.</p>');
  const [meta, setMeta] = useState<ChangeMeta | null>(null);

  const editor = useEditor({
    defaultValue: html,
    onChange: (value: EditorValue, changeMeta: ChangeMeta) => {
      setHtml(value as string);
      setMeta(changeMeta);
    },
  });

  return (
    <div className="example-basic">
      <Rte.Root editor={editor} dataTheme="classic">
        <Rte.Content aria-label="Message" placeholder="Write your message…" />
        <Rte.Footer>
          <span className="example-basic__state">
            {meta
              ? `${meta.length} characters · ${meta.wordCount} words · source: ${meta.source}`
              : 'No changes yet'}
          </span>
          <Rte.Counter />
        </Rte.Footer>
      </Rte.Root>

      <h2>Serialized value</h2>
      <CodeBlock label="Basic html" testId="basic-html">
        {html}
      </CodeBlock>

      <h2>The same value in RteContentView</h2>
      <div data-testid="basic-view" className="example-basic__preview">
        <RteContentView value={html} />
      </div>
    </div>
  );
}
```

## Controlled and uncontrolled

Pass `value` and `onChange` for a controlled field, or `defaultValue` alone for an uncontrolled one. The two are the React conventions and they behave the way you expect:

```tsx
<RichTextEditor value={value} onChange={setValue} />   // controlled
<RichTextEditor defaultValue="<p>Draft</p>" />          // uncontrolled
```

`onChange` receives the value and a `ChangeMeta` describing what caused it — `user`, `api`, `paste` or `undo` — so you can tell a keystroke from a programmatic `setContent`.

## Choosing a value format

```tsx
<RichTextEditor valueFormat="html" />       // the default
<RichTextEditor valueFormat="json" />       // the document model
<RichTextEditor valueFormat="markdown" />
<RichTextEditor valueFormat="text" />
```

See [Value formats](https://react-rtekit.vercel.app/react-rtekit/value-formats/) for what each one keeps.

## Verify

Type in the demo above and watch the value under it change. Select a word and press Mod+B; the HTML should gain a `<strong>`.

## Next steps

- [All features](https://react-rtekit.vercel.app/react-rtekit/all-features/) — what else you can turn on.
- [Toolbar](https://react-rtekit.vercel.app/react-rtekit/toolbar/) — choosing and arranging the controls.
- [Forms](https://react-rtekit.vercel.app/react-rtekit/forms/) — validation and submission.

---

# AI context

> The whole documentation and the source of every example in one Markdown file, for AI coding agents.

Getting started · https://react-rtekit.vercel.app/react-rtekit/getting-started/ai-context/

## Prerequisites

- An AI coding agent that can read a file in your repository or fetch a URL — Claude Code, Cursor, Copilot, or anything else that takes documentation as context.

## Installation

Download [llms-full.md](https://react-rtekit.vercel.app/react-rtekit/llms-full.md) into your repository, somewhere your agent reads. A `docs/` folder is the usual place:

```bash
curl -o docs/react-rtekit.md https://react-rtekit.vercel.app/react-rtekit/llms-full.md
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
| [llms-full.md](https://react-rtekit.vercel.app/react-rtekit/llms-full.md) | Every page and the source of every example | the agent should know the whole library |
| [llms-full.txt](https://react-rtekit.vercel.app/react-rtekit/llms-full.txt) | The same file, under the name tools look for | a tool asks for a documentation URL |
| [llms.txt](https://react-rtekit.vercel.app/react-rtekit/llms.txt) | An index: one line per page, each linking its Markdown | the agent should fetch only what it needs |
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

- [Installation](https://react-rtekit.vercel.app/react-rtekit/getting-started/installation/) — the package, its peers and the stylesheet.
- [Usage](https://react-rtekit.vercel.app/react-rtekit/getting-started/usage/) — a working editor in fifteen lines.
- [API reference](https://react-rtekit.vercel.app/react-rtekit/api/) — generated from the TypeScript declarations.

---

# Requirements

> The React, TypeScript and browser versions this package supports, and what it expects of your bundler.

Getting started · https://react-rtekit.vercel.app/react-rtekit/getting-started/requirements/

## Prerequisites

None beyond a React application.

## Installation

See [Installation](https://react-rtekit.vercel.app/react-rtekit/getting-started/installation/).

## Supported versions

| | Supported |
|---|---|
| React | 18.2 and later, including 19 |
| TypeScript | 5.0 and later |
| Node (for the build) | 18 and later |
| Other dependencies | none |

## Browsers

The editing behaviour is tested on every release against Chromium, Firefox and WebKit, plus mobile Chrome and mobile Safari emulation. Those five are the supported set.

The package targets modern evergreen browsers and uses `:has()`, `color-mix()` and cascade layers. It does not support Internet Explorer and does not ship a polyfill bundle.

## Module formats

ESM and CommonJS, with TypeScript declarations for both. `publint` and `are-the-types-wrong` run on every build, so the `exports` map is checked rather than assumed.

## Minimal working example

See [Usage](https://react-rtekit.vercel.app/react-rtekit/getting-started/usage/).

## Verify

If your bundler resolves `react-rtekit/styles.css`, the `exports` map is being read correctly.

## Next steps

- [Server rendering](https://react-rtekit.vercel.app/react-rtekit/server-rendering/) — what runs where.
- [Performance](https://react-rtekit.vercel.app/react-rtekit/guides/performance/) — what it costs.
- [Versions](https://react-rtekit.vercel.app/react-rtekit/getting-started/versions/) — the support policy.

---

# FAQ

> The questions that come up while adopting it: bundle size, engine choice, server rendering, and what it deliberately does not do.

Getting started · https://react-rtekit.vercel.app/react-rtekit/getting-started/faq/

## Prerequisites

None.

## Installation

See [Installation](https://react-rtekit.vercel.app/react-rtekit/getting-started/installation/).

## What does it depend on?

React and React DOM, and nothing else. The document model, the editing engine, the HTML parser, the sanitizer and every serializer are this project's own code. The `EditorEngine` interface keeps the engine replaceable, and the package ships one — its own.

## Can it edit Markdown directly?

It can take and return Markdown with `valueFormat="markdown"`, converting on each boundary. It is not a Markdown source editor: what you type into is rich text.

## Is the output safe to render?

The output passes the sanitizer, and the hard rules — no `<script>`, no `on*` attribute, no `javascript:` or `data:text/html` URL — cannot be configured off. That does not remove your own responsibility to sanitize on the server; a client can be bypassed.

## Does it do collaborative editing?

No. There is no CRDT or presence layer, and adding one would be a different product.

## Why is the bundle that size?

Because `<RichTextEditor>` reads its feature set from props at runtime, so every branch is reachable from that entry point. Import `useEditor` instead and the chrome drops out. The measured numbers are in [Performance](https://react-rtekit.vercel.app/react-rtekit/guides/performance/).

## Can I use it with a UI kit?

Yes, and you do not have to. Every part is a slot, so you can render your own buttons, dialogs and menus while keeping the behaviour — see [Design-system skin](https://react-rtekit.vercel.app/react-rtekit/customization/design-system-skin/).

## Minimal working example

See [Usage](https://react-rtekit.vercel.app/react-rtekit/getting-started/usage/).

## Verify

Nothing to verify on this page.

## Next steps

- [Support](https://react-rtekit.vercel.app/react-rtekit/getting-started/support/) — where to ask something this does not answer.
- [Architecture](https://react-rtekit.vercel.app/react-rtekit/discover-more/architecture/) — why it is built this way.

---

# Support

> Where to ask a question, where to file a bug, and what to include so it can be answered.

Getting started · https://react-rtekit.vercel.app/react-rtekit/getting-started/support/

## Prerequisites

None.

## Installation

See [Installation](https://react-rtekit.vercel.app/react-rtekit/getting-started/installation/).

## Where to ask

This is a free, MIT-licensed project maintained in the open. There is no paid support tier and no guaranteed response time.

| | |
|---|---|
| A bug | [GitHub issues](https://github.com/kiralygyula92/react-rtekit/issues) |
| A question | [GitHub discussions](https://github.com/kiralygyula92/react-rtekit/discussions) |
| A security problem | Report privately through GitHub's security advisories rather than in a public issue |

## What to include in a bug report

A report that can be reproduced gets fixed; one that cannot, usually does not. Include:

- the version of `react-rtekit` and React;
- the browser, since most editor bugs are engine-specific;
- the props you passed, or a link to a [playground](https://react-rtekit.vercel.app/react-rtekit/demos/playground/) URL, which carries the whole configuration in its hash;
- what you did, what happened, and what you expected instead.

## Minimal working example

The playground's URL is the fastest reproduction case: configure it until it misbehaves and paste the link.

## Verify

Before filing, check whether the behaviour is listed under the capability page's `## Limitations` — several things that look like bugs are documented constraints with a workaround.

## Next steps

- [FAQ](https://react-rtekit.vercel.app/react-rtekit/getting-started/faq/)
- [Changelog](https://react-rtekit.vercel.app/react-rtekit/discover-more/changelog/)
- [Roadmap](https://react-rtekit.vercel.app/react-rtekit/discover-more/roadmap/)

---

# Versions

> Which versions are supported, how they are numbered, and where the documentation for older ones lives.

Getting started · https://react-rtekit.vercel.app/react-rtekit/getting-started/versions/

## Prerequisites

None.

## Installation

See [Installation](https://react-rtekit.vercel.app/react-rtekit/getting-started/installation/).

## Supported versions

| Version | Status | Documentation |
|---|---|---|
| 1.0.x | Current | This site |

1.0.0 is the initial release, so there is no previous major to keep online yet. When there is, it stays at a stable URL and is reachable from the version selector in the header — nothing is deleted.

## Versioning policy

The package follows [Semantic Versioning](https://semver.org). Every user-facing change is recorded with a changeset and appears in the [changelog](https://react-rtekit.vercel.app/react-rtekit/discover-more/changelog/).

- **Patch** (`1.0.x`): bug fixes that do not change the API.
- **Minor** (`1.x.0`): new, backwards-compatible capabilities.
- **Major** (`x.0.0`): breaking changes, each with a guide under [Migration](https://react-rtekit.vercel.app/react-rtekit/migration/).

The public API is what the `exports` map exposes. Anything reachable only through a deep import is internal and can change in a patch.

## Minimal working example

```bash
npm install react-rtekit@^1.0.0
```

## Verify

`npm ls react-rtekit` should report the version you expect, and one copy of it.

## Next steps

- [Changelog](https://react-rtekit.vercel.app/react-rtekit/discover-more/changelog/)
- [Migration](https://react-rtekit.vercel.app/react-rtekit/migration/)

---

# All features

> Every capability in the package, grouped the way the sidebar groups them, with a line on each.

Features · https://react-rtekit.vercel.app/react-rtekit/all-features/

Everything below ships in the package and is available to everyone — there is no paid tier. A capability is on when its plugin is loaded, which a [preset](https://react-rtekit.vercel.app/react-rtekit/presets/) usually decides for you.

What is deliberately not here: real-time collaboration, document management, PDF export, and anything that stores content. This package edits text and hands it back.

---

# Text formatting

> Bold, italic, underline, strikethrough and inline code, as marks on the selection rather than tags in a string.

Features · https://react-rtekit.vercel.app/react-rtekit/text-formatting/

## Basics

*Example: Formatting* — the source of the live demo on this page.

```tsx
import { useRef, useState } from 'react';
import { RichTextEditor, type EditorInstance, type EditorValue } from 'react-rtekit';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * Every mark and block, over mixed selections.
 *
 * The state panel is the point: it shows what the editor thinks is active at the
 * caret, which is the thing the old implementation got wrong in four different ways
 * (R6, R8).
 */

const SAMPLE =
  '<h2>Quarterly report</h2>' +
  '<p>The <strong>April</strong> results are <em>within range</em>, with <u>one</u> ' +
  '<s>exception</s> — costs at <code>0.9m</code>.</p>' +
  '<blockquote><p>Retest within two weeks.</p></blockquote>' +
  '<p>H<sub>2</sub>O · 25 m<sup>3</sup></p>';

export default function FormattingExample() {
  const [value, setValue] = useState(SAMPLE);
  const [state, setState] = useState<ReturnType<EditorInstance['getFormatState']> | null>(null);
  const editorRef = useRef<EditorInstance | null>(null);

  return (
    <div className="stack">
      <RichTextEditor
        preset="full"
        label="Content"
        hideLabel
        value={value}
        editorRef={editorRef}
        onChange={(next: EditorValue) => {
          setValue(next as string);
          setState(editorRef.current?.getFormatState() ?? null);
        }}
        onSelectionChange={() => {
          setState(editorRef.current?.getFormatState() ?? null);
        }}
      />

      <h2>Format state at the caret</h2>
      <table className="data-table" data-testid="format-state">
        <tbody>
          <tr>
            <th>Marks</th>
            <td>
              {state
                ? Object.entries(state.marks)
                    .filter(([, on]) => on)
                    .map(([name]) => name)
                    .join(', ') || 'none'
                : '—'}
            </td>
          </tr>
          <tr>
            <th>Block</th>
            <td>
              {state ? `${state.block.type}${state.block.headingLevel ?? ''}` : '—'}
              {state?.block.align ? ` · ${state.block.align}` : ''}
              {state?.block.indent ? ` · indent ${state.block.indent}` : ''}
            </td>
          </tr>
          <tr>
            <th>List</th>
            <td>{state?.list.type ?? 'none'}</td>
          </tr>
          <tr>
            <th>Link</th>
            <td>{state?.link?.href ?? 'none'}</td>
          </tr>
        </tbody>
      </table>

      <h2>Serialized</h2>
      <CodeBlock label="Formatting html" testId="formatting-html">
        {value}
      </CodeBlock>
    </div>
  );
}
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](https://react-rtekit.vercel.app/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](https://react-rtekit.vercel.app/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

Underline and strikethrough render through a class of their own when both are applied, because the engine treats the pair as one format. An override that styles `.rte-underline` and `.rte-strike` separately must also style `.rte-underline-strike`, or text carrying both shows only one.

## API

- [CommandId](https://react-rtekit.vercel.app/react-rtekit/api/types/)
- [FormatState](https://react-rtekit.vercel.app/react-rtekit/api/types/)
- [commands](https://react-rtekit.vercel.app/react-rtekit/api/commands/)

---

# Headings

> Six heading levels, restricted to the set your schema allows and reachable from the block-type dropdown or Markdown shortcuts.

Features · https://react-rtekit.vercel.app/react-rtekit/headings/

## Basics

*Example: Markdown* — the source of the live demo on this page.

```tsx
import { useState } from 'react';
import { RichTextEditor, type EditorValue } from 'react-rtekit';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * Markdown input rules and the Markdown value format.
 *
 * The rules rewrite as you type; the value format decides what `onChange` hands back.
 */

const SAMPLE = '<h2>Heading</h2><p>Type <code>## </code> at the start of a line.</p>';

export default function MarkdownExample() {
  const [value, setValue] = useState(SAMPLE);

  return (
    <div className="stack">
      <p className="page__lead">
        Type <code># </code>, <code>## </code>, <code>&gt; </code> or <code>- </code> at the start
        of a line, or wrap a word in asterisks or backticks.
      </p>

      <RichTextEditor
        preset="standard"
        label="Notes"
        hideLabel
        value={value}
        onChange={(next: EditorValue) => {
          setValue(next as string);
        }}
        enableMarkdownShortcuts
      />

      <h2>Serialized</h2>
      <CodeBlock label="Markdown output" testId="markdown-output">
        {value}
      </CodeBlock>
    </div>
  );
}
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](https://react-rtekit.vercel.app/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](https://react-rtekit.vercel.app/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

The heading levels offered are fixed when the editor mounts. Changing `headingLevels` afterwards does not re-resolve the dropdown until the component remounts.

## API

- [CommandId](https://react-rtekit.vercel.app/react-rtekit/api/types/)
- [RichTextEditorProps](https://react-rtekit.vercel.app/react-rtekit/api/rich-text-editor/)

---

# Lists

> Bulleted and numbered lists, nested to any depth, with Tab and Shift+Tab moving items between levels.

Features · https://react-rtekit.vercel.app/react-rtekit/lists/

## Basics

*Example: Lists* — the source of the live demo on this page.

```tsx
import { useState } from 'react';
import { RichTextEditor, type EditorValue } from 'react-rtekit';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * Lists, nesting and the shortcuts that create them.
 *
 * Tab indents a list item and Shift+Tab outdents it; `- `, `1. ` and `[] ` at the
 * start of a line create the three kinds.
 */

const SAMPLE =
  '<ul><li>Revenue</li><li>Costs<ul><li>fixed</li><li>variable</li></ul></li></ul>' +
  '<ol><li>Collect the sample</li><li>Label it</li></ol>' +
  '<ul><li data-checked="true">Sampled</li><li data-checked="false">Reported</li></ul>';

export default function ListsExample() {
  const [value, setValue] = useState(SAMPLE);

  return (
    <div className="stack">
      <p className="page__lead">
        Type “- ”, “1. ” or “[] ” at the start of a line. Tab nests, Shift+Tab lifts back out.
      </p>

      <RichTextEditor
        preset="full"
        label="Lists"
        hideLabel
        value={value}
        onChange={(next: EditorValue) => {
          setValue(next as string);
        }}
        enableMarkdownShortcuts
      />

      <h2>Serialized</h2>
      <CodeBlock label="Lists output" testId="lists-output">
        {value}
      </CodeBlock>
    </div>
  );
}
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](https://react-rtekit.vercel.app/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](https://react-rtekit.vercel.app/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

A list nested deeper than five levels stops gaining an indent class, because the shipped stylesheet defines five. Deeper nesting still serializes correctly; it just stops looking deeper.

## API

- [CommandId](https://react-rtekit.vercel.app/react-rtekit/api/types/)
- [FormatState](https://react-rtekit.vercel.app/react-rtekit/api/types/)

---

# Check lists

> Task lists whose items can be ticked in place, serialized as data-checked so stored HTML keeps the state.

Features · https://react-rtekit.vercel.app/react-rtekit/check-lists/

## Basics

*Example: Lists* — the same source as under "Lists".

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](https://react-rtekit.vercel.app/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](https://react-rtekit.vercel.app/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

The checkbox is drawn by the stylesheet in the first 20px of the item, which is the region the engine treats as a click on the box. A custom theme that indents check items past that point makes them unclickable.

## API

- [CommandId](https://react-rtekit.vercel.app/react-rtekit/api/types/)

---

# Links

> Adding, editing and removing links, with every URL checked against the protocol allowlist before it reaches the document.

Features · https://react-rtekit.vercel.app/react-rtekit/links/

## Basics

*Example: Links* — the source of the live demo on this page.

```tsx
import { useState } from 'react';
import { RichTextEditor, type EditorValue } from 'react-rtekit';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * Links.
 *
 * The popover, autolinking, and a validator. Switch the validator on to see a policy
 * that only accepts internal URLs — the sanitizer's own rules apply either way, so a
 * `javascript:` URL is refused whatever the validator returns.
 */

const SAMPLE =
  '<p>Read the <a href="https://example.com/report">full report</a>, or mail ' +
  '<a href="mailto:support@example.com">support@example.com</a>.</p>' +
  '<p>Type a bare URL like example.com and watch it link itself.</p>';

export default function LinksExample() {
  const [value, setValue] = useState(SAMPLE);
  const [internalOnly, setInternalOnly] = useState(false);
  const [autoLink, setAutoLink] = useState(true);

  return (
    <div className="stack">
      <div className="button-row">
        <label className="field-inline">
          <input
            type="checkbox"
            checked={internalOnly}
            onChange={(event) => {
              setInternalOnly(event.target.checked);
            }}
          />
          Only accept <code>https://intra.example/</code> URLs
        </label>
        <label className="field-inline">
          <input
            type="checkbox"
            checked={autoLink}
            onChange={(event) => {
              setAutoLink(event.target.checked);
            }}
          />
          Autolink while typing
        </label>
      </div>

      <RichTextEditor
        key={`${String(internalOnly)}-${String(autoLink)}`}
        preset="standard"
        label="Content"
        hideLabel
        value={value}
        autoLink={autoLink}
        toolbar={[
          ['bold', 'italic'],
          ['link', 'unlink'],
        ]}
        {...(internalOnly
          ? {
              linkValidator: (url: string) =>
                url.startsWith('https://intra.example/') ? null : 'Internal links only',
            }
          : {})}
        onChange={(next: EditorValue) => {
          setValue(next as string);
        }}
      />

      <p className="page__lead">
        Select some text and press <kbd>Ctrl</kbd>+<kbd>K</kbd>, or click an existing link. A plain
        click opens the popover; <kbd>Ctrl</kbd>+click follows the link.
      </p>

      <h2>Serialized</h2>
      <CodeBlock label="Links output" testId="links-output">
        {value}
      </CodeBlock>
    </div>
  );
}
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](https://react-rtekit.vercel.app/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](https://react-rtekit.vercel.app/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

`javascript:`, `vbscript:` and `data:text/html` URLs are refused whatever the configuration says. There is no option to allow them, and there will not be one.

## API

- [LinkAttrs](https://react-rtekit.vercel.app/react-rtekit/api/types/)
- [checkUrl](https://react-rtekit.vercel.app/react-rtekit/api/sanitize/)
- [normalizeUrl](https://react-rtekit.vercel.app/react-rtekit/api/sanitize/)
- [RteHandlers](https://react-rtekit.vercel.app/react-rtekit/api/types/)

---

# Blockquotes

> Block quotations, indentable and nestable, serialized as an ordinary blockquote element.

Features · https://react-rtekit.vercel.app/react-rtekit/blockquotes/

## Basics

*Example: Formatting* — the same source as under "Text formatting".

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](https://react-rtekit.vercel.app/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](https://react-rtekit.vercel.app/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

None known.

## API

- [CommandId](https://react-rtekit.vercel.app/react-rtekit/api/types/)

---

# Code blocks

> Fenced code blocks that keep their language through every format, so a snippet survives a round trip to Markdown and back.

Features · https://react-rtekit.vercel.app/react-rtekit/code-blocks/

## Basics

*Example: Formatting* — the same source as under "Text formatting".

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](https://react-rtekit.vercel.app/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](https://react-rtekit.vercel.app/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

The language is stored and serialized but not highlighted: the package ships no syntax highlighter. A `SourceView` or content-view override can add one.

## API

- [CommandId](https://react-rtekit.vercel.app/react-rtekit/api/types/)
- [documentToMarkdown](https://react-rtekit.vercel.app/react-rtekit/api/serialization/)

---

# Dividers

> Horizontal rules, inserted from the toolbar or by typing three dashes.

Features · https://react-rtekit.vercel.app/react-rtekit/dividers/

## Basics

*Example: Formatting* — the same source as under "Text formatting".

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](https://react-rtekit.vercel.app/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](https://react-rtekit.vercel.app/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

None known.

## API

- [CommandId](https://react-rtekit.vercel.app/react-rtekit/api/types/)

---

# Subscript & superscript

> Subscript and superscript marks, for formulae and footnote references.

Features · https://react-rtekit.vercel.app/react-rtekit/subscript-and-superscript/

## Basics

*Example: Formatting* — the same source as under "Text formatting".

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](https://react-rtekit.vercel.app/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](https://react-rtekit.vercel.app/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

Both are inline marks, so they cannot contain block content. A footnote that needs a paragraph is not this.

## API

- [CommandId](https://react-rtekit.vercel.app/react-rtekit/api/types/)
- [FormatState](https://react-rtekit.vercel.app/react-rtekit/api/types/)

---

# Clear formatting

> Strips every inline mark from the selection, leaving the text and the block structure.

Features · https://react-rtekit.vercel.app/react-rtekit/clear-formatting/

## Basics

*Example: Formatting* — the same source as under "Text formatting".

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](https://react-rtekit.vercel.app/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](https://react-rtekit.vercel.app/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

Clears inline marks only. The block type, alignment and indentation are structure, not formatting, and are left alone.

## API

- [CommandId](https://react-rtekit.vercel.app/react-rtekit/api/types/)

---

# Undo & redo

> Undo and redo with coalesced typing, so a sentence is one entry rather than forty.

Features · https://react-rtekit.vercel.app/react-rtekit/history/

## Basics

*Example: History* — the source of the live demo on this page.

```tsx
import { useRef, useState } from 'react';
import { RichTextEditor, type EditorInstance, type EditorValue } from 'react-rtekit';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * History (fixes R25).
 *
 * Typing coalesces into one entry per burst; every command is its own. Loading server
 * content clears the stack, so the author cannot undo into somebody else's document.
 */

export default function HistoryExample() {
  const [value, setValue] = useState('<p>Type a few words, then undo.</p>');
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const editorRef = useRef<EditorInstance | null>(null);

  const sync = (): void => {
    setCanUndo(editorRef.current?.canUndo() ?? false);
    setCanRedo(editorRef.current?.canRedo() ?? false);
  };

  return (
    <div className="stack">
      <div className="button-row">
        <button
          type="button"
          className="button"
          onClick={() => {
            editorRef.current?.setContent('<p>Loaded from the server.</p>', { history: false });
            editorRef.current?.clearHistory();
            sync();
          }}
        >
          Load from the server, then clearHistory()
        </button>
        <span className="parity__status" data-testid="history-state">
          canUndo: {String(canUndo)} · canRedo: {String(canRedo)}
        </span>
      </div>

      <RichTextEditor
        preset="standard"
        label="Content"
        hideLabel
        value={value}
        editorRef={editorRef}
        onChange={(next: EditorValue) => {
          setValue(next as string);
          sync();
        }}
      />

      <h2>Serialized</h2>
      <CodeBlock label="History output" testId="history-output">
        {value}
      </CodeBlock>
    </div>
  );
}
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](https://react-rtekit.vercel.app/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](https://react-rtekit.vercel.app/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

History is per editor instance and is not persisted. A remount — including one caused by changing `preset` or `locale` — starts a new stack.

## API

- [CommandId](https://react-rtekit.vercel.app/react-rtekit/api/types/)
- [EditorInstance](https://react-rtekit.vercel.app/react-rtekit/api/editor-instance/)

---

# Empty state

> What counts as empty, and why an empty paragraph does not: isEmpty() reads content, so required means required.

Features · https://react-rtekit.vercel.app/react-rtekit/empty-state/

## Basics

*Example: Counter and limits* — the source of the live demo on this page.

```tsx
import { useState } from 'react';
import { RichTextEditor, type EditorValue } from 'react-rtekit';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * Counting and limits (fixes R3).
 *
 * The limit counts text, not markup: formatting a message must never make it "too
 * long". Switch between blocking and warning to feel the difference.
 */

const SAMPLE = '<p>Formatting this text does not change how much of the limit it uses.</p>';

export default function CounterAndLimitsExample() {
  const [value, setValue] = useState(SAMPLE);
  const [limit, setLimit] = useState(80);
  const [behaviour, setBehaviour] = useState<'block' | 'warn'>('block');
  const [unit, setUnit] = useState<'characters' | 'words'>('characters');

  return (
    <div className="stack">
      <p className="page__lead">Bold the whole message: the counter does not move.</p>

      <div className="button-row">
        <label className="field-inline">
          Limit
          <select
            value={limit}
            onChange={(event) => {
              setLimit(Number(event.target.value));
            }}
          >
            <option value={80}>80</option>
            <option value={2048}>2048</option>
          </select>
        </label>
        <label className="field-inline">
          Behaviour
          <select
            value={behaviour}
            onChange={(event) => {
              setBehaviour(event.target.value as 'block' | 'warn');
            }}
          >
            <option value="block">block — refuse the keystroke</option>
            <option value="warn">warn — allow it, show it is over</option>
          </select>
        </label>
        <label className="field-inline">
          Unit
          <select
            value={unit}
            onChange={(event) => {
              setUnit(event.target.value as 'characters' | 'words');
            }}
          >
            <option value="characters">characters</option>
            <option value="words">words</option>
          </select>
        </label>
      </div>

      <RichTextEditor
        preset="standard"
        label="Message"
        hideLabel
        value={value}
        onChange={(next: EditorValue) => {
          setValue(next as string);
        }}
        maxLength={limit}
        maxLengthBehaviour={behaviour}
        countUnit={unit}
        showCounter
      />

      <h2>Serialized</h2>
      <CodeBlock label="Counter and limits output" testId="counter-and-limits-output">
        {value}
      </CodeBlock>
    </div>
  );
}
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](https://react-rtekit.vercel.app/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](https://react-rtekit.vercel.app/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

An editor containing only an image, a table or a horizontal rule is not empty, even though it has no text. That is deliberate: emptiness is about content, not about characters.

## API

- [EditorInstance](https://react-rtekit.vercel.app/react-rtekit/api/editor-instance/)
- [isEmptyHtml](https://react-rtekit.vercel.app/react-rtekit/api/serialization/)
- [useIsEmpty](https://react-rtekit.vercel.app/react-rtekit/api/editor-hooks/)
- [RteErrorText](https://react-rtekit.vercel.app/react-rtekit/api/composable-parts/)
- [RteHelperText](https://react-rtekit.vercel.app/react-rtekit/api/composable-parts/)

---

# Value formats

> HTML, JSON, Markdown or plain text — one valueFormat prop decides what value takes and what onChange hands back.

Features · https://react-rtekit.vercel.app/react-rtekit/value-formats/

## Basics

*Example: Value formats* — the source of the live demo on this page.

```tsx
import { useState } from 'react';
import {
  RichTextEditor,
  documentToHtml,
  documentToMarkdown,
  documentToText,
  htmlToDocument,
  type EditorValue,
} from 'react-rtekit';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * The four value formats.
 *
 * The same document, serialized four ways. `valueFormat` decides which one
 * `onChange` hands back; the others are always a function call away.
 */

const SAMPLE =
  '<h2>Summary</h2><p>The <strong>April</strong> results are <em>within range</em>.</p>' +
  '<ul><li>Revenue: on target</li><li>Costs: above plan</li></ul>' +
  '<p><a href="https://example.com/report">Full report</a></p>';

export default function ValueFormatsExample() {
  const [value, setValue] = useState(SAMPLE);
  const doc = htmlToDocument(value);

  return (
    <div className="stack">
      <RichTextEditor
        preset="standard"
        label="Content"
        hideLabel
        value={value}
        onChange={(next: EditorValue) => {
          setValue(next as string);
        }}
      />

      <div className="parity__outputs">
        <figure>
          <figcaption>html</figcaption>
          <CodeBlock label="Format html" testId="format-html">
            {documentToHtml(doc)}
          </CodeBlock>
        </figure>
        <figure>
          <figcaption>json</figcaption>
          <CodeBlock label="Format json" testId="format-json">
            {JSON.stringify(doc, null, 2)}
          </CodeBlock>
        </figure>
        <figure>
          <figcaption>markdown</figcaption>
          <CodeBlock label="Format markdown" testId="format-markdown">
            {documentToMarkdown(doc)}
          </CodeBlock>
        </figure>
        <figure>
          <figcaption>text</figcaption>
          <CodeBlock label="Format text" testId="format-text">
            {documentToText(doc)}
          </CodeBlock>
        </figure>
      </div>
    </div>
  );
}
```

### Controlled and uncontrolled

*Example: Controlled value* — the source of the live demo on this page.

```tsx
import { useRef, useState } from 'react';
import {
  RichTextEditor,
  type ChangeMeta,
  type EditorInstance,
  type EditorValue,
} from 'react-rtekit';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * Controlled usage (fixes R1 and R21).
 *
 * The parent owns the value. Loading a different report replaces the content, which
 * the old editor could not do at all, and every change says where it came from, so a
 * controlled parent can never mistake its own write for the author's typing.
 */

/** Two stored reports, as a form would load them. */
const REPORTS: Record<string, string> = {
  'Report A': '<p>Hi Dana, your <strong>April</strong> figures look good.</p>',
  'Report B': '<p>Hi Dana, your <em>May</em> results need a follow-up call.</p>',
};

export default function ControlledExample() {
  const [value, setValue] = useState<string>(REPORTS['Report A']!);
  const [log, setLog] = useState<ChangeMeta[]>([]);
  const editorRef = useRef<EditorInstance | null>(null);

  return (
    <div className="stack">
      <div className="button-row">
        {Object.keys(REPORTS).map((name) => (
          <button
            key={name}
            type="button"
            className="button"
            onClick={() => {
              // A plain state update: the editor follows a controlled value (fixes R1).
              setValue(REPORTS[name]!);
            }}
          >
            Load {name}
          </button>
        ))}
        <button
          type="button"
          className="button"
          onClick={() => {
            // The imperative route, for code that has no render pass to piggyback on.
            editorRef.current?.setContent('<p>Cleared and ready.</p>');
          }}
        >
          setContent() imperatively
        </button>
        <button
          type="button"
          className="button"
          onClick={() => {
            setValue('');
          }}
        >
          Clear
        </button>
      </div>

      <RichTextEditor
        preset="standard"
        label="Message"
        hideLabel
        value={value}
        editorRef={editorRef}
        placeholder="Type here — the caret stays where you put it."
        onChange={(next: EditorValue, meta: ChangeMeta) => {
          setValue(next as string);
          setLog((entries) => [meta, ...entries].slice(0, 8));
        }}
      />

      <h2>Value held by the parent</h2>
      <CodeBlock label="Controlled value" testId="controlled-value">
        {value || '(empty)'}
      </CodeBlock>

      <h2>Change log</h2>
      <table className="data-table" data-testid="controlled-log">
        <thead>
          <tr>
            <th>source</th>
            <th>length</th>
            <th>words</th>
            <th>empty</th>
          </tr>
        </thead>
        <tbody>
          {log.length === 0 ? (
            <tr>
              <td colSpan={4}>No changes yet.</td>
            </tr>
          ) : (
            log.map((meta, index) => (
              // Entries are positional history; two identical changes are still two rows.
              <tr key={index}>
                <td>
                  <code>{meta.source}</code>
                </td>
                <td>{meta.length}</td>
                <td>{meta.wordCount}</td>
                <td>{String(meta.isEmpty)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](https://react-rtekit.vercel.app/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](https://react-rtekit.vercel.app/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

Markdown is a lossy target. Tables, merge tags and inline colour survive the round trip; arbitrary inline styles do not, because Markdown has nowhere to put them.

## API

- [EditorValue](https://react-rtekit.vercel.app/react-rtekit/api/types/)
- [ChangeMeta](https://react-rtekit.vercel.app/react-rtekit/api/types/)
- [htmlToDocument](https://react-rtekit.vercel.app/react-rtekit/api/serialization/)
- [documentToHtml](https://react-rtekit.vercel.app/react-rtekit/api/serialization/)
- [documentToMarkdown](https://react-rtekit.vercel.app/react-rtekit/api/serialization/)
- [documentToText](https://react-rtekit.vercel.app/react-rtekit/api/serialization/)
- [markdownToHtml](https://react-rtekit.vercel.app/react-rtekit/api/serialization/)
- [markdownToDocument](https://react-rtekit.vercel.app/react-rtekit/api/serialization/)
- [EditorDocument](https://react-rtekit.vercel.app/react-rtekit/api/types/)

---

# Sanitization

> An allowlist sanitizer on every content boundary — the initial value, every paste, every drop, every programmatic insert and the output.

Features · https://react-rtekit.vercel.app/react-rtekit/sanitization/

## Basics

*Example: Sanitization* — the source of the live demo on this page.

```tsx
import { useMemo, useState } from 'react';
import { RteContentView } from 'react-rtekit/view';
import { sanitizeHtml, type SanitizeProfileName } from 'react-rtekit';
import { XSS_PAYLOADS } from '../../fixtures';
import { ChoiceGroup } from '../../components/ChoiceGroup';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * What each sanitization profile strips.
 *
 * Read-only by construction: the payloads are rendered as *text*, and the only thing
 * this page ever puts in the DOM as markup is the sanitizer's output. A demo that
 * proves an XSS defence by running the XSS would be a strange demo.
 */

const PROFILES: { name: SanitizeProfileName; summary: string }[] = [
  { name: 'strict', summary: 'Marks and paragraphs only. No links, no images, no styles.' },
  { name: 'standard', summary: 'The default: everything the editor can edit, nothing it cannot.' },
  { name: 'email', summary: 'Inline styles allowed, because e-mail clients have no stylesheet.' },
  {
    name: 'permissive',
    summary: 'Widest allowlist — and still no scripts, no event handlers, no javascript: URLs.',
  },
];

/** Things that must never appear in output, whatever the profile. */
const FORBIDDEN = ['<script', 'onerror', 'onload', 'javascript:', '<iframe', '<object', 'srcdoc'];

export default function SanitizationExample() {
  const [profile, setProfile] = useState<SanitizeProfileName>('standard');
  const [input, setInput] = useState(XSS_PAYLOADS[0]!.html);

  const output = useMemo(() => sanitizeHtml(input, { sanitize: profile }), [input, profile]);
  const violations = useMemo(
    () => FORBIDDEN.filter((needle) => output.toLowerCase().includes(needle)),
    [output],
  );

  return (
    <div className="stack">
      <p className="page__lead">
        Pick a payload or paste your own. Nothing here is ever evaluated: the input is shown as
        text, and only the sanitized result is rendered as HTML.
      </p>

      <ChoiceGroup
        label="Profile"
        hint="How much of the incoming markup survives. Every profile blocks scripts and event handlers."
        options={PROFILES.map((entry) => entry.name)}
        value={profile}
        onChange={setProfile}
      />
      <p className="page__lead" data-testid="profile-summary">
        {PROFILES.find((entry) => entry.name === profile)!.summary}
      </p>

      <label className="stack">
        <span className="parity__label">Payload</span>
        <select
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
          }}
        >
          {XSS_PAYLOADS.map((payload) => (
            <option key={payload.id} value={payload.html}>
              {payload.id} — {payload.vector}
            </option>
          ))}
        </select>
      </label>

      <label className="stack">
        <span className="parity__label">Or paste your own</span>
        <textarea
          rows={4}
          value={input}
          spellCheck={false}
          onChange={(event) => {
            setInput(event.target.value);
          }}
          data-testid="sanitize-input"
        />
      </label>

      <div className="parity__outputs">
        <figure>
          <figcaption>Input, as text</figcaption>
          <CodeBlock label="Code">{input}</CodeBlock>
        </figure>
        <figure>
          <figcaption>
            Output of <code>sanitizeHtml(input, &quot;{profile}&quot;)</code>
          </figcaption>
          <CodeBlock label="Sanitize output" testId="sanitize-output">
            {output || '(everything was removed)'}
          </CodeBlock>
        </figure>
      </div>

      <p
        className={violations.length === 0 ? 'callout' : 'callout callout--danger'}
        data-testid="sanitize-verdict"
      >
        {violations.length === 0
          ? 'No script, event handler or dangerous URL survived.'
          : `Something got through: ${violations.join(', ')}`}
      </p>

      <h2>The sanitized result, rendered</h2>
      <div className="example-basic__preview">
        <RteContentView value={output} sanitize={profile} />
      </div>
    </div>
  );
}
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](https://react-rtekit.vercel.app/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](https://react-rtekit.vercel.app/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

`sanitize={false}` exists and is almost always the wrong answer. It disables the input sanitizer only; the hard rules — no `<script>`, no `on*` attribute, no `javascript:` URL — are not configurable and still apply.

## API

- [SanitizeConfig](https://react-rtekit.vercel.app/react-rtekit/api/types/)
- [SanitizeProfileName](https://react-rtekit.vercel.app/react-rtekit/api/types/)
- [sanitizeHtml](https://react-rtekit.vercel.app/react-rtekit/api/sanitize/)
- [getProfile](https://react-rtekit.vercel.app/react-rtekit/api/sanitize/)
- [checkUrl](https://react-rtekit.vercel.app/react-rtekit/api/sanitize/)
- [resolveSanitizeConfig](https://react-rtekit.vercel.app/react-rtekit/api/sanitize/)
- [mergeSanitizeConfig](https://react-rtekit.vercel.app/react-rtekit/api/sanitize/)

---

# HTML interop

> Reads legacy Quill markup and emits standards-compliant, Quill-compatible or e-mail-safe HTML, so stored content needs no migration.

Features · https://react-rtekit.vercel.app/react-rtekit/html-interop/

## Basics

*Example: HTML interop profiles* — the source of the live demo on this page.

```tsx
import { useMemo, useState } from 'react';
import {
  RichTextEditor,
  documentToHtml,
  htmlToDocument,
  type HtmlProfile,
  type EditorValue,
} from 'react-rtekit';
import { ChoiceGroup } from '../../components/ChoiceGroup';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * The four HTML output profiles.
 *
 * Load legacy Quill markup, edit it, and see what each profile writes. The point of
 * `quill-compatible` is a phased rollout: what this editor saves stays readable by
 * the old one, so both can run against the same column.
 */

const PROFILES: { name: HtmlProfile; summary: string }[] = [
  { name: 'standard', summary: 'Semantic HTML with rte- classes. The default for new storage.' },
  {
    name: 'quill-compatible',
    summary: 'ql- classes and data-list attributes, so the old editor can still read it.',
  },
  { name: 'email', summary: 'Inline styles only, because e-mail clients drop stylesheets.' },
  { name: 'minimal', summary: 'Tags alone: no classes, no styles, nothing to theme.' },
];

/**
 * Markup in the shape the old editor produced: ql- classes, data-list attributes and
 * inline colours.
 *
 * Taken from the test corpus, with one change: the corpus keeps the original
 * `#FF0000`, which is 3.99:1 on white. A demo page should not ship text that fails
 * AA, and the interop behaviour is identical either way.
 */
const LEGACY_QUILL_HTML =
  '<p class="ql-align-center"><strong>Quarterly summary</strong></p>' +
  '<p>Hi {first_name},</p>' +
  '<p><span style="color: #C81E1E">Action needed:</span> your account needs attention.</p>' +
  '<ul><li data-list="bullet">Review the attached figures</li><li data-list="bullet">Reply by Friday</li></ul>' +
  '<p><br></p>' +
  '<p>Thank you,</p><p>{company_name}</p>';

export default function HtmlInteropExample() {
  const [value, setValue] = useState<string>(LEGACY_QUILL_HTML);
  const [profile, setProfile] = useState<HtmlProfile>('standard');

  const outputs = useMemo(() => {
    const doc = htmlToDocument(value);
    return Object.fromEntries(
      PROFILES.map((entry) => [entry.name, documentToHtml(doc, { profile: entry.name })]),
    ) as Record<HtmlProfile, string>;
  }, [value]);

  const current = PROFILES.find((entry) => entry.name === profile)!;

  return (
    <div className="stack">
      <p className="page__lead">
        The editor below starts with markup the old Quill-based editor produced. Edit it, then
        compare what each profile writes.
      </p>

      <RichTextEditor
        preset="standard"
        label="Content"
        hideLabel
        value={value}
        onChange={(next: EditorValue) => {
          setValue(next as string);
        }}
      />

      <ChoiceGroup
        label="Output profile"
        hint="Which dialect of HTML the editor writes out. What it reads is unaffected."
        options={PROFILES.map((entry) => entry.name)}
        value={profile}
        onChange={setProfile}
      />

      <p className="page__lead" data-testid="interop-summary">
        {current.summary}
      </p>

      <CodeBlock label="Interop output" testId="interop-output">
        {outputs[profile]}
      </CodeBlock>

      <h2>Side by side</h2>
      <table className="data-table" data-testid="interop-table">
        <thead>
          <tr>
            <th>Profile</th>
            <th>Bytes</th>
            <th>Classes</th>
            <th>Inline styles</th>
          </tr>
        </thead>
        <tbody>
          {PROFILES.map((entry) => {
            const html = outputs[entry.name];
            return (
              <tr key={entry.name}>
                <td>
                  <code>{entry.name}</code>
                </td>
                <td>{html.length}</td>
                <td>{(html.match(/class="/g) ?? []).length}</td>
                <td>{(html.match(/style="/g) ?? []).length}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](https://react-rtekit.vercel.app/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](https://react-rtekit.vercel.app/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

Interop covers the constructs Quill and the office suites actually produce. Markup outside that set is normalized to the nearest thing the schema has, which may not be what its author meant.

## API

- [htmlToDocument](https://react-rtekit.vercel.app/react-rtekit/api/serialization/)
- [documentToHtml](https://react-rtekit.vercel.app/react-rtekit/api/serialization/)
- [RichTextEditorProps](https://react-rtekit.vercel.app/react-rtekit/api/rich-text-editor/)

---

# E-mail output

> An output profile that inlines styles and drops what e-mail clients strip, so the HTML you store is the HTML that sends.

Features · https://react-rtekit.vercel.app/react-rtekit/email-output/

## Basics

*Example: E-mail output* — the source of the live demo on this page.

```tsx
import { useMemo, useState } from 'react';
import {
  RichTextEditor,
  documentToHtml,
  htmlToDocument,
  plainTextAlternative,
  type EditorValue,
} from 'react-rtekit';
import { DEFAULT_EMAIL_BODY } from '../../fixtures';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * The e-mail profile and the multipart alternative.
 *
 * What an e-mail needs that a web page does not: inline styles, absolute URLs, a
 * table wrapper for the old clients, and a `text/plain` part for the ones that refuse
 * HTML altogether.
 */

const MERGE_TAGS = [
  { key: 'first_name', label: 'First name', sample: 'Dana' },
  { key: 'due_date', label: 'Due date', sample: '14 October 2026' },
  { key: 'report_date', label: 'Report date', sample: '16 September 2026' },
  { key: 'company_name', label: 'Company name', sample: 'Northwind Ltd' },
  { key: 'company_address', label: 'Company address', sample: '14 Canal Street, Bristol' },
];

export default function EmailOutputExample() {
  const [value, setValue] = useState<string>(DEFAULT_EMAIL_BODY);
  const [wrapInTable, setWrapInTable] = useState(true);
  const [preview, setPreview] = useState(true);
  const [width, setWidth] = useState(600);

  const { html, text } = useMemo(() => {
    const doc = htmlToDocument(value, {
      mergeTags: { knownKeys: MERGE_TAGS.map((tag) => tag.key) },
    });
    return {
      html: documentToHtml(doc, {
        profile: 'email',
        email: {
          wrapInTable,
          containerWidth: width,
          fontFallback: 'Arial, Helvetica, sans-serif',
          forceAbsoluteUrls: 'https://app.example.com',
        },
        ...(preview
          ? { mergeTagPreview: Object.fromEntries(MERGE_TAGS.map((tag) => [tag.key, tag.sample])) }
          : {}),
      }),
      // The `text/plain` part of a multipart message: links become "text (url)" and
      // block structure becomes blank lines.
      text: plainTextAlternative(doc),
    };
  }, [preview, value, width, wrapInTable]);

  return (
    <div className="stack">
      <RichTextEditor
        preset="email"
        label="Message"
        hideLabel
        value={value}
        onChange={(next: EditorValue) => {
          setValue(next as string);
        }}
        mergeTags={{ tags: MERGE_TAGS }}
      />

      <div className="button-row">
        <label className="field-inline">
          <input
            type="checkbox"
            checked={wrapInTable}
            onChange={(event) => {
              setWrapInTable(event.target.checked);
            }}
          />
          Wrap in a centring table
        </label>
        <label className="field-inline">
          <input
            type="checkbox"
            checked={preview}
            onChange={(event) => {
              setPreview(event.target.checked);
            }}
          />
          Substitute merge tags
        </label>
        <label className="field-inline">
          Width
          <select
            value={width}
            onChange={(event) => {
              setWidth(Number(event.target.value));
            }}
          >
            <option value={480}>480</option>
            <option value={600}>600</option>
            <option value={720}>720</option>
          </select>
        </label>
      </div>

      <h2>Client preview</h2>
      <div className="email-preview" data-testid="email-preview">
        {/* Rendered in an isolated document, the way a client would: the styles this
            profile writes are inline, so nothing here depends on the site's CSS. */}
        <iframe title="E-mail preview" srcDoc={html} className="email-preview__frame" />
      </div>

      <h2>
        <code>text/html</code> part
      </h2>
      <CodeBlock label="Email html" testId="email-html">
        {html}
      </CodeBlock>

      <h2>
        <code>text/plain</code> alternative
      </h2>
      <CodeBlock label="Email text" testId="email-text">
        {text}
      </CodeBlock>
    </div>
  );
}
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](https://react-rtekit.vercel.app/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](https://react-rtekit.vercel.app/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

The profile makes HTML that e-mail clients can render. It does not test it against them — there is no Litmus in this package, and a complicated layout still needs a real preview.

## API

- [documentToHtml](https://react-rtekit.vercel.app/react-rtekit/api/serialization/)
- [SanitizeProfileName](https://react-rtekit.vercel.app/react-rtekit/api/types/)
- [getProfile](https://react-rtekit.vercel.app/react-rtekit/api/sanitize/)

---

# Paste clean-up

> Three paste modes — rich, clean and text — each running the same sanitizer, so a paste from Word cannot smuggle anything in.

Features · https://react-rtekit.vercel.app/react-rtekit/paste-cleanup/

## Basics

*Example: Paste clean-up* — the source of the live demo on this page.

```tsx
import { useMemo, useState } from 'react';
import { documentToHtml, documentToText, htmlToDocument, type PasteMode } from 'react-rtekit';
import { OFFICE_FIXTURES, QUILL_FIXTURES } from '../../fixtures';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * What the paste pipeline does to markup from other editors (fixes R20).
 *
 * The fixtures are the same corpus the library's own tests run against, so what this
 * page shows is exactly what the test suite asserts.
 */

/** Every fixture, labelled by where it came from. */
const SOURCES = [
  ...OFFICE_FIXTURES.map((fixture) => ({
    id: fixture.id,
    label: `${fixture.source}: ${fixture.id}`,
    html: fixture.html,
  })),
  ...QUILL_FIXTURES.slice(0, 8).map((fixture) => ({
    id: `quill-${fixture.id}`,
    label: `quill: ${fixture.id}`,
    html: fixture.html,
  })),
];

/** Markers that should never survive a clean-up. */
const NOISE = ['mso-', 'MsoNormal', 'docs-internal-guid', 'class="ql-', 'o:p', 'xmlns:'];

export default function PasteCleanupExample() {
  const [sourceId, setSourceId] = useState(SOURCES[0]!.id);
  const [mode, setMode] = useState<PasteMode>('rich');

  const source = SOURCES.find((entry) => entry.id === sourceId)!;

  const cleaned = useMemo(() => {
    const html =
      mode === 'clean' ? source.html.replace(/\s(?:style|class)="[^"]*"/gi, '') : source.html;
    const doc = htmlToDocument(html);
    return mode === 'text' ? documentToText(doc) : documentToHtml(doc);
  }, [mode, source.html]);

  const remaining = useMemo(
    () => NOISE.filter((needle) => cleaned.toLowerCase().includes(needle.toLowerCase())),
    [cleaned],
  );

  return (
    <div className="stack">
      <p className="page__lead">
        The before/after of a real paste. Everything on the left is what the source editor put on
        the clipboard; everything on the right is what lands in the document.
      </p>

      <div className="button-row">
        <label className="field-inline">
          Source
          <select
            value={sourceId}
            onChange={(event) => {
              setSourceId(event.target.value);
            }}
          >
            {SOURCES.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field-inline">
          Mode
          <select
            value={mode}
            onChange={(event) => {
              setMode(event.target.value as PasteMode);
            }}
          >
            <option value="rich">rich — keep what the schema allows</option>
            <option value="clean">clean — keep structure, drop styling</option>
            <option value="text">text — plain text only</option>
          </select>
        </label>
      </div>

      <div className="parity__outputs">
        <figure>
          <figcaption>On the clipboard</figcaption>
          <CodeBlock label="Paste before" testId="paste-before">
            {source.html}
          </CodeBlock>
        </figure>
        <figure>
          <figcaption>In the document</figcaption>
          <CodeBlock label="Paste after" testId="paste-after">
            {cleaned}
          </CodeBlock>
        </figure>
      </div>

      <p
        className={remaining.length === 0 ? 'callout' : 'callout callout--danger'}
        data-testid="paste-verdict"
      >
        {remaining.length === 0
          ? 'No editor-specific noise survived the clean-up.'
          : `Still present: ${remaining.join(', ')}`}
      </p>
    </div>
  );
}
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](https://react-rtekit.vercel.app/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](https://react-rtekit.vercel.app/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

`clean` keeps structure and drops the source's own formatting. Deciding which of the two a given span is remains a heuristic, and a document that encodes meaning purely in inline style loses it.

## API

- [RteHandlers](https://react-rtekit.vercel.app/react-rtekit/api/types/)
- [RichTextEditorProps](https://react-rtekit.vercel.app/react-rtekit/api/rich-text-editor/)

---

# Merge tags

> Template variables as atomic chips: one delete removes the whole tag, and formatting the message never splits it.

Features · https://react-rtekit.vercel.app/react-rtekit/merge-tags/

## Basics

*Example: Merge tags* — the source of the live demo on this page.

```tsx
import { useRef, useState } from 'react';
import {
  RichTextEditor,
  documentToHtml,
  htmlToDocument,
  type EditorInstance,
  type EditorValue,
} from 'react-rtekit';
import { DEFAULT_EMAIL_BODY } from '../../fixtures';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * Merge tags (fixes R23).
 *
 * A tag is one atomic node: select the whole message and bold it, and the tags come
 * through unchanged. Preview mode substitutes the samples without touching the stored
 * value, which is what the backend still receives.
 */

const TAGS = [
  { key: 'first_name', label: 'First name', group: 'Contact', sample: 'Dana' },
  { key: 'due_date', label: 'Due date', group: 'Dates', sample: '14 October 2026' },
  { key: 'report_date', label: 'Report date', group: 'Dates', sample: '16 September 2026' },
  { key: 'company_name', label: 'Company name', group: 'Organization', sample: 'Northwind Ltd' },
  {
    key: 'company_address',
    label: 'Company address',
    group: 'Organization',
    sample: '1 Marina Way',
  },
];

export default function MergeTagsExample() {
  const [value, setValue] = useState(DEFAULT_EMAIL_BODY);
  const [preview, setPreview] = useState(false);
  const editorRef = useRef<EditorInstance | null>(null);

  const previewed = documentToHtml(htmlToDocument(value), {
    mergeTagPreview: Object.fromEntries(TAGS.map((tag) => [tag.key, tag.sample])),
  });

  return (
    <div className="stack">
      <div className="button-row">
        <label className="field-inline">
          <input
            type="checkbox"
            checked={preview}
            onChange={(event) => {
              setPreview(event.target.checked);
            }}
          />
          Preview with sample values
        </label>
        {TAGS.slice(0, 3).map((tag) => (
          <button
            key={tag.key}
            type="button"
            className="button"
            onClick={() => {
              editorRef.current?.insertMergeTag(tag.key);
            }}
          >
            Insert {tag.label}
          </button>
        ))}
      </div>

      <RichTextEditor
        preset="email"
        label="Message"
        hideLabel
        value={value}
        editorRef={editorRef}
        mergeTags={{ tags: TAGS, unknownTagBehaviour: 'warn' }}
        onChange={(next: EditorValue) => {
          setValue(next as string);
        }}
      />

      <p className="page__lead">Type the trigger to open the insert menu.</p>

      <h2>{preview ? 'With sample values' : 'Stored value'}</h2>
      <CodeBlock label="Merge tags output" testId="merge-tags-output">
        {preview ? previewed : value}
      </CodeBlock>
    </div>
  );
}
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](https://react-rtekit.vercel.app/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](https://react-rtekit.vercel.app/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

A tag is atomic in the editor, not in stored HTML. Code that rewrites the saved markup with a regular expression can still cut one in half.

## API

- [EditorInstance](https://react-rtekit.vercel.app/react-rtekit/api/editor-instance/)
- [RichTextEditorProps](https://react-rtekit.vercel.app/react-rtekit/api/rich-text-editor/)

---

# Markdown shortcuts

> Typing ##  or -  or >  turns the block into the thing it looks like, as you type.

Features · https://react-rtekit.vercel.app/react-rtekit/markdown-shortcuts/

## Basics

*Example: Markdown* — the same source as under "Headings".

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](https://react-rtekit.vercel.app/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](https://react-rtekit.vercel.app/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

Shortcuts fire on the block you are typing in. Pasting Markdown does not convert it — use `valueFormat="markdown"` or `markdownToDocument` for that.

## API

- [RichTextEditorProps](https://react-rtekit.vercel.app/react-rtekit/api/rich-text-editor/)
- [plugins](https://react-rtekit.vercel.app/react-rtekit/api/plugins/)

---

# Counters & limits

> Character or word counts that measure text rather than markup, with a hard or soft limit and a live counter.

Features · https://react-rtekit.vercel.app/react-rtekit/counters-and-limits/

## Basics

*Example: Counter and limits* — the same source as under "Empty state".

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](https://react-rtekit.vercel.app/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](https://react-rtekit.vercel.app/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

The count is of text content, so a bold word costs what a plain one costs. It is not a byte count, and it is not what a database `VARCHAR` will measure.

## API

- [useCharacterCount](https://react-rtekit.vercel.app/react-rtekit/api/editor-hooks/)
- [RichTextEditorProps](https://react-rtekit.vercel.app/react-rtekit/api/rich-text-editor/)
- [EditorInstance](https://react-rtekit.vercel.app/react-rtekit/api/editor-instance/)

---

# Theming

> 114 CSS custom properties in a cascade layer — every colour, size and radius, with no CSS-in-JS and no UI kit.

Features · https://react-rtekit.vercel.app/react-rtekit/theming/

## Basics

*Example: Theming* — the source of the live demo on this page.

```tsx
import { useMemo, useState } from 'react';
import {
  RichTextEditor,
  createTheme,
  themes,
  type ColorScheme,
  type Density,
  type ResolvedRteTheme,
} from 'react-rtekit';
import { ChoiceGroup } from '../../components/ChoiceGroup';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * Themes, schemes and densities.
 *
 * A theme is data. There is no visual in the library that is not one of these tokens,
 * which is what lets the theme editor list them all and what makes a brand theme three
 * lines rather than a stylesheet.
 */

const PRESETS = ['light', 'classic', 'dark', 'compact', 'bordered'] as const;
type PresetTheme = (typeof PRESETS)[number];

const DENSITIES: Density[] = ['compact', 'standard', 'comfortable'];

/** A brand theme: the default, with four values changed. */
const brandTheme = createTheme(themes.light, {
  name: 'brand',
  color: {
    accent: '#7C3AED',
    accentSoft: '#F3EDFF',
    accentBorder: '#C4B5FD',
  },
  editor: { radius: '10px' },
});

const SAMPLE =
  '<h2>Quarterly summary</h2>' +
  '<p>The <strong>April</strong> results are <em>within range</em>, with one exception.</p>' +
  '<ul><li>Revenue: on target</li><li>Costs: <span style="color: #C81E1E">above plan</span></li></ul>' +
  '<p><a href="https://example.com/report">Full report</a></p>';

export default function ThemingExample() {
  const [name, setName] = useState<PresetTheme | 'brand'>('light');
  const [colorScheme, setColorScheme] = useState<ColorScheme>('light');
  const [density, setDensity] = useState<Density>('standard');
  const [html, setHtml] = useState(SAMPLE);

  const base: ResolvedRteTheme = name === 'brand' ? brandTheme : themes[name];

  // Density is a multiplier rather than a second set of numbers, so it composes with
  // whichever theme is selected instead of replacing it.
  const theme = useMemo(() => createTheme(base, { density }), [base, density]);

  const vars = useMemo(() => theme.toCssVars(), [theme]);

  return (
    <div className="stack">
      <ChoiceGroup
        label="Theme"
        hint="A whole set of tokens — colours, radii, spacing — as one object."
        options={[...PRESETS, 'brand' as const]}
        value={name}
        onChange={setName}
      />

      <ChoiceGroup
        label="Colour scheme"
        hint="Which palette the theme resolves to. Auto follows the operating system."
        options={['light', 'dark', 'auto'] as ColorScheme[]}
        value={colorScheme}
        onChange={setColorScheme}
      />

      <ChoiceGroup
        label="Density"
        hint="Scales every spacing token at once, so it composes with any theme rather than replacing it."
        options={DENSITIES}
        value={density}
        onChange={setDensity}
      />

      <RichTextEditor
        preset="standard"
        label="Message"
        hideLabel
        theme={theme}
        colorScheme={colorScheme}
        value={html}
        onChange={(value) => {
          setHtml(value as string);
        }}
      />

      <p className="example-basic__state" data-testid="theming-summary">
        {theme.name} · {colorScheme} · density {density} · {Object.keys(vars).length} CSS variables
      </p>

      <h2>The brand theme, in full</h2>
      <CodeBlock label="Brand theme">
        {`const brandTheme = createTheme(themes.light, {
  name: 'brand',
  color: { accent: '#7C3AED', accentSoft: '#F3EDFF', accentBorder: '#C4B5FD' },
  editor: { radius: '10px' },
});`}
      </CodeBlock>

      <h2>What that becomes</h2>
      <CodeBlock label="Theme css variables" testId="theming-vars">
        {Object.entries(vars)
          .map(([key, value]) => `${key}: ${value};`)
          .join('\n')}
      </CodeBlock>
    </div>
  );
}
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](https://react-rtekit.vercel.app/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](https://react-rtekit.vercel.app/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

Tokens cover what the editor draws. Content styling — how a heading or a table looks inside the text — lives in `content.css` and is a separate stylesheet on purpose, so stored HTML renders the same outside the editor.

## API

- [RteTheme](https://react-rtekit.vercel.app/react-rtekit/api/types/)
- [createTheme](https://react-rtekit.vercel.app/react-rtekit/api/theme-api/)
- [theme-tokens](https://react-rtekit.vercel.app/react-rtekit/api/theme-tokens/)
- [RteThemeProvider](https://react-rtekit.vercel.app/react-rtekit/api/providers/)
- [useRteTheme](https://react-rtekit.vercel.app/react-rtekit/api/editor-hooks/)

---

# Theme presets

> Five ready themes — light, dark, classic, compact and bordered — each a token set you can extend rather than fight.

Features · https://react-rtekit.vercel.app/react-rtekit/theme-presets/

## Basics

*Example: Presets* — the source of the live demo on this page.

```tsx
import { useState } from 'react';
import { RichTextEditor, documentToHtml, htmlToDocument, type PresetName } from 'react-rtekit';
import { ChoiceGroup } from '../../components/ChoiceGroup';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * The six presets, switched live.
 *
 * A preset is a plugin bundle plus prop defaults — a toolbar, a theme, an HTML
 * profile and a set of limits. Switching one remounts the editor with the same
 * content, which is also the easiest way to see what each one keeps.
 */

/** What each preset is for. */
const PRESETS: { name: PresetName; summary: string }[] = [
  { name: 'minimal', summary: 'Bold, italic, links. For a comment box that should stay small.' },
  {
    name: 'classic',
    summary: 'The legacy parity bundle: eight buttons, 287px, quill-compatible output.',
  },
  {
    name: 'standard',
    summary: 'The general-purpose bundle: marks, headings, lists, links, history.',
  },
  { name: 'email', summary: 'Everything an e-mail client renders, and nothing it does not.' },
  { name: 'comment', summary: 'Compact chrome, no block formatting, counter always visible.' },
  { name: 'full', summary: 'Every plugin the library ships, including tables and images.' },
];

const SAMPLE =
  '<h2>Quarterly summary</h2>' +
  '<p>The <strong>April</strong> results are <em>within range</em>, with one exception.</p>' +
  '<ul><li>Revenue: on target</li><li>Costs: <span style="color: #C81E1E">above plan</span></li></ul>' +
  '<p><a href="https://example.com/report">Full report</a></p>';

export default function PresetsExample() {
  const [preset, setPreset] = useState<PresetName>('classic');
  const [value, setValue] = useState<string>(SAMPLE);

  const current = PRESETS.find((entry) => entry.name === preset)!;

  return (
    <div className="stack">
      <ChoiceGroup
        label="Preset"
        hint="Which plugins load, and so which toolbar items exist. Everything below changes with it."
        options={PRESETS.map((entry) => entry.name)}
        value={preset}
        onChange={setPreset}
      />

      <p className="page__lead" data-testid="preset-summary">
        {current.summary}
      </p>

      <RichTextEditor
        // Remounting is the point: a preset chooses plugins, and plugins are
        // resolved when the editor is created.
        key={preset}
        preset={preset}
        label="Message"
        hideLabel
        defaultValue={value}
        onChange={(next) => {
          setValue(next as string);
        }}
      />

      <h2>Output for this preset</h2>
      <CodeBlock label="Preset output" testId="preset-output">
        {documentToHtml(htmlToDocument(value), {
          profile: preset === 'email' ? 'email' : 'standard',
        })}
      </CodeBlock>
    </div>
  );
}
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](https://react-rtekit.vercel.app/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](https://react-rtekit.vercel.app/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

Every shipped preset meets WCAG AA, and a test enforces it. A theme you derive from one does not inherit that guarantee — `meetsContrastAA` is exported so you can check your own.

## API

- [lightTheme](https://react-rtekit.vercel.app/react-rtekit/api/theme-api/)
- [darkTheme](https://react-rtekit.vercel.app/react-rtekit/api/theme-api/)
- [classicTheme](https://react-rtekit.vercel.app/react-rtekit/api/theme-api/)
- [compactTheme](https://react-rtekit.vercel.app/react-rtekit/api/theme-api/)
- [borderedTheme](https://react-rtekit.vercel.app/react-rtekit/api/theme-api/)
- [themes](https://react-rtekit.vercel.app/react-rtekit/api/theme-api/)

---

# Colours

> Text and background colour from a configurable palette, with a recent-colours row and a reset that removes the declaration.

Features · https://react-rtekit.vercel.app/react-rtekit/colours/

## Basics

*Example: Toolbar configuration* — the source of the live demo on this page.

```tsx
import { useState } from 'react';
import { RichTextEditor, type ToolbarConfig, type ToolbarItemSpec } from 'react-rtekit';
import { ChoiceGroup } from '../../components/ChoiceGroup';

/**
 * Every shape the `toolbar` prop takes.
 *
 * The same registry backs all of them: a flat list, groups, or the object form with
 * overflow, labels and a size. Anything not in the registry is a spec of your own,
 * like the word-count item below.
 */

/** A custom item: no command, just a handler and a live label. */
const wordCountItem: ToolbarItemSpec = {
  name: 'wordCount',
  kind: 'button',
  label: 'Word count',
  // Reads the same state the toolbar buttons read, so it updates with the content.
  render: (ctx) => (
    <span className="toolbar-word-count" aria-live="off">
      {ctx.editor.getLength('words')} words
    </span>
  ),
};

/** An item that runs a command with a fixed payload. */
const signatureItem: ToolbarItemSpec = {
  name: 'signature',
  kind: 'button',
  label: 'Insert signature',
  onClick: ({ editor }) => {
    editor.insertContent('<p>— Northwind Ltd support</p>');
  },
};

/** The five configurations this page cycles through. */
const LAYOUTS: { id: string; title: string; note: string; toolbar: ToolbarConfig }[] = [
  {
    id: 'flat',
    title: 'Flat list',
    note: 'An array of names. No separators, no grouping.',
    toolbar: ['bold', 'italic', 'underline', 'bulletList', 'orderedList', 'undo', 'redo'],
  },
  {
    id: 'grouped',
    title: 'Groups',
    note: 'An array of arrays. Each inner array becomes a group, with a separator between them.',
    toolbar: [
      ['bold', 'italic', 'underline'],
      ['color'],
      ['alignLeft', 'alignCenter', 'alignRight'],
      ['bulletList', 'orderedList'],
    ],
  },
  {
    id: 'labels',
    title: 'Visible labels',
    note: 'showLabels renders the name next to each icon; useful on wide, low-density chrome.',
    toolbar: {
      items: [['bold', 'italic'], ['bulletList']],
      showLabels: true,
      ariaLabel: 'Message formatting',
    },
  },
  {
    id: 'compact',
    title: 'Compact size',
    note: "size: 'sm' scales the buttons down without changing the touch target model.",
    toolbar: {
      items: [
        ['bold', 'italic', 'underline', 'strike'],
        ['color', 'backgroundColor'],
        ['bulletList', 'orderedList'],
      ],
      size: 'sm',
    },
  },
  {
    id: 'custom',
    title: 'Custom items',
    note: 'Items of your own sit next to registry items and share the same roving focus.',
    toolbar: {
      items: [['bold', 'italic'], [signatureItem], [wordCountItem]],
      ariaLabel: 'Formatting and actions',
    },
  },
];

export default function ToolbarConfigExample() {
  const [layout, setLayout] = useState(LAYOUTS[0]!);
  const [overflow, setOverflow] = useState<'wrap' | 'menu' | 'scroll'>('menu');

  return (
    <div className="stack">
      <ChoiceGroup
        label="Layout"
        hint="Which items the toolbar shows and in what order. A name nothing provides is dropped rather than disabled."
        options={LAYOUTS.map((entry) => ({ value: entry.id, label: entry.title }))}
        value={layout.id}
        onChange={(id) => {
          const found = LAYOUTS.find((entry) => entry.id === id);
          if (found) setLayout(found);
        }}
      />

      <label className="field-inline">
        Overflow
        <select
          value={overflow}
          onChange={(event) => {
            setOverflow(event.target.value as 'wrap' | 'menu' | 'scroll');
          }}
        >
          <option value="menu">menu — extra items move into a “more” menu</option>
          <option value="wrap">wrap — the toolbar grows taller</option>
          <option value="scroll">scroll — the toolbar scrolls horizontally</option>
        </select>
      </label>

      <p className="page__lead" data-testid="toolbar-note">
        {layout.note}
      </p>

      <RichTextEditor
        key={layout.id}
        preset="standard"
        label="Message"
        hideLabel
        toolbar={layout.toolbar}
        toolbarOverflow={overflow}
        defaultValue="<p>Resize the window to watch the overflow behaviour change.</p>"
        placeholder="Write something…"
      />
    </div>
  );
}
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](https://react-rtekit.vercel.app/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](https://react-rtekit.vercel.app/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

Reset removes the colour rather than writing black, so text returns to whatever the theme says. A document that relied on an explicit black will look different after a reset.

## API

- [CommandId](https://react-rtekit.vercel.app/react-rtekit/api/types/)
- [FormatState](https://react-rtekit.vercel.app/react-rtekit/api/types/)
- [RichTextEditorProps](https://react-rtekit.vercel.app/react-rtekit/api/rich-text-editor/)

---

# Fonts

> Font family and size as inline styles, from lists you supply, for editors whose output has to carry its own typography.

Features · https://react-rtekit.vercel.app/react-rtekit/fonts/

## Basics

*Example: Content styles* — the source of the live demo on this page.

```tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { RichTextEditor } from 'react-rtekit';
import { RteContentView } from 'react-rtekit/view';

/**
 * One stylesheet, two places.
 *
 * `content.css` ships on its own precisely so that stored HTML looks the same in the
 * editor that produced it, on the list page that shows it and in the preview that
 * sends it. This page measures that rather than asserting it: it reads the computed
 * styles of matching elements on both sides and reports any that differ.
 */

const SAMPLE =
  '<h2>Sampling notes</h2>' +
  '<p>Figures were <strong>within plan</strong> except for <em>costs</em>, which were ' +
  '<span style="color: #C81E1E">high</span>.</p>' +
  '<ul><li>Revenue: on target</li><li>Headcount: stable</li></ul>' +
  '<blockquote><p>Re-test before the next visit.</p></blockquote>' +
  '<p><a href="https://example.com/report">Full report</a> · <code>ph=8.2</code></p>';

/** The properties a reader would notice if they differed. */
const PROPERTIES = [
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'color',
  'margin-block-start',
  'margin-block-end',
  'padding-inline-start',
];

/** The elements compared, in document order. */
const SELECTORS = ['h2', 'p', 'strong', 'em', 'ul', 'li', 'blockquote', 'a', 'code'];

/** One difference found between the two renderings. */
interface Difference {
  selector: string;
  property: string;
  editor: string;
  view: string;
}

export default function ContentStylesExample() {
  const [html, setHtml] = useState(SAMPLE);
  const [differences, setDifferences] = useState<Difference[] | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<HTMLDivElement | null>(null);

  const compare = useCallback(() => {
    const left = editorRef.current?.querySelector('.rte-content');
    const right = viewRef.current?.querySelector('.rte-content');
    if (!(left instanceof HTMLElement) || !(right instanceof HTMLElement)) return;

    const found: Difference[] = [];
    for (const selector of SELECTORS) {
      const a = left.querySelector(selector);
      const b = right.querySelector(selector);
      if (!(a instanceof HTMLElement) || !(b instanceof HTMLElement)) continue;

      const stylesA = getComputedStyle(a);
      const stylesB = getComputedStyle(b);
      for (const property of PROPERTIES) {
        const valueA = stylesA.getPropertyValue(property);
        const valueB = stylesB.getPropertyValue(property);
        if (valueA !== valueB) found.push({ selector, property, editor: valueA, view: valueB });
      }
    }
    setDifferences(found);
  }, []);

  // Compare once the first paint has happened, so fonts and variables are resolved.
  useEffect(() => {
    const id = requestAnimationFrame(compare);
    return () => {
      cancelAnimationFrame(id);
    };
  }, [compare]);

  return (
    <div className="stack">
      <div className="split">
        <section ref={editorRef}>
          <h2>In the editor</h2>
          <RichTextEditor
            preset="standard"
            label="Notes"
            hideLabel
            value={html}
            onChange={(value) => {
              setHtml(value as string);
            }}
          />
        </section>

        <section ref={viewRef}>
          <h2>In RteContentView</h2>
          <RteContentView value={html} />
        </section>
      </div>

      <div className="button-row">
        <button type="button" className="button" onClick={compare}>
          Compare computed styles
        </button>
        <span className="parity__status" data-testid="content-styles-status">
          {differences === null
            ? 'Not compared yet'
            : differences.length === 0
              ? `Identical across ${SELECTORS.length} elements and ${PROPERTIES.length} properties.`
              : `${differences.length} difference${differences.length === 1 ? '' : 's'} found.`}
        </span>
      </div>

      {differences && differences.length > 0 ? (
        <table className="data-table">
          <thead>
            <tr>
              <th>Element</th>
              <th>Property</th>
              <th>Editor</th>
              <th>View</th>
            </tr>
          </thead>
          <tbody>
            {differences.map((difference) => (
              <tr key={`${difference.selector}-${difference.property}`}>
                <td>
                  <code>{difference.selector}</code>
                </td>
                <td>
                  <code>{difference.property}</code>
                </td>
                <td>{difference.editor}</td>
                <td>{difference.view}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

      <p className="callout">
        This is why <code>content.css</code> is a separate file rather than part of the
        editor&rsquo;s stylesheet: a server-rendered list page can load the prose styles without
        loading an editor at all.
      </p>
    </div>
  );
}
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](https://react-rtekit.vercel.app/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](https://react-rtekit.vercel.app/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

Both write inline styles, which is what e-mail needs and what a design system usually does not want. Prefer theme tokens unless the output has to survive outside your CSS.

## API

- [CommandId](https://react-rtekit.vercel.app/react-rtekit/api/types/)
- [RichTextEditorProps](https://react-rtekit.vercel.app/react-rtekit/api/rich-text-editor/)

---

# Alignment

> Left, centre, right and justify, applied to blocks and serialized so legacy Quill alignment classes still read.

Features · https://react-rtekit.vercel.app/react-rtekit/alignment/

## Basics

*Example: Formatting* — the same source as under "Text formatting".

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](https://react-rtekit.vercel.app/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](https://react-rtekit.vercel.app/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

Alignment is a block property. There is no way to align part of a paragraph, because there is nowhere in the document model to put it.

## API

- [CommandId](https://react-rtekit.vercel.app/react-rtekit/api/types/)
- [FormatState](https://react-rtekit.vercel.app/react-rtekit/api/types/)

---

# Indentation

> Block indentation in steps, for quotes and nested structure, with the legacy ql-indent-* classes read on the way in.

Features · https://react-rtekit.vercel.app/react-rtekit/indentation/

## Basics

*Example: Lists* — the same source as under "Lists".

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](https://react-rtekit.vercel.app/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](https://react-rtekit.vercel.app/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

Indenting a list item changes its nesting level rather than its margin, which is what makes the output valid HTML rather than a flat list with padding.

## API

- [CommandId](https://react-rtekit.vercel.app/react-rtekit/api/types/)
- [FormatState](https://react-rtekit.vercel.app/react-rtekit/api/types/)

---

# Tables

> Tables with a size picker, per-cell editing, and controls for adding and removing rows, columns and the table itself.

Features · https://react-rtekit.vercel.app/react-rtekit/tables/

## Basics

*Example: Tables* — the source of the live demo on this page.

```tsx
import { useState } from 'react';
import { RichTextEditor, documentToHtml, htmlToDocument, type EditorValue } from 'react-rtekit';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * Tables.
 *
 * Insert with the picker, move between cells with Tab, and use the controls that
 * appear when the caret is inside one. The e-mail column shows why a table serializes
 * differently for mail: every rule has to be inline.
 */

const SAMPLE =
  '<table><tbody>' +
  '<tr><th>Reading</th><th>Value</th><th>Range</th></tr>' +
  '<tr><td>Revenue</td><td>1.8m</td><td>1.5-2.0m</td></tr>' +
  '<tr><td>Costs</td><td>0.9m</td><td>0.7-0.8m</td></tr>' +
  '</tbody></table>';

export default function TablesExample() {
  const [value, setValue] = useState(SAMPLE);

  return (
    <div className="stack">
      <p className="page__lead">
        Put the caret in a cell to get the row and column controls. Tab moves to the next cell; Tab
        in the last cell adds a row.
      </p>

      <RichTextEditor
        preset="full"
        label="Results"
        hideLabel
        value={value}
        onChange={(next: EditorValue) => {
          setValue(next as string);
        }}
      />

      <div className="parity__outputs">
        <figure>
          <figcaption>Stored HTML</figcaption>
          <CodeBlock label="Tables output" testId="tables-output">
            {value}
          </CodeBlock>
        </figure>
        <figure>
          <figcaption>E-mail HTML</figcaption>
          <CodeBlock label="Tables email" testId="tables-email">
            {documentToHtml(htmlToDocument(value), { profile: 'email' })}
          </CodeBlock>
        </figure>
      </div>
    </div>
  );
}
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](https://react-rtekit.vercel.app/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](https://react-rtekit.vercel.app/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

No merged cells. `colspan` and `rowspan` survive a round trip through stored HTML, but nothing in the editor creates them.

## API

- [TableOptions](https://react-rtekit.vercel.app/react-rtekit/api/types/)
- [CommandId](https://react-rtekit.vercel.app/react-rtekit/api/types/)

---

# Images & uploads

> Images by URL, by file picker or by drag-and-drop, resizable in place, with captions and an upload handler of your own.

Features · https://react-rtekit.vercel.app/react-rtekit/images/

## Basics

*Example: Images and uploads* — the source of the live demo on this page.

```tsx
import { useState } from 'react';
import { RichTextEditor, type EditorValue, type UploadResult } from 'react-rtekit';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * Images and uploads.
 *
 * The upload service is a mock that reports progress over two seconds and can be made
 * to fail, because the interesting states — in flight, failed, retried — are the ones
 * a real service only shows you in production.
 */

/** A 1×1 transparent PNG, so the demo needs no network. */
const PLACEHOLDER =
  'data:image/svg+xml;base64,' +
  btoa(
    '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180">' +
      '<rect width="320" height="180" fill="#E9EAEB"/>' +
      '<text x="160" y="96" text-anchor="middle" font-family="sans-serif" fill="#717680">Uploaded</text>' +
      '</svg>',
  );

export default function ImagesExample() {
  const [value, setValue] = useState('<p>Drop an image here, or use the toolbar.</p>');
  const [shouldFail, setShouldFail] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const upload = async (
    file: File,
    ctx: { signal: AbortSignal; onProgress: (progress: number) => void },
  ): Promise<UploadResult> => {
    setLog((entries) => [`${file.name} — started`, ...entries]);
    for (let progress = 20; progress <= 100; progress += 20) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      if (ctx.signal.aborted) throw new Error('cancelled');
      ctx.onProgress(progress);
    }
    if (shouldFail) {
      setLog((entries) => [`${file.name} — failed`, ...entries]);
      throw new Error('The upload service is unavailable');
    }
    setLog((entries) => [`${file.name} — done`, ...entries]);
    return { url: PLACEHOLDER, alt: file.name, width: 320, height: 180 };
  };

  return (
    <div className="stack">
      <label className="field-inline">
        <input
          type="checkbox"
          checked={shouldFail}
          onChange={(event) => {
            setShouldFail(event.target.checked);
          }}
        />
        Make the upload fail
      </label>

      <RichTextEditor
        preset="full"
        label="Content"
        hideLabel
        value={value}
        onUpload={upload}
        uploadAccept="image/*"
        maxUploadSize={2 * 1024 * 1024}
        imageOptions={{ resizable: true, captions: true, maxWidth: 640 }}
        onUploadError={(error) => {
          setLog((entries) => [`error: ${String(error)}`, ...entries]);
        }}
        onChange={(next: EditorValue) => {
          setValue(next as string);
        }}
      />

      <p className="page__lead">
        Click an image to resize it, set its alt text or add a caption. Files over 2 MB and anything
        that is not an image are refused before the upload starts.
      </p>

      <h2>Upload log</h2>
      <ul className="example-related" data-testid="upload-log">
        {log.length === 0 ? <li>Nothing uploaded yet.</li> : null}
        {log.map((entry, index) => (
          // Log lines are positional history, so the index is the identity.
          <li key={index}>{entry}</li>
        ))}
      </ul>

      <h2>Serialized</h2>
      <CodeBlock label="Images output" testId="images-output">
        {value}
      </CodeBlock>
    </div>
  );
}
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](https://react-rtekit.vercel.app/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](https://react-rtekit.vercel.app/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

Without an `onUpload` the file is embedded as a `data:` URL, which is what makes the picker work with no backend and what makes a large image a large document. Give it a handler for anything but small pictures.

## API

- [ImageAttrs](https://react-rtekit.vercel.app/react-rtekit/api/types/)
- [UploadHandler](https://react-rtekit.vercel.app/react-rtekit/api/types/)
- [useUpload](https://react-rtekit.vercel.app/react-rtekit/api/editor-hooks/)

---

# Content view

> A read-only renderer for stored HTML that applies the same content stylesheet, so a list page looks like the editor.

Features · https://react-rtekit.vercel.app/react-rtekit/content-view/

## Basics

*Example: Content styles* — the same source as under "Fonts".

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](https://react-rtekit.vercel.app/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](https://react-rtekit.vercel.app/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

It renders; it does not edit. It also sanitizes on every render, so passing a new string on every keystroke is measurably slower than passing a stable one.

## API

- [RteContentView](https://react-rtekit.vercel.app/react-rtekit/api/rte-content-view/)
- [RteContentViewProps](https://react-rtekit.vercel.app/react-rtekit/api/rte-content-view/)

---

# Toolbar

> A real ARIA toolbar: one tab stop, arrows between controls, configurable groups, and three overflow behaviours.

Features · https://react-rtekit.vercel.app/react-rtekit/toolbar/

## Basics

*Example: Toolbar configuration* — the same source as under "Colours".

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](https://react-rtekit.vercel.app/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](https://react-rtekit.vercel.app/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

`overflow="menu"` measures the row to decide what fits, so it needs a laid-out container. In a hidden tab or a zero-width parent every group stays visible until the container has a width.

## API

- [ToolbarItemSpec](https://react-rtekit.vercel.app/react-rtekit/api/types/)
- [toolbar-items](https://react-rtekit.vercel.app/react-rtekit/api/toolbar-items/)
- [createToolbarItem](https://react-rtekit.vercel.app/react-rtekit/api/plugin-api/)
- [RteToolbar](https://react-rtekit.vercel.app/react-rtekit/api/composable-parts/)

---

# Selection toolbar

> A bubble toolbar over the selection, carrying the marks and the link rather than the whole row.

Features · https://react-rtekit.vercel.app/react-rtekit/selection-toolbar/

## Basics

*Example: Floating toolbar* — the source of the live demo on this page.

```tsx
import { useState } from 'react';
import { RichTextEditor, type EditorValue } from 'react-rtekit';

/**
 * Floating, sticky and overflowing toolbars.
 *
 * All three are the same `Toolbar` component: one roving-focus implementation, one
 * set of slots, three placements.
 */

const SAMPLE =
  '<p>Select a few words and the bubble toolbar appears above them.</p>' +
  '<p>Scroll this editor and the docked toolbar stays put.</p>' +
  Array.from({ length: 12 }, (_, index) => `<p>Filler paragraph ${index + 1}.</p>`).join('');

export default function FloatingToolbarExample() {
  const [value, setValue] = useState(SAMPLE);
  const [floating, setFloating] = useState(true);
  const [sticky, setSticky] = useState(true);

  return (
    <div className="stack">
      <div className="button-row">
        <label className="field-inline">
          <input
            type="checkbox"
            checked={floating}
            onChange={(event) => {
              setFloating(event.target.checked);
            }}
          />
          Bubble toolbar on selection
        </label>
        <label className="field-inline">
          <input
            type="checkbox"
            checked={sticky}
            onChange={(event) => {
              setSticky(event.target.checked);
            }}
          />
          Sticky docked toolbar
        </label>
      </div>

      <p className="page__lead">
        Narrow the window: the groups that no longer fit move into a “more” menu at the end of the
        row.
      </p>

      <RichTextEditor
        preset="full"
        label="Content"
        hideLabel
        value={value}
        stickyToolbar={sticky}
        floatingToolbar={floating}
        maxHeight={320}
        onChange={(next: EditorValue) => {
          setValue(next as string);
        }}
      />
    </div>
  );
}
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](https://react-rtekit.vercel.app/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](https://react-rtekit.vercel.app/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

Off by default wherever a toolbar is already docked: two toolbars offering the same commands is noise. Set `floatingToolbar` to ask for both.

## API

- [RichTextEditorProps](https://react-rtekit.vercel.app/react-rtekit/api/rich-text-editor/)
- [ToolbarItemSpec](https://react-rtekit.vercel.app/react-rtekit/api/types/)

---

# Slash menu

> A command palette on /, listing the blocks and inserts the current configuration actually has.

Features · https://react-rtekit.vercel.app/react-rtekit/slash-menu/

## Basics

*Example: Emoji and slash menu* — the source of the live demo on this page.

```tsx
import { useState } from 'react';
import { RichTextEditor, type EditorValue } from 'react-rtekit';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * Emoji and the slash palette.
 *
 * Both are the same primitive as mentions and merge tags, so their keyboard model is
 * identical: arrows move, Enter or Tab inserts, Escape closes.
 */

export default function EmojiAndSlashExample() {
  const [value, setValue] = useState('<p></p>');

  return (
    <div className="stack">
      <p className="page__lead">
        Type a slash at the start of an empty line for the command palette, or a colon followed by a
        name for an emoji. Emoji insert as characters, never images, so they survive plain-text
        export and every e-mail client.
      </p>

      <RichTextEditor
        preset="full"
        label="Message"
        hideLabel
        value={value}
        slashMenu
        onChange={(next: EditorValue) => {
          setValue(next as string);
        }}
      />

      <h2>Serialized</h2>
      <CodeBlock label="Emoji and slash output" testId="emoji-and-slash-output">
        {value}
      </CodeBlock>
    </div>
  );
}
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](https://react-rtekit.vercel.app/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](https://react-rtekit.vercel.app/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

The menu lists items whose plugins are loaded. An item you add to the toolbar without a plugin behind it appears in neither.

## API

- [RichTextEditorProps](https://react-rtekit.vercel.app/react-rtekit/api/rich-text-editor/)
- [ToolbarItemSpec](https://react-rtekit.vercel.app/react-rtekit/api/types/)

---

# Emoji

> A searchable picker in the toolbar and a : trigger in the text, inserting characters rather than images.

Features · https://react-rtekit.vercel.app/react-rtekit/emoji/

## Basics

*Example: Emoji and slash menu* — the same source as under "Slash menu".

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](https://react-rtekit.vercel.app/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](https://react-rtekit.vercel.app/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

A curated set of about sixty, not the full Unicode table — the whole set is several hundred kilobytes that no editor should pay for by default.

## API

- [CommandId](https://react-rtekit.vercel.app/react-rtekit/api/types/)
- [RichTextEditorProps](https://react-rtekit.vercel.app/react-rtekit/api/rich-text-editor/)

---

# Mentions

> An @ trigger backed by your own async search, inserting an atomic chip that carries an id.

Features · https://react-rtekit.vercel.app/react-rtekit/mentions/

## Basics

*Example: Mentions* — the source of the live demo on this page.

```tsx
import { useState } from 'react';
import { RichTextEditor, type EditorValue, type MentionCandidate } from 'react-rtekit';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * Mentions.
 *
 * The search is asynchronous and deliberately slow, so the loading and empty states
 * are visible rather than theoretical. A mention is an atomic node carrying an id,
 * which is what a backend needs; the label is only what the author sees.
 */

const PEOPLE: MentionCandidate[] = [
  { id: 'u_1', label: 'Dana Scully', description: 'Field agent' },
  { id: 'u_2', label: 'Fox Mulder', description: 'Field agent' },
  { id: 'u_3', label: 'Walter Skinner', description: 'Assistant director' },
  { id: 'u_4', label: 'Monica Reyes', description: 'Field agent' },
];

export default function MentionsExample() {
  const [value, setValue] = useState('<p>Type the trigger to mention someone.</p>');

  const search = async (query: string, signal: AbortSignal): Promise<MentionCandidate[]> => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    if (signal.aborted) return [];
    const needle = query.toLowerCase();
    return PEOPLE.filter((person) => person.label.toLowerCase().includes(needle));
  };

  return (
    <div className="stack">
      <RichTextEditor
        preset="standard"
        label="Note"
        hideLabel
        value={value}
        mentions={{ search }}
        onChange={(next: EditorValue) => {
          setValue(next as string);
        }}
      />

      <h2>Serialized</h2>
      <CodeBlock label="Mentions output" testId="mentions-output">
        {value}
      </CodeBlock>
    </div>
  );
}
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](https://react-rtekit.vercel.app/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](https://react-rtekit.vercel.app/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

The provider is yours, and so is its debounce. The editor does not cache results between triggers.

## API

- [RichTextEditorProps](https://react-rtekit.vercel.app/react-rtekit/api/rich-text-editor/)
- [RteHandlers](https://react-rtekit.vercel.app/react-rtekit/api/types/)

---

# Find & replace

> Find and replace over the document, with match case, whole word and regular expressions, highlighted by overlay.

Features · https://react-rtekit.vercel.app/react-rtekit/find-and-replace/

## Basics

*Example: Find and replace* — the source of the live demo on this page.

```tsx
import { useRef, useState } from 'react';
import { RichTextEditor, type EditorInstance, type EditorValue } from 'react-rtekit';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * Find and replace.
 *
 * Highlighting is an overlay, not markup: searching must not change what you would
 * save, and it must not put an entry on the undo stack.
 */

const SAMPLE =
  '<h2>Quarterly report</h2>' +
  '<p>The water sample was clear. Re-test the water in two weeks.</p>' +
  '<ul><li>Revenue: on target</li><li>Costs: above plan</li></ul>' +
  '<p>Water hardness is within range.</p>';

export default function FindReplaceExample() {
  const [value, setValue] = useState(SAMPLE);
  const editorRef = useRef<EditorInstance | null>(null);

  return (
    <div className="stack">
      <div className="button-row">
        <button
          type="button"
          className="button button--solid"
          onClick={() => {
            editorRef.current?.exec('openFindReplace');
          }}
        >
          Open find and replace
        </button>
        <span className="parity__status">
          Or press <kbd>Ctrl</kbd>+<kbd>F</kbd> with the caret in the editor.
        </span>
      </div>

      <RichTextEditor
        preset="full"
        label="Report"
        hideLabel
        value={value}
        editorRef={editorRef}
        onChange={(next: EditorValue) => {
          setValue(next as string);
        }}
      />

      <h2>Serialized</h2>
      <CodeBlock label="Find replace output" testId="find-replace-output">
        {value}
      </CodeBlock>
    </div>
  );
}
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](https://react-rtekit.vercel.app/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](https://react-rtekit.vercel.app/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

Matches are highlighted with an overlay rather than by marking up the document, so a search never changes what you would save and never pushes an entry onto the undo stack. The overlay is positioned from the rendered text, so it needs the editor to be visible.

## API

- [EditorInstance](https://react-rtekit.vercel.app/react-rtekit/api/editor-instance/)
- [FindOptions](https://react-rtekit.vercel.app/react-rtekit/api/types/)

---

# Fullscreen

> Fills the window without remounting the editor, so the selection, the undo stack and every listener survive.

Features · https://react-rtekit.vercel.app/react-rtekit/fullscreen/

## Basics

*Example: Fullscreen* — the source of the live demo on this page.

```tsx
import { useRef } from 'react';
import { RichTextEditor, type EditorInstance } from 'react-rtekit';

/**
 * Fullscreen.
 *
 * The root is promoted in place rather than moved into a portal: moving it would
 * unmount the engine's content element and take the selection and undo stack with it.
 */

export default function FullscreenExample() {
  const editorRef = useRef<EditorInstance | null>(null);

  return (
    <div className="stack">
      <div className="button-row">
        <button
          type="button"
          className="button button--solid"
          onClick={() => {
            editorRef.current?.setFullscreen(true);
          }}
        >
          Enter fullscreen
        </button>
        <span className="parity__status">Escape comes back. The page behind stops scrolling.</span>
      </div>

      <RichTextEditor
        preset="full"
        label="Content"
        hideLabel
        editorRef={editorRef}
        defaultValue="<p>Type something, go fullscreen, and watch the caret stay where it was.</p>"
      />
    </div>
  );
}
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](https://react-rtekit.vercel.app/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](https://react-rtekit.vercel.app/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

This is a CSS fullscreen, not the Fullscreen API: it covers the viewport, not the screen, and it does not need a user gesture.

## API

- [EditorInstance](https://react-rtekit.vercel.app/react-rtekit/api/editor-instance/)
- [RichTextEditorProps](https://react-rtekit.vercel.app/react-rtekit/api/rich-text-editor/)

---

# Source view

> Edit the HTML directly, with everything you type going through the same sanitizer as a paste.

Features · https://react-rtekit.vercel.app/react-rtekit/source-view/

## Basics

*Example: Source view* — the source of the live demo on this page.

```tsx
import { useRef, useState } from 'react';
import { RichTextEditor, type EditorInstance, type EditorValue } from 'react-rtekit';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * The HTML source view.
 *
 * Try applying something hostile. The source view runs the same sanitizer as a paste
 * or a `value`, so it is not a way around the rules.
 */

export default function SourceViewExample() {
  const [value, setValue] = useState('<p>Switch to the source and edit the HTML.</p>');
  const editorRef = useRef<EditorInstance | null>(null);

  return (
    <div className="stack">
      <div className="button-row">
        <button
          type="button"
          className="button button--solid"
          onClick={() => {
            editorRef.current?.toggleSourceView();
          }}
        >
          Toggle source view
        </button>
        <span className="parity__status">
          Paste <code>&lt;img src=x onerror=alert(1)&gt;</code> and apply it.
        </span>
      </div>

      <RichTextEditor
        preset="full"
        label="Content"
        hideLabel
        value={value}
        editorRef={editorRef}
        onChange={(next: EditorValue) => {
          setValue(next as string);
        }}
      />

      <h2>Stored value</h2>
      <CodeBlock label="Source view output" testId="source-view-output">
        {value}
      </CodeBlock>
    </div>
  );
}
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](https://react-rtekit.vercel.app/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](https://react-rtekit.vercel.app/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

The source view is not a way around the sanitizer — markup that sanitizes away to nothing is refused rather than silently emptying the field.

## API

- [EditorInstance](https://react-rtekit.vercel.app/react-rtekit/api/editor-instance/)
- [sanitizeHtml](https://react-rtekit.vercel.app/react-rtekit/api/sanitize/)

---

# Keyboard shortcuts

> A complete keyboard model, and a shortcut reference built from the keymap that is actually in force.

Features · https://react-rtekit.vercel.app/react-rtekit/keyboard-shortcuts/

## Basics

*Example: Accessibility* — the source of the live demo on this page.

```tsx
import { useRef, useState } from 'react';
import { RichTextEditor, type EditorInstance, type EditorValue } from 'react-rtekit';

/**
 * The keyboard and screen-reader model.
 *
 * Every control is reachable, every icon has a name, and everything the editor
 * announces is shown in the log so you can see what a screen reader would hear.
 */

export default function AccessibilityExample() {
  const [value, setValue] = useState('<p>Tab into the toolbar with Alt+F10.</p>');
  const [log, setLog] = useState<string[]>([]);
  const editorRef = useRef<EditorInstance | null>(null);

  return (
    <div className="stack">
      <ol className="example-related">
        <li>
          <kbd>Tab</kbd> reaches the toolbar as one stop, then the editor.
        </li>
        <li>
          <kbd>Alt</kbd>+<kbd>F10</kbd> jumps to the toolbar from inside the text.
        </li>
        <li>Arrow keys move between toolbar buttons; Home and End jump to the ends.</li>
        <li>
          <kbd>Escape</kbd> in the toolbar puts the caret back where it was.
        </li>
        <li>
          <kbd>Ctrl</kbd>+<kbd>/</kbd> opens the shortcut reference.
        </li>
      </ol>

      <RichTextEditor
        preset="full"
        label="Message"
        value={value}
        editorRef={editorRef}
        helperText="Everything announced below is what a screen reader would hear."
        onChange={(next: EditorValue, meta) => {
          setValue(next as string);
          setLog((entries) =>
            [`change · ${meta.source} · ${meta.length} characters`, ...entries].slice(0, 10),
          );
        }}
      />

      <h2>Announcement log</h2>
      <ul className="example-related" data-testid="a11y-log">
        {log.length === 0 ? <li>Nothing yet.</li> : null}
        {log.map((entry, index) => (
          // Positional history: the index is the identity.
          <li key={index}>{entry}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](https://react-rtekit.vercel.app/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](https://react-rtekit.vercel.app/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

Shortcuts are matched on physical keys, so a layout that puts `B` somewhere else moves Mod+B with it. That is the platform's behaviour, not something this package overrides.

## API

- [RichTextEditorProps](https://react-rtekit.vercel.app/react-rtekit/api/rich-text-editor/)
- [RtePlugin](https://react-rtekit.vercel.app/react-rtekit/api/types/)

---

# Autosave & drafts

> Drafts written on a debounce to storage you choose, with a restore prompt on the way back and a TTL.

Features · https://react-rtekit.vercel.app/react-rtekit/autosave/

## Basics

*Example: Autosave and drafts* — the source of the live demo on this page.

```tsx
import { useMemo, useRef, useState } from 'react';
import { RichTextEditor, type EditorInstance, type EditorValue } from 'react-rtekit';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * Autosave and drafts.
 *
 * The storage is an in-memory one, so the page does not leave anything behind. A real
 * deployment passes `localStorage` — or a server-backed `Storage` of its own.
 */

/** A `Storage` that lives for as long as the page does. */
function createMemoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => {
      data.clear();
    },
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => {
      data.delete(key);
    },
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
}

export default function AutosaveExample() {
  const storage = useMemo(() => createMemoryStorage(), []);
  const [value, setValue] = useState('<p>Type here, wait a second, then reload the example.</p>');
  const [saved, setSaved] = useState<string | null>(null);
  const editorRef = useRef<EditorInstance | null>(null);

  return (
    <div className="stack">
      <div className="button-row">
        <button
          type="button"
          className="button"
          onClick={() => {
            editorRef.current?.saveDraft();
            setSaved(storage.getItem('rte-draft:demo'));
          }}
        >
          Save now
        </button>
        <button
          type="button"
          className="button"
          onClick={() => {
            editorRef.current?.clearDraft();
            setSaved(null);
          }}
        >
          Clear the draft
        </button>
      </div>

      <RichTextEditor
        preset="standard"
        label="Message"
        hideLabel
        value={value}
        editorRef={editorRef}
        autosave={{ key: 'demo', storage, debounceMs: 500, ttlMs: 60_000 }}
        onChange={(next: EditorValue) => {
          setValue(next as string);
        }}
      />

      <h2>What is stored</h2>
      <CodeBlock label="Stored draft" testId="autosave-draft">
        {saved ?? '(nothing saved yet)'}
      </CodeBlock>
    </div>
  );
}
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](https://react-rtekit.vercel.app/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](https://react-rtekit.vercel.app/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

The default store is `localStorage`, which is per browser and per device, and which can be unavailable in private mode. Supply your own store for anything that has to follow a user.

## API

- [EditorInstance](https://react-rtekit.vercel.app/react-rtekit/api/editor-instance/)
- [RichTextEditorProps](https://react-rtekit.vercel.app/react-rtekit/api/rich-text-editor/)

---

# Read-only & disabled

> Two different states: read-only keeps the content selectable and copyable, disabled takes it out of the tab order.

Features · https://react-rtekit.vercel.app/react-rtekit/read-only-and-disabled/

## Basics

*Example: Read-only and disabled* — the source of the live demo on this page.

```tsx
import { useState } from 'react';
import { RichTextEditor } from 'react-rtekit';
import { RteContentView } from 'react-rtekit/view';

/**
 * Read-only, disabled, and the view renderer (fixes R18).
 *
 * The two states are not the same thing: read-only content stays selectable and
 * copyable, disabled content is inert and marked so. The old editor mapped both onto
 * one flag with no visual difference at all.
 */

const SAMPLE =
  '<h2>Quarterly report</h2><p>The <strong>April</strong> results are <em>within range</em>.</p>' +
  '<ul><li>Revenue: on target</li><li>Costs: above plan</li></ul>';

export default function ReadonlyAndDisabledExample() {
  const [value] = useState(SAMPLE);

  return (
    <div className="stack">
      <h2>readOnly</h2>
      <p className="page__lead">Selectable and copyable; the toolbar is hidden.</p>
      <RichTextEditor preset="standard" label="Read-only" value={value} readOnly />

      <h2>disabled</h2>
      <p className="page__lead">
        Not focusable, marked <code>aria-disabled</code>, visibly inert.
      </p>
      <RichTextEditor preset="standard" label="Disabled" value={value} disabled />

      <h2>RteContentView</h2>
      <p className="page__lead">
        No engine at all, which is the right way to render stored content on a list page.
      </p>
      <div className="example-basic__preview" data-testid="readonly-view">
        <RteContentView value={value} />
      </div>
    </div>
  );
}
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](https://react-rtekit.vercel.app/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](https://react-rtekit.vercel.app/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

Neither is a security boundary. Both are UI states; a client can always change them, so the server has to check too.

## API

- [RichTextEditorProps](https://react-rtekit.vercel.app/react-rtekit/api/rich-text-editor/)
- [useEditorState](https://react-rtekit.vercel.app/react-rtekit/api/editor-hooks/)

---

# Mobile

> Touch targets at the platform minimum, a toolbar that docks above the on-screen keyboard, and no layout jumps on focus.

Features · https://react-rtekit.vercel.app/react-rtekit/mobile/

## Basics

*Example: Mobile* — the source of the live demo on this page.

```tsx
import { useState } from 'react';
import { RichTextEditor, type EditorValue } from 'react-rtekit';

/**
 * The editor at phone width.
 *
 * The frame is 375px wide, which is where the toolbar has to start making decisions:
 * scroll the row, collapse it into a menu, or dock it at the bottom above the
 * keyboard.
 */

export default function MobileExample() {
  const [value, setValue] = useState('<p>This editor is 375px wide.</p>');
  const [position, setPosition] = useState<'top' | 'bottom'>('bottom');
  const [overflow, setOverflow] = useState<'menu' | 'scroll' | 'wrap'>('scroll');

  return (
    <div className="stack">
      <div className="button-row">
        <label className="field-inline">
          Toolbar
          <select
            value={position}
            onChange={(event) => {
              setPosition(event.target.value as 'top' | 'bottom');
            }}
          >
            <option value="top">docked at the top</option>
            <option value="bottom">docked at the bottom, above the keyboard</option>
          </select>
        </label>
        <label className="field-inline">
          Overflow
          <select
            value={overflow}
            onChange={(event) => {
              setOverflow(event.target.value as 'menu' | 'scroll' | 'wrap');
            }}
          >
            <option value="scroll">scroll</option>
            <option value="menu">menu</option>
            <option value="wrap">wrap</option>
          </select>
        </label>
      </div>

      <div className="phone-frame">
        <RichTextEditor
          preset="full"
          label="Message"
          hideLabel
          value={value}
          toolbarPosition={position}
          toolbarOverflow={overflow}
          minHeight={220}
          onChange={(next: EditorValue) => {
            setValue(next as string);
          }}
        />
      </div>
    </div>
  );
}
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](https://react-rtekit.vercel.app/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](https://react-rtekit.vercel.app/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

The bottom-docked toolbar tracks the visual viewport, which iOS and Android report differently. It is tested on both, and a third mobile browser may need a check.

## API

- [RichTextEditorProps](https://react-rtekit.vercel.app/react-rtekit/api/rich-text-editor/)

---

# Slots

> Forty-six replaceable parts, from the root element to a single toolbar button, each one an ordinary component.

Features · https://react-rtekit.vercel.app/react-rtekit/slots/

## Basics

*Example: Custom slots* — the source of the live demo on this page.

```tsx
import { useState } from 'react';
import { RichTextEditor, type RteSlots } from 'react-rtekit';

/**
 * Four replaced slots.
 *
 * The rule each replacement follows: spread the props you were given. They carry the
 * behaviour — the `mousedown` that keeps the selection alive (fixes R5), the ARIA the
 * toolbar's keyboard model depends on, the ids that tie the counter to the field. A
 * replacement that spreads them can look like anything and still work.
 */

const SAMPLE =
  '<p>Every control here is a component from this file. Select some text and try them.</p>' +
  '<p>Add a <a href="https://example.com">link</a> to see the replaced popover.</p>';

const slots: Partial<RteSlots> = {
  /** A pill-shaped button. `aria-pressed` and the handlers come from the spread. */
  ToolbarButton: ({ icon, label, active, showLabel, ...rest }) => (
    <button {...rest} className="skin-pill" data-active={active}>
      <span aria-hidden="true">{icon}</span>
      {showLabel ? <span className="skin-pill__label">{label}</span> : null}
    </button>
  ),

  ToolbarToggle: ({ icon, label, active, showLabel, ...rest }) => (
    <button {...rest} className="skin-pill" data-active={active}>
      <span aria-hidden="true">{icon}</span>
      {showLabel ? <span className="skin-pill__label">{label}</span> : null}
    </button>
  ),

  /** A single-field link editor: no target checkbox, no title, just a URL. */
  LinkPopover: ({ href, text, onApply, onRemove, onClose, validate, editing }) => {
    return (
      <form
        className="skin-link"
        onSubmit={(event) => {
          event.preventDefault();
          const url = new FormData(event.currentTarget).get('url');
          if (typeof url !== 'string') return;
          const problem = validate(url);
          if (problem === null) onApply({ href: url, text });
        }}
      >
        <label className="skin-link__label" htmlFor="slots-custom-url">
          {editing ? 'Edit link' : 'Add link'}
        </label>
        <input
          id="slots-custom-url"
          name="url"
          className="skin-link__input"
          type="url"
          defaultValue={href}
          placeholder="https://"
        />
        <button type="submit" className="skin-pill">
          Save
        </button>
        {editing ? (
          <button type="button" className="skin-pill" onClick={onRemove}>
            Remove
          </button>
        ) : null}
        <button type="button" className="skin-pill" onClick={onClose}>
          Cancel
        </button>
      </form>
    );
  },

  /** A ring rather than a number. The `id` still links it with `aria-describedby`. */
  Counter: ({ id, count, max, overLimit, nearLimit, text }) => {
    const fraction = max ? Math.min(count / max, 1) : 0;
    return (
      <span
        id={id}
        className="skin-counter"
        data-state={overLimit ? 'over' : nearLimit ? 'near' : 'ok'}
      >
        <span
          className="skin-counter__ring"
          style={{ ['--fill' as string]: `${String(Math.round(fraction * 100))}%` }}
          aria-hidden="true"
        />
        {text}
      </span>
    );
  },

  /** A placeholder with a hint under it. */
  Placeholder: ({ text }) => (
    <span className="skin-placeholder">
      {text}
      <small>Markdown shortcuts work here — try “# ” or “- ”.</small>
    </span>
  ),
};

export default function SlotsCustomExample() {
  const [html, setHtml] = useState(SAMPLE);

  return (
    <div className="stack">
      <RichTextEditor
        preset="standard"
        label="Message"
        hideLabel
        maxLength={240}
        showCounter
        slots={slots}
        value={html}
        onChange={(value) => {
          setHtml(value as string);
        }}
      />

      <p className="callout">
        Nothing here changes what the editor <em>does</em>. The four replacements are presentation
        only, which is why the keyboard model, the announcements and the selection handling are all
        still the shipped ones.
      </p>
    </div>
  );
}
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](https://react-rtekit.vercel.app/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](https://react-rtekit.vercel.app/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

A slot that drops the props it is given renders an empty shell — the behaviour lives in those props. Spread them back, or the part stops working rather than stops looking right.

## API

- [RteSlots](https://react-rtekit.vercel.app/react-rtekit/api/types/)
- [slots](https://react-rtekit.vercel.app/react-rtekit/api/slots/)
- [useRteSlots](https://react-rtekit.vercel.app/react-rtekit/api/editor-hooks/)

---

# Handler middleware

> Eighteen interception points, each (ctx, next) => void, so you can wrap, veto or replace a behaviour without forking it.

Features · https://react-rtekit.vercel.app/react-rtekit/handler-middleware/

## Basics

*Example: Handler middleware* — the source of the live demo on this page.

```tsx
import { useCallback, useMemo, useState } from 'react';
import { RichTextEditor, countText, type RteHandlers } from 'react-rtekit';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * Handler middleware.
 *
 * Every interaction the editor has goes through a handler you can wrap. Call `next()`
 * to let it happen, pass an override to change it, or do neither to cancel — the same
 * three options at every point, which is what makes the surface learnable.
 */

const SAMPLE =
  '<p>Paste something formatted, click a toolbar button, or follow this ' +
  '<a href="https://example.com/external">external link</a>.</p>';

/** The budget the "veto a change" handler enforces. */
const HARD_LIMIT = 400;

export default function HandlersMiddlewareExample() {
  const [html, setHtml] = useState(SAMPLE);
  const [plainTextOnly, setPlainTextOnly] = useState(true);
  const [confirmLinks, setConfirmLinks] = useState(true);
  const [log, setLog] = useState<string[]>([]);

  const note = useCallback((message: string) => {
    setLog((entries) =>
      [`${new Date().toLocaleTimeString()} — ${message}`, ...entries].slice(0, 14),
    );
  }, []);

  const handlers: Partial<RteHandlers> = useMemo(
    () => ({
      // Analytics, then the default. The commonest override there is.
      onToolbarCommand: (ctx, next) => {
        note(`toolbar: ${ctx.command}`);
        void next();
      },

      // A paste policy, decided per paste rather than per editor.
      onPaste: (ctx, next) => {
        note(`paste from ${ctx.source} (${ctx.html.length} bytes of HTML)`);
        void next(plainTextOnly ? { mode: 'text' } : {});
      },

      // Cancelling: not calling next() is the whole mechanism.
      onLinkOpen: (ctx, next) => {
        if (!confirmLinks) {
          void next();
          return;
        }
        if (window.confirm(`Open ${ctx.href}?`)) {
          note(`link opened: ${ctx.href}`);
          void next();
        } else {
          note(`link blocked: ${ctx.href}`);
        }
      },

      // A veto. The editor keeps the content it had.
      onBeforeChange: (ctx, next) => {
        if (ctx.meta.length > HARD_LIMIT) {
          note(`change vetoed at ${ctx.meta.length} characters`);
          return;
        }
        void next();
      },

      onSanitizeViolation: (ctx, next) => {
        note(`sanitizer removed <${ctx.violation.tag}> (${ctx.violation.reason})`);
        void next();
      },
    }),
    [confirmLinks, note, plainTextOnly],
  );

  return (
    <div className="stack">
      <div className="button-row">
        <label className="field-inline">
          <input
            type="checkbox"
            checked={plainTextOnly}
            onChange={(event) => {
              setPlainTextOnly(event.target.checked);
            }}
          />
          Plain-text paste only
        </label>
        <label className="field-inline">
          <input
            type="checkbox"
            checked={confirmLinks}
            onChange={(event) => {
              setConfirmLinks(event.target.checked);
            }}
          />
          Confirm before following a link
        </label>
      </div>

      <RichTextEditor
        preset="standard"
        label="Message"
        hideLabel
        value={html}
        handlers={handlers}
        helperText={`Changes past ${HARD_LIMIT} characters are refused by onBeforeChange.`}
        onChange={(value) => {
          setHtml(value as string);
        }}
      />

      <p className="example-basic__state" data-testid="middleware-length">
        {countText(html, 'characters')} / {HARD_LIMIT} characters
      </p>

      <h2>Handler log</h2>
      <ul className="event-log" data-testid="middleware-log">
        {log.length === 0 ? <li>Nothing yet — interact with the editor above.</li> : null}
        {log.map((entry) => (
          <li key={entry}>{entry}</li>
        ))}
      </ul>

      <h2>Output</h2>
      <CodeBlock label="Middleware output" testId="middleware-output">
        {html}
      </CodeBlock>
    </div>
  );
}
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](https://react-rtekit.vercel.app/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](https://react-rtekit.vercel.app/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

A handler that never calls `next()` cancels the default behaviour. That is the point, and it is also the most common cause of a feature that has silently stopped working.

## API

- [RteHandlers](https://react-rtekit.vercel.app/react-rtekit/api/types/)
- [handlers](https://react-rtekit.vercel.app/react-rtekit/api/handlers/)

---

# Commands

> Fifty-seven commands, each overridable, dispatched by the toolbar, the shortcuts and your own code alike.

Features · https://react-rtekit.vercel.app/react-rtekit/commands/

## Basics

*Example: Command overrides* — the source of the live demo on this page.

```tsx
import { useCallback, useMemo, useState } from 'react';
import { RichTextEditor, type CommandOverrides } from 'react-rtekit';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * Command overrides.
 *
 * An override is middleware around a command: it sees the payload, can replace it,
 * and decides whether the built-in runs at all. That is enough to enforce a policy
 * without forking anything — and because `next()` reaches the built-in rather than
 * re-entering the chain, an override may safely call the command it overrides.
 */

/** The design system's swatches. Anything else is snapped to the nearest one. */
const TOKENS = [
  { name: 'ink', value: '#1F2933' },
  { name: 'danger', value: '#C81E1E' },
  { name: 'success', value: '#0E7C3A' },
  { name: 'brand', value: '#2C6ECB' },
];

/** Distance between two hex colours, as plain squared RGB. Good enough to snap. */
function distance(a: string, b: string): number {
  const parse = (hex: string) => [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16));
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  return (ar! - br!) ** 2 + (ag! - bg!) ** 2 + (ab! - bb!) ** 2;
}

/** The token nearest a free-form colour. */
function nearestToken(color: string): { name: string; value: string } {
  return TOKENS.reduce((best, token) =>
    distance(token.value, color) < distance(best.value, color) ? token : best,
  );
}

const SAMPLE = '<p>Add a link, or colour some text with the palette, and watch the log below.</p>';

export default function CommandOverridesExample() {
  const [html, setHtml] = useState(SAMPLE);
  const [log, setLog] = useState<string[]>([]);

  const note = useCallback((message: string) => {
    setLog((entries) =>
      [`${new Date().toLocaleTimeString()} — ${message}`, ...entries].slice(0, 12),
    );
  }, []);

  const commandOverrides: CommandOverrides = useMemo(
    () => ({
      // Company policy: every link this editor produces opens safely in a new tab.
      insertLink: (ctx, next) => {
        note(`insertLink → forced target and rel on ${ctx.payload.href}`);
        return next({ ...ctx.payload, target: '_blank', rel: 'noopener noreferrer' });
      },

      // Snap any colour to the design system, including the custom picker's output.
      setColor: (ctx, next) => {
        const { color } = ctx.payload;
        if (color === null) {
          note('setColor → reset (removes the format, rather than writing black)');
          return next(ctx.payload);
        }
        const token = nearestToken(color);
        if (token.value !== color) note(`setColor → ${color} snapped to ${token.name}`);
        return next({ color: token.value });
      },

      // A command an override can veto outright: this editor refuses horizontal rules.
      insertHorizontalRule: () => {
        note('insertHorizontalRule → refused by policy');
        return false;
      },
    }),
    [note],
  );

  return (
    <div className="stack">
      <RichTextEditor
        preset="full"
        label="Message"
        hideLabel
        value={html}
        onChange={(value) => {
          setHtml(value as string);
        }}
        colors={{ palette: TOKENS.map((token) => token.value), allowCustom: true }}
        commandOverrides={commandOverrides}
      />

      <h2>What the overrides did</h2>
      <ul className="event-log" data-testid="override-log">
        {log.length === 0 ? <li>Nothing yet — insert a link or pick a colour.</li> : null}
        {log.map((entry) => (
          <li key={entry}>{entry}</li>
        ))}
      </ul>

      <h2>Output</h2>
      <CodeBlock label="Override output" testId="override-output">
        {html}
      </CodeBlock>
    </div>
  );
}
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](https://react-rtekit.vercel.app/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](https://react-rtekit.vercel.app/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

A command runs against the current selection. Calling one while the editor has no focus applies it to the saved selection, and if there is none, to nothing.

## API

- [CommandId](https://react-rtekit.vercel.app/react-rtekit/api/types/)
- [commands](https://react-rtekit.vercel.app/react-rtekit/api/commands/)
- [useCommand](https://react-rtekit.vercel.app/react-rtekit/api/editor-hooks/)
- [EditorInstance](https://react-rtekit.vercel.app/react-rtekit/api/editor-instance/)

---

# Composable parts

> The same editor as eleven separate components, for layouts the all-in-one shape cannot make.

Features · https://react-rtekit.vercel.app/react-rtekit/composable-parts/

## Basics

*Example: Composable parts* — the source of the live demo on this page.

```tsx
import { useState, type ReactNode } from 'react';
import { Rte, classicTheme, presets, useEditor } from 'react-rtekit';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * The parts, arranged into somebody else's layout.
 *
 * The third entry point. `<RichTextEditor>` puts the toolbar above the
 * content and the counter below it; when that is the wrong shape, the same pieces can
 * be placed anywhere — and `<Rte.Portals>` gives the popovers and menus somewhere to
 * mount.
 */

/** A card, standing in for whatever the surrounding application uses. */
function Card({ children }: { children: ReactNode }) {
  return <div className="compose-card">{children}</div>;
}

function CardHeader({ children }: { children: ReactNode }) {
  return <div className="compose-card__header">{children}</div>;
}

function CardFooter({ children }: { children: ReactNode }) {
  return <div className="compose-card__footer">{children}</div>;
}

const SAMPLE =
  '<p>Hi {first_name},</p><p>Your report for {report_month} is ready.</p><p>— The team</p>';

export default function ComposableExample() {
  const [sent, setSent] = useState<string | null>(null);

  const editor = useEditor({
    defaultValue: SAMPLE,
    plugins: presets.email.plugins,
    maxLength: 600,
    required: true,
  });

  return (
    <div className="stack">
      <Rte.Root
        editor={editor}
        theme={classicTheme}
        maxLength={600}
        countUnit="characters"
        mergeTags={[
          { key: 'first_name', label: 'First name', sample: 'Dana' },
          { key: 'report_month', label: 'Report month', sample: 'April' },
        ]}
      >
        <Card>
          <CardHeader>
            <Rte.Label required>Message</Rte.Label>
            <Rte.Toolbar
              items={[
                ['bold', 'italic', 'underline'],
                ['color'],
                ['alignLeft', 'alignCenter', 'alignRight', 'bulletList'],
                ['link'],
              ]}
            />
          </CardHeader>

          <Rte.Content placeholder="Write the message…" />

          <CardFooter>
            <Rte.Counter max={600} />
            <Rte.ErrorText />
            <button
              type="button"
              className="button button--solid"
              onClick={() => {
                const problem = editor.validate();
                setSent(problem ?? editor.getHTML({ profile: 'email' }));
              }}
            >
              Send
            </button>
          </CardFooter>
        </Card>

        {/* Without this, the link popover has nowhere to mount. */}
        <Rte.Portals features={['link']} />
      </Rte.Root>

      {sent ? (
        <>
          <h2>What would be sent</h2>
          <CodeBlock label="Composed output" testId="composable-output">
            {sent}
          </CodeBlock>
        </>
      ) : null}

      <p className="callout">
        The footer here is a <code>div</code> of this page&rsquo;s own, not the editor&rsquo;s.{' '}
        <code>{'<Rte.Counter>'}</code> and <code>{'<Rte.ErrorText>'}</code> work inside it because
        they read the editor from context rather than from a parent component.
      </p>
    </div>
  );
}
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](https://react-rtekit.vercel.app/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](https://react-rtekit.vercel.app/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

`RtePortals` has to be rendered somewhere, or the popovers, dialogs and menus have nowhere to go and simply do not appear.

## API

- [Rte](https://react-rtekit.vercel.app/react-rtekit/api/composable-parts/)
- [RteRoot](https://react-rtekit.vercel.app/react-rtekit/api/composable-parts/)
- [RteToolbar](https://react-rtekit.vercel.app/react-rtekit/api/composable-parts/)
- [RteContent](https://react-rtekit.vercel.app/react-rtekit/api/composable-parts/)
- [RteLabel](https://react-rtekit.vercel.app/react-rtekit/api/composable-parts/)
- [RteCounter](https://react-rtekit.vercel.app/react-rtekit/api/composable-parts/)
- [RteFooter](https://react-rtekit.vercel.app/react-rtekit/api/composable-parts/)
- [RtePortals](https://react-rtekit.vercel.app/react-rtekit/api/composable-parts/)
- [RichTextEditor](https://react-rtekit.vercel.app/react-rtekit/api/rich-text-editor/)

---

# Headless

> useEditor with no chrome at all: the document, the commands and the state, and you draw the rest.

Features · https://react-rtekit.vercel.app/react-rtekit/headless/

## Basics

*Example: Headless* — the source of the live demo on this page.

```tsx
import { useState } from 'react';
import {
  Rte,
  plugins,
  useCharacterCount,
  useCommand,
  useEditor,
  useFormatState,
  useIsEmpty,
  type CommandId,
} from 'react-rtekit';

/**
 * `useEditor` with a UI built from nothing.
 *
 * The fourth entry point: no `<RichTextEditor>`, no slots, no theme. What
 * remains is the editor instance, the subscription hooks and `<Rte.Content>` — which
 * exists because the contenteditable element belongs to the engine and has to be
 * attached rather than rendered.
 */

/** A control bound to one command. Everything a toolbar button really needs. */
function Control({ command, children }: { command: CommandId; children: string }) {
  const { exec, canExec, isActive } = useCommand(command);

  return (
    <button
      type="button"
      className="headless__control"
      aria-pressed={isActive}
      disabled={!canExec}
      // Without this the click moves focus out of the editor first, and the command
      // applies to a selection that no longer exists (fixes R5).
      onMouseDown={(event) => {
        event.preventDefault();
      }}
      onClick={() => {
        exec();
      }}
    >
      {children}
    </button>
  );
}

/** A read-out of the state the hooks expose, so the subscriptions are visible. */
function StateReadout() {
  const format = useFormatState();
  const count = useCharacterCount();
  const empty = useIsEmpty();

  const active = Object.entries(format.marks)
    .filter(([, value]) => value === true)
    .map(([name]) => name);

  return (
    <dl className="headless__state" data-testid="headless-state">
      <dt>Block</dt>
      <dd>
        {format.block.type}
        {format.block.headingLevel ? ` ${String(format.block.headingLevel)}` : ''} ·{' '}
        {format.block.align}
      </dd>
      <dt>Marks</dt>
      <dd>{active.length > 0 ? active.join(', ') : 'none'}</dd>
      <dt>List</dt>
      <dd>{format.list.type ?? 'none'}</dd>
      <dt>Length</dt>
      <dd>
        {count} characters · {empty ? 'empty' : 'not empty'}
      </dd>
    </dl>
  );
}

const SAMPLE = '<p>This whole page is four components and three hooks.</p>';

export default function HeadlessExample() {
  const [html, setHtml] = useState(SAMPLE);

  const editor = useEditor({
    defaultValue: SAMPLE,
    // No preset: the plugin list is exactly what this UI can reach.
    plugins: [
      plugins.paragraph,
      plugins.bold,
      plugins.italic,
      plugins.underline,
      plugins.list,
      plugins.history,
    ],
    onChange: (value) => {
      setHtml(value as string);
    },
  });

  return (
    <div className="stack">
      <Rte.Root editor={editor} className="headless">
        <div className="headless__bar" role="toolbar" aria-label="Formatting">
          <Control command="toggleBold">Bold</Control>
          <Control command="toggleItalic">Italic</Control>
          <Control command="toggleUnderline">Underline</Control>
          <Control command="toggleBulletList">Bullets</Control>
          <Control command="undo">Undo</Control>
          <Control command="redo">Redo</Control>
        </div>

        <Rte.Content aria-label="Message" placeholder="Nothing here is a shipped component." />
        <StateReadout />
      </Rte.Root>

      <div className="button-row">
        <button
          type="button"
          className="button"
          onClick={() => {
            editor.setContent(SAMPLE);
          }}
        >
          Reset content
        </button>
        <span className="example-basic__state">{html.length} bytes of HTML</span>
      </div>

      <p className="callout">
        The one component that could not be replaced is <code>{'<Rte.Content>'}</code>. The engine
        owns that element — it is where the selection, the IME and the undo stack live — so the
        library attaches it rather than rendering it, and everything else is yours.
      </p>
    </div>
  );
}
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](https://react-rtekit.vercel.app/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](https://react-rtekit.vercel.app/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

Headless still needs the engine and the stylesheet for the content area. It is about the chrome, not about the bytes.

## API

- [useEditor](https://react-rtekit.vercel.app/react-rtekit/api/use-editor/)
- [UseEditorOptions](https://react-rtekit.vercel.app/react-rtekit/api/use-editor/)
- [EditorInstance](https://react-rtekit.vercel.app/react-rtekit/api/editor-instance/)
- [useEditorContext](https://react-rtekit.vercel.app/react-rtekit/api/editor-hooks/)
- [useIsFocused](https://react-rtekit.vercel.app/react-rtekit/api/editor-hooks/)
- [useFormatState](https://react-rtekit.vercel.app/react-rtekit/api/editor-hooks/)

---

# Plugin authoring

> Add a mark, a block, a command or a toolbar item with definePlugin, in the same shape the built-ins use.

Features · https://react-rtekit.vercel.app/react-rtekit/plugin-authoring/

## Basics

*Example: Writing a plugin* — the source of the live demo on this page.

```tsx
import { useState } from 'react';
import { RichTextEditor, createToolbarItem, definePlugin } from 'react-rtekit';
import { CodeBlock } from '../../components/CodeBlock';
import source from './highlight?raw';
import { highlight } from './highlight';

/**
 * A plugin, end to end.
 *
 * Six declarations make a feature: the mark so the document can hold it, the command
 * so something can apply it, the keymap and the toolbar item so a person can reach it,
 * the sanitizer rule so it survives a paste, and the localization key so it is not
 * hard-coded English (fixes R17).
 */
const SAMPLE =
  '<p>Select a few words and press <strong>Ctrl+Shift+H</strong>, or use the toolbar button.</p>' +
  '<p>Highlighted text survives a copy and paste, because the plugin says <code>mark</code> is allowed.</p>';

export default function PluginAuthoringExample() {
  const [html, setHtml] = useState(SAMPLE);

  return (
    <div className="stack">
      <RichTextEditor
        preset="standard"
        label="Message"
        hideLabel
        addPlugins={[highlight]}
        toolbar={[['bold', 'italic'], ['highlight'], ['undo', 'redo']]}
        localization={{ custom: { highlight: 'Highlight' } }}
        value={html}
        onChange={(value) => {
          setHtml(value as string);
        }}
      />

      <h2>Output</h2>
      <CodeBlock label="Highlight output" testId="plugin-output">
        {html}
      </CodeBlock>

      <h2>The whole plugin</h2>
      <CodeBlock label="Highlight plugin source">{source}</CodeBlock>

      <p className="callout">
        Nothing above reaches into the engine. <code>definePlugin</code> is an identity function —
        it exists so the object is inferred rather than annotated — and{' '}
        <code>{'createToolbarItem'}</code> does the same for one control. Both are re-exported here
        only so this file shows the imports a plugin author needs.
      </p>

      <p className="example-basic__state">
        {typeof definePlugin === 'function' && typeof createToolbarItem === 'function'
          ? 'definePlugin and createToolbarItem are plain functions: no registry, no side effects.'
          : ''}
      </p>
    </div>
  );
}
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](https://react-rtekit.vercel.app/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](https://react-rtekit.vercel.app/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

A plugin whose `dependsOn` names something absent still loads, with a warning — a missing dependency should not hand the reader an editor with a feature silently gone.

## API

- [RtePlugin](https://react-rtekit.vercel.app/react-rtekit/api/types/)
- [definePlugin](https://react-rtekit.vercel.app/react-rtekit/api/plugin-api/)
- [resolvePluginOrder](https://react-rtekit.vercel.app/react-rtekit/api/plugin-api/)
- [featuresOf](https://react-rtekit.vercel.app/react-rtekit/api/plugin-api/)

---

# Presets

> Six bundles — minimal, comment, standard, classic, email and full — each a plugin list plus prop defaults.

Features · https://react-rtekit.vercel.app/react-rtekit/presets/

## Basics

*Example: Presets* — the same source as under "Theme presets".

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](https://react-rtekit.vercel.app/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](https://react-rtekit.vercel.app/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

A preset is resolved when the editor mounts, so changing `preset` remounts it and starts a new undo stack.

## API

- [presets](https://react-rtekit.vercel.app/react-rtekit/api/plugin-api/)
- [resolvePlugins](https://react-rtekit.vercel.app/react-rtekit/api/plugin-api/)
- [plugins](https://react-rtekit.vercel.app/react-rtekit/api/plugins/)
- [useRteConfig](https://react-rtekit.vercel.app/react-rtekit/api/editor-hooks/)
- [useRteDefaults](https://react-rtekit.vercel.app/react-rtekit/api/editor-hooks/)
- [RteDefaultsProvider](https://react-rtekit.vercel.app/react-rtekit/api/providers/)

---

# Engine adapter

> An EditorEngine interface owns the document layer, so the engine behind it can change without the public API moving.

Features · https://react-rtekit.vercel.app/react-rtekit/engine-adapter/

## Basics

*Example: Headless* — the same source as under "Headless".

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](https://react-rtekit.vercel.app/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](https://react-rtekit.vercel.app/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

One adapter ships, and it is this project's own. The interface exists so the engine is replaceable and so nothing outside `src/engines/` depends on which one is in place — a boundary that has already earned itself once, when the engine behind it was rewritten and nothing above it moved.

## API

- [EditorInstance](https://react-rtekit.vercel.app/react-rtekit/api/editor-instance/)
- [RichTextEditorProps](https://react-rtekit.vercel.app/react-rtekit/api/rich-text-editor/)

---

# Icons

> Fifty-two inline SVGs drawn with currentColor, each replaceable, and no icon package in your bundle.

Features · https://react-rtekit.vercel.app/react-rtekit/icons/

## Basics

*Example: Design-system skin* — the source of the live demo on this page.

```tsx
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { RichTextEditor, type RteSlots } from 'react-rtekit';

/**
 * Re-skinning through the twelve primitives.
 *
 * This is the argument for having primitives at all. Replace `Button`, `Popover`,
 * `Dialog`, `TextInput` and the rest, and every feature that uses them follows — the
 * link popover, the image dialog, the colour picker, the table controls, the find
 * panel. No feature knows it has been re-skinned.
 */

/** A stand-in for a design system's own components. */
function DsButton({
  variant = 'text',
  className,
  children,
  ...rest
}: {
  variant?: 'text' | 'solid' | 'outline';
  className?: string;
  children?: ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={['ds-button', className].filter(Boolean).join(' ')}
      data-variant={variant}
    >
      {children}
    </button>
  );
}

/** A dialog built on the platform's own, which gives focus trapping for free. */
function DsDialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  return (
    <dialog ref={ref} className="ds-dialog" onClose={onClose} aria-label={title}>
      <header className="ds-dialog__header">{title}</header>
      <div className="ds-dialog__body">{children}</div>
    </dialog>
  );
}

const slots: Partial<RteSlots> = {
  Button: DsButton,

  IconButton: ({ label, className, children, ...rest }) => (
    <button
      {...rest}
      aria-label={label}
      title={label}
      className={['ds-button', 'ds-button--icon', className].filter(Boolean).join(' ')}
    >
      {children}
    </button>
  ),

  Dialog: DsDialog,

  TextInput: ({ label, value, onChange, invalid, className }) => (
    <label className={['ds-field', className].filter(Boolean).join(' ')}>
      {label ? <span className="ds-field__label">{label}</span> : null}
      <input
        className="ds-field__input"
        value={value}
        aria-invalid={invalid === true}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      />
    </label>
  ),

  Select: ({ label, value, options, onChange, className }) => (
    <label className={['ds-field', className].filter(Boolean).join(' ')}>
      {label ? <span className="ds-field__label">{label}</span> : null}
      <select
        className="ds-field__input"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  ),

  Checkbox: ({ label, checked, onChange, disabled, className }) => (
    <label className={['ds-check', className].filter(Boolean).join(' ')}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => {
          onChange(event.target.checked);
        }}
      />
      {label}
    </label>
  ),

  Spinner: ({ label, className }) => (
    <span
      className={['ds-spinner', className].filter(Boolean).join(' ')}
      role="status"
      aria-label={label}
    />
  ),

  Tooltip: ({ title, children, className }) => (
    <span className={['ds-tooltip', className].filter(Boolean).join(' ')} title={title}>
      {children}
    </span>
  ),
};

const SAMPLE =
  '<p>Open the <strong>link</strong> popover, the image dialog or the table picker: all three ' +
  'are built from the primitives replaced in this file.</p>';

export default function DesignSystemSkinExample() {
  const [html, setHtml] = useState(SAMPLE);

  return (
    <div className="stack">
      <RichTextEditor
        preset="full"
        label="Message"
        hideLabel
        slots={slots}
        value={html}
        onChange={(value) => {
          setHtml(value as string);
        }}
      />

      <p className="callout">
        Eight replacements, and every dialog, popover, field and busy indicator in the editor
        changed with them. The features themselves were not touched — they ask for a{' '}
        <code>Dialog</code>, not for this one.
      </p>
    </div>
  );
}
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](https://react-rtekit.vercel.app/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](https://react-rtekit.vercel.app/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

Icons are sized from `--rte-icon-size` and coloured from `currentColor`. A replacement with baked-in dimensions or a hard-coded fill will not follow the theme.

## API

- [RteIcons](https://react-rtekit.vercel.app/react-rtekit/api/types/)
- [icons](https://react-rtekit.vercel.app/react-rtekit/api/icons/)

---

# Localization

> Every string in one catalogue: five locales ship, 153 keys, and a pseudo-locale for finding the ones you missed.

Features · https://react-rtekit.vercel.app/react-rtekit/localization/

## Basics

*Example: Localization* — the source of the live demo on this page.

```tsx
import { useMemo, useState } from 'react';
import { RichTextEditor, de, en, es, hu, pseudo, type RteLocalization } from 'react-rtekit';
import { ChoiceGroup } from '../../components/ChoiceGroup';

/**
 * Four catalogues, a pseudo-locale and right-to-left.
 *
 * Every visible string, tooltip, `aria-label` and announcement comes from the
 * catalogue — which is what the pseudo-locale is for: anything that comes out in plain
 * English was never routed through it, and anything that overflows was a layout that
 * only ever fitted English (fixes R17).
 */

const CATALOGUES: { id: string; label: string; catalogue: RteLocalization }[] = [
  { id: 'en', label: 'English', catalogue: en },
  { id: 'hu', label: 'Magyar', catalogue: hu },
  { id: 'de', label: 'Deutsch', catalogue: de },
  { id: 'es', label: 'Español', catalogue: es },
  { id: 'pseudo', label: 'Pseudo', catalogue: pseudo },
];

const SAMPLE = '<p>Hover a toolbar button, or open the link popover.</p>';

/**
 * A right-to-left catalogue.
 *
 * The library ships no RTL locale, so this builds one from English with `dir` flipped:
 * the point of the demo is the mirroring, which is driven by `dir` alone because the
 * whole stylesheet is written in logical properties.
 */
const rtl: RteLocalization = { ...en, locale: 'ar', dir: 'rtl' };

export default function LocalizationExample() {
  const [id, setId] = useState('en');
  const [rightToLeft, setRightToLeft] = useState(false);
  const [html, setHtml] = useState(SAMPLE);

  const localization = useMemo(() => {
    if (rightToLeft) return rtl;
    return CATALOGUES.find((entry) => entry.id === id)?.catalogue ?? en;
  }, [id, rightToLeft]);

  return (
    <div className="stack">
      <ChoiceGroup
        label="Language"
        hint="Which catalogue the editor's own strings come from — labels, placeholders and announcements."
        options={CATALOGUES.map((entry) => ({ value: entry.id, label: entry.label }))}
        value={rightToLeft ? '' : id}
        onChange={(next) => {
          setId(next);
          setRightToLeft(false);
        }}
      />

      {/*
        Outside the radiogroup, not inside it: a checkbox among radios is a control the
        group claims to contain and cannot describe, and a screen reader announces it as
        one of N options when it is not an option at all. It is also a different question
        — direction, not language — so it gets its own line.
      */}
      <div className="choice-group">
        <div className="choice-group__head">
          <span className="choice-group__label">Direction</span>
          <span className="choice-group__hint">
            Mirrors the layout and reorders the toolbar. Independent of the catalogue.
          </span>
        </div>
        <label className="field-inline">
          <input
            type="checkbox"
            checked={rightToLeft}
            onChange={(event) => {
              setRightToLeft(event.target.checked);
            }}
          />
          Right to left
        </label>
      </div>

      <RichTextEditor
        // A catalogue change is cheap, but `dir` reorders the toolbar, so remounting
        // keeps the two modes honestly separate.
        key={`${id}-${String(rightToLeft)}`}
        preset="standard"
        label={localization.editor.label as string}
        localization={localization}
        maxLength={240}
        showCounter
        value={html}
        onChange={(value) => {
          setHtml(value as string);
        }}
      />

      <p className="example-basic__state" data-testid="localization-state">
        locale: {localization.locale} · dir: {localization.dir}
      </p>

      <p className="callout">
        Nothing above sets <code>dir</code> on the editor: the catalogue carries its own, and the
        editor follows it when no prop overrides it. The toolbar order, the indent direction, the
        alignment defaults and the popover placement all mirror with it.
      </p>

      <p className="callout">
        The pseudo-locale is a test, not a language. Every string is accented and padded by about a
        third, so a label that comes out plain was hard-coded somewhere and a control that overflows
        was sized for English.
      </p>
    </div>
  );
}
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](https://react-rtekit.vercel.app/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](https://react-rtekit.vercel.app/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

The catalogue covers the editor's own chrome. Content direction, date formats and your application's strings are yours.

## API

- [RteLocalization](https://react-rtekit.vercel.app/react-rtekit/api/types/)
- [localization-keys](https://react-rtekit.vercel.app/react-rtekit/api/localization-keys/)
- [useLocalization](https://react-rtekit.vercel.app/react-rtekit/api/editor-hooks/)
- [RteLocaleProvider](https://react-rtekit.vercel.app/react-rtekit/api/providers/)

---

# Accessibility

> A named textbox, a real ARIA toolbar with roving focus, linked errors, live announcements and AA contrast.

Features · https://react-rtekit.vercel.app/react-rtekit/accessibility/

## Basics

*Example: Accessibility* — the same source as under "Keyboard shortcuts".

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](https://react-rtekit.vercel.app/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](https://react-rtekit.vercel.app/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

Every shipped theme meets WCAG AA and a test enforces it. A theme you write does not inherit that — and a slot you replace does not inherit the semantics either.

## API

- [RichTextEditorProps](https://react-rtekit.vercel.app/react-rtekit/api/rich-text-editor/)
- [useValidationError](https://react-rtekit.vercel.app/react-rtekit/api/editor-hooks/)

---

# Server rendering

> Renders the content on the server and hydrates without a flash, so the field is not an empty box on first paint.

Features · https://react-rtekit.vercel.app/react-rtekit/server-rendering/

## Basics

*Example: Basic* — the same source as under "Usage".

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](https://react-rtekit.vercel.app/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](https://react-rtekit.vercel.app/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

The server output is the content, not a working editor — the engine needs a DOM. Only an HTML value can be pre-rendered; JSON and Markdown need a converter the server entry deliberately does not carry.

## API

- [RichTextEditorProps](https://react-rtekit.vercel.app/react-rtekit/api/rich-text-editor/)
- [RteContentView](https://react-rtekit.vercel.app/react-rtekit/api/rte-content-view/)

---

# Performance

> What a large document costs, what is measured on every build, and which props are worth memoising.

Features · https://react-rtekit.vercel.app/react-rtekit/performance/

## Basics

*Example: Large document* — the source of the live demo on this page.

```tsx
import { useCallback, useMemo, useRef, useState } from 'react';
import { RichTextEditor, type EditorInstance } from 'react-rtekit';
import { buildLargeDocument } from '../../fixtures';

/**
 * A 100 KB document, measured.
 *
 * Two costs are separated here because they behave differently. Keystroke handling is
 * bounded — the engine touches the block the caret is in — while serialization is
 * proportional to the document, which is why `meta.document` is a lazy getter and why
 * anything expensive belongs on `onChangeDebounced` rather than on `onChange`.
 */

/** How many keystrokes the latency meter averages over. */
const SAMPLE_SIZE = 20;

/** One measured operation. */
interface Timing {
  label: string;
  ms: number;
  note: string;
}

export default function LargeDocumentExample() {
  const initial = useMemo(() => buildLargeDocument(100_000), []);
  const editorRef = useRef<EditorInstance>(null);
  const latencies = useRef<number[]>([]);
  const keyDownAt = useRef(0);

  const [latency, setLatency] = useState<{ last: number; average: number; samples: number } | null>(
    null,
  );
  const [timings, setTimings] = useState<Timing[] | null>(null);
  const [debouncedAt, setDebouncedAt] = useState<string | null>(null);

  /** Starts the clock on the key, and stops it once React has committed. */
  const onKeyDown = useCallback(() => {
    keyDownAt.current = performance.now();
    requestAnimationFrame(() => {
      if (keyDownAt.current === 0) return;
      const elapsed = performance.now() - keyDownAt.current;
      keyDownAt.current = 0;
      latencies.current = [...latencies.current, elapsed].slice(-SAMPLE_SIZE);
      const total = latencies.current.reduce((sum, value) => sum + value, 0);
      setLatency({
        last: elapsed,
        average: total / latencies.current.length,
        samples: latencies.current.length,
      });
    });
  }, []);

  const measure = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const time = (label: string, note: string, run: () => unknown): Timing => {
      const started = performance.now();
      run();
      return { label, ms: performance.now() - started, note };
    };

    setTimings([
      time('getText()', 'What a counter needs. No markup is built.', () => editor.getText()),
      time('getJSON()', 'The portable document. What onChange builds lazily.', () =>
        editor.getJSON(),
      ),
      time('getHTML()', 'Serialize, then sanitize the output.', () => editor.getHTML()),
      time('getHTML({ sanitize: false })', 'The same, without the output sanitizer.', () =>
        editor.getHTML({ sanitize: false }),
      ),
      time('getHTML({ profile: "email" })', 'Inlining styles costs a second pass.', () =>
        editor.getHTML({ profile: 'email' }),
      ),
      time('isEmpty()', 'Stops at the first content it finds.', () => editor.isEmpty()),
    ]);
  }, []);

  return (
    <div className="stack">
      <p className="page__lead">
        {Math.round(initial.length / 1024)} KB of HTML. Type into it and watch the meter; the number
        that matters is the average, not the first keystroke.
      </p>

      <RichTextEditor
        preset="standard"
        label="Large document"
        hideLabel
        editorRef={editorRef}
        defaultValue={initial}
        maxHeight={360}
        // The meter reads the key through the handler middleware rather than a wrapper
        // element: that is the documented way in, and it sees keys the DOM would not
        // bubble the same way.
        handlers={{
          onKeyDown: (_ctx, next) => {
            onKeyDown();
            void next();
          },
        }}
        // The expensive work is deliberately not on onChange.
        onChangeDebounced={() => {
          setDebouncedAt(new Date().toLocaleTimeString());
        }}
        changeDebounceMs={300}
      />

      <dl className="headless__state" data-testid="large-latency">
        <dt>Last keystroke</dt>
        <dd>{latency ? `${latency.last.toFixed(1)} ms` : 'not measured'}</dd>
        <dt>Average</dt>
        <dd>
          {latency ? `${latency.average.toFixed(1)} ms over ${String(latency.samples)} keys` : '—'}
        </dd>
        <dt>Last debounced change</dt>
        <dd>{debouncedAt ?? 'none yet'}</dd>
      </dl>

      <div className="button-row">
        <button type="button" className="button" onClick={measure}>
          Measure serialization
        </button>
      </div>

      {timings ? (
        <table className="data-table" data-testid="large-timings">
          <thead>
            <tr>
              <th>Operation</th>
              <th>Time</th>
              <th>What it does</th>
            </tr>
          </thead>
          <tbody>
            {timings.map((timing) => (
              <tr key={timing.label}>
                <td>
                  <code>{timing.label}</code>
                </td>
                <td>{timing.ms.toFixed(1)} ms</td>
                <td>{timing.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

      <p className="callout">
        This is why <code>ChangeMeta.document</code> is a getter. A handler that reads only{' '}
        <code>meta.length</code> never pays for the document; one that reads{' '}
        <code>meta.document</code> pays the row above, on every keystroke, unless it is debounced.
      </p>
    </div>
  );
}
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](https://react-rtekit.vercel.app/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](https://react-rtekit.vercel.app/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

The budgets are measured on a quiet machine in CI. They are a regression signal, not a promise about a given device.

## API

- [RichTextEditorProps](https://react-rtekit.vercel.app/react-rtekit/api/rich-text-editor/)
- [useEditorState](https://react-rtekit.vercel.app/react-rtekit/api/editor-hooks/)

---

# Forms

> Validation, dirty state and submission, with an adapter for React Hook Form and a worked Formik example.

Features · https://react-rtekit.vercel.app/react-rtekit/forms/

## Basics

*Example: Validation with react-hook-form* — the source of the live demo on this page.

```tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { RteField } from 'react-rtekit-rhf';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * react-hook-form validation (fixes R2 and R12).
 *
 * The bug this page exists for: an empty editor serializes to `<p><br></p>`, which is
 * a truthy string, so `required` passed and an empty e-mail went out. `RteField`
 * validates against `isEmpty()` instead. The "reproduce the old bug" toggle switches
 * back to string truthiness so you can see the difference.
 */

interface EmailForm {
  message: string;
}

/** What an empty editor produces. Submitting this is the regression. */
const EMPTY_MARKUP = '<p><br></p>';

export default function ValidationRhfExample() {
  const [emptyCheck, setEmptyCheck] = useState<'text' | 'string'>('text');
  const [submitted, setSubmitted] = useState<EmailForm | null>(null);

  const { control, handleSubmit, reset, formState } = useForm<EmailForm>({
    defaultValues: { message: EMPTY_MARKUP },
    mode: 'onBlur',
  });

  return (
    <div className="stack">
      <label className="field-inline">
        <input
          type="checkbox"
          checked={emptyCheck === 'string'}
          onChange={(event) => {
            setEmptyCheck(event.target.checked ? 'string' : 'text');
            setSubmitted(null);
          }}
        />
        Reproduce the old bug (<code>emptyCheck=&quot;string&quot;</code>)
      </label>

      <form
        onSubmit={(event) => {
          void handleSubmit((values) => {
            setSubmitted(values);
          })(event);
        }}
      >
        <RteField
          // Remounting on the toggle keeps the two modes honestly separate.
          key={emptyCheck}
          control={control}
          name="message"
          preset="classic"
          label="Message"
          emptyCheck={emptyCheck}
          maxLength={2048}
          showCounter
          placeholder="Try submitting this while it is empty…"
          rules={{
            required: 'A message is required',
            validate: (value: string) =>
              value.includes('lorem ipsum') ? 'Placeholder text is not allowed' : true,
          }}
        />

        <div className="button-row">
          <button type="submit" className="button button--solid">
            Send
          </button>
          <button
            type="button"
            className="button"
            onClick={() => {
              // A form reset reaches the editor, which the old field could not do (R1).
              reset({ message: EMPTY_MARKUP });
              setSubmitted(null);
            }}
          >
            Reset
          </button>
          <span className="parity__status" data-testid="rhf-status">
            {formState.isSubmitted && !formState.isValid
              ? 'Blocked by validation'
              : submitted
                ? 'Submitted — see the payload below'
                : 'Not submitted yet'}
          </span>
        </div>
      </form>

      {submitted ? (
        <>
          <h2>Submitted payload</h2>
          <CodeBlock label="Rhf payload" testId="rhf-payload">
            {JSON.stringify(submitted, null, 2)}
          </CodeBlock>
          {submitted.message === EMPTY_MARKUP ? (
            <p className="callout callout--danger">
              This is the bug: <code>{EMPTY_MARKUP}</code> is a truthy string, so react-hook-form’s
              own <code>required</code> accepted it and an empty e-mail would go out. Untick the
              toggle to validate against <code>isEmpty()</code> instead.
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](https://react-rtekit.vercel.app/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](https://react-rtekit.vercel.app/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

`required` uses `isEmpty()`, which ignores `<p><br></p>`. A form library checking the raw HTML string instead will think an empty editor has content.

## API

- [RichTextEditorProps](https://react-rtekit.vercel.app/react-rtekit/api/rich-text-editor/)
- [useValidationError](https://react-rtekit.vercel.app/react-rtekit/api/editor-hooks/)
- [useIsEmpty](https://react-rtekit.vercel.app/react-rtekit/api/editor-hooks/)

---

# All demos

> Complete editors for real situations — a comment box, an e-mail composer, a CMS body field — rather than one feature at a time.

Demos · https://react-rtekit.vercel.app/react-rtekit/demos/

Each of these is a complete editor for a situation, rather than one capability at a time. They are the fastest way to see how the pieces fit together — and the playground carries its whole configuration in the URL, so a link is a bug report.

- [Playground](https://react-rtekit.vercel.app/react-rtekit/demos/playground/) — every prop, live.
- [Theme editor](https://react-rtekit.vercel.app/react-rtekit/demos/theme-editor/) — every token, live.
- [Comment box](https://react-rtekit.vercel.app/react-rtekit/demos/comment-box/) — the small case.
- [E-mail composer](https://react-rtekit.vercel.app/react-rtekit/demos/email-composer/) — merge tags and e-mail-safe output.
- [CMS body field](https://react-rtekit.vercel.app/react-rtekit/demos/cms-body-field/) — the large case.
- [Legacy parity](https://react-rtekit.vercel.app/react-rtekit/demos/legacy-parity/) — the editor this replaces, and the bugs that are fixed.
- [Large document](https://react-rtekit.vercel.app/react-rtekit/demos/large-document/) — what performance looks like.

---

# Playground

> Every prop, live: change the configuration and read the code that produces it.

Demos · https://react-rtekit.vercel.app/react-rtekit/demos/playground/

## Basics

Every option, live. The configuration lives in the URL, so a link carries the whole setup — which makes it the fastest way to report a bug.

*Example: Presets* — the same source as under "Theme presets".

The full playground — every prop, grouped, with the code it produces — is below.

## Customization

The playground is built from the same public props you would use. Its generated Code tab is what you would paste into your own application.

## Limitations

It configures one editor with the shipped slots. Anything that needs your own components — a design-system skin, a custom slot — is shown in [Customization](https://react-rtekit.vercel.app/react-rtekit/customization/) instead, because a playground cannot import code that does not exist yet.

## API

- [RichTextEditorProps](https://react-rtekit.vercel.app/react-rtekit/api/rich-text-editor/)
- [Presets](https://react-rtekit.vercel.app/react-rtekit/api/plugin-api/)

---

# Theme editor

> Edit the theme tokens against a running editor and copy the result out as a theme object.

Demos · https://react-rtekit.vercel.app/react-rtekit/demos/theme-editor/

## Basics

Edit the tokens against a running editor and copy the result out as a theme object.

*Example: Theming* — the same source as under "Theming".

The full token editor, with all 114 tokens grouped, is below.

## Customization

A theme is a plain object. `createTheme` merges yours onto a base, so you override what you care about and inherit the rest.

## Limitations

Every shipped theme meets WCAG AA and a test enforces it. A theme you build here does not inherit that guarantee — `meetsContrastAA` is exported so you can check your own before shipping it.

## API

- [createTheme](https://react-rtekit.vercel.app/react-rtekit/api/theme-api/)
- [Theme tokens](https://react-rtekit.vercel.app/react-rtekit/api/theme-tokens/)

---

# Comment box

> A small editor for short replies: a few marks, a link, a character limit and nothing else.

Demos · https://react-rtekit.vercel.app/react-rtekit/demos/comment-box/

## Basics

The small case: a few marks, a link, a character limit, and nothing else. This is the `comment` preset, which exists because most editors on most pages are this.

*Example: Counter and limits* — the same source as under "Empty state".

## Customization

Start from the preset and add what you need rather than starting from `full` and removing things — the preset decides which plugins load, and a plugin that never loads costs nothing.

## Limitations

The `comment` preset has no images, tables or block types beyond paragraphs. That is the point; if you need them, `standard` is the next step up.

## API

- [Presets](https://react-rtekit.vercel.app/react-rtekit/api/plugin-api/)
- [RichTextEditorProps](https://react-rtekit.vercel.app/react-rtekit/api/rich-text-editor/)

---

# E-mail composer

> Merge tags, an e-mail output profile and inline styles, producing HTML that survives an e-mail client.

Demos · https://react-rtekit.vercel.app/react-rtekit/demos/email-composer/

## Basics

Merge tags, an e-mail output profile, and inline styles — the HTML this produces is the HTML that sends.

*Example: E-mail output* — the same source as under "E-mail output".

## Customization

The merge-tag syntax, the palette and the output profile are all props. The chips are a slot, so they can carry your own styling.

## Limitations

The e-mail profile makes HTML that e-mail clients can render. It does not test it against them: a complicated layout still needs a real preview service.

## API

- [documentToHtml](https://react-rtekit.vercel.app/react-rtekit/api/serialization/)
- [Sanitizer](https://react-rtekit.vercel.app/react-rtekit/api/sanitize/)

---

# CMS body field

> A full-height body field with headings, images, tables and autosave, as a CMS would use it.

Demos · https://react-rtekit.vercel.app/react-rtekit/demos/cms-body-field/

## Basics

The large case: headings, images, tables, autosave and a full-height field, with several editors on one page behaving independently.

*Example: Multiple editors on one page* — the source of the live demo on this page.

```tsx
import { useState } from 'react';
import { RichTextEditor, type ChangeMeta, type EditorValue } from 'react-rtekit';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * Three editors on one page (regression demo for R4 and R10).
 *
 * The old component gave its toolbar a hard-coded `id="toolbar"`, so two editors on
 * one page produced duplicate ids and ambiguous label targets. Here every id comes
 * from `useId`, and each editor keeps its own toolbar state, colour recents, history
 * and focus ring. Focusing one shifts nothing in the others — or in itself (R10).
 */

/** The three fields, each with its own preset, so the isolation is visible. */
const FIELDS = [
  {
    id: 'subject',
    label: 'Subject line',
    preset: 'minimal' as const,
    value: '<p>Your April report</p>',
  },
  {
    id: 'body',
    label: 'Message body',
    preset: 'classic' as const,
    value: '<p>Hi Dana,</p><p>Your results are ready.</p>',
  },
  {
    id: 'footer',
    label: 'Footer',
    preset: 'comment' as const,
    value: '<p>Northwind Ltd · Tampa FL</p>',
  },
];

export default function MultipleEditorsExample() {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(FIELDS.map((field) => [field.id, field.value])),
  );
  const [lastChanged, setLastChanged] = useState<string>('none');

  return (
    <div className="stack">
      <p className="page__lead">
        Format text in one editor and watch the other two: their toolbars stay inactive, their
        colour recents stay separate, and undo only undoes the editor you are in.
      </p>

      <div className="editor-grid">
        {FIELDS.map((field) => (
          <section key={field.id} className="editor-grid__cell">
            <RichTextEditor
              preset={field.preset}
              label={field.label}
              value={values[field.id]}
              minHeight={140}
              placeholder={`Edit the ${field.label.toLowerCase()}…`}
              onChange={(next: EditorValue, meta: ChangeMeta) => {
                setValues((previous) => ({ ...previous, [field.id]: next as string }));
                setLastChanged(`${field.label} (${meta.source})`);
              }}
            />
          </section>
        ))}
      </div>

      <p data-testid="multiple-last-changed">
        Last changed: <strong>{lastChanged}</strong>
      </p>

      <h2>Values</h2>
      <CodeBlock label="Multiple values" testId="multiple-values">
        {JSON.stringify(values, null, 2)}
      </CodeBlock>
    </div>
  );
}
```

## Customization

Each editor gets its own id namespace, its own history and its own draft key, so nothing is shared between them by accident.

## Limitations

Every editor on a page carries its own engine instance. Ten on one screen is fine; a hundred is a virtualisation problem, not a configuration one.

## API

- [EditorInstance](https://react-rtekit.vercel.app/react-rtekit/api/editor-instance/)
- [RichTextEditorProps](https://react-rtekit.vercel.app/react-rtekit/api/rich-text-editor/)

---

# Legacy parity

> The legacy editor this package replaces, side by side with the replacement, and the 26 bugs that are fixed.

Demos · https://react-rtekit.vercel.app/react-rtekit/demos/legacy-parity/

## Basics

The legacy editor this package was written to replace, reproduced exactly — the same eight toolbar buttons, the same 287px box, the same 1px border — and then the 26 bugs it had, each one fixed.

*Example: Parity: a legacy “send report” form* — the source of the live demo on this page.

```tsx
import { useMemo, useState } from 'react';
import {
  RichTextEditor,
  documentToHtml,
  htmlToDocument,
  isEmptyHtml,
  type ChangeMeta,
  type EditorValue,
} from 'react-rtekit';
import { DEFAULT_EMAIL_BODY } from '../../fixtures';
import { FIXED_BUGS } from './fixed-bugs';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * A legacy "send report" form, reproduced 1:1.
 *
 * Same eight buttons in the same order, same 287px box, same 21 swatches, same
 * default merge-tag body. Everything that differs is a listed defect that is fixed
 * here rather than reproduced — the "show differences" toggle lists them all.
 */

/** The five merge tags the backend substitutes; they must survive editing. */
const MERGE_TAGS = [
  { key: 'first_name', label: 'First name', sample: 'Dana' },
  { key: 'due_date', label: 'Due date', sample: '14 October 2026' },
  { key: 'report_date', label: 'Report date', sample: '16 September 2026' },
  { key: 'company_name', label: 'Company name', sample: 'Northwind Ltd' },
  { key: 'company_address', label: 'Company address', sample: '14 Canal Street, Bristol' },
];

/** The original limit, now counted in text characters rather than markup (fixes R3). */
const MESSAGE_MAX_LENGTH = 2048;

export default function LegacyParityExample() {
  const [message, setMessage] = useState<string>(DEFAULT_EMAIL_BODY);
  const [meta, setMeta] = useState<ChangeMeta | null>(null);
  const [to, setTo] = useState<string[]>(['dana@example.com']);
  const [cc, setCc] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [showDifferences, setShowDifferences] = useState(false);
  const [showOutput, setShowOutput] = useState(true);

  // The same document, serialized for storage and for an e-mail client.
  const outputs = useMemo(() => {
    const doc = htmlToDocument(message, {
      mergeTags: { knownKeys: MERGE_TAGS.map((tag) => tag.key) },
    });
    return {
      classic: documentToHtml(doc, { profile: 'quill-compatible' }),
      email: documentToHtml(doc, {
        profile: 'email',
        email: { fontFallback: 'Arial, Helvetica, sans-serif' },
        mergeTagPreview: Object.fromEntries(MERGE_TAGS.map((tag) => [tag.key, tag.sample])),
      }),
    };
  }, [message]);

  const empty = isEmptyHtml(message);

  return (
    <div className="parity">
      <form
        className="parity__form"
        onSubmit={(event) => {
          event.preventDefault();
          // The old form sent this even when the body was `<p><br></p>` (R2).
          if (empty) return;
          setSubmitted(new Date().toLocaleTimeString());
        }}
      >
        <h2 className="parity__title">Send report e-mail</h2>

        <ChipInput label="To" values={to} onChange={setTo} placeholder="name@example.com" />
        <ChipInput label="CC" values={cc} onChange={setCc} placeholder="Add a CC recipient" />

        <RichTextEditor
          preset="classic"
          label="Message"
          value={message}
          onChange={(value: EditorValue, changeMeta: ChangeMeta) => {
            setMessage(value as string);
            setMeta(changeMeta);
          }}
          required
          maxLength={MESSAGE_MAX_LENGTH}
          maxLengthBehaviour="warn"
          showCounter
          placeholder="Write the message that goes out with the report…"
          mergeTags={{ tags: MERGE_TAGS, unknownTagBehaviour: 'warn' }}
          helperText="Merge tags are replaced by the backend when the e-mail is sent."
        />

        <div className="parity__actions">
          <button type="submit" className="button button--solid" disabled={empty}>
            Send
          </button>
          <span className="parity__status" data-testid="parity-status">
            {submitted
              ? `Sent at ${submitted} to ${[...to, ...cc].join(', ')}`
              : empty
                ? 'The message is empty — Send is disabled (R2)'
                : `${meta?.length ?? 0} characters of text`}
          </span>
        </div>
      </form>

      <section className="parity__panel">
        <div className="parity__panel-head">
          <h2>Output HTML</h2>
          <button
            type="button"
            className="button"
            aria-expanded={showOutput}
            onClick={() => {
              setShowOutput((previous) => !previous);
            }}
          >
            {showOutput ? 'Hide' : 'Show'}
          </button>
        </div>
        {showOutput ? (
          <div className="parity__outputs">
            <figure>
              <figcaption>
                <code>quill-compatible</code> — what the old API stored
              </figcaption>
              <CodeBlock label="Parity output classic" testId="parity-output-classic">
                {outputs.classic}
              </CodeBlock>
            </figure>
            <figure>
              <figcaption>
                <code>email</code> — inline styles, merge tags previewed
              </figcaption>
              <CodeBlock label="Parity output email" testId="parity-output-email">
                {outputs.email}
              </CodeBlock>
            </figure>
          </div>
        ) : null}
      </section>

      <section className="parity__panel">
        <div className="parity__panel-head">
          <h2>Differences from the original</h2>
          <button
            type="button"
            className="button"
            aria-expanded={showDifferences}
            aria-controls="parity-differences"
            onClick={() => {
              setShowDifferences((previous) => !previous);
            }}
          >
            {showDifferences ? 'Hide differences' : 'Show differences'}
          </button>
        </div>
        <p className="parity__note">
          The visuals are identical to the original. Everything listed here is a bug from the old
          implementation that this page fixes rather than reproduces.
        </p>
        {showDifferences ? (
          <ol id="parity-differences" className="parity__bugs" data-testid="parity-differences">
            {FIXED_BUGS.map((bug) => (
              <li key={bug.id}>
                <strong>{bug.id}</strong> <span className="parity__bug-was">{bug.was}</span>
                <span className="parity__bug-now">{bug.now}</span>
              </li>
            ))}
          </ol>
        ) : null}
      </section>
    </div>
  );
}

/** Props for {@link ChipInput}. */
interface ChipInputProps {
  label: string;
  values: string[];
  placeholder: string;
  onChange: (values: string[]) => void;
}

/** The recipient chips the original form rendered around the editor. */
function ChipInput({ label, values, placeholder, onChange }: ChipInputProps) {
  const [draft, setDraft] = useState('');

  const commit = (): void => {
    const value = draft.trim().replace(/,$/, '');
    if (!value) return;
    onChange([...values, value]);
    setDraft('');
  };

  return (
    <div className="parity__field">
      <span className="parity__label" id={`chips-${label}`}>
        {label}
      </span>
      <div className="parity__chips">
        {values.map((value) => (
          <span key={value} className="parity__chip">
            {value}
            <button
              type="button"
              aria-label={`Remove ${value}`}
              onClick={() => {
                onChange(values.filter((entry) => entry !== value));
              }}
            >
              ×
            </button>
          </span>
        ))}
        <input
          className="parity__chip-input"
          aria-labelledby={`chips-${label}`}
          placeholder={placeholder}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
          }}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault();
              commit();
            }
          }}
        />
      </div>
    </div>
  );
}
```

## Customization

The `classic` preset and theme exist so a migration can be done in two steps: first look identical, then change what you want. Nothing about the parity is hard-coded — it is tokens and a toolbar list.

## Limitations

Parity is visual and behavioural, not internal. Code that reached into the old editor's DOM or its instance will not find the same things here.

## API

- [classicTheme](https://react-rtekit.vercel.app/react-rtekit/api/theme-api/)
- [Presets](https://react-rtekit.vercel.app/react-rtekit/api/plugin-api/)

---

# Large document

> A document large enough to make performance visible, with the numbers the budget is measured against.

Demos · https://react-rtekit.vercel.app/react-rtekit/demos/large-document/

## Basics

A document long enough to make performance visible, with the measurements the build's budgets are checked against.

*Example: Large document* — the same source as under "Performance".

## Customization

The props worth memoising, and the ones that cause a remount, are listed in the [performance guide](https://react-rtekit.vercel.app/react-rtekit/guides/performance/).

## Limitations

The budgets are measured on a quiet CI machine with a dedicated Playwright config. They are a regression signal, not a promise about a particular device.

## API

- [useEditor](https://react-rtekit.vercel.app/react-rtekit/api/use-editor/)
- [useEditorState](https://react-rtekit.vercel.app/react-rtekit/api/editor-hooks/)

---

# API reference

> Every public symbol, generated from the TypeScript declarations — components, hooks, the imperative API, the functions and the catalogues.

Reference · https://react-rtekit.vercel.app/react-rtekit/api/

Every public symbol, generated from the TypeScript declarations by TypeDoc and from the package's own runtime metadata. Nothing on these pages is hand-written: the structure comes from `{symbol}.schema.json` and the prose from `{symbol}.strings.json`, and a hand-edit to either fails the build's checksum.

**Components** — [RichTextEditor](https://react-rtekit.vercel.app/react-rtekit/api/rich-text-editor/) · [RteContentView](https://react-rtekit.vercel.app/react-rtekit/api/rte-content-view/) · [Composable parts](https://react-rtekit.vercel.app/react-rtekit/api/composable-parts/) · [Providers](https://react-rtekit.vercel.app/react-rtekit/api/providers/)

**Hooks** — [useEditor](https://react-rtekit.vercel.app/react-rtekit/api/use-editor/) · [Editor hooks](https://react-rtekit.vercel.app/react-rtekit/api/editor-hooks/)

**Imperative API** — [EditorInstance](https://react-rtekit.vercel.app/react-rtekit/api/editor-instance/) · [Commands](https://react-rtekit.vercel.app/react-rtekit/api/commands/) · [Handlers](https://react-rtekit.vercel.app/react-rtekit/api/handlers/)

**Functions** — [Serialization](https://react-rtekit.vercel.app/react-rtekit/api/serialization/) · [Sanitizer](https://react-rtekit.vercel.app/react-rtekit/api/sanitize/) · [Plugin API](https://react-rtekit.vercel.app/react-rtekit/api/plugin-api/) · [Theme API](https://react-rtekit.vercel.app/react-rtekit/api/theme-api/)

**Catalogues** — [Slots](https://react-rtekit.vercel.app/react-rtekit/api/slots/) · [Toolbar items](https://react-rtekit.vercel.app/react-rtekit/api/toolbar-items/) · [Theme tokens](https://react-rtekit.vercel.app/react-rtekit/api/theme-tokens/) · [Icons](https://react-rtekit.vercel.app/react-rtekit/api/icons/) · [Localization keys](https://react-rtekit.vercel.app/react-rtekit/api/localization-keys/) · [Plugins](https://react-rtekit.vercel.app/react-rtekit/api/plugins/)

**Types** — [Types](https://react-rtekit.vercel.app/react-rtekit/api/types/)

---

# RichTextEditor

> The all-in-one component and every prop it takes.

Reference · https://react-rtekit.vercel.app/react-rtekit/api/rich-text-editor/

## Used by

- [Composable parts](https://react-rtekit.vercel.app/react-rtekit/composable-parts/)
- [Headings](https://react-rtekit.vercel.app/react-rtekit/headings/)
- [HTML interop](https://react-rtekit.vercel.app/react-rtekit/html-interop/)
- [Paste clean-up](https://react-rtekit.vercel.app/react-rtekit/paste-cleanup/)
- [Merge tags](https://react-rtekit.vercel.app/react-rtekit/merge-tags/)
- [Markdown shortcuts](https://react-rtekit.vercel.app/react-rtekit/markdown-shortcuts/)
- [Counters & limits](https://react-rtekit.vercel.app/react-rtekit/counters-and-limits/)
- [Colours](https://react-rtekit.vercel.app/react-rtekit/colours/)
- [Fonts](https://react-rtekit.vercel.app/react-rtekit/fonts/)
- [Selection toolbar](https://react-rtekit.vercel.app/react-rtekit/selection-toolbar/)
- [Slash menu](https://react-rtekit.vercel.app/react-rtekit/slash-menu/)
- [Emoji](https://react-rtekit.vercel.app/react-rtekit/emoji/)
- [Mentions](https://react-rtekit.vercel.app/react-rtekit/mentions/)
- [Fullscreen](https://react-rtekit.vercel.app/react-rtekit/fullscreen/)
- [Keyboard shortcuts](https://react-rtekit.vercel.app/react-rtekit/keyboard-shortcuts/)
- [Autosave & drafts](https://react-rtekit.vercel.app/react-rtekit/autosave/)
- [Read-only & disabled](https://react-rtekit.vercel.app/react-rtekit/read-only-and-disabled/)
- [Mobile](https://react-rtekit.vercel.app/react-rtekit/mobile/)
- [Engine adapter](https://react-rtekit.vercel.app/react-rtekit/engine-adapter/)
- [Accessibility](https://react-rtekit.vercel.app/react-rtekit/accessibility/)
- [Server rendering](https://react-rtekit.vercel.app/react-rtekit/server-rendering/)
- [Performance](https://react-rtekit.vercel.app/react-rtekit/performance/)
- [Forms](https://react-rtekit.vercel.app/react-rtekit/forms/)

## Import

```ts
import { RichTextEditor } from 'react-rtekit';
import { RichTextEditorProps } from 'react-rtekit';
```

## Options

### RichTextEditor

A complete rich-text field: toolbar, content, label, helper text, error and counter.

This symbol takes no options.

### RichTextEditorProps

The full prop surface of `<RichTextEditor>`.

| Name | Type | Required | Description |
|---|---|---|---|
| `enableBold` | `boolean` | no | Bold, with its `Mod+B` binding. |
| `enableItalic` | `boolean` | no | Italic, with its `Mod+I` binding. |
| `enableUnderline` | `boolean` | no | Underline, with its `Mod+U` binding. |
| `enableStrike` | `boolean` | no | Strikethrough. |
| `enableCode` | `boolean` | no | Inline code, as a mark rather than a block. |
| `enableSubSup` | `boolean` | no | Subscript and superscript, which are mutually exclusive. |
| `enableColor` | `boolean` | no | Text colour, with the palette from `colors`. |
| `enableBackgroundColor` | `boolean` | no | Background colour, with the same palette. |
| `enableFontFamily` | `boolean` | no | The font-family dropdown, populated from `fontFamilies`. |
| `enableFontSize` | `boolean` | no | The font-size dropdown, populated from `fontSizes`. |
| `enableHeadings` | `boolean` | no | Headings at the levels given by `headingLevels`. |
| `enableAlign` | `boolean` | no | Block alignment, with `left` as the canonical default (fixes R6). |
| `enableIndent` | `boolean` | no | Block indent and outdent. |
| `enableLists` | `boolean` | no | Bulleted and numbered lists, with nesting. |
| `enableCheckList` | `boolean` | no | Checklists, which need `enableLists` as well. |
| `enableBlockquote` | `boolean` | no | Blockquotes. |
| `enableCodeBlock` | `boolean` | no | Fenced code blocks with syntax highlighting. |
| `enableLinks` | `boolean` | no | Links, the link popover and URL validation. |
| `enableImages` | `boolean` | no | Images, including upload, drag-and-drop and paste. |
| `enableTables` | `boolean` | no | Tables and their editing controls. |
| `enableHorizontalRule` | `boolean` | no | Horizontal rules. |
| `enableEmoji` | `boolean` | no | The emoji picker and its `:` trigger. |
| `enableMentions` | `boolean` | no | Mentions and their `@` trigger, configured through `mentions`. |
| `enableMergeTags` | `boolean` | no | Merge tags as atomic nodes, configured through `mergeTags` (fixes R23). |
| `enableHistory` | `boolean` | no | Undo and redo, with their bindings and toolbar controls. |
| `enableMarkdownShortcuts` | `boolean` | no | Markdown input rules, such as `# ` for a heading. |
| `enableFindReplace` | `boolean` | no | The find-and-replace panel. |
| `enableSourceView` | `boolean` | no | The HTML source view, which sanitizes on apply. |
| `enableFullscreen` | `boolean` | no | The fullscreen toggle. |
| `enableClearFormatting` | `boolean` | no | The "clear formatting" command. |
| `enableWordCount` | `boolean` | no | Word counting, which `countUnit: 'words'` needs. |
| `value` | `EditorValue` | no | Controlled value, in `valueFormat`. |
| `defaultValue` | `EditorValue` | no | Uncontrolled initial value. |
| `valueFormat` | `ValueFormat` | no | What `value`, `defaultValue` and `onChange` speak. |
| `onChange` | `function` | no | Every content change, with the source that caused it (fixes R21). |
| `onChangeDebounced` | `function` | no | Same payload as `onChange`, debounced by `changeDebounceMs`. |
| `changeDebounceMs` | `number` | no | How long the typing has to stop before `onChangeDebounced` runs. |
| `onBlur` | `function` | no | Focus left the editor for something outside it (fixes R9). |
| `onFocus` | `function` | no | Focus entered the editor. |
| `onSelectionChange` | `function` | no | The selection moved, or collapsed to nothing (fixes R8). |
| `onReady` | `function` | no | Fired once, when the engine has mounted. |
| `onContentWarning` | `function` | no | Content that was dropped or downgraded on input. A development aid. |
| `onError` | `function` | no | Anything the engine, a plugin or a serializer threw. |
| `disabled` | `boolean` | no | Not focusable, dimmed, `aria-disabled`. What forms should use. |
| `readOnly` | `boolean` | no | Selection and copy still work; editing does not. |
| `autoFocus` | `boolean \| "start" \| "end"` | no | Take focus on mount, optionally placing the caret. |
| `placeholder` | `ReactNode` | no | Shown over an empty document (fixes R24). |
| `spellCheck` | `boolean` | no | Browser spell-checking inside the content element. |
| `dir` | `"ltr" \| "rtl" \| "auto"` | no | Writing direction; `rtl` mirrors the whole field, including the toolbar. |
| `lang` | `string` | no | The content language, for spell-checking and screen-reader pronunciation. |
| `tabIndex` | `number` | no | Tab order of the content element. |
| `editorRef` | `Ref<EditorInstance>` | no | Receives the EditorInstance once the engine has mounted. |
| `engine` | `EditorEngine` | no | Swap the document engine. |
| `preset` | `PresetName` | no | The plugin bundle and the props it implies. |
| `plugins` | `RtePlugin<unknown>[]` | no | Replaces the preset's plugin list entirely. |
| `addPlugins` | `RtePlugin<unknown>[]` | no | Plugins added on top of the preset's list. |
| `removePlugins` | `string[]` | no | Names of plugins the preset included that this editor does not want. |
| `pluginOptions` | `Record<string, unknown>` | no | Per-plugin options, keyed by plugin name. |
| `headingLevels` | `HeadingLevel[]` | no | Which heading levels the dropdown and the schema allow. |
| `fontFamilies` | `object[]` | no | The font-family dropdown's options. |
| `fontSizes` | `object[]` | no | The font-size dropdown's options. |
| `colors` | `ColorPaletteConfig` | no | Swatches, columns and the custom-colour option. |
| `mergeTags` | `MergeTagsConfig` | no | The merge tags this editor knows, and how they are triggered. |
| `mentions` | `MentionsConfig` | no | The mention provider, trigger and rendering. |
| `slashMenu` | `boolean \| SlashMenuConfig` | no | The `/` command palette. |
| `markdownShortcuts` | `boolean \| MarkdownShortcutConfig[]` | no | Markdown input rules, or an explicit list of them. |
| `maxLength` | `number` | no | Counts text in `countUnit`, never markup (fixes R3). |
| `countUnit` | `CountUnit` | no | What `maxLength` and the counter measure. |
| `maxLengthBehaviour` | `"warn" \| "block"` | no | Whether the limit refuses further input or only warns. |
| `showCounter` | `boolean \| "always" \| "nearLimit"` | no | When to show the counter. |
| `required` | `boolean` | no | Drives `aria-required` and the `isEmpty` check (fixes R2). |
| `error` | `string \| boolean` | no | `true` sets the error state; a string also renders as the message. |
| `helperText` | `ReactNode` | no | Description below the field, linked with `aria-describedby` (fixes R16). |
| `label` | `ReactNode` | no | Renders a `<label>` bound to the content element. |
| `hideLabel` | `boolean` | no | Visually hidden but still announced. |
| `validate` | `function` | no | Returns a message for invalid content, or `null` when it is acceptable. |
| `sanitize` | `SanitizeOption` | no | The input sanitization profile, or an explicit config. |
| `sanitizeOutput` | `boolean` | no | Sanitize again on the way out, so a bug upstream cannot leak. |
| `htmlProfile` | `HtmlProfile` | no | The HTML dialect `getHTML` produces. |
| `emailOptions` | `EmailOutputOptions` | no | Inlining, width and table-layout choices for the `email` profile. |
| `interop` | `InteropOptions` | no | How legacy markup, such as Quill's, is read and written back. |
| `pasteMode` | `PasteMode \| function` | no | Rich, plain or cleaned paste, statically or per paste. |
| `pastePrompt` | `boolean` | no | Offer "Keep / Remove formatting" after a rich office paste. |
| `autoLinkOnPaste` | `boolean` | no | Turn pasted URLs into links. |
| `autoLink` | `boolean` | no | Turn typed URLs and e-mail addresses into links. |
| `autoLinkProtocols` | `string[]` | no | Protocols a typed URL may be linked with. |
| `defaultProtocol` | `string` | no | Protocol given to a bare host, in the popover and in autolinking. |
| `linkValidator` | `function` | no | Rejects or rewrites a URL before it becomes a link. Return a message to reject, or `null` to accept. Sanitization runs regardless: a validator can tighten the rules but never loosens them. |
| `allowDataUrlImages` | `boolean` | no | Allow `data:` image sources, which bloat stored content. |
| `autosave` | `AutosaveConfig` | no | Draft saving, its key, its TTL and its restore prompt. |
| `toolbar` | `false \| ToolbarConfig` | no | `false` hides the toolbar entirely. |
| `toolbarPosition` | `"bottom" \| "top" \| "none"` | no | Which side of the content the toolbar sits on. |
| `stickyToolbar` | `boolean \| object` | no | Keep the toolbar visible while a long document scrolls. |
| `toolbarOverflow` | `"menu" \| "wrap" \| "scroll"` | no | What happens to items that do not fit at this width. |
| `floatingToolbar` | `boolean \| FloatingToolbarConfig` | no | A toolbar that follows the selection. |
| `bubbleMenuItems` | `ToolbarItemSpec[]` | no | What the bubble menu offers, when it differs from the floating toolbar. |
| `minHeight` | `string \| number` | no | Height of the content box before it grows. |
| `maxHeight` | `string \| number` | no | Height at which the content starts scrolling instead of growing. |
| `autoGrow` | `boolean` | no | Grow with the content rather than scrolling immediately. |
| `resizable` | `boolean \| "vertical"` | no | Offer a drag handle for resizing the content box (fixes R22). |
| `fullscreen` | `boolean` | no | Controlled fullscreen. |
| `defaultFullscreen` | `boolean` | no | Start in fullscreen, for an uncontrolled editor. |
| `footer` | `ReactNode \| function` | no | Extra footer content next to the counter. |
| `readOnlyToolbar` | `"hide" \| "disable"` | no | Hide or disable the toolbar in `readOnly` mode. |
| `renderToolbar` | `function` | no | Replaces the toolbar, with the resolved items and the default renderer to hand. |
| `renderFooter` | `function` | no | Replaces the footer row. |
| `renderPlaceholder` | `function` | no | Replaces the placeholder. |
| `renderLinkPopover` | `function` | no | Replaces the link popover. |
| `renderImagePopover` | `function` | no | Replaces the controls shown when an image is selected. |
| `renderSlashMenu` | `function` | no | Replaces the `/` command palette. |
| `renderMergeTagMenu` | `function` | no | Replaces the merge-tag menu. |
| `renderColorPicker` | `function` | no | Replaces the colour palette. |
| `renderSourceView` | `function` | no | Replaces the HTML source view. |
| `renderRestoreDraftPrompt` | `function` | no | Replaces the prompt offering to restore an autosaved draft. |
| `onUpload` | `UploadHandler` | no | Hands a file to your own service and returns the attributes to insert. |
| `uploadAccept` | `string` | no | Accepted file types, enforced before the upload starts. |
| `maxUploadSize` | `number` | no | Size ceiling, enforced before the file leaves the browser. |
| `onUploadError` | `function` | no | A rejected or failed upload, with the file it concerned. |
| `imageOptions` | `ImageOptions` | no | Resizing, alignment and caption behaviour for images. |
| `slots` | `Partial<RteSlots>` | no | Replacement components, by slot name. |
| `slotProps` | `RteSlotProps` | no | Extra props merged into each slot, statically or per render. |
| `classNames` | `RteClassNames` | no | Per-slot class names. |
| `styles` | `RteStyles` | no | Per-slot inline styles. |
| `handlers` | `Partial<RteHandlers>` | no | Interaction middleware; each wraps one interaction. |
| `commandOverrides` | `CommandOverrides` | no | Replacement command implementations, by command id. |
| `icons` | `RteIcons` | no | Replacement icons, by icon name. |
| `localization` | `object` | no | Message catalogue, merged over the default. |
| `theme` | `RteTheme \| object` | no | Theme tokens, merged over the preset's. |
| `colorScheme` | `ColorScheme` | no | Light, dark, or follow the operating system. |
| `contentClassName` | `string` | no | Applied to `.rte-content`, for prose overrides. |
| `unstyled` | `boolean` | no | Structure and prose styles only, no chrome visuals. |
| `className` | `string` | no | Applied to the root element. |
| `style` | `CSSProperties` | no | Applied to the root element. |
| `id` | `string` | no | Base for the generated element ids; one is derived when absent (fixes R4). |
| `keymap` | `Record<string, CommandId \| function>` | no | Extra or replacement bindings, keyed by shortcut string. |
| `disableShortcuts` | `string[]` | no | Bindings to drop, so the surrounding app can claim them. |
| `tabBehaviour` | `TabBehaviour` | no | What `Tab` does outside a list. |
| `submitOnEnter` | `boolean \| "mod"` | no | `'mod'` makes Ctrl/Cmd+Enter call `onSubmit`. |
| `onSubmit` | `function` | no | Called when a submit binding fires, with the current value. |
| `escapeExitsEditor` | `boolean` | no | Let Escape move focus out of the editor. |

## Source

- [RichTextEditor](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/react/RichTextEditor.tsx#L108)
- [RichTextEditorProps](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/types/props.ts#L118)

---

# RteContentView

> The read-only renderer for stored HTML, with the same content styles as the editor.

Reference · https://react-rtekit.vercel.app/react-rtekit/api/rte-content-view/

## Used by

- [Content view](https://react-rtekit.vercel.app/react-rtekit/content-view/)
- [Server rendering](https://react-rtekit.vercel.app/react-rtekit/server-rendering/)

## Import

```ts
import { RteContentView } from 'react-rtekit/view';
import { RteContentViewProps } from 'react-rtekit';
```

## Options

### RteContentView

Renders stored content read-only.

This symbol takes no options.

### RteContentViewProps

`<RteContentView>` props.

| Name | Type | Required | Description |
|---|---|---|---|
| `value` | `EditorValue` | yes | The stored content to render. |
| `valueFormat` | `ValueFormat` | no | What `value` is. |
| `sanitize` | `SanitizeOption` | no | The profile applied before rendering; never render unsanitized HTML. |
| `htmlProfile` | `HtmlProfile` | no | Output dialect used when re-serializing non-HTML input. |
| `theme` | `RteTheme \| object` | no | Theme tokens, so stored content matches the editor that produced it. |
| `colorScheme` | `ColorScheme` | no | Light, dark, or follow the operating system. |
| `className` | `string` | no | Applied to the container. |
| `style` | `CSSProperties` | no | Applied to the container. |
| `mergeTagPreview` | `Record<string, string>` | no | Render merge tags with these sample values instead of `{key}`. |
| `as` | `"div" \| "article" \| "section"` | no | Element rendered as the container. |
| `unstyled` | `boolean` | no | Prose styles only, no chrome visuals. |
| `id` | `string` | no | The container's element id. |

## Source

- [RteContentView](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/view/RteContentView.tsx#L33)
- [RteContentViewProps](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/types/props.ts#L381)

---

# Composable parts

> The eleven parts the all-in-one component is assembled from.

Reference · https://react-rtekit.vercel.app/react-rtekit/api/composable-parts/

## Used by

- [Composable parts](https://react-rtekit.vercel.app/react-rtekit/composable-parts/)
- [Empty state](https://react-rtekit.vercel.app/react-rtekit/empty-state/)
- [Toolbar](https://react-rtekit.vercel.app/react-rtekit/toolbar/)

## Import

```ts
import { Rte } from 'react-rtekit';
import { RteContent } from 'react-rtekit';
import { RteCounter } from 'react-rtekit';
import { RteErrorText } from 'react-rtekit';
import { RteFooter } from 'react-rtekit';
import { RteHelperText } from 'react-rtekit';
import { RteLabel } from 'react-rtekit';
import { RtePortals } from 'react-rtekit';
import { RteRoot } from 'react-rtekit';
import { RteToolbar } from 'react-rtekit';
```

## Options

### Rte

The composable parts, grouped for import as one namespace.

This symbol takes no options.

### RteContent

The editable surface.

The engine creates the contenteditable element itself and React never touches its
children, which is what keeps React's reconciler and the browser's editing engine out
of each other's way.

This symbol takes no options.

### RteCounter

The live character or word counter.

This symbol takes no options.

### RteErrorText

The validation message, linked to the content element with `aria-describedby`.

This symbol takes no options.

### RteFooter

The footer row: counter on the right, anything else on the left.

This symbol takes no options.

### RteHelperText

Helper text below the editor.

This symbol takes no options.

### RteLabel

The field label, bound to the content element.

`<label for>` names a form control, and the content element is a `div` with
`role="textbox"` — so the label also has to be attached with `aria-labelledby`, or
the editor has an accessible name in the markup and none in the accessibility tree.

This symbol takes no options.

### RtePortals

The popovers, menus and dialogs the features own.

A composed layout renders this once, anywhere inside `<Rte.Root>`. Without it the
link popover, the image dialog and the suggestion menus have nowhere to mount, and
the features look broken rather than absent.

This symbol takes no options.

### RteRoot

The editor root: context, state data attributes and the live region.

This symbol takes no options.

### RteToolbar

The toolbar, for a layout you are composing yourself.

This symbol takes no options.

## Source

- [Rte](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/react/parts.tsx#L433)
- [RteContent](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/react/parts.tsx#L287)
- [RteCounter](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/react/parts.tsx#L359)
- [RteErrorText](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/react/parts.tsx#L394)
- [RteFooter](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/react/parts.tsx#L420)
- [RteHelperText](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/react/parts.tsx#L408)
- [RteLabel](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/react/parts.tsx#L464)
- [RtePortals](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/react/parts.tsx#L587)
- [RteRoot](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/react/parts.tsx#L102)
- [RteToolbar](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/react/parts.tsx#L534)

---

# Providers

> Theme, locale and defaults providers, for configuring several editors at once.

Reference · https://react-rtekit.vercel.app/react-rtekit/api/providers/

## Used by

- [Presets](https://react-rtekit.vercel.app/react-rtekit/presets/)
- [Localization](https://react-rtekit.vercel.app/react-rtekit/localization/)
- [Theming](https://react-rtekit.vercel.app/react-rtekit/theming/)

## Import

```ts
import { RteDefaultsProvider } from 'react-rtekit';
import { RteLocaleProvider } from 'react-rtekit';
import { RteThemeProvider } from 'react-rtekit';
```

## Options

### RteDefaultsProvider

Sets app-wide prop defaults.

The one place a team configures sanitization, the HTML profile, merge tags and the
upload handler, so no individual field can get it wrong.

This symbol takes no options.

### RteLocaleProvider

Sets the message catalogue for every editor below.

This symbol takes no options.

### RteThemeProvider

Sets the theme for every editor below.

This symbol takes no options.

## Source

- [RteDefaultsProvider](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/react/providers.tsx#L102)
- [RteLocaleProvider](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/react/providers.tsx#L73)
- [RteThemeProvider](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/react/providers.tsx#L44)

---

# useEditor

> The headless hook, and every option it accepts.

Reference · https://react-rtekit.vercel.app/react-rtekit/api/use-editor/

## Used by

- [Headless](https://react-rtekit.vercel.app/react-rtekit/headless/)

## Import

```ts
import { UseEditorOptions } from 'react-rtekit';
import { useEditor } from 'react-rtekit';
```

## Options

### UseEditorOptions

Options accepted by the headless `useEditor` hook.

| Name | Type | Required | Description |
|---|---|---|---|
| `enableBold` | `boolean` | no | Bold, with its `Mod+B` binding. |
| `enableItalic` | `boolean` | no | Italic, with its `Mod+I` binding. |
| `enableUnderline` | `boolean` | no | Underline, with its `Mod+U` binding. |
| `enableStrike` | `boolean` | no | Strikethrough. |
| `enableCode` | `boolean` | no | Inline code, as a mark rather than a block. |
| `enableSubSup` | `boolean` | no | Subscript and superscript, which are mutually exclusive. |
| `enableColor` | `boolean` | no | Text colour, with the palette from `colors`. |
| `enableBackgroundColor` | `boolean` | no | Background colour, with the same palette. |
| `enableFontFamily` | `boolean` | no | The font-family dropdown, populated from `fontFamilies`. |
| `enableFontSize` | `boolean` | no | The font-size dropdown, populated from `fontSizes`. |
| `enableHeadings` | `boolean` | no | Headings at the levels given by `headingLevels`. |
| `enableAlign` | `boolean` | no | Block alignment, with `left` as the canonical default (fixes R6). |
| `enableIndent` | `boolean` | no | Block indent and outdent. |
| `enableLists` | `boolean` | no | Bulleted and numbered lists, with nesting. |
| `enableCheckList` | `boolean` | no | Checklists, which need `enableLists` as well. |
| `enableBlockquote` | `boolean` | no | Blockquotes. |
| `enableCodeBlock` | `boolean` | no | Fenced code blocks with syntax highlighting. |
| `enableLinks` | `boolean` | no | Links, the link popover and URL validation. |
| `enableImages` | `boolean` | no | Images, including upload, drag-and-drop and paste. |
| `enableTables` | `boolean` | no | Tables and their editing controls. |
| `enableHorizontalRule` | `boolean` | no | Horizontal rules. |
| `enableEmoji` | `boolean` | no | The emoji picker and its `:` trigger. |
| `enableMentions` | `boolean` | no | Mentions and their `@` trigger, configured through `mentions`. |
| `enableMergeTags` | `boolean` | no | Merge tags as atomic nodes, configured through `mergeTags` (fixes R23). |
| `enableHistory` | `boolean` | no | Undo and redo, with their bindings and toolbar controls. |
| `enableMarkdownShortcuts` | `boolean` | no | Markdown input rules, such as `# ` for a heading. |
| `enableFindReplace` | `boolean` | no | The find-and-replace panel. |
| `enableSourceView` | `boolean` | no | The HTML source view, which sanitizes on apply. |
| `enableFullscreen` | `boolean` | no | The fullscreen toggle. |
| `enableClearFormatting` | `boolean` | no | The "clear formatting" command. |
| `enableWordCount` | `boolean` | no | Word counting, which `countUnit: 'words'` needs. |
| `value` | `EditorValue` | no | Controlled value, in `valueFormat`. |
| `defaultValue` | `EditorValue` | no | Uncontrolled initial value. |
| `valueFormat` | `ValueFormat` | no | What `value`, `defaultValue` and `onChange` speak. |
| `onChange` | `function` | no | Every content change, with the source that caused it (fixes R21). |
| `onChangeDebounced` | `function` | no | Same payload as `onChange`, debounced by `changeDebounceMs`. |
| `changeDebounceMs` | `number` | no | How long the typing has to stop before `onChangeDebounced` runs. |
| `onBlur` | `function` | no | Focus left the editor for something outside it (fixes R9). |
| `onFocus` | `function` | no | Focus entered the editor. |
| `onSelectionChange` | `function` | no | The selection moved, or collapsed to nothing (fixes R8). |
| `onReady` | `function` | no | Fired once, when the engine has mounted. |
| `onContentWarning` | `function` | no | Content that was dropped or downgraded on input. A development aid. |
| `onError` | `function` | no | Anything the engine, a plugin or a serializer threw. |
| `disabled` | `boolean` | no | Not focusable, dimmed, `aria-disabled`. What forms should use. |
| `readOnly` | `boolean` | no | Selection and copy still work; editing does not. |
| `autoFocus` | `boolean \| "start" \| "end"` | no | Take focus on mount, optionally placing the caret. |
| `placeholder` | `ReactNode` | no | Shown over an empty document (fixes R24). |
| `spellCheck` | `boolean` | no | Browser spell-checking inside the content element. |
| `dir` | `"ltr" \| "rtl" \| "auto"` | no | Writing direction; `rtl` mirrors the whole field, including the toolbar. |
| `lang` | `string` | no | The content language, for spell-checking and screen-reader pronunciation. |
| `tabIndex` | `number` | no | Tab order of the content element. |
| `editorRef` | `Ref<EditorInstance>` | no | Receives the EditorInstance once the engine has mounted. |
| `engine` | `EditorEngine` | no | Swap the document engine. |
| `preset` | `PresetName` | no | The plugin bundle and the props it implies. |
| `plugins` | `RtePlugin<unknown>[]` | no | Replaces the preset's plugin list entirely. |
| `addPlugins` | `RtePlugin<unknown>[]` | no | Plugins added on top of the preset's list. |
| `removePlugins` | `string[]` | no | Names of plugins the preset included that this editor does not want. |
| `pluginOptions` | `Record<string, unknown>` | no | Per-plugin options, keyed by plugin name. |
| `headingLevels` | `HeadingLevel[]` | no | Which heading levels the dropdown and the schema allow. |
| `fontFamilies` | `object[]` | no | The font-family dropdown's options. |
| `fontSizes` | `object[]` | no | The font-size dropdown's options. |
| `colors` | `ColorPaletteConfig` | no | Swatches, columns and the custom-colour option. |
| `mergeTags` | `MergeTagsConfig` | no | The merge tags this editor knows, and how they are triggered. |
| `mentions` | `MentionsConfig` | no | The mention provider, trigger and rendering. |
| `slashMenu` | `boolean \| SlashMenuConfig` | no | The `/` command palette. |
| `markdownShortcuts` | `boolean \| MarkdownShortcutConfig[]` | no | Markdown input rules, or an explicit list of them. |
| `maxLength` | `number` | no | Counts text in `countUnit`, never markup (fixes R3). |
| `countUnit` | `CountUnit` | no | What `maxLength` and the counter measure. |
| `maxLengthBehaviour` | `"warn" \| "block"` | no | Whether the limit refuses further input or only warns. |
| `showCounter` | `boolean \| "always" \| "nearLimit"` | no | When to show the counter. |
| `required` | `boolean` | no | Drives `aria-required` and the `isEmpty` check (fixes R2). |
| `error` | `string \| boolean` | no | `true` sets the error state; a string also renders as the message. |
| `helperText` | `ReactNode` | no | Description below the field, linked with `aria-describedby` (fixes R16). |
| `label` | `ReactNode` | no | Renders a `<label>` bound to the content element. |
| `hideLabel` | `boolean` | no | Visually hidden but still announced. |
| `validate` | `function` | no | Returns a message for invalid content, or `null` when it is acceptable. |
| `sanitize` | `SanitizeOption` | no | The input sanitization profile, or an explicit config. |
| `sanitizeOutput` | `boolean` | no | Sanitize again on the way out, so a bug upstream cannot leak. |
| `htmlProfile` | `HtmlProfile` | no | The HTML dialect `getHTML` produces. |
| `emailOptions` | `EmailOutputOptions` | no | Inlining, width and table-layout choices for the `email` profile. |
| `interop` | `InteropOptions` | no | How legacy markup, such as Quill's, is read and written back. |
| `pasteMode` | `PasteMode \| function` | no | Rich, plain or cleaned paste, statically or per paste. |
| `pastePrompt` | `boolean` | no | Offer "Keep / Remove formatting" after a rich office paste. |
| `autoLinkOnPaste` | `boolean` | no | Turn pasted URLs into links. |
| `autoLink` | `boolean` | no | Turn typed URLs and e-mail addresses into links. |
| `autoLinkProtocols` | `string[]` | no | Protocols a typed URL may be linked with. |
| `defaultProtocol` | `string` | no | Protocol given to a bare host, in the popover and in autolinking. |
| `linkValidator` | `function` | no | Rejects or rewrites a URL before it becomes a link. Return a message to reject, or `null` to accept. Sanitization runs regardless: a validator can tighten the rules but never loosens them. |
| `allowDataUrlImages` | `boolean` | no | Allow `data:` image sources, which bloat stored content. |
| `autosave` | `AutosaveConfig` | no | Draft saving, its key, its TTL and its restore prompt. |
| `toolbar` | `false \| ToolbarConfig` | no | `false` hides the toolbar entirely. |
| `toolbarPosition` | `"bottom" \| "top" \| "none"` | no | Which side of the content the toolbar sits on. |
| `stickyToolbar` | `boolean \| object` | no | Keep the toolbar visible while a long document scrolls. |
| `toolbarOverflow` | `"menu" \| "wrap" \| "scroll"` | no | What happens to items that do not fit at this width. |
| `floatingToolbar` | `boolean \| FloatingToolbarConfig` | no | A toolbar that follows the selection. |
| `bubbleMenuItems` | `ToolbarItemSpec[]` | no | What the bubble menu offers, when it differs from the floating toolbar. |
| `minHeight` | `string \| number` | no | Height of the content box before it grows. |
| `maxHeight` | `string \| number` | no | Height at which the content starts scrolling instead of growing. |
| `autoGrow` | `boolean` | no | Grow with the content rather than scrolling immediately. |
| `resizable` | `boolean \| "vertical"` | no | Offer a drag handle for resizing the content box (fixes R22). |
| `fullscreen` | `boolean` | no | Controlled fullscreen. |
| `defaultFullscreen` | `boolean` | no | Start in fullscreen, for an uncontrolled editor. |
| `footer` | `ReactNode \| function` | no | Extra footer content next to the counter. |
| `readOnlyToolbar` | `"hide" \| "disable"` | no | Hide or disable the toolbar in `readOnly` mode. |
| `renderFooter` | `function` | no | Replaces the footer row. |
| `renderPlaceholder` | `function` | no | Replaces the placeholder. |
| `renderLinkPopover` | `function` | no | Replaces the link popover. |
| `renderImagePopover` | `function` | no | Replaces the controls shown when an image is selected. |
| `renderSlashMenu` | `function` | no | Replaces the `/` command palette. |
| `renderMergeTagMenu` | `function` | no | Replaces the merge-tag menu. |
| `renderColorPicker` | `function` | no | Replaces the colour palette. |
| `renderSourceView` | `function` | no | Replaces the HTML source view. |
| `renderRestoreDraftPrompt` | `function` | no | Replaces the prompt offering to restore an autosaved draft. |
| `onUpload` | `UploadHandler` | no | Hands a file to your own service and returns the attributes to insert. |
| `uploadAccept` | `string` | no | Accepted file types, enforced before the upload starts. |
| `maxUploadSize` | `number` | no | Size ceiling, enforced before the file leaves the browser. |
| `onUploadError` | `function` | no | A rejected or failed upload, with the file it concerned. |
| `imageOptions` | `ImageOptions` | no | Resizing, alignment and caption behaviour for images. |
| `handlers` | `Partial<RteHandlers>` | no | Interaction middleware; each wraps one interaction. |
| `commandOverrides` | `CommandOverrides` | no | Replacement command implementations, by command id. |
| `icons` | `RteIcons` | no | Replacement icons, by icon name. |
| `localization` | `object` | no | Message catalogue, merged over the default. |
| `theme` | `RteTheme \| object` | no | Theme tokens, merged over the preset's. |
| `colorScheme` | `ColorScheme` | no | Light, dark, or follow the operating system. |
| `contentClassName` | `string` | no | Applied to `.rte-content`, for prose overrides. |
| `unstyled` | `boolean` | no | Structure and prose styles only, no chrome visuals. |
| `id` | `string` | no | Base for the generated element ids; one is derived when absent (fixes R4). |
| `keymap` | `Record<string, CommandId \| function>` | no | Extra or replacement bindings, keyed by shortcut string. |
| `disableShortcuts` | `string[]` | no | Bindings to drop, so the surrounding app can claim them. |
| `tabBehaviour` | `TabBehaviour` | no | What `Tab` does outside a list. |
| `submitOnEnter` | `boolean \| "mod"` | no | `'mod'` makes Ctrl/Cmd+Enter call `onSubmit`. |
| `onSubmit` | `function` | no | Called when a submit binding fires, with the current value. |
| `escapeExitsEditor` | `boolean` | no | Let Escape move focus out of the editor. |
| `initialChangeSource` | `ChangeSource` | no | Source tag used by the initial `onChange`. |

### useEditor

Creates an editor.

This symbol takes no options.

## Source

- [UseEditorOptions](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/types/props.ts#L371)
- [useEditor](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/react/useEditor.ts#L209)

---

# Editor hooks

> The hooks that read editor state: focus, emptiness, counts, format and validation.

Reference · https://react-rtekit.vercel.app/react-rtekit/api/editor-hooks/

## Used by

- [Counters & limits](https://react-rtekit.vercel.app/react-rtekit/counters-and-limits/)
- [Commands](https://react-rtekit.vercel.app/react-rtekit/commands/)
- [Headless](https://react-rtekit.vercel.app/react-rtekit/headless/)
- [Read-only & disabled](https://react-rtekit.vercel.app/react-rtekit/read-only-and-disabled/)
- [Performance](https://react-rtekit.vercel.app/react-rtekit/performance/)
- [Empty state](https://react-rtekit.vercel.app/react-rtekit/empty-state/)
- [Forms](https://react-rtekit.vercel.app/react-rtekit/forms/)
- [Localization](https://react-rtekit.vercel.app/react-rtekit/localization/)
- [Presets](https://react-rtekit.vercel.app/react-rtekit/presets/)
- [Slots](https://react-rtekit.vercel.app/react-rtekit/slots/)
- [Theming](https://react-rtekit.vercel.app/react-rtekit/theming/)
- [Images & uploads](https://react-rtekit.vercel.app/react-rtekit/images/)
- [Accessibility](https://react-rtekit.vercel.app/react-rtekit/accessibility/)

## Import

```ts
import { useCharacterCount } from 'react-rtekit';
import { useCommand } from 'react-rtekit';
import { useEditorContext } from 'react-rtekit';
import { useEditorState } from 'react-rtekit';
import { useFormatState } from 'react-rtekit';
import { useIsEmpty } from 'react-rtekit';
import { useIsFocused } from 'react-rtekit';
import { useLocalization } from 'react-rtekit';
import { useRteConfig } from 'react-rtekit';
import { useRteDefaults } from 'react-rtekit';
import { useRteSlots } from 'react-rtekit';
import { useRteTheme } from 'react-rtekit';
import { useUpload } from 'react-rtekit';
import { useValidationError } from 'react-rtekit';
```

## Options

### useCharacterCount

The live character or word count.

Counts text, never markup (fixes R3).

This symbol takes no options.

### useCommand

Binds a toolbar control to a command.

This symbol takes no options.

### useEditorContext

The editor instance for the nearest `<Rte.Root>` or `<RichTextEditor>`.

This symbol takes no options.

### useEditorState

Subscribes to a slice of editor state.

This symbol takes no options.

### useFormatState

The formatting that applies to the current selection.

This symbol takes no options.

### useIsEmpty

True when the editor holds nothing a reader would see (fixes R2).

This symbol takes no options.

### useIsFocused

True while the editor has focus. Drives `:focus-within` styling (fixes R9).

This symbol takes no options.

### useLocalization

The active message catalogue. Falls back to the shipped English one.

This symbol takes no options.

### useRteConfig

The resolved configuration for the nearest editor.

This symbol takes no options.

### useRteDefaults

App-wide prop defaults from `<RteDefaultsProvider>`. Props still win.

This symbol takes no options.

### useRteSlots

The slot table, including the defaults.

This symbol takes no options.

### useRteTheme

The active theme, or `null` when no provider is above.

This symbol takes no options.

### useUpload

In-flight uploads plus the function that starts one.

This symbol takes no options.

### useValidationError

The current validation message, or `null`.

This symbol takes no options.

## Source

- [useCharacterCount](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/react/hooks.ts#L131)
- [useCommand](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/react/hooks.ts#L99)
- [useEditorContext](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/react/context.ts#L52)
- [useEditorState](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/react/hooks.ts#L30)
- [useFormatState](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/react/hooks.ts#L76)
- [useIsEmpty](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/react/hooks.ts#L122)
- [useIsFocused](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/react/hooks.ts#L161)
- [useLocalization](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/react/context.ts#L129)
- [useRteConfig](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/react/context.ts#L191)
- [useRteDefaults](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/react/context.ts#L206)
- [useRteSlots](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/react/context.ts#L110)
- [useRteTheme](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/react/context.ts#L149)
- [useUpload](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/react/hooks.ts#L151)
- [useValidationError](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/react/hooks.ts#L168)

---

# EditorInstance

> The imperative API on the editor ref: content, selection, commands, drafts and find.

Reference · https://react-rtekit.vercel.app/react-rtekit/api/editor-instance/

## Used by

- [Undo & redo](https://react-rtekit.vercel.app/react-rtekit/history/)
- [Empty state](https://react-rtekit.vercel.app/react-rtekit/empty-state/)
- [Merge tags](https://react-rtekit.vercel.app/react-rtekit/merge-tags/)
- [Counters & limits](https://react-rtekit.vercel.app/react-rtekit/counters-and-limits/)
- [Find & replace](https://react-rtekit.vercel.app/react-rtekit/find-and-replace/)
- [Fullscreen](https://react-rtekit.vercel.app/react-rtekit/fullscreen/)
- [Source view](https://react-rtekit.vercel.app/react-rtekit/source-view/)
- [Autosave & drafts](https://react-rtekit.vercel.app/react-rtekit/autosave/)
- [Commands](https://react-rtekit.vercel.app/react-rtekit/commands/)
- [Headless](https://react-rtekit.vercel.app/react-rtekit/headless/)
- [Engine adapter](https://react-rtekit.vercel.app/react-rtekit/engine-adapter/)

## Import

```ts
import { EditorInstance } from 'react-rtekit';
```

## Options

The handle returned by `useEditor` and exposed through `editorRef` / `onReady`.

| Name | Type | Required | Description |
|---|---|---|---|
| `getHTML` | `object` | yes | The document as HTML, in the editor's profile unless one is given. |
| `getJSON` | `object` | yes | The document as the portable JSON shape. |
| `getMarkdown` | `object` | yes | The document as Markdown; anything Markdown cannot express is downgraded. |
| `getText` | `object` | yes | The document's text, with blocks joined by `blockSeparator`. |
| `getPlainTextAlternative` | `object` | yes | The `text/plain` alternative for a multipart e-mail. |
| `setContent` | `object` | yes | Replaces the whole document. |
| `insertContent` | `object` | yes | Inserts content at the selection, or at `at`. |
| `clear` | `object` | yes | Empties the document, optionally clearing the undo stack with it. |
| `isEmpty` | `object` | yes | True for `''`, `<p></p>`, `<p><br></p>` and whitespace-only content (fixes R2). |
| `getLength` | `object` | yes | The document's length in `unit`, defaulting to the configured `countUnit`. |
| `getSelection` | `object` | yes | Where the selection is, or `null` when the editor is not focused. |
| `setSelection` | `object` | yes | Moves the selection, either to a range or to a named position. |
| `saveSelection` | `object` | yes | Captures the selection so it survives focus moving to a popover. |
| `restoreSelection` | `object` | yes | Puts back a selection captured by EditorInstance.saveSelection. |
| `getFormatState` | `object` | yes | Every mark and block format at the selection. |
| `focus` | `object` | yes | Focuses the content element, optionally placing the caret. |
| `blur` | `object` | yes | Moves focus out of the content element. |
| `hasFocus` | `object` | yes | True while the caret is inside the content element. |
| `exec` | `object` | yes | Runs a command through its middleware chain; returns whether it did anything. |
| `canExec` | `object` | yes | Whether the command could run right now, which is what disables a control. |
| `isActive` | `object` | yes | Whether the command's effect is already applied, which is what presses a toggle. |
| `registerCommand` | `object` | yes | Adds a handler to a command's middleware chain; returns its unregister function. |
| `undo` | `object` | yes | Steps back one undo entry. |
| `redo` | `object` | yes | Steps forward one undo entry. |
| `canUndo` | `object` | yes | Whether there is anything to undo. |
| `canRedo` | `object` | yes | Whether there is anything to redo. |
| `clearHistory` | `object` | yes | Drops the undo stack, so loaded content cannot be undone away. |
| `insertLink` | `object` | yes | Links the selection, or inserts a new link when it is collapsed. |
| `removeLink` | `object` | yes | Unwraps the link at the selection, leaving its text. |
| `getLinkAtSelection` | `object` | yes | The link the caret is inside, or `null`. |
| `insertImage` | `object` | yes | Inserts an image from attributes you already have. |
| `uploadFiles` | `object` | yes | Runs files through the upload handler and inserts the results. |
| `insertMergeTag` | `object` | yes | Inserts a merge tag as an atomic node (fixes R23). |
| `getMergeTags` | `object` | yes | The keys of every merge tag currently in the document. |
| `insertTable` | `object` | yes | Inserts a table and places the caret in its first cell. |
| `setEditable` | `object` | yes | Turns editing on or off without changing the disabled or read-only props. |
| `isEditable` | `object` | yes | Whether the content can currently be edited. |
| `setFullscreen` | `object` | yes | Enters or leaves fullscreen. |
| `isFullscreen` | `object` | yes | Whether the editor is in fullscreen. |
| `toggleSourceView` | `object` | yes | Opens or closes the HTML source view. |
| `isSourceView` | `object` | yes | Whether the HTML source view is open. |
| `find` | `object` | yes | Searches the document and selects the first match from the caret. |
| `replace` | `object` | yes | Replaces every match in one undo step; returns how many were replaced. |
| `clearDraft` | `object` | yes | Removes the autosaved draft, which is what a successful submit should do. |
| `saveDraft` | `object` | yes | Writes an autosave draft now rather than waiting for the interval. |
| `validate` | `object` | yes | Runs `required`, `maxLength` and the `validate` prop. Returns the message or `null`. |
| `announce` | `object` | yes | Announce a message through the editor's polite live region. |
| `on` | `object` | yes | Subscribes to one editor event; returns its unregister function. |
| `getSnapshot` | `object` | yes | Current derived state; the same object `useEditorState` selects from. |
| `engine` | `EngineHandle` | yes | The engine adapter. Escape hatch. |
| `id` | `string` | yes | Stable per-instance id, used to namespace DOM ids (fixes R4). |

## Source

- [EditorInstance](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/types/editor.ts#L164)

---

# Command catalogue

> All 57 commands, their payloads and what each one does.

Reference · https://react-rtekit.vercel.app/react-rtekit/api/commands/

## Used by

- [Text formatting](https://react-rtekit.vercel.app/react-rtekit/text-formatting/)
- [Commands](https://react-rtekit.vercel.app/react-rtekit/commands/)

## Import

```ts
import { meta } from 'react-rtekit/meta';
```

## Options

Every command the editor can run. Run one with `editor.exec(id, payload)`, ask `canExec` or `isActive` about it, or replace what it does with `commandOverrides`. Keyboard shortcuts and toolbar buttons both go through this list.

| Name | Type | Required | Description |
|---|---|---|---|
| `toggleBold` | `entry` | no | Toggles bold on the selection. |
| `toggleItalic` | `entry` | no | Toggles italic on the selection. |
| `toggleUnderline` | `entry` | no | Toggles underline on the selection. |
| `toggleStrike` | `entry` | no | Toggles strikethrough on the selection. |
| `toggleCode` | `entry` | no | Toggles inline code on the selection. |
| `toggleSubscript` | `entry` | no | Toggles subscript on the selection. |
| `toggleSuperscript` | `entry` | no | Toggles superscript on the selection. |
| `setColor` | `entry` | no | Sets the text colour; `null` removes it (R14). |
| `setBackgroundColor` | `entry` | no | Sets the highlight colour; `null` removes it. |
| `setFontFamily` | `entry` | no | Sets the font family; `null` removes it. |
| `setFontSize` | `entry` | no | Sets the font size; `null` removes it. |
| `clearFormatting` | `entry` | no | Removes marks, and optionally block formatting. |
| `setBlockType` | `entry` | no | Turns the block into a paragraph, heading, quote or code block. |
| `setAlign` | `entry` | no | Aligns the block; 'left' is the default (R6). |
| `indent` | `entry` | no | Indents the block or list item. |
| `outdent` | `entry` | no | Outdents the block or list item. |
| `toggleBulletList` | `entry` | no | Turns the selection into a bulleted list. |
| `toggleOrderedList` | `entry` | no | Turns the selection into a numbered list. |
| `toggleCheckList` | `entry` | no | Turns the selection into a check list. |
| `insertLink` | `entry` | no | Links the selection. |
| `updateLink` | `entry` | no | Updates the link at the selection. |
| `removeLink` | `entry` | no | Removes the link, keeping the text. |
| `openLinkEditor` | `entry` | no | Opens the link popover. |
| `insertImage` | `entry` | no | Inserts an image. |
| `updateImage` | `entry` | no | Updates the selected image. |
| `removeImage` | `entry` | no | Removes the selected image. |
| `openImageDialog` | `entry` | no | Opens the insert-image dialog. |
| `insertTable` | `entry` | no | Inserts a table. |
| `addRowBefore` | `entry` | no | Adds a row above the current one. |
| `addRowAfter` | `entry` | no | Adds a row below the current one. |
| `addColumnBefore` | `entry` | no | Adds a column before the current one. |
| `addColumnAfter` | `entry` | no | Adds a column after the current one. |
| `deleteRow` | `entry` | no | Deletes the current row. |
| `deleteColumn` | `entry` | no | Deletes the current column. |
| `deleteTable` | `entry` | no | Deletes the table. |
| `toggleHeaderRow` | `entry` | no | Turns the first row into a header row. |
| `insertHorizontalRule` | `entry` | no | Inserts a horizontal rule. |
| `insertLineBreak` | `entry` | no | Inserts a line break inside the block. |
| `insertEmoji` | `entry` | no | Inserts an emoji character. |
| `insertMergeTag` | `entry` | no | Inserts a merge tag as one atomic node (R23). |
| `insertMention` | `entry` | no | Inserts a mention. |
| `insertText` | `entry` | no | Inserts plain text at the selection. |
| `insertHTML` | `entry` | no | Inserts sanitized HTML at the selection. |
| `insertContent` | `entry` | no | Inserts a value in any supported format. |
| `undo` | `entry` | no | Undoes the last change. |
| `redo` | `entry` | no | Redoes the last undone change. |
| `selectAll` | `entry` | no | Selects the whole document. |
| `focusStart` | `entry` | no | Moves the caret to the start. |
| `focusEnd` | `entry` | no | Moves the caret to the end. |
| `toggleSourceView` | `entry` | no | Shows or hides the HTML source view. |
| `toggleFullscreen` | `entry` | no | Enters or leaves fullscreen. |
| `openFindReplace` | `entry` | no | Opens find and replace. |
| `print` | `entry` | no | Prints the content. |
| `pastePlainText` | `entry` | no | Pastes text with no formatting. |
| `openShortcutHelp` | `entry` | no | Opens the shortcut reference (R25). |
| `openColorPicker` | `entry` | no | Opens the colour picker. |
| `openMergeTagMenu` | `entry` | no | Opens the merge-tag insert menu. |

## Source

- [Command catalogue](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/src/meta.ts)

---

# Handler catalogue

> All 18 middleware points, and the context each one receives.

Reference · https://react-rtekit.vercel.app/react-rtekit/api/handlers/

## Used by

- [Handler middleware](https://react-rtekit.vercel.app/react-rtekit/handler-middleware/)

## Import

```ts
import { meta } from 'react-rtekit/meta';
```

## Options

Interaction middleware: every point where your own code can sit in front of something the editor is about to do. A handler receives the context and a `next`, so it can inspect, amend, or decline to call on — which is how uploads, link policy and paste treatment are customized.

| Name | Type | Required | Description |
|---|---|---|---|
| `onBeforeChange` | `entry` | no | Runs before a change is committed; can veto it. |
| `onPaste` | `entry` | no | Wraps the paste pipeline. |
| `onDrop` | `entry` | no | Wraps drop handling. |
| `onUploadStart` | `entry` | no | Runs before an upload begins. |
| `onUploadError` | `entry` | no | Runs when an upload fails. |
| `onKeyDown` | `entry` | no | Wraps key handling before the keymap. |
| `onLinkClick` | `entry` | no | Runs when a link in the content is clicked. |
| `onLinkOpen` | `entry` | no | Runs before a link is opened. |
| `onToolbarCommand` | `entry` | no | Wraps every toolbar activation. |
| `onFocus` | `entry` | no | Wraps focus handling. |
| `onBlur` | `entry` | no | Wraps blur handling. |
| `onSelectionChange` | `entry` | no | Wraps selection updates. |
| `onMaxLengthExceeded` | `entry` | no | Runs when input would exceed `maxLength`. |
| `onSanitizeViolation` | `entry` | no | Runs for each thing the sanitizer removed. |
| `onFullscreenChange` | `entry` | no | Wraps entering and leaving fullscreen. |
| `onSourceViewToggle` | `entry` | no | Wraps the source-view toggle. |
| `onDraftRestore` | `entry` | no | Wraps restoring a saved draft. |
| `onDraftSave` | `entry` | no | Wraps saving a draft. |

## Source

- [Handler catalogue](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/src/meta.ts)

---

# Serialization

> Converting between HTML, the document model, Markdown and plain text.

Reference · https://react-rtekit.vercel.app/react-rtekit/api/serialization/

## Used by

- [Value formats](https://react-rtekit.vercel.app/react-rtekit/value-formats/)
- [HTML interop](https://react-rtekit.vercel.app/react-rtekit/html-interop/)
- [E-mail output](https://react-rtekit.vercel.app/react-rtekit/email-output/)
- [Code blocks](https://react-rtekit.vercel.app/react-rtekit/code-blocks/)
- [Empty state](https://react-rtekit.vercel.app/react-rtekit/empty-state/)

## Import

```ts
import { documentToHtml } from 'react-rtekit';
import { documentToMarkdown } from 'react-rtekit';
import { documentToText } from 'react-rtekit';
import { htmlToDocument } from 'react-rtekit';
import { isEmptyHtml } from 'react-rtekit';
import { markdownToDocument } from 'react-rtekit';
import { markdownToHtml } from 'react-rtekit/core';
```

## Options

### documentToHtml

Serializes a document to HTML.

This symbol takes no options.

### documentToMarkdown

Serializes a document to Markdown.

This symbol takes no options.

### documentToText

Extracts the visible text of a document.

This symbol takes no options.

### htmlToDocument

Parses HTML into the portable document model.

Runs the whole input pipeline: source detection, interop, sanitization,
schema downgrade and normalization.

This symbol takes no options.

### isEmptyHtml

True when an HTML string holds no visible content (fixes R2).

The cheap path for callers that only need the boolean and do not want to build a
document: `''`, `'<p></p>'`, `'<p><br></p>'` and whitespace-only markup are empty,
while `'<p>&nbsp;</p>'` is not.

This symbol takes no options.

### markdownToDocument

Parses Markdown into a document.

Implemented by converting to HTML and reusing the HTML pipeline, so Markdown input
gets the same sanitization, interop and schema downgrade as everything else.

This symbol takes no options.

### markdownToHtml

Converts Markdown to HTML. Exported for the interop demo's before/after view.

This symbol takes no options.

## Source

- [documentToHtml](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/core/serialize/to-html.ts#L417)
- [documentToMarkdown](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/core/serialize/markdown.ts#L198)
- [documentToText](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/core/document.ts#L307)
- [htmlToDocument](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/core/serialize/from-html.ts#L706)
- [isEmptyHtml](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/core/serialize/from-html.ts#L773)
- [markdownToDocument](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/core/serialize/markdown.ts#L301)
- [markdownToHtml](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/core/serialize/markdown.ts#L333)

---

# Sanitizer

> The sanitizer, its four profiles, and the URL checker every href and src passes through.

Reference · https://react-rtekit.vercel.app/react-rtekit/api/sanitize/

## Used by

- [Links](https://react-rtekit.vercel.app/react-rtekit/links/)
- [Sanitization](https://react-rtekit.vercel.app/react-rtekit/sanitization/)
- [E-mail output](https://react-rtekit.vercel.app/react-rtekit/email-output/)
- [Source view](https://react-rtekit.vercel.app/react-rtekit/source-view/)

## Import

```ts
import { checkUrl } from 'react-rtekit/core';
import { getProfile } from 'react-rtekit/core';
import { mergeSanitizeConfig } from 'react-rtekit/core';
import { normalizeUrl } from 'react-rtekit';
import { resolveSanitizeConfig } from 'react-rtekit/core';
import { sanitizeHtml } from 'react-rtekit';
```

## Options

### checkUrl

Applies the URL policy to one attribute value.

This symbol takes no options.

### getProfile

Returns a profile by name. The returned object is a fresh copy.

This symbol takes no options.

### mergeSanitizeConfig

Merges a partial config onto a resolved one.

This symbol takes no options.

### normalizeUrl

Adds a default scheme to a bare host, as the link popover does.

Leaves anything that already has a scheme, an anchor or a mail-like shape alone.

This symbol takes no options.

### resolveSanitizeConfig

Turns the `sanitize` prop into a resolved configuration.

A config object is merged onto `standard`; `false` is handled by the caller, which
also emits the development warning.

This symbol takes no options.

### sanitizeHtml

Sanitizes an HTML string against a profile or configuration.

Runs at every content boundary in both directions. The hard rules — the blocked tags,
protocols and CSS properties — apply regardless of configuration.

This symbol takes no options.

## Source

- [checkUrl](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/core/sanitize/url.ts#L80)
- [getProfile](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/core/sanitize/profiles.ts#L249)
- [mergeSanitizeConfig](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/core/sanitize/profiles.ts#L284)
- [normalizeUrl](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/core/sanitize/url.ts#L134)
- [resolveSanitizeConfig](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/core/sanitize/profiles.ts#L278)
- [sanitizeHtml](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/core/sanitize/sanitize.ts#L275)

---

# Plugin API

> Defining a plugin, resolving plugin order, and the preset bundles.

Reference · https://react-rtekit.vercel.app/react-rtekit/api/plugin-api/

## Used by

- [Toolbar](https://react-rtekit.vercel.app/react-rtekit/toolbar/)
- [Plugin authoring](https://react-rtekit.vercel.app/react-rtekit/plugin-authoring/)
- [Presets](https://react-rtekit.vercel.app/react-rtekit/presets/)

## Import

```ts
import { createToolbarItem } from 'react-rtekit';
import { definePlugin } from 'react-rtekit';
import { featuresOf } from 'react-rtekit';
import { presets } from 'react-rtekit';
import { resolvePluginOrder } from 'react-rtekit';
import { resolvePlugins } from 'react-rtekit';
```

## Options

### createToolbarItem

Declares a toolbar item.

This symbol takes no options.

### definePlugin

Declares a plugin.

This symbol takes no options.

### featuresOf

The feature ids a plugin list enables, for the schema downgrade.

This symbol takes no options.

### presets

Every shipped preset.

This symbol takes no options.

### resolvePluginOrder

Resolves a plugin list: dependencies first, duplicates removed.

A plugin registered twice keeps its last definition, which is what makes
`addPlugins` able to replace a built-in by name.

This symbol takes no options.

### resolvePlugins

Resolves the plugin list for a set of props.

Order of precedence: `plugins` replaces the preset entirely, then `removePlugins`
drops names, then `addPlugins` appends, then the `enableX` flags turn individual
features off.

This symbol takes no options.

## Source

- [createToolbarItem](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/core/plugins/define.ts#L44)
- [definePlugin](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/core/plugins/define.ts#L26)
- [featuresOf](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/core/plugins/define.ts#L91)
- [presets](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/core/plugins/presets.ts#L117)
- [resolvePluginOrder](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/core/plugins/define.ts#L57)
- [resolvePlugins](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/core/plugins/presets.ts#L207)

---

# Theme API

> Building a theme, and the five that ship.

Reference · https://react-rtekit.vercel.app/react-rtekit/api/theme-api/

## Used by

- [Theme presets](https://react-rtekit.vercel.app/react-rtekit/theme-presets/)
- [Theming](https://react-rtekit.vercel.app/react-rtekit/theming/)

## Import

```ts
import { borderedTheme } from 'react-rtekit';
import { classicTheme } from 'react-rtekit';
import { compactTheme } from 'react-rtekit';
import { createTheme } from 'react-rtekit';
import { darkTheme } from 'react-rtekit';
import { lightTheme } from 'react-rtekit';
import { themes } from 'react-rtekit';
```

## Options

### borderedTheme

Toolbar and content share one bounding box, and the toolbar sticks.

This symbol takes no options.

### classicTheme

1:1 parity with the legacy editor.

**These values are frozen.** The parity guarantee is part of the versioning contract:
changing one is a major release. Other presets may move in a minor.

Deliberate deviations, documented on the parity page:
the focus ring replaces the 1px→2px border swap so focusing shifts nothing (R10),
colour Reset clears the format instead of writing `#000000` (R14), swatches are
focusable buttons (R15), the toolbar is a real ARIA toolbar (R16), the icons are
in-house at the same size and colour, and there is now a placeholder (R24).

This symbol takes no options.

### compactTheme

A denser theme: 32px buttons, 20px icons, a 160px minimum.

This symbol takes no options.

### createTheme

Merges overrides onto a base theme.

This symbol takes no options.

### darkTheme

The dark theme. Contrast pairs are AA-verified against text and surface.

This symbol takes no options.

### lightTheme

The default theme.

Subtle toolbar hover states, a visible placeholder, paragraph spacing — the modern
look, as opposed to `classic`'s reproduction of the old editor.

This symbol takes no options.

### themes

Every shipped theme, keyed by name.

This symbol takes no options.

## Source

- [borderedTheme](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/themes/index.ts#L351)
- [classicTheme](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/themes/index.ts#L225)
- [compactTheme](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/themes/index.ts#L342)
- [createTheme](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/themes/index.ts#L201)
- [darkTheme](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/themes/index.ts#L304)
- [lightTheme](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/themes/index.ts#L60)
- [themes](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/themes/index.ts#L364)

---

# Slot catalogue

> All 46 replaceable parts and the props each one receives.

Reference · https://react-rtekit.vercel.app/react-rtekit/api/slots/

## Used by

- [Slots](https://react-rtekit.vercel.app/react-rtekit/slots/)

## Import

```ts
import { meta } from 'react-rtekit/meta';
```

## Options

Every part of the editor you can replace, keyed by name. Pass a component for a name to `slots` and it renders in place of the built-in one, receiving the same props. A name absent from `slots` keeps its default.

| Name | Type | Required | Description |
|---|---|---|---|
| `Root` | `entry` | no | The outermost element; owns the data attributes. |
| `Toolbar` | `entry` | no | The toolbar container. |
| `ToolbarGroup` | `entry` | no | One group of toolbar items. |
| `ToolbarSeparator` | `entry` | no | The divider between groups. |
| `ToolbarButton` | `entry` | no | A plain toolbar button. |
| `ToolbarToggle` | `entry` | no | A toolbar button with a pressed state. |
| `ToolbarDropdown` | `entry` | no | A toolbar control that opens a menu. |
| `ToolbarOverflow` | `entry` | no | The "more" affordance for hidden items. |
| `ColorPicker` | `entry` | no | The colour palette, recents and custom input. |
| `ContentWrapper` | `entry` | no | The bordered box around the editable area. |
| `Content` | `entry` | no | The host element the engine renders into. |
| `Placeholder` | `entry` | no | Shown while the editor is empty. |
| `Label` | `entry` | no | The field label. |
| `HelperText` | `entry` | no | The helper text below the editor. |
| `ErrorText` | `entry` | no | The validation message, with role="alert". |
| `Counter` | `entry` | no | The character or word counter. |
| `Footer` | `entry` | no | The row holding the counter and any extras. |
| `LinkPopover` | `entry` | no | The link editor and preview. |
| `ImageDialog` | `entry` | no | The insert-image dialog. |
| `ImagePopover` | `entry` | no | The controls shown for a selected image. |
| `UploadPlaceholder` | `entry` | no | The in-progress upload indicator. |
| `TablePicker` | `entry` | no | The grid used to choose table dimensions. |
| `TableToolbar` | `entry` | no | Row and column controls for a selected table. |
| `InlineSuggestMenu` | `entry` | no | The shared list behind every trigger menu. |
| `MergeTagChip` | `entry` | no | One merge tag as rendered in the content. |
| `SlashMenu` | `entry` | no | The slash-command palette. |
| `EmojiPicker` | `entry` | no | The emoji list. |
| `MentionList` | `entry` | no | The mention candidate list. |
| `FloatingToolbar` | `entry` | no | The toolbar that follows the selection. |
| `BubbleMenu` | `entry` | no | The compact menu shown over a selection. |
| `FindReplacePanel` | `entry` | no | The find-and-replace panel. |
| `SourceView` | `entry` | no | The HTML source editor. |
| `FullscreenPortal` | `entry` | no | The container used in fullscreen mode. |
| `RestoreDraftPrompt` | `entry` | no | The prompt offering a saved draft. |
| `ShortcutHelpDialog` | `entry` | no | The keyboard shortcut reference. |
| `Tooltip` | `entry` | no | Tooltip primitive. |
| `Menu` | `entry` | no | Menu primitive. |
| `MenuItem` | `entry` | no | Menu item primitive. |
| `Popover` | `entry` | no | Popover primitive. |
| `Dialog` | `entry` | no | Dialog primitive. |
| `Button` | `entry` | no | Button primitive. |
| `IconButton` | `entry` | no | Icon-only button primitive. |
| `TextInput` | `entry` | no | Text input primitive. |
| `Select` | `entry` | no | Select primitive. |
| `Checkbox` | `entry` | no | Checkbox primitive. |
| `Spinner` | `entry` | no | Loading indicator primitive. |

## Source

- [Slot catalogue](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/src/meta.ts)

---

# Toolbar items

> All 42 built-in toolbar items by name, for building a layout of your own.

Reference · https://react-rtekit.vercel.app/react-rtekit/api/toolbar-items/

## Used by

- [Toolbar](https://react-rtekit.vercel.app/react-rtekit/toolbar/)

## Import

```ts
import { meta } from 'react-rtekit/meta';
```

## Options

Every item the toolbar can render, by name. A layout is an array of these names, with `|` for a separator; a name that nothing provides is dropped rather than rendered disabled, so a layout can name an item its preset does not load.

| Name | Type | Required | Description |
|---|---|---|---|
| `\|` | `entry` | no | A group separator. |
| `undo` | `entry` | no | Undo. |
| `redo` | `entry` | no | Redo. |
| `bold` | `entry` | no | Bold. |
| `italic` | `entry` | no | Italic. |
| `underline` | `entry` | no | Underline. |
| `strike` | `entry` | no | Strikethrough. |
| `code` | `entry` | no | Inline code. |
| `subscript` | `entry` | no | Subscript. |
| `superscript` | `entry` | no | Superscript. |
| `color` | `entry` | no | Text colour. |
| `backgroundColor` | `entry` | no | Highlight colour. |
| `fontFamily` | `entry` | no | Font family. |
| `fontSize` | `entry` | no | Font size. |
| `clearFormatting` | `entry` | no | Clear formatting. |
| `blockType` | `entry` | no | Paragraph, heading, quote or code block. |
| `heading` | `entry` | no | Heading level picker. |
| `blockquote` | `entry` | no | Block quote. |
| `codeBlock` | `entry` | no | Code block. |
| `alignLeft` | `entry` | no | Align left. |
| `alignCenter` | `entry` | no | Align centre. |
| `alignRight` | `entry` | no | Align right. |
| `alignJustify` | `entry` | no | Justify. |
| `align` | `entry` | no | Alignment dropdown. |
| `indent` | `entry` | no | Increase indent. |
| `outdent` | `entry` | no | Decrease indent. |
| `bulletList` | `entry` | no | Bulleted list. |
| `orderedList` | `entry` | no | Numbered list. |
| `checkList` | `entry` | no | Check list. |
| `link` | `entry` | no | Insert or edit a link. |
| `unlink` | `entry` | no | Remove the link. |
| `image` | `entry` | no | Insert an image. |
| `table` | `entry` | no | Insert a table. |
| `horizontalRule` | `entry` | no | Insert a horizontal rule. |
| `emoji` | `entry` | no | Insert an emoji. |
| `mergeTag` | `entry` | no | Insert a merge tag. |
| `mention` | `entry` | no | Insert a mention. |
| `findReplace` | `entry` | no | Open find and replace. |
| `sourceView` | `entry` | no | Toggle the HTML source view. |
| `fullscreen` | `entry` | no | Toggle fullscreen. |
| `print` | `entry` | no | Print. |
| `wordCount` | `entry` | no | A live word count. |

## Source

- [Toolbar items](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/src/meta.ts)

---

# Theme tokens

> All 114 design tokens and the CSS custom property each one writes.

Reference · https://react-rtekit.vercel.app/react-rtekit/api/theme-tokens/

## Used by

- [Theming](https://react-rtekit.vercel.app/react-rtekit/theming/)

## Import

```ts
import { meta } from 'react-rtekit/meta';
```

## Options

Every CSS custom property the editor reads. Set one anywhere above the editor in the cascade and it takes effect; nothing here is scoped to a class name. The values below are what the default theme sets.

| Name | Type | Required | Description |
|---|---|---|---|
| `--rte-bold-weight` | `entry` | no | Default: `700` |
| `--rte-border-color` | `entry` | no | Default: `var(--rte-color-border)` |
| `--rte-border-width` | `entry` | no | Default: `1px` |
| `--rte-button-active-bg` | `entry` | no | Default: `transparent` |
| `--rte-button-active-color` | `entry` | no | Default: `var(--rte-color-text)` |
| `--rte-button-color` | `entry` | no | Default: `#A4A7AE` |
| `--rte-button-disabled-color` | `entry` | no | Default: `var(--rte-color-text-disabled)` |
| `--rte-button-focus-ring` | `entry` | no | Default: `0 0 0 2px var(--rte-color-accent-border)` |
| `--rte-button-hover-bg` | `entry` | no | Default: `rgb(0 0 0 / 4%)` |
| `--rte-button-padding` | `entry` | no | Default: `8px` |
| `--rte-button-radius` | `entry` | no | Default: `4px` |
| `--rte-button-size` | `entry` | no | Default: `40px` |
| `--rte-cell-padding` | `entry` | no | Default: `6px 8px` |
| `--rte-code-bg` | `entry` | no | Default: `#F5F5F5` |
| `--rte-code-color` | `entry` | no | Default: `#B91C1C` |
| `--rte-code-font` | `entry` | no | Default: `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace` |
| `--rte-color-accent` | `entry` | no | Default: `#1976D2` |
| `--rte-color-accent-border` | `entry` | no | Default: `#1976D280` |
| `--rte-color-accent-contrast` | `entry` | no | Default: `#FFFFFF` |
| `--rte-color-accent-soft` | `entry` | no | Default: `#1976D21A` |
| `--rte-color-border` | `entry` | no | Default: `#D5D7DA` |
| `--rte-color-border-subtle` | `entry` | no | Default: `#E9EAEB` |
| `--rte-color-danger` | `entry` | no | Default: `#D92D20` |
| `--rte-color-placeholder` | `entry` | no | Default: `#667085` |
| `--rte-color-success` | `entry` | no | Default: `#067647` |
| `--rte-color-surface` | `entry` | no | Default: `#FFFFFF` |
| `--rte-color-surface-muted` | `entry` | no | Default: `#FAFAFA` |
| `--rte-color-surface-raised` | `entry` | no | Default: `#FFFFFF` |
| `--rte-color-text` | `entry` | no | Default: `#212121` |
| `--rte-color-text-disabled` | `entry` | no | Default: `#A4A7AE` |
| `--rte-color-text-muted` | `entry` | no | Default: `#667085` |
| `--rte-color-warning` | `entry` | no | Default: `#B54708` |
| `--rte-content-color` | `entry` | no | Default: `var(--rte-color-text)` |
| `--rte-content-font-family` | `entry` | no | Default: `inherit` |
| `--rte-content-font-size` | `entry` | no | Default: `14px` |
| `--rte-content-line-height` | `entry` | no | Default: `1.5` |
| `--rte-content-padding` | `entry` | no | Default: `12px` |
| `--rte-counter-color` | `entry` | no | Default: `var(--rte-color-text-muted)` |
| `--rte-counter-over-color` | `entry` | no | Default: `var(--rte-color-danger)` |
| `--rte-counter-warn-color` | `entry` | no | Default: `var(--rte-color-warning)` |
| `--rte-density-scale` | `entry` | no | Default: `1` |
| `--rte-disabled-bg` | `entry` | no | Default: `#FAFAFA` |
| `--rte-editor-bg` | `entry` | no | Default: `var(--rte-color-surface)` |
| `--rte-find-active-bg` | `entry` | no | Default: `#FFC0CB` |
| `--rte-find-bg` | `entry` | no | Default: `#FFF3A3` |
| `--rte-focus-ring` | `entry` | no | Default: `inset 0 0 0 2px var(--rte-color-accent)` |
| `--rte-font-family` | `entry` | no | Default: `inherit` |
| `--rte-font-size` | `entry` | no | Default: `14px` |
| `--rte-font-size-sm` | `entry` | no | Default: `12px` |
| `--rte-footer-gap` | `entry` | no | Default: `8px` |
| `--rte-footer-padding` | `entry` | no | Default: `4px 0 0` |
| `--rte-h1-size` | `entry` | no | Default: `2em` |
| `--rte-h2-size` | `entry` | no | Default: `1.5em` |
| `--rte-h3-size` | `entry` | no | Default: `1.17em` |
| `--rte-h4-size` | `entry` | no | Default: `1em` |
| `--rte-h5-size` | `entry` | no | Default: `0.83em` |
| `--rte-h6-size` | `entry` | no | Default: `0.67em` |
| `--rte-heading-weight` | `entry` | no | Default: `600` |
| `--rte-helper-color` | `entry` | no | Default: `var(--rte-color-text-muted)` |
| `--rte-hr-color` | `entry` | no | Default: `var(--rte-color-border-subtle)` |
| `--rte-icon-size` | `entry` | no | Default: `24px` |
| `--rte-indent-step` | `entry` | no | Default: `2em` |
| `--rte-invalid-border-color` | `entry` | no | Default: `var(--rte-color-danger)` |
| `--rte-line-height` | `entry` | no | Default: `1.5` |
| `--rte-link-color` | `entry` | no | Default: `var(--rte-color-accent)` |
| `--rte-link-decoration` | `entry` | no | Default: `underline` |
| `--rte-list-indent` | `entry` | no | Default: `1.5em` |
| `--rte-list-item-padding` | `entry` | no | Default: `0.5em` |
| `--rte-max-height` | `entry` | no | Default: `none` |
| `--rte-mention-bg` | `entry` | no | Default: `#F3E8FF` |
| `--rte-mention-color` | `entry` | no | Default: `#6941C6` |
| `--rte-mention-padding` | `entry` | no | Default: `1px 4px` |
| `--rte-mention-radius` | `entry` | no | Default: `4px` |
| `--rte-menu-item-active-bg` | `entry` | no | Default: `var(--rte-color-accent-soft)` |
| `--rte-menu-item-height` | `entry` | no | Default: `32px` |
| `--rte-menu-item-hover-bg` | `entry` | no | Default: `rgb(0 0 0 / 4%)` |
| `--rte-menu-item-padding` | `entry` | no | Default: `0 12px` |
| `--rte-mergetag-bg` | `entry` | no | Default: `#EAF6FF` |
| `--rte-mergetag-border` | `entry` | no | Default: `1px solid #B2DDFF` |
| `--rte-mergetag-color` | `entry` | no | Default: `#175CD3` |
| `--rte-mergetag-padding` | `entry` | no | Default: `1px 4px` |
| `--rte-mergetag-radius` | `entry` | no | Default: `4px` |
| `--rte-mergetag-selected-bg` | `entry` | no | Default: `#B2DDFF` |
| `--rte-min-height` | `entry` | no | Default: `287px` |
| `--rte-motion-duration` | `entry` | no | Default: `150ms` |
| `--rte-motion-easing` | `entry` | no | Default: `cubic-bezier(0.2, 0, 0, 1)` |
| `--rte-paragraph-spacing` | `entry` | no | Default: `0.5em` |
| `--rte-popover-bg` | `entry` | no | Default: `var(--rte-color-surface-raised)` |
| `--rte-popover-border` | `entry` | no | Default: `1px solid var(--rte-color-border)` |
| `--rte-popover-padding` | `entry` | no | Default: `16px` |
| `--rte-popover-radius` | `entry` | no | Default: `4px` |
| `--rte-popover-shadow` | `entry` | no | Default: `0 4px 12px rgb(0 0 0 / 12%)` |
| `--rte-quote-border` | `entry` | no | Default: `3px solid var(--rte-color-border)` |
| `--rte-quote-padding` | `entry` | no | Default: `12px` |
| `--rte-radius` | `entry` | no | Default: `4px` |
| `--rte-selection-bg` | `entry` | no | Default: `#B2DDFF` |
| `--rte-swatch-border-color` | `entry` | no | Default: `var(--rte-color-border)` |
| `--rte-swatch-gap` | `entry` | no | Default: `4px` |
| `--rte-swatch-radius` | `entry` | no | Default: `4px` |
| `--rte-swatch-selected-ring` | `entry` | no | Default: `0 0 0 2px var(--rte-color-accent)` |
| `--rte-swatch-size` | `entry` | no | Default: `24px` |
| `--rte-table-border` | `entry` | no | Default: `1px solid var(--rte-color-border-subtle)` |
| `--rte-table-header-bg` | `entry` | no | Default: `#FAFAFA` |
| `--rte-toolbar-bg` | `entry` | no | Default: `transparent` |
| `--rte-toolbar-border` | `entry` | no | Default: `none` |
| `--rte-toolbar-gap` | `entry` | no | Default: `0px` |
| `--rte-toolbar-margin-bottom` | `entry` | no | Default: `8px` |
| `--rte-toolbar-padding` | `entry` | no | Default: `0` |
| `--rte-toolbar-radius` | `entry` | no | Default: `4px` |
| `--rte-toolbar-separator` | `entry` | no | Default: `var(--rte-color-border-subtle)` |
| `--rte-toolbar-separator-margin` | `entry` | no | Default: `4px` |
| `--rte-z-floating` | `entry` | no | Default: `1450` |
| `--rte-z-fullscreen` | `entry` | no | Default: `1400` |
| `--rte-z-popover` | `entry` | no | Default: `1500` |

## Source

- [Theme tokens](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/src/meta.ts)

---

# Icon set

> All 52 icons the toolbar and menus draw from, and how to replace one of them.

Reference · https://react-rtekit.vercel.app/react-rtekit/api/icons/

## Used by

- [Icons](https://react-rtekit.vercel.app/react-rtekit/icons/)

## Import

```ts
import { meta } from 'react-rtekit/meta';
```

## Options

Every icon the editor draws, keyed by name. Supply a replacement by passing a component for that name to `icons`; it receives the same props as the built-in, which renders a 24×24 SVG that inherits `currentColor`.

| Name | Type | Required | Description |
|---|---|---|---|
| `alert` | `string` | no | A triangle with an exclamation mark, for error and warning messages. |
| `align` | `string` | no | Alternating long and short lines, the alignment menu trigger. |
| `alignCenter` | `string` | no | Stacked lines centred on the axis. |
| `alignJustify` | `string` | no | Stacked lines of equal length, flush on both sides. |
| `alignLeft` | `string` | no | Stacked lines flush left, ragged right. |
| `alignRight` | `string` | no | Stacked lines flush right, ragged left. |
| `backgroundColor` | `string` | no | A marker pen over a colour bar, for the highlight picker. |
| `blockType` | `string` | no | A capital H, the same glyph as `heading`, opening the block-type menu. |
| `blockquote` | `string` | no | A pair of quotation marks. |
| `bold` | `string` | no | A bold capital B. |
| `bulletList` | `string` | no | Three lines, each preceded by a dot. |
| `check` | `string` | no | A tick, marking the selected item in a menu. |
| `checkList` | `string` | no | Three lines, each preceded by a tick box. |
| `chevronDown` | `string` | no | A solid triangle pointing down, on a control that opens a menu below it. |
| `chevronRight` | `string` | no | A solid triangle pointing right, on a control that expands in place. |
| `clearFormatting` | `string` | no | A letterform with a diagonal slash through it. |
| `close` | `string` | no | A cross, dismissing a popover or a panel. |
| `code` | `string` | no | Angle brackets, for inline code. |
| `codeBlock` | `string` | no | Angle brackets in a frame, for a fenced code block. |
| `color` | `string` | no | A capital A over a colour bar, for the text-colour picker. |
| `dragHandle` | `string` | no | Two columns of dots, the grip on a draggable block. |
| `emoji` | `string` | no | A smiling face, opening the emoji picker. |
| `exitFullscreen` | `string` | no | Four arrows pointing inward, leaving fullscreen. |
| `external` | `string` | no | An arrow leaving a box, marking a link that opens elsewhere. |
| `findReplace` | `string` | no | A magnifier beside a curved arrow. |
| `fontFamily` | `string` | no | A capital A, the typeface menu trigger. |
| `fontSize` | `string` | no | Two capital As of different sizes, the size menu trigger. |
| `fullscreen` | `string` | no | Four arrows pointing outward, entering fullscreen. |
| `heading` | `string` | no | A capital H. |
| `horizontalRule` | `string` | no | A single horizontal line, inserting a divider. |
| `image` | `string` | no | A picture frame with a mountain range inside. |
| `indent` | `string` | no | Lines with an arrow pointing right, increasing the indent. |
| `italic` | `string` | no | A slanted capital I. |
| `link` | `string` | no | Two interlocking chain links. |
| `mention` | `string` | no | An at sign, opening the mention menu. |
| `mergeTag` | `string` | no | A pair of braces, inserting a merge tag. |
| `more` | `string` | no | Three dots in a row, opening the items the toolbar could not fit. |
| `orderedList` | `string` | no | Three lines, each preceded by a number. |
| `outdent` | `string` | no | Lines with an arrow pointing left, decreasing the indent. |
| `print` | `string` | no | A printer. |
| `redo` | `string` | no | An arrow curving forward. |
| `search` | `string` | no | A magnifier. |
| `sourceView` | `string` | no | Angle brackets, the same glyph as `code`, switching to the HTML source. |
| `spinner` | `string` | no | A broken ring, drawn rotating while something is in flight. |
| `strike` | `string` | no | A letterform struck through by a horizontal rule. |
| `subscript` | `string` | no | A capital X with a small figure below the baseline. |
| `superscript` | `string` | no | A capital X with a small figure above the line. |
| `table` | `string` | no | A grid of cells. |
| `underline` | `string` | no | A capital U above a rule. |
| `undo` | `string` | no | An arrow curving back. |
| `unlink` | `string` | no | A broken chain link, removing a link. |
| `wordCount` | `string` | no | Four lines of alternating length, for the counter in the footer. |

## Source

- [Icon set](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/src/meta.ts)

---

# Localization keys

> All 153 catalogue keys, for translating the editor's own strings.

Reference · https://react-rtekit.vercel.app/react-rtekit/api/localization-keys/

## Used by

- [Localization](https://react-rtekit.vercel.app/react-rtekit/localization/)

## Import

```ts
import { meta } from 'react-rtekit/meta';
```

## Options

Every string the editor can show, including the `aria-label`s and the live-region announcements — nothing is hard-coded in a component. A catalogue is a partial object: supply only the keys you want to change and the rest fall back to English.

| Name | Type | Required | Description |
|---|---|---|---|
| `announce.draftRestored` | `string` | no | Default: `Draft restored` |
| `announce.findResults` | `string` | no | Default: a function returning `{count} results`. |
| `announce.formatApplied` | `string` | no | Default: a function returning `{format} applied`. |
| `announce.formatRemoved` | `string` | no | Default: a function returning `{format} removed`. |
| `announce.imageInserted` | `string` | no | Default: `Image inserted` |
| `announce.linkInserted` | `string` | no | Default: `Link inserted` |
| `announce.linkRemoved` | `string` | no | Default: `Link removed` |
| `announce.listLevel` | `string` | no | Default: a function returning `List level {level}`. |
| `announce.overLimit` | `string` | no | Default: `You have reached the character limit` |
| `color.apply` | `string` | no | Default: `Apply` |
| `color.automatic` | `string` | no | Default: `Automatic` |
| `color.custom` | `string` | no | Default: `Custom colour` |
| `color.recent` | `string` | no | Default: `Recent` |
| `color.reset` | `string` | no | Default: `Reset` |
| `color.swatch` | `string` | no | Default: a function returning `Colour {color}`. |
| `color.title` | `string` | no | Default: `Text colour` |
| `counter.characters` | `string` | no | Default: a function returning `{count} characters`. |
| `counter.limit` | `string` | no | Default: a function returning `{count} / {max}`. |
| `counter.overLimit` | `string` | no | Default: `Over the limit` |
| `counter.words` | `string` | no | Default: a function returning `{count} words`. |
| `dir` | `string` | no | Default: `ltr` |
| `draft.discard` | `string` | no | Default: `Discard` |
| `draft.restore` | `string` | no | Default: `Restore` |
| `draft.restoreBody` | `string` | no | Default: a function returning `Saved {time}`. |
| `draft.restoreTitle` | `string` | no | Default: `Unsaved draft found` |
| `editor.empty` | `string` | no | Default: `Empty` |
| `editor.label` | `string` | no | Default: `Rich text editor` |
| `editor.placeholder` | `string` | no | Default: `Write something…` |
| `emoji.noResults` | `string` | no | Default: `No emoji found` |
| `emoji.search` | `string` | no | Default: `Search emoji` |
| `emoji.title` | `string` | no | Default: `Emoji` |
| `find.close` | `string` | no | Default: `Close` |
| `find.find` | `string` | no | Default: `Find` |
| `find.matchCase` | `string` | no | Default: `Match case` |
| `find.next` | `string` | no | Default: `Next match` |
| `find.noResults` | `string` | no | Default: `No results` |
| `find.previous` | `string` | no | Default: `Previous match` |
| `find.regex` | `string` | no | Default: `Regular expression` |
| `find.replace` | `string` | no | Default: `Replace` |
| `find.replaceAll` | `string` | no | Default: `Replace all` |
| `find.results` | `string` | no | Default: a function returning `{index} of {total}`. |
| `find.title` | `string` | no | Default: `Find and replace` |
| `find.wholeWord` | `string` | no | Default: `Whole word` |
| `image.alignCenter` | `string` | no | Default: `Align centre` |
| `image.alignLeft` | `string` | no | Default: `Align left` |
| `image.alignRight` | `string` | no | Default: `Align right` |
| `image.alt` | `string` | no | Default: `Alt text` |
| `image.cancel` | `string` | no | Default: `Cancel` |
| `image.caption` | `string` | no | Default: `Caption` |
| `image.decorative` | `string` | no | Default: `Decorative (no alt text)` |
| `image.insert` | `string` | no | Default: `Insert` |
| `image.invalidUrl` | `string` | no | Default: `Enter a valid image URL` |
| `image.remove` | `string` | no | Default: `Remove` |
| `image.replace` | `string` | no | Default: `Replace` |
| `image.resize` | `string` | no | Default: `Drag to resize` |
| `image.retry` | `string` | no | Default: `Retry` |
| `image.title` | `string` | no | Default: `Image` |
| `image.tooLarge` | `string` | no | Default: a function returning `File is too large. Max {size}`. |
| `image.upload` | `string` | no | Default: `Upload` |
| `image.uploadFailed` | `string` | no | Default: `Upload failed` |
| `image.uploading` | `string` | no | Default: `Uploading…` |
| `image.url` | `string` | no | Default: `Image URL` |
| `image.width` | `string` | no | Default: `Width` |
| `image.wrongType` | `string` | no | Default: `That file type is not allowed` |
| `link.apply` | `string` | no | Default: `Apply` |
| `link.invalidUrl` | `string` | no | Default: `Enter a valid URL` |
| `link.newTab` | `string` | no | Default: `Open in new tab` |
| `link.open` | `string` | no | Default: `Open` |
| `link.remove` | `string` | no | Default: `Remove` |
| `link.text` | `string` | no | Default: `Text` |
| `link.title` | `string` | no | Default: `Link` |
| `link.url` | `string` | no | Default: `URL` |
| `locale` | `string` | no | Default: `en` |
| `mention.loading` | `string` | no | Default: `Searching…` |
| `mention.noResults` | `string` | no | Default: `No matches` |
| `mention.search` | `string` | no | Default: `Search people` |
| `mergeTag.noResults` | `string` | no | Default: `No variables found` |
| `mergeTag.preview` | `string` | no | Default: `Preview values` |
| `mergeTag.search` | `string` | no | Default: `Search variables` |
| `mergeTag.title` | `string` | no | Default: `Variables` |
| `mergeTag.unknown` | `string` | no | Default: a function returning `Unknown variable {{key}}`. |
| `paste.keepFormatting` | `string` | no | Default: `Keep formatting` |
| `paste.removeFormatting` | `string` | no | Default: `Remove formatting` |
| `shortcuts.close` | `string` | no | Default: `Close` |
| `shortcuts.title` | `string` | no | Default: `Keyboard shortcuts` |
| `slash.noResults` | `string` | no | Default: `No commands found` |
| `slash.search` | `string` | no | Default: `Search commands` |
| `slash.title` | `string` | no | Default: `Insert` |
| `sourceView.apply` | `string` | no | Default: `Apply` |
| `sourceView.cancel` | `string` | no | Default: `Cancel` |
| `sourceView.invalid` | `string` | no | Default: `The HTML could not be parsed` |
| `sourceView.title` | `string` | no | Default: `HTML source` |
| `table.addColumnAfter` | `string` | no | Default: `Insert column right` |
| `table.addColumnBefore` | `string` | no | Default: `Insert column left` |
| `table.addRowAfter` | `string` | no | Default: `Insert row below` |
| `table.addRowBefore` | `string` | no | Default: `Insert row above` |
| `table.columns` | `string` | no | Default: `Columns` |
| `table.deleteColumn` | `string` | no | Default: `Delete column` |
| `table.deleteRow` | `string` | no | Default: `Delete row` |
| `table.deleteTable` | `string` | no | Default: `Delete table` |
| `table.headerRow` | `string` | no | Default: `Header row` |
| `table.insert` | `string` | no | Default: `Insert table` |
| `table.rows` | `string` | no | Default: `Rows` |
| `table.size` | `string` | no | Default: a function returning `{rows} × {columns}`. |
| `toolbar.align` | `string` | no | Default: `Alignment` |
| `toolbar.alignCenter` | `string` | no | Default: `Align centre` |
| `toolbar.alignJustify` | `string` | no | Default: `Justify` |
| `toolbar.alignLeft` | `string` | no | Default: `Align left` |
| `toolbar.alignRight` | `string` | no | Default: `Align right` |
| `toolbar.backgroundColor` | `string` | no | Default: `Highlight colour` |
| `toolbar.blockType` | `string` | no | Default: `Block type` |
| `toolbar.blockquote` | `string` | no | Default: `Quote` |
| `toolbar.bold` | `string` | no | Default: `Bold` |
| `toolbar.bulletList` | `string` | no | Default: `Bulleted list` |
| `toolbar.checkList` | `string` | no | Default: `Check list` |
| `toolbar.clearFormatting` | `string` | no | Default: `Clear formatting` |
| `toolbar.code` | `string` | no | Default: `Inline code` |
| `toolbar.codeBlock` | `string` | no | Default: `Code block` |
| `toolbar.color` | `string` | no | Default: `Text colour` |
| `toolbar.emoji` | `string` | no | Default: `Emoji` |
| `toolbar.exitFullscreen` | `string` | no | Default: `Exit fullscreen` |
| `toolbar.findReplace` | `string` | no | Default: `Find and replace` |
| `toolbar.fontFamily` | `string` | no | Default: `Font` |
| `toolbar.fontSize` | `string` | no | Default: `Font size` |
| `toolbar.fullscreen` | `string` | no | Default: `Fullscreen` |
| `toolbar.heading` | `string` | no | Default: `Heading` |
| `toolbar.headingLevel` | `string` | no | Default: a function returning `Heading {level}`. |
| `toolbar.horizontalRule` | `string` | no | Default: `Divider` |
| `toolbar.image` | `string` | no | Default: `Image` |
| `toolbar.indent` | `string` | no | Default: `Increase indent` |
| `toolbar.italic` | `string` | no | Default: `Italic` |
| `toolbar.label` | `string` | no | Default: `Formatting` |
| `toolbar.link` | `string` | no | Default: `Link` |
| `toolbar.mention` | `string` | no | Default: `Mention` |
| `toolbar.mergeTag` | `string` | no | Default: `Insert variable` |
| `toolbar.more` | `string` | no | Default: `More options` |
| `toolbar.orderedList` | `string` | no | Default: `Numbered list` |
| `toolbar.outdent` | `string` | no | Default: `Decrease indent` |
| `toolbar.paragraph` | `string` | no | Default: `Paragraph` |
| `toolbar.print` | `string` | no | Default: `Print` |
| `toolbar.redo` | `string` | no | Default: `Redo` |
| `toolbar.sourceView` | `string` | no | Default: `HTML source` |
| `toolbar.strike` | `string` | no | Default: `Strikethrough` |
| `toolbar.subscript` | `string` | no | Default: `Subscript` |
| `toolbar.superscript` | `string` | no | Default: `Superscript` |
| `toolbar.table` | `string` | no | Default: `Table` |
| `toolbar.underline` | `string` | no | Default: `Underline` |
| `toolbar.undo` | `string` | no | Default: `Undo` |
| `toolbar.unlink` | `string` | no | Default: `Remove link` |
| `toolbar.wordCount` | `string` | no | Default: `Word count` |
| `validation.invalidHtml` | `string` | no | Default: `The HTML could not be parsed` |
| `validation.maxLength` | `string` | no | Default: a function returning `Must be {max} characters or fewer`. |
| `validation.required` | `string` | no | Default: `This field is required` |

## Source

- [Localization keys](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/src/meta.ts)

---

# Plugin catalogue

> Every built-in plugin and the presets it appears in.

Reference · https://react-rtekit.vercel.app/react-rtekit/api/plugins/

## Used by

- [Markdown shortcuts](https://react-rtekit.vercel.app/react-rtekit/markdown-shortcuts/)
- [Presets](https://react-rtekit.vercel.app/react-rtekit/presets/)

## Import

```ts
import { meta } from 'react-rtekit/meta';
```

## Options

Every plugin the package ships, and the presets that load each one. A preset is a list of these names; pass `plugins` yourself to load a different set. Loading a plugin is what turns its capability on — the toolbar item alone does nothing.

| Name | Type | Required | Description |
|---|---|---|---|
| `align` | `entry` | no | In presets: classic, email, full, standard. |
| `backgroundColor` | `entry` | no | In presets: full. |
| `blockquote` | `entry` | no | In presets: email, full, standard. |
| `bold` | `entry` | no | In presets: classic, comment, email, full, minimal, standard. |
| `checkList` | `entry` | no | In presets: full. |
| `clearFormatting` | `entry` | no | In presets: email, full, standard. |
| `code` | `entry` | no | In presets: comment, full. |
| `codeBlock` | `entry` | no | In presets: full. |
| `color` | `entry` | no | In presets: classic, email, full, standard. |
| `counter` | `entry` | no | In presets: email, full, standard. |
| `emoji` | `entry` | no | In presets: comment. |
| `findReplace` | `entry` | no | In presets: full. |
| `floatingToolbar` | `entry` | no | In presets: full. |
| `fontFamily` | `entry` | no | In presets: email, full. |
| `fontSize` | `entry` | no | In presets: email, full. |
| `fullscreen` | `entry` | no | In presets: full. |
| `heading` | `entry` | no | In presets: email, full, standard. |
| `history` | `entry` | no | In presets: classic, comment, email, full, minimal, standard. |
| `horizontalRule` | `entry` | no | In presets: email, full. |
| `image` | `entry` | no | In presets: email, full. |
| `indent` | `entry` | no | In presets: email, full, standard. |
| `italic` | `entry` | no | In presets: classic, comment, email, full, minimal, standard. |
| `link` | `entry` | no | In presets: comment, email, full, minimal, standard. |
| `list` | `entry` | no | In presets: classic, comment, email, full, standard. |
| `markdownShortcuts` | `entry` | no | In presets: email, full, standard. |
| `mention` | `entry` | no | In presets: comment. |
| `mergeTag` | `entry` | no | In presets: email, full. |
| `paragraph` | `entry` | no | In presets: classic, comment, email, full, minimal, standard. |
| `paste` | `entry` | no | In presets: classic, comment, email, full, standard. |
| `placeholder` | `entry` | no | In presets: classic, comment, email, full, minimal, standard. |
| `slashMenu` | `entry` | no | In presets: full. |
| `sourceView` | `entry` | no | In presets: full. |
| `strike` | `entry` | no | In presets: comment, email, full, standard. |
| `subSup` | `entry` | no | In presets: full. |
| `table` | `entry` | no | In presets: full. |
| `trailingParagraph` | `entry` | no | In presets: email, full, standard. |
| `underline` | `entry` | no | In presets: classic, email, full, minimal, standard. |

## Source

- [Plugin catalogue](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/src/meta.ts)

---

# Types

> The exported types you annotate with: values, documents, themes, slots, handlers and configuration.

Reference · https://react-rtekit.vercel.app/react-rtekit/api/types/

## Used by

- [Value formats](https://react-rtekit.vercel.app/react-rtekit/value-formats/)
- [Text formatting](https://react-rtekit.vercel.app/react-rtekit/text-formatting/)
- [Headings](https://react-rtekit.vercel.app/react-rtekit/headings/)
- [Lists](https://react-rtekit.vercel.app/react-rtekit/lists/)
- [Check lists](https://react-rtekit.vercel.app/react-rtekit/check-lists/)
- [Blockquotes](https://react-rtekit.vercel.app/react-rtekit/blockquotes/)
- [Code blocks](https://react-rtekit.vercel.app/react-rtekit/code-blocks/)
- [Dividers](https://react-rtekit.vercel.app/react-rtekit/dividers/)
- [Subscript & superscript](https://react-rtekit.vercel.app/react-rtekit/subscript-and-superscript/)
- [Clear formatting](https://react-rtekit.vercel.app/react-rtekit/clear-formatting/)
- [Undo & redo](https://react-rtekit.vercel.app/react-rtekit/history/)
- [Colours](https://react-rtekit.vercel.app/react-rtekit/colours/)
- [Fonts](https://react-rtekit.vercel.app/react-rtekit/fonts/)
- [Alignment](https://react-rtekit.vercel.app/react-rtekit/alignment/)
- [Indentation](https://react-rtekit.vercel.app/react-rtekit/indentation/)
- [Tables](https://react-rtekit.vercel.app/react-rtekit/tables/)
- [Emoji](https://react-rtekit.vercel.app/react-rtekit/emoji/)
- [Commands](https://react-rtekit.vercel.app/react-rtekit/commands/)
- [Find & replace](https://react-rtekit.vercel.app/react-rtekit/find-and-replace/)
- [Images & uploads](https://react-rtekit.vercel.app/react-rtekit/images/)
- [Links](https://react-rtekit.vercel.app/react-rtekit/links/)
- [Paste clean-up](https://react-rtekit.vercel.app/react-rtekit/paste-cleanup/)
- [Mentions](https://react-rtekit.vercel.app/react-rtekit/mentions/)
- [Handler middleware](https://react-rtekit.vercel.app/react-rtekit/handler-middleware/)
- [Icons](https://react-rtekit.vercel.app/react-rtekit/icons/)
- [Localization](https://react-rtekit.vercel.app/react-rtekit/localization/)
- [Keyboard shortcuts](https://react-rtekit.vercel.app/react-rtekit/keyboard-shortcuts/)
- [Plugin authoring](https://react-rtekit.vercel.app/react-rtekit/plugin-authoring/)
- [Slots](https://react-rtekit.vercel.app/react-rtekit/slots/)
- [Theming](https://react-rtekit.vercel.app/react-rtekit/theming/)
- [Sanitization](https://react-rtekit.vercel.app/react-rtekit/sanitization/)
- [E-mail output](https://react-rtekit.vercel.app/react-rtekit/email-output/)
- [Toolbar](https://react-rtekit.vercel.app/react-rtekit/toolbar/)
- [Selection toolbar](https://react-rtekit.vercel.app/react-rtekit/selection-toolbar/)
- [Slash menu](https://react-rtekit.vercel.app/react-rtekit/slash-menu/)

## Import

```ts
import { ChangeMeta } from 'react-rtekit';
import { CommandId } from 'react-rtekit';
import { EditorDocument } from 'react-rtekit';
import { EditorValue } from 'react-rtekit';
import { FindOptions } from 'react-rtekit';
import { FormatState } from 'react-rtekit';
import { ImageAttrs } from 'react-rtekit';
import { LinkAttrs } from 'react-rtekit';
import { RteHandlers } from 'react-rtekit';
import { RteIcons } from 'react-rtekit';
import { RteLocalization } from 'react-rtekit';
import { RtePlugin } from 'react-rtekit';
import { RteSlots } from 'react-rtekit';
import { RteTheme } from 'react-rtekit';
import { SanitizeConfig } from 'react-rtekit';
import { SanitizeProfileName } from 'react-rtekit';
import { TableOptions } from 'react-rtekit';
import { ToolbarItemSpec } from 'react-rtekit';
import { UploadHandler } from 'react-rtekit';
```

## Options

### ChangeMeta

Metadata passed alongside every `onChange`.

| Name | Type | Required | Description |
|---|---|---|---|
| `source` | `ChangeSource` | yes | What caused the change, which is what keeps a controlled parent from looping. |
| `isEmpty` | `boolean` | yes | True for content that only looks non-empty, such as `<p><br></p>` (fixes R2). |
| `length` | `number` | yes | Length in the configured `countUnit`. |
| `wordCount` | `number` | yes | Words in the document, whatever `countUnit` is set to. |
| `document` | `EditorDocument` | yes | Lazily built — the getter only runs if the consumer reads it. |

### CommandId

Every known command id.

This symbol takes no options.

### EditorDocument

A whole document.

| Name | Type | Required | Description |
|---|---|---|---|
| `type` | `"doc"` | yes | Discriminator. |
| `version` | `1` | yes | Schema version, so stored documents can be migrated rather than guessed at. |
| `content` | `BlockNode[]` | yes | The document's top-level blocks. |

### EditorValue

A value in the currently configured ValueFormat.

This symbol takes no options.

### FindOptions

Find & replace options.

| Name | Type | Required | Description |
|---|---|---|---|
| `matchCase` | `boolean` | no | Match the query's case. |
| `wholeWord` | `boolean` | no | Only match whole words. |
| `regex` | `boolean` | no | Treat the query as a regular expression. |
| `backwards` | `boolean` | no | Search backwards from the current match. |

### FormatState

The formatting that applies to the current selection.

A value-carrying mark is `null` when the selection is mixed, so a toolbar can render
an indeterminate state rather than lying about one of the values.

| Name | Type | Required | Description |
|---|---|---|---|
| `marks` | `object` | yes | Inline formatting; a value mark is `null` when the selection is mixed. |
| `block` | `object` | yes | The block the caret is in, and how it is laid out. |
| `list` | `object` | yes | The list the caret is in, if any, and how deeply nested it is. |
| `link` | `LinkAttrs \| null` | yes | The link the caret is inside, or `null`. |
| `canUndo` | `boolean` | yes | Whether there is anything to undo, which disables the control. |
| `canRedo` | `boolean` | yes | Whether there is anything to redo. |
| `isEmpty` | `boolean` | yes | Whether the document is empty in the `isEmpty` sense (fixes R2). |
| `isCollapsed` | `boolean` | yes | Whether the selection is a caret rather than a range. |

### ImageAttrs

Image attributes as stored on an image node.

| Name | Type | Required | Description |
|---|---|---|---|
| `src` | `string` | yes | The source, sanitized before it reaches the document. |
| `alt` | `string` | no | Alternative text; an empty string marks the image as decorative and is kept. |
| `title` | `string` | no | The image's advisory title. |
| `width` | `number` | no | Intrinsic width in pixels. |
| `height` | `number` | no | Intrinsic height in pixels. |
| `align` | `Align` | no | How the image sits in the flow. |
| `caption` | `string` | no | The caption, which serializes as a `<figure>` with a `<figcaption>`. |

### LinkAttrs

Link attributes as stored on a link node and edited in the link popover.

| Name | Type | Required | Description |
|---|---|---|---|
| `href` | `string` | yes | The destination. Sanitized before it reaches the document. |
| `text` | `string` | no | The link text, used when creating a link at a collapsed caret. |
| `target` | `string` | no | Where the link opens. |
| `rel` | `string` | no | The relationship, which gains `noopener noreferrer` for `_blank`. |
| `title` | `string` | no | The anchor's advisory title. |

### RteHandlers

The overridable interaction surface.

Each handler is `(ctx, next) => void`. Call `next()` (optionally with a partial
context override) to run the built-in behaviour; skip it to cancel.

| Name | Type | Required | Description |
|---|---|---|---|
| `onBeforeChange` | `Middleware<BeforeChangeContext>` | yes | Wraps every content change; skipping `next()` vetoes it. |
| `onPaste` | `Middleware<PasteHandlerContext>` | yes | Wraps every paste, including the sanitization that follows it. |
| `onDrop` | `Middleware<DropHandlerContext>` | yes | Wraps every drop onto the content element. |
| `onUploadStart` | `Middleware<UploadStartContext>` | yes | Wraps each upload before the file leaves the browser. |
| `onUploadError` | `Middleware<UploadErrorContext>` | yes | Wraps the reporting of a rejected or failed upload. |
| `onKeyDown` | `Middleware<KeyDownContext>` | yes | Wraps every keydown, before the keymap acts on it. |
| `onLinkClick` | `Middleware<LinkClickContext>` | yes | Wraps a click on a link inside the content. |
| `onLinkOpen` | `Middleware<LinkOpenContext>` | yes | Wraps following a link, which is where a confirmation belongs. |
| `onToolbarCommand` | `Middleware<ToolbarCommandContext>` | yes | Wraps every toolbar activation, which is where analytics belongs. |
| `onFocus` | `Middleware<FocusHandlerContext>` | yes | Wraps focus entering the editor. |
| `onBlur` | `Middleware<FocusHandlerContext>` | yes | Wraps focus leaving the editor (fixes R9). |
| `onSelectionChange` | `Middleware<SelectionChangeContext>` | yes | Wraps every selection change. |
| `onMaxLengthExceeded` | `Middleware<MaxLengthContext>` | yes | Wraps what happens when input would pass `maxLength`. |
| `onSanitizeViolation` | `Middleware<SanitizeViolationContext>` | yes | Wraps the reporting of something the sanitizer refused. |
| `onFullscreenChange` | `Middleware<OpenStateContext>` | yes | Wraps entering and leaving fullscreen. |
| `onSourceViewToggle` | `Middleware<OpenStateContext>` | yes | Wraps opening and closing the HTML source view. |
| `onDraftRestore` | `Middleware<DraftContext>` | yes | Wraps restoring an autosaved draft. |
| `onDraftSave` | `Middleware<DraftContext>` | yes | Wraps writing an autosave draft. |

### RteIcons

Replaceable icons.

Defaults are in-house 24px inline SVGs drawn with `currentColor`, sized from
`--rte-icon-size`, so no icon package is ever pulled into a consumer's bundle.

This symbol takes no options.

### RteLocalization

The full message catalogue.

| Name | Type | Required | Description |
|---|---|---|---|
| `locale` | `string` | yes | BCP-47 tag of this catalogue, e.g. `'en'`. |
| `dir` | `"ltr" \| "rtl"` | yes | Writing direction of this locale. |
| `editor` | `object` | yes | The field itself: its default name, its placeholder and its empty announcement. |
| `toolbar` | `object` | yes | Every toolbar control, used as both the tooltip and the accessible name. |
| `color` | `object` | yes | The colour picker. |
| `link` | `object` | yes | The link popover. |
| `image` | `object` | yes | The image dialog, the upload placeholder and the image controls. |
| `table` | `object` | yes | The table picker and the table controls. |
| `mergeTag` | `object` | yes | The merge-tag menu and its validation messages. |
| `mention` | `object` | yes | The mention menu, including its loading and empty states. |
| `slash` | `object` | yes | The slash-command palette. |
| `emoji` | `object` | yes | The emoji picker. |
| `find` | `object` | yes | The find-and-replace panel. |
| `counter` | `object` | yes | The character and word counter. |
| `validation` | `object` | yes | The built-in validation messages. |
| `draft` | `object` | yes | The prompt offering to restore an autosaved draft. |
| `shortcuts` | `object` | yes | The keyboard reference dialog. |
| `paste` | `object` | yes | The prompt shown after a rich office paste. |
| `sourceView` | `object` | yes | The HTML source view. |
| `announce` | `object` | yes | Everything sent to the editor's polite live region. |
| `custom` | `Record<string, LocalizedString>` | yes | Keys contributed by plugins live here, flat and dot-separated. |

### RtePlugin

A plugin.

Every built-in feature is one of these, which is what makes `enableX` props,
presets and third-party extensions the same mechanism.

| Name | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | yes | Unique id. Duplicate names are de-duplicated, last registration winning. |
| `dependsOn` | `string[]` | no | Names of plugins that must be set up first. |
| `provides` | `string[]` | no | Feature ids this plugin adds to the active schema. Defaults to `[name]`. |
| `setup` | `object` | no | Runs once on mount; anything it returns is called on teardown. |
| `commands` | `Partial<Record<CommandId, CommandHandler>>` | no | Command handlers, added to the chains of the ids they name. |
| `nodes` | `NodeSpec[]` | no | Custom node types this plugin introduces. |
| `marks` | `MarkSpec[]` | no | Custom inline marks this plugin introduces. |
| `keymap` | `Record<string, CommandId \| function>` | no | `'Mod+B'` style bindings. A string value is a command id. |
| `toolbar` | `ToolbarItemSpec[]` | no | Controls this plugin contributes to the toolbar. |
| `slashItems` | `SlashItemSpec[]` | no | Entries this plugin contributes to the slash palette. |
| `serialize` | `PluginSerializers` | no | Serializer rules, in both directions, so the markup round-trips. |
| `sanitize` | `PluginSanitizeRules` | no | Sanitizer additions, so the markup survives input. |
| `ui` | `ComponentType` | no | Rendered inside the editor root; the home of popovers and menus. |
| `localization` | `Record<string, string>` | no | Extra localization keys, merged under `custom`. |
| `theme` | `object` | no | Extra theme tokens. |
| `options` | `Options` | no | Default options for this plugin. |
| `priority` | `number` | no | Higher runs its command handlers later, so it wins. |

### RteSlots

Every replaceable component.

The last dozen entries are primitives; overriding just those re-skins the whole
editor for a design system.

| Name | Type | Required | Description |
|---|---|---|---|
| `Root` | `SlotComponent<RootSlotProps>` | yes | The outermost element, carrying every state attribute the CSS keys off. |
| `Toolbar` | `SlotComponent<ToolbarSlotProps>` | yes | The toolbar container, including its roving-tabindex keyboard model. |
| `ToolbarGroup` | `SlotComponent<Record<string, never>>` | yes | One group of toolbar items. |
| `ToolbarSeparator` | `SlotComponent<Record<string, never>>` | yes | The divider drawn between toolbar groups. |
| `ToolbarButton` | `SlotComponent<ToolbarButtonSlotProps>` | yes | A toolbar control that performs an action. |
| `ToolbarToggle` | `SlotComponent<ToolbarButtonSlotProps>` | yes | A toolbar control that reflects a format, with `aria-pressed`. |
| `ToolbarDropdown` | `SlotComponent<ToolbarDropdownSlotProps>` | yes | A toolbar control that opens a list of options. |
| `ToolbarOverflow` | `SlotComponent<object>` | yes | The menu holding the items that did not fit at this width. |
| `ColorPicker` | `SlotComponent<ColorPickerSlotProps>` | yes | The colour palette shown by the text- and background-colour controls. |
| `ContentWrapper` | `SlotComponent<Record<string, never>>` | yes | The box around the content, which is what scrolls and grows. |
| `Content` | `SlotComponent<ContentSlotProps>` | yes | The contenteditable surface itself. |
| `Placeholder` | `SlotComponent<object>` | yes | The placeholder shown over an empty document. |
| `Label` | `SlotComponent<object>` | yes | The field label. |
| `HelperText` | `SlotComponent<object>` | yes | The description below the field. |
| `ErrorText` | `SlotComponent<object>` | yes | The validation message, announced when it appears. |
| `Counter` | `SlotComponent<CounterSlotProps>` | yes | The character or word counter. |
| `Footer` | `SlotComponent<Record<string, never>>` | yes | The row below the content that holds the helper text and the counter. |
| `LinkPopover` | `SlotComponent<LinkPopoverSlotProps>` | yes | The popover for creating and editing links. |
| `ImageDialog` | `SlotComponent<Record<string, unknown>>` | yes | The dialog for inserting an image by URL or by file. |
| `ImagePopover` | `SlotComponent<Record<string, unknown>>` | yes | The controls shown when an image is selected. |
| `UploadPlaceholder` | `SlotComponent<UploadPlaceholderSlotProps>` | yes | The stand-in shown while a file uploads. |
| `TablePicker` | `SlotComponent<object>` | yes | The grid for choosing the size of a new table. |
| `TableToolbar` | `SlotComponent<Record<string, unknown>>` | yes | The controls shown when the caret is inside a table. |
| `InlineSuggestMenu` | `SlotComponent<InlineSuggestMenuSlotProps<unknown>>` | yes | The shared popover behind the slash, mention, emoji and merge-tag menus. |
| `MergeTagChip` | `SlotComponent<object>` | yes | One merge tag as it appears inside the document. |
| `SlashMenu` | `SlotComponent<InlineSuggestMenuSlotProps<unknown>>` | yes | The command palette opened by `/`. |
| `EmojiPicker` | `SlotComponent<InlineSuggestMenuSlotProps<unknown>>` | yes | The emoji picker. |
| `MentionList` | `SlotComponent<InlineSuggestMenuSlotProps<unknown>>` | yes | The mention results, including their loading and empty states. |
| `FloatingToolbar` | `SlotComponent<object>` | yes | The toolbar that follows the selection. |
| `BubbleMenu` | `SlotComponent<object>` | yes | The bubble menu shown above a non-empty selection. |
| `FindReplacePanel` | `SlotComponent<FindReplacePanelSlotProps>` | yes | The find-and-replace panel. |
| `SourceView` | `SlotComponent<SourceViewSlotProps>` | yes | The HTML source editor. |
| `FullscreenPortal` | `SlotComponent<object>` | yes | The container the editor moves into in fullscreen mode. |
| `RestoreDraftPrompt` | `SlotComponent<RestoreDraftPromptSlotProps>` | yes | The prompt offering to restore an autosaved draft. |
| `ShortcutHelpDialog` | `SlotComponent<object>` | yes | The keyboard reference, built from the keymap actually in force. |
| `Tooltip` | `SlotComponent<object>` | yes | Wraps a control with its hover and focus description. |
| `Menu` | `SlotComponent<object>` | yes | A menu surface with its own focus management. |
| `MenuItem` | `SlotComponent<object>` | yes | One row of a RteSlots.Menu. |
| `Popover` | `SlotComponent<object>` | yes | A positioned surface anchored to an element, closing on Escape and outside click. |
| `Dialog` | `SlotComponent<object>` | yes | A modal surface that traps focus and returns it to the trigger. |
| `Button` | `SlotComponent<object>` | yes | A labelled button. |
| `IconButton` | `SlotComponent<object>` | yes | A button whose label is not visible and so must be given to assistive technology. |
| `TextInput` | `SlotComponent<object>` | yes | A single-line text field. |
| `Select` | `SlotComponent<object>` | yes | A single-choice control. |
| `Checkbox` | `SlotComponent<object>` | yes | A two-state control with a visible label. |
| `Spinner` | `SlotComponent<object>` | yes | The busy indicator, used while uploads and async providers are pending. |

### RteTheme

The token tree. Every field is optional in overrides via `DeepPartial`.

| Name | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | yes | Identifies the theme in `data-theme` and in the docs site. |
| `font` | `object` | yes | The chrome's typography, which is separate from the content's. |
| `color` | `object` | yes | The palette every other group draws from. |
| `editor` | `object` | yes | The content box: its size, its border and its focus ring. |
| `toolbar` | `object` | yes | The toolbar strip. |
| `button` | `object` | yes | Toolbar controls, in each of their states. |
| `popover` | `object` | yes | Every floating surface. |
| `menu` | `object` | yes | Menu rows. |
| `colorPicker` | `object` | yes | The swatch grid. |
| `footer` | `object` | yes | The row below the content holding the helper text and the counter. |
| `helper` | `object` | yes | The helper text. |
| `counter` | `object` | yes | The counter, in each of its three states. |
| `mergeTag` | `object` | yes | Merge-tag chips inside the content. |
| `mention` | `object` | yes | Mention chips inside the content. |
| `selection` | `object` | yes | The selection highlight. |
| `findMatch` | `object` | yes | Search-match highlights, current and otherwise. |
| `content` | `object` | yes | Prose styles, shipped separately so stored content renders identically anywhere. |
| `motion` | `object` | yes | Transition timing, which `prefers-reduced-motion` overrides to none. |
| `z` | `object` | yes | Stacking, so the editor can sit inside an application's own layers. |
| `density` | `Density` | yes | A multiplier over sizes and paddings, so it composes with any theme. |

### SanitizeConfig

Fine-grained sanitizer configuration.

Anything omitted falls back to the profile the config is merged onto (`standard` by
default). The hard rules cannot be re-enabled from here.

| Name | Type | Required | Description |
|---|---|---|---|
| `allowTags` | `string[]` | no | Tag allowlist. Replaces the profile's list when given. |
| `allowAttributes` | `Record<string, string[]>` | no | Attribute allowlist per tag. The `'*'` key applies to every tag. |
| `allowStyles` | `string[]` | no | CSS property allowlist for inline `style`. |
| `allowClasses` | `string \| RegExp[]` | no | Class-name allowlist. Strings match exactly; regexes are tested against the name. |
| `allowProtocols` | `string[]` | no | URL scheme allowlist. |
| `allowDataUrls` | `boolean \| object` | no | Allow `data:` URLs, optionally restricted to specific MIME types. |
| `allowRelative` | `boolean` | no | Allow protocol-relative and path-relative URLs. |
| `linkRel` | `string` | no | `rel` forced onto links that open in a new tab. |
| `transform` | `function` | no | Per-element hook. Return the element, `null` to drop it, or `'unwrap'` to keep its children. |
| `onViolation` | `function` | no | Called for every removal. |

### SanitizeProfileName

One of the four shipped profiles.

This symbol takes no options.

### TableOptions

Options for `insertTable`.

| Name | Type | Required | Description |
|---|---|---|---|
| `headerRow` | `boolean` | no | Make the first row a header row. |
| `headerColumn` | `boolean` | no | Make the first column a header column. |
| `columnWidths` | `number[]` | no | Column widths as percentages, summing to 100. |

### ToolbarItemSpec

A toolbar item, whether built-in or contributed by a plugin.

| Name | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | yes | Unique within the toolbar. |
| `kind` | `"custom" \| "button" \| "toggle" \| "dropdown" \| "colorPicker" \| "emojiPicker" \| "separator"` | no | `button` (default), `toggle`, `dropdown`, `colorPicker`, `separator` or `custom`. |
| `icon` | `ReactNode \| function` | no | The control's icon, statically or derived from the current state. |
| `label` | `ReactNode \| function` | yes | The accessible name, and the visible one when labels are shown. |
| `shortcut` | `string` | no | Shown in the tooltip next to the label, e.g. `'Mod+B'`. |
| `command` | `CommandId` | no | Command run by default when the item is activated. |
| `payload` | `CommandPayload<CommandId>` | no | Payload for `command`. |
| `isActive` | `function` | no | Whether the control renders as pressed; the default reads `command`. |
| `isDisabled` | `function` | no | Whether the control renders as disabled; the default reads `canExec`. |
| `onClick` | `function` | no | Runs instead of `command` when the control is activated. |
| `options` | `ToolbarOption[] \| function` | no | Dropdown options; required for `kind: 'dropdown'`. |
| `value` | `function` | no | Current dropdown value. |
| `onSelect` | `function` | no | Runs when a dropdown option is chosen. |
| `render` | `function` | no | Fully custom rendering, bypassing the button slots. |
| `group` | `string` | no | Logical grouping used by the slash menu and the overflow menu. |
| `showIn` | `ToolbarItemSurface[]` | no | Surfaces this item may appear on. |
| `order` | `number` | no | Ordering hint inside a group; lower comes first. |
| `keywords` | `string[]` | no | Keywords used by slash-menu search. |

### UploadHandler

`onUpload` signature.

This symbol takes no options.

## Source

- [ChangeMeta](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/types/editor.ts#L18)
- [CommandId](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/types/commands.ts#L172)
- [EditorDocument](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/types/document.ts#L289)
- [EditorValue](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/types/common.ts#L30)
- [FindOptions](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/types/editor.ts#L54)
- [FormatState](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/types/selection.ts#L72)
- [ImageAttrs](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/types/commands.ts#L9)
- [LinkAttrs](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/types/selection.ts#L51)
- [RteHandlers](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/types/handlers.ts#L157)
- [RteIcons](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/types/icons.ts#L12)
- [RteLocalization](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/types/localization.ts#L24)
- [RtePlugin](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/types/plugin.ts#L90)
- [RteSlots](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/types/slots.ts#L294)
- [RteTheme](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/types/theme.ts#L18)
- [SanitizeConfig](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/types/sanitize.ts#L53)
- [SanitizeProfileName](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/types/sanitize.ts#L16)
- [TableOptions](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/types/commands.ts#L27)
- [ToolbarItemSpec](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/types/toolbar.ts#L90)
- [UploadHandler](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/types/config.ts#L164)

---

# How to customize

> The ten levels of customization, from a theme token to a fully headless editor, and how to pick the lowest one that does the job.

Customization · https://react-rtekit.vercel.app/react-rtekit/customization/

There are ten ways to change what the editor looks like and how it behaves. They are ordered here from least invasive to most, and the rule is to use the lowest one that does the job — each level leaves everything above it working.

1. **Theme tokens** — 114 CSS custom properties. Changes colour, size and spacing. [Theming & tokens](https://react-rtekit.vercel.app/react-rtekit/customization/theme-tokens/)
2. **`classNames`** — add your own class to any part, keeping the shipped one.
3. **`slotProps`** — pass props through to a part without replacing it.
4. **Toolbar config** — choose items, group them, decide the overflow. [Toolbar layout](https://react-rtekit.vercel.app/react-rtekit/customization/toolbar-layout/)
5. **Custom toolbar items** — add a control of your own, in the same shape as the built-ins.
6. **Slots** — replace a part with your component. [Overriding structure](https://react-rtekit.vercel.app/react-rtekit/customization/overriding-slots/)
7. **Handler middleware** — wrap, veto or replace a behaviour. [Handler middleware](https://react-rtekit.vercel.app/react-rtekit/handler-middleware/)
8. **Command overrides** — change what a command does. [Commands](https://react-rtekit.vercel.app/react-rtekit/commands/)
9. **Composable parts** — assemble the editor yourself. [Composable parts](https://react-rtekit.vercel.app/react-rtekit/composable-parts/)
10. **Headless** — `useEditor`, and you draw everything. [Headless](https://react-rtekit.vercel.app/react-rtekit/headless/)

Content styling — how the prose itself looks — is separate from all ten, because stored HTML has to render the same outside the editor. See [Content styles](https://react-rtekit.vercel.app/react-rtekit/customization/content-styles/).

---

# Theming & tokens

> Changing colours, sizes and radii with tokens, and building a theme that keeps its contrast.

Customization · https://react-rtekit.vercel.app/react-rtekit/customization/theme-tokens/

A theme is a plain object of tokens that becomes CSS custom properties on the editor's root. There is no CSS-in-JS: the properties are set once and the stylesheet reads them.

*Example: Theming* — the same source as under "Theming".

## Building one

`createTheme` merges your overrides onto a base, so you change what you care about and inherit the rest.

```tsx
import { createTheme, lightTheme } from 'react-rtekit';

const brand = createTheme(lightTheme, {
  color: { accent: '#6C4BF4' },
  editor: { radius: '12px' },
  toolbar: { background: 'transparent' },
});
```

## Contrast

Every shipped theme meets WCAG AA and a test enforces it. A theme you derive does not inherit that, so `meetsContrastAA` is exported:

```tsx
import { meetsContrastAA } from 'react-rtekit';

meetsContrastAA(brand.color.text, brand.color.surface); // true
```

The full token list is on the [theme tokens](https://react-rtekit.vercel.app/react-rtekit/api/theme-tokens/) reference page.

---

# Overriding structure

> Replacing a part with your own component without losing the behaviour that came with it.

Customization · https://react-rtekit.vercel.app/react-rtekit/customization/overriding-slots/

A slot is a component the editor renders instead of its own. There are 46 of them, from the root element down to a single toolbar button.

*Example: Custom slots* — the same source as under "Slots".

## The one rule

A slot receives props, and the behaviour lives in those props. Spread them back:

```tsx
<RichTextEditor
  slots={{
    ToolbarButton: ({ icon, label, ...rest }) => (
      <MyButton {...rest} aria-label={label}>{icon}</MyButton>
    ),
  }}
/>
```

Dropping them renders an empty shell — the part stops working rather than stops looking right. The `mousedown` prevention that keeps the editor's selection while a toolbar button is clicked arrives in exactly that way.

The full list is on the [slot catalogue](https://react-rtekit.vercel.app/react-rtekit/api/slots/) page.

---

# Toolbar layout

> Choosing items, grouping them, adding your own, and deciding what happens when they do not fit.

Customization · https://react-rtekit.vercel.app/react-rtekit/customization/toolbar-layout/

The toolbar takes an array of arrays: each inner array is a group, and the gaps between groups are where the separators go.

*Example: Toolbar configuration* — the same source as under "Colours".

```tsx
<RichTextEditor
  toolbar={[
    ['undo', 'redo'],
    ['bold', 'italic', 'underline'],
    ['link', 'image'],
  ]}
  toolbarOverflow="menu"
/>
```

## Overflow

- `menu` — groups that do not fit move into a "more" menu.
- `wrap` — the row grows taller.
- `scroll` — the row scrolls, with its own tab stop.

## Adding an item

`createToolbarItem` builds one in the same shape the built-ins use, so nothing about them is privileged:

```tsx
import { createToolbarItem } from 'react-rtekit';

const highlight = createToolbarItem({
  name: 'highlight',
  label: 'Highlight',
  icon: <HighlightIcon />,
  command: 'toggleHighlight',
});
```

---

# Design-system skin

> Making the editor look like the rest of your application, with your components and your tokens.

Customization · https://react-rtekit.vercel.app/react-rtekit/customization/design-system-skin/

Making the editor look like the rest of your application means replacing its parts with yours, not overriding its CSS from outside.

*Example: Design-system skin* — the same source as under "Icons".

The combination that usually does it:

- a **theme** for colour, radius and spacing;
- **slots** for the controls, so they are literally your buttons and menus;
- `unstyled` if you want none of the shipped chrome CSS at all.

```tsx
<RichTextEditor
  unstyled
  theme={brand}
  slots={{ ToolbarButton: MyButton, Popover: MyPopover, Dialog: MyDialog }}
/>
```

`unstyled` drops the chrome stylesheet, not the content one — the prose still needs to render the same as it will outside the editor.

---

# Content styles

> Styling the prose itself, so stored HTML renders the same inside the editor and out.

Customization · https://react-rtekit.vercel.app/react-rtekit/customization/content-styles/

The prose inside the editor and the prose on a page that renders stored HTML have to look the same, or authors are editing something that is not what readers see.

*Example: Content styles* — the same source as under "Fonts".

That is why content styling is a separate stylesheet:

```ts
import 'react-rtekit/content.css';   // the prose, on its own
import 'react-rtekit/styles.css';    // everything, including the above
```

Render stored HTML with the same styling using [RteContentView](https://react-rtekit.vercel.app/react-rtekit/content-view/), which sanitizes and applies the same classes:

```tsx
import { RteContentView } from 'react-rtekit/view';

<RteContentView value={storedHtml} />
```

Every content token — heading scale, list indent, quote border, code colours, table borders — is listed on the [theme tokens](https://react-rtekit.vercel.app/react-rtekit/api/theme-tokens/) page under `content`.

---

# Recipes

> Short worked answers to the customizations people actually ask for.

Customization · https://react-rtekit.vercel.app/react-rtekit/customization/recipes/

Short answers to the customizations that actually get asked for.

## Put the toolbar at the bottom

```tsx
<RichTextEditor toolbarPosition="bottom" />
```

On mobile it docks above the on-screen keyboard rather than being pushed off-screen.

## Show a word count instead of characters

```tsx
<RichTextEditor showCounter countUnit="words" maxLength={500} />
```

## Block a paste instead of cleaning it

```tsx
<RichTextEditor handlers={{ onPaste: (ctx) => { if (tooLarge(ctx.html)) return; ctx.next(); } }} />
```

A handler that never calls `next()` cancels the default behaviour.

## Open links in a new tab by default

```tsx
<RichTextEditor linkDefaults={{ target: '_blank' }} />
```

`rel="noopener noreferrer"` is added by the sanitizer regardless.

## Render the value somewhere else

```tsx
<RteContentView value={value} />
```

## Get at the editor imperatively

```tsx
const ref = useRef<EditorInstance>(null);
<RichTextEditor editorRef={ref} />;
ref.current?.focus('end');
```

---

# All guides

> Longer pieces on doing a whole job well, rather than on one capability.

Guides · https://react-rtekit.vercel.app/react-rtekit/guides/

Longer pieces about doing a whole job well, rather than about one capability.

- [Best practices](https://react-rtekit.vercel.app/react-rtekit/guides/best-practices/) — the habits that keep an editor predictable.
- [Security](https://react-rtekit.vercel.app/react-rtekit/guides/security/) — what the sanitizer guarantees and what it does not.
- [Performance](https://react-rtekit.vercel.app/react-rtekit/guides/performance/) — what costs what.
- [Testing](https://react-rtekit.vercel.app/react-rtekit/guides/testing/) — what unit tests can reach and what needs a browser.
- [Accessibility](https://react-rtekit.vercel.app/react-rtekit/guides/accessibility/) — the keyboard model and the semantics.
- [Localization](https://react-rtekit.vercel.app/react-rtekit/guides/localization/) — translating the chrome.
- [Server rendering](https://react-rtekit.vercel.app/react-rtekit/guides/server-rendering/) — rendering content without a flash.
- [Writing a plugin](https://react-rtekit.vercel.app/react-rtekit/guides/writing-a-plugin/) — end to end.

---

# Best practices

> The habits that keep an editor fast, accessible and predictable as an application grows around it.

Guides · https://react-rtekit.vercel.app/react-rtekit/guides/best-practices/

## Keep the value stable

A new string identity on every render makes the editor reconcile content it already has. Hold the value in state and pass the same reference until it genuinely changes.

## Memoise the object props

`theme`, `slots`, `handlers`, `toolbar` and `localization` are compared by identity. An object literal in JSX is a new one every render:

```tsx
const theme = useMemo(() => createTheme(lightTheme, brand), []);
<RichTextEditor theme={theme} />
```

## Do not switch preset or locale to change a setting

Both are resolved when the editor mounts, so changing either remounts it and starts a new undo stack. Change the individual props instead.

## Use the lowest customization level that works

A token beats a class name, which beats a slot, which beats a fork. Each level leaves the ones above it working; a fork leaves nothing working.

## Check emptiness with `isEmpty()`

Not with `value === ''` and not with a length check on the HTML. An empty editor is `<p><br></p>`, which is neither empty nor meaningful.

## Sanitize on the server too

The client sanitizer is a usability feature and a defence in depth. It is not a boundary you can trust, because the client is not a boundary you can trust.

---

# Security

> Where untrusted HTML enters, what the sanitizer guarantees, and what remains your responsibility.

Guides · https://react-rtekit.vercel.app/react-rtekit/guides/security/

## Where untrusted HTML enters

Five places, and all five run the same allowlist sanitizer:

- the initial `value` or `defaultValue`;
- every paste;
- every drop;
- every programmatic `setContent` or `insertHTML`;
- the output of `getHTML()`, unless `sanitizeOutput={false}`.

There is no code path that renders HTML the sanitizer has not seen.

## What cannot be configured off

No profile and no configuration allows any of these:

- `<script>`, `<iframe>`, `<object>`, `<embed>`, `<form>`;
- any `on*` attribute;
- `javascript:`, `vbscript:` and `data:text/html` URLs;
- `style` containing `expression()`, `url(javascript:)` or `@import`;
- `srcdoc`, and `<svg>` outside the permissive profile.

## The four profiles

| Profile | For |
|---|---|
| `strict` | marks and paragraphs only |
| `standard` | everything the editor can edit — the default |
| `email` | the inline styles an e-mail needs |
| `permissive` | the widest allowlist, and still no scripts |

`standard` accepts `data:` URLs for PNG, JPEG, GIF and WebP so that inserting a picture from your own machine works with no upload endpoint. Those four are pixels. `data:image/svg+xml` is a document that can carry script and stays blocked everywhere.

## What remains yours

Sanitize again on the server. The client can be bypassed, and a determined caller can POST whatever it likes to your endpoint. `sanitizeHtml` is exported for exactly that:

```ts
import { sanitizeHtml } from 'react-rtekit/core';

const safe = sanitizeHtml(untrusted, { sanitize: 'standard' });
```

---

# Performance

> What costs what, what is measured on every build, and which props are worth memoising.

Guides · https://react-rtekit.vercel.app/react-rtekit/guides/performance/

## What is measured

Every build checks bundle budgets and a separate Playwright config measures interaction timings on a quiet machine. Both fail the build rather than warn.

| Entry point | Budget |
|---|---|
| `useEditor` — headless | 41 kB |
| `RichTextEditor` — everything | 71 kB |
| `react-rtekit/core` — no React | 19 kB |
| `sanitizeHtml` alone | 7 kB |
| `styles.css` | 9 kB |

All min+gzip. There are no peers to exclude: React and React DOM are the only ones, and the consumer already has them.

These numbers include the editing engine, which is this package's own code. That is worth saying because it makes them look worse than they are: an editor that leaves the engine to a peer dependency reports a smaller figure and costs the reader more. Bringing the engine in-house added about 4 kB here and removed 103 kB gzipped from what a consumer downloads.

## Why the component is larger than the hook

`<RichTextEditor>` reads its feature set from props at runtime, so every branch — the link popover, the image dialog, the table controls, find and replace — is reachable from that entry point by construction. A bundler cannot drop what it cannot prove unreachable. Import `useEditor` instead and the chrome goes.

## Large documents

*Example: Large document* — the same source as under "Performance".

## What to memoise

`theme`, `slots`, `handlers`, `toolbar` and `localization`, all compared by identity. An object literal in JSX is a new object on every render and will re-resolve the thing it configures.

## What causes a remount

`preset` and `localization` are resolved at mount. Changing either rebuilds the editor and empties the undo stack, which is almost never what you wanted.

---

# Testing

> Testing an editor: what unit tests can reach, what needs a real browser, and why.

Guides · https://react-rtekit.vercel.app/react-rtekit/guides/testing/

## What unit tests can reach

jsdom does not lay anything out and cannot drive a contenteditable. That puts a hard line through the middle of an editor's test suite:

| Testable in jsdom | Needs a real browser |
|---|---|
| Serialization, sanitization, interop | Typing, selection, the caret |
| The document model and commands | Where a popover lands |
| Props, slots, handler wiring | Whether a mark is visible |
| Rendering and accessibility roles | Which toolbar items fit on a row |

A unit test that appears to cover the right column is asserting against a simulation of a browser, not a browser.

## Testing your own integration

For a form, assert on the value your `onChange` receives rather than on the DOM:

```tsx
render(<RichTextEditor label="Body" onChange={onChange} />);
await user.type(screen.getByRole('textbox', { name: 'Body' }), 'Hello');
expect(onChange).toHaveBeenLastCalledWith('<p>Hello</p>', expect.anything());
```

For anything involving a caret, use Playwright.

## The accessible name

Pass `label`, and the textbox has a name you can query by. Without one, `getByRole('textbox')` finds an anonymous element and your test is fragile.

---

# Accessibility

> The keyboard model, the ARIA semantics, and what an override has to keep.

Guides · https://react-rtekit.vercel.app/react-rtekit/guides/accessibility/

*Example: Accessibility* — the same source as under "Keyboard shortcuts".

## The keyboard model

| Key | Does |
|---|---|
| Tab | Moves out of the editor, not into the toolbar |
| Alt+F10 | Moves into the toolbar from the text |
| Arrows | Move between toolbar controls |
| Home / End | First and last control |
| Escape | Returns the caret to where it was |
| Mod+B / I / U | Bold, italic, underline |
| Mod+K | Link |
| Mod+F | Find |
| Mod+/ | The shortcut reference |

The toolbar is one tab stop. That is the ARIA toolbar pattern, and it is why Tab does not walk through twenty buttons to get out of a form field.

## What is guaranteed

- A named textbox, from `label`.
- Errors linked with `aria-describedby`, and `aria-invalid` when invalid.
- Live-region announcements for count limits, find results and command outcomes.
- Visible focus on every control, and every shipped theme meeting WCAG AA — with a test that fails the build if one does not.
- The shortcut reference is built from the keymap actually in force, so it cannot list a shortcut that does not work.

## What an override has to keep

A slot receives its semantics in its props. A replacement `ToolbarButton` that drops `aria-pressed` turns a toggle into a button as far as a screen reader is concerned. Spread the props back.

---

# Localization

> Translating the editor's strings, handling direction, and finding the keys you missed.

Guides · https://react-rtekit.vercel.app/react-rtekit/guides/localization/

*Example: Localization* — the same source as under "Localization".

## Catalogues

Five ship — `en`, `hu`, `de`, `es` and `pseudo` — each covering all 153 keys:

```tsx
import { RichTextEditor, de } from 'react-rtekit';

<RichTextEditor localization={de} />
```

Or for a whole tree:

```tsx
<RteLocaleProvider value={de}>{children}</RteLocaleProvider>
```

## Finding what you missed

`pseudo` replaces every string with an accented, lengthened version of itself. Anything still in plain English is a string that is not going through the catalogue:

```tsx
<RichTextEditor localization={pseudo} />
```

It also makes layouts that assume English-length labels obvious, because everything is about 30% longer.

## Direction

`dir="rtl"` flips the toolbar, the alignment defaults, the indentation and the popover placement. The content's own direction is `dir="auto"` per block, so a right-to-left paragraph in a left-to-right document behaves correctly.

## What is not covered

The catalogue is the editor's own chrome. Date formats, number formats and your application's strings are yours.

---

# Server rendering

> Rendering the content on the server and hydrating without a flash or a mismatch.

Guides · https://react-rtekit.vercel.app/react-rtekit/guides/server-rendering/

## What runs where

The engine needs a DOM, so the editor itself is a client component. What the server can do is render the content, so the first paint is the text rather than an empty box.

```tsx
'use client';
import { RichTextEditor } from 'react-rtekit';
```

## The rule that matters

The server-rendered markup becomes the host element's initial HTML, and it must not change afterwards — React would replace the children, which by then are the engine's contenteditable. The component freezes the first value for this reason, and a regression test holds it there.

In practice: pass the value you have, and do not expect the server preview to track state.

## Only HTML

An HTML value can be pre-rendered. JSON and Markdown need a converter the server entry deliberately does not carry, so those render the loading state and hydrate.

## Rendering stored content without an editor

If a page only displays content, do not mount an editor at all:

```tsx
import { RteContentView } from 'react-rtekit/view';

<RteContentView value={storedHtml} />
```

That entry point has no engine and no React client requirement beyond rendering.

---

# Writing a plugin

> Building a plugin end to end: a mark, a command, a keyboard shortcut and a toolbar item.

Guides · https://react-rtekit.vercel.app/react-rtekit/guides/writing-a-plugin/

*Example: Writing a plugin* — the same source as under "Plugin authoring".

## The shape

A plugin is an object. `definePlugin` is an identity function that exists for the inference:

```tsx
import { definePlugin } from 'react-rtekit';

export const highlight = definePlugin({
  name: 'highlight',
  commands: {
    toggleHighlight: ({ editor }) => editor.exec('setBackgroundColor', { color: '#ff0' }),
  },
  keymap: { 'Mod+Shift+H': 'toggleHighlight' },
  toolbarItems: [
    { name: 'highlight', label: 'Highlight', icon: <PenIcon />, command: 'toggleHighlight' },
  ],
});
```

Then add it:

```tsx
<RichTextEditor addPlugins={[highlight]} toolbar={[['bold', 'highlight']]} />
```

## Order

Plugins resolve by dependency and then by priority, and a later registration of the same name replaces an earlier one — which is how you override a built-in: give yours the built-in's name.

A `dependsOn` that names something absent produces a warning and still loads. A missing dependency should not hand the reader an editor with a feature silently gone.

## Typing a new command

Augment the catalogue so `editor.exec` knows about it:

```ts
declare module 'react-rtekit' {
  interface CommandMap {
    toggleHighlight: void;
  }
}
```

---

# All integrations

> Working with the libraries and frameworks this editor most often sits inside.

Integrations · https://react-rtekit.vercel.app/react-rtekit/integrations/

The libraries and frameworks this editor most often sits inside.

- [React Hook Form](https://react-rtekit.vercel.app/react-rtekit/integrations/react-hook-form/) — the dedicated adapter package.
- [Formik](https://react-rtekit.vercel.app/react-rtekit/integrations/formik/)
- [Next.js](https://react-rtekit.vercel.app/react-rtekit/integrations/next-js/)
- [Remix](https://react-rtekit.vercel.app/react-rtekit/integrations/remix/)
- [Tailwind CSS](https://react-rtekit.vercel.app/react-rtekit/integrations/tailwind/)
- [TypeScript](https://react-rtekit.vercel.app/react-rtekit/integrations/typescript/)

---

# React Hook Form

> The dedicated adapter package: registration, validation and dirty state.

Integrations · https://react-rtekit.vercel.app/react-rtekit/integrations/react-hook-form/

*Example: Validation with react-hook-form* — the same source as under "Forms".

`react-rtekit-rhf` is a separate package so that a project not using React Hook Form does not pay for it:

```bash
npm install react-rtekit-rhf
```

```tsx
import { useForm } from 'react-hook-form';
import { RhfRichTextEditor } from 'react-rtekit-rhf';

const { control, handleSubmit } = useForm({ defaultValues: { body: '' } });

<RhfRichTextEditor
  name="body"
  control={control}
  label="Message"
  rules={{ required: 'A message is required' }}
/>
```

## Why an adapter rather than a Controller

The adapter reports emptiness with `isEmpty()` rather than by string comparison. An editor that looks empty contains `<p><br></p>`, so a `required` rule written against the raw value passes when it should not — which is one of the 26 bugs this package was written to fix.

It also maps dirty state to real content changes, so focusing and blurring does not mark a form dirty.

---

# Formik

> Wiring the editor to a Formik field, including validation and submission.

Integrations · https://react-rtekit.vercel.app/react-rtekit/integrations/formik/

*Example: Validation with Formik* — the source of the live demo on this page.

```tsx
import { useField, useFormikContext, Formik, Form } from 'formik';
import { RichTextEditor, isEmptyHtml, countText } from 'react-rtekit';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * Formik, with no adapter package (fixes R13).
 *
 * The point of this page is what is *not* here: there is no `react-rtekit-formik`.
 * The editor is a controlled input with a value and an `onChange`, so binding it to a
 * form library is twenty lines, and the library never has to know which one you use.
 */

interface EmailForm {
  message: string;
}

const MAX_LENGTH = 280;

/** The binding. Everything Formik-specific about this page lives in here. */
function FormikRte({ name, label }: { name: string; label: string }) {
  const [field, meta, helpers] = useField<string>(name);
  const { isSubmitting } = useFormikContext<EmailForm>();
  const showError = meta.touched && meta.error !== undefined;

  return (
    <RichTextEditor
      label={label}
      value={field.value}
      disabled={isSubmitting}
      required
      maxLength={MAX_LENGTH}
      showCounter
      error={showError ? meta.error : false}
      placeholder="Try submitting this while it is empty…"
      onChange={(value) => {
        void helpers.setValue(value as string);
      }}
      onBlur={() => {
        void helpers.setTouched(true);
      }}
    />
  );
}

/**
 * The validation.
 *
 * `isEmptyHtml` rather than string truthiness is the whole fix for R2: an empty
 * editor is `<p><br></p>`, which every truthiness check in the world accepts.
 */
function validate(values: EmailForm): Partial<Record<keyof EmailForm, string>> {
  const errors: Partial<Record<keyof EmailForm, string>> = {};

  if (isEmptyHtml(values.message)) {
    errors.message = 'A message is required';
  } else if (countText(values.message, 'characters') > MAX_LENGTH) {
    errors.message = `Keep it under ${MAX_LENGTH} characters`;
  }

  return errors;
}

export default function ValidationFormikExample() {
  return (
    <Formik<EmailForm>
      initialValues={{ message: '<p><br></p>' }}
      validate={validate}
      onSubmit={(values, helpers) => {
        helpers.setStatus(values);
        helpers.setSubmitting(false);
      }}
    >
      {({ status, resetForm, errors, touched }) => (
        <Form className="stack">
          <FormikRte name="message" label="Message" />

          <div className="button-row">
            <button type="submit" className="button button--solid">
              Send
            </button>
            <button
              type="button"
              className="button"
              onClick={() => {
                resetForm();
              }}
            >
              Reset
            </button>
            <span className="parity__status" data-testid="formik-status">
              {touched.message && errors.message
                ? 'Blocked by validation'
                : status
                  ? 'Submitted — see the payload below'
                  : 'Not submitted yet'}
            </span>
          </div>

          {status ? (
            <>
              <h2>Submitted payload</h2>
              <CodeBlock label="Formik payload" testId="formik-payload">
                {JSON.stringify(status, null, 2)}
              </CodeBlock>
            </>
          ) : null}
        </Form>
      )}
    </Formik>
  );
}
```

There is no Formik adapter package — the editor wires to a field directly:

```tsx
import { useField } from 'formik';
import { RichTextEditor, isEmptyHtml } from 'react-rtekit';

function BodyField() {
  const [field, meta, helpers] = useField('body');

  return (
    <RichTextEditor
      label="Message"
      value={field.value}
      onChange={(next) => helpers.setValue(next)}
      onBlur={() => helpers.setTouched(true)}
      invalid={meta.touched && Boolean(meta.error)}
      error={meta.touched ? meta.error : undefined}
    />
  );
}
```

Validate with `isEmptyHtml` rather than a string check:

```ts
validate: (value) => (isEmptyHtml(value) ? 'A message is required' : undefined);
```

---

# Next.js

> App Router and Pages Router, client boundaries, and rendering content on the server.

Integrations · https://react-rtekit.vercel.app/react-rtekit/integrations/next-js/

The editor is a client component: the engine needs a DOM.

## App Router

```tsx
'use client';

import { useState } from 'react';
import { RichTextEditor } from 'react-rtekit';

export function Body({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  return <RichTextEditor label="Body" value={value} onChange={setValue} />;
}
```

Import the stylesheet in the root layout:

```tsx
import 'react-rtekit/styles.css';
```

## Displaying content in a server component

A page that only renders stored HTML does not need an editor, or a client boundary:

```tsx
import { RteContentView } from 'react-rtekit/view';

export default async function Page() {
  const post = await getPost();
  return <RteContentView value={post.body} />;
}
```

## Pages Router

The same, without the directive. The first paint renders the content and hydrates into an editor; see [Server rendering](https://react-rtekit.vercel.app/react-rtekit/server-rendering/) for why the pre-rendered value is frozen.

---

# Remix

> Loading and submitting editor content with Remix's data conventions.

Integrations · https://react-rtekit.vercel.app/react-rtekit/integrations/remix/

```tsx
import { useLoaderData, Form } from '@remix-run/react';
import { useState } from 'react';
import { RichTextEditor } from 'react-rtekit';

export default function Edit() {
  const { body } = useLoaderData<typeof loader>();
  const [value, setValue] = useState(body);

  return (
    <Form method="post">
      <RichTextEditor label="Body" value={value} onChange={setValue} />
      <input type="hidden" name="body" value={value} />
      <button type="submit">Save</button>
    </Form>
  );
}
```

The hidden input is what makes a progressive-enhancement submission carry the content: the editor is a contenteditable, not a form control, so it does not serialize itself.

## Sanitize in the action

```ts
import { sanitizeHtml } from 'react-rtekit/core';

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const body = sanitizeHtml(String(form.get('body')), { sanitize: 'standard' });
  await save({ body });
  return redirect('/');
}
```

`react-rtekit/core` has no React and no engine, so importing it in a server action costs about 19 kB rather than the whole component.

---

# Tailwind CSS

> Using the editor inside a Tailwind project without the two stylesheets fighting.

Integrations · https://react-rtekit.vercel.app/react-rtekit/integrations/tailwind/

*Example: Tailwind skin* — the source of the live demo on this page.

```tsx
import { useState } from 'react';
import { RichTextEditor } from 'react-rtekit';
import './utilities.css';

/**
 * Unstyled mode with a utility-class skin.
 *
 * `unstyled` drops the chrome visuals and keeps two things: the structural CSS, so the
 * layout still works, and the prose styles, so stored content renders the same here as
 * it does in `<RteContentView>` on a list page. Everything you can see is a class in
 * this file.
 */

const SAMPLE =
  '<h2>Release notes</h2>' +
  '<p>Every visible style below is a utility class. The <strong>prose</strong> styles are not: ' +
  'those come from <code>content.css</code>, which is what keeps stored content consistent.</p>' +
  '<ul><li>Structure kept</li><li>Chrome replaced</li></ul>';

/** Tailwind classes, prefixed here only because this page defines them locally. */
const SKIN = {
  root: 'tw-rounded-lg tw-border tw-border-slate-200 tw-bg-white tw-shadow-sm',
  toolbar: 'tw-flex tw-flex-wrap tw-items-center tw-gap-1 tw-border-b tw-bg-slate-50 tw-p-2',
  toolbarGroup: 'tw-flex tw-items-center tw-gap-1',
  toolbarButton:
    'tw-rounded-md tw-px-2 tw-py-1 tw-text-sm tw-text-slate-700 tw-cursor-pointer ' +
    'tw-hover:bg-slate-100 tw-focus:outline-indigo-600',
  toolbarToggle:
    'tw-rounded-md tw-px-2 tw-py-1 tw-text-sm tw-text-slate-700 tw-cursor-pointer ' +
    'tw-hover:bg-slate-100 tw-focus:outline-indigo-600',
  content: 'tw-min-h-40 tw-w-full tw-p-3',
  footer:
    'tw-flex tw-items-center tw-justify-between tw-border-b tw-p-2 tw-text-xs tw-text-slate-500',
  label: 'tw-text-sm tw-font-medium tw-text-slate-700',
  errorText: 'tw-mt-1 tw-text-sm tw-text-rose-600',
  placeholder: 'tw-p-3 tw-text-sm tw-text-slate-500',
};

export default function TailwindSkinExample() {
  const [html, setHtml] = useState(SAMPLE);

  return (
    <div className="stack">
      <RichTextEditor
        unstyled
        preset="standard"
        label="Release notes"
        hideLabel
        maxLength={400}
        showCounter
        classNames={SKIN}
        value={html}
        onChange={(value) => {
          setHtml(value as string);
        }}
      />

      <p className="callout">
        In your application these classes come from Tailwind. This site does not build with Tailwind
        — adding it for one page would change every other page — so the classes used here are
        written out in <code>utilities.css</code> next to this file, with Tailwind&rsquo;s own
        values.
      </p>

      <p className="callout">
        Note what <code>unstyled</code> keeps: the layout still works and the content still reads as
        prose. Dropping <code>content.css</code> as well would make this editor and a list page
        render the same stored HTML differently, which is the one difference users notice.
      </p>
    </div>
  );
}
```

The editor's CSS lives in a cascade layer called `rtekit`, so it does not fight Tailwind's utilities — a utility class always wins, because unlayered styles beat layered ones.

## Skinning with utilities

```tsx
<RichTextEditor
  classNames={{
    root: 'rounded-xl border border-slate-200 shadow-sm',
    toolbar: 'bg-slate-50',
    content: 'prose max-w-none p-4',
  }}
/>
```

`classNames` adds to the shipped class rather than replacing it, so the behaviour that depends on those classes keeps working.

## With `@tailwindcss/typography`

Apply `prose` to the content area, and turn off the package's own content styling to avoid two opinions about a heading:

```ts
import 'react-rtekit/base.css';   // chrome only, no content styles
```

## Dark mode

The editor reads `data-color-scheme` on an ancestor. Set it where you set Tailwind's `dark` class and the two stay in step.

---

# TypeScript

> What the types give you, how to extend the command and slot catalogues, and the strictness settings this package assumes.

Integrations · https://react-rtekit.vercel.app/react-rtekit/integrations/typescript/

The package is written in TypeScript with `strict` on and ships declarations for both ESM and CJS. `are-the-types-wrong` runs on every build, so the `exports` map is checked rather than assumed.

## Typing the value

`EditorValue` is the union of what `valueFormat` can produce. Narrow it by telling the component which format you are using:

```tsx
<RichTextEditor valueFormat="html" onChange={(value: string) => setHtml(value)} />
```

## Adding a command

Augment the catalogue, and `editor.exec` accepts it with the right payload:

```ts
declare module 'react-rtekit' {
  interface CommandMap {
    toggleHighlight: void;
    insertCallout: { variant: 'info' | 'warning' };
  }
}
```

## Adding a slot

```ts
declare module 'react-rtekit' {
  interface RteSlots {
    CalloutChrome: SlotComponent<{ variant: string }>;
  }
}
```

## What this package assumes

`strict`, `verbatimModuleSyntax` and `moduleResolution: 'bundler'` or `'node16'`. It does not require them of you, but the declarations are written as though they are on.

---

# Migration

> Moving to this package from another editor, and between its own versions.

Migration · https://react-rtekit.vercel.app/react-rtekit/migration/

Moving to this package, and between its own versions.

- [From Quill](https://react-rtekit.vercel.app/react-rtekit/migration/from-quill/) — the field-by-field migration, with stored markup read as it is.

There are no version-to-version migrations yet: 1.0.0 is the initial release. When there is a breaking change, its guide appears here and stays forever.

---

# From Quill

> A field-by-field migration from Quill, with the stored markup read as it is rather than converted.

Migration · https://react-rtekit.vercel.app/react-rtekit/migration/from-quill/

*Example: HTML interop profiles* — the same source as under "HTML interop".

## Your stored content does not need converting

The `quill-compatible` interop profile reads Quill's markup as it is — `ql-align-*`, `data-list`, indent classes — and can emit it again. A migration is a component swap, not a data migration.

```tsx
<RichTextEditor htmlProfile="quill-compatible" value={existingQuillHtml} />
```

When you are ready to stop writing Quill's dialect, switch the output profile and the content converts as it is edited:

```tsx
<RichTextEditor htmlProfile="standard" />
```

## Prop mapping

| Quill | Here |
|---|---|
| `modules.toolbar` | `toolbar` — an array of arrays |
| `theme: 'snow'` | `theme={classicTheme}`, or `preset="classic"` |
| `formats` | the plugin list, via `preset` / `addPlugins` / `removePlugins` |
| `readOnly` | `readOnly`, and `disabled` for the other state |
| `placeholder` | `placeholder` |
| `getContents()` / `setContents()` | `editor.getJSON()` / `editor.setContent()` |
| `getText()` | `editor.getText()` |
| `on('text-change')` | `onChange`, with a `ChangeMeta` saying what caused it |

## What is different on purpose

- **Emptiness.** Quill's `getText()` on an empty editor returns `\n`. `isEmpty()` here returns `true`, and `required` believes it.
- **The toolbar is a real ARIA toolbar.** One tab stop, arrows between controls.
- **Sanitization is not optional.** Quill will render what you give it; this will not.

## The parity demo

[Legacy parity](https://react-rtekit.vercel.app/react-rtekit/demos/legacy-parity/) reproduces the old editor exactly and lists the 26 bugs that are fixed.

---

# Discover more

> Where the project is going, what it has already done, and how it is put together.

Discover more · https://react-rtekit.vercel.app/react-rtekit/discover-more/

Where the project is going, what it has done, and how it is put together.

- [Changelog](https://react-rtekit.vercel.app/react-rtekit/discover-more/changelog/) — every released version.
- [Roadmap](https://react-rtekit.vercel.app/react-rtekit/discover-more/roadmap/) — what is being considered.
- [Showcase](https://react-rtekit.vercel.app/react-rtekit/discover-more/showcase/) — applications using it.
- [Architecture](https://react-rtekit.vercel.app/react-rtekit/discover-more/architecture/) — the decisions behind it.
- [llms.txt](https://react-rtekit.vercel.app/react-rtekit/discover-more/llms-txt/) — the machine-readable index.

---

# Changelog

> Every released version and what changed in it.

Discover more · https://react-rtekit.vercel.app/react-rtekit/discover-more/changelog/

Every user-facing change is recorded with a changeset and released under [Semantic Versioning](https://react-rtekit.vercel.app/react-rtekit/getting-started/versions/).

The full changelog is maintained in the repository and published with each release:

- [CHANGELOG.md](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/CHANGELOG.md)
- [Releases](https://github.com/kiralygyula92/react-rtekit/releases)

## 1.0.0

The initial release. Everything listed under [All features](https://react-rtekit.vercel.app/react-rtekit/all-features/) ships in it.

---

# Roadmap

> What is being considered next, and what has been decided against.

Discover more · https://react-rtekit.vercel.app/react-rtekit/discover-more/roadmap/

There is no dated roadmap. This is a free project maintained in the open, and promising dates for work that has not started would be inventing them.

What is **being considered**, in no order and with no commitment:

- A second engine adapter, to prove the `EditorEngine` interface is real.
- Syntax highlighting inside code blocks, as an opt-in so the highlighter is not in everyone's bundle.
- Merged table cells.
- A Figma kit, once the component set stops moving.

What has been **decided against**:

- **Real-time collaboration.** A CRDT and a presence layer are a project of their own, and doing it badly is worse than not doing it.
- **Document management.** This edits text and hands it back.
- **A CSS-in-JS build.** Tokens in a cascade layer do the same job without the runtime.

If you need one of these, say so in [discussions](https://github.com/kiralygyula92/react-rtekit/discussions) — what people actually ask for is what moves.

---

# Showcase

> Applications built with this editor, added once their owners are happy to be named.

Discover more · https://react-rtekit.vercel.app/react-rtekit/discover-more/showcase/

Nothing is listed here yet, and nothing invented will be. The package is newly released; when there is a real application using it whose owners are happy to be named, it will appear here.

If you have shipped something with it, [say so](https://github.com/kiralygyula92/react-rtekit/discussions).

---

# Architecture

> The decisions behind the engine adapter, the sanitizer, the interop profiles and the slot system.

Discover more · https://react-rtekit.vercel.app/react-rtekit/discover-more/architecture/

The decisions that shaped the package, and the reasoning behind each.

## An engine adapter, not a wrapper

An `EditorEngine` interface owns the document layer, and the engine behind it is this project's own. Nothing outside `src/engines/` knows how the document is edited, and none of it reaches the public API — verified by a grep that returns nothing.

The point is that the public API describes editing rather than describing an engine, so a change in the engine is not a breaking change in the package. That boundary earned itself: the engine behind it has already been replaced once, and nothing above it moved.

## An in-house HTML parser

The sanitizer cannot use the browser's parser, because parsing untrusted HTML to inspect it is the mutation-XSS vector it is trying to close. So the package carries its own parser, which is most of the core bundle's size and is not negotiable.

## Sanitization at every boundary

Five entry points, one sanitizer, and hard rules no configuration reaches. The alternative — sanitizing at the edges and trusting the middle — is how editors ship XSS holes.

## Interop profiles rather than a migration

Reading legacy Quill markup as it is means adoption does not require a data migration, which is the single largest cost of replacing an editor.

## Slots and middleware rather than configuration flags

A flag anticipates a need; a slot does not have to. Forty-six replaceable parts and eighteen interception points cover cases nobody thought of, which a growing list of booleans never does.

---

# llms.txt

> The machine-readable index of this documentation, and how to point an agent at it.

Discover more · https://react-rtekit.vercel.app/react-rtekit/discover-more/llms-txt/

This documentation is machine-readable. Point an agent at it rather than scraping it.

## The index

[`/react-rtekit/llms.txt`](https://react-rtekit.vercel.app/react-rtekit/llms.txt) lists every page, grouped by section, with the one-line description each page carries. It is generated from the same field the page's H1 subtitle and meta description use, so it cannot drift from the site.

## Markdown twins

Appending `.md` to any documentation URL returns the authored Markdown:

```
/react-rtekit/tables/       the page
/react-rtekit/tables.md     its source
```

The twin carries the front matter, so an agent reading it gets the capability id, the group and the symbols the page documents, not just the prose.

## Sitemap

[`/sitemap.xml`](https://react-rtekit.vercel.app/sitemap.xml) covers every page.

## What this means in practice

An agent answering a question about this package should read `llms.txt`, pick the pages it needs and fetch their `.md` twins. That is the whole corpus, in Markdown, with no HTML to strip and no JavaScript to run.
