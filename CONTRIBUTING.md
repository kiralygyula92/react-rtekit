# Contributing

## Setup

```bash
corepack enable
pnpm install
pnpm build          # the site imports the library through the workspace, so build first
pnpm dev            # demo + docs site on http://localhost:5189
```

Node >= 18 (CI uses 22), pnpm 12.

## Scripts

| Script | What it does |
|---|---|
| `pnpm build` | Builds both packages: ESM + CJS + d.ts (tsup) and CSS (Lightning CSS) |
| `pnpm lint` / `pnpm format` | ESLint (type-aware) / Prettier |
| `pnpm typecheck` | `tsc --noEmit` in every workspace project |
| `pnpm test` / `pnpm test:coverage` | Vitest: `core` (node), `react` (jsdom), `rhf` (jsdom) |
| `pnpm e2e` | Playwright against a production build of the site (`FULL_MATRIX=1` for all five browser targets) |
| `pnpm e2e:perf` | The performance budgets from 09 section 4, on one browser and one worker |
| `pnpm size` | size-limit budgets from 09 section 4 |
| `pnpm docs:json` / `pnpm docs:check` | TypeDoc JSON, then the "every public symbol is documented" gate |
| `pnpm changeset` | Record a release note; required on every user-visible PR |

## Test policy

Rich-text editors fail in ways unit tests miss, so the weighting is deliberate
(09 section 1):

- **Core logic** -- serializers, sanitizer, interop, counting, command middleware --
  is unit-tested in node and held to 90% lines / 85% branches.
- **Anything involving a caret** -- typing, selection, toolbar commands, list nesting,
  paste, undo grouping, IME -- is tested in Playwright against real browsers. jsdom
  cannot drive contenteditable, so a jsdom test that claims to is lying.
- **Security** has its own CI job. Every change to `src/core/sanitize` or
  `src/core/interop` needs a corresponding fixture.
- Every bug in `docs/01-current-implementation.md` section 9 has a named regression
  test (`R1`-`R26`). Do not remove one.

## Definition of done

`docs/10-roadmap-and-migration.md` section 2 is the checklist. In short: implemented as
a plugin where applicable, names exactly as in `docs/04-api-reference.md`, TSDoc on
every public symbol, strings localized, visuals tokenized, state exposed through data
attributes, keyboard and ARIA support, sanitizer and serializer rules in both
directions, tests, a demo example, a guide section, playground controls, and a
changeset.

## Commits and releases

Conventional Commits. Releases go through Changesets: add one with `pnpm changeset`,
and the release workflow opens a version PR whose merge publishes with provenance.

What semantic versioning covers here is written down in `VERSIONING.md` — it includes
CSS class names, CSS variables, data attributes and localization keys, because those are
things people build against. The `classic` theme's token values are frozen: they are the
parity guarantee.

## Architecture

Read `docs/02-architecture.md` first, then the ADRs in `docs/adr/`. The one rule worth
repeating here: nothing outside `src/engines/` may import Lexical.
