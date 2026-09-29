# Releasing

Releases are automated with [Changesets](https://github.com/changesets/changesets) and the
`Release` workflow (`.github/workflows/release.yml`). `react-rtekit` and `react-rtekit-rhf` are
linked: they are versioned together.

## One-time setup

1. **npm account:** the unscoped names `react-rtekit` and `react-rtekit-rhf` must be free or
   already owned by the publishing npm account. Check with `npm login`, `npm whoami` and
   `npm view react-rtekit`.
2. **Token:** create an npm access token that can publish (a granular token scoped to
   `react-rtekit` and `react-rtekit-rhf`, or an automation token), and add it as the `NPM_TOKEN`
   repository secret (_Settings → Secrets and variables → Actions_). Until the secret exists the
   workflow only opens version pull requests, so pushing to `main` is safe. The workflow requests
   `id-token: write`, so packages are published with
   [provenance](https://docs.npmjs.com/generating-provenance-statements).
3. **GitHub:** in _Settings → Actions → General → Workflow permissions_, tick **Allow GitHub
   Actions to create and approve pull requests**. Without it the workflow cannot open the
   "Version Packages" pull request.
4. **Private vulnerability reporting:** turn it on (_Settings → Advanced Security_);
   [SECURITY.md](SECURITY.md) sends reporters there.

## Every release

1. Pull requests add changesets (`pnpm changeset`).
2. On `main`, the Release workflow opens or updates a **Version Packages** pull request. Its
   `pnpm version-packages` step bumps the versions and writes each `CHANGELOG.md`.
3. Review the pull request and merge it. The workflow builds and runs `changeset publish`, which
   publishes both packages with provenance and tags the release.

Both packages are at `1.0.0` with no changesets pending, so the first run with the token publishes
that version: run the workflow from the Actions tab, or push to `main`. Publish through the
workflow rather than from a local machine. Provenance can only be generated in CI, and
`react-rtekit-rhf` has to be published with pnpm (which `changeset publish` uses) so that its
`workspace:^` peer on `react-rtekit` becomes `^1.0.0` in the published manifest.

## Before a release, check

- CI is green on `main`.
- `pnpm size && pnpm publint && pnpm attw` passes.
- `pnpm --filter react-rtekit pack --dry-run` lists only `dist/`, `README.md`, `CHANGELOG.md`,
  `LICENSE`, `NOTICE` and `package.json` (`react-rtekit-rhf`: the same, without `NOTICE`).
