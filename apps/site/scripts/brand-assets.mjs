/**
 * Renders the site's icons and its social card into `public/`.
 *
 *   pnpm --filter @react-rtekit/site brand:assets
 *
 * The outputs are committed, so this runs when the design changes rather than on every
 * build: `favicon.svg` is the source, and `favicon.ico`, `apple-touch-icon.png` and
 * `og.png` are drawn from it and from the markup below by a headless Chromium.
 */
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const publicDir = fileURLToPath(new URL('../public/', import.meta.url));
const font = fileURLToPath(
  new URL(
    '../node_modules/@fontsource-variable/open-sans/files/open-sans-latin-wght-normal.woff2',
    import.meta.url,
  ),
);
const fontData = readFileSync(font).toString('base64');

// The site's accent in light mode, and its dark background.
const ACCENT = '#0c63ce';
const NAVY = '#0b1120';

/** The mark: three lines of text and a caret, on the accent. */
const glyph = (fill) => `
  <path d="M8 9h16v2.6H8zM8 14.7h10v2.6H8zM8 20.4h16V23H8z" fill="${fill}" />
  <rect x="20.2" y="13.1" width="1.8" height="5.8" rx="0.9" fill="${fill}" />`;

const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="${ACCENT}" />${glyph('#fff')}
</svg>
`;
writeFileSync(`${publicDir}favicon.svg`, faviconSvg);

const BULLETS =
  'M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5m0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5m0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5M7 19h14v-2H7zm0-6h14v-2H7zm0-8v2h14V5z';
const NUMBERS =
  'M2 17h2v.5H3v1h1v.5H2v1h3v-4H2zm1-9h1V4H2v1h1zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2zm5-6v2h14V5zm0 14h14v-2H7zm0-6h14v-2H7z';
const LINK =
  'M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1M8 13h8v-2H8zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5';
const icon24 = (d) =>
  `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="${d}"/></svg>`;

/** The social card: what the product is, and what it looks like. */
const card = `<!doctype html>
<html><head><style>
  @font-face { font-family: 'Open Sans'; src: url(data:font/woff2;base64,${fontData}) format('woff2'); font-weight: 300 800; }
  * { box-sizing: border-box; margin: 0; }
  body { width: 1200px; height: 630px; background: ${NAVY}; color: #e2e8f0; font-family: 'Open Sans', sans-serif; overflow: hidden; }
  .glow { position: absolute; inset: 0; background: radial-gradient(900px 500px at 85% 20%, rgba(96,165,250,.18), transparent 60%); }
  .wrap { position: relative; display: grid; grid-template-columns: 1fr 520px; gap: 56px; align-items: center; height: 100%; padding: 0 72px; }
  .brand { display: flex; align-items: center; gap: 16px; font-size: 30px; font-weight: 700; color: #fff; letter-spacing: -0.01em; }
  .brand svg { width: 56px; height: 56px; }
  h1 { margin-top: 40px; font-size: 54px; line-height: 1.12; font-weight: 700; letter-spacing: -0.02em; color: #fff; text-wrap: balance; }
  p { margin-top: 24px; font-size: 25px; line-height: 1.45; color: #94a3b8; text-wrap: pretty; }
  .editor { background: #fff; border-radius: 14px; box-shadow: 0 30px 80px rgba(0,0,0,.45); overflow: hidden; color: #1b1f24; }
  .toolbar { display: flex; gap: 6px; padding: 12px 14px; border-bottom: 1px solid #e3e6ea; background: #f7f8fa; }
  .tool { width: 34px; height: 34px; border-radius: 8px; display: grid; place-items: center; font-size: 17px; color: #334155; }
  .tool.on { background: #dbeafe; color: ${ACCENT}; }
  .sep { width: 1px; margin: 6px 4px; background: #e3e6ea; }
  .doc { padding: 26px 28px 30px; font-size: 21px; line-height: 1.6; }
  .doc h2 { font-size: 27px; margin-bottom: 10px; letter-spacing: -0.01em; }
  .doc a { color: ${ACCENT}; text-decoration: underline; }
  .doc ul { margin-top: 8px; padding-left: 26px; }
  .caret { display: inline-block; width: 2px; height: 1.1em; background: ${ACCENT}; vertical-align: text-bottom; margin-left: 2px; }
</style></head>
<body><div class="glow"></div><div class="wrap">
  <div>
    <div class="brand"><svg viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="${ACCENT}"/>${glyph('#fff')}</svg>React RTE Kit</div>
    <h1>The rich-text editor for React that fits your design system</h1>
    <p>Accessible, themeable and sanitized.<br />No dependencies beyond React.</p>
  </div>
  <div class="editor">
    <div class="toolbar">
      <span class="tool"><b>B</b></span><span class="tool"><i>I</i></span><span class="tool"><u>U</u></span>
      <span class="sep"></span>
      <span class="tool on">${icon24(BULLETS)}</span><span class="tool">${icon24(NUMBERS)}</span>
      <span class="sep"></span>
      <span class="tool">${icon24(LINK)}</span>
    </div>
    <div class="doc">
      <h2>Meeting notes</h2>
      <div>Send the <b>onboarding email</b> by Friday. The draft is in the <a>shared folder</a>.</div>
      <ul><li>Review the copy with legal</li><li>Test in Outlook and Gmail<span class="caret"></span></li></ul>
    </div>
  </div>
</div></body></html>`;

const browser = await chromium.launch();

async function shoot(html, width, height) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.setContent(html);
  await page.evaluate(() => document.fonts.ready);
  const png = await page.screenshot({ type: 'png' });
  await page.close();
  return png;
}

writeFileSync(`${publicDir}og.png`, await shoot(card, 1200, 630));

// iOS rounds the corners itself and fills transparency with black, so this one is square
// and opaque.
const touch = `<body style="margin:0"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="180" height="180" style="display:block">
  <rect width="32" height="32" fill="${ACCENT}"/><g transform="translate(3.2 3.2) scale(0.8)">${glyph('#fff')}</g></svg></body>`;
writeFileSync(`${publicDir}apple-touch-icon.png`, await shoot(touch, 180, 180));

// favicon.ico: PNG images in an ICO container, which every browser and crawler reads.
const icon = (size) =>
  `<body style="margin:0;background:transparent"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${size}" height="${size}" style="display:block">${faviconSvg.replace(/<\/?svg[^>]*>/g, '')}</svg></body>`;
async function shootTransparent(html, size) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(html);
  const png = await page.screenshot({ type: 'png', omitBackground: true });
  await page.close();
  return png;
}
const sizes = [16, 32, 48];
const images = [];
for (const size of sizes) images.push(await shootTransparent(icon(size), size));
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
sizes.forEach((size, index) => {
  const entry = 6 + 16 * index;
  header.writeUInt8(size, entry);
  header.writeUInt8(size, entry + 1);
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(images[index].length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += images[index].length;
});
writeFileSync(`${publicDir}favicon.ico`, Buffer.concat([header, ...images]));

await browser.close();
process.stdout.write(
  'favicon.svg, favicon.ico, apple-touch-icon.png and og.png written to public/\n',
);
