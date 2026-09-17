import { useState } from 'react';
import { RteContentView } from 'react-rtekit/view';
import libraryChangelog from '../../../../packages/react-rtekit/CHANGELOG.md?raw';
import adapterChangelog from '../../../../packages/react-rtekit-rhf/CHANGELOG.md?raw';

/**
 * The changelog.
 *
 * Rendered through the library's own Markdown pipeline rather than a Markdown
 * component: `<RteContentView valueFormat="markdown">` parses it into the portable
 * document, sanitizes it and renders it with the content styles. That makes this page
 * a standing test of three things at once — the Markdown reader, the sanitizer and the
 * prose styles — against text nobody wrote for a test.
 *
 * The files are the generated ones. Changesets writes them from the notes attached to
 * each change, so what is below was written when the change was made rather than
 * reconstructed afterwards.
 */

/**
 * Nests a changelog's headings under the page's own.
 *
 * A generated changelog starts at `# package-name`, which would give this page a second
 * level-1 heading and a document outline with two roots. The title is already the
 * package selector above, so dropping it leaves the version headings exactly one level
 * below the page's own — nothing else needs shifting.
 */
function nestHeadings(markdown: string): string {
  return markdown
    .split('\n')
    .filter((line) => !line.startsWith('# '))
    .join('\n')
    .trimStart();
}

const PACKAGES = [
  { name: 'react-rtekit', markdown: nestHeadings(libraryChangelog) },
  { name: 'react-rtekit-rhf', markdown: nestHeadings(adapterChangelog) },
];

export function Changelog() {
  const [selected, setSelected] = useState(PACKAGES[0]!.name);
  const current = PACKAGES.find((entry) => entry.name === selected) ?? PACKAGES[0]!;

  return (
    <div className="page page--narrow">
      <h1>Changelog</h1>
      <p className="page__lead">
        Releases are managed with{' '}
        <a href="https://github.com/changesets/changesets" rel="noreferrer noopener" target="_blank">
          Changesets
        </a>
        . What semantic versioning covers here is written down in{' '}
        <a
          href="https://github.com/kiralygyula92/react-rtekit/blob/main/VERSIONING.md"
          rel="noreferrer noopener"
          target="_blank"
        >
          VERSIONING.md
        </a>
        .
      </p>

      <div className="button-row" role="radiogroup" aria-label="Package">
        {PACKAGES.map((entry) => (
          <button
            key={entry.name}
            type="button"
            role="radio"
            aria-checked={entry.name === selected}
            className="chip"
            data-active={entry.name === selected}
            onClick={() => {
              setSelected(entry.name);
            }}
          >
            {entry.name}
          </button>
        ))}
      </div>

      <RteContentView
        key={current.name}
        value={current.markdown}
        valueFormat="markdown"
        as="article"
      />
    </div>
  );
}
