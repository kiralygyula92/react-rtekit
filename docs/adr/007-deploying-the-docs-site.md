# ADR-007: Deploying the docs site, and measuring it

- **Status:** Done
- **Date:** 2026-09-17
- **Related:** ADR-005 (no third-party dependencies in the library)

## Context

The docs site was deployed to GitHub Pages only. The owner connected the repository to
Vercel as well, to get page views and real-user performance data — *"let's add vercel
insights to the apps site so we can have app insights"*.

The first Vercel build failed. Two things were wrong, and the second hid the first.

## The build

Vercel's Root Directory is `apps/site`, so it ran that package's `build`, which is
`vite build` and nothing else. The site depends on `react-rtekit` and `react-rtekit-rhf`
through `link:`, and neither had been built, so nothing resolved. CI does not have this
problem because the Pages job runs `pnpm build` before `pnpm build:site`.

`vercel.json` therefore sets the build command to the same two steps CI uses, rather than
a third spelling of them:

```
pnpm -w run build && pnpm run build
```

The reported error was not that, though. It was:

```
[spa-fallback] ENOENT: no such file or directory,
  copyfile 'apps/site/dist/index.html' -> 'apps/site/dist/404.html'
```

`closeBundle` runs even when the build failed, and the `spa-fallback` plugin copied
`index.html` unconditionally, so it threw over the top of the error that mattered and
reported a missing output file instead of an unresolved import. It now checks first.

## Serving

A Pages *project* site lives under `/<repo>/`, which is why `SITE_BASE` exists; Vercel
serves from the root, so it is left unset there. Pages has no router, so deep links are
handled by copying `index.html` to `404.html`, which Pages renders for anything it cannot
find. Vercel has rewrites, so the fallback is declared properly:

```
"rewrites": [{ "source": "/((?!_vercel/).*)", "destination": "/index.html" }]
```

Rewrites are applied after the filesystem check, so hashed assets still serve as files.
`_vercel/` is excluded because that is where the analytics scripts are served from, and a
catch-all would answer those requests with the application's HTML.

The Pages deploy is unchanged and still runs from `release.yml`.

## Measuring

`@vercel/analytics` for page views and `@vercel/speed-insights` for real-user Core Web
Vitals — the latter because this repository already holds itself to performance budgets in
`playwright.perf.config.ts`, and those are synthetic numbers from one machine.

Both are mounted behind `__ON_VERCEL__`, substituted at build time from Vercel's own
`VERCEL=1`:

- Both scripts are served from `/_vercel/`, which only Vercel answers. On a Pages build
  they would 404 on every page, and `smoke.spec.ts` asserts the console stays empty — so
  off Vercel this is not merely useless, it is a failing test suite.
- Being a build-time constant, the whole thing folds away: the Pages bundle does not
  contain either package. It is 5 kB larger on Vercel and unchanged everywhere else.

Both are cookieless, so no consent banner is required.

## What this does not change

The two packages are dependencies of `apps/site`. `packages/react-rtekit` still has no
dependencies at all and no peers but `react` and `react-dom`, which is the constraint
ADR-005 exists to protect. Analytics on the documentation site is not a dependency of the
library any more than `formik` or `react-router` are.
