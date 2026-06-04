import type { TFunction } from "i18next";

import type { AppNotification } from "@/domain/notification";

/**
 * Resolve a notification's display title/body in the current language.
 *
 * The backend stores i18next keys (`titleKey`/`bodyKey`) plus interpolation
 * `params`, with the English `title`/`body` as a fallback for old rows or any
 * non-keyed path. We render the key through `t()` when present, otherwise fall
 * back to the stored text. `count` is always supplied (from `aggregateCount`)
 * so pluralized keys like the new-message body resolve correctly.
 */
export function localizeNotification(
  n: AppNotification,
  t: TFunction,
): { title: string; body: string | null } {
  const params = { ...(n.params ?? {}), count: n.aggregateCount };
  const title = n.titleKey ? t(n.titleKey, params) : n.title;
  const body = n.bodyKey ? t(n.bodyKey, params) : n.body;
  return { title, body };
}
