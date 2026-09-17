# Architecture Decision Records

One file per decision, numbered and immutable. Superseding a decision means writing a
new ADR that says so, not editing the old one.

| # | Title | Status |
|---|---|---|
| [001](./001-architecture.md) | Engine-adapter architecture with a headless core | Accepted |
| [002](./002-engine-lexical.md) | Lexical as the default engine adapter | Superseded by 006 |
| [003](./003-sanitizer.md) | In-house allowlist sanitizer over DOMParser | Accepted |
| [004](./004-interop-profiles.md) | HTML interop profiles instead of a Quill engine | Accepted |
| [005](./005-removing-third-party-dependencies.md) | Removing third-party dependencies | Superseded by 006 |
| [006](./006-an-in-house-engine.md) | An in-house engine, replacing Lexical | Done |
| [007](./007-deploying-the-docs-site.md) | Deploying the docs site, and measuring it | Done |
