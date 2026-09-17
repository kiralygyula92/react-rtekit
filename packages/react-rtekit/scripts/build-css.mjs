import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bundle, browserslistToTargets } from 'lightningcss';
import browserslist from 'browserslist';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const srcStyles = path.join(root, 'src', 'styles');
const dist = path.join(root, 'dist');

/** 09 §6: last 2 evergreen versions, Safari/iOS >= 15.4. */
const targets = browserslistToTargets(
  browserslist(['last 2 chrome versions', 'last 2 firefox versions', 'last 2 edge versions', 'safari >= 15.4', 'ios_saf >= 15.4']),
);

/** @type {{ from: string; to: string }[]} */
const BUNDLES = [
  { from: 'index.css', to: 'styles.css' },
  { from: 'base.css', to: 'base.css' },
  { from: 'content.css', to: 'content.css' },
  { from: 'presets/classic.css', to: 'presets/classic.css' },
  { from: 'presets/dark.css', to: 'presets/dark.css' },
  { from: 'presets/compact.css', to: 'presets/compact.css' },
  { from: 'presets/bordered.css', to: 'presets/bordered.css' },
];

async function main() {
  await mkdir(path.join(dist, 'presets'), { recursive: true });

  for (const { from, to } of BUNDLES) {
    const { code } = bundle({
      filename: path.join(srcStyles, from),
      minify: true,
      targets,
      // `@layer` and custom properties must survive verbatim: they are public API (07 §1).
      drafts: { customMedia: false },
    });
    const out = path.join(dist, to);
    await mkdir(path.dirname(out), { recursive: true });
    await writeFile(out, code);
    const kb = (code.length / 1024).toFixed(2);
    process.stdout.write(`CSS  dist/${to}  ${kb} KB\n`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
