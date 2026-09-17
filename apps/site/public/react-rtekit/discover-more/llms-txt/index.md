---
pluginId: react-rtekit
pathname: /react-rtekit/discover-more/llms-txt/
title: llms.txt
description: The machine-readable index of this documentation, and how to point an agent at it.
archetype: I
section: discover-more
---

# llms.txt

This documentation is machine-readable. Point an agent at it rather than scraping it.

## The index

[`/react-rtekit/llms.txt`](/react-rtekit/llms.txt) lists every page, grouped by section, with the one-line description each page carries. It is generated from the same field the page's H1 subtitle and meta description use, so it cannot drift from the site.

## Markdown twins

Appending `.md` to any documentation URL returns the authored Markdown:

```
/react-rtekit/tables/       the page
/react-rtekit/tables.md     its source
```

The twin carries the frontmatter, so an agent reading it gets the capability id, the group and the symbols the page documents, not just the prose.

## Sitemap

[`/sitemap.xml`](/sitemap.xml) covers every page.

## What this means in practice

An agent answering a question about this package should read `llms.txt`, pick the pages it needs and fetch their `.md` twins. That is the whole corpus, in Markdown, with no HTML to strip and no JavaScript to run.
