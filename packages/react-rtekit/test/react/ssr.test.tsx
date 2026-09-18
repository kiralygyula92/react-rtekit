import { readFileSync } from 'node:fs';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { RichTextEditor, Rte, useEditor } from '../../src/index.js';
import { RteContentView } from '../../src/view/index.js';

/**
 * Server rendering.
 *
 * Two things have to hold for a form with an editor in it to be server-rendered. The
 * field has to produce markup rather than throw — nothing may touch `window` or
 * `document` at module scope or during render — and what it produces has to be the
 * sanitized content, not an empty box that pops into existence on hydration.
 *
 * These run under jsdom, so a global `document` does exist; what they prove is that
 * the *render pass* does not depend on it. The e2e suite covers a real Node render.
 */

/** A composed field, the shape an application would server-render. */
function ComposedField({ value }: { value: string }) {
  const editor = useEditor({ defaultValue: value });
  return (
    <Rte.Root editor={editor}>
      <Rte.Label>Message</Rte.Label>
      <Rte.Content ssrValue={value} placeholder="Write something…" />
    </Rte.Root>
  );
}

describe('server rendering the editor', () => {
  it('renders <RichTextEditor> to a string', () => {
    const html = renderToString(
      <RichTextEditor preset="standard" label="Message" defaultValue="<p>Hello</p>" />,
    );

    expect(html).toContain('rte-root');
    expect(html).toContain('Message');
  });

  it('renders the toolbar, so the field is not a blank box before hydration', () => {
    const html = renderToString(
      <RichTextEditor preset="classic" label="Message" defaultValue="<p>Hello</p>" />,
    );

    expect(html).toContain('role="toolbar"');
    expect(html).toContain('aria-label="Bold"');
  });

  it('renders the value into <RichTextEditor> itself, not only into the parts', () => {
    // The all-in-one component is what most applications server-render, and it used to
    // send an empty box: the content appeared only once the engine mounted, which is a
    // visible flash on every page load and nothing at all without JavaScript.
    const html = renderToString(
      <RichTextEditor
        preset="standard"
        label="Message"
        defaultValue="<p>Quarterly <strong>summary</strong></p>"
      />,
    );

    expect(html).toContain('Quarterly');
    expect(html).toContain('<strong>summary</strong>');
  });

  it('sanitizes what <RichTextEditor> sends from the server', () => {
    const html = renderToString(
      <RichTextEditor
        preset="standard"
        label="Message"
        defaultValue={'<p>ok</p><script>alert(1)</script>'}
      />,
    );

    expect(html).not.toContain('<script');
    expect(html).toContain('ok');
  });

  it('sends nothing for a value the server cannot serialize without the engine', () => {
    // A Markdown or JSON value needs a converter the server entry does not carry, so
    // the field renders empty rather than wrong.
    const html = renderToString(
      <RichTextEditor
        preset="standard"
        label="Message"
        valueFormat="markdown"
        defaultValue="# Title"
      />,
    );

    expect(html).not.toContain('# Title');
    expect(html).toContain('rte-content-host');
  });

  it('renders the content through the serializer when given an ssrValue', () => {
    const html = renderToString(
      <ComposedField value="<p>Quarterly <strong>summary</strong></p>" />,
    );

    expect(html).toContain('Quarterly');
    expect(html).toContain('<strong>summary</strong>');
  });

  it('sanitizes the server-rendered content', () => {
    const html = renderToString(
      <ComposedField value={'<p>ok</p><script>alert(1)</script><img src=x onerror="alert(1)">'} />,
    );

    expect(html).not.toContain('<script');
    expect(html).not.toContain('onerror');
    expect(html).toContain('ok');
  });

  it('mounts no engine on the server', () => {
    // The engine builds a `contenteditable` and stamps `data-rte-key` on every node it
    // renders. The absence of both is what "renders as static HTML, mounts in an effect"
    // looks like — and asserting on what *this* engine writes is the point: the previous
    // version named an attribute of the engine that was replaced, so it would have passed
    // whatever the server did.
    const html = renderToString(<ComposedField value="<p>Hello</p>" />);
    expect(html).not.toContain('contenteditable');
    expect(html).not.toContain('data-rte-key');
  });

  it('suppresses the hydration warning on both content hosts', () => {
    // The engine normalizes markup on mount, so the client's first tree differs from
    // the server's by design. React does not serialize the flag into markup,
    // so this asserts on the source instead — the one place where reading the
    // implementation is the only way to check a contract that has no output.
    const root = 'packages/react-rtekit/src/react';
    const parts = readFileSync(`${root}/parts.tsx`, 'utf8');
    const component = readFileSync(`${root}/RichTextEditor.tsx`, 'utf8');

    expect(parts).toContain('suppressHydrationWarning');
    expect(component).toContain('suppressHydrationWarning');
  });

  it('renders <RteContentView> without an engine', () => {
    const html = renderToString(<RteContentView value="<p>server</p>" />);

    expect(html).toContain('<p>server</p>');
    expect(html).not.toContain('contenteditable');
  });

  it('renders a read-only view as the loading state for a deferred editor', () => {
    // The pattern the SSR guide recommends: the content is already there, and the
    // editor takes over when its chunk arrives.
    const stored = '<h2>Report</h2><p>Body</p>';
    const server = renderToString(<RteContentView value={stored} />);

    expect(server).toContain('<h2>Report</h2>');
    expect(server).toContain('<p>Body</p>');
  });
});

describe('module scope is server-safe', () => {
  it('imports the core entry without a DOM', async () => {
    // `core` is the entry a Node handler uses. Nothing in it may reach for a browser.
    const core = await import('../../src/core/index.js');

    expect(typeof core.sanitizeHtml).toBe('function');
    expect(core.sanitizeHtml('<p>ok</p><script>x</script>')).not.toContain('script');
  });

  it('parses and serializes on the server with no DOMParser', () => {
    // The in-house tokenizer is what makes this work where `DOMParser` is not
    // defined, which is every Node runtime older than the DOM shims.
    const original = globalThis.DOMParser;
    // @ts-expect-error -- deleting a global is the point of the test
    delete globalThis.DOMParser;

    try {
      const html = renderToString(<RteContentView value="<p>no DOMParser here</p>" />);
      expect(html).toContain('no DOMParser here');
    } finally {
      globalThis.DOMParser = original;
    }
  });
});
