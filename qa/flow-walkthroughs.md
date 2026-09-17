# Flow walkthroughs

The eight required flows from PPDS §9, each walked as a clickable path. Recorded here
and asserted in `apps/site/e2e/flows.spec.ts`, so a link that stops working fails the
build rather than waiting to be noticed.

Each flow is written as the clicks, not as the URLs: the requirement is that the flow is
completable *without a dead end*, and a page that exists but that nothing links to
satisfies a URL check while failing a reader.

---

## F1 — Evaluate

**Entry:** the docs root. **Exit:** a decision to install.

1. `/react-rtekit/` — "React RTE Kit — Overview"
2. Click **All features** in the *Start now* list → `/react-rtekit/all-features/`
3. Click the **Merge tags** card → `/react-rtekit/merge-tags/`
4. The page opens with a running editor, and carries `## Limitations`

PPDS routes this flow through a marketing landing and out to pricing. There is neither
(**E-01**, **E-02**), so it starts at the docs root and ends where a reader decides to
install rather than to buy. The Overview's "Start now" grid is what the landing page's
capability showcase would have been.

## F2 — Adopt

**Entry:** the docs overview. **Exit:** a working installation.

1. `/react-rtekit/` → click **Installation**
2. `/react-rtekit/getting-started/installation/` — prerequisites, every install channel,
   and a complete copy-pasteable example. The test asserts it contains its own import and
   contains no ellipsis.
3. Click **Usage** → `/react-rtekit/getting-started/usage/`
4. A live editor is on the page

## F3 — Implement

**Entry:** anywhere. **Exit:** copied working code.

1. Press `/` → the search palette
2. Type "tables", press the first result → `/react-rtekit/tables/`
3. The demo under `## Basics` is running; **Show source** reveals the code
4. Click **TableOptions** under `## API` → `/react-rtekit/api/types/`
5. `## Used by` links back → `/react-rtekit/tables/`

The round trip is the point: the reference knows which capabilities use a symbol because
the capability declares it, and the back-link is derived rather than maintained.

## F4 — Customise

**Entry:** a capability page. **Exit:** a customised instance.

1. `/react-rtekit/tables/` → click **How to customize** under `## Customization`
2. `/react-rtekit/customization/` — the ten levels, ordered least to most invasive
3. Click **Theming & tokens** → `/react-rtekit/customization/theme-tokens/`
4. A live themed editor, and `createTheme` shown against it

## F5 — Upgrade

**Entry:** any docs page. **Exit:** a migrated project.

1. The version selector in the header → **All versions…**
2. `/react-rtekit/getting-started/versions/` — supported versions and the versioning
   policy
3. Click **Migration** → `/react-rtekit/migration/`
4. Back to Versions, click **changelog** → `/react-rtekit/discover-more/changelog/`

At 1.0.0 there is one version, so the selector has one entry plus the link to the policy.
The machinery is in place for the second.

## F6 — Convert

**Not applicable.**

F6 is the paywall flow: a tier badge on a capability leads to the tier explanation, then
to pricing, then to a purchase and a licence. This package is MIT licensed with a single
free tier, so there is no badge, no pricing page, and nothing to convert to. Recorded in
`EXCEPTIONS.md` as **E-02**; the test skips with that reason rather than being deleted.

## F7 — Support

**Entry:** any docs page. **Exit:** a ticket or an answer.

1. `/react-rtekit/tables/` → **Support** in the footer
2. `/react-rtekit/getting-started/support/` — where to ask what, and what to include
3. **GitHub issues** links to a real issue tracker

The page says plainly that there is no paid tier and no guaranteed response time. There
is no support product to describe, and describing one would be inventing it.

## F8 — Agent

**Entry:** a machine. **Exit:** the complete corpus.

1. `GET /react-rtekit/llms.txt` → `text/plain`, starting `# React RTE Kit`
2. 123 entries, each a Markdown twin
3. `GET` the first entry → Markdown with frontmatter, **not** the application shell
4. `GET /sitemap.xml` → XML

Step 3 is the one that matters. This is a client-rendered SPA whose catch-all answers
200 with `index.html` for every path, so a check that reads status codes reports success
for a corpus that does not exist. The test asserts on the body: it must start `---` and
must not contain `<div id="root">`.

---

## Summary

| Flow | State |
|---|---|
| F1 Evaluate | completable |
| F2 Adopt | completable |
| F3 Implement | completable |
| F4 Customise | completable |
| F5 Upgrade | completable |
| F6 Convert | not applicable — **E-02** |
| F7 Support | completable |
| F8 Agent | completable |

Seven of eight completable; the eighth does not exist to complete.
