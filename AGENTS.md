# Docs & site structure

This project's presentation/documentation site follows the standard in
`docs/ppds/02-plugin-docs-standard.md`. Read it before editing any page,
template, route or nav data.

Hard rules:
- Never hand-write reference/settings/API tables — they are generated.
- Never delete a URL. Retire by 301 redirect only.
- Never invent metrics, testimonials, prices or compatibility claims.
  Emit `TODO:` and log it in GAPS.md instead.
- Badges (New/Preview/Beta/Planned/Deprecated/tier names) are declared on
  nav nodes only, never hardcoded in page content.
- Capability pages keep the section order:
  Basics → variations → recipes → Customization → escape hatch →
  Limitations → API.

## Working on the site

The documentation is Markdown under `content/react-rtekit/`, compiled into the site.
It is not edited in `apps/site/src` — that holds the shell, the demos and the compiled
manifest.

```sh
pnpm content            # recompile Markdown -> manifest, .md twins, llms.txt, sitemap
pnpm content:validate   # nav, titles and URL-map invariants
pnpm content:reference  # regenerate the API reference from the TypeScript declarations
pnpm conformance        # the 26 PPDS checks
```

- Adding a page is a Markdown file plus a `nav.json` entry plus a `titles.json` entry.
  There is no route to add; `content:validate` fails if any of the three is missing.
- Reference pages are generated. Prose for a symbol belongs in
  `content/react-rtekit/reference/{symbol}.strings.json`, which regeneration only ever
  adds keys to. Editing a `.schema.json` fails conformance check 10 by checksum.
- A ` ```demo ` fence names an example from `apps/site/src/examples/`. That registry is
  the demo registry.
- Conformance checks that ask whether a URL resolves must assert on **content**, never
  on status: the SPA catch-all answers 200 for every path.
