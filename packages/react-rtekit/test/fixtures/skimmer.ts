/**
 * The Skimmer constants the parity page and the migration guide depend on (01 §2).
 *
 * Values are reproduced exactly, including the order of the colour swatches, because
 * the `classic` preset's parity guarantee is asserted against them.
 */

/** The 21 predefined colours, rendered 7 per row at 24px (01 §2). */
export const RTE_PREDEFINED_COLORS = [
  '#000000',
  '#FF0000',
  '#00FF00',
  '#0000FF',
  '#FFFF00',
  '#FF00FF',
  '#00FFFF',
  '#800000',
  '#008000',
  '#000080',
  '#808000',
  '#800080',
  '#008080',
  '#C0C0C0',
  '#808080',
  '#FFA500',
  '#FFC0CB',
  '#A52A2A',
  '#00CED1',
  '#FFD700',
  '#DDA0DD',
] as const;

/** The old character budget, applied to the HTML string — which is bug R3. */
export const MESSAGE_MAX_LENGTH = 2048;

/** The merge tags the backend substitutes (01 §2). */
export const SKIMMER_MERGE_TAGS = [
  { key: 'contact_first_name', label: 'Contact first name', sample: 'Jane' },
  { key: 'next_test_date', label: 'Next test date', sample: 'May 3' },
  { key: 'report_date', label: 'Report date', sample: 'Apr 26' },
  { key: 'org_name', label: 'Company name', sample: 'Blue Pools' },
  { key: 'org_address', label: 'Company address', sample: '1 Main St' },
] as const;

/** The toolbar layout of the old editor, in order (01 §5). */
export const CLASSIC_TOOLBAR = [
  ['bold', 'italic', 'underline'],
  ['color'],
  ['alignLeft', 'alignCenter', 'alignRight', 'bulletList'],
] as const;
