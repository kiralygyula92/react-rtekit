## What and why

<!-- What does this change, and which issue does it address? -->

## Checklist

- [ ] Tests added or updated (Vitest for core logic, Playwright for anything involving a caret)
- [ ] `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test:coverage`, `pnpm size` and `pnpm e2e` pass
- [ ] A changeset is included (`pnpm changeset`) for user-facing changes
- [ ] Public API changes: TSDoc updated, `pnpm docs:json && pnpm docs:check` pass, and the guide, example and playground updated
- [ ] Changes to `src/core/sanitize` or `src/core/interop` come with a security fixture
- [ ] New behavior is opt-in, or the breaking change is called out
- [ ] Any third-party material has a compatible license and is listed in `NOTICE`
