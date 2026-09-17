/**
 * The adapter's budget.
 *
 * `react-rtekit` and `react-hook-form` are peers a consumer of this package already
 * has, so what is measured is the adapter itself: the field binding, the empty check
 * and the error wiring, and nothing else. It is deliberately small — the argument for
 * a separate package is that the core has no form-library dependency (fixes R13).
 */
export default [
  {
    name: 'react-rtekit-rhf',
    path: 'dist/index.js',
    limit: '3 kB',
    gzip: true,
    ignore: ['react', 'react-dom', 'react-hook-form', 'react-rtekit'],
  },
];
