/**
 * A synthetic ~100 KB document for the performance budget tests and the
 * `large-document` demo page.
 *
 * Generated rather than checked in, so the repository stays small and the shape can
 * be tuned without a diff the size of a novel.
 */

const WORDS = [
  'invoice', 'quarterly', 'schedule', 'account', 'summary', 'contract', 'allocation', 'forecast',
  'dispatch', 'inventory', 'renewal', 'draft', 'reference', 'settlement', 'distribution',
];

function sentence(seed: number): string {
  const length = 8 + (seed % 9);
  const words: string[] = [];
  for (let i = 0; i < length; i += 1) {
    words.push(WORDS[(seed * 7 + i * 13) % WORDS.length]!);
  }
  const text = words.join(' ');
  return text.charAt(0).toUpperCase() + text.slice(1) + '.';
}

/**
 * Builds a document of roughly `targetBytes` of HTML, mixing paragraphs, headings,
 * lists, links and coloured spans so the cost is representative rather than a wall of
 * identical text.
 */
export function buildLargeDocument(targetBytes = 100_000): string {
  const parts: string[] = [];
  let size = 0;
  let index = 0;

  while (size < targetBytes) {
    const kind = index % 7;
    let block: string;
    if (kind === 0) {
      block = `<h2>${sentence(index)}</h2>`;
    } else if (kind === 3) {
      block =
        '<ul>' +
        [0, 1, 2].map((offset) => `<li>${sentence(index + offset)}</li>`).join('') +
        '</ul>';
    } else if (kind === 5) {
      block = `<p><a href="https://example.com/${index}">${sentence(index)}</a></p>`;
    } else if (kind === 6) {
      // #C81E1E rather than #FF0000: the demo page runs axe over this fixture, and
      // pure red is 4.0:1 on white — a fixture failure that reads like a library one.
      block = `<p><span style="color:#C81E1E">${sentence(index)}</span></p>`;
    } else {
      block = `<p><strong>${sentence(index)}</strong> ${sentence(index + 1)}</p>`;
    }
    parts.push(block);
    size += block.length;
    index += 1;
  }

  return parts.join('');
}
