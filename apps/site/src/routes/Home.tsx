import { Link } from 'react-router';

const FEATURES = [
  {
    title: 'Engine adapter, not a wrapper',
    body: 'An EditorEngine interface owns the document layer; Lexical is the default adapter and never leaks into the public API.',
  },
  {
    title: 'Sanitized at every boundary',
    body: 'Initial value, paste, drop, programmatic insert and output all pass an allowlist sanitizer. Four profiles, hard rules that no config can disable.',
  },
  {
    title: 'Legacy HTML keeps working',
    body: 'Interop profiles read Quill markup and emit standards, Quill-compatible or e-mail-safe HTML, so stored content needs no migration.',
  },
  {
    title: 'Every part is replaceable',
    body: 'Ten override levels: tokens, classNames, slotProps, toolbar config, render props, handler middleware, command overrides, slots, plugins, headless.',
  },
  {
    title: 'Emptiness is a first-class concept',
    body: 'isEmpty() ignores <p><br></p> and length limits count text, not markup — the two bugs that let empty e-mails be sent.',
  },
  {
    title: 'Accessible by construction',
    body: 'A real ARIA toolbar with roving focus, a named textbox, linked errors, live-region announcements and a keyboard model that covers every command.',
  },
];

export function Home() {
  return (
    <div className="page">
      <section className="hero">
        <h1 className="hero__title">A rich text editor you can actually own</h1>
        <p className="hero__lead">
          react-rtekit is a React rich-text editor built for products that have to live with
          their own HTML: sanitized on every boundary, themeable down to the token, and
          replaceable at every level from a CSS variable to the whole UI.
        </p>
        <div className="hero__actions">
          <Link className="button button--solid" to="/docs/getting-started">
            Get started
          </Link>
          <Link className="button" to="/examples">
            Browse examples
          </Link>
        </div>
        <pre className="hero__install">
          <code>pnpm add react-rtekit lexical @lexical/react</code>
        </pre>
      </section>

      <section className="feature-grid" aria-label="Features">
        {FEATURES.map((feature) => (
          <article key={feature.title} className="feature-card">
            <h2>{feature.title}</h2>
            <p>{feature.body}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
