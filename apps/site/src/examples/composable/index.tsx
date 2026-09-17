import { useState, type ReactNode } from 'react';
import { Rte, classicTheme, presets, useEditor } from 'react-rtekit';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * The parts, arranged into somebody else's layout (06 §6).
 *
 * The third entry point in 02 §3. `<RichTextEditor>` puts the toolbar above the
 * content and the counter below it; when that is the wrong shape, the same pieces can
 * be placed anywhere — and `<Rte.Portals>` gives the popovers and menus somewhere to
 * mount.
 */

/** A card, standing in for whatever the surrounding application uses. */
function Card({ children }: { children: ReactNode }) {
  return <div className="compose-card">{children}</div>;
}

function CardHeader({ children }: { children: ReactNode }) {
  return <div className="compose-card__header">{children}</div>;
}

function CardFooter({ children }: { children: ReactNode }) {
  return <div className="compose-card__footer">{children}</div>;
}

const SAMPLE =
  '<p>Hi {first_name},</p><p>Your report for {report_month} is ready.</p><p>— The team</p>';

export default function ComposableExample() {
  const [sent, setSent] = useState<string | null>(null);

  const editor = useEditor({
    defaultValue: SAMPLE,
    plugins: presets.email.plugins,
    maxLength: 600,
    required: true,
  });

  return (
    <div className="stack">
      <Rte.Root
        editor={editor}
        theme={classicTheme}
        maxLength={600}
        countUnit="characters"
        mergeTags={[
          { key: 'first_name', label: 'First name', sample: 'Dana' },
          { key: 'report_month', label: 'Report month', sample: 'April' },
        ]}
      >
        <Card>
          <CardHeader>
            <Rte.Label required>Message</Rte.Label>
            <Rte.Toolbar
              items={[
                ['bold', 'italic', 'underline'],
                ['color'],
                ['alignLeft', 'alignCenter', 'alignRight', 'bulletList'],
                ['link'],
              ]}
            />
          </CardHeader>

          <Rte.Content placeholder="Write the message…" />

          <CardFooter>
            <Rte.Counter max={600} />
            <Rte.ErrorText />
            <button
              type="button"
              className="button button--solid"
              onClick={() => {
                const problem = editor.validate();
                setSent(problem ?? editor.getHTML({ profile: 'email' }));
              }}
            >
              Send
            </button>
          </CardFooter>
        </Card>

        {/* Without this, the link popover has nowhere to mount. */}
        <Rte.Portals features={['link']} />
      </Rte.Root>

      {sent ? (
        <>
          <h2>What would be sent</h2>
          <CodeBlock label="Composed output" testId="composable-output">
            {sent}
          </CodeBlock>
        </>
      ) : null}

      <p className="callout">
        The footer here is a <code>div</code> of this page&rsquo;s own, not the
        editor&rsquo;s. <code>{'<Rte.Counter>'}</code> and <code>{'<Rte.ErrorText>'}</code> work
        inside it because they read the editor from context rather than from a parent
        component.
      </p>
    </div>
  );
}
