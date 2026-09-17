import { config } from './manifest';

/**
 * The badge vocabulary (PPDS §7.1), and the only component that renders one.
 *
 * Exactly six labels, no synonyms. A badge's state comes from a nav node's `plan` or
 * `lifecycle` and from nowhere else, so the sidebar, the page heading and any feature
 * list cannot disagree about it (P7). A page that wants a badge declares it in nav data.
 *
 * At 1.0.0 nothing carries one: every capability shipped in the same release, so nothing
 * is `New` relative to anything, and a single free tier means no tier gate. The
 * machinery is here and idle, which is the correct state for an initial release.
 *
 * @module
 */

/** The five lifecycle labels. The sixth badge is the tier name, from the config. */
const LIFECYCLE: Record<string, string> = {
  new: 'New',
  preview: 'Preview',
  beta: 'Beta',
  planned: 'Planned',
  deprecated: 'Deprecated',
};

/** Props for {@link Badge}. */
export interface BadgeProps {
  /** Tier id, matching an entry in `plugin.config.json#/tiers`. */
  plan?: string | null;
  /** One of the five lifecycle values. */
  lifecycle?: string | null;
}

export function Badge({ plan, lifecycle }: BadgeProps) {
  const tier = plan ? config.tiers.find((entry) => entry.id === plan) : undefined;
  const tierLabel = tier?.badge ?? null;
  const lifecycleLabel = lifecycle ? LIFECYCLE[lifecycle] : undefined;

  if (!tierLabel && !lifecycleLabel) return null;

  return (
    <span className="badges">
      {tierLabel ? <span className="badge badge--plan">{tierLabel}</span> : null}
      {lifecycleLabel ? (
        <span className="badge" data-lifecycle={lifecycle}>
          {lifecycleLabel}
        </span>
      ) : null}
    </span>
  );
}
