import { useState } from 'react';
import { RichTextEditor, type EditorValue } from 'react-rtekit';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * Emoji and the slash palette.
 *
 * Both are the same primitive as mentions and merge tags, so their keyboard model is
 * identical: arrows move, Enter or Tab inserts, Escape closes.
 */

export default function EmojiAndSlashExample() {
  const [value, setValue] = useState('<p></p>');

  return (
    <div className="stack">
      <p className="page__lead">
        Type a slash at the start of an empty line for the command palette, or a colon followed by a
        name for an emoji. Emoji insert as characters, never images, so they survive plain-text
        export and every e-mail client.
      </p>

      <RichTextEditor
        preset="full"
        label="Message"
        hideLabel
        value={value}
        slashMenu
        onChange={(next: EditorValue) => {
          setValue(next as string);
        }}
      />

      <h2>Serialized</h2>
      <CodeBlock label="Emoji and slash output" testId="emoji-and-slash-output">
        {value}
      </CodeBlock>
    </div>
  );
}
