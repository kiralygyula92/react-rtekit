# Releasing

A release is a version bump merged to `main` plus a `v*` tag on that commit. Pushing the tag runs
the `Release` workflow (`.github/workflows/release.yml`), which tests and builds both packages and
stages them on npm through [trusted publishing](https://docs.npmjs.com/trusted-publishers). No npm
token exists anywhere, and every version carries
[provenance](https://docs.npmjs.com/generating-provenance-statements). A staged version goes live
only after a maintainer approves it on npmjs.com with a passkey.

`@kingtech/react-rtekit` and `@kingtech/react-rtekit-rhf` are linked: they are versioned together,
and one tag releases both.

## First publish

npm only connects a trusted publisher to a package that already exists, so `1.0.0` of each package
is published once by hand, from a clean, up-to-date `main`, the editor first:

```sh
pnpm install --frozen-lockfile && pnpm build
npm login      # opens the browser; sign in with your passkey
cd packages/react-rtekit
npm publish    # `prepublishOnly` builds the package; confirm 2FA in the browser
cd ../react-rtekit-rhf
pnpm pack      # writes the `workspace:^` peer as `^1.0.0`
npm publish kingtech-react-rtekit-rhf-1.0.0.tgz
```

`@kingtech/react-rtekit-rhf` is packed with pnpm first because npm would publish its `workspace:^`
peer on `@kingtech/react-rtekit` as it is, and no consumer could install that.

The `Release` workflow and the trusted-publisher connections are added right after that, so every
later version is staged from a tag.

## How it is wired

- **npm:** both packages trust this repository's `release.yml`, run in the `npm` environment, for
  staged publishing only, and their publishing access requires two-factor authentication and
  disallows tokens. Check with `npm trust list @kingtech/react-rtekit` and
  `npm trust list @kingtech/react-rtekit-rhf`.
- **GitHub:** the `npm` environment accepts deployments from `v*` tags only, and a ruleset stops
  anyone but an admin from creating, moving or deleting those tags. Changes reach `main` only
  through pull requests that pass the CI `build` job. Only GitHub-made actions may run, and the
  default workflow token is read-only. The workflow also refuses a tag that isn't on `main` or
  doesn't match the version in both packages' `package.json`.
- **Private vulnerability reporting** is on; [SECURITY.md](SECURITY.md) sends reporters there.

## Every release

1. Pull requests add changesets (`pnpm changeset`). Check that CI is green on `main`.
2. Apply them on a release branch:

   ```sh
   git switch main && git pull --ff-only
   git switch -c release/vX.Y.Z
   pnpm version-packages
   pnpm build && pnpm docs:json && pnpm content:reference && pnpm content
   ```

   `pnpm version-packages` bumps both packages to the same version and writes each
   `CHANGELOG.md`. The build and the content pipeline bring `src/version.ts` and the generated
   documentation, which quote the version, along; CI fails if either is left behind.

3. Update the documentation by hand: `currentVersion` in `content/react-rtekit/plugin.config.json`
   and a dated entry on the changelog page (`content/react-rtekit/discover-more/changelog.md`), then
   run `pnpm content` again.
4. Commit as `release: vX.Y.Z`, open a pull request and merge it once CI passes.
5. Tag the merged commit on `main` and push the tag:

   ```sh
   git switch main && git pull --ff-only
   git tag -a vX.Y.Z -m "vX.Y.Z"
   git push origin vX.Y.Z
   ```

6. When **Actions → Release** finishes, approve both staged versions on npmjs.com (_Staged
   Packages_), the editor first, then create the GitHub release from the changelog section:
   `gh release create vX.Y.Z --title vX.Y.Z --notes-file <section.md>`.

Tags can't be moved and npm never accepts a version number twice, so if a release run fails, fix
the cause and release the next patch version.

## Before a release, check

- CI is green on `main`.
- `pnpm size && pnpm publint && pnpm attw` passes.
- `pnpm --filter @kingtech/react-rtekit pack --dry-run` lists only `dist/`, `README.md`,
  `CHANGELOG.md`, `LICENSE`, `NOTICE` and `package.json` (`@kingtech/react-rtekit-rhf`: the same,
  without `NOTICE`).
