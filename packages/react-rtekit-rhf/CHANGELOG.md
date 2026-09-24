# react-rtekit-rhf

## 1.0.0

The first public release.

`<RteField>` and `useRteField`: `react-rtekit` bound to react-hook-form, with the three
things a hand-rolled binding usually gets wrong done for you.

- **`required` means required.** It is validated against `isEmpty()`, so the
  `<p><br></p>` an empty editor contains — a truthy string — does not pass.
- **One write per change,** with validation, and a form reset reaches the editor.
- **The error is wired up:** `error`, `aria-invalid` and `aria-describedby` follow the
  field state.

Peers: `react-rtekit` ^1.0.0, `react-hook-form` 7.45 or later, and React 18.2 or later.
The entry carries `'use client'`, so it can be imported from a React Server Component
tree.
