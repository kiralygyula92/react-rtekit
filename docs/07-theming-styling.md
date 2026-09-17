# 07: Theming and Styling

## 1. Principles

- **Plain CSS + custom properties**, no CSS-in-JS runtime, inside cascade layers so consumer CSS wins without `!important`:
  ```css
  @layer rtekit.base, rtekit.content, rtekit.theme;
  ```
  `rtekit.base` = structure (layout, contenteditable resets, popover positioning, visually-hidden). `rtekit.content` = prose styles for `.rte-content` (also shipped standalone as `content.css`). `rtekit.theme` = visual rules that only read `--rte-*` tokens.
- **Tokens are the API.** No literal colours or sizes in theme CSS.
- **State via data attributes:** `[data-active]`, `[data-disabled]`, `[data-readonly]`, `[data-focused]`, `[data-empty]`, `[data-invalid]`, `[data-over-limit]`, `[data-fullscreen]`, `[data-source-view]`, `[data-dragging]`, `[data-selected]` (images, merge tags).
- **Stable class names** with the `rte-` prefix, documented as public API.
- **Content styles are separable.** Anything that renders stored HTML (`<RteContentView>`, an e-mail preview, a list page) imports `content.css` only, so what you see equals what you authored.

## 2. Applying a theme

```tsx
// A) CSS only
import 'react-rtekit/styles.css';
import 'react-rtekit/presets/classic.css';
<RichTextEditor data-theme="classic" />

// B) JS tokens (inline CSS variables on .rte-root)
import { classicTheme, createTheme } from 'react-rtekit';
<RichTextEditor theme={classicTheme} />
<RichTextEditor theme={createTheme(classicTheme, { color: { accent: '#7C3AED' } })} />

// C) App-wide
<RteThemeProvider theme={classicTheme} colorScheme="auto">…</RteThemeProvider>
```

`createTheme(base, ...overrides)` deep-merges; `theme.toCssVars()` returns a plain record for SSR or static use.

## 3. Token catalogue (`RteTheme` → CSS variable)

| Group | Theme key | CSS variable | `light` default |
|---|---|---|---|
| **Typography (chrome)** | `font.family` | `--rte-font-family` | `inherit` |
| | `font.size` | `--rte-font-size` | `14px` |
| | `font.sizeSm` | `--rte-font-size-sm` | `12px` |
| | `font.lineHeight` | `--rte-line-height` | `1.5` |
| **Surfaces** | `color.surface` | `--rte-color-surface` | `#FFFFFF` |
| | `color.surfaceMuted` | `--rte-color-surface-muted` | `#FAFAFA` (toolbar bg option) |
| | `color.surfaceRaised` | `--rte-color-surface-raised` | `#FFFFFF` (popovers) |
| **Text** | `color.text` | `--rte-color-text` | `#212121` |
| | `color.textMuted` | `--rte-color-text-muted` | `#717680` |
| | `color.textDisabled` | `--rte-color-text-disabled` | `#A4A7AE` |
| | `color.placeholder` | `--rte-color-placeholder` | `#A4A7AE` |
| **Lines** | `color.border` | `--rte-color-border` | `#D5D7DA` |
| | `color.borderSubtle` | `--rte-color-border-subtle` | `#E9EAEB` |
| **Accent / status** | `color.accent` | `--rte-color-accent` | `#2196F3` |
| | `color.accentSoft` | `--rte-color-accent-soft` | `#369AE91A` |
| | `color.accentBorder` | `--rte-color-accent-border` | `#2196F380` |
| | `color.danger` | `--rte-color-danger` | `#F04438` |
| | `color.success` | `--rte-color-success` | `#17B26A` |
| **Editor box** | `editor.minHeight` | `--rte-min-height` | `287px` |
| | `editor.maxHeight` | `--rte-max-height` | `none` |
| | `editor.padding` | `--rte-content-padding` | `12px` |
| | `editor.radius` | `--rte-radius` | `4px` |
| | `editor.borderWidth` | `--rte-border-width` | `1px` |
| | `editor.borderColor` | `--rte-border-color` | `var(--rte-color-border)` |
| | `editor.focusRing` | `--rte-focus-ring` | `0 0 0 1px var(--rte-color-accent)` (inset, no layout shift) |
| | `editor.invalidBorderColor` | `--rte-invalid-border-color` | `var(--rte-color-danger)` |
| | `editor.background` | `--rte-editor-bg` | `var(--rte-color-surface)` |
| | `editor.disabledBackground` | `--rte-disabled-bg` | `#FAFAFA` |
| **Toolbar** | `toolbar.background` | `--rte-toolbar-bg` | `transparent` |
| | `toolbar.border` | `--rte-toolbar-border` | `none` |
| | `toolbar.padding` | `--rte-toolbar-padding` | `0` |
| | `toolbar.gap` | `--rte-toolbar-gap` | `0px` |
| | `toolbar.marginBottom` | `--rte-toolbar-margin-bottom` | `8px` |
| | `toolbar.separatorColor` | `--rte-toolbar-separator` | `var(--rte-color-border-subtle)` |
| | `toolbar.separatorMargin` | `--rte-toolbar-separator-margin` | `4px` |
| **Toolbar buttons** | `button.size` | `--rte-button-size` | `40px` |
| | `button.padding` | `--rte-button-padding` | `8px` |
| | `button.radius` | `--rte-button-radius` | `4px` |
| | `button.iconSize` | `--rte-icon-size` | `24px` |
| | `button.color` | `--rte-button-color` | `#A4A7AE` (inactive) |
| | `button.activeColor` | `--rte-button-active-color` | `var(--rte-color-text)` |
| | `button.activeBg` | `--rte-button-active-bg` | `transparent` (classic) |
| | `button.hoverBg` | `--rte-button-hover-bg` | `rgba(0,0,0,.04)` |
| | `button.disabledColor` | `--rte-button-disabled-color` | `var(--rte-color-text-disabled)` |
| **Popover / menu** | `popover.bg` / `border` / `radius` / `shadow` / `padding` | `--rte-popover-*` | `#FFF` / `1px solid var(--rte-color-border)` / `4px` / `0 4px 12px rgb(0 0 0/.12)` / `16px` |
| | `menu.itemHeight` / `itemHoverBg` / `itemActiveBg` | `--rte-menu-*` | `32px` / `rgba(0,0,0,.04)` / `var(--rte-color-accent-soft)` |
| **Colour picker** | `colorPicker.swatchSize` / `gap` / `radius` / `borderColor` / `selectedRing` | `--rte-swatch-*` | `24px` / `4px` / `4px` / `var(--rte-color-border)` / `0 0 0 2px var(--rte-color-accent)` |
| **Counter / helper** | `footer.gap` / `helper.color` / `counter.color` / `counter.warnColor` / `counter.overColor` | `--rte-footer-*`, `--rte-counter-*` | `8px` / muted / muted / `#FF9800` / `var(--rte-color-danger)` |
| **Merge tag chip** | `mergeTag.bg` / `color` / `border` / `radius` / `padding` / `selectedBg` | `--rte-mergetag-*` | `#EAF6FF` / `#175CD3` / `1px solid #B2DDFF` / `4px` / `1px 4px` / `#B2DDFF` |
| **Mention chip** | `mention.bg` / `color` | `--rte-mention-*` | `#F3E8FF` / `#6941C6` |
| **Selection / decorations** | `selection.bg` | `--rte-selection-bg` | `Highlight` fallback `#B2DDFF` |
| | `findMatch.bg` / `findActive.bg` | `--rte-find-*` | `#FFF3A3` / `#FFC0CB` |
| **Content (prose)** | `content.fontFamily` / `fontSize` / `lineHeight` / `color` | `--rte-content-*` | inherit / `14px` / `1.5` / `var(--rte-color-text)` |
| | `content.paragraphSpacing` | `--rte-paragraph-spacing` | `0` (classic: Quill has no paragraph margins) |
| | `content.headingScale` | `--rte-h1..h6-size` | `2em, 1.5em, 1.17em, 1em, .83em, .67em` |
| | `content.listIndent` | `--rte-list-indent` | `1.5em` |
| | `content.listItemPadding` | `--rte-list-item-padding` | `.5em` |
| | `content.indentStep` | `--rte-indent-step` | `2em` |
| | `content.linkColor` / `linkDecoration` | `--rte-link-*` | `var(--rte-color-accent)` / `underline` |
| | `content.quoteBorder` / `quotePadding` | `--rte-quote-*` | `3px solid var(--rte-color-border)` / `12px` |
| | `content.codeBg` / `codeColor` / `codeFont` | `--rte-code-*` | `#F5F5F5` / `#B91C1C` / `ui-monospace, monospace` |
| | `content.tableBorder` / `tableHeaderBg` / `cellPadding` | `--rte-table-*` | `1px solid var(--rte-color-border-subtle)` / `#FAFAFA` / `6px 8px` |
| **Motion** | `motion.duration` / `easing` | `--rte-motion-*` | `150ms` / `cubic-bezier(.2,0,0,1)` |
| **Z-index** | `z.popover` / `z.fullscreen` | `--rte-z-*` | `1300` / `1400` |
| **Density** | `density` | `--rte-density-scale` | `standard` = 1; `compact` = .85; `comfortable` = 1.15 (scales button size, paddings, min-height) |

## 4. `classic` preset: 1:1 Skimmer parity

```ts
export const classicTheme = createTheme(lightTheme, {
  name: 'classic',
  font: { family: '"Open Sans Variable", "Open Sans", Arial, sans-serif', size: '14px', lineHeight: '1.5' },
  color: { text: '#212121', border: '#D5D7DA', borderSubtle: '#E9EAEB',
           accent: '#2196F3', danger: '#F04438' },
  editor: { minHeight: '287px', padding: '12px', radius: '4px', borderWidth: '1px',
            focusRing: 'inset 0 0 0 2px #2196F3',       // visually equals the old 2px border, no layout shift (R10)
            invalidBorderColor: '#F04438' },
  toolbar: { background: 'transparent', border: 'none', padding: '0', gap: '0px',
             marginBottom: '8px', separatorMargin: '4px' },
  button: { size: '40px', padding: '8px', iconSize: '24px',
            color: '#A4A7AE', activeColor: '#212121', activeBg: 'transparent',
            hoverBg: 'rgba(0,0,0,.04)' },
  popover: { bg: '#FFFFFF', border: '1px solid #D5D7DA', radius: '4px', padding: '16px' },
  colorPicker: { swatchSize: '24px', gap: '4px', radius: '4px', borderColor: '#D5D7DA' },
  content: { fontSize: '14px', lineHeight: '1.5', paragraphSpacing: '0',
             listIndent: '1.5em', listItemPadding: '.5em', indentStep: '3em' }, // 3em matches Quill's ql-indent
  defaults: {
    preset: 'classic',
    minHeight: 287,
    toolbar: [['bold','italic','underline'], ['color'], ['alignLeft','alignCenter','alignRight','bulletList']],
    colors: { palette: CLASSIC_21_COLORS, allowCustom: true, allowClear: true, columns: 7 },
    htmlProfile: 'quill-compatible',
    sanitize: 'standard',
    placeholder: '',
    showCounter: false,
  },
});
```

`CLASSIC_21_COLORS` is the exact list from 01 §2 in the same order, rendered 7 per row at 24px with 4px gaps.

Parity checklist (visual tests, 09 §3):

| Element | Required rendering |
|---|---|
| Toolbar | Bold, Italic, Underline · separator · Colour · separator · AlignLeft, AlignCenter, AlignRight, BulletList; 40×40 buttons, 24px Material-style glyphs, 8px gap to the editor |
| Inactive/active icon | `#A4A7AE` / inherited text colour; the colour button's glyph is tinted with the active colour |
| Editor box | 4px radius, 1px `#D5D7DA` border, `min-height: 287px`, `padding: 12px` |
| Focused | A 2px accent ring with no content shift (the old implementation shifted by 1px) |
| Error | 1px `#F04438` border plus the helper text below in the danger colour |
| Content | 14px Open Sans, line-height 1.5, no paragraph margins, lists indented `1.5em` with `.5em` item padding |
| Colour popover | Anchored below-left, 4px radius, white, 1px border, 16px padding, 100–200px wide; a "Custom color" input, 21 swatches, Apply and Reset text buttons |
| Empty state | Placeholder (new; the old one showed nothing) |

Deliberate deviations (documented on the parity page): the focus ring replaces the 1px→2px border swap; Reset clears the colour instead of forcing `#000000`; swatches are focusable buttons; the toolbar is a real ARIA toolbar; undo/redo exist in the `standard` preset but are **not** added to `classic`'s toolbar.

## 5. Other presets

| Preset | Description |
|---|---|
| `light` | The default. Subtle toolbar background, hover states, placeholder, counter, paragraph spacing `.5em` |
| `dark` | Surface `#0F1115`, raised `#161A20`, text `#E6E8EB`, muted `#9AA1AC`, border `#262B33`, accent `#4DA3FF`, code bg `#161A20`, merge tag `#13263B`/`#8FC6FF`. AA-verified |
| `compact` | Density `compact`: 32px buttons, 20px icons, 8px padding, min-height 160px |
| `bordered` | Toolbar shares the editor's border in one bounding box (a common modern look), sticky toolbar by default |

`colorScheme: 'auto'` swaps light/dark via `prefers-color-scheme`, and sets `data-color-scheme` on the root.

## 6. Structural CSS essentials

```css
@layer rtekit.base {
  .rte-root { position: relative; display: flex; flex-direction: column; }
  .rte-content { outline: none; min-height: var(--rte-min-height); max-height: var(--rte-max-height);
                 overflow-y: auto; padding: var(--rte-content-padding); white-space: pre-wrap;
                 word-break: break-word; -webkit-user-modify: read-write-plaintext-only: false; }
  .rte-content-wrapper { position: relative; border-radius: var(--rte-radius);
                         border: var(--rte-border-width) solid var(--rte-border-color); }
  .rte-root[data-focused] .rte-content-wrapper { box-shadow: var(--rte-focus-ring); }
  .rte-root[data-invalid] .rte-content-wrapper { border-color: var(--rte-invalid-border-color); }
  .rte-placeholder { position: absolute; inset-block-start: var(--rte-content-padding);
                     inset-inline-start: var(--rte-content-padding); pointer-events: none;
                     color: var(--rte-color-placeholder); }
  .rte-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: var(--rte-toolbar-gap); }
  .rte-visually-hidden { position: absolute; width: 1px; height: 1px; clip-path: inset(50%); overflow: hidden; }
  @media (prefers-reduced-motion: reduce) { .rte-root * { transition: none !important; animation: none !important; } }
}
@layer rtekit.content {
  .rte-content p { margin: 0 0 var(--rte-paragraph-spacing); }
  .rte-content ul, .rte-content ol { padding-inline-start: var(--rte-list-indent); margin: 0; }
  .rte-content li { padding-inline-start: var(--rte-list-item-padding); }
  .rte-content [style*="text-align"], .rte-content .rte-align-center { /* alignment without !important */ }
  .rte-content a { color: var(--rte-link-color); text-decoration: var(--rte-link-decoration); }
  /* headings, blockquote, code, table, hr, images, merge tags … all token-driven */
}
```

Note the absence of `!important` (the old implementation needed it because Quill's stylesheet fought the overrides) and the use of logical properties so RTL works for free.

## 7. Unstyled mode

`unstyled` or importing only `base.css` + `content.css` leaves structure and prose styling but no chrome visuals, so Tailwind or a design system can own the look through `classNames`. A full Tailwind skin is in the demo (`/examples/tailwind-skin`).

## 8. Theme editor

The demo site (`08 §5`) ships a live token editor with an AA contrast checker that exports `createTheme(...)` or a CSS-variable block. Every visual property of the editor must be reachable from it; that is the acceptance test for token coverage.
