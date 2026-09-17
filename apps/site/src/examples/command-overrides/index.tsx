import { useCallback, useMemo, useState } from 'react';
import { RichTextEditor, type CommandOverrides } from 'react-rtekit';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * Command overrides (06 §3).
 *
 * An override is middleware around a command: it sees the payload, can replace it,
 * and decides whether the built-in runs at all. That is enough to enforce a policy
 * without forking anything — and because `next()` reaches the built-in rather than
 * re-entering the chain, an override may safely call the command it overrides.
 */

/** The design system's swatches. Anything else is snapped to the nearest one. */
const TOKENS = [
  { name: 'ink', value: '#1F2933' },
  { name: 'danger', value: '#C81E1E' },
  { name: 'success', value: '#0E7C3A' },
  { name: 'brand', value: '#2C6ECB' },
];

/** Distance between two hex colours, as plain squared RGB. Good enough to snap. */
function distance(a: string, b: string): number {
  const parse = (hex: string) => [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16));
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  return (ar! - br!) ** 2 + (ag! - bg!) ** 2 + (ab! - bb!) ** 2;
}

/** The token nearest a free-form colour. */
function nearestToken(color: string): { name: string; value: string } {
  return TOKENS.reduce((best, token) =>
    distance(token.value, color) < distance(best.value, color) ? token : best,
  );
}

const SAMPLE = '<p>Add a link, or colour some text with the palette, and watch the log below.</p>';

export default function CommandOverridesExample() {
  const [html, setHtml] = useState(SAMPLE);
  const [log, setLog] = useState<string[]>([]);

  const note = useCallback((message: string) => {
    setLog((entries) =>
      [`${new Date().toLocaleTimeString()} — ${message}`, ...entries].slice(0, 12),
    );
  }, []);

  const commandOverrides: CommandOverrides = useMemo(
    () => ({
      // Company policy: every link this editor produces opens safely in a new tab.
      insertLink: (ctx, next) => {
        note(`insertLink → forced target and rel on ${ctx.payload.href}`);
        return next({ ...ctx.payload, target: '_blank', rel: 'noopener noreferrer' });
      },

      // Snap any colour to the design system, including the custom picker's output.
      setColor: (ctx, next) => {
        const { color } = ctx.payload;
        if (color === null) {
          note('setColor → reset (removes the format, rather than writing black)');
          return next(ctx.payload);
        }
        const token = nearestToken(color);
        if (token.value !== color) note(`setColor → ${color} snapped to ${token.name}`);
        return next({ color: token.value });
      },

      // A command an override can veto outright: this editor refuses horizontal rules.
      insertHorizontalRule: () => {
        note('insertHorizontalRule → refused by policy');
        return false;
      },
    }),
    [note],
  );

  return (
    <div className="stack">
      <RichTextEditor
        preset="full"
        label="Message"
        value={html}
        onChange={(value) => {
          setHtml(value as string);
        }}
        colors={{ palette: TOKENS.map((token) => token.value), allowCustom: true }}
        commandOverrides={commandOverrides}
      />

      <h2>What the overrides did</h2>
      <ul className="event-log" data-testid="override-log">
        {log.length === 0 ? <li>Nothing yet — insert a link or pick a colour.</li> : null}
        {log.map((entry) => (
          <li key={entry}>{entry}</li>
        ))}
      </ul>

      <h2>Output</h2>
      <CodeBlock label="Override output" testId="override-output">
        {html}
      </CodeBlock>
    </div>
  );
}
