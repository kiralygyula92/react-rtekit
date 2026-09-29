# Contributing

Thanks for helping improve `react-rtekit`! Bug reports, docs fixes and pull requests are all
welcome.

## Getting started

Requirements: Node 18+ (CI uses 22) and pnpm (run `corepack enable` to use the pinned version).

```sh
git clone https://github.com/kiralygyula92/react-rtekit.git
cd react-rtekit
pnpm install
pnpm build
pnpm dev
```

Build before `pnpm dev`: the site imports the library through the workspace. The demo and docs
site runs at http://localhost:5189.

| Command                              | What it does                                                                                     |
| ------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `pnpm build`                         | Builds both packages: ESM + CJS + d.ts (tsup) and CSS (Lightning CSS)                            |
| `pnpm lint` / `pnpm format`          | ESLint (type-aware) / Prettier                                                                   |
| `pnpm typecheck`                     | `tsc --noEmit` in every workspace project                                                        |
| `pnpm test` / `pnpm test:coverage`   | Vitest: `core` (node), `react` (jsdom), `rhf` (jsdom)                                            |
| `pnpm e2e`                           | Playwright against a production build of the site (`FULL_MATRIX=1` for all five browser targets) |
| `pnpm e2e:perf`                      | The performance budgets, on one browser and one worker                                           |
| `pnpm size`                          | size-limit budgets                                                                               |
| `pnpm docs:json` / `pnpm docs:check` | TypeDoc JSON, then the "every public symbol is documented" gate                                  |
| `pnpm content`                       | The docs content pipeline: pages, the generated reference and the API pages                      |
| `pnpm copy:check`                    | Proofreads the docs prose: heading case and spelling                                             |
| `pnpm changeset`                     | Records a release note                                                                           |

## Making a change

1. Open an issue first for larger changes, so we can agree on the API before you build it.
2. Create a branch from `main`.
3. Add or update tests. Rich-text editors fail in ways unit tests miss, so the weighting is
   deliberate:
   - **Core logic** (serializers, sanitizer, interop, counting, command middleware) is unit-tested
     in Node and held to 90% lines / 85% branches.
   - **Anything involving a caret** (typing, selection, toolbar commands, list nesting, paste, undo
     grouping, IME) is tested in Playwright against real browsers. jsdom cannot drive
     contenteditable, so a jsdom test that claims to is lying.
   - **Security** has its own CI job. Every change to `src/core/sanitize` or `src/core/interop`
     needs a corresponding fixture.
   - The regression tests `R1`–`R26` each record a behavior this library exists to fix, relative
     to a typical Quill wrapper. Do not remove one: the name is the contract.
4. Run the checks:

   ```sh
   pnpm build && pnpm lint && pnpm typecheck && pnpm test:coverage && pnpm size
   pnpm docs:json && pnpm docs:check && pnpm copy:check && pnpm e2e
   ```

5. Add a changeset for anything users will notice: `pnpm changeset`. Pick `patch` for fixes,
   `minor` for new features and `major` for breaking changes. It is required on every
   user-visible pull request.
6. For public API changes, update the documentation (see below).
7. Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages, e.g.
   `feat(engines): the in-house engine drives the product` or
   `fix(site): playground links reproduce the panel's props`.

## Documentation

The site's content lives in [`content/react-rtekit`](content/react-rtekit):

- **The API reference is generated.** Document every public symbol with TSDoc;
  `pnpm docs:json && pnpm docs:check` fails when one is undocumented. `pnpm content` then runs the
  content pipeline in the one order that works. CI fails when the generated content is out of date.
- **Prose is proofread.** `pnpm copy:check` catches heading case and spelling that drift between
  pages.
- **URLs never break.** Legacy URLs are listed in `apps/site/src/content/redirects.json`;
  `pnpm vercel:config` regenerates the host's redirects from it, and `pnpm redirects:check`
  verifies them against a running preview.

## Design principles

- **Opt-in by default:** new behavior goes behind a prop, so upgrades never change existing
  editors.
- **No dependencies:** React 18 or 19 is the only requirement.
- **Safe by default:** untrusted HTML is sanitized; `sanitize: false` is a documented, warned-about
  opt-out.
- **One engine interface:** the editing engine is this project's own, behind the `EditorEngine`
  interface in `src/engines/`. Nothing outside `src/engines/` may depend on how the engine edits
  the document, only on that interface. It is what let the engine be replaced without the public
  API moving.
- **Definition of done:** a feature is done when it is implemented as a plugin where that applies;
  named as the API reference names it; documented with TSDoc on every public symbol; localized
  rather than hard-coded; tokenized rather than styled inline; exposed through data attributes for
  CSS; reachable by keyboard and described to assistive technology; given sanitizer and serializer
  rules in _both_ directions; tested; shown in an example; explained in a guide; wired into the
  playground; and accompanied by a changeset.
- **A wide public API:** semantic versioning covers CSS class names, CSS variables, data
  attributes and localization keys, because people build against them (see
  [VERSIONING.md](VERSIONING.md)). The `classic` theme's token values are frozen: they are the
  parity guarantee.

## Licensing of contributions

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
Only submit code and assets you wrote yourself or that are available under a compatible
permissive license. Note any third-party material in the pull request so it can be added to
`packages/react-rtekit/NOTICE`.

## Code of conduct

Participation is governed by the [Code of Conduct](CODE_OF_CONDUCT.md).
