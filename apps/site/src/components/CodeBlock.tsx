import type { ReactNode } from 'react';

/**
 * A scrollable code block that the keyboard can reach.
 *
 * A `<pre>` with its own scrollbar is a scrollable region, and a scrollable region
 * that is not focusable cannot be read by anyone navigating with a keyboard — axe
 * flags it, and rightly. Giving it a tab stop needs a role and a name to go with it,
 * which is the whole reason this is a component rather than an attribute repeated
 * two dozen times.
 */
export interface CodeBlockProps {
  /** What this block contains, for the accessible name. */
  label: string;
  testId?: string;
  children: ReactNode;
}

export function CodeBlock({ label, testId, children }: CodeBlockProps) {
  return (
    <pre tabIndex={0} role="region" aria-label={label} {...(testId ? { 'data-testid': testId } : {})}>
      <code>{children}</code>
    </pre>
  );
}
