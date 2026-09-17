import type { EditorDocument } from './document.js';

/** Shared helper types. @group Types */

/** Cancels a registration made through `on`, `registerCommand`, `registerNode`, … */
export type Unregister = () => void;

/** Recursively optional. Used for theme and localization overrides. */
export type DeepPartial<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends readonly (infer U)[]
    ? readonly DeepPartial<U>[]
    : T extends object
      ? { [K in keyof T]?: DeepPartial<T[K]> }
      : T;

/** A value that can vary by breakpoint. Breakpoints match the demo site's scale. */
export type ResponsiveValue<T> = T | { base?: T; sm?: T; md?: T; lg?: T; xl?: T };

/** Where a change came from. Lets controlled consumers avoid feedback loops (R21). */
export type ChangeSource = 'user' | 'api' | 'paste' | 'drop' | 'history' | 'init';

/** Unit used by `getLength`, `maxLength` and the counter. */
export type CountUnit = 'characters' | 'words';

/** The wire format of `value` / `defaultValue` / `onChange`. */
export type ValueFormat = 'html' | 'json' | 'markdown' | 'text';

/** A value in the currently configured {@link ValueFormat}. */
export type EditorValue = string | EditorDocument;

/** Output HTML dialect. */
export type HtmlProfile = 'standard' | 'quill-compatible' | 'email' | 'minimal';

/** A generic middleware: run before/around the default behaviour, or cancel it. */
export type Middleware<Ctx> = (
  ctx: Ctx,
  next: (override?: Partial<Ctx>) => void | Promise<void>,
) => void | Promise<void>;

/** Something dropped or downgraded while parsing content. */
export interface ContentWarning {
  /** Machine-readable reason. */
  code:
    | 'unknown-tag'
    | 'unknown-attribute'
    | 'disallowed-protocol'
    | 'disallowed-style'
    | 'feature-disabled'
    | 'schema-violation'
    | 'truncated';
  /** Human-readable, English, development aid only — never shown to end users. */
  message: string;
  /** The element the warning concerns, when it concerns one. */
  tag?: string;
  /** The attribute the warning concerns, when it concerns one. */
  attribute?: string;
}
