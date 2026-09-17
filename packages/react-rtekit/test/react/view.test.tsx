import { render } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { RteContentView } from '../../src/view/index.js';
import { Rte, useEditor } from '../../src/index.js';
import { QUILL_FIXTURES, quillFixture } from '../fixtures/quill.js';
import { XSS_PAYLOADS } from '../fixtures/xss.js';

/**
 * The read-only renderer (04 §6, 05 §17).
 *
 * The contract that matters: what it renders is what the editor would show, and it
 * sanitizes before rendering — this is the component list pages and e-mail previews
 * are told to use.
 */

describe('rendering', () => {
  it('renders stored HTML with the content styles', () => {
    const { container } = render(<RteContentView value="<p>Hello <strong>world</strong></p>" />);
    const view = container.querySelector('.rte-view');
    expect(view).not.toBeNull();
    expect(view?.innerHTML).toBe('<p>Hello <strong>world</strong></p>');
  });

  it('renders every Quill fixture without throwing', () => {
    for (const fixture of QUILL_FIXTURES) {
      const { container, unmount } = render(<RteContentView value={fixture.html} />);
      expect(container.querySelector('.rte-view'), fixture.id).not.toBeNull();
      unmount();
    }
  });

  it('renders markdown', () => {
    const { container } = render(
      <RteContentView value={'# Title\n\n- one\n- two'} valueFormat="markdown" />,
    );
    expect(container.innerHTML).toContain('<h1>Title</h1>');
    expect(container.innerHTML).toContain('<li>one</li>');
  });

  it('renders plain text as paragraphs', () => {
    const { container } = render(<RteContentView value={'one\n\ntwo'} valueFormat="text" />);
    expect(container.innerHTML).toContain('<p>one</p>');
    expect(container.innerHTML).toContain('<p>two</p>');
  });

  it('substitutes merge-tag preview values', () => {
    const { container } = render(
      <RteContentView
        value={quillFixture('default-email-body').html}
        mergeTagPreview={{ contact_first_name: 'Jane' }}
      />,
    );
    expect(container.textContent).toContain('Hi Jane');
    expect(container.textContent).not.toContain('{contact_first_name}');
  });

  it('honours the element type and unstyled mode', () => {
    const { container } = render(<RteContentView value="<p>x</p>" as="article" unstyled />);
    const article = container.querySelector('article');
    expect(article).not.toBeNull();
    expect(article?.className).toBe('');
  });
});

describe('sanitization', () => {
  it.each(XSS_PAYLOADS.map((payload) => [payload.id, payload.html] as const))(
    'neutralizes %s before rendering',
    (_id, html) => {
      const { container } = render(<RteContentView value={html} />);
      expect(container.querySelector('script')).toBeNull();
      expect(container.querySelector('iframe')).toBeNull();
      expect(container.innerHTML.toLowerCase()).not.toContain('javascript:');
      expect(container.innerHTML.toLowerCase()).not.toContain('onerror');
    },
  );

  it('drops classes in the email profile', () => {
    const { container } = render(
      <RteContentView value='<p class="ql-align-center">x</p>' sanitize="email" htmlProfile="email" />,
    );
    expect(container.innerHTML).not.toMatch(/\sclass="(?!rte-view)/);
    expect(container.innerHTML).toContain('text-align: center');
  });
});

describe('editor and view agree (content-styles parity)', () => {
  it('renders the same markup the editor serializes', async () => {
    const source = quillFixture('full-message').html;

    let editorHtml = '';
    function Harness() {
      const editor = useEditor({
        defaultValue: source,
        onReady: (instance) => {
          editorHtml = instance.getHTML();
        },
      });
      return (
        <Rte.Root editor={editor}>
          <Rte.Content aria-label="Message" />
        </Rte.Root>
      );
    }
    render(<Harness />);
    await new Promise((resolve) => setTimeout(resolve, 0));

    const { container } = render(<RteContentView value={source} />);
    expect(container.querySelector('.rte-view')?.innerHTML).toBe(editorHtml);
  });
});

describe('server rendering (02 §8)', () => {
  it('renders to a string without touching the DOM', () => {
    const html = renderToString(<RteContentView value="<p>server</p>" />);
    expect(html).toContain('<p>server</p>');
    expect(html).toContain('rte-view');
  });

  it('sanitizes on the server too', () => {
    const html = renderToString(<RteContentView value='<img src=x onerror="alert(1)">' />);
    expect(html).not.toContain('onerror');
  });

  it('renders the editor shell to a string with its static preview', () => {
    function Harness() {
      const editor = useEditor({ defaultValue: '<p>server side</p>' });
      return (
        <Rte.Root editor={editor}>
          <Rte.Content aria-label="Message" ssrValue="<p>server side</p>" />
        </Rte.Root>
      );
    }
    const html = renderToString(<Harness />);
    expect(html).toContain('rte-root');
    expect(html).toContain('server side');
  });
});
