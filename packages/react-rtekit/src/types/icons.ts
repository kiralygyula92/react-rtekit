import type { ReactNode } from 'react';
import type { ToolbarItemName } from './toolbar.js';

/**
 * Replaceable icons.
 *
 * Defaults are in-house 24px inline SVGs drawn with `currentColor`, sized from
 * `--rte-icon-size`, so no icon package is ever pulled into a consumer's bundle.
 *
 * @group Customization
 */
export type RteIcons = Partial<Record<Exclude<ToolbarItemName, '|'>, ReactNode>> & {
  chevronDown?: ReactNode;
  chevronRight?: ReactNode;
  close?: ReactNode;
  check?: ReactNode;
  search?: ReactNode;
  spinner?: ReactNode;
  dragHandle?: ReactNode;
  external?: ReactNode;
  more?: ReactNode;
  alert?: ReactNode;
};

/** Every icon key, used by the docs site's icon gallery. */
export type IconName = keyof RteIcons;
