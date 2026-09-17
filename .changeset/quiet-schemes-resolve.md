---
'react-rtekit': minor
---

`colorScheme` now does what its type says.

`'auto'` is documented as following `prefers-color-scheme` and nothing implemented it, so
an editor embedded in a dark page kept its light palette. Since `.rte-view` paints no
background of its own, that put near-black text directly onto the host's dark background.

The `dark` preset now applies three ways — asked for on the editor, inherited from an
ancestor that declares `data-color-scheme`, or from the system when nothing above it has —
and covers popovers, which portal out of the editor's subtree, as well as the `classic`
preset.

Two changes to how a theme reaches the element:

- `.rte-root` paints `--rte-color-surface`. It already took its `color` from the theme, so
  the label, footer, counter and helper were previously drawn on whatever the host had
  behind them. Set `--rte-color-surface: transparent` for the old behaviour, and then the
  contrast of the theme's text on your own background is yours to pick.
- `preset="classic"` no longer writes its implied theme as inline custom properties. They
  outranked every stylesheet, which is what made a classic editor unreachable by any colour
  scheme; the same values arrive through `data-theme="classic"` and `presets/classic.css`.
  A `theme` you pass explicitly is still inlined and still wins outright.
