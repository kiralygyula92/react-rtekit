/**
 * The 26 defects of the legacy wrapper, as listed in `docs/regressions.md`.
 *
 * The parity page shows this list behind the "show differences" toggle: the visuals
 * match the old editor, and every entry here is a way the behaviour deliberately
 * does not. Each one has a named regression test (`test/react/regressions.test.tsx`).
 */

/** One fixed defect. */
export interface FixedBug {
  /** The identifier used throughout the docs and the regression suite. */
  id: string;
  /** What the original did. */
  was: string;
  /** What this library does instead. */
  now: string;
}

export const FIXED_BUGS: FixedBug[] = [
  {
    id: 'R1',
    was: 'defaultValue was read once, so a form reset or a different report left the old HTML in place.',
    now: 'Controlled value/onChange, uncontrolled defaultValue, and an explicit editor.setContent().',
  },
  {
    id: 'R2',
    was: 'An empty editor produced <p><br></p>, so required passed and an empty e-mail could be sent.',
    now: 'isEmpty() ignores empty blocks; Send above is disabled on exactly that markup.',
  },
  {
    id: 'R3',
    was: 'The 2048 limit counted the HTML string, so formatting ate the budget and there was no counter.',
    now: 'The limit counts text characters and the counter below the editor shows it live.',
  },
  {
    id: 'R4',
    was: 'The toolbar had a hard-coded id="toolbar", duplicated whenever two editors shared a page.',
    now: 'Every id comes from useId; see the multiple-editors example.',
  },
  {
    id: 'R5',
    was: 'Toolbar buttons did not prevent mousedown, so clicking one moved focus and formatted a stale selection.',
    now: 'Every control prevents mousedown and the engine restores the selection before each command.',
  },
  {
    id: 'R6',
    was: 'Align-left stored "" in one place and null in another, so the highlight was inconsistent.',
    now: "One canonical alignment value with 'left' as the default.",
  },
  {
    id: 'R7',
    was: 'Alignment and list commands needed setTimeout(() => quill.update(), 10).',
    now: 'Commands commit synchronously; the next line already sees the result.',
  },
  {
    id: 'R8',
    was: 'Active formats only updated when a range existed, so the toolbar kept stale highlights after blur.',
    now: 'Format state is recomputed on every selection and content change, including collapse to none.',
  },
  {
    id: 'R9',
    was: 'The blur handler kept isFocused true when focus moved to another input.',
    now: 'The focus ring follows the engine’s own focus state.',
  },
  {
    id: 'R10',
    was: 'Focus swapped a 1px border for a 2px one, shifting the content by a pixel.',
    now: 'An inset ring, so focusing the editor moves nothing. Click in and watch the text.',
  },
  {
    id: 'R11',
    was: 'quill.snow.css was imported globally, then partly overridden and partly hidden.',
    now: 'A scoped stylesheet in @layer rtekit; nothing leaks out and nothing fights it.',
  },
  {
    id: 'R12',
    was: 'The value was written twice, through setValue and onChange, and validation lagged.',
    now: 'One onChange. The form binding lives in react-rtekit-rhf.',
  },
  {
    id: 'R13',
    was: 'The component required react-hook-form’s setValue as a prop.',
    now: 'No form-library dependency in the core; this page uses plain useState.',
  },
  {
    id: 'R14',
    was: 'Colour “Reset” applied #000000, so text stopped following the theme.',
    now: 'Reset removes the colour format. Colour some text, then reset it.',
  },
  {
    id: 'R15',
    was: 'Swatches were div elements with onClick: no focus, no keyboard, no names.',
    now: 'A radiogroup of named buttons with arrow-key navigation.',
  },
  {
    id: 'R16',
    was: 'No role="toolbar", no aria-pressed, no accessible name, no aria-describedby.',
    now: 'A full ARIA toolbar with roving tabindex, and a labelled, described textbox.',
  },
  {
    id: 'R17',
    was: 'Several aria-labels and picker strings were hard-coded English.',
    now: 'Every string comes from localization.',
  },
  {
    id: 'R18',
    was: 'disabled mapped to Quill’s readOnly, with no visual difference, and stayed focusable.',
    now: 'Distinct disabled and readOnly modes with their own semantics and styling.',
  },
  {
    id: 'R19',
    was: 'Nothing was sanitized — not the initial value, not pasted content, not the HTML that was e-mailed.',
    now: 'Sanitization at every boundary; try the sanitization example.',
  },
  {
    id: 'R20',
    was: 'Pasting from Word or Google Docs injected arbitrary markup and styles.',
    now: 'A paste pipeline with cleanup profiles for Office, Google Docs and Excel sources.',
  },
  {
    id: 'R21',
    was: 'onChange carried no source, so controlled usage risked loops.',
    now: "Every change reports source: 'user' | 'api' | 'paste' | 'history'.",
  },
  {
    id: 'R22',
    was: '287px was a magic number repeated three times, with no minRows or autogrow.',
    now: 'A theme token, overridable with minHeight/maxHeight, plus autogrow.',
  },
  {
    id: 'R23',
    was: 'Merge tags were raw text, so formatting or deleting could split them.',
    now: 'Atomic merge-tag nodes. Select all and bold this message: the tags survive.',
  },
  {
    id: 'R24',
    was: 'There was no placeholder, so an empty field looked broken.',
    now: 'A placeholder slot, shown above when the message is empty.',
  },
  {
    id: 'R25',
    was: 'No undo affordance and no way to discover the shortcuts.',
    now: 'History commands, a shortcut map, and the shortcut in every tooltip.',
  },
  {
    id: 'R26',
    was: 'The component was not memoized and rebuilt its handlers on every keystroke.',
    now: 'Memoized parts and per-item state subscriptions, inside a form that re-renders freely.',
  },
];
