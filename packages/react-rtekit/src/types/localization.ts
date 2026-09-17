/**
 * Every visible string, tooltip, aria-label and announcement.
 *
 * Interpolation uses `{name}` placeholders. Any value may instead be a function, which
 * is how plural rules and locale-specific ordering are expressed.
 *
 * @group Localization
 */

/** A string, or a function of its interpolation values. */
export type LocalizedString = string | ((values: Record<string, string | number>) => string);

/** Number, date and file-size formatting hooks used by counters and the draft prompt. */
export interface RteFormatters {
  /** Formats a count for the counter and the search results. */
  number(value: number): string;
  /** e.g. "2 minutes ago". */
  relativeTime(value: Date | number): string;
  /** e.g. "5 MB". */
  fileSize(bytes: number): string;
}

/** The full message catalogue. */
export interface RteLocalization {
  /** BCP-47 tag of this catalogue, e.g. `'en'`. */
  locale: string;
  /** Writing direction of this locale. */
  dir: 'ltr' | 'rtl';
  /** The field itself: its default name, its placeholder and its empty announcement. */
  editor: { label: LocalizedString; placeholder: LocalizedString; empty: LocalizedString };
  /** Every toolbar control, used as both the tooltip and the accessible name. */
  toolbar: {
    label: LocalizedString;
    more: LocalizedString;
    bold: LocalizedString;
    italic: LocalizedString;
    underline: LocalizedString;
    strike: LocalizedString;
    code: LocalizedString;
    subscript: LocalizedString;
    superscript: LocalizedString;
    color: LocalizedString;
    backgroundColor: LocalizedString;
    clearFormatting: LocalizedString;
    fontFamily: LocalizedString;
    fontSize: LocalizedString;
    heading: LocalizedString;
    /** "Heading {level}" */
    headingLevel: LocalizedString;
    paragraph: LocalizedString;
    blockType: LocalizedString;
    alignLeft: LocalizedString;
    alignCenter: LocalizedString;
    alignRight: LocalizedString;
    alignJustify: LocalizedString;
    align: LocalizedString;
    indent: LocalizedString;
    outdent: LocalizedString;
    bulletList: LocalizedString;
    orderedList: LocalizedString;
    checkList: LocalizedString;
    blockquote: LocalizedString;
    codeBlock: LocalizedString;
    link: LocalizedString;
    unlink: LocalizedString;
    image: LocalizedString;
    table: LocalizedString;
    horizontalRule: LocalizedString;
    emoji: LocalizedString;
    mergeTag: LocalizedString;
    mention: LocalizedString;
    undo: LocalizedString;
    redo: LocalizedString;
    findReplace: LocalizedString;
    sourceView: LocalizedString;
    fullscreen: LocalizedString;
    exitFullscreen: LocalizedString;
    print: LocalizedString;
    wordCount: LocalizedString;
  };
  /** The colour picker. */
  color: {
    title: LocalizedString;
    custom: LocalizedString;
    apply: LocalizedString;
    reset: LocalizedString;
    automatic: LocalizedString;
    recent: LocalizedString;
    /** "Color {color}" */
    swatch: LocalizedString;
  };
  /** The link popover. */
  link: {
    title: LocalizedString;
    url: LocalizedString;
    text: LocalizedString;
    newTab: LocalizedString;
    apply: LocalizedString;
    remove: LocalizedString;
    open: LocalizedString;
    invalidUrl: LocalizedString;
  };
  /** The image dialog, the upload placeholder and the image controls. */
  image: {
    title: LocalizedString;
    url: LocalizedString;
    /** Confirms the insert dialog. */
    insert: LocalizedString;
    invalidUrl: LocalizedString;
    upload: LocalizedString;
    alt: LocalizedString;
    /** Marks an image decorative, which is what an empty alt means. */
    decorative: LocalizedString;
    width: LocalizedString;
    resize: LocalizedString;
    caption: LocalizedString;
    replace: LocalizedString;
    remove: LocalizedString;
    uploading: LocalizedString;
    uploadFailed: LocalizedString;
    retry: LocalizedString;
    cancel: LocalizedString;
    /** "Max {size}" */
    tooLarge: LocalizedString;
    wrongType: LocalizedString;
    alignLeft: LocalizedString;
    alignCenter: LocalizedString;
    alignRight: LocalizedString;
  };
  /** The table picker and the table controls. */
  table: {
    insert: LocalizedString;
    rows: LocalizedString;
    columns: LocalizedString;
    /** "{rows} x {columns}" */
    size: LocalizedString;
    addRowBefore: LocalizedString;
    addRowAfter: LocalizedString;
    addColumnBefore: LocalizedString;
    addColumnAfter: LocalizedString;
    deleteRow: LocalizedString;
    deleteColumn: LocalizedString;
    deleteTable: LocalizedString;
    headerRow: LocalizedString;
  };
  /** The merge-tag menu and its validation messages. */
  mergeTag: {
    title: LocalizedString;
    search: LocalizedString;
    noResults: LocalizedString;
    /** "Unknown tag {key}" */
    unknown: LocalizedString;
    preview: LocalizedString;
  };
  /** The mention menu, including its loading and empty states. */
  mention: { search: LocalizedString; noResults: LocalizedString; loading: LocalizedString };
  /** The slash-command palette. */
  slash: { title: LocalizedString; search: LocalizedString; noResults: LocalizedString };
  /** The emoji picker. */
  emoji: { title: LocalizedString; search: LocalizedString; noResults: LocalizedString };
  /** The find-and-replace panel. */
  find: {
    title: LocalizedString;
    find: LocalizedString;
    replace: LocalizedString;
    replaceAll: LocalizedString;
    matchCase: LocalizedString;
    wholeWord: LocalizedString;
    regex: LocalizedString;
    next: LocalizedString;
    previous: LocalizedString;
    close: LocalizedString;
    /** "{index} of {total}" */
    results: LocalizedString;
    noResults: LocalizedString;
  };
  /** The character and word counter. */
  counter: {
    /** "{count} characters" */
    characters: LocalizedString;
    /** "{count} words" */
    words: LocalizedString;
    /** "{count} / {max}" */
    limit: LocalizedString;
    overLimit: LocalizedString;
  };
  /** The built-in validation messages. */
  validation: { required: LocalizedString; maxLength: LocalizedString; invalidHtml: LocalizedString };
  /** The prompt offering to restore an autosaved draft. */
  draft: {
    restoreTitle: LocalizedString;
    /** "saved {time}" */
    restoreBody: LocalizedString;
    restore: LocalizedString;
    discard: LocalizedString;
  };
  /** The keyboard reference dialog. */
  shortcuts: { title: LocalizedString; close: LocalizedString };
  /** The prompt shown after a rich office paste. */
  paste: { keepFormatting: LocalizedString; removeFormatting: LocalizedString };
  /** The HTML source view. */
  sourceView: { title: LocalizedString; apply: LocalizedString; cancel: LocalizedString; invalid: LocalizedString };
  /** Everything sent to the editor's polite live region. */
  announce: {
    formatApplied: LocalizedString;
    formatRemoved: LocalizedString;
    linkInserted: LocalizedString;
    linkRemoved: LocalizedString;
    imageInserted: LocalizedString;
    /** "List level {level}" */
    listLevel: LocalizedString;
    overLimit: LocalizedString;
    draftRestored: LocalizedString;
    /** "{count} results" */
    findResults: LocalizedString;
  };
  /** Keys contributed by plugins live here, flat and dot-separated. */
  custom: Record<string, LocalizedString>;
}
