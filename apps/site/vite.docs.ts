import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizePath, type Plugin } from 'vite';
import { OG_IMAGE, pageHead, type Head, type SiteIdentity } from './src/docs/head';

/**
 * How the documentation content gets from `manifest.json` into the browser.
 *
 * Two plugins, used by `vite.config.ts`.
 *
 * @module
 */

const MANIFEST = fileURLToPath(new URL('./src/content/manifest.json', import.meta.url));

const V_MANIFEST = 'virtual:docs/manifest';
const V_BODIES = 'virtual:docs/bodies';
const V_BODY = 'virtual:docs/body/';

interface ManifestPage {
  pathname: string;
  title: string;
  description: string;
  archetype: string;
  html: string;
}

interface Manifest {
  config: { id: string; name: string };
  origin: string;
  pages: ManifestPage[];
}

const readManifest = (): Manifest => JSON.parse(readFileSync(MANIFEST, 'utf8')) as Manifest;

const identity = (manifest: Manifest): SiteIdentity => ({
  name: manifest.config.name,
  id: manifest.config.id,
  origin: manifest.origin,
});

/** A page's slug for file names: `api-types` for `/react-rtekit/api/types/`. */
const slugOf = (manifest: Manifest, pathname: string): string =>
  pathname.replace(`/${manifest.config.id}/`, '').replace(/\/$/, '').replace(/\//g, '-') ||
  'overview';

const escape = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ── 1. The content modules ───────────────────────────────────────────────────

/**
 * Serves the manifest without its page bodies, and each body as a module of its own.
 *
 * `virtual:docs/manifest` is everything the shell needs on every page: titles, the nav,
 * headings for search. `virtual:docs/bodies` maps each pathname to a dynamic import of
 * `virtual:docs/body/<n>`, so every page's HTML is its own chunk and the main bundle
 * carries none of it. The bodies were over a third of that bundle.
 */
export function docsContent(): Plugin {
  let manifest = readManifest();
  const ids = () => [
    V_MANIFEST,
    V_BODIES,
    ...manifest.pages.map((_page, index) => `${V_BODY}${index}`),
  ];

  return {
    name: 'docs-content',
    buildStart() {
      manifest = readManifest();
      this.addWatchFile(MANIFEST);
    },
    resolveId(id) {
      return id === V_MANIFEST || id === V_BODIES || id.startsWith(V_BODY) ? `\0${id}` : null;
    },
    load(id) {
      if (id === `\0${V_MANIFEST}`) {
        const pages = manifest.pages.map(({ html: _html, ...page }) => page);
        return `export default ${JSON.stringify({ ...manifest, pages })};`;
      }
      if (id === `\0${V_BODIES}`) {
        const entries = manifest.pages.map(
          (page, index) => `${JSON.stringify(page.pathname)}: () => import("${V_BODY}${index}")`,
        );
        return `export default {\n${entries.join(',\n')}\n};`;
      }
      if (id.startsWith(`\0${V_BODY}`)) {
        const page = manifest.pages[Number(id.slice(V_BODY.length + 1))];
        return `export default ${JSON.stringify(page?.html ?? '')};`;
      }
      return null;
    },
    // Recompiling the content in development reloads the page with the new manifest.
    handleHotUpdate({ file, server }) {
      if (normalizePath(file) !== normalizePath(MANIFEST)) return;
      manifest = readManifest();
      for (const id of ids()) {
        const module = server.moduleGraph.getModuleById(`\0${id}`);
        if (module) server.moduleGraph.invalidateModule(module);
      }
      server.ws.send({ type: 'full-reload' });
      return [];
    },
    // The site-wide social tags, and the front page's own, for development and as the
    // template the build copies for every page.
    transformIndexHtml(html) {
      const site = identity(manifest);
      const home = manifest.pages.find((page) => page.pathname === `/${site.id}/`);
      if (!home) throw new Error('The manifest has no front page');
      return html.replace('<!--head-->', `${siteHead(site)}\n${pageBlock(pageHead(home, site))}`);
    },
  };
}

/** Tags that are the same on every page. */
function siteHead(site: SiteIdentity): string {
  const image = `${site.origin}${OG_IMAGE.path}`;
  return [
    `<meta property="og:site_name" content="${escape(site.name)}" />`,
    '<meta property="og:locale" content="en_US" />',
    `<meta property="og:image" content="${image}" />`,
    '<meta property="og:image:type" content="image/png" />',
    `<meta property="og:image:width" content="${OG_IMAGE.width}" />`,
    `<meta property="og:image:height" content="${OG_IMAGE.height}" />`,
    `<meta property="og:image:alt" content="${escape(site.name)}: rich-text editor for React" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:image" content="${image}" />`,
  ].join('\n    ');
}

/** Tags that belong to one page, between markers so the build can swap them. */
function pageBlock(head: Head, options: { notFound?: boolean; preload?: string[] } = {}): string {
  const tags = [
    `<title>${escape(head.title)}</title>`,
    `<meta name="description" content="${escape(head.description)}" />`,
    options.notFound
      ? '<meta name="robots" content="noindex" />'
      : `<link rel="canonical" href="${head.url}" />`,
    `<meta property="og:type" content="${head.type}" />`,
    `<meta property="og:title" content="${escape(head.title)}" />`,
    `<meta property="og:description" content="${escape(head.description)}" />`,
    ...(options.notFound ? [] : [`<meta property="og:url" content="${head.url}" />`]),
    `<meta name="twitter:title" content="${escape(head.title)}" />`,
    `<meta name="twitter:description" content="${escape(head.description)}" />`,
    ...(options.preload ?? []).map(
      (file) => `<link rel="modulepreload" crossorigin href="/${file}" />`,
    ),
  ];
  return `<!--page-->\n    ${tags.join('\n    ')}\n    <!--/page-->`;
}

// ── 2. One HTML file per page ────────────────────────────────────────────────

/**
 * Writes every page to `<pathname>index.html`, with its own head, and `404.html`.
 *
 * The application renders in the browser, so the `<head>` a crawler or a link preview
 * reads is whatever the server sent. With one `index.html` for every URL that was the
 * same generic title and description everywhere, which is what a shared link showed.
 * Each page's file is the same application with that page's title, description,
 * canonical URL and social tags already in it, and `modulepreload` hints for the page's
 * own chunks (its body, its demos) so they download alongside the main bundle instead of
 * after it.
 *
 * It also makes a page URL a real file, so the host needs no catch-all rewrite, and an
 * address with no page behind it gets `404.html` and a 404 status rather than a 200.
 */
export function staticPages(): Plugin {
  let outDir = '';
  let root = '';

  return {
    name: 'docs-static-pages',
    apply: 'build',
    configResolved(config) {
      root = normalizePath(config.root);
      outDir = path.resolve(config.root, config.build.outDir);
    },
    writeBundle: {
      sequential: true,
      order: 'post',
      handler(_options, bundle) {
        const templateFile = path.join(outDir, 'index.html');
        if (!existsSync(templateFile)) return; // a failed build: let its own error stand
        const template = readFileSync(templateFile, 'utf8');
        if (!/<!--page-->[\s\S]*<!--\/page-->/.test(template)) {
          throw new Error('index.html lost its <!--head--> marker');
        }

        const manifest = readManifest();
        const site = identity(manifest);

        // Which output chunk each source module became, and what each chunk imports.
        const chunkOf = new Map<string, string>();
        const importsOf = new Map<string, string[]>();
        const entryGraph = new Set<string>();
        for (const item of Object.values(bundle)) {
          if (item.type !== 'chunk') continue;
          importsOf.set(item.fileName, item.imports);
          if (item.facadeModuleId) chunkOf.set(normalizePath(item.facadeModuleId), item.fileName);
        }
        const closure = (file: string, into: Set<string>): void => {
          if (into.has(file)) return;
          into.add(file);
          for (const next of importsOf.get(file) ?? []) closure(next, into);
        };
        for (const item of Object.values(bundle)) {
          if (item.type === 'chunk' && item.isEntry) closure(item.fileName, entryGraph);
        }

        const TOOLS: Record<string, string> = {
          [`/${site.id}/demos/playground/`]: `${root}/src/routes/Playground.tsx`,
          [`/${site.id}/demos/theme-editor/`]: `${root}/src/routes/ThemeEditor.tsx`,
        };

        const render = (block: string): string =>
          template
            .replace(/<!--page-->[\s\S]*<!--\/page-->/, block)
            .replace(/\n\s*<!--\/?page-->/g, '');

        manifest.pages.forEach((page, index) => {
          // The page's own chunks, and everything they import that the entry does not.
          const wanted = [
            `\0${V_BODY}${index}`,
            ...Array.from(page.html.matchAll(/<div data-demo="([^"]+)"><\/div>/g), ([, slug]) => [
              `${root}/src/examples/${slug ?? ''}/index.tsx`,
              `${root}/src/examples/${slug ?? ''}/index.tsx?raw`,
            ]).flat(),
            ...(TOOLS[page.pathname] ? [TOOLS[page.pathname] ?? ''] : []),
          ];
          const files = new Set<string>();
          for (const id of wanted) {
            const file = chunkOf.get(id);
            if (!file) throw new Error(`${page.pathname}: no chunk was built for ${id}`);
            closure(file, files);
          }
          const preload = [...files].filter((file) => !entryGraph.has(file));

          const target = path.join(outDir, page.pathname, 'index.html');
          mkdirSync(path.dirname(target), { recursive: true });
          writeFileSync(target, render(pageBlock(pageHead(page, site), { preload })));
        });

        const notFound = pageHead(
          {
            title: 'Page not found',
            description: 'There is no page at this address.',
            pathname: '/404/',
          },
          site,
        );
        writeFileSync(
          path.join(outDir, '404.html'),
          render(pageBlock(notFound, { notFound: true })),
        );
        // The root file is served by nothing on the host (`/` redirects), but `vite
        // preview` falls back to it, so it keeps the front page's head without markers.
        writeFileSync(
          templateFile,
          render(/<!--page-->[\s\S]*<!--\/page-->/.exec(template)?.[0] ?? ''),
        );

        guardRoutes(outDir, manifest);
      },
    },
  };
}

/**
 * Fails the build if anything but a page's own HTML would be served at a page's URL.
 *
 * A host resolving a directory to its index does not check the extension, so a stray
 * `index.md` in a route's directory is served in place of the page. That happened once:
 * the Markdown twins were written as `<page>/index.md`, and a refresh on any page showed
 * raw frontmatter while in-app navigation looked fine. The check is on the output, against
 * the page list, so it stops the build rather than the reader.
 */
function guardRoutes(outDir: string, manifest: Manifest): void {
  const problems: string[] = [];
  for (const { pathname } of manifest.pages) {
    const directory = path.join(outDir, pathname);
    const asFile = path.join(outDir, pathname.replace(/\/$/, ''));
    if (existsSync(asFile) && statSync(asFile).isFile()) problems.push(`${pathname} is a file`);
    if (!existsSync(path.join(directory, 'index.html')))
      problems.push(`${pathname}index.html is missing`);
    for (const entry of existsSync(directory) ? readdirSync(directory) : []) {
      if (/^index\./i.test(entry) && entry !== 'index.html') problems.push(`${pathname}${entry}`);
    }
  }
  if (problems.length > 0) {
    throw new Error(
      `${problems.length} page URL(s) would not serve the page, e.g. ${problems.slice(0, 3).join(', ')}`,
    );
  }
}

let namingManifest: Manifest | undefined;

/**
 * File names that say what a lazy chunk is, so the network panel reads as the site does:
 * `page-tables-…js`, `example-tables-…js`, `source-tables-…js`.
 */
export function chunkFileNames(info: { facadeModuleId: string | null; name: string }): string {
  const id = normalizePath(info.facadeModuleId ?? '');
  const example = /\/src\/examples\/([^/]+)\/index\.tsx(\?raw)?$/.exec(id);
  if (example) return `assets/${example[2] ? 'source' : 'example'}-${example[1] ?? ''}-[hash].js`;
  if (id.startsWith(`\0${V_BODY}`)) {
    const manifest = (namingManifest ??= readManifest());
    const page = manifest.pages[Number(id.slice(V_BODY.length + 1))];
    return `assets/page-${page ? slugOf(manifest, page.pathname) : 'unknown'}-[hash].js`;
  }
  return 'assets/[name]-[hash].js';
}
