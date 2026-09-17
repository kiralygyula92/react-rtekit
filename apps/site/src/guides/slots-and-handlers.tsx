import { Callout, Code, Section, SeeAlso } from './Guide';

/** Ten levels of override, from a class name to your own UI, with an example of each. */
export function SlotsAndHandlers() {
  return (
    <>
      <p className="page__lead">
        Ten levels of override, from a class name to your own UI, with an example of each.
      </p>

      <Section id="levels" title="The levels">
        <ol>
          <li><strong>Props</strong> — the documented configuration.</li>
          <li><strong>classNames / styles</strong> — per-part class names.</li>
          <li><strong>Theme tokens</strong> — every visual, as data.</li>
          <li><strong>Toolbar config</strong> — which controls, in what order.</li>
          <li><strong>Custom toolbar items</strong> — controls of your own.</li>
          <li><strong>Slots</strong> — replace any component.</li>
          <li><strong>Handler middleware</strong> — wrap any interaction.</li>
          <li><strong>Command overrides</strong> — change what a command does.</li>
          <li><strong>Composable parts</strong> — assemble the chrome yourself.</li>
          <li><strong>Headless</strong> — <code>useEditor</code> and your own UI entirely.</li>
        </ol>
        <p>Use the lowest level that does the job; each one leaves the rest working.</p>
      </Section>

      <Section id="slots" title="Slots">
        <p>
          Every part is replaceable — 44 of them, down to the twelve primitives. A replacement
          that spreads the props it is given keeps the behaviour, including the
          <code>mousedown</code> prevention that makes toolbar commands apply to the selection.
        </p>

        <Code label="Replacing a slot">{`<RichTextEditor
  slots={{
    ToolbarButton: ({ active, label, icon, ...rest }) => (
      <MyButton {...rest} aria-pressed={active} title={label}>{icon}</MyButton>
    ),
    Counter: ({ count, max }) => <MyCounter value={count} max={max} />,
  }}
/>`}</Code>

        <Callout>
          Replacing the twelve primitives — <code>Button</code>, <code>Popover</code>, <code>Dialog</code>,
          <code>TextInput</code> and the rest — re-skins the whole editor for a design system without
          touching anything else.
        </Callout>
      </Section>

      <Section id="handlers" title="Handler middleware">
        <p>
          Every interaction goes through a handler you can wrap. Call <code>next()</code> to let it
          happen, pass an override to change it, or do neither to cancel.
        </p>

        <Code label="Handlers">{`<RichTextEditor
  handlers={{
    // Analytics, then the default.
    onToolbarCommand: (ctx, next) => { track('rte', ctx.command); next(); },
    // Company policy: plain-text paste only.
    onPaste: (ctx, next) => next({ mode: 'text' }),
    // Confirm before following an external link.
    onLinkOpen: async ({ href }, next) => { if (await confirm(href)) next(); },
    // Refuse a file before it leaves the browser.
    onUploadStart: ({ file }, next) => { if (withinQuota(file)) next(); },
  }}
/>`}</Code>
      </Section>

      <SeeAlso examples={['toolbar-config', 'presets', 'accessibility']} guides={['plugins', 'theming']} />
    </>
  );
}
